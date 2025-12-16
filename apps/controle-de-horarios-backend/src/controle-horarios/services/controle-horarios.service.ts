import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ControleHorario } from '../entities/controle-horario.entity';
import { ControleHorarioChange } from '../entities/controle-horario-change.entity';
import { FiltrosControleHorarioDto } from '../dto/filtros-controle-horario.dto';
import { UpdateControleHorarioDto } from '../dto/update-controle-horario.dto';
import { SingleControleHorarioUpdateDto } from '../dto/update-multiple-controle-horarios.dto';
import { OracleService } from '../../database/oracle/services/oracle.service';
import { NotificacoesService } from './notificacoes.service';
import { createHash } from 'crypto';

@Injectable()
export class ControleHorariosService {
  private readonly logger = new Logger(ControleHorariosService.name);

  constructor(
    @InjectRepository(ControleHorario)
    private readonly controleHorarioRepository: Repository<ControleHorario>,
    @InjectRepository(ControleHorarioChange)
    private readonly controleHorarioChangeRepository: Repository<ControleHorarioChange>,
    private readonly oracleService: OracleService,
    private readonly configService: ConfigService,
    // Serviço de notificações por SSE
    private readonly notificacoesService?: NotificacoesService,
  ) { }

  // Executa diariamente às 19:00 (horário do servidor) a sincronização do dia seguinte
  @Cron('0 19 * * *', { timeZone: 'America/Sao_Paulo' })
  async agendarSincronizacaoDiaSeguinte(): Promise<void> {
    try {
      const enabled = this.configService.get<string>('ENABLE_AUTO_SYNC');
      if (enabled && enabled !== 'true') {
        this.logger.log('⏱️ Auto-sync desabilitado por configuração (ENABLE_AUTO_SYNC!=true).');
        return;
      }

      // Calcula a data de amanhã (YYYY-MM-DD) em horário local
      const hoje = new Date();
      const amanha = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 1);
      const yyyy = amanha.getFullYear();
      const mm = String(amanha.getMonth() + 1).padStart(2, '0');
      const dd = String(amanha.getDate()).padStart(2, '0');
      const dataReferencia = `${yyyy}-${mm}-${dd}`;

      this.logger.log(`⏱️ Iniciando sincronização automática das 19h para ${dataReferencia}`);
      const inicio = Date.now();
      const resultado = await this.sincronizarControleHorariosPorData(dataReferencia);
      const duracao = Date.now() - inicio;

      this.logger.log(
        `✅ Auto-sync concluído para ${dataReferencia}: ${resultado.sincronizadas} sincronizadas (novas=${resultado.novas}, atualizadas=${resultado.atualizadas}, desativadas=${resultado.desativadas}, erros=${resultado.erros}) em ${duracao}ms`,
      );
    } catch (error: any) {
      this.logger.error(`❌ Falha no auto-sync diário às 19h: ${error.message}`);
    }
  }

  async updateMultipleControleHorarios(
    updates: SingleControleHorarioUpdateDto[],
    editorNome: string,
    editorEmail: string,
  ): Promise<ControleHorario[]> {
    this.logger.log(`🔄 Iniciando atualização de múltiplos controles de horário com ${updates.length} DTO(s).`);
    const updatedRecords: ControleHorario[] = [];
    const normalizedEditorEmail = (editorEmail || '').toString().trim().toLowerCase();

    const parseHoraAjustada = (baseDate: Date | null | undefined, val?: string): Date | null => {
      if (!val) return null;
      const isHHMM = /^\\d{1,2}:\\d{2}(?::\\d{2})?$/.test(val);
      try {
        if (isHHMM) {
          const [h, m, s] = val.split(':').map((n) => parseInt(n, 10));
          const base = baseDate ? new Date(baseDate) : new Date();
          base.setHours(h || 0, m || 0, (s || 0), 0);
          return base;
        }
        const d = new Date(val);
        return isNaN(d.getTime()) ? null : d;
      } catch {
        return null;
      }
    };

    const processedIds = new Set<string>();
    const originalsById = new Map<string, Partial<ControleHorario>>();

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

      // map adjusted times and agreement if present in payload
      if (typeof (fieldsToUpdate as any).hor_saida_ajustada === 'string') {
        (fieldsToUpdate as any).hor_saida_ajustada = parseHoraAjustada(originalControleHorario.hor_saida, (fieldsToUpdate as any).hor_saida_ajustada) || undefined;
      }
      if (typeof (fieldsToUpdate as any).hor_chegada_ajustada === 'string') {
        (fieldsToUpdate as any).hor_chegada_ajustada = parseHoraAjustada(originalControleHorario.hor_chegada, (fieldsToUpdate as any).hor_chegada_ajustada) || undefined;
      }
      if (typeof (fieldsToUpdate as any).de_acordo === 'boolean') {
        (fieldsToUpdate as any).de_acordo_em = (fieldsToUpdate as any).de_acordo ? new Date() : null;
      }

      if (!isPropagationSafe) {
        this.logger.log(`🚫 Propagação não aplicável para o ID ${id}: serviço ou crachá do motorista ausente. Atualizando apenas este registro.`);
        if (!originalsById.has(originalControleHorario.id)) {
          originalsById.set(originalControleHorario.id, { ...originalControleHorario });
        }
        Object.assign(originalControleHorario, fieldsToUpdate, {
          editado_por_nome: editorNome,
          editado_por_email: normalizedEditorEmail,
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
      // snapshot before change for all related
      for (const rh of relatedHorarios) {
        if (!originalsById.has(rh.id)) {
          originalsById.set(rh.id, { ...rh });
        }
      }

      this.logger.log(`[PROPAGAÇÃO ID: ${id}] Encontrados ${relatedHorarios.length} registros para aplicar alterações (Serviço: ${originalControleHorario.cod_servico_numero}, Motorista: ${originalControleHorario.cracha_motorista}).`);

      for (const relatedHorario of relatedHorarios) {
        if (processedIds.has(relatedHorario.id)) continue;

        this.logger.log(`  -> Aplicando alterações no ID: ${relatedHorario.id}`);
        Object.assign(relatedHorario, fieldsToUpdate, {
          editado_por_nome: editorNome,
          editado_por_email: normalizedEditorEmail,
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

        // Audit changes per field
        const changeRows: ControleHorarioChange[] = [];
        for (const rec of uniqueRecords) {
          const before = originalsById.get(rec.id);
          if (!before) continue;
          const changedFields = this.diffFields(before, rec);
          for (const { campo, beforeVal, afterVal } of changedFields) {
            const change = new ControleHorarioChange();
            change.controle_horario_id = rec.id;
            change.campo = campo;
            change.valor_anterior = beforeVal;
            change.valor_novo = afterVal;
            change.alterado_por_nome = editorNome || null;
            change.alterado_por_email = normalizedEditorEmail || null;
            change.data_referencia = (rec as any).data_referencia || null;
            changeRows.push(change);
          }
        }
        if (changeRows.length) {
          await transactionalEntityManager.save(ControleHorarioChange, changeRows);
        }
      });

      this.logger.log(`✅ ${uniqueRecords.length} registros atualizados com sucesso.`);
    } else {
      this.logger.log('ℹ️ Nenhuma alteração foi realizada no final do processo.');
    }

    try {
      if (this.notificacoesService && updatedRecords.length > 0) {
        const unique = Array.from(new Map(updatedRecords.map((r) => [r.id, r])).values());
        for (const rec of unique) {
          const before = originalsById.get(rec.id) as Partial<ControleHorario> | undefined;
          this.notificacoesService.emitirConfirmacao(rec as any, before);
        }
      }
    } catch {}

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

    if (filtros?.incluir_historico) {
      queryBuilder.leftJoinAndSelect('controle.historico', 'historico');
    }

    // Prioridade: quando visualizar escala por crachá do motorista, ignorar demais filtros de escopo
    const isEscala = Boolean(filtros?.cracha_funcionario && String(filtros.cracha_funcionario).trim());

    // ✅ APLICAR FILTROS
    if (!isEscala && filtros?.setores?.length > 0) {
      queryBuilder.andWhere('controle.cod_local_terminal_sec IN (:...setores)', {
        setores: filtros.setores,
      });
    }

    // Filtro de Linha (Múltipla Seleção)
    if (!isEscala && filtros?.codigo_linha && filtros.codigo_linha.length > 0) {
      queryBuilder.andWhere('controle.codigo_linha IN (:...codigo_linha)', {
        codigo_linha: filtros.codigo_linha,
      });
    }

    if (!isEscala && filtros?.nome_linha) {
      queryBuilder.andWhere('controle.nome_linha ILIKE :nome_linha', {
        nome_linha: `%${filtros.nome_linha}%`,
      });
    }

    if (!isEscala && filtros?.setor_principal_linha) {
      queryBuilder.andWhere('controle.setor_principal_linha = :setor_principal_linha', {
        setor_principal_linha: filtros.setor_principal_linha,
      });
    }

    if (!isEscala && filtros?.local_origem_viagem && filtros.local_origem_viagem.length > 0) {
      // Filtra por múltiplas localidades (OR)
      queryBuilder.andWhere('controle.local_origem_viagem IN (:...local_origem_viagem)', {
        local_origem_viagem: filtros.local_origem_viagem,
      });
    }

    if (!isEscala && filtros?.cod_servico_numero) {
      queryBuilder.andWhere('controle.cod_servico_numero ILIKE :cod_servico_numero', {
        cod_servico_numero: `%${filtros.cod_servico_numero}%`,
      });
    }

    if (!isEscala && filtros?.nome_motorista) {
      queryBuilder.andWhere('controle.nome_motorista ILIKE :nome_motorista', {
        nome_motorista: `%${filtros.nome_motorista}%`,
      });
    }

    if (!isEscala && filtros?.nome_cobrador) {
      queryBuilder.andWhere('controle.nome_cobrador ILIKE :nome_cobrador', {
        nome_cobrador: `%${filtros.nome_cobrador}%`,
      });
    }

    if (!isEscala && filtros?.periodo_do_dia) {
      queryBuilder.andWhere('controle.periodo_do_dia = :periodo_do_dia', {
        periodo_do_dia: filtros.periodo_do_dia,
      });
    }

    if (!isEscala && filtros?.cod_atividade) {
      const codAtividade = Number(filtros.cod_atividade);
      // Fallbacks: em alguns cenários, certas atividades não possuem código persistido,
      // apenas o nome. Para estes casos, aceitar nome_atividade como alternativa.
      // 1: SAÍDA DE GARAGEM → nome_atividade ILIKE '%GARAGEM%'
      // 24: DESLOCAMENTO DE VEÍCULO → nome_atividade ILIKE '%DESLOCAMENTO%'
      if (codAtividade === 1) {
        queryBuilder.andWhere(
          '(controle.cod_atividade = :cod_atividade OR controle.nome_atividade ILIKE :nomeAtividadeFallback)',
          { cod_atividade: codAtividade, nomeAtividadeFallback: '%GARAGEM%' },
        );
      } else if (codAtividade === 24) {
        queryBuilder.andWhere(
          '(controle.cod_atividade = :cod_atividade OR controle.nome_atividade ILIKE :nomeAtividadeFallback)',
          { cod_atividade: codAtividade, nomeAtividadeFallback: '%DESLOCAMENTO%' },
        );
      } else {
        queryBuilder.andWhere('controle.cod_atividade = :cod_atividade', {
          cod_atividade: codAtividade,
        });
      }
    }

    if (!isEscala && filtros?.nome_atividade) {
      const codAtividadeAtual =
        typeof (filtros as any).cod_atividade !== 'undefined'
          ? Number((filtros as any).cod_atividade)
          : undefined;
      if (codAtividadeAtual !== 1 && codAtividadeAtual !== 24) {
        queryBuilder.andWhere('controle.nome_atividade ILIKE :nome_atividade', {
          nome_atividade: `%${filtros.nome_atividade}%`,
        });
      }
    }

    if (!isEscala && filtros?.desc_tipodia) {
      queryBuilder.andWhere('controle.desc_tipodia = :desc_tipodia', {
        desc_tipodia: filtros.desc_tipodia,
      });
    }

    // Novos filtros
    if (!isEscala && filtros?.prefixo_veiculo) {
      queryBuilder.andWhere('controle.prefixo_veiculo ILIKE :prefixo_veiculo', {
        prefixo_veiculo: `%${filtros.prefixo_veiculo}%`,
      });
    }

    if (!isEscala && filtros?.motorista_substituto_nome) {
      queryBuilder.andWhere('controle.motorista_substituto_nome ILIKE :motorista_substituto_nome', {
        motorista_substituto_nome: `%${filtros.motorista_substituto_nome}%`,
      });
    }

    if (!isEscala && filtros?.motorista_substituto_cracha) {
      queryBuilder.andWhere('controle.motorista_substituto_cracha ILIKE :motorista_substituto_cracha', {
        motorista_substituto_cracha: `%${filtros.motorista_substituto_cracha}%`,
      });
    }

    if (!isEscala && filtros?.cobrador_substituto_nome) {
      queryBuilder.andWhere('controle.cobrador_substituto_nome ILIKE :cobrador_substituto_nome', {
        cobrador_substituto_nome: `%${filtros.cobrador_substituto_nome}%`,
      });
    }

    if (!isEscala && filtros?.cobrador_substituto_cracha) {
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

    // Filtro de Viagens Editadas (qualquer usuário ou específico)
    if (!isEscala && (filtros?.apenas_editadas || filtros?.editado_por_usuario_email)) {
      const subQueryBuilder = this.controleHorarioChangeRepository
        .createQueryBuilder('change')
        .select('1')
        .where('change.controle_horario_id = controle.id');

      if (filtros.editado_por_usuario_email) {
        subQueryBuilder.andWhere('LOWER(change.alterado_por_email) = LOWER(:email)', {
          email: filtros.editado_por_usuario_email,
        });
      }

      queryBuilder.andWhere(`EXISTS (${subQueryBuilder.getQuery()})`, subQueryBuilder.getParameters());
    }

    // Filtro de viagens confirmadas (de_acordo = true)
    if (!isEscala && filtros?.apenas_confirmadas && !filtros?.apenas_editadas) {
      queryBuilder.andWhere('controle.de_acordo = TRUE');
    }

    // Esconder viagens "de acordo" após N segundos (padrão 30s)
    const ocultarSegundos = Number(filtros?.ocultar_de_acordo_apos_segundos ?? 30);
    const isApenasEditadas = Boolean((filtros as any)?.apenas_editadas);
    const isFiltroEditadosPor = Boolean(filtros?.editado_por_usuario_email);
    if (!isFiltroEditadosPor && !isApenasEditadas && ocultarSegundos > 0) {
      queryBuilder.andWhere(
        `(
          controle.de_acordo = FALSE
          OR controle.de_acordo IS NULL
          OR controle.de_acordo_em IS NULL
          OR controle.de_acordo_em > (NOW() - (INTERVAL '1 second' * :ocultarSegundos))
        )`,
        { ocultarSegundos },
      );
    }

    // Novos Filtros Implementados
    // Definição da lógica de ordem operacional (04:00–03:59), priorizando hora ajustada
    const OPERATION_START_HOUR = 4;
    const effectiveDeparture = "COALESCE(controle.hor_saida_ajustada, controle.hor_saida)";
    const ordemOperacionalExpr = `CASE\n       WHEN EXTRACT(HOUR FROM ${effectiveDeparture}) < ${OPERATION_START_HOUR}\n         THEN ${effectiveDeparture} + INTERVAL '1 day'\n       ELSE ${effectiveDeparture}\n     END`;
    queryBuilder.addSelect(ordemOperacionalExpr, 'ordem_operacional');
    // Mapear sentido_texto para flg_sentido
    if (!isEscala && filtros?.sentido_texto) {
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
    // Filtro por janela de horários (usa hora ajustada quando existir e lida com faixa cruzando meia-noite)
    if (!isEscala && filtros?.horarioInicio && filtros?.horarioFim) {
      const inicio = String(filtros.horarioInicio).trim();
      const fim = String(filtros.horarioFim).trim();
      const cruzaMeiaNoite = inicio > fim;
      if (!cruzaMeiaNoite) {
        queryBuilder.andWhere(
          `CAST(${effectiveDeparture} AS time) BETWEEN CAST(:inicio AS time) AND CAST(:fim AS time)`,
          { inicio, fim },
        );
      } else {
        queryBuilder.andWhere(
          `CAST(${effectiveDeparture} AS time) >= CAST(:inicio AS time) OR CAST(${effectiveDeparture} AS time) <= CAST(:fim AS time)`,
          { inicio, fim },
        );
      }
    }
    // Filtrar por horário de início quando não houver horário de fim
    if (!isEscala && filtros?.horarioInicio && !filtros?.horarioFim) {
      queryBuilder.andWhere(`CAST(${effectiveDeparture} AS time) >= CAST(:horarioInicio AS time)`, { horarioInicio: filtros.horarioInicio });
    }

    // Filtrar por horário de fim (Viagens que começam ANTES ou IGUAL a Y)
    // CORREÇÃO: O filtro de fim deve limitar o horário de SAÍDA, não de chegada, para pegar o intervalo de partidas.
    if (!isEscala && filtros?.horarioFim && !filtros?.horarioInicio) {
      queryBuilder.andWhere(`CAST(${effectiveDeparture} AS time) <= CAST(:horarioFim AS time)`, { horarioFim: filtros.horarioFim });
    }

    // Busca geral em múltiplos campos
    if (!isEscala && filtros?.buscaTexto) {
      queryBuilder.andWhere(
        '(controle.nome_linha ILIKE :buscaTexto OR ' +
        'controle.nome_motorista ILIKE :buscaTexto OR ' +
        'controle.nome_cobrador ILIKE :buscaTexto OR ' +
        'controle.prefixo_veiculo ILIKE :buscaTexto OR ' +
        'controle.atraso_motivo ILIKE :buscaTexto OR ' +
        'controle.atraso_observacao ILIKE :buscaTexto OR ' +
        'controle.cod_servico_numero ILIKE :buscaTexto)',
        { buscaTexto: `%${filtros.buscaTexto}%` },
      );
    }

    // Filtrar por código do cobrador
    if (!isEscala && filtros?.cod_cobrador) {
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
      if (orderByColumn === 'hor_saida' || orderByColumn === 'hor_saida_ajustada' || orderByColumn === 'ordem_operacional') {
        queryBuilder.orderBy('ordem_operacional', filtros.ordem);
      } else {
        queryBuilder.orderBy(`controle.${orderByColumn}`, filtros.ordem);
      }
    } else {
      queryBuilder
        .orderBy('controle.setor_principal_linha', 'ASC')
        .addOrderBy('controle.codigo_linha', 'ASC')
        .addOrderBy('ordem_operacional', 'ASC');
    }

    // Sanitiza e aplica ordenação segura (override da anterior)
    if (filtros?.ordenar_por && filtros?.ordem) {
      const allowedOrderColumns = new Set<string>([
        'setor_principal_linha',
        'codigo_linha',
        'nome_linha',
        'flg_sentido',
        'data_viagem',
        'desc_tipodia',
        'hor_saida',
        'hor_chegada',
        'local_origem_viagem',
        'cod_servico_numero',
        'nome_motorista',
        'nome_cobrador',
        'cod_atividade',
        'nome_atividade',
        'periodo_do_dia',
        'ordem_operacional',
      ]);
      const candidate = String(filtros.ordenar_por).trim();
      if (candidate === 'ordem_operacional') {
        queryBuilder.orderBy('ordem_operacional', filtros.ordem);
      } else if (allowedOrderColumns.has(candidate)) {
        queryBuilder.orderBy(`controle.${candidate}` as any, filtros.ordem);
      } else {
        queryBuilder
          .orderBy('controle.setor_principal_linha', 'ASC')
          .addOrderBy('controle.codigo_linha', 'ASC')
          .addOrderBy('ordem_operacional', 'ASC');
      }
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
            TO_CHAR(H.HOR_SAIDA, 'HH24:MI:SS') AS HOR_SAIDA,
            TO_CHAR(H.HOR_CHEGADA, 'HH24:MI:SS') AS HOR_CHEGADA,
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
                WHEN 1 THEN 'SAIDA DE GARAGEM'
                WHEN 24 THEN 'DESLOCAMENTO DE VEICULO'
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
            H.COD_ATIVIDADE IN (2, 3, 4, 5, 10, 1, 24)
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

        // Filter out duplicates based on hash_dados within the current batch
        const uniqueLoteProcessado = Array.from(new Map(loteProcessado.map(item => [item.hash_dados, item])).values());

        try {
          await this.controleHorarioRepository.upsert(
            uniqueLoteProcessado, // Use the unique list here
            {
              conflictPaths: ['hash_dados'],
              skipUpdateIfNoValuesChanged: true,
            },
          );
          novas += uniqueLoteProcessado.length; // Count unique items
        } catch (error: any) {
          this.logger.error(`❌ Erro ao salvar/atualizar lote (upsert): ${error.message}`);
          erros += uniqueLoteProcessado.length; // Count unique items that caused error
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
    const horSaida = this.processarHorarioOracle(item.HOR_SAIDA, dataReferencia);
    const horChegada = this.processarHorarioOracle(item.HOR_CHEGADA, dataReferencia);

    const sentidoTexto = this.determinarSentidoTexto(item.FLG_SENTIDO);
    const periodoDoDia = this.determinarPeriodoDoDia(horSaida);

    const controle = new ControleHorario();

    controle.setor_principal_linha = item.SETOR_PRINCIPAL_LINHA || '';
    controle.cod_local_terminal_sec = item.COD_LOCAL_TERMINAL_SEC || 0;
    controle.codigo_linha = item.CODIGOLINHA || '';
    if (!item.CODIGOLINHA) {
      this.logger.warn(`CODIGOLINHA is missing for item: ${JSON.stringify(item)}`);
    }
    controle.nome_linha = item.NOMELINHA || '';
    if (!item.NOMELINHA) {
      this.logger.warn(`NOMELINHA is missing for item: ${JSON.stringify(item)}`);
    }
    controle.cod_destino_linha = item.COD_DESTINO_LINHA || null;
    controle.local_destino_linha = item.LOCAL_DESTINO_LINHA || null;
    // Origem da viagem
    controle.cod_origem_viagem = item.COD_ORIGEM_VIAGEM ?? null;
    controle.local_origem_viagem = item.LOCAL_ORIGEM_VIAGEM || null;
    controle.flg_sentido = item.FLG_SENTIDO || null;
    controle.data_viagem = item.DATA_VIAGEM ? new Date(item.DATA_VIAGEM) : null;
    controle.desc_tipodia = item.DESC_TIPODIA || null;
    controle.hor_saida = horSaida;
    if (!horSaida) {
      this.logger.warn(`HOR_SAIDA is missing or invalid for item: ${JSON.stringify(item)}`);
    }
    controle.hor_chegada = horChegada;
    if (!horChegada) {
      this.logger.warn(`HOR_CHEGADA is missing or invalid for item: ${JSON.stringify(item)}`);
    }
    // Serviço
    controle.cod_servico_completo = item.COD_SERVICO_COMPLETO || null;
    controle.cod_servico_numero = (item.COD_SERVICO_NUMERO !== undefined && item.COD_SERVICO_NUMERO !== null)
      ? String(item.COD_SERVICO_NUMERO)
      : null;

    controle.cod_motorista = item.COD_MOTORISTA || null;
    controle.nome_motorista = item.NOME_MOTORISTA || null;
    controle.cracha_motorista = item.CRACHA_MOTORISTA || null;
    controle.chapa_func_motorista = item.CHAPAFUNC_MOTORISTA || null;
    controle.cod_cobrador = item.COD_COBRADOR || null;
    controle.nome_cobrador = item.NOME_COBRADOR || null;
    controle.cracha_cobrador = item.CRACHA_COBRADOR || null;
    controle.chapa_func_cobrador = item.CHAPAFUNC_COBRADOR || null;

    // Atividade
    controle.cod_atividade = item.COD_ATIVIDADE ?? null;
    controle.nome_atividade = item.NOME_ATIVIDADE || null;
    controle.flg_tipo = item.FLG_TIPO || null;
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

  private processarHorarioOracle(horarioOracle: any, dataReferencia: string): Date | null {
    if (!horarioOracle) return null;

    // Parse dataReferencia to get year, month, day
    const dateParts = dataReferencia.split('-').map(Number);
    const year = dateParts[0];
    // Month is 0-indexed in JavaScript Date
    const month = dateParts[1] - 1;
    const day = dateParts[2];

    // Normaliza string e valida formato HH:MM:SS (ex.: 22:00:01)
    if (typeof horarioOracle === 'string') {
      const timeStr = horarioOracle.trim();
      if (/^\d{2}:\d{2}:\d{2}$/.test(timeStr)) {
        try {
          const [hours, minutes, seconds] = timeStr.split(':').map(Number);
          // Construir como horário local no dia informado
          return new Date(year, month, day, hours, minutes, seconds);
        } catch (error) {
          this.logger.error(`Erro ao processar string de horário: ${timeStr}`, error);
          return null;
        }
      }
    }

    // Lógica original para lidar com objetos Date do Oracle (less likely given TO_CHAR in query)
    try {
      const data = new Date(horarioOracle);
      if (isNaN(data.getTime())) {
        this.logger.warn(`Data inválida recebida do Oracle: ${horarioOracle}`);
        return null;
      }
      // Combina a hora recebida com a data de referência como horário local
      return new Date(year, month, day, data.getHours(), data.getMinutes(), data.getSeconds());
    } catch (error) {
      this.logger.error(`Erro ao processar data do Oracle: ${horarioOracle}`, error);
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
      .select('controle.desc_tipodia', 'descTipodia')
      .where('controle.data_referencia = :dataReferencia', { dataReferencia })
      .andWhere('controle.is_ativo = :isAtivo', { isAtivo: true })
      .andWhere('controle.desc_tipodia IS NOT NULL')
      .orderBy('controle.desc_tipodia', 'ASC')
      .getRawMany();

    return [...new Set(result.map((r: any) => r.descTipodia))];
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
        WHERE H.COD_ATIVIDADE IN (2, 3, 4, 5, 10, 1, 24)
          AND L.CODIGOEMPRESA = 4
          AND UPPER(L.NOMELINHA) NOT LIKE '%DESPACHANTES%'
          AND UPPER(L.NOMELINHA) NOT LIKE '%LINHA ESPECIAL%'
          AND UPPER(L.NOMELINHA) NOT LIKE '%DUPLAS RESERVAS%'
          AND L.COD_LOCAL_TERMINAL_SEC IN (6000, 7000, 8000, 9000)
          AND TRUNC(D.DAT_ESCALA) = TO_DATE('${dataReferencia}', 'YYYY-MM-DD')
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

      // Função auxiliar para parsing de hora ajustada
      const parseHoraAjustada = (baseDate: Date | null | undefined, val?: string): Date | null => {
        if (!val) return null;
        const isHHMM = /^\d{1,2}:\d{2}(?::\d{2})?$/.test(val);
        try {
          if (isHHMM) {
            const [h, m, s] = val.split(':').map((n) => parseInt(n, 10));
            const base = baseDate ? new Date(baseDate) : new Date();
            base.setHours(h || 0, m || 0, (s || 0), 0);
            return base;
          }
          const d = new Date(val);
          return isNaN(d.getTime()) ? null : d;
        } catch {
          return null;
        }
      };

      // convert adjusted time strings to Date if needed
      if (typeof (updateDto as any).hor_saida_ajustada === 'string') {
        (updateDto as any).hor_saida_ajustada = parseHoraAjustada(controleHorario.hor_saida, (updateDto as any).hor_saida_ajustada) || undefined;
      }
      if (typeof (updateDto as any).hor_chegada_ajustada === 'string') {
        (updateDto as any).hor_chegada_ajustada = parseHoraAjustada(controleHorario.hor_chegada, (updateDto as any).hor_chegada_ajustada) || undefined;
      }
      if (typeof (updateDto as any).de_acordo === 'boolean') {
        (updateDto as any).de_acordo_em = (updateDto as any).de_acordo ? new Date() : null;
      }

      const normalizedEditorEmail = (editorEmail || '').toString().trim().toLowerCase();
      const beforeState = { ...controleHorario };
      Object.assign(controleHorario, updateDto, {
        editado_por_nome: editorNome,
        editado_por_email: normalizedEditorEmail,
        updated_at: new Date(),
      });

      const saved = await this.controleHorarioRepository.save(controleHorario);

      // Audit unitário
      const changed = this.diffFields(beforeState as any, saved as any);
      if (changed.length) {
        const rows = changed.map(({ campo, beforeVal, afterVal }) => {
          const c = new ControleHorarioChange();
          c.controle_horario_id = saved.id;
          c.campo = campo;
          c.valor_anterior = beforeVal;
          c.valor_novo = afterVal;
          c.alterado_por_nome = editorNome || null;
          c.alterado_por_email = normalizedEditorEmail || null;
          c.data_referencia = (saved as any).data_referencia || null;
          return c;
        });
        await this.controleHorarioChangeRepository.save(rows);
      }
      // Notificação SSE para confirmação (de_acordo virou true)
      try {
        if (this.notificacoesService) {
          this.notificacoesService.emitirConfirmacao(saved, beforeState);
        }
      } catch {}
      return saved;
    }
  }

  // Utilitário para comparar campos relevantes e gerar diffs serializados
  private diffFields(before: Partial<ControleHorario>, after: Partial<ControleHorario>): { campo: string; beforeVal: string | null; afterVal: string | null }[] {
    const fields: string[] = [
      'de_acordo',
      'de_acordo_em',
      'hor_saida_ajustada',
      'hor_chegada_ajustada',
      'atraso_motivo',
      'atraso_observacao',
      'observacoes_edicao',
      'prefixo_veiculo',
      'motorista_substituto_nome',
      'motorista_substituto_cracha',
      'cobrador_substituto_nome',
      'cobrador_substituto_cracha',
    ];

    const serialize = (v: any): string | null => {
      if (v === null || typeof v === 'undefined') return null;
      if (v instanceof Date) return v.toISOString();
      if (typeof v === 'object') return JSON.stringify(v);
      return String(v);
    };

    const changes: { campo: string; beforeVal: string | null; afterVal: string | null }[] = [];
    for (const f of fields) {
      const b = (before as any)[f];
      const a = (after as any)[f];
      const bS = serialize(b);
      const aS = serialize(a);
      if (bS !== aS) {
        changes.push({ campo: f, beforeVal: bS, afterVal: aS });
      }
    }
    return changes;
  }

  async getHistoricoControleHorario(id: string, pagina = 1, limite = 50) {
    const skip = (Math.max(1, pagina) - 1) * Math.max(1, limite);
    const take = Math.max(1, Math.min(500, limite));
    const [rows, total] = await this.controleHorarioChangeRepository.findAndCount({
      where: { controle_horario_id: id },
      order: { created_at: 'DESC' as any },
      skip,
      take,
    });
    return { total, pagina, limite: take, items: rows };
  }
}
