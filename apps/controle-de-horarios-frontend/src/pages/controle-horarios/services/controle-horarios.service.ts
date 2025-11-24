import { BaseApiService } from "../../../services/shared/api.service";
import {
  ControleHorarioResponse,
  FiltrosControleHorarios,
  OpcoesControleHorarios,
  SalvarControleHorario,
  SalvarMultiplosControles,
  EstatisticasControleHorarios,
  SincronizarControleHorariosDto,
  SincronizacaoResponse,
  HistoricoControleHorarioResponse,
} from '../types/controle-horarios.types';

export class ControleHorariosService extends BaseApiService {
  constructor() {
    super();
  }

  // Buscar controle de horários com filtros
  async getControleHorarios(data: string, filtros: FiltrosControleHorarios = {}): Promise<ControleHorarioResponse> {
    const params = new URLSearchParams();
    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const queryString = params.toString();
    const url = `/controle-horarios/${data}${queryString ? `?${queryString}` : ''}`;
    const response = await this.api.get<ControleHorarioResponse>(url);
    return response.data;
  }

  // Salvar controle de horário individual
  async salvarControleHorario(data: string, controle: SalvarControleHorario): Promise<{ success: boolean; message: string; data: any }> {
    const response = await this.api.post(`/controle-horarios/${data}/salvar`, controle);
    return response.data;
  }

  // Salvar múltiplos controles (usa rota PATCH /multiples-batch)
  async salvarMultiplosControles(dados: SalvarMultiplosControles): Promise<{ success: boolean; message: string; salvos: number; erros: number }> {
    const response = await this.api.patch('/controle-horarios/multiples-batch', dados);
    return response.data;
  }

  // Buscar opções para filtros
  async getOpcoesControleHorarios(data: string): Promise<{ success: boolean; message: string; data: OpcoesControleHorarios }> {
    const response = await this.api.get(`/controle-horarios/${data}/opcoes`);
    return response.data;
  }

  // Obter estatísticas do controle de horários
  async getEstatisticasControleHorarios(data: string): Promise<{ success: boolean; message: string; data: EstatisticasControleHorarios }> {
    const response = await this.api.get(`/controle-horarios/${data}/estatisticas`);
    return response.data;
  }

  // Verificar status dos dados de controle
  async getStatusControleHorarios(data: string): Promise<{ success: boolean; message: string; data: any; dataReferencia: string }> {
    const response = await this.api.get(`/controle-horarios/${data}/status`);
    return response.data;
  }

  // Sincronizar dados com o Globus
  async sincronizarControleHorarios(data: string, payload?: SincronizarControleHorariosDto): Promise<SincronizacaoResponse> {
    const response = await this.api.post(`/controle-horarios/sincronizar/${data}`, payload);
    return response.data;
  }

  // Health check do módulo controle de horários
  async checkHealthControleHorarios(): Promise<{ success: boolean; message: string; status: string; timestamp: string }> {
    const response = await this.api.get('/controle-horarios/health');
    return response.data;
  }

  // ===== Novos métodos alinhados ao backend =====
  // Atualizar controle de horário individual (apenas Despachante)
  async atualizarControleHorario(id: string, payload: Record<string, unknown>): Promise<{ success: boolean; message: string; data: any }> {
    const response = await this.api.patch(`/controle-horarios/${id}`, payload);
    return response.data;
  }

  // Atualizar múltiplos controles (apenas Despachante)
  async atualizarMultiplosControles(dados: SalvarMultiplosControles): Promise<{ success: boolean; message: string; salvos?: number; erros?: number; data?: any }> {
    const response = await this.api.patch('/controle-horarios/multiples-batch', dados);
    return response.data;
  }

  // Histórico de alterações por controle de horário
  async getHistoricoControleHorario(id: string, pagina = 1, limite = 50): Promise<HistoricoControleHorarioResponse> {
    const response = await this.api.get(`/controle-horarios/${id}/historico`, { params: { pagina, limite } });
    return response.data;
  }
}

export const controleHorariosService = new ControleHorariosService();
