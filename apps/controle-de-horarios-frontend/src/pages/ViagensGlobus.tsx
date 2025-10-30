// src/pages/ViagensGlobus.tsx

import { useState, useEffect, useCallback } from 'react';
import { viagensGlobusService } from '../services/viagens-globus/viagens-globus.service';
import { ViagemGlobus, FiltrosViagemGlobus, StatusDadosGlobus } from '../types/viagens-globus.types';
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
  Server,
  User,
  Users as UsersIcon
} from 'lucide-react';

// Reusable components (similar to Viagens.tsx but adapted for Globus data)

const PageHeader = ({ onSync, onToggleFilters, filtersVisible, synchronizing, onTestOracle, testingOracle }: any) => (
  <div className="flex justify-between items-center">
    <div>
      <h1 className="text-3xl font-bold text-gray-800">Viagens Globus</h1>
      <p className="mt-1 text-md text-gray-500">
        Consulte e gerencie as viagens do sistema Oracle Globus.
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
        onClick={onTestOracle}
        disabled={testingOracle}
        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center transition-colors"
      >
        <Server className={`h-4 w-4 mr-2 ${testingOracle ? 'animate-pulse' : ''}`} />
        {testingOracle ? 'Testando...' : 'Testar Oracle'}
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
            <span className={`font-semibold ${status.existeNoBanco ? 'text-green-600' : 'text-red-600'}`}>
              {status.existeNoBanco ? 'Dados Disponíveis' : 'Sem Dados'}
            </span>
          </div>
          {status.totalRegistros > 0 && (
            <div>
              <span className="text-gray-500">Total: </span>
              <span className="font-semibold text-gray-800">
                {status.totalRegistros.toLocaleString()} viagens
              </span>
            </div>
          )}
          {status.ultimaAtualizacao && (
            <div>
              <span className="text-gray-500">Última Atualização: </span>
              <span className="font-semibold text-gray-800">
                {new Date(status.ultimaAtualizacao).toLocaleString('pt-BR')}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  </div>
);

const FilterSection = ({ filters, onFilterChange, onClearFilters, setores, linhas }: any) => (
  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Setor</label>
            <select
            value={filters.setorPrincipal || ''}
            onChange={(e) => onFilterChange('setorPrincipal', e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
            <option value="">Todos os setores</option>
            {setores && setores.map((setor: string) => <option key={setor} value={setor}>{setor}</option>)}
            </select>
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Linha</label>
            <select
            value={filters.codigoLinha || ''}
            onChange={(e) => onFilterChange('codigoLinha', e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
            <option value="">Todas as linhas</option>
            {linhas && linhas.map((linha: string) => <option key={linha} value={linha}>{linha}</option>)}
            </select>
        </div>
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
            <option value="CIRCULAR">Circular</option>
            </select>
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Motorista</label>
            <input
            type="text"
            value={filters.nomeMotorista || ''}
            onChange={(e) => onFilterChange('nomeMotorista', e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Buscar por nome..."
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

const ViagensTable = ({ viagens, loading }: any) => {
    const formatTime = (time: string) => {
        if (!time) return '-';
        return time.substring(0, 5);
    };

    const getSentidoColor = (sentido: string) => {
        switch (sentido) {
        case 'IDA':
            return 'text-blue-600 bg-blue-50 border-blue-200';
        case 'VOLTA':
            return 'text-green-600 bg-green-50 border-green-200';
        case 'CIRCULAR':
            return 'text-purple-600 bg-purple-50 border-purple-200';
        default:
            return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    const getPeriodoColor = (periodo: string) => {
        switch (periodo) {
        case 'MANHÃ':
            return 'text-yellow-700 bg-yellow-50 border-yellow-200';
        case 'TARDE':
            return 'text-orange-700 bg-orange-50 border-orange-200';
        case 'NOITE':
            return 'text-blue-700 bg-blue-50 border-blue-200';
        case 'MADRUGADA':
            return 'text-purple-700 bg-purple-50 border-purple-200';
        default:
            return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    const getSetorColor = (setor: string) => {
        switch (setor) {
        case 'GAMA':
            return 'text-red-700 bg-red-50 border-red-200';
        case 'SANTA MARIA':
            return 'text-blue-700 bg-blue-50 border-blue-200';
        case 'PARANOÁ':
            return 'text-green-700 bg-green-50 border-green-200';
        case 'SÃO SEBASTIÃO':
            return 'text-purple-700 bg-purple-50 border-purple-200';
        default:
            return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

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
            {['Setor', 'Linha', 'Sentido', 'Horário Saída', 'Horário Chegada', 'Motorista', 'Local Origem', 'Período'].map(header => (
              <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {viagens.map((viagem: ViagemGlobus) => (
            <tr key={viagem.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getSetorColor(viagem.setorPrincipal)}`}>
                        {viagem.setorPrincipal}
                    </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                    <div>
                        <div className="font-medium text-blue-600">{viagem.codigoLinha}</div>
                        <div className="text-xs text-gray-500 max-w-xs truncate" title={viagem.nomeLinha}>
                        {viagem.nomeLinha}
                        </div>
                    </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getSentidoColor(viagem.sentidoTexto)}`}>
                        {viagem.sentidoTexto}
                    </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1 text-gray-400" />
                        {formatTime(viagem.horSaidaTime)}
                    </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1 text-gray-400" />
                        {formatTime(viagem.horChegadaTime)}
                    </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                    <div>
                        {viagem.nomeMotorista ? (
                        <>
                            <div className="flex items-center">
                                <User className="h-4 w-4 mr-1 text-gray-400" />
                                <span className="font-medium">{viagem.nomeMotorista}</span>
                            </div>
                            {viagem.nomeCobrador && (
                            <div className="flex items-center text-xs text-gray-400 mt-1">
                                <UsersIcon className="h-3 w-3 mr-1" />
                                <span>Cobrador: {viagem.nomeCobrador}</span>
                            </div>
                            )}
                        </>
                        ) : (
                        <span className="text-gray-400">-</span>
                        )}
                    </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                        <span className="max-w-xs truncate" title={viagem.localOrigemViagem}>
                        {viagem.localOrigemViagem || '-'}
                        </span>
                    </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getPeriodoColor(viagem.periodoDoDia)}`}>
                        {viagem.periodoDoDia}
                    </span>
                </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const NoData = ({ onSync, synchronizing, onTestOracle, testingOracle }: any) => (
  <div className="text-center py-20 bg-white rounded-lg shadow-sm border border-gray-200">
    <Calendar className="mx-auto h-12 w-12 text-gray-400" />
    <h3 className="mt-4 text-xl font-semibold text-gray-800">
      Dados não disponíveis para esta data
    </h3>
    <p className="mt-2 text-md text-gray-500">
      Clique no botão abaixo para buscar os dados do Oracle Globus.
    </p>
    <div className="mt-6 flex justify-center space-x-4">
        <button
            onClick={onTestOracle}
            disabled={testingOracle}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center transition-colors"
        >
            <Server className={`h-4 w-4 mr-2 ${testingOracle ? 'animate-pulse' : ''}`} />
            {testingOracle ? 'Testando...' : 'Testar Oracle'}
        </button>
        <button
            onClick={onSync}
            disabled={synchronizing}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center mx-auto transition-all"
        >
            <RefreshCw className={`h-5 w-5 mr-2 ${synchronizing ? 'animate-spin' : ''}`} />
            {synchronizing ? 'Sincronizando...' : 'Sincronizar Dados'}
        </button>
    </div>
  </div>
);

const initialFilters: FiltrosViagemGlobus = {
  page: 1,
  limite: 100,
  setorPrincipal: undefined,
  codigoLinha: undefined,
  sentido: undefined,
  nomeMotorista: undefined,
};

export const ViagensGlobus: React.FC = () => {
  const [viagens, setViagens] = useState<ViagemGlobus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [statusDados, setStatusDados] = useState<StatusDadosGlobus | null>(null);
  const [filtros, setFiltros] = useState<FiltrosViagemGlobus>(initialFilters);
  const [setores, setSetores] = useState<string[]>([]);
  const [linhas, setLinhas] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);
  const [testingOracle, setTestingOracle] = useState(false);
  const [oracleStatus, setOracleStatus] = useState<any>(null);

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const status = await viagensGlobusService.getStatusDados(selectedDate);
      setStatusDados(status);

      if (status.existeNoBanco) {
        const [viagensResponse, setoresResponse, linhasResponse] = await Promise.all([
          viagensGlobusService.getViagens(selectedDate, filtros),
          viagensGlobusService.getSetores(selectedDate),
          viagensGlobusService.getLinhas(selectedDate),
        ]);
        setViagens(viagensResponse.data);
        setSetores(setoresResponse);
        setLinhas(linhasResponse);
      } else {
        setViagens([]);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados iniciais.');
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
      const result = await viagensGlobusService.sincronizarViagens(selectedDate);
      setSuccess(`Sincronização concluída: ${result.sincronizadas} viagens processadas.`);
      await loadInitialData();
    } catch (err: any) {
      setError(err.message || 'Erro na sincronização.');
    } finally {
      setSincronizando(false);
    }
  };

  const handleTestOracle = async () => {
    setTestingOracle(true);
    setError('');
    setOracleStatus(null);
    try {
        const result = await viagensGlobusService.testarConexaoOracle();
        setOracleStatus(result);
        if (result.success) {
            setSuccess('Conexão com Oracle bem-sucedida!');
        } else {
            setError(result.message || 'Falha ao testar conexão com Oracle.');
        }
    } catch (err: any) {
        setError(err.message || 'Erro ao testar conexão com Oracle.');
    } finally {
        setTestingOracle(false);
    }
  };

  const handleFilterChange = (key: keyof FiltrosViagemGlobus, value: any) => {
    setFiltros(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const clearFilters = () => {
    setFiltros(initialFilters);
  };

  return (
    <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen">
      <PageHeader 
        onSync={handleSincronizar}
        onToggleFilters={() => setShowFilters(!showFilters)}
        filtersVisible={showFilters}
        synchronizing={sincronizando}
        onTestOracle={handleTestOracle}
        testingOracle={testingOracle}
      />

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative" role="alert">{error}</div>}
      {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg relative" role="alert">{success}</div>}
      {oracleStatus && (
        <div className={`border rounded-md p-4 ${
          oracleStatus.success 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex">
            {oracleStatus.success ? (
              <CheckCircle className="h-5 w-5 text-green-400" />
            ) : (
              <XCircle className="h-5 w-5 text-red-400" />
            )}
            <div className="ml-3">
              <h3 className={`text-sm font-medium ${
                oracleStatus.success ? 'text-green-800' : 'text-red-800'
              }`}>
                Status Oracle Globus
              </h3>
              <p className={`text-sm ${
                oracleStatus.success ? 'text-green-700' : 'text-red-700'
              }`}>
                {oracleStatus.message}
              </p>
            </div>
          </div>
        </div>
      )}

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
          setores={setores}
          linhas={linhas}
        />
      )}

      {loading && !statusDados ? (
         <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-3 text-gray-600">Verificando dados...</span>
        </div>
      ) : statusDados?.existeNoBanco ? (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <ViagensTable 
            viagens={viagens}
            loading={loading}
          />
        </div>
      ) : (
        <NoData onSync={handleSincronizar} synchronizing={sincronizando} onTestOracle={handleTestOracle} testingOracle={testingOracle} />
      )}
    </div>
  );
};