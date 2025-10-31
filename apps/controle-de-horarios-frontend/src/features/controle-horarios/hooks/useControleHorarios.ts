// src/features/controle-horarios/hooks/useControleHorarios.ts
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { controleHorariosService } from '../services/controle-horarios.service';
import {
  ControleHorarioItem,
  FiltrosControleHorarios,
  OpcoesControleHorarios,
  UsuarioAtual,
  SincronizacaoResponse,
  SincronizarControleHorariosDto,
  StatusControleHorarios,
  EstatisticasControleHorarios
} from '../types/controle-horarios.types';

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

  const [controleHorarios, setControleHorarios] = useState<ControleHorarioItem[]>([]);
  const [controleHorariosOriginais, setControleHorariosOriginais] = useState<ControleHorarioItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [temAlteracoesPendentes, setTemAlteracoesPendentes] = useState(false);
  
  // ✅ CORRIGIDO: Estados de filtros sem campos não suportados
  const [filtros, setFiltros] = useState<FiltrosControleHorarios>({
    limite: 100,
    pagina: 0,
    // ✅ REMOVIDO: statusEdicao - não suportado pelo backend
  });

  const [opcoesFiltros, setOpcoesFiltros] = useState<OpcoesControleHorarios>({
    setores: [],
    linhas: [],
    servicos: [],
    sentidos: [],
    motoristas: [],
    locaisOrigem: [],
    locaisDestino: [],
  });

  // ✅ Estatísticas com interface completa
  const [estatisticas, setEstatisticas] = useState<EstatisticasControleHorarios>({
    dataReferencia: '',
    totalViagens: 0,
    viagensEditadas: 0,
    viagensNaoEditadas: 0,
    percentualEditado: 0,
    ultimaAtualizacao: null,
    setoresUnicos: [],
    linhasUnicas: [],
    servicosUnicos: [],
  });

  const [statusDados, setStatusDados] = useState<StatusControleHorarios>({
    existeViagensGlobus: false,
    totalViagensGlobus: 0,
    viagensEditadas: 0,
    percentualEditado: 0,
    ultimaAtualizacao: null,
    totalMotoristas: 0,
    totalCobradores: 0,
    totalLinhas: 0,
    totalServicos: 0,
    totalSetores: 0,
  });

  // ✅ Função de busca aprimorada
  const buscarControleHorarios = useCallback(async () => {
    if (!dataReferencia) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Iniciando busca com filtros:', { dataReferencia, filtros });
      
      // Todos os campos em FiltrosControleHorarios são agora suportados pelo backend
      const filtrosLimpos = Object.fromEntries(
        Object.entries(filtros).filter(([key, value]) => value !== undefined && value !== null && value !== '')
      );
      
      console.log('🧹 Filtros limpos para envio:', filtrosLimpos);
      
      const response = await controleHorariosService.getControleHorarios(dataReferencia, filtrosLimpos);
      
      console.log('�� Resposta completa da API:', response);

      if (response.success) {
        // Os dados já vêm achatados do backend, sem a necessidade de dadosProcessados
        setControleHorarios(response.data);
        console.log('✅ Dados de controle de horários recebidos:', response.data.length, 'itens'); // Added log
        setControleHorariosOriginais(JSON.parse(JSON.stringify(response.data)));
        
        // ✅ Atualizar estatísticas com dados completos
        setEstatisticas({
          ...response.estatisticas,
          ultimaAtualizacao: response.estatisticas.ultimaAtualizacao ? new Date(response.estatisticas.ultimaAtualizacao) : null,
        });
        
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
      const response = await controleHorariosService.getStatusControleHorarios(dataReferencia);
      if (response.success) {
        setStatusDados({
          existeViagensGlobus: response.data.existeViagensGlobus || false,
          totalViagensGlobus: response.data.totalViagensGlobus || 0,
          viagensEditadas: response.data.viagensEditadas || 0,
          percentualEditado: response.data.percentualEditado || 0,
          ultimaAtualizacao: response.data.ultimaAtualizacao ? new Date(response.data.ultimaAtualizacao) : null,
          totalMotoristas: response.data.totalMotoristas || 0,
          totalCobradores: response.data.totalCobradores || 0,
          totalLinhas: response.data.totalLinhas || 0,
          totalServicos: response.data.totalServicos || 0,
          totalSetores: response.data.totalSetores || 0,
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
      const response = await controleHorariosService.getOpcoesControleHorarios(dataReferencia);
      if (response.success) {
        setOpcoesFiltros({
          setores: response.data.setores || [],
          linhas: response.data.linhas || [],
          servicos: response.data.servicos || [],
          sentidos: response.data.sentidos || [],
          motoristas: response.data.motoristas || [],
          locaisOrigem: response.data.locaisOrigem || [],
          locaisDestino: response.data.locaisDestino || [],
        });
      }
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
          item.informacaoRecolhe !== original.informacaoRecolhe ||
          item.crachaMotoristaEditado !== original.crachaMotoristaEditado ||
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
        usuarioEdicao: usuarioAtual.nome,
        usuarioEmail: usuarioAtual.email,
        controles: itensAlterados.map(item => ({
          viagemGlobusId: item.viagemGlobusId,
          numeroCarro: item.numeroCarro?.trim() || undefined,
          informacaoRecolhe: item.informacaoRecolhe?.trim() || undefined,
          crachaFuncionario: item.crachaMotoristaEditado?.trim() || undefined,
          observacoes: item.observacoes?.trim() || undefined,
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
      const response = await controleHorariosService.sincronizarControleHorarios(dataReferencia, { overwrite });
      if (response.success) {
        console.log('✅ Sincronização bem-sucedida:', response.message);
        await Promise.all([
          buscarControleHorarios(),
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
  }, [dataReferencia, buscarControleHorarios, verificarStatusDados]);

  // ✅ Função de edição aprimorada
  const handleInputChange = useCallback((viagemId: string, field: keyof ControleHorarioItem, value: string) => {
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
      limite: 100,
      pagina: 0,
      ordenarPor: "horaSaida",
      ordem: "ASC",
    });
  };

  const aplicarFiltroRapido = (tipo: 'editados' | 'nao_editados' | 'todos') => {
    // ✅ CORRIGIDO: Usar editadoPorUsuario em vez de statusEdicao
    if (tipo === 'editados') {
      setFiltros(prev => ({
        ...prev,
        editadoPorUsuario: true,
        pagina: 0,
      }));
    } else if (tipo === 'nao_editados') {
      setFiltros(prev => ({
        ...prev,
        editadoPorUsuario: false,
        pagina: 0,
      }));
    } else {
      setFiltros(prev => {
        const { editadoPorUsuario, ...resto } = prev;
        return {
          ...resto,
          pagina: 0,
        };
      });
    }
  };

  const contarFiltrosAtivos = () => {
    let count = 0;
    if (filtros.setorPrincipal) count++;
    if (filtros.codigoLinha && filtros.codigoLinha.length > 0) count++;
    if (filtros.codServicoNumero) count++;
    if (filtros.sentidoTexto) count++;
    if (filtros.horarioInicio) count++;
    if (filtros.horarioFim) count++;
    if (filtros.nomeMotorista) count++;
    if (filtros.localOrigem) count++;
    if (filtros.codAtividade) count++;
    if (filtros.localDestino) count++;
    if (filtros.crachaMotorista) count++;
    if (filtros.buscaTexto) count++;
    if (filtros.editadoPorUsuario === true || filtros.editadoPorUsuario === false) count++;
    if (filtros.ordenarPor && filtros.ordenarPor !== "horaSaida") count++;
    if (filtros.ordem && filtros.ordem !== "ASC") count++;
    return count;
  };

  const contarAlteracoesPendentes = () => {
    return controleHorarios.filter((item, index) => {
      const original = controleHorariosOriginais[index];
      if (!original) return true;
      
      return (
        item.numeroCarro !== original.numeroCarro ||
        item.informacaoRecolhe !== original.informacaoRecolhe ||
        item.crachaMotoristaEditado !== original.crachaMotoristaEditado ||
        item.observacoes !== original.observacoes
      );
    }).length;
  };

  // ✅ Efeitos
  useEffect(() => {
    // Initial load or dataReferencia change should not trigger automatic data fetch
    // Data will be fetched via manual sync or filter application
  }, [dataReferencia]);

  // ✅ Efeito para recarregar quando filtros mudam - REMOVIDO para sincronização manual
  // useEffect(() => {
  //   if (dataReferencia) {
  //     buscarControleHorarios();
  //   }
  // }, [filtros, buscarControleHorarios]);

  const iniciarSincronizacaoManual = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        buscarControleHorarios(),
        verificarStatusDados(),
        buscarOpcoesFiltros()
      ]);
    } catch (err: any) {
      console.error('❌ Erro ao iniciar sincronização manual:', err);
      setError(err.message || 'Erro ao iniciar sincronização manual.');
    } finally {
      setLoading(false);
    }
  }, [buscarControleHorarios, verificarStatusDados, buscarOpcoesFiltros]);

  return {
    // Estados
    dataReferencia,
    setDataReferencia,
    controleHorarios,
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
    iniciarSincronizacaoManual, // Adicionado
    
    // Funções de filtros
    limparFiltros,
    aplicarFiltroRapido,
    contarFiltrosAtivos,
    contarAlteracoesPendentes,
  };
};