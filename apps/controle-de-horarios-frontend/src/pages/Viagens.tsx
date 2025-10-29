// src/pages/Viagens.tsx

import { useState, useEffect } from 'react';
import { viagensTransdataService } from '../services/api';
import { ViagemTransdata, FiltrosViagem, StatusDados } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { 
  Bus, 
  Calendar, 
  Filter, 
  RefreshCw, 
  Download, 
  Clock, 
  MapPin, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Search
} from 'lucide-react';

export const Viagens: React.FC = () => {
  const { user } = useAuth();
  const [viagens, setViagens] = useState<ViagemTransdata[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [statusDados, setStatusDados] = useState<StatusDados | null>(null);
  const [filtros, setFiltros] = useState<FiltrosViagem>({
    page: 1,
    limit: 50
  });
  const [codigosLinha, setCodigosLinha] = useState<string[]>([]);
  const [servicos, setServicos] = useState<number[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [total, setTotal] = useState(0);
  const [sincronizando, setSincronizando] = useState(false);

  useEffect(() => {
    if (selectedDate) {
      loadStatusDados();
      loadCodigosLinha();
      loadServicos();
    }
  }, [selectedDate]);

  useEffect(() => {
    if (selectedDate && statusDados?.existemDados) {
      loadViagens();
    }
  }, [selectedDate, filtros]);

  const loadStatusDados = async () => {
    try {
      const status = await viagensTransdataService.getStatusDados(selectedDate);
      setStatusDados(status);
      
      if (!status.existemDados) {
        setViagens([]);
        setTotal(0);
      }
    } catch (err: any) {
      console.error('Erro ao carregar status:', err);
    }
  };

  const loadCodigosLinha = async () => {
    try {
      const response = await viagensTransdataService.getCodigosLinha(selectedDate);
      setCodigosLinha(response.linhas);
    } catch (err: any) {
      console.error('Erro ao carregar códigos de linha:', err);
    }
  };

  const loadServicos = async () => {
    try {
      const response = await viagensTransdataService.getServicosUnicos(selectedDate);
      setServicos(response.servicos);
    } catch (err: any) {
      console.error('Erro ao carregar serviços:', err);
    }
  };

  const loadViagens = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (Object.keys(filtros).some(key => filtros[key as keyof FiltrosViagem] && key !== 'page' && key !== 'limit')) {
        // Com filtros
        const response = await viagensTransdataService.getViagensWithFilters(selectedDate, filtros);
        setViagens(response.data);
        setTotal(response.total);
      } else {
        // Sem filtros - buscar todas
        const response = await viagensTransdataService.getViagensByDate(selectedDate);
        setViagens(response);
        setTotal(response.length);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar viagens');
    } finally {
      setLoading(false);
    }
  };

  const handleSincronizar = async () => {
    try {
      setSincronizando(true);
      setError('');
      setSuccess('');
      
      const result = await viagensTransdataService.sincronizarViagens(selectedDate);
      setSuccess(`Sincronização concluída: ${result.sincronizadas} viagens processadas`);
      
      // Recarregar dados
      await loadStatusDados();
      await loadCodigosLinha();
      await loadServicos();
      if (statusDados?.existemDados) {
        await loadViagens();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro na sincronização');
    } finally {
      setSincronizando(false);
    }
  };

  const handleFilterChange = (key: keyof FiltrosViagem, value: any) => {
    setFiltros(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset para primeira página
    }));
  };

  const clearFilters = () => {
    setFiltros({
      page: 1,
      limit: 50
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CUMPRIDA':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'NAO_CUMPRIDA':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'PARCIALMENTE_CUMPRIDA':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
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
    
    // Tentar converter outros formatos
    try {
      const date = new Date(`2000-01-01T${time}`);
      if (!isNaN(date.getTime())) {
        return date.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    } catch (e) {
      // Se falhar, retornar o valor original
    }
    
    return time || '-';
  };

  // ✅ FUNÇÃO PARA EXTRAIR CÓDIGO DA LINHA
  const extrairCodigoLinha = (nomeLinha: string): string => {
    if (!nomeLinha) return '-';
    
    // Pegar os primeiros 7 caracteres e remover tudo exceto números
    const codigo = nomeLinha.substring(0, 7).replace(/[^0-9]/g, '');
    return codigo || '-';
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'CUMPRIDA':
        return 'Cumprida';
      case 'NAO_CUMPRIDA':
        return 'Não Cumprida';
      case 'PARCIALMENTE_CUMPRIDA':
        return 'Parcial';
      case 'PENDENTE':
        return 'Pendente';
      default:
        return status || '-';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CUMPRIDA':
        return 'text-green-600';
      case 'NAO_CUMPRIDA':
        return 'text-red-600';
      case 'PARCIALMENTE_CUMPRIDA':
        return 'text-yellow-600';
      case 'PENDENTE':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Viagens Transdata</h1>
          <p className="mt-1 text-sm text-gray-600">
            Consulte e gerencie as viagens programadas
          </p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              showFilters 
                ? 'bg-primary-50 border-primary-200 text-primary-700' 
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="h-4 w-4 mr-2 inline" />
            Filtros
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
          <p className="text-red-800">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {/* Date Selection & Status */}
      <div className="card">
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
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          
          {statusDados && (
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <span className="text-gray-600">Status: </span>
                <span className={`font-medium ${
                  statusDados.existemDados ? 'text-green-600' : 'text-red-600'
                }`}>
                  {statusDados.existemDados ? 'Dados Disponíveis' : 'Sem Dados'}
                </span>
              </div>
              
              {statusDados.totalViagens && (
                <div className="text-sm">
                  <span className="text-gray-600">Total: </span>
                  <span className="font-medium text-gray-900">
                    {statusDados.totalViagens.toLocaleString()} viagens
                  </span>
                </div>
              )}
              
              {statusDados.ultimaSincronizacao && (
                <div className="text-sm">
                  <span className="text-gray-600">Última Sync: </span>
                  <span className="font-medium text-gray-900">
                    {new Date(statusDados.ultimaSincronizacao).toLocaleString('pt-BR')}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Filtros</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código da Linha
              </label>
              <select
                value={filtros.codigoLinha || ''}
                onChange={(e) => handleFilterChange('codigoLinha', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Todas as linhas</option>
                {codigosLinha.slice(0, 100).map(codigo => (
                  <option key={codigo} value={codigo}>{codigo}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número do Serviço
              </label>
              <select
                value={filtros.numeroServico || ''}
                onChange={(e) => handleFilterChange('numeroServico', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Todos os serviços</option>
                {servicos.slice(0, 50).map(servico => (
                  <option key={servico} value={servico}>{servico}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sentido
              </label>
              <select
                value={filtros.sentido || ''}
                onChange={(e) => handleFilterChange('sentido', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Todos</option>
                <option value="IDA">Ida</option>
                <option value="VOLTA">Volta</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filtros.statusCumprimento || ''}
                onChange={(e) => handleFilterChange('statusCumprimento', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Todos os status</option>
                <option value="CUMPRIDA">Cumprida</option>
                <option value="NAO_CUMPRIDA">Não Cumprida</option>
                <option value="PARCIALMENTE_CUMPRIDA">Parcialmente Cumprida</option>
                <option value="PENDENTE">Pendente</option>
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
      {statusDados?.existemDados ? (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Viagens Encontradas
              {total > 0 && (
                <span className="ml-2 text-sm text-gray-600">
                  ({total.toLocaleString()} {total === 1 ? 'viagem' : 'viagens'})
                </span>
              )}
            </h3>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
              <span className="ml-3 text-gray-600">Carregando viagens...</span>
            </div>
          ) : viagens.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Código Linha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nome da Linha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Serviço
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sentido
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Horário Previsto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Horário Realizado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ponto Final
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {viagens.map((viagem) => (
                    <tr key={viagem.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                        {extrairCodigoLinha(viagem.NomeLinha)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="max-w-xs truncate" title={viagem.NomeLinha}>
                          {viagem.NomeLinha || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {viagem.Servico || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {viagem.SentidoText || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1 text-gray-400" />
                          {formatTime(viagem.InicioPrevistoText)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1 text-gray-400" />
                          {formatTime(viagem.InicioRealizadoText)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                          {viagem.PontoFinal || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(viagem.statusCumprimento)}
                          <span className={`ml-2 text-sm font-medium ${getStatusColor(viagem.statusCumprimento)}`}>
                            {getStatusText(viagem.statusCumprimento)}
                          </span>
                        </div>
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
                Tente ajustar os filtros ou sincronizar os dados.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="card">
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Dados não disponíveis para esta data
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Clique em "Sincronizar" para buscar os dados da API Transdata.
            </p>
            <button
              onClick={handleSincronizar}
              disabled={sincronizando}
              className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 mr-2 inline ${sincronizando ? 'animate-spin' : ''}`} />
              {sincronizando ? 'Sincronizando...' : 'Sincronizar Dados'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};