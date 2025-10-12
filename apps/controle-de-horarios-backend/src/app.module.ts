import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { EmailModule } from './email/email.module';
import { ViagensTransdataModule } from './viagens-transdata/viagens-transdata.module';
import { ViagensGlobusModule } from './viagens-globus/viagens-globus.module';
import { ComparacaoViagensModule } from './comparacao-viagens/comparacao-viagens.module';
import { ControleHorariosModule } from './controle-horarios/controle-horarios.module'; // ✅ ADICIONAR
import { OracleModule } from './database/oracle/oracle.module';
import { HealthController } from './health/health.controller';
import oracleConfig from './database/oracle/oracle.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [oracleConfig],
    }),
    DatabaseModule,
    UsersModule,
    AuthModule,
    EmailModule,
    ViagensTransdataModule,
    ViagensGlobusModule,
    ComparacaoViagensModule,
    ControleHorariosModule, // ✅ ADICIONAR
    OracleModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}