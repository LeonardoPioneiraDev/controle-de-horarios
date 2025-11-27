import { BaseApiService, makeAuthenticatedRequest } from '../shared/api.service';
import { BcoListaResponse, BcoResumo, BcoStatusFiltro } from '../../types/bco-alteracoes.types';

export class BcoAlteracoesService extends BaseApiService {
  constructor() { super(); }

  async verificar(data: string): Promise<BcoResumo> {
    const response = await makeAuthenticatedRequest(`/bco-alteracoes/${data}/verificar`);
    return response.data as BcoResumo ?? response as BcoResumo;
  }

  async getResumo(data: string): Promise<BcoResumo | null> {
    const response = await makeAuthenticatedRequest(`/bco-alteracoes/${data}`);
    return (response.data as BcoResumo) ?? null;
  }

  async listar(
    data: string,
    status: BcoStatusFiltro,
    params: { limite?: number; page?: number } = {}
  ): Promise<BcoListaResponse> {
    const query: Record<string, string | number> = { status };
    if (params.limite !== undefined) query.limite = params.limite;
    if (params.page !== undefined) query.page = params.page;
    const search = new URLSearchParams(query as any).toString();
    const response = await makeAuthenticatedRequest(`/bco-alteracoes/${data}/listar?${search}`);
    return response as BcoListaResponse;
  }
}

export const bcoAlteracoesService = new BcoAlteracoesService();
