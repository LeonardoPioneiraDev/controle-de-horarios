import React, { useState, useEffect, useCallback } from 'react';
import { viagensGlobusService } from '../../services/viagens-globus/viagens-globus.service';
import { ViagemGlobus, FiltrosViagemGlobus, StatusDadosGlobus } from '../../types/viagens-globus.types';
import { ControleHorarioItem, ControleHorario } from '../../types/controle-horarios.types';
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
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Alert, AlertDescription, AlertTitle, AlertIcon } from '../../components/ui/alert';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole, isAtLeast } from '../../types/user.types';

// Reusable components
const PageHeader = ({ onSync, onToggleFilters, filtersVisible, synchronizing, onTestOracle, testingOracle, hasData, isAdmin }: any) => {
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
          Viagens Globus
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 font-medium">
          Consulte e gerencie as viagens do sistema Oracle Globus.
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
            onClick={onTestOracle}
            disabled={testingOracle}
            variant="outline"
            className="w-full sm:w-auto border-orange-500/50 text-orange-600 dark:text-orange-400 hover:bg-orange-500/10"
          >
            <Server className={`h-4 w-4 mr-2 ${testingOracle ? 'animate-pulse' : ''}`} />
            {testingOracle ? 'Testando...' : 'Testar Oracle'}
          </Button>
        )}
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
                {status.existeNoBanco ? (
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500 mr-2" />
                )}
                <span className={`font-bold ${status.existeNoBanco ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {status.existeNoBanco ? 'Dados Disponíveis' : 'Sem Dados'}
                </span>
              </div>
            </div>

            {status.totalRegistros > 0 && (
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-100 dark:border-gray-700/50">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold tracking-wide">Total Viagens</p>
                <div className="flex items-center mt-1">
                  <Bus className="h-4 w-4 text-[#fbcc2c] dark:text-yellow-400 mr-2" />
                  <span className="font-bold text-gray-900 dark:text-gray-100">
                    {status.totalRegistros.toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {status.ultimaAtualizacao && (
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-100 dark:border-gray-700/50 sm:col-span-3 lg:col-span-1">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold tracking-wide">Última Atualização</p>
                <div className="flex items-center mt-1">
                  <Clock className="h-4 w-4 text-blue-500 mr-2" />
                  <span className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                    {new Date(status.ultimaAtualizacao).toLocaleString('pt-BR')}
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

const FilterSection = ({ filters, onFilterChange, onClearFilters, setores, linhas }: any) => (
  <Card className="border-none shadow-lg bg-white/60 dark:bg-gray-900/60 backdrop-blur-md animate-in slide-in-from-top-4 duration-300">
    <CardContent className="p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 custom-md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div>
          <Label htmlFor="sentido" className="text-gray-700 dark:text-gray-300">Sentido</Label>
          <select
            id="sentido"
            value={filters.sentido || ''}
            onChange={(e) => onFilterChange('sentido', e.target.value || undefined)}
            className="w-full mt-1 flex h-10 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800/50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fbcc2c] dark:focus-visible:ring-yellow-400 disabled:cursor-not-allowed disabled:opacity-50 text-gray-900 dark:text-gray-100"
          >
            <option value="">Todos</option>
            <option value="I">Ida</option>
            <option value="V">Volta</option>
            <option value="C">Circular</option>
          </select>
        </div>
        <div>
          <Label htmlFor="nomeMotorista" className="text-gray-700 dark:text-gray-300">Nome do Motorista</Label>
          <Input
            id="nomeMotorista"
            type="text"
            value={filters.nomeMotorista || ''}
            onChange={(e) => onFilterChange('nomeMotorista', e.target.value || undefined)}
            className="mt-1 bg-white dark:bg-gray-800/50 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>

        <div>
          <Label htmlFor="codServicoNumero" className="text-gray-700 dark:text-gray-300">Serviço</Label>
          <Input
            id="codServicoNumero"
            type="text"
            value={filters.codServicoNumero || ''}
            onChange={(e) => onFilterChange('codServicoNumero', e.target.value || undefined)}
            className="mt-1 bg-white dark:bg-gray-800/50 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
        <div>
          <Label htmlFor="nomeCobrador" className="text-gray-700 dark:text-gray-300">Nome do Cobrador</Label>
          <Input
            id="nomeCobrador"
            type="text"
            value={filters.nomeCobrador || ''}
            onChange={(e) => onFilterChange('nomeCobrador', e.target.value || undefined)}
            className="mt-1 bg-white dark:bg-gray-800/50 border-gray-300 dark:border-gray-700"
          />
        </div>

        <div>
          <Label htmlFor="buscaTexto" className="text-gray-700 dark:text-gray-300">Buscar</Label>
          <Input
            id="buscaTexto"
            type="text"
            placeholder="Linha, motorista, cobrador, serviço..."
            value={filters.buscaTexto || ''}
            onChange={(e) => onFilterChange('buscaTexto', e.target.value || undefined)}
            className="mt-1 bg-white dark:bg-gray-800/50 border-gray-300 dark:border-gray-700"
          />
        </div>
      </div>
      <div className="mt-6 flex justify-end">
        <Button variant="outline" onClick={onClearFilters} className="border-[#fbcc2c]/50 text-[#6b5d1a] dark:text-yellow-400 hover:bg-[#fbcc2c]/10">
          Limpar Filtros
        </Button>
      </div>
    </CardContent>
  </Card>
);

const ViagensTable = ({ viagens, loading, formatTime }: { viagens: ControleHorarioItem[]; loading: boolean; formatTime: (time: Date | string) => string }) => {
  const getSentidoColor = (sentido: string | undefined) => {
    switch (sentido) {
      case 'IDA':
        return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 border-blue-200 dark:border-blue-500/30';
      case 'VOLTA':
        return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/50 border-green-200 dark:border-green-500/30';
      case 'CIRCULAR':
        return 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/50 border-purple-200 dark:border-purple-500/30';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/50 border-gray-200 dark:border-gray-500/30';
    }
  };

  const getPeriodoColor = (periodo: string | undefined) => {
    switch (periodo) {
      case 'MANHÃ':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/50 border-yellow-200 dark:border-yellow-500/30';
      case 'TARDE':
        return 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/50 border-orange-200 dark:border-orange-500/30';
      case 'NOITE':
        return 'text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-900/50 border-sky-200 dark:border-sky-500/30';
      case 'MADRUGADA':
        return 'text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/50 border-indigo-200 dark:border-indigo-500/30';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/50 border-gray-200 dark:border-gray-500/30';
    }
  };

  const getSetorColor = (setor: string) => {
    switch (setor) {
      case 'GAMA':
        return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/50 border-red-200 dark:border-red-500/30';
      case 'SANTA MARIA':
        return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 border-blue-200 dark:border-blue-500/30';
      case 'PARANOÁ':
        return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/50 border-green-200 dark:border-green-500/30';
      case 'SÃO SEBASTIÃO':
        return 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/50 border-purple-200 dark:border-purple-500/30';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/50 border-gray-200 dark:border-gray-500/30';
    }
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
        <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">Nenhuma viagem encontrada</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Tente ajustar os filtros ou sincronizar os dados para a data selecionada.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Layout de Tabela para telas grandes (md e acima) */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50/50 dark:bg-gray-800/50">
            <tr>
              {['Setor', 'Linha', 'Serviço', 'Sentido', 'Horário Saída', 'Horário Chegada', 'Motorista', 'Cobrador', 'Carro', 'Local Origem', 'Local Destino', 'Tipo Dia', 'Período'].map(header => (
                <th key={header} className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-transparent">
            {viagens.map((viagem: ControleHorarioItem, index: number) => (
              <tr key={viagem.viagemGlobusId || index} className="hover:bg-[#fbcc2c]/5 dark:hover:bg-yellow-500/5 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getSetorColor(viagem.setor_principal_linha)}`}>
                    {viagem.setor_principal_linha}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-200">
                  <div className="font-bold">{viagem.codigoLinha}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[150px]" title={viagem.nomeLinha}>{viagem.nomeLinha}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-200 font-medium">{viagem.codServicoNumero ?? viagem.cod_servico_numero ?? '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getSentidoColor(viagem.sentido_texto)}`}>
                    {viagem.sentido_texto}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1.5 text-gray-400" />
                    {formatTime(viagem.horaSaida)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1.5 text-gray-400" />
                    {formatTime(viagem.horaChegada)}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                  <div>
                    {viagem.nome_motorista ? (
                      <>
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-1.5 text-gray-400" />
                          <span className="font-medium truncate max-w-[150px]" title={viagem.nome_motorista}>{viagem.nome_motorista}</span>
                        </div>
                        {viagem.crachaMotoristaGlobus && (
                          <div className="flex items-center text-xs text-gray-500 mt-1 ml-5">
                            <span>Crachá: {viagem.crachaMotoristaGlobus}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                  <div>
                    {viagem.nome_cobrador ? (
                      <>
                        <div className="flex items-center">
                          <UsersIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                          <span className="font-medium truncate max-w-[150px]" title={viagem.nome_cobrador}>{viagem.nome_cobrador}</span>
                        </div>
                        {viagem.crachaCobradorGlobus && (
                          <div className="flex items-center text-xs text-gray-500 mt-1 ml-5">
                            <span>Crachá: {viagem.crachaCobradorGlobus}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-200 font-medium">{viagem.numeroCarro || '-'}</td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1.5 text-gray-400" />
                    <span className="max-w-xs truncate" title={viagem.local_origem_viagem}>
                      {viagem.local_origem_viagem || '-'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1.5 text-gray-400" />
                    <span className="max-w-xs truncate" title={viagem.localDestinoLinha}>
                      {viagem.localDestinoLinha || '-'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{viagem.descTipoDia || '-'}</td>
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

      {/* Layout de Cards para telas pequenas (abaixo de lg) */}
      <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-4">
        {viagens.map((viagem: ControleHorarioItem, index: number) => (
          <div key={viagem.viagemGlobusId || index} className="bg-white/40 dark:bg-gray-800/40 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-white/60 dark:hover:bg-gray-800/60 transition-all shadow-sm">
            {/* Card Header */}
            <div className="flex justify-between items-start gap-2 mb-3">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-[#fbcc2c] dark:bg-yellow-600 flex items-center justify-center text-gray-900 font-bold text-sm shadow-sm">
                  {viagem.codigoLinha}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm truncate" title={viagem.nomeLinha}>{viagem.nomeLinha}</h3>
                  <span className={`inline-flex px-2 py-0.5 text-[10px] font-medium rounded-full border mt-1 ${getSetorColor(viagem.setor_principal_linha)}`}>
                    {viagem.setor_principal_linha}
                  </span>
                </div>
              </div>
            </div>

            {/* Card Body */}
            <div className="grid grid-cols-2 gap-3 text-sm border-t border-gray-100 dark:border-gray-700 pt-3">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Sentido</p>
                <p className={`font-medium inline-flex px-2 py-0.5 text-[10px] rounded-full border ${getSentidoColor(viagem.sentido_texto)}`}>{viagem.sentido_texto}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Período</p>
                <p className={`font-medium inline-flex px-2 py-0.5 text-[10px] rounded-full border ${getPeriodoColor(viagem.periodo_do_dia)}`}>{viagem.periodo_do_dia}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Saída</p>
                <p className="text-gray-900 dark:text-gray-100 font-medium flex items-center">
                  <Clock size={12} className="mr-1.5 text-gray-400" />
                  {formatTime(viagem.horaSaida)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Chegada</p>
                <p className="text-gray-900 dark:text-gray-100 font-medium flex items-center">
                  <Clock size={12} className="mr-1.5 text-gray-400" />
                  {formatTime(viagem.horaChegada)}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">Motorista</p>
                <p className="text-gray-900 dark:text-gray-100 font-medium flex items-center truncate">
                  <User size={12} className="mr-1.5 text-gray-400" />
                  {viagem.nome_motorista || '-'}
                </p>
              </div>
              {viagem.nome_cobrador && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Cobrador</p>
                  <p className="text-gray-900 dark:text-gray-100 font-medium flex items-center truncate">
                    <UsersIcon size={12} className="mr-1.5 text-gray-400" />
                    {viagem.nome_cobrador}
                  </p>
                </div>
              )}
              <div className="col-span-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">Origem</p>
                <p className="text-gray-900 dark:text-gray-100 font-medium flex items-center truncate">
                  <MapPin size={12} className="mr-1.5 text-gray-400" />
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

const NoData = ({ onSync, synchronizing, onTestOracle, testingOracle, isAdmin }: any) => (
  <Card className="border-none shadow-lg bg-white/60 dark:bg-gray-900/60 backdrop-blur-md text-center py-12">
    <CardContent>
      <div className="mx-auto w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
        <Calendar className="h-10 w-10 text-gray-400" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        Dados não disponíveis para esta data
      </h3>
      <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8">
        Clique no botão abaixo para buscar os dados do Oracle Globus.
      </p>
      <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
        {isAdmin && (
          <Button
            onClick={onTestOracle}
            disabled={testingOracle}
            variant="outline"
            className="w-full sm:w-auto border-orange-500/50 text-orange-600 dark:text-orange-400 hover:bg-orange-500/10"
          >
            <Server className={`h-4 w-4 mr-2 ${testingOracle ? 'animate-pulse' : ''}`} />
            {testingOracle ? 'Testando...' : 'Testar Oracle'}
          </Button>
        )}
        <Button
          onClick={onSync}
          disabled={synchronizing}
          size="lg"
          className="w-full sm:w-auto bg-gradient-to-r from-[#fbcc2c] to-[#ecd43c] hover:from-[#e6cd4a] hover:to-[#d4cc54] dark:from-yellow-600 dark:to-amber-600 text-gray-900 font-semibold shadow-lg hover:shadow-xl transition-all"
        >
          <RefreshCw className={`h-5 w-5 mr-2 ${synchronizing ? 'animate-spin' : ''}`} />
          {synchronizing ? 'Sincronizando...' : 'Sincronizar Dados'}
        </Button>
      </div>
    </CardContent>
  </Card>
);

// Mensagem clara quando não há dados para a data selecionada
const NoDataGlobus = ({ onSync, synchronizing, onTestOracle, testingOracle, isAdmin }: any) => (
  <Card className="border-none shadow-lg bg-white/60 dark:bg-gray-900/60 backdrop-blur-md text-center py-12">
    <CardContent>
      <div className="mx-auto w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
        <Calendar className="h-10 w-10 text-gray-400" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Não há dados para esta data</h3>
      <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8">Faça a sincronização para carregar os dados deste dia.</p>
      <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
        {isAdmin && (
          <Button
            onClick={onTestOracle}
            disabled={testingOracle}
            variant="outline"
            className="w-full sm:w-auto border-orange-500/50 text-orange-600 dark:text-orange-400 hover:bg-orange-500/10"
          >
            <Server className={`h-4 w-4 mr-2 ${testingOracle ? 'animate-pulse' : ''}`} />
            {testingOracle ? 'Testando...' : 'Testar Oracle'}
          </Button>
        )}
        {isAdmin && (
          <Button
            onClick={onSync}
            disabled={synchronizing}
            size="lg"
            className="w-full sm:w-auto bg-gradient-to-r from-[#fbcc2c] to-[#ecd43c] hover:from-[#e6cd4a] hover:to-[#d4cc54] dark:from-yellow-600 dark:to-amber-600 text-gray-900 font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            <RefreshCw className={`h-5 w-5 mr-2 ${synchronizing ? 'animate-spin' : ''}`} />
            {synchronizing ? 'Sincronizando...' : 'Sincronizar Dados'}
          </Button>
        )}
      </div>
    </CardContent>
  </Card>
);

const mapToControleHorarioItem = (item: ControleHorario): ControleHorarioItem => {
  return {
    ...item,
    setorPrincipalLinha: item.setor_principal_linha,
    codigoLinha: item.codigo_linha,
    nomeLinha: item.nome_linha,
    horaSaida: item.hor_saida instanceof Date ? item.hor_saida.toISOString() : item.hor_saida,
    horaChegada: item.hor_chegada instanceof Date ? item.hor_chegada.toISOString() : item.hor_chegada,
    nomeMotoristaGlobus: item.nome_motorista || '',
    crachaMotoristaGlobus: item.cracha_motorista_globus || 0,
    nomeCobradorGlobus: item.nome_cobrador || '',
    crachaCobradorGlobus: item.cracha_cobrador_globus || 0,
    codServicoNumero: item.cod_servico_numero || '',
    descTipoDia: item.desc_tipodia || '',
    localDestinoLinha: item.local_destino_linha || '',
    numeroCarro: item.prefixo_veiculo || '',
    nomeMotoristaEditado: item.motorista_substituto_nome || '',
    crachaMotoristaEditado: item.motorista_substituto_cracha || '',
    nomeCobradorEditado: item.cobrador_substituto_nome || '',
    crachaCobradorEditado: item.cracha_cobrador || '',
    observacoes: item.observacoes_edicao || '',
    informacaoRecolhe: '', // Assuming this is not directly from ControleHorario
    jaFoiEditado: !!item.observacoes_edicao, // Example logic
    viagemGlobusId: item.id,
    duracaoMinutos: 0,
    usuarioEdicao: item.editado_por_nome || '',
    usuarioEmail: item.editado_por_email || '',
  };
};

// Mapeia ViagemGlobus do backend para o item exibido na tabela
const mapViagemGlobusToItem = (v: ViagemGlobus): ControleHorarioItem => {
  const horaSaidaStr = v.horSaidaTime || v.horSaida || '';
  const horaChegadaStr = v.horChegadaTime || v.horChegada || '';
  return {
    // Campos base no formato ControleHorario
    id: v.id,
    setor_principal_linha: v.setorPrincipal,
    cod_local_terminal_sec: v.codLocalTerminalSec,
    codigo_linha: v.codigoLinha,
    nome_linha: v.nomeLinha,
    cod_destino_linha: v.codDestinoLinha,
    local_destino_linha: v.localDestinoLinha,
    flg_sentido: v.flgSentido,
    data_viagem: new Date(v.dataViagem),
    desc_tipodia: v.descTipoDia,
    hor_saida: horaSaidaStr ? new Date(`${v.dataViagem}T${horaSaidaStr}`) : (null as any),
    hor_chegada: horaChegadaStr ? new Date(`${v.dataViagem}T${horaChegadaStr}`) : (null as any),
    cod_origem_viagem: v.codOrigemViagem,
    local_origem_viagem: v.localOrigemViagem,
    cod_servico_completo: v.codServicoCompleto,
    cod_servico_numero: v.codServicoNumero,
    cod_atividade: undefined,
    nome_atividade: undefined,
    flg_tipo: undefined,
    cracha_motorista_globus: v.crachaMotoristaGlobus,
    nome_motorista: v.nomeMotorista,
    cracha_motorista: undefined,
    chapa_func_motorista: undefined,
    cracha_cobrador_globus: v.crachaCobradorGlobus,
    nome_cobrador: v.nomeCobrador,
    cracha_cobrador: undefined,
    chapa_func_cobrador: undefined,
    total_horarios: v.totalHorarios,
    placaVeiculo: undefined,
    garagemVeiculo: undefined,
    prefixo_veiculo: v.prefixoVeiculo,
    motorista_substituto_nome: undefined,
    motorista_substituto_cracha: undefined,
    cobrador_substituto_nome: undefined,
    cobrador_substituto_cracha: undefined,
    observacoes_edicao: undefined,
    editado_por_nome: undefined,
    editado_por_email: undefined,
    data_referencia: v.dataReferencia,
    hash_dados: '' as any,
    created_at: new Date(v.createdAt),
    updated_at: new Date(v.updatedAt),
    sentido_texto: v.sentidoTexto,
    periodo_do_dia: v.periodoDoDia,
    tem_cobrador: v.temCobrador,
    origem_dados: v.origemDados,
    is_ativo: true,
    cod_local_destino_linha: undefined,

    // Aliases usados na UI
    setorPrincipalLinha: v.setorPrincipal,
    codigoLinha: v.codigoLinha,
    nomeLinha: v.nomeLinha,
    horaSaida: horaSaidaStr,
    horaChegada: horaChegadaStr,
    nomeMotoristaGlobus: v.nomeMotorista,
    crachaMotoristaGlobus: v.crachaMotoristaGlobus || 0,
    nomeCobradorGlobus: v.nomeCobrador,
    crachaCobradorGlobus: v.crachaCobradorGlobus || 0,
    codServicoNumero: v.codServicoNumero,
    descTipoDia: v.descTipoDia || '',
    localDestinoLinha: v.localDestinoLinha || '',
    numeroCarro: v.prefixoVeiculo || '',
    nomeMotoristaEditado: '',
    crachaMotoristaEditado: '',
    nomeCobradorEditado: '',
    crachaCobradorEditado: '',
    observacoes: '',
    informacaoRecolhe: '',
    jaFoiEditado: false,
    viagemGlobusId: v.id,
    duracaoMinutos: v.duracaoMinutos,
    usuarioEdicao: '',
    usuarioEmail: '',
  };
};

const initialFilters: FiltrosViagemGlobus = {
  page: 1,
  limite: 100,
  setorPrincipal: undefined,
  codigoLinha: undefined,
  sentido: undefined,
  nomeMotorista: undefined,
};

export const ViagensGlobus: React.FC = () => {
  const { user } = useAuth();
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
  const isAdmin = isAtLeast(user?.role, UserRole.ADMINISTRADOR);
  const [pagination, setPagination] = useState<{ total: number; page: number; limit: number; totalPages: number }>({ total: 0, page: initialFilters.page || 1, limit: initialFilters.limite || 100, totalPages: 1 });

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const status = await viagensGlobusService.getStatusDados(selectedDate);
      setStatusDados(status);

      if (status.existeNoBanco) {
        // Buscar diretamente no endpoint de viagens Globus, evitando controle-horários aqui
        try {
          const [viagensResponse, setoresResponse, linhasResponse] = await Promise.all([
            viagensGlobusService.getViagens(selectedDate, filtros),
            viagensGlobusService.getSetores(selectedDate),
            viagensGlobusService.getLinhas(selectedDate),
          ]);

          const listaGlobus = viagensResponse?.data || [];
          const mappedViagens = listaGlobus.map(mapViagemGlobusToItem);
          setViagens(mappedViagens);
          setSetores(setoresResponse);
          setLinhas(linhasResponse);
          setPagination({ total: viagensResponse.total || 0, page: viagensResponse.page || (filtros.page || 1), limit: viagensResponse.limit || (filtros.limite || 100), totalPages: viagensResponse.totalPages || 1 });
          return;
        } catch (e) {
          // Evita fallback para controle-horarios aqui; mantém UI estável
          setViagens([]);
          return;
        }
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
    const newFilters: FiltrosViagemGlobus = { ...filtros, [key]: value, page: 1 };
    setFiltros(newFilters);
  };

  const clearFilters = () => {
    setFiltros(initialFilters);
  };

  const formatTime = (time: Date | string | undefined | null) => {
    if (!time) return '-';

    let dateObj: Date;
    if (time instanceof Date) {
      dateObj = time;
    } else { // Assume string
      // Try parsing as a full date string first
      dateObj = new Date(time);
      // If it's an invalid date, it might be just "HH:MM:SS"
      if (isNaN(dateObj.getTime())) {
        // Create a dummy date to parse the time part
        const [hours, minutes] = String(time).split(':').map(Number);
        if (!isNaN(hours) && !isNaN(minutes)) {
          dateObj = new Date(); // Use current date
          dateObj.setHours(hours, minutes, 0, 0);
        } else {
          return '-'; // Cannot parse time
        }
      }
    }
    return dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        onSync={handleSincronizar}
        onToggleFilters={() => setShowFilters(!showFilters)}
        filtersVisible={showFilters}
        synchronizing={sincronizando}
        onTestOracle={handleTestOracle}
        testingOracle={testingOracle}
        hasData={!!statusDados?.existeNoBanco}
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
        <FilterSection
          filters={filtros}
          onFilterChange={handleFilterChange}
          onClearFilters={clearFilters}
          setores={setores}
          linhas={linhas}
        />
      )}

      {loading && !statusDados ? (
        <div className="flex flex-col items-center justify-center py-32">
          <Loader2 className="h-12 w-12 animate-spin text-[#fbcc2c] dark:text-yellow-400 mb-4" />
          <span className="text-lg text-gray-600 dark:text-gray-300 font-medium">Verificando dados...</span>
        </div>
      ) : statusDados?.existeNoBanco ? (
        <Card className="border-none shadow-xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-md overflow-hidden">
          <CardContent className="p-0">
            <ViagensTable
              viagens={viagens}
              loading={loading}
              formatTime={formatTime}
            />
          </CardContent>
        </Card>
      ) : (
        <NoDataGlobus
          onSync={handleSincronizar}
          synchronizing={sincronizando}
          onTestOracle={handleTestOracle}
          testingOracle={testingOracle}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
};
