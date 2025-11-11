// src/database/oracle/services/oracle-globus.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as oracledb from 'oracledb';

@Injectable()
export class OracleGlobusService {
  private readonly logger = new Logger(OracleGlobusService.name);
  private connection: oracledb.Connection | null = null;
  private isThickModeInitialized = false;

  constructor(private configService: ConfigService) {
    this.logger.log('🔶 Oracle Globus Service inicializado');
    this.initializeOracleClient();
  }

  private initializeOracleClient(): void {
    try {
      const oracleEnabled = this.configService.get<boolean>('oracle.enabled', false);
      
      if (!oracleEnabled) {
        this.logger.warn('🔧 Oracle Globus está DESABILITADO');
        return;
      }

      this.logger.log('✅ Oracle Globus HABILITADO');

      // ✅ CONFIGURAÇÕES GLOBAIS PARA PERFORMANCE
      oracledb.fetchArraySize = 5000;
      oracledb.maxRows = 0;
      oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

      // ✅ INICIALIZAR THICK MODE
      const clientPath = this.configService.get<string>('oracle.clientPath');
      
      if (clientPath && !this.isThickModeInitialized) {
        this.logger.log(`📦 Inicializando Oracle Client Globus: ${clientPath}`);
        
        const fs = require('fs');
        if (!fs.existsSync(clientPath)) {
          this.logger.warn(`⚠️ Caminho do Oracle Client não existe: ${clientPath}`);
          this.logger.log('💡 Continuando com modo thin');
        } else {
          try {
            oracledb.initOracleClient({ libDir: clientPath });
            this.isThickModeInitialized = true;
            this.logger.log('✅ Oracle Client Globus inicializado (Thick Mode)');
          } catch (error: any) {
            if (error.code === 'NJS-077') {
              this.logger.log('ℹ️ Oracle Client já foi inicializado');
              this.isThickModeInitialized = true;
            } else {
              this.logger.error(`❌ Erro ao inicializar Oracle Client: ${error.message}`);
              this.isThickModeInitialized = true;
            }
          }
        }
      }
      
    } catch (error: any) {
      this.logger.error(`❌ Erro na inicialização Oracle Globus: ${error.message}`);
    }
  }

  // ✅ CONECTAR AO ORACLE GLOBUS
  async connect(): Promise<void> {
    const oracleEnabled = this.configService.get<boolean>('oracle.enabled', false);

    if (!oracleEnabled) {
      this.logger.warn('⚠️ Oracle Globus está desabilitado');
      return;
    }

    if (this.connection) {
      try {
        await this.connection.execute('SELECT 1 FROM DUAL');
        return; // Conexão válida
      } catch (error) {
        this.logger.warn('⚠️ Conexão Oracle Globus inválida, reconectando...');
        this.connection = null;
      }
    }

    try {
      this.logger.log('🔗 Conectando ao Oracle Globus...');
      
      const connectionConfig: oracledb.ConnectionAttributes = {
        user: this.configService.get<string>('oracle.user'),
        password: this.configService.get<string>('oracle.password'),
        connectString: this.configService.get<string>('oracle.connectString'),
        connectTimeout: 9000, // 5 minutos
        callTimeout: 2800000, // 30 minutos
      };

      this.connection = await oracledb.getConnection(connectionConfig);
      this.logger.log('✅ Conectado ao Oracle Globus com sucesso!');
      
      // ✅ OTIMIZAR SESSÃO
      await this.optimizeSession();
      
      // ✅ OBTER INFORMAÇÕES DA CONEXÃO
      const info = await this.getConnectionInfo();
      this.logger.log(`📊 Conexão Oracle Globus:`);
      this.logger.log(`   🏢 Database: ${info.DATABASE_NAME}`);
      this.logger.log(`   👤 User: ${info.USERNAME}`);
      this.logger.log(`   📖 Modo: CONSULTA APENAS (READ-ONLY)`);
      
    } catch (error: any) {
      this.logger.error(`❌ Erro ao conectar Oracle Globus: ${error.message}`);
      throw error;
    }
  }

