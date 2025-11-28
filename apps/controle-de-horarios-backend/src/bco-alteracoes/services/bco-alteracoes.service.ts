import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { BcoAlteracoesResumo } from '../entities/bco-alteracoes-resumo.entity';
import { OracleService } from '../../database/oracle/services/oracle.service';
import { BcoAlteracoesItem } from '../entities/bco-alteracoes-item.entity';

export interface ResumoAlteracoesDTO {
  dataReferencia: string;
  totalDocumentos: number;
  totalAlteradas: number;
  totalPendentes: number;
  source: 'ORACLE_GLOBUS' | 'POSTGRESQL';
}

export interface ListaAlteracoesItemDTO {
  idbco: number;
  documento: string;
  logAlteracao: string | null;
  logAlteracaoFrq?: string | null;
  dataBco: string; // YYYY-MM-DD
  dataDigitacao: string | null; // YYYY-MM-DD
  digitador: string | null;
  prefixoVeiculo: string | null;
}

@Injectable()
export class BcoAlteracoesService {
  private readonly logger = new Logger(BcoAlteracoesService.name);

  constructor(
    @InjectRepository(BcoAlteracoesResumo)
    private readonly resumoRepo: Repository<BcoAlteracoesResumo>,
    @InjectRepository(BcoAlteracoesItem)
    private readonly itemRepo: Repository<BcoAlteracoesItem>,
    private readonly oracleService: OracleService,
  ) { }

  async verificarAlteracoesPorData(data: string): Promise<ResumoAlteracoesDTO & { novasAlteracoes?: number }> {
    this.logger.log(`Verificando alterações BCO para ${data}`);

    if (!this.oracleService.isEnabled()) {
      throw new Error('Oracle Globus desabilitado ou indisponível');
    }

    // 1. Buscar dados detalhados do Oracle
    const sql = `
      SELECT DISTINCT
        V.IDBCO,
        B.DOCUMENTOBCO,
        B.LOGALTERACAOBCO,
        B.LOGALTERACAOFRQ,
        TO_CHAR(B.DATABCO, 'YYYY-MM-DD') AS DATABCO,
        TO_CHAR(B.DATADIGITACAO, 'YYYY-MM-DD') AS DATADIGITACAO,
        B.DIGITADORBCO,
        C.PREFIXOVEIC
      FROM T_ARR_BCO B
      JOIN T_ARR_BCO_VIAGENS V ON B.IDBCO = V.IDBCO
      JOIN FRT_CADVEICULOS C ON V.CODIGOVEIC = C.CODIGOVEIC
      WHERE B.CODIGOEMPRESA = 4
        AND TRUNC(B.DATABCO) = TO_DATE(:data, 'YYYY-MM-DD')
    `;

    const rows = await this.oracleService.executeHeavyQuery<any>(sql, { data });

    const dataRef = new Date(data);
    let totalDocumentos = 0;
    let totalAlteradas = 0;

    const itens: Partial<BcoAlteracoesItem>[] = [];

    if (rows && rows.length > 0) {
      // Usar Map para garantir unicidade por IDBCO
      const uniqueItens = new Map<number, any>();
      for (const r of rows) {
        if (!uniqueItens.has(Number(r.IDBCO))) {
          uniqueItens.set(Number(r.IDBCO), r);
        }
      }

      totalDocumentos = uniqueItens.size;

      for (const r of uniqueItens.values()) {
        const logBcoRaw = r.LOGALTERACAOBCO ?? null;
        const logFrqRaw = r.LOGALTERACAOFRQ ?? null;
        const logAlteracaoBco = logBcoRaw && String(logBcoRaw).trim() !== '' ? String(logBcoRaw) : null;
        const logAlteracaoFrq = logFrqRaw && String(logFrqRaw).trim() !== '' ? String(logFrqRaw) : null;
        // Se tiver vazia ou null ainda não teve alteração
        const alterada = !!(logAlteracaoBco || logAlteracaoFrq);

        if (alterada) {
          totalAlteradas++;
        }

        itens.push({
          dataReferencia: dataRef,
          idbco: Number(r.IDBCO),
          documento: String(r.DOCUMENTOBCO ?? ''),
          logAlteracao: logAlteracaoBco,
          logAlteracaoFrq: logAlteracaoFrq,
          dataBco: r.DATABCO ? new Date(String(r.DATABCO)) : dataRef,
          dataDigitacao: r.DATADIGITACAO ? new Date(String(r.DATADIGITACAO)) : null,
          digitador: r.DIGITADORBCO ?? null,
          prefixoVeic: r.PREFIXOVEIC ?? null,
          alterada,
          // updatedAt: new Date(), // Removido para que o skipUpdateIfNoValuesChanged funcione corretamente
        });
      }
    }

    // 2. Salvar itens no PostgreSQL
    if (itens.length > 0) {
      // Upsert em chunks para evitar erro de parâmetros excessivos
      const chunkSize = 500;
      for (let i = 0; i < itens.length; i += chunkSize) {
        const chunk = itens.slice(i, i + chunkSize);
        await this.itemRepo.upsert(chunk as BcoAlteracoesItem[], {
          conflictPaths: ['dataReferencia', 'idbco'],
          skipUpdateIfNoValuesChanged: true,
        });
      }
    }

    const totalPendentes = Math.max(totalDocumentos - totalAlteradas, 0);

    // 3. Calcular delta em relação ao que está salvo
    const existing = await this.resumoRepo.findOne({ where: { dataReferencia: dataRef } });
    const novasAlteracoes = existing ? Math.max(totalAlteradas - (existing.totalAlteradas || 0), 0) : totalAlteradas;

    // 4. Salvar resumo no PostgreSQL
    await this.upsertResumo({ data, totalDocumentos, totalAlteradas, totalPendentes });

    return {
      dataReferencia: data,
      totalDocumentos,
      totalAlteradas,
      totalPendentes,
      source: 'ORACLE_GLOBUS',
      ...(novasAlteracoes !== undefined ? { novasAlteracoes } : {}),
    };
  }

