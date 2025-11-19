// src/pages/ViagensGlobus.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { viagensGlobusService } from '../services/viagens-globus/viagens-globus.service';
import { ViagemGlobus, FiltrosViagemGlobus, StatusDadosGlobus } from '../types/viagens-globus.types';
import { ControleHorarioItem, ControleHorario } from '../types/controle-horarios.types';
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
import { ConfirmDialog } from '../components/ui/confirm-dialog';
import { useAuth } from '../contexts/AuthContext';
import { UserRole, isAtLeast } from '../types/user.types';

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
        <h1 className="text-3xl font-bold text-gray-100">Viagens Globus</h1>
        <p className="mt-1 text-md text-gray-400">
          Consulte e gerencie as viagens do sistema Oracle Globus.
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
        {isAdmin && (
          <Button
            onClick={onTestOracle}
            disabled={testingOracle}
            variant="outline"
            className="w-full sm:w-auto border-orange-500/50 text-orange-400 hover:bg-orange-500/10 hover:text-orange-300"
          >
            <Server className={`h-4 w-4 mr-2 ${testingOracle ? 'animate-pulse' : ''}`} />
            {testingOracle ? 'Testando...' : 'Testar Oracle'}
          </Button>
        )}
        {isAdmin && (
          <Button onClick={handleSyncClick} disabled={synchronizing} className="w-full sm:w-auto">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 custom-md:grid-cols-3 lg:grid-cols-4 gap-4">
       
         
        <div>
          <Label htmlFor="sentido">Sentido</Label>
          <select
            id="sentido"
            value={filters.sentido || ''}
            onChange={(e) => onFilterChange('sentido', e.target.value || undefined)}
            className="w-full mt-1 flex h-10 rounded-md border border-yellow-400/20 bg-neutral-900 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Todos</option>
            <option value="I">Ida</option>
            <option value="V">Volta</option>
            <option value="C">Circular</option>
          </select>
        </div>
        <div>
          <Label htmlFor="nomeMotorista">Nome do Motorista</Label>
          <Input
            id="nomeMotorista"
            type="text"
            value={filters.nomeMotorista || ''}
            onChange={(e) => onFilterChange('nomeMotorista', e.target.value || undefined)}
          />
        </div>
        
       
        <div>
          <Label htmlFor="codServicoNumero">Serviço</Label>
          <Input
            id="codServicoNumero"
            type="text"
            value={filters.codServicoNumero || ''}
            onChange={(e) => onFilterChange('codServicoNumero', e.target.value || undefined)}
          />
        </div>
        <div>
          <Label htmlFor="nomeCobrador">Nome do Cobrador</Label>
          <Input
            id="nomeCobrador"
            type="text"
            value={filters.nomeCobrador || ''}
            onChange={(e) => onFilterChange('nomeCobrador', e.target.value || undefined)}
          />
        </div>
       
        <div>
          <Label htmlFor="buscaTexto">Buscar</Label>
          <Input
            id="buscaTexto"
            type="text"
            placeholder="Linha, motorista, cobrador, serviço..."
            value={filters.buscaTexto || ''}
            onChange={(e) => onFilterChange('buscaTexto', e.target.value || undefined)}
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
    const getSentidoColor = (sentido: string | undefined) => {
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

    const getPeriodoColor = (periodo: string | undefined) => {
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
                    {['Setor', 'Linha', 'Serviço', 'Sentido', 'Horário Saída', 'Horário Chegada', 'Motorista', 'Cobrador', 'Carro', 'Local Origem', 'Local Destino', 'Tipo Dia', 'Período'].map(header => (
                    <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        {header}
                    </th>
                    ))}
                </tr>
                </thead>
                <tbody className="divide-y divide-yellow-400/20">
                {viagens.map((viagem: ControleHorarioItem, index: number) => (
                    <tr key={viagem.viagemGlobusId || index} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getSetorColor(viagem.setor_principal_linha)}`}>
                                {viagem.setor_principal_linha}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-200">
                            <div className="font-medium">{viagem.codigoLinha}</div>
                            <div className="text-xs text-gray-400">{viagem.nomeLinha}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-200">{viagem.codServicoNumero ?? viagem.cod_servico_numero ?? '-'}</td>
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
                                    {viagem.crachaMotoristaGlobus && (
                                    <div className="flex items-center text-xs text-gray-500 mt-1">
                                        <span>Crachá: {viagem.crachaMotoristaGlobus}</span>
                                    </div>
                                    )}
                                </>
                                ) : (
                                <span className="text-gray-500">-</span>
                                )}
                            </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">
                            <div>
                                {viagem.nome_cobrador ? (
                                <>
                                    <div className="flex items-center">
                                        <UsersIcon className="h-4 w-4 mr-1.5 text-gray-500" />
                                        <span className="font-medium">{viagem.nome_cobrador}</span>
                                    </div>
                                    {viagem.crachaCobradorGlobus && (
                                    <div className="flex items-center text-xs text-gray-500 mt-1">
                                        <span>Crachá: {viagem.crachaCobradorGlobus}</span>
                                    </div>
                                    )}
                                </>
                                ) : (
                                <span className="text-gray-500">-</span>
                                )}
                            </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">{viagem.numeroCarro || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-300">
                            <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-1.5 text-gray-500" />
                                <span className="max-w-xs truncate" title={viagem.local_origem_viagem}>
                                {viagem.local_origem_viagem || '-'}
                                </span>
                            </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">
                            <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-1.5 text-gray-500" />
                                <span className="max-w-xs truncate" title={viagem.localDestinoLinha}>
                                {viagem.localDestinoLinha || '-'}
                                </span>
                            </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-200">{viagem.descTipoDia || '-'}</td>
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
            {viagens.map((viagem: ControleHorarioItem, index: number) => (
                <div key={viagem.viagemGlobusId || index} className="bg-neutral-800/50 p-4 rounded-lg border border-yellow-400/20">
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

const NoData = ({ onSync, synchronizing, onTestOracle, testingOracle, isAdmin }: any) => (
  <GlowingCard className="text-center">
    <CardContent className="p-8">
        <Calendar className="mx-auto h-12 w-12 text-gray-500" />
        <h3 className="mt-4 text-xl font-semibold text-gray-200">
        Dados não disponíveis para esta data
        </h3>
        <p className="mt-2 text-md text-gray-400">
        Clique no botão abaixo para buscar os dados do Oracle Globus.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4">
            {isAdmin && (
              <Button
                  onClick={onTestOracle}
                  disabled={testingOracle}
                  variant="outline"
                  className="w-full sm:w-auto border-orange-500/50 text-orange-400 hover:bg-orange-500/10 hover:text-orange-300"
              >
                  <Server className={`h-4 w-4 mr-2 ${testingOracle ? 'animate-pulse' : ''}`} />
                  {testingOracle ? 'Testando...' : 'Testar Oracle'}
              </Button>
            )}
            <Button
                onClick={onSync}
                disabled={synchronizing}
                size="lg"
                className="w-full sm:w-auto"
            >
                <RefreshCw className={`h-5 w-5 mr-2 ${synchronizing ? 'animate-spin' : ''}`} />
                {synchronizing ? 'Sincronizando...' : 'Sincronizar Dados'}
            </Button>
        </div>
    </CardContent>
  </GlowingCard>
);

// Mensagem clara quando não há dados para a data selecionada
const NoDataGlobus = ({ onSync, synchronizing, onTestOracle, testingOracle, isAdmin }: any) => (
  <GlowingCard className="text-center">
    <CardContent className="p-8">
      <Calendar className="mx-auto h-12 w-12 text-gray-500" />
      <h3 className="mt-4 text-xl font-semibold text-gray-200">Não há dados para esta data</h3>
      <p className="mt-2 text-md text-gray-400">Faça a sincronização para carregar os dados deste dia.</p>
      <div className="mt-6 flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4">
        {isAdmin && (
          <Button
            onClick={onTestOracle}
            disabled={testingOracle}
            variant="outline"
            className="w-full sm:w-auto border-orange-500/50 text-orange-400 hover:bg-orange-500/10 hover:text-orange-300"
          >
            <Server className={`h-4 w-4 mr-2 ${testingOracle ? 'animate-pulse' : ''}`} />
            {testingOracle ? 'Testando...' : 'Testar Oracle'}
          </Button>
        )}
        {isAdmin && (
          <Button onClick={onSync} disabled={synchronizing} size="lg" className="w-full sm:w-auto">
            <RefreshCw className={`h-5 w-5 mr-2 ${synchronizing ? 'animate-spin' : ''}`} />
            {synchronizing ? 'Sincronizando...' : 'Sincronizar Dados'}
          </Button>
        )}
      </div>
    </CardContent>
  </GlowingCard>
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
        console.log('loadInitialData: Current filters before service call:', filtros);
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
          console.warn('Falha ao buscar viagens Globus:', (e as any)?.message || e);
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
    console.log('handleFilterChange: New filters after update:', newFilters);
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
    <div className="min-h-screen w-full bg-gradient-to-br from-black via-neutral-900 to-yellow-950 text-gray-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
            <PageHeader
                onSync={handleSincronizar}
                onToggleFilters={() => setShowFilters(!showFilters)}
                filtersVisible={showFilters}
                synchronizing={sincronizando}
                onTestOracle={handleTestOracle}
                testingOracle={testingOracle}
                hasData={(statusDados?.totalRegistros || 0) > 0}
                isAdmin={isAdmin}
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
            ) : (statusDados?.existeNoBanco && (statusDados?.totalRegistros || 0) > 0) ? (
                <GlowingCard>
                    <CardContent className="p-4 md:p-0 md:overflow-hidden">
                        <ViagensTable
                            viagens={viagens}
                            loading={loading}
                            formatTime={formatTime}
                        />
                        <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-4 border-t border-yellow-400/20">
                          <div className="text-sm text-gray-400">
                            Total: <span className="text-gray-200 font-semibold">{pagination.total}</span>
                            <span className="mx-2">|</span>
                            Página <span className="text-gray-200 font-semibold">{pagination.page}</span> de <span className="text-gray-200 font-semibold">{pagination.totalPages}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              disabled={(filtros.page || 1) <= 1}
                              onClick={() => setFiltros({ ...filtros, page: Math.max(1, (filtros.page || 1) - 1) })}
                            >
                              Anterior
                            </Button>
                            <Button
                              variant="outline"
                              disabled={(filtros.page || 1) >= pagination.totalPages}
                              onClick={() => setFiltros({ ...filtros, page: Math.min(pagination.totalPages, (filtros.page || 1) + 1) })}
                            >
                              Próxima
                            </Button>
                          </div>
                        </div>
                    </CardContent>
                </GlowingCard>
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
    </div>
  );
};
