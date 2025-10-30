// src/features/controle-horarios/components/StatusCards/StatusCards.tsx
import React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { StatusControleHorarios, EstatisticasControleHorarios } from '../../types/controle-horarios.types';

interface StatusCardsProps {
  statusDados: StatusControleHorarios;
  estatisticas: EstatisticasControleHorarios;
}

export const StatusCards: React.FC<StatusCardsProps> = ({ statusDados, estatisticas }) => {
  const renderStatusBadge = (status: boolean, label: string) => {
    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
        status 
          ? 'bg-green-100 text-green-700' 
          : 'bg-gray-100 text-gray-500'
      }`}>
        {status ? (
          <CheckCircle className="h-3 w-3" />
        ) : (
          <AlertCircle className="h-3 w-3" />
        )}
        {label}
      </div>
    );
  };

  return (
    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-blue-600">{statusDados.totalViagensGlobus}</div>
            <div className="text-sm text-blue-600">Viagens Globus</div>
          </div>
          {renderStatusBadge(statusDados.existeViagensGlobus, 'Dados')}
        </div>
      </div>
      
      <div className="bg-green-50 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-green-600">{estatisticas.viagensEditadas}</div>
            <div className="text-sm text-green-600">Viagens Editadas</div>
          </div>
          <div className="text-xs text-green-600 font-medium">
            {estatisticas.percentualEditado}%
          </div>
        </div>
      </div>
      
      <div className="bg-yellow-50 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-yellow-600">{estatisticas.viagensNaoEditadas}</div>
            <div className="text-sm text-yellow-600">Não Editadas</div>
          </div>
          <div className="text-xs text-yellow-600 font-medium">
            {100 - estatisticas.percentualEditado}%
          </div>
        </div>
      </div>
      
      <div className="bg-purple-50 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-purple-600">{statusDados.totalSetores}</div>
            <div className="text-sm text-purple-600">Setores Ativos</div>
          </div>
          <div className="text-xs text-purple-600 font-medium">
            {statusDados.totalLinhas} linhas
          </div>
        </div>
      </div>
    </div>
  );
};