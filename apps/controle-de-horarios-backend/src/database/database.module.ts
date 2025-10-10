import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
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
        autoLoadEntities: true,
        retryAttempts: 3,
        retryDelay: 3000,
        maxQueryExecutionTime: parseInt(configService.get('SLOW_QUERY_THRESHOLD', '1000')),
        extra: {
          max: parseInt(configService.get('DATABASE_MAX_CONNECTIONS', '10')),
          connectionTimeoutMillis: parseInt(configService.get('DATABASE_CONNECTION_TIMEOUT', '18000000')),
          query_timeout: parseInt(configService.get('DATABASE_QUERY_TIMEOUT', '18000000')),
        },
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}