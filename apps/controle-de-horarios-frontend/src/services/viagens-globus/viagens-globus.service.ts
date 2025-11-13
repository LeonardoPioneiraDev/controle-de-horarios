import { BaseApiService } from '../shared/api.service';
import { ViagemGlobus, StatusDadosGlobus, SincronizacaoGlobus, FiltrosViagemGlobus } from '../../types/viagens-globus.types';
import { ResponsePaginada, TesteConexao } from '../../types';

export class ViagensGlobusService extends BaseApiService {
  constructor() {
    super();
  }

  async getViagens(data: string, filtros: FiltrosViagemGlobus = {}): Promise<ResponsePaginada<ViagemGlobus>> {
    const url = `/viagens-globus/${data}/filtrados`;
    const params: Record<string, string | number | boolean> = {};
    if (filtros.setores && filtros.setores.length > 0) params['setores'] = filtros.setores.join(',');
    if (filtros.setorPrincipal) params['setorPrincipal'] = filtros.setorPrincipal;
    if (filtros.codigoLinha) params['codigoLinha'] = filtros.codigoLinha;
    if (filtros.nomeLinha) params['nomeLinha'] = filtros.nomeLinha;
    if (filtros.sentido) params['sentido'] = filtros.sentido;
    if (filtros.localOrigemViagem) params['localOrigemViagem'] = filtros.localOrigemViagem;
    if (filtros.codServicoNumero) params['codServicoNumero'] = filtros.codServicoNumero;
    if (filtros.nomeMotorista) params['nomeMotorista'] = filtros.nomeMotorista;
    if (filtros.nomeCobrador) params['nomeCobrador'] = filtros.nomeCobrador;
    if (filtros.codDestinoLinha !== undefined) params['codDestinoLinha'] = filtros.codDestinoLinha;
    if (filtros.localDestinoLinha) params['localDestinoLinha'] = filtros.localDestinoLinha;
    if (filtros.descTipoDia) params['descTipoDia'] = filtros.descTipoDia;
    if (filtros.codAtividade !== undefined) params['codAtividade'] = filtros.codAtividade;
    if (filtros.nomeAtividade) params['nomeAtividade'] = filtros.nomeAtividade;
    if (filtros.flgTipo) params['flgTipo'] = filtros.flgTipo;
    if (filtros.codMotoristaGlobus !== undefined) params['codMotoristaGlobus'] = filtros.codMotoristaGlobus;
    if (filtros.chapaFuncMotorista) params['chapaFuncMotorista'] = filtros.chapaFuncMotorista;
    if (filtros.codCobradorGlobus !== undefined) params['codCobradorGlobus'] = filtros.codCobradorGlobus;
    if (filtros.chapaFuncCobrador) params['chapaFuncCobrador'] = filtros.chapaFuncCobrador;
    if (filtros.prefixoVeiculo) params['prefixoVeiculo'] = filtros.prefixoVeiculo;
    if (filtros.apenasComCobrador !== undefined) params['apenasComCobrador'] = filtros.apenasComCobrador;
    if (filtros.horarioInicio) params['horarioInicio'] = filtros.horarioInicio;
    if (filtros.horarioFim) params['horarioFim'] = filtros.horarioFim;
    if (filtros.buscaTexto) params['buscaTexto'] = filtros.buscaTexto;
    if (typeof filtros.limite === 'number') params['limite'] = filtros.limite;
    if (typeof filtros.page === 'number') params['page'] = filtros.page;
    if (filtros.incluirEstatisticas !== undefined) params['incluirEstatisticas'] = filtros.incluirEstatisticas;
    if (filtros.salvarLocal !== undefined) params['salvarLocal'] = filtros.salvarLocal;
    if (filtros.ordenarPor) params['ordenarPor'] = filtros.ordenarPor;
    if (filtros.ordem) params['ordem'] = filtros.ordem;

    const response = await this.api.get<ResponsePaginada<ViagemGlobus>>(url, { params });
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
