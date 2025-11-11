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
    Loader2,
    User,
    Truck,
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

const FilterSection = ({ filters, onFilterChange, onClearFilters, services }: any) => (
    <GlowingCard>
        <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <InputFilter id="nomeLinha" label="Nome da Linha" type="text" value={filters.nomeLinha} onChange={onFilterChange} placeholder="Buscar por nome..." />
                <SelectFilter id="numeroServico" label="Número do Serviço" value={filters.numeroServico} onChange={onFilterChange} options={services.map((s: number) => ({ value: s, label: s }))} placeholder="Todos os serviços" />
                <SelectFilter id="sentido" label="Sentido" value={filters.sentido} onChange={onFilterChange} options={[{ value: 'IDA', label: 'Ida' }, { value: 'VOLTA', label: 'Volta' }]} placeholder="Todos" />
                <SelectFilter id="statusCumprimento" label="Status" value={filters.statusCumprimento} onChange={onFilterChange} options={[{ value: 'CUMPRIDA', label: 'Cumprida' }, { value: 'NAO_CUMPRIDA', label: 'Não Cumprida' }, { value: 'PARCIALMENTE_CUMPRIDA', label: 'Parcial' }, { value: 'PENDENTE', label: 'Pendente' }]} placeholder="Todos" />
                <InputFilter id="prefixoRealizado" label="Prefixo do Veículo" type="text" value={filters.prefixoRealizado} onChange={onFilterChange} placeholder="Ex: 12345" />
                <InputFilter id="nomeMotorista" label="Nome do Motorista" type="text" value={filters.nomeMotorista} onChange={onFilterChange} placeholder="Buscar por nome..." />
                <InputFilter id="horarioInicio" label="Horário Início (a partir de)" type="time" value={filters.horarioInicio} onChange={onFilterChange} />
                <InputFilter id="horarioFim" label="Horário Fim (até)" type="time" value={filters.horarioFim} onChange={onFilterChange} />
                <div className="flex items-end">
                    <div className="flex items-center h-10">
                        <input id="somenteAtrasados" type="checkbox" checked={filters.somenteAtrasados || false} onChange={(e) => onFilterChange('somenteAtrasados', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-yellow-600 focus:ring-yellow-500" />
                        <Label htmlFor="somenteAtrasados" className="ml-2 text-sm text-gray-300">Somente Atrasados</Label>
                    </div>
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

const InputFilter = ({ id, label, ...props }: any) => (
    <div>
        <Label htmlFor={id}>{label}</Label>
        <Input id={id} name={id} onChange={(e) => props.onChange(id, e.target.value || undefined)} {...props} />
    </div>
);

const SelectFilter = ({ id, label, value, onChange, options, placeholder }: any) => (
    <div>
        <Label htmlFor={id}>{label}</Label>
        <select id={id} name={id} value={value || ''} onChange={(e) => onChange(id, e.target.value || undefined)} className="w-full mt-1 flex h-10 rounded-md border border-yellow-400/20 bg-neutral-900 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 disabled:cursor-not-allowed disabled:opacity-50">
            <option value="">{placeholder}</option>
            {options.map((opt: any) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
    </div>
);

// Componente para a tabela de viagens (agora responsivo)
const ViagensTable = ({ viagens, loading }: { viagens: ViagemTransdata[], loading: boolean }) => {
    const getStatusPill = (status: string) => {
        const styles: { [key: string]: string } = {
            CUMPRIDA: 'bg-green-900/50 text-green-300 border-green-500/30',
            NAO_CUMPRIDA: 'bg-red-900/50 text-red-300 border-red-500/30',
            PARCIALMENTE_CUMPRIDA: 'bg-yellow-900/50 text-yellow-300 border-yellow-500/30',
            PENDENTE: 'bg-gray-700/50 text-gray-400 border-gray-500/30',
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

        if (diffMinutes > 5) return { text: `+${diffMinutes}m`, color: 'text-red-400 font-semibold' };
        if (diffMinutes < -2) return { text: `${diffMinutes}m`, color: 'text-blue-400 font-semibold' };
        if (diffMinutes > 0) return { text: `+${diffMinutes}m`, color: 'text-yellow-400' };
        return { text: 'No Horário', color: 'text-green-400' };
    };

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
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full">
                    <thead>
                        <tr className="border-b border-yellow-400/20">
                            {['Linha / Serviço', 'Status', 'Sentido', 'Horários (Saída)', 'Veículo / Motorista'].map(header => (
                                <th key={header} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800">
                        {viagens.map((v: ViagemTransdata) => {
                            const diff = calculateDiff(v.InicioPrevistoText, v.InicioRealizadoText);
                            const [linhaNumero, ...linhaNomeParts] = (v.NomeLinha || '').split(' - ');
                            const linhaNome = linhaNomeParts.join(' - ');

                            return (
                                <tr key={v.id} className="hover:bg-neutral-800/50 transition-colors">
                                    <td className="px-4 py-3 text-sm">
                                        <div className="font-medium text-gray-200 flex items-center">
                                            <span className="font-bold text-yellow-400 mr-2">{linhaNumero}</span>
                                            <span className="truncate max-w-xs" title={linhaNome}>{linhaNome || '-'}</span>
                                        </div>
                                        <div className="text-xs text-gray-400 mt-1">
                                            Serviço: {v.Servico || '-'}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm">{getStatusPill(v.statusCumprimento)}</td>
                                    <td className="px-4 py-3 text-sm text-gray-400">{v.SentidoText || '-'}</td>
                                    <td className="px-4 py-3 text-sm">
                                        <div className="flex items-center">
                                            <span className="text-gray-500 w-16">Previsto:</span>
                                            <span className="text-gray-300">{v.InicioPrevistoText || '-'}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <span className="text-gray-500 w-16">Realizado:</span>
                                            <span className="text-gray-100 font-medium">{v.InicioRealizadoText || '-'}</span>
                                        </div>
                                        <div className={`flex items-center ${diff.color}`}>
                                            <span className="text-gray-500 w-16">Diferença:</span>
                                            <span className="font-semibold">{diff.text}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        <div className="flex items-center text-gray-300">
                                            <Truck className="h-4 w-4 mr-2 text-gray-500" />
                                            Prefixo: <span className="font-medium ml-1">{v.PrefixoRealizado || '-'}</span>
                                        </div>
                                        <div className="flex items-center text-gray-400 mt-1 truncate max-w-[200px]" title={v.NomeMotorista}>
                                            <User className="h-4 w-4 mr-2 text-gray-500" />
                                            <span className="truncate">{v.NomeMotorista || '-'}</span>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
                {viagens.map((v: ViagemTransdata) => {
                    const diff = calculateDiff(v.InicioPrevistoText, v.InicioRealizadoText);
                    return (
                        <div key={v.id} className="bg-neutral-800/50 p-4 rounded-lg border border-yellow-400/20">
                            <div className="flex justify-between items-start gap-4">
                                <h3 className="font-bold text-gray-100 text-base leading-tight">{v.NomeLinha}</h3>
                                {getStatusPill(v.statusCumprimento)}
                            </div>
                            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm border-t border-neutral-700 pt-3">
                                <InfoItem label="Serviço" value={v.Servico} />
                                <InfoItem label="Sentido" value={v.SentidoText} />
                                <InfoItem label="Prefixo" value={v.PrefixoRealizado} />
                                <InfoItem label="Motorista" value={v.NomeMotorista} />
                                <InfoItem label="Previsto" value={v.InicioPrevistoText} />
                                <InfoItem label="Realizado" value={v.InicioRealizadoText} />
                                <div className="col-span-2">
                                    <p className="text-gray-400">Diferença</p>
                                    <p className={`font-medium ${diff.color}`}>{diff.text}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const InfoItem = ({ label, value }: { label: string, value: any }) => (
    <div>
        <p className="text-gray-400">{label}</p>
        <p className="text-gray-200 font-medium truncate">{value || '-'}</p>
    </div>
);

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
    prefixoRealizado: undefined,
    nomeMotorista: undefined,
    somenteAtrasados: false,
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
