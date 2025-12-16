// src/pages/controle-horarios/components/FloatingActionButton/FloatingActionButton.tsx
import React from 'react';
import { createPortal } from 'react-dom';
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

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative rounded-xl border border-gray-200 dark:border-yellow-400/20 bg-white dark:bg-neutral-900 shadow-2xl max-w-lg w-full">
        <div className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {alteracoesPendentes} alteração(ões) pendente(s)
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Clique em salvar para confirmar alterações nas viagens
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onDescartarAlteracoes}
                className="px-4 py-2 bg-gray-100 text-gray-900 dark:bg-neutral-700 dark:text-gray-200 text-sm font-medium rounded-md w-auto shadow-sm hover:bg-gray-200 dark:hover:bg-neutral-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-neutral-900 focus:ring-gray-500 transition-colors"
              >
                Descartar
              </button>
              <button
                onClick={onSalvarAlteracoes}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white dark:bg-yellow-500 dark:text-neutral-900 rounded-md text-sm font-medium hover:bg-green-700 dark:hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-neutral-900 focus:ring-green-700 dark:focus:ring-yellow-500 transition-colors"
              >
                <Save className={`h-4 w-4 ${saving ? 'animate-spin' : ''}`} />
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};