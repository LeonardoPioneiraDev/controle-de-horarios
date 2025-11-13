// src/pages/ComparacaoViagens.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { comparacaoViagensService } from '../services/comparacao/comparacao.service';
import { ResultadoComparacao, ComparacaoViagem, FiltrosComparacao, HistoricoComparacaoResumo } from '../types/comparacao.types';
import {
  Calendar,
  Play,
  BarChart3,
  Filter,
  RefreshCw,
  Clock,
  GitCompare,
  Loader2,
  ChevronDown,
  FileText,
  X,
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription, AlertTitle, AlertIcon } from '../components/ui/alert';
import { ConfirmDialog } from '../components/ui/confirm-dialog';
import { toast } from 'react-toastify';

// Helpers
const GlowingCard = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <div className="relative">
    <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-r from-yellow-400/30 via-amber-500/25 to-yellow-300/30 blur-md" />
    <Card className={`relative border border-yellow-400/20 shadow-[0_0_40px_rgba(251,191,36,0.15)] ${className || ''}`}>
      {children}
    </Card>
  </div>
);

// Sub-components
const PageHeader = () => (
  <div className="border-b border-yellow-400/20 pb-4">
    <h1 className="text-3xl font-bold text-gray-100 flex items-center gap-3">
      <GitCompare className="h-8 w-8 text-yellow-400" />
      Comparação de Viagens
    </h1>
    <p className="mt-2 text-md text-gray-400">
      Compare dados entre Transdata e Globus para identificar divergências e compatibilidades.
    </p>
  </div>
);

const Controls = ({ date, onDateChange, onExecute, executing, onToggleFilters, filtersVisible, onFetchComparisons, loading, hasComparisons, onOpenReport }: any) => (
  <GlowingCard>
    <CardContent className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-gray-400" />
          <Label className="text-sm font-medium text-gray-300">Data:</Label>
          <Input type="date" value={date} onChange={(e) => onDateChange(e.target.value)} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={onToggleFilters} variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
            <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${filtersVisible ? 'rotate-180' : ''}`} />
          </Button>

          {hasComparisons && (
            <Button onClick={onFetchComparisons} disabled={loading} variant="outline">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Atualizar
            </Button>
          )}

          <Button onClick={onExecute} disabled={executing || !date}>
            {executing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            {executing ? 'Executando...' : 'Executar Comparação'}
          </Button>

          {hasComparisons && (
            <Button onClick={onOpenReport}>
              <FileText className="h-4 w-4 mr-2" />
              Visualizar Relatório
            </Button>
          )}
        </div>
      </div>
    </CardContent>
  </GlowingCard>
);

const Statistics = ({ stats, isModal = false }: { stats: ResultadoComparacao; isModal?: boolean }) => (
  <GlowingCard className={isModal ? 'bg-neutral-900' : ''}>
    <CardContent className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <BarChart3 className="h-6 w-6 text-yellow-400" />
        <h2 className="text-xl font-semibold text-gray-100">Estatísticas da Comparação</h2>
        <div className="ml-auto flex items-center gap-2 text-sm text-gray-400">
          <Clock className="h-4 w-4" />
          <span>Processado em {stats.tempoProcessamento}</span>
        </div>
      </div>
      <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${isModal ? 'lg:grid-cols-4' : 'lg:grid-cols-8'}`}>
        <StatCard label="Total" value={stats.totalComparacoes} />
        <StatCard label="Compatíveis" value={stats.compativeis} color="text-green-400" />
        <StatCard label="Divergentes" value={stats.divergentes} color="text-red-400" />
        <StatCard label="Horário Div." value={stats.horarioDivergente} color="text-yellow-400" />
        <StatCard label="Só Transdata" value={stats.apenasTransdata} color="text-blue-400" />
        <StatCard label="Só Globus" value={stats.apenasGlobus} color="text-purple-400" />
        <StatCard label="Compatibilidade" value={`${stats.percentualCompatibilidade}%`} color="text-indigo-400" />
        <StatCard label="Linhas" value={stats.linhasAnalisadas} />
      </div>
    </CardContent>
  </GlowingCard>
);

const StatCard = ({ label, value, color = 'text-gray-100' }: any) => {
  const formatted = typeof value === 'number' ? value.toLocaleString('pt-BR') : value;
  return (
    <div className="text-center p-3 rounded-lg border border-yellow-400/10 bg-neutral-800/50">
      <div className={`text-2xl font-bold ${color}`}>{formatted}</div>
      <div className="text-sm text-gray-400 mt-1">{label}</div>
    </div>
  );
};

