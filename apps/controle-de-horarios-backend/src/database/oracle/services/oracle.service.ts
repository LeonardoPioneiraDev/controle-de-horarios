// src/database/oracle/services/oracle.service.ts
import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// CONSTANTES PARA O TIMEOUT DE 24 HORAS
const MAX_TIMEOUT_24H_MS = 86400000; // 24 horas em milissegundos
const MAX_TIMEOUT_24H_S = 86400;    // 24 horas em segundos
const MAX_RETRY_DELAY_MS = 180000;  // 3 minutos

@Injectable()
export class OracleService implements OnModuleDestroy {
  private readonly logger = new Logger(OracleService.name);
  private connection: any = null;
  private oracledb: any = null;
  private isThickModeInitialized = false;
  private connectionAttempts = 0;
  private readonly maxConnectionAttempts = 3;
  private isOracleAvailable = false;

  constructor(private configService: ConfigService) {
    this.logger.log('🔶 Oracle Service inicializado');
    this.initializeOracleClient();
  }

  private async initializeOracleClient(): Promise<void> {
    try {
      // ✅ VERIFICAR SE ORACLE ESTÁ HABILITADO
      const oracleEnabled = this.configService.get<boolean>('oracle.enabled', false);
      
      if (!oracleEnabled) {
        this.logger.warn('🔧 Oracle module está DESABILITADO');
        this.logger.warn('💡 Para habilitar, defina ORACLE_ENABLED=true no .env');
        return;
      }

      this.logger.log('✅ Oracle module HABILITADO - Tentando carregar...');

      // ✅ IMPORTAÇÃO DINÂMICA DO ORACLEDB
      try {
        this.oracledb = await import('oracledb');
        this.isOracleAvailable = true;
        this.logger.log('📦 Módulo OracleDB carregado com sucesso');
      } catch (error: any) {
        this.logger.error(`❌ Erro ao carregar OracleDB: ${error.message}`);
        this.logger.warn('💡 Oracle será desabilitado automaticamente');
        this.logger.warn('💡 Para usar Oracle, instale: npm install oracledb');
        return;
      }

      // ✅ CONFIGURAÇÕES GLOBAIS PARA PERFORMANCE
      this.oracledb.fetchArraySize = 5000;
      this.oracledb.maxRows = 0;
      this.oracledb.outFormat = this.oracledb.OUT_FORMAT_OBJECT;

      // ✅ INICIALIZAR THICK MODE SE DISPONÍVEL
      const clientPath = this.configService.get<string>('oracle.clientPath');
      
      if (clientPath && !this.isThickModeInitialized) {
        this.logger.log(`📦 Inicializando Oracle Client: ${clientPath}`);
        
        const fs = require('fs');
        if (!fs.existsSync(clientPath)) {
          this.logger.warn(`⚠️ Caminho do Oracle Client não existe: ${clientPath}`);
          this.logger.log('💡 Continuando com modo thin');
        } else {
          try {
            this.oracledb.initOracleClient({ libDir: clientPath });
            this.isThickModeInitialized = true;
            this.logger.log('✅ Oracle Client inicializado (Thick Mode)');
          } catch (error: any) {
            if (error.code === 'NJS-077') {
              this.logger.log('ℹ️ Oracle Client já foi inicializado');
              this.isThickModeInitialized = true;
            } else {
              this.logger.error(`❌ Erro ao inicializar Oracle Client: ${error.message}`);
              this.logger.log('💡 Continuando com modo thin para consultas');
              this.isThickModeInitialized = true;
            }
          }
        }
      } else if (!clientPath) {
        this.logger.warn('⚠️ ORACLE_CLIENT_PATH não definido. Usando modo thin');
        this.logger.log('💡 Modo thin é adequado para consultas básicas');
      }
      
      this.isThickModeInitialized = true;
    } catch (error: any) {
      this.logger.error(`❌ Erro ao inicializar Oracle Client: ${error.message}`);
      this.logger.log('💡 Oracle será desabilitado automaticamente');
      this.isOracleAvailable = false;
    }
  }

