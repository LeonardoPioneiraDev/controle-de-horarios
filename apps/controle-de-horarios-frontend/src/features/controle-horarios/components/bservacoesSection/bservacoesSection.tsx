// src/features/controle-horarios/components/ObservacoesSection/ObservacoesSection.tsx
import React from 'react';
import { FileText } from 'lucide-react';
import { ControleHorarioItem, DadosEditaveis } from '../../types/controle-horarios.types';

interface ObservacoesSectionProps {
  controleHorarios: ControleHorarioItem[];
  controleHorariosOriginais: ControleHorarioItem[];
  onInputChange: (viagemId: string, field: keyof DadosEditaveis, value: string) => void;
}

export const ObservacoesSection: React.FC<ObservacoesSectionProps> = ({
  controleHorarios,
  controleHorariosOriginais,
  onInputChange
}) => {
  if (controleHorarios.length === 0) return null;

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
        <FileText className="h-5 w-5" />
        Observações Gerais
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {controleHorarios
          .filter(item => item.dadosEditaveis.jaFoiEditado || item.dadosEditaveis.observacoes)
          .slice(0, 4)
          .map((item) => {
            const original = controleHorariosOriginais.find(orig => orig.viagemGlobus.id === item.viagemGlobus.id);
            const observacaoAlterada = original && item.dadosEditaveis.observacoes !== original.dadosEditaveis.observacoes;

            return (
              <div key={item.viagemGlobus.id} className="border border-gray-200 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-900 mb-2">
                  Linha {item.viagemGlobus.codigoLinha} - Serviço {item.viagemGlobus.codServicoNumero}
                </div>
                <textarea
                  value={item.dadosEditaveis.observacoes || ''}
                  onChange={(e) => onInputChange(item.viagemGlobus.id, 'observacoes', e.target.value)}
                  placeholder="Observações sobre esta viagem..."
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                    observacaoAlterada
                      ? 'border-yellow-400 bg-yellow-50'
                      : 'border-gray-300'
                  }`}
                />
                <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                  <span>
                    {item.dadosEditaveis.observacoes?.length || 0}/500 caracteres
                  </span>
                  {observacaoAlterada && (
                    <span className="text-yellow-600 font-medium">
                      Alterado
                    </span>
                  )}
                </div>
              </div>
            );
          })}
      </div>

      {controleHorarios.filter(item => item.dadosEditaveis.jaFoiEditado || item.dadosEditaveis.observacoes).length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
          <p>Nenhuma viagem editada ainda.</p>
          <p className="text-sm">As observações aparecerão aqui conforme você editar as viagens.</p>
        </div>
      )}
    </div>
  );
};