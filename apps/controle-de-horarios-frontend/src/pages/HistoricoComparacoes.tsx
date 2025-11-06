import React, { useCallback, useEffect, useState } from 'react';
import { comparacaoViagensService } from '../services/comparacao/comparacao.service';
import { HistoricoComparacaoResumo } from '../types/comparacao.types';
import { TrendingUp, Calendar, Search, FileText, X, ChevronLeft, ChevronRight, Download } from 'lucide-react';

const downloadCsvReport = (item: HistoricoComparacaoResumo) => {
  if (!item) return;

  const headers = ['Métrica', 'Valor'];
  const fmt = (v?: string) => (v ? new Date(v).toLocaleString() : '');
  const rows = [
    ['Data de Referência', item.dataReferencia],
    ['Executado em', fmt(item.createdAt)],
    ['Executor', item.executedByEmail],
    ['Duração', `${item.tempoProcessamento}`],
    ['Total de Comparações', item.totalComparacoes],
    ['Compatíveis', item.compativeis],
    ['Divergentes', item.divergentes],
    ['Percentual de Compatibilidade', `${item.percentualCompatibilidade}%`],
  ];

  // Escapando vírgulas e aspas
  const escapeCsvCell = (cell) => {
    const strCell = String(cell);
    if (strCell.includes(',') || strCell.includes('"') || strCell.includes('\n')) {
      return `"${strCell.replace(/"/g, '""')}"`;
    }
    return strCell;
  };

  let csvContent = "data:text/csv;charset=utf-8,"
    + headers.map(escapeCsvCell).join(",") + "\n"
    + rows.map(row => row.map(escapeCsvCell).join(",")).join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `relatorio_comparacao_${item.dataReferencia}.csv`);
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
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; margin: 0; background-color: #f0f2f5; color: #333; }
        .container { max-width: 800px; margin: 20px auto; background: #fff; border-radius: 8px; padding: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        h1 { color: #1c2a39; border-bottom: 2px solid #e9ecef; padding-bottom: 15px; margin-bottom: 20px; font-size: 24px; }
        .meta-info { margin-bottom: 20px; font-size: 14px; color: #5a6a7b; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
        .stat { background: #f8f9fa; padding: 20px; border-radius: 6px; border-left: 5px solid; }
        .stat p { margin: 0; }
        .stat .label { font-size: 14px; color: #5a6a7b; margin-bottom: 5px; }
        .stat .value { font-size: 20px; font-weight: 600; color: #1c2a39; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #8a9bab; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Relatório da Comparação</h1>
        <div class="meta-info">
            <p><strong>Data de Referência:</strong> ${item.dataReferencia}</p>
            <p><strong>Executado em:</strong> ${item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}</p>
            <p><strong>Executor:</strong> ${item.executedByEmail}</p>
        </div>
        <div class="grid">
          <div class="stat" style="border-left-color: #ffc107;"><p class="label">Duração do Processamento</p><p class="value">${item.tempoProcessamento}</p></div>
          <div class="stat" style="border-left-color: #007bff;"><p class="label">Total de Comparações</p><p class="value">${item.totalComparacoes}</p></div>
          <div class="stat" style="border-left-color: #28a745;"><p class="label">Compatíveis</p><p class="value">${item.compativeis}</p></div>
          <div class="stat" style="border-left-color: #dc3545;"><p class="label">Divergentes</p><p class="value">${item.divergentes}</p></div>
          <div class="stat" style="border-left-color: #fd7e14;"><p class="label">Percentual de Compatibilidade</p><p class="value">${item.percentualCompatibilidade}%</p></div>
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
  const link = document.createElement("a");
  link.href = href;
  link.download = `relatorio_comparacao_${item.dataReferencia}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(href);
};

// Modal Component for Report
const ReportModal = ({ isOpen, onClose, item }: { isOpen: boolean, onClose: () => void, item: HistoricoComparacaoResumo | null }) => {
  if (!isOpen || !item) return null;

  const stats = [
    { label: 'Data de Referência', value: item.dataReferencia },
    { label: 'Executado em', value: item.createdAt ? new Date(item.createdAt).toLocaleString() : '' },
    { label: 'Executor', value: item.executedByEmail },
    { label: 'Duração', value: `${item.tempoProcessamento}` },
    { label: 'Total de Comparações', value: item.totalComparacoes, className: 'text-blue-300' },
    { label: 'Compatíveis', value: item.compativeis, className: 'text-green-400' },
    { label: 'Divergentes', value: item.divergentes, className: 'text-red-400' },
    { label: 'Percentual de Compatibilidade', value: `${item.percentualCompatibilidade}%`, className: 'text-yellow-400' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
      <div className="bg-neutral-900 border border-yellow-700/30 rounded-2xl shadow-lg shadow-yellow-700/10 w-full max-w-2xl max-h-[90vh] flex flex-col"
      >
        <div className="flex justify-between items-center p-4 border-b border-neutral-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="text-yellow-500" />
            Relatório da Comparação
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
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
            <div className='flex justify-between items-center'>
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
  const [limit, setLimit] = useState<number>(10);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [data, setData] = useState<string>('');
  const [executedByEmail, setExecutedByEmail] = useState<string>('');

  const [isReportModalOpen, setReportModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<HistoricoComparacaoResumo | null>(null);

  const fetchData = useCallback(async (pageToFetch = page) => {
    setLoading(true);
    setError(null);
    try {
      const { items: fetchedItems, total } = await comparacaoViagensService.listarHistorico({
        page: pageToFetch,
        limit,
        data: data || undefined,
        executedByEmail: executedByEmail || undefined,
      });
      setItems(fetchedItems);
      setTotalItems(total);
    } catch (err: any) {
      setError(err.message || 'Falha ao carregar histórico.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, data, executedByEmail]);

  useEffect(() => {
    fetchData(1); // Reset to page 1 on filter change
  }, [data, executedByEmail]);

  useEffect(() => {
    fetchData();
  }, [page]);


  const handleViewReport = (item: HistoricoComparacaoResumo) => {
    setSelectedItem(item);
    setReportModalOpen(true);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= Math.ceil(totalItems / limit)) {
      setPage(newPage);
    }
  }

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

    // Desktop Table
    const desktopView = (
      <table className="hidden md:table min-w-full text-sm">
        <thead className="text-left text-gray-400">
          <tr className="border-b border-yellow-700/20">
            <th className="py-3 px-4">Data Ref.</th>
            <th className="py-3 px-4">Executado em</th>
            <th className="py-3 px-4">Executor</th>
            <th className="py-3 px-4 text-center">Total</th>
            <th className="py-3 px-4 text-center">Compatíveis</th>
            <th className="py-3 px-4 text-center">Divergentes</th>
            <th className="py-3 px-4 text-center">% Compat.</th>
            <th className="py-3 px-4">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800">
          {items.map((h) => (
            <tr key={h.id} className="hover:bg-neutral-800/50">
              <td className="py-3 px-4">{h.dataReferencia}</td>
              <td className="py-3 px-4">{h.createdAt ? new Date(h.createdAt).toLocaleString() : ''}</td>
              <td className="py-3 px-4">{h.executedByEmail || '-'}</td>
              <td className="py-3 px-4 text-center font-semibold text-blue-300">{h.totalComparacoes}</td>
              <td className="py-3 px-4 text-center font-semibold text-green-400">{h.compativeis}</td>
              <td className="py-3 px-4 text-center font-semibold text-red-400">{h.divergentes}</td>
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
    );

    // Mobile Card List
    const mobileView = (
      <div className="block md:hidden space-y-4">
        {items.map((h) => (
          <div key={h.id} className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-700">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm text-gray-400">Data Ref: <span className="font-bold text-white">{h.dataReferencia}</span></p>
                    <p className="text-xs text-gray-500">Executado por: {h.executedByEmail || 'N/A'}</p>
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
              <Calendar className="h-4 w-4" /> Data
            </label>
            <input
              type="date"
              className="w-full mt-1 px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
              value={data}
              onChange={(e) => { setPage(1); setData(e.target.value); }}
            />
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium text-gray-300 flex items-center gap-2 mb-1">
              <Search className="h-4 w-4" /> Executor (e-mail)
            </label>
            <input
              type="text"
              placeholder="analista@empresa.com"
              className="w-full mt-1 px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              value={executedByEmail}
              onChange={(e) => { setPage(1); setExecutedByEmail(e.target.value); }}
            />
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={() => fetchData(1)}
              className="inline-flex items-center gap-2 rounded-md bg-yellow-600 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-500 transition-colors"
            >
              Filtrar
            </button>
            <button
              onClick={() => { setData(''); setExecutedByEmail(''); setPage(1); fetchData(1); }}
              className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium border border-neutral-700 text-gray-300 hover:bg-neutral-800 transition-colors"
            >
              Limpar
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
