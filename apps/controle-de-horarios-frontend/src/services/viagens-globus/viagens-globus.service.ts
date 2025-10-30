import { BaseApiService } from '../shared/api.service';
import { ViagemGlobus, StatusDadosGlobus, SincronizacaoGlobus, FiltrosViagemGlobus } from '../../types/viagens-globus.types';
import { ResponsePaginada, TesteConexao } from '../../types';

export class ViagensGlobusService extends BaseApiService {
  constructor() {
    super();
  }

  async getViagens(data: string, filtros: FiltrosViagemGlobus = {}): Promise<ResponsePaginada<ViagemGlobus>> {
    const params = new URLSearchParams();
    if (filtros.setorPrincipal) params.append('setorPrincipal', filtros.setorPrincipal);
    if (filtros.codigoLinha) params.append('codigoLinha', filtros.codigoLinha);
    if (filtros.nomeLinha) params.append('nomeLinha', filtros.nomeLinha);
    if (filtros.sentido) params.append('sentido', filtros.sentido);
    if (filtros.localOrigemViagem) params.append('localOrigemViagem', filtros.localOrigemViagem);
    if (filtros.codServicoNumero) params.append('codServicoNumero', filtros.codServicoNumero);
    if (filtros.nomeMotorista) params.append('nomeMotorista', filtros.nomeMotorista);
    if (filtros.nomeCobrador) params.append('nomeCobrador', filtros.nomeCobrador);
    if (filtros.limite) params.append('limite', filtros.limite.toString());
    if (filtros.page) params.append('page', filtros.page.toString());
    if (filtros.incluirEstatisticas !== undefined) params.append('incluirEstatisticas', filtros.incluirEstatisticas.toString());
    if (filtros.salvarLocal !== undefined) params.append('salvarLocal', filtros.salvarLocal.toString());

    const queryString = params.toString();
    const url = `/viagens-globus/${data}${queryString ? `?${queryString}` : ''}`;

    const response = await this.api.get<ResponsePaginada<ViagemGlobus>>(url);
    return response.data;
  }

  async getStatusDados(data: string): Promise<StatusDadosGlobus> {
    const response = await this.api.get<{ data: StatusDadosGlobus }>(`/viagens-globus/${data}/status`);
    return response.data.data;
  }

  async sincronizarViagens(data: string, incluirEstatisticas?: boolean, salvarLocal?: boolean): Promise<SincronizacaoGlobus> {
    const params = new URLSearchParams();
    if (incluirEstatisticas !== undefined) params.append('incluirEstatisticas', incluirEstatisticas.toString());
    if (salvarLocal !== undefined) params.append('salvarLocal', salvarLocal.toString());

    const queryString = params.toString();
    const url = `/viagens-globus/sincronizar/${data}${queryString ? `?${queryString}` : ''}`;

    const response = await this.api.post<{ data: SincronizacaoGlobus }>(url);
    return response.data.data;
  }

  async testarConexaoOracle(): Promise<TesteConexao> {
    const response = await this.api.get<TesteConexao>('/viagens-globus/oracle/teste-conexao');
    return response.data;
  }
  
  async getSetores(data: string): Promise<string[]> {
      const response = await this.api.get<{ setores: string[] }>(`/viagens-globus/${data}/setores`);
      return response.data.setores;
  }

  async getLinhas(data: string): Promise<string[]> {
      const response = await this.api.get<{ linhas: string[] }>(`/viagens-globus/${data}/linhas`);
      return response.data.linhas;
  }
}

export const viagensGlobusService = new ViagensGlobusService();