const FilterPanel = ({ filters, onFilterChange, onClear, onApply }: any) => (
  <GlowingCard>
    <CardContent className="p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <FilterInput label="Status" name="statusComparacao" type="select" value={filters.statusComparacao} onChange={onFilterChange}>
          <option value="">Todos</option>
          <option value="compativel">Compatível</option>
          <option value="divergente">Divergente</option>
          <option value="horario_divergente">Horário Divergente</option>
          <option value="apenas_transdata">Apenas Transdata</option>
          <option value="apenas_globus">Apenas Globus</option>
        </FilterInput>
        <FilterInput label="Código da Linha" name="codigoLinha" type="text" value={filters.codigoLinha} onChange={onFilterChange} placeholder="Ex: 0.102" />
        <FilterInput label="Setor Globus" name="globusSetor" type="select" value={filters.globusSetor} onChange={onFilterChange}>
          <option value="">Todos</option>
          <option value="GAMA">GAMA</option>
          <option value="SANTA MARIA">SANTA MARIA</option>
          <option value="PARANOÁ">PARANOÁ</option>
          <option value="SÃO SEBASTIÃO">SÃO SEBASTIÃO</option>
        </FilterInput>
        <FilterInput label="Limite" name="limite" type="select" value={filters.limite} onChange={onFilterChange}>
          <option value={50}>50</option>
          <option value={100}>100</option>
          <option value={200}>200</option>
          <option value={500}>500</option>
        </FilterInput>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button onClick={onClear} variant="outline">Limpar</Button>
        <Button onClick={onApply}>
          <Filter className="h-4 w-4 mr-2" />
          Aplicar Filtros
        </Button>
      </div>
    </CardContent>
  </GlowingCard>
);

const FilterInput = ({ label, name, type, value, onChange, placeholder, children }: any) => (
  <div>
    <Label htmlFor={name} className="mb-1">{label}</Label>
    {type === 'select' ? (
      <select id={name} name={name} value={value || ''} onChange={onChange} className="w-full mt-1 flex h-10 rounded-md border border-yellow-400/20 bg-neutral-900 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 disabled:cursor-not-allowed disabled:opacity-50">
        {children}
      </select>
    ) : (
      <Input id={name} type={type} name={name} value={value || ''} onChange={onChange} placeholder={placeholder} />
    )}
  </div>
);

