import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { comparacaoViagensService } from '../services/comparacao/comparacao.service';
import { HistoricoComparacaoResumo } from '../types/comparacao.types';
import { TrendingUp, Calendar, FileText, X, ChevronLeft, ChevronRight, Download } from 'lucide-react';

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
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; margin: 0; background-color: #0b0b0b; color: #e5e7eb; }
        .container { max-width: 900px; margin: 24px auto; background: #111827; border-radius: 12px; padding: 28px; border: 1px solid #374151; }
        h1 { color: #f59e0b; border-bottom: 1px solid #374151; padding-bottom: 12px; margin-bottom: 20px; font-size: 22px; }
        .meta-info { margin-bottom: 20px; font-size: 14px; color: #9ca3af; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px; }
        .stat { background: #0f172a; padding: 16px; border-radius: 8px; border-left: 4px solid #f59e0b; }
        .stat p { margin: 0; }
        .stat .label { font-size: 12px; color: #9ca3af; margin-bottom: 6px; }
        .stat .value { font-size: 18px; font-weight: 600; color: #f3f4f6; }
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
    { label: 'Total de Comparações', value: item.totalComparacoes, className: 'text-blue-300' },
    { label: 'Compatíveis', value: item.compativeis, className: 'text-green-400' },
    { label: 'Divergentes', value: item.divergentes, className: 'text-red-400' },
    { label: 'Percentual de Compatibilidade', value: `${item.percentualCompatibilidade}%`, className: 'text-yellow-400' },
    { label: 'Apenas Transdata', value: item.apenasTransdata },
    { label: 'Apenas Globus', value: item.apenasGlobus },
    { label: 'Horário Divergente', value: item.horarioDivergente },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
      <div className="bg-neutral-900 border border-yellow-700/30 rounded-2xl shadow-lg shadow-yellow-700/10 w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-neutral-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="text-yellow-500" />
            Relatório da Comparação
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Fechar">
            <X size={24} />
          </button>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6 overflow-y-auto">
          {stats.map(({ label, value, className }) => (
            <div key={label} className="bg-neutral-800/50 p-4 rounded-lg">
              <p className="text-sm text-gray-400">{label}</p>
              <p className={`text-lg font-semibold ${className || 'text-white'}`}>{value}</p>
            </div>
          ))}
        </div>
        <div className="p-4 mt-auto border-t border-neutral-800">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">Exportar relatório:</p>
            <div className="flex gap-2">
              <button onClick={() => downloadHtmlReport(item)} className="inline-flex items-center gap-2 rounded-md bg-neutral-700 px-3 py-2 text-xs font-medium text-gray-200 hover:bg-neutral-600 transition-colors">
                <Download size={14}/> HTML
              </button>
              <button onClick={() => downloadCsvReport(item)} className="inline-flex items-center gap-2 rounded-md bg-neutral-700 px-3 py-2 text-xs font-medium text-gray-200 hover:bg-neutral-600 transition-colors">
                <Download size={14}/> Excel (CSV)
              </button>
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
  const [dataInicial, setDataInicial] = useState<string>(() => startOfMonth(new Date()).toISOString().slice(0,10));
  const [dataFinal, setDataFinal] = useState<string>(() => endOfMonth(new Date()).toISOString().slice(0,10));

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
      // Optional: cycle back to ascending or remove sort
      direction = 'ascending';
    }
    setSortConfig({ key, direction });
  };

  const SortableHeader: React.FC<{ title: string; sortKey: keyof HistoricoComparacaoResumo; className?: string }> = ({ title, sortKey, className }) => {
    const isSorted = sortConfig.key === sortKey;
    const icon = isSorted ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : '';
    return (
      <th className={`py-3 px-4 cursor-pointer ${className || ''}`} onClick={() => requestSort(sortKey)}>
        {title} <span className="text-yellow-500">{icon}</span>
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
      return <div className="text-center p-10 text-gray-400">Carregando histórico...</div>;
    }
    if (error) {
      return <div className="text-center p-10 text-red-400">{error}</div>;
    }
    if (items.length === 0) {
      return <div className="text-center p-10 text-gray-400">Nenhum registro encontrado.</div>;
    }

    const desktopView = (
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-left text-gray-400">
            <tr className="border-b border-yellow-700/20">
              <SortableHeader title="Data Ref." sortKey="dataReferencia" />
              <SortableHeader title="Linhas" sortKey="linhasAnalisadas" className="text-center" />
              <SortableHeader title="Total" sortKey="totalComparacoes" className="text-center" />
              <SortableHeader title="Compatíveis" sortKey="compativeis" className="text-center" />
              <SortableHeader title="Divergentes" sortKey="divergentes" className="text-center" />
              <SortableHeader title="Apenas TD" sortKey="apenasTransdata" className="text-center" />
              <SortableHeader title="Apenas GB" sortKey="apenasGlobus" className="text-center" />
              <SortableHeader title="Horário Dif." sortKey="horarioDivergente" className="text-center" />
              <SortableHeader title="% Compat." sortKey="percentualCompatibilidade" className="text-center" />
              <th className="py-3 px-4">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {sortedItems.map((h) => (
              <tr key={h.id} className="hover:bg-neutral-800/50">
                <td className="py-3 px-4">{h.dataReferencia}</td>
                <td className="py-3 px-4 text-center">{h.linhasAnalisadas}</td>
                <td className="py-3 px-4 text-center font-semibold text-blue-300">{h.totalComparacoes}</td>
                <td className="py-3 px-4 text-center font-semibold text-green-400">{h.compativeis}</td>
                <td className="py-3 px-4 text-center font-semibold text-red-400">{h.divergentes}</td>
                <td className="py-3 px-4 text-center">{h.apenasTransdata}</td>
                <td className="py-3 px-4 text-center">{h.apenasGlobus}</td>
                <td className="py-3 px-4 text-center">{h.horarioDivergente}</td>
                <td className="py-3 px-4 text-center font-semibold text-yellow-400">{h.percentualCompatibilidade}%</td>
                <td className="py-3 px-4">
                  <button onClick={() => handleViewReport(h)} className="bg-yellow-600 text-black px-3 py-1 rounded-md text-xs font-bold hover:bg-yellow-500">
                    Visualizar
                  </button>
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
          <div key={h.id} className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-700">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-400">Data Ref: <span className="font-bold text-white">{h.dataReferencia}</span></p>
                <p className="text-xs text-gray-500">Executado: {h.createdAt ? new Date(h.createdAt).toLocaleString() : ''}</p>
              </div>
              <button onClick={() => handleViewReport(h)} className="bg-yellow-600 text-black px-3 py-1 rounded-md text-xs font-bold hover:bg-yellow-500">
                Relatório
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center mt-4 pt-4 border-t border-neutral-700">
              <div>
                <p className="text-xs text-gray-400">Compatíveis</p>
                <p className="font-bold text-lg text-green-400">{h.compativeis}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Divergentes</p>
                <p className="font-bold text-lg text-red-400">{h.divergentes}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">% Compat.</p>
                <p className="font-bold text-lg text-yellow-400">{h.percentualCompatibilidade}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Apenas TD</p>
                <p className="font-bold text-lg text-blue-300">{h.apenasTransdata}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Apenas GB</p>
                <p className="font-bold text-lg text-blue-300">{h.apenasGlobus}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Horário Dif.</p>
                <p className="font-bold text-lg text-blue-300">{h.horarioDivergente}</p>
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
    <div className="min-h-screen bg-gradient-to-b from-black via-neutral-900 to-yellow-950 text-white p-4 sm:p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <TrendingUp className="h-8 w-8 text-yellow-500" />
          Histórico de Comparações
        </h1>
      </header>

      <div className="bg-gray-900/50 border border-yellow-700/30 rounded-xl p-4 mb-8 shadow-lg shadow-yellow-700/10">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[150px]">
            <label className="text-sm font-medium text-gray-300 flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4" /> Período (início)
            </label>
            <input
              type="date"
              className="w-full mt-1 px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
              value={dataInicial}
              onChange={(e) => { setPage(1); setDataInicial(e.target.value); }}
            />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="text-sm font-medium text-gray-300 flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4" /> Período (fim)
            </label>
            <input
              type="date"
              className="w-full mt-1 px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
              value={dataFinal}
              onChange={(e) => { setPage(1); setDataFinal(e.target.value); }}
            />
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={() => {
                if (page !== 1) {
                  setPage(1);
                } else {
                  setFetchTrigger(t => t + 1);
                }
              }}
              className="inline-flex items-center gap-2 rounded-md bg-yellow-600 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-500 transition-colors"
            >
              Filtrar
            </button>
            <button
              onClick={() => {
                const di = startOfMonth(new Date());
                const df = endOfMonth(new Date());
                setPage(1);
                setDataInicial(di.toISOString().slice(0, 10));
                setDataFinal(df.toISOString().slice(0, 10));
              }}
              className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium border border-neutral-700 text-gray-300 hover:bg-neutral-800 transition-colors"
            >
              Mês atual
            </button>
          </div>
        </div>
      </div>

      <main className="bg-gray-900/50 border border-yellow-700/30 rounded-xl shadow-lg shadow-yellow-700/10 overflow-hidden">
        {renderContent()}
      </main>

      {items.length > 0 && (
        <footer className="flex justify-center items-center gap-4 mt-8">
          <button onClick={() => handlePageChange(page - 1)} disabled={page <= 1} className="p-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-full bg-neutral-800 hover:bg-yellow-600 hover:text-black transition-colors">
            <ChevronLeft />
          </button>
          <span className="text-sm text-gray-400">
            Página {page} de {Math.ceil(totalItems / limit)}
          </span>
          <button onClick={() => handlePageChange(page + 1)} disabled={page >= Math.ceil(totalItems / limit)} className="p-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-full bg-neutral-800 hover:bg-yellow-600 hover:text-black transition-colors">
            <ChevronRight />
          </button>
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
