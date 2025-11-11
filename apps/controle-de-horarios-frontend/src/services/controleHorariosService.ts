// src/services/controleHorariosService.ts

import { makeAuthenticatedRequest } from './api';
import { api } from './api';
import {
  ControleHorarioResponseDto,
  FiltrosControleHorarios,
  UpdateControleHorarioDto,
  UpdateMultipleControleHorariosDto,
  OpcoesControleHorariosDto,
  StatusControleHorariosDto,
} from '../types/controle-horarios.types';

export const controleHorariosService = {
  async buscarControleHorarios(
    dataReferencia: string,
    filtros: FiltrosControleHorarios,
  ): Promise<ControleHorarioResponseDto> {
    const queryParams = new URLSearchParams();
    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          queryParams.append(key, value.join(','));
        } else {
          queryParams.append(key, value.toString());
        }
      }
    });
    const queryString = queryParams.toString();
    const endpoint = `/controle-horarios/${dataReferencia}${queryString ? `?${queryString}` : ''}`;
    const response = await makeAuthenticatedRequest(endpoint, { method: 'GET' });
    return response;
  },

  async salvarControleHorario(
    dataReferencia: string,
    dados: UpdateControleHorarioDto,
  ): Promise<any> {
    const response = await makeAuthenticatedRequest(
      `/controle-horarios/${dataReferencia}/salvar`,
      {
        method: 'POST',
        body: JSON.stringify(dados),
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return response;
  },

  async salvarMultiplosControles(
    dados: UpdateMultipleControleHorariosDto,
  ): Promise<any> {
    // Bypassa axios para evitar problemas de montagem de URL e usa fetch helper
    const response = await makeAuthenticatedRequest(
      '/controle-horarios/multiples-batch',
      {
        method: 'PATCH',
        body: JSON.stringify(dados),
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return response;
  },

  async buscarOpcoesControleHorarios(
    dataReferencia: string,
  ): Promise<OpcoesControleHorariosDto> {
    // Compor opções a partir dos endpoints disponíveis no backend
    const [setoresResp, linhasResp, servicosResp, atividadesResp] = await Promise.all([
      makeAuthenticatedRequest(`/controle-horarios/${dataReferencia}/setores`, { method: 'GET' }),
      makeAuthenticatedRequest(`/controle-horarios/${dataReferencia}/linhas`, { method: 'GET' }),
      makeAuthenticatedRequest(`/controle-horarios/${dataReferencia}/servicos`, { method: 'GET' }),
      makeAuthenticatedRequest(`/controle-horarios/${dataReferencia}/atividades`, { method: 'GET' }),
    ]);

    // Normalizar possíveis formatos: o backend retorna { success, message, data }
    const setores: string[] = setoresResp?.data ?? setoresResp ?? [];
    const servicos: string[] = servicosResp?.data ?? servicosResp ?? [];
    const atividades: string[] = atividadesResp?.data ?? atividadesResp ?? [];
    const linhasArr: string[] = linhasResp?.data ?? linhasResp ?? [];
    const linhas = linhasArr
      .filter((codigo: string) => typeof codigo === 'string')
      .map((codigo: string) => ({ codigo, nome: codigo }));

    return {
      setores,
      linhas,
      servicos,
      atividades,
      tiposDia: [],
      sentidos: ['IDA', 'VOLTA', 'CIRCULAR'],
      motoristas: [],
      locaisOrigem: [],
      locaisDestino: [],
    };
  },

  // Estatísticas não possuem endpoint dedicado no backend de controle-horários.
  // O hook calculará estatísticas a partir dos dados carregados.

  async verificarStatusDados(
    dataReferencia: string,
  ): Promise<StatusControleHorariosDto> {
    const response = await makeAuthenticatedRequest(
      `/controle-horarios/${dataReferencia}/status`,
      { method: 'GET' }
    );
    return response;
  },

  async sincronizarViagensGlobus(
    dataReferencia: string,
    overwrite: boolean = false,
  ): Promise<any> {
    // Backend usa rota: POST /controle-horarios/sincronizar/:data
    const response = await makeAuthenticatedRequest(
      `/controle-horarios/sincronizar/${dataReferencia}`,
      { method: 'POST' }
    );
    return response;
  },

  async excluirControleHorariosPorData(
    dataReferencia: string,
  ): Promise<any> {
    const response = await makeAuthenticatedRequest(
      `/controle-horarios/${dataReferencia}`,
      { method: 'DELETE' }
    );
    return response;
  },
};
