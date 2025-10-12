import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ControleHorario } from './entities/controle-horario.entity';
import { ViagemGlobus } from '../viagens-globus/entities/viagem-globus.entity';
import { ControleHorariosController } from './controllers/controle-horarios.controller';
import { ControleHorariosService } from './services/controle-horarios.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ControleHorario,
      ViagemGlobus, // Importar para usar no service
    ]),
  ],
  controllers: [ControleHorariosController],
  providers: [ControleHorariosService],
  exports: [ControleHorariosService], // Exportar para uso em outros módulos
})
export class ControleHorariosModule {}