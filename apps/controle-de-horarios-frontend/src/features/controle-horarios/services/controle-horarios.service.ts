import { BaseApiService } from "../../../services/shared/api.service";
import { ControleHorarioResponse, FiltrosControleHorarios, OpcoesControleHorarios, SalvarControleHorario, SalvarMultiplosControles, EstatisticasControleHorarios, SincronizarControleHorariosDto, SincronizacaoResponse } from  '../types/controle-horarios.types'; // ✅ CAMINHO CORRIGIDO

export class ControleHorariosService extends BaseApiService {
  constructor() {
    super();
  }

  /**
   * ✅ Buscar controle de horários com filtros
   */
  async getControleHorarios(data: string, filtros: FiltrosControleHorarios = {}): Promise<ControleHorarioResponse> {
    console.log(`🕐 Buscando controle de horários para ${data}...`, filtros);
    
    const params = new URLSearchParams();
    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const queryString = params.toString();
    const url = `/controle-horarios/${data}${queryString ? `?${queryString}` : ''}`;
    
    const response = await this.api.get<ControleHorarioResponse>(url);
    console.log(`✅ ${response.data.data.length}/${response.data.total} controles encontrados`);
    return response.data;
  }

  /**
   * ✅ Salvar controle de horário individual
   */
  async salvarControleHorario(data: string, controle: SalvarControleHorario): Promise<{ success: boolean; message: string; data: any }> {
    console.log(`💾 Salvando controle para viagem ${controle.viagemGlobusId}...`);
    const response = await this.api.post(`/controle-horarios/${data}/salvar`, controle);
    console.log('✅ Controle salvo com sucesso');
    return response.data;
  }

  /**
   * ✅ Salvar múltiplos controles
   */
  async salvarMultiplosControles(dados: SalvarMultiplosControles): Promise<{ success: boolean; message: string; salvos: number; erros: number }> {
    console.log(`💾 Salvando ${dados.controles.length} controles para ${dados.dataReferencia}...`);
    const response = await this.api.post('/controle-horarios/salvar-multiplos', dados);
    console.log(`✅ Salvamento concluído: ${response.data.salvos} sucessos, ${response.data.erros} erros`);
    return response.data;
  }

  /**
   * ✅ Buscar opções para filtros
   */
  async getOpcoesControleHorarios(data: string): Promise<{ success: boolean; message: string; data: OpcoesControleHorarios }> {
    console.log(`🔍 Buscando opções de filtros para ${data}...`);
    const response = await this.api.get(`/controle-horarios/${data}/opcoes`);
    console.log('✅ Opções obtidas com sucesso');
    return response.data;
  }

  /**
   * ✅ Obter estatísticas do controle de horários
   */
  async getEstatisticasControleHorarios(data: string): Promise<{ success: boolean; message: string; data: EstatisticasControleHorarios }> {
    console.log(`📊 Buscando estatísticas de controle para ${data}...`);
    const response = await this.api.get(`/controle-horarios/${data}/estatisticas`);
    console.log('✅ Estatísticas obtidas');
    return response.data;
  }

  /**
   * ✅ Verificar status dos dados de controle
   */
  async getStatusControleHorarios(data: string): Promise<{ success: boolean; message: string; data: any; dataReferencia: string }> {
    console.log(`📊 Verificando status do controle para ${data}...`);
    const response = await this.api.get(`/controle-horarios/${data}/status`);
    console.log('✅ Status verificado');
    return response.data;
  }

  /**
   * ✅ Sincronizar dados com o Globus
   */
  async sincronizarControleHorarios(data: string, payload?: SincronizarControleHorariosDto): Promise<SincronizacaoResponse> {
    console.log(`🔄 Sincronizando controle de horários para ${data}...`, payload);
    const response = await this.api.post(`/controle-horarios/${data}/sincronizar`, payload);
    console.log('✅ Sincronização concluída');
    return response.data;
  }

  /**
   * ✅ Health check do módulo controle de horários
   */
  async checkHealthControleHorarios(): Promise<{ success: boolean; message: string; status: string; timestamp: string }> {
    console.log('🏥 Verificando saúde do módulo Controle de Horários...');
    const response = await this.api.get('/controle-horarios/health');
    console.log('✅ Health check do controle realizado');
    return response.data;
  }
}

export const controleHorariosService = new ControleHorariosService();