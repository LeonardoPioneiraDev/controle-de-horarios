// src/modules/controle-horarios/controllers/controle-horarios.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { ControleHorariosService } from '../services/controle-horarios.service';
import {
  FiltrosControleHorariosDto,
  SalvarControleHorariosDto,
  SalvarMultiplosControleHorariosDto,
  ControleHorarioResponseDto,
  OpcoesControleHorariosDto,
} from '../dto';

@Controller('controle-horarios')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ControleHorariosController {
  private readonly logger = new Logger(ControleHorariosController.name);

  constructor(private readonly controleHorariosService: ControleHorariosService) {}

  @Get(':data')
  @Roles(UserRole.OPERADOR)
  async buscarControleHorarios(
    @Param('data') data: string,
    @Query() filtros: FiltrosControleHorariosDto,
    @CurrentUser('email') usuarioEmail: string,
  ): Promise<ControleHorarioResponseDto> {
    try {
      this.logger.log(`🔍 [${usuarioEmail}] Buscando controle de horários para ${data}`);
      
      return await this.controleHorariosService.buscarControleHorarios(data, filtros, usuarioEmail);
    } catch (error) {
      this.logger.error(`❌ Erro ao buscar controle de horários: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          message: 'Erro ao buscar controle de horários',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':data/salvar')
  @Roles(UserRole.OPERADOR)
  async salvarControleHorario(
    @Param('data') data: string,
    @Body() dados: SalvarControleHorariosDto,
    @CurrentUser('email') usuarioEmail: string,
  ) {
    try {
      this.logger.log(`💾 [${usuarioEmail}] Salvando controle para viagem ${dados.viagemGlobusId}`);
      
      return await this.controleHorariosService.salvarControleHorario(data, dados, usuarioEmail);
    } catch (error) {
      this.logger.error(`❌ Erro ao salvar controle: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          message: 'Erro ao salvar controle de horário',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('salvar-multiplos')
  @Roles(UserRole.OPERADOR)
  async salvarMultiplosControles(
    @Body() dados: SalvarMultiplosControleHorariosDto,
    @CurrentUser('email') usuarioEmail: string,
  ) {
    try {
      this.logger.log(`💾 [${usuarioEmail}] Salvando múltiplos controles para ${dados.dataReferencia}`);
      this.logger.log(`📊 Total de controles a salvar: ${dados.controles.length}`);
      
      return await this.controleHorariosService.salvarMultiplosControles(dados, usuarioEmail);
    } catch (error) {
      this.logger.error(`❌ Erro ao salvar múltiplos controles: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          message: 'Erro ao salvar controles de horário',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':data/opcoes')
  @Roles(UserRole.OPERADOR)
  async buscarOpcoesControleHorarios(
    @Param('data') data: string,
    @CurrentUser('email') usuarioEmail: string,
  ): Promise<{ success: boolean; message: string; data: OpcoesControleHorariosDto }> {
    try {
      this.logger.log(`�� [${usuarioEmail}] Buscando opções para filtros da data ${data}`);
      
      const opcoes = await this.controleHorariosService.buscarOpcoesControleHorarios(data);
      
      return {
        success: true,
        message: 'Opções obtidas com sucesso',
        data: opcoes,
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao buscar opções: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          message: 'Erro ao buscar opções para filtros',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':data/estatisticas')
  @Roles(UserRole.OPERADOR)
  async obterEstatisticas(
    @Param('data') data: string,
    @CurrentUser('email') usuarioEmail: string,
  ) {
    try {
      this.logger.log(`📊 [${usuarioEmail}] Obtendo estatísticas para ${data}`);
      
      const estatisticas = await this.controleHorariosService.obterEstatisticasControleHorarios(data);
      
      return {
        success: true,
        message: 'Estatísticas obtidas com sucesso',
        data: estatisticas,
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao obter estatísticas: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          message: 'Erro ao obter estatísticas',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':data/status')
  @Roles(UserRole.OPERADOR)
  async verificarStatusDados(
    @Param('data') data: string,
    @CurrentUser('email') usuarioEmail: string,
  ) {
    try {
      this.logger.log(`🔍 [${usuarioEmail}] Verificando status dos dados para ${data}`);
      
      const estatisticas = await this.controleHorariosService.obterEstatisticasControleHorarios(data);
      
      return {
        success: true,
        message: 'Status dos dados obtido com sucesso',
        data: {
          existeViagensGlobus: estatisticas.totalViagens > 0,
          totalViagensGlobus: estatisticas.totalViagens,
          viagensEditadas: estatisticas.viagensEditadas,
          percentualEditado: estatisticas.percentualEditado,
          ultimaAtualizacao: estatisticas.ultimaAtualizacao,
        },
        dataReferencia: data,
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao verificar status: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          message: 'Erro ao verificar status dos dados',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('health')
  @Roles(UserRole.OPERADOR)
  async healthCheck(@CurrentUser('email') usuarioEmail: string) {
    try {
      this.logger.log(`🏥 [${usuarioEmail}] Health check do módulo Controle de Horários`);
      
      return {
        success: true,
        message: 'Módulo Controle de Horários funcionando',
        status: 'HEALTHY',
        timestamp: new Date().toISOString(),
        endpoints: {
          buscarControleHorarios: '/controle-horarios/{data}',
          salvarControle: '/controle-horarios/{data}/salvar',
          salvarMultiplos: '/controle-horarios/salvar-multiplos',
          opcoesFiltros: '/controle-horarios/{data}/opcoes',
          estatisticas: '/controle-horarios/{data}/estatisticas',
          statusDados: '/controle-horarios/{data}/status',
          healthCheck: '/controle-horarios/health',
        },
        permissoes: {
          roleMinima: 'operador',
          acessoCompleto: ['operador', 'analista', 'gerente', 'diretor', 'administrador'],
        },
      };
    } catch (error) {
      this.logger.error(`❌ Erro no health check: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          message: 'Erro no health check',
          status: 'UNHEALTHY',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}