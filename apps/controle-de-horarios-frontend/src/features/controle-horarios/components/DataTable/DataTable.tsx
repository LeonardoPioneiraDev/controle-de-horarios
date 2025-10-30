// src/features/controle-horarios/components/DataTable/DataTable.tsx
import React, { useState } from 'react';
import { 
  Car, 
  User, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  RefreshCw, 
  ChevronDown, 
  ChevronRight,
  MapPin,
  Users,
  Calendar,
  Edit3,
  Save,
  X
} from 'lucide-react';
import { ControleHorarioItem, DadosEditaveis } from '../../types/controle-horarios.types';

interface DataTableProps {
  controleHorarios: ControleHorarioItem[];
  controleHorariosOriginais: ControleHorarioItem[];
  onInputChange: (viagemId: string, field: keyof DadosEditaveis, value: string) => void;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  statusDados: {
    existeViagensGlobus: boolean;
  };
  estatisticas: {
    totalViagens: number;
    viagensEditadas: number;
    viagensNaoEditadas: number;
    percentualEditado: number;
  };
  temAlteracoesPendentes: boolean;
  contarAlteracoesPendentes: () => number;
}

export const DataTable: React.FC<DataTableProps> = ({
  controleHorarios,
  controleHorariosOriginais,
  onInputChange,
  loading,
  error,
  onRetry,
  statusDados,
  estatisticas,
  temAlteracoesPendentes,
  contarAlteracoesPendentes
}) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [editingObservacoes, setEditingObservacoes] = useState<string | null>(null);

  const toggleRowExpansion = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const renderSetorBadge = (setor: string) => {
    const cores = {
      'GAMA': 'bg-red-100 text-red-700 border-red-200',
      'SANTA MARIA': 'bg-blue-100 text-blue-700 border-blue-200',
      'PARANOÁ': 'bg-green-100 text-green-700 border-green-200',
      'SÃO SEBASTIÃO': 'bg-purple-100 text-purple-700 border-purple-200',
      'SOBRADINHO': 'bg-orange-100 text-orange-700 border-orange-200',
      'PLANALTINA': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'BRAZLÂNDIA': 'bg-pink-100 text-pink-700 border-pink-200',
      'CEILÂNDIA': 'bg-indigo-100 text-indigo-700 border-indigo-200',
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
        cores[setor as keyof typeof cores] || 'bg-gray-100 text-gray-700 border-gray-200'
      }`}>
        {setor}
      </span>
    );
  };

  const renderSentidoBadge = (sentido: string) => {
    const config = {
      'IDA': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', icon: '→' },
      'VOLTA': { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200', icon: '←' },
      'CIRCULAR': { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200', icon: '↻' },
    };

    const style = config[sentido as keyof typeof config] || config['IDA'];

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${style.bg} ${style.text} ${style.border}`}>
        <span className="mr-1">{style.icon}</span>
        {sentido}
      </span>
    );
  };

  const formatTime = (timeString?: string): string => {
    if (!timeString) return 'N/A';
    
    // Se for formato Oracle "01/01/1900 HH:MM:SS"
    if (timeString.includes(' ')) {
      const timePart = timeString.split(' ')[1];
      return timePart ? timePart.substring(0, 5) : 'N/A';
    }
    
    // Se já for HH:MM:SS
    return timeString.substring(0, 5);
  };

  const isRowChanged = (item: ControleHorarioItem, index: number): boolean => {
    const original = controleHorariosOriginais[index];
    if (!original) return false;
    
    return (
      item.dadosEditaveis.numeroCarro !== original.dadosEditaveis.numeroCarro ||
      item.dadosEditaveis.informacaoRecolhe !== original.dadosEditaveis.informacaoRecolhe ||
      item.dadosEditaveis.crachaFuncionario !== original.dadosEditaveis.crachaFuncionario ||
      item.dadosEditaveis.observacoes !== original.dadosEditaveis.observacoes
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mr-3" />
        <div className="text-center">
          <p className="text-gray-600 font-medium">Carregando controle de horários...</p>
          <p className="text-sm text-gray-500 mt-1">Buscando dados das viagens</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto text-red-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Erro ao carregar dados</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={onRetry}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Tentar Novamente
        </button>
      </div>
    );
  }

  if (controleHorarios.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma viagem encontrada</h3>
        <p className="text-gray-600 mb-2">Não foram encontradas viagens para os filtros aplicados.</p>
        {!statusDados.existeViagensGlobus && (
          <p className="text-sm text-gray-500">
            Verifique se existem dados do Globus para esta data.
          </p>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-10 px-3 py-3 text-left">
                  <span className="sr-only">Expandir</span>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Linha / Serviço
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sentido / Horários
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Motorista
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <Car className="h-4 w-4 inline mr-1" />
                  Veículo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <User className="h-4 w-4 inline mr-1" />
                  Crachá
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {controleHorarios.map((item, index) => {
                const foiAlterado = isRowChanged(item, index);
                const isExpanded = expandedRows.has(item.viagemGlobus.id);

                return (
                  <React.Fragment key={item.viagemGlobus.id}>
                    {/* Linha Principal */}
                    <tr 
                      className={`transition-colors hover:bg-gray-50 ${
                        foiAlterado ? 'bg-yellow-50 border-l-4 border-l-yellow-400' : ''
                      }`}
                    >
                      {/* Botão de Expansão */}
                      <td className="px-3 py-4">
                        <button
                          onClick={() => toggleRowExpansion(item.viagemGlobus.id)}
                          className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-5 w-5" />
                          ) : (
                            <ChevronRight className="h-5 w-5" />
                          )}
                        </button>
                      </td>

                      {/* Linha / Serviço */}
                      <td className="px-6 py-4">
                        <div className="flex items-start space-x-3">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900">
                              {item.viagemGlobus.codigoLinha} - Serviço {item.viagemGlobus.codServicoNumero}
                            </div>
                            <div className="text-sm text-gray-500 truncate max-w-xs" title={item.viagemGlobus.nomeLinha}>
                              {item.viagemGlobus.nomeLinha}
                            </div>
                            <div className="mt-2">
                              {renderSetorBadge(item.viagemGlobus.setorPrincipal)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Sentido / Horários */}
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          {renderSentidoBadge(item.viagemGlobus.sentidoTexto)}
                          <div className="flex items-center text-sm text-gray-600">
                            <Clock className="h-4 w-4 mr-1 text-gray-400" />
                            <span className="font-mono">
                              {formatTime(item.viagemGlobus.horSaidaTime)} → {formatTime(item.viagemGlobus.horChegadaTime)}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {item.viagemGlobus.duracaoMinutos}min • {item.viagemGlobus.periodoDoDia}
                          </div>
                        </div>
                      </td>

                      {/* Motorista */}
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {item.viagemGlobus.nomeMotorista || 'Não informado'}
                            </div>
                            {item.viagemGlobus.codMotorista && (
                              <div className="text-xs text-gray-500">
                                Cód: {item.viagemGlobus.codMotorista}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Veículo (Editável) */}
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={item.dadosEditaveis.numeroCarro || ''}
                          onChange={(e) => onInputChange(item.viagemGlobus.id, 'numeroCarro', e.target.value)}
                          placeholder="Número do veículo"
                          className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                            controleHorariosOriginais[index] && 
                            item.dadosEditaveis.numeroCarro !== controleHorariosOriginais[index].dadosEditaveis.numeroCarro
                              ? 'border-yellow-400 bg-yellow-50'
                              : 'border-gray-300'
                          }`}
                        />
                      </td>

                      {/* Crachá (Editável) */}
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={item.dadosEditaveis.crachaFuncionario || ''}
                          onChange={(e) => onInputChange(item.viagemGlobus.id, 'crachaFuncionario', e.target.value)}
                          placeholder="Crachá funcionário"
                          className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                            controleHorariosOriginais[index] && 
                            item.dadosEditaveis.crachaFuncionario !== controleHorariosOriginais[index].dadosEditaveis.crachaFuncionario
                              ? 'border-yellow-400 bg-yellow-50'
                              : 'border-gray-300'
                          }`}
                        />
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {foiAlterado ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 border border-yellow-200">
                              <Edit3 className="h-3 w-3" />
                              Alterado
                            </span>
                          ) : item.dadosEditaveis.jaFoiEditado ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                              <CheckCircle className="h-3 w-3" />
                              Salvo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">
                              <AlertCircle className="h-3 w-3" />
                              Pendente
                            </span>
                          )}
                          
                          {item.dadosEditaveis.usuarioEdicao && (
                            <div className="text-xs text-gray-500">
                              por {item.dadosEditaveis.usuarioEdicao}
                            </div>
                          )}
                          
                          {item.dadosEditaveis.updatedAt && (
                            <div className="text-xs text-gray-400">
                              {new Date(item.dadosEditaveis.updatedAt).toLocaleString('pt-BR')}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Linha Expandida */}
                    {isExpanded && (
                      <tr className="bg-gray-50">
                        <td colSpan={7} className="px-6 py-6">
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Informações da Viagem */}
                            <div className="space-y-4">
                              <h4 className="text-sm font-semibold text-gray-900 flex items-center">
                                <MapPin className="h-4 w-4 mr-2 text-blue-500" />
                                Informações da Viagem
                              </h4>
                              <div className="bg-white rounded-lg p-4 border border-gray-200 space-y-3">
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                  <div>
                                    <span className="text-gray-500">Origem:</span>
                                    <div className="font-medium text-gray-900">
                                      {item.viagemGlobus.localOrigemViagem || 'N/A'}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Destino:</span>
                                    <div className="font-medium text-gray-900">
                                      {item.viagemGlobus.localDestinoViagem || 'N/A'}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Terminal:</span>
                                    <div className="font-medium text-gray-900">
                                      {item.viagemGlobus.codLocalTerminalSec || 'N/A'}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Localidade:</span>
                                    <div className="font-medium text-gray-900">
                                      {item.viagemGlobus.codLocalidade || 'N/A'}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Serviço Completo:</span>
                                    <div className="font-medium text-gray-900">
                                      {item.viagemGlobus.codServicoCompleto || 'N/A'}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Total Horários:</span>
                                    <div className="font-medium text-gray-900">
                                      {item.viagemGlobus.totalHorarios || 'N/A'}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Informações do Cobrador */}
                            <div className="space-y-4">
                              <h4 className="text-sm font-semibold text-gray-900 flex items-center">
                                <Users className="h-4 w-4 mr-2 text-green-500" />
                                Cobrador
                              </h4>
                              <div className="bg-white rounded-lg p-4 border border-gray-200 space-y-3">
                                <div className="text-sm">
                                  <span className="text-gray-500">Nome:</span>
                                  <div className="font-medium text-gray-900">
                                    {item.viagemGlobus.nomeCobrador || 'Não informado'}
                                  </div>
                                </div>
                                <div className="text-sm">
                                  <span className="text-gray-500">Código:</span>
                                  <div className="font-medium text-gray-900">
                                    {item.viagemGlobus.codCobrador || 'N/A'}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Campos Editáveis */}
                            <div className="space-y-4">
                              <h4 className="text-sm font-semibold text-gray-900 flex items-center">
                                <Edit3 className="h-4 w-4 mr-2 text-orange-500" />
                                Informações Editáveis
                              </h4>
                              <div className="bg-white rounded-lg p-4 border border-gray-200 space-y-4">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-2">
                                    Informação de Recolhe
                                  </label>
                                  <input
                                    type="text"
                                    value={item.dadosEditaveis.informacaoRecolhe || ''}
                                    onChange={(e) => onInputChange(item.viagemGlobus.id, 'informacaoRecolhe', e.target.value)}
                                    placeholder="Informações sobre recolhimento"
                                    className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                                      controleHorariosOriginais[index] && 
                                      item.dadosEditaveis.informacaoRecolhe !== controleHorariosOriginais[index].dadosEditaveis.informacaoRecolhe
                                        ? 'border-yellow-400 bg-yellow-50'
                                        : 'border-gray-300'
                                    }`}
                                  />
                                </div>
                                
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-2">
                                    Observações
                                  </label>
                                  <div className="relative">
                                    {editingObservacoes === item.viagemGlobus.id ? (
                                      <div className="space-y-2">
                                        <textarea
                                          value={item.dadosEditaveis.observacoes || ''}
                                          onChange={(e) => onInputChange(item.viagemGlobus.id, 'observacoes', e.target.value)}
                                          placeholder="Observações gerais"
                                          rows={4}
                                          className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                                            controleHorariosOriginais[index] && 
                                            item.dadosEditaveis.observacoes !== controleHorariosOriginais[index].dadosEditaveis.observacoes
                                              ? 'border-yellow-400 bg-yellow-50'
                                              : 'border-gray-300'
                                          }`}
                                        />
                                        <div className="flex justify-end space-x-2">
                                          <button
                                            onClick={() => setEditingObservacoes(null)}
                                            className="inline-flex items-center px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                          >
                                            <X className="h-3 w-3 mr-1" />
                                            Cancelar
                                          </button>
                                          <button
                                            onClick={() => setEditingObservacoes(null)}
                                            className="inline-flex items-center px-3 py-1 text-xs font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                                          >
                                            <Save className="h-3 w-3 mr-1" />
                                            Salvar
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div
                                        onClick={() => setEditingObservacoes(item.viagemGlobus.id)}
                                        className={`min-h-[80px] w-full px-3 py-2 text-sm border rounded-md cursor-text transition-colors ${
                                          controleHorariosOriginais[index] && 
                                          item.dadosEditaveis.observacoes !== controleHorariosOriginais[index].dadosEditaveis.observacoes
                                            ? 'border-yellow-400 bg-yellow-50'
                                            : 'border-gray-300 hover:border-gray-400'
                                        }`}
                                      >
                                        {item.dadosEditaveis.observacoes || (
                                          <span className="text-gray-400">Clique para adicionar observações...</span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Informações de Auditoria */}
                          {(item.dadosEditaveis.usuarioEdicao || item.dadosEditaveis.updatedAt || item.dadosEditaveis.createdAt) && (
                            <div className="mt-6 pt-4 border-t border-gray-200">
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <div className="flex items-center space-x-4">
                                  {item.dadosEditaveis.usuarioEdicao && (
                                    <div className="flex items-center">
                                      <User className="h-3 w-3 mr-1" />
                                      <span>Editado por: <strong>{item.dadosEditaveis.usuarioEdicao}</strong></span>
                                      {item.dadosEditaveis.usuarioEmail && (
                                        <span className="ml-1 text-gray-400">({item.dadosEditaveis.usuarioEmail})</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center space-x-4">
                                  {item.dadosEditaveis.createdAt && (
                                    <div className="flex items-center">
                                      <Calendar className="h-3 w-3 mr-1" />
                                      <span>Criado: {new Date(item.dadosEditaveis.createdAt).toLocaleString('pt-BR')}</span>
                                    </div>
                                  )}
                                  {item.dadosEditaveis.updatedAt && (
                                    <div className="flex items-center">
                                      <Clock className="h-3 w-3 mr-1" />
                                      <span>Atualizado: {new Date(item.dadosEditaveis.updatedAt).toLocaleString('pt-BR')}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer da tabela com estatísticas */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                Total: <strong className="ml-1">{estatisticas.totalViagens}</strong> viagens
              </span>
              <span className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                Editadas: <strong className="ml-1">{estatisticas.viagensEditadas}</strong>
              </span>
              <span className="flex items-center">
                <AlertCircle className="h-4 w-4 mr-1 text-gray-400" />
                Pendentes: <strong className="ml-1">{estatisticas.viagensNaoEditadas}</strong>
              </span>
            </div>
            
            <div className="flex items-center space-x-4 text-sm">
              <span className="text-gray-600">
                Progresso: <strong>{estatisticas.percentualEditado.toFixed(1)}%</strong>
              </span>
              {temAlteracoesPendentes && (
                <span className="flex items-center text-yellow-600 font-medium">
                  <Edit3 className="h-4 w-4 mr-1" />
                  Alterações não salvas: <strong className="ml-1">{contarAlteracoesPendentes()}</strong>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};