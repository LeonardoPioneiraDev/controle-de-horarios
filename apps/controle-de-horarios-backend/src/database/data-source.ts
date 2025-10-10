import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';

// Carregar variáveis de ambiente
config();

const configService = new ConfigService();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: configService.get('DATABASE_HOST'),
  port: parseInt(configService.get('DATABASE_PORT')),
  username: configService.get('DATABASE_USERNAME'),
  password: configService.get('DATABASE_PASSWORD'),
  database: configService.get('DATABASE_NAME'),
  schema: configService.get('DATABASE_SCHEMA', 'public'),
  synchronize: configService.get('DATABASE_SYNCHRONIZE') === 'true',
  logging: configService.get('DATABASE_LOGGING') === 'true',
  ssl: configService.get('DATABASE_SSL') === 'true',
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts'],
  subscribers: ['src/**/*.subscriber.ts'],
  maxQueryExecutionTime: parseInt(configService.get('SLOW_QUERY_THRESHOLD', '1000')),
});