import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Filter, Save, RefreshCw, Car, User, FileText, AlertCircle, CheckCircle, Clock, Search, X } from 'lucide-react';
import { makeAuthenticatedRequest } from '../services/api';

// ===============================================
// 🎯 INTERFACES
// ===============================================

interface ViagemGlobus {
  id: string;
  codigoLinha: string;
  nomeLinha: string;
  codServicoNumero: string;
  sentidoTexto: string;
  horSaidaTime: string;
  horChegadaTime: string;
  nomeMotorista: string;
  setorPrincipal: string;
  localOrigemViagem: string;
  duracaoMinutos: number;
  periodoDoDia: string;
  flgSentido: string;
}

interface DadosEditaveis {
  id?: string;
  numeroCarro?: string;
  informacaoRecolhe?: string;
  crachaFuncionario?: string;
  observacoes?: string;
  usuarioEdicao?: string;
  usuarioEmail?: string;
  updatedAt?: Date;
  jaFoiEditado: boolean;
}

interface ControleHorarioItem {
  viagemGlobus: ViagemGlobus;
  dadosEditaveis: DadosEditaveis;
}

interface Filtros {
  setorPrincipal: string;
  codigoLinha: string;
  codServicoNumero: string;
  sentidoTexto: string;
  horarioInicio: string;
  horarioFim: string;
  nomeMotorista: string;
  buscaTexto: string;
  limite: number;
}

interface OpcoesControleHorarios {
  setores: string[];
  linhas: { codigo: string; nome: string }[];
  servicos: string[];
  sentidos: string[];
  motoristas: string[];
}

interface Estatisticas {
  totalViagens: number;
  viagensEditadas: number;
  viagensNaoEditadas: number;
  percentualEditado: number;
  setoresUnicos: string[];
  linhasUnicas: string[];
  servicosUnicos: string[];
}

// ===============================================
// 🎨 COMPONENTE PRINCIPAL
// ===============================================

