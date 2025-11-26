// src/viagens-globus/services/viagens-globus.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm'; // ✅ CORRIGIDO: Importar In
import { ViagemGlobus } from '../entities/viagem-globus.entity';
import { FiltrosViagemGlobusDto } from '../dto/filtros-viagem-globus.dto';
import { OracleService } from '../../database/oracle/services/oracle.service';
import { createHash } from 'crypto';

@Injectable()
export class ViagensGlobusService {
  private readonly logger = new Logger(ViagensGlobusService.name);

  constructor(
    @InjectRepository(ViagemGlobus)
    private readonly viagemGlobusRepository: Repository<ViagemGlobus>,
    private readonly oracleService: OracleService,
  ) { }

  // ✅ BUSCAR VIAGENS POR DATA (POSTGRESQL PRIMEIRO)
  async buscarViagensPorData(
    dataViagem: string,
    filtros?: FiltrosViagemGlobusDto
  ): Promise<ViagemGlobus[]> {
    this.logger.log(`🔍 Buscando viagens Globus para ${dataViagem}`);

    const queryBuilder = this.viagemGlobusRepository
      .createQueryBuilder('viagem')
      .where('viagem.dataReferencia = :dataViagem', { dataViagem });

    // ✅ APLICAR FILTROS
    if (filtros?.setores?.length > 0) {
      queryBuilder.andWhere('viagem.codLocalTerminalSec IN (:...setores)', {
        setores: filtros.setores
      });
    }

    if (filtros?.codigoLinha) {
      queryBuilder.andWhere('viagem.codigoLinha ILIKE :codigoLinha', {
        codigoLinha: `%${filtros.codigoLinha}%`
      });
    }

    if (filtros?.nomeLinha) {
      queryBuilder.andWhere('viagem.nomeLinha ILIKE :nomeLinha', {
        nomeLinha: `%${filtros.nomeLinha}%`
      });
    }

    if (filtros?.sentido) {
      queryBuilder.andWhere('viagem.flgSentido = :sentido', {
        sentido: filtros.sentido
      });
    }

    if (filtros?.setorPrincipal) {
      queryBuilder.andWhere('viagem.setorPrincipal = :setorPrincipal', {
        setorPrincipal: filtros.setorPrincipal
      });
    }

    if (filtros?.nomeMotorista) {
      queryBuilder.andWhere('viagem.nomeMotorista ILIKE :nomeMotorista', {
        nomeMotorista: `%${filtros.nomeMotorista}%`
      });
    }

    if (filtros?.codDestinoLinha) {
      queryBuilder.andWhere('viagem.codDestinoLinha = :codDestinoLinha', {
        codDestinoLinha: filtros.codDestinoLinha
      });
    }

    if (filtros?.localDestinoLinha) {
      queryBuilder.andWhere('viagem.localDestinoLinha ILIKE :localDestinoLinha', {
        localDestinoLinha: `%${filtros.localDestinoLinha}%`
      });
    }

    if (filtros?.descTipoDia) {
      queryBuilder.andWhere('viagem.descTipoDia ILIKE :descTipoDia', {
        descTipoDia: `%${filtros.descTipoDia}%`
      });
    }

    if (filtros?.codAtividade) {
      queryBuilder.andWhere('viagem.codAtividade = :codAtividade', {
        codAtividade: filtros.codAtividade
      });
    }

    if (filtros?.nomeAtividade) {
      queryBuilder.andWhere('viagem.nomeAtividade ILIKE :nomeAtividade', {
        nomeAtividade: `%${filtros.nomeAtividade}%`
      });
    }

    if (filtros?.flgTipo) {
      queryBuilder.andWhere('viagem.flgTipo = :flgTipo', {
        flgTipo: filtros.flgTipo
      });
    }

    if (filtros?.codMotoristaGlobus) {
      queryBuilder.andWhere('viagem.codMotoristaGlobus = :codMotoristaGlobus', {
        codMotoristaGlobus: filtros.codMotoristaGlobus
      });
    }

    if (filtros?.chapaFuncMotorista) {
      queryBuilder.andWhere('viagem.chapaFuncMotorista ILIKE :chapaFuncMotorista', {
        chapaFuncMotorista: `%${filtros.chapaFuncMotorista}%`
      });
    }

    if (filtros?.codCobradorGlobus) {
      queryBuilder.andWhere('viagem.codCobradorGlobus = :codCobradorGlobus', {
        codCobradorGlobus: filtros.codCobradorGlobus
      });
    }

    if (filtros?.chapaFuncCobrador) {
      queryBuilder.andWhere('viagem.chapaFuncCobrador ILIKE :chapaFuncCobrador', {
        chapaFuncCobrador: `%${filtros.chapaFuncCobrador}%`
      });
    }

    if (filtros?.prefixoVeiculo) {
      queryBuilder.andWhere('viagem.prefixoVeiculo ILIKE :prefixoVeiculo', {
        prefixoVeiculo: `%${filtros.prefixoVeiculo}%`
      });
    }

    if (filtros?.localOrigemViagem) {
      queryBuilder.andWhere('viagem.localOrigemViagem ILIKE :localOrigemViagem', {
        localOrigemViagem: `%${filtros.localOrigemViagem}%`
      });
    }

    if (filtros?.codServicoNumero) {
      queryBuilder.andWhere('viagem.codServicoNumero ILIKE :codServicoNumero', {
        codServicoNumero: `%${filtros.codServicoNumero}%`
      });
    }

    if (filtros?.nomeCobrador) {
      queryBuilder.andWhere('viagem.nomeCobrador ILIKE :nomeCobrador', {
        nomeCobrador: `%${filtros.nomeCobrador}%`
      });
    }

    if (filtros?.apenasComCobrador) {
      queryBuilder.andWhere('viagem.temCobrador = :temCobrador', { temCobrador: true });
    }

    if (filtros?.horarioInicio) {
      queryBuilder.andWhere("to_char(viagem.horSaida, 'HH24:MI') >= :horarioInicio", { horarioInicio: filtros.horarioInicio });
    }

    if (filtros?.horarioFim) {
      queryBuilder.andWhere("to_char(viagem.horChegada, 'HH24:MI') <= :horarioFim", { horarioFim: filtros.horarioFim });
    }

    if (filtros?.buscaTexto) {
      queryBuilder.andWhere(
        '(viagem.nomeLinha ILIKE :buscaTexto OR ' +
        'viagem.nomeMotorista ILIKE :buscaTexto OR ' +
        'viagem.nomeCobrador ILIKE :buscaTexto OR ' +
        'viagem.codigoLinha ILIKE :buscaTexto OR ' +
        'viagem.codServicoNumero ILIKE :buscaTexto OR ' +
        'viagem.prefixoVeiculo ILIKE :buscaTexto)',
        { buscaTexto: `%${filtros.buscaTexto}%` }
      );
    }

    // ✅ PAGINAÇÃO
    if (filtros?.limite) {
      queryBuilder.limit(filtros.limite);
    }

    if (filtros?.page && filtros?.limite) {
      queryBuilder.offset((filtros.page - 1) * filtros.limite);
    }

    // ✅ ORDENAÇÃO
    queryBuilder
      .orderBy('viagem.setorPrincipal', 'ASC')
      .addOrderBy('viagem.codigoLinha', 'ASC')
      .addOrderBy('viagem.horSaida', 'ASC');

    // Override ordenação se parâmetros válidos forem fornecidos
    if (filtros?.ordenarPor && filtros?.ordem) {
      const allowedOrderColumns = new Set<string>([
        'setorPrincipal', 'codigoLinha', 'nomeLinha', 'flgSentido', 'dataViagem',
        'descTipoDia', 'horSaida', 'horChegada', 'localOrigemViagem', 'codServicoNumero',
        'nomeMotorista', 'nomeCobrador', 'codAtividade', 'nomeAtividade', 'periodoDoDia', 'totalHorarios',
      ]);
      if (allowedOrderColumns.has(filtros.ordenarPor)) {
        queryBuilder.orderBy(`viagem.${filtros.ordenarPor}` as any, filtros.ordem as any)
          .addOrderBy('viagem.codigoLinha', 'ASC');
      }
    }

    const viagens = await queryBuilder.getMany();

    this.logger.log(`✅ Encontradas ${viagens.length} viagens no PostgreSQL`);
    return viagens;
  }

