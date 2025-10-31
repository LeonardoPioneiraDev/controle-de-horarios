// src/features/controle-horarios/hooks/useControleHorarios.ts
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { controleHorariosService } from '@/services/controleHorariosService';
import {
  ControleHorarioItemDto,
  FiltrosControleHorarios,
  OpcoesControleHorariosDto,
  SalvarControleHorariosDto,
  SincronizarControleHorariosDto,
  StatusControleHorariosDto,
  EstatisticasControleHorariosDto
} from '@/types/controle-horarios.types';


interface UsuarioAtual {
  id: string;
  nome: string;
  email: string;
  perfil: string;
}

export const useControleHorarios = () => {  // ✅ Usar o hook useAuth
  const { user } = useAuth();

  // ✅ Função para obter dados do usuário atual
  const obterUsuarioAtual = (): UsuarioAtual | null => {
    if (user) {
      return {
        id: user.id,
        nome: `${user.firstName} ${user.lastName}`.trim() || user.email,
        email: user.email,
        perfil: user.role || 'OPERADOR'
      };
    }
    
    // Fallback para dados do localStorage se o contexto não estiver disponível
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        return {
          id: parsedUser.id || '1',
          nome: parsedUser.firstName && parsedUser.lastName 
            ? `${parsedUser.firstName} ${parsedUser.lastName}`.trim()
            : parsedUser.name || parsedUser.nome || parsedUser.email || 'Usuário',
          email: parsedUser.email || 'usuario@exemplo.com',
          perfil: parsedUser.role || parsedUser.perfil || 'OPERADOR'
        };
      } catch {
        // Se falhar, usar dados padrão
      }
    }
    
    return {
      id: '1',
      nome: 'Usuário Padrão',
      email: 'usuario@exemplo.com',
      perfil: 'OPERADOR'
    };
  };

  // Estados principais
  const [dataReferencia, setDataReferencia] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const [controleHorarios, setControleHorarios] = useState<ControleHorarioItemDto[]>([]);
  const [controleHorariosExibidos, setControleHorariosExibidos] = useState<ControleHorarioItemDto[]>([]);
  const [controleHorariosOriginais, setControleHorariosOriginais] = useState<ControleHorarioItemDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [temAlteracoesPendentes, setTemAlteracoesPendentes] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(100);
  const [totalItems, setTotalItems] = useState(0);
  const [temMaisPaginas, setTemMaisPaginas] = useState(false);

  const [filtros, setFiltros] = useState<FiltrosControleHorarios>({
    limite: pageSize,
    pagina: currentPage,
    codAtividade: undefined, // Ajustado para string
    localOrigem: undefined,
    crachaMotorista: undefined,
    crachaCobrador: undefined,
    servicoIgualMotorista: undefined,
  });

  const [statusEdicaoLocal, setStatusEdicaoLocal] = useState<'todos' | 'editados' | 'nao_editados'>('todos'); // Novo estado local

  const [opcoesFiltros, setOpcoesFiltros] = useState<OpcoesControleHorariosDto>({
    setores: [],
    linhas: [],
    servicos: [],
    sentidos: [],
    motoristas: [],
    locaisOrigem: [],
    locaisDestino: [],
  });

  const [estatisticas, setEstatisticas] = useState<EstatisticasControleHorariosDto>({
    totalViagens: 0,
    viagensEditadas: 0,
    viagensNaoEditadas: 0,
    percentualEditado: 0,
    ultimaAtualizacao: undefined,
    setoresUnicos: [],
    linhasUnicas: [],
    servicosUnicos: [],
  });

  const [statusDados, setStatusDados] = useState<StatusControleHorariosDto>({
    success: false,
    message: '',
    data: {
      existeViagensGlobus: false,
      totalViagensGlobus: 0,
      viagensEditadas: 0,
      percentualEditado: 0,
      ultimaAtualizacao: undefined,
    },
    dataReferencia: '',
  });

  // ✅ Função de busca aprimorada
  const buscarControleHorarios = useCallback(async () => {
    if (!dataReferencia) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Iniciando busca com filtros:', { dataReferencia, filtros });
      
      const filtrosComPaginacao = {
        ...filtros,
        limite: pageSize === -1 ? undefined : pageSize,
        pagina: pageSize === -1 ? undefined : currentPage,
      };

      const filtrosLimpos = Object.fromEntries(
        Object.entries(filtrosComPaginacao).filter(([key, value]) => value !== undefined && value !== null && value !== '')
      );
      
      console.log('🧹 Filtros limpos para envio:', filtrosLimpos);
      
      const response = await controleHorariosService.buscarControleHorarios(dataReferencia, filtrosLimpos);
      
      console.log('�� Resposta completa da API:', response);

      if (response.success) {
        // Os dados já vêm achatados do backend, sem a necessidade de dadosProcessados
        setControleHorarios(response.data.filter(item => /^[0-9]/.test(item.codigoLinha || '')));
        console.log('✅ Dados de controle de horários recebidos:', response.data.length, 'itens'); // Added log
        setControleHorariosOriginais(JSON.parse(JSON.stringify(response.data)));
        
        // ✅ Atualizar estatísticas com dados completos
        setEstatisticas({
          ...response.estatisticas,
          ultimaAtualizacao: response.estatisticas.ultimaAtualizacao ? new Date(response.estatisticas.ultimaAtualizacao) : undefined,
        });
        
        setTotalItems(response.total);
        setTemMaisPaginas(response.temMaisPaginas);
        setTemAlteracoesPendentes(false);
        
        console.log('✅ Estado atualizado:', {
          totalItens: response.data.length,
          estatisticas: response.estatisticas
        });
      } else {
        setError(response.message || 'Erro ao buscar controle de horários');
      }
    } catch (err: any) {
      console.error('❌ Erro na requisição:', err);
      setError(err.response?.data?.message || err.message || 'Erro na requisição');
    } finally {
      setLoading(false);
    }
  }, [dataReferencia, filtros]);

  // ✅ Função para verificar status dos dados
  const verificarStatusDados = useCallback(async () => {
    if (!dataReferencia) return;
    
    try {
      const response = await controleHorariosService.verificarStatusDados(dataReferencia);
      if (response.success) {
        setStatusDados({
          ...response,
          data: {
            ...response.data,
            ultimaAtualizacao: response.data.ultimaAtualizacao ? new Date(response.data.ultimaAtualizacao) : undefined,
          }
        });
      }
    } catch (err) {
      console.error('Erro ao verificar status dos dados:', err);
    }
  }, [dataReferencia]);

  // ✅ Função para buscar opções de filtros
  const buscarOpcoesFiltros = useCallback(async () => {
    if (!dataReferencia) return;
    
    try {
      const response = await controleHorariosService.buscarOpcoesControleHorarios(dataReferencia);
      setOpcoesFiltros({
        setores: response.setores || [],
        linhas: (response.linhas || []).filter(linha => /^[0-9]/.test(linha.codigo)), // Filtrar linhas que começam com número
        servicos: response.servicos || [],
        sentidos: response.sentidos || [],
        motoristas: response.motoristas || [],
        locaisOrigem: response.locaisOrigem || [],
        locaisDestino: response.locaisDestino || [],
      });
    } catch (err) {
      console.error('Erro ao buscar opções de filtros:', err);
    }
  }, [dataReferencia]);

  // ✅ Função de salvamento aprimorada
  const salvarTodasAlteracoes = async () => {
    const usuarioAtual = obterUsuarioAtual();
    
    if (!usuarioAtual) {
      setError('Usuário não autenticado. Faça login novamente.');
      return;
    }

    setSaving(true);
    setError(null);
    
    try {
      const itensAlterados = controleHorarios.filter((item, index) => {
        const original = controleHorariosOriginais[index];
        if (!original) return true;
        
        return (
          item.numeroCarro !== original.numeroCarro ||
          item.nomeMotoristaEditado !== original.nomeMotoristaEditado ||
          item.crachaMotoristaEditado !== original.crachaMotoristaEditado ||
          item.nomeCobradorEditado !== original.nomeCobradorEditado ||
          item.crachaCobradorEditado !== original.crachaCobradorEditado ||
          item.observacoes !== original.observacoes
        );
      });

      if (itensAlterados.length === 0) {
        setError('Nenhuma alteração encontrada para salvar.');
        setSaving(false);
        return;
      }

      console.log(`💾 Salvando ${itensAlterados.length} alterações...`);

      const dadosParaSalvar = {
        dataReferencia,
        controles: itensAlterados.map(item => ({
          viagemGlobusId: item.viagemGlobusId,
          numeroCarro: item.numeroCarro?.trim() || undefined,
          nomeMotoristaEditado: item.nomeMotoristaEditado?.trim() || undefined,
          crachaMotoristaEditado: item.crachaMotoristaEditado?.trim() || undefined,
          nomeCobradorEditado: item.nomeCobradorEditado?.trim() || undefined,
          crachaCobradorEditado: item.crachaCobradorEditado?.trim() || undefined,
          observacoes: item.observacoes?.trim() || undefined,
          isAtivo: item.isAtivo,
          editorId: usuarioAtual.id,
          editorNome: usuarioAtual.nome,
          editorEmail: usuarioAtual.email,
        }))
      };

      const response = await controleHorariosService.salvarMultiplosControles(dadosParaSalvar);

      if (response.success) {
        console.log(`✅ Salvamento concluído: ${response.salvos} sucessos, ${response.erros || 0} erros`);
        
        setControleHorariosOriginais(JSON.parse(JSON.stringify(controleHorarios)));
        setTemAlteracoesPendentes(false);
        
        await Promise.all([
          buscarControleHorarios(),
          verificarStatusDados()
        ]);
        
        setError(null);
      } else {
        setError(response.message || 'Erro ao salvar alterações');
      }
    } catch (err: any) {
      console.error('❌ Erro ao salvar alterações:', err);
      setError(err.response?.data?.message || 'Erro ao salvar alterações. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  // ✅ Função para descartar alterações
  const descartarAlteracoes = () => {
    setControleHorarios(JSON.parse(JSON.stringify(controleHorariosOriginais)));
    setTemAlteracoesPendentes(false);
    setError(null);
  };

  // ✅ Função para sincronizar dados com o Globus
  const sincronizarControleHorarios = useCallback(async (overwrite: boolean = false) => {
    setLoading(true);
    setError(null);
    try {
      const response = await controleHorariosService.sincronizarViagensGlobus(dataReferencia, overwrite);
      if (response.success) {
        console.log('✅ Sincronização bem-sucedida:', response.message);
        await Promise.all([
          verificarStatusDados(),
          buscarOpcoesFiltros()
        ]);
      } else {
        setError(response.message || 'Erro ao sincronizar com o Globus');
      }
    } catch (err: any) {
      console.error('❌ Erro ao sincronizar:', err);
      setError(err.response?.data?.message || err.message || 'Erro ao sincronizar com o Globus');
    } finally {
      setLoading(false);
    }
  }, [dataReferencia, buscarControleHorarios, verificarStatusDados, buscarOpcoesFiltros]);

  // ✅ Função de edição aprimorada
  const handleInputChange = useCallback((viagemId: string, field: keyof ControleHorarioItemDto, value: string | number | boolean) => {
    setControleHorarios(prev => 
      prev.map(item => 
        item.viagemGlobusId === viagemId
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
    setTemAlteracoesPendentes(true);
    setError(null);
  }, []);

  // ✅ CORRIGIDO: Funções de filtros sem campos não suportados
  const limparFiltros = () => {
    setFiltros({
      limite: pageSize,
      pagina: 0,
      ordenarPor: "horaSaida",
      ordem: "ASC",
      codAtividade: undefined,
      localOrigem: undefined,
      crachaMotorista: undefined,
      crachaCobrador: undefined,
      servicoIgualMotorista: true,
      buscaTexto: undefined,
      nomeMotorista: undefined,
      nomeCobrador: undefined,
      horarioInicio: undefined,
      horarioFim: undefined,
      sentidoTexto: undefined,
      codigoLinha: undefined,
      setorPrincipal: undefined,
      codServicoNumero: undefined,
      localDestino: undefined,
    });
    setCurrentPage(0);
    setStatusEdicaoLocal('todos'); // Limpar também o filtro local
  };

  const aplicarFiltroRapido = (tipo: 'editados' | 'nao_editados' | 'todos') => {
    setStatusEdicaoLocal(tipo); // Atualiza o estado local
    setCurrentPage(0);
  };

  const contarFiltrosAtivos = () => {
    let count = 0;
    const { limite, pagina, ordenarPor, ordem, ...restOfFilters } = filtros;

    for (const key in restOfFilters) {
      const value = restOfFilters[key as keyof typeof restOfFilters];
      if (value !== undefined && value !== null && value !== '' && !(Array.isArray(value) && value.length === 0)) {
        count++;
      }
    }
    if (statusEdicaoLocal !== 'todos') { // Contar o filtro local
      count++;
    }
    return count;
  };

  const contarAlteracoesPendentes = () => {
    return controleHorarios.filter((item, index) => {
      const original = controleHorariosOriginais[index];
      if (!original) return true;
      
      return (
        item.numeroCarro !== original.numeroCarro ||
        item.nomeMotoristaEditado !== original.nomeMotoristaEditado ||
        item.crachaMotoristaEditado !== original.crachaMotoristaEditado ||
        item.nomeCobradorEditado !== original.nomeCobradorEditado ||
        item.crachaCobradorEditado !== original.crachaCobradorEditado ||
        item.observacoes !== original.observacoes
      );
    }).length;
  };

  // Effect for initial load of status and filter options
  useEffect(() => {
    const loadStatusAndOptions = async () => {
      if (!dataReferencia) return;
      setLoading(true);
      setError(null);
      try {
        await Promise.all([
          verificarStatusDados(),
          buscarOpcoesFiltros()
        ]);
      } catch (err: any) {
        console.error('❌ Erro ao carregar status e opções iniciais:', err);
        setError(err.message || 'Erro ao carregar status e opções iniciais.');
      } finally {
        setLoading(false);
      }
    };
    loadStatusAndOptions();
  }, [dataReferencia, verificarStatusDados, buscarOpcoesFiltros]);

    // Effect for fetching main control data based on filters and pagination
    useEffect(() => {
      if (!dataReferencia) return;
      // Only fetch if not already loading to prevent redundant calls
      // The `loading` state is managed internally by `buscarControleHorarios`
      buscarControleHorarios();
    }, [dataReferencia, filtros, currentPage, pageSize]);

  // Effect para filtrar viagens editadas e passadas
  useEffect(() => {
    const now = new Date();
    const filtered = controleHorarios.filter(viagem => {
      if (viagem.jaFoiEditado) {
        // Se a viagem foi editada, verificar se o horário de chegada já passou
        if (viagem.horaChegada) {
          const [hora, minuto] = viagem.horaChegada.split(':').map(Number);
          const chegadaDate = new Date(dataReferencia);
          chegadaDate.setHours(hora, minuto, 0, 0);
          return chegadaDate > now;
        }
      }
      return true;
    });
    setControleHorariosExibidos(filtered);
  }, [controleHorarios, dataReferencia]);
  // NOVO: Effect para filtrar por status de edição localmente
  const [controleHorariosFiltradosPorStatus, setControleHorariosFiltradosPorStatus] = useState<ControleHorarioItemDto[]>([]);

  useEffect(() => {
    let filtered = controleHorariosExibidos;
    if (statusEdicaoLocal === 'editados') {
      filtered = controleHorariosExibidos.filter(viagem => viagem.jaFoiEditado);
    } else if (statusEdicaoLocal === 'nao_editados') {
      filtered = controleHorariosExibidos.filter(viagem => !viagem.jaFoiEditado);
    }
    setControleHorariosFiltradosPorStatus(filtered);
  }, [controleHorariosExibidos, statusEdicaoLocal]);

  return {
    // Estados
    dataReferencia,
    setDataReferencia,
    controleHorarios: controleHorariosFiltradosPorStatus, // Retornar os dados filtrados por status
    controleHorariosOriginais,
    loading,
    error,
    saving,
    temAlteracoesPendentes,
    filtros,
    setFiltros,
    opcoesFiltros,
    estatisticas,
    statusDados,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    temMaisPaginas,
    
    // Dados do usuário
    usuarioAtual: obterUsuarioAtual(),
    
    // Funções principais
    buscarControleHorarios,
    verificarStatusDados,
    buscarOpcoesFiltros,
    salvarTodasAlteracoes,
    descartarAlteracoes,
    sincronizarControleHorarios,
    handleInputChange,
    iniciarSincronizacaoManual: sincronizarControleHorarios, // Agora o botão de sincronização manual chama a função de sincronização principal
    
    // Funções de filtros
    limparFiltros,
    aplicarFiltroRapido,
    contarFiltrosAtivos,
    contarAlteracoesPendentes,
    statusEdicaoLocal,
  };
};