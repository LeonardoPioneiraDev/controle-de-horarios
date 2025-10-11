// src/database/oracle/oracle.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OracleService } from './services/oracle.service';
import oracleConfig from './oracle.config';

@Module({
  imports: [
    ConfigModule.forFeature(oracleConfig),
  ],
  providers: [OracleService],
  exports: [OracleService],
})
export class OracleModule {}