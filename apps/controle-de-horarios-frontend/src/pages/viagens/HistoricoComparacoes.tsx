import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { comparacaoViagensService } from '../../services/comparacao/comparacao.service';
import { HistoricoComparacaoResumo } from '../../types/comparacao.types';
import { TrendingUp, Calendar, FileText, X, ChevronLeft, ChevronRight, Download, Filter } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const startOfWeek = (d: Date) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1) - day; // Monday as first day
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
};

const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

const downloadCsvReport = (item: HistoricoComparacaoResumo) => {
  if (!item) return;

  const headers = ['Métrica', 'Valor'];
  const fmt = (v?: string) => (v ? new Date(v).toLocaleString() : '');
  const rows = [
    ['Data de Referência', item.dataReferencia],
    ['Executado em', fmt(item.createdAt)],
    ['Executor', item.executedByEmail ?? ''],
    ['Duration (ms)', `${item.durationMs}`],
    ['Linhas Analisadas', `${item.linhasAnalisadas}`],
    ['Total de Comparações', `${item.totalComparacoes}`],
    ['Compatíveis', `${item.compativeis}`],
    ['Divergentes', `${item.divergentes}`],
    ['Apenas Transdata', `${item.apenasTransdata}`],
    ['Apenas Globus', `${item.apenasGlobus}`],
    ['Horário Divergente', `${item.horarioDivergente}`],
    ['Percentual de Compatibilidade', `${item.percentualCompatibilidade}%`],
  ];

  const escapeCsvCell = (cell: unknown) => {
    const strCell = String(cell ?? '');
    if (strCell.includes(',') || strCell.includes('"') || strCell.includes('\n')) {
      return `"${strCell.replace(/"/g, '""')}"`;
    }
    return strCell;
  };

  const csvContent = 'data:text/csv;charset=utf-8,'
    + headers.map(escapeCsvCell).join(',') + '\n'
    + rows.map(row => row.map(escapeCsvCell).join(',')).join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `relatorio_comparacao_${item.dataReferencia}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const downloadHtmlReport = (item: HistoricoComparacaoResumo) => {
  if (!item) return;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Relatório de Comparação - ${item.dataReferencia}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; margin: 0; background-color: #f9fafb; color: #1f2937; }
        .container { max-width: 900px; margin: 24px auto; background: #ffffff; border-radius: 12px; padding: 28px; border: 1px solid #e5e7eb; box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1); }
        h1 { color: #111827; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px; margin-bottom: 20px; font-size: 22px; }
        .meta-info { margin-bottom: 20px; font-size: 14px; color: #6b7280; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px; }
        .stat { background: #f3f4f6; padding: 16px; border-radius: 8px; border-left: 4px solid #fbcc2c; }
        .stat p { margin: 0; }
        .stat .label { font-size: 12px; color: #6b7280; margin-bottom: 6px; }
        .stat .value { font-size: 18px; font-weight: 600; color: #111827; }
        .footer { text-align: center; margin-top: 24px; font-size: 12px; color: #9ca3af; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Relatório da Comparação</h1>
        <div class="meta-info">
            <p><strong>Data de Referência:</strong> ${item.dataReferencia}</p>
            <p><strong>Executado em:</strong> ${item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}</p>
            <p><strong>Executor:</strong> ${item.executedByEmail ?? ''}</p>
        </div>
        <div class="grid">
          <div class="stat"><p class="label">Total de Comparações</p><p class="value">${item.totalComparacoes}</p></div>
          <div class="stat"><p class="label">Compatíveis</p><p class="value">${item.compativeis}</p></div>
          <div class="stat"><p class="label">Divergentes</p><p class="value">${item.divergentes}</p></div>
          <div class="stat"><p class="label">Apenas Transdata</p><p class="value">${item.apenasTransdata}</p></div>
          <div class="stat"><p class="label">Apenas Globus</p><p class="value">${item.apenasGlobus}</p></div>
          <div class="stat"><p class="label">Horário Divergente</p><p class="value">${item.horarioDivergente}</p></div>
          <div class="stat"><p class="label">Linhas Analisadas</p><p class="value">${item.linhasAnalisadas}</p></div>
          <div class="stat"><p class="label">Percentual de Compatibilidade</p><p class="value">${item.percentualCompatibilidade}%</p></div>
        </div>
        <div class="footer">
          Relatório gerado em ${new Date().toLocaleString()}
        </div>
      </div>
    </body>
    </html>
  `;

  const blob = new Blob([htmlContent], { type: 'text/html' });
  const href = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = href;
  link.download = `relatorio_comparacao_${item.dataReferencia}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(href);
};

const ReportModal = ({ isOpen, onClose, item }: { isOpen: boolean, onClose: () => void, item: HistoricoComparacaoResumo | null }) => {
  if (!isOpen || !item) return null;

  const stats: Array<{ label: string; value: React.ReactNode; className?: string }> = [
    { label: 'Data de Referência', value: item.dataReferencia },
    { label: 'Executado em', value: item.createdAt ? new Date(item.createdAt).toLocaleString() : '' },
    { label: 'Linhas Analisadas', value: item.linhasAnalisadas },
    { label: 'Total de Comparações', value: item.totalComparacoes, className: 'text-blue-600 dark:text-blue-400' },
    { label: 'Compatíveis', value: item.compativeis, className: 'text-green-600 dark:text-green-400' },
    { label: 'Divergentes', value: item.divergentes, className: 'text-red-600 dark:text-red-400' },
    { label: 'Percentual de Compatibilidade', value: `${item.percentualCompatibilidade}%`, className: 'text-yellow-600 dark:text-yellow-400' },
    { label: 'Apenas Transdata', value: item.apenasTransdata },
    { label: 'Apenas Globus', value: item.apenasGlobus },
    { label: 'Horário Divergente', value: item.horarioDivergente },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/80 z-50 flex justify-center items-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <FileText className="text-[#fbcc2c] dark:text-yellow-400" />
            Relatório da Comparação
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fechar">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6 overflow-y-auto">
          {stats.map(({ label, value, className }) => (
            <div key={label} className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
              <p className={`text-lg font-semibold ${className || 'text-gray-900 dark:text-gray-100'}`}>{value}</p>
            </div>
          ))}
        </div>
        <div className="p-6 mt-auto border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 rounded-b-2xl">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">Exportar relatório:</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => downloadHtmlReport(item)}>
                <Download className="h-4 w-4 mr-2" /> HTML
              </Button>
              <Button variant="outline" size="sm" onClick={() => downloadCsvReport(item)}>
                <Download className="h-4 w-4 mr-2" /> Excel (CSV)
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const HistoricoComparacoes: React.FC = () => {
  const [items, setItems] = useState<HistoricoComparacaoResumo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(31);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [dataInicial, setDataInicial] = useState<string>(() => startOfMonth(new Date()).toISOString().slice(0, 10));
  const [dataFinal, setDataFinal] = useState<string>(() => endOfMonth(new Date()).toISOString().slice(0, 10));

  const [isReportModalOpen, setReportModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<HistoricoComparacaoResumo | null>(null);

  const [fetchTrigger, setFetchTrigger] = useState(0);

  const [sortConfig, setSortConfig] = useState<{ key: keyof HistoricoComparacaoResumo | null; direction: 'ascending' | 'descending' }>({ key: 'dataReferencia', direction: 'descending' });

  useEffect(() => {
    const initialDate = new Date(dataInicial);
    const finalDate = new Date(dataFinal);

    const startOfSelectedMonth = startOfMonth(initialDate);
    const endOfSelectedMonth = endOfMonth(initialDate);

    const isFullMonth =
      initialDate.toISOString().slice(0, 10) === startOfSelectedMonth.toISOString().slice(0, 10) &&
      finalDate.toISOString().slice(0, 10) === endOfSelectedMonth.toISOString().slice(0, 10) &&
      initialDate.getMonth() === finalDate.getMonth() &&
      initialDate.getFullYear() === finalDate.getFullYear();

    if (isFullMonth) {
      setLimit(31);
    } else {
      setLimit(31);
    }
  }, [dataInicial, dataFinal]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    comparacaoViagensService.listarHistorico({
      page,
      limit,
      dataInicial,
      dataFinal,
    })
      .then(({ items: fetchedItems, total }) => {
        setItems(fetchedItems);
        setTotalItems(total);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Falha ao carregar histórico.';
        setError(message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [page, limit, dataInicial, dataFinal, fetchTrigger]);

  const sortedItems = useMemo(() => {
    let sortableItems = [...items];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const valA = a[sortConfig.key!];
        const valB = b[sortConfig.key!];

        let comparison = 0;
        if (sortConfig.key === 'dataReferencia') {
          comparison = new Date(valA as string).getTime() - new Date(valB as string).getTime();
        } else {
          const numA = Number(valA);
          const numB = Number(valB);
          if (!isNaN(numA) && !isNaN(numB)) {
            comparison = numA - numB;
          } else {
            comparison = String(valA).localeCompare(String(valB));
          }
        }

        return sortConfig.direction === 'descending' ? -comparison : comparison;
      });
    }
    return sortableItems;
  }, [items, sortConfig]);

  const requestSort = (key: keyof HistoricoComparacaoResumo) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    } else if (sortConfig.key === key && sortConfig.direction === 'descending') {
      direction = 'ascending';
    }
    setSortConfig({ key, direction });
  };

  const SortableHeader: React.FC<{ title: string; sortKey: keyof HistoricoComparacaoResumo; className?: string }> = ({ title, sortKey, className }) => {
    const isSorted = sortConfig.key === sortKey;
    const icon = isSorted ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : '';
    return (
      <th className={`py-3 px-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors ${className || ''}`} onClick={() => requestSort(sortKey)}>
        <div className="flex items-center gap-1">
          {title} <span className="text-[#fbcc2c] dark:text-yellow-400 text-xs">{icon}</span>
        </div>
      </th>
    );
  };

  const handleViewReport = (item: HistoricoComparacaoResumo) => {
    setSelectedItem(item);
    setReportModalOpen(true);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= Math.ceil(totalItems / limit)) {
      setPage(newPage);
    }
  };

  const renderContent = () => {
    if (loading) {
      return <div className="text-center p-10 text-gray-500 dark:text-gray-400">Carregando histórico...</div>;
    }
    if (error) {
      return <div className="text-center p-10 text-red-500 dark:text-red-400">{error}</div>;
    }
    if (items.length === 0) {
      return <div className="text-center p-10 text-gray-500 dark:text-gray-400">Nenhum registro encontrado.</div>;
    }

    const desktopView = (
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 font-medium">
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <SortableHeader title="Data Ref." sortKey="dataReferencia" />
              <SortableHeader title="Linhas" sortKey="linhasAnalisadas" className="text-center" />
              <SortableHeader title="Total" sortKey="totalComparacoes" className="text-center" />
              <SortableHeader title="Compatíveis" sortKey="compativeis" className="text-center" />
              <SortableHeader title="Divergentes" sortKey="divergentes" className="text-center" />
              <SortableHeader title="Apenas TD" sortKey="apenasTransdata" className="text-center" />
              <SortableHeader title="Apenas GB" sortKey="apenasGlobus" className="text-center" />
              <SortableHeader title="Horário Dif." sortKey="horarioDivergente" className="text-center" />
              <SortableHeader title="% Compat." sortKey="percentualCompatibilidade" className="text-center" />
              <th className="py-3 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {sortedItems.map((h) => (
              <tr key={h.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                <td className="py-3 px-4 text-gray-900 dark:text-gray-100 font-medium">{h.dataReferencia}</td>
                <td className="py-3 px-4 text-center text-gray-600 dark:text-gray-300">{h.linhasAnalisadas}</td>
                <td className="py-3 px-4 text-center font-semibold text-blue-600 dark:text-blue-400">{h.totalComparacoes}</td>
                <td className="py-3 px-4 text-center font-semibold text-green-600 dark:text-green-400">{h.compativeis}</td>
                <td className="py-3 px-4 text-center font-semibold text-red-600 dark:text-red-400">{h.divergentes}</td>
                <td className="py-3 px-4 text-center text-gray-600 dark:text-gray-300">{h.apenasTransdata}</td>
                <td className="py-3 px-4 text-center text-gray-600 dark:text-gray-300">{h.apenasGlobus}</td>
                <td className="py-3 px-4 text-center text-gray-600 dark:text-gray-300">{h.horarioDivergente}</td>
                <td className="py-3 px-4 text-center font-semibold text-yellow-600 dark:text-yellow-400">{h.percentualCompatibilidade}%</td>
                <td className="py-3 px-4 text-right">
                  <Button size="sm" variant="outline" onClick={() => handleViewReport(h)} className="h-8 text-xs font-bold">
                    Visualizar
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );

    const mobileView = (
      <div className="block md:hidden space-y-4">
        {sortedItems.map((h) => (
          <div key={h.id} className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Data Ref: <span className="font-bold text-gray-900 dark:text-gray-100">{h.dataReferencia}</span></p>
                <p className="text-xs text-gray-400 dark:text-gray-500">Executado: {h.createdAt ? new Date(h.createdAt).toLocaleString() : ''}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => handleViewReport(h)} className="h-8 text-xs">
                Relatório
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center pt-4 border-t border-gray-100 dark:border-gray-700">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Compatíveis</p>
                <p className="font-bold text-lg text-green-600 dark:text-green-400">{h.compativeis}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Divergentes</p>
                <p className="font-bold text-lg text-red-600 dark:text-red-400">{h.divergentes}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">% Compat.</p>
                <p className="font-bold text-lg text-yellow-600 dark:text-yellow-400">{h.percentualCompatibilidade}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Apenas TD</p>
                <p className="font-bold text-lg text-blue-600 dark:text-blue-400">{h.apenasTransdata}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Apenas GB</p>
                <p className="font-bold text-lg text-purple-600 dark:text-purple-400">{h.apenasGlobus}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Horário Dif.</p>
                <p className="font-bold text-lg text-orange-600 dark:text-orange-400">{h.horarioDivergente}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );

    return <>
      {desktopView}
      {mobileView}
    </>;
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="pb-4">
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#6b5d1a] via-[#7d6b1e] to-[#6b5d1a] dark:from-gray-100 dark:via-white dark:to-gray-100 bg-clip-text text-transparent flex items-center gap-3">
          <TrendingUp className="h-8 w-8 text-[#fbcc2c] dark:text-yellow-400" />
          Histórico de Comparações
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 font-medium">
          Visualize o histórico de execuções e relatórios de comparações passadas.
        </p>
      </header>

      <Card className="border-none shadow-lg bg-white/60 dark:bg-gray-900/60 backdrop-blur-md">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-end gap-4">
            <div className="flex-1 w-full md:w-auto">
              <Label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                <Calendar className="h-4 w-4 inline mr-2" /> Período (início)
              </Label>
              <Input
                type="date"
                className="bg-white dark:bg-gray-800/50 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100"
                value={dataInicial}
                onChange={(e) => { setPage(1); setDataInicial(e.target.value); }}
              />
            </div>
            <div className="flex-1 w-full md:w-auto">
              <Label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                <Calendar className="h-4 w-4 inline mr-2" /> Período (fim)
              </Label>
              <Input
                type="date"
                className="bg-white dark:bg-gray-800/50 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100"
                value={dataFinal}
                onChange={(e) => { setPage(1); setDataFinal(e.target.value); }}
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <Button
                onClick={() => {
                  if (page !== 1) {
                    setPage(1);
                  } else {
                    setFetchTrigger(t => t + 1);
                  }
                }}
                className="flex-1 md:flex-none bg-[#fbcc2c] text-[#6b5d1a] hover:bg-[#e6cd4a]"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtrar
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const di = startOfMonth(new Date());
                  const df = endOfMonth(new Date());
                  setPage(1);
                  setDataInicial(di.toISOString().slice(0, 10));
                  setDataFinal(df.toISOString().slice(0, 10));
                }}
                className="flex-1 md:flex-none border-gray-200 dark:border-gray-700"
              >
                Mês atual
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-lg bg-white/60 dark:bg-gray-900/60 backdrop-blur-md overflow-hidden">
        <CardContent className="p-0">
          {renderContent()}
        </CardContent>
      </Card>

      {items.length > 0 && (
        <footer className="flex justify-center items-center gap-4 mt-8">
          <Button variant="outline" size="icon" onClick={() => handlePageChange(page - 1)} disabled={page <= 1} className="rounded-full">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
            Página {page} de {Math.ceil(totalItems / limit)}
          </span>
          <Button variant="outline" size="icon" onClick={() => handlePageChange(page + 1)} disabled={page >= Math.ceil(totalItems / limit)} className="rounded-full">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </footer>
      )}

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setReportModalOpen(false)}
        item={selectedItem}
      />
    </div>
  );
};

export default HistoricoComparacoes;
