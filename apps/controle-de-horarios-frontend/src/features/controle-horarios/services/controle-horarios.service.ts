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
}

export const controleHorariosService = new ControleHorariosService();

