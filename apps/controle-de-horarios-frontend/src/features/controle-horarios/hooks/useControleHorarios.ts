import { useCallback, useEffect, useMemo, useState } from 'react';
import { controleHorariosService } from '../../../services/controleHorariosService';
import { isAtLeast, UserRole } from '../../../types/user.types';
import {
  ControleHorarioItem,
  FiltrosControleHorarios,
  OpcoesControleHorariosDto,
  StatusControleHorariosDto,
  EstatisticasControleHorariosDto,
  UpdateMultipleControleHorariosDto,
} from '../../../types/controle-horarios.types';

interface UsuarioAtual { id: string; nome: string; email: string; perfil: string }

export const useControleHorarios = () => {
  const obterUsuarioAtual = (): UsuarioAtual => {
    const raw = localStorage.getItem('user');
    try {
      if (raw) {
        const u = JSON.parse(raw);
        return {
          id: u.id || '1',
          nome: (u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : (u.name || u.nome || u.email)) || 'Usuário',
          email: u.email || 'usuario@exemplo.com',
          perfil: u.role || u.perfil || 'OPERADOR',
        };
      }
    } catch {}
    return { id: '1', nome: 'Usuário', email: 'usuario@exemplo.com', perfil: 'OPERADOR' };
  };

  const [dataReferencia, setDataReferencia] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [controleHorarios, setControleHorarios] = useState<ControleHorarioItem[]>([]);
  const [controleHorariosOriginais, setControleHorariosOriginais] = useState<ControleHorarioItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [temAlteracoesPendentes, setTemAlteracoesPendentes] = useState(false);

  const [filtros, setFiltros] = useState<FiltrosControleHorarios>({
    limite: 100,
    pagina: 1,
  });

  // Filtros locais (não enviados ao backend)
  const [tipoLocal, setTipoLocal] = useState<'R' | 'S' | undefined>(undefined);
  const [statusEdicaoLocal, setStatusEdicaoLocal] = useState<'todos' | 'editados' | 'nao_editados'>('todos');

  const [opcoesFiltros, setOpcoesFiltros] = useState<OpcoesControleHorariosDto>({
    setores: [], linhas: [], servicos: [], atividades: [], tiposDia: [], sentidos: [], motoristas: [], locaisOrigem: [], locaisDestino: [],
  });

  const [estatisticas, setEstatisticas] = useState<EstatisticasControleHorariosDto>({
    TOTAL_REGISTROS_HOJE: 0, TOTAL_LINHAS: 0, TOTAL_SETORES: 0, TOTAL_MOTORISTAS: 0, PRIMEIRO_HORARIO: '', ULTIMO_HORARIO: '',
  });

  const [statusDados, setStatusDados] = useState<StatusControleHorariosDto>({
    success: false,
    message: '',
    data: {
      existeNoBanco: false, totalRegistros: 0, ultimaAtualizacao: null,
      setoresDisponiveis: [], linhasDisponiveis: 0, atividadesDisponiveis: [], tiposDiaDisponiveis: [],
    }
  });

  const toTime = (d?: string | Date | null) => {
    if (!d) return '';
    const dt = new Date(d);
    const hh = String(dt.getHours()).padStart(2, '0');
    const mm = String(dt.getMinutes()).padStart(2, '0');
    const ss = String(dt.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  };

  const mapRecordToItem = (r: any): ControleHorarioItem => {
    const duracaoMinutos = r.hor_saida && r.hor_chegada
      ? Math.max(0, Math.round((new Date(r.hor_chegada).getTime() - new Date(r.hor_saida).getTime()) / 60000))
      : 0;
    const jaFoiEditado = Boolean(
      r.prefixo_veiculo || r.motorista_substituto_nome || r.motorista_substituto_cracha ||
      r.cobrador_substituto_nome || r.cobrador_substituto_cracha || r.observacoes_edicao
    );
    return {
      ...r,
      setorPrincipalLinha: r.setor_principal_linha,
      codigoLinha: r.codigo_linha,
      nomeLinha: r.nome_linha,
      localOrigemViagem: r.local_origem_viagem,
      localDestinoLinha: r.local_destino_linha,
      descTipoDia: r.desc_tipodia,
      horaSaida: toTime(r.hor_saida),
      horaChegada: toTime(r.hor_chegada),
      nomeMotoristaGlobus: r.motorista_substituto_nome || r.nome_motorista,
      crachaMotoristaGlobus: r.cracha_motorista,
      nomeCobradorGlobus: r.cobrador_substituto_nome || r.nome_cobrador,
      crachaCobradorGlobus: r.cracha_cobrador,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      numeroCarro: r.prefixo_veiculo || '',
      nomeMotoristaEditado: r.motorista_substituto_nome || '',
      crachaMotoristaEditado: r.motorista_substituto_cracha || '',
      nomeCobradorEditado: r.cobrador_substituto_nome || '',
      crachaCobradorEditado: r.cobrador_substituto_cracha || '',
      observacoes: r.observacoes_edicao || '',
      informacaoRecolhe: '',
      viagemGlobusId: r.id,
      duracaoMinutos,
      usuarioEdicao: r.editado_por_nome || '',
      usuarioEmail: r.editado_por_email || '',
      jaFoiEditado,
    } as ControleHorarioItem;
  };

  const buscarControleHorarios = useCallback(async () => {
    if (!dataReferencia) return;
    setLoading(true);
    setError(null);
    try {
      // Preparar filtros para request (injeta cracha_funcionario quando aplicável)
      const reqFilters: FiltrosControleHorarios = { ...filtros };
      if (!reqFilters.editado_por_usuario_email && statusEdicaoLocal === 'editados') {
        const u = obterUsuarioAtual();
        if (u?.email) {
          (reqFilters as any).editado_por_usuario_email = u.email;
          (reqFilters as any).apenas_editadas = true;
        }
      }
      if (!reqFilters.cracha_funcionario) {
        if (reqFilters.cracha_motorista && !reqFilters.cracha_cobrador) {
          (reqFilters as any).cracha_funcionario = reqFilters.cracha_motorista;
        } else if (reqFilters.cracha_cobrador && !reqFilters.cracha_motorista) {
          (reqFilters as any).cracha_funcionario = reqFilters.cracha_cobrador;
        }
      }

      // Garantir que não enviamos propriedades não suportadas pelo backend
      delete (reqFilters as any).cracha_motorista;
      delete (reqFilters as any).cracha_cobrador;

      const response = await controleHorariosService.buscarControleHorarios(dataReferencia, reqFilters);
      let mapped = (response.data || []).map(mapRecordToItem);
      // Pós-filtros locais para casos sem suporte no backend
      mapped = mapped.filter((it) => {
        // tipo (R/S)
        if (tipoLocal && String((it as any).flg_tipo || '').toUpperCase() !== tipoLocal) return false;
        // não editados
        if (statusEdicaoLocal === 'nao_editados' && !!(it as any).editado_por_nome) return false;
        // local destino (caso backend não filtre)
        if ((filtros as any).local_destino_linha) {
          const v = ((it as any).local_destino_linha || '').toString().toLowerCase();
          if (!v.includes(String((filtros as any).local_destino_linha).toLowerCase())) return false;
        }
        // crachá específicos (refina resultados do OR do backend)
        if ((filtros as any).cracha_motorista) {
          const cm = ((it as any).cracha_motorista || '').toString();
          if (cm !== (filtros as any).cracha_motorista) return false;
        }
        if ((filtros as any).cracha_cobrador) {
          const cc = ((it as any).cracha_cobrador || '').toString();
          if (cc !== (filtros as any).cracha_cobrador) return false;
        }
        return true;
      });
      // Ordenação com ajuste de virada de dia (itens com saída de 00:00 até cutoff vão para o final)
      const MIDNIGHT_CUTOFF_HOUR = 4; // 04:00
      const normMinutes = (d: any) => {
        const dt = d ? new Date(d) : null;
        if (!dt || isNaN(dt.getTime())) return Number.MAX_SAFE_INTEGER;
        const m = dt.getHours() * 60 + dt.getMinutes();
        return dt.getHours() < MIDNIGHT_CUTOFF_HOUR ? m + 24 * 60 : m;
      };
      mapped.sort((a: any, b: any) => {
        const sa = (a.setor_principal_linha || a.setorPrincipalLinha || '').localeCompare(b.setor_principal_linha || b.setorPrincipalLinha || '');
        if (sa !== 0) return sa;
        const la = (a.codigo_linha || a.codigoLinha || '').localeCompare(b.codigo_linha || b.codigoLinha || '');
        if (la !== 0) return la;
        const sva = (a.cod_servico_numero || '').localeCompare(b.cod_servico_numero || '');
        if (sva !== 0) return sva;
        const ta = normMinutes(a.hor_saida || a.horaSaida || a.hora_saida);
        const tb = normMinutes(b.hor_saida || b.horaSaida || b.hora_saida);
        return ta - tb;
      });
      setControleHorarios(mapped);
      setControleHorariosOriginais(JSON.parse(JSON.stringify(mapped)));
      setTemAlteracoesPendentes(false);
      if (response.estatisticas) setEstatisticas(response.estatisticas);
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar controle de horários');
    } finally {
      setLoading(false);
    }
  }, [dataReferencia, JSON.stringify(filtros), tipoLocal, statusEdicaoLocal]);

  const verificarStatusDados = useCallback(async () => {
    try {
      const response = await controleHorariosService.verificarStatusDados(dataReferencia);
      if (response && response.success) {
        setStatusDados({
          ...response,
          data: { ...response.data, ultimaAtualizacao: response.data.ultimaAtualizacao ? new Date(response.data.ultimaAtualizacao) : null }
        });
      }
    } catch {}
  }, [dataReferencia]);

  const buscarOpcoesFiltros = useCallback(async () => {
    try {
      const response = await controleHorariosService.buscarOpcoesControleHorarios(dataReferencia);
      // Derivar locais a partir do conjunto completo (9 mil) para opções abrangentes
      const full = await controleHorariosService.buscarControleHorarios(dataReferencia, { limite: 10000, pagina: 1 } as any);
      const origemSet = new Set<string>();
      const destinoSet = new Set<string>();
      (full.data || []).forEach((r: any) => {
        if (r.local_origem_viagem) origemSet.add(r.local_origem_viagem);
        if (r.local_destino_linha) destinoSet.add(r.local_destino_linha);
      });
      setOpcoesFiltros({
        ...response,
        locaisOrigem: Array.from(origemSet.values()).sort(),
        locaisDestino: Array.from(destinoSet.values()).sort(),
      });
    } catch {}
  }, [dataReferencia]);

  const salvarTodasAlteracoes = useCallback(async () => {
    const usuarioAtual = obterUsuarioAtual();
    const roleNorm = (usuarioAtual.perfil || '').toString().toLowerCase() as UserRole;
    if (!isAtLeast(roleNorm, UserRole.ANALISTA)) {
      setError('Voc� n�o tem permiss�o para salvar altera��es. Requer perfil Analista ou superior.');
      return;
    }
    const origById = new Map(controleHorariosOriginais.map((o) => [o.id, o]));
    const itensAlterados = controleHorarios.filter((item) => {
      const original = origById.get(item.id);
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
    if (itensAlterados.length === 0) return;
    try {
      setLoading(true);
      const payload: UpdateMultipleControleHorariosDto = {
        updates: itensAlterados.map((i) => ({
          id: i.id,
          prefixo_veiculo: i.numeroCarro?.trim() || undefined,
          motorista_substituto_nome: i.nomeMotoristaEditado?.trim() || undefined,
          motorista_substituto_cracha: i.crachaMotoristaEditado?.trim() || undefined,
          cobrador_substituto_nome: i.nomeCobradorEditado?.trim() || undefined,
          cobrador_substituto_cracha: i.crachaCobradorEditado?.trim() || undefined,
          observacoes_edicao: i.observacoes?.trim() || undefined,
        })),
        editorNome: usuarioAtual.nome,
        editorEmail: usuarioAtual.email,
      };
      await controleHorariosService.salvarMultiplosControles(payload);
      setControleHorariosOriginais(JSON.parse(JSON.stringify(controleHorarios)));
      setTemAlteracoesPendentes(false);
      await Promise.all([buscarControleHorarios(), verificarStatusDados()]);
    } catch (err: any) {
      const msg = String(err?.message || '').toLowerCase();
      if (msg.includes('forbidden')) {
        setError('A��o n�o permitida: seu perfil n�o pode salvar. Requer Analista ou superior.');
      } else {
        setError(err.message || 'Erro ao salvar altera��es');
      }
    } finally {
      setLoading(false);
    }
  }, [controleHorarios, controleHorariosOriginais, dataReferencia]);

  const descartarAlteracoes = useCallback(() => {
    setControleHorarios(JSON.parse(JSON.stringify(controleHorariosOriginais)));
    setTemAlteracoesPendentes(false);
    setError(null);
  }, [controleHorariosOriginais]);

  const sincronizarControleHorarios = useCallback(async () => {
    try {
      setLoading(true);
      await controleHorariosService.sincronizarViagensGlobus(dataReferencia);
      await Promise.all([verificarStatusDados(), buscarOpcoesFiltros(), buscarControleHorarios()]);
    } catch (err: any) {
      setError(err.message || 'Erro ao sincronizar');
    } finally {
      setLoading(false);
    }
  }, [dataReferencia]);

  const handleInputChange = useCallback((viagemId: string, field: keyof ControleHorarioItem, value: string | number | boolean) => {
    setControleHorarios((prev) => prev.map((it) => (it.id === viagemId ? { ...it, [field]: value } as any : it)));
    setTemAlteracoesPendentes(true);
    setError(null);
  }, []);

  const limparFiltros = useCallback(() => {
    setFiltros({ limite: 100, pagina: 1, ordenar_por: 'hor_saida', ordem: 'ASC' });
  }, []);

  const aplicarFiltros = useCallback(() => {
    buscarControleHorarios();
  }, [buscarControleHorarios]);

  const aplicarFiltroRapido = useCallback((tipo: 'editados' | 'nao_editados' | 'todos') => {
    const user = obterUsuarioAtual();
    if (tipo === 'editados' && user.email) {
      setFiltros((prev) => ({ ...prev, editado_por_usuario_email: user.email, apenas_editadas: true }));
    } else {
      setFiltros((prev) => ({ ...prev, editado_por_usuario_email: undefined, apenas_editadas: undefined }));
    }
  }, []);

  const contarAlteracoesPendentes = useCallback(() => {
    const origById = new Map(controleHorariosOriginais.map((o) => [o.id, o]));
    return controleHorarios.filter((item) => {
      const original = origById.get(item.id);
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
  }, [controleHorarios, controleHorariosOriginais]);

  useEffect(() => {
    (async () => {
      await Promise.all([verificarStatusDados(), buscarOpcoesFiltros()]);
      await buscarControleHorarios();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataReferencia]);

  // Atualiza filtros de "editados por mim" no backend quando statusEdicaoLocal muda
  useEffect(() => {
    const u = obterUsuarioAtual();
    if (statusEdicaoLocal === 'editados' && u?.email) {
      setFiltros((prev) => ({ ...prev, editado_por_usuario_email: u.email, apenas_editadas: true }));
    } else {
      setFiltros((prev) => {
        const { editado_por_usuario_email, apenas_editadas, ...rest } = prev as any;
        return { ...rest } as any;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusEdicaoLocal]);

  // Deriva listas complementares (locais, sentidos) a partir dos dados carregados
  useEffect(() => {
    // Apenas garantir sentidos default sem sobrescrever locais já derivados do dataset completo
    setOpcoesFiltros((prev) => ({
      ...prev,
      sentidos: prev.sentidos && prev.sentidos.length > 0 ? prev.sentidos : ['IDA', 'VOLTA', 'CIRCULAR'],
    }));
  }, [controleHorarios]);

  const controleHorariosFiltrados = useMemo(() => {
    return controleHorarios.filter((it) => {
      const code = (it as any).codigoLinha ?? (it as any).codigo_linha ?? '';
      const isNumericLine = /^\d+$/.test(String(code));
      if (!isNumericLine) return false;
      const servStr = (it as any).cod_servico_numero;
      const servNum = servStr ? parseInt(servStr, 10) : NaN;
      if (Number.isFinite(servNum) && servNum > 100) return false;
      if (tipoLocal && String((it as any).flg_tipo || '').toUpperCase() !== tipoLocal) return false;
      if (statusEdicaoLocal === 'nao_editados' && !!(it as any).editado_por_nome) return false;
      return true;
    });
  }, [controleHorarios]);

  return {
    // Estados
    dataReferencia, setDataReferencia,
    controleHorarios: controleHorariosFiltrados,
    controleHorariosOriginais,
    loading, error,
    temAlteracoesPendentes,
    filtros, setFiltros,
    opcoesFiltros, estatisticas, statusDados,

    // Ações
    buscarControleHorarios,
    verificarStatusDados,
    buscarOpcoesFiltros,
    salvarTodasAlteracoes,
    descartarAlteracoes,
    sincronizarControleHorarios,
    handleInputChange,
    limparFiltros,
    aplicarFiltros,
    aplicarFiltroRapido,
    contarAlteracoesPendentes,
    tipoLocal, setTipoLocal,
    statusEdicaoLocal, setStatusEdicaoLocal,
  } as const;
};
