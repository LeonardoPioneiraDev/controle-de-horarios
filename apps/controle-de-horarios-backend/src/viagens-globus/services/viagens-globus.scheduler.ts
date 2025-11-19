// src/viagens-globus/services/viagens-globus.scheduler.ts

import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ViagensGlobusService } from './viagens-globus.service';

@Injectable()
export class ViagensGlobusScheduler {
  private readonly logger = new Logger(ViagensGlobusScheduler.name);

  constructor(private readonly viagensGlobusService: ViagensGlobusService) {}

  // Executa diariamente às 04:15 (horário de São Paulo)
  @Cron('0 15 4 * * *', { timeZone: 'America/Sao_Paulo' })
  async sincronizarDiaria(): Promise<void> {
    const dataSaoPaulo = this.getDataAtualSaoPaulo();
    this.logger.log(`[SCHEDULER][GLOBUS] Iniciando sincronização automática 04:15 para data: ${dataSaoPaulo}`);

    try {
      const resultado = await this.viagensGlobusService.sincronizarViagensPorData(dataSaoPaulo);
      this.logger.log(
        `[SCHEDULER][GLOBUS] Sincronização automática concluída para ${dataSaoPaulo}: ${JSON.stringify(resultado)}`,
      );
    } catch (error: any) {
      this.logger.error(
        `[SCHEDULER][GLOBUS] Falha na sincronização automática para ${dataSaoPaulo}: ${error?.message}`,
        error?.stack,
      );
    }
  }

  private getDataAtualSaoPaulo(): string {
    const agoraSp = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    const ano = agoraSp.getFullYear();
    const mes = String(agoraSp.getMonth() + 1).padStart(2, '0');
    const dia = String(agoraSp.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }
}

