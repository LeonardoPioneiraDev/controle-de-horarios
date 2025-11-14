import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Logger,
  Patch,
  Body,
  Req,
  HttpException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ControleHorariosService } from '../services/controle-horarios.service';
import { FiltrosControleHorarioDto } from '../dto/filtros-controle-horario.dto';
import { UpdateControleHorarioDto } from '../dto/update-controle-horario.dto';
import { UpdateMultipleControleHorariosDto, SingleControleHorarioUpdateDto } from '../dto/update-multiple-controle-horarios.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@ApiTags('Controle de Horários')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('controle-horarios')
export class ControleHorariosController {
  private readonly logger = new Logger(ControleHorariosController.name);

  constructor(
    private readonly controleHorariosService: ControleHorariosService,
  ) {}

  @Get(':data')
  @Roles(UserRole.OPERADOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Buscar controle de horários por data', description: 'Quando o parâmetro editado_por_usuario_email é informado, a resposta é limitada a viagens que foram confirmadas (de_acordo = true) e tiveram edição relevante (veículo e/ou substituições). Nessa visão, a regra de ocultar confirmadas após N segundos não é aplicada.' })
  @ApiResponse({ status: 200, description: 'Horários encontrados com sucesso' })
  async buscarControleHorariosPorData(
    @Param('data') data: string,
    @Query() filtros: FiltrosControleHorarioDto,
  ) {
    this.logger.log(`🔍 Buscando controle de horários para ${data}`);

    const startTime = Date.now();
    const horarios = await this.controleHorariosService.buscarControleHorariosPorData(data, filtros);
    const executionTime = Date.now() - startTime;

    if (false && horarios.length === 0 && filtros.salvar_local !== false) {
      this.logger.log(`🔥 Nenhum horário encontrado, tentando sincronizar...`);

      try {
        await this.controleHorariosService.sincronizarControleHorariosPorData(data);
        const horariosAposSincronizacao = await this.controleHorariosService.buscarControleHorariosPorData(data, filtros);

        return {
          success: true,
          message: 'Horários sincronizados e encontrados com sucesso',
          data: horariosAposSincronizacao,
          count: horariosAposSincronizacao.length,
          executionTime: `${Date.now() - startTime}ms`,
          source: 'POSTGRESQL_AFTER_SYNC',
          filters: filtros,
          sincronizado: true,
        };
      } catch (error: any) {
        this.logger.error(`❌ Erro na sincronização automática: ${error.message}`);
      }
    }

    return {
      success: true,
      message: 'Horários encontrados com sucesso',
      data: horarios,
      count: horarios.length,
      executionTime: `${executionTime}ms`,
      source: 'POSTGRESQL',
      filters: filtros,
      sincronizado: false,
    };
  }

  @Post('sincronizar/:data')
  @Roles(UserRole.ANALISTA, UserRole.GERENTE, UserRole.DIRETOR, UserRole.ADMINISTRADOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sincronizar controle de horários manualmente' })
  async sincronizarControleHorarios(@Param('data') data: string) {
    this.logger.log(`🔄 Iniciando sincronização manual para ${data}`);

    const startTime = Date.now();
    const resultado = await this.controleHorariosService.sincronizarControleHorariosPorData(data);
    const executionTime = Date.now() - startTime;

    return {
      success: true,
      message: 'Sincronização concluída com sucesso',
      data: {
        ...resultado,
        dataReferencia: data,
      },
      executionTime: `${executionTime}ms`,
      source: 'ORACLE_GLOBUS',
    };
  }

  // Rota estática antes da dinâmica ':id' para evitar colisão
  // (movido acima de ':id')

  // Alias estático adicional para atualização em lote, garantindo prioridade sobre rota dinâmica ':id'
  @Patch('multiples-batch')
  @Roles(UserRole.FUNCIONARIO)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Atualizar múltiplos registros de controle de horário (alias estático)' })
  @ApiResponse({ status: 200, description: 'Registros atualizados com sucesso' })
  @ApiResponse({ status: 400, description: 'Requisição inválida' })
  async updateMultipleControleHorariosBatch(
    @Body() updateMultipleDto: UpdateMultipleControleHorariosDto,
    @Req() req: any,
  ) {
    this.logger.log(`🔄 Recebida requisição (alias) para atualizar múltiplos controles de horário`);
    try {
      const editorNome = req.user?.nome || 'Desconhecido';
      const editorEmail = req.user?.email || 'desconhecido@example.com';

      const results = await this.controleHorariosService.updateMultipleControleHorarios(
        updateMultipleDto.updates,
        editorNome,
        editorEmail,
      );
      return {
        success: true,
        message: 'Múltiplos registros de controle de horário atualizados com sucesso',
        data: results,
      };
    } catch (error: any) {
      this.logger.error(`❌ Erro ao atualizar múltiplos controles de horário (alias): ${error.message}`);
      throw new HttpException(
        {
          success: false,
          message: 'Falha ao atualizar múltiplos registros de controle de horário',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Patch(':id')
  @Roles(UserRole.FUNCIONARIO)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Atualizar um registro de controle de horário' })
  @ApiResponse({ status: 200, description: 'Registro atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado' })
  async updateControleHorario(
    @Param('id') id: string,
    @Body() updateControleHorarioDto: UpdateControleHorarioDto,
    @Req() req: any,
  ) {
    this.logger.log(`🔄 Recebida requisição para atualizar controle de horário ${id}`);
    try {
      const editorNome = req.user?.nome || 'Desconhecido';
      const editorEmail = req.user?.email || 'desconhecido@example.com';
      const userRole: any = req.user?.role || req.user?.perfil || UserRole.OPERADOR;
      if (userRole === UserRole.OPERADOR) {
        const allowedKeys = [
          'de_acordo',
          'hor_saida_ajustada',
          'hor_chegada_ajustada',
          'atraso_motivo',
          'atraso_observacao',
          'observacoes_edicao',
        ];
        const sanitized: any = {};
        for (const key of allowedKeys) {
          if (Object.prototype.hasOwnProperty.call(updateControleHorarioDto as any, key)) {
            sanitized[key] = (updateControleHorarioDto as any)[key];
          }
        }
        if (Object.keys(sanitized).length === 0) {
          throw new HttpException(
            {
              success: false,
              message: 'Operador não tem permissão para alterar esses campos',
              error: 'Campos não permitidos para OPERADOR',
            },
            HttpStatus.FORBIDDEN,
          );
        }
        updateControleHorarioDto = sanitized as any;
      }

      const updatedHorario = await this.controleHorariosService.updateControleHorario(
        id,
        updateControleHorarioDto,
        editorNome,
        editorEmail,
      );
      return {
        success: true,
        message: 'Registro de controle de horário atualizado com sucesso',
        data: updatedHorario,
      };
    } catch (error: any) {
      this.logger.error(`❌ Erro ao atualizar controle de horário ${id}: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          message: 'Falha ao atualizar registro de controle de horário',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Patch('multiples')
  @Roles(UserRole.FUNCIONARIO)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Atualizar múltiplos registros de controle de horário com propagação' })
  @ApiResponse({ status: 200, description: 'Registros atualizados com sucesso' })
  @ApiResponse({ status: 400, description: 'Requisição inválida' })
  async updateMultipleControleHorarios(
    @Body() updateMultipleDto: UpdateMultipleControleHorariosDto,
    @Req() req: any,
  ) {
    this.logger.log(`🔄 Recebida requisição para atualizar múltiplos controles de horário`);
    try {
      const editorNome = req.user?.nome || 'Desconhecido';
      const editorEmail = req.user?.email || 'desconhecido@example.com';
      const userRole: any = req.user?.role || req.user?.perfil || UserRole.OPERADOR;
      if (userRole === UserRole.OPERADOR) {
        const allowedKeys = [
          'de_acordo',
          'hor_saida_ajustada',
          'hor_chegada_ajustada',
          'atraso_motivo',
          'atraso_observacao',
          'observacoes_edicao',
        ];
        const sanitized: any = {};
        for (const key of allowedKeys) {
          if (Object.prototype.hasOwnProperty.call(updateMultipleDto as any, key)) {
            sanitized[key] = (updateMultipleDto as any)[key];
          }
        }
        if (Object.keys(sanitized).length === 0) {
          throw new HttpException(
            {
              success: false,
              message: 'Operador não tem permissão para alterar esses campos',
              error: 'Campos não permitidos para OPERADOR',
            },
            HttpStatus.FORBIDDEN,
          );
        }
        updateMultipleDto = sanitized as any;
      }

      const results = await this.controleHorariosService.updateMultipleControleHorarios(
        updateMultipleDto.updates,
        editorNome,
        editorEmail,
      );
      return {
        success: true,
        message: 'Múltiplos registros de controle de horário atualizados com sucesso',
        data: results,
      };
    } catch (error: any) {
      this.logger.error(`❌ Erro ao atualizar múltiplos controles de horário: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          message: 'Falha ao atualizar múltiplos registros de controle de horário',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get(':data/status')
  @Roles(UserRole.OPERADOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verificar status dos dados para uma data' })
  async obterStatusDados(@Param('data') data: string) {
    const status = await this.controleHorariosService.obterStatusDados(data);

    return {
      success: true,
      message: 'Status dos dados obtido com sucesso',
      data: status,
      dataReferencia: data,
    };
  }

  @Get(':data/linhas')
  @Roles(UserRole.OPERADOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obter códigos de linha únicos para uma data' })
  async obterCodigosLinha(@Param('data') data: string) {
    const linhas = await this.controleHorariosService.obterCodigosLinha(data);

    return {
      success: true,
      message: 'Códigos de linha obtidos com sucesso',
      data: linhas,
      count: linhas.length,
      dataReferencia: data,
    };
  }

  @Get(':data/servicos')
  @Roles(UserRole.OPERADOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obter serviços únicos para uma data' })
  async obterServicosUnicos(@Param('data') data: string) {
    const servicos = await this.controleHorariosService.obterServicosUnicos(data);

    return {
      success: true,
      message: 'Serviços únicos obtidos com sucesso',
      data: servicos,
      count: servicos.length,
      dataReferencia: data,
    };
  }

  @Get(':data/setores')
  @Roles(UserRole.OPERADOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obter setores únicos para uma data' })
  async obterSetoresUnicos(@Param('data') data: string) {
    const setores = await this.controleHorariosService.obterSetoresUnicos(data);

    return {
      success: true,
      message: 'Setores únicos obtidos com sucesso',
      data: setores,
      count: setores.length,
      dataReferencia: data,
    };
  }

  @Get(':data/atividades')
  @Roles(UserRole.OPERADOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obter atividades únicas para uma data' })
  async obterAtividadesUnicas(@Param('data') data: string) {
    const atividades = await this.controleHorariosService.obterAtividadesUnicas(data);

    return {
      success: true,
      message: 'Atividades únicas obtidas com sucesso',
      data: atividades,
      count: atividades.length,
      dataReferencia: data,
    };
  }

  @Get(':data/tipos-dia')
  @Roles(UserRole.OPERADOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obter tipos de dia únicos para uma data' })
  async obterTiposDiaUnicos(@Param('data') data: string) {
    const tiposDia = await this.controleHorariosService.obterTiposDiaUnicos(data);

    return {
      success: true,
      message: 'Tipos de dia únicos obtidos com sucesso',
      data: tiposDia,
      count: tiposDia.length,
      dataReferencia: data,
    };
  }

  @Get(':data/opcoes')
  @Roles(UserRole.OPERADOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obter todas as opções de filtro para uma data' })
  async obterOpcoesFiltro(@Param('data') data: string) {
    this.logger.log(`🔍 Buscando opções de filtro para ${data}`);

    const [linhas, servicos, setores, atividades, tiposDia] = await Promise.all([
      this.controleHorariosService.obterCodigosLinha(data),
      this.controleHorariosService.obterServicosUnicos(data),
      this.controleHorariosService.obterSetoresUnicos(data),
      this.controleHorariosService.obterAtividadesUnicas(data),
      this.controleHorariosService.obterTiposDiaUnicos(data),
    ]);

    return {
      success: true,
      message: 'Opções de filtro obtidas com sucesso',
      data: {
        linhas,
        servicos,
        setores,
        atividades,
        tiposDia,
      },
      dataReferencia: data,
    };
  }

  @Get('oracle/teste-conexao')
  @Roles(UserRole.GERENTE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Testar conexão com Oracle Globus' })
  async testarConexaoOracle() {
    this.logger.log(`🔧 Testando conexão Oracle Globus`);

    try {
      const resultado = await this.controleHorariosService.testarConexaoOracle();

      return {
        success: resultado.success,
        message: resultado.message,
        data: {
          connected: resultado.success,
          ...(resultado.connectionInfo && { connectionInfo: resultado.connectionInfo }),
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error: any) {
      this.logger.error(`❌ Erro ao testar conexão Oracle: ${error.message}`);

      return {
        success: false,
        message: 'Erro ao testar conexão Oracle Globus',
        error: error.message,
        data: {
          connected: false,
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  @Get('oracle/estatisticas/:data')
  @Roles(UserRole.GERENTE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obter estatísticas do Oracle Globus' })
  async obterEstatisticasOracle(@Param('data') data: string) {
    this.logger.log(`📊 Obtendo estatísticas Oracle Globus para ${data}`);

    try {
      const resultado = await this.controleHorariosService.obterEstatisticasOracle(data);

      return {
        success: resultado.success,
        message: resultado.success ? 'Estatísticas Oracle Globus obtidas com sucesso' : resultado.message,
        data: resultado.data || {},
        timestamp: new Date().toISOString(),
        source: 'ORACLE_GLOBUS',
      };
    } catch (error: any) {
      this.logger.error(`❌ Erro ao obter estatísticas Oracle: ${error.message}`);

      return {
        success: false,
        message: 'Erro ao obter estatísticas Oracle Globus',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('health')
  @Roles(UserRole.OPERADOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Health check do sistema de Controle de Horários' })
  async healthCheck() {
    this.logger.log(`🏥 Executando health check Controle de Horários`);

    try {
      const startTime = Date.now();

      const statusPostgres = await this.controleHorariosService.obterStatusDados('2025-10-10');

      const statusOracle = await this.controleHorariosService.testarConexaoOracle();

      const executionTime = Date.now() - startTime;

      const statusGeral = statusOracle.success ? 'HEALTHY' : 'DEGRADED';

      return {
        success: true,
        message: 'Health check Controle de Horários executado',
        status: statusGeral,
        executionTime: `${executionTime}ms`,
        services: {
          postgresql: {
            status: 'HEALTHY',
            message: 'PostgreSQL funcionando',
            registrosExemplo: statusPostgres.totalRegistros,
          },
          oracle: {
            status: statusOracle.success ? 'HEALTHY' : 'UNHEALTHY',
            message: statusOracle.message,
          },
        },
        endpoints: {
          buscarHorarios: '/controle-horarios/{data}',
          sincronizar: '/controle-horarios/sincronizar/{data}',
          status: '/controle-horarios/{data}/status',
          testeOracle: '/controle-horarios/oracle/teste-conexao',
          estatisticas: '/controle-horarios/oracle/estatisticas',
          healthCheck: '/controle-horarios/health',
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      this.logger.error(`❌ Erro no health check: ${error.message}`);

      return {
        success: false,
        message: 'Falha no health check Controle de Horários',
        status: 'UNHEALTHY',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
