import React, { useEffect, useState } from 'react';
import { X, ClipboardList } from 'lucide-react';
import { controleHorariosService as featureService } from '../../services/controle-horarios.service';
import type { HistoricoControleHorarioResponse } from '../../types/controle-horarios.types';

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
      <div className="flex-1 bg-black/60" onClick={onClose} aria-hidden="true" />
      <aside className="w-full sm:w-[520px] max-w-[90vw] h-full bg-gray-900 border-l border-yellow-400/20 shadow-xl overflow-hidden">
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-yellow-400/20 bg-gray-900">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-yellow-400" />
            <h2 className="text-sm font-semibold text-gray-100">Histórico de alterações</h2>
          </div>
          <button onClick={onClose} aria-label="Fechar histórico" className="p-1 rounded hover:bg-gray-800">
            <X className="h-5 w-5 text-gray-300" />
          </button>
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
