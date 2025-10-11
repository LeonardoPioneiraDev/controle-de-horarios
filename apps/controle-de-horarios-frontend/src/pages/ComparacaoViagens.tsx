// src/pages/ComparacaoViagens.tsx
import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Play, 
  BarChart3, 
  Filter, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Database,
  GitCompare,
  TrendingUp,
  Activity,
  Zap
} from 'lucide-react';
import { ApiService } from '../services/api';
import { 
  ResultadoComparacao, 
  ComparacaoViagem, 
  FiltrosComparacao, 
  StatusComparacao 
} from '../types';

export const ComparacaoViagens: React.FC = () => {
  const [dataReferencia, setDataReferencia] = useState(() => {
    const hoje = new Date();
    return hoje.toISOString().split('T')[0];
  });
  
  const [loading, setLoading] = useState(false);
  const [executandoComparacao, setExecutandoComparacao] = useState(false);
  const [estatisticas, setEstatisticas] = useState<ResultadoComparacao | null>(null);
  const [comparacoes, setComparacoes] = useState<ComparacaoViagem[]>([]);
  const [filtros, setFiltros] = useState<FiltrosComparacao>({
    limite: 50
  });
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Carregar estatísticas ao mudar a data
  useEffect(() => {
    if (dataReferencia) {
      carregarEstatisticas();
    }
  }, [dataReferencia]);

  const carregarEstatisticas = async () => {
    try {
      setError(null);
      const response = await api.get(`/comparacao-viagens/${dataReferencia}/estatisticas`);
      
      if (response.data.success) {
        setEstatisticas(response.data.data);
      } else {
        setEstatisticas(null);
      }
    } catch (error: any) {
      console.error('Erro ao carregar estatísticas:', error);
      setEstatisticas(null);
    }
  };

  const executarComparacao = async () => {
    if (!dataReferencia) {
      setError('Selecione uma data para comparação');
      return;
    }

    setExecutandoComparacao(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await api.post(`/comparacao-viagens/executar/${dataReferencia}`);
      
      if (response.data.success) {
        setSuccess(`Comparação executada com sucesso! ${response.data.data.totalComparacoes} registros processados em ${response.data.data.tempoProcessamento}`);
        setEstatisticas(response.data.data);
        // Recarregar comparações se já estavam sendo exibidas
        if (comparacoes.length > 0) {
          buscarComparacoes();
        }
      } else {
        setError(response.data.message || 'Erro ao executar comparação');
      }
    } catch (error: any) {
      console.error('Erro ao executar comparação:', error);
      setError(error.response?.data?.message || 'Erro ao executar comparação');
    } finally {
      setExecutandoComparacao(false);
    }
  };

  const buscarComparacoes = async () => {
    if (!dataReferencia) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append('limite', filtros.limite.toString());
      
      if (filtros.statusComparacao) params.append('statusComparacao', filtros.statusComparacao);
      if (filtros.codigoLinha) params.append('codigoLinha', filtros.codigoLinha);
      if (filtros.globusSetor) params.append('globusSetor', filtros.globusSetor);
      if (filtros.sentidoCompativel !== undefined) params.append('sentidoCompativel', filtros.sentidoCompativel.toString());
      if (filtros.horarioCompativel !== undefined) params.append('horarioCompativel', filtros.horarioCompativel.toString());
      if (filtros.servicoCompativel !== undefined) params.append('servicoCompativel', filtros.servicoCompativel.toString());

      const response = await api.get(`/comparacao-viagens/${dataReferencia}?${params}`);
      
      if (response.data.success) {
        setComparacoes(response.data.data);
      } else {
        setError(response.data.message || 'Erro ao buscar comparações');
        setComparacoes([]);
      }
    } catch (error: any) {
      console.error('Erro ao buscar comparações:', error);
      setError(error.response?.data?.message || 'Erro ao buscar comparações');
      setComparacoes([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: StatusComparacao) => {
    switch (status) {
      case StatusComparacao.COMPATIVEL:
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case StatusComparacao.DIVERGENTE:
        return <XCircle className="h-5 w-5 text-red-500" />;
      case StatusComparacao.HORARIO_DIVERGENTE:
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case StatusComparacao.APENAS_TRANSDATA:
        return <Database className="h-5 w-5 text-blue-500" />;
      case StatusComparacao.APENAS_GLOBUS:
        return <Database className="h-5 w-5 text-purple-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: StatusComparacao) => {
    switch (status) {
      case StatusComparacao.COMPATIVEL:
        return 'Compatível';
      case StatusComparacao.DIVERGENTE:
        return 'Divergente';
      case StatusComparacao.HORARIO_DIVERGENTE:
        return 'Horário Divergente';
      case StatusComparacao.APENAS_TRANSDATA:
        return 'Apenas Transdata';
      case StatusComparacao.APENAS_GLOBUS:
        return 'Apenas Globus';
      default:
        return status;
    }
  };

  const getStatusColor = (status: StatusComparacao) => {
    switch (status) {
      case StatusComparacao.COMPATIVEL:
        return 'bg-green-100 text-green-800';
      case StatusComparacao.DIVERGENTE:
        return 'bg-red-100 text-red-800';
      case StatusComparacao.HORARIO_DIVERGENTE:
        return 'bg-yellow-100 text-yellow-800';
      case StatusComparacao.APENAS_TRANSDATA:
        return 'bg-blue-100 text-blue-800';
      case StatusComparacao.APENAS_GLOBUS:
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const limparFiltros = () => {
    setFiltros({ limite: 50 });
    setComparacoes([]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <GitCompare className="h-8 w-8 text-blue-600" />
          Comparação de Viagens
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Compare dados entre Transdata e Globus para identificar divergências e compatibilidades
        </p>
        <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Activity className="h-4 w-4" />
            <span>Dados disponíveis: Transdata (6.857) | Globus (6.832)</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap className="h-4 w-4" />
            <span>Última atualização: {dataReferencia}</span>
          </div>
        </div>
      </div>

      {/* Alertas */}
      {error && (
        <div className="rounded-md bg-red-50 p-4 border border-red-200">
          <div className="flex">
            <XCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Erro</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="rounded-md bg-green-50 p-4 border border-green-200">
          <div className="flex">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Sucesso</h3>
              <p className="mt-1 text-sm text-green-700">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* Controles */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-400" />
            <label className="text-sm font-medium text-gray-700">Data de Referência:</label>
            <input
              type="date"
              value={dataReferencia}
              onChange={(e) => setDataReferencia(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={executarComparacao}
            disabled={executandoComparacao || !dataReferencia}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {executandoComparacao ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {executandoComparacao ? 'Executando...' : 'Executar Comparação'}
          </button>

          <button
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            className="inline-flex items-center gap-2 rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            <Filter className="h-4 w-4" />
            Filtros
          </button>

          {comparacoes.length > 0 && (
            <button
              onClick={buscarComparacoes}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Atualizar
            </button>
          )}
        </div>

        {/* Filtros */}
        {mostrarFiltros && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filtros.statusComparacao || ''}
                  onChange={(e) => setFiltros(prev => ({ ...prev, statusComparacao: e.target.value as StatusComparacao || undefined }))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Todos</option>
                  <option value={StatusComparacao.COMPATIVEL}>Compatível</option>
                  <option value={StatusComparacao.DIVERGENTE}>Divergente</option>
                  <option value={StatusComparacao.HORARIO_DIVERGENTE}>Horário Divergente</option>
                  <option value={StatusComparacao.APENAS_TRANSDATA}>Apenas Transdata</option>
                  <option value={StatusComparacao.APENAS_GLOBUS}>Apenas Globus</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código da Linha</label>
                <input
                  type="text"
                  value={filtros.codigoLinha || ''}
                  onChange={(e) => setFiltros(prev => ({ ...prev, codigoLinha: e.target.value || undefined }))}
                  placeholder="Ex: 0026"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Setor Globus</label>
                <select
                  value={filtros.globusSetor || ''}
                  onChange={(e) => setFiltros(prev => ({ ...prev, globusSetor: e.target.value || undefined }))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Todos</option>
                  <option value="GAMA">GAMA</option>
                  <option value="SANTA MARIA">SANTA MARIA</option>
                  <option value="PARANOÁ">PARANOÁ</option>
                  <option value="SÃO SEBASTIÃO">SÃO SEBASTIÃO</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Limite</label>
                <select
                  value={filtros.limite}
                  onChange={(e) => setFiltros(prev => ({ ...prev, limite: parseInt(e.target.value) }))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={200}>200</option>
                  <option value={500}>500</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={buscarComparacoes}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                <Filter className="h-4 w-4" />
                Aplicar Filtros
              </button>
              <button
                onClick={limparFiltros}
                className="inline-flex items-center gap-2 rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                <XCircle className="h-4 w-4" />
                Limpar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Estatísticas */}
      {estatisticas && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Estatísticas da Comparação</h2>
            <div className="ml-auto flex items-center gap-1 text-sm text-gray-500">
              <TrendingUp className="h-4 w-4" />
              <span>Processado em {estatisticas.tempoProcessamento}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{estatisticas.totalComparacoes.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{estatisticas.compativeis.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Compatíveis</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{estatisticas.divergentes.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Divergentes</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{estatisticas.horarioDivergente.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Horário Div.</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{estatisticas.apenasTransdata.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Só Transdata</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{estatisticas.apenasGlobus.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Só Globus</div>
            </div>
            <div className="text-center p-3 bg-indigo-50 rounded-lg">
              <div className="text-2xl font-bold text-indigo-600">{estatisticas.percentualCompatibilidade}%</div>
              <div className="text-sm text-gray-600">Compatibilidade</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">{estatisticas.linhasAnalisadas}</div>
              <div className="text-sm text-gray-600">Linhas</div>
            </div>
          </div>
        </div>
      )}

      {/* Tabela de Comparações */}
      {comparacoes.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Resultados da Comparação ({comparacoes.length} registros)
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Linha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serviço</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sentido</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Horário</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Setor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Observações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {comparacoes.map((comparacao) => (
                  <tr key={comparacao.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(comparacao.statusComparacao)}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(comparacao.statusComparacao)}`}>
                          {getStatusText(comparacao.statusComparacao)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{comparacao.codigoLinha}</div>
                      <div className="text-sm text-gray-500 max-w-xs truncate" title={comparacao.nomeLinhaTransdata || comparacao.nomeLinhaGlobus}>
                        {comparacao.nomeLinhaTransdata || comparacao.nomeLinhaGlobus}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <span className="text-blue-600">T:</span> {comparacao.transdataServico || '-'}
                      </div>
                      <div className="text-sm text-gray-900">
                        <span className="text-purple-600">G:</span> {comparacao.globusServico || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <span className="text-blue-600">T:</span> {comparacao.transdataSentido || '-'}
                      </div>
                      <div className="text-sm text-gray-900">
                        <span className="text-purple-600">G:</span> {comparacao.globusSentidoTexto || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <span className="text-blue-600">T:</span> {comparacao.transdataHorarioPrevisto || '-'}
                      </div>
                      <div className="text-sm text-gray-900">
                        <span className="text-purple-600">G:</span> {comparacao.globusHorarioSaida || '-'}
                      </div>
                      {comparacao.diferencaHorarioMinutos !== undefined && comparacao.diferencaHorarioMinutos >= 0 && (
                        <div className="text-xs text-yellow-600 font-medium">
                          Δ {comparacao.diferencaHorarioMinutos}min
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {comparacao.globusSetor || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate" title={comparacao.observacoes}>
                        {comparacao.observacoes || '-'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
          </div>
        </div>
      )}

      {/* Estado vazio */}
      {!estatisticas && !loading && !executandoComparacao && (
        <div className="text-center py-12">
          <GitCompare className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma comparação encontrada</h3>
          <p className="mt-1 text-sm text-gray-500">
            Selecione uma data e execute a comparação para ver os resultados.
          </p>
          <div className="mt-4">
            <button
              onClick={() => setDataReferencia('2025-10-10')}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Calendar className="h-4 w-4" />
              Usar data com dados (10/10/2025)
            </button>
          </div>
        </div>
      )}

      {/* Loading state */}
      {(loading || executandoComparacao) && (
        <div className="text-center py-12">
          <RefreshCw className="mx-auto h-12 w-12 text-blue-600 animate-spin" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {executandoComparacao ? 'Executando comparação...' : 'Carregando dados...'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {executandoComparacao ? 'Este processo pode demorar alguns minutos.' : 'Aguarde enquanto buscamos os dados.'}
          </p>
        </div>
      )}
    </div>
  );
};