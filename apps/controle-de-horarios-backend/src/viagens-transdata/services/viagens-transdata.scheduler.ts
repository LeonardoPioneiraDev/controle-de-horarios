// src/viagens-transdata/services/viagens-transdata.scheduler.ts

import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ViagensTransdataService } from './viagens-transdata.service';

@Injectable()
export class ViagensTransdataScheduler {
  private readonly logger = new Logger(ViagensTransdataScheduler.name);

  constructor(private readonly viagensService: ViagensTransdataService) {}

  // Executa diariamente às 04:00 da manhã (horário de São Paulo)
  @Cron('0 0 4 * * *', { timeZone: 'America/Sao_Paulo' })
  async sincronizarDiaria(): Promise<void> {
    const dataSaoPaulo = this.getDataAtualSaoPaulo();
    this.logger.log(`[SCHEDULER] Iniciando sincronização automática às 04:00 para data: ${dataSaoPaulo}`);

    try {
      const resultado = await this.viagensService.sincronizarViagensPorData(dataSaoPaulo);
      this.logger.log(
        `[SCHEDULER] Sincronização automática concluída para ${dataSaoPaulo}: ` +
          JSON.stringify(resultado)
      );
    } catch (error: any) {
      this.logger.error(
        `[SCHEDULER] Falha na sincronização automática para ${dataSaoPaulo}: ${error?.message}`,
        error?.stack
      );
    }
  }

  private getDataAtualSaoPaulo(): string {
    // Converte a data atual para o fuso America/Sao_Paulo de forma confiável
    const agoraSp = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    const ano = agoraSp.getFullYear();
    const mes = String(agoraSp.getMonth() + 1).padStart(2, '0');
    const dia = String(agoraSp.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`; // YYYY-MM-DD
  }
}

