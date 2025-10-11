// src/database/oracle/oracle.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('oracle', () => ({
  // ✅ CONFIGURAÇÕES BÁSICAS
  user: process.env.ORACLE_USER,
  password: process.env.ORACLE_PASSWORD,
  connectString: process.env.ORACLE_CONNECTION_STRING,
  
  // ✅ CONFIGURAÇÕES DE POOL
  poolMin: parseInt(process.env.ORACLE_POOL_MIN || '1', 10),
  poolMax: parseInt(process.env.ORACLE_POOL_MAX || '5', 10),
  poolIncrement: parseInt(process.env.ORACLE_POOL_INCREMENT || '1', 10),
  poolTimeout: parseInt(process.env.ORACLE_POOL_TIMEOUT || '60', 10),
  poolPingInterval: parseInt(process.env.ORACLE_POOL_PING_INTERVAL || '60', 10),
  queueTimeout: parseInt(process.env.ORACLE_QUEUE_TIMEOUT || '60000', 10),
  
  // ✅ CONFIGURAÇÕES ESPECÍFICAS
  clientPath: process.env.ORACLE_CLIENT_PATH,
  connectionTimeout: parseInt(process.env.ORACLE_CONNECT_TIMEOUT || '30000', 10),
  fetchArraySize: parseInt(process.env.ORACLE_FETCH_ARRAY_SIZE || '1000', 10),
  
  // ✅ CONFIGURAÇÕES DE HABILITAÇÃO
  enabled: process.env.ORACLE_ENABLED === 'true' || process.env.ENABLE_ORACLE_MODULE === 'true',
  
  // ✅ CONFIGURAÇÕES DE SEGURANÇA
  readOnly: process.env.ORACLE_READ_ONLY !== 'false', // Default true para segurança
  disableEncryption: process.env.ORACLE_DISABLE_ENCRYPTION === 'true',
}));