// src/features/controle-horarios/components/FiltersPanel/FiltersPanel.tsx
import React from 'react';
import { Search, X } from 'lucide-react';
import { FiltrosControleHorarios, OpcoesControleHorarios } from '../../types/controle-horarios.types';

interface FiltersPanelProps {
  showFilters: boolean;
  onClose: () => void;
  filtros: FiltrosControleHorarios;
  setFiltros: React.Dispatch<React.SetStateAction<FiltrosControleHorarios>>;
  opcoesFiltros: OpcoesControleHorarios;
  showLinhaMultiSelect: boolean;
  setShowLinhaMultiSelect: React.Dispatch<React.SetStateAction<boolean>>;
  onLimparFiltros: () => void;
}

export const FiltersPanel: React.FC<FiltersPanelProps> = ({
  showFilters,
  onClose,
  filtros,
  setFiltros,
  opcoesFiltros,
  showLinhaMultiSelect,
  setShowLinhaMultiSelect,
  onLimparFiltros
}) => {
  if (!showFilters) return null;

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          <Search className="h-5 w-5" />
          Filtros Avançados
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Grupo: Localização */}
        <div className="lg:col-span-2 p-4 border rounded-md bg-gray-50">
          <h4 className="text-sm font-semibold text-gray-800 mb-3">Localização</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Setor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Setor</label>
              <select
                value={filtros.setorPrincipal || ''}
                onChange={(e) => setFiltros(prev => ({ ...prev, setorPrincipal: e.target.value || undefined }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos os setores</option>
                {opcoesFiltros.setores.map(setor => (
                  <option key={setor} value={setor}>{setor}</option>
                ))}
              </select>
            </div>
            {/* Local Origem */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Local Origem</label>
              <select
                value={filtros.localOrigem || ''}
                onChange={(e) => setFiltros(prev => ({ ...prev, localOrigem: e.target.value || undefined }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos os locais de origem</option>
                {opcoesFiltros.locaisOrigem?.map(local => (
                  <option key={local} value={local}>{local}</option>
                ))}
              </select>
            </div>
            {/* Local Destino */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Local Destino</label>
              <select
                value={filtros.localDestino || ''}
                onChange={(e) => setFiltros(prev => ({ ...prev, localDestino: e.target.value || undefined }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos os locais de destino</option>
                {opcoesFiltros.locaisDestino?.map(local => (
                  <option key={local} value={local}>{local}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Grupo: Linha e Serviço */}
        <div className="lg:col-span-2 p-4 border rounded-md bg-gray-50">
          <h4 className="text-sm font-semibold text-gray-800 mb-3">Linha e Serviço</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Linha (Multi-select) */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Linha(s)</label>
              <button
                type="button"
                onClick={() => setShowLinhaMultiSelect(!showLinhaMultiSelect)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                {filtros.codigoLinha && filtros.codigoLinha.length > 0
                  ? `${filtros.codigoLinha.length} linha(s) selecionada(s)`
                  : 'Todas as linhas'}
              </button>
              {showLinhaMultiSelect && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-y-auto">
                  {opcoesFiltros.linhas.map(linha => (
                    <label key={linha.codigo} className="flex items-center px-3 py-2 hover:bg-gray-100">
                      <input
                        type="checkbox"
                        checked={filtros.codigoLinha?.includes(linha.codigo) || false}
                        onChange={(e) => {
                          const newSelected = e.target.checked
                            ? [...(filtros.codigoLinha || []), linha.codigo]
                            : (filtros.codigoLinha || []).filter(code => code !== linha.codigo);
                          setFiltros(prev => ({ ...prev, codigoLinha: newSelected }));
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-900">
                        {linha.codigo}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            {/* Serviço */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Serviço</label>
              <select
                value={filtros.codServicoNumero || ''}
                onChange={(e) => setFiltros(prev => ({ ...prev, codServicoNumero: e.target.value || undefined }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos os serviços</option>
                {opcoesFiltros.servicos.map(servico => (
                  <option key={servico} value={servico}>{servico}</option>
                ))}
              </select>
            </div>
            {/* Sentido */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sentido</label>
              <select
                value={filtros.sentidoTexto || ''}
                onChange={(e) => setFiltros(prev => ({ ...prev, sentidoTexto: e.target.value || undefined }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos os sentidos</option>
                {opcoesFiltros.sentidos.map(sentido => (
                  <option key={sentido} value={sentido}>{sentido}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Grupo: Horários */}
        <div className="lg:col-span-2 p-4 border rounded-md bg-gray-50">
          <h4 className="text-sm font-semibold text-gray-800 mb-3">Horários</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Horário Início */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Horário Início</label>
              <input
                type="time"
                value={filtros.horarioInicio || ''}
                onChange={(e) => setFiltros(prev => ({ ...prev, horarioInicio: e.target.value || undefined }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {/* Horário Fim */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Horário Fim</label>
              <input
                type="time"
                value={filtros.horarioFim || ''}
                onChange={(e) => setFiltros(prev => ({ ...prev, horarioFim: e.target.value || undefined }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Grupo: Motorista */}
        <div className="lg:col-span-2 p-4 border rounded-md bg-gray-50">
          <h4 className="text-sm font-semibold text-gray-800 mb-3">Motorista</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Motorista */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Motorista</label>
              <input
                type="text"
                value={filtros.nomeMotorista || ''}
                onChange={(e) => setFiltros(prev => ({ ...prev, nomeMotorista: e.target.value || undefined }))}
                placeholder="Nome do motorista"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {/* Crachá Motorista */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Crachá Motorista</label>
              <input
                type="text"
                value={filtros.crachaMotorista || ''}
                onChange={(e) => setFiltros(prev => ({ ...prev, crachaMotorista: e.target.value || undefined }))}
                placeholder="Crachá do motorista"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Grupo: Outros */}
        <div className="lg:col-span-4 p-4 border rounded-md bg-gray-50">
          <h4 className="text-sm font-semibold text-gray-800 mb-3">Outros</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Código Atividade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código Atividade</label>
              <input
                type="text"
                value={filtros.codAtividade || ''}
                onChange={(e) => setFiltros(prev => ({ ...prev, codAtividade: e.target.value || undefined }))}
                placeholder="Código da atividade"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {/* Busca Geral */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Busca Geral</label>
              <input
                type="text"
                value={filtros.buscaTexto || ''}
                onChange={(e) => setFiltros(prev => ({ ...prev, buscaTexto: e.target.value || undefined }))}
                placeholder="Buscar em todos os campos"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {/* Editado por Usuário */}
            <div className="flex items-center mt-6">
              <input
                id="editadoPorUsuario"
                type="checkbox"
                checked={filtros.editadoPorUsuario === true}
                onChange={(e) => setFiltros(prev => ({ ...prev, editadoPorUsuario: e.target.checked ? true : undefined }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="editadoPorUsuario" className="ml-2 block text-sm text-gray-900">
                Mostrar apenas viagens editadas por mim
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Limite de Registros</label>
            <select
              value={filtros.limite || 50}
              onChange={(e) => setFiltros(prev => ({ ...prev, limite: parseInt(e.target.value) }))}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={25}>25 registros</option>
              <option value={50}>50 registros</option>
              <option value={100}>100 registros</option>
              <option value={200}>200 registros</option>
              <option value={500}>500 registros</option>
            </select>
          </div>
        </div>

        <button
          onClick={onLimparFiltros}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 flex items-center gap-2"
        >
          <X className="h-4 w-4" />
          Limpar Filtros
        </button>
      </div>
    </div>
  );
};