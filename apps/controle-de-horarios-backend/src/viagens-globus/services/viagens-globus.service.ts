// src/viagens-globus/services/viagens-globus.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ViagemGlobus } from '../entities/viagem-globus.entity';
import { FiltrosViagemGlobusDto } from '../dto/filtros-viagem-globus.dto';
import { OracleService } from '../../database/oracle/services/oracle.service'; // ✅ CORRIGIDO
import { createHash } from 'crypto';

@Injectable()
export class ViagensGlobusService {
  private readonly logger = new Logger(ViagensGlobusService.name);

  constructor(
    @InjectRepository(ViagemGlobus)
    private readonly viagemGlobusRepository: Repository<ViagemGlobus>,
    private readonly oracleService: OracleService, // ✅ CORRIGIDO - era OracleGlobusService
  ) {}

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

    // ✅ PAGINAÇÃO
    if (filtros?.limite) {
      queryBuilder.limit(filtros.limite);
    }

    if (filtros?.pagina && filtros?.limite) {
      queryBuilder.offset((filtros.pagina - 1) * filtros.limite);
    }

    // ✅ ORDENAÇÃO
    queryBuilder
      .orderBy('viagem.setorPrincipal', 'ASC')
      .addOrderBy('viagem.codigoLinha', 'ASC')
      .addOrderBy('viagem.horSaida', 'ASC');

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
  }> {
    this.logger.log(`🔄 Sincronizando viagens Globus para ${dataViagem}`);

    try {
      // ✅ VERIFICAR SE ORACLE ESTÁ HABILITADO
      if (!this.oracleService.isEnabled()) {
        this.logger.warn('⚠️ Oracle está desabilitado');
        return { sincronizadas: 0, novas: 0, atualizadas: 0, erros: 1 };
      }

      // ✅ QUERY ORACLE OTIMIZADA
      const sqlQuery = `
        SELECT
          -- Informações da Linha e Setor Principal
          CASE
              WHEN L.COD_LOCAL_TERMINAL_SEC = 7000 THEN 'GAMA'
              WHEN L.COD_LOCAL_TERMINAL_SEC = 6000 THEN 'SANTA MARIA'
              WHEN L.COD_LOCAL_TERMINAL_SEC = 8000 THEN 'PARANOÁ'
              WHEN L.COD_LOCAL_TERMINAL_SEC = 9000 THEN 'SÃO SEBASTIÃO'
          END AS SETOR_PRINCIPAL_LINHA,
          L.COD_LOCAL_TERMINAL_SEC,
          L.CODIGOLINHA,
          L.NOMELINHA,

          -- Informações da Viagem/Horário
          H.FLG_SENTIDO,
          TO_CHAR(D.DAT_ESCALA, 'DD-MON-YYYY') AS DATA_VIAGEM,
          H.HOR_SAIDA,
          H.HOR_CHEGADA,
          
          -- Local de Origem da Viagem
          H.COD_LOCALIDADE,
          LC.DESC_LOCALIDADE AS LOCAL_ORIGEM_VIAGEM,

          -- Informações do Serviço (Viagem)
          S.COD_SERVDIARIA AS COD_SERVICO_COMPLETO,
          REGEXP_SUBSTR(S.COD_SERVDIARIA, '[[:digit:]]+') AS COD_SERVICO_NUMERO,
          
          -- Informações da Tripulação
          S.COD_MOTORISTA,
          FM.NOMECOMPLETOFUNC AS NOME_MOTORISTA,
          S.COD_COBRADOR,
          FC.NOMECOMPLETOFUNC AS NOME_COBRADOR,

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
            LEFT JOIN T_ESC_LOCALIDADE LC ON H.COD_LOCALIDADE = LC.COD_LOCALIDADE
            LEFT JOIN FLP_FUNCIONARIOS FM ON S.COD_MOTORISTA = FM.CODINTFUNC
            LEFT JOIN FLP_FUNCIONARIOS FC ON S.COD_COBRADOR = FC.CODINTFUNC
            
        WHERE
            H.COD_ATIVIDADE = 2
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
            H.HOR_SAIDA
      `;

      // ✅ USAR MÉTODO PARA QUERIES PESADAS
      const dadosOracle = await this.oracleService.executeHeavyQuery(sqlQuery);
      
      this.logger.log(`📊 Oracle Globus retornou ${dadosOracle.length} registros`);

      if (dadosOracle.length === 0) {
        this.logger.warn(`⚠️ Nenhum dado encontrado no Oracle para ${dataViagem}`);
        return { sincronizadas: 0, novas: 0, atualizadas: 0, erros: 0 };
      }

      let novas = 0;
      let atualizadas = 0;
      let erros = 0;

      // ✅ PROCESSAR DADOS EM LOTES
      const BATCH_SIZE = 100;
      for (let i = 0; i < dadosOracle.length; i += BATCH_SIZE) {
        const lote = dadosOracle.slice(i, i + BATCH_SIZE);
        
        for (const item of lote) {
          try {
            const viagemProcessada = this.processarDadosOracle(item, dataViagem);
            
            // ✅ VERIFICAR SE JÁ EXISTE
            const viagemExistente = await this.viagemGlobusRepository.findOne({
              where: { hashDados: viagemProcessada.hashDados }
            });

            if (viagemExistente) {
              // ✅ ATUALIZAR
              await this.viagemGlobusRepository.update(
                { id: viagemExistente.id },
                viagemProcessada
              );
              atualizadas++;
            } else {
              // ✅ INSERIR NOVA
              await this.viagemGlobusRepository.save(viagemProcessada);
              novas++;
            }
          } catch (error: any) {
            this.logger.error(`❌ Erro ao processar item: ${error.message}`);
            erros++;
          }
        }

        // ✅ LOG DE PROGRESSO
        if (i % (BATCH_SIZE * 10) === 0) {
          this.logger.log(`📊 Processados ${i + BATCH_SIZE}/${dadosOracle.length} registros...`);
        }
      }

      const sincronizadas = novas + atualizadas;
      
      this.logger.log(`✅ Sincronização Globus concluída: ${sincronizadas} total (${novas} novas, ${atualizadas} atualizadas, ${erros} erros)`);

      return { sincronizadas, novas, atualizadas, erros };

    } catch (error: any) {
      this.logger.error(`❌ Erro na sincronização Globus: ${error.message}`);
      throw error;
    }
  }

  // ✅ PROCESSAR DADOS DO ORACLE
  private processarDadosOracle(item: any, dataReferencia: string): Partial<ViagemGlobus> {
    // ✅ PROCESSAR HORÁRIOS (ORACLE RETORNA COM DATA 1900)
    const horSaida = this.processarHorarioOracle(item.HOR_SAIDA);
    const horChegada = this.processarHorarioOracle(item.HOR_CHEGADA);
    
    // ✅ CALCULAR DURAÇÃO EM MINUTOS
    const duracaoMinutos = horChegada && horSaida ? 
      Math.round((horChegada.getTime() - horSaida.getTime()) / (1000 * 60)) : null;

    // ✅ DETERMINAR SENTIDO TEXTO
    const sentidoTexto = this.determinarSentidoTexto(item.FLG_SENTIDO);

    // ✅ DETERMINAR PERÍODO DO DIA
    const periodoDoDia = this.determinarPeriodoDoDia(horSaida);

    // ✅ CRIAR HASH ÚNICO
    const hashData = `${dataReferencia}-${item.COD_LOCAL_TERMINAL_SEC}-${item.CODIGOLINHA}-${item.FLG_SENTIDO}-${item.COD_SERVICO_COMPLETO}-${horSaida?.getTime() || 'null'}`;
    const hashDados = createHash('sha256').update(hashData).digest('hex');

    return {
      setorPrincipal: item.SETOR_PRINCIPAL_LINHA || 'NÃO INFORMADO',
      codLocalTerminalSec: item.COD_LOCAL_TERMINAL_SEC || 0,
      codigoLinha: item.CODIGOLINHA || 'N/A',
      nomeLinha: item.NOMELINHA || 'Linha não identificada',
      flgSentido: item.FLG_SENTIDO || 'C',
      dataViagem: new Date(dataReferencia),
      horSaida,
      horChegada,
      horSaidaTime: horSaida ? horSaida.toTimeString().split(' ')[0] : null,
      horChegadaTime: horChegada ? horChegada.toTimeString().split(' ')[0] : null,
      codLocalidade: item.COD_LOCALIDADE || null,
      localOrigemViagem: item.LOCAL_ORIGEM_VIAGEM || null,
      codServicoCompleto: item.COD_SERVICO_COMPLETO || null,
      codServicoNumero: item.COD_SERVICO_NUMERO || null,
      codMotorista: item.COD_MOTORISTA || null,
      nomeMotorista: item.NOME_MOTORISTA || null,
      codCobrador: item.COD_COBRADOR || null,
      nomeCobrador: item.NOME_COBRADOR || null,
      totalHorarios: item.TOTAL_HORARIOS || 0,
      duracaoMinutos,
      dataReferencia,
      hashDados,
      sentidoTexto,
      periodoDoDia,
      temCobrador: !!(item.COD_COBRADOR && item.NOME_COBRADOR),
      origemDados: 'ORACLE_GLOBUS'
    };
  }

  // ✅ PROCESSAR HORÁRIO DO ORACLE (REMOVE DATA 1900)
  private processarHorarioOracle(horarioOracle: any): Date | null {
    if (!horarioOracle) return null;

    try {
      const data = new Date(horarioOracle);
      
      // ✅ CRIAR NOVA DATA APENAS COM HORÁRIO (DATA ATUAL)
      const hoje = new Date();
      const novaData = new Date(
        hoje.getFullYear(),
        hoje.getMonth(),
        hoje.getDate(),
        data.getHours(),
        data.getMinutes(),
        data.getSeconds()
      );

      return novaData;
    } catch (error) {
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
        order: { updatedAt: 'DESC' }
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
}