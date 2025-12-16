import React, { useState, useEffect } from 'react';
import { Search, X, CheckCheck, Trash2, Loader2 } from 'lucide-react';
import { api } from '../../../../services/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface FiltersPanelProps {
  showFilters: boolean;
  onClose: () => void;
  filtros: any;
  setFiltros: React.Dispatch<React.SetStateAction<any>>;
  opcoesFiltros: { setores: string[]; sentidos: string[]; locaisOrigem: string[] };
  showLinhaMultiSelect: boolean;
  setShowLinhaMultiSelect: React.Dispatch<React.SetStateAction<boolean>>;
  onLimparFiltros: () => void;
  onAplicarFiltros: () => void;
  onMostrarHistorico: () => void;
  tipoLocal?: 'R' | 'S';
  setTipoLocal?: (v: 'R' | 'S' | undefined) => void;
  statusEdicaoLocal?: 'todos' | 'minhas_edicoes' | 'nao_editados' | 'apenas_editadas';
  setStatusEdicaoLocal?: (v: 'todos' | 'minhas_edicoes' | 'nao_editados' | 'apenas_editadas') => void;
}

export const FiltersPanel: React.FC<FiltersPanelProps> = ({
  showFilters,
  onClose,
  filtros,
  setFiltros,
  opcoesFiltros,
  showLinhaMultiSelect,
  setShowLinhaMultiSelect,
  onLimparFiltros,
  onAplicarFiltros,
  onMostrarHistorico,
  tipoLocal,
  setTipoLocal,
  statusEdicaoLocal,
  setStatusEdicaoLocal,
}) => {
  const servicosPadrao = Array.from({ length: 100 }, (_, i) => i.toString().padStart(2, '0'));

  const handleFilterChange = (key: string, value: any) => {
    setFiltros((prev: any) => ({ ...prev, [key]: value }));
  };

  // Saved filters logic (API)
  // savedFilters state removido (React Query usado)
  const [newFilterName, setNewFilterName] = useState('');
  // Shared query with page header to keep data in sync
  type UserFilterServer = {
    id: string;
    name: string;
    filters?: Record<string, unknown> | null;
    tipoLocal?: 'R' | 'S' | null;
    statusEdicaoLocal?: 'todos' | 'minhas_edicoes' | 'nao_editados' | 'apenas_editadas' | null;
    createdAt?: string;
  };
  const queryClient = useQueryClient();
  const { data: serverSavedFilters, isFetching: loadingFilters } = useQuery({
    queryKey: ['user-filters'],
    queryFn: async () => {
      const res = await api.get<UserFilterServer[]>('/user-filters');
      return res.data;
    },
    staleTime: 60_000,
  });

  // Lista vinda do servidor (via React Query)

  const savedFilters = serverSavedFilters ?? [];

  const loadSavedFilters = async () => {};

  const handleSaveCurrentAsNamedFilter = async () => {
    if (!newFilterName.trim()) return;
    if (savedFilters.length >= 10) {
      alert("Limite de 10 filtros salvos atingido. Remova um para salvar outro.");
      return;
    }

    try {
      const newFilter = {
        name: newFilterName.trim(),
        filters: { ...filtros },
        tipoLocal,
        statusEdicaoLocal,
      };

      console.log('🔄 [FiltersPanel] Salvando novo filtro:', newFilter);
      const response = await api.post('/user-filters', newFilter);
      console.log('✅ [FiltersPanel] Filtro salvo com sucesso:', response.data);
      
      setNewFilterName('');
      // keep shared cache in sync
      queryClient.invalidateQueries({ queryKey: ['user-filters'] });
    } catch (error: any) {
      console.error('❌ [FiltersPanel] Erro ao salvar filtro:', error);
      alert(error.response?.data?.message || "Erro ao salvar filtro.");
    }
  };

  const handleDeleteSavedFilter = async (id: string) => {
    try {
      console.log('🗑️ [FiltersPanel] Excluindo filtro:', id);
      await api.delete(`/user-filters/${id}`);
      console.log('✅ [FiltersPanel] Filtro excluído com sucesso');
      
      // keep shared cache in sync
      queryClient.invalidateQueries({ queryKey: ['user-filters'] });
    } catch (error) {
      console.error('❌ [FiltersPanel] Erro ao excluir filtro:', error);
      alert("Erro ao excluir filtro.");
    }
  };

  const handleApplySavedFilter = (sf: any) => {
    setFiltros(sf.filters || {});
    if (setTipoLocal) setTipoLocal(sf.tipoLocal);
    if (setStatusEdicaoLocal && sf.statusEdicaoLocal) setStatusEdicaoLocal(sf.statusEdicaoLocal);
    // Optionally auto-apply
    setTimeout(() => onAplicarFiltros(), 0);
  };


  return (
    <div className="border border-gray-300 dark:border-yellow-400/20 bg-white dark:bg-gray-900/100 text-gray-900 dark:text-gray-100 rounded-xl p-4 md:p-6 shadow-md dark:shadow-[0_0_30px_rgba(251,191,36,0.06)]">
      <div className="flex items-center justify-between mb-4 border-b border-gray-200 dark:border-gray-800 pb-4">
        <h3 className="text-lg font-bold flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <Search className="h-5 w-5 text-yellow-600 dark:text-yellow-300" />
          Filtros Avançados
        </h3>
        <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5 mb-6">
        {/* Setor */}
        <div>
          <label className="block text-sm font-bold text-gray-800 dark:text-gray-300 mb-1.5">Setor</label>
          <select
            value={filtros.setor_principal_linha || ''}
            onChange={(e) => handleFilterChange('setor_principal_linha', e.target.value || undefined)}
            className="w-full min-w-[150px] border border-gray-400 dark:border-gray-700 bg-white dark:bg-transparent rounded-md px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent shadow-sm"
          >
            <option className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" value="">Todos</option>
            {(opcoesFiltros.setores || []).map(setor => (
              <option className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" key={setor} value={setor}>{setor}</option>
            ))}
          </select>
        </div>

        {/* Linha (Multi-select) - Simplificado para input texto se não houver lista */}
        <div className="relative">
          <label className="block text-sm font-bold text-gray-800 dark:text-gray-300 mb-1.5">Linha(s)</label>
          {/* Fallback para input de texto se não tivermos a lista de linhas completa aqui */}
          <input
            type="text"
            value={filtros.codigo_linha ? (Array.isArray(filtros.codigo_linha) ? filtros.codigo_linha.join(', ') : filtros.codigo_linha) : ''}
            onChange={(e) => {
              const val = e.target.value;
              if (!val) {
                handleFilterChange('codigo_linha', undefined);
                return;
              }
              const parts = val.split(',').map((s: string) => s.trim());
              if (parts.length > 50) {
                // Optional: alert or just truncate? User asked for "can filter up to 50".
                // We'll just allow it but maybe show a warning if we wanted.
                // For now, just pass it.
              }
              handleFilterChange('codigo_linha', parts);
            }}
            placeholder="Códigos separados por vírgula (até 50)"
            className="w-full min-w-[150px] border border-gray-400 dark:border-gray-700 bg-white dark:bg-transparent rounded-md px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent shadow-sm"
          />
        </div>

        {/* Serviço (00-99) */}
        <div>
          <label className="block text-sm font-bold text-gray-800 dark:text-gray-300 mb-1.5">Serviço</label>
          <select
            value={filtros.cod_servico_numero || ''}
            onChange={(e) => handleFilterChange('cod_servico_numero', e.target.value || undefined)}
            className="w-full min-w-[150px] border border-gray-400 dark:border-gray-700 bg-white dark:bg-transparent rounded-md px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent shadow-sm"
          >
            <option className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" value="">Todos</option>
            {servicosPadrao.map(servico => (
              <option className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" key={servico} value={servico}>{servico}</option>
            ))}
          </select>
        </div>

        {/* Sentido */}
        <div>
          <label className="block text-sm font-bold text-gray-800 dark:text-gray-300 mb-1.5">Sentido</label>
          <select
            value={filtros.sentido_texto || ''}
            onChange={(e) => handleFilterChange('sentido_texto', e.target.value || undefined)}
            className="w-full min-w-[150px] border border-gray-400 dark:border-gray-700 bg-white dark:bg-transparent rounded-md px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent shadow-sm"
          >
            <option className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" value="">Todos</option>
            {(opcoesFiltros.sentidos || []).map(sentido => (
              <option className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" key={sentido} value={sentido}>{sentido}</option>
            ))}
          </select>
        </div>

        {/* Horário Início */}
        <div>
          <label className="block text-sm font-bold text-gray-800 dark:text-gray-300 mb-1.5">Horário Início</label>
          <input
            type="time"
            value={filtros.horarioInicio || ''}
            onChange={(e) => handleFilterChange('horarioInicio', e.target.value || undefined)}
            className="w-full min-w-[120px] border border-gray-400 dark:border-gray-700 bg-white dark:bg-transparent rounded-md px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent shadow-sm"
          />
        </div>

        {/* Horário Fim */}
        <div>
          <label className="block text-sm font-bold text-gray-800 dark:text-gray-300 mb-1.5">Horário Fim</label>
          <input
            type="time"
            value={filtros.horarioFim || ''}
            onChange={(e) => handleFilterChange('horarioFim', e.target.value || undefined)}
            className="w-full min-w-[120px] border border-gray-400 dark:border-gray-700 bg-white dark:bg-transparent rounded-md px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent shadow-sm"
          />
        </div>

        {/* Motorista (livre) */}
        <div>
          <label className="block text-sm font-bold text-gray-800 dark:text-gray-300 mb-1.5">Motorista</label>
          <input
            type="text"
            value={filtros.nome_motorista || ''}
            onChange={(e) => handleFilterChange('nome_motorista', e.target.value || undefined)}
            placeholder="Nome do motorista"
            className="w-full min-w-[180px] border border-gray-400 dark:border-gray-700 bg-white dark:bg-transparent rounded-md px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent shadow-sm"
          />
        </div>

        {/* Crachá (Motorista/Cobrador) */}
        <div>
          <label className="block text-sm font-bold text-gray-800 dark:text-gray-300 mb-1.5">Crachá (Motorista/Cobrador)</label>
          <input
            type="text"
            value={(filtros as any).cracha_funcionario || ''}
            onChange={(e) => handleFilterChange('cracha_funcionario', e.target.value || undefined)}
            placeholder="Informe o crachá"
            className="w-full min-w-[180px] border border-gray-400 dark:border-gray-700 bg-white dark:bg-transparent rounded-md px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent shadow-sm"
          />
        </div>

        {/* Cobrador (livre) */}
        <div>
          <label className="block text-sm font-bold text-gray-800 dark:text-gray-300 mb-1.5">Cobrador</label>
          <input
            type="text"
            value={filtros.nome_cobrador || ''}
            onChange={(e) => handleFilterChange('nome_cobrador', e.target.value || undefined)}
            placeholder="Nome do cobrador"
            className="w-full min-w-[150px] border border-gray-400 dark:border-gray-700 bg-white dark:bg-transparent rounded-md px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent shadow-sm"
          />
        </div>

        {/* Código Atividade */}
        <div>
          <label className="block text-sm font-bold text-gray-800 dark:text-gray-300 mb-1.5">Código Atividade</label>
          <select
            value={filtros.cod_atividade ?? ''}
            onChange={(e) => {
              const raw = e.target.value;
              // Zerar ambos ao escolher "Todas"
              if (!raw) {
                handleFilterChange('cod_atividade', undefined);
                handleFilterChange('nome_atividade', undefined);
                return;
              }
              const v = parseInt(raw, 10);
              // Para 1 e 24, enviar o código E um fallback por nome para cobrir registros sem código
              if (false && v === 1) {
                handleFilterChange('cod_atividade', 1);
                handleFilterChange('nome_atividade', 'GARAGEM');
                return;
              }
              if (false && v === 24) {
                handleFilterChange('cod_atividade', 24);
                handleFilterChange('nome_atividade', 'DESLOCAMENTO');
                return;
              }
              handleFilterChange('nome_atividade', undefined);
              handleFilterChange('cod_atividade', Number.isFinite(v) ? v : undefined);
            }}
            className="w-full min-w-[150px] border border-gray-400 dark:border-gray-700 bg-white dark:bg-transparent rounded-md px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent shadow-sm"
          >
            <option className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" value="">Todas</option>
            <option className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" value={1}>1 - SAÍDA DE GARAGEM</option>
            <option className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" value={2}>2 - REGULAR</option>
            <option className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" value={5}>5 - RECOLHIMENTO</option>
            <option className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" value={3}>3 - ESPECIAL</option>
            <option className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" value={4}>4 - RENDIÇÃO</option>
            <option className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" value={10}>10 - RESERVA</option>
            <option className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" value={24}>24 - DESLOCAMENTO DE VEÍCULO</option>
          </select>
        </div>

        {/* Tipo (local: R/S) */}
        <div>
          <label className="block text-sm font-bold text-gray-800 dark:text-gray-300 mb-1.5">Tipo</label>
          <select
            value={tipoLocal || ''}
            onChange={(e) => setTipoLocal && setTipoLocal((e.target.value as 'R' | 'S') || undefined)}
            className="w-full min-w-[150px] border border-gray-400 dark:border-gray-700 bg-white dark:bg-transparent rounded-md px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent shadow-sm"
          >
            <option className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" value="">Todos</option>
            <option className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" value="R">Regular (R)</option>
            <option className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" value="S">Suplementar (S)</option>
          </select>
        </div>

        {/* Local Origem Direta - Multi-select (até 4) */}
        <div className="relative">
          <label className="block text-sm font-bold text-gray-800 dark:text-gray-300 mb-1.5">
            Local Origem ({Array.isArray(filtros.local_origem_viagem) ? filtros.local_origem_viagem.length : 0}/10)
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                const dropdown = document.getElementById('localidade-dropdown');
                if (dropdown) dropdown.classList.toggle('hidden');
              }}
              className="w-full min-w-[150px] border border-gray-400 dark:border-gray-700 bg-white dark:bg-transparent rounded-md px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent shadow-sm text-left"
            >
              {Array.isArray(filtros.local_origem_viagem) && filtros.local_origem_viagem.length > 0
                ? filtros.local_origem_viagem.join(', ')
                : 'Selecione até 10'}
            </button>
            <div
              id="localidade-dropdown"
              className="hidden absolute z-50 mt-1 w-full max-h-60 overflow-auto bg-white dark:bg-gray-900 border border-gray-400 dark:border-gray-700 rounded-md shadow-lg"
            >
              {(opcoesFiltros.locaisOrigem || []).map(local => {
                const selected = Array.isArray(filtros.local_origem_viagem) && filtros.local_origem_viagem.includes(local);
                const count = Array.isArray(filtros.local_origem_viagem) ? filtros.local_origem_viagem.length : 0;
                const canSelect = selected || count < 10;
                return (
                  <label
                    key={local}
                    className={`flex items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer ${!canSelect ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      disabled={!canSelect}
                      onChange={(e) => {
                        const currentList = Array.isArray(filtros.local_origem_viagem) ? filtros.local_origem_viagem : [];
                        let newList;
                        if (e.target.checked) {
                          if (currentList.length < 10) {
                            newList = [...currentList, local];
                          } else {
                            return;
                          }
                        } else {
                          newList = currentList.filter(l => l !== local);
                        }
                        handleFilterChange('local_origem_viagem', newList.length > 0 ? newList : undefined);
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-900 dark:text-gray-100">{local}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Busca Geral */}
        <div>
          <label className="block text-sm font-bold text-gray-800 dark:text-gray-300 mb-1.5">Busca Geral</label>
          <input
            type="text"
            value={filtros.buscaTexto || ''}
            onChange={(e) => handleFilterChange('buscaTexto', e.target.value || undefined)}
            placeholder="Buscar em todos os campos"
            className="w-full min-w-[150px] border border-gray-400 dark:border-gray-700 bg-white dark:bg-transparent rounded-md px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent shadow-sm"
          />
        </div>

        {/* Edições (local) */}
        <div>
          <label className="block text-sm font-bold text-gray-800 dark:text-gray-300 mb-1.5">Edições</label>
          <select
            value={statusEdicaoLocal || 'todos'}
            onChange={(e) => {
              const v = e.target.value as 'todos' | 'minhas_edicoes' | 'nao_editados' | 'apenas_editadas';
              if (setStatusEdicaoLocal) setStatusEdicaoLocal(v);
              onAplicarFiltros();
            }}
            className="w-full min-w-[150px] border border-gray-400 dark:border-gray-700 bg-white dark:bg-transparent rounded-md px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent shadow-sm"
          >
            <option className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" value="todos">Todos</option>
            <option className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" value="apenas_editadas">Apenas Editadas (qualquer usuário)</option>
            <option className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" value="minhas_edicoes">Minhas Edições</option>
            <option className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" value="nao_editados">Não Editados</option>
          </select>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4 border-t border-gray-200 dark:border-gray-800 pt-6">
        {/* Seção de filtros salvos */}
        <div className="flex flex-col sm:flex-row items-end gap-3 flex-wrap">
          <div className="flex-1 w-full sm:w-auto min-w-[220px]">
            <label className="block text-sm font-bold text-gray-800 dark:text-gray-300 mb-1.5">Salvar filtro (até 10)</label>
            <input
              type="text"
              value={newFilterName}
              maxLength={40}
              onChange={(e) => setNewFilterName(e.target.value)}
              placeholder="Nome do filtro (ex.: Madrugada Setor 7000)"
              className="w-full border border-gray-400 dark:border-gray-700 bg-white dark:bg-transparent rounded-md px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent shadow-sm"
            />
          </div>
          <button
            onClick={handleSaveCurrentAsNamedFilter}
            disabled={!newFilterName.trim() || savedFilters.length >= 10}
            className={`w-full sm:w-auto px-4 py-2 text-sm rounded-md flex items-center justify-center gap-2 font-medium shadow-sm transition-colors ${(!newFilterName.trim() || savedFilters.length >= 10) ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed' : 'bg-yellow-500 text-black hover:bg-yellow-400'}`}
            title={savedFilters.length >= 10 ? 'Limite de 10 filtros atingido' : 'Salvar filtro atual'}
          >
            <CheckCheck className="h-4 w-4" /> Salvar Filtro
          </button>
        </div>

        {savedFilters.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {savedFilters.map((sf) => (
              <span key={sf.name} className="inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-yellow-50 dark:bg-yellow-400/10 px-3 py-1 text-xs text-yellow-800 dark:text-yellow-200 font-medium">
                <button
                  className="hover:underline"
                  title="Aplicar filtro"
                  onClick={() => handleApplySavedFilter(sf)}
                >{sf.name}</button>
                <button
                  className="p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 dark:text-red-400 transition-colors"
                  title="Excluir filtro"
                  onClick={() => handleDeleteSavedFilter(sf.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between pt-2 gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="w-full sm:w-auto">
              <label className="block text-sm font-bold text-gray-800 dark:text-gray-300 mb-1.5">Limite de Registros</label>
              <select
                value={filtros.limite || 10}
                onChange={(e) => handleFilterChange('limite', parseInt(e.target.value))}
                className="w-full sm:w-auto border border-gray-400 dark:border-gray-700 bg-white dark:bg-transparent rounded-md px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent shadow-sm"
              >
                <option className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" value={10}>10 registros</option>
                <option className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" value={20}>20 registros</option>
                <option className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" value={30}>30 registros</option>
                <option className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" value={40}>40 registros</option>
                <option className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" value={50}>50 registros</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onLimparFiltros}
              className="w-full sm:w-auto justify-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white flex items-center gap-2 rounded-md border border-gray-400 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium transition-colors"
            >
              <X className="h-4 w-4" />
              Limpar
            </button>
            <button
              onClick={onAplicarFiltros}
              className="w-full sm:w-auto justify-center px-4 py-2 text-sm bg-yellow-500 text-black hover:bg-yellow-400 flex items-center gap-2 rounded-md font-bold shadow-sm transition-colors"
            >
              <CheckCheck className="h-4 w-4" />
              Aplicar
            </button>
            <button
              onClick={onMostrarHistorico}
              className="w-full sm:w-auto justify-center px-4 py-2 text-sm text-yellow-700 dark:text-yellow-300 hover:text-yellow-800 dark:hover:text-yellow-200 flex items-center gap-2 rounded-md border border-yellow-500/50 hover:bg-yellow-50 dark:hover:bg-yellow-400/10 font-medium transition-colors"
              title="Ver histórico (viagens editadas) com filtros atuais"
            >
              Histórico
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
