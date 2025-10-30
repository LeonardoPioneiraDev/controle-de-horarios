// src/comparacao-viagens/controllers/comparacao-viagens.controller.ts
import { Controller, Get, Post, Param, Query, HttpCode, HttpStatus, UseGuards, Logger } from '@nestjs/common';
import { ComparacaoViagensService } from '../services/comparacao-viagens.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { FiltrosComparacaoDto } from '../dto/filtros-comparacao.dto';

@Controller('comparacao-viagens')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ComparacaoViagensController {
  private readonly logger = new Logger(ComparacaoViagensController.name);

  constructor(
    private readonly comparacaoService: ComparacaoViagensService
  ) {}

  @Post('executar/:data')
  @Roles(UserRole.ANALISTA)
  async executarComparacao(@Param('data') data: string) {
    this.logger.log(`🔄 Iniciando comparação para data: ${data}`);

    try {
      const resultado = await this.comparacaoService.executarComparacao(data); // Corrected method name

      return {
        success: true,
        message: 'Comparação executada com sucesso',
        data: resultado,
        dataReferencia: data
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
  @Roles(UserRole.OPERADOR)
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
  @Roles(UserRole.OPERADOR)
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
  @Roles(UserRole.OPERADOR)
  async obterLinhasComparadas(@Param('data') data: string) {
    try {
      // TODO: Implementar busca de linhas únicas comparadas
      return {
        success: true,
        message: 'Linhas comparadas obtidas',
        data: [],
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
