// src/features/controle-horarios/components/Header/Header.tsx
import React, { useMemo } from 'react';
import { Calendar, Filter, Save, RefreshCw, Clock, X, AlertCircle } from 'lucide-react';
import { useAuth } from '../../../../contexts/AuthContext';
import { canSyncControleHorarios } from '../../../../types/user.types';

interface HeaderProps {
  dataReferencia: string;
  onDataChange: (data: string) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  filtrosAtivos: number;
  temAlteracoesPendentes: boolean;
  alteracoesPendentes: number;
  onDescartarAlteracoes: () => void;
  onSalvarAlteracoes: () => void;
  saving: boolean;
  onSincronizarGlobus: () => void; // Renamed from onSincronizar
  sincronizando: boolean;
  onManualSync: () => void; // Added
}

export const Header: React.FC<HeaderProps> = ({
  dataReferencia,
  onDataChange,
  showFilters,
  onToggleFilters,
  filtrosAtivos,
  temAlteracoesPendentes,
  alteracoesPendentes,
  onDescartarAlteracoes,
  onSalvarAlteracoes,
  saving,
  onSincronizarGlobus, // Renamed from onSincronizar
  sincronizando,
  onManualSync // Added
}) => {
  const { user } = useAuth();
  const canSync = useMemo(() => canSyncControleHorarios(user?.role), [user]);
  return (
    <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-md shadow-lg rounded-lg p-6 border border-white/20 dark:border-yellow-500/20 transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Clock className="h-6 w-6 text-[#fbcc2c] dark:text-yellow-400" />
            Controle de Horários
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Gerencie informações operacionais das viagens</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Seletor de Data */}
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            <input
              type="date"
              value={dataReferencia}
              onChange={(e) => onDataChange(e.target.value)}
              className="border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#fbcc2c] dark:focus:ring-yellow-400 focus:border-transparent bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100"
            />
          </div>

          {/* Botão de Filtros */}
          <button
            onClick={onToggleFilters}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors relative ${showFilters
              ? 'bg-[#fbcc2c] text-[#6b5d1a] hover:bg-[#e6cd4a]'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
          >
            <Filter className="h-4 w-4" />
            Filtros
            {filtrosAtivos > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                {filtrosAtivos}
              </span>
            )}
          </button>

          {/* Botão Salvar Alterações */}
          {temAlteracoesPendentes && (
            <div className="flex items-center gap-2">
              <button
                onClick={onDescartarAlteracoes}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm"
              >
                <X className="h-4 w-4" />
                Descartar
              </button>
              <button
                onClick={onSalvarAlteracoes}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className={`h-4 w-4 ${saving ? 'animate-spin' : ''}`} />
                {saving ? 'Salvando...' : `Salvar (${alteracoesPendentes})`}
              </button>
            </div>
          )}

          {/* Botão Sincronizar com Globus */}
          {canSync && (<>
            <button
              onClick={onSincronizarGlobus} // Changed to onSincronizarGlobus
              disabled={sincronizando}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-4 w-4 ${sincronizando ? 'animate-spin' : ''}`} />
              {sincronizando ? 'Sincronizando...' : 'Sincronizar Globus'}
            </button>

            {/* Botão Sincronização Manual */}
            <button
              onClick={onManualSync}
              disabled={sincronizando || saving} // Disable if already syncing or saving
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-4 w-4 ${sincronizando ? 'animate-spin' : ''}`} />
              Sincronizar Manual
            </button>
          </>)}
        </div>
      </div>
    </div>
  )
};
