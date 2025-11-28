﻿import { useCallback, useEffect, useMemo, useState } from 'react';
import { controleHorariosService } from '../../../services/controleHorariosService';
import { isAtLeast, UserRole, canEditControleHorarios } from '../../../types';
import {
  ControleHorarioItem,
  FiltrosControleHorarios,
  OpcoesControleHorariosDto,
  StatusControleHorariosDto,
  EstatisticasControleHorariosDto,
  UpdateMultipleControleHorariosDto,
} from '../../../types/controle-horarios.types';
import { toast } from 'react-toastify';

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
    } catch { }
    return { id: '1', nome: 'Usuário', email: 'usuario@exemplo.com', perfil: 'OPERADOR' };
  };

  const [dataReferencia, setDataReferencia] = useState<string>(() => {
    const usuario = obterUsuarioAtual();
    const savedDataReferencia = localStorage.getItem(`filtros_controle_horarios_${usuario.id}_dataReferencia`);
    return savedDataReferencia || new Date().toISOString().split('T')[0];
  });
  const [controleHorarios, setControleHorarios] = useState<ControleHorarioItem[]>([]);
  const [controleHorariosOriginais, setControleHorariosOriginais] = useState<ControleHorarioItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [temAlteracoesPendentes, setTemAlteracoesPendentes] = useState(false);

  const [filtros, setFiltros] = useState<FiltrosControleHorarios>(() => {
    const usuario = obterUsuarioAtual();
    const savedFiltros = localStorage.getItem(`filtros_controle_horarios_${usuario.id}_filtros`);
    if (savedFiltros) {
      try {
        return JSON.parse(savedFiltros);
      } catch (e) {
        console.error("Failed to parse saved filters from localStorage", e);
      }
    }
    const initialLimit = window.innerWidth <= 1208 ? 8 : 50;
    // Perfis de leitura: por padrão, apenas viagens editadas
    const roleLower = String(usuario.perfil || '').toLowerCase();
    const isViewer = [
      'operador', 'encarregado', 'pcqc', 'dacn', 'operador_cco', 'analista', 'gerente', 'diretor', 'instrutores', 'administrador'
    ].includes(roleLower);
    return {
      limite: initialLimit,
      pagina: 1,
      ...(isViewer ? { apenas_editadas: true } : {}),
    } as FiltrosControleHorarios;
  });

  // Filtros locais (não enviados ao backend)
  const [tipoLocal, setTipoLocal] = useState<'R' | 'S' | undefined>(() => {
    const usuario = obterUsuarioAtual();
    const savedTipoLocal = localStorage.getItem(`filtros_controle_horarios_${usuario.id}_tipoLocal`);
    return savedTipoLocal === 'R' || savedTipoLocal === 'S' ? savedTipoLocal : undefined;
  });
  const [statusEdicaoLocal, setStatusEdicaoLocal] = useState<'todos' | 'minhas_edicoes' | 'nao_editados' | 'apenas_editadas'>(() => {
    const usuario = obterUsuarioAtual();
    const savedStatusEdicaoLocal = localStorage.getItem(`filtros_controle_horarios_${usuario.id}_statusEdicaoLocal`);
    if (savedStatusEdicaoLocal === 'minhas_edicoes' || savedStatusEdicaoLocal === 'nao_editados' || savedStatusEdicaoLocal === 'apenas_editadas') {
      return savedStatusEdicaoLocal;
    }
    return 'todos';
  });

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
      nomeMotoristaGlobus: r.nome_motorista,
      crachaMotoristaGlobus: r.cracha_motorista,
      nomeCobradorGlobus: r.nome_cobrador,
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
      if (!reqFilters.editado_por_usuario_email && statusEdicaoLocal === 'minhas_edicoes') {
        const u = obterUsuarioAtual();
        if (u?.email) {
          const normalizedEmail = u.email.toString().trim().toLowerCase();
          (reqFilters as any).editado_por_usuario_email = normalizedEmail;
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
    } catch { }
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
    } catch { }
  }, [dataReferencia]);

  const salvarTodasAlteracoes = useCallback(async () => {
    const usuarioAtual = obterUsuarioAtual();
    const getJwtClaim = (key: string): string => { try { const t = localStorage.getItem('token'); if (!t) return ''; const payload = JSON.parse(atob((t.split('.')[1] || ''))); return (payload[key] || '').toString(); } catch { return ''; } };
    const roleNorm = (getJwtClaim('role') || getJwtClaim('perfil') || usuarioAtual.perfil || '').toString().toLowerCase() as UserRole;

    // Diff originals vs current
    const origById = new Map(controleHorariosOriginais.map((o) => [o.id, o]));

    // Determine changed fields per item
    const propagaveisChanged: Array<{ id: string; prefixo_veiculo?: string; motorista_substituto_nome?: string; motorista_substituto_cracha?: string; cobrador_substituto_nome?: string; cobrador_substituto_cracha?: string; observacoes_edicao?: string; }> = [];
    const ajustesChanged: Array<{ id: string; de_acordo?: boolean; hor_saida_ajustada?: string; hor_chegada_ajustada?: string; atraso_motivo?: string; atraso_observacao?: string; }> = [];

    for (const item of controleHorarios) {
      const original = origById.get(item.id);
      if (!original) continue;

      const propPayload: any = {};
      const adjPayload: any = {};

      if (item.numeroCarro !== original.numeroCarro) propPayload.prefixo_veiculo = item.numeroCarro?.trim() || '';
      if (item.nomeMotoristaEditado !== original.nomeMotoristaEditado) propPayload.motorista_substituto_nome = item.nomeMotoristaEditado?.trim() || '';
      if (item.crachaMotoristaEditado !== original.crachaMotoristaEditado) propPayload.motorista_substituto_cracha = item.crachaMotoristaEditado?.trim() || '';
      if (item.nomeCobradorEditado !== original.nomeCobradorEditado) propPayload.cobrador_substituto_nome = item.nomeCobradorEditado?.trim() || '';
      if (item.crachaCobradorEditado !== original.crachaCobradorEditado) propPayload.cobrador_substituto_cracha = item.crachaCobradorEditado?.trim() || '';
      if (item.observacoes !== original.observacoes) propPayload.observacoes_edicao = item.observacoes?.trim() || '';

      if ((item as any).de_acordo !== (original as any).de_acordo) adjPayload.de_acordo = (item as any).de_acordo;
      if (String((item as any).hor_saida_ajustada || '') !== String((original as any).hor_saida_ajustada || '')) adjPayload.hor_saida_ajustada = (item as any).hor_saida_ajustada || '';
      if (String((item as any).hor_chegada_ajustada || '') !== String((original as any).hor_chegada_ajustada || '')) adjPayload.hor_chegada_ajustada = (item as any).hor_chegada_ajustada || '';
      if ((item as any).atraso_motivo !== (original as any).atraso_motivo) {
        const allowedMotivos = ['ENGARRAFAMENTO', 'ACIDENTE', 'QUEBRA_OU_DEFEITO', 'DIVERSOS'];
        const motivo = String((item as any).atraso_motivo || '').toUpperCase();
        if (allowedMotivos.includes(motivo)) {
          adjPayload.atraso_motivo = motivo;
        }
      }
      if ((item as any).atraso_observacao !== (original as any).atraso_observacao) adjPayload.atraso_observacao = (item as any).atraso_observacao || '';

      if (Object.keys(propPayload).length > 0) propagaveisChanged.push({ id: item.id, ...propPayload });
      if (Object.keys(adjPayload).length > 0) ajustesChanged.push({ id: item.id, ...adjPayload });
    }

    if (propagaveisChanged.length === 0 && ajustesChanged.length === 0) return;

    try {
      setLoading(true);

      // 1) Apply propagáveis via batch only if user has permission
      if (propagaveisChanged.length > 0) {
        if (!canEditControleHorarios(roleNorm)) {
          setError('Ação não permitida: você não tem permissão para propagar alterações.');
        } else {
          const payload = {
            updates: propagaveisChanged,
            editorNome: usuarioAtual.nome,
            editorEmail: usuarioAtual.email,
          } as any;
          await controleHorariosService.salvarMultiplosControles(payload);
        }
      }

      // 2) Apply ajustes/confirm per record (sem propagação) - apenas Despachante
      for (const adj of ajustesChanged) {
        const { id, ...data } = adj as any;
        if (Object.keys(data).length > 0 && canEditControleHorarios(roleNorm)) {
          await controleHorariosService.atualizarControleHorario(id, data);
        }
      }

      setControleHorariosOriginais(JSON.parse(JSON.stringify(controleHorarios)));
      setTemAlteracoesPendentes(false);
      await Promise.all([buscarControleHorarios(), verificarStatusDados()]);
    } catch (err: any) {
      const msg = String(err?.message || '').toLowerCase();
      if (msg.includes('forbidden')) {
        setError('Ação não permitida: verifique seu perfil para salvar as alterações.');
      } else {
        setError(err.message || 'Erro ao salvar alterações');
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
    // Marcar pendente apenas para campos que exigem ação de salvar em lote (veículo/substituições/observações)
    const fieldsQueExigemSalvar = new Set<keyof ControleHorarioItem>([
      'numeroCarro',
      'nomeMotoristaEditado',
      'crachaMotoristaEditado',
      'nomeCobradorEditado',
      'crachaCobradorEditado',
      'observacoes',
    ] as any);
    if (fieldsQueExigemSalvar.has(field)) {
      setTemAlteracoesPendentes(true);
    }
    setError(null);
  }, []);

  const limparFiltros = useCallback(() => {
    setFiltros({}); // Reset all filters to an empty object
    setTipoLocal(undefined);
    setStatusEdicaoLocal('todos');
  }, [setFiltros, setTipoLocal, setStatusEdicaoLocal]);

  const aplicarFiltros = useCallback(() => {
    buscarControleHorarios();
  }, [buscarControleHorarios]);

  const salvarFiltrosManualmente = useCallback(() => {
    console.log('salvarFiltrosManualmente: Saving filters...', { dataReferencia, filtros, tipoLocal, statusEdicaoLocal });
    const usuario = obterUsuarioAtual();
    localStorage.setItem(`filtros_controle_horarios_${usuario.id}_dataReferencia`, dataReferencia);
    localStorage.setItem(`filtros_controle_horarios_${usuario.id}_filtros`, JSON.stringify(filtros));
    if (tipoLocal) {
      localStorage.setItem(`filtros_controle_horarios_${usuario.id}_tipoLocal`, tipoLocal);
    } else {
      localStorage.removeItem(`filtros_controle_horarios_${usuario.id}_tipoLocal`);
    }
    localStorage.setItem(`filtros_controle_horarios_${usuario.id}_statusEdicaoLocal`, statusEdicaoLocal);
    toast.success('Filtros salvos com sucesso!');
  }, [dataReferencia, filtros, tipoLocal, statusEdicaoLocal]);

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

  // Centraliza a lógica de filtro de edição
  useEffect(() => {
    const u = obterUsuarioAtual();
    const getJwtEmail = (() => { try { const t = localStorage.getItem('token'); if (!t) return ''; const payload = JSON.parse(atob((t.split('.')[1] || ''))); return (payload.email || payload.sub || '').toString(); } catch { return ''; } })();
    const email = getJwtEmail || u?.email;

    setFiltros((prev) => {
      const newFiltros = { ...prev };

      // Limpa os filtros de edição anteriores para evitar sobreposição
      delete (newFiltros as any).editado_por_usuario_email;
      delete (newFiltros as any).apenas_editadas;
      // Também limpar incluir_historico, caso não seja mais necessário
      delete (newFiltros as any).incluir_historico;

      // Aplica o filtro correto com base no status local
      if (statusEdicaoLocal === 'minhas_edicoes' && email) {
        (newFiltros as any).editado_por_usuario_email = email;
        (newFiltros as any).apenas_editadas = true; // Garante que só traga viagens com edições
        (newFiltros as any).incluir_historico = true;
      } else if (statusEdicaoLocal === 'apenas_editadas') {
        (newFiltros as any).apenas_editadas = true;
        (newFiltros as any).incluir_historico = true;
      }

      return newFiltros;
    });
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
  }, [controleHorarios, tipoLocal, statusEdicaoLocal]);

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
    contarAlteracoesPendentes,
    tipoLocal, setTipoLocal,
    statusEdicaoLocal, setStatusEdicaoLocal,
    salvarFiltrosManualmente,
  } as const;
};


