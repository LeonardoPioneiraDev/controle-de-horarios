// src/pages/Viagens.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { viagensTransdataService } from '../services/api';
import { ViagemTransdata, FiltrosViagem, StatusDados } from '../types';
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
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription, AlertTitle, AlertIcon } from '../components/ui/alert';
import { ConfirmDialog } from '../components/ui/confirm-dialog';

// Helper for glowing card effect
const GlowingCard = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className="relative">
        <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-r from-yellow-400/30 via-amber-500/25 to-yellow-300/30 blur-md" />
        <Card className={`relative border border-yellow-400/20 shadow-[0_0_40px_rgba(251,191,36,0.15)] ${className}`}>
            {children}
        </Card>
    </div>
);


// Componente para o cabeçalho da página
const PageHeader = ({ onSync, onToggleFilters, filtersVisible, synchronizing, hasData }: any) => {
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
                <h1 className="text-3xl font-bold text-gray-100">Viagens Transdata</h1>
                <p className="mt-1 text-md text-gray-400">
                    Consulte e gerencie as viagens programadas em tempo real.
                </p>
            </div>
            <div className="flex space-x-3">
                <Button
                    variant={filtersVisible ? 'default' : 'outline'}
                    onClick={onToggleFilters}
                    className="w-full sm:w-auto"
                >
                    <Filter className="h-4 w-4 mr-2" />
                    Filtros
                    <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${filtersVisible ? 'rotate-180' : ''}`} />
                </Button>
                <Button
                    onClick={handleSyncClick}
                    disabled={synchronizing}
                    className="w-full sm:w-auto"
                >
                    <RefreshCw className={`h-4 w-4 mr-2 ${synchronizing ? 'animate-spin' : ''}`} />
                    {synchronizing ? 'Sincronizando...' : 'Sincronizar'}
                </Button>
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
    <GlowingCard>
        <CardContent className="p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center space-x-3">
                    <Label htmlFor="date-picker" className="text-gray-300">
                        Data:
                    </Label>
                    <Input
                        id="date-picker"
                        type="date"
                        value={date}
                        onChange={(e) => onDateChange(e.target.value)}
                        className="w-full md:w-auto"
                    />
                </div>
                {status && (
                    <div className="flex items-center flex-wrap gap-x-6 gap-y-2 text-sm">
                        <div>
                            <span className="text-gray-400">Status: </span>
                            <span className={`font-semibold ${status.existemDados ? 'text-green-400' : 'text-red-400'}`}>
                                {status.existemDados ? 'Dados Disponíveis' : 'Sem Dados'}
                            </span>
                        </div>
                        {status.totalViagens > 0 && (
                            <div>
                                <span className="text-gray-400">Total: </span>
                                <span className="font-semibold text-gray-200">
                                    {status.totalViagens.toLocaleString()} viagens
                                </span>
                            </div>
                        )}
                        {status.ultimaSincronizacao && (
                            <div>
                                <span className="text-gray-400">Última Sincronização: </span>
                                <span className="font-semibold text-gray-200">
                                    {new Date(status.ultimaSincronizacao).toLocaleString('pt-BR')}
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </CardContent>
    </GlowingCard>
);

// Componente para a seção de filtros
const FilterSection = ({ filters, onFilterChange, onClearFilters, services }: any) => (
    <GlowingCard>
        <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 custom-md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div>
                    <Label htmlFor="nomeLinha">Nome da Linha</Label>
                    <Input
                        id="nomeLinha"
                        type="text"
                        value={filters.nomeLinha || ''}
                        onChange={(e) => onFilterChange('nomeLinha', e.target.value || undefined)}
                        placeholder="Buscar por nome..."
                    />
                </div>
                <div>
                    <Label htmlFor="numeroServico">Número do Serviço</Label>
                    <select
                        id="numeroServico"
                        value={filters.numeroServico || ''}
                        onChange={(e) => onFilterChange('numeroServico', e.target.value ? parseInt(e.target.value) : undefined)}
                        className="w-full mt-1 flex h-10 rounded-md border border-yellow-400/20 bg-neutral-900 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <option value="">Todos os serviços</option>
                        {services.map((service: number) => <option key={service} value={service}>{service}</option>)}
                    </select>
                </div>
                <div>
                    <Label htmlFor="sentido">Sentido</Label>
                     <select
                        id="sentido"
                        value={filters.sentido || ''}
                        onChange={(e) => onFilterChange('sentido', e.target.value || undefined)}
                        className="w-full mt-1 flex h-10 rounded-md border border-yellow-400/20 bg-neutral-900 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <option value="">Todos</option>
                        <option value="IDA">Ida</option>
                        <option value="VOLTA">Volta</option>
                    </select>
                </div>
                <div>
                    <Label htmlFor="statusCumprimento">Status</Label>
                     <select
                        id="statusCumprimento"
                        value={filters.statusCumprimento || ''}
                        onChange={(e) => onFilterChange('statusCumprimento', e.target.value || undefined)}
                        className="w-full mt-1 flex h-10 rounded-md border border-yellow-400/20 bg-neutral-900 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <option value="">Todos</option>
                        <option value="CUMPRIDA">Cumprida</option>
                        <option value="NAO_CUMPRIDA">Não Cumprida</option>
                        <option value="PARCIALMENTE_CUMPRIDA">Parcial</option>
                        <option value="PENDENTE">Pendente</option>
                    </select>
                </div>
                <div>
                    <Label htmlFor="pontoFinal">Ponto Final</Label>
                    <select
                        id="pontoFinal"
                        value={filters.pontoFinal || ''}
                        onChange={(e) => onFilterChange('pontoFinal', e.target.value || undefined)}
                        className="w-full mt-1 flex h-10 rounded-md border border-yellow-400/20 bg-neutral-900 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <option value="">Todos</option>
                        <option value="Manual">Manual</option>
                        <option value="Automático">Automático</option>
                    </select>
                </div>
                <div>
                    <Label htmlFor="horarioInicio">Horário Início (a partir de)</Label>
                    <Input
                        id="horarioInicio"
                        type="time"
                        value={filters.horarioInicio || ''}
                        onChange={(e) => onFilterChange('horarioInicio', e.target.value || undefined)}
                    />
                </div>
                <div>
                    <Label htmlFor="horarioFim">Horário Fim (até)</Label>
                    <Input
                        id="horarioFim"
                        type="time"
                        value={filters.horarioFim || ''}
                        onChange={(e) => onFilterChange('horarioFim', e.target.value || undefined)}
                    />
                </div>
            </div>
            <div className="mt-4 flex justify-end">
                <Button variant="outline" onClick={onClearFilters}>
                    Limpar Filtros
                </Button>
            </div>
        </CardContent>
    </GlowingCard>
);

// Componente para a tabela de viagens (agora responsivo)
const ViagensTable = ({ viagens, loading, onFormatTime, onGetStatusIcon, onGetStatusText, onGetStatusColor }: any) => {
    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-yellow-400" />
                <span className="ml-3 text-gray-300">Carregando viagens...</span>
            </div>
        );
    }

    if (viagens.length === 0) {
        return (
            <div className="text-center py-20 rounded-lg">
                <Bus className="mx-auto h-12 w-12 text-gray-500" />
                <h3 className="mt-2 text-lg font-medium text-gray-200">Nenhuma viagem encontrada</h3>
                <p className="mt-1 text-sm text-gray-400">
                    Tente ajustar os filtros ou sincronizar os dados para a data selecionada.
                </p>
            </div>
        );
    }

    return (
        <div>
            {/* Layout de Tabela para telas grandes (md e acima) */}
            <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-yellow-400/20">
                    <thead>
                        <tr>
                            {['Nome da Linha', 'Serviço', 'Sentido', 'Previsto', 'Realizado', 'Ponto Final', 'Status'].map(header => (
                                <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-yellow-400/20">
                        {viagens.map((viagem: ViagemTransdata) => (
                            <tr key={viagem.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4 text-sm text-gray-200 max-w-xs truncate" title={viagem.NomeLinha}>{viagem.NomeLinha || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{viagem.Servico || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{viagem.SentidoText || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 flex items-center">
                                    <Clock className="h-4 w-4 mr-1.5 text-gray-500" />
                                    {onFormatTime(viagem.InicioPrevistoText)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 flex items-center">
                                    <Clock className="h-4 w-4 mr-1.5 text-gray-500" />
                                    {onFormatTime(viagem.InicioRealizadoText)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 flex items-center">
                                    <MapPin className="h-4 w-4 mr-1.5 text-gray-500" />
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

            {/* Layout de Cards para telas pequenas (abaixo de md) */}
            <div className="md:hidden space-y-4">
                {viagens.map((viagem: ViagemTransdata) => (
                    <div key={viagem.id} className="bg-neutral-800/50 p-4 rounded-lg border border-yellow-400/20">
                        {/* Card Header */}
                        <div className="flex justify-between items-start gap-4">
                            <h3 className="font-bold text-gray-100 text-base leading-tight">{viagem.NomeLinha}</h3>
                            <div className="flex-shrink-0 flex items-center">
                                {onGetStatusIcon(viagem.statusCumprimento)}
                                <span className={`ml-2 text-sm font-medium ${onGetStatusColor(viagem.statusCumprimento)}`}>
                                    {onGetStatusText(viagem.statusCumprimento)}
                                </span>
                            </div>
                        </div>

                        {/* Card Body */}
                        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                            <div>
                                <p className="text-gray-400">Serviço</p>
                                <p className="text-gray-200 font-medium">{viagem.Servico}</p>
                            </div>
                            <div>
                                <p className="text-gray-400">Sentido</p>
                                <p className="text-gray-200 font-medium">{viagem.SentidoText}</p>
                            </div>
                            <div>
                                <p className="text-gray-400">Previsto</p>
                                <p className="text-gray-200 font-medium flex items-center">
                                    <Clock size={14} className="mr-1.5 text-gray-500" />
                                    {onFormatTime(viagem.InicioPrevistoText)}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-400">Realizado</p>
                                <p className="text-gray-200 font-medium flex items-center">
                                    <Clock size={14} className="mr-1.5 text-gray-500" />
                                    {onFormatTime(viagem.InicioRealizadoText)}
                                </p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-gray-400">Ponto Final</p>
                                <p className="text-gray-200 font-medium flex items-center">
                                    <MapPin size={14} className="mr-1.5 text-gray-500" />
                                    {viagem.PontoFinal || '-'}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Componente para quando não há dados disponíveis
const NoData = ({ onSync, synchronizing }: any) => (
    <GlowingCard className="text-center">
        <CardContent className="p-8">
            <Calendar className="mx-auto h-12 w-12 text-gray-500" />
            <h3 className="mt-4 text-xl font-semibold text-gray-200">
                Dados não disponíveis para esta data
            </h3>
            <p className="mt-2 text-md text-gray-400">
                Clique no botão abaixo para buscar os dados da API Transdata.
            </p>
            <Button
                onClick={onSync}
                disabled={synchronizing}
                className="mt-6 w-full sm:w-auto"
                size="lg"
            >
                <RefreshCw className={`h-5 w-5 mr-2 ${synchronizing ? 'animate-spin' : ''}`} />
                {synchronizing ? 'Sincronizando...' : 'Sincronizar Dados'}
            </Button>
        </CardContent>
    </GlowingCard>
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
            'CUMPRIDA': <CheckCircle className="h-4 w-4 text-green-400" />,
            'NAO_CUMPRIDA': <XCircle className="h-4 w-4 text-red-400" />,
            'PARCIALMENTE_CUMPRIDA': <AlertCircle className="h-4 w-4 text-yellow-400" />,
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
            'CUMPRIDA': 'text-green-400',
            'NAO_CUMPRIDA': 'text-red-400',
            'PARCIALMENTE_CUMPRIDA': 'text-yellow-400',
            'PENDENTE': 'text-gray-400',
        };
        return colors[status] || 'text-gray-400';
    };

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-black via-neutral-900 to-yellow-950 text-gray-100 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                <PageHeader
                    onSync={handleSincronizar}
                    onToggleFilters={() => setShowFilters(!showFilters)}
                    filtersVisible={showFilters}
                    synchronizing={sincronizando}
                    hasData={!!statusDados?.existemDados}
                />

                {error && (
                    <Alert variant="destructive">
                        <AlertIcon />
                        <AlertTitle>Erro!</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                {success && (
                     <Alert variant="success">
                        <AlertIcon />
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
                    <FilterSection
                        filters={filtros}
                        onFilterChange={handleFilterChange}
                        onClearFilters={clearFilters}
                        services={servicos}
                    />
                )}

                {loading && !statusDados ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-yellow-400" />
                        <span className="ml-3 text-gray-300">Verificando dados...</span>
                    </div>
                ) : statusDados?.existemDados ? (
                    <GlowingCard>
                        <CardContent className="p-4 md:p-0 md:overflow-hidden">
                            <ViagensTable
                                viagens={viagens}
                                loading={loading}
                                onFormatTime={formatTime}
                                onGetStatusIcon={getStatusIcon}
                                onGetStatusText={getStatusText}
                                onGetStatusColor={getStatusColor}
                            />
                        </CardContent>
                    </GlowingCard>
                ) : (
                    <NoData onSync={handleSincronizar} synchronizing={sincronizando} />
                )}
            </div>
        </div>
    );
};
