import React, { useState, useEffect, useCallback } from 'react';
import { comparacaoViagensService } from '../../services/comparacao/comparacao.service';
import { ResultadoComparacao, ComparacaoViagem, FiltrosComparacao, HistoricoComparacaoResumo } from '../../types/comparacao.types';
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
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Alert, AlertDescription, AlertTitle, AlertIcon } from '../../components/ui/alert';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';
import { toast } from 'react-toastify';

// Sub-components
const PageHeader = () => (
  <div className="pb-4">
    <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#6b5d1a] via-[#7d6b1e] to-[#6b5d1a] dark:from-gray-100 dark:via-white dark:to-gray-100 bg-clip-text text-transparent flex items-center gap-3">
      <GitCompare className="h-8 w-8 text-[#fbcc2c] dark:text-yellow-400" />
      Comparação de Viagens
    </h1>
    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 font-medium">
      Compare dados entre Transdata e Globus para identificar divergências e compatibilidades.
    </p>
  </div>
);

const Controls = ({ date, onDateChange, onExecute, executing, onToggleFilters, filtersVisible, onFetchComparisons, loading, hasComparisons, onOpenReport }: any) => (
  <Card className="border-none shadow-lg bg-white/60 dark:bg-gray-900/60 backdrop-blur-md transition-all duration-300 hover:shadow-xl">
    <CardContent className="p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full lg:w-auto">
          <Label htmlFor="date-picker" className="text-gray-700 dark:text-gray-300 font-medium whitespace-nowrap">
            Data de Referência:
          </Label>
          <div className="relative w-full sm:w-auto">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
            <Input
              id="date-picker"
              type="date"
              value={date}
              onChange={(e) => onDateChange(e.target.value)}
              className="pl-10 w-full sm:w-48 bg-white dark:bg-gray-800/50 border-gray-300 dark:border-gray-700 focus:ring-[#fbcc2c] dark:focus:ring-yellow-500 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <Button
            onClick={onToggleFilters}
            variant={filtersVisible ? 'default' : 'outline'}
            className={`w-full sm:w-auto ${filtersVisible ? 'bg-[#fbcc2c] text-[#6b5d1a] hover:bg-[#e6cd4a]' : 'border-[#fbcc2c]/50 text-[#6b5d1a] dark:text-yellow-400 hover:bg-[#fbcc2c]/10'}`}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
            <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${filtersVisible ? 'rotate-180' : ''}`} />
          </Button>

          {hasComparisons && (
            <Button
              onClick={onFetchComparisons}
              disabled={loading}
              variant="outline"
              className="w-full sm:w-auto border-blue-500/50 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Atualizar
            </Button>
          )}

          <Button
            onClick={onExecute}
            disabled={executing || !date}
            className="w-full sm:w-auto bg-gradient-to-r from-[#fbcc2c] to-[#ecd43c] hover:from-[#e6cd4a] hover:to-[#d4cc54] dark:from-yellow-600 dark:to-amber-600 text-gray-900 font-semibold shadow-md hover:shadow-lg transition-all"
          >
            {executing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            {executing ? 'Executando...' : 'Executar Comparação'}
          </Button>

          {hasComparisons && (
            <Button
              onClick={onOpenReport}
              variant="outline"
              className="w-full sm:w-auto bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <FileText className="h-4 w-4 mr-2" />
              Relatório
            </Button>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);

const Statistics = ({ stats, isModal = false }: { stats: ResultadoComparacao; isModal?: boolean }) => (
  <Card className={`border-none shadow-lg ${isModal ? 'bg-gray-900/50' : 'bg-white/60 dark:bg-gray-900/60'} backdrop-blur-md`}>
    <CardContent className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-[#fbcc2c]/20 dark:bg-yellow-500/20 rounded-lg">
          <BarChart3 className="h-6 w-6 text-[#fbcc2c] dark:text-yellow-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Estatísticas da Comparação</h2>
        <div className="ml-auto flex items-center gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
          <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
          <span>Processado em {stats.tempoProcessamento}</span>
        </div>
      </div>
      <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${isModal ? 'lg:grid-cols-4' : 'lg:grid-cols-8'}`}>
        <StatCard label="Total" value={stats.totalComparacoes} />
        <StatCard label="Compatíveis" value={stats.compativeis} color="text-green-600 dark:text-green-400" icon={<CheckCircle className="h-4 w-4 mb-1" />} />
        <StatCard label="Divergentes" value={stats.divergentes} color="text-red-600 dark:text-red-400" icon={<AlertCircle className="h-4 w-4 mb-1" />} />
        <StatCard label="Horário Div." value={stats.horarioDivergente} color="text-yellow-600 dark:text-yellow-400" icon={<Clock className="h-4 w-4 mb-1" />} />
        <StatCard label="Só Transdata" value={stats.apenasTransdata} color="text-blue-600 dark:text-blue-400" />
        <StatCard label="Só Globus" value={stats.apenasGlobus} color="text-purple-600 dark:text-purple-400" />
        <StatCard label="Compatibilidade" value={`${stats.percentualCompatibilidade}%`} color="text-indigo-600 dark:text-indigo-400" />
        <StatCard label="Linhas" value={stats.linhasAnalisadas} />
      </div>
    </CardContent>
  </Card>
);

const StatCard = ({ label, value, color = 'text-gray-900 dark:text-gray-100', icon }: any) => {
  const formatted = typeof value === 'number' ? value.toLocaleString('pt-BR') : value;
  return (
    <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-100 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50 shadow-sm hover:shadow-md transition-all">
      <div className={`text-2xl font-bold ${color} flex flex-col items-center`}>
        {icon}
        {formatted}
      </div>
      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1 text-center uppercase tracking-wide">{label}</div>
    </div>
  );
};

const FilterPanel = ({ filters, onFilterChange, onClear, onApply }: any) => (
  <Card className="border-none shadow-lg bg-white/60 dark:bg-gray-900/60 backdrop-blur-md animate-in slide-in-from-top-4 duration-300">
    <CardContent className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
      <div className="mt-6 flex justify-end gap-3">
        <Button onClick={onClear} variant="outline" className="border-[#fbcc2c]/50 text-[#6b5d1a] dark:text-yellow-400 hover:bg-[#fbcc2c]/10">Limpar</Button>
        <Button onClick={onApply} className="bg-[#fbcc2c] text-[#6b5d1a] hover:bg-[#e6cd4a]">
          <Filter className="h-4 w-4 mr-2" />
          Aplicar Filtros
        </Button>
      </div>
    </CardContent>
  </Card>
);

const FilterInput = ({ label, name, type, value, onChange, placeholder, children }: any) => (
  <div>
    <Label htmlFor={name} className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</Label>
    {type === 'select' ? (
      <select
        id={name}
        name={name}
        value={value || ''}
        onChange={onChange}
        className="w-full flex h-10 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800/50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fbcc2c] dark:focus-visible:ring-yellow-400 disabled:cursor-not-allowed disabled:opacity-50 text-gray-900 dark:text-gray-100"
      >
        {children}
      </select>
    ) : (
      <Input
        id={name}
        type={type}
        name={name}
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        className="bg-white dark:bg-gray-800/50 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100"
      />
    )}
  </div>
);

