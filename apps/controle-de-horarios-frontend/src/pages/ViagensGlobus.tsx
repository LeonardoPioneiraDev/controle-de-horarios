// src/pages/ViagensGlobus.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { viagensGlobusService } from '../services/viagens-globus/viagens-globus.service';
import { controleHorariosService } from '../services/controleHorariosService';
import { ViagemGlobus, FiltrosViagemGlobus, StatusDadosGlobus } from '../types/viagens-globus.types';
import { ControleHorarioItem } from '../types/controle-horarios.types';
import { toast } from 'react-toastify';
import {
  Bus,
  Calendar,
  Filter,
  RefreshCw,
  Clock,
  MapPin,
  Server,
  User,
  Users as UsersIcon,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription, AlertTitle, AlertIcon } from '../components/ui/alert';

// Helper for glowing card effect
const GlowingCard = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className="relative">
        <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-r from-yellow-400/30 via-amber-500/25 to-yellow-300/30 blur-md" />
        <Card className={`relative border border-yellow-400/20 shadow-[0_0_40px_rgba(251,191,36,0.15)] ${className}`}>
            {children}
        </Card>
    </div>
);

// Reusable components
const PageHeader = ({ onSync, onToggleFilters, filtersVisible, synchronizing, onTestOracle, testingOracle }: any) => (
  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
    <div>
      <h1 className="text-3xl font-bold text-gray-100">Viagens Globus</h1>
      <p className="mt-1 text-md text-gray-400">
        Consulte e gerencie as viagens do sistema Oracle Globus.
      </p>
    </div>
    <div className="flex space-x-3">
      <Button
        variant={filtersVisible ? 'default' : 'outline'}
        onClick={onToggleFilters}
      >
        <Filter className="h-4 w-4 mr-2" />
        Filtros
        <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${filtersVisible ? 'rotate-180' : ''}`} />
      </Button>
      <Button
        onClick={onTestOracle}
        disabled={testingOracle}
        variant="outline"
        className="border-orange-500/50 text-orange-400 hover:bg-orange-500/10 hover:text-orange-300"
      >
        <Server className={`h-4 w-4 mr-2 ${testingOracle ? 'animate-pulse' : ''}`} />
        {testingOracle ? 'Testando...' : 'Testar Oracle'}
      </Button>
      <Button
        onClick={onSync}
        disabled={synchronizing}
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${synchronizing ? 'animate-spin' : ''}`} />
        {synchronizing ? 'Sincronizando...' : 'Sincronizar'}
      </Button>
    </div>
  </div>
);