  async listarPorData(
    data: string,
    status: 'alteradas' | 'pendentes',
    opts?: { limite?: number; page?: number; prefixoVeiculo?: string },
  ): Promise<{ items: ListaAlteracoesItemDTO[]; count: number; source: 'POSTGRESQL' }> {
    const limite = Math.min(Math.max(opts?.limite ?? 1000, 1), 10000);
    const page = Math.max(opts?.page ?? 1, 1);
    const skip = (page - 1) * limite;

    const where: any = {
      dataReferencia: new Date(data),
      alterada: status === 'alteradas',
    };

    if (opts?.prefixoVeiculo) {
      where.prefixoVeic = Like(`%${opts.prefixoVeiculo}%`);
    }

    const [rows, count] = await this.itemRepo.findAndCount({
      where,
      order: { documento: 'ASC' },
      take: limite,
      skip,
    });

    const toYMD = (v: Date | string | null | undefined): string | null => {
      if (!v) return null;
      try {
        if (v instanceof Date) {
          return v.toISOString().substring(0, 10);
        }
        // v pode ser string vinda do Postgres para colunas 'date'
        const d = new Date(v as string);
        if (isNaN(d.getTime())) {
          // se não converter, retorna a string como está (assumindo 'YYYY-MM-DD')
          return String(v);
        }
        return d.toISOString().substring(0, 10);
      } catch {
        return String(v);
      }
    };

    const items: ListaAlteracoesItemDTO[] = rows.map(r => ({
      idbco: r.idbco,
      documento: r.documento,
      logAlteracao: r.logAlteracao,
      logAlteracaoFrq: (r as any).logAlteracaoFrq ?? null,
      dataBco: toYMD(r.dataBco) || '',
      dataDigitacao: toYMD(r.dataDigitacao),
      digitador: r.digitador,
      prefixoVeiculo: r.prefixoVeic,
    }));

    return { items, count, source: 'POSTGRESQL' };
  }

  async obterResumoPorData(data: string): Promise<ResumoAlteracoesDTO | null> {
    const existing = await this.resumoRepo.findOne({ where: { dataReferencia: new Date(data) } });
    if (!existing) return null;
    return {
      dataReferencia: data,
      totalDocumentos: existing.totalDocumentos,
      totalAlteradas: existing.totalAlteradas,
      totalPendentes: existing.totalPendentes,
      source: 'POSTGRESQL',
    };
  }

  private async upsertResumo(params: { data: string; totalDocumentos: number; totalAlteradas: number; totalPendentes: number; }): Promise<void> {
    const { data, totalDocumentos, totalAlteradas, totalPendentes } = params;
    const dataDate = new Date(data);

    const existing = await this.resumoRepo.findOne({ where: { dataReferencia: dataDate } });
    if (existing) {
      existing.totalDocumentos = totalDocumentos;
      existing.totalAlteradas = totalAlteradas;
      existing.totalPendentes = totalPendentes;
      await this.resumoRepo.save(existing);
    } else {
      const novo = this.resumoRepo.create({
        dataReferencia: dataDate,
        totalDocumentos,
        totalAlteradas,
        totalPendentes,
      });
      await this.resumoRepo.save(novo);
    }
  }
}
