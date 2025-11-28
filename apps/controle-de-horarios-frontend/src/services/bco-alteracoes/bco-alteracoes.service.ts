import { BaseApiService, makeAuthenticatedRequest } from '../shared/api.service';
import { BcoListaResponse, BcoResumo, BcoStatusFiltro } from '../../types/bco-alteracoes.types';

export class BcoAlteracoesService extends BaseApiService {
  constructor() { super(); }

  async verificar(data: string): Promise<BcoResumo> {
    const response = await makeAuthenticatedRequest(`/bco-alteracoes/${data}/verificar`);
    return response.data as BcoResumo ?? response as BcoResumo;
  }

  async getResumo(data: string): Promise<BcoResumo | null> {
    try {
      const response = await makeAuthenticatedRequest(`/bco-alteracoes/${data}`);
      // Backend responde { success, message, data, executionTime }
      const resumo = (response?.data as BcoResumo) ?? (response as BcoResumo);
      if (resumo && typeof resumo === 'object' && 'totalDocumentos' in resumo) return resumo as BcoResumo;
      return null;
    } catch (err) {
      // Fallback: usar o payload do verificar como resumo
      try {
        const ver = await this.verificar(data);
        return ver ?? null;
      } catch (_) {
        throw err;
      }
    }
  }

  async listar(
    data: string,
    status: BcoStatusFiltro,
    params: { limite?: number; page?: number; prefixoVeiculo?: string } = {}
  ): Promise<BcoListaResponse> {
    const query: Record<string, string | number> = { status };
    if (params.limite !== undefined) query.limite = params.limite;
    if (params.page !== undefined) query.page = params.page;
    if (params.prefixoVeiculo) query.prefixoVeiculo = params.prefixoVeiculo;
    const search = new URLSearchParams(query as any).toString();
    const response = await makeAuthenticatedRequest(`/bco-alteracoes/${data}/listar?${search}`);
    // Alguns backends podem embrulhar em { data: { items, count, ... } }
    return (response?.data as BcoListaResponse) ?? (response as BcoListaResponse);
  }
}

export const bcoAlteracoesService = new BcoAlteracoesService();
