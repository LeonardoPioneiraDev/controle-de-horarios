import { Controller, Get, Param, HttpCode, HttpStatus, UseGuards, Logger, Query, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BcoAlteracoesService } from '../services/bco-alteracoes.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@ApiTags('BCO Alterações')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('bco-alteracoes')
@Roles(UserRole.ADMINISTRADOR, UserRole.ESTATISTICA)
export class BcoAlteracoesController {
  private readonly logger = new Logger(BcoAlteracoesController.name);

  constructor(private readonly service: BcoAlteracoesService) { }

  @Get(':data/verificar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verificar alterações (Oracle) e salvar resumo por data' })
  @ApiResponse({ status: 200, description: 'Resumo salvo/atualizado com sucesso' })
  async verificar(@Param('data') data: string) {
    const start = Date.now();
    const resumo = await this.service.verificarAlteracoesPorData(data);
    const execMs = Date.now() - start;

    return {
      success: true,
      message: 'Resumo de alterações obtido e salvo',
      data: resumo,
      executionTime: `${execMs}ms`,
    };
  }

  @Get(':data')
  @Roles(UserRole.ANALISTA, UserRole.GERENTE, UserRole.DIRETOR, UserRole.ADMINISTRADOR, UserRole.ESTATISTICA)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obter resumo salvo no PostgreSQL por data' })
  @ApiResponse({ status: 200, description: 'Resumo retornado do PostgreSQL' })
  async obterResumo(@Param('data') data: string) {
    const start = Date.now();
    const resumo = await this.service.obterResumoPorData(data);
    const execMs = Date.now() - start;

    return {
      success: true,
      message: resumo ? 'Resumo encontrado' : 'Nenhum resumo encontrado para a data',
      data: resumo,
      executionTime: `${execMs}ms`,
    };
  }

  @Get(':data/listar')
  @Roles(UserRole.ANALISTA, UserRole.GERENTE, UserRole.DIRETOR, UserRole.ADMINISTRADOR, UserRole.ESTATISTICA)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar documentos alterados ou pendentes por data' })
  @ApiResponse({ status: 200, description: 'Lista retornada do Oracle' })
  async listar(
    @Param('data') data: string,
    @Query('status') status: 'alteradas' | 'pendentes' = 'alteradas',
    @Query('limite') limite?: string,
    @Query('page') page?: string,
    @Query('prefixoVeiculo') prefixoVeiculo?: string,
  ) {
    if (status !== 'alteradas' && status !== 'pendentes') {
      throw new BadRequestException("Parâmetro 'status' deve ser 'alteradas' ou 'pendentes'");
    }

    const start = Date.now();
    const parsedLimite = limite ? parseInt(limite, 10) : undefined;
    const parsedPage = page ? parseInt(page, 10) : undefined;
    const result = await this.service.listarPorData(data, status, {
      limite: parsedLimite,
      page: parsedPage,
      prefixoVeiculo,
    });
    const execMs = Date.now() - start;

    return {
      success: true,
      message: `Lista de ${status} para ${data}`,
      ...result,
      executionTime: `${execMs}ms`,
    };
  }
}
