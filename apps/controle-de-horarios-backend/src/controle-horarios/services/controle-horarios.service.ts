import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ControleHorario } from '../entities/controle-horario.entity';
import { FiltrosControleHorarioDto } from '../dto/filtros-controle-horario.dto';
import { UpdateControleHorarioDto } from '../dto/update-controle-horario.dto';
import { SingleControleHorarioUpdateDto } from '../dto/update-multiple-controle-horarios.dto';
import { OracleService } from '../../database/oracle/services/oracle.service';
import { createHash } from 'crypto';

@Injectable()
export class ControleHorariosService {
  private readonly logger = new Logger(ControleHorariosService.name);

  constructor(
    @InjectRepository(ControleHorario)
    private readonly controleHorarioRepository: Repository<ControleHorario>,
    private readonly oracleService: OracleService,
  ) {}

  async updateMultipleControleHorarios(
    updates: SingleControleHorarioUpdateDto[],
    editorNome: string,
    editorEmail: string,
  ): Promise<ControleHorario[]> {
    this.logger.log(`🔄 Iniciando atualização de múltiplos controles de horário com ${updates.length} DTO(s).`);
    const updatedRecords: ControleHorario[] = [];
    const processedIds = new Set<string>();

    for (const updateDto of updates) {
      const { id, ...fieldsToUpdate } = updateDto;

      // 1. Verificação de processamento duplicado
      if (processedIds.has(id)) {
        this.logger.log(`⏭️ Pulando ID ${id} pois já foi processado neste lote.`);
        continue;
      }

      // 2. Verificação de campos para atualização
      if (Object.keys(fieldsToUpdate).length === 0) {
        this.logger.warn(`⚠️ Nenhuma alteração solicitada para o ID ${id}. Pulando.`);
        continue;
      }

      const originalControleHorario = await this.controleHorarioRepository.findOne({ where: { id } });

      if (!originalControleHorario) {
        this.logger.warn(`⚠️ Controle de Horário com ID ${id} não encontrado.`);
        continue;
      }

      // 3. Guarda de segurança para propagação
      const isPropagationSafe = originalControleHorario.cod_servico_numero && originalControleHorario.cracha_motorista;
      if (!isPropagationSafe) {
        this.logger.log(`🚫 Propagação não aplicável para o ID ${id}: serviço ou crachá do motorista ausente. Atualizando apenas este registro.`);
        Object.assign(originalControleHorario, fieldsToUpdate, {
          editado_por_nome: editorNome,
          editado_por_email: editorEmail,
          updated_at: new Date(),
        });
        updatedRecords.push(originalControleHorario);
        processedIds.add(id);
        continue;
      }

      // --- Lógica de Propagação Controlada ---
      this.logger.log(`[PROPAGAÇÃO INICIADA POR ID: ${id}]`);
      this.logger.log(`Campos a serem propagados: ${Object.keys(fieldsToUpdate).join(', ')}`);

      const queryBuilder = this.controleHorarioRepository.createQueryBuilder('controle');

      // Critérios estritos de correspondência
      queryBuilder.where('controle.data_referencia = :dataReferencia', { dataReferencia: originalControleHorario.data_referencia });
      queryBuilder.andWhere('controle.cod_servico_numero = :codServicoNumero', { codServicoNumero: originalControleHorario.cod_servico_numero });
      queryBuilder.andWhere('controle.cracha_motorista = :crachaMotorista', { crachaMotorista: originalControleHorario.cracha_motorista });

      // Propagação afeta apenas viagens futuras ou a atual
      if (originalControleHorario.hor_saida) {
        queryBuilder.andWhere('controle.hor_saida >= :anchorHora', { anchorHora: originalControleHorario.hor_saida });
      }

      const relatedHorarios = await queryBuilder.getMany();

      this.logger.log(`[PROPAGAÇÃO ID: ${id}] Encontrados ${relatedHorarios.length} registros para aplicar alterações (Serviço: ${originalControleHorario.cod_servico_numero}, Motorista: ${originalControleHorario.cracha_motorista}).`);

      for (const relatedHorario of relatedHorarios) {
        if (processedIds.has(relatedHorario.id)) continue;

        this.logger.log(`  -> Aplicando alterações no ID: ${relatedHorario.id}`);
        Object.assign(relatedHorario, fieldsToUpdate, {
          editado_por_nome: editorNome,
          editado_por_email: editorEmail,
          updated_at: new Date(),
        });
        
        updatedRecords.push(relatedHorario);
        processedIds.add(relatedHorario.id);
      }
      this.logger.log(`[PROPAGAÇÃO FINALIZADA PARA ID: ${id}]`);
    }

    if (updatedRecords.length > 0) {
      const uniqueRecords = Array.from(new Map(updatedRecords.map((r) => [r.id, r])).values());
      
      this.logger.log(`Salvando ${uniqueRecords.length} registros únicos no banco de dados.`);
      await this.controleHorarioRepository.manager.transaction(async (transactionalEntityManager) => {
        await transactionalEntityManager.save(ControleHorario, uniqueRecords);
      });

      this.logger.log(`✅ ${uniqueRecords.length} registros atualizados com sucesso.`);
    } else {
      this.logger.log('ℹ️ Nenhuma alteração foi realizada no final do processo.');
    }

    return Array.from(new Map(updatedRecords.map((r) => [r.id, r])).values());
  }

