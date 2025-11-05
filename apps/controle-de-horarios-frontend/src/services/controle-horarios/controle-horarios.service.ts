import { api } from '../api';
import { ControleHorario } from '../../types/controle-horarios.types';

interface UpdateControleHorarioPayload {
  id: string;
  prefixoVeiculo?: string;
  motoristaSubstitutoNome?: string;
  motoristaSubstitutoCracha?: string;
  cobradorSubstitutoNome?: string;
  cobradorSubstitutoCracha?: string;
  observacoesEdicao?: string;
  isAtivo?: boolean;
}

export const controleHorariosService = {
  updateControleHorario: async (payload: UpdateControleHorarioPayload): Promise<ControleHorario> => {
    const { id, ...data } = payload;
    const response = await api.patch(`/controle-horarios/${id}`, data);
    return response.data.data;
  },
};
