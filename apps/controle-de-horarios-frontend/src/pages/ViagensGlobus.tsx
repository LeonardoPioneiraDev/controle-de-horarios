// src/pages/ViagensGlobus.tsx
import React, { useState, useEffect } from 'react';
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
  Database,
  Server,
  User,
  Users as UsersIcon
} from 'lucide-react';

// ✅ INTERFACES PARA VIAGENS GLOBUS
export interface ViagemGlobus {
  id: string;
  setorPrincipal: string;
  codLocalTerminalSec: number;
  codigoLinha: string;
  nomeLinha: string;
  flgSentido: string;
  dataViagem: string;
  horSaida: string;
  horChegada: string;
  horSaidaTime: string;
  horChegadaTime: string;
  codLocalidade: number;
  localOrigemViagem: string;
  codServicoCompleto: string;
  codServicoNumero: string;
  codMotorista: number;
  nomeMotorista: string;
  codCobrador: number;
  nomeCobrador: string;
  totalHorarios: number;
  duracaoMinutos: number;
  dataReferencia: string;
  sentidoTexto: string;
  periodoDoDia: string;
  temCobrador: boolean;
  origemDados: string;
  createdAt: string;
  updatedAt: string;
}

export interface StatusDadosGlobus {
  existeNoBanco: boolean;
  totalRegistros: number;
  ultimaAtualizacao: string | null;
  setoresDisponiveis: string[];
  linhasDisponiveis: number;
}

export interface SincronizacaoGlobus {
  sincronizadas: number;
  novas: number;
  atualizadas: number;
  erros: number;
}