  async buscarControleHorariosPorData(
    dataReferencia: string,
    filtros?: FiltrosControleHorarioDto,
  ): Promise<ControleHorario[]> {
    this.logger.log(`🔍 Buscando controle de horários para ${dataReferencia}`);

    const queryBuilder = this.controleHorarioRepository
      .createQueryBuilder('controle')
      .where('controle.data_referencia = :dataReferencia', { dataReferencia })
      .andWhere('controle.is_ativo = :isAtivo', { isAtivo: true });

    // ✅ APLICAR FILTROS
    if (filtros?.setores?.length > 0) {
      queryBuilder.andWhere('controle.cod_local_terminal_sec IN (:...setores)', {
        setores: filtros.setores,
      });
    }

    // Filtro de Linha (Múltipla Seleção)
    if (filtros?.codigo_linha && filtros.codigo_linha.length > 0) {
      queryBuilder.andWhere('controle.codigo_linha IN (:...codigo_linha)', {
        codigo_linha: filtros.codigo_linha,
      });
    }

    if (filtros?.nome_linha) {
      queryBuilder.andWhere('controle.nome_linha ILIKE :nome_linha', {
        nome_linha: `%${filtros.nome_linha}%`,
      });
    }

    if (filtros?.sentido) {
      queryBuilder.andWhere('controle.flg_sentido = :sentido', {
        sentido: filtros.sentido,
      });
    }

    if (filtros?.setor_principal_linha) {
      queryBuilder.andWhere('controle.setor_principal_linha = :setor_principal_linha', {
        setor_principal_linha: filtros.setor_principal_linha,
      });
    }

    if (filtros?.local_origem_viagem) {
      queryBuilder.andWhere('controle.local_origem_viagem ILIKE :local_origem_viagem', {
        local_origem_viagem: `%${filtros.local_origem_viagem}%`,
      });
    }

    if (filtros?.cod_servico_numero) {
      queryBuilder.andWhere('controle.cod_servico_numero ILIKE :cod_servico_numero', {
        cod_servico_numero: `%${filtros.cod_servico_numero}%`,
      });
    }

    if (filtros?.nome_motorista) {
      queryBuilder.andWhere('controle.nome_motorista ILIKE :nome_motorista', {
        nome_motorista: `%${filtros.nome_motorista}%`,
      });
    }

    if (filtros?.nome_cobrador) {
      queryBuilder.andWhere('controle.nome_cobrador ILIKE :nome_cobrador', {
        nome_cobrador: `%${filtros.nome_cobrador}%`,
      });
    }

    if (filtros?.cod_atividade) {
      queryBuilder.andWhere('controle.cod_atividade = :cod_atividade', {
        cod_atividade: filtros.cod_atividade,
      });
    }

    if (filtros?.nome_atividade) {
      queryBuilder.andWhere('controle.nome_atividade ILIKE :nome_atividade', {
        nome_atividade: `%${filtros.nome_atividade}%`,
      });
    }

    if (filtros?.desc_tipodia) {
      queryBuilder.andWhere('controle.desc_tipodia = :desc_tipodia', {
        desc_tipodia: filtros.desc_tipodia,
      });
    }

    // Novos filtros
    if (filtros?.prefixo_veiculo) {
      queryBuilder.andWhere('controle.prefixo_veiculo ILIKE :prefixo_veiculo', {
        prefixo_veiculo: `%${filtros.prefixo_veiculo}%`,
      });
    }

    if (filtros?.motorista_substituto_nome) {
      queryBuilder.andWhere('controle.motorista_substituto_nome ILIKE :motorista_substituto_nome', {
        motorista_substituto_nome: `%${filtros.motorista_substituto_nome}%`,
      });
    }

    if (filtros?.motorista_substituto_cracha) {
      queryBuilder.andWhere('controle.motorista_substituto_cracha ILIKE :motorista_substituto_cracha', {
        motorista_substituto_cracha: `%${filtros.motorista_substituto_cracha}%`,
      });
    }

    if (filtros?.cobrador_substituto_nome) {
      queryBuilder.andWhere('controle.cobrador_substituto_nome ILIKE :cobrador_substituto_nome', {
        cobrador_substituto_nome: `%${filtros.cobrador_substituto_nome}%`,
      });
    }

    if (filtros?.cobrador_substituto_cracha) {
      queryBuilder.andWhere('controle.cobrador_substituto_cracha ILIKE :cobrador_substituto_cracha', {
        cobrador_substituto_cracha: `%${filtros.cobrador_substituto_cracha}%`,
      });
    }

    // Filtro por Crachá (Motorista ou Cobrador)
    if (filtros?.cracha_funcionario) {
      queryBuilder.andWhere(
        '(controle.cracha_motorista = :cracha_funcionario OR controle.cracha_cobrador = :cracha_funcionario)',
        { cracha_funcionario: filtros.cracha_funcionario },
      );
    }

    // Filtro de Viagens Editadas
    if (filtros?.apenas_editadas) {
      queryBuilder.andWhere('controle.editado_por_nome IS NOT NULL');
    }

    // Novos Filtros Implementados
    // Mapear sentido_texto para flg_sentido
    if (filtros?.sentido_texto) {
      let flgSentido: string;
      switch (filtros.sentido_texto.toUpperCase()) {
        case 'IDA':
          flgSentido = 'I';
          break;
        case 'VOLTA':
          flgSentido = 'V';
          break;
        case 'CIRCULAR':
          flgSentido = 'C';
          break;
        default:
          flgSentido = '';
      }
      if (flgSentido) {
        queryBuilder.andWhere('controle.flg_sentido = :flgSentido', { flgSentido });
      }
    }

    // Filtrar por horário de início
    if (filtros?.horarioInicio) {
      queryBuilder.andWhere('TO_CHAR(controle.hor_saida, \'HH24:MI\') >= :horarioInicio', { horarioInicio: filtros.horarioInicio });
    }

    // Filtrar por horário de fim
    if (filtros?.horarioFim) {
      queryBuilder.andWhere('TO_CHAR(controle.hor_chegada, \'HH24:MI\') <= :horarioFim', { horarioFim: filtros.horarioFim });
    }

    // Busca geral em múltiplos campos
    if (filtros?.buscaTexto) {
      queryBuilder.andWhere(
        '(controle.nome_linha ILIKE :buscaTexto OR ' +
        'controle.nome_motorista ILIKE :buscaTexto OR ' +
        'controle.nome_cobrador ILIKE :buscaTexto OR ' +
        'controle.prefixo_veiculo ILIKE :buscaTexto OR ' +
        'controle.cod_servico_numero ILIKE :buscaTexto)',
        { buscaTexto: `%${filtros.buscaTexto}%` },
      );
    }

    // Filtrar por email do editor
    if (filtros?.editado_por_usuario_email) {
      queryBuilder.andWhere('controle.editado_por_email = :editado_por_usuario_email', { editado_por_usuario_email: filtros.editado_por_usuario_email });
    }

    // Filtrar por código do cobrador
    if (filtros?.cod_cobrador) {
      queryBuilder.andWhere('controle.cod_cobrador = :cod_cobrador', { cod_cobrador: filtros.cod_cobrador });
    }

    // ✅ PAGINAÇÃO
    if (filtros?.limite) {
      queryBuilder.limit(filtros.limite);
    }

    if (filtros?.pagina && filtros?.limite) {
      queryBuilder.offset((filtros.pagina - 1) * filtros.limite);
    }

    // ✅ ORDENAÇÃO
    if (filtros?.ordenar_por && filtros?.ordem) {
      let orderByColumn = filtros.ordenar_por;
      // Mapear propriedades da entidade para nomes de coluna do banco de dados, se necessário
      if (orderByColumn.toLowerCase() === 'desc_tipodia') {
        orderByColumn = 'desc_tipodia';
      } else if (orderByColumn === 'codigo_linha') {
        orderByColumn = 'codigo_linha';
      } else if (orderByColumn === 'nome_motorista') {
        orderByColumn = 'nome_motorista';
      }
      queryBuilder.orderBy(`controle.${orderByColumn}`, filtros.ordem);
    } else {
      queryBuilder
        .orderBy('controle.setor_principal_linha', 'ASC')
        .addOrderBy('controle.codigo_linha', 'ASC')
        .addOrderBy('controle.hor_saida', 'ASC');
    }

    const horarios = await queryBuilder.getMany();

    this.logger.log(`✅ Encontrados ${horarios.length} registros no PostgreSQL`);
    return horarios;
  }

