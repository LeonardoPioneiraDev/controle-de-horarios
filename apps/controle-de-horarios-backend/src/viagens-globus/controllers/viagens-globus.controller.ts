// src/viagens-globus/controllers/viagens-globus.controller.ts
import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Logger
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ViagensGlobusService } from '../services/viagens-globus.service';
import { FiltrosViagemGlobusDto } from '../dto/filtros-viagem-globus.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@ApiTags('Viagens Globus')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('viagens-globus')
export class ViagensGlobusController {
  private readonly logger = new Logger(ViagensGlobusController.name);

  constructor(
    private readonly viagensGlobusService: ViagensGlobusService,
  ) { }

  // ✅ BUSCAR VIAGENS POR DATA
  @Get(':data')
  @Roles(UserRole.ANALISTA, UserRole.GERENTE, UserRole.DIRETOR, UserRole.ADMINISTRADOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Buscar viagens Globus por data' })
  @ApiResponse({ status: 200, description: 'Viagens encontradas com sucesso' })
  async buscarViagensPorData(
    @Param('data') data: string,
    @Query() filtros: FiltrosViagemGlobusDto
  ) {
    this.logger.log(`🔍 Buscando viagens Globus para ${data}`);

    const startTime = Date.now();
    const viagens = await this.viagensGlobusService.buscarViagensPorData(data, filtros);
    const executionTime = Date.now() - startTime;



    return {
      success: true,
      message: 'Viagens encontradas com sucesso',
      data: viagens,
      count: viagens.length,
      executionTime: `${executionTime}ms`,
      source: 'POSTGRESQL',
      filters: filtros,
      sincronizado: false
    };
  }

  // ✅ BUSCAR VIAGENS COM FILTROS
  @Get(':data/filtrados')
  @Roles(UserRole.ANALISTA, UserRole.GERENTE, UserRole.DIRETOR, UserRole.ADMINISTRADOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Buscar viagens Globus com filtros avançados' })
  async buscarViagensComFiltros(
    @Param('data') data: string,
    @Query() filtros: FiltrosViagemGlobusDto
  ) {
    this.logger.log(`🔍 Buscando viagens Globus com filtros para ${data}`);

    const startTime = Date.now();
    const viagens = await this.viagensGlobusService.buscarViagensPorData(data, filtros);
    const executionTime = Date.now() - startTime;

    // ✅ INCLUIR ESTATÍSTICAS SE SOLICITADO
    let estatisticas = null;
    if (filtros.incluirEstatisticas) {
      estatisticas = await this.viagensGlobusService.obterEstatisticas(data);
    }

    return {
      success: true,
      message: 'Viagens filtradas encontradas com sucesso',
      data: viagens,
      count: viagens.length,
      executionTime: `${executionTime}ms`,
      source: 'POSTGRESQL',
      filters: filtros,
      ...(estatisticas && { statistics: estatisticas })
    };
  }

  // ✅ SINCRONIZAR VIAGENS MANUALMENTE
  @Post('sincronizar/:data')
  @Roles(UserRole.ADMINISTRADOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sincronizar viagens Globus manualmente (ADMINISTRADOR)' })
  async sincronizarViagens(@Param('data') data: string) {
    this.logger.log(`�� Iniciando sincronização manual para ${data}`);

    const startTime = Date.now();
    const resultado = await this.viagensGlobusService.sincronizarViagensPorData(data);
    const executionTime = Date.now() - startTime;

    return {
      success: true,
      message: 'Sincronização concluída com sucesso',
      data: {
        ...resultado,
        dataReferencia: data
      },
      executionTime: `${executionTime}ms`,
      source: 'ORACLE_GLOBUS'
    };
  }

  // ✅ OBTER STATUS DOS DADOS
  @Get(':data/status')
  @Roles(UserRole.ANALISTA, UserRole.GERENTE, UserRole.DIRETOR, UserRole.ADMINISTRADOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verificar status dos dados para uma data' })
  async obterStatusDados(@Param('data') data: string) {
    const status = await this.viagensGlobusService.obterStatusDados(data);

    return {
      success: true,
      message: 'Status dos dados obtido com sucesso',
      data: status,
      dataReferencia: data
    };
  }

  // ✅ OBTER CÓDIGOS DE LINHA
  @Get(':data/linhas')
  @Roles(UserRole.ANALISTA, UserRole.GERENTE, UserRole.DIRETOR, UserRole.ADMINISTRADOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obter códigos de linha únicos para uma data' })
  async obterCodigosLinha(@Param('data') data: string) {
    const linhas = await this.viagensGlobusService.obterCodigosLinha(data);

    return {
      success: true,
      message: 'Códigos de linha obtidos com sucesso',
      data: linhas,
      count: linhas.length,
      dataReferencia: data
    };
  }

  // ✅ OBTER SERVIÇOS ÚNICOS
  @Get(':data/servicos')
  @Roles(UserRole.ANALISTA, UserRole.GERENTE, UserRole.DIRETOR, UserRole.ADMINISTRADOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obter serviços únicos para uma data' })
  async obterServicosUnicos(@Param('data') data: string) {
    const servicos = await this.viagensGlobusService.obterServicosUnicos(data);

    return {
      success: true,
      message: 'Serviços únicos obtidos com sucesso',
      data: servicos,
      count: servicos.length,
      dataReferencia: data
    };
  }

  // ✅ OBTER SETORES ÚNICOS
  @Get(':data/setores')
  @Roles(UserRole.ANALISTA, UserRole.GERENTE, UserRole.DIRETOR, UserRole.ADMINISTRADOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obter setores únicos para uma data' })
  async obterSetoresUnicos(@Param('data') data: string) {
    const setores = await this.viagensGlobusService.obterSetoresUnicos(data);

    return {
      success: true,
      message: 'Setores únicos obtidos com sucesso',
      data: setores,
      count: setores.length,
      dataReferencia: data
    };
  }

  // ✅ TESTAR CONEXÃO ORACLE
  @Get('oracle/teste-conexao')
  @Roles(UserRole.GERENTE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Testar conexão com Oracle Globus' })
  async testarConexaoOracle() {
    this.logger.log(`🔧 Testando conexão Oracle Globus`);

    try {
      const resultado = await this.viagensGlobusService.testarConexaoOracle();

      return {
        success: resultado.success,
        message: resultado.message,
        data: {
          connected: resultado.success,
          ...(resultado.connectionInfo && { connectionInfo: resultado.connectionInfo }),
          timestamp: new Date().toISOString()
        }
      };
    } catch (error: any) {
      this.logger.error(`❌ Erro ao testar conexão Oracle: ${error.message}`);

      return {
        success: false,
        message: 'Erro ao testar conexão Oracle Globus',
        error: error.message,
        data: {
          connected: false,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  // ✅ OBTER ESTATÍSTICAS DO ORACLE
  @Get('oracle/estatisticas')
  @Roles(UserRole.GERENTE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obter estatísticas do Oracle Globus' })
  async obterEstatisticasOracle() {
    this.logger.log(`�� Obtendo estatísticas Oracle Globus`);

    try {
      const resultado = await this.viagensGlobusService.obterEstatisticasOracle();

      return {
        success: resultado.success,
        message: resultado.success ? 'Estatísticas Oracle Globus obtidas com sucesso' : resultado.message,
        data: resultado.data || {},
        timestamp: new Date().toISOString(),
        source: 'ORACLE_GLOBUS'
      };

    } catch (error: any) {
      this.logger.error(`❌ Erro ao obter estatísticas Oracle: ${error.message}`);

      return {
        success: false,
        message: 'Erro ao obter estatísticas Oracle Globus',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // ✅ HEALTH CHECK COMPLETO
  @Get('health')
  @Roles(UserRole.ANALISTA, UserRole.GERENTE, UserRole.DIRETOR, UserRole.ADMINISTRADOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Health check do sistema Globus' })
  async healthCheck() {
    this.logger.log(`🏥 Executando health check Globus`);

    try {
      const startTime = Date.now();

      // ✅ TESTAR POSTGRESQL
      const statusPostgres = await this.viagensGlobusService.obterStatusDados('2025-10-10');

      // ✅ TESTAR ORACLE
      const statusOracle = await this.viagensGlobusService.testarConexaoOracle();

      const executionTime = Date.now() - startTime;

      const statusGeral = statusOracle.success ? 'HEALTHY' : 'DEGRADED';

      return {
        success: true,
        message: 'Health check Globus executado',
        status: statusGeral,
        executionTime: `${executionTime}ms`,
        services: {
          postgresql: {
            status: 'HEALTHY',
            message: 'PostgreSQL funcionando',
            registrosExemplo: statusPostgres.totalRegistros
          },
          oracle: {
            status: statusOracle.success ? 'HEALTHY' : 'UNHEALTHY',
            message: statusOracle.message
          }
        },
        endpoints: {
          buscarViagens: '/viagens-globus/{data}',
          sincronizar: '/viagens-globus/sincronizar/{data}',
          status: '/viagens-globus/{data}/status',
          testeOracle: '/viagens-globus/oracle/teste-conexao',
          estatisticas: '/viagens-globus/oracle/estatisticas',
          healthCheck: '/viagens-globus/health'
        },
        timestamp: new Date().toISOString()
      };

    } catch (error: any) {
      this.logger.error(`❌ Erro no health check: ${error.message}`);

      return {
        success: false,
        message: 'Falha no health check Globus',
        status: 'UNHEALTHY',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // ✅ DEBUG ENDPOINT - INSPECIONAR LINHA
  @Get('debug/linha/:codigo')
  @Roles(UserRole.ANALISTA, UserRole.GERENTE, UserRole.DIRETOR, UserRole.ADMINISTRADOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Debug: Inspecionar dados de uma linha específica no Oracle' })
  async debugLinha(
    @Param('codigo') codigo: string,
    @Query('data') data?: string
  ) {
    const dataReferencia = data || new Date().toISOString().split('T')[0];
    this.logger.log(`🔍 Debug linha ${codigo} para data ${dataReferencia}`);

    try {
      const resultado = await this.viagensGlobusService.debugLinha(codigo, dataReferencia);

      return {
        success: resultado.success,
        message: resultado.success ? `Debug executado para linha ${codigo}` : resultado.message,
        data: resultado.data || [],
        query: resultado.query,
        codigoLinha: codigo,
        dataReferencia
      };
    } catch (error: any) {
      this.logger.error(`❌ Erro no debug da linha: ${error.message}`);

      return {
        success: false,
        message: 'Erro ao executar debug da linha',
        error: error.message,
        codigoLinha: codigo,
        dataReferencia
      };
    }
  }
}
