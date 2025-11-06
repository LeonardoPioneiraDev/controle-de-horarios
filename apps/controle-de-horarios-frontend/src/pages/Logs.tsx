import React, { useEffect, useMemo, useState } from 'react';
import { logsService } from '../services/api';
import { LogAction, LogsFilter, SystemLog } from '../types/logs.types';
import { Download, Filter, RefreshCw, Search, User as UserIcon, CheckCircle2, XCircle, FileSpreadsheet, FileDown } from 'lucide-react';

const defaultFilter: LogsFilter = {
  q: '',
  action: 'ALL',
  success: 'ALL',
  from: '',
  to: '',
  userId: '',
  page: 1,
  pageSize: 20,
};

interface LogsProps {
  embedded?: boolean;
}

export const Logs: React.FC<LogsProps> = ({ embedded = false }) => {
  const [filter, setFilter] = useState<LogsFilter>({ ...defaultFilter });
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / (filter.pageSize || 20))),
    [total, filter.pageSize]
  );

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await logsService.list(filter);
      setLogs(res.data);
      setTotal(res.total);
    } catch (e) {
      console.error('[Logs] load error', e);
      setError('Falha ao carregar logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSearch = () => {
    setFilter((prev) => ({ ...prev, page: 1 }));
    void load();
  };

  const onExport = async (format: 'pdf' | 'excel') => {
    try {
      const blob = await logsService.exportReport(filter, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const from = filter.from ? `_${filter.from}` : '';
      const to = filter.to ? `_${filter.to}` : '';
      const ext = format === 'pdf' ? 'pdf' : 'xlsx';
      a.download = `relatorio_logs${from}${to}.${ext}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('[Logs] export error', e);
      setError('Falha ao gerar relatório.');
    }
  };

  const formatDate = (d: Date) =>
    new Date(d).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div className="space-y-6">
      {!embedded && (
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-100">Logs do Sistema</h1>
          <p className="mt-1 text-sm text-primary-300">Auditoria de ações com filtros e exportação</p>
        </div>
        <button
          className="btn btn-secondary inline-flex items-center"
          onClick={() => void load()}
          disabled={loading}
          aria-busy={loading}
        >
          <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
        </button>
      </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-primary-300" />
              </div>
              <input
                className="form-input pl-10"
                placeholder="Buscar por e-mail, recurso ou detalhes..."
                value={filter.q || ''}
                onChange={(e) => setFilter((p) => ({ ...p, q: e.target.value }))}
              />
            </div>
          </div>

          <div className="w-full lg:w-48">
            <select
              className="form-select"
              value={filter.action || 'ALL'}
              onChange={(e) => setFilter((p) => ({ ...p, action: e.target.value as LogsFilter['action'] }))}
            >
              <option value="ALL">Todas as ações</option>
              {Object.values(LogAction).map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          <div className="w-full lg:w-40">
            <select
              className="form-select"
              value={filter.success || 'ALL'}
              onChange={(e) => setFilter((p) => ({ ...p, success: e.target.value as LogsFilter['success'] }))}
            >
              <option value="ALL">Todos os status</option>
              <option value="SUCCESS">Sucesso</option>
              <option value="FAIL">Falha</option>
            </select>
          </div>

          <div className="w-full lg:w-44">
            <input
              type="date"
              className="form-input"
              value={filter.from || ''}
              onChange={(e) => setFilter((p) => ({ ...p, from: e.target.value }))}
            />
          </div>

          <div className="w-full lg:w-44">
            <input
              type="date"
              className="form-input"
              value={filter.to || ''}
              onChange={(e) => setFilter((p) => ({ ...p, to: e.target.value }))}
            />
          </div>

          <div className="w-full lg:w-40">
            <input
              className="form-input"
              placeholder="ID do usuário"
              value={filter.userId || ''}
              onChange={(e) => setFilter((p) => ({ ...p, userId: e.target.value }))}
            />
          </div>

          <div className="flex gap-2">
            <button className="btn btn-primary inline-flex items-center" onClick={onSearch} disabled={loading} aria-busy={loading}>
              <Filter className="h-4 w-4 mr-2" /> Filtrar
            </button>
            <button className="btn btn-secondary inline-flex items-center" onClick={() => onExport('excel')} disabled={loading}>
              <FileSpreadsheet className="h-4 w-4 mr-2" /> Exportar Excel
            </button>
            <button className="btn btn-secondary inline-flex items-center" onClick={() => onExport('pdf')} disabled={loading}>
              <FileDown className="h-4 w-4 mr-2" /> Exportar PDF
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-primary-600">
            <thead className="bg-primary-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary-300 uppercase tracking-wider">Data</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary-300 uppercase tracking-wider">Usuário</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary-300 uppercase tracking-wider">Ação</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary-300 uppercase tracking-wider">Recurso</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary-300 uppercase tracking-wider">Detalhes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary-300 uppercase tracking-wider">IP</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary-300 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-primary-800 divide-y divide-primary-700">
              {logs.map((l) => (
                <tr key={l.id}>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-primary-100">{formatDate(l.createdAt)}</td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-primary-100 inline-flex items-center gap-2">
                    <UserIcon className="h-4 w-4" />
                    {l.userEmail || l.userId || '—'}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-primary-100">{l.action}</td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-primary-100">{l.resource || '—'}</td>
                  <td className="px-6 py-3 text-sm text-primary-100 max-w-[360px] truncate" title={l.details || undefined}>
                    {l.details || '—'}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-primary-100">{l.ip || '—'}</td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm">
                    {l.success ? (
                      <span className="inline-flex items-center text-green-400"><CheckCircle2 className="h-4 w-4 mr-1" /> Sucesso</span>
                    ) : (
                      <span className="inline-flex items-center text-red-400"><XCircle className="h-4 w-4 mr-1" /> Falha</span>
                    )}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && !loading && (
                <tr>
                  <td className="px-6 py-6 text-center text-sm text-primary-300" colSpan={7}>Nenhum log encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between p-4">
          <div className="text-sm text-primary-300">
            Página {filter.page} de {totalPages} • Total: {total}
          </div>
          <div className="flex gap-2">
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setFilter((p) => ({ ...p, page: Math.max(1, (p.page || 1) - 1) }))}
              disabled={(filter.page || 1) <= 1 || loading}
            >
              Anterior
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setFilter((p) => ({ ...p, page: Math.min(totalPages, (p.page || 1) + 1) }))}
              disabled={(filter.page || 1) >= totalPages || loading}
            >
              Próxima
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Logs;