  async sincronizarControleHorariosPorData(dataReferencia: string): Promise<{
    sincronizadas: number;
    novas: number;
    atualizadas: number;
    erros: number;
    desativadas: number;
  }> {
    this.logger.log(`🔄 Sincronizando controle de horários para ${dataReferencia}`);

    try {
      if (!this.oracleService.isEnabled()) {
        this.logger.warn('⚠️ Oracle está desabilitado');
        return { sincronizadas: 0, novas: 0, atualizadas: 0, erros: 1, desativadas: 0 };
      }

      // Deleta os registros existentes para a data de referência
      this.logger.log(`🗑️ Deletando registros existentes para a data ${dataReferencia}`);
      await this.controleHorarioRepository.delete({ data_referencia: dataReferencia });

      const sqlQuery = `
        SELECT
            CASE
                WHEN L.COD_LOCAL_TERMINAL_SEC = 7000 THEN 'GAMA'
                WHEN L.COD_LOCAL_TERMINAL_SEC = 6000 THEN 'SANTA MARIA'
                WHEN L.COD_LOCAL_TERMINAL_SEC = 8000 THEN 'PARANOÁ'
                WHEN L.COD_LOCAL_TERMINAL_SEC = 9000 THEN 'SÃO SEBASTIÃO'
            END AS SETOR_PRINCIPAL_LINHA,
            L.COD_LOCAL_TERMINAL_SEC,
            L.CODIGOLINHA,
            L.NOMELINHA,
            L.DESTINOLINHA AS COD_DESTINO_LINHA,
            NLD.DESC_LOCALIDADE AS LOCAL_DESTINO_LINHA,
            H.FLG_SENTIDO,
            TO_CHAR(D.DAT_ESCALA, 'YYYY-MM-DD') AS DATA_VIAGEM,
            CASE TO_CHAR(D.DAT_ESCALA, 'DY', 'NLS_DATE_LANGUAGE=PORTUGUESE')
                WHEN 'DOM' THEN 'DOMINGO'
                WHEN 'SÁB' THEN 'SABADO'
                ELSE 'DIAS UTEIS'
            END AS DESC_TIPODIA,
            H.HOR_SAIDA,
            H.HOR_CHEGADA,
            H.COD_LOCALIDADE AS COD_ORIGEM_VIAGEM,
            LCO.DESC_LOCALIDADE AS LOCAL_ORIGEM_VIAGEM,
            S.COD_SERVDIARIA AS COD_SERVICO_COMPLETO,
            REGEXP_SUBSTR(S.COD_SERVDIARIA, '[[:digit:]]+') AS COD_SERVICO_NUMERO,
            H.COD_ATIVIDADE,
            CASE H.COD_ATIVIDADE
                WHEN 2 THEN 'REGULAR'
                WHEN 3 THEN 'ESPECIAL'
                WHEN 4 THEN 'RENDIÇÃO'
                WHEN 5 THEN 'RECOLHIMENTO'
                WHEN 10 THEN 'RESERVA'
                ELSE 'OUTROS'
            END AS NOME_ATIVIDADE,
            CASE H.COD_ATIVIDADE
                WHEN 2 THEN 'R'
                ELSE 'S'
            END AS FLG_TIPO,
            S.COD_MOTORISTA,
            FM.NOMECOMPLETOFUNC AS NOME_MOTORISTA,
            FM.CODFUNC AS CRACHA_MOTORISTA,
            FM.CHAPAFUNC AS CHAPAFUNC_MOTORISTA,
            S.COD_COBRADOR,
            FC.NOMECOMPLETOFUNC AS NOME_COBRADOR,
            FC.CODFUNC AS CRACHA_COBRADOR,
            FC.CHAPAFUNC AS CHAPAFUNC_COBRADOR,
            COUNT(H.HOR_SAIDA) OVER (
                PARTITION BY L.COD_LOCAL_TERMINAL_SEC, L.CODIGOLINHA
            ) AS TOTAL_HORARIOS
        FROM
            T_ESC_ESCALADIARIA D
            JOIN T_ESC_SERVICODIARIA S ON D.DAT_ESCALA = S.DAT_ESCALA AND D.COD_INTESCALA = S.COD_INTEScala
            JOIN T_ESC_HORARIODIARIA H ON D.DAT_ESCALA = H.DAT_ESCALA AND D.COD_INTESCALA = H.COD_INTESCALA
                AND S.COD_SERVDIARIA = H.COD_INTSERVDIARIA
                AND H.COD_INTTURNO = S.COD_INTTURNO
            JOIN BGM_CADLINHAS L ON DECODE(H.CODINTLINHA, NULL, D.COD_INTLINHA, H.CODINTLINHA) = L.CODINTLINHA
            LEFT JOIN T_ESC_LOCALIDADE LCO ON H.COD_LOCALIDADE = LCO.COD_LOCALIDADE
            LEFT JOIN T_ESC_LOCALIDADE NLD ON L.DESTINOLINHA = NLD.COD_LOCALIDADE
            LEFT JOIN FLP_FUNCIONARIOS FM ON S.COD_MOTORISTA = FM.CODINTFUNC
            LEFT JOIN FLP_FUNCIONARIOS FC ON S.COD_COBRADOR = FC.CODINTFUNC
        WHERE
            H.COD_ATIVIDADE IN (2, 3, 4, 5, 10)
            AND L.CODIGOEMPRESA = 4
            AND UPPER(L.NOMELINHA) NOT LIKE '%DESPACHANTES%'
            AND UPPER(L.NOMELINHA) NOT LIKE '%LINHA ESPECIAL%'
            AND UPPER(L.NOMELINHA) NOT LIKE '%DUPLAS RESERVAS%'
            AND L.COD_LOCAL_TERMINAL_SEC IN (6000, 7000, 8000, 9000)
            AND TRUNC(D.DAT_ESCALA) = TO_DATE('${dataReferencia}', 'YYYY-MM-DD')
        ORDER BY
            SETOR_PRINCIPAL_LINHA,
            L.CODIGOLINHA,
            H.FLG_SENTIDO,
            H.HOR_SAIDA
      `;

      const dadosOracle = await this.oracleService.executeHeavyQuery(sqlQuery);

      this.logger.log(`📊 Oracle Globus retornou ${dadosOracle.length} registros para controle de horários`);

      if (dadosOracle.length === 0) {
        this.logger.warn(`⚠️ Nenhum dado encontrado no Oracle para ${dataReferencia}`);
        return { sincronizadas: 0, novas: 0, atualizadas: 0, erros: 0, desativadas: 0 };
      }

      let novas = 0;
      let erros = 0;

      const BATCH_SIZE = 100;
      for (let i = 0; i < dadosOracle.length; i += BATCH_SIZE) {
        const lote = dadosOracle.slice(i, i + BATCH_SIZE);
        const loteProcessado = lote.map(item => this.processarDadosOracle(item, dataReferencia));
        
        try {
          await this.controleHorarioRepository.save(loteProcessado);
          novas += lote.length;
        } catch (error: any) {
          this.logger.error(`❌ Erro ao salvar lote: ${error.message}`);
          erros += lote.length;
        }

        if (i % (BATCH_SIZE * 10) === 0) {
          this.logger.log(`📊 Processados ${i + BATCH_SIZE}/${dadosOracle.length} registros...`);
        }
      }

      const sincronizadas = novas;

      this.logger.log(`✅ Sincronização de controle de horários concluída: ${sincronizadas} total (${novas} novas, 0 atualizadas, 0 desativadas, ${erros} erros)`);

      return { sincronizadas, novas, atualizadas: 0, erros, desativadas: 0 };

    } catch (error: any) {
      this.logger.error(`❌ Erro na sincronização de controle de horários: ${error.message}`);
      throw error;
    }
  }

