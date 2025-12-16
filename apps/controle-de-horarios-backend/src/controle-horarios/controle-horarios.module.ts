import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ControleHorario } from './entities/controle-horario.entity';
import { ControleHorarioChange } from './entities/controle-horario-change.entity';
import { UserFilter } from './entities/user-filter.entity';
import { ChNotification } from './entities/ch-notification.entity';
import { ControleHorariosService } from './services/controle-horarios.service';
import { NotificacoesService } from './services/notificacoes.service';
import { NotificacoesController } from './controllers/notificacoes.controller';
import { UserFiltersService } from './services/user-filters.service';
import { ControleHorariosController } from './controllers/controle-horarios.controller';
import { UserFiltersController } from './controllers/user-filters.controller';
import { OracleModule } from '../database/oracle/oracle.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ControleHorario, ControleHorarioChange, UserFilter, ChNotification]),
    OracleModule,
  ],
  controllers: [ControleHorariosController, UserFiltersController, NotificacoesController],
  providers: [ControleHorariosService, UserFiltersService, NotificacoesService],
  exports: [ControleHorariosService],
})
export class ControleHorariosModule { }
