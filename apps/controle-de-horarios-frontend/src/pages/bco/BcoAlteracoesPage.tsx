import React from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import * as XLSX from 'xlsx';
import { bcoAlteracoesService } from '../../services/bco-alteracoes/bco-alteracoes.service';
import { BcoItem, BcoResumo, BcoStatusFiltro, BcoListaResponse } from '../../types/bco-alteracoes.types';

const todayISO = () => new Date().toISOString().slice(0, 10);

export const BcoAlteracoesPage: React.FC = () => {
  const qc = useQueryClient();
  const [data, setData] = React.useState<string>(todayISO());
  const [status, setStatus] = React.useState<BcoStatusFiltro>('alteradas');
  const [page, setPage] = React.useState<number>(1);
  const [limite, setLimite] = React.useState<number>(50);

  const resumoQuery = useQuery<BcoResumo | null>({
    queryKey: ['bcoResumo', data],
    queryFn: () => bcoAlteracoesService.getResumo(data),
    enabled: !!data,
    placeholderData: keepPreviousData,
  });

  const listaQuery = useQuery<BcoListaResponse>({
    queryKey: ['bcoLista', data, status, page, limite],
    queryFn: () => bcoAlteracoesService.listar(data, status, { page, limite }),
    enabled: !!data,
    placeholderData: keepPreviousData,
  });

  const verificarMut = useMutation({
    mutationFn: () => bcoAlteracoesService.verificar(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bcoResumo', data] });
      qc.invalidateQueries({ queryKey: ['bcoLista', data] });
    },
  });

  const onVerificar = () => {
    verificarMut.mutate();
  };

  const downloadExcel = async () => {
    try {
      // Buscar todos os itens do status atual para o relatório
      const result = await bcoAlteracoesService.listar(data, status, { page: 1, limite: 10000 });
      const itemsToExport = result.items;

      if (itemsToExport.length === 0) {
        alert(`Não há itens ${status} para exportar.`);
        return;
      }

      const wb = XLSX.utils.book_new();
      const titleStatus = status === 'alteradas' ? 'ALTERAÇÕES' : 'PENDÊNCIAS';

      // Cabeçalho personalizado
      const headerData = [
        [`RELATÓRIO DE ${titleStatus} BCO`],
        [`DATA: ${data}`],
        [`TOTAL: ${itemsToExport.length}`],
        [''], // Linha em branco
        ['Documento', 'IDBCO', 'Prefixo', 'Digitador', 'Data BCO', 'Data Digitação', 'Log Alteração']
      ];

      const ws = XLSX.utils.aoa_to_sheet(headerData);

      // Adicionar dados
      XLSX.utils.sheet_add_json(ws, itemsToExport.map(it => ({
        Documento: it.documento,
        IDBCO: it.idbco,
        Prefixo: it.prefixoVeiculo,
        Digitador: it.digitador,
        'Data BCO': it.dataBco,
        'Data Digitação': it.dataDigitacao,
        'Log Alteração': it.logAlteracao
      })), { origin: 'A6', skipHeader: true });

      // Ajustar larguras
      ws['!cols'] = [
        { wch: 15 }, // Documento
        { wch: 10 }, // IDBCO
        { wch: 10 }, // Prefixo
        { wch: 20 }, // Digitador
        { wch: 12 }, // Data BCO
        { wch: 12 }, // Data Digitação
        { wch: 50 }  // Log Alteração
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Alterações');
      XLSX.writeFile(wb, `BCO_Alteracoes_${data}.xlsx`);
    } catch (error) {
      console.error('Erro ao exportar Excel:', error);
      alert('Erro ao gerar relatório Excel.');
    }
  };

  const downloadHtml = async () => {
    try {
      const result = await bcoAlteracoesService.listar(data, status, { page: 1, limite: 10000 });
      const itemsToExport = result.items;

      if (itemsToExport.length === 0) {
        alert(`Não há itens ${status} para exportar.`);
        return;
      }

      const titleStatus = status === 'alteradas' ? 'Alterações' : 'Pendências';

      const htmlContent = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <title>Relatório BCO - ${data}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; background-color: #f9fafb; }
            .header { margin-bottom: 20px; padding: 20px; background-color: #fff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
            h1 { color: #111827; margin: 0 0 10px 0; font-size: 24px; }
            .meta { color: #6b7280; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; background-color: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
            th { background-color: #f3f4f6; color: #374151; font-weight: 600; text-align: left; padding: 12px 16px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; }
            td { padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #1f2937; font-size: 14px; }
            tr:last-child td { border-bottom: none; }
            tr:hover { background-color: #f9fafb; }
            .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 12px; font-weight: 500; background-color: #d1fae5; color: #065f46; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Relatório de ${titleStatus} BCO</h1>
            <div class="meta">
              <p><strong>Data de Referência:</strong> ${data}</p>
              <p><strong>Total de ${titleStatus}:</strong> ${itemsToExport.length}</p>
              <p><strong>Gerado em:</strong> ${new Date().toLocaleString()}</p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Documento</th>
                <th>IDBCO</th>
                <th>Prefixo</th>
                <th>Digitador</th>
                <th>Data BCO</th>
                <th>Data Digitação</th>
                <th>Log Alteração</th>
              </tr>
            </thead>
            <tbody>
              ${itemsToExport.map(it => `
                <tr>
                  <td>${it.documento}</td>
                  <td>${it.idbco}</td>
                  <td>${it.prefixoVeiculo || '-'}</td>
                  <td>${it.digitador || '-'}</td>
                  <td>${it.dataBco}</td>
                  <td>${it.dataDigitacao || '-'}</td>
                  <td><span class="badge">${it.logAlteracao || ''}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;

      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `BCO_Relatorio_${data}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao exportar HTML:', error);
      alert('Erro ao gerar relatório HTML.');
    }
  };

  const resumo: BcoResumo | null = resumoQuery.data ?? null;
  const items: BcoItem[] = listaQuery.data?.items ?? [];
  const total: number = listaQuery.data?.count ?? 0;
  const totalPages = Math.max(Math.ceil(total / limite), 1);

  React.useEffect(() => { setPage(1); }, [data, status, limite]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-end gap-3">
        <div>
          <label className="block text-sm text-gray-700 dark:text-yellow-300 mb-1">Data</label>
          <input
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            className="px-3 py-2 border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-yellow-200 border-gray-300 dark:border-yellow-500/30"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-700 dark:text-yellow-300 mb-1">Status</label>
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              onClick={() => setStatus('alteradas')}
              className={`px-4 py-2 text-sm font-medium border ${status === 'alteradas' ? 'bg-yellow-400 text-gray-900' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-yellow-200'} border-gray-300 dark:border-yellow-500/30 rounded-l-md`}
            >Alteradas</button>
            <button
              type="button"
              onClick={() => setStatus('pendentes')}
              className={`px-4 py-2 text-sm font-medium border ${status === 'pendentes' ? 'bg-yellow-400 text-gray-900' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-yellow-200'} border-gray-300 dark:border-yellow-500/30 rounded-r-md`}
            >Pendentes</button>
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-700 dark:text-yellow-300 mb-1">Itens por página</label>
          <select
            value={limite}
            onChange={(e) => setLimite(parseInt(e.target.value, 10))}
            className="px-3 py-2 border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-yellow-200 border-gray-300 dark:border-yellow-500/30"
          >
            {[25, 50, 100, 200].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="md:ml-auto">
          <button
            onClick={onVerificar}
            disabled={verificarMut.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-yellow-400 text-gray-900 hover:bg-yellow-300 disabled:opacity-60"
          >
            {verificarMut.isPending ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-gray-900 border-t-transparent" />
                <span>Verificando...</span>
              </>
            ) : 'Verificar/Atualizar'}
          </button>
          <div className="mt-2 flex gap-2 justify-end">
            <button
              onClick={downloadExcel}
              className="text-xs px-3 py-1.5 rounded border border-green-600 text-green-700 hover:bg-green-50 dark:text-green-400 dark:border-green-500/50 dark:hover:bg-green-900/20 transition-colors"
              title="Baixar Excel"
            >
              Excel
            </button>
            <button
              onClick={downloadHtml}
              className="text-xs px-3 py-1.5 rounded border border-blue-600 text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-500/50 dark:hover:bg-blue-900/20 transition-colors"
              title="Baixar HTML"
            >
              HTML
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard title="Total" value={resumo?.totalDocumentos ?? 0}   />
        <StatCard title="Alteradas" value={resumo?.totalAlteradas ?? 0} subtitle={resumo?.novasAlteracoes ? `+${resumo.novasAlteracoes} novas` : undefined} />
        <StatCard title="Pendentes" value={resumo?.totalPendentes ?? 0} />
      </div>

      {/* Mobile list (cards) */}
      <div className="md:hidden">
        {listaQuery.isLoading ? (
          <div className="p-4 text-center text-sm text-gray-600 dark:text-yellow-300">Carregando…</div>
        ) : items.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-600 dark:text-yellow-300">Nenhum registro</div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-yellow-500/20">
            {items.map((it) => (
              <li key={`${it.idbco}-${it.documento}`} className="p-4 bg-white/60 dark:bg-gray-900/40">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-gray-900 dark:text-yellow-100">
                    {it.documento}
                  </div>
                  <div className="text-xs font-medium text-gray-700 dark:text-yellow-300">IDBCO: {it.idbco}</div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div className="text-gray-700 dark:text-yellow-200"><span className="font-medium">Prefixo:</span> {it.prefixoVeiculo ?? '-'}</div>
                  <div className="text-gray-700 dark:text-yellow-200 text-right"><span className="font-medium">Digitador:</span> {it.digitador ?? '-'}</div>
                  <div className="text-gray-700 dark:text-yellow-200"><span className="font-medium">Data BCO:</span> {it.dataBco}</div>
                  <div className="text-gray-700 dark:text-yellow-200 text-right"><span className="font-medium">Digitação:</span> {it.dataDigitacao ?? '-'}</div>
                </div>
                <div className="mt-2">
                  {it.logAlteracao ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">{it.logAlteracao}</span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">Pendente</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-yellow-500/30">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <Th>Documento</Th>
              <Th>IDBCO</Th>
              <Th>Prefixo</Th>
              <Th>Digitador</Th>
              <Th>Data BCO</Th>
              <Th>Data Digitação</Th>
              <Th>Log Alteração</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-yellow-500/20">
            {listaQuery.isLoading ? (
              <tr><td colSpan={7} className="p-4 text-center text-sm text-gray-500">Carregando…</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={7} className="p-4 text-center text-sm text-gray-500">Nenhum registro</td></tr>
            ) : (
              items.map((it) => (
                <tr key={`${it.idbco}-${it.documento}`} className="bg-white/60 dark:bg-gray-900/40">
                  <Td>{it.documento}</Td>
                  <Td>{it.idbco}</Td>
                  <Td>{it.prefixoVeiculo ?? '-'}</Td>
                  <Td>{it.digitador ?? '-'}</Td>
                  <Td>{it.dataBco}</Td>
                  <Td>{it.dataDigitacao ?? '-'}</Td>
                  <Td>
                    {it.logAlteracao ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        {it.logAlteracao}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                        Pendente
                      </span>
                    )}
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-600 dark:text-yellow-300">{total} registros</p>
        <div className="inline-flex rounded-md shadow-sm" role="group">
          <button
            className="px-3 py-1 border rounded-l-md bg-white dark:bg-gray-800 text-gray-700 dark:text-yellow-200 border-gray-300 dark:border-yellow-500/30 disabled:opacity-60"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >Anterior</button>
          <span className="px-3 py-1 text-sm bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-yellow-200 border-t border-b border-gray-300 dark:border-yellow-500/30">{page} / {totalPages}</span>
          <button
            className="px-3 py-1 border rounded-r-md bg-white dark:bg-gray-800 text-gray-700 dark:text-yellow-200 border-gray-300 dark:border-yellow-500/30 disabled:opacity-60"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >Próxima</button>
        </div>
      </div>
    </div>
  );
};

const Th: React.FC<React.PropsWithChildren<{}>> = ({ children }) => (
  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-yellow-300 uppercase tracking-wider">{children}</th>
);
const Td: React.FC<React.PropsWithChildren<{}>> = ({ children }) => (
  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-800 dark:text-yellow-200">{children}</td>
);

const StatCard: React.FC<{ title: string; value: number; subtitle?: string }> = ({ title, value, subtitle }) => (
  <div className="rounded-lg border border-gray-200 dark:border-yellow-500/30 p-4 bg-white/60 dark:bg-gray-900/60">
    <div className="text-sm text-gray-700 dark:text-yellow-300">{title}</div>
    <div className="text-2xl font-bold text-gray-900 dark:text-yellow-200">{value}</div>
    {subtitle && <div className="text-xs text-gray-500 dark:text-yellow-400 mt-1">{subtitle}</div>}
  </div>
);

export default BcoAlteracoesPage;
