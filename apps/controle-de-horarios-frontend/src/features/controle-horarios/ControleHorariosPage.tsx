// src/features/controle-horarios/ControleHorariosPage.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useControleHorarios } from './hooks/useControleHorarios';
import {
  ControleHorarioItemDto,
  FiltrosControleHorarios,
  OpcoesControleHorariosDto,
  StatusControleHorariosDto,
  SalvarControleHorariosDto,
} from '@/types/controle-horarios.types';
import { useAuth } from '@/contexts/AuthContext';
import {
  Bus,
  Calendar,
  Filter,
  RefreshCw,
  Clock,
  MapPin,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronDown,
  Loader2,
  Edit,
  Save,
  X,
  PlusCircle,
  Trash2,
  Square
} from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { controleHorariosService } from '@/services/controleHorariosService';
import { EditDriverCobradorModal } from './components/EditDriverCobradorModal';

// Componente para o cabeçalho da página
const PageHeader = ({ onSync, onToggleFilters, filtersVisible, synchronizing, temDadosNaBase, onToggleFullScreen, isFullScreen }: {
  onSync: (overwrite: boolean) => Promise<void>;
  onToggleFilters: () => void;
  filtersVisible: boolean;
  synchronizing: boolean;
  temDadosNaBase: boolean;
  onToggleFullScreen: () => void;
  isFullScreen: boolean;
}) => {
  const handleSyncClick = async () => {
    if (temDadosNaBase) {
      const confirmOverwrite = window.confirm(
        'Já existem dados de controle de horários para esta data. Deseja refazer a sincronização e sobrescrever os dados existentes?'
      );
      if (confirmOverwrite) {
        await onSync(true); // Sobrescrever
      } else {
        // Se o usuário não quiser sobrescrever, não faz nada ou exibe uma mensagem
        toast.info('Sincronização cancelada. Dados existentes não foram alterados.', { position: "bottom-right" });
      }
    } else {
      await onSync(false); // Primeira sincronização, não sobrescreve
    }
  };

  return (
    <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Controle de Horários</h1>
        <p className="mt-1 text-md text-gray-500">
          Gerencie e edite os horários das viagens importadas do Globus.
        </p>
      </div>
      <div className="flex space-x-3">
        <button
          onClick={onToggleFilters}
          className={`px-4 py-2 rounded-lg border flex items-center transition-all duration-300 ${
            filtersVisible
              ? 'bg-blue-50 border-blue-200 text-blue-700'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filtros
          <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${filtersVisible ? 'rotate-180' : ''}`} />
        </button>
        <button
          onClick={handleSyncClick}
          disabled={synchronizing}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center transition-colors"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${synchronizing ? 'animate-spin' : ''}`} />
        </button>
        <button
          onClick={onToggleFullScreen}
          className={`px-4 py-2 rounded-lg border flex items-center transition-all duration-300 ${
            isFullScreen
              ? 'bg-blue-50 border-blue-200 text-blue-700'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Square className="h-4 w-4 mr-2" />
          {isFullScreen ? 'Sair da Tela Cheia' : 'Tela Cheia'}
        </button>
      </div>
    </div>
  );
};

// Componente para a seleção de data e exibição de status
const DateAndStatus = ({ date, onDateChange, status, onSincronizarManual }: {
  date: string;
  onDateChange: (date: string) => void;
  status: StatusControleHorariosDto | null;
  onSincronizarManual: () => Promise<void>;
}) => (
  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
      <div className="flex items-card space-x-4">
        <label htmlFor="date-picker" className="text-sm font-medium text-gray-700">
          Data de Referência:
        </label>
        <input
          id="date-picker"
          type="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      {status && (
        <div className="flex items-center space-x-6 mt-4 md:mt-0 text-sm">
          <div>
            <span className="text-gray-500">Status: </span>
            <span className={`font-semibold ${status.data.existeViagensGlobus ? 'text-green-600' : 'text-red-600'}`}>
              {status.data.existeViagensGlobus ? 'Dados Globus Disponíveis' : 'Sem Dados Globus'}
            </span>
          </div>
          {status.data.totalViagensGlobus > 0 && (
            <div>
              <span className="text-gray-500">Total Viagens Globus: </span>
              <span className="font-semibold text-gray-800">
                {status.data.totalViagensGlobus.toLocaleString()}
              </span>
            </div>
          )}
          {status.data.viagensEditadas !== undefined && (
            <div>
              <span className="text-gray-500">Editadas: </span>
              <span className="font-semibold text-gray-800">
                {status.data.viagensEditadas.toLocaleString()} ({status.data.percentualEditado}%)
              </span>
            </div>
          )}
          {status.data.ultimaAtualizacao && (
            <div>
              <span className="text-gray-500">Última Atualização: </span>
              <span className="font-semibold text-gray-800">
                {new Date(status.data.ultimaAtualizacao).toLocaleString('pt-BR')}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  </div>
);

interface FilterSectionProps {
  filters: FiltrosControleHorarios;
  onFilterChange: (key: keyof FiltrosControleHorarios, value: any) => void;
  onClearFilters: () => void;
  opcoesFiltro: OpcoesControleHorariosDto;
  onPageSizeChange: (size: number) => void;
  aplicarFiltroRapido: (tipo: 'todos' | 'editados' | 'nao_editados') => void;
  statusEdicaoLocal: 'todos' | 'editados' | 'nao_editados';
}

// Componente de Filtros
const FilterSection = ({ filters, onFilterChange, onClearFilters, opcoesFiltro, onPageSizeChange, aplicarFiltroRapido, statusEdicaoLocal }: FilterSectionProps) => {
  const handleLineSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
    if (selectedOptions.length <= 6) {
      onFilterChange('codigoLinha', selectedOptions.length > 0 ? selectedOptions : undefined);
    } else {
      toast.warn('Você pode selecionar no máximo 6 linhas.', { position: "bottom-right" });
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {/* Filtro por Setor Principal */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Setor Principal</label>
          <select
            value={filters.setorPrincipal || ''}
            onChange={(e) => onFilterChange('setorPrincipal', e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos os Setores</option>
            {opcoesFiltro.setores.map((setor) => (
              <option key={setor} value={setor}>{setor}</option>
            ))}
          </select>
        </div>

        {/* Filtro por Código da Linha (Múltipla Seleção) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Linha</label>
          <select
            multiple
            value={filters.codigoLinha || []}
            onChange={handleLineSelectionChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 h-28" 
          >
            {opcoesFiltro.linhas.map((linha) => (
              <option key={linha.codigo} value={linha.codigo}>{`${linha.codigo} - ${linha.nome}`}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">Selecione até 6 linhas.</p>
        </div>

        {/* Filtro por Serviço Numérico */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Serviço Numérico</label>
          <select
            value={filters.codServicoNumero || ''}
            onChange={(e) => onFilterChange('codServicoNumero', e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos os Serviços</option>
            {opcoesFiltro.servicos.map((servico) => (
              <option key={servico} value={servico}>{servico}</option>
            ))}
          </select>
        </div>

        {/* Filtro por Sentido */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sentido</label>
          <select
            value={filters.sentidoTexto || ''}
            onChange={(e) => onFilterChange('sentidoTexto', e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos os Sentidos</option>
            {opcoesFiltro.sentidos.map((sentido) => (
              <option key={sentido} value={sentido}>{sentido === 'I' ? 'Ida' : 'Volta'}</option>
            ))}
          </select>
        </div>

        {/* Filtro por Atividade */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Atividade</label>
          <select
            value={filters.codAtividade || ''}
            onChange={(e) => onFilterChange('codAtividade', e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas as Atividades</option>
            <option value="especial">Especial</option>
            <option value="regular">Regular</option>
            <option value="recolhimento">Recolhimento</option>
            <option value="rendicao">Rendicão</option>
          </select>
        </div>

        {/* Filtro por Local de Origem */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Local de Origem</label>
          <select
            value={filters.localOrigem || ''}
            onChange={(e) => onFilterChange('localOrigem', e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos os Locais de Origem</option>
            {opcoesFiltro.locaisOrigem.map((local) => (
              <option key={local} value={local}>{local}</option>
            ))}
          </select>
        </div>

        {/* Filtro por Horário Início */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Horário Início (a partir de)</label>
          <input
            type="time"
            value={filters.horarioInicio || ''}
            onChange={(e) => onFilterChange('horarioInicio', e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filtro por Horário Fim */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Horário Fim (até)</label>
          <input
            type="time"
            value={filters.horarioFim || ''}
            onChange={(e) => onFilterChange('horarioFim', e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filtro por Nome Motorista */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome Motorista</label>
          <input
            type="text"
            value={filters.nomeMotorista || ''}
            onChange={(e) => onFilterChange('nomeMotorista', e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nome Motorista"
          />
        </div>

        {/* Filtro por Crachá Motorista */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Crachá Motorista</label>
          <input
            type="text"
            value={filters.crachaMotorista || ''}
            onChange={(e) => onFilterChange('crachaMotorista', e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Crachá Motorista"
          />
        </div>

        {/* Filtro por Nome Cobrador */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome Cobrador</label>
          <input
            type="text"
            value={filters.nomeCobrador || ''}
            onChange={(e) => onFilterChange('nomeCobrador', e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nome Cobrador"
          />
        </div>

        {/* Filtro por Crachá Cobrador */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Crachá Cobrador</label>
          <input
            type="text"
            value={filters.crachaCobrador || ''}
            onChange={(e) => onFilterChange('crachaCobrador', e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Crachá Cobrador"
          />
        </div>

        {/* Filtro por Serviço = Motorista */}
        <div className="flex items-center">
          <input
            id="servico-igual-motorista"
            type="checkbox"
            checked={filters.servicoIgualMotorista || false}
            onChange={(e) => onFilterChange('servicoIgualMotorista', e.target.checked)}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="servico-igual-motorista" className="ml-2 block text-sm font-medium text-gray-700">
            Serviço = Crachá
          </label>
        </div>

        {/* Filtro por Status Edição */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status Edição</label>
          <select
            value={statusEdicaoLocal || 'todos'}
            onChange={(e) => aplicarFiltroRapido(e.target.value as 'todos' | 'editados' | 'nao_editados')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="todos">Todos</option>
            <option value="editados">Editados</option>
            <option value="nao_editados">Não Editados</option>
          </select>
        </div>

        {/* Filtro de Busca de Texto Geral */}
        <div className="lg:col-span-2 xl:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Busca Geral</label>
          <input
            type="text"
            value={filters.buscaTexto || ''}
            onChange={(e) => onFilterChange('buscaTexto', e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Buscar por linha, motorista, carro..."
          />
        </div>

        {/* Limite de Registros */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Limite de Registros</label>
          <select
            value={filters.limite || 100} // Default to 100 if not set
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
            <option value={500}>500</option>
            <option value={1000}>1000</option>
            <option value={-1}>Todos</option> {/* Special value for "All" */}
          </select>
        </div>

      </div>
      <div className="mt-4 flex justify-end">
        <button
          onClick={onClearFilters}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
        >
          Limpar Filtros
        </button>
      </div>
    </div>
  );
};

// Componente da Tabela de Controle de Horários
const ControleHorariosTable = ({
  viagens,
  loading,
  onEditCell,
  onSaveEdit,
  editingCell,
  onPageChange,
  currentPage,
  pageSize,
  totalItems,
  temMaisPaginas,
  onMotoristaClick,
  onCobradorClick,
}: {
  viagens: ControleHorarioItemDto[];
  loading: boolean;
  onEditCell: (viagemId: string, field: keyof ControleHorarioItemDto, currentValue: string | number | undefined) => void;
  onSaveEdit: (viagemId: string) => void;
  editingCell: { id: string; field: keyof ControleHorarioItemDto; value: string | number } | null;
  onPageChange: (page: number) => void;
  currentPage: number;
  pageSize: number;
  totalItems: number;
  temMaisPaginas: boolean;
  onMotoristaClick: (viagem: ControleHorarioItemDto) => void;
  onCobradorClick: (viagem: ControleHorarioItemDto) => void;
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: keyof ControleHorarioItemDto) => {
    if (editingCell) {
      onEditCell(editingCell.id, field, e.target.value);
    }
  };

  const getRowClassName = (viagem: ControleHorarioItemDto) => {
    if (viagem.jaFoiEditado) {
      return 'bg-green-50 hover:bg-green-100';
    }
    return 'bg-red-50 hover:bg-red-100';
  };

  const formatValue = (value: string | number | boolean | Date | undefined | null) => {
    if (value instanceof Date) {
      return value.toLocaleString('pt-BR');
    }
    return value || '-';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-3 text-gray-600">Carregando horários...</span>
      </div>
    );
  }

  if (viagens.length === 0) {
    return (
      <div className="text-center py-20 bg-gray-50 rounded-lg">
        <Bus className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">Nenhum horário encontrado</h3>
        <p className="mt-1 text-sm text-gray-500">
          Tente ajustar os filtros ou sincronizar os dados para a data selecionada.
        </p>
      </div>
    );
  }

  const tableHeaders = [
    'Horário',
    'Linha / Serviço',
    'Origem / Sentido',
    'Destino',
    'Atividade',
    'Setor',
    'Motorista Previsto',
    'Cobrador Previsto',
    'Veículo',
    'Observações',
    'Ações',
  ];

  return (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
      <table className="w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            {tableHeaders.map((header) => (
              <th
                key={header}
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {viagens.map((viagem) => (
            <tr key={viagem.viagemGlobusId} className={getRowClassName(viagem)}>
              {/* Coluna Horário */}
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                <div className="font-bold">{viagem.horaSaida}</div>
                <div>{viagem.horaChegada}</div>
              </td>

              {/* Coluna Linha / Serviço */}
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                <div className="text-lg font-bold">{viagem.codigoLinha}</div>
                <div className="text-xs text-gray-500">{viagem.nomeLinha}</div>
                <div className="text-base font-semibold">{viagem.codServicoNumero}</div>
              </td>

              {/* Coluna Origem / Sentido */}
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                <div>{viagem.localOrigemViagem}</div>
                <div className="text-xs text-gray-500">({viagem.flgSentido === 'I' ? 'Ida' : viagem.flgSentido === 'V' ? 'Volta' : 'Circular'})</div>
              </td>

              {/* Coluna Destino */}
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                <div>{viagem.localDestinoLinha}</div>
              </td>

              {/* Coluna Atividade */}
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                <div>{viagem.flgTipo === 'R' ? 'Regular' : 'Suplementar'}</div>
              </td>

              {/* Coluna Setor */}
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                <div>{viagem.setorPrincipalLinha}</div>
              </td>

              {/* Coluna Motorista Previsto */}
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                <button onClick={() => onMotoristaClick(viagem)} className="text-blue-600 hover:text-blue-800 font-medium">
                  <div className="text-base font-bold">{viagem.crachaMotoristaGlobus || '-'}</div>
                  <div className="text-xs text-gray-500">{viagem.nomeMotoristaGlobus || 'Não Informado'}</div>
                </button>
              </td>

              {/* Coluna Cobrador Previsto */}
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                {viagem.crachaCobradorGlobus ? (
                  <button onClick={() => onCobradorClick(viagem)} className="text-blue-600 hover:text-blue-800 font-medium">
                    <div className="text-base font-bold">{viagem.crachaCobradorGlobus}</div>
                    <div className="text-xs text-gray-500">{viagem.nomeCobradorGlobus}</div>
                  </button>
                ) : (
                  <div className="text-gray-500">Sem Cobrador</div>
                )}
              </td>

              {/* Coluna Veículo (Editável) */}
              <td className="px-6 py-4 text-sm text-gray-800">
                {editingCell?.id === viagem.viagemGlobusId && editingCell.field === 'numeroCarro' ? (
                  <input
                    type="text"
                    value={editingCell.value as string}
                    onChange={(e) => handleInputChange(e, 'numeroCarro')}
                    className="w-full p-1 border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                ) : (
                  <span
                    onDoubleClick={() => onEditCell(viagem.viagemGlobusId, 'numeroCarro', viagem.numeroCarro as string)}
                    className={`${viagem.numeroCarro ? 'text-blue-700 font-medium' : 'text-gray-500'}`}
                  >
                    {formatValue(viagem.numeroCarro)}
                  </span>
                )}
              </td>

              {/* Coluna Observações (Editável) */}
              <td className="px-6 py-4 text-sm text-gray-800">
                {editingCell?.id === viagem.viagemGlobusId && editingCell.field === 'observacoes' ? (
                  <textarea
                    value={editingCell.value as string}
                    onChange={(e) => handleInputChange(e, 'observacoes')}
                    className="w-full p-1 border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    rows={2}
                  />
                ) : (
                  <span
                    onDoubleClick={() => onEditCell(viagem.viagemGlobusId, 'observacoes', viagem.observacoes)}
                    className={`${viagem.observacoes ? 'text-blue-700 font-medium' : 'text-gray-500'} block max-w-xs truncate`}
                    title={viagem.observacoes}
                  >
                    {viagem.observacoes || '-'}
                  </span>
                )}
              </td>

              {/* Coluna Ações */}
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                {editingCell?.id === viagem.viagemGlobusId ? (
                  <button
                    onClick={() => onSaveEdit(viagem.viagemGlobusId)}
                    className="text-green-600 hover:text-green-900 mr-3"
                    title="Salvar"
                  >
                    <Save className="h-5 w-5" />
                  </button>
                ) : (
                  <button
                    onClick={() => onEditCell(viagem.viagemGlobusId, 'numeroCarro', viagem.numeroCarro as string)}
                    className="text-indigo-600 hover:text-indigo-900"
                    title="Editar"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Paginação */}
      <nav
        className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6"
        aria-label="Pagination"
      >
        <div className="flex flex-1 justify-between sm:justify-end">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 0}
            className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={!temMaisPaginas}
            className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Próxima
          </button>
        </div>
      </nav>
    </div>
  );
};

// Componente para quando não há dados disponíveis E O BOTÃO DE SINCRONIZAR
const NoData = ({ onSync, synchronizing, selectedDate, status }: {
  onSync: (overwrite: boolean) => Promise<void>;
  synchronizing: boolean;
  selectedDate: string;
  status: StatusControleHorariosDto | null;
}) => {
  const handleSyncClick = async () => {
    if (status?.data.existeViagensGlobus) {
      const confirmOverwrite = window.confirm(
        'Já existem dados de controle de horários para esta data. Deseja refazer a sincronização e sobrescrever os dados existentes?'
      );
      if (confirmOverwrite) {
        await onSync(true); // Sobrescrever
      } else {
        toast.info('Sincronização cancelada. Dados existentes não foram alterados.', { position: "bottom-right" });
      }
    } else {
      await onSync(false); // Primeira sincronização, não sobrescreve
    }
  };

  return (
    <div className="text-center py-20 bg-white rounded-lg shadow-sm border border-gray-200">
      <Calendar className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-4 text-xl font-semibold text-gray-800">
        Dados não disponíveis para {new Date(selectedDate).toLocaleDateString('pt-BR')}
      </h3>
      <p className="mt-2 text-md text-gray-500">
        {status?.data.existeViagensGlobus
          ? 'Existem viagens no Globus para esta data, mas você ainda não as sincronizou ou limpou.'
          : 'Nenhuma viagem encontrada no Globus para esta data.'}
      </p>
      <p className="mt-2 text-md text-gray-500">
        {status?.data.existeViagensGlobus
          ? 'Clique no botão abaixo para puxar e salvar os dados do Globus.'
          : 'Por favor, selecione outra data ou verifique se há viagens programadas.'}
      </p>

      {status?.data.existeViagensGlobus && (
        <button
          onClick={handleSyncClick}
          disabled={synchronizing}
          className="mt-6 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center mx-auto transition-all"
        >
          <RefreshCw className={`h-5 w-5 mr-2 ${synchronizing ? 'animate-spin' : ''}`} />
          {synchronizing ? 'Sincronizando...' : 'Sincronizar Dados Globus Agora'}
        </button>
      )}
    </div>
  );
};

// Componente principal da página de Controle de Horários
export const ControleHorariosPage: React.FC = () => {
  const { user } = useAuth();
  const [showFilters, setShowFilters] = useState(false);
  const [editingCell, setEditingCell] = useState<{
    id: string;
    field: keyof ControleHorarioItemDto;
    value: string | number;
  } | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editModalData, setEditModalData] = useState<ControleHorarioItemDto | null>(null);
  const [editModalField, setEditModalField] = useState<'motorista' | 'cobrador' | null>(null);
  const [isTableFullScreen, setIsTableFullScreen] = useState(false);

  const {
    dataReferencia,
    setDataReferencia,
    controleHorarios,
    controleHorariosOriginais,
    loading,
    error,
    saving,
    temAlteracoesPendentes,
    filtros,
    setFiltros,
    opcoesFiltros,
    estatisticas,
    statusDados,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    temMaisPaginas,
    buscarControleHorarios,
    salvarTodasAlteracoes,
    descartarAlteracoes,
    sincronizarControleHorarios,
    handleInputChange,
    limparFiltros,
    contarFiltrosAtivos,
    contarAlteracoesPendentes,
    aplicarFiltroRapido,
    statusEdicaoLocal,
  } = useControleHorarios();

  const temDadosNaBase = useMemo(() => {
    return statusDados ? statusDados.data.totalViagensGlobus > 0 : false;
  }, [statusDados]);

  const handleEditCell = useCallback((viagemId: string, field: keyof ControleHorarioItemDto, currentValue: string | number | undefined) => {
    setEditingCell({ id: viagemId, field, value: currentValue !== undefined && currentValue !== null ? currentValue : '' });
  }, []);

  const handleSaveEdit = useCallback(async (viagemId: string) => {
    if (!editingCell || editingCell.id !== viagemId || !user) {
      return;
    }

    const viagemToUpdate = controleHorarios.find(v => v.viagemGlobusId === viagemId);

    if (!viagemToUpdate) {
      return;
    }

    const updatedValue = editingCell.value;
    const fieldToUpdate = editingCell.field;

    const dadosParaSalvar: SalvarControleHorariosDto = {
      viagemGlobusId: viagemToUpdate.viagemGlobusId,
      numeroCarro: viagemToUpdate.numeroCarro,
      nomeMotoristaEditado: viagemToUpdate.nomeMotoristaEditado,
      crachaMotoristaEditado: viagemToUpdate.crachaMotoristaEditado,
      nomeCobradorEditado: viagemToUpdate.nomeCobradorEditado,
      crachaCobradorEditado: viagemToUpdate.crachaCobradorEditado,
      observacoes: viagemToUpdate.observacoes,
      editorId: user.id.toString(),
      editorNome: `${user.firstName} ${user.lastName}`.trim(),
      editorEmail: user.email,
    };

    if (fieldToUpdate === 'numeroCarro') dadosParaSalvar.numeroCarro = updatedValue as string;
    if (fieldToUpdate === 'nomeMotoristaEditado') dadosParaSalvar.nomeMotoristaEditado = updatedValue as string;
    if (fieldToUpdate === 'crachaMotoristaEditado') dadosParaSalvar.crachaMotoristaEditado = updatedValue as string;
    if (fieldToUpdate === 'nomeCobradorEditado') dadosParaSalvar.nomeCobradorEditado = updatedValue as string;
    if (fieldToUpdate === 'crachaCobradorEditado') dadosParaSalvar.crachaCobradorEditado = updatedValue as string;
    if (fieldToUpdate === 'observacoes') dadosParaSalvar.observacoes = updatedValue as string;

    try {
      await controleHorariosService.salvarControleHorario(dataReferencia, dadosParaSalvar);
      toast.success('Registro salvo com sucesso!', { position: "bottom-right" });
      buscarControleHorarios();
    } catch (err: any) {
      console.error("Erro ao salvar edição:", err);
      toast.error(err.response?.data?.message || 'Erro ao salvar edição.', { position: "bottom-right" });
    } finally {
      setEditingCell(null);
    }
  }, [editingCell, controleHorarios, dataReferencia, user, buscarControleHorarios]);

  const handleMotoristaClick = useCallback((viagem: ControleHorarioItemDto) => {
    setEditModalData(viagem);
    setEditModalField('motorista');
    setShowEditModal(true);
  }, []);

  const handleCobradorClick = useCallback((viagem: ControleHorarioItemDto) => {
    setEditModalData(viagem);
    setEditModalField('cobrador');
    setShowEditModal(true);
  }, []);

  const handleCloseEditModal = useCallback(() => {
    setShowEditModal(false);
    setEditModalData(null);
    setEditModalField(null);
  }, []);

  const handleSaveModalEdit = useCallback(async (viagemId: string, field: 'nomeMotoristaEditado' | 'crachaMotoristaEditado' | 'nomeCobradorEditado' | 'crachaCobradorEditado', value: string, observacoes: string) => {
    if (!user || !editModalData) return;

    const dadosParaSalvar: SalvarControleHorariosDto = {
      viagemGlobusId: viagemId,
      editorId: user.id.toString(),
      editorNome: `${user.firstName} ${user.lastName}`.trim(),
      editorEmail: user.email,
      observacoes: observacoes, // Observação obrigatória
    };

    if (field === 'nomeMotoristaEditado') dadosParaSalvar.nomeMotoristaEditado = value;
    if (field === 'crachaMotoristaEditado') dadosParaSalvar.crachaMotoristaEditado = value;
    if (field === 'nomeCobradorEditado') dadosParaSalvar.nomeCobradorEditado = value;
    if (field === 'crachaCobradorEditado') dadosParaSalvar.crachaCobradorEditado = value;

    try {
      await controleHorariosService.salvarControleHorario(dataReferencia, dadosParaSalvar);
      toast.success('Alteração salva com sucesso!', { position: "bottom-right" });
      buscarControleHorarios();
      handleCloseEditModal();
    } catch (err: any) {
      console.error("Erro ao salvar alteração:", err);
      toast.error(err.response?.data?.message || 'Erro ao salvar alteração.', { position: "bottom-right" });
    }
  }, [user, editModalData, dataReferencia, buscarControleHorarios, handleCloseEditModal]);

  return (
    <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen">
      <PageHeader
        onSync={sincronizarControleHorarios}
        onToggleFilters={() => setShowFilters(!showFilters)}
        filtersVisible={showFilters}
        synchronizing={loading}
        temDadosNaBase={temDadosNaBase}
        onToggleFullScreen={() => setIsTableFullScreen(!isTableFullScreen)}
        isFullScreen={isTableFullScreen}
      />

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative" role="alert">{error}</div>}

      <DateAndStatus
        date={dataReferencia}
        onDateChange={setDataReferencia}
        status={statusDados}
        onSincronizarManual={sincronizarControleHorarios}
      />

      {showFilters && (
        <FilterSection
          filters={filtros}
          onFilterChange={(key, value) => {
            setFiltros(prev => ({ ...prev, [key]: value }));
            setCurrentPage(0);
          }}
          onClearFilters={limparFiltros}
          opcoesFiltro={opcoesFiltros}
          onPageSizeChange={setPageSize}
          aplicarFiltroRapido={aplicarFiltroRapido}
          statusEdicaoLocal={statusEdicaoLocal}
        />
      )}

      {loading && totalItems === 0 ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-3 text-gray-600">Verificando dados...</span>
        </div>
      ) : totalItems > 0 ? (
        <div className={`bg-white rounded-lg ${isTableFullScreen ? 'fixed inset-0 z-50 bg-white p-4 overflow-auto' : 'overflow-x-auto'}`}>
          <ControleHorariosTable
            viagens={controleHorarios}
            loading={loading}
            onEditCell={handleEditCell}
            onSaveEdit={handleSaveEdit}
            editingCell={editingCell}
            onPageChange={setCurrentPage}
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={totalItems}
            temMaisPaginas={temMaisPaginas}
            onMotoristaClick={handleMotoristaClick}
            onCobradorClick={handleCobradorClick}
          />
        </div>
      ) : (
        <NoData
          onSync={sincronizarControleHorarios}
          synchronizing={loading}
          selectedDate={dataReferencia}
          status={statusDados}
        />
      )}

      {showEditModal && editModalData && editModalField && (
        <EditDriverCobradorModal
          isOpen={showEditModal}
          onClose={handleCloseEditModal}
          viagem={editModalData}
          field={editModalField}
          onSave={handleSaveModalEdit}
          onFilterByCracha={setFiltros}
        />
      )}
    </div>
  );
};