  async connect(): Promise<void> {
    // ✅ VERIFICAR SE ORACLE ESTÁ DISPONÍVEL
    if (!this.isOracleAvailable || !this.oracledb) {
      this.logger.warn('⚠️ Oracle não está disponível');
      return;
    }

    const oracleEnabled = this.configService.get<boolean>('oracle.enabled', false);
    if (!oracleEnabled) {
      this.logger.warn('⚠️ Oracle está desabilitado, não conectando');
      return;
    }

    if (this.connection) {
      try {
        await this.connection.execute('SELECT 1 FROM DUAL');
        return; // Conexão válida
      } catch (error) {
        this.logger.warn('⚠️ Conexão Oracle inválida, reconectando...');
        this.connection = null;
      }
    }

    try {
      this.connectionAttempts++;
      this.logger.log(`🔗 Conectando ao Oracle (tentativa ${this.connectionAttempts}/${this.maxConnectionAttempts})...`);
      
      const connectString = this.configService.get<string>('oracle.connectString');
      const user = this.configService.get<string>('oracle.user');
      const password = this.configService.get<string>('oracle.password');

      if (!connectString || !user || !password) {
        throw new Error('❌ Configurações Oracle incompletas');
      }

      this.logger.log(`📋 Configuração Oracle (CONSULTA):`);
      this.logger.log(`   🔗 Connection: ${this.maskConnectionString(connectString)}`);
      this.logger.log(`   👤 User: ${user}`);
      this.logger.log(`   🔒 Password: ${'*'.repeat(password.length)}`);
      this.logger.log(`   📖 Modo: SOMENTE LEITURA`);
      
      const connectionConfig = {
        user,
        password,
        connectString,
        connectTimeout: MAX_TIMEOUT_24H_S, 
        callTimeout: MAX_TIMEOUT_24H_MS, 
      };

      this.connection = await this.oracledb.getConnection(connectionConfig);
      
      this.connectionAttempts = 0;
      this.logger.log('✅ Conectado ao Oracle Database com sucesso!');
      
      await this.optimizeSession();
      
      const info = await this.getConnectionInfo();
      this.logger.log(`�� Informações da conexão Oracle:`);
      this.logger.log(`   🏢 Database: ${info.DATABASE_NAME}`);
      this.logger.log(`   🖥️ Server: ${info.SERVER_HOST}`);
      this.logger.log(`   👤 User: ${info.USERNAME}`);
      this.logger.log(`   📖 Modo: CONSULTA APENAS`);
      
    } catch (error: any) {
      this.logger.error(`❌ Erro ao conectar Oracle (tentativa ${this.connectionAttempts}): ${error.message}`);
      
      if (this.connectionAttempts < this.maxConnectionAttempts) {
        this.logger.log(`⏳ Aguardando ${MAX_RETRY_DELAY_MS/60000} minutos antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, MAX_RETRY_DELAY_MS));
        return this.connect();
      } else {
        this.logger.error(`🚨 Esgotadas ${this.maxConnectionAttempts} tentativas de conexão Oracle`);
        throw new Error(`Falha na conexão Oracle: ${error.message}`);
      }
    }
  }

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

      this.logger.log('🚀 Sessão Oracle otimizada para performance');
    } catch (error: any) {
      this.logger.warn(`⚠️ Erro ao otimizar sessão: ${error.message}`);
    }
  }

  private maskConnectionString(connectionString: string): string {
    return connectionString.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
  }

  async executeQuery<T = any>(sql: string, binds: any = {}): Promise<T[]> {
    if (!this.isOracleAvailable || !this.oracledb) {
      this.logger.warn('⚠️ Oracle não disponível, retornando array vazio');
      return [];
    }

    const oracleEnabled = this.configService.get<boolean>('oracle.enabled', false);
    if (!oracleEnabled) {
      this.logger.warn('⚠️ Oracle desabilitado, retornando array vazio');
      return [];
    }

    const trimmedSql = sql.trim().toUpperCase();
    if (!trimmedSql.startsWith('SELECT') && !trimmedSql.startsWith('WITH')) {
      throw new Error('❌ Oracle Service: APENAS consultas SELECT são permitidas');
    }

    if (!this.connection) {
      await this.connect();
    }
    
    try {
      this.logger.debug(`🔍 Executando consulta Oracle: ${sql.substring(0, 100)}...`);
      
      const startTime = Date.now();
      
      const result = await this.connection!.execute(
        sql,
        binds,
        {
          outFormat: this.oracledb.OUT_FORMAT_OBJECT,
          fetchArraySize: 7000,
          maxRows: 0,
          autoCommit: false,
          prefetchRows: 7000,
          resultSet: false,
        }
      );
      
      const executionTime = Date.now() - startTime;
      const rowCount = (result.rows || []).length;
      
      this.logger.log(`✅ Consulta Oracle executada em ${executionTime}ms, ${rowCount} registros`);

      if (executionTime > 10000) {
        this.logger.warn(`⚠️ Query lenta detectada: ${executionTime}ms`);
      }

      return (result.rows || []) as T[];
    } catch (error: any) {
      this.logger.error(`❌ Erro na consulta Oracle: ${error.message}`);
      
      if (this.isConnectionError(error)) {
        this.logger.warn('🔄 Reconectando Oracle...');
        this.connection = null;
        await this.connect();
        return this.executeQuery<T>(sql, binds);
      }
      
      throw error;
    }
  }

  private isConnectionError(error: any): boolean {
    const connectionErrorCodes = ['ORA-03113', 'ORA-03114', 'ORA-01012', 'NJS-003', 'NJS-024'];
    return connectionErrorCodes.some(code => error.message.includes(code));
  }

  async query<T = any>(sql: string, binds: any = {}): Promise<T[]> {
    return this.executeQuery<T>(sql, binds);
  }

  async execute(sql: string, binds: any = {}, options: any = {}): Promise<any> {
    const trimmedSql = sql.trim().toUpperCase();
    if (!trimmedSql.startsWith('SELECT') && !trimmedSql.startsWith('WITH')) {
      throw new Error('❌ Oracle Service: APENAS consultas SELECT são permitidas');
    }

    if (!this.connection) {
      await this.connect();
    }

    try {
      const defaultOptions = {
        autoCommit: false,
        outFormat: this.oracledb.OUT_FORMAT_OBJECT,
        fetchArraySize: 5000,
        maxRows: 0,
        prefetchRows: 5000,
        ...options
      };

      return await this.connection!.execute(sql, binds, defaultOptions);
    } catch (error: any) {
      this.logger.error(`❌ Erro ao executar comando: ${error.message}`);
      throw error;
    }
  }

  async executeHeavyQuery<T = any>(sql: string, binds: any = {}, timeoutMs: number = MAX_TIMEOUT_24H_MS): Promise<T[]> {
    if (!this.isOracleAvailable || !this.oracledb) {
      this.logger.warn('⚠️ Oracle não disponível, retornando array vazio');
      return [];
    }

    const oracleEnabled = this.configService.get<boolean>('oracle.enabled', false);
    if (!oracleEnabled) {
      this.logger.warn('⚠️ Oracle desabilitado, retornando array vazio');
      return [];
    }

    const trimmedSql = sql.trim().toUpperCase();
    if (!trimmedSql.startsWith('SELECT') && !trimmedSql.startsWith('WITH')) {
      throw new Error('❌ Oracle Service: APENAS consultas SELECT são permitidas');
    }

    if (!this.connection) {
      await this.connect();
    }

    try {
      this.logger.log(`🔍 Executando QUERY PESADA Oracle (timeout: ${timeoutMs}ms)...`);
      
      const startTime = Date.now();
      
      const queryPromise = this.connection!.execute(
        sql,
        binds,
        {
          outFormat: this.oracledb.OUT_FORMAT_OBJECT,
          fetchArraySize: 5000,
          maxRows: 0,
          autoCommit: false,
          prefetchRows: 5000,
          resultSet: false,
        }
      );

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Query timeout após ${timeoutMs}ms`)), timeoutMs);
      });

      const result = await Promise.race([queryPromise, timeoutPromise]) as any;
      
      const executionTime = Date.now() - startTime;
      const rowCount = (result.rows || []).length;
      
      this.logger.log(`✅ QUERY PESADA executada em ${executionTime}ms, ${rowCount} registros`);

      return (result.rows || []) as T[];
    } catch (error: any) {
      this.logger.error(`❌ Erro na QUERY PESADA Oracle: ${error.message}`);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      try {
        await this.connection.close();
        this.connection = null;
        this.connectionAttempts = 0;
        this.logger.log('🔌 Desconectado do Oracle Database');
      } catch (error: any) {
        this.logger.error(`❌ Erro ao desconectar Oracle: ${error.message}`);
        this.connection = null;
      }
    }
  }

  async onModuleDestroy() {
    this.logger.log('🔶 Oracle Service sendo finalizado...');
    await this.disconnect();
  }

  isConnected(): boolean {
    return this.connection !== null;
  }

  async getConnectionInfo(): Promise<any> {
    if (!this.connection) {
      await this.connect();
    }

    try {
      const info = await this.query(`
        SELECT 
          SYS_CONTEXT('USERENV', 'SESSION_USER') as USERNAME,
          SYS_CONTEXT('USERENV', 'DB_NAME') as DATABASE_NAME,
          SYS_CONTEXT('USERENV', 'SERVER_HOST') as SERVER_HOST,
          SYS_CONTEXT('USERENV', 'INSTANCE_NAME') as INSTANCE_NAME,
          SYS_CONTEXT('USERENV', 'SERVICE_NAME') as SERVICE_NAME
        FROM DUAL
      `);

      return info[0];
    } catch (error: any) {
      this.logger.error(`❌ Erro ao obter info da conexão Oracle: ${error.message}`);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.isOracleAvailable || !this.oracledb) {
        this.logger.warn('⚠️ Oracle não disponível');
        return false;
      }

      const oracleEnabled = this.configService.get<boolean>('oracle.enabled', false);
      if (!oracleEnabled) {
        this.logger.warn('⚠️ Oracle desabilitado');
        return false;
      }

      await this.connect();
      const result = await this.connection?.execute('SELECT 1 FROM DUAL');
      const isValid = result?.rows?.length > 0;
      
      if (isValid) {
        this.logger.log('✅ Teste de conexão Oracle bem-sucedido');
      } else {
        this.logger.error('❌ Teste de conexão Oracle falhou');
      }
      
      return isValid;
    } catch (error: any) {
      this.logger.error(`❌ Erro ao testar conexão Oracle: ${error.message}`);
      return false;
    }
  }

  isEnabled(): boolean {
    return this.configService.get<boolean>('oracle.enabled', false) && this.isOracleAvailable;
  }
}