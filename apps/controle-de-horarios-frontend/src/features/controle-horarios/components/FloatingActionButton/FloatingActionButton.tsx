// src/features/controle-horarios/components/FloatingActionButton/FloatingActionButton.tsx
import React from 'react';
import { Save } from 'lucide-react';

interface FloatingActionButtonProps {
  temAlteracoesPendentes: boolean;
  alteracoesPendentes: number;
  onDescartarAlteracoes: () => void;
  onSalvarAlteracoes: () => void;
  saving: boolean;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  temAlteracoesPendentes,
  alteracoesPendentes,
  onDescartarAlteracoes,
  onSalvarAlteracoes,
  saving
}) => {
  if (!temAlteracoesPendentes) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">
              {alteracoesPendentes} alteração(ões) pendente(s)
            </p>
            <p className="text-xs text-gray-500">
              Clique em salvar para confirmar
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onDescartarAlteracoes}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Descartar
            </button>
            <button
              onClick={onSalvarAlteracoes}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className={`h-4 w-4 ${saving ? 'animate-spin' : ''}`} />
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};