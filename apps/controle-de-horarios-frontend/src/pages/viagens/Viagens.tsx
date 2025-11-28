import React, { useState, useEffect, useCallback } from 'react';
import { viagensTransdataService } from '../../services/api';
import { ViagemTransdata, FiltrosViagem, StatusDados } from '../../types';
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
    User,
    Truck,
    Info
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Alert, AlertDescription, AlertTitle, AlertIcon } from '../../components/ui/alert';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';
import { ViagensFiltersPanel } from './components/FiltersPanel';
import { HistoryDrawerCH } from './components/HistoryDrawerCH/HistoryDrawerCH';
import { useAuth } from '../../contexts/AuthContext';

// Componente para o cabeçalho da página
const PageHeader = ({ onSync, onToggleFilters, filtersVisible, synchronizing, hasData, isAdmin }: any) => {
    const [openConfirm, setOpenConfirm] = useState(false);

    const handleSyncClick = () => {
        if (hasData) {
            setOpenConfirm(true);
        } else {
            onSync();
        }
    };

    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#6b5d1a] via-[#7d6b1e] to-[#6b5d1a] dark:from-gray-100 dark:via-white dark:to-gray-100 bg-clip-text text-transparent">
                    Viagens Transdata
                </h1>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 font-medium">
                    Consulte e gerencie as viagens programadas em tempo real.
                </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Button
                    variant={filtersVisible ? 'default' : 'outline'}
                    onClick={onToggleFilters}
                    className={`w-full sm:w-auto ${filtersVisible ? 'bg-[#fbcc2c] text-[#6b5d1a] hover:bg-[#e6cd4a]' : 'border-[#fbcc2c]/50 text-[#6b5d1a] dark:text-yellow-400 hover:bg-[#fbcc2c]/10'}`}
                >
                    <Filter className="h-4 w-4 mr-2" />
                    Filtros
                    <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${filtersVisible ? 'rotate-180' : ''}`} />
                </Button>
                {isAdmin && (
                    <Button
                        onClick={handleSyncClick}
                        disabled={synchronizing}
                        className="w-full sm:w-auto bg-gradient-to-r from-[#fbcc2c] to-[#ecd43c] hover:from-[#e6cd4a] hover:to-[#d4cc54] dark:from-yellow-600 dark:to-amber-600 text-gray-900 font-semibold shadow-md hover:shadow-lg transition-all"
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${synchronizing ? 'animate-spin' : ''}`} />
                        {synchronizing ? 'Sincronizando...' : 'Sincronizar'}
                    </Button>
                )}
            </div>

            <ConfirmDialog
                open={openConfirm}
                onOpenChange={setOpenConfirm}
                variant="warning"
                title="Sincronizar dados do dia selecionado?"
                description={
                    <span>
                        Ao sincronizar, os dados <strong>existentes</strong> do dia selecionado serão
                        apagados antes de importar novos, para evitar <strong>duplicidades</strong>.
                        Deseja continuar?
                    </span>
                }
                confirmText="Sim, sincronizar"
                cancelText="Cancelar"
                onConfirm={onSync}
            />
        </div>
    );
};

