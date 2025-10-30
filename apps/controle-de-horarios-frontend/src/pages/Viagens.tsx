// src/pages/Viagens.tsx

import { useState, useEffect, useCallback } from 'react';
import { viagensTransdataService } from '../services/api';
import { ViagemTransdata, FiltrosViagem, StatusDados } from '../types';
import { useAuth } from '../contexts/AuthContext';
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
  Loader2
} from 'lucide-react';

// Componente para o cabeçalho da página
const PageHeader = ({ onSync, onToggleFilters, filtersVisible, synchronizing }: any) => (
  <div className="flex justify-between items-center">
    <div>
      <h1 className="text-3xl font-bold text-gray-800">Viagens Transdata</h1>
      <p className="mt-1 text-md text-gray-500">
        Consulte e gerencie as viagens programadas em tempo real.
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
        onClick={onSync}
        disabled={synchronizing}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center transition-colors"
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${synchronizing ? 'animate-spin' : ''}`} />
        {synchronizing ? 'Sincronizando...' : 'Sincronizar'}
      </button>
    </div>
  </div>
);

// Componente para a seleção de data e exibição de status
const DateAndStatus = ({ date, onDateChange, status }: any) => (
  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
      <div className="flex items-center space-x-4">
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
            <span className={`font-semibold ${status.existemDados ? 'text-green-600' : 'text-red-600'}`}>
              {status.existemDados ? 'Dados Disponíveis' : 'Sem Dados'}
            </span>
          </div>
          {status.totalViagens > 0 && (
            <div>
              <span className="text-gray-500">Total: </span>
              <span className="font-semibold text-gray-800">
                {status.totalViagens.toLocaleString()} viagens
              </span>
            </div>
          )}
          {status.ultimaSincronizacao && (
            <div>
              <span className="text-gray-500">Última Sincronização: </span>
              <span className="font-semibold text-gray-800">
                {new Date(status.ultimaSincronizacao).toLocaleString('pt-BR')}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  </div>
);

// Componente para a seção de filtros
const FilterSection = ({ filters, onFilterChange, onClearFilters, services }: any) => (
  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Filtro por Nome da Linha */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Linha</label>
        <input
          type="text"
          value={filters.nomeLinha || ''}
          onChange={(e) => onFilterChange('nomeLinha', e.target.value || undefined)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Buscar por nome..."
        />
      </div>
      {/* Filtro por Número do Serviço */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Número do Serviço</label>
        <select
          value={filters.numeroServico || ''}
          onChange={(e) => onFilterChange('numeroServico', e.target.value ? parseInt(e.target.value) : undefined)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos os serviços</option>
          {services.map((service: number) => <option key={service} value={service}>{service}</option>)}
        </select>
      </div>
      {/* Filtro por Sentido */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Sentido</label>
        <select
          value={filters.sentido || ''}
          onChange={(e) => onFilterChange('sentido', e.target.value || undefined)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos</option>
          <option value="IDA">Ida</option>
          <option value="VOLTA">Volta</option>
        </select>
      </div>
      {/* Filtro por Status */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
        <select
          value={filters.statusCumprimento || ''}
          onChange={(e) => onFilterChange('statusCumprimento', e.target.value || undefined)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos</option>
          <option value="CUMPRIDA">Cumprida</option>
          <option value="NAO_CUMPRIDA">Não Cumprida</option>
          <option value="PARCIALMENTE_CUMPRIDA">Parcial</option>
          <option value="PENDENTE">Pendente</option>
        </select>
      </div>
      {/* Filtro por Ponto Final */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Ponto Final</label>
        <select
          value={filters.pontoFinal || ''}
          onChange={(e) => onFilterChange('pontoFinal', e.target.value || undefined)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos</option>
          <option value="Manual">Manual</option>
          <option value="Automático">Automático</option>
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

// Componente para a tabela de viagens
const ViagensTable = ({ viagens, loading, onFormatTime, onGetStatusIcon, onGetStatusText, onGetStatusColor }: any) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-3 text-gray-600">Carregando viagens...</span>
      </div>
    );
  }

  if (viagens.length === 0) {
    return (
      <div className="text-center py-20 bg-gray-50 rounded-lg">
        <Bus className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">Nenhuma viagem encontrada</h3>
        <p className="mt-1 text-sm text-gray-500">
          Tente ajustar os filtros ou sincronizar os dados para a data selecionada.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {['Nome da Linha', 'Serviço', 'Sentido', 'Previsto', 'Realizado', 'Ponto Final', 'Status'].map(header => (
              <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {viagens.map((viagem: ViagemTransdata) => (
            <tr key={viagem.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 text-sm text-gray-800 max-w-xs truncate" title={viagem.NomeLinha}>{viagem.NomeLinha || '-'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{viagem.Servico || '-'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{viagem.SentidoText || '-'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex items-center">
                <Clock className="h-4 w-4 mr-1.5 text-gray-400" />
                {onFormatTime(viagem.InicioPrevistoText)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex items-center">
                <Clock className="h-4 w-4 mr-1.5 text-gray-400" />
                {onFormatTime(viagem.InicioRealizadoText)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex items-center">
                <MapPin className="h-4 w-4 mr-1.5 text-gray-400" />
                {viagem.PontoFinal || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  {onGetStatusIcon(viagem.statusCumprimento)}
                  <span className={`ml-2 text-sm font-medium ${onGetStatusColor(viagem.statusCumprimento)}`}>
                    {onGetStatusText(viagem.statusCumprimento)}
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Componente para quando não há dados disponíveis
const NoData = ({ onSync, synchronizing }: any) => (
  <div className="text-center py-20 bg-white rounded-lg shadow-sm border border-gray-200">
    <Calendar className="mx-auto h-12 w-12 text-gray-400" />
    <h3 className="mt-4 text-xl font-semibold text-gray-800">
      Dados não disponíveis para esta data
    </h3>
    <p className="mt-2 text-md text-gray-500">
      Clique no botão abaixo para buscar os dados da API Transdata.
    </p>
    <button
      onClick={onSync}
      disabled={synchronizing}
      className="mt-6 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center mx-auto transition-all"
    >
      <RefreshCw className={`h-5 w-5 mr-2 ${synchronizing ? 'animate-spin' : ''}`} />
      {synchronizing ? 'Sincronizando...' : 'Sincronizar Dados'}
    </button>
  </div>
);

const initialFilters: FiltrosViagem = {
  page: 1,
  limit: 50,
  nomeLinha: undefined,
  numeroServico: undefined,
  sentido: undefined,
  statusCumprimento: undefined,
  pontoFinal: undefined,
  horarioInicio: undefined,
  horarioFim: undefined,
};

export const Viagens: React.FC = () => {
  const [viagens, setViagens] = useState<ViagemTransdata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [statusDados, setStatusDados] = useState<StatusDados | null>(null);
  const [filtros, setFiltros] = useState<FiltrosViagem>(initialFilters);
  const [servicos, setServicos] = useState<number[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [total, setTotal] = useState(0);
  const [sincronizando, setSincronizando] = useState(false);

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const status = await viagensTransdataService.getStatusDados(selectedDate);
      setStatusDados(status);

      if (status.existemDados) {
        const results = await Promise.allSettled([
          viagensTransdataService.getViagensWithFilters(selectedDate, filtros),
          viagensTransdataService.getServicosUnicos(selectedDate),
        ]);

        const [viagensResult, servicosResult] = results;

        if (viagensResult.status === 'fulfilled') {
          setViagens(viagensResult.value.data);
          setTotal(viagensResult.value.total);
        } else {
          setError('Erro ao carregar viagens.');
        }

        if (servicosResult.status === 'fulfilled') {
          setServicos(servicosResult.value.servicos);
        } else {
          setError(prev => prev + ' Erro ao carregar serviços.');
        }

      } else {
        setViagens([]);
        setTotal(0);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar dados iniciais.');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, filtros]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const handleSincronizar = async () => {
    setSincronizando(true);
    setError('');
    setSuccess('');
    try {
      const result = await viagensTransdataService.sincronizarViagens(selectedDate);
      setSuccess(`Sincronização concluída: ${result.sincronizadas} viagens processadas.`);
      await loadInitialData(); // Recarrega todos os dados
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro na sincronização.');
    } finally {
      setSincronizando(false);
    }
  };

  const handleFilterChange = (key: keyof FiltrosViagem, value: any) => {
    setFiltros(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const clearFilters = () => {
    setFiltros(initialFilters);
  };

  // Funções auxiliares (Helpers)
  const getStatusIcon = (status: string) => {
    const icons: { [key: string]: JSX.Element } = {
      'CUMPRIDA': <CheckCircle className="h-4 w-4 text-green-500" />,
      'NAO_CUMPRIDA': <XCircle className="h-4 w-4 text-red-500" />,
      'PARCIALMENTE_CUMPRIDA': <AlertCircle className="h-4 w-4 text-yellow-500" />,
    };
    return icons[status] || <AlertCircle className="h-4 w-4 text-gray-500" />;
  };

  const formatTime = (time: string) => {
    if (!time) return '-';
    return time.substring(0, 5);
  };

  const getStatusText = (status: string) => {
    const texts: { [key: string]: string } = {
      'CUMPRIDA': 'Cumprida',
      'NAO_CUMPRIDA': 'Não Cumprida',
      'PARCIALMENTE_CUMPRIDA': 'Parcial',
      'PENDENTE': 'Pendente',
    };
    return texts[status] || status || '-';
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'CUMPRIDA': 'text-green-600',
      'NAO_CUMPRIDA': 'text-red-600',
      'PARCIALMENTE_CUMPRIDA': 'text-yellow-600',
      'PENDENTE': 'text-gray-600',
    };
    return colors[status] || 'text-gray-600';
  };

  return (
    <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen">
      <PageHeader 
        onSync={handleSincronizar}
        onToggleFilters={() => setShowFilters(!showFilters)}
        filtersVisible={showFilters}
        synchronizing={sincronizando}
      />

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative" role="alert">{error}</div>}
      {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg relative" role="alert">{success}</div>}

      <DateAndStatus 
        date={selectedDate}
        onDateChange={setSelectedDate}
        status={statusDados}
      />

      {showFilters && (
        <FilterSection 
          filters={filtros}
          onFilterChange={handleFilterChange}
          onClearFilters={clearFilters}
          services={servicos}
        />
      )}

      {loading && !statusDados ? (
         <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-3 text-gray-600">Verificando dados...</span>
        </div>
      ) : statusDados?.existemDados ? (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <ViagensTable 
            viagens={viagens}
            loading={loading}
            onFormatTime={formatTime}
            onGetStatusIcon={getStatusIcon}
            onGetStatusText={getStatusText}
            onGetStatusColor={getStatusColor}
          />
        </div>
      ) : (
        <NoData onSync={handleSincronizar} synchronizing={sincronizando} />
      )}
    </div>
  );
};