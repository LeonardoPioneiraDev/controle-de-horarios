import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ControleHorario } from './entities/controle-horario.entity';
import { ControleHorariosController } from './controllers/controle-horarios.controller';
import { ControleHorariosService } from './services/controle-horarios.service';
import { OracleModule } from '@/database/oracle/oracle.module'; // Importar OracleModule

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ControleHorario,
    ]),
    OracleModule, // Adicionar OracleModule
  ],
  controllers: [ControleHorariosController],
  providers: [ControleHorariosService],
  exports: [ControleHorariosService], // Exportar para uso em outros módulos
})
export class ControleHorariosModule {}