  // ✅ SINCRONIZAR COM ORACLE GLOBUS
  async sincronizarViagensPorData(dataViagem: string): Promise<{
    sincronizadas: number;
    novas: number;
    atualizadas: number;
    erros: number;
    desativadas: number;
  }> {
    this.logger.log(`🔄 Sincronizando viagens Globus para ${dataViagem}`);

    try {
      // ✅ VERIFICAR SE ORACLE ESTÁ HABILITADO
      if (!this.oracleService.isEnabled()) {
        this.logger.warn('⚠️ Oracle está desabilitado');
        return { sincronizadas: 0, novas: 0, atualizadas: 0, erros: 1, desativadas: 0 };
      }

      // 1. DELETAR VIAGENS EXISTENTES PARA A DATA
      this.logger.log(`🗑️ Apagando viagens existentes para a data ${dataViagem}...`);
      const deleteResult = await this.viagemGlobusRepository.delete({ dataReferencia: dataViagem });
      this.logger.log(`✅ ${deleteResult.affected || 0} viagens apagadas para ${dataViagem}.`);

      // ✅ QUERY ORACLE OTIMIZADA
      const sqlQuery = `
        SELECT    -- Informações da Linha e Setor Principal    CASE        WHEN L.COD_LOCAL_TERMINAL_SEC = 7000 THEN 'GAMA'
        WHEN L.COD_LOCAL_TERMINAL_SEC = 6000 THEN 'SANTA MARIA'
        WHEN L.COD_LOCAL_TERMINAL_SEC = 8000 THEN 'PARANOÁ'
        WHEN L.COD_LOCAL_TERMINAL_SEC = 9000 THEN 'SÃO SEBASTIÃO'
    END AS SETOR_PRINCIPAL_LINHA,
    L.COD_LOCAL_TERMINAL_SEC,
    L.CODIGOLINHA,
    L.NOMELINHA,
    L.DESTINOLINHA AS COD_DESTINO_LINHA, -- O código do destino da linha
    NLD.DESC_LOCALIDADE AS LOCAL_DESTINO_LINHA, -- Adicionada a descrição do destino da linha

    -- Informações da Viagem/Horário
    H.FLG_SENTIDO,
    TO_CHAR(D.DAT_ESCALA, 'YYYY-MM-DD') AS DATA_VIAGEM,
    -- Adiciona DESC_TIPODIA (baseado no dia da semana da DAT_ESCALA)
    CASE TO_CHAR(D.DAT_ESCALA, 'DY', 'NLS_DATE_LANGUAGE=PORTUGUESE')
        WHEN 'DOM' THEN 'DOMINGO'
        WHEN 'SÁB' THEN 'SABADO'
        ELSE 'DIAS UTEIS'
    END AS DESC_TIPODIA,

    -- ** CORREÇÃO APLICADA AQUI **
    -- Formata a hora de saída para mostrar apenas HH:MI:SS
    TO_CHAR(H.HOR_SAIDA, 'HH24:MI:SS') AS HOR_SAIDA,
    -- Formata a hora de chegada para mostrar apenas HH:MI:SS
    TO_CHAR(H.HOR_CHEGADA, 'HH24:MI:SS') AS HOR_CHEGADA,

    -- Local de Origem da Viagem (AGORA É A ORIGEM DA VIAGEM/HORÁRIO)
    H.COD_LOCALIDADE AS COD_ORIGEM_VIAGEM,
    LCO.DESC_LOCALIDADE AS LOCAL_ORIGEM_VIAGEM, -- Nome do local de saída

    -- Informações do Serviço (Viagem)
    S.COD_SERVDIARIA AS COD_SERVICO_COMPLETO,
    REGEXP_SUBSTR(S.COD_SERVDIARIA, '[[:digit:]]+') AS COD_SERVICO_NUMERO,

    -- Informações da Atividade (NOVO CAMPO)
    H.COD_ATIVIDADE, -- Código da Atividade
    CASE H.COD_ATIVIDADE -- Descrição da Atividade
        WHEN 2 THEN 'REGULAR'
        WHEN 3 THEN 'ESPECIAL'
        WHEN 4 THEN 'RENDIÇÃO'
        WHEN 5 THEN 'RECOLHIMENTO'
        WHEN 10 THEN 'RESERVA'
        ELSE 'OUTROS'
    END AS NOME_ATIVIDADE,

    -- FLG_TIPO (inferida)
    CASE H.COD_ATIVIDADE
        WHEN 2 THEN 'R' -- Regular
        ELSE 'S' -- Suplementar / Outros
    END AS FLG_TIPO,

    -- Informações da Tripulação (ADICIONADOS CRACHÁ E CHAPA/DM-TU)
    S.COD_MOTORISTA,
    FM.NOMECOMPLETOFUNC AS NOME_MOTORISTA,
    FM.CODFUNC AS CRACHA_MOTORISTA, -- Crachá do Motorista
    FM.CHAPAFUNC AS CHAPAFUNC_MOTORISTA, -- Chapa/DM-TU do Motorista
    S.COD_COBRADOR,
    FC.NOMECOMPLETOFUNC AS NOME_COBRADOR, -- Nome do Cobrador
    FC.CODFUNC AS CRACHA_COBRADOR, -- Crachá do Cobrador
    FC.CHAPAFUNC AS CHAPAFUNC_COBRADOR, -- Chapa/DM-TU do Cobrador

    -- Informação Analítica
    COUNT(H.HOR_SAIDA) OVER (
        PARTITION BY L.COD_LOCAL_TERMINAL_SEC, L.CODIGOLINHA
    ) AS TOTAL_HORARIOS
FROM
    T_ESC_ESCALADIARIA D
    JOIN T_ESC_SERVICODIARIA S ON D.DAT_ESCALA = S.DAT_ESCALA AND D.COD_INTESCALA = S.COD_INTESCALA
    JOIN T_ESC_HORARIODIARIA H ON D.DAT_ESCALA = H.DAT_ESCALA AND D.COD_INTESCALA = H.COD_INTESCALA
        AND S.COD_SERVDIARIA = H.COD_INTSERVDIARIA
        AND H.COD_INTTURNO = S.COD_INTTURNO
    JOIN BGM_CADLINHAS L ON DECODE(H.CODINTLINHA, NULL, D.COD_INTLINHA, H.CODINTLINHA) = L.CODINTLINHA

    -- JUNÇÕES ADICIONADAS
    LEFT JOIN T_ESC_LOCALIDADE LCO ON H.COD_LOCALIDADE = LCO.COD_LOCALIDADE
    LEFT JOIN T_ESC_LOCALIDADE NLD ON L.DESTINOLINHA = NLD.COD_LOCALIDADE

    -- AS JUNÇÕES DE FUNCIONÁRIOS JÁ PERMITEM ACESSAR O CRACHÁ E CHAPA
    LEFT JOIN FLP_FUNCIONARIOS FM ON S.COD_MOTORISTA = FM.CODINTFUNC
    LEFT JOIN FLP_FUNCIONARIOS FC ON S.COD_COBRADOR = FC.CODINTFUNC

WHERE
    H.COD_ATIVIDADE IN 2
    AND L.CODIGOEMPRESA = 4
    AND UPPER(L.NOMELINHA) NOT LIKE '%DESPACHANTES%'
    AND UPPER(L.NOMELINHA) NOT LIKE '%LINHA ESPECIAL%'
    AND UPPER(L.NOMELINHA) NOT LIKE '%DUPLAS RESERVAS%'
    AND L.COD_LOCAL_TERMINAL_SEC IN (6000, 7000, 8000, 9000)
    AND TRUNC(D.DAT_ESCALA) = TO_DATE('${dataViagem}', 'YYYY-MM-DD')
ORDER BY
    SETOR_PRINCIPAL_LINHA,
    L.CODIGOLINHA,
    H.FLG_SENTIDO,
    HOR_SAIDA
      `;

      // ✅ USAR MÉTODO PARA QUERIES PESADAS
      const fixedSqlQuery = `
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
            WHEN 'SAB' THEN 'SABADO'
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
          JOIN T_ESC_SERVICODIARIA S ON D.DAT_ESCALA = S.DAT_ESCALA AND D.COD_INTESCALA = S.COD_INTESCALA
          JOIN T_ESC_HORARIODIARIA H ON D.DAT_ESCALA = H.DAT_ESCALA AND D.COD_INTESCALA = H.COD_INTESCALA
            AND S.COD_SERVDIARIA = H.COD_INTSERVDIARIA
            AND H.COD_INTTURNO = S.COD_INTTURNO
          JOIN BGM_CADLINHAS L ON DECODE(H.CODINTLINHA, NULL, D.COD_INTLINHA, H.CODINTLINHA) = L.CODINTLINHA
          LEFT JOIN T_ESC_LOCALIDADE LCO ON H.COD_LOCALIDADE = LCO.COD_LOCALIDADE
          LEFT JOIN T_ESC_LOCALIDADE NLD ON L.DESTINOLINHA = NLD.COD_LOCALIDADE
          LEFT JOIN FLP_FUNCIONARIOS FM ON S.COD_MOTORISTA = FM.CODINTFUNC
          LEFT JOIN FLP_FUNCIONARIOS FC ON S.COD_COBRADOR = FC.CODINTFUNC
        WHERE
          H.COD_ATIVIDADE IN (2)
          AND L.CODIGOEMPRESA = 4
          AND UPPER(L.NOMELINHA) NOT LIKE '%DESPACHANTES%'
          AND UPPER(L.NOMELINHA) NOT LIKE '%LINHA ESPECIAL%'
          AND UPPER(L.NOMELINHA) NOT LIKE '%DUPLAS RESERVAS%'
          AND L.COD_LOCAL_TERMINAL_SEC IN (6000, 7000, 8000, 9000)
          AND TRUNC(D.DAT_ESCALA) = TO_DATE(:dataViagem, 'YYYY-MM-DD')
        ORDER BY
          SETOR_PRINCIPAL_LINHA,
          L.CODIGOLINHA,
          H.FLG_SENTIDO,
          HOR_SAIDA
      `;

      const dadosOracle = await this.oracleService.executeHeavyQuery(fixedSqlQuery, { dataViagem });

      this.logger.log(`📊 Oracle Globus retornou ${dadosOracle.length} registros`);

      if (dadosOracle.length === 0) {
        this.logger.warn(`⚠️ Nenhum dado encontrado no Oracle para ${dataViagem}`);
        // Se não há dados no Oracle, e já apagamos os dados locais, o resultado é 0 para tudo.
        return { sincronizadas: 0, novas: 0, atualizadas: 0, erros: 0, desativadas: 0 };
      }

      let erros = 0;
      const viagensParaSalvar: Partial<ViagemGlobus>[] = [];

      // ✅ PROCESSAR E PREPARAR PARA INSERÇÃO EM LOTE
      for (const item of dadosOracle) {
        try {
          const viagemProcessada = this.processarDadosOracle(item, dataViagem);
          viagensParaSalvar.push({
            ...viagemProcessada,
            createdAt: new Date(),
            updatedAt: new Date(),
            isAtivo: true, // Sempre ativo ao sincronizar
          });
        } catch (error: any) {
          this.logger.error(`❌ Erro ao processar item: ${error.message}`);
          erros++;
        }
      }

      // ✅ SALVAR EM LOTE DE FORMA EFICIENTE
      if (viagensParaSalvar.length > 0) {
        await this.viagemGlobusRepository.save(viagensParaSalvar, { chunk: 200 });
      }

      const novas = viagensParaSalvar.length;
      const sincronizadas = novas;

      this.logger.log(`✅ Sincronização Globus concluída: ${sincronizadas} total (${novas} novas, 0 atualizadas, 0 desativadas, ${erros} erros)`);

      return { sincronizadas, novas, atualizadas: 0, erros, desativadas: 0 };

    } catch (error: any) {
      this.logger.error(`❌ Erro na sincronização Globus: ${error.message}`);
      throw error;
    }
  }

