import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { comparacaoViagensService } from '../services/comparacao/comparacao.service';
import { HistoricoComparacaoResumo } from '../types/comparacao.types';
import { TrendingUp, Calendar, Search } from 'lucide-react';

export const HistoricoComparacoes: React.FC = () => {
  const [items, setItems] = useState<HistoricoComparacaoResumo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(20);
  const [data, setData] = useState<string>('');
  const [executedByEmail, setExecutedByEmail] = useState<string>('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { items, total } = await comparacaoViagensService.listarHistorico({
        page,
        limit,
        data: data || undefined,
        executedByEmail: executedByEmail || undefined,
      });
      setItems(items);
    } catch (err: any) {
      setError(err.message || 'Falha ao carregar histórico.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, data, executedByEmail]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <TrendingUp className="h-6 w-6 text-purple-600" />
        <h1 className="text-2xl font-semibold text-gray-100">Histórico de Comparações</h1>
      </div>

      <div className="bg-primary-600 rounded-lg p-4 border border-primary-500">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col">
            <label className="text-sm text-gray-200 flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Data de Referência
            </label>
            <input
              type="date"
              className="mt-1 px-3 py-2 rounded-md bg-primary-700 border border-primary-500 text-gray-100"
              value={data}
              onChange={(e) => { setPage(1); setData(e.target.value); }}
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-gray-200 flex items-center gap-2">
              <Search className="h-4 w-4" /> Executor (e-mail)
            </label>
            <input
              type="text"
              placeholder="ex: analista@empresa.com"
              className="mt-1 px-3 py-2 rounded-md bg-primary-700 border border-primary-500 text-gray-100 placeholder:text-gray-400"
              value={executedByEmail}
              onChange={(e) => { setPage(1); setExecutedByEmail(e.target.value); }}
            />
          </div>

          <div className="flex items-end gap-2 ml-auto">
            <button
              onClick={() => fetchData()}
              className="inline-flex items-center gap-2 rounded-md bg-accent-500 px-4 py-2 text-sm font-medium text-primary-900 hover:bg-accent-600"
            >
              Aplicar
            </button>
            <button
              onClick={() => { setData(''); setExecutedByEmail(''); setPage(1); fetchData(); }}
              className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium border border-primary-400 text-gray-100 hover:bg-primary-500"
            >
              Limpar
            </button>
          </div>
        </div>
      </div>

      <div className="bg-primary-600 rounded-lg border border-primary-500 overflow-x-auto">
        {loading ? (
          <div className="p-6 text-gray-300">Carregando histórico...</div>
        ) : error ? (
          <div className="p-6 text-red-300">{error}</div>
        ) : items.length === 0 ? (
          <div className="p-6 text-gray-300">Nenhum registro encontrado.</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-300 border-b border-primary-500">
                <th className="py-3 px-4">Data Ref.</th>
                <th className="py-3 px-4">Executado em</th>
                <th className="py-3 px-4">Executor</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Compatíveis</th>
                <th className="py-3 px-4">Divergentes</th>
                <th className="py-3 px-4">% Compat.</th>
                <th className="py-3 px-4">Duração</th>
              </tr>
            </thead>
            <tbody>
              {items.map((h) => (
                <tr key={h.id} className="border-b border-primary-500 last:border-0">
                  <td className="py-3 px-4 text-gray-100">{h.dataReferencia}</td>
                  <td className="py-3 px-4 text-gray-100">{h.createdAt ? new Date(h.createdAt).toLocaleString() : '-'}</td>
                  <td className="py-3 px-4 text-gray-100">{h.executedByEmail || '-'}</td>
                  <td className="py-3 px-4 text-gray-100">{h.totalComparacoes}</td>
                  <td className="py-3 px-4 text-green-300">{h.compativeis}</td>
                  <td className="py-3 px-4 text-red-300">{h.divergentes}</td>
                  <td className="py-3 px-4 text-gray-100">{h.percentualCompatibilidade}%</td>
                  <td className="py-3 px-4 text-gray-100">{h.tempoProcessamento}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default HistoricoComparacoes;

