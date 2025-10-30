import { BaseApiService } from '../shared/api.service';
import { ResultadoComparacao, ComparacaoViagem, FiltrosComparacao } from '../../types/comparacao.types';
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
    const response = await this.api.post<{ data: ResultadoComparacao }>(`/comparacao-viagens/executar/${data}`);
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
}

export const comparacaoViagensService = new ComparacaoViagensService();