  private processarDadosOracle(item: any, dataReferencia: string): Partial<ViagemGlobus> {
    // ✅ PROCESSAR HORÁRIOS (AGORA SÃO STRINGS HH:MI:SS)
    const horSaida = this.processarHorarioOracle(item.HOR_SAIDA, dataReferencia);
    const horChegada = this.processarHorarioOracle(item.HOR_CHEGADA, dataReferencia);

    // ✅ CALCULAR DURAÇÃO EM MINUTOS
    const duracaoMinutos = horChegada && horSaida ?
      Math.round((horChegada.getTime() - horSaida.getTime()) / (1000 * 60)) : null;

    // ✅ DETERMINAR SENTIDO TEXTO
    const sentidoTexto = this.determinarSentidoTexto(item.FLG_SENTIDO);

    // ✅ DETERMINAR PERÍODO DO DIA
    const periodoDoDia = this.determinarPeriodoDoDia(horSaida);

    // ✅ CRIAR HASH ÚNICO (INCLUINDO NOVOS CAMPOS RELEVANTES)
    const hashData = `${dataReferencia}-${item.COD_LOCAL_TERMINAL_SEC}-${item.CODIGOLINHA}-${item.FLG_SENTIDO}-${item.COD_SERVICO_COMPLETO}-${item.COD_ATIVIDADE}-${item.COD_MOTORISTA}-${item.COD_COBRADOR}-${item.HOR_SAIDA}-${item.HOR_CHEGADA}`;
    const hashDados = createHash('sha256').update(hashData).digest('hex');

    return {
      setorPrincipal: item.SETOR_PRINCIPAL_LINHA || 'NÃO INFORMADO',
      codLocalTerminalSec: item.COD_LOCAL_TERMINAL_SEC || 0,
      codigoLinha: item.CODIGOLINHA || 'N/A',
      nomeLinha: item.NOMELINHA || 'Linha não identificada',
      codDestinoLinha: item.COD_DESTINO_LINHA || null,
      localDestinoLinha: item.LOCAL_DESTINO_LINHA || null, // Usar o novo campo
      flgSentido: item.FLG_SENTIDO || 'C',
      dataViagem: new Date(dataReferencia),
      horSaida,
      horChegada,
      horSaidaTime: item.HOR_SAIDA || null, // Agora vem como string formatada
      horChegadaTime: item.HOR_CHEGADA || null, // Agora vem como string formatada
      codOrigemViagem: item.COD_ORIGEM_VIAGEM || null,
      localOrigemViagem: item.LOCAL_ORIGEM_VIAGEM || null,
      codServicoCompleto: item.COD_SERVICO_COMPLETO || null,
      codServicoNumero: item.COD_SERVICO_NUMERO || null,
      codAtividade: item.COD_ATIVIDADE || null,
      nomeAtividade: item.NOME_ATIVIDADE || null,
      flgTipo: item.FLG_TIPO || null,
      prefixoVeiculo: item.PREFIXO_VEICULO || null,
      codMotoristaGlobus: item.COD_MOTORISTA || null,
      crachaMotoristaGlobus: item.CRACHA_MOTORISTA || null,
      chapaFuncMotorista: item.CHAPAFUNC_MOTORISTA || null,
      nomeMotorista: item.NOME_MOTORISTA || null,
      codCobradorGlobus: item.COD_COBRADOR || null,
      crachaCobradorGlobus: item.CRACHA_COBRADOR || null,
      chapaFuncCobrador: item.CHAPAFUNC_COBRADOR || null,
      nomeCobrador: item.NOME_COBRADOR || null,
      descTipoDia: item.DESC_TIPODIA || null, // Usar o novo campo
      totalHorarios: item.TOTAL_HORARIOS || 0,
      duracaoMinutos,
      dataReferencia,
      hashDados,
      sentidoTexto,
      periodoDoDia,
      temCobrador: !!(item.COD_COBRADOR && item.NOME_COBRADOR), // Usar COD_COBRADOR
      origemDados: 'ORACLE_GLOBUS'
    };
  }