const ComparisonTable = ({ comparisons, isModal = false }: { comparisons: ComparacaoViagem[]; isModal?: boolean }) => {
  const getStatusPill = (status: string) => {
    const styles: { [key: string]: string } = {
      compativel: 'bg-green-900/50 text-green-400 border-green-500/30',
      divergente: 'bg-red-900/50 text-red-400 border-red-500/30',
      horario_divergente: 'bg-yellow-900/50 text-yellow-400 border-yellow-500/30',
      apenas_transdata: 'bg-blue-900/50 text-blue-400 border-blue-500/30',
      apenas_globus: 'bg-purple-900/50 text-purple-400 border-purple-500/30',
    };
    const text: { [key: string]: string } = {
      compativel: 'Compatível',
      divergente: 'Divergente',
      horario_divergente: 'Horário Div.',
      apenas_transdata: 'Só Transdata',
      apenas_globus: 'Só Globus',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || 'bg-gray-700/50 text-gray-400 border-gray-500/30'}`}>
        {text[status] || status}
      </span>
    );
  };

  const getDivergenceClasses = (compatible?: boolean, type: 'servico' | 'sentido' | 'horario' = 'servico') => {
    if (compatible === false) {
      if (type === 'horario') return 'text-yellow-300 font-semibold';
      return 'text-red-300 font-semibold';
    }
    return 'text-gray-200';
  };

  return (
    <GlowingCard className={isModal ? 'bg-neutral-900' : ''}>
      <CardContent className="p-4 md:p-0 md:overflow-hidden">
        <div className="px-4 pt-4 md:px-6">
          <h3 className="text-lg font-semibold text-gray-100">Resultados da Comparação ({comparisons.length})</h3>
        </div>

        {/* Mobile */}
        <div className="md:hidden mt-4 space-y-4">
          {comparisons.map((comp) => (
            <div key={comp.id} className="bg-neutral-800/50 p-4 rounded-lg border border-yellow-400/20">
              <div className="flex justify-between items-start gap-4">
                <div className="font-bold text-gray-100">{comp.codigoLinha}</div>
                {getStatusPill(comp.statusComparacao)}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className="text-gray-400">Serviço (T/G):</div>
                <div className={`font-medium ${getDivergenceClasses(comp.servicoCompativel, 'servico')}`}>{comp.transdataServico || '-'} / {comp.globusServico || '-'}</div>

                <div className="text-gray-400">Sentido (T/G):</div>
                <div className={`font-medium ${getDivergenceClasses(comp.sentidoCompativel, 'sentido')}`}>{comp.transdataSentido || '-'} / {comp.globusSentidoTexto || '-'}</div>

                <div className="text-gray-400">Horário (T/G):</div>
                <div className={`font-medium ${getDivergenceClasses(comp.horarioCompativel, 'horario')}`}>{comp.transdataHorarioPrevisto || '-'} / {comp.globusHorarioSaida || '-'}</div>

                {comp.diferencaHorarioMinutos != null && (
                  <>
                    <div className="text-gray-400">Diferença:</div>
                    <div className="text-yellow-400 font-medium">{comp.diferencaHorarioMinutos} min</div>
                  </>
                )}

                <div className="text-gray-400">Setor Globus:</div>
                <div className="text-gray-200 font-medium">{comp.globusSetor || '-'}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-yellow-400/20">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Linha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Serviço (T/G)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Sentido (T/G)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Horário (T/G)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Setor Globus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-yellow-400/20">
              {comparisons.map((comp) => (
                <tr key={comp.id} className="hover:bg-white/5">
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusPill(comp.statusComparacao)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200">{comp.codigoLinha}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${getDivergenceClasses(comp.servicoCompativel, 'servico')}`}>{comp.transdataServico || '-'} / {comp.globusServico || '-'}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${getDivergenceClasses(comp.sentidoCompativel, 'sentido')}`}>{comp.transdataSentido || '-'} / {comp.globusSentidoTexto || '-'}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${getDivergenceClasses(comp.horarioCompativel, 'horario')}`}>
                    {comp.transdataHorarioPrevisto || '-'} / {comp.globusHorarioSaida || '-'}
                    {comp.diferencaHorarioMinutos != null && <span className="ml-2 text-yellow-400">({comp.diferencaHorarioMinutos}m)</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{comp.globusSetor || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </GlowingCard>
  );
};

const HistoricoTable = ({ historico, loading }: { historico: HistoricoComparacaoResumo[]; loading: boolean }) => {
  if (loading) return <div className="text-sm text-gray-400">Carregando histórico...</div>;
  if (!historico || historico.length === 0) return <div className="text-sm text-gray-500">Sem execuções recentes.</div>;
  return (
    <>
    </>
  );
};

const EmptyState = ({ onExecute, executing, date }: any) => (
  <GlowingCard className="text-center">
    <CardContent className="p-8">
      <GitCompare className="mx-auto h-12 w-12 text-gray-500" />
      <h3 className="mt-4 text-xl font-semibold text-gray-200">Nenhuma comparação encontrada</h3>
      <p className="mt-2 text-md text-gray-400">
        Execute a comparação para a data <span className="font-semibold text-yellow-400">{date}</span> para ver os resultados.
      </p>
      <Button onClick={onExecute} disabled={executing} className="mt-6" size="lg">
        {executing ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Play className="h-5 w-5 mr-2" />}
        {executing ? 'Executando...' : 'Executar Comparação'}
      </Button>
    </CardContent>
  </GlowingCard>
);

const LoadingState = ({ text }: { text: string }) => (
  <div className="flex items-center justify-center py-20">
    <Loader2 className="h-8 w-8 animate-spin text-yellow-400" />
    <span className="ml-3 text-gray-300">{text}</span>
  </div>
);

// Utils de exportação
function buildFiltersSummary(filters: FiltrosComparacao): string {
  const parts: string[] = [];
  if (filters.statusComparacao) parts.push(`Status: ${filters.statusComparacao}`);
  if (filters.codigoLinha) parts.push(`Linha: ${filters.codigoLinha}`);
  if (filters.globusSetor) parts.push(`Setor: ${filters.globusSetor}`);
  if (filters.sentidoCompativel !== undefined) parts.push(`Sentido compatível: ${filters.sentidoCompativel ? 'Sim' : 'Não'}`);
  if (filters.horarioCompativel !== undefined) parts.push(`Horário compatível: ${filters.horarioCompativel ? 'Sim' : 'Não'}`);
  if (filters.servicoCompativel !== undefined) parts.push(`Serviço compatível: ${filters.servicoCompativel ? 'Sim' : 'Não'}`);
  return parts.join(' | ');
}

function buildReportHtml(opts: {
  date: string;
  stats: ResultadoComparacao | null;
  comparisons: ComparacaoViagem[];
  filters: FiltrosComparacao;
}): string {
  const { date, stats, comparisons, filters } = opts;
  const statsRows = stats
    ? `
      <tr><td>Total</td><td>${stats.totalComparacoes.toLocaleString('pt-BR')}</td></tr>
      <tr><td>Compatíveis</td><td>${stats.compativeis.toLocaleString('pt-BR')}</td></tr>
      <tr><td>Divergentes</td><td>${stats.divergentes.toLocaleString('pt-BR')}</td></tr>
      <tr><td>Horário Div.</td><td>${stats.horarioDivergente.toLocaleString('pt-BR')}</td></tr>
      <tr><td>Só Transdata</td><td>${stats.apenasTransdata.toLocaleString('pt-BR')}</td></tr>
      <tr><td>Só Globus</td><td>${stats.apenasGlobus.toLocaleString('pt-BR')}</td></tr>
      <tr><td>Compatibilidade</td><td>${stats.percentualCompatibilidade}%</td></tr>
      <tr><td>Linhas</td><td>${stats.linhasAnalisadas.toLocaleString('pt-BR')}</td></tr>
      <tr><td>Processado em</td><td>${stats.tempoProcessamento}</td></tr>
    `
    : '<tr><td colspan="2">Sem estatísticas</td></tr>';

  const filtersSummary = buildFiltersSummary(filters) || 'Nenhum filtro aplicado';

  const rows = comparisons
    .map((c) => `
      <tr>
        <td>${c.statusComparacao}</td>
        <td>${c.codigoLinha}</td>
        <td>${c.transdataServico || ''} / ${c.globusServico || ''}</td>
        <td>${c.transdataSentido || ''} / ${c.globusSentidoTexto || ''}</td>
        <td>${c.transdataHorarioPrevisto || ''} / ${c.globusHorarioSaida || ''}</td>
        <td>${c.globusSetor || ''}</td>
      </tr>
    `)
    .join('');

  return `<!DOCTYPE html>
  <html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>Relatório de Comparação - ${date}</title>
    <style>
      body { font-family: Arial, system-ui, -apple-system, Segoe UI, Roboto, sans-serif; background:#0b0b0b; color:#e5e7eb; padding:16px; }
      h1,h2 { margin: 0 0 12px; }
      .card { border:1px solid #78350f55; border-radius:12px; padding:16px; background:#111827; margin-bottom:16px; }
      table { width:100%; border-collapse: collapse; }
      th,td { border:1px solid #78350f55; padding:8px; font-size: 13px; }
      th { background:#1f2937; text-transform: uppercase; letter-spacing: .04em; font-weight:600; color:#9ca3af; }
      .muted { color:#9ca3af; font-size:12px; }
    </style>
  </head>
  <body>
    <h1>Relatório de Comparação - ${date}</h1>
    <div class="muted">Filtros: ${filtersSummary}</div>
    <div class="card">
      <h2>Estatísticas</h2>
      <table>
        <tbody>
          ${statsRows}
        </tbody>
      </table>
    </div>
    <div class="card">
      <h2>Resultados (${comparisons.length.toLocaleString('pt-BR')})</h2>
      <table>
        <thead>
          <tr>
            <th>Status</th>
            <th>Linha</th>
            <th>Serviço (T/G)</th>
            <th>Sentido (T/G)</th>
            <th>Horário (T/G)</th>
            <th>Setor Globus</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  </body>
  </html>`;
}

function downloadFile(content: string | Blob, filename: string, type: string) {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportHtmlReport(params: { date: string; stats: ResultadoComparacao | null; comparisons: ComparacaoViagem[]; filters: FiltrosComparacao }) {
  const html = buildReportHtml(params);
  const safeDate = params.date.replace(/:/g, '-');
  downloadFile(html, `relatorio_comparacao_${safeDate}.html`, 'text/html;charset=utf-8');
}

// Excel via HTML table (compatível com Excel)
function exportExcelReport(params: { date: string; stats: ResultadoComparacao | null; comparisons: ComparacaoViagem[]; filters: FiltrosComparacao }) {
  const html = buildReportHtml(params);
  const safeDate = params.date.replace(/:/g, '-');
  downloadFile(html, `relatorio_comparacao_${safeDate}.xls`, 'application/vnd.ms-excel');
}

const ReportModal = ({ isOpen, onClose, stats, comparisons, date, filters }: { isOpen: boolean; onClose: () => void; stats: ResultadoComparacao | null; comparisons: ComparacaoViagem[]; date: string; filters: FiltrosComparacao }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto p-4 rounded-2xl bg-gradient-to-br from-black via-neutral-900 to-yellow-950 border border-yellow-400/30">
        <div className="flex justify-between items-center mb-4 gap-3">
          <h2 className="text-2xl font-bold text-gray-100">Relatório de Comparação - {date}</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => exportHtmlReport({ date, stats, comparisons, filters })}
              className="whitespace-nowrap"
            >
              Exportar HTML
            </Button>
            <Button
              variant="outline"
              onClick={() => exportExcelReport({ date, stats, comparisons, filters })}
              className="whitespace-nowrap"
            >
              Exportar Excel
            </Button>
            <Button onClick={onClose} variant="ghost" size="icon" aria-label="Fechar">
              <X className="h-6 w-6" />
            </Button>
          </div>
        </div>
        <div className="space-y-6">
          {stats && <Statistics stats={stats} isModal={true} />}
          {comparisons && <ComparisonTable comparisons={comparisons} isModal={true} />}
        </div>
      </div>
    </div>
  );
};

// Main component
const initialFilters: FiltrosComparacao = {
  limit: 150,
  page: 1,
};

export const ComparacaoViagens: React.FC = () => {
  const [dataReferencia, setDataReferencia] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [executando, setExecutando] = useState(false);
  const [estatisticas, setEstatisticas] = useState<ResultadoComparacao | null>(null);
  const [comparacoes, setComparacoes] = useState<ComparacaoViagem[]>([]);
  const [filtros, setFiltros] = useState<FiltrosComparacao>(initialFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [historico, setHistorico] = useState<HistoricoComparacaoResumo[]>([]);
  const [historicoLoading, setHistoricoLoading] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [openConfirmExecute, setOpenConfirmExecute] = useState(false);

  const buscarComparacoes = useCallback(async (currentFilters: FiltrosComparacao) => {
    setLoading(true);
    try {
      const response = await comparacaoViagensService.getComparacoes(dataReferencia, currentFilters);
      setComparacoes(response.data);
    } catch (err: any) {
      const msg = err.message || 'Erro ao buscar comparações.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [dataReferencia]);

  const carregarDadosIniciais = useCallback(async () => {
    setLoading(true);
    setError(null);
    setComparacoes([]);
    try {
      const stats = await comparacaoViagensService.getEstatisticas(dataReferencia);
      setEstatisticas(stats);
      if (stats && stats.totalComparacoes > 0) {
        buscarComparacoes(initialFilters);
      } else {
        setLoading(false);
      }
    } catch (err: any) {
      const msg = err.message || 'Erro ao carregar estatísticas.';
      setError(msg);
      toast.error(msg);
      setEstatisticas(null);
      setLoading(false);
    }
  }, [dataReferencia, buscarComparacoes]);

  useEffect(() => {
    carregarDadosIniciais();
  }, [carregarDadosIniciais]);

  const carregarHistorico = useCallback(async () => {
    setHistoricoLoading(true);
    try {
      const { items } = await comparacaoViagensService.listarHistorico({ limit: 5, page: 1 });
      setHistorico(items);
    } catch (err) {
      // silencioso
    } finally {
      setHistoricoLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarHistorico();
  }, [carregarHistorico]);

  // Seleciona estatísticas efetivas: prefere HISTÓRICO; se ausente, usa API
  const getEffectiveStats = (): ResultadoComparacao | null => {
    const match = historico.find((h) => h.dataReferencia === dataReferencia);
    if (match) {
      const pct = typeof match.percentualCompatibilidade === 'string'
        ? parseFloat(match.percentualCompatibilidade)
        : (match as any).percentualCompatibilidade;
      return {
        totalComparacoes: match.totalComparacoes,
        compativeis: match.compativeis,
        divergentes: match.divergentes,
        apenasTransdata: match.apenasTransdata,
        apenasGlobus: match.apenasGlobus,
        horarioDivergente: match.horarioDivergente,
        percentualCompatibilidade: Number.isFinite(pct) ? pct : 0,
        linhasAnalisadas: match.linhasAnalisadas,
        tempoProcessamento: match.tempoProcessamento,
      } as ResultadoComparacao;
    }
    return estatisticas;
  };

  const executarComparacao = async () => {
    setExecutando(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await comparacaoViagensService.executarComparacao(dataReferencia);
      setEstatisticas(result);
      setSuccess(`Comparação executada! ${result.totalComparacoes} registros processados.`);
      toast.success('Comparação executada com sucesso!');
      await carregarDadosIniciais();
      await carregarHistorico();
    } catch (err: any) {
      const msg = err.message || 'Falha ao executar a comparação.';
      setError(msg);
      toast.error(msg);
    } finally {
      setExecutando(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFiltros((prev: FiltrosComparacao) => ({ ...prev, [name]: value, page: 1 }));
  };

  const handleApplyFilters = () => {
    buscarComparacoes(filtros);
  };

  const clearFilters = () => {
    setFiltros(initialFilters);
    buscarComparacoes(initialFilters);
  };

  const handleExecuteClick = () => {
    const hasComparisons = (estatisticas?.totalComparacoes || 0) > 0;
    if (hasComparisons) {
      setOpenConfirmExecute(true);
    } else {
      executarComparacao();
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-black via-neutral-900 to-yellow-950 text-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader />

        {error && (
          <Alert variant="destructive">
            <AlertIcon />
            <AlertTitle>Erro!</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert variant="success">
            <AlertIcon />
            <AlertTitle>Sucesso!</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <Controls
          date={dataReferencia}
          onDateChange={setDataReferencia}
          onExecute={handleExecuteClick}
          executing={executando}
          onToggleFilters={() => setShowFilters(!showFilters)}
          filtersVisible={showFilters}
          onFetchComparisons={handleApplyFilters}
          loading={loading}
          hasComparisons={(estatisticas?.totalComparacoes || 0) > 0}
          onOpenReport={() => setIsReportModalOpen(true)}
        />

        {showFilters && (
          <FilterPanel
            filters={filtros}
            onFilterChange={handleFilterChange}
            onClear={clearFilters}
            onApply={handleApplyFilters}
          />
        )}

        {loading && !estatisticas ? (
          <LoadingState text="Carregando estatísticas..." />
        ) : getEffectiveStats() ? (
          <div className="space-y-6">
            <Statistics stats={getEffectiveStats() as ResultadoComparacao} />
            <HistoricoTable historico={historico} loading={historicoLoading} />

            {loading ? (
              <LoadingState text="Carregando comparações..." />
            ) : comparacoes.length > 0 ? (
              <ComparisonTable comparisons={comparacoes} />
            ) : (
              <GlowingCard className="text-center">
                <CardContent className="p-8">
                  <h3 className="text-lg font-medium text-gray-200">Nenhum resultado para os filtros aplicados.</h3>
                  <p className="text-sm text-gray-400">Tente limpar os filtros ou buscar novamente.</p>
                </CardContent>
              </GlowingCard>
            )}
          </div>
        ) : (
          <EmptyState onExecute={executarComparacao} executing={executando} date={dataReferencia} />
        )}
      </div>

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        stats={getEffectiveStats()}
        comparisons={comparacoes}
        date={dataReferencia}
        filters={filtros}
      />

      <ConfirmDialog
        open={openConfirmExecute}
        onOpenChange={setOpenConfirmExecute}
        variant="warning"
        title="Executar nova comparação para a data selecionada?"
        description={
          <span>
            Ao executar novamente, os <strong>resultados existentes</strong> desta data serão apagados antes de gerar os
            novos, para evitar <strong>duplicidades</strong>. Deseja continuar?
          </span>
        }
        confirmText="Sim, executar"
        cancelText="Cancelar"
        onConfirm={executarComparacao}
      />
    </div>
  );
};

export default ComparacaoViagens;