  private processarDadosOracle(item: any, dataReferencia: string): Partial<ControleHorario> {
    const horSaida = this.processarHorarioOracle(item.HOR_SAIDA);
    const horChegada = this.processarHorarioOracle(item.HOR_CHEGADA);

    const sentidoTexto = this.determinarSentidoTexto(item.FLG_SENTIDO);
    const periodoDoDia = this.determinarPeriodoDoDia(horSaida);

    const controle = new ControleHorario();

    controle.setor_principal_linha = item.SETOR_PRINCIPAL_LINHA || null;
    controle.cod_local_terminal_sec = item.COD_LOCAL_TERMINAL_SEC || null;
    controle.codigo_linha = item.CODIGOLINHA || null;
    controle.nome_linha = item.NOMELINHA || null;
    controle.cod_destino_linha = item.COD_DESTINO_LINHA || null;
    controle.local_destino_linha = item.LOCAL_DESTINO_LINHA || null;
    controle.flg_sentido = item.FLG_SENTIDO || null;
    controle.data_viagem = item.DATA_VIAGEM ? new Date(item.DATA_VIAGEM) : null;
    controle.desc_tipodia = item.DESC_TIPODIA || null;
    controle.hor_saida = horSaida;
    controle.hor_chegada = horChegada;
    controle.cod_origem_viagem = item.COD_ORIGEM_VIAGEM || null;
    controle.local_origem_viagem = item.LOCAL_ORIGEM_VIAGEM || null;
    controle.cod_servico_completo = item.COD_SERVICO_COMPLETO || null;
    controle.cod_servico_numero = item.COD_SERVICO_NUMERO || null;
    controle.cod_atividade = item.COD_ATIVIDADE || null;
    controle.nome_atividade = item.NOME_ATIVIDADE || null;
    controle.flg_tipo = item.FLG_TIPO || null;
    controle.cod_motorista = item.COD_MOTORISTA || null;
    controle.nome_motorista = item.NOME_MOTORISTA || null;
    controle.cracha_motorista = item.CRACHA_MOTORISTA || null;
    controle.chapa_func_motorista = item.CHAPAFUNC_MOTORISTA || null;
    controle.cod_cobrador = item.COD_COBRADOR || null;
    controle.nome_cobrador = item.NOME_COBRADOR || null;
    controle.cracha_cobrador = item.CRACHA_COBRADOR || null;
    controle.chapa_func_cobrador = item.CHAPAFUNC_COBRADOR || null;
    controle.total_horarios = item.TOTAL_HORARIOS || null;

    // Novos campos - inicialmente nulos ou vazios, pois vêm da edição do frontend
    controle.placaVeiculo = null;
    controle.prefixo_veiculo = null;
    controle.garagemVeiculo = null;
    controle.motorista_substituto_nome = null;
    controle.motorista_substituto_cracha = null;
    controle.cobrador_substituto_nome = null;
    controle.cobrador_substituto_cracha = null;
    controle.observacoes_edicao = null;
    controle.editado_por_nome = null;
    controle.editado_por_email = null;

    controle.data_referencia = dataReferencia;
    controle.sentido_texto = sentidoTexto;
    controle.periodo_do_dia = periodoDoDia;
    controle.tem_cobrador = !!(item.COD_COBRADOR && item.NOME_COBRADOR);
    controle.origem_dados = 'ORACLE_GLOBUS';
    controle.is_ativo = true;

    controle.hash_dados = controle.gerarHashDados();

    return controle;
  }