export const ControleHorarios: React.FC = () => {
  // Estados principais
  const [dataReferencia, setDataReferencia] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const [controleHorarios, setControleHorarios] = useState<ControleHorarioItem[]>([]);
  const [controleHorariosOriginais, setControleHorariosOriginais] = useState<ControleHorarioItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [saving, setSaving] = useState(false);
  const [temAlteracoesPendentes, setTemAlteracoesPendentes] = useState(false);
  
  // Estados de filtros
  const [filtros, setFiltros] = useState<Filtros>({
    setorPrincipal: '',
    codigoLinha: '',
    codServicoNumero: '',
    sentidoTexto: '',
    horarioInicio: '',
    horarioFim: '',
    nomeMotorista: '',
    buscaTexto: '',
    limite: 50,
  });

  const [opcoesFiltros, setOpcoesFiltros] = useState<OpcoesControleHorarios>({
    setores: [],
    linhas: [],
    servicos: [],
    sentidos: [],
    motoristas: [],
  });

  const [estatisticas, setEstatisticas] = useState<Estatisticas>({
    totalViagens: 0,
    viagensEditadas: 0,
    viagensNaoEditadas: 0,
    percentualEditado: 0,
    setoresUnicos: [],
    linhasUnicas: [],
    servicosUnicos: [],
  });

  const [statusDados, setStatusDados] = useState({
    existeViagensGlobus: false,
    totalViagensGlobus: 0,
    viagensEditadas: 0,
    percentualEditado: 0,
    ultimaAtualizacao: null as Date | null,
  });

  // ===============================================
  // 🔄 EFEITOS E CARREGAMENTO DE DADOS
  // ===============================================

  useEffect(() => {
    if (dataReferencia) {
      verificarStatusDados();
      buscarOpcoesFiltros();
      buscarControleHorarios();
    }
  }, [dataReferencia]);

  // Verificar alterações pendentes
  useEffect(() => {
    const temAlteracoes = controleHorarios.some((item, index) => {
      const original = controleHorariosOriginais[index];
      if (!original) return false;
      
      return (
        item.dadosEditaveis.numeroCarro !== original.dadosEditaveis.numeroCarro ||
        item.dadosEditaveis.informacaoRecolhe !== original.dadosEditaveis.informacaoRecolhe ||
        item.dadosEditaveis.crachaFuncionario !== original.dadosEditaveis.crachaFuncionario ||
        item.dadosEditaveis.observacoes !== original.dadosEditaveis.observacoes
      );
    });
    
    setTemAlteracoesPendentes(temAlteracoes);
  }, [controleHorarios, controleHorariosOriginais]);

  const verificarStatusDados = async () => {
    try {
      const response = await makeAuthenticatedRequest(`/controle-horarios/${dataReferencia}/status`);
      if (response.success) {
        setStatusDados(response.data);
      }
    } catch (err) {
      console.error('Erro ao verificar status dos dados:', err);
    }
  };

  const buscarOpcoesFiltros = async () => {
    try {
      const response = await makeAuthenticatedRequest(`/controle-horarios/${dataReferencia}/opcoes`);
      if (response.success) {
        setOpcoesFiltros(response.data);
      }
    } catch (err) {
      console.error('Erro ao buscar opções de filtros:', err);
    }
  };

  const buscarControleHorarios = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filtros).forEach(([key, value]) => {
        if (value && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const response = await makeAuthenticatedRequest(
        `/controle-horarios/${dataReferencia}?${queryParams.toString()}`
      );

      if (response.success) {
        setControleHorarios(response.data);
        setControleHorariosOriginais(JSON.parse(JSON.stringify(response.data))); // Deep copy
        setEstatisticas(response.estatisticas);
        setTemAlteracoesPendentes(false);
      } else {
        setError(response.message || 'Erro ao buscar controle de horários');
      }
    } catch (err: any) {
      setError(err.message || 'Erro na requisição');
    } finally {
      setLoading(false);
    }
  };

  // ===============================================
  // 💾 FUNÇÕES DE SALVAMENTO
  // ===============================================

  const salvarTodasAlteracoes = async () => {
    setSaving(true);
    setError(null);
    
    try {
      // Identificar itens que foram alterados
      const itensAlterados = controleHorarios.filter((item, index) => {
        const original = controleHorariosOriginais[index];
        if (!original) return false;
        
        return (
          item.dadosEditaveis.numeroCarro !== original.dadosEditaveis.numeroCarro ||
          item.dadosEditaveis.informacaoRecolhe !== original.dadosEditaveis.informacaoRecolhe ||
          item.dadosEditaveis.crachaFuncionario !== original.dadosEditaveis.crachaFuncionario ||
          item.dadosEditaveis.observacoes !== original.dadosEditaveis.observacoes
        );
      });

      if (itensAlterados.length === 0) {
        setError('Nenhuma alteração encontrada para salvar.');
        return;
      }

      // Preparar dados para salvamento múltiplo
      const dadosParaSalvar = {
        dataReferencia,
        controles: itensAlterados.map(item => ({
          viagemGlobusId: item.viagemGlobus.id,
          numeroCarro: item.dadosEditaveis.numeroCarro || null,
          informacaoRecolhe: item.dadosEditaveis.informacaoRecolhe || null,
          crachaFuncionario: item.dadosEditaveis.crachaFuncionario || null,
          observacoes: item.dadosEditaveis.observacoes || null,
        }))
      };

      const response = await makeAuthenticatedRequest(
        `/controle-horarios/salvar-multiplos`,
        {
          method: 'POST',
          body: JSON.stringify(dadosParaSalvar),
        }
      );

      if (response.success) {
        // Atualizar dados originais
        setControleHorariosOriginais(JSON.parse(JSON.stringify(controleHorarios)));
        setTemAlteracoesPendentes(false);
        
        // Recarregar dados para pegar estatísticas atualizadas
        await buscarControleHorarios();
        
        // Mostrar mensagem de sucesso
        setError(null);
      } else {
        setError(response.message || 'Erro ao salvar alterações');
      }
    } catch (err: any) {
      console.error('Erro ao salvar alterações:', err);
      setError('Erro ao salvar alterações. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const descartarAlteracoes = () => {
    setControleHorarios(JSON.parse(JSON.stringify(controleHorariosOriginais)));
    setTemAlteracoesPendentes(false);
  };

  // ===============================================
  // 🎨 FUNÇÕES DE EDIÇÃO
  // ===============================================

  const handleInputChange = useCallback((viagemId: string, field: keyof DadosEditaveis, value: string) => {
    setControleHorarios(prev => 
      prev.map(item => 
        item.viagemGlobus.id === viagemId
          ? {
              ...item,
              dadosEditaveis: {
                ...item.dadosEditaveis,
                [field]: value,
              }
            }
          : item
      )
    );
  }, []);

  // ===============================================
  // 🎨 FUNÇÕES DE FILTROS
  // ===============================================

  const limparFiltros = () => {
    setFiltros({
      setorPrincipal: '',
      codigoLinha: '',
      codServicoNumero: '',
      sentidoTexto: '',
      horarioInicio: '',
      horarioFim: '',
      nomeMotorista: '',
      buscaTexto: '',
      limite: 50,
    });
  };

  const contarFiltrosAtivos = () => {
    return Object.values(filtros).filter(value => value && value !== '' && value !== 50).length;
  };

  const contarAlteracoesPendentes = () => {
    return controleHorarios.filter((item, index) => {
      const original = controleHorariosOriginais[index];
      if (!original) return false;
      
      return (
        item.dadosEditaveis.numeroCarro !== original.dadosEditaveis.numeroCarro ||
        item.dadosEditaveis.informacaoRecolhe !== original.dadosEditaveis.informacaoRecolhe ||
        item.dadosEditaveis.crachaFuncionario !== original.dadosEditaveis.crachaFuncionario ||
        item.dadosEditaveis.observacoes !== original.dadosEditaveis.observacoes
      );
    }).length;
  };

  // ===============================================
  // 🎨 FUNÇÕES DE RENDERIZAÇÃO
  // ===============================================

  const renderStatusBadge = (status: boolean, label: string) => {
    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
        status 
          ? 'bg-green-100 text-green-700' 
          : 'bg-gray-100 text-gray-500'
      }`}>
        {status ? (
          <CheckCircle className="h-3 w-3" />
        ) : (
          <AlertCircle className="h-3 w-3" />
        )}
        {label}
      </div>
    );
  };

  const renderSetorBadge = (setor: string) => {
    const cores = {
      'GAMA': 'bg-red-100 text-red-700',
      'SANTA MARIA': 'bg-blue-100 text-blue-700',
      'PARANOÁ': 'bg-green-100 text-green-700',
      'SÃO SEBASTIÃO': 'bg-purple-100 text-purple-700',
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
        cores[setor as keyof typeof cores] || 'bg-gray-100 text-gray-700'
      }`}>
        {setor}
      </span>
    );
  };

  // ===============================================
  // 🎨 RENDER PRINCIPAL
  // ===============================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Clock className="h-6 w-6 text-blue-600" />
              Controle de Horários
            </h1>
            <p className="text-gray-600">Gerencie informações operacionais das viagens</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Seletor de Data */}
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-400" />
              <input
                type="date"
                value={dataReferencia}
                onChange={(e) => setDataReferencia(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Botão de Filtros */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors relative ${
                showFilters
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Filter className="h-4 w-4" />
              Filtros
              {contarFiltrosAtivos() > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                  {contarFiltrosAtivos()}
                </span>
              )}
            </button>

            {/* Botão Salvar Alterações */}
            {temAlteracoesPendentes && (
              <div className="flex items-center gap-2">
                <button
                  onClick={descartarAlteracoes}
                  className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 text-sm"
                >
                  <X className="h-4 w-4" />
                  Descartar
                </button>
                <button
                  onClick={salvarTodasAlteracoes}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className={`h-4 w-4 ${saving ? 'animate-spin' : ''}`} />
                  {saving ? 'Salvando...' : `Salvar (${contarAlteracoesPendentes()})`}
                </button>
              </div>
            )}

            {/* Botão Atualizar */}
            <button
              onClick={buscarControleHorarios}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          </div>
        </div>

        {/* Alerta de Alterações Pendentes */}
        {temAlteracoesPendentes && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  Você tem {contarAlteracoesPendentes()} alteração(ões) não salva(s)
                </p>
                <p className="text-sm text-yellow-700">
                  Clique em "Salvar" para confirmar as alterações ou "Descartar" para cancelá-las.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Status dos Dados */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-600">{statusDados.totalViagensGlobus}</div>
                <div className="text-sm text-blue-600">Viagens Globus</div>
              </div>
              {renderStatusBadge(statusDados.existeViagensGlobus, 'Dados')}
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">{estatisticas.viagensEditadas}</div>
                <div className="text-sm text-green-600">Viagens Editadas</div>
              </div>
              <div className="text-xs text-green-600 font-medium">
                {estatisticas.percentualEditado}%
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-yellow-600">{estatisticas.viagensNaoEditadas}</div>
                <div className="text-sm text-yellow-600">Não Editadas</div>
              </div>
              <div className="text-xs text-yellow-600 font-medium">
                {100 - estatisticas.percentualEditado}%
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-purple-600">{estatisticas.setoresUnicos.length}</div>
                <div className="text-sm text-purple-600">Setores Ativos</div>
              </div>
              <div className="text-xs text-purple-600 font-medium">
                {estatisticas.linhasUnicas.length} linhas
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <Search className="h-5 w-5" />
              Filtros Avançados
            </h3>
            <button
              onClick={() => setShowFilters(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Setor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Setor</label>
              <select
                value={filtros.setorPrincipal}
                onChange={(e) => setFiltros(prev => ({ ...prev, setorPrincipal: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos os setores</option>
                {opcoesFiltros.setores.map(setor => (
                  <option key={setor} value={setor}>{setor}</option>
                ))}
              </select>
            </div>

            {/* Linha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Linha</label>
              <select
                value={filtros.codigoLinha}
                onChange={(e) => setFiltros(prev => ({ ...prev, codigoLinha: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todas as linhas</option>
                {opcoesFiltros.linhas.map(linha => (
                  <option key={linha.codigo} value={linha.codigo}>
                    {linha.codigo} - {linha.nome.length > 30 ? linha.nome.substring(0, 30) + '...' : linha.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Serviço */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Serviço</label>
              <select
                value={filtros.codServicoNumero}
                onChange={(e) => setFiltros(prev => ({ ...prev, codServicoNumero: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos os serviços</option>
                {opcoesFiltros.servicos.map(servico => (
                  <option key={servico} value={servico}>{servico}</option>
                ))}
              </select>
            </div>

            {/* Sentido */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sentido</label>
              <select
                value={filtros.sentidoTexto}
                onChange={(e) => setFiltros(prev => ({ ...prev, sentidoTexto: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos os sentidos</option>
                {opcoesFiltros.sentidos.map(sentido => (
                  <option key={sentido} value={sentido}>{sentido}</option>
                ))}
              </select>
            </div>

            {/* Horário Início */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Horário Início</label>
              <input
                type="time"
                value={filtros.horarioInicio}
                onChange={(e) => setFiltros(prev => ({ ...prev, horarioInicio: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Horário Fim */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Horário Fim</label>
              <input
                type="time"
                value={filtros.horarioFim}
                onChange={(e) => setFiltros(prev => ({ ...prev, horarioFim: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Motorista */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Motorista</label>
              <input
                type="text"
                value={filtros.nomeMotorista}
                onChange={(e) => setFiltros(prev => ({ ...prev, nomeMotorista: e.target.value }))}
                placeholder="Nome do motorista"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Busca Geral */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Busca Geral</label>
              <input
                type="text"
                value={filtros.buscaTexto}
                onChange={(e) => setFiltros(prev => ({ ...prev, buscaTexto: e.target.value }))}
                placeholder="Buscar em todos os campos"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Limite de Registros</label>
                <select
                  value={filtros.limite}
                  onChange={(e) => setFiltros(prev => ({ ...prev, limite: Number(e.target.value) }))}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={25}>25 registros</option>
                  <option value={50}>50 registros</option>
                  <option value={100}>100 registros</option>
                  <option value={200}>200 registros</option>
                  <option value={500}>500 registros</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  limparFiltros();
                  buscarControleHorarios();
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Limpar Filtros
              </button>
              <button
                onClick={buscarControleHorarios}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
              >
                <Search className="h-4 w-4" />
                Aplicar Filtros
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabela de Controle */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
            <p className="mt-2 text-gray-600">Carregando controle de horários...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <AlertCircle className="h-8 w-8 mx-auto text-red-400" />
            <p className="mt-2 text-red-600">{error}</p>
            <button
              onClick={buscarControleHorarios}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
            >
              Tentar Novamente
            </button>
          </div>
        ) : controleHorarios.length === 0 ? (
          <div className="p-8 text-center">
            <Clock className="h-8 w-8 mx-auto text-gray-400" />
            <p className="mt-2 text-gray-600">Nenhuma viagem encontrada para os filtros aplicados.</p>
            {!statusDados.existeViagensGlobus && (
              <p className="mt-1 text-sm text-gray-500">
                Verifique se existem dados do Globus para esta data.
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Linha / Serviço
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sentido / Horários
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Motorista / Origem
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <Car className="h-4 w-4 inline mr-1" />
                    Carro
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <FileText className="h-4 w-4 inline mr-1" />
                    Recolhe
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
                  const original = controleHorariosOriginais[index];
                  const foiAlterado = original && (
                    item.dadosEditaveis.numeroCarro !== original.dadosEditaveis.numeroCarro ||
                    item.dadosEditaveis.informacaoRecolhe !== original.dadosEditaveis.informacaoRecolhe ||
                    item.dadosEditaveis.crachaFuncionario !== original.dadosEditaveis.crachaFuncionario ||
                    item.dadosEditaveis.observacoes !== original.dadosEditaveis.observacoes
                  );

                  return (
                    <tr 
                      key={item.viagemGlobus.id} 
                      className={`transition-colors ${
                        foiAlterado 
                          ? 'bg-yellow-50 hover:bg-yellow-100' 
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      {/* Linha / Serviço */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {item.viagemGlobus.codigoLinha} - Serviço {item.viagemGlobus.codServicoNumero}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-xs" title={item.viagemGlobus.nomeLinha}>
                            {item.viagemGlobus.nomeLinha}
                          </div>
                          <div className="mt-1">
                            {renderSetorBadge(item.viagemGlobus.setorPrincipal)}
                          </div>
                        </div>
                      </td>

                      {/* Sentido / Horários */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              item.viagemGlobus.sentidoTexto === 'IDA' ? 'bg-blue-100 text-blue-700' :
                              item.viagemGlobus.sentidoTexto === 'VOLTA' ? 'bg-green-100 text-green-700' :
                              'bg-purple-100 text-purple-700'
                            }`}>
                              {item.viagemGlobus.sentidoTexto}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3" />
                            {item.viagemGlobus.horSaidaTime} → {item.viagemGlobus.horChegadaTime}
                          </div>
                          <div className="text-xs text-gray-400">
                            {item.viagemGlobus.duracaoMinutos}min • {item.viagemGlobus.periodoDoDia}
                          </div>
                        </div>
                      </td>

                      {/* Motorista / Origem */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {item.viagemGlobus.nomeMotorista}
                          </div>
                          <div className="text-sm text-gray-500">
                            {item.viagemGlobus.localOrigemViagem}
                          </div>
                        </div>
                      </td>

                      {/* Carro (Editável) */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="text"
                          value={item.dadosEditaveis.numeroCarro || ''}
                          onChange={(e) => handleInputChange(item.viagemGlobus.id, 'numeroCarro', e.target.value)}
                          placeholder="Número do carro"
                          className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            original && item.dadosEditaveis.numeroCarro !== original.dadosEditaveis.numeroCarro
                              ? 'border-yellow-400 bg-yellow-50'
                              : 'border-gray-300'
                          }`}
                        />
                      </td>

                      {/* Recolhe (Editável) */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="text"
                          value={item.dadosEditaveis.informacaoRecolhe || ''}
                          onChange={(e) => handleInputChange(item.viagemGlobus.id, 'informacaoRecolhe', e.target.value)}
                          placeholder="Info. recolhimento"
                          className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            original && item.dadosEditaveis.informacaoRecolhe !== original.dadosEditaveis.informacaoRecolhe
                              ? 'border-yellow-400 bg-yellow-50'
                              : 'border-gray-300'
                          }`}
                        />
                      </td>

                      {/* Crachá (Editável) */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="text"
                          value={item.dadosEditaveis.crachaFuncionario || ''}
                          onChange={(e) => handleInputChange(item.viagemGlobus.id, 'crachaFuncionario', e.target.value)}
                          placeholder="Crachá"
                          className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            original && item.dadosEditaveis.crachaFuncionario !== original.dadosEditaveis.crachaFuncionario
                              ? 'border-yellow-400 bg-yellow-50'
                              : 'border-gray-300'
                          }`}
                        />
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          {foiAlterado ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                              <AlertCircle className="h-3 w-3" />
                              Alterado
                            </span>
                          ) : item.dadosEditaveis.jaFoiEditado ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              <CheckCircle className="h-3 w-3" />
                              Salvo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                              <AlertCircle className="h-3 w-3" />
                              Pendente
                            </span>
                          )}
                          {item.dadosEditaveis.updatedAt && (
                            <div className="text-xs text-gray-400">
                              {new Date(item.dadosEditaveis.updatedAt).toLocaleString('pt-BR')}
                            </div>
                          )}
                          {item.dadosEditaveis.usuarioEdicao && (
                            <div className="text-xs text-gray-400">
                              por {item.dadosEditaveis.usuarioEdicao}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Footer da tabela com informações */}
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div>
                  Mostrando {controleHorarios.length} de {estatisticas.totalViagens} viagens
                </div>
                <div className="flex items-center gap-4">
                  <span>
                    Editadas: {estatisticas.viagensEditadas} ({estatisticas.percentualEditado}%)
                  </span>
                  <span>
                    Pendentes: {estatisticas.viagensNaoEditadas}
                  </span>
                  {temAlteracoesPendentes && (
                    <span className="text-yellow-600 font-medium">
                      Alterações não salvas: {contarAlteracoesPendentes()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Observações Expandidas */}
      {controleHorarios.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Observações Gerais
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {controleHorarios
              .filter(item => item.dadosEditaveis.jaFoiEditado || item.dadosEditaveis.observacoes)
              .slice(0, 4)
              .map((item, index) => {
                const original = controleHorariosOriginais.find(orig => orig.viagemGlobus.id === item.viagemGlobus.id);
                const observacaoAlterada = original && item.dadosEditaveis.observacoes !== original.dadosEditaveis.observacoes;

                return (
                  <div key={item.viagemGlobus.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-900 mb-2">
                      Linha {item.viagemGlobus.codigoLinha} - Serviço {item.viagemGlobus.codServicoNumero}
                    </div>
                    <textarea
                      value={item.dadosEditaveis.observacoes || ''}
                      onChange={(e) => handleInputChange(item.viagemGlobus.id, 'observacoes', e.target.value)}
                      placeholder="Observações sobre esta viagem..."
                      rows={3}
                      className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                        observacaoAlterada
                          ? 'border-yellow-400 bg-yellow-50'
                          : 'border-gray-300'
                      }`}
                    />
                    <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                      <span>
                        {item.dadosEditaveis.observacoes?.length || 0}/500 caracteres
                      </span>
                      {observacaoAlterada && (
                        <span className="text-yellow-600 font-medium">
                          Alterado
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>

          {controleHorarios.filter(item => item.dadosEditaveis.jaFoiEditado || item.dadosEditaveis.observacoes).length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p>Nenhuma viagem editada ainda.</p>
              <p className="text-sm">As observações aparecerão aqui conforme você editar as viagens.</p>
            </div>
          )}
        </div>
      )}

      {/* Botão Fixo de Salvar (quando há alterações) */}
      {temAlteracoesPendentes && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {contarAlteracoesPendentes()} alteração(ões) pendente(s)
                </p>
                <p className="text-xs text-gray-500">
                  Clique em salvar para confirmar
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={descartarAlteracoes}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Descartar
                </button>
                <button
                  onClick={salvarTodasAlteracoes}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className={`h-4 w-4 ${saving ? 'animate-spin' : ''}`} />
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};