// Componente para a seleção de data e exibição de status
const DateAndStatus = ({ date, onDateChange, status }: any) => (
    <Card className="border-none shadow-lg bg-white/60 dark:bg-gray-900/60 backdrop-blur-md transition-all duration-300 hover:shadow-xl">
        <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full lg:w-auto">
                    <Label htmlFor="date-picker" className="text-gray-700 dark:text-gray-300 font-medium whitespace-nowrap">
                        Data de Referência:
                    </Label>
                    <div className="relative w-full sm:w-auto">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                        <Input
                            id="date-picker"
                            type="date"
                            value={date}
                            onChange={(e) => onDateChange(e.target.value)}
                            className="pl-10 w-full sm:w-48 bg-white dark:bg-gray-800/50 border-gray-300 dark:border-gray-700 focus:ring-[#fbcc2c] dark:focus:ring-yellow-500 text-gray-900 dark:text-gray-100"
                        />
                    </div>
                </div>

                {status && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full lg:w-auto">
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-100 dark:border-gray-700/50">
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold tracking-wide">Status</p>
                            <div className="flex items-center mt-1">
                                {status.existemDados ? (
                                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                                ) : (
                                    <XCircle className="h-4 w-4 text-red-500 mr-2" />
                                )}
                                <span className={`font-bold ${status.existemDados ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {status.existemDados ? 'Dados Disponíveis' : 'Sem Dados'}
                                </span>
                            </div>
                        </div>

                        {status.totalViagens > 0 && (
                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-100 dark:border-gray-700/50">
                                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold tracking-wide">Total Viagens</p>
                                <div className="flex items-center mt-1">
                                    <Bus className="h-4 w-4 text-[#fbcc2c] dark:text-yellow-400 mr-2" />
                                    <span className="font-bold text-gray-900 dark:text-gray-100">
                                        {status.totalViagens.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        )}

                        {status.ultimaSincronizacao && (
                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-100 dark:border-gray-700/50 sm:col-span-3 lg:col-span-1">
                                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold tracking-wide">Última Sincronização</p>
                                <div className="flex items-center mt-1">
                                    <Clock className="h-4 w-4 text-blue-500 mr-2" />
                                    <span className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                                        {new Date(status.ultimaSincronizacao).toLocaleString('pt-BR')}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </CardContent>
    </Card>
);

// Componente para a tabela de viagens (agora responsivo)
const ViagensTable = ({ viagens, loading }: { viagens: ViagemTransdata[], loading: boolean }) => {
    const getStatusPill = (status: string) => {
        const styles: { [key: string]: string } = {
            CUMPRIDA: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
            NAO_CUMPRIDA: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
            PARCIALMENTE_CUMPRIDA: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800',
            PENDENTE: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
        };
        const text: { [key: string]: string } = {
            CUMPRIDA: 'Cumprida',
            NAO_CUMPRIDA: 'Não Cumprida',
            PARCIALMENTE_CUMPRIDA: 'Parcial',
            PENDENTE: 'Pendente',
        };
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || styles.PENDENTE}`}>
                {text[status] || status}
            </span>
        );
    };

    const parseTime = (timeStr: string | undefined): Date | null => {
        if (!timeStr) return null;
        const [hours, minutes] = timeStr.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes)) return null;
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        return date;
    };

    const calculateDiff = (previstoStr: string | undefined, realizadoStr: string | undefined) => {
        const previsto = parseTime(previstoStr);
        const realizado = parseTime(realizadoStr);
        if (!previsto || !realizado) return { text: '-', color: 'text-gray-400' };

        const diffMinutes = (realizado.getTime() - previsto.getTime()) / (1000 * 60);

        if (diffMinutes > 5) return { text: `+${diffMinutes}m`, color: 'text-red-600 dark:text-red-400 font-bold' };
        if (diffMinutes < -2) return { text: `${diffMinutes}m`, color: 'text-blue-600 dark:text-blue-400 font-bold' };
        if (diffMinutes > 0) return { text: `+${diffMinutes}m`, color: 'text-yellow-600 dark:text-yellow-400' };
        return { text: 'No Horário', color: 'text-green-600 dark:text-green-400' };
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-[#fbcc2c] dark:text-yellow-400 mb-4" />
                <span className="text-gray-600 dark:text-gray-300 font-medium">Carregando viagens...</span>
            </div>
        );
    }

    if (viagens.length === 0) {
        return (
            <div className="text-center py-20">
                <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                    <Bus className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Nenhuma viagem encontrada</h3>
                <p className="mt-1 text-gray-500 dark:text-gray-400">
                    Tente ajustar os filtros ou sincronizar os dados para a data selecionada.
                </p>
            </div>
        );
    }

    return (
        <div>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50/50 dark:bg-gray-800/50">
                        <tr>
                            {['Linha / Serviço', 'Status', 'Sentido', 'Horários', 'Veículo / Motorista'].map(header => (
                                <th key={header} className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-transparent">
                        {viagens.map((v: ViagemTransdata) => {
                            const diff = calculateDiff(v.InicioPrevistoText, v.InicioRealizadoText);
                            const [linhaNumero, ...linhaNomeParts] = (v.NomeLinha || '').split(' - ');
                            const linhaNome = linhaNomeParts.join(' - ');

                            return (
                                <tr key={v.id} className="hover:bg-[#fbcc2c]/5 dark:hover:bg-yellow-500/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-[#fbcc2c]/20 dark:bg-yellow-500/20 flex items-center justify-center text-[#6b5d1a] dark:text-yellow-400 font-bold text-sm">
                                                {linhaNumero}
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate max-w-[180px]" title={linhaNome}>
                                                    {linhaNome || '-'}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                    Serviço: {v.Servico || '-'}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getStatusPill(v.statusCumprimento)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                                        {v.SentidoText || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm">
                                            <div className="flex items-center justify-between gap-4 mb-1">
                                                <span className="text-gray-500 dark:text-gray-400 text-xs uppercase">Previsto</span>
                                                <span className="font-medium text-gray-900 dark:text-gray-100">{v.InicioPrevistoText || '-'}</span>
                                            </div>
                                            <div className="flex items-center justify-between gap-4 mb-1">
                                                <span className="text-gray-500 dark:text-gray-400 text-xs uppercase">Realizado</span>
                                                <span className="font-medium text-gray-900 dark:text-gray-100">{v.InicioRealizadoText || '-'}</span>
                                            </div>
                                            <div className="flex items-center justify-between gap-4 pt-1 border-t border-gray-100 dark:border-gray-700">
                                                <span className="text-gray-500 dark:text-gray-400 text-xs uppercase">Dif.</span>
                                                <span className={`font-bold text-xs ${diff.color}`}>{diff.text}</span>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Mobile/Tablet Cards */}
            <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-4">
                {viagens.map((v: ViagemTransdata) => {
                    const diff = calculateDiff(v.InicioPrevistoText, v.InicioRealizadoText);
                    const [linhaNumero, ...linhaNomeParts] = (v.NomeLinha || '').split(' - ');
                    const linhaNome = linhaNomeParts.join(' - ');

                    return (
                        <div key={v.id} className="bg-white/40 dark:bg-gray-800/40 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-white/60 dark:hover:bg-gray-800/60 transition-all shadow-sm">
                            <div className="flex justify-between items-start gap-3 mb-3">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-[#fbcc2c] dark:bg-yellow-600 flex items-center justify-center text-gray-900 font-bold text-sm shadow-sm">
                                        {linhaNumero}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm truncate" title={linhaNome}>{linhaNome}</h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Serviço: {v.Servico}</p>
                                    </div>
                                </div>
                                {getStatusPill(v.statusCumprimento)}
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-sm border-t border-gray-100 dark:border-gray-700 pt-3">
                                <div className="space-y-2">
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Sentido</p>
                                        <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{v.SentidoText || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Veículo</p>
                                        <p className="font-medium text-gray-900 dark:text-gray-100">{v.PrefixoRealizado || '-'}</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Horário</p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-900 dark:text-gray-100">{v.InicioPrevistoText || '-'}</span>
                                            <span className="text-gray-400">→</span>
                                            <span className="text-gray-900 dark:text-gray-100">{v.InicioRealizadoText || '-'}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Diferença</p>
                                        <p className={`font-bold ${diff.color}`}>{diff.text}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center text-xs text-gray-500 dark:text-gray-400">
                                <User className="h-3 w-3 mr-1.5" />
                                <span className="truncate">{v.NomeMotorista || 'Motorista não identificado'}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// Componente para quando não há dados disponíveis
const NoData = ({ onSync, synchronizing }: any) => (
    <Card className="border-none shadow-lg bg-white/60 dark:bg-gray-900/60 backdrop-blur-md text-center py-12">
        <CardContent>
            <div className="mx-auto w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                <Calendar className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Dados não disponíveis
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8">
                Não existem dados de viagens sincronizados para a data selecionada. Clique no botão abaixo para buscar os dados da API Transdata.
            </p>
            <Button
                onClick={onSync}
                disabled={synchronizing}
                className="w-full sm:w-auto bg-gradient-to-r from-[#fbcc2c] to-[#ecd43c] hover:from-[#e6cd4a] hover:to-[#d4cc54] dark:from-yellow-600 dark:to-amber-600 text-gray-900 font-semibold shadow-lg hover:shadow-xl transition-all px-8 py-6 h-auto text-lg"
            >
                <RefreshCw className={`h-5 w-5 mr-3 ${synchronizing ? 'animate-spin' : ''}`} />
                {synchronizing ? 'Sincronizando...' : 'Sincronizar Agora'}
            </Button>
        </CardContent>
    </Card>
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
    prefixoRealizado: undefined,
    nomeMotorista: undefined,
    somenteAtrasados: false,
};

export const Viagens: React.FC = () => {
    const { user } = useAuth();
    const isAdmin = ['administrador', 'admin'].includes(String(user?.role || '').toLowerCase());
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
    const [showHistorico, setShowHistorico] = useState(false);

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
        console.log(`[FRONTEND] Iniciando sincronização para ${selectedDate}...`);
        try {
            const result = await viagensTransdataService.sincronizarViagens(selectedDate);
            console.log('[FRONTEND] Sincronização bem-sucedida:', result);
            setSuccess(`Sincronização concluída: ${result.sincronizadas} viagens processadas.`);
            await loadInitialData(); // Recarrega todos os dados
        } catch (err: any) {
            console.error('[FRONTEND] Erro na sincronização:', err);
            const msg = err.response?.data?.message || err.message || 'Erro desconhecido na sincronização.';
            const stack = err.response?.data?.stack ? `\n\nStack Trace:\n${err.response.data.stack}` : '';
            setError(`Falha ao sincronizar: ${msg}${stack}`);
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

    return (
        <div className="space-y-6 p-4 sm:p-6 lg:p-8">
            <PageHeader
                onSync={handleSincronizar}
                onToggleFilters={() => setShowFilters(!showFilters)}
                filtersVisible={showFilters}
                synchronizing={sincronizando}
                hasData={!!statusDados?.existemDados}
                isAdmin={isAdmin}
            />

            {error && (
                <Alert variant="destructive" className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50 text-red-800 dark:text-red-300">
                    <AlertIcon className="text-red-600 dark:text-red-400" />
                    <AlertTitle>Erro!</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            {success && (
                <Alert variant="success" className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/50 text-green-800 dark:text-green-300">
                    <AlertIcon className="text-green-600 dark:text-green-400" />
                    <AlertTitle>Sucesso!</AlertTitle>
                    <AlertDescription>{success}</AlertDescription>
                </Alert>
            )}

            <DateAndStatus
                date={selectedDate}
                onDateChange={setSelectedDate}
                status={statusDados}
            />

            {showFilters && (
                <div className="animate-in slide-in-from-top-4 duration-300">
                    <ViagensFiltersPanel
                        filters={filtros}
                        onFilterChange={handleFilterChange}
                        onClearFilters={clearFilters}
                        onApplyFilters={loadInitialData}
                        onShowHistorico={() => setShowHistorico(true)}
                        services={servicos}
                    />
                </div>
            )}

            {loading && !statusDados ? (
                <div className="flex flex-col items-center justify-center py-32">
                    <Loader2 className="h-12 w-12 animate-spin text-[#fbcc2c] dark:text-yellow-400 mb-4" />
                    <span className="text-lg text-gray-600 dark:text-gray-300 font-medium">Verificando dados...</span>
                </div>
            ) : statusDados?.existemDados ? (
                <Card className="border-none shadow-xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-md overflow-hidden">
                    <CardContent className="p-0">
                        <ViagensTable
                            viagens={viagens}
                            loading={loading}
                        />
                    </CardContent>
                </Card>
            ) : (
                <NoData onSync={handleSincronizar} synchronizing={sincronizando} />
            )}
            <HistoryDrawerCH open={showHistorico} date={selectedDate} filtros={filtros} onClose={() => setShowHistorico(false)} />
        </div>
    );
};