  private processarHorarioOracle(horarioOracle: any): Date | null {
    if (!horarioOracle) return null;

    try {
      const data = new Date(horarioOracle);
      const hoje = new Date();
      const novaData = new Date(
        hoje.getFullYear(),
        hoje.getMonth(),
        hoje.getDate(),
        data.getHours(),
        data.getMinutes(),
        data.getSeconds(),
      );
      return novaData;
    } catch (error) {
      return null;
    }
  }

  private determinarSentidoTexto(flgSentido: string): string {
    switch (flgSentido?.toUpperCase()) {
      case 'I':
        return 'IDA';
      case 'V':
        return 'VOLTA';
      case 'C':
        return 'CIRCULAR';
      default:
        return 'NÃO INFORMADO';
    }
  }

  private determinarPeriodoDoDia(horario: Date | null): string {
    if (!horario) return 'NÃO INFORMADO';

    const hora = horario.getHours();

    if (hora >= 5 && hora < 12) return 'MANHÃ';
    if (hora >= 12 && hora < 18) return 'TARDE';
    if (hora >= 18 && hora < 24) return 'NOITE';
    return 'MADRUGADA';
  }

  async obterStatusDados(dataReferencia: string): Promise<{
    existeNoBanco: boolean;
    totalRegistros: number;
    ultimaAtualizacao: Date | null;
    setoresDisponiveis: string[];
    linhasDisponiveis: number;
    atividadesDisponiveis: string[];
    tiposDiaDisponiveis: string[];
  }> {
    const totalRegistros = await this.controleHorarioRepository.count({
      where: { data_referencia: dataReferencia, is_ativo: true },
    });

    const ultimaAtualizacao = totalRegistros > 0
      ? (await this.controleHorarioRepository.findOne({
          where: { data_referencia: dataReferencia, is_ativo: true },
          order: { updated_at: 'DESC' },
          select: ['updated_at'],
        }))?.updated_at || null
      : null;

    const setoresDisponiveis = await this.controleHorarioRepository
      .createQueryBuilder('controle')
      .select('DISTINCT controle.setor_principal_linha', 'setor')
      .where('controle.data_referencia = :dataReferencia', { dataReferencia })
      .andWhere('controle.is_ativo = :isAtivo', { isAtivo: true })
      .andWhere('controle.setor_principal_linha IS NOT NULL')
      .getRawMany()
      .then((result) => result.map((r) => r.setor));

    const linhasDisponiveis = await this.controleHorarioRepository
      .createQueryBuilder('controle')
      .select('COUNT(DISTINCT controle.codigo_linha)', 'count')
      .where('controle.data_referencia = :dataReferencia', { dataReferencia })
      .andWhere('controle.is_ativo = :isAtivo', { isAtivo: true })
      .getRawOne()
      .then((result) => parseInt(result?.count || '0'));

    const atividadesDisponiveis = await this.controleHorarioRepository
      .createQueryBuilder('controle')
      .select('DISTINCT controle.nome_atividade', 'atividade')
      .where('controle.data_referencia = :dataReferencia', { dataReferencia })
      .andWhere('controle.is_ativo = :isAtivo', { isAtivo: true })
      .andWhere('controle.nome_atividade IS NOT NULL')
      .getRawMany()
      .then((result) => result.map((r) => r.atividade));

    const tiposDiaDisponiveis = await this.controleHorarioRepository
      .createQueryBuilder('controle')
      .select('DISTINCT controle.desc_tipodia', 'descTipodia')
      .where('controle.data_referencia = :dataReferencia', { dataReferencia })
      .andWhere('controle.is_ativo = :isAtivo', { isAtivo: true })
      .andWhere('controle.desc_tipodia IS NOT NULL')
      .getRawMany()
      .then((result) => result.map((r) => r.descTipodia));

    return {
      existeNoBanco: totalRegistros > 0,
      totalRegistros,
      ultimaAtualizacao,
      setoresDisponiveis,
      linhasDisponiveis,
      atividadesDisponiveis,
      tiposDiaDisponiveis,
    };
  }

