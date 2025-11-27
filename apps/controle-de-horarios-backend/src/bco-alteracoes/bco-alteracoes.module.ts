import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BcoAlteracoesResumo } from './entities/bco-alteracoes-resumo.entity';
import { BcoAlteracoesItem } from './entities/bco-alteracoes-item.entity';
import { BcoAlteracoesService } from './services/bco-alteracoes.service';
import { BcoAlteracoesController } from './controllers/bco-alteracoes.controller';
import { OracleModule } from '../database/oracle/oracle.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BcoAlteracoesResumo, BcoAlteracoesItem]),
    OracleModule,
  ],
  controllers: [BcoAlteracoesController],
  providers: [BcoAlteracoesService],
  exports: [BcoAlteracoesService],
})
export class BcoAlteracoesModule {}
