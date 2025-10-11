// src/viagens-globus/viagens-globus.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ViagemGlobus } from './entities/viagem-globus.entity';
import { ViagensGlobusService } from './services/viagens-globus.service';
import { ViagensGlobusController } from './controllers/viagens-globus.controller';
import { OracleModule } from '../database/oracle/oracle.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ViagemGlobus]),
    OracleModule, // ✅ IMPORTAR ORACLE MODULE
  ],
  controllers: [ViagensGlobusController],
  providers: [ViagensGlobusService],
  exports: [ViagensGlobusService],
})
export class ViagensGlobusModule {}