  async obterCodigosLinha(dataReferencia: string): Promise<string[]> {
    const result = await this.controleHorarioRepository
      .createQueryBuilder('controle')
      .select('DISTINCT controle.codigo_linha', 'codigoLinha')
      .where('controle.data_referencia = :dataReferencia', { dataReferencia })
      .andWhere('controle.is_ativo = :isAtivo', { isAtivo: true })
      .andWhere('controle.codigo_linha IS NOT NULL')
      .orderBy('controle.codigo_linha', 'ASC')
      .getRawMany();

    return result.map((r) => r.codigoLinha);
  }

  async obterServicosUnicos(dataReferencia: string): Promise<string[]> {
    const result = await this.controleHorarioRepository
      .createQueryBuilder('controle')
      .select('DISTINCT controle.cod_servico_numero', 'servico')
      .where('controle.data_referencia = :dataReferencia', { dataReferencia })
      .andWhere('controle.is_ativo = :isAtivo', { isAtivo: true })
      .andWhere('controle.cod_servico_numero IS NOT NULL')
      .orderBy('servico', 'ASC')
      .getRawMany();

    return result.map((r) => r.servico);
  }

  async obterSetoresUnicos(dataReferencia: string): Promise<string[]> {
    const result = await this.controleHorarioRepository
      .createQueryBuilder('controle')
      .select('DISTINCT controle.setor_principal_linha', 'setor')
      .where('controle.data_referencia = :dataReferencia', { dataReferencia })
      .andWhere('controle.is_ativo = :isAtivo', { isAtivo: true })
      .andWhere('controle.setor_principal_linha IS NOT NULL')
      .orderBy('setor', 'ASC')
      .getRawMany();

    return result.map((r) => r.setor);
  }

