import { BaseApiService } from '../shared/api.service';
import { ViagemTransdata, FiltrosViagem, ResponsePaginada, StatusDados, CodigosLinha, ServicosUnicos, SincronizacaoResult, TesteConexao, EstatisticasAPI } from '../../types';

export class ViagensTransdataService extends BaseApiService {
  constructor() {
    super();
  }

  /**
   * ✅ Buscar todas as viagens de uma data específica
   */
  async getViagensByDate(data: string): Promise<ViagemTransdata[]> {
    console.log(`🚌 Buscando viagens para data: ${data}...`);
    const response = await this.api.get<ViagemTransdata[]>(`/viagens-transdata/${data}`);
    console.log(`✅ ${response.data.length} viagens encontradas para ${data}`);
    return response.data;
  }

  /**
   * ✅ Buscar viagens com filtros aplicados (corrigido para usar campos reais)
   */
  async getViagensWithFilters(data: string, filtros: FiltrosViagem = {}): Promise<ResponsePaginada<ViagemTransdata>> {
    console.log(`🔍 Buscando viagens filtradas para ${data}...`, filtros);
    
    const params = new URLSearchParams();
    
    // ✅ Mapear filtros para os campos corretos da API
    if (filtros.sentido) params.append('sentido', filtros.sentido);
    if (filtros.codigoLinha) params.append('codigoLinha', filtros.codigoLinha);
    if (filtros.numeroServico) params.append('servico', filtros.numeroServico.toString()); // ✅ Corrigido: 'servico' não 'numeroServico'
    if (filtros.statusCumprimento) params.append('statusCumprimento', filtros.statusCumprimento);
    if (filtros.pontoFinal) params.append('pontoFinal', filtros.pontoFinal);
    if (filtros.nomeLinha) params.append('nomeLinha', filtros.nomeLinha);
    if (filtros.horarioInicio) params.append('horarioInicio', filtros.horarioInicio);
    if (filtros.horarioFim) params.append('horarioFim', filtros.horarioFim);
    if (filtros.page) params.append('page', filtros.page.toString());
    if (filtros.limit) params.append('limit', filtros.limit.toString());

    const queryString = params.toString();
    const url = `/viagens-transdata/${data}/filtrados${queryString ? `?${queryString}` : ''}`;
    
    const response = await this.api.get<ResponsePaginada<ViagemTransdata>>(url);
    console.log(`✅ ${response.data.data.length}/${response.data.total} viagens filtradas encontradas`);
    return response.data;
  }

  /**
   * ✅ Verificar status dos dados para uma data
   */
  async getStatusDados(data: string): Promise<StatusDados> {
    console.log(`📊 Verificando status dos dados para: ${data}...`);
    const response = await this.api.get<StatusDados>(`/viagens-transdata/${data}/status`);
    console.log(`✅ Status verificado: ${response.data.existemDados ? 'Dados existem' : 'Sem dados'}`);
    return response.data;
  }



  /**
   * ✅ Obter serviços únicos para uma data (campo Servico)
   */
  async getServicosUnicos(data: string): Promise<ServicosUnicos> {
    console.log(`🚌 Buscando serviços únicos para: ${data}...`);
    const response = await this.api.get<ServicosUnicos>(`/viagens-transdata/${data}/servicos`);
    console.log(`✅ ${response.data.total} serviços únicos encontrados`);
    return response.data;
  }

  /**
   * ✅ Sincronizar viagens manualmente
   */
  async sincronizarViagens(data: string): Promise<SincronizacaoResult> {
    console.log(`🔄 Iniciando sincronização manual para: ${data}...`);
    const response = await this.api.post<SincronizacaoResult>(`/viagens-transdata/sincronizar/${data}`);
    console.log(`✅ Sincronização concluída: ${response.data.sincronizadas} viagens`);
    return response.data;
  }

  /**
   * ✅ Testar conexão com API Transdata
   */
  async testarConexaoTransdata(): Promise<TesteConexao> {
    console.log(`🔧 Testando conexão com API Transdata...`);
    const response = await this.api.get<TesteConexao>('/viagens-transdata/api/teste-conexao');
    console.log(`✅ Teste de conexão: ${response.data.success ? 'Sucesso' : 'Falha'}`);
    return response.data;
  }

  /**
   * ✅ Obter estatísticas da API Transdata
   */
  async getEstatisticasTransdata(): Promise<EstatisticasAPI> {
    console.log(`📊 Buscando estatísticas da API Transdata...`);
    const response = await this.api.get<EstatisticasAPI>('/viagens-transdata/api/estatisticas');
    console.log(`✅ Estatísticas obtidas`);
    return response.data;
  }
}

export const viagensTransdataService = new ViagensTransdataService();