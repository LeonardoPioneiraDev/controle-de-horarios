import { BaseApiService } from '../shared/api.service';
import { ResultadoComparacao, ComparacaoViagem, FiltrosComparacao, HistoricoComparacaoResumo } from '../../types/comparacao.types';
import { ResponsePaginada } from '../../types';

export class ComparacaoViagensService extends BaseApiService {
  constructor() {
    super();
  }

  async getEstatisticas(data: string): Promise<ResultadoComparacao | null> {
    const response = await this.api.get<{ data: ResultadoComparacao }>(`/comparacao-viagens/${data}/estatisticas`);
    return response.data.data;
  }

  async executarComparacao(data: string): Promise<ResultadoComparacao> {
    const response = await this.api.post<{ data: ResultadoComparacao; historyId?: string }>(`/comparacao-viagens/executar/${data}`);
    return response.data.data;
  }

  async getComparacoes(data: string, filtros: FiltrosComparacao): Promise<ResponsePaginada<ComparacaoViagem>> {
    const params = new URLSearchParams();
    if (filtros.limit) params.append('limit', filtros.limit.toString());
    if (filtros.page) params.append('page', filtros.page.toString());
    if (filtros.statusComparacao) params.append('statusComparacao', filtros.statusComparacao);
    if (filtros.codigoLinha) params.append('codigoLinha', filtros.codigoLinha);
    if (filtros.globusSetor) params.append('globusSetor', filtros.globusSetor);
    if (filtros.sentidoCompativel !== undefined) params.append('sentidoCompativel', filtros.sentidoCompativel.toString());
    if (filtros.horarioCompativel !== undefined) params.append('horarioCompativel', filtros.horarioCompativel.toString());
    if (filtros.servicoCompativel !== undefined) params.append('servicoCompativel', filtros.servicoCompativel.toString());

    const queryString = params.toString();
    const url = `/comparacao-viagens/${data}${queryString ? `?${queryString}` : ''}`;

    const response = await this.api.get<ResponsePaginada<ComparacaoViagem>>(url);
    return response.data;
  }

  async getLinhas(data: string): Promise<string[]> {
    const response = await this.api.get<{ data: string[] }>(`/comparacao-viagens/${data}/linhas`);
    return response.data.data;
  }

  async listarHistorico(params?: { data?: string; dataInicial?: string; dataFinal?: string; executedByEmail?: string; page?: number; limit?: number }): Promise<{ items: HistoricoComparacaoResumo[]; total: number; page: number; limit: number }> {
    const query: Record<string, string | number> = {};
    if (params?.data) query.data = params.data;
    if (params?.dataInicial) query.dataInicial = params.dataInicial;
    if (params?.dataFinal) query.dataFinal = params.dataFinal;
    if (params?.executedByEmail) query.executedByEmail = params.executedByEmail;
    if (params?.page) query.page = params.page;
    if (params?.limit) query.limit = params.limit;
    const res = await this.api.get<{ data: HistoricoComparacaoResumo[]; total: number; page: number; limit: number }>(
      '/comparacao-viagens/historico',
      { params: query }
    );
    return { items: res.data.data, total: res.data.total, page: res.data.page, limit: res.data.limit };
  }

  async obterUltimoHistorico(data: string): Promise<HistoricoComparacaoResumo | null> {
    const res = await this.api.get<{ success: boolean; data?: HistoricoComparacaoResumo }>(
      '/comparacao-viagens/historico/ultimo',
      { params: { data } }
    );
    return res.data?.data || null;
  }

  async obterHistoricoPorId(id: string): Promise<HistoricoComparacaoResumo | null> {
    const res = await this.api.get<{ success: boolean; data?: HistoricoComparacaoResumo }>(`/comparacao-viagens/historico/${id}`);
    return res.data?.data || null;
  }
}

export const comparacaoViagensService = new ComparacaoViagensService();