  async obterAtividadesUnicas(dataReferencia: string): Promise<string[]> {
    const result = await this.controleHorarioRepository
      .createQueryBuilder('controle')
      .select('DISTINCT controle.nome_atividade', 'atividade')
      .where('controle.data_referencia = :dataReferencia', { dataReferencia })
      .andWhere('controle.is_ativo = :isAtivo', { isAtivo: true })
      .andWhere('controle.nome_atividade IS NOT NULL')
      .orderBy('atividade', 'ASC')
      .getRawMany();

    return result.map((r) => r.atividade);
  }

  async obterTiposDiaUnicos(dataReferencia: string): Promise<string[]> {
    const result = await this.controleHorarioRepository
      .createQueryBuilder('controle')
      .select('controle.desc_tipodia')
      .where('controle.data_referencia = :dataReferencia', { dataReferencia })
      .andWhere('controle.is_ativo = :isAtivo', { isAtivo: true })
      .andWhere('controle.desc_tipodia IS NOT NULL')
      .orderBy('controle.desc_tipodia', 'ASC')
      .getRawMany();

    return [...new Set(result.map((r) => r.controle_desc_tipodia))];
  }

  async testarConexaoOracle(): Promise<{
    success: boolean;
    message: string;
    connectionInfo?: any;
  }> {
    try {
      const isConnected = await this.oracleService.testConnection();

      if (isConnected) {
        const connectionInfo = await this.oracleService.getConnectionInfo();

        return {
          success: true,
          message: 'Conexão Oracle Globus funcionando',
          connectionInfo,
        };
      } else {
        return {
          success: false,
          message: 'Falha na conexão Oracle Globus',
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Erro ao testar conexão Oracle Globus: ${error.message}`,
      };
    }
  }

  async obterEstatisticasOracle(dataReferencia: string): Promise<any> {
    try {
      const statsQuery = `
        SELECT
          COUNT(*) as TOTAL_REGISTROS_HOJE,
          COUNT(DISTINCT L.CODIGOLINHA) as TOTAL_LINHAS,
          COUNT(DISTINCT L.COD_LOCAL_TERMINAL_SEC) as TOTAL_SETORES,
          COUNT(DISTINCT S.COD_MOTORISTA) as TOTAL_MOTORISTAS,
          MIN(H.HOR_SAIDA) as PRIMEIRO_HORARIO,
          MAX(H.HOR_CHEGADA) as ULTIMO_HORARIO
        FROM T_ESC_ESCALADIARIA D
        JOIN T_ESC_SERVICODIARIA S ON D.DAT_ESCALA = S.DAT_ESCALA AND D.COD_INTESCALA = S.COD_INTESCALA
        JOIN T_ESC_HORARIODIARIA H ON D.DAT_ESCALA = H.DAT_ESCALA AND D.COD_INTESCALA = H.COD_INTESCALA
        JOIN BGM_CADLINHAS L ON DECODE(H.CODINTLINHA, NULL, D.COD_INTLINHA, H.CODINTLINHA) = L.CODINTLINHA
        WHERE H.COD_ATIVIDADE IN (2, 3, 4, 5, 10)
          AND L.CODIGOEMPRESA = 4
          AND UPPER(L.NOMELINHA) NOT LIKE '%DESPACHANTES%'
          AND UPPER(L.NOMELINHA) NOT LIKE '%LINHA ESPECIAL%'
          AND UPPER(L.NOMELINHA) NOT LIKE '%DUPLAS RESERVAS%'
          AND L.COD_LOCAL_TERMINAL_SEC IN (6000, 7000, 8000, 9000)
          AND TRUNC(D.DAT_ESCALA) = TO_DATE('${dataReferencia}', 'YYYY-MM-DD')
        ORDER BY
            SETOR_PRINCIPAL_LINHA,
            L.CODIGOLINHA,
            H.FLG_SENTIDO,
            H.HOR_SAIDA
      `;

      const stats = await this.oracleService.executeQuery(statsQuery);
      return {
        success: true,
        data: stats[0] || {},
        source: 'ORACLE_GLOBUS',
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Erro ao obter estatísticas Oracle: ${error.message}`,
      };
    }
  }

  async updateControleHorario(
    id: string,
    updateDto: UpdateControleHorarioDto,
    editorNome: string,
    editorEmail: string,
  ): Promise<ControleHorario> {
    this.logger.log(`✏️ Atualizando controle de horário com ID: ${id}`);

    const controleHorario = await this.controleHorarioRepository.findOne({ where: { id } });

    if (!controleHorario) {
      throw new Error(`Controle de Horário com ID ${id} não encontrado.`);
    }

    const camposPropagaveis = [
      'prefixo_veiculo',
      'motorista_substituto_nome',
      'motorista_substituto_cracha',
      'cobrador_substituto_nome',
      'cobrador_substituto_cracha',
    ];

    const devePropagar = camposPropagaveis.some(key => key in updateDto);

    if (devePropagar) {
      this.logger.log(`✔️ Detecção de campos propagáveis. Acionando a lógica de atualização múltipla para o ID: ${id}`);
      
      const updateForward: SingleControleHorarioUpdateDto = { id, ...updateDto };
      
      const atualizados = await this.updateMultipleControleHorarios([updateForward], editorNome, editorEmail);
      
      const registroAtualizado = atualizados.find((r) => r.id === id);
      
      if (registroAtualizado) {
        return registroAtualizado;
      }
      
      this.logger.warn(`⚠️ O registro com ID ${id} não foi encontrado no resultado da propagação. Retornando o estado original.`);
      return controleHorario; // Retorna o original se algo der errado na propagação
    } else {
      this.logger.log(`🖊️ Nenhuma alteração propagável detectada. Atualizando apenas o registro com ID: ${id}`);
      
      Object.assign(controleHorario, updateDto, {
        editado_por_nome: editorNome,
        editado_por_email: editorEmail,
        updated_at: new Date(),
      });

      return this.controleHorarioRepository.save(controleHorario);
    }
  }
}
