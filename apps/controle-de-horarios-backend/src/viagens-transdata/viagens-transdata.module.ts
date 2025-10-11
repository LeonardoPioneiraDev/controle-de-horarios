// src/viagens-transdata/viagens-transdata.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ViagemTransdata } from './entities/viagem-transdata.entity';
import { ViagensTransdataController } from './controllers/viagens-transdata.controller';
import { ViagensTransdataService } from './services/viagens-transdata.service';
import { TransdataApiService } from './services/transdata-api.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ViagemTransdata]),
    ConfigModule,
  ],
  controllers: [ViagensTransdataController],
  providers: [
    ViagensTransdataService,
    TransdataApiService,
  ],
  exports: [
    ViagensTransdataService,
    TransdataApiService,
  ],
})
export class ViagensTransdataModule {}