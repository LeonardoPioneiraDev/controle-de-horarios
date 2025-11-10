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

        const motoristaNome = it.nomeMotoristaEditado || it.nomeMotoristaGlobus || '';
        const motoristaCracha = it.crachaMotoristaEditado || it.crachaMotoristaGlobus || '';
        const cobradorNome = it.nomeCobradorEditado || it.nomeCobradorGlobus || '';
        const cobradorCracha = it.crachaCobradorEditado || it.crachaCobradorGlobus || '';

        const motoristaDisplay = (it.nomeMotoristaEditado && it.nomeMotoristaEditado !== it.nomeMotoristaGlobus) || (it.crachaMotoristaEditado && it.crachaMotoristaEditado !== it.crachaMotoristaGlobus)
          ? `${safe(motoristaNome)} <span class="text-xs text-gray-500">(Original: ${safe(it.nomeMotoristaGlobus)})</span>`
          : safe(motoristaNome);
        const motoristaCrachaDisplay = (it.crachaMotoristaEditado && it.crachaMotoristaEditado !== it.crachaMotoristaGlobus)
          ? `${safe(motoristaCracha)} <span class="text-xs text-gray-500">(Original: ${safe(it.crachaMotoristaGlobus)})</span>`
          : safe(motoristaCracha);

        const cobradorDisplay = (it.nomeCobradorEditado && it.nomeCobradorEditado !== it.nomeCobradorGlobus) || (it.crachaCobradorEditado && it.crachaCobradorEditado !== it.crachaCobradorGlobus)
          ? `${safe(cobradorNome)} <span class="text-xs text-gray-500">(Original: ${safe(it.nomeCobradorGlobus)})</span>`
          : safe(cobradorNome);
        const cobradorCrachaDisplay = (it.crachaCobradorEditado && it.crachaCobradorEditado !== it.crachaCobradorGlobus)
          ? `${safe(cobradorCracha)} <span class="text-xs text-gray-500">(Original: ${safe(it.crachaCobradorGlobus)})</span>`
          : safe(cobradorCracha);

        const cobradorCell = cobradorNome
          ? `<div>${cobradorDisplay}</div><div>${cobradorCrachaDisplay}</div>`
          : '<span class="badge badge-no-cobrador">SEM COBRADOR</span>';

        return `
        <tr class="${rowClass}">
          <td>${safe(it.setorPrincipalLinha)}</td>
          <td>${safe(it.codigoLinha)} - ${safe(it.nomeLinha)}</td>
          <td>${safe(it.codServicoNumero ?? it.cod_servico_numero ?? '')}</td>
          <td>${safe(it.horaSaida)}</td>
          <td>${safe(it.horaChegada)}</td>
          <td><div>${motoristaDisplay}</div></td>
          <td><div>${motoristaCrachaDisplay}</div></td>
          <td>${safe(it.numeroCarro)}</td>
          <td>${cobradorCell}</td>
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
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; color: #111; margin: 24px; }
    h1 { margin: 0 0 4px; }
    .muted { color: #555; }
    .tags { margin: 12px 0; display: flex; flex-wrap: wrap; gap: 8px; }
    .tag { padding: 4px 8px; border: 1px solid #ddd; border-radius: 999px; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
    th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; }
    thead th { background: #f9fafb; }
    tfoot td { background: #fafaf9; font-weight: 600; }
    .row-ok { background:#ecfdf5; }
    .row-warning { background:#fffbeb; }
    .row-danger { background:#fef2f2; }
    .badge-no-cobrador { color:#b45309; background:#fef3c7; padding:2px 6px; border-radius:999px; font-weight:600; border:1px solid #fcd34d; }
    @media print { .no-print { display: none; } body { margin: 0; } }
  </style>
  </head>
  <body>
    
    <h1>Relatório - Controle de Horários</h1>
    <div class="muted">Data de referência: <b>${safe(dataReferencia)}</b> • Tipo do dia: <b>${safe(dayType)}</b></div>
    <div class="muted">Usuário: <b>${safe(user?.email)}</b></div>
    <div class="muted">Total de viagens: <b>${Array.isArray(controleHorarios) ? controleHorarios.length : 0}</b></div>
    <div class="tags">${filtrosAtivos}</div>
    <table>
      <thead>
        <tr>
          <th>Setor</th>
          <th>Linha</th>
          <th>Serviço</th>
          <th>Saída</th>
          <th>Chegada</th>
          <th>Motorista</th>
          <th>Crachá</th>
          <th>Carro</th>
          <th>Cobrador</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr><td colspan="9">Registros: ${Array.isArray(controleHorarios) ? controleHorarios.length : 0}</td></tr>
      </tfoot>
    </table>
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
      'Setor', 'Linha', 'Serviço', 'Saída', 'Chegada',
      'Motorista (Atual)', 'Crachá Motorista (Atual)', 'Motorista (Original)', 'Crachá Motorista (Original)',
      'Carro',
      'Cobrador (Atual)', 'Crachá Cobrador (Atual)', 'Cobrador (Original)', 'Crachá Cobrador (Original)'
    ];

    const data = items.map((it: any) => [
      it.setorPrincipalLinha,
      `${it.codigoLinha} - ${it.nomeLinha}`,
      it.codServicoNumero ?? it.cod_servico_numero ?? '',
      it.horaSaida,
      it.horaChegada,
      it.nomeMotoristaEditado || it.nomeMotoristaGlobus,
      it.crachaMotoristaEditado || it.crachaMotoristaGlobus,
      (it.nomeMotoristaEditado && it.nomeMotoristaEditado !== it.nomeMotoristaGlobus) ? it.nomeMotoristaGlobus : '',
      (it.crachaMotoristaEditado && it.crachaMotoristaEditado !== it.crachaMotoristaGlobus) ? it.crachaMotoristaGlobus : '',
      it.numeroCarro,
      it.nomeCobradorEditado || it.nomeCobradorGlobus || 'SEM COBRADOR',
      it.crachaCobradorEditado || it.crachaCobradorGlobus || '',
      (it.nomeCobradorEditado && it.nomeCobradorEditado !== it.nomeCobradorGlobus) ? it.nomeCobradorGlobus : '',
      (it.crachaCobradorEditado && it.crachaCobradorEditado !== it.crachaCobradorGlobus) ? it.crachaCobradorGlobus : '',
    ]);

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

        {showFilters && (
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
              <div className="sticky top-0 z-10 bg-gray-900/90 backdrop-blur border-b border-yellow-400/20 px-4 py-3 flex items-center justify-between">
                <div className="text-sm text-gray-300">
                  <b>{controleHorarios.length}</b> viagens • Data: <b>{dataReferencia}</b> • <b>{dayType}</b>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={handleExportHtml}>
                    <Download className="h-4 w-4 mr-2" /> Exportar HTML
                  </Button>
                  <Button variant="outline" onClick={() => setIsTableFullScreen(false)}>
                    <Minimize2 className="h-4 w-4 mr-2" /> Sair da Tela Cheia
                  </Button>
                </div>
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
                    : undefined
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
                            <div className="sticky top-0 z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-yellow-400/20 px-4 py-3 bg-gray-900">
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
                        <th className="px-3 py-2 text-left font-semibold">Motorista</th>
                        <th className="px-3 py-2 text-left font-semibold">Crachá Motorista</th>
                        <th className="px-3 py-2 text-left font-semibold">Motorista Original</th>
                        <th className="px-3 py-2 text-left font-semibold">Crachá Motorista Original</th>
                        <th className="px-3 py-2 text-left font-semibold">Carro</th>
                        <th className="px-3 py-2 text-left font-semibold">Cobrador</th>
                        <th className="px-3 py-2 text-left font-semibold">Crachá Cobrador</th>
                        <th className="px-3 py-2 text-left font-semibold">Cobrador Original</th>
                        <th className="px-3 py-2 text-left font-semibold">Crachá Cobrador Original</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedControleHorarios.map((it: any) => (
                        <tr key={it.id} className="border-b border-gray-800">
                          <td className="px-3 py-2">{it.setorPrincipalLinha}</td>
                          <td className="px-3 py-2">{it.codigoLinha} - {it.nomeLinha}</td>
                          <td className="px-3 py-2">{it.codServicoNumero ?? it.cod_servico_numero}</td>
                          <td className="px-3 py-2">{it.horaSaida}</td>
                          <td className="px-3 py-2">{it.horaChegada}</td>
                          <td className="px-3 py-2">{it.nomeMotoristaEditado || it.nomeMotoristaGlobus}</td>
                          <td className="px-3 py-2">{it.crachaMotoristaEditado || it.crachaMotoristaGlobus}</td>
                          <td className="px-3 py-2">
                            {(it.nomeMotoristaEditado && it.nomeMotoristaEditado !== it.nomeMotoristaGlobus)
                              ? it.nomeMotoristaGlobus
                              : ''}
                          </td>
                          <td className="px-3 py-2">
                            {(it.crachaMotoristaEditado && it.crachaMotoristaEditado !== it.crachaMotoristaGlobus)
                              ? it.crachaMotoristaGlobus
                              : ''}
                          </td>
                          <td className="px-3 py-2">{it.numeroCarro}</td>
                          <td className="px-3 py-2">{it.nomeCobradorEditado || it.nomeCobradorGlobus || 'SEM COBRADOR'}</td>
                          <td className="px-3 py-2">{it.crachaCobradorEditado || it.crachaCobradorGlobus}</td>
                          <td className="px-3 py-2">
                            {(it.nomeCobradorEditado && it.nomeCobradorEditado !== it.nomeCobradorGlobus)
                              ? it.nomeCobradorGlobus
                              : ''}
                          </td>
                          <td className="px-3 py-2">
                            {(it.crachaCobradorEditado && it.crachaCobradorEditado !== it.crachaCobradorGlobus)
                              ? it.crachaCobradorGlobus
                              : ''}
                          </td>
                        </tr>
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
