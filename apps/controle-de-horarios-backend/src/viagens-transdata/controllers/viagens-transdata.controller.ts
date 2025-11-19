// src/viagens-transdata/controllers/viagens-transdata.controller.ts

import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { ViagensTransdataService } from '../services/viagens-transdata.service';
import { TransdataApiService } from '../services/transdata-api.service';
import { ViagemTransdata } from '../entities/viagem-transdata.entity';
import { FiltrosViagemTransdataDto } from '../dto/filtros-viagem-transdata.dto';
import { ViagemTransdataResponseDto, ResponsePaginadaDto } from '../dto/response-viagem-transdata.dto';

@ApiTags('Viagens Transdata')
@Controller('viagens-transdata')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ViagensTransdataController {
  private readonly logger = new Logger(ViagensTransdataController.name);

  constructor(
    private readonly viagensService: ViagensTransdataService,
    private readonly transdataApiService: TransdataApiService,
  ) {}

  /**
   * ROTA 1: BUSCAR TODAS AS VIAGENS DE UMA DATA
   */
  @Get(':data')
  @Roles(
    UserRole.ANALISTA,
    UserRole.GERENTE,
    UserRole.DIRETOR,
    UserRole.ADMINISTRADOR,
  )
  @ApiOperation({
    summary: 'Buscar todas as viagens de uma data',
    description:
      'Retorna todas as viagens programadas para a data especificada. Acesso: OPERADOR ou superior.',
  })
  @ApiParam({
    name: 'data',
    description: 'Data no formato YYYY-MM-DD',
    example: '2025-10-10',
  })
  @ApiResponse({
    status: 200,
    description: 'Viagens encontradas com sucesso',
    type: [ViagemTransdataResponseDto],
  })
  @ApiResponse({ status: 400, description: 'Formato de data inválido' })
  @ApiResponse({ status: 502, description: 'Erro na API Transdata' })
  async buscarViagensPorData(
    @Param('data') data: string,
  ): Promise<ViagemTransdata[]> {
    this.logger.log(`[CONTROLLER] Buscando viagens para data: ${data}`);

    if (!this.validarFormatoData(data)) {
      throw new BadRequestException('Formato de data inválido. Use YYYY-MM-DD');
    }

    try {
      const viagens = await this.viagensService.buscarViagensPorData(data);
      this.logger.log(
        `[CONTROLLER] Retornando ${viagens.length} viagens para ${data}`,
      );
      return viagens;
    } catch (error: any) {
      this.logger.error(
        `[CONTROLLER] Erro ao buscar viagens para ${data}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * ROTA 2: BUSCAR VIAGENS COM FILTROS
   */
  @Get(':data/filtrados')
  @Roles(
    UserRole.ANALISTA,
    UserRole.GERENTE,
    UserRole.DIRETOR,
    UserRole.ADMINISTRADOR,
  )
  @ApiOperation({
    summary: 'Buscar viagens com filtros',
    description:
      'Retorna viagens filtradas por diversos critérios. Acesso: OPERADOR ou superior.',
  })
  @ApiParam({
    name: 'data',
    description: 'Data no formato YYYY-MM-DD',
    example: '2025-10-10',
  })
  @ApiResponse({
    status: 200,
    description: 'Viagens filtradas encontradas',
    type: ResponsePaginadaDto,
  })
  async buscarViagensComFiltros(
    @Param('data') data: string,
    @Query() filtros: FiltrosViagemTransdataDto,
  ): Promise<ResponsePaginadaDto<ViagemTransdata>> {
    this.logger.log(
      `[CONTROLLER] Buscando viagens filtradas para data: ${data}`,
      filtros,
    );

    if (!this.validarFormatoData(data)) {
      throw new BadRequestException('Formato de data inválido. Use YYYY-MM-DD');
    }

    try {
      const resultado = await this.viagensService.buscarViagensComFiltros(
        data,
        filtros,
      );
      this.logger.log(
        `[CONTROLLER] Retornando ${resultado.data.length}/${resultado.total} viagens filtradas`,
      );
      return resultado;
    } catch (error: any) {
      this.logger.error(
        `[CONTROLLER] Erro ao buscar viagens filtradas: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * ROTA 3: SINCRONIZAÇÃO MANUAL (ADMINISTRADOR)
   */
  @Post('sincronizar/:data')
  @Roles(UserRole.ADMINISTRADOR) // Somente administradores podem sincronizar manualmente
  @ApiOperation({
    summary: 'Sincronizar viagens manualmente',
    description:
      'Força a sincronização das viagens com a API Transdata. Acesso: ADMINISTRADOR.',
  })
  @ApiParam({
    name: 'data',
    description: 'Data no formato YYYY-MM-DD',
    example: '2025-10-10',
  })
  @ApiResponse({
    status: 200,
    description: 'Sincronização realizada com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        data: { type: 'string' },
        sincronizadas: { type: 'number' },
        novas: { type: 'number' },
        atualizadas: { type: 'number' },
        desativadas: { type: 'number' },
        timestamp: { type: 'string' },
      },
    },
  })
  async sincronizarViagensPorData(
    @Param('data') data: string,
  ): Promise<{
    message: string;
    data: string;
    sincronizadas: number;
    novas: number;
    atualizadas: number;
    desativadas: number;
    timestamp: string;
  }> {
    this.logger.log(
      `[CONTROLLER] Iniciando sincronização manual para data: ${data}`,
    );

    if (!this.validarFormatoData(data)) {
      throw new BadRequestException('Formato de data inválido. Use YYYY-MM-DD');
    }

    try {
      const resultado = await this.viagensService.sincronizarViagensPorData(
        data,
      );

      const response = {
        message: 'Sincronização realizada com sucesso',
        data,
        ...resultado,
        desativadas: resultado.desativadas,
        timestamp: new Date().toISOString(),
      };

      this.logger.log(
        `[CONTROLLER] Sincronização manual concluída: ${JSON.stringify(
          response,
        )}`,
      );
      return response;
    } catch (error: any) {
      this.logger.error(
        `[CONTROLLER] Erro na sincronização manual: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * ROTA 4: OBTER CÓDIGOS DE LINHA ÚNICOS
   */
  @Get(':data/linhas')
  @Roles(
    UserRole.ANALISTA,
    UserRole.GERENTE,
    UserRole.DIRETOR,
    UserRole.ADMINISTRADOR,
  )
  @ApiOperation({
    summary: 'Obter códigos de linha únicos',
    description:
      'Retorna lista de códigos de linha únicos. Acesso: OPERADOR ou superior.',
  })
  @ApiParam({
    name: 'data',
    description: 'Data no formato YYYY-MM-DD',
    example: '2025-10-10',
  })
  @ApiResponse({
    status: 200,
    description: 'Códigos de linha encontrados',
    schema: {
      type: 'object',
      properties: {
        data: { type: 'string' },
        linhas: { type: 'array', items: { type: 'string' } },
        total: { type: 'number' },
      },
    },
  })
  async obterCodigosLinha(
    @Param('data') data: string,
  ): Promise<{ data: string; linhas: string[]; total: number }> {
    this.logger.log(
      `[CONTROLLER] Buscando códigos de linha para data: ${data}`,
    );

    if (!this.validarFormatoData(data)) {
      throw new BadRequestException('Formato de data inválido. Use YYYY-MM-DD');
    }

    try {
      const linhas = await this.viagensService.obterCodigosLinha(data);
      return {
        data,
        linhas,
        total: linhas.length,
      };
    } catch (error: any) {
      this.logger.error(
        `[CONTROLLER] Erro ao buscar códigos de linha: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * ROTA 5: OBTER SERVIÇOS ÚNICOS
   */
  @Get(':data/servicos')
  @Roles(
    UserRole.ANALISTA,
    UserRole.GERENTE,
    UserRole.DIRETOR,
    UserRole.ADMINISTRADOR,
  )
  @ApiOperation({
    summary: 'Obter serviços únicos',
    description:
      'Retorna lista de números de serviço únicos. Acesso: OPERADOR ou superior.',
  })
  @ApiParam({
    name: 'data',
    description: 'Data no formato YYYY-MM-DD',
    example: '2025-10-10',
  })
  @ApiResponse({
    status: 200,
    description: 'Serviços encontrados',
    schema: {
      type: 'object',
      properties: {
        data: { type: 'string' },
        servicos: { type: 'array', items: { type: 'number' } },
        total: { type: 'number' },
      },
    },
  })
  async obterServicos(
    @Param('data') data: string,
  ): Promise<{ data: string; servicos: number[]; total: number }> {
    this.logger.log(`[CONTROLLER] Buscando serviços para data: ${data}`);

    if (!this.validarFormatoData(data)) {
      throw new BadRequestException('Formato de data inválido. Use YYYY-MM-DD');
    }

    try {
      const servicos = await this.viagensService.obterServicos(data);
      return {
        data,
        servicos,
        total: servicos.length,
      };
    } catch (error: any) {
      this.logger.error(
        `[CONTROLLER] Erro ao buscar serviços: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * ROTA 6: VERIFICAR STATUS DOS DADOS
   */
  @Get(':data/status')
  @Roles(
    UserRole.ANALISTA,
    UserRole.GERENTE,
    UserRole.DIRETOR,
    UserRole.ADMINISTRADOR,
  )
  @ApiOperation({
    summary: 'Verificar status dos dados',
    description:
      'Verifica se existem dados locais para a data. Acesso: OPERADOR ou superior.',
  })
  @ApiParam({
    name: 'data',
    description: 'Data no formato YYYY-MM-DD',
    example: '2025-10-10',
  })
  @ApiResponse({
    status: 200,
    description: 'Status dos dados',
    schema: {
      type: 'object',
      properties: {
        data: { type: 'string' },
        existemDados: { type: 'boolean' },
        totalViagens: { type: 'number' },
        ultimaSincronizacao: { type: 'string' },
      },
    },
  })
  async verificarStatusDados(
    @Param('data') data: string,
  ): Promise<{
    data: string;
    existemDados: boolean;
    totalViagens?: number;
    ultimaSincronizacao?: string;
  }> {
    this.logger.log(`[CONTROLLER] Verificando status dos dados para: ${data}`);

    if (!this.validarFormatoData(data)) {
      throw new BadRequestException('Formato de data inválido. Use YYYY-MM-DD');
    }

    try {
      const existemDados = await this.viagensService.verificarDadosExistem(
        data,
      );

      if (!existemDados) {
        return {
          data,
          existemDados: false,
        };
      }

      const viagens = await this.viagensService.buscarViagensPorData(data);
      const ultimaSincronizacao =
        viagens.length > 0 ? viagens[0].ultimaSincronizacao?.toISOString() : null;

      return {
        data,
        existemDados: true,
        totalViagens: viagens.length,
        ultimaSincronizacao,
      };
    } catch (error: any) {
      this.logger.error(
        `[CONTROLLER] Erro ao verificar status: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * ROTA 7: TESTAR CONEXÃO COM API TRANSDATA
   */
  @Get('api/teste-conexao')
  @Roles(UserRole.GERENTE) // Requer nível gerente ou superior
  @ApiOperation({
    summary: 'Testar conexão com API Transdata',
    description:
      'Testa a conectividade com a API Transdata. Acesso: GERENTE ou superior.',
  })
  @ApiResponse({ status: 200, description: 'Teste de conexão realizado' })
  async testarConexaoApi(): Promise<{
    success: boolean;
    message: string;
    responseTime?: number;
    timestamp: string;
  }> {
    this.logger.log(`[CONTROLLER] Testando conexão com API Transdata`);

    try {
      const resultado = await this.transdataApiService.testarConexao();
      return {
        ...resultado,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      this.logger.error(
        `[CONTROLLER] Erro no teste de conexão: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * ROTA 8: OBTER ESTATÍSTICAS DA API
   */
  @Get('api/estatisticas')
  @Roles(UserRole.GERENTE) // Requer nível gerente ou superior
  @ApiOperation({
    summary: 'Obter estatísticas da API Transdata',
    description:
      'Retorna configurações e estatísticas da API. Acesso: GERENTE ou superior.',
  })
  @ApiResponse({ status: 200, description: 'Estatísticas da API' })
  async obterEstatisticasApi(): Promise<any> {
    this.logger.log(`[CONTROLLER] Obtendo estatísticas da API Transdata`);

    try {
      const estatisticas = await this.transdataApiService.obterEstatisticas();
      return {
        ...estatisticas,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      this.logger.error(
        `[CONTROLLER] Erro ao obter estatísticas: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * VALIDAR FORMATO DA DATA
   */
  private validarFormatoData(data: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(data)) return false;

    const date = new Date(data + 'T00:00:00.000Z');
    return date instanceof Date && !isNaN(date.getTime());
  }
}