  // ✅ OTIMIZAR SESSÃO PARA PERFORMANCE
  private async optimizeSession(): Promise<void> {
    try {
      if (!this.connection) return;

      const optimizations = [
        "ALTER SESSION SET OPTIMIZER_MODE = ALL_ROWS",
        "ALTER SESSION SET QUERY_REWRITE_ENABLED = TRUE",
        "ALTER SESSION SET PARALLEL_DEGREE_POLICY = AUTO",
        "ALTER SESSION SET DB_FILE_MULTIBLOCK_READ_COUNT = 128",
      ];

      for (const sql of optimizations) {
        try {
          await this.connection.execute(sql);
        } catch (error: any) {
          // Ignorar erros de otimização
        }
      }

      this.logger.log('🚀 Sessão Oracle Globus otimizada');
    } catch (error: any) {
      this.logger.warn(`⚠️ Erro ao otimizar sessão: ${error.message}`);
    }
  }

  // ✅ EXECUTAR QUERY DE VIAGENS GLOBUS
  async buscarViagensPorData(dataViagem: string): Promise<any[]> {
    if (!this.connection) {
      await this.connect();
    }

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

    try {
      this.logger.log(`🔍 Executando query Globus para ${dataViagem}`);
      
      const startTime = Date.now();
      
      const result = await this.connection!.execute(
        sqlQuery,
        {},
        {
          outFormat: oracledb.OUT_FORMAT_OBJECT,
          fetchArraySize: 5000,
          maxRows: 0,
          autoCommit: false,
        }
      );

      const executionTime = Date.now() - startTime;
      const dados = (result.rows || []) as any[];
      
      this.logger.log(`✅ Oracle Globus retornou ${dados.length} registros em ${executionTime}ms`);
      
      return dados;
    } catch (error: any) {
      this.logger.error(`❌ Erro na query Globus: ${error.message}`);
      throw error;
    }
  }

  // ✅ OBTER INFORMAÇÕES DA CONEXÃO
  async getConnectionInfo(): Promise<any> {
    if (!this.connection) {
      await this.connect();
    }

    try {
      const info = await this.connection!.execute(`
        SELECT 
          SYS_CONTEXT('USERENV', 'SESSION_USER') as USERNAME,
          SYS_CONTEXT('USERENV', 'DB_NAME') as DATABASE_NAME,
          SYS_CONTEXT('USERENV', 'SERVER_HOST') as SERVER_HOST,
          SYS_CONTEXT('USERENV', 'INSTANCE_NAME') as INSTANCE_NAME,
          SYS_CONTEXT('USERENV', 'SERVICE_NAME') as SERVICE_NAME
        FROM DUAL
      `);

      return (info.rows as any[])[0];
    } catch (error: any) {
      this.logger.error(`❌ Erro ao obter info da conexão: ${error.message}`);
      throw error;
    }
  }

  // ✅ TESTAR CONEXÃO
  async testarConexao(): Promise<boolean> {
    try {
      const oracleEnabled = this.configService.get<boolean>('oracle.enabled', false);

      if (!oracleEnabled) {
        this.logger.warn('⚠️ Oracle Globus desabilitado');
        return false;
      }

      await this.connect();
      const result = await this.connection?.execute('SELECT 1 FROM DUAL');
      const isValid = result?.rows?.length > 0;
      
      if (isValid) {
        this.logger.log('✅ Teste de conexão Oracle Globus bem-sucedido');
      } else {
        this.logger.error('❌ Teste de conexão Oracle Globus falhou');
      }
      
      return isValid;
    } catch (error: any) {
      this.logger.error(`❌ Erro ao testar conexão Oracle Globus: ${error.message}`);
      return false;
    }
  }

  // ✅ OBTER ESTATÍSTICAS DO ORACLE
  async obterEstatisticasOracle(): Promise<any> {
    if (!this.connection) {
      await this.connect();
    }

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

      const result = await this.connection!.execute(statsQuery);
      return (result.rows as any[])[0] || {};
    } catch (error: any) {
      this.logger.error(`❌ Erro ao obter estatísticas Oracle: ${error.message}`);
      throw error;
    }
  }

  // ✅ VERIFICAR SE ESTÁ HABILITADO
  isEnabled(): boolean {
    return this.configService.get<boolean>('oracle.enabled', false);
  }

  // ✅ DESCONECTAR
  async disconnect(): Promise<void> {
    if (this.connection) {
      try {
        await this.connection.close();
        this.connection = null;
        this.logger.log('🔌 Desconectado do Oracle Globus');
      } catch (error: any) {
        this.logger.error(`❌ Erro ao desconectar: ${error.message}`);
      }
    }
  }

  // ✅ CLEANUP AO DESTRUIR MÓDULO
  async onModuleDestroy() {
    this.logger.log('🔶 Oracle Globus Service sendo finalizado...');
    await this.disconnect();
  }
}