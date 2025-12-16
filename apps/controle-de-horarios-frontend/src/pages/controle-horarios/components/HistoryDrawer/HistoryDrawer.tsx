import React, { useEffect, useState } from 'react';
import { X, ClipboardList } from 'lucide-react';
import { controleHorariosService as featureService } from '../../services/controle-horarios.service';
import type { HistoricoControleHorarioResponse } from '../../types/controle-horarios.types';
import { Button } from '@/components/ui/button';

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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <aside className="w-full sm:w-[520px] max-w-[90vw] h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden animate-in slide-in-from-right-10 duration-300">
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-yellow-500/20 rounded-lg">
              <ClipboardList className="h-5 w-5 text-green-700 dark:text-yellow-400" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Histórico de alterações</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fechar histórico" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="h-full overflow-auto p-6 bg-gray-50 dark:bg-gray-900/50">
          {loading && <div className="text-center py-10 text-gray-400">Carregando...</div>}
          {error && <div className="text-center py-10 text-red-400">{error}</div>}
          {!loading && !error && (!historico || historico.items.length === 0) && (
            <div className="text-center py-10 text-gray-400">Sem alterações registradas.</div>
          )}

          {!loading && !error && historico && historico.items.length > 0 && (
            <ul className="space-y-4">
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
                  <li key={h.id} className={`border rounded-xl p-4 shadow-sm transition-all ${isImportant ? 'bg-green-50 dark:bg-yellow-400/10 border-green-200 dark:border-yellow-400/30' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-sm font-bold ${isImportant ? 'text-green-700 dark:text-yellow-400' : 'text-gray-700 dark:text-gray-300'}`}>{label}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(h.created_at).toLocaleString('pt-BR')}</span>
                    </div>

                    {isObs ? (
                      <div className="text-sm text-gray-700 dark:text-gray-300 mt-1 italic bg-gray-100 dark:bg-gray-900/50 p-2 rounded border border-gray-200 dark:border-gray-700/50">"{h.valor_novo}"</div>
                    ) : (
                      <div className="text-sm text-gray-800 dark:text-gray-200 mt-1 flex items-center gap-3 bg-gray-100 dark:bg-gray-900/50 p-2 rounded border border-gray-200 dark:border-gray-700/50">
                        <span className="text-gray-500 dark:text-gray-400 line-through text-xs">{formatVal(h.valor_anterior)}</span>
                        <span className="text-gray-400 dark:text-gray-500">→</span>
                        <span className="font-bold">{formatVal(h.valor_novo)}</span>
                      </div>
                    )}

                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-3 pt-2 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                      <span className="font-medium text-gray-700 dark:text-gray-300">{h.alterado_por_nome || 'Desconhecido'}</span>
                      <span className="opacity-70">{h.alterado_por_email}</span>
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
