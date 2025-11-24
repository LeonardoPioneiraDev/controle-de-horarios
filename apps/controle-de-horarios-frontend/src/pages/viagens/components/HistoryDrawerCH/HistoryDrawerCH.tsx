import React, { useEffect, useMemo, useState } from 'react';
import { X, ClipboardList } from 'lucide-react';
import { controleHorariosService as chService } from '@/services/controleHorariosService';
import type { FiltrosViagem } from '@/types/viagens-transdata.types';
import { Button } from '@/components/ui/button';

type Props = {
  open: boolean;
  date: string;
  filtros: FiltrosViagem;
  onClose: () => void;
};

export const HistoryDrawerCH: React.FC<Props> = ({ open, date, filtros, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<any[]>([]);

  const mappedFilters = useMemo(() => {
    const out: Record<string, any> = {
      apenas_editadas: true,
      incluir_historico: true,
      limite: 2000,
      pagina: 1,
    };
    if (filtros?.nomeLinha) out['nome_linha'] = filtros.nomeLinha;
    if (filtros?.numeroServico) out['cod_servico_numero'] = String(filtros.numeroServico);
    if (filtros?.sentido) out['sentido_texto'] = filtros.sentido;
    if (filtros?.horarioInicio) out['horarioInicio'] = filtros.horarioInicio;
    if (filtros?.horarioFim) out['horarioFim'] = filtros.horarioFim;
    if (filtros?.nomeMotorista) out['nome_motorista'] = filtros.nomeMotorista;
    if (filtros?.codigoLinha) out['codigo_linha'] = [filtros.codigoLinha];
    return out;
  }, [filtros]);

  useEffect(() => {
    let cancel = false;
    const run = async () => {
      if (!open) return;
      setLoading(true);
      setError(null);
      try {
        const resp = await chService.buscarControleHorarios(date, mappedFilters as any);
        if (!cancel) setItems(resp?.data || []);
      } catch (e: any) {
        if (!cancel) setError(e?.message || 'Falha ao carregar histórico');
      } finally {
        if (!cancel) setLoading(false);
      }
    };
    run();
    return () => { cancel = true; };
  }, [open, date, mappedFilters]);

  if (!open) return null;

  const trunc = (v?: string, max: number = 20) => {
    if (!v) return '';
    return v.length > max ? v.slice(0, max).trimEnd() + '…' : v;
  };

  const fmtTime = (v?: string | Date | null) => {
    if (!v) return '';
    try {
      const d = new Date(v as any);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  };

  const buildObservacoes = (it: any) => {
    const obs: string[] = [];
    if (it.observacoes_edicao) obs.push(it.observacoes_edicao);
    if (it.atraso_motivo) obs.push(`Motivo Atraso: ${it.atraso_motivo}`);
    if (it.atraso_observacao) obs.push(it.atraso_observacao);
    return obs.join(' | ');
  };

  const renderAdjustedTime = (originalTime?: string, adjustedTime?: string) => {
    if (!adjustedTime) {
      return originalTime ? new Date(originalTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';
    }
    const originalFormatted = originalTime ? new Date(originalTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';
    const adjustedFormatted = new Date(adjustedTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return (
      <div className="flex flex-col">
        <span className="text-gray-400 line-through text-xs">{originalFormatted}</span>
        <span className="text-emerald-400 font-bold">{adjustedFormatted}</span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <aside className="w-full sm:w-[1000px] max-w-[95vw] h-full bg-gray-900 border-l border-gray-700 shadow-xl overflow-hidden animate-in slide-in-from-right-10 duration-300">
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-gray-700 bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <ClipboardList className="h-5 w-5 text-yellow-400" />
            </div>
            <h2 className="text-lg font-bold text-gray-100">Viagens Editadas • {date}</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fechar histórico" className="text-gray-400 hover:text-white hover:bg-gray-800">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="h-full overflow-auto p-6 bg-gray-900/50">
          {loading && <div className="text-center py-10 text-gray-400">Carregando...</div>}
          {error && <div className="text-center py-10 text-red-400">{error}</div>}
          {!loading && !error && items.length === 0 && (
            <div className="text-center py-10 text-gray-400">Nenhuma viagem editada encontrada para os filtros atuais.</div>
          )}
          {!loading && !error && items.length > 0 && (
            <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-900/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-300">Linha / Serviço / Setor</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-300">Horários</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-300">Carro</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-300">Motorista</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-300">Cobrador</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-300">Edição</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-300">Observações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {items.map((it: any) => {
                      return (
                        <tr key={it.id} className="hover:bg-gray-700/30 transition-colors">
                          <td className="px-4 py-3 align-top">
                            <div className="font-medium text-gray-100">{(it.codigo_linha || it.codigoLinha) + ' - ' + trunc(it.nome_linha || it.nomeLinha, 20)}</div>
                            <div className="text-xs text-gray-400">Serviço: {it.cod_servico_numero || ''}</div>
                            <div className="text-xs text-gray-400">Setor: {it.setor_principal_linha || it.setorPrincipalLinha || ''}</div>
                          </td>
                          <td className="px-4 py-3 align-top">
                            <div className="flex flex-col gap-1">
                              <div>
                                <span className="text-xs text-gray-400 mr-1">Saída</span>
                                {renderAdjustedTime(it.hor_saida, it.hor_saida_ajustada)}
                              </div>
                              <div>
                                <span className="text-xs text-gray-400 mr-1">Chegada</span>
                                {renderAdjustedTime(it.hor_chegada, it.hor_chegada_ajustada)}
                              </div>
                            </div>
                          </td>
                          <td className={`px-4 py-3 align-top ${it.prefixo_veiculo_editado && it.prefixo_veiculo_editado !== it.prefixo_veiculo ? 'text-yellow-400 font-bold' : 'text-gray-300'}`}>
                            {it.prefixo_veiculo || ''}
                          </td>
                          <td className="px-4 py-3 align-top text-gray-300">
                            {(!it.motorista_substituto_nome && !it.motorista_substituto_cracha) ? (
                              <div>
                                <div>{it.nome_motorista || ''}</div>
                                {it.cracha_motorista && <div className="text-xs text-gray-400">Crachá: {it.cracha_motorista}</div>}
                              </div>
                            ) : (
                              <div className="flex flex-col">
                                <div className="text-gray-400 line-through text-xs">
                                  <div>{it.nome_motorista || ''}</div>
                                  {it.cracha_motorista && <div>Crachá: {it.cracha_motorista}</div>}
                                </div>
                                <div className="text-yellow-400 font-bold">
                                  <div>{it.motorista_substituto_nome || ''}</div>
                                  {it.motorista_substituto_cracha && <div className="text-xs">Crachá: {it.motorista_substituto_cracha}</div>}
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 align-top text-gray-300">
                            {(!it.cobrador_substituto_nome && !it.cobrador_substituto_cracha) ? (
                              <div>
                                <div>{it.nome_cobrador || ''}</div>
                                {it.cracha_cobrador && <div className="text-xs text-gray-400">Crachá: {it.cracha_cobrador}</div>}
                              </div>
                            ) : (
                              <div className="flex flex-col">
                                <div className="text-gray-400 line-through text-xs">
                                  <div>{it.nome_cobrador || ''}</div>
                                  {it.cracha_cobrador && <div>Crachá: {it.cracha_cobrador}</div>}
                                </div>
                                <div className="text-yellow-400 font-bold">
                                  <div>{it.cobrador_substituto_nome || ''}</div>
                                  {it.cobrador_substituto_cracha && <div className="text-xs">Crachá: {it.cobrador_substituto_cracha}</div>}
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 align-top">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-gray-400">Conf.:</span>
                                {it.de_acordo ? (
                                  <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded border border-emerald-400/20">SIM</span>
                                ) : (
                                  <span className="text-xs font-bold text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded border border-red-400/20">NÃO</span>
                                )}
                              </div>
                              <span className="text-xs text-gray-400">{it.editado_por_email || it.editado_por_nome || '—'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 align-top">
                            {buildObservacoes(it) ? (
                              <span className="text-yellow-200/90 italic font-medium bg-yellow-500/10 px-2 py-1 rounded border border-yellow-500/20 block text-xs">
                                {buildObservacoes(it)}
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};
