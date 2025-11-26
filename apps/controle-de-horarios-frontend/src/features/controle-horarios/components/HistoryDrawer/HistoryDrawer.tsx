import React, { useEffect, useState } from 'react';
import { X, ClipboardList, Download } from 'lucide-react';
import { controleHorariosService as featureService } from '../../services/controle-horarios.service';
import type { HistoricoControleHorarioResponse } from '../../types/controle-horarios.types';
import { downloadAsFile, exportToExcel } from '@/lib/utils';

interface HistoryDrawerProps {
  open: boolean;
  itemId: string | null;
  onClose: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({ open, itemId, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historico, setHistorico] = useState<HistoricoControleHorarioResponse["data"] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchHistory = async () => {
      if (!open || !itemId) return;
      setLoading(true);
      setError(null);
      try {
        const resp = await featureService.getHistoricoControleHorario(itemId, 1, 100);
        if (!cancelled) setHistorico(resp.data);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Falha ao carregar histórico');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchHistory();
    return () => { cancelled = true; };
  }, [open, itemId]);

  const handleExportExcel = () => {
    if (!historico) return;
    const header = ['Data', 'Campo', 'Valor Anterior', 'Valor Novo', 'Alterado por', 'Email'];
    const data = historico.items.map(h => [
      new Date(h.created_at).toLocaleString('pt-BR'),
      h.campo,
      h.valor_anterior,
      h.valor_novo,
      h.alterado_por_nome,
      h.alterado_por_email,
    ]);
    const excelData = [
      ['Histórico de Alterações'],
      [`Item ID: ${itemId}`],
      [],
      header,
      ...data,
    ];
    exportToExcel(`historico_item_${itemId}.xlsx`, 'Histórico', excelData);
  };

  const handleExportHtml = () => {
    if (!historico) return;
    const rows = historico.items.map(h => `
      <tr>
        <td>${new Date(h.created_at).toLocaleString('pt-BR')}</td>
        <td>${h.campo}</td>
        <td>${h.valor_anterior || 'vazio'}</td>
        <td>${h.valor_novo || 'vazio'}</td>
        <td>${h.alterado_por_nome}</td>
        <td>${h.alterado_por_email}</td>
      </tr>
    `).join('');
    const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>Histórico de Alterações - Item ${itemId}</title>
        <style>
          body{font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Ubuntu,"Helvetica Neue";background:#111;color:#eee;padding:24px}
          h1{font-size:18px;margin:0 0 12px}
          .meta{color:#bbb;margin-bottom:12px}
          table{border-collapse:collapse;width:100%;font-size:12px}
          th,td{border:1px solid #333;padding:6px 8px; vertical-align: top;}
          th{background:#222;color:#ffde6a;position:sticky;top:0}
          tr:nth-child(even){background:#151515}
        </style>
      </head>
      <body>
        <h1>Histórico de Alterações</h1>
        <div class="meta">Item ID: ${itemId} • Total: ${historico.items.length}</div>
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Campo</th>
              <th>Valor Anterior</th>
              <th>Valor Novo</th>
              <th>Alterado por</th>
              <th>Email</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </body>
    </html>`;
    downloadAsFile(`historico_item_${itemId}.html`, html, 'text/html;charset=utf-8');
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/60" onClick={onClose} aria-hidden="true" />
      <aside className="w-full sm:w-[520px] max-w-[90vw] h-full bg-gray-900 border-l border-yellow-400/20 shadow-xl overflow-hidden">
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-yellow-400/20 bg-gray-900">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-yellow-400" />
            <h2 className="text-sm font-semibold text-gray-100">Histórico de alterações</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <button onClick={handleExportHtml} className="px-3 py-1.5 text-xs border border-yellow-400/30 rounded text-yellow-200 hover:bg-yellow-400/10 flex items-center gap-1"><Download className="h-3 w-3" /> Relatório</button>
              <button onClick={handleExportExcel} className="px-3 py-1.5 text-xs border border-yellow-400/30 rounded text-yellow-200 hover:bg-yellow-400/10 flex items-center gap-1"><Download className="h-3 w-3" /> Excel</button>
            </div>
            <button onClick={onClose} aria-label="Fechar histórico" className="p-1 rounded hover:bg-gray-800">
              <X className="h-5 w-5 text-gray-300" />
            </button>
          </div>
        </div>

        <div className="h-full overflow-auto p-4">
          {loading && <div className="text-sm text-gray-400">Carregando...</div>}
          {error && <div className="text-sm text-red-400">{error}</div>}
          {!loading && !error && (!historico || historico.items.length === 0) && (
            <div className="text-sm text-gray-400">Sem alterações registradas.</div>
          )}

          {!loading && !error && historico && historico.items.length > 0 && (
            <ul className="space-y-3">
              {historico.items.map((h) => {
                const labelMap: Record<string, string> = {
                  'prefixo_veiculo': 'Veículo',
                  'de_acordo': 'Conferido',
                  'hor_saida_ajustada': 'Saída Ajustada',
                  'hor_chegada_ajustada': 'Chegada Ajustada',
                  'motorista_substituto_nome': 'Mot. Substituto',
                  'motorista_substituto_cracha': 'Crachá Mot. Subst.',
                  'cobrador_substituto_nome': 'Cob. Substituto',
                  'cobrador_substituto_cracha': 'Crachá Cob. Subst.',
                  'observacoes_edicao': 'Observação',
                  'atraso_motivo': 'Motivo Atraso',
                  'atraso_observacao': 'Obs. Atraso'
                };

                const label = labelMap[h.campo] || h.campo;
                const isImportant = ['prefixo_veiculo', 'de_acordo'].includes(h.campo);
                const isObs = ['observacoes_edicao', 'atraso_observacao'].includes(h.campo);

                const formatVal = (val: string | null) => {
                  if (val === 'true') return 'SIM';
                  if (val === 'false') return 'NÃO';
                  if (!val || val === 'null') return 'vazio';
                  return val;
                };

                return (
                  <li key={h.id} className={`border rounded-md p-3 ${isImportant ? 'bg-yellow-400/10 border-yellow-400/30' : 'bg-gray-800/30 border-gray-700'}`}>
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-sm font-medium ${isImportant ? 'text-yellow-400' : 'text-gray-300'}`}>{label}</span>
                      <span className="text-xs text-gray-500">{new Date(h.created_at).toLocaleString('pt-BR')}</span>
                    </div>

                    {isObs ? (
                      <div className="text-sm text-gray-200 mt-1 italic">"{h.valor_novo}"</div>
                    ) : (
                      <div className="text-sm text-gray-200 mt-1 flex items-center gap-2">
                        <span className="text-gray-500 line-through text-xs">{formatVal(h.valor_anterior)}</span>
                        <span className="text-gray-400">→</span>
                        <span className="font-semibold">{formatVal(h.valor_novo)}</span>
                      </div>
                    )}

                    <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-700/50 flex justify-between">
                      <span>{h.alterado_por_nome || 'Desconhecido'}</span>
                      <span className="opacity-60">{h.alterado_por_email}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
};

