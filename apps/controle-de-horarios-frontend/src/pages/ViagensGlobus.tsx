// src/pages/ViagensGlobus.tsx

import { useState, useEffect, useCallback } from 'react';
import { viagensGlobusService } from '../services/viagens-globus/viagens-globus.service';
import { controleHorariosService } from '../services/controleHorariosService';
import { ViagemGlobus, FiltrosViagemGlobus, StatusDadosGlobus } from '../types/viagens-globus.types';
import { ControleHorario, ControleHorarioItem, UpdateControleHorarioDto } from '../types/controle-horarios.types';
import { toast } from 'react-toastify';
import { EditDriverCobradorModal } from '../features/controle-horarios/components/EditDriverCobradorModal';
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
  Server,
  User,
  Users as UsersIcon,
  Pencil,
} from 'lucide-react';

// Reusable components
const PageHeader = ({ onSync, onToggleFilters, filtersVisible, synchronizing, onTestOracle, testingOracle }: any) => (
  <div className="flex justify-between items-center">
    <div>
      <h1 className="text-3xl font-bold text-gray-800">Viagens Globus</h1>
      <p className="mt-1 text-md text-gray-500">
        Consulte e gerencie as viagens do sistema Oracle Globus.
      </p>
    </div>
    <div className="flex space-x-3">
      <button
        onClick={onToggleFilters}
        className={`px-4 py-2 rounded-lg border flex items-center transition-all duration-300 ${
          filtersVisible
            ? 'bg-blue-50 border-blue-200 text-blue-700'
            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
      >
        <Filter className="h-4 w-4 mr-2" />
        Filtros
        <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${filtersVisible ? 'rotate-180' : ''}`} />
      </button>
      <button
        onClick={onTestOracle}
        disabled={testingOracle}
        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center transition-colors"
      >
        <Server className={`h-4 w-4 mr-2 ${testingOracle ? 'animate-pulse' : ''}`} />
        {testingOracle ? 'Testando...' : 'Testar Oracle'}
      </button>
      <button
        onClick={onSync}
        disabled={synchronizing}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center transition-colors"
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${synchronizing ? 'animate-spin' : ''}`} />
        {synchronizing ? 'Sincronizando...' : 'Sincronizar'}
      </button>
    </div>
  </div>
);

const DateAndStatus = ({ date, onDateChange, status }: any) => (
  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
      <div className="flex items-center space-x-4">
        <label htmlFor="date-picker" className="text-sm font-medium text-gray-700">
          Data de Referência:
        </label>
        <input
          id="date-picker"
          type="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      {status && (
        <div className="flex items-center space-x-6 mt-4 md:mt-0 text-sm">
          <div>
            <span className="text-gray-500">Status: </span>
            <span className={`font-semibold ${status.existeNoBanco ? 'text-green-600' : 'text-red-600'}`}>
              {status.existeNoBanco ? 'Dados Disponíveis' : 'Sem Dados'}
            </span>
          </div>
          {status.totalRegistros > 0 && (
            <div>
              <span className="text-gray-500">Total: </span>
              <span className="font-semibold text-gray-800">
                {status.totalRegistros.toLocaleString()} viagens
              </span>
            </div>
          )}
          {status.ultimaAtualizacao && (
            <div>
              <span className="text-gray-500">Última Atualização: </span>
              <span className="font-semibold text-gray-800">
                {new Date(status.ultimaAtualizacao).toLocaleString('pt-BR')}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  </div>
);

const FilterSection = ({ filters, onFilterChange, onClearFilters, setores, linhas }: any) => (
  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Setor</label>
        <select
          value={filters.setor_principal_linha || ''}
          onChange={(e) => onFilterChange('setor_principal_linha', e.target.value || undefined)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos os setores</option>
          {setores && setores.map((setor: string) => <option key={setor} value={setor}>{setor}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Linha</label>
        <select
          value={filters.codigo_linha || ''}
          onChange={(e) => onFilterChange('codigoLinha', e.target.value || undefined)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todas as linhas</option>
          {linhas && linhas.map((linha: string) => <option key={linha} value={linha}>{linha}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Sentido</label>
        <select
          value={filters.sentido || ''}
          onChange={(e) => onFilterChange('sentido', e.target.value || undefined)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos</option>
          <option value="IDA">Ida</option>
          <option value="VOLTA">Volta</option>
          <option value="CIRCULAR">Circular</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Motorista</label>
        <input
          type="text"
          value={filters.nomeMotorista || ''}
          onChange={(e) => onFilterChange('nomeMotorista', e.target.value || undefined)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Buscar por nome..."
        />
      </div>
    </div>
    <div className="mt-4 flex justify-end">
      <button
        onClick={onClearFilters}
        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
      >
        Limpar Filtros
      </button>
    </div>
  </div>
);

const ViagensTable = ({ viagens, loading, onEdit, formatTime }: { viagens: ControleHorarioItem[]; loading: boolean; onEdit: (viagem: ControleHorarioItem, field: 'motorista' | 'cobrador') => void; formatTime: (time: Date | string) => string }) => {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-3 text-gray-600">Carregando viagens...</span>
      </div>
    );
  }

  if (viagens.length === 0) {
    return (
      <div className="text-center py-20 bg-gray-50 rounded-lg">
        <Bus className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">Nenhuma viagem encontrada</h3>
        <p className="mt-1 text-sm text-gray-500">
          Tente ajustar os filtros ou sincronizar os dados para a data selecionada.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {['Setor', 'Linha', 'Sentido', 'Horário Saída', 'Horário Chegada', 'Motorista', 'Local Origem', 'Período', 'Ações'].map(header => (
              <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {viagens.map((viagem: ControleHorarioItem) => (
            <tr key={viagem.viagemGlobusId} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getSetorColor(viagem.setor_principal_linha)}`}>
                        {viagem.setor_principal_linha}
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
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getSentidoColor(viagem.sentido_texto)}`}>
                        {viagem.sentido_texto}
                    </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1 text-gray-400" />
                        {formatTime(viagem.horaSaida)}
                    </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1 text-gray-400" />
                        {formatTime(viagem.horaChegada)}
                    </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                    <div>
                        {viagem.nome_motorista ? (
                        <>
                            <div className="flex items-center">
                                <User className="h-4 w-4 mr-1 text-gray-400" />
                                <span className="font-medium">{viagem.nome_motorista}</span>
                            </div>
                            {viagem.nome_cobrador && (
                            <div className="flex items-center text-xs text-gray-400 mt-1">
                                <UsersIcon className="h-3 w-3 mr-1" />
                                <span>Cobrador: {viagem.nome_cobrador}</span>
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
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => onEdit(viagem, 'motorista')}
                      className="text-indigo-600 hover:text-indigo-900 inline-flex items-center"
                      title="Editar Motorista"
                    >
                      <User className="h-4 w-4 mr-1" />
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => onEdit(viagem, 'cobrador')}
                      className="text-green-600 hover:text-green-900 inline-flex items-center"
                      title="Editar Cobrador"
                    >
                      <UsersIcon className="h-4 w-4 mr-1" />
                      <Pencil className="h-3 w-3" />
                    </button>
                  </div>
                </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const NoData = ({ onSync, synchronizing, onTestOracle, testingOracle }: any) => (
  <div className="text-center py-20 bg-white rounded-lg shadow-sm border border-gray-200">
    <Calendar className="mx-auto h-12 w-12 text-gray-400" />
    <h3 className="mt-4 text-xl font-semibold text-gray-800">
      Dados não disponíveis para esta data
    </h3>
    <p className="mt-2 text-md text-gray-500">
      Clique no botão abaixo para buscar os dados do Oracle Globus.
    </p>
    <div className="mt-6 flex justify-center space-x-4">
      <button
        onClick={onTestOracle}
        disabled={testingOracle}
        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center transition-colors"
      >
        <Server className={`h-4 w-4 mr-2 ${testingOracle ? 'animate-pulse' : ''}`} />
        {testingOracle ? 'Testando...' : 'Testar Oracle'}
      </button>
      <button
        onClick={onSync}
        disabled={synchronizing}
        className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center mx-auto transition-all"
      >
        <RefreshCw className={`h-5 w-5 mr-2 ${synchronizing ? 'animate-spin' : ''}`} />
        {synchronizing ? 'Sincronizando...' : 'Sincronizar Dados'}
      </button>
    </div>
  </div>
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

  // State for editing
  const [isEditing, setIsEditing] = useState(false);
  const [editedViagem, setEditedViagem] = useState<ControleHorarioItem | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editingField, setEditingField] = useState<'motorista' | 'cobrador'>('motorista');

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

        // Se há dados no Globus mas nenhum controle local, sincroniza automaticamente e busca novamente
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
      await loadInitialData();
    } catch (err: any) {
      setError(err.message || 'Erro na sincronização.');
    } finally {
      setSincronizando(false);
    }
  };

  const handleTestOracle = async () => {
    setTestingOracle(true);
    setError('');
    setOracleStatus(null);
    try {
      const result = await viagensGlobusService.testarConexaoOracle();
      setOracleStatus(result);
      if (result.success) {
        setSuccess('Conexão com Oracle bem-sucedida!');
      } else {
        setError(result.message || 'Falha ao testar conexão com Oracle.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao testar conexão com Oracle.');
    } finally {
      setTestingOracle(false);
    }
  };

  const handleFilterChange = (key: keyof FiltrosViagemGlobus, value: any) => {
    setFiltros(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const clearFilters = () => {
    setFiltros(initialFilters);
  };

  const handleEdit = (viagem: ControleHorarioItem, field: 'motorista' | 'cobrador') => {
    setEditedViagem(viagem);
    setEditingField(field);
    setIsEditing(true);
  };

  const handleCloseEditModal = () => {
    setIsEditing(false);
    setEditedViagem(null);
    setError('');
  };

  const handleSaveEdit = async (
    viagemId: string,
    nome: string,
    cracha: string,
    observacoes: string,
    field: 'motorista' | 'cobrador'
  ) => {
    try {
      const viagemToUpdate = viagens.find(v => v.viagemGlobusId === viagemId);
      if (!viagemToUpdate) {
        toast.error('Viagem não encontrada.');
        return;
      }

      const updatedData: UpdateControleHorarioDto = {
        viagemGlobusId: viagemId,
        observacoes_edicao: observacoes,
      };

      if (field === 'motorista') {
        updatedData.motorista_substituto_nome = nome;
        updatedData.motorista_substituto_cracha = cracha;
      } else {
        updatedData.cobrador_substituto_nome = nome;
        updatedData.cobrador_substituto_cracha = cracha;
      }

      await controleHorariosService.salvarControleHorario(selectedDate, updatedData);
      // Atualiza o estado local das viagens para refletir a mudança
      setViagens(prev => prev.map(item => {
        if (item.viagemGlobusId === viagemId) {
          return {
            ...item,
            ...(field === 'motorista' && { nomeMotoristaEditado: nome, crachaMotoristaEditado: cracha }),
            ...(field === 'cobrador' && { nomeCobradorEditado: nome, crachaCobradorEditado: cracha }),
            observacoes_edicao: observacoes,
            jaFoiEditado: true, // Marca como editado
            usuarioEdicao: 'Usuário Atual', // TODO: Obter do contexto de autenticação
            usuarioEmail: 'email@exemplo.com', // TODO: Obter do contexto de autenticação
            updated_at: new Date(),
          };
        }
        return item;
      }));
      toast.success('Controle de horário atualizado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao atualizar controle de horário:', error);
      toast.error(error.response?.data?.message || 'Erro ao atualizar controle de horário.');
    } finally {
      setIsEditing(false);
      setEditedViagem(null);
    }
  };

  const handleFilterByCracha = (filters: any) => {
    setFiltros(prev => ({ ...prev, ...filters }));
  };

  const formatTime = (time: Date | string) => {
    if (!time) return '-';
    if (time instanceof Date) {
      return time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
    return time.substring(0, 5);
  };

  return (
    <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <PageHeader
        onSync={handleSincronizar}
        onToggleFilters={() => setShowFilters(!showFilters)}
        filtersVisible={showFilters}
        synchronizing={sincronizando}
        onTestOracle={handleTestOracle}
        testingOracle={testingOracle}
      />

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <XCircle className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-green-800">{success}</span>
          </div>
        </div>
      )}

      {/* Date and Status */}
      <DateAndStatus
        date={selectedDate}
        onDateChange={setSelectedDate}
        status={statusDados}
      />

      {/* Filters */}
      {showFilters && (
        <FilterSection
          filters={filtros}
          onFilterChange={handleFilterChange}
          onClearFilters={clearFilters}
          setores={setores}
          linhas={linhas}
        />
      )}

      {/* Content */}
      {statusDados?.existeNoBanco ? (
        <ViagensTable
          viagens={viagens}
          loading={loading}
          onEdit={handleEdit}
          formatTime={formatTime}
        />
      ) : (
        <NoData
          onSync={handleSincronizar}
          synchronizing={sincronizando}
          onTestOracle={handleTestOracle}
          testingOracle={testingOracle}
        />
      )}

      {/* Edit Modal */}
      {isEditing && editedViagem && (
        <EditDriverCobradorModal
          isOpen={isEditing}
          onClose={handleCloseEditModal}
          viagem={editedViagem}
          field={editingField}
          onSave={handleSaveEdit}
          onFilterByCracha={handleFilterByCracha}
        />
      )}
    </div>
  );
};
