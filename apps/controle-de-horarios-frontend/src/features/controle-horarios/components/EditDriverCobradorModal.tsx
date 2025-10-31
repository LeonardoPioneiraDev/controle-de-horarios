import React, { useState, useEffect } from 'react';
import { ControleHorarioItemDto, FiltrosControleHorarios } from '@/types/controle-horarios.types';
import { X, Save, Search } from 'lucide-react';

interface EditDriverCobradorModalProps {
  isOpen: boolean;
  onClose: () => void;
  viagem: ControleHorarioItemDto;
  field: 'motorista' | 'cobrador';
  onSave: (viagemId: string, fieldToUpdate: 'nomeMotoristaEditado' | 'crachaMotoristaEditado' | 'nomeCobradorEditado' | 'crachaCobradorEditado', value: string, observacoes: string) => Promise<void>;
  onFilterByCracha: (filters: FiltrosControleHorarios) => void;
}

export const EditDriverCobradorModal: React.FC<EditDriverCobradorModalProps> = ({
  isOpen,
  onClose,
  viagem,
  field,
  onSave,
  onFilterByCracha,
}) => {
  const [editedValue, setEditedValue] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (field === 'motorista') {
        setEditedValue(viagem.crachaMotoristaEditado || viagem.crachaMotoristaGlobus || '');
        setObservacoes(viagem.observacoes || '');
      } else { // cobrador
        setEditedValue(viagem.crachaCobradorEditado || viagem.crachaCobradorGlobus || '');
        setObservacoes(viagem.observacoes || '');
      }
      setError(null);
    }
  }, [isOpen, viagem, field]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!observacoes.trim()) {
      setError('A observação é obrigatória ao realizar uma alteração.');
      return;
    }
    setError(null);

    let fieldToUpdate: 'nomeMotoristaEditado' | 'crachaMotoristaEditado' | 'nomeCobradorEditado' | 'crachaCobradorEditado';
    if (field === 'motorista') {
      fieldToUpdate = 'crachaMotoristaEditado'; // Assumindo que a edição é pelo crachá
      // Poderíamos adicionar lógica para editar nome também se necessário
    } else {
      fieldToUpdate = 'crachaCobradorEditado';
    }

    await onSave(viagem.viagemGlobusId, fieldToUpdate, editedValue, observacoes);
  };

  const handleFilterByCracha = () => {
    if (field === 'motorista') {
      onFilterByCracha({ crachaMotorista: editedValue, servicoIgualMotorista: true });
    } else {
      onFilterByCracha({ crachaCobrador: editedValue, servicoIgualMotorista: true });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Editar {field === 'motorista' ? 'Motorista' : 'Cobrador'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Crachá {field === 'motorista' ? 'Motorista' : 'Cobrador'}
            </label>
            <input
              type="text"
              value={editedValue}
              onChange={(e) => setEditedValue(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder={`Novo crachá do ${field === 'motorista' ? 'motorista' : 'cobrador'}`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Observações (obrigatório)
            </label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Motivo da alteração (ex: substituição por ausência)"
            ></textarea>
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={handleFilterByCracha}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Search className="h-4 w-4 mr-2" />
            Ver Escala
          </button>
          <button
            onClick={handleSave}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Save className="h-4 w-4 mr-2" />
            Salvar Alteração
          </button>
        </div>
      </div>
    </div>
  );
};