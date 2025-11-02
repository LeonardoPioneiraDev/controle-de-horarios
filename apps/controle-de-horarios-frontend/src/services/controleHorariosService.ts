// src/services/controleHorariosService.ts

import { makeAuthenticatedRequest } from './api';
import {
  ControleHorarioResponseDto,
  FiltrosControleHorarios,
  SalvarControleHorariosDto,
  SalvarMultiplosControleHorariosDto,
  OpcoesControleHorariosDto,
  EstatisticasControleHorariosDto,
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
    dados: SalvarControleHorariosDto,
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
    dados: SalvarMultiplosControleHorariosDto,
  ): Promise<any> {
    const response = await makeAuthenticatedRequest(
      `/controle-horarios/salvar-multiplos`,
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

  async buscarOpcoesControleHorarios(
    dataReferencia: string,
  ): Promise<OpcoesControleHorariosDto> {
    const response = await makeAuthenticatedRequest(
      `/controle-horarios/${dataReferencia}/opcoes`,
      { method: 'GET' }
    );
    return response.data; // O backend retorna { success, message, data }
  },

  async obterEstatisticas(
    dataReferencia: string,
  ): Promise<EstatisticasControleHorariosDto> {
    const response = await makeAuthenticatedRequest(
      `/controle-horarios/${dataReferencia}/estatisticas`,
      { method: 'GET' }
    );
    return response.data; // O backend retorna { success, message, data }
  },

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
    const response = await makeAuthenticatedRequest(
      `/controle-horarios/${dataReferencia}/sincronizar`,
      {
        method: 'POST',
        body: JSON.stringify({ overwrite }),
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return response;
  },
};