const DateAndStatus = ({ date, onDateChange, status }: any) => (
  <GlowingCard>
    <CardContent className="p-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Label htmlFor="date-picker" className="text-gray-300">Data:</Label>
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
              <span className={`font-semibold ${status.existeNoBanco ? 'text-green-400' : 'text-red-400'}`}>
                {status.existeNoBanco ? 'Dados Disponíveis' : 'Sem Dados'}
              </span>
            </div>
            {status.totalRegistros > 0 && (
              <div>
                <span className="text-gray-400">Total: </span>
                <span className="font-semibold text-gray-200">
                  {status.totalRegistros.toLocaleString()} viagens
                </span>
              </div>
            )}
            {status.ultimaAtualizacao && (
              <div>
                <span className="text-gray-400">Última Atualização: </span>
                <span className="font-semibold text-gray-200">
                  {new Date(status.ultimaAtualizacao).toLocaleString('pt-BR')}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </CardContent>
  </GlowingCard>
);

const FilterSection = ({ filters, onFilterChange, onClearFilters, setores, linhas }: any) => (
  <GlowingCard>
    <CardContent className="p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <Label htmlFor="setor">Setor</Label>
          <select
            id="setor"
            value={filters.setor_principal_linha || ''}
            onChange={(e) => onFilterChange('setor_principal_linha', e.target.value || undefined)}
            className="w-full mt-1 flex h-10 rounded-md border border-yellow-400/20 bg-neutral-900 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Todos os setores</option>
            {setores && setores.map((setor: string) => <option key={setor} value={setor}>{setor}</option>)}
          </select>
        </div>
        <div>
          <Label htmlFor="linha">Linha</Label>
          <select
            id="linha"
            value={filters.codigo_linha || ''}
            onChange={(e) => onFilterChange('codigo_linha', e.target.value || undefined)}
            className="w-full mt-1 flex h-10 rounded-md border border-yellow-400/20 bg-neutral-900 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Todas as linhas</option>
            {linhas && linhas.map((linha: string) => <option key={linha} value={linha}>{linha}</option>)}
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
            <option value="CIRCULAR">Circular</option>
          </select>
        </div>
        <div>
          <Label htmlFor="nomeMotorista">Nome do Motorista</Label>
          <Input
            id="nomeMotorista"
            type="text"
            value={filters.nomeMotorista || ''}
            onChange={(e) => onFilterChange('nomeMotorista', e.target.value || undefined)}
            placeholder="Buscar por nome..."
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

const ViagensTable = ({ viagens, loading, formatTime }: { viagens: ControleHorarioItem[]; loading: boolean; formatTime: (time: Date | string) => string }) => {
    const getSentidoColor = (sentido: string) => {
        switch (sentido) {
        case 'IDA':
            return 'text-blue-400 bg-blue-900/50 border-blue-500/30';
        case 'VOLTA':
            return 'text-green-400 bg-green-900/50 border-green-500/30';
        case 'CIRCULAR':
            return 'text-purple-400 bg-purple-900/50 border-purple-500/30';
        default:
            return 'text-gray-400 bg-gray-700/50 border-gray-500/30';
        }
    };

    const getPeriodoColor = (periodo: string) => {
        switch (periodo) {
        case 'MANHÃ':
            return 'text-yellow-400 bg-yellow-900/50 border-yellow-500/30';
        case 'TARDE':
            return 'text-orange-400 bg-orange-900/50 border-orange-500/30';
        case 'NOITE':
            return 'text-sky-400 bg-sky-900/50 border-sky-500/30';
        case 'MADRUGADA':
            return 'text-indigo-400 bg-indigo-900/50 border-indigo-500/30';
        default:
            return 'text-gray-400 bg-gray-700/50 border-gray-500/30';
        }
    };

    const getSetorColor = (setor: string) => {
        switch (setor) {
        case 'GAMA':
            return 'text-red-400 bg-red-900/50 border-red-500/30';
        case 'SANTA MARIA':
            return 'text-blue-400 bg-blue-900/50 border-blue-500/30';
        case 'PARANOÁ':
            return 'text-green-400 bg-green-900/50 border-green-500/30';
        case 'SÃO SEBASTIÃO':
            return 'text-purple-400 bg-purple-900/50 border-purple-500/30';
        default:
            return 'text-gray-400 bg-gray-700/50 border-gray-500/30';
        }
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
      <div className="text-center py-20">
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
                    {['Setor', 'Linha', 'Sentido', 'Horário Saída', 'Horário Chegada', 'Motorista', 'Local Origem', 'Período'].map(header => (
                    <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        {header}
                    </th>
                    ))}
                </tr>
                </thead>
                <tbody className="divide-y divide-yellow-400/20">
                {viagens.map((viagem: ControleHorarioItem) => (
                    <tr key={viagem.viagemGlobusId} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getSetorColor(viagem.setor_principal_linha)}`}>
                                {viagem.setor_principal_linha}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-200">
                            <div>
                                <div className="font-medium text-yellow-400">{viagem.codigoLinha}</div>
                                <div className="text-xs text-gray-400 max-w-xs truncate" title={viagem.nomeLinha}>
                                {viagem.nomeLinha}
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getSentidoColor(viagem.sentido_texto)}`}>
                                {viagem.sentido_texto}
                            </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-1.5 text-gray-500" />
                                {formatTime(viagem.horaSaida)}
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-1.5 text-gray-500" />
                                {formatTime(viagem.horaChegada)}
                            </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">
                            <div>
                                {viagem.nome_motorista ? (
                                <>
                                    <div className="flex items-center">
                                        <User className="h-4 w-4 mr-1.5 text-gray-500" />
                                        <span className="font-medium">{viagem.nome_motorista}</span>
                                    </div>
                                    {viagem.nome_cobrador && (
                                    <div className="flex items-center text-xs text-gray-500 mt-1">
                                        <UsersIcon className="h-3 w-3 mr-1.5" />
                                        <span>Cobrador: {viagem.nome_cobrador}</span>
                                    </div>
                                    )}
                                </>
                                ) : (
                                <span className="text-gray-500">-</span>
                                )}
                            </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">
                            <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-1.5 text-gray-500" />
                                <span className="max-w-xs truncate" title={viagem.local_origem_viagem}>
                                {viagem.local_origem_viagem || '-'}
                                </span>
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getPeriodoColor(viagem.periodo_do_dia)}`}>
                                {viagem.periodo_do_dia}
                            </span>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>

        {/* Layout de Cards para telas pequenas (abaixo de md) */}
        <div className="md:hidden space-y-4">
            {viagens.map((viagem: ControleHorarioItem) => (
                <div key={viagem.viagemGlobusId} className="bg-neutral-800/50 p-4 rounded-lg border border-yellow-400/20">
                    {/* Card Header */}
                    <div className="flex justify-between items-start gap-2">
                        <h3 className="font-bold text-gray-100 text-base leading-tight">
                            <span className="text-yellow-400">{viagem.codigoLinha}</span> - {viagem.nomeLinha}
                        </h3>
                        <span className={`flex-shrink-0 inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getSetorColor(viagem.setor_principal_linha)}`}>
                            {viagem.setor_principal_linha}
                        </span>
                    </div>

                    {/* Card Body */}
                    <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                        <div>
                            <p className="text-gray-400">Sentido</p>
                            <p className={`font-medium inline-flex px-2 py-1 text-xs rounded-full border ${getSentidoColor(viagem.sentido_texto)}`}>{viagem.sentido_texto}</p>
                        </div>
                        <div>
                            <p className="text-gray-400">Período</p>
                            <p className={`font-medium inline-flex px-2 py-1 text-xs rounded-full border ${getPeriodoColor(viagem.periodo_do_dia)}`}>{viagem.periodo_do_dia}</p>
                        </div>
                        <div>
                            <p className="text-gray-400">Saída</p>
                            <p className="text-gray-200 font-medium flex items-center">
                                <Clock size={14} className="mr-1.5 text-gray-500" />
                                {formatTime(viagem.horaSaida)}
                            </p>
                        </div>
                        <div>
                            <p className="text-gray-400">Chegada</p>
                            <p className="text-gray-200 font-medium flex items-center">
                                <Clock size={14} className="mr-1.5 text-gray-500" />
                                {formatTime(viagem.horaChegada)}
                            </p>
                        </div>
                        <div className="col-span-2">
                            <p className="text-gray-400">Motorista</p>
                            <p className="text-gray-200 font-medium flex items-center">
                                <User size={14} className="mr-1.5 text-gray-500" />
                                {viagem.nome_motorista || '-'}
                            </p>
                        </div>
                        {viagem.nome_cobrador && (
                            <div className="col-span-2">
                                <p className="text-gray-400">Cobrador</p>
                                <p className="text-gray-200 font-medium flex items-center">
                                    <UsersIcon size={14} className="mr-1.5 text-gray-500" />
                                    {viagem.nome_cobrador}
                                </p>
                            </div>
                        )}
                        <div className="col-span-2">
                            <p className="text-gray-400">Local de Origem</p>
                            <p className="text-gray-200 font-medium flex items-center">
                                <MapPin size={14} className="mr-1.5 text-gray-500" />
                                {viagem.local_origem_viagem || '-'}
                            </p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};

const NoData = ({ onSync, synchronizing, onTestOracle, testingOracle }: any) => (
  <GlowingCard className="text-center">
    <CardContent className="p-8">
        <Calendar className="mx-auto h-12 w-12 text-gray-500" />
        <h3 className="mt-4 text-xl font-semibold text-gray-200">
        Dados não disponíveis para esta data
        </h3>
        <p className="mt-2 text-md text-gray-400">
        Clique no botão abaixo para buscar os dados do Oracle Globus.
        </p>
        <div className="mt-6 flex justify-center items-center space-x-4">
            <Button
                onClick={onTestOracle}
                disabled={testingOracle}
                variant="outline"
                className="border-orange-500/50 text-orange-400 hover:bg-orange-500/10 hover:text-orange-300"
            >
                <Server className={`h-4 w-4 mr-2 ${testingOracle ? 'animate-pulse' : ''}`} />
                {testingOracle ? 'Testando...' : 'Testar Oracle'}
            </Button>
            <Button
                onClick={onSync}
                disabled={synchronizing}
                size="lg"
            >
                <RefreshCw className={`h-5 w-5 mr-2 ${synchronizing ? 'animate-spin' : ''}`} />
                {synchronizing ? 'Sincronizando...' : 'Sincronizar Dados'}
            </Button>
        </div>
    </CardContent>
  </GlowingCard>
);

const initialFilters: FiltrosViagemGlobus = {
  pagina: 1,
  limite: 100,
  setor_principal_linha: undefined,
  codigo_linha: undefined,
  sentido: undefined,
  nome_motorista: undefined,
};

export const ViagensGlobus: React.FC = () => {
  const [viagens, setViagens] = useState<ControleHorarioItem[]>([]);
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
        const [controleHorariosResponse, setoresResponse, linhasResponse] = await Promise.all([
          controleHorariosService.buscarControleHorarios(selectedDate, filtros),
          viagensGlobusService.getSetores(selectedDate),
          viagensGlobusService.getLinhas(selectedDate),
        ]);

        let lista = controleHorariosResponse?.data || [];

        if ((lista.length === 0) && (status.totalRegistros > 0)) {
          try {
            await controleHorariosService.sincronizarViagensGlobus(selectedDate);
            const refreshed = await controleHorariosService.buscarControleHorarios(selectedDate, filtros);
            lista = refreshed?.data || [];
          } catch (syncErr: any) {
            console.warn('Falha na sincronização automática de controle-horários:', syncErr?.message || syncErr);
          }
        }

        setViagens(lista);
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
      toast.success(`Sincronização concluída: ${result.sincronizadas} viagens processadas.`);
      await loadInitialData();
    } catch (err: any) {
      const errorMessage = err.message || 'Erro na sincronização.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSincronizando(false);
    }
  };

  const handleTestOracle = async () => {
    setTestingOracle(true);
    setError('');
    setSuccess('');
    setOracleStatus(null);
    try {
      const result = await viagensGlobusService.testarConexaoOracle();
      setOracleStatus(result);
      if (result.success) {
        setSuccess('Conexão com Oracle bem-sucedida!');
        toast.success('Conexão com Oracle bem-sucedida!');
      } else {
        setError(result.message || 'Falha ao testar conexão com Oracle.');
        toast.error(result.message || 'Falha ao testar conexão com Oracle.');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao testar conexão com Oracle.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setTestingOracle(false);
    }
  };

  const handleFilterChange = (key: keyof FiltrosViagemGlobus, value: any) => {
    setFiltros(prev => ({ ...prev, [key]: value, pagina: 1 }));
  };

  const clearFilters = () => {
    setFiltros(initialFilters);
  };

  const formatTime = (time: Date | string) => {
    if (!time) return '-';
    if (time instanceof Date) {
      return time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
    return time.substring(0, 5);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-black via-neutral-900 to-yellow-950 text-gray-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
            <PageHeader
                onSync={handleSincronizar}
                onToggleFilters={() => setShowFilters(!showFilters)}
                filtersVisible={showFilters}
                synchronizing={sincronizando}
                onTestOracle={handleTestOracle}
                testingOracle={testingOracle}
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
                    setores={setores}
                    linhas={linhas}
                />
            )}

            {loading && !statusDados ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-yellow-400" />
                    <span className="ml-3 text-gray-300">Verificando dados...</span>
                </div>
            ) : statusDados?.existeNoBanco ? (
                <GlowingCard>
                    <CardContent className="p-4 md:p-0 md:overflow-hidden">
                        <ViagensTable
                            viagens={viagens}
                            loading={loading}
                            formatTime={formatTime}
                        />
                    </CardContent>
                </GlowingCard>
            ) : (
                <NoData
                    onSync={handleSincronizar}
                    synchronizing={sincronizando}
                    onTestOracle={handleTestOracle}
                    testingOracle={testingOracle}
                />
            )}
        </div>
    </div>
  );
};