  // ✅ PROCESSAR HORÁRIO DO ORACLE (REMOVE DATA 1900)
  private processarHorarioOracle(horarioOracle: string | null, dataReferencia: string): Date | null {
    if (!horarioOracle) return null;

    try {
      // dataReferencia is in 'YYYY-MM-DD' format
      // horarioOracle is in 'HH:MI:SS' format
      const dateTimeString = `${dataReferencia}T${horarioOracle}`;
      const data = new Date(dateTimeString);

      // Check if the date is valid
      if (isNaN(data.getTime())) {
        throw new Error('Invalid date/time format');
      }
      return data;
    } catch (error) {
      this.logger.error(`Erro ao processar horário Oracle '${horarioOracle}' para data '${dataReferencia}': ${error.message}`);
      return null;
    }
  }

  // ✅ DETERMINAR SENTIDO TEXTO
  private determinarSentidoTexto(flgSentido: string): string {
    switch (flgSentido?.toUpperCase()) {
      case 'I': return 'IDA';
      case 'V': return 'VOLTA';
      case 'C': return 'CIRCULAR';
      default: return 'NÃO INFORMADO';
    }
  }

  // ✅ DETERMINAR PERÍODO DO DIA
  private determinarPeriodoDoDia(horario: Date | null): string {
    if (!horario) return 'NÃO INFORMADO';

    const hora = horario.getHours();

    if (hora >= 5 && hora < 12) return 'MANHÃ';
    if (hora >= 12 && hora < 18) return 'TARDE';
    if (hora >= 18 && hora < 24) return 'NOITE';
    return 'MADRUGADA';
  }

