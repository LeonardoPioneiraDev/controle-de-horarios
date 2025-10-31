// src/features/controle-horarios/components/FiltersPanel/FiltersPanel.tsx
import React from 'react';
import { Search, X, ChevronDown, CheckCheck } from 'lucide-react';
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
  onAplicarFiltros: () => void;
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
  onAplicarFiltros
}) => {
  if (!showFilters) return null;

  const handleFilterChange = (key: keyof FiltrosControleHorarios, value: any) => {
    setFiltros(prev => ({ ...prev, [key]: value }));
  };

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
      
      <div className="flex flex-wrap items-end gap-4 mb-6">
        {/* Setor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Setor</label>
          <select
            value={filtros.setorPrincipal || ''}
            onChange={(e) => handleFilterChange('setorPrincipal', e.target.value || undefined)}
            className="w-full min-w-[150px] border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos</option>
            {opcoesFiltros.setores.map(setor => (
              <option key={setor} value={setor}>{setor}</option>
            ))}
          </select>
        </div>

        {/* Linha (Multi-select) */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">Linha(s)</label>
          <button
            type="button"
            onClick={() => setShowLinhaMultiSelect(!showLinhaMultiSelect)}
            className="w-full min-w-[150px] border border-gray-300 rounded-md px-3 py-2 text-sm text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white flex justify-between items-center"
          >
            {filtros.codigoLinha && filtros.codigoLinha.length > 0
              ? `${filtros.codigoLinha.length} selecionada(s)`
              : 'Todas as linhas'}
            <ChevronDown className={`h-4 w-4 transition-transform ${showLinhaMultiSelect ? 'rotate-180' : ''}`} />
          </button>
          {/* Multi-select Dropdown */}
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

                      if (newSelected.length <= 6) {
                        handleFilterChange('codigoLinha', newSelected);
                      } else {
                        // Optionally, provide user feedback here, e.g., a toast notification
                        alert('Você pode selecionar no máximo 6 linhas.');
                      }
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-900">
                    {linha.codigo} - {linha.nome}
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
            onChange={(e) => handleFilterChange('codServicoNumero', e.target.value || undefined)}
            className="w-full min-w-[150px] border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos</option>
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
            onChange={(e) => handleFilterChange('sentidoTexto', e.target.value || undefined)}
            className="w-full min-w-[150px] border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos</option>
            {opcoesFiltros.sentidos.map(sentido => (
              <option key={sentido} value={sentido}>{sentido}</option>
            ))}
          </select>
        </div>

        {/* Horário Início */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Horário Início</label>
          <input
            type="time"
            value={filtros.horarioInicio || ''}
            onChange={(e) => handleFilterChange('horarioInicio', e.target.value || undefined)}
            className="w-full min-w-[120px] border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Horário Fim */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Horário Fim</label>
          <input
            type="time"
            value={filtros.horarioFim || ''}
            onChange={(e) => handleFilterChange('horarioFim', e.target.value || undefined)}
            className="w-full min-w-[120px] border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Motorista */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Motorista</label>
          <select
            value={filtros.nomeMotorista || ''}
            onChange={(e) => handleFilterChange('nomeMotorista', e.target.value || undefined)}
            className="w-full min-w-[150px] border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos</option>
            {opcoesFiltros.motoristas.map(motorista => (
              <option key={motorista.cracha} value={motorista.nome}>{motorista.nome} ({motorista.cracha})</option>
            ))}
          </select>
        </div>

        {/* Crachá Motorista */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Crachá Motorista</label>
          <input
            type="text"
            value={filtros.crachaMotorista || ''}
            onChange={(e) => handleFilterChange('crachaMotorista', e.target.value || undefined)}
            placeholder="Crachá do motorista"
            className="w-full min-w-[150px] border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Cobrador */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cobrador</label>
          <input
            type="text"
            value={filtros.nomeCobrador || ''}
            onChange={(e) => handleFilterChange('nomeCobrador', e.target.value || undefined)}
            placeholder="Nome do cobrador"
            className="w-full min-w-[150px] border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Código Cobrador */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Código Cobrador</label>
          <input
            type="text"
            value={(filtros as any).codCobrador || ''}
            onChange={(e) => handleFilterChange('codCobrador' as keyof FiltrosControleHorarios, e.target.value || undefined)}
            placeholder="Código do cobrador"
            className="w-full min-w-[150px] border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Código Atividade */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Código Atividade</label>
          <input
            type="text"
            value={filtros.codAtividade || ''}
            onChange={(e) => handleFilterChange('codAtividade', e.target.value || undefined)}
            placeholder="Código da atividade"
            className="w-full min-w-[120px] border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Local Origem Direta */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Local Origem Direta</label>
          <select
            value={filtros.localOrigem || ''}
            onChange={(e) => handleFilterChange('localOrigem', e.target.value || undefined)}
            className="w-full min-w-[150px] border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos</option>
            {opcoesFiltros.locaisOrigem.map(local => (
              <option key={local} value={local}>{local}</option>
            ))}
          </select>
        </div>

        {/* Local Destino Direta */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Local Destino Direta</label>
          <select
            value={filtros.localDestino || ''}
            onChange={(e) => handleFilterChange('localDestino', e.target.value || undefined)}
            className="w-full min-w-[150px] border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos</option>
            {opcoesFiltros.locaisDestino.map(local => (
              <option key={local} value={local}>{local}</option>
            ))}
          </select>
        </div>

        {/* Busca Geral */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Busca Geral</label>
          <input
            type="text"
            value={filtros.buscaTexto || ''}
            onChange={(e) => handleFilterChange('buscaTexto', e.target.value || undefined)}
            placeholder="Buscar em todos os campos"
            className="w-full min-w-[150px] border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Ordenar Por */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ordenar Por</label>
          <select
            value={filtros.ordenarPor || 'horaSaida'}
            onChange={(e) => handleFilterChange('ordenarPor', e.target.value)}
            className="w-full min-w-[150px] border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="horaSaida">Hora de Saída</option>
            <option value="setorPrincipalLinha">Setor</option>
            <option value="codigoLinha">Linha</option>
            <option value="nomeMotoristaGlobus">Motorista</option>
          </select>
        </div>

        {/* Ordem */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ordem</label>
          <select
            value={filtros.ordem || 'ASC'}
            onChange={(e) => handleFilterChange('ordem', e.target.value as "ASC" | "DESC")}
            className="w-full min-w-[150px] border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="ASC">Ascendente</option>
            <option value="DESC">Descendente</option>
          </select>
        </div>
        
        {/* Mostrar apenas editadas por mim */}
        <div className="flex items-center pt-5">
          <input
            id="editadoPorUsuario"
            type="checkbox"
            checked={(filtros as any).editadoPorUsuario === true}
            onChange={(e) => handleFilterChange('editadoPorUsuario' as keyof FiltrosControleHorarios, e.target.checked ? true : undefined)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="editadoPorUsuario" className="ml-2 block text-sm text-gray-900">
            Editado por mim
          </label>
        </div>
      </div>

      <div className="mt-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Limite de Registros</label>
            <select
              value={filtros.limite || 50}
              onChange={(e) => handleFilterChange('limite', parseInt(e.target.value))}
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

        <div className="flex items-center gap-2">
            <button
                onClick={onLimparFiltros}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 flex items-center gap-2 rounded-md border border-gray-300"
            >
                <X className="h-4 w-4" />
                Limpar Filtros
            </button>
            <button
                onClick={onAplicarFiltros}
                className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2 rounded-md"
            >
                <CheckCheck className="h-4 w-4" />
                Aplicar Filtros
            </button>
        </div>
      </div>
    </div>
  );
};