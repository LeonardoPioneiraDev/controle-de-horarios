// src/comparacao-viagens/services/comparacao-viagens.scheduler.ts

import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ComparacaoViagensService } from './comparacao-viagens.service';

@Injectable()
export class ComparacaoViagensScheduler {
  private readonly logger = new Logger(ComparacaoViagensScheduler.name);

  constructor(private readonly comparacaoService: ComparacaoViagensService) {}

  // Executa diariamente às 04:30 (horário de São Paulo)
  @Cron('0 30 4 * * *', { timeZone: 'America/Sao_Paulo' })
  async executarComparacaoDiaria(): Promise<void> {
    const data = this.dataAtualSaoPaulo();
    this.logger.log(`[SCHEDULER][COMPARACAO] Iniciando comparação automática 04:30 para ${data}`);

    try {
      const start = Date.now();
      const resultado = await this.comparacaoService.executarComparacao(data);
      const durationMs = Date.now() - start;

      const [countsPorCombinacao, totals] = await Promise.all([
        this.comparacaoService.contarPorCombinacao(data),
        this.comparacaoService.contarTotaisOrigem(data),
      ]);

      await this.comparacaoService.salvarHistoricoComparacao({
        dataReferencia: data,
        resultado,
        durationMs,
        executedByUserId: null,
        executedByEmail: 'scheduler@system',
        countsPorCombinacao,
        totalTransdata: totals.totalTransdata,
        totalGlobus: totals.totalGlobus,
      });

      this.logger.log(`[SCHEDULER][COMPARACAO] Comparação automática concluída para ${data}`);
    } catch (error: any) {
      this.logger.error(
        `[SCHEDULER][COMPARACAO] Falha na comparação automática para ${data}: ${error?.message}`,
        error?.stack,
      );
    }
  }

  private dataAtualSaoPaulo(): string {
    const nowSp = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    const y = nowSp.getFullYear();
    const m = String(nowSp.getMonth() + 1).padStart(2, '0');
    const d = String(nowSp.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}

