// src/comparacao-viagens/controllers/comparacao-viagens.controller.ts
import { Controller, Get, Post, Param, Query, HttpCode, HttpStatus, UseGuards, Logger, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ComparacaoViagensService } from '../services/comparacao-viagens.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { FiltrosComparacaoDto } from '../dto/filtros-comparacao.dto';
import { ListarHistoricoQueryDto } from '../dto/historico-comparacao.dto';

@Controller('comparacao-viagens')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Comparação de Viagens')
@ApiBearerAuth()
export class ComparacaoViagensController {
  private readonly logger = new Logger(ComparacaoViagensController.name);

  constructor(
    private readonly comparacaoService: ComparacaoViagensService
  ) {}

  // Histórico de comparação - COLOCAR ENDPOINTS ESTÁTICOS ANTES DOS DINÂMICOS
  @Get('historico')
  @Roles(UserRole.ANALISTA, UserRole.GERENTE, UserRole.DIRETOR, UserRole.ADMINISTRADOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar histórico de execuções de comparação' })
  @ApiQuery({ name: 'data', required: false })
  @ApiQuery({ name: 'dataInicial', required: false })
  @ApiQuery({ name: 'dataFinal', required: false })
  @ApiQuery({ name: 'executedByEmail', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async listarHistorico(@Query() query: ListarHistoricoQueryDto) {
    try {
      const { items, total } = await this.comparacaoService.listarHistorico(query);
      return {
        success: true,
        message: 'Histórico obtido com sucesso',
        data: items,
        total,
        page: query.page || 1,
        limit: query.limit || 20,
      };
    } catch (error) {
      this.logger.error(`Erro ao listar histórico: ${error.message}`);
      return { success: false, message: 'Falha ao listar histórico' };
    }
  }

  @Get('historico/ultimo')
  @Roles(UserRole.ANALISTA, UserRole.GERENTE, UserRole.DIRETOR, UserRole.ADMINISTRADOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obter a última execução do histórico por data' })
  @ApiQuery({ name: 'data', required: true, description: 'Data de referência YYYY-MM-DD' })
  async obterUltimoHistorico(@Query('data') data: string) {
    try {
      const item = await this.comparacaoService.obterUltimoHistoricoPorData(data);
      if (!item) {
        return { success: false, message: 'Nenhuma execução encontrada para a data', dataReferencia: data };
      }
      return { success: true, data: item, dataReferencia: data };
    } catch (error) {
      this.logger.error(`Erro ao obter último histórico: ${error.message}`);
      return { success: false, message: 'Falha ao obter último histórico', dataReferencia: data };
    }
  }

  @Get('historico/:id')
  @Roles(UserRole.ANALISTA, UserRole.GERENTE, UserRole.DIRETOR, UserRole.ADMINISTRADOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obter detalhe de uma execução do histórico' })
  async obterHistoricoPorId(@Param('id') id: string) {
    const item = await this.comparacaoService.obterHistoricoPorId(id);
    if (!item) {
      return { success: false, message: 'Histórico não encontrado' };
    }
    return { success: true, data: item };
  }

  @Post('executar/:data')
  @Roles(UserRole.ANALISTA)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Executar comparação e salvar histórico' })
  @ApiResponse({ status: 200, description: 'Comparação executada e histórico salvo (retorna historyId)' })
  async executarComparacao(@Param('data') data: string, @Req() req: any) {
    this.logger.log(`🔄 Iniciando comparação para data: ${data}`);

    try {
      const start = Date.now();
      const resultado = await this.comparacaoService.executarComparacao(data);
      const durationMs = Date.now() - start;

      const [countsPorCombinacao, totals] = await Promise.all([
        this.comparacaoService.contarPorCombinacao(data),
        this.comparacaoService.contarTotaisOrigem(data),
      ]);

      const historyId = await this.comparacaoService.salvarHistoricoComparacao({
        dataReferencia: data,
        resultado,
        durationMs,
        executedByUserId: req?.user?.sub,
        executedByEmail: req?.user?.email,
        countsPorCombinacao,
        totalTransdata: totals.totalTransdata,
        totalGlobus: totals.totalGlobus,
      });
      const historico = await this.comparacaoService.obterHistoricoPorId(historyId);

      return {
        success: true,
        message: 'Comparação executada com sucesso',
        data: resultado,
        dataReferencia: data,
        historyId,
        historico,
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao executar comparação: ${error.message}`);
      return {
        success: false,
        message: `Erro ao executar comparação: ${error.message}`,
        dataReferencia: data
      };
    }
  }

  @Get(':data')
  @Roles(UserRole.ANALISTA, UserRole.GERENTE, UserRole.DIRETOR, UserRole.ADMINISTRADOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar comparações da data' })
  @ApiQuery({ name: 'statusComparacao', required: false })
  @ApiQuery({ name: 'codigoLinha', required: false })
  @ApiQuery({ name: 'globusSetor', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'page', required: false })
  async buscarComparacoes(
    @Param('data') data: string,
    @Query() filtros: FiltrosComparacaoDto
  ) {
    try {
      const { comparacoes, total } = await this.comparacaoService.buscarComparacoes(data, filtros);

      return {
        success: true,
        message: 'Comparações encontradas',
        data: comparacoes,
        total,
        dataReferencia: data
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao buscar comparações: ${error.message}`);
      return {
        success: false,
        message: `Erro ao buscar comparações: ${error.message}`,
        dataReferencia: data
      };
    }
  }

  @Get(':data/estatisticas')
  @Roles(UserRole.ANALISTA, UserRole.GERENTE, UserRole.DIRETOR, UserRole.ADMINISTRADOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obter estatísticas da comparação por data' })
  async obterEstatisticas(@Param('data') data: string) {
    try {
      const estatisticas = await this.comparacaoService.obterEstatisticas(data);

      if (!estatisticas) {
        return {
          success: false,
          message: 'Nenhuma comparação encontrada para esta data',
          dataReferencia: data
        };
      }

      return {
        success: true,
        message: 'Estatísticas obtidas com sucesso',
        data: estatisticas,
        dataReferencia: data
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao obter estatísticas: ${error.message}`);
      return {
        success: false,
        message: `Erro ao obter estatísticas: ${error.message}`,
        dataReferencia: data
      };
    }
  }

  @Get(':data/linhas')
  @Roles(UserRole.ANALISTA, UserRole.GERENTE, UserRole.DIRETOR, UserRole.ADMINISTRADOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obter códigos de linha comparados na data' })
  async obterLinhasComparadas(@Param('data') data: string) {
    try {
      const linhas = await this.comparacaoService.obterCodigosLinha(data);
      return {
        success: true,
        message: 'Linhas comparadas obtidas',
        data: linhas,
        dataReferencia: data
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao obter linhas: ${error.message}`);
      return {
        success: false,
        message: `Erro ao obter linhas: ${error.message}`,
        dataReferencia: data
      };
    }
  }

}


