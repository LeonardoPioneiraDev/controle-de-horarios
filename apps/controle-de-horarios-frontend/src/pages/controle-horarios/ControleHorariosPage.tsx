import React, { useMemo, useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole, canSyncControleHorarios, canEditControleHorarios } from '../../types/user.types';
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
import { Calendar, Maximize2, Minimize2, FileText, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

export const ControleHorariosPage: React.FC = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [isTableFullScreen, setIsTableFullScreen] = useState(false);
  const [showLinhaMultiSelect, setShowLinhaMultiSelect] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [openConfirmSync, setOpenConfirmSync] = useState(false);
  const [showHistorico, setShowHistorico] = useState(false);

  const [isHorariosModalOpen, setIsHorariosModalOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      setWindowHeight(window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const { user } = useAuth();
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

  // Saved filters quick-select (top bar)
  type SavedFilterQuick = {
    name: string;
    filtros: any;
    tipoLocal?: 'R' | 'S';
    statusEdicaoLocal?: 'todos' | 'minhas_edicoes' | 'nao_editados' | 'apenas_editadas';
    createdAt: number;
  };
  const savedFiltersKey = useMemo(() => {
    const u: any = user;
    return `ch_saved_filters_${u?.id || u?.email || 'default'}`;
  }, [user]);
  const [savedFiltersQuick, setSavedFiltersQuick] = useState<SavedFilterQuick[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(savedFiltersKey);
      setSavedFiltersQuick(raw ? JSON.parse(raw) : []);
    } catch {
      setSavedFiltersQuick([]);
    }
  }, [savedFiltersKey, showFilters]);
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
      .map((it: any) => parseMinutes(it.horaSaida))
      .filter((n) => Number.isFinite(n)) as number[];
    const minM = mins.length ? Math.min(...mins) : 0;
    const maxM = mins.length ? Math.max(...mins) : 0;
    const crosses = minM <= 240 && maxM >= 1080; // <=04:00 e >=18:00
    const threshold = 240;
    arr.sort((a: any, b: any) => {
      const am = parseMinutes(a.horaSaida);
      const bm = parseMinutes(b.horaSaida);
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

    const renderPerson = (originalName?: string, substitutedName?: string, originalCracha?: string, substitutedCracha?: string) => {
      if (!substitutedName && !substitutedCracha) {
        return `<td><div>${safe(originalName)}</div><div class="cracha">${safe(originalCracha)}</div></td>`;
      }
      return `<td class="cell-substitute"><div class="original">${safe(originalName)} (${safe(originalCracha)})</div><div class="substituted">${safe(substitutedName)} (${safe(substitutedCracha)})</div></td>`;
    };

    const renderCarro = (originalCarro?: string, editedCarro?: string) => {
      if (!editedCarro || originalCarro === editedCarro) {
        return `<td>${safe(originalCarro)}</td>`;
      }
      return `<td class="cell-substitute"><div class="original">${safe(originalCarro)}</div><div class="substituted">${safe(editedCarro)}</div></td>`;
    }

    const rows = items
      .map((it: any) => {
        const hasAdjust = Boolean(it.hor_saida_ajustada || it.hor_chegada_ajustada);
        const hasEdits = Boolean(
          it.nomeMotoristaEditado ||
          it.crachaMotoristaEditado ||
          it.nomeCobradorEditado ||
          it.crachaCobradorEditado ||
          (it.prefixo_veiculo_editado && it.prefixo_veiculo_editado !== it.prefixo_veiculo) ||
          hasAdjust
        );
        const rowClass = hasEdits ? 'row-warning' : 'row-ok';

        return `
        <tr class="${rowClass}">
          <td><div>${safe(it.codigoLinha)} - ${safe(it.nomeLinha)}</div><div class="setor">${safe(it.setorPrincipalLinha)}</div></td>
          <td class="center">${safe(it.codServicoNumero ?? it.cod_servico_numero ?? '')}</td>
          ${renderAdjustedTime(it.hor_saida, it.hor_saida_ajustada)}
          ${renderAdjustedTime(it.hor_chegada, it.hor_chegada_ajustada)}
          ${renderCarro(it.prefixo_veiculo, it.prefixo_veiculo_editado)}
          ${renderPerson(it.nome_motorista, it.nome_motorista_editado, it.cracha_motorista, it.cracha_motorista_editado)}
          ${renderPerson(it.nome_cobrador, it.nome_cobrador_editado, it.cracha_cobrador, it.cracha_cobrador_editado)}
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
    .cracha, .setor { font-size: 0.9em; color: #495057; }
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
            <th>Serviço</th>
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
      'Setor', 'Linha', 'Serviço', 'Saída', 'Chegada', 'Saída Ajustada', 'Chegada Ajustada', 'Carro',
      'Motorista', 'Cobrador', 'Observações'
    ];

    const data = items.map((it: any) => {
      const fmtAdj = (v?: string) => {
        if (!v) return '';
        try { const d = new Date(v); if (isNaN(d.getTime())) return ''; return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); } catch { return ''; }
      };

      const motorista = (it.nome_motorista_editado && it.nome_motorista_editado !== it.nome_motorista) || (it.cracha_motorista_editado && it.cracha_motorista_editado !== it.cracha_motorista)
        ? `DE: ${it.nome_motorista} (${it.cracha_motorista}) PARA: ${it.nome_motorista_editado} (${it.cracha_motorista_editado})`
        : `${it.nome_motorista} (${it.cracha_motorista})`;

      const cobrador = (it.nome_cobrador_editado && it.nome_cobrador_editado !== it.nome_cobrador) || (it.cracha_cobrador_editado && it.cracha_cobrador_editado !== it.cracha_cobrador)
        ? `DE: ${it.nome_cobrador} (${it.cracha_cobrador}) PARA: ${it.nome_cobrador_editado} (${it.cracha_cobrador_editado})`
        : (it.nome_cobrador ? `${it.nome_cobrador} (${it.cracha_cobrador})` : 'SEM COBRADOR');

      const carro = (it.prefixo_veiculo_editado && it.prefixo_veiculo_editado !== it.prefixo_veiculo)
        ? `DE: ${it.prefixo_veiculo} PARA: ${it.prefixo_veiculo_editado}`
        : it.prefixo_veiculo;

      return [
        it.setorPrincipalLinha,
        `${it.codigoLinha} - ${it.nomeLinha}`,
        it.codServicoNumero ?? it.cod_servico_numero ?? '',
        it.horaSaida,
        it.horaChegada,
        fmtAdj(it.hor_saida_ajustada as any),
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

  const shouldApplyZoom = isTableFullScreen && windowWidth <= 1390 && windowHeight <= 1900;

  return (
    <div className="space-y-4 md:space-y-6 p-2 md:p-6 min-h-screen bg-gray-100 dark:bg-gradient-to-br dark:from-black dark:via-neutral-900 dark:to-yellow-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto">
        <Card className="relative border border-gray-300 dark:border-yellow-400/20 bg-white dark:bg-gray-900 shadow-md dark:shadow-none">
          <CardHeader className="pb-4 border-b border-gray-400 dark:border-yellow-400/10">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Controle de Horários</h1>
            <p className="mt-1 text-sm text-gray-700 dark:text-gray-400">Gerencie e edite os horários das viagens</p>
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
                  className="border border-gray-500 dark:border-gray-700 bg-white dark:bg-transparent rounded-md px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent min-w-[180px]"
                  onChange={(e) => e.target.value && applySavedFilterQuick(e.target.value)}
                  defaultValue=""
                >
                  <option value="" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">Filtros salvos…</option>
                  {savedFiltersQuick.map((sf) => (
                    <option key={sf.name} value={sf.name} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">{sf.name}</option>
                  ))}
                </select>
                <Button variant="outline" onClick={() => setShowReport(true)} className="border-gray-500 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-white dark:bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 font-medium">
                  <FileText className="h-4 w-4 mr-2" /> Gerar Relatório
                </Button>
                <Button variant="outline" onClick={() => setIsTableFullScreen((v) => !v)} className="border-gray-500 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-white dark:bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 font-medium">
                  {isTableFullScreen ? (
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
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-800 dark:text-red-300 px-4 py-3 rounded-lg mt-4 font-medium" role="alert">
            {error}
          </div>
        )}

        {showFilters && !isTableFullScreen && (
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
        )}

        {Array.isArray(controleHorarios) && controleHorarios.length > 0 ? (
          <div className={isTableFullScreen ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900 p-0 overflow-auto' : ''}>
            {isTableFullScreen && (
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
                    <Button variant="outline" onClick={() => setIsTableFullScreen(false)} className="border-gray-500 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-white dark:bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800">
                      <Minimize2 className="h-4 w-4 mr-2" /> Sair da Tela Cheia
                    </Button>
                  </div>
                </div>

                {/* Saved Filters Quick Select */}
                {savedFiltersQuick.length > 0 && (
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-400 dark:border-gray-700">
                    <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Filtros Salvos:</span>
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
                )}
              </div>
            )}
            {isTableFullScreen && showFilters && (
              <div className="fixed right-4 top-16 z-[60] w-[calc(100%-2rem)] sm:w-[720px]">
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

            <div className={isTableFullScreen ? 'p-4' : ''} style={shouldApplyZoom ? { transform: 'scale(1)', transformOrigin: 'top left' } : {}}>
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
                onApplyScaleFilter={({ servico, cracha }) => {
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
                  (filtros as any).cod_servico_numero && (filtros as any).cracha_funcionario
                    ? `Serviço ${(filtros as any).cod_servico_numero} • Crachá ${(filtros as any).cracha_funcionario}`
                    : null
                }
                onClearScaleFilter={limparFiltros}
                onHorariosModalOpenChange={setIsHorariosModalOpen}
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
                        <th className="px-3 py-2 text-left font-bold text-gray-700 dark:text-gray-200">Serviço</th>
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

                        const renderPerson = (originalName?: string, substitutedName?: string, originalCracha?: string, substitutedCracha?: string) => {
                          if (!substitutedName && !substitutedCracha) {
                            return (
                              <div>
                                <div className="text-gray-900 dark:text-gray-100">{originalName || ''}</div>
                                {originalCracha && <div className="text-xs text-gray-700 dark:text-gray-400">Crachá: {originalCracha}</div>}
                              </div>
                            );
                          }
                          return (
                            <div className="flex flex-col">
                              <div className="text-gray-500 line-through">
                                <div>{originalName || ''}</div>
                                {originalCracha && <div className="text-xs">Crachá: {originalCracha}</div>}
                              </div>
                              <div className="text-yellow-700 dark:text-yellow-400 font-bold">
                                <div>{substitutedName || ''}</div>
                                {substitutedCracha && <div className="text-xs">Crachá: {substitutedCracha}</div>}
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
                            <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{it.codServicoNumero ?? it.cod_servico_numero}</td>
                            <td className="px-3 py-2">{renderAdjustedTime(it.hor_saida, it.hor_saida_ajustada)}</td>
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
                            <td className="px-3 py-2">{renderPerson(it.nome_motorista, it.nome_motorista_editado, it.cracha_motorista, it.cracha_motorista_editado)}</td>
                            <td className="px-3 py-2">{renderPerson(it.nome_cobrador, it.nome_cobrador_editado, it.cracha_cobrador, it.cracha_cobrador_editado)}</td>
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
    </div>
  );
};
