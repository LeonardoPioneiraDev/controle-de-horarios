// src/pages/ComparacaoViagens.tsx

import { useState, useEffect, useCallback } from 'react';
import { comparacaoViagensService } from '../services/comparacao/comparacao.service';
import { ResultadoComparacao, ComparacaoViagem, FiltrosComparacao } from '../types/comparacao.types';
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
  Loader2,
  ChevronDown
} from 'lucide-react';

// --- SUB-COMPONENTS ---

const PageHeader = () => (
    <div className="border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <GitCompare className="h-8 w-8 text-blue-600" />
            Comparação de Viagens
        </h1>
        <p className="mt-2 text-md text-gray-500">
            Compare dados entre Transdata e Globus para identificar divergências e compatibilidades.
        </p>
    </div>
);

const Controls = ({ date, onDateChange, onExecute, executing, onToggleFilters, filtersVisible, onFetchComparisons, loading, hasComparisons }: any) => (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-500" />
                <label className="text-sm font-medium text-gray-700">Data:</label>
                <input
                    type="date"
                    value={date}
                    onChange={(e) => onDateChange(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <button
                onClick={onExecute}
                disabled={executing || !date}
                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {executing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                {executing ? 'Executando...' : 'Executar Comparação'}
            </button>

            <button
                onClick={onToggleFilters}
                className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium border transition-all duration-300 ${
                    filtersVisible
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
            >
                <Filter className="h-4 w-4" />
                Filtros
                <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${filtersVisible ? 'rotate-180' : ''}`} />
            </button>

            {hasComparisons && (
                <button
                    onClick={onFetchComparisons}
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    Atualizar Resultados
                </button>
            )}
        </div>
    </div>
);

const Statistics = ({ stats }: { stats: ResultadoComparacao }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-800">Estatísticas da Comparação</h2>
            <div className="ml-auto flex items-center gap-2 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                <span>Processado em {stats.tempoProcessamento}</span>
            </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <StatCard label="Total" value={stats.totalComparacoes} color="text-gray-900" bgColor="bg-gray-50" />
            <StatCard label="Compatíveis" value={stats.compativeis} color="text-green-600" bgColor="bg-green-50" />
            <StatCard label="Divergentes" value={stats.divergentes} color="text-red-600" bgColor="bg-red-50" />
            <StatCard label="Horário Div." value={stats.horarioDivergente} color="text-yellow-600" bgColor="bg-yellow-50" />
            <StatCard label="Só Transdata" value={stats.apenasTransdata} color="text-blue-600" bgColor="bg-blue-50" />
            <StatCard label="Só Globus" value={stats.apenasGlobus} color="text-purple-600" bgColor="bg-purple-50" />
            <StatCard label="Compatibilidade" value={`${stats.percentualCompatibilidade}%`} color="text-indigo-600" bgColor="bg-indigo-50" />
            <StatCard label="Linhas" value={stats.linhasAnalisadas} color="text-gray-600" bgColor="bg-gray-50" />
        </div>
    </div>
);

const StatCard = ({ label, value, color, bgColor }: any) => (
    <div className={`text-center p-3 rounded-lg border ${bgColor}`}>
        <div className={`text-2xl font-bold ${color}`}>{value.toLocaleString ? value.toLocaleString() : value}</div>
        <div className="text-sm text-gray-600 mt-1">{label}</div>
    </div>
);

const FilterPanel = ({ filters, onFilterChange, onClear, onApply }: any) => (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <FilterInput label="Status" name="statusComparacao" type="select" value={filters.statusComparacao} onChange={onFilterChange}>
                <option value="">Todos</option>
                <option value="compativel">Compatível</option>
                <option value="divergente">Divergente</option>
                <option value="horario_divergente">Horário Divergente</option>
                <option value="apenas_transdata">Apenas Transdata</option>
                <option value="apenas_globus">Apenas Globus</option>
            </FilterInput>
            <FilterInput label="Código da Linha" name="codigoLinha" type="text" value={filters.codigoLinha} onChange={onFilterChange} placeholder="Ex: 0.102" />
            <FilterInput label="Setor Globus" name="globusSetor" type="select" value={filters.globusSetor} onChange={onFilterChange}>
                <option value="">Todos</option>
                <option value="GAMA">GAMA</option>
                <option value="SANTA MARIA">SANTA MARIA</option>
                <option value="PARANOÁ">PARANOÁ</option>
                <option value="SÃO SEBASTIÃO">SÃO SEBASTIÃO</option>
            </FilterInput>
            <FilterInput label="Limite" name="limite" type="select" value={filters.limite} onChange={onFilterChange}>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
                <option value={500}>500</option>
            </FilterInput>
        </div>
        <div className="mt-4 flex justify-end gap-2">
            <button onClick={onClear} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">Limpar</button>
            <button onClick={onApply} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Aplicar Filtros
            </button>
        </div>
    </div>
);

const FilterInput = ({ label, name, type, value, onChange, placeholder, children }: any) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        {type === 'select' ? (
            <select name={name} value={value || ''} onChange={onChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                {children}
            </select>
        ) : (
            <input type={type} name={name} value={value || ''} onChange={onChange} placeholder={placeholder} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
        )}
    </div>
);

const ComparisonTable = ({ comparisons }: { comparisons: ComparacaoViagem[] }) => {
    const getStatusPill = (status: string) => {
        const styles: { [key: string]: string } = {
            compativel: 'bg-green-100 text-green-800',
            divergente: 'bg-red-100 text-red-800',
            horario_divergente: 'bg-yellow-100 text-yellow-800',
            apenas_transdata: 'bg-blue-100 text-blue-800',
            apenas_globus: 'bg-purple-100 text-purple-800',
        };
        const text: { [key: string]: string } = {
            compativel: 'Compatível',
            divergente: 'Divergente',
            horario_divergente: 'Horário Div.',
            apenas_transdata: 'Só Transdata',
            apenas_globus: 'Só Globus',
        };
        return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>{text[status] || status}</span>;
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-800">Resultados da Comparação ({comparisons.length})</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Linha</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serviço (T/G)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sentido (T/G)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Horário (T/G)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Setor Globus</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {comparisons.map((comp) => (
                            <tr key={comp.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">{getStatusPill(comp.statusComparacao)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{comp.codigoLinha}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{comp.transdataServico || '-'} / {comp.globusServico || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{comp.transdataSentido || '-'} / {comp.globusSentidoTexto || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {comp.transdataHorarioPrevisto || '-'} / {comp.globusHorarioSaida || '-'}
                                    {comp.diferencaHorarioMinutos != null && <span className="ml-2 text-yellow-600">({comp.diferencaHorarioMinutos}m)</span>}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{comp.globusSetor || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const EmptyState = ({ onExecute, executing, date }: any) => (
    <div className="text-center py-20 bg-white rounded-lg shadow-sm border border-gray-200">
        <GitCompare className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-xl font-semibold text-gray-800">Nenhuma comparação encontrada</h3>
        <p className="mt-2 text-md text-gray-500">Execute a comparação para a data <span className="font-semibold">{date}</span> para ver os resultados.</p>
        <button onClick={onExecute} disabled={executing} className="mt-6 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center mx-auto transition-all">
            {executing ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Play className="h-5 w-5 mr-2" />}
            {executing ? 'Executando...' : 'Executar Comparação'}
        </button>
    </div>
);

const LoadingState = ({ text }: { text: string }) => (
    <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-3 text-gray-600">{text}</span>
    </div>
);

// --- MAIN COMPONENT ---

const initialFilters: FiltrosComparacao = {
    limit: 50,
    page: 1,
};

export const ComparacaoViagens: React.FC = () => {
    const [dataReferencia, setDataReferencia] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(true);
    const [executando, setExecutando] = useState(false);
    const [estatisticas, setEstatisticas] = useState<ResultadoComparacao | null>(null);
    const [comparacoes, setComparacoes] = useState<ComparacaoViagem[]>([]);
    const [filtros, setFiltros] = useState<FiltrosComparacao>(initialFilters);
    const [showFilters, setShowFilters] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const carregarEstatisticas = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const stats = await comparacaoViagensService.getEstatisticas(dataReferencia);
            setEstatisticas(stats);
            if (!stats) {
                setComparacoes([]); // Limpa resultados se não houver estatísticas
            }
        } catch (err: any) {
            setError(err.message || 'Erro ao carregar estatísticas.');
            setEstatisticas(null);
        } finally {
            setLoading(false);
        }
    }, [dataReferencia]);

    useEffect(() => {
        carregarEstatisticas();
    }, [carregarEstatisticas]);

    const executarComparacao = async () => {
        setExecutando(true);
        setError(null);
        setSuccess(null);
        try {
            const result = await comparacaoViagensService.executarComparacao(dataReferencia);
            setEstatisticas(result);
            setSuccess(`Comparação executada! ${result.totalComparacoes} registros processados.`);
            // Auto-fetch results after execution
            buscarComparacoes();
        } catch (err: any) {
            setError(err.message || 'Falha ao executar a comparação.');
        } finally {
            setExecutando(false);
        }
    };

    const buscarComparacoes = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await comparacaoViagensService.getComparacoes(dataReferencia, filtros);
            setComparacoes(response.data);
        } catch (err: any) {
            setError(err.message || 'Erro ao buscar comparações.');
        } finally {
            setLoading(false);
        }
    }, [dataReferencia, filtros]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFiltros(prev => ({ ...prev, [name]: value, page: 1 }));
    };

    const clearFilters = () => {
        setFiltros(initialFilters);
    };

    return (
        <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen">
            <PageHeader />

            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg" role="alert">{error}</div>}
            {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg" role="alert">{success}</div>}

            <Controls 
                date={dataReferencia}
                onDateChange={setDataReferencia}
                onExecute={executarComparacao}
                executing={executando}
                onToggleFilters={() => setShowFilters(!showFilters)}
                filtersVisible={showFilters}
                onFetchComparisons={buscarComparacoes}
                loading={loading}
                hasComparisons={(estatisticas?.totalComparacoes || 0) > 0}
            />

            {showFilters && (
                <FilterPanel 
                    filters={filtros}
                    onFilterChange={handleFilterChange}
                    onClear={clearFilters}
                    onApply={buscarComparacoes}
                />
            )}

            {loading && !estatisticas ? (
                <LoadingState text="Carregando estatísticas..." />
            ) : estatisticas ? (
                <div className="space-y-6">
                    <Statistics stats={estatisticas} />
                    {loading ? (
                        <LoadingState text="Carregando comparações..." />
                    ) : comparacoes.length > 0 ? (
                        <ComparisonTable comparisons={comparacoes} />
                    ) : (
                        <div className="text-center py-10 bg-white rounded-lg shadow-sm border">
                            <h3 className="text-lg font-medium">Nenhum resultado para os filtros aplicados.</h3>
                            <p className="text-sm text-gray-500">Tente limpar os filtros ou buscar novamente.</p>
                        </div>
                    )}
                </div>
            ) : (
                <EmptyState onExecute={executarComparacao} executing={executando} date={dataReferencia} />
            )}
        </div>
    );
};
