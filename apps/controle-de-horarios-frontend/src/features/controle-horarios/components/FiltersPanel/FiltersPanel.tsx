// src/features/controle-horarios/components/FiltersPanel/FiltersPanel.tsx
import React, { useMemo, useState } from 'react';
import { Search, X, ChevronDown, CheckCheck, Trash2 } from 'lucide-react';
import { FiltrosControleHorarios, OpcoesControleHorariosDto } from '@/types/controle-horarios.types';

interface FiltersPanelProps {
  showFilters: boolean;
  onClose: () => void;
  filtros: FiltrosControleHorarios;
  setFiltros: React.Dispatch<React.SetStateAction<FiltrosControleHorarios>>;
  opcoesFiltros: OpcoesControleHorariosDto;
  showLinhaMultiSelect: boolean;
  setShowLinhaMultiSelect: React.Dispatch<React.SetStateAction<boolean>>;
  onLimparFiltros: () => void;
  onAplicarFiltros: () => void;
  onAplicarFiltroRapido: (tipo: 'editados' | 'nao_editados' | 'todos') => void;
  // Filtros locais
  tipoLocal?: 'R' | 'S';
  setTipoLocal?: (v: 'R' | 'S' | undefined) => void;
  statusEdicaoLocal?: 'todos' | 'editados' | 'nao_editados';
  setStatusEdicaoLocal?: (v: 'todos' | 'editados' | 'nao_editados') => void;
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
  onAplicarFiltroRapido,
  tipoLocal,
  setTipoLocal,
  statusEdicaoLocal,
  setStatusEdicaoLocal,
}) => {
  if (!showFilters) return null;

  const handleFilterChange = (key: keyof FiltrosControleHorarios, value: any) => {
    setFiltros(prev => ({ ...prev, [key]: value }));
  };

  const servicosPadrao = useMemo(() => Array.from({ length: 100 }, (_, i) => String(i).padStart(2, '0')), []);

  // Busca local no multi-select de linhas
  const [buscaLinha, setBuscaLinha] = useState('');
  const linhasFiltradas = useMemo(() => {
    const all = opcoesFiltros.linhas || [];
    if (!buscaLinha.trim()) return all;
    const q = buscaLinha.toLowerCase();
    return all.filter(l => (l.codigo + ' ' + l.nome).toLowerCase().includes(q));
  }, [opcoesFiltros.linhas, buscaLinha]);

  return (
    <div className="border border-yellow-400/20 bg-gray-900/60 text-gray-100 rounded-xl p-6 shadow-[0_0_30px_rgba(251,191,36,0.06)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Search className="h-5 w-5 text-yellow-300" />
          Filtros Avançados
        </h3>
        <button onClick={onClose} className="text-gray-300 hover:text-gray-100">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6 ">
        {/* Setor */}
        <div >
          <label className=" block text-sm font-medium text-gray-300 mb-1">Setor</label>
          <select
            value={filtros.setor_principal_linha || ''}
            onChange={(e) => handleFilterChange('setor_principal_linha', e.target.value || undefined)}
            className="w-full min-w-[150px]   border border-gray-700 bg-transparent rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
          >
            <option className="ml-2 text-sm text-gray-300 bg-gray-900" value="">Todos</option>
            {(opcoesFiltros.setores || []).map(setor => (
              <option className="ml-2 text-sm text-gray-300 bg-gray-900" key={setor} value={setor}>{setor}</option>
            ))}
          </select>
        </div>

        {/* Linha (Multi-select) */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-300 mb-1">Linha(s)</label>
          <button
            type="button"
            onClick={() => setShowLinhaMultiSelect(!showLinhaMultiSelect)}
            className="w-full min-w-[150px] border border-gray-700 rounded-md px-3 py-2 text-sm text-left focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-transparent flex justify-between items-center"
          >
            {filtros.codigo_linha && filtros.codigo_linha.length > 0
              ? `${filtros.codigo_linha.length} selecionada(s)`
              : 'Todas as linhas'}
            <ChevronDown className={`h-4 w-4 transition-transform ${showLinhaMultiSelect ? 'rotate-180' : ''}`} />
          </button>
          {showLinhaMultiSelect && (
            <div className="absolute z-10 mt-1 w-full bg-gray-900 shadow-lg rounded-md border border-gray-700 max-h-72 overflow-y-auto">
              <div className="sticky top-0 bg-gray-900 p-2 border-b border-gray-700 flex items-center gap-2">
                <input
                  type="text"
                  value={buscaLinha}
                  onChange={(e) => setBuscaLinha(e.target.value)}
                  placeholder="Buscar linha..."
                  className="w-full bg-transparent border border-gray-700 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-yellow-400"
                />
                <button
                  type="button"
                  onClick={() => handleFilterChange('codigo_linha', undefined)}
                  className="text-xs inline-flex items-center gap-1 px-2 py-1 border border-gray-700 rounded hover:bg-gray-800"
                  title="Limpar seleção"
                >
                  <Trash2 className="h-3 w-3" /> Limpar
                </button>
              </div>
              {linhasFiltradas.map(linha => (
                <label key={linha.codigo} className="flex items-center px-3 py-2 hover:bg-gray-800/60">
                  <input
                    type="checkbox"
                    checked={filtros.codigo_linha?.includes(linha.codigo) || false}
                    onChange={(e) => {
                      const newSelected = e.target.checked
                        ? [...(filtros.codigo_linha || []), linha.codigo]
                        : (filtros.codigo_linha || []).filter(code => code !== linha.codigo);
                      if (newSelected.length <=  20) {
                        handleFilterChange('codigo_linha', newSelected);
                      } else {
                        alert('Você pode selecionar no máximo 20 linhas.');
                      }
                    }}
                    className="h-4 w-4 text-yellow-400 focus:ring-yellow-400 border-gray-700 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-200">
                    {linha.codigo}  
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Serviço (00-99) */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Serviço</label>
          <select
            value={filtros.cod_servico_numero || ''}
            onChange={(e) => handleFilterChange('cod_servico_numero', e.target.value || undefined)}
            className="w-full min-w-[150px] border border-gray-700 bg-transparent rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
          >
            <option className="ml-2 text-sm text-gray-300 bg-gray-900" value="">Todos</option>
            {servicosPadrao.map(servico => (
              <option className="ml-2 text-sm text-gray-300 bg-gray-900"key={servico} value={servico}>{servico}</option>
            ))}
          </select>
        </div>

        {/* Sentido */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Sentido</label>
          <select
            value={filtros.sentido_texto || ''}
            onChange={(e) => handleFilterChange('sentido_texto', e.target.value || undefined)}
            className="w-full min-w-[150px] border border-gray-700 bg-transparent rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
          >
            <option  className="ml-2 text-sm text-gray-300 bg-gray-900" value="">Todos</option>
            {(opcoesFiltros.sentidos || []).map(sentido => (
              <option className="ml-2 text-sm text-gray-300 bg-gray-900" key={sentido} value={sentido}>{sentido}</option>
            ))}
          </select>
        </div>

        {/* Horário Início */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Horário Início</label>
          <input
            type="time"
            value={filtros.horarioInicio || ''}
            onChange={(e) => handleFilterChange('horarioInicio', e.target.value || undefined)}
            className="w-full min-w-[120px] border border-gray-700 bg-transparent rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
          />
        </div>

        {/* Horário Fim */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Horário Fim</label>
          <input
            type="time"
            value={filtros.horarioFim || ''}
            onChange={(e) => handleFilterChange('horarioFim', e.target.value || undefined)}
            className="w-full min-w-[120px] border border-gray-700 bg-transparent rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
          />
        </div>

        {/* Motorista (livre) */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Motorista</label>
          <input
            type="text"
            value={filtros.nome_motorista || ''}
            onChange={(e) => handleFilterChange('nome_motorista', e.target.value || undefined)}
            placeholder="Nome do motorista"
            className="w-full min-w-[180px] border border-gray-700 bg-transparent rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
          />
        </div>

        {/* Crachá (Motorista/Cobrador) */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Crachá (Motorista/Cobrador)</label>
          <input
            type="text"
            value={(filtros as any).cracha_funcionario || ''}
            onChange={(e) => handleFilterChange('cracha_funcionario', e.target.value || undefined)}
            placeholder="Informe o crachá"
            className="w-full min-w-[180px] border border-gray-700 bg-transparent rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
          />
        </div>

        {/* Cobrador (livre) */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Cobrador</label>
          <input
            type="text"
            value={filtros.nome_cobrador || ''}
            onChange={(e) => handleFilterChange('nome_cobrador', e.target.value || undefined)}
            placeholder="Nome do cobrador"
            className="w-full min-w-[150px] border border-gray-700 bg-transparent rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
          />
        </div>

        {/* Código Atividade */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Código Atividade</label>
          <select
            value={filtros.cod_atividade ?? ''}
            onChange={(e) => handleFilterChange('cod_atividade', e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-full min-w-[150px] border border-gray-700 bg-transparent rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
          >
            <option className="ml-2 text-sm text-gray-300 bg-gray-900"  value="">Todas</option>
            <option className="ml-2 text-sm text-gray-300 bg-gray-900" value={2}>2 - REGULAR</option>
            <option className="ml-2 text-sm text-gray-300 bg-gray-900" value={5}>5 - RECOLHIMENTO</option>
            <option className="ml-2 text-sm text-gray-300 bg-gray-900" value={3}>3 - ESPECIAL</option>
            <option  className="ml-2 text-sm text-gray-300 bg-gray-900" value={4}>4 - RENDIÇÃO</option>
            <option className="ml-2 text-sm text-gray-300 bg-gray-900" value={10}>10 - RESERVA</option>
          </select>
        </div>

        {/* Tipo (local: R/S) */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Tipo</label>
          <select
            value={tipoLocal || ''}
            onChange={(e) => setTipoLocal && setTipoLocal((e.target.value as 'R' | 'S') || undefined)}
            className="w-full min-w-[150px] border border-gray-700 bg-transparent rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
          >
            <option className="ml-2 text-sm text-gray-300 bg-gray-900" value="">Todos</option>
            <option className="ml-2 text-sm text-gray-300 bg-gray-900"value="R">Regular (R)</option>
            <option className="ml-2 text-sm text-gray-300 bg-gray-900"value="S">Suplementar (S)</option>
          </select>
        </div>

        {/* Local Origem Direta */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Local Origem Direta</label>
          <select
            value={filtros.local_origem_viagem || ''}
            onChange={(e) => handleFilterChange('local_origem_viagem', e.target.value || undefined)}
            className="w-full min-w-[150px] border border-gray-700 bg-transparent rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
          >
            <option className="ml-2 text-sm text-gray-300 bg-gray-900" value="">Todos</option>
            {(opcoesFiltros.locaisOrigem || []).map(local => (
              <option className="ml-2 text-sm text-gray-300 bg-gray-900" key={local} value={local}>{local}</option>
            ))}
          </select>
        </div>

        {/* Local Destino Direta */}
      

        {/* Busca Geral */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Busca Geral</label>
          <input
            type="text"
            value={filtros.buscaTexto || ''}
            onChange={(e) => handleFilterChange('buscaTexto', e.target.value || undefined)}
            placeholder="Buscar em todos os campos"
            className="w-full min-w-[150px] border border-gray-700 bg-transparent rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
          />
        </div>

        {/* Edições (local) */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Edições</label>
          <select
            value={statusEdicaoLocal || 'todos'}
            onChange={(e) => setStatusEdicaoLocal && setStatusEdicaoLocal(e.target.value as any)}
            className="w-full min-w-[150px] border border-gray-700 bg-transparent rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
          >
            <option className="ml-2 text-sm text-gray-300 bg-gray-900" value="todos">Todos</option>
            <option className="ml-2 text-sm text-gray-300 bg-gray-900" value="editados">Editados por mim</option>
            <option className="ml-2 text-sm text-gray-300 bg-gray-900" value="nao_editados">Não editados</option>
          </select>
        </div>
      </div>

      <div className="mt-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Limite de Registros</label>
            <select
              value={filtros.limite || 10}
              onChange={(e) => handleFilterChange('limite', parseInt(e.target.value))}
              className="border border-gray-700 bg-transparent rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
            >
              <option className="ml-2 text-sm text-gray-300 bg-gray-900" value={10}>10 registros</option>
              <option className="ml-2 text-sm text-gray-300 bg-gray-900" value={20}>20 registros</option>
              <option className="ml-2 text-sm text-gray-300 bg-gray-900" value={30}>30 registros</option>
              <option className="ml-2 text-sm text-gray-300 bg-gray-900" value={40}>40 registros</option>
              <option className="ml-2 text-sm text-gray-300 bg-gray-900" value={50}>50 registros</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onLimparFiltros}
            className="px-4 py-2 text-sm text-gray-200 hover:text-white flex items-center gap-2 rounded-md border border-gray-700 hover:bg-gray-800"
          >
            <X className="h-4 w-4" />
            Limpar Filtros
          </button>
          <button
            onClick={onAplicarFiltros}
            className="px-4 py-2 text-sm bg-yellow-500 text-black hover:bg-yellow-400 flex items-center gap-2 rounded-md"
          >
            <CheckCheck className="h-4 w-4" />
            Aplicar Filtros
          </button>
        </div>
      </div>
    </div>
  );
};

