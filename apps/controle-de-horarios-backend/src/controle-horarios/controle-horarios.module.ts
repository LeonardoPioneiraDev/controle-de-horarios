import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ControleHorario } from './entities/controle-horario.entity';
import { ControleHorarioChange } from './entities/controle-horario-change.entity';
import { ControleHorariosService } from './services/controle-horarios.service';
import { ControleHorariosController } from './controllers/controle-horarios.controller';
import { OracleModule } from '../database/oracle/oracle.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ControleHorario, ControleHorarioChange]),
    OracleModule,
  ],
  controllers: [ControleHorariosController],
  providers: [ControleHorariosService],
  exports: [ControleHorariosService],
})
export class ControleHorariosModule {}
