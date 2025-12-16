// src/features/controle-horarios/components/Header/Header.tsx
import React, { useMemo } from 'react';
import { Calendar, Filter, Save, RefreshCw, Clock, X, AlertCircle, Bell } from 'lucide-react';
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
  notificationsUnreadCount?: number;
  onOpenNotifications?: () => void;
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
  onManualSync, // Added
  notificationsUnreadCount,
  onOpenNotifications
}) => {
  const { user } = useAuth();
  const canSync = useMemo(() => canSyncControleHorarios(user?.role), [user]);
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Clock className="h-6 w-6 text-blue-600" />
            Controle de Horários
          </h1>
          <p className="text-gray-600">Gerencie informações operacionais das viagens</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Notificações - próximo ao toggle de tema no cabeçalho */}
          {typeof notificationsUnreadCount !== 'undefined' && onOpenNotifications && (
            <button
              type="button"
              onClick={onOpenNotifications}
              className="relative inline-flex items-center justify-center w-10 h-10 rounded-md border border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Notificações"
              title="Notificações"
            >
              <Bell className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              {notificationsUnreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center">
                  {notificationsUnreadCount}
                </span>
              )}
            </button>
          )}
          {/* Seletor de Data */}
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-400" />
            <input
              type="date"
              value={dataReferencia}
              onChange={(e) => onDataChange(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Botão de Filtros */}
          <button
            onClick={onToggleFilters}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors relative ${
              showFilters
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 text-sm"
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

      {/* Alerta de Alterações Pendentes */}
      {temAlteracoesPendentes && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="text-sm font-medium text-yellow-800">
                Você tem {alteracoesPendentes} alteração(ões) não salva(s)
              </p>
              <p className="text-sm text-yellow-700">
                Clique em "Salvar" para confirmar as alterações ou "Descartar" para cancelá-las.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