export const ViagensGlobus: React.FC = () => {
  const { user } = useAuth();
  const [viagens, setViagens] = useState<ViagemGlobus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [statusDados, setStatusDados] = useState<StatusDadosGlobus | null>(null);
  const [sincronizando, setSincronizando] = useState(false);
  const [testingOracle, setTestingOracle] = useState(false);
  const [oracleStatus, setOracleStatus] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filtros, setFiltros] = useState({
    setorPrincipal: '',
    codigoLinha: '',
    sentidoTexto: '',
    nomeMotorista: '',
    limit: 100
  });

  useEffect(() => {
    if (selectedDate) {
      loadStatusDados();
    }
  }, [selectedDate]);

  useEffect(() => {
    if (selectedDate && statusDados?.existeNoBanco) {
      loadViagens();
    }
  }, [selectedDate, statusDados, filtros]);

  // ✅ FUNÇÃO PARA FAZER REQUISIÇÕES AUTENTICADAS
  const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Token de autenticação não encontrado. Faça login novamente.');
    }
    
    const response = await fetch(`/api${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        throw new Error('Sessão expirada. Redirecionando para login...');
      }
      
      const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
      throw new Error(errorData.message || `Erro ${response.status}`);
    }

    return response.json();
  };

  const loadStatusDados = async () => {
    try {
      setError('');
      console.log(`🔍 Carregando status para data: ${selectedDate}`);
      
      const response = await makeAuthenticatedRequest(`/viagens-globus/${selectedDate}/status`);
      console.log('📊 Status recebido:', response);
      
      setStatusDados(response.data);
      
      if (!response.data.existeNoBanco) {
        setViagens([]);
      }
    } catch (err: any) {
      console.error('❌ Erro ao carregar status:', err);
      setError(`Erro ao carregar status: ${err.message}`);
    }
  };

  const loadViagens = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log(`🚌 Carregando viagens para data: ${selectedDate}`);
      
      // Construir query params se houver filtros
      const params = new URLSearchParams();
      if (filtros.setorPrincipal) params.append('setorPrincipal', filtros.setorPrincipal);
      if (filtros.codigoLinha) params.append('codigoLinha', filtros.codigoLinha);
      if (filtros.sentidoTexto) params.append('sentido', filtros.sentidoTexto);
      if (filtros.nomeMotorista) params.append('nomeMotorista', filtros.nomeMotorista);
      if (filtros.limit) params.append('limite', filtros.limit.toString());
      
      const queryString = params.toString();
      const url = `/viagens-globus/${selectedDate}${queryString ? `?${queryString}` : ''}`;
      
      const response = await makeAuthenticatedRequest(url);
      console.log(`✅ ${response.data?.length || 0} viagens carregadas`);
      
      setViagens(response.data || []);
    } catch (err: any) {
      console.error('❌ Erro ao carregar viagens:', err);
      setError(`Erro ao carregar viagens: ${err.message}`);
      setViagens([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSincronizar = async () => {
    try {
      setSincronizando(true);
      setError('');
      setSuccess('');
      
      console.log(`🔄 Iniciando sincronização para data: ${selectedDate}`);
      
      const response = await makeAuthenticatedRequest(`/viagens-globus/sincronizar/${selectedDate}`, {
        method: 'POST'
      });
      
      console.log('✅ Sincronização concluída:', response);
      
      const result = response.data as SincronizacaoGlobus;
      setSuccess(`Sincronização concluída: ${result.sincronizadas} viagens (${result.novas} novas, ${result.atualizadas} atualizadas, ${result.erros} erros)`);
      
      // Recarregar dados
      await loadStatusDados();
    } catch (err: any) {
      console.error('❌ Erro na sincronização:', err);
      setError(`Erro na sincronização: ${err.message}`);
    } finally {
      setSincronizando(false);
    }
  };

  const handleTestOracle = async () => {
    try {
      setTestingOracle(true);
      setError('');
      
      console.log('🔧 Testando conexão Oracle...');
      
      const response = await makeAuthenticatedRequest('/viagens-globus/oracle/teste-conexao');
      console.log('📡 Resposta do teste Oracle:', response);
      
      setOracleStatus(response);
      
      if (response.success) {
        setSuccess('Conexão Oracle funcionando!');
      } else {
        setError(`Falha na conexão Oracle: ${response.message}`);
      }
    } catch (err: any) {
      console.error('❌ Erro ao testar Oracle:', err);
      setError(`Erro ao testar Oracle: ${err.message}`);
      setOracleStatus({ success: false, message: err.message });
    } finally {
      setTestingOracle(false);
    }
  };

  const formatTime = (time: string) => {
    if (!time) return '-';
    
    // Se já está no formato HH:mm, retornar direto
    if (/^\d{2}:\d{2}$/.test(time)) {
      return time;
    }
    
    // Se está no formato HH:mm:ss, remover segundos
    if (/^\d{2}:\d{2}:\d{2}$/.test(time)) {
      return time.substring(0, 5);
    }
    
    return time || '-';
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

  const clearFilters = () => {
    setFiltros({
      setorPrincipal: '',
      codigoLinha: '',
      sentidoTexto: '',
      nomeMotorista: '',
      limit: 100
    });
  };

  const handleFilterChange = (key: string, value: string | number) => {
    setFiltros(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // ✅ OBTER VALORES ÚNICOS PARA FILTROS
  const setoresUnicos = [...new Set(viagens.map(v => v.setorPrincipal))].filter(Boolean);
  const linhasUnicas = [...new Set(viagens.map(v => v.codigoLinha))].filter(Boolean).slice(0, 50);
  const sentidosUnicos = [...new Set(viagens.map(v => v.sentidoTexto))].filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Viagens Globus</h1>
          <p className="mt-1 text-sm text-gray-600">
            Consulte e gerencie as viagens do sistema Oracle Globus
          </p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              showFilters 
                ? 'bg-blue-50 border-blue-200 text-blue-700' 
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="h-4 w-4 mr-2 inline" />
            Filtros
          </button>
          
          <button
            onClick={handleTestOracle}
            disabled={testingOracle}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
          >
            <Server className={`h-4 w-4 mr-2 inline ${testingOracle ? 'animate-pulse' : ''}`} />
            {testingOracle ? 'Testando...' : 'Testar Oracle'}
          </button>
          
          <button
            onClick={handleSincronizar}
            disabled={sincronizando}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 mr-2 inline ${sincronizando ? 'animate-spin' : ''}`} />
            {sincronizando ? 'Sincronizando...' : 'Sincronizar'}
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <XCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <div className="ml-3">
              <p className="text-green-800">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* Oracle Status */}
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
              {oracleStatus.data?.connectionInfo && (
                <div className="mt-2 text-xs text-green-600">
                  <p>Database: {oracleStatus.data.connectionInfo.DATABASE_NAME}</p>
                  <p>User: {oracleStatus.data.connectionInfo.USERNAME}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Date Selection & Status */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data de Referência
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          {statusDados && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Database className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-600">Status: </span>
                <span className={`ml-1 font-medium ${
                  statusDados.existeNoBanco ? 'text-green-600' : 'text-red-600'
                }`}>
                  {statusDados.existeNoBanco ? 'Dados Disponíveis' : 'Sem Dados'}
                </span>
              </div>
              
              {statusDados.totalRegistros > 0 && (
                <div className="text-sm">
                  <span className="text-gray-600">Total: </span>
                  <span className="font-medium text-gray-900">
                    {statusDados.totalRegistros.toLocaleString()} viagens
                  </span>
                </div>
              )}
              
              {statusDados.ultimaAtualizacao && (
                <div className="text-sm">
                  <span className="text-gray-600">Última Atualização: </span>
                  <span className="font-medium text-gray-900">
                    {new Date(statusDados.ultimaAtualizacao).toLocaleString('pt-BR')}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Filtros</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Setor
              </label>
              <select
                value={filtros.setorPrincipal}
                onChange={(e) => handleFilterChange('setorPrincipal', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos os setores</option>
                {setoresUnicos.map(setor => (
                  <option key={setor} value={setor}>{setor}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código da Linha
              </label>
              <select
                value={filtros.codigoLinha}
                onChange={(e) => handleFilterChange('codigoLinha', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas as linhas</option>
                {linhasUnicas.map(linha => (
                  <option key={linha} value={linha}>{linha}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sentido
              </label>
              <select
                value={filtros.sentidoTexto}
                onChange={(e) => handleFilterChange('sentidoTexto', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos os sentidos</option>
                {sentidosUnicos.map(sentido => (
                  <option key={sentido} value={sentido}>{sentido}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Limite de Registros
              </label>
              <select
                value={filtros.limit}
                onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={50}>50 registros</option>
                <option value={100}>100 registros</option>
                <option value={200}>200 registros</option>
                <option value={500}>500 registros</option>
              </select>
            </div>
          </div>
          
          <div className="mt-4 flex justify-end space-x-2">
            <button
              onClick={clearFilters}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Limpar Filtros
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {statusDados?.existeNoBanco ? (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Viagens Globus
              {viagens.length > 0 && (
                <span className="ml-2 text-sm text-gray-600">
                  ({viagens.length.toLocaleString()} {viagens.length === 1 ? 'viagem' : 'viagens'})
                </span>
              )}
            </h3>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-600">Carregando viagens...</span>
            </div>
          ) : viagens.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Setor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Linha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sentido
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Horário Saída
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Horário Chegada
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Motorista
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Local Origem
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Período
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {viagens.map((viagem) => (
                    <tr key={viagem.id} className="hover:bg-gray-50">
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
          ) : (
            <div className="text-center py-12">
              <Bus className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma viagem encontrada</h3>
              <p className="mt-1 text-sm text-gray-500">
                Tente sincronizar os dados do Oracle Globus ou ajustar os filtros.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Dados não disponíveis para esta data
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Clique em "Sincronizar" para buscar os dados do Oracle Globus.
            </p>
            <div className="mt-4 space-x-3">
              <button
                onClick={handleTestOracle}
                disabled={testingOracle}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
              >
                <Server className={`h-4 w-4 mr-2 inline ${testingOracle ? 'animate-pulse' : ''}`} />
                {testingOracle ? 'Testando...' : 'Testar Oracle'}
              </button>
              
              <button
                onClick={handleSincronizar}
                disabled={sincronizando}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`h-4 w-4 mr-2 inline ${sincronizando ? 'animate-spin' : ''}`} />
                {sincronizando ? 'Sincronizando...' : 'Sincronizar Dados'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};