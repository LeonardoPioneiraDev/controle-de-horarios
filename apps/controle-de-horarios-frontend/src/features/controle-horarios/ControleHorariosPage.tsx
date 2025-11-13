import React, { useMemo, useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole, canSyncControleHorarios, canEditControleHorarios } from '../../types/user.types';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';
import { useControleHorarios } from './hooks/useControleHorarios';
import { FiltersPanel } from './components/FiltersPanel/FiltersPanel';
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
    aplicarFiltroRapido,
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
    return 'DIAS UTÉIS';
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

    // Logo em base64
    const logoBase64 =  '../assets/logo.png'
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const rows = items
      .map((it: any) => {
        const hasEdits = Boolean(
          it.nomeMotoristaEditado ||
          it.crachaMotoristaEditado ||
          it.nomeCobradorEditado ||
          it.crachaCobradorEditado
        );
        const hasVehicle = Boolean(it.numeroCarro);
        const m = String(it.horaSaida || '').match(/^(\d{1,2}):(\d{2})/);
        const hm = m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : null;
        const isLateNoVehicle = hm !== null && hm < nowMinutes && !hasVehicle;
        const rowClass = isLateNoVehicle ? 'row-danger' : hasEdits ? 'row-warning' : 'row-ok';

        const motoristaNomeOriginal = it.nomeMotoristaGlobus || '';
        const motoristaCrachaOriginal = it.crachaMotoristaGlobus || '';
        const isMotoristaSubstituted = (it.nomeMotoristaEditado && it.nomeMotoristaEditado !== it.nomeMotoristaGlobus) || (it.crachaMotoristaEditado && it.crachaMotoristaEditado !== it.crachaMotoristaGlobus);
        const motoristaNomeSubstituto = isMotoristaSubstituted ? (it.nomeMotoristaEditado || '') : '';
        const motoristaCrachaSubstituto = isMotoristaSubstituted ? (it.crachaMotoristaEditado || '') : '';

        const cobradorNomeOriginal = it.nomeCobradorGlobus || '';
        const cobradorCrachaOriginal = it.crachaCobradorGlobus || '';
        const isCobradorSubstituted = (it.nomeCobradorEditado && it.nomeCobradorEditado !== it.nomeCobradorGlobus) || (it.crachaCobradorEditado && it.crachaCobradorEditado !== it.crachaCobradorGlobus);
        const cobradorNomeSubstituto = isCobradorSubstituted ? (it.nomeCobradorEditado || '') : '';
        const cobradorCrachaSubstituto = isCobradorSubstituted ? (it.crachaCobradorEditado || '') : '';

        const hasCobrador = cobradorNomeOriginal || cobradorNomeSubstituto;

        const cobradorCells = hasCobrador
          ? `
          <td>${safe(cobradorNomeOriginal)}</td>
          <td class="center">${safe(cobradorCrachaOriginal)}</td>
          <td class="${cobradorNomeSubstituto ? 'cell-substitute' : ''}">${safe(cobradorNomeSubstituto)}</td>
          <td class="center ${cobradorCrachaSubstituto ? 'cell-substitute' : ''}">${safe(cobradorCrachaSubstituto)}</td>
        `
          : '<td colspan="4" class="cell-no-cobrador">SEM COBRADOR</td>';

        return `
        <tr class="${rowClass}">
          <td>${safe(it.setorPrincipalLinha)}</td>
          <td>${safe(it.codigoLinha)} - ${safe(it.nomeLinha)}</td>
          <td class="center">${safe(it.codServicoNumero ?? it.cod_servico_numero ?? '')}</td>
          <td class="center">${safe(it.horaSaida)}</td>
          <td class="center">${safe(it.horaChegada)}</td>
          <td class="center">${safe(it.numeroCarro)}</td>
          <td>${safe(motoristaNomeOriginal)}</td>
          <td class="center">${safe(motoristaCrachaOriginal)}</td>
          <td class="${motoristaNomeSubstituto ? 'cell-substitute' : ''}">${safe(motoristaNomeSubstituto)}</td>
          <td class="center ${motoristaCrachaSubstituto ? 'cell-substitute' : ''}">${safe(motoristaCrachaSubstituto)}</td>
          ${cobradorCells}
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
    .muted { color: #555; font-size: 14px; }
    .tags-container { margin: 20px 0; padding: 12px; background-color: #f8f9fa; border-radius: 6px; }
    .tags { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
    .tags b { font-weight: 500; }
    .tag { padding: 5px 12px; border-radius: 15px; font-size: 12px; background-color: #e9ecef; color: #495057; }
    .tag b { color: #000; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #dee2e6; padding: 10px 12px; text-align: left; vertical-align: middle; }
    thead th { background: #343a40; color: #fff; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
    thead .group-header { background-color: #495057; text-align: center; }
    tbody tr:nth-child(even) { background-color: #f8f9fa; }
    tbody tr:hover { background-color: #e9ecef; }
    tfoot td { background: #e9ecef; font-weight: 700; }
    .row-warning { background-color: #fff3cd; }
    .row-danger { background-color: #f8d7da; color: #721c24; }
    .row-danger td { border-color: #f5c6cb; }
    .cell-substitute { background-color: #fff9c4; font-weight: 700; color: #333; }
    .cell-no-cobrador { text-align: center; color: #6c757d; background-color: #f8f9fa; font-style: italic; }
    .center { text-align: center; }
    .col-setor { width: 5%; }
    .col-linha { width: 18%; }
    .col-servico, .col-saida, .col-chegada, .col-carro { width: 6%; text-align: center; }
    .col-motorista, .col-cobrador { width: 12%; }
    .col-cracha { width: 7%; text-align: center; }
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
            <th rowspan="2" class="col-setor">Setor</th>
            <th rowspan="2" class="col-linha">Linha</th>
            <th rowspan="2" class="col-servico">Serviço</th>
            <th rowspan="2" class="col-saida">Saída</th>
            <th rowspan="2" class="col-chegada">Chegada</th>
            <th rowspan="2" class="col-carro">Carro</th>
            <th colspan="4" class="group-header">Motorista</th>
            <th colspan="4" class="group-header">Cobrador</th>
          </tr>
          <tr>
            <th class="col-motorista">Original</th>
            <th class="col-cracha">Crachá</th>
            <th class="col-motorista">Substituto</th>
            <th class="col-cracha">Crachá</th>
            <th class="col-cobrador">Original</th>
            <th class="col-cracha">Crachá</th>
            <th class="col-cobrador">Substituto</th>
            <th class="col-cracha">Crachá</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr><td colspan="14">Total de registros: ${Array.isArray(controleHorarios) ? controleHorarios.length : 0}</td></tr>
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
      'Setor', 'Linha', 'Serviço', 'Saída', 'Chegada', 'Carro',
      'Motorista (Original)', 'Crachá (Original)', 'Motorista (Substituto)', 'Crachá (Substituto)',
      'Cobrador (Original)', 'Crachá (Original)', 'Cobrador (Substituto)', 'Crachá (Substituto)'
    ];

    const data = items.map((it: any) => {
      const isMotoristaSubstituted = (it.nomeMotoristaEditado && it.nomeMotoristaEditado !== it.nomeMotoristaGlobus) || (it.crachaMotoristaEditado && it.crachaMotoristaEditado !== it.crachaMotoristaGlobus);
      const isCobradorSubstituted = (it.nomeCobradorEditado && it.nomeCobradorEditado !== it.nomeCobradorGlobus) || (it.crachaCobradorEditado && it.crachaCobradorEditado !== it.crachaCobradorGlobus);

      const hasCobrador = it.nomeCobradorGlobus || isCobradorSubstituted;

      return [
        it.setorPrincipalLinha,
        `${it.codigoLinha} - ${it.nomeLinha}`,
        it.codServicoNumero ?? it.cod_servico_numero ?? '',
        it.horaSaida,
        it.horaChegada,
        it.numeroCarro,
        it.nomeMotoristaGlobus || '',
        it.crachaMotoristaGlobus || '',
        isMotoristaSubstituted ? (it.nomeMotoristaEditado || '') : '',
        isMotoristaSubstituted ? (it.crachaMotoristaEditado || '') : '',
        hasCobrador ? (it.nomeCobradorGlobus || '') : 'SEM COBRADOR',
        hasCobrador ? (it.crachaCobradorGlobus || '') : '',
        isCobradorSubstituted ? (it.nomeCobradorEditado || '') : '',
        isCobradorSubstituted ? (it.crachaCobradorEditado || '') : '',
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
    <div className="space-y-6 p-4 md:p-6 min-h-screen bg-gradient-to-br from-black via-neutral-900 to-yellow-950 text-gray-100">
      <div className="max-w-[1400px] mx-auto">
        <Card className="relative border border-yellow-400/20">
          <CardHeader className="pb-2">
            <h1 className="text-2xl sm:text-3xl font-bold">Controle de Horários</h1>
            <p className="mt-1 text-sm text-gray-400">Gerencie e edite os horários das viagens   </p>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-3">
                <Label htmlFor="date-picker">Data de referência</Label>
                <div className="relative w-full sm:w-56">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="date-picker"
                    type="date"
                    value={dataReferencia}
                    onChange={(e) => setDataReferencia(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => setShowFilters((v) => !v)}>
                  Filtros
                </Button>
                <Button variant="outline" onClick={() => { limparFiltros(); aplicarFiltros(); }}>
                  Limpar Filtros
                </Button>
                <Button variant="outline" onClick={salvarFiltrosManualmente}>
                  Salvar Filtros
                </Button>
                <Button variant="outline" onClick={() => setShowReport(true)}>
                  <FileText className="h-4 w-4 mr-2" /> Gerar Relatório
                </Button>
                <Button variant="outline" onClick={() => setIsTableFullScreen((v) => !v)}>
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
                  <Button variant="outline" onClick={() => setOpenConfirmSync(true)} disabled={loading}>
                    Sincronizar
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg mt-4" role="alert">
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
            onAplicarFiltroRapido={aplicarFiltroRapido}
            tipoLocal={tipoLocal}
            setTipoLocal={setTipoLocal}
            statusEdicaoLocal={statusEdicaoLocal}
            setStatusEdicaoLocal={setStatusEdicaoLocal}
          />
        )}

        {Array.isArray(controleHorarios) && controleHorarios.length > 0 ? (
          <div className={isTableFullScreen ? 'fixed inset-0 z-50 bg-gray-900 p-0 overflow-auto' : ''}>
            {isTableFullScreen && (
              <div className="sticky top-0 z-50 bg-gray-900/90 backdrop-blur border-b border-yellow-400/20 px-4 py-3 flex items-center justify-between">
                <div className="text-sm text-gray-300">
                  <b>{controleHorarios.length}</b> viagens • Data: <b>{dataReferencia}</b> • <b>{dayType}</b>
                </div>
                <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setShowFilters((v) => !v)}>
                  Filtros
                </Button>
                <Button variant="outline" onClick={() => { limparFiltros(); aplicarFiltros(); }}>
                  Limpar Filtros
                </Button>
                  <Button variant="outline" onClick={handleExportHtml}>
                    <Download className="h-4 w-4 mr-2" /> Gerar Relatório
                  </Button>
                  <Button variant="outline" onClick={() => setIsTableFullScreen(false)}>
                    <Minimize2 className="h-4 w-4 mr-2" /> Sair da Tela Cheia
                  </Button>
                </div>
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
                  onAplicarFiltroRapido={aplicarFiltroRapido}
                  tipoLocal={tipoLocal}
                  setTipoLocal={setTipoLocal}
                  statusEdicaoLocal={statusEdicaoLocal}
                  setStatusEdicaoLocal={setStatusEdicaoLocal}
                />
              </div>
            )}

            <div className={isTableFullScreen ? 'p-4' : ''}              style={shouldApplyZoom ? { transform: 'scale(1)', transformOrigin: 'top left' } : {}}>
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
              />

              {canSaveCH && (
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
          <div className="text-center py-12 space-y-4">
            <p className="text-gray-400">Nenhuma viagem encontrada</p>
          </div>
        )}

        {/* Relatório - preview simples */}
        {showReport && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur flex items-center justify-center p-4">
            <div className="w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-xl border border-yellow-400/20 bg-gray-900 shadow-2xl">
                            <div className="sticky top-0 z-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-yellow-400/20 px-4 py-3 bg-gray-900">
                              <div>
                                <div className="text-lg font-semibold">Relatório - Controle de Horários</div>
                                <div className="text-xs text-gray-400">Data: {dataReferencia} • {dayType} • Registros: {Array.isArray(controleHorarios) ? controleHorarios.length : 0}</div>
                              </div>
                              <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                                <Button variant="outline" onClick={handleExportHtml} className="w-full sm:w-auto">
                                  <Download className="h-4 w-4 mr-2" /> Exportar HTML
                                </Button>
                                {isAnalistaOuMais && (
                                  <Button variant="outline" onClick={handleExportExcel} className="w-full sm:w-auto">
                                    <Download className="h-4 w-4 mr-2" /> Exportar Excel
                                  </Button>
                                )}
                                <Button variant="outline" onClick={() => setShowReport(false)} className="w-full sm:w-auto">
                                  Fechar
                                </Button>
                              </div>
                            </div>
              <div className="overflow-auto p-4">
                <div className="text-sm text-gray-300 mb-2">Filtros aplicados:</div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {Object.entries((filtros as Record<string, unknown>) || {})
                    .filter(([, v]) => v !== undefined && v !== null && String(v) !== '')
                    .map(([k, v]) => (
                      <span key={k} className="inline-flex items-center gap-1 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs text-yellow-200">
                        {k}: <b className="text-yellow-300">{String(v)}</b>
                      </span>
                    ))}
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-800/60">
                        <th className="px-3 py-2 text-left font-semibold">Setor</th>
                        <th className="px-3 py-2 text-left font-semibold">Linha</th>
                        <th className="px-3 py-2 text-left font-semibold">Serviço</th>
                        <th className="px-3 py-2 text-left font-semibold">Saída</th>
                        <th className="px-3 py-2 text-left font-semibold">Chegada</th>
                        <th className="px-3 py-2 text-left font-semibold">Carro</th>
                        <th className="px-3 py-2 text-left font-semibold">Motorista Original</th>
                        <th className="px-3 py-2 text-left font-semibold">Crachá Original</th>
                        <th className="px-3 py-2 text-left font-semibold">Motorista Substituto</th>
                        <th className="px-3 py-2 text-left font-semibold">Crachá Substituto</th>
                        <th className="px-3 py-2 text-left font-semibold">Cobrador Original</th>
                        <th className="px-3 py-2 text-left font-semibold">Crachá Original</th>
                        <th className="px-3 py-2 text-left font-semibold">Cobrador Substituto</th>
                        <th className="px-3 py-2 text-left font-semibold">Crachá Substituto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedControleHorarios.map((it: any) => {
                        const isMotoristaSubstituted = (it.nomeMotoristaEditado && it.nomeMotoristaEditado !== it.nomeMotoristaGlobus) || (it.crachaMotoristaEditado && it.crachaMotoristaEditado !== it.crachaMotoristaGlobus);
                        const motoristaNomeSubstituto = isMotoristaSubstituted ? (it.nomeMotoristaEditado || '') : '';
                        const motoristaCrachaSubstituto = isMotoristaSubstituted ? (it.crachaMotoristaEditado || '') : '';

                        const isCobradorSubstituted = (it.nomeCobradorEditado && it.nomeCobradorEditado !== it.nomeCobradorGlobus) || (it.crachaCobradorEditado && it.crachaCobradorEditado !== it.crachaCobradorGlobus);
                        const cobradorNomeSubstituto = isCobradorSubstituted ? (it.nomeCobradorEditado || '') : '';
                        const cobradorCrachaSubstituto = isCobradorSubstituted ? (it.crachaCobradorEditado || '') : '';
                        const hasCobrador = it.nomeCobradorGlobus || cobradorNomeSubstituto;

                        return (
                          <tr key={it.id} className="border-b border-gray-800 hover:bg-gray-800/40">
                            <td className="px-3 py-2">{it.setorPrincipalLinha}</td>
                            <td className="px-3 py-2">{it.codigoLinha} - {it.nomeLinha}</td>
                            <td className="px-3 py-2">{it.codServicoNumero ?? it.cod_servico_numero}</td>
                            <td className="px-3 py-2">{it.horaSaida}</td>
                            <td className="px-3 py-2">{it.horaChegada}</td>
                            <td className="px-3 py-2">{it.numeroCarro}</td>
                            <td className="px-3 py-2">{it.nomeMotoristaGlobus}</td>
                            <td className="px-3 py-2">{it.crachaMotoristaGlobus}</td>
                            <td className={`px-3 py-2 ${motoristaNomeSubstituto ? 'text-yellow-300 font-bold' : ''}`}>{motoristaNomeSubstituto}</td>
                            <td className={`px-3 py-2 ${motoristaCrachaSubstituto ? 'text-yellow-300 font-bold' : ''}`}>{motoristaCrachaSubstituto}</td>
                            {hasCobrador ? (
                              <>
                                <td className="px-3 py-2">{it.nomeCobradorGlobus}</td>
                                <td className="px-3 py-2">{it.crachaCobradorGlobus}</td>
                                <td className={`px-3 py-2 ${cobradorNomeSubstituto ? 'text-yellow-300 font-bold' : ''}`}>{cobradorNomeSubstituto}</td>
                                <td className={`px-3 py-2 ${cobradorCrachaSubstituto ? 'text-yellow-300 font-bold' : ''}`}>{cobradorCrachaSubstituto}</td>
                              </>
                            ) : (
                              <td colSpan={4} className="px-3 py-2 text-center text-gray-500">SEM COBRADOR</td>
                            )}
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