  // ✅ TESTAR CONEXÃO ORACLE
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
          connectionInfo
        };
      } else {
        return {
          success: false,
          message: 'Falha na conexão Oracle Globus'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Erro ao testar conexão Oracle Globus: ${error.message}`
      };
    }
  }

  // ✅ OBTER ESTATÍSTICAS DO ORACLE
  async obterEstatisticasOracle(): Promise<any> {
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
        WHERE H.COD_ATIVIDADE = 2
          AND L.CODIGOEMPRESA = 4
          AND L.COD_LOCAL_TERMINAL_SEC IN (6000, 7000, 8000, 9000)
          AND TRUNC(D.DAT_ESCALA) = TRUNC(SYSDATE)
      `;

      const stats = await this.oracleService.executeQuery(statsQuery);
      return {
        success: true,
        data: stats[0] || {},
        source: 'ORACLE_GLOBUS'
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Erro ao obter estatísticas Oracle: ${error.message}`
      };
    }
  }

  // ✅ OBTER STATUS DOS DADOS
  async obterStatusDados(dataViagem: string): Promise<{
    existeNoBanco: boolean;
    totalRegistros: number;
    ultimaAtualizacao: Date | null;
    setoresDisponiveis: string[];
    linhasDisponiveis: number;
  }> {
    const totalRegistros = await this.viagemGlobusRepository.count({
      where: { dataReferencia: dataViagem }
    });

    const ultimaAtualizacao = totalRegistros > 0 ?
      (await this.viagemGlobusRepository.findOne({
        where: { dataReferencia: dataViagem },
        order: { updatedAt: 'DESC' },
        select: ['updatedAt'] // ✅ CORREÇÃO: Selecionar apenas o campo necessário
      }))?.updatedAt || null : null;

    const setoresDisponiveis = await this.viagemGlobusRepository
      .createQueryBuilder('viagem')
      .select('DISTINCT viagem.setorPrincipal')
      .where('viagem.dataReferencia = :dataViagem', { dataViagem })
      .getRawMany()
      .then(result => result.map(r => r.viagem_setor_principal));

    const linhasDisponiveis = await this.viagemGlobusRepository
      .createQueryBuilder('viagem')
      .select('COUNT(DISTINCT viagem.codigoLinha)', 'count')
      .where('viagem.dataReferencia = :dataViagem', { dataViagem })
      .getRawOne()
      .then(result => parseInt(result?.count || '0'));

    return {
      existeNoBanco: totalRegistros > 0,
      totalRegistros,
      ultimaAtualizacao,
      setoresDisponiveis,
      linhasDisponiveis
    };
  }

  // ✅ OBTER CÓDIGOS DE LINHA ÚNICOS
  async obterCodigosLinha(dataViagem: string): Promise<string[]> {
    const result = await this.viagemGlobusRepository
      .createQueryBuilder('viagem')
      .select('DISTINCT viagem.codigoLinha')
      .where('viagem.dataReferencia = :dataViagem', { dataViagem })
      .orderBy('viagem.codigoLinha', 'ASC')
      .getRawMany();

    return result.map(r => r.viagem_codigo_linha);
  }

  // ✅ OBTER SERVIÇOS ÚNICOS
  async obterServicosUnicos(dataViagem: string): Promise<string[]> {
    const result = await this.viagemGlobusRepository
      .createQueryBuilder('viagem')
      .select('DISTINCT viagem.codServicoNumero')
      .where('viagem.dataReferencia = :dataViagem', { dataViagem })
      .andWhere('viagem.codServicoNumero IS NOT NULL')
      .orderBy('viagem.codServicoNumero', 'ASC')
      .getRawMany();

    return result.map(r => r.viagem_cod_servico_numero);
  }

  // ✅ OBTER SETORES ÚNICOS
  async obterSetoresUnicos(dataViagem: string): Promise<string[]> {
    const result = await this.viagemGlobusRepository
      .createQueryBuilder('viagem')
      .select('DISTINCT viagem.setorPrincipal', 'setor')
      .where('viagem.dataReferencia = :dataViagem', { dataViagem })
      .andWhere('viagem.setorPrincipal IS NOT NULL')
      .orderBy('viagem.setorPrincipal', 'ASC')
      .getRawMany();

    return result.map(r => r.setor);
  }

  // ✅ OBTER ESTATÍSTICAS
  async obterEstatisticas(dataViagem: string): Promise<any> {
    const totalViagens = await this.viagemGlobusRepository.count({
      where: { dataReferencia: dataViagem }
    });

    if (totalViagens === 0) {
      return {
        totalViagens: 0,
        message: 'Nenhuma viagem encontrada para esta data'
      };
    }

    // ✅ DISTRIBUIÇÃO POR SETOR
    const distribuicaoPorSetor = await this.viagemGlobusRepository
      .createQueryBuilder('viagem')
      .select('viagem.setorPrincipal', 'setor')
      .addSelect('COUNT(*)', 'total')
      .where('viagem.dataReferencia = :dataViagem', { dataViagem })
      .groupBy('viagem.setorPrincipal')
      .orderBy('total', 'DESC')
      .getRawMany();

    // ✅ DISTRIBUIÇÃO POR SENTIDO
    const distribuicaoPorSentido = await this.viagemGlobusRepository
      .createQueryBuilder('viagem')
      .select('viagem.sentidoTexto', 'sentido')
      .addSelect('COUNT(*)', 'total')
      .where('viagem.dataReferencia = :dataViagem', { dataViagem })
      .groupBy('viagem.sentidoTexto')
      .orderBy('total', 'DESC')
      .getRawMany();

    // ✅ TOP 10 LINHAS
    const top10Linhas = await this.viagemGlobusRepository
      .createQueryBuilder('viagem')
      .select('viagem.nomeLinha', 'linha')
      .addSelect('COUNT(*)', 'total')
      .where('viagem.dataReferencia = :dataViagem', { dataViagem })
      .groupBy('viagem.nomeLinha')
      .orderBy('total', 'DESC')
      .limit(10)
      .getRawMany();

    return {
      totalViagens,
      distribuicaoPorSetor: distribuicaoPorSetor.reduce((acc, item) => {
        acc[item.setor] = parseInt(item.total);
        return acc;
      }, {}),
      distribuicaoPorSentido: distribuicaoPorSentido.reduce((acc, item) => {
        acc[item.sentido] = parseInt(item.total);
        return acc;
      }, {}),
      top10Linhas: top10Linhas.reduce((acc, item) => {
        acc[item.linha] = parseInt(item.total);
        return acc;
      }, {})
    };
  }
  // ✅ DEBUG: INSPECIONAR LINHA NO ORACLE
  async debugLinha(codigoLinha: string, data: string): Promise<any> {
    try {
      const query = `
        SELECT 
          L.CODIGOLINHA,
          L.NOMELINHA,
          L.COD_LOCAL_TERMINAL_SEC,
          CASE 
            WHEN L.COD_LOCAL_TERMINAL_SEC = 7000 THEN 'GAMA'
            WHEN L.COD_LOCAL_TERMINAL_SEC = 6000 THEN 'SANTA MARIA'
            WHEN L.COD_LOCAL_TERMINAL_SEC = 8000 THEN 'PARANOA'
            WHEN L.COD_LOCAL_TERMINAL_SEC = 9000 THEN 'SAO SEBASTIAO'
            ELSE 'OUTROS'
          END AS SETOR_DECODIFICADO,
          COUNT(H.HOR_SAIDA) AS TOTAL_VIAGENS
        FROM BGM_CADLINHAS L
        LEFT JOIN T_ESC_ESCALADIARIA D ON L.CODINTLINHA = D.COD_INTLINHA
        LEFT JOIN T_ESC_HORARIODIARIA H ON D.DAT_ESCALA = H.DAT_ESCALA 
                                       AND D.COD_INTESCALA = H.COD_INTESCALA
                                       AND (H.CODINTLINHA IS NULL OR H.CODINTLINHA = L.CODINTLINHA)
        WHERE L.CODIGOLINHA = '${codigoLinha}'
          AND L.CODIGOEMPRESA = 4
          AND TRUNC(D.DAT_ESCALA) = TO_DATE('${data}', 'YYYY-MM-DD')
          AND H.COD_ATIVIDADE = 2
        GROUP BY 
          L.CODIGOLINHA, 
          L.NOMELINHA, 
          L.COD_LOCAL_TERMINAL_SEC
        ORDER BY 
          L.COD_LOCAL_TERMINAL_SEC
      `;

      const result = await this.oracleService.executeQuery(query);
      return {
        success: true,
        data: result,
        query
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message
      };
    }
  }
}
