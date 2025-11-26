import React, { useEffect, useMemo, useState } from 'react';
import { X, ClipboardList, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { controleHorariosService as featureService } from '../../services/controle-horarios.service';
import type { FiltrosControleHorarios } from '../../types/controle-horarios.types';

type Props = {
  open: boolean;
  date: string;
  filtros: FiltrosControleHorarios;
  onClose: () => void;
};

export const HistoryDrawerList: React.FC<Props> = ({ open, date, filtros, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<any[]>([]);

  const mappedFilters = useMemo((): FiltrosControleHorarios => {
    return { ...filtros, apenas_editadas: true, incluir_historico: true, pagina: 1, limite: Math.min(10000, (filtros as any)?.limite || 2000) } as FiltrosControleHorarios;
  }, [filtros]);

  useEffect(() => {
    let cancel = false;
    const run = async () => {
      if (!open) return;
      setLoading(true);
      setError(null);
      try {
        const resp = await featureService.getControleHorarios(date, mappedFilters as any);
        if (!cancel) setItems((resp as any)?.data || []);
      } catch (e: any) {
        if (!cancel) setError(e?.message || 'Falha ao carregar histórico');
      } finally {
        if (!cancel) setLoading(false);
      }
    };
    run();
    return () => { cancel = true; };
  }, [open, date, mappedFilters]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const fmtTime = (v?: string | Date | null) => {
    if (!v) return '';
    try {
      const d = new Date(v as any);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  };

  const safe = (v: any) => (v === null || v === undefined ? '' : String(v));
  const trunc = (v?: string, max: number = 20) => {
    if (!v) return '';
    return v.length > max ? v.slice(0, max).trimEnd() + '…' : v;
  };

  const buildObservacoes = (it: any) => {
    const obs: string[] = [];
    if (it.observacoes_edicao) obs.push(it.observacoes_edicao);
    if (it.atraso_motivo) obs.push(`Motivo Atraso: ${it.atraso_motivo}`);
    if (it.atraso_observacao) obs.push(it.atraso_observacao);

    // Fallback simples se não houver histórico detalhado
    if (!it.historico?.length) {
      if (it.motorista_substituto_nome) obs.push(`Motorista Substituto: ${it.motorista_substituto_nome}`);
      if (it.cobrador_substituto_nome) obs.push(`Cobrador Substituto: ${it.cobrador_substituto_nome}`);
    }

    return obs.join(' | ');
  };

  const renderChange = (change: any) => {
    // Ignorar campos técnicos que já são mostrados nas colunas
    const ignoreFields = [
      'prefixo_veiculo', 'de_acordo', 'hor_saida_ajustada', 'hor_chegada_ajustada',
      'motorista_substituto_nome', 'motorista_substituto_cracha',
      'cobrador_substituto_nome', 'cobrador_substituto_cracha'
    ];

    if (ignoreFields.includes(change.campo)) return null;

    const formatValue = (field: string, value: string | null) => {
      if (value === null || value === 'null') return <span className="text-gray-500">vazio</span>;
      if (field.includes('hor_')) {
        return fmtTime(value);
      }
      if (value === 'true') return <span className="text-emerald-400">SIM</span>;
      if (value === 'false') return <span className="text-red-400">NÃO</span>;
      return `"${trunc(value, 30)}"`;
    };

    return (
      <div key={change.id} className="text-xs">
        <span className="font-semibold text-yellow-300">{change.campo}:</span>
        <span className="text-gray-400"> de </span>
        {formatValue(change.campo, change.valor_anterior)}
        <span className="text-gray-400"> para </span>
        {formatValue(change.campo, change.valor_novo)}
      </div>
    );
  };

  const handleExportExcel = () => {
    const header = [
      'Setor', 'Linha', 'Serviço', 'Saída', 'Chegada', 'Saída Ajustada', 'Chegada Ajustada',
      'Carro', 'Motorista (Orig)', 'Cracha (Orig)', 'Motorista (Subst)', 'Cracha (Subst)',
      'Cobrador (Orig)', 'Cracha (Orig)', 'Cobrador (Subst)', 'Cracha (Subst)', 'E-mail', 'Confirmada', 'Editado em',
      'Observações'
    ];
    const data = (items || []).map((it: any) => [
      it.setor_principal_linha || '',
      `${safe(it.codigo_linha)} - ${safe(it.nome_linha)}`,
      safe(it.cod_servico_numero),
      fmtTime(it.hor_saida),
      fmtTime(it.hor_chegada),
      fmtTime(it.hor_saida_ajustada),
      fmtTime(it.hor_chegada_ajustada),
      safe(it.prefixo_veiculo),
      safe(it.nome_motorista),
      safe(it.cracha_motorista),
      safe(it.motorista_substituto_nome),
      safe(it.motorista_substituto_cracha),
      safe(it.nome_cobrador),
      safe(it.cracha_cobrador),
      safe(it.cobrador_substituto_nome),
      safe(it.cobrador_substituto_cracha),
      safe(it.editado_por_email),
      (it.de_acordo ? 'SIM' : 'NÃO'),
      (it.updated_at ? new Date(it.updated_at).toLocaleString('pt-BR') : ''),
      buildObservacoes(it)
    ]);
    const wsData = [
      ['Histórico - Viagens Editadas'],
      [`Data: ${date}`],
      [`Total: ${items.length}`],
      [],
      header,
      ...data,
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Editadas');
    XLSX.writeFile(wb, `historico_editadas_${date}.xlsx`);
  };

  const handleExportHtml = () => {
    const rows = (items || []).map((it: any) => `
      <tr>
        <td>${safe(it.setor_principal_linha)}</td>
        <td>${safe(it.codigo_linha)} - ${safe(it.nome_linha)}</td>
        <td>${safe(it.cod_servico_numero)}</td>
        <td>${fmtTime(it.hor_saida)}</td>
        <td>${fmtTime(it.hor_chegada)}</td>
        <td>${fmtTime(it.hor_saida_ajustada)}</td>
        <td>${fmtTime(it.hor_chegada_ajustada)}</td>
        <td>${safe(it.prefixo_veiculo)}</td>
        <td>${safe(it.nome_motorista)}</td>
        <td>${safe(it.cracha_motorista)}</td>
        <td>${safe(it.motorista_substituto_nome)}</td>
        <td>${safe(it.motorista_substituto_cracha)}</td>
        <td>${safe(it.nome_cobrador)}</td>
        <td>${safe(it.cracha_cobrador)}</td>
        <td>${safe(it.cobrador_substituto_nome)}</td>
        <td>${safe(it.cobrador_substituto_cracha)}</td>
        <td>${safe(it.editado_por_email)}</td>
        <td>${it.de_acordo ? 'SIM' : 'NÃO'}</td>
        <td>${it.updated_at ? new Date(it.updated_at).toLocaleString('pt-BR') : ''}</td>
        <td>${buildObservacoes(it)}</td>
      </tr>
    `).join('\n');
    const html = `<!DOCTYPE html>
    <html lang="pt-BR"><head><meta charset="utf-8" />
    <title>Histórico - Editadas ${date}</title>
    <style>
      body{font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Ubuntu,"Helvetica Neue";background:#111;color:#eee;padding:24px}
      h1{font-size:18px;margin:0 0 12px}
      .meta{color:#bbb;margin-bottom:12px}
      table{border-collapse:collapse;width:100%;font-size:12px}
      th,td{border:1px solid #333;padding:6px 8px; vertical-align: top;}
      th{background:#222;color:#ffde6a;position:sticky;top:0}
      tr:nth-child(even){background:#151515}
    </style></head>
    <body>
      <h1>Histórico - Viagens Editadas</h1>
      <div class="meta">Data: ${date} • Total: ${items.length}</div>
      <table>
        <thead><tr>
          <th>Setor</th><th>Linha</th><th>Serviço</th><th>Saída</th><th>Chegada</th>
          <th>Saída Ajust.</th><th>Chegada Ajust.</th><th>Carro</th>
          <th>Motorista (Orig)</th><th>Crachá (Orig)</th><th>Motorista (Subst)</th><th>Crachá (Subst)</th>
          <th>Cobrador (Orig)</th><th>Crachá (Orig)</th><th>Cobrador (Subst)</th><th>Crachá (Subst)</th>
          <th>E-mail</th><th>Conf.</th><th>Editado em</th><th>Observações</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </body></html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historico_editadas_${date}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} aria-hidden="true" />
      <div className="absolute inset-0 w-full h-full bg-gray-900 overflow-hidden">
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-yellow-400/20 bg-gray-900">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-yellow-400" />
            <h2 className="text-sm font-semibold text-gray-100">Viagens Editadas • {date}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleExportHtml} className="px-3 py-1.5 text-xs border border-yellow-400/30 rounded text-yellow-200 hover:bg-yellow-400/10 flex items-center gap-1"><Download className="h-3 w-3" /> Relatório</button>
            <button onClick={handleExportExcel} className="px-3 py-1.5 text-xs border border-yellow-400/30 rounded text-yellow-200 hover:bg-yellow-400/10 flex items-center gap-1"><Download className="h-3 w-3" /> Excel</button>
            <button onClick={onClose} aria-label="Fechar histórico" className="p-1 rounded hover:bg-gray-800">
              <X className="h-5 w-5 text-gray-300" />
            </button>
          </div>
        </div>

        <div className="h-[calc(100%-52px)] overflow-auto p-4">
          {loading && <div className="text-sm text-gray-400">Carregando...</div>}
          {error && <div className="text-sm text-red-400">{error}</div>}
          {!loading && !error && items.length === 0 && (
            <div className="text-sm text-gray-400">Nenhuma viagem editada encontrada para os filtros atuais.</div>
          )}
          {!loading && !error && items.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-800/60">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">Linha / Serviço / Setor</th>
                    <th className="px-3 py-2 text-left font-semibold">Horários</th>
                    <th className="px-3 py-2 text-left font-semibold">Carro</th>
                    <th className="px-3 py-2 text-left font-semibold">Motorista</th>
                    <th className="px-3 py-2 text-left font-semibold">Cobrador</th>
                    <th className="px-3 py-2 text-left font-semibold">Edição/Conf.</th>
                    <th className="px-3 py-2 text-left font-semibold">Observações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {items.map((it: any) => {
                    const carroEdited = it.prefixo_veiculo_editado && it.prefixo_veiculo_editado !== it.prefixo_veiculo;
                    return (
                      <tr key={it.id} className="hover:bg-gray-800/30">
                        <td className="px-3 py-2 align-top">
                          <div className="font-medium text-gray-100">{(it.codigo_linha || it.codigoLinha) + ' - ' + trunc(it.nome_linha || it.nomeLinha, 20)}</div>
                          <div className="text-xs text-gray-300">Serviço: {it.cod_servico_numero || ''}</div>
                          <div className="text-xs text-gray-400">Setor: {it.setor_principal_linha || it.setorPrincipalLinha || ''}</div>
                        </td>
                        <td className="px-3 py-2 align-top">
                          <div className="flex flex-col gap-1">
                            <div>
                              <span className="text-xs text-gray-400 mr-1">Saída</span>
                              {it.hor_saida_ajustada ? (
                                <span className="inline-flex flex-col align-top"><span className="text-gray-500 line-through">{fmtTime(it.hor_saida)}</span><span className="text-emerald-400 font-bold">{fmtTime(it.hor_saida_ajustada)}</span></span>
                              ) : (
                                fmtTime(it.hor_saida)
                              )}
                            </div>
                            <div>
                              <span className="text-xs text-gray-400 mr-1">Chegada</span>
                              {it.hor_chegada_ajustada ? (
                                <span className="inline-flex flex-col align-top"><span className="text-gray-500 line-through">{fmtTime(it.hor_chegada)}</span><span className="text-emerald-400 font-bold">{fmtTime(it.hor_chegada_ajustada)}</span></span>
                              ) : (
                                fmtTime(it.hor_chegada)
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 align-top">
                          {carroEdited ? (
                            <div className="flex flex-col">
                              <span className="text-gray-500 line-through text-xs">{it.prefixo_veiculo}</span>
                              <span className="text-yellow-400 font-bold bg-yellow-400/10 px-1.5 py-0.5 rounded border border-yellow-400/20 w-fit">{it.prefixo_veiculo_editado}</span>
                            </div>
                          ) : (
                            <span className="font-bold text-blue-200 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">{it.prefixo_veiculo || '—'}</span>
                          )}
                        </td>
                        <td className="px-3 py-2 align-top">
                          {(!it.motorista_substituto_nome && !it.motorista_substituto_cracha) ? (
                            <div>
                              <div>{it.nome_motorista || it.nomeMotorista || ''}</div>
                              {(it.cracha_motorista || it.crachaMotoristaGlobus) && (
                                <div className="text-xs text-gray-400">Crachá: {it.cracha_motorista || it.crachaMotoristaGlobus}</div>
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col">
                              <div className="text-gray-500 line-through">
                                <div>{it.nome_motorista || it.nomeMotorista || ''}</div>
                                {(it.cracha_motorista || it.crachaMotoristaGlobus) && <div className="text-xs">Crachá: {it.cracha_motorista || it.crachaMotoristaGlobus}</div>}
                              </div>
                              <div className="text-yellow-400 font-bold">
                                <div>{it.motorista_substituto_nome || ''}</div>
                                {it.motorista_substituto_cracha && <div className="text-xs">Crachá: {it.motorista_substituto_cracha}</div>}
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2 align-top">
                          {(!it.cobrador_substituto_nome && !it.cobrador_substituto_cracha) ? (
                            <div>
                              <div>{it.nome_cobrador || it.nomeCobrador || ''}</div>
                              {(it.cracha_cobrador || it.crachaCobradorGlobus) && (
                                <div className="text-xs text-gray-400">Crachá: {it.cracha_cobrador || it.crachaCobradorGlobus}</div>
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col">
                              <div className="text-gray-500 line-through">
                                <div>{it.nome_cobrador || it.nomeCobrador || ''}</div>
                                {(it.cracha_cobrador || it.crachaCobradorGlobus) && <div className="text-xs">Crachá: {it.cracha_cobrador || it.crachaCobradorGlobus}</div>}
                              </div>
                              <div className="text-yellow-400 font-bold">
                                <div>{it.cobrador_substituto_nome || ''}</div>
                                {it.cobrador_substituto_cracha && <div className="text-xs">Crachá: {it.cobrador_substituto_cracha}</div>}
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2 align-top">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-400">Conf.:</span>
                              {it.de_acordo ? (
                                <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded border border-emerald-400/20">SIM</span>
                              ) : (
                                <span className="text-xs font-bold text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded border border-red-400/20">NÃO</span>
                              )}
                            </div>
                            <span className="text-xs text-gray-400">{it.editado_por_email || it.usuarioEmail || it.editado_por_nome || it.usuarioEdicao || '—'}</span>
                            <span className="text-xs text-gray-500">{it.updated_at ? new Date(it.updated_at).toLocaleString('pt-BR') : ''}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 align-top">
                          <td className="px-3 py-2 align-top">
                            {buildObservacoes(it) ? (
                              <span className="text-yellow-200/90 italic font-medium bg-yellow-500/10 px-2 py-1 rounded border border-yellow-500/20 block">
                                {buildObservacoes(it)}
                              </span>
                            ) : (
                              <span className="text-gray-600">—</span>
                            )}
                          </td>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
