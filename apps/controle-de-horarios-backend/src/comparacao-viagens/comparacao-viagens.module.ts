// src/comparacao-viagens/comparacao-viagens.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComparacaoViagem } from './entities/comparacao-viagem.entity';
import { ViagemTransdata } from '../viagens-transdata/entities/viagem-transdata.entity';
import { ViagemGlobus } from '../viagens-globus/entities/viagem-globus.entity';
import { ComparacaoViagensService } from './services/comparacao-viagens.service';
import { ComparacaoViagensController } from './controllers/comparacao-viagens.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ComparacaoViagem,
      ViagemTransdata,
      ViagemGlobus
    ])
  ],
  controllers: [ComparacaoViagensController],
  providers: [ComparacaoViagensService],
  exports: [ComparacaoViagensService]
})
export class ComparacaoViagensModule {}