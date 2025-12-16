import React, { useMemo, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole, canSyncControleHorarios, canEditControleHorarios } from '../../types';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';
import { useControleHorarios } from './hooks/useControleHorarios';
import { FiltersPanel } from './components/FiltersPanel/FiltersPanel';
import { HistoryDrawerList } from './components/HistoryDrawerList/HistoryDrawerList';
import { DataTable } from './components/DataTable';
import { FloatingActionButton } from './components/FloatingActionButton/FloatingActionButton';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Calendar, Maximize2, Minimize2, FileText, Download, Bell, X, Filter } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useFullscreen } from '../../contexts/FullscreenContext';

interface UINotification {
  id: string;
  message: string;
  payload: any;
  read: boolean;
  ts: number;
  change_type?: 'confirmado' | 'atualizado';
}

export const ControleHorariosPage: React.FC = () => {
  const [showFilters, setShowFilters] = useState(false);
  const { isFullscreen, setIsFullscreen } = useFullscreen();
  const [showLinhaMultiSelect, setShowLinhaMultiSelect] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [openConfirmSync, setOpenConfirmSync] = useState(false);
  const [showHistorico, setShowHistorico] = useState(false);

  const [notifications, setNotifications] = useState<UINotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [isHorariosModalOpen, setIsHorariosModalOpen] = useState(false);

  // Notificações UI (badge + painel)
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // Accessibility: allow ESC to exit fullscreen
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    if (isFullscreen) {
      window.addEventListener('keydown', onKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isFullscreen, setIsFullscreen]);

  const {
    dataReferencia,
    setDataReferencia,
    controleHorarios,
    controleHorariosOriginais,
    loading,
    error,
    filtros,
    setFiltros,
    opcoesFiltros,
    statusDados,
    handleInputChange,
    handleServerUpdate,
    commitLocalChanges,
    estatisticas,
    temAlteracoesPendentes,
    contarAlteracoesPendentes,
    salvarTodasAlteracoes,
    descartarAlteracoes,
    sincronizarControleHorarios,
    limparFiltros,
    aplicarFiltros,
    tipoLocal,
    setTipoLocal,
    statusEdicaoLocal,
    setStatusEdicaoLocal,
    salvarFiltrosManualmente,
  } = useControleHorarios();

  const { user, token } = useAuth();
  const isAnalistaOuMais = useMemo(() => {
    const role = user?.role;
    return (
      role === UserRole.ANALISTA ||
      role === UserRole.GERENTE ||
      role === UserRole.DIRETOR ||
      role === UserRole.ADMINISTRADOR
    );
  }, [user]);
  const isAdministrador = useMemo(() => user?.role === UserRole.ADMINISTRADOR, [user]);
  const canSyncCH = useMemo(() => canSyncControleHorarios(user?.role), [user]);
  const canSaveCH = useMemo(() => canEditControleHorarios(user?.role), [user]);

  // SSE: Notificações em tempo real de confirmações
  useEffect(() => {
    try {
      const base = (api as any)?.defaults?.baseURL || '/api';
      const baseStr = String(base);
      // Remove trailing slash
      const baseClean = baseStr.replace(/\/$/, '');
      // Add leading slash only if it's a relative path (doesn't start with http)
      const baseNormalized = baseClean.startsWith('http') ? baseClean : `/${baseClean.replace(/^\/+/, '')}`;
      const linhaSel = Array.isArray(filtros.codigo_linha) && filtros.codigo_linha.length > 0 ? String(filtros.codigo_linha[0]) : '';
      const sentido = (filtros as any)?.sentido_texto || (filtros as any)?.sentido || '';
      const destino = (filtros as any)?.local_destino_linha || '';
      const lastTs = localStorage.getItem('ch_last_event_ts') || new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const qs = new URLSearchParams({ data_referencia: dataReferencia, codigo_linha: linhaSel, sentido_texto: sentido, local_destino_linha: destino, local_origem_viagem: (filtros as any)?.local_origem_viagem || '', cod_servico_numero: (filtros as any)?.cod_servico_numero || '', since: lastTs, token: token || '', viewer_email: (user && (user.email || (user as any).usuarioEmail)) || '' }).toString();
      const url = `${baseNormalized}/controle-horarios-events/stream?${qs}`;
      try {
        // eslint-disable-next-line no-console
        console.log('[SSE][FRONT] Conectando...', {
          url,
          baseClean: baseNormalized,
          data_referencia: dataReferencia,
          codigo_linha: linhaSel,
          sentido_texto: sentido,
          local_destino_linha: destino,
          local_origem_viagem: (filtros as any)?.local_origem_viagem || '',
          cod_servico_numero: (filtros as any)?.cod_servico_numero || '',
          since: lastTs,
          hasToken: Boolean(token),
        });
      } catch { }
      const es = new EventSource(url);

      es.onopen = () => {
        try {
          // eslint-disable-next-line no-console
          console.log('[SSE][FRONT] Conectado. readyState=', es.readyState);
        } catch { }
      };

      es.onmessage = (evt) => {
        try {
          try {
            // eslint-disable-next-line no-console
            console.log('[SSE][FRONT] Mensagem recebida (raw length):', (evt?.data || '').length);
          } catch { }
          const parsed = JSON.parse(evt.data || '{}');
          try {
            // eslint-disable-next-line no-console
            console.log('[SSE][FRONT] Mensagem parseada:', { type: parsed?.type, id: parsed?.data?.id });
          } catch { }
          if (!parsed || !parsed.type) return;
          if (parsed.type === 'confirmado' || parsed.type === 'atualizado') {
            const d = parsed.data || {};
            // Frontend guard: não notificar o próprio autor
            try {
              const me = String((user && (user.email || (user as any)?.usuarioEmail)) || '').trim().toLowerCase();
              const author = String((d && (d.editado_por_email)) || '').trim().toLowerCase();
              if (me && author && me === author) {
                return; // suprime notificação para o próprio autor
              }
            } catch {}
            try {
              const ts = d.created_at || new Date().toISOString();
              localStorage.setItem('ch_last_event_ts', ts);
            } catch { }
            // Atualiza campos pontuais via hook API (sem recarregar tudo)
            try {
              const updates: any = { de_acordo: true };
              if (d.de_acordo_em) updates.de_acordo_em = d.de_acordo_em;
              if (d.prefixo_veiculo) updates.numeroCarro = d.prefixo_veiculo;
              if (d.hor_Saída_ajustada) updates.hor_Saída_ajustada = d.hor_Saída_ajustada;
              if (d.hor_chegada_ajustada) updates.hor_chegada_ajustada = d.hor_chegada_ajustada;
              handleServerUpdate(d.id, updates);
            } catch { }

            // Notificação visual
            try {
              const linhaStr = String(d.codigo_linha || '').trim();
              const srvStr = String(d.cod_servico_numero || '').trim();
              const origemStr = String(d.local_origem_viagem || '').trim();
              const destinoStr = String(d.local_destino_linha || '').trim();
              const tipoMsg = parsed.type === 'atualizado' ? 'Atualização' : 'Confirmação';
              const msg = `${tipoMsg}: linha ${linhaStr} servico ${srvStr} saindo de ${origemStr} > ${destinoStr}`;

              const newNotification: UINotification = {
                id: d.id,
                message: msg,
                payload: d,
                read: false,
                ts: Date.now(),
                change_type: parsed.type
              };

              setNotifications((prev) => {
                const exists = prev.find((n) => n.id === d.id && n.change_type === parsed.type);
                if (exists) return prev;
                return [newNotification, ...prev];
              });
              setUnreadCount((prev) => prev + 1);

              // Toast informativo (sem ação de clique para filtrar)
              toast.info(msg);
              // Badge (incrementa lista de Notificações)
              setNotifications((prev) => {
                const nid = `${d.id || 'sem-id'}:${d.de_acordo_em || Date.now()}`;
                const item: UINotification = { id: nid, message: msg, payload: d, read: false, ts: Date.now() };
                const next = [item, ...prev];
                return next.slice(0, 50);
              });
            } catch { }
          } else {
            try {
              // eslint-disable-next-line no-console
              console.log('[SSE][FRONT] Tipo de mensagem desconhecido:', parsed?.type);
            } catch { }
          }
        } catch (e) {
          try {
            // eslint-disable-next-line no-console
            console.warn('[SSE][FRONT] Falha ao parsear mensagem SSE:', e);
          } catch { }
        }
      };

      es.onerror = (err) => {
        try {
          // eslint-disable-next-line no-console
          console.warn('[SSE][FRONT] Erro no stream:', err, 'readyState=', es.readyState, 'url=', url);
        } catch { }
        try { es.close(); } catch { }
      };
      return () => {
        try {
          // eslint-disable-next-line no-console
          console.log('[SSE][FRONT] Encerrando conexão SSE');
        } catch { }
        try { es.close(); } catch { }
      };
    } catch { return; }
  }, [dataReferencia, JSON.stringify((filtros || {}).codigo_linha || []), (filtros as any)?.sentido_texto, (filtros as any)?.sentido, (filtros as any)?.local_destino_linha, token]);

  // Saved filters quick-select (top bar)
  type SavedFilterQuick = {
    name: string;
    filtros: any;
    tipoLocal?: 'R' | 'S';
    statusEdicaoLocal?: 'todos' | 'minhas_edicoes' | 'nao_editados' | 'apenas_editadas';
    createdAt: number;
  };
  const [savedFiltersQuick, setSavedFiltersQuick] = useState<SavedFilterQuick[]>([]);
  // Agora os Filtros salvos…

  // Carregar Filtros salvos…
  type UserFilterServer = {
    id: string;
    name: string;
    filters?: Record<string, unknown> | null;
    tipoLocal?: 'R' | 'S' | null;
    statusEdicaoLocal?: 'todos' | 'minhas_edicoes' | 'nao_editados' | 'apenas_editadas' | null;
    createdAt?: string;
  };

  const { data: serverSavedFilters, isFetching: loadingSavedFilters } = useQuery({
    queryKey: ['user-filters'],
    queryFn: async () => {
      const res = await api.get<UserFilterServer[]>('/user-filters');
      return res.data;
    },
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!serverSavedFilters) return;
    const mapped: SavedFilterQuick[] = serverSavedFilters.map((sf) => ({
      name: sf.name,
      filtros: (sf.filters || {}) as any,
      tipoLocal: (sf.tipoLocal ?? undefined) as 'R' | 'S' | undefined,
      statusEdicaoLocal: (sf.statusEdicaoLocal ?? undefined) as
        | 'todos'
        | 'minhas_edicoes'
        | 'nao_editados'
        | 'apenas_editadas'
        | undefined,
      createdAt: sf.createdAt ? new Date(sf.createdAt).getTime() : Date.now(),
    }));
    setSavedFiltersQuick(mapped);
  }, [serverSavedFilters]);
  const applySavedFilterQuick = (name: string) => {
    const sf = savedFiltersQuick.find((x) => x.name === name);
    if (!sf) return;
    setFiltros(sf.filtros || {});
    if (setTipoLocal) setTipoLocal(sf.tipoLocal);
    if (setStatusEdicaoLocal && sf.statusEdicaoLocal) setStatusEdicaoLocal(sf.statusEdicaoLocal);
    setTimeout(() => aplicarFiltros(), 0);
  };

  const dayType = useMemo(() => {
    if (!dataReferencia) return '';
    // Parse YYYY-MM-DD string to avoid timezone issues
    const [year, month, day] = dataReferencia.split('-').map(Number);
    // Month is 0-indexed in JavaScript Date constructor
    const d = new Date(year, month - 1, day);
    if (isNaN(d.getTime())) return '';
    const wd = d.getDay(); // getDay() returns 0 for Sunday, 1 for Monday, etc.
    if (wd === 0) return 'DOMINGO';
    if (wd === 6) return 'SÁBADO';
    return 'DIAS ÚTEIS';
  }, [dataReferencia]);

  // Ordenação cronológica considerando virada de dia
  const sortedControleHorarios = useMemo(() => {
    const arr = Array.isArray(controleHorarios) ? [...controleHorarios] : [];
    const parseMinutes = (hhmm?: string) => {
      if (!hhmm) return Number.MAX_SAFE_INTEGER;
      const m = hhmm.match(/^(\d{1,2}):(\d{2})/);
      if (!m) return Number.MAX_SAFE_INTEGER;
      return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
    };
    const mins = arr
      .map((it: any) => parseMinutes(it.horaSaída))
      .filter((n) => Number.isFinite(n)) as number[];
    const minM = mins.length ? Math.min(...mins) : 0;
    const maxM = mins.length ? Math.max(...mins) : 0;
    const crosses = minM <= 240 && maxM >= 1080; // <=04:00 e >=18:00
    const threshold = 240;
    arr.sort((a: any, b: any) => {
      const am = parseMinutes(a.horaSaída);
      const bm = parseMinutes(b.horaSaída);
      const aKey = crosses && am < threshold ? am + 1440 : am;
      const bKey = crosses && bm < threshold ? bm + 1440 : bm;
      return aKey - bKey;
    });
    return arr;
  }, [controleHorarios]);

  const handleExportHtml = () => {
    const safe = (v: string | number | null | undefined) =>
      String(v ?? '').replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]!));
    const items = Array.isArray(sortedControleHorarios) ? sortedControleHorarios : [];

    const logoBase64 = '../assets/logo.png'

    const renderAdjustedTime = (originalTime?: string, adjustedTime?: string) => {
      if (!adjustedTime) {
        return `<td>${safe(originalTime ? new Date(originalTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '')}</td>`;
      }
      const originalFormatted = originalTime ? new Date(originalTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';
      const adjustedFormatted = new Date(adjustedTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      return `<td class="cell-adjusted"><div class="original">${originalFormatted}</div><div class="adjusted">${adjustedFormatted}</div></td>`;
    };

    const renderPerson = (originalName?: string, substitutedName?: string, originalCrachá?: string, substitutedCrachá?: string) => {
      if (!substitutedName && !substitutedCrachá) {
        return `<td><div>${safe(originalName)}</div><div class="Crachá">${safe(originalCrachá)}</div></td>`;
      }
      return `<td class="cell-substitute"><div class="original">${safe(originalName)} (${safe(originalCrachá)})</div><div class="substituted">${safe(substitutedName)} (${safe(substitutedCrachá)})</div></td>`;
    };

    const renderCarro = (originalCarro?: string, editedCarro?: string) => {
      if (!editedCarro || originalCarro === editedCarro) {
        return `<td>${safe(originalCarro)}</td>`;
      }
      return `<td class="cell-substitute"><div class="original">${safe(originalCarro)}</div><div class="substituted">${safe(editedCarro)}</div></td>`;
    }

    const rows = items
      .map((it: any) => {
        const hasAdjust = Boolean(it.hor_Saída_ajustada || it.hor_chegada_ajustada);
        const hasEdits = Boolean(
          it.nomeMotoristaEditado ||
          it.CracháMotoristaEditado ||
          it.nomeCobradorEditado ||
          it.CracháCobradorEditado ||
          (it.prefixo_veiculo_editado && it.prefixo_veiculo_editado !== it.prefixo_veiculo) ||
          hasAdjust
        );
        const rowClass = hasEdits ? 'row-warning' : 'row-ok';

        return `
        <tr class="${rowClass}">
          <td><div>${safe(it.codigoLinha)} - ${safe(it.nomeLinha)}</div><div class="setor">${safe(it.setorPrincipalLinha)}</div></td>
          <td class="center">${safe(it.codservicoNumero ?? it.cod_servico_numero ?? '')}</td>
          ${renderAdjustedTime(it.hor_Saída, it.hor_Saída_ajustada)}
          ${renderAdjustedTime(it.hor_chegada, it.hor_chegada_ajustada)}
          ${renderCarro(it.prefixo_veiculo, it.prefixo_veiculo_editado)}
          ${renderPerson(it.nome_motorista, it.nome_motorista_editado, it.Crachá_motorista, it.Crachá_motorista_editado)}
          ${renderPerson(it.nome_cobrador, it.nome_cobrador_editado, it.Crachá_cobrador, it.Crachá_cobrador_editado)}
          <td>${safe(it.editado_por_nome || '')}</td>
          <td>${safe(it.observacao || '')}</td>
        </tr>`;
      })
      .join('');

    const filtrosAtivos = Object.entries((filtros as Record<string, unknown>) || {})
      .filter(([, v]) => v !== undefined && v !== null && String(v) !== '')
      .map(([k, v]) => `<span class="tag">${safe(k)}: <b>${safe(String(v))}</b></span>`)
      .join('');

    const html = `<!doctype html><html lang="pt-BR"><head>
  <meta charset="utf-8" />
  <title>Relatório - Controle de Horários</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');
    body { font-family: 'Roboto', system-ui, -apple-system, Segoe UI, sans-serif; color: #333; margin: 0; background-color: #f4f4f9; }
    .container { max-width: 1600px; margin: 24px auto; padding: 24px; background-color: #fff; box-shadow: 0 4px 8px rgba(0,0,0,0.1); border-radius: 8px; }
    .report-header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #fbcc2c; padding-bottom: 16px; margin-bottom: 16px; }
    .report-header .title-block { text-align: right; }
    h1 { margin: 0 0 4px; color: #1a1a1a; font-size: 28px; }
    .muted { color: #333; font-size: 14px; }
    .tags-container { margin: 20px 0; padding: 12px; background-color: #f0f0f0; border-radius: 6px; }
    .tags { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
    .tags b { font-weight: 500; }
    .tag { padding: 5px 12px; border-radius: 15px; font-size: 12px; background-color: #e0e0e0; color: #333; }
    .tag b { color: #000; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #c0c0c0; padding: 10px 12px; text-align: left; vertical-align: middle; }
    thead th { background: #495057; color: #fff; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
    tbody tr:nth-child(even) { background-color: #f0f0f0; }
    tbody tr:hover { background-color: #e9ecef; }
    tfoot td { background: #e9ecef; font-weight: 700; }
    .row-warning { background-color: #fff3cd; }
    .cell-substitute .original { text-decoration: line-through; color: #dc3545; }
    .cell-substitute .substituted { font-weight: bold; color: #ffc107; }
    .cell-adjusted .original { text-decoration: line-through; color: #6c757d; }
    .cell-adjusted .adjusted { font-weight: bold; color: #28a745; }
    .center { text-align: center; }
    .Crachá, .setor { font-size: 0.9em; color: #495057; }
    @media print { 
      body { margin: 0; font-size: 10px; } 
      .container { box-shadow: none; margin: 0; padding: 10px; border-radius: 0; }
      .no-print { display: none; } 
      th, td { padding: 6px 8px; }
    }
  </style>
  </head>
  <body>
    <div class="container">
      <div class="report-header">
        <div class="title-block">
          <h1>Relatório de Controle de Horários</h1>
          <div class="muted">Data de referência: <b>${safe(dataReferencia)}</b> • Tipo do dia: <b>${safe(dayType)}</b></div>
          <div class="muted">Gerado por: <b>${safe(user?.email)}</b></div>
        </div>
      </div>
      <div class="tags-container">
        <div class="tags"><b>Filtros Aplicados:</b> ${filtrosAtivos || '<span class="tag">Nenhum</span>'}</div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Linha</th>
            <th>servico</th>
            <th>Saída</th>
            <th>Chegada</th>
            <th>Carro</th>
            <th>Motorista</th>
            <th>Cobrador</th>
            <th>Editado por</th>
            <th>Observações</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr><td colspan="9">Total de registros: ${Array.isArray(controleHorarios) ? controleHorarios.length : 0}</td></tr>
        </tfoot>
      </table>
    </div>
  </body></html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_controle_horarios_${dataReferencia || 'data'}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    if (!isAnalistaOuMais) {
      alert('Você não tem permissão para exportar para Excel.');
      return;
    }

    const items = Array.isArray(sortedControleHorarios) ? sortedControleHorarios : [];

    const header = [
      'Setor', 'Linha', 'servico', 'Saída', 'Chegada', 'Saída Ajustada', 'Chegada Ajustada', 'Carro',
      'Motorista', 'Cobrador', 'Observações'
    ];

    const data = items.map((it: any) => {
      const fmtAdj = (v?: string) => {
        if (!v) return '';
        try { const d = new Date(v); if (isNaN(d.getTime())) return ''; return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); } catch { return ''; }
      };

      const motorista = (it.nome_motorista_editado && it.nome_motorista_editado !== it.nome_motorista) || (it.Crachá_motorista_editado && it.Crachá_motorista_editado !== it.Crachá_motorista)
        ? `DE: ${it.nome_motorista} (${it.Crachá_motorista}) PARA: ${it.nome_motorista_editado} (${it.Crachá_motorista_editado})`
        : `${it.nome_motorista} (${it.Crachá_motorista})`;

      const cobrador = (it.nome_cobrador_editado && it.nome_cobrador_editado !== it.nome_cobrador) || (it.Crachá_cobrador_editado && it.Crachá_cobrador_editado !== it.Crachá_cobrador)
        ? `DE: ${it.nome_cobrador} (${it.Crachá_cobrador}) PARA: ${it.nome_cobrador_editado} (${it.Crachá_cobrador_editado})`
        : (it.nome_cobrador ? `${it.nome_cobrador} (${it.Crachá_cobrador})` : 'SEM COBRADOR');

      const carro = (it.prefixo_veiculo_editado && it.prefixo_veiculo_editado !== it.prefixo_veiculo)
        ? `DE: ${it.prefixo_veiculo} PARA: ${it.prefixo_veiculo_editado}`
        : it.prefixo_veiculo;

      return [
        it.setorPrincipalLinha,
        `${it.codigoLinha} - ${it.nomeLinha}`,
        it.codservicoNumero ?? it.cod_servico_numero ?? '',
        it.horaSaída,
        it.horaChegada,
        fmtAdj(it.hor_Saída_ajustada as any),
        fmtAdj(it.hor_chegada_ajustada as any),
        carro,
        motorista,
        cobrador,
        it.observacao || ''
      ];
    });

    const ws_data = [
      ['Relatório - Controle de Horários'],
      [`Data de referência: ${dataReferencia || ''}`],
      [`Tipo do dia: ${dayType}`],
      [`Usuário: ${user?.email || ''}`],
      [`Total de viagens: ${items.length}`],
      [], // Empty row for separation
      ['Filtros Aplicados:'],
      ...Object.entries((filtros as Record<string, unknown>) || {})
        .filter(([, v]) => v !== undefined && v !== null && String(v) !== '')
        .map(([k, v]) => [`${k}: ${String(v)}`]),
      [], // Empty row for separation
      header,
      ...data,
    ];

    const ws = XLSX.utils.aoa_to_sheet(ws_data);

    // Apply some basic styling
    // Header row style
    const headerRowIndex = ws_data.findIndex(row => row[0] === 'Setor');
    if (headerRowIndex !== -1) {
      for (let C = 0; C < header.length; ++C) {
        const cellref = XLSX.utils.encode_cell({ r: headerRowIndex, c: C });
        if (!ws[cellref]) ws[cellref] = {};
        ws[cellref].s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "FBCC2C" } }, // Primary Yellow
          alignment: { horizontal: "center" }
        };
      }
    }

    // Title and metadata styling
    ws['A1'].s = { font: { sz: 16, bold: true, color: { rgb: "1A1A1A" } } }; // Dark Gray
    ws['A2'].s = { font: { bold: true, color: { rgb: "666666" } } }; // Medium Gray
    ws['A3'].s = { font: { bold: true, color: { rgb: "666666" } } };
    ws['A4'].s = { font: { bold: true, color: { rgb: "666666" } } };
    ws['A5'].s = { font: { bold: true, color: { rgb: "666666" } } };
    ws['A7'].s = { font: { bold: true, color: { rgb: "1A1A1A" } } }; // Filters Applied

    // Auto-width columns
    const max_width = ws_data.reduce((w: number[], r: any[]) => r.map((cell: any, i: number) => Math.max(w[i] || 0, String(cell).length)), []);
    ws['!cols'] = max_width.map((w: number) => ({ wch: w + 2 })); // Add a little padding

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Controle de Horários');
    XLSX.writeFile(wb, `relatorio_controle_horarios_${dataReferencia || 'data'}.xlsx`);
  };

  //<Button variant="outline" onClick={() => setShowReport(true)} className="border-gray-500 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-white dark:bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 font-medium">
  //<FileText className="h-4 w-4 mr-2" /> Gerar Relatório
  //</Button>

  return (
    <div className="w-full min-h-screen bg-gray-100 dark:bg-gradient-to-br dark:from-black dark:via-neutral-900 dark:to-yellow-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto">
        <Card className="relative border border-gray-300 dark:border-yellow-400/20 bg-white dark:bg-gray-900 shadow-md dark:shadow-none">
          <CardHeader className="pb-4 border-b border-gray-400 dark:border-yellow-400/10">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Controle de Horários</h1>
                <p className="mt-1 text-sm text-gray-700 dark:text-gray-400">Gerencie e edite os horários das viagens</p>
              </div>
              {/* Notification Bell in page header (near theme toggle) */}
              <button
                type="button"
                onClick={() => {
                  setIsNotifOpen(true);
                  if (unreadCount > 0) {
                    setNotifications((prev) => prev.map(n => ({ ...n, read: true })));
                    setUnreadCount(0);
                  }
                }}
                className="relative inline-flex items-center justify-center w-10 h-10 rounded-md border border-gray-500 dark:border-gray-700 bg-white dark:bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors mt-1"
                aria-label="Notificações"
                title="Notificações"
              >
                <Bell className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-3">
                <Label htmlFor="date-picker" className="text-gray-800 dark:text-gray-300 font-medium">Data de referência</Label>
                <div className="relative w-full sm:w-56">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 dark:text-gray-400" />
                  <Input
                    id="date-picker"
                    type="date"
                    value={dataReferencia}
                    onChange={(e) => setDataReferencia(e.target.value)}
                    className="pl-10 bg-white dark:bg-gray-800 border-gray-500 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:border-yellow-500 focus:ring-yellow-500"
                  />
                </div>

              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => setShowFilters((v) => !v)} className="border-gray-500 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-white dark:bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 font-medium">
                  Filtros
                </Button>
                <Button variant="outline" onClick={() => { limparFiltros(); aplicarFiltros(); }} className="border-gray-500 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-white dark:bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 font-medium">
                  Limpar Filtros
                </Button>
                <select
                  className="border border-gray-500 dark:border-gray-700 bg-white dark:bg-transparent rounded-md px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent min-w-[220px]"
                  onChange={(e) => e.target.value && applySavedFilterQuick(e.target.value)}
                  defaultValue=""
                  disabled={loadingSavedFilters || savedFiltersQuick.length === 0}
                  aria-busy={loadingSavedFilters}
                >
                  <option value="" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                    {loadingSavedFilters ? 'Carregando filtros…' : 'Filtros salvos…'}
                  </option>
                  {!loadingSavedFilters && savedFiltersQuick.map((sf) => (
                    <option key={sf.name} value={sf.name} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">{sf.name}</option>
                  ))}
                </select>

                <Button variant="outline" onClick={() => setIsFullscreen((v) => !v)} className="border-gray-500 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-white dark:bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 font-medium">
                  {isFullscreen ? (
                    <>
                      <Minimize2 className="h-4 w-4 mr-2" /> Sair da Tela Cheia
                    </>
                  ) : (
                    <>
                      <Maximize2 className="h-4 w-4 mr-2" /> Tela Cheia
                    </>
                  )}
                </Button>
                {isAdministrador && ( // Conditionally render for ADMINISTRADOR
                  <Button variant="outline" onClick={() => setOpenConfirmSync(true)} disabled={loading} className="border-gray-500 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-white dark:bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 font-medium">
                    Sincronizar
                  </Button>
                )}
              </div>

              {/* Notification Bell moved to header */}
            </div>

              {isFullscreen && (
                <button
                  type="button"
                  onClick={() => {
                    setIsNotifOpen(true);
                    if (unreadCount > 0) {
                      setNotifications((prev) => prev.map(n => ({ ...n, read: true })));
                      setUnreadCount(0);
                    }
                  }}
                  className="fixed right-4 top-4 z-[80] inline-flex items-center justify-center w-10 h-10 rounded-md border border-gray-500 dark:border-gray-700 bg-white/90 dark:bg-black/40 backdrop-blur hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label="Notificações"
                >
                  <Bell className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
              )}
          </CardContent>
        </Card>

        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-800 dark:text-red-300 px-4 py-3 rounded-lg mt-4 font-medium" role="alert">
            {error}
          </div>
        )}

        {showFilters && (
          <div className={isFullscreen ? "fixed right-4 top-16 z-[60] w-[calc(100%-2rem)] sm:w-[720px]" : "mb-4"}>
            <FiltersPanel
              showFilters={showFilters}
              onClose={() => setShowFilters(false)}
              filtros={filtros}
              setFiltros={setFiltros}
              opcoesFiltros={opcoesFiltros}
              showLinhaMultiSelect={showLinhaMultiSelect}
              setShowLinhaMultiSelect={setShowLinhaMultiSelect}
              onLimparFiltros={limparFiltros}
              onAplicarFiltros={aplicarFiltros}
              onMostrarHistorico={() => setShowHistorico(true)}
              tipoLocal={tipoLocal}
              setTipoLocal={setTipoLocal}
              statusEdicaoLocal={statusEdicaoLocal}
              setStatusEdicaoLocal={setStatusEdicaoLocal}
            />
          </div>
        )}

        {Array.isArray(controleHorarios) && controleHorarios.length > 0 ? (
          <div>
            {/* Botão de notificação + badge */}
            {/* Sino e badge movidos para o DataTable (ao lado de ESCALA TIPO DIA) */}

            {/* Painel de Notificações */}
            {isNotifOpen && (
              <div className="fixed right-4 top-16 z-[70] w-96 max-w-[95vw] rounded-lg border border-gray-300 dark:border-gray-700 shadow-2xl bg-white dark:bg-gray-900">
                <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                  <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">Notificações</div>
                  <button
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => setIsNotifOpen(false)}
                    aria-label="Fechar Notificações"
                  >
                    <X className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                  </button>
                </div>
                <div className="max-h-[60vh] overflow-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-sm text-gray-600 dark:text-gray-400">Sem Notificações</div>
                  ) : (
                    notifications.map((n) => {
                      const d: any = n.payload || {};
                      const linhaStr = String(d.codigo_linha || '').trim();
                      const srvStr = String(d.cod_servico_numero || '').trim();
                      const origemStr = String(d.local_origem_viagem || '').trim();
                      const destinoStr = String(d.local_destino_linha || '').trim();
                      const veiculoStr = d.prefixo_veiculo ? ` • Carro: ${d.prefixo_veiculo}` : '';
                      const motoristaStr = d.Crachá_motorista ? ` • Motorista: ${d.Crachá_motorista}` : '';

                      return (
  <button
    key={n.id}
    type="button"
    onClick={() => {
      setIsNotifOpen(false);
      const linhaStr = String((n.payload || {}).codigo_linha || '').trim();
      const d: any = n.payload || {};
      const srvStr = String(d.cod_servico_numero || d.cod_servico_numero || '').trim();
      const veiculo = String(d.prefixo_veiculo || '').trim();
      setFiltros((prev: any) => ({
        ...prev,
        codigo_linha: linhaStr ? [linhaStr] : prev.codigo_linha,
        cod_servico_numero: srvStr || prev.cod_servico_numero,
        sentido_texto: (d as any).sentido_texto || (d as any).sentido || prev.sentido_texto,
        numeroCarro: veiculo || prev.numeroCarro,
      }));
      setTimeout(() => aplicarFiltros(), 0);
    }}
    className={`w-full text-left px-4 py-3 border-b border-gray-200 dark:border-gray-800 transition-colors ${n.read ? 'bg-transparent' : 'bg-yellow-50 dark:bg-yellow-900/10 hover:bg-yellow-100 dark:hover:bg-yellow-900/20'}`}
  >
    <div className="text-sm text-gray-800 dark:text-gray-200 font-semibold mb-1">
      {n.message}
    </div>
    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1 flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">{String((n.payload||{}).local_origem_viagem||"") || "Origem"}</span>
      <span className="text-gray-500">-&gt;</span>
      <span className="inline-flex items-center px-2 py-0.5 rounded bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300">{String((n.payload||{}).local_destino_linha||"") || "Destino"}</span>
      <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-200 border border-gray-200 dark:border-gray-700">Linha {String((n.payload||{}).codigo_linha||"")} • servico {String(((n.payload||{}).cod_servico_numero||(n.payload||{}).cod_servico_numero)||"")}</span>
      {String((n.payload||{}).prefixo_veiculo||"") && (<span className="inline-flex items-center px-2 py-0.5 rounded bg-yellow-200 text-yellow-900 dark:bg-yellow-600/30 dark:text-yellow-300 font-bold">Carro: {String((n.payload||{}).prefixo_veiculo)}</span>)}
    </div>
    </button>
                    );
                    })
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
                    <button
                      className="text-xs text-gray-600 dark:text-gray-400 hover:underline"
                      onClick={() => setNotifications((prev) => prev.map(n => ({ ...n, read: true })))}
                    >
                      Marcar todas como lidas
                    </button>
                    <button
                      className="text-xs text-red-600 dark:text-red-400 hover:underline"
                      onClick={() => setNotifications([])}
                    >
                      Limpar
                    </button>
                  </div>
                )}
              </div>
            )}
            {false && isFullscreen && (
              <div className="fixed top-4 right-4 z-[60]">
                <Button
                  variant="outline"
                  onClick={() => setIsFullscreen(false)}
                  className="border-gray-500 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-white dark:bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800"
                  aria-label="Sair da tela cheia"
                >
                  <Minimize2 className="h-4 w-4 mr-2" /> Sair da Tela Cheia
                </Button>
              </div>
            )}
            {false && isFullscreen && (
              <div className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur border-b border-gray-400 dark:border-yellow-400/20 px-4 py-3 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-800 dark:text-gray-700 font-medium">
                    <b>{controleHorarios.length}</b> viagens • Data: <b>{dataReferencia}</b> • <b>{dayType}</b>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => setShowFilters((v) => !v)} className="border-gray-500 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-white dark:bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800">
                      Filtros
                    </Button>
                    <Button variant="outline" onClick={() => { limparFiltros(); aplicarFiltros(); }} className="border-gray-500 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-white dark:bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800">
                      Limpar Filtros
                    </Button>
                    <Button variant="outline" onClick={handleExportHtml} className="border-gray-500 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-white dark:bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800">
                      <Download className="h-4 w-4 mr-2" /> Gerar Relatório
                    </Button>
                    <Button variant="outline" onClick={() => setIsFullscreen(false)} className="border-gray-500 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-white dark:bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800">
                      <Minimize2 className="h-4 w-4 mr-2" /> Sair da Tela Cheia
                    </Button>
                  </div>
                </div>

                {/* Saved Filters Quick Select */}
                {loadingSavedFilters ? (
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-400 dark:border-gray-700">
                    <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Carregando filtros…</span>
                  </div>
                ) : (savedFiltersQuick.length > 0 && (
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-400 dark:border-gray-700">
                    <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Filtros salvos…</span>
                    <div className="flex flex-wrap gap-2">
                      {savedFiltersQuick.map((sf) => (
                        <button
                          key={sf.name}
                          onClick={() => applySavedFilterQuick(sf.name)}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border border-yellow-500/50 bg-yellow-100 dark:bg-yellow-400/10 text-yellow-800 dark:text-yellow-200 hover:bg-yellow-200 dark:hover:bg-yellow-400/20 transition-colors"
                          title={`Aplicar filtro: ${sf.name}`}
                        >
                          {sf.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}


            <div className={isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900 p-4 overflow-auto' : ''}>
              {isFullscreen && (
                <div className="sticky top-0 z-[55] bg-white/95 dark:bg-gray-900/95 backdrop-blur border-b border-gray-400 dark:border-yellow-400/20 px-4 py-3 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] items-center gap-2 mb-2">
                    <div className="text-sm text-gray-800 dark:text-gray-300 font-medium">
                      <b>{controleHorarios.length}</b> viagens • Data: <b>{dataReferencia}</b> • <b>{dayType}</b>
                    </div>
                    <div className="flex flex-wrap justify-end items-center gap-2 w-full md:w-auto">
                      <Button
                        variant="outline"
                        onClick={() => setShowFilters((v) => !v)}
                        className="border-gray-500 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-white dark:bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800"
                        aria-label="Abrir filtros"
                      >
                        <Filter className="h-4 w-4 md:mr-2" />
                        <span className="hidden md:inline">Filtros</span>
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => { limparFiltros(); aplicarFiltros(); }}
                        className="border-gray-500 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-white dark:bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800"
                        aria-label="Limpar filtros"
                      >
                        <X className="h-4 w-4 md:mr-2" />
                        <span className="hidden md:inline">Limpar Filtros</span>
                      </Button>
                      <select
                        className="border border-gray-500 dark:border-gray-700 bg-white dark:bg-transparent rounded-md px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent w-full md:w-[220px] flex-1 md:flex-none"
                        onChange={(e) => e.target.value && applySavedFilterQuick(e.target.value)}
                        defaultValue=""
                        aria-label="Filtros salvos…"
                        title="Filtros salvos…"
                        disabled={loadingSavedFilters || savedFiltersQuick.length === 0}
                        aria-busy={loadingSavedFilters}
                      >
                        <option value="" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                          {loadingSavedFilters ? 'Carregando filtros…' : 'Filtros salvos…'}
                        </option>
                        {!loadingSavedFilters && savedFiltersQuick.map((sf) => (
                          <option key={sf.name} value={sf.name} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">{sf.name}</option>
                        ))}
                      </select>

                      <Button
                        variant="outline"
                        onClick={() => setIsFullscreen(false)}
                        className="border-gray-500 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-white dark:bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800"
                        aria-label="Sair da tela cheia"
                      >
                        <Minimize2 className="h-4 w-4 md:mr-2" />
                        <span className="hidden md:inline">Sair da Tela Cheia</span>
                      </Button>
                      {/* Notification Bell in fullscreen mode */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsNotifOpen(true);
                          if (unreadCount > 0) {
                            setNotifications((prev) => prev.map(n => ({ ...n, read: true })));
                            setUnreadCount(0);
                          }
                        }}
                        className="relative inline-flex items-center justify-center w-10 h-10 rounded-md border border-gray-500 dark:border-gray-700 bg-white dark:bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        aria-label="Notificações"
                      >
                        <Bell className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                        {unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center">
                            {unreadCount}
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                  {loadingSavedFilters ? (
                    <div className="grid grid-cols-1 items-start gap-2 pt-2 border-t border-gray-400 dark:border-yellow-400/20 dark:border-gray-700">
                      <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Carregando filtros…</span>
                    </div>
                  ) : (savedFiltersQuick.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] items-start gap-2 pt-2 border-t border-gray-400 dark:border-yellow-400/20 dark:border-gray-700">
                      <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Filtros salvos…</span>
                      <div className="flex flex-wrap gap-2">
                        {savedFiltersQuick.map((sf) => (
                          <button
                            key={sf.name}
                            onClick={() => applySavedFilterQuick(sf.name)}
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border border-yellow-500/50 bg-yellow-100 dark:bg-yellow-400/10 text-yellow-800 dark:text-yellow-200 hover:bg-yellow-200 dark:hover:bg-yellow-400/20 transition-colors"
                            title={`Aplicar filtro: ${sf.name}`}
                          >
                            {sf.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <DataTable
                controleHorarios={sortedControleHorarios}
                controleHorariosOriginais={controleHorariosOriginais}
                onInputChange={handleInputChange}
                loading={loading}
                error={error}
                onRetry={aplicarFiltros}
                statusDados={statusDados.data}
                estatisticas={estatisticas}
                temAlteracoesPendentes={temAlteracoesPendentes}
                contarAlteracoesPendentes={contarAlteracoesPendentes}
                canSave={canSaveCH}
                editedByMeActive={Boolean((filtros as any).editado_por_usuario_email)}
                onApplyScaleFilter={({ servico, cracha }: { servico: string; cracha: string; tipo: 'motorista' | 'cobrador' }) => {
                  setFiltros((prev: any) => ({
                    ...prev,
                    cod_servico_numero: servico,
                    cracha_funcionario: cracha,
                    cracha_motorista: undefined,
                    cracha_cobrador: undefined,
                  }));
                  setTimeout(() => aplicarFiltros(), 0);
                }}
                scaleFilterActive={Boolean((filtros as any).cod_servico_numero && (filtros as any).cracha_funcionario)}
                scaleFilterLabel={
                  ((filtros as any).cod_servico_numero && (filtros as any).cracha_funcionario)
                    ? `Servico ${(filtros as any).cod_servico_numero} - Cracha ${(filtros as any).cracha_funcionario}`
                    : null
                }
                onClearScaleFilter={limparFiltros}
                onHorariosModalOpenChange={setIsHorariosModalOpen}
                notificationsUnreadCount={unreadCount}
                onOpenNotifications={() => {
                  setIsNotifOpen(true);
                  setNotifications((prev) => prev.map(n => ({ ...n, read: true })));
                }}
                onCommitChanges={commitLocalChanges}
              />

              {canSaveCH && !isHorariosModalOpen && (
                <FloatingActionButton
                  temAlteracoesPendentes={temAlteracoesPendentes}
                  alteracoesPendentes={contarAlteracoesPendentes()}
                  onDescartarAlteracoes={descartarAlteracoes}
                  onSalvarAlteracoes={salvarTodasAlteracoes}
                  saving={loading}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 space-y-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-800 shadow-sm">
            <p className="text-gray-700 dark:text-gray-400 text-lg">Nenhuma viagem encontrada</p>
          </div>
        )}
        <HistoryDrawerList open={showHistorico} date={dataReferencia} filtros={filtros} onClose={() => setShowHistorico(false)} />

        {/* Relatório - preview simples */}
        {showReport && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur flex items-center justify-center p-4">
            <div className="w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-xl border border-gray-300 dark:border-yellow-400/20 bg-white dark:bg-gray-900 shadow-2xl">
              <div className="sticky top-0 z-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-gray-300 dark:border-yellow-400/20 px-4 py-3 bg-white dark:bg-gray-900">
                <div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">Relatório - Controle de Horários</div>
                  <div className="text-xs text-gray-700 dark:text-gray-400">Data: {dataReferencia} • {dayType} • Registros: {Array.isArray(controleHorarios) ? controleHorarios.length : 0}</div>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                  <Button variant="outline" onClick={handleExportHtml} className="w-full sm:w-auto border-gray-500 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                    <Download className="h-4 w-4 mr-2" /> Gerar Relatório
                  </Button>
                  {isAnalistaOuMais && (
                    <Button variant="outline" onClick={handleExportExcel} className="w-full sm:w-auto border-gray-500 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                      <Download className="h-4 w-4 mr-2" /> Gerar Relatório Excel
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => setShowReport(false)} className="w-full sm:w-auto border-gray-500 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                    Fechar
                  </Button>
                </div>
              </div>
              <div className="overflow-auto p-4">
                <div className="text-sm text-gray-700 dark:text-gray-300 mb-2 font-medium">Filtros aplicados:</div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {Object.entries((filtros as Record<string, unknown>) || {})
                    .filter(([, v]) => v !== undefined && v !== null && String(v) !== '')
                    .map(([k, v]) => (
                      <span key={k} className="inline-flex items-center gap-1 rounded-full border border-yellow-400/30 bg-yellow-100 dark:bg-yellow-400/10 px-3 py-1 text-xs text-yellow-800 dark:text-yellow-200 font-medium">
                        {k}: <b className="text-yellow-900 dark:text-yellow-300">{String(v)}</b>
                      </span>
                    ))}
                </div>
                <div className="overflow-x-auto border border-gray-500 dark:border-gray-700 rounded-lg">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-200 dark:bg-gray-800/60 border-b border-gray-400 dark:border-gray-700">
                        <th className="px-3 py-2 text-left font-bold text-gray-700 dark:text-gray-200">Linha</th>
                        <th className="px-3 py-2 text-left font-bold text-gray-700 dark:text-gray-200">servico</th>
                        <th className="px-3 py-2 text-left font-bold text-gray-700 dark:text-gray-200">Saída</th>
                        <th className="px-3 py-2 text-left font-bold text-gray-700 dark:text-gray-200">Chegada</th>
                        <th className="px-3 py-2 text-left font-bold text-gray-700 dark:text-gray-200">Carro</th>
                        <th className="px-3 py-2 text-left font-bold text-gray-700 dark:text-gray-200">Motorista</th>
                        <th className="px-3 py-2 text-left font-bold text-gray-700 dark:text-gray-200">Cobrador</th>
                        <th className="px-3 py-2 text-left font-bold text-gray-700 dark:text-gray-200">Observações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedControleHorarios.map((it: any) => {
                        const renderAdjustedTime = (originalTime?: string, adjustedTime?: string) => {
                          if (!adjustedTime) {
                            return <span className="text-gray-900 dark:text-gray-100">{originalTime ? new Date(originalTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}</span>;
                          }
                          const originalFormatted = originalTime ? new Date(originalTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';
                          const adjustedFormatted = new Date(adjustedTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                          return (
                            <div className="flex flex-col">
                              <span className="text-gray-500 line-through">{originalFormatted}</span>
                              <span className="text-emerald-700 dark:text-emerald-400 font-bold">{adjustedFormatted}</span>
                            </div>
                          );
                        };

                        const renderPerson = (originalName?: string, substitutedName?: string, originalCrachá?: string, substitutedCrachá?: string) => {
                          if (!substitutedName && !substitutedCrachá) {
                            return (
                              <div>
                                <div className="text-gray-900 dark:text-gray-100">{originalName || ''}</div>
                                {originalCrachá && <div className="text-xs text-gray-700 dark:text-gray-400">Crachá: {originalCrachá}</div>}
                              </div>
                            );
                          }
                          return (
                            <div className="flex flex-col">
                              <div className="text-gray-500 line-through">
                                <div>{originalName || ''}</div>
                                {originalCrachá && <div className="text-xs">Crachá: {originalCrachá}</div>}
                              </div>
                              <div className="text-yellow-700 dark:text-yellow-400 font-bold">
                                <div>{substitutedName || ''}</div>
                                {substitutedCrachá && <div className="text-xs">Crachá: {substitutedCrachá}</div>}
                              </div>
                            </div>
                          );
                        };

                        const isCarroEdited = it.prefixo_veiculo_editado && it.prefixo_veiculo_editado !== it.prefixo_veiculo;

                        return (
                          <tr key={it.id} className="hover:bg-gray-100 dark:hover:bg-gray-800/40 transition-colors">
                            <td className="px-3 py-2">
                              <div className="text-gray-900 dark:text-gray-100 font-medium">{it.codigoLinha} - {it.nomeLinha}</div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">{it.setorPrincipalLinha}</div>
                            </td>
                            <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{it.codservicoNumero ?? it.cod_servico_numero}</td>
                            <td className="px-3 py-2">{renderAdjustedTime(it.hor_Saída, it.hor_Saída_ajustada)}</td>
                            <td className="px-3 py-2">{renderAdjustedTime(it.hor_chegada, it.hor_chegada_ajustada)}</td>
                            <td className={`px-3 py-2 ${isCarroEdited ? 'text-yellow-700 dark:text-yellow-400 font-bold' : 'text-gray-900 dark:text-gray-100'}`}>
                              {isCarroEdited ? (
                                <div className="flex flex-col">
                                  <span className="text-gray-500 line-through">{it.prefixo_veiculo}</span>
                                  <span>{it.prefixo_veiculo_editado}</span>
                                </div>
                              ) : (
                                it.prefixo_veiculo
                              )}
                            </td>
                            <td className="px-3 py-2">{renderPerson(it.nome_motorista, it.nome_motorista_editado, it.Crachá_motorista, it.Crachá_motorista_editado)}</td>
                            <td className="px-3 py-2">{renderPerson(it.nome_cobrador, it.nome_cobrador_editado, it.Crachá_cobrador, it.Crachá_cobrador_editado)}</td>
                            <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{it.observacao || ''}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        <ConfirmDialog
          open={openConfirmSync}
          onOpenChange={setOpenConfirmSync}
          variant="warning"
          title="Sincronizar dados do dia selecionado?"
          description={
            <span>
              Ao sincronizar, os dados <strong>existentes</strong> deste dia serão apagados e recriados para evitar <strong>duplicidades</strong>. Esta ação está disponível apenas para <strong>Analista</strong> ou superior.
            </span>
          }
          confirmText="Sim, sincronizar"
          cancelText="Cancelar"
          onConfirm={() => sincronizarControleHorarios()}
        />
      </div>
    </div >
  );
};

