const ComparisonTable = ({ comparisons, isModal = false }: { comparisons: ComparacaoViagem[]; isModal?: boolean }) => {
  const getStatusPill = (status: string) => {
    const styles: { [key: string]: string } = {
      compativel: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
      divergente: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
      horario_divergente: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800',
      apenas_transdata: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
      apenas_globus: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
    };
    const text: { [key: string]: string } = {
      compativel: 'Compatível',
      divergente: 'Divergente',
      horario_divergente: 'Horário Div.',
      apenas_transdata: 'Só Transdata',
      apenas_globus: 'Só Globus',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'}`}>
        {text[status] || status}
      </span>
    );
  };

  const getDivergenceClasses = (compatible?: boolean, type: 'servico' | 'sentido' | 'horario' = 'servico') => {
    if (compatible === false) {
      if (type === 'horario') return 'text-yellow-600 dark:text-yellow-400 font-bold';
      return 'text-red-600 dark:text-red-400 font-bold';
    }
    return 'text-gray-900 dark:text-gray-200';
  };

  return (
    <Card className={`border-none shadow-lg ${isModal ? 'bg-gray-900/50' : 'bg-white/60 dark:bg-gray-900/60'} backdrop-blur-md overflow-hidden`}>
      <CardContent className="p-0">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700/50 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Resultados da Comparação</h3>
          <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-md text-xs font-bold">
            {comparisons.length} registros
          </span>
        </div>

        {/* Mobile */}
        <div className="md:hidden p-4 space-y-4">
          {comparisons.map((comp) => (
            <div key={comp.id} className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex justify-between items-start gap-4 mb-3">
                <div className="font-bold text-gray-900 dark:text-gray-100 text-lg">{comp.codigoLinha}</div>
                {getStatusPill(comp.statusComparacao)}
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm border-t border-gray-100 dark:border-gray-700 pt-3">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Serviço (T/G)</p>
                  <div className={`font-medium ${getDivergenceClasses(comp.servicoCompativel, 'servico')}`}>{comp.transdataServico || '-'} / {comp.globusServico || '-'}</div>
                </div>

                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Sentido (T/G)</p>
                  <div className={`font-medium ${getDivergenceClasses(comp.sentidoCompativel, 'sentido')}`}>{comp.transdataSentido || '-'} / {comp.globusSentidoTexto || '-'}</div>
                </div>

                <div className="col-span-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Horário (T/G)</p>
                  <div className={`font-medium ${getDivergenceClasses(comp.horarioCompativel, 'horario')}`}>
                    {comp.transdataHorarioPrevisto || '-'} / {comp.globusHorarioSaida || '-'}
                    {comp.diferencaHorarioMinutos != null && <span className="ml-2 text-yellow-600 dark:text-yellow-400 font-bold">({comp.diferencaHorarioMinutos}m)</span>}
                  </div>
                </div>

                <div className="col-span-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Setor Globus</p>
                  <div className="text-gray-900 dark:text-gray-200 font-medium">{comp.globusSetor || '-'}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Linha</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Serviço (T/G)</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sentido (T/G)</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Horário (T/G)</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Setor Globus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-transparent">
              {comparisons.map((comp) => (
                <tr key={comp.id} className="hover:bg-[#fbcc2c]/5 dark:hover:bg-yellow-500/5 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusPill(comp.statusComparacao)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-gray-200">{comp.codigoLinha}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${getDivergenceClasses(comp.servicoCompativel, 'servico')}`}>{comp.transdataServico || '-'} / {comp.globusServico || '-'}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${getDivergenceClasses(comp.sentidoCompativel, 'sentido')}`}>{comp.transdataSentido || '-'} / {comp.globusSentidoTexto || '-'}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${getDivergenceClasses(comp.horarioCompativel, 'horario')}`}>
                    {comp.transdataHorarioPrevisto || '-'} / {comp.globusHorarioSaida || '-'}
                    {comp.diferencaHorarioMinutos != null && <span className="ml-2 text-yellow-600 dark:text-yellow-400 font-bold">({comp.diferencaHorarioMinutos}m)</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{comp.globusSetor || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
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
  <Card className="border-none shadow-lg bg-white/60 dark:bg-gray-900/60 backdrop-blur-md text-center py-12">
    <CardContent>
      <div className="mx-auto w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
        <GitCompare className="h-10 w-10 text-gray-400" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Nenhuma comparação encontrada</h3>
      <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8">
        Execute a comparação para a data <span className="font-bold text-[#fbcc2c] dark:text-yellow-400">{date}</span> para ver os resultados.
      </p>
      <Button
        onClick={onExecute}
        disabled={executing}
        size="lg"
        className="bg-gradient-to-r from-[#fbcc2c] to-[#ecd43c] hover:from-[#e6cd4a] hover:to-[#d4cc54] dark:from-yellow-600 dark:to-amber-600 text-gray-900 font-semibold shadow-lg hover:shadow-xl transition-all"
      >
        {executing ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Play className="h-5 w-5 mr-2" />}
        {executing ? 'Executando...' : 'Executar Comparação'}
      </Button>
    </CardContent>
  </Card>
);

const LoadingState = ({ text }: { text: string }) => (
  <div className="flex flex-col items-center justify-center py-32">
    <Loader2 className="h-12 w-12 animate-spin text-[#fbcc2c] dark:text-yellow-400 mb-4" />
    <span className="text-lg text-gray-600 dark:text-gray-300 font-medium">{text}</span>
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
      body { font-family: Arial, system-ui, -apple-system, Segoe UI, Roboto, sans-serif; background:#f9fafb; color:#1f2937; padding:16px; }
      h1,h2 { margin: 0 0 12px; color: #111827; }
      .card { border:1px solid #e5e7eb; border-radius:12px; padding:16px; background:#ffffff; margin-bottom:16px; box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1); }
      table { width:100%; border-collapse: collapse; }
      th,td { border:1px solid #e5e7eb; padding:8px; font-size: 13px; }
      th { background:#f3f4f6; text-transform: uppercase; letter-spacing: .04em; font-weight:600; color:#4b5563; }
      .muted { color:#6b7280; font-size:12px; margin-bottom: 16px; }
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
    <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl">
        <div className="flex justify-between items-center mb-6 gap-3">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Relatório de Comparação - {date}</h2>
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
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader />

      {error && (
        <Alert variant="destructive" className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50 text-red-800 dark:text-red-300">
          <AlertIcon className="text-red-600 dark:text-red-400" />
          <AlertTitle>Erro!</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert variant="success" className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/50 text-green-800 dark:text-green-300">
          <AlertIcon className="text-green-600 dark:text-green-400" />
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
            <Card className="border-none shadow-lg bg-white/60 dark:bg-gray-900/60 backdrop-blur-md text-center py-12">
              <CardContent>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Nenhum resultado para os filtros aplicados.</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Tente limpar os filtros ou buscar novamente.</p>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <EmptyState onExecute={executarComparacao} executing={executando} date={dataReferencia} />
      )}

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
