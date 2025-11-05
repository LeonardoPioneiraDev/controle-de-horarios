import { BaseApiService } from '../shared/api.service';
import { ViagemGlobus, StatusDadosGlobus, SincronizacaoGlobus, FiltrosViagemGlobus } from '../../types/viagens-globus.types';
import { ResponsePaginada, TesteConexao } from '../../types';

export class ViagensGlobusService extends BaseApiService {
  constructor() {
    super();
  }

  async getViagens(data: string, filtros: FiltrosViagemGlobus = {}): Promise<ResponsePaginada<ViagemGlobus>> {
    const params = new URLSearchParams();
    if (filtros.setor_principal_linha) params.append('setor_principal_linha', filtros.setor_principal_linha);
    if (filtros.codigo_linha) params.append('codigo_linha', filtros.codigo_linha.join(','));
    if (filtros.nome_linha) params.append('nome_linha', filtros.nome_linha);
    if (filtros.sentido) params.append('sentido', filtros.sentido);
    if (filtros.local_origem_viagem) params.append('local_origem_viagem', filtros.local_origem_viagem);
    if (filtros.cod_servico_numero) params.append('cod_servico_numero', filtros.cod_servico_numero);
    if (filtros.nome_motorista) params.append('nome_motorista', filtros.nome_motorista);
    if (filtros.nome_cobrador) params.append('nome_cobrador', filtros.nome_cobrador);
    if (filtros.limite) params.append('limite', filtros.limite.toString());
    if (filtros.pagina) params.append('pagina', filtros.pagina.toString());
    if (filtros.incluir_estatisticas !== undefined) params.append('incluir_estatisticas', filtros.incluir_estatisticas.toString());
    if (filtros.salvar_local !== undefined) params.append('salvar_local', filtros.salvar_local.toString());

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
