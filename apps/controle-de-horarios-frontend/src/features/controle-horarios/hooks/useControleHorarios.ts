// src/features/controle-horarios/hooks/useControleHorarios.ts
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { controleHorariosService } from '../services/controle-horarios.service';
import { 
  ControleHorarioItem, 
  FiltrosControleHorarios, 
  OpcoesControleHorarios, 
  DadosEditaveis,
  UsuarioAtual
} from '../types/controle-horarios.types';

// ✅ Interface para as estatísticas locais
interface EstatisticasLocal {
  totalViagens: number;
  viagensEditadas: number;
  viagensNaoEditadas: number;
  percentualEditado: number;
  setoresUnicos: string[];
  linhasUnicas: string[];
  servicosUnicos: string[];
  motoristasUnicos: string[];
  cobradoresUnicos: string[];
  terminaisUnicos: string[];
}

// ✅ Interface para status dos dados
interface StatusDados {
  existeViagensGlobus: boolean;
  totalViagensGlobus: number;
  viagensEditadas: number;
  percentualEditado: number;
  ultimaAtualizacao: Date | null;
  totalMotoristas: number;
  totalCobradores: number;
  totalLinhas: number;
  totalServicos: number;
  totalSetores: number;
}

export const useControleHorarios = () => {
  // ✅ Usar o hook useAuth
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
    cobradores: [],
    terminais: [],
    localidades: [],
  });

  // ✅ Estatísticas com interface completa
  const [estatisticas, setEstatisticas] = useState<EstatisticasLocal>({
    totalViagens: 0,
    viagensEditadas: 0,
    viagensNaoEditadas: 0,
    percentualEditado: 0,
    setoresUnicos: [],
    linhasUnicas: [],
    servicosUnicos: [],
    motoristasUnicos: [],
    cobradoresUnicos: [],
    terminaisUnicos: [],
  });

  // ✅ Status dos dados com interface completa
  const [statusDados, setStatusDados] = useState<StatusDados>({
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
      
      // ✅ CORRIGIDO: Filtrar apenas campos suportados pelo backend
      const filtrosLimpos = Object.fromEntries(
        Object.entries(filtros).filter(([key, value]) => {
          // Remover campos que o backend não suporta
          const camposNaoSuportados = ['statusEdicao', 'nomeCobrador', 'codCobrador', 'numeroCarro', 'informacaoRecolhe'];
          return !camposNaoSuportados.includes(key) && value !== undefined && value !== null && value !== '';
        })
      );
      
      console.log('🧹 Filtros limpos para envio:', filtrosLimpos);
      
      const response = await controleHorariosService.getControleHorarios(dataReferencia, filtrosLimpos);
      
      console.log('�� Resposta completa da API:', response);

      if (response.success) {
        // ✅ Processar dados com informações do usuário
        const dadosProcessados = response.data.map(item => ({
          ...item,
          dadosEditaveis: {
            ...item.dadosEditaveis,
            usuarioEdicao: item.dadosEditaveis.usuarioEdicao || undefined,
            usuarioEmail: item.dadosEditaveis.usuarioEmail || undefined,
            updatedAt: item.dadosEditaveis.updatedAt ? new Date(item.dadosEditaveis.updatedAt) : undefined,
            createdAt: item.dadosEditaveis.createdAt ? new Date(item.dadosEditaveis.createdAt) : undefined,
          }
        }));

        setControleHorarios(dadosProcessados);
        setControleHorariosOriginais(JSON.parse(JSON.stringify(dadosProcessados)));
        
        // ✅ Atualizar estatísticas com dados completos
        setEstatisticas({
          totalViagens: response.estatisticas.totalViagens || 0,
          viagensEditadas: response.estatisticas.viagensEditadas || 0,
          viagensNaoEditadas: response.estatisticas.viagensNaoEditadas || 0,
          percentualEditado: response.estatisticas.percentualEditado || 0,
          setoresUnicos: response.estatisticas.setoresUnicos || [],
          linhasUnicas: response.estatisticas.linhasUnicas || [],
          servicosUnicos: response.estatisticas.servicosUnicos || [],
          motoristasUnicos: response.estatisticas.motoristasUnicos || [],
          cobradoresUnicos: response.estatisticas.cobradoresUnicos || [],
          terminaisUnicos: response.estatisticas.terminaisUnicos || [],
        });
        
        setTemAlteracoesPendentes(false);
        
        console.log('✅ Estado atualizado:', {
          totalItens: dadosProcessados.length,
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
          cobradores: response.data.cobradores || [],
          terminais: response.data.terminais || [],
          localidades: response.data.localidades || [],
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
          item.dadosEditaveis.numeroCarro !== original.dadosEditaveis.numeroCarro ||
          item.dadosEditaveis.informacaoRecolhe !== original.dadosEditaveis.informacaoRecolhe ||
          item.dadosEditaveis.crachaFuncionario !== original.dadosEditaveis.crachaFuncionario ||
          item.dadosEditaveis.observacoes !== original.dadosEditaveis.observacoes
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
          viagemGlobusId: item.viagemGlobus.id,
          numeroCarro: item.dadosEditaveis.numeroCarro?.trim() || undefined,
          informacaoRecolhe: item.dadosEditaveis.informacaoRecolhe?.trim() || undefined,
          crachaFuncionario: item.dadosEditaveis.crachaFuncionario?.trim() || undefined,
          observacoes: item.dadosEditaveis.observacoes?.trim() || undefined,
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

  // ✅ Função de edição aprimorada
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
    setTemAlteracoesPendentes(true);
    setError(null);
  }, []);

  // ✅ CORRIGIDO: Funções de filtros sem campos não suportados
  const limparFiltros = () => {
    setFiltros({
      limite: 100,
      pagina: 0,
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
    return count;
  };

  const contarAlteracoesPendentes = () => {
    return controleHorarios.filter((item, index) => {
      const original = controleHorariosOriginais[index];
      if (!original) return true;
      
      return (
        item.dadosEditaveis.numeroCarro !== original.dadosEditaveis.numeroCarro ||
        item.dadosEditaveis.informacaoRecolhe !== original.dadosEditaveis.informacaoRecolhe ||
        item.dadosEditaveis.crachaFuncionario !== original.dadosEditaveis.crachaFuncionario ||
        item.dadosEditaveis.observacoes !== original.dadosEditaveis.observacoes
      );
    }).length;
  };

  // ✅ Efeitos
  useEffect(() => {
    if (dataReferencia) {
      Promise.all([
        verificarStatusDados(),
        buscarOpcoesFiltros(),
      ]).then(() => {
        buscarControleHorarios();
      });
    }
  }, [dataReferencia, verificarStatusDados, buscarOpcoesFiltros, buscarControleHorarios]);

  // ✅ Efeito para recarregar quando filtros mudam
  useEffect(() => {
    if (dataReferencia) {
      buscarControleHorarios();
    }
  }, [filtros, buscarControleHorarios]);

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
    handleInputChange,
    
    // Funções de filtros
    limparFiltros,
    aplicarFiltroRapido,
    contarFiltrosAtivos,
    contarAlteracoesPendentes,
  };
};