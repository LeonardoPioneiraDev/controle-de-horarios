// src/features/controle-horarios/components/DataTable/DataTable.tsx
import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, Clock, RefreshCw, MapPin, Save, X, ClipboardList } from 'lucide-react';
import { ControleHorarioItem, StatusControleHorariosDto, EstatisticasControleHorariosDto } from '@/types/controle-horarios.types';

interface DataTableProps {
  controleHorarios: ControleHorarioItem[];
  controleHorariosOriginais: ControleHorarioItem[];
  onInputChange: (viagemId: string, field: keyof ControleHorarioItem, value: string | number | boolean) => void;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  statusDados: StatusControleHorariosDto['data'];
  estatisticas: EstatisticasControleHorariosDto;
  temAlteracoesPendentes: boolean;
  contarAlteracoesPendentes: () => number;
  onApplyScaleFilter?: (params: { servico: string; cracha: string; tipo: 'motorista' | 'cobrador' }) => void;
  // Novo: exibir banner de filtro de escala ativo + limpar
  scaleFilterActive?: boolean;
  scaleFilterLabel?: string;
  onClearScaleFilter?: () => void;
  // Permissão para salvar/editar (opcional)
  canSave?: boolean;
}

interface PersonOptionsModalProps {
  item: ControleHorarioItem;
  personType: 'motorista' | 'cobrador';
  onClose: () => void;
  onInputChange: (viagemId: string, field: keyof ControleHorarioItem, value: string | number | boolean) => void;
  onApplyScaleFilter?: (params: { servico: string; cracha: string; tipo: 'motorista' | 'cobrador' }) => void;
}

const PersonOptionsModal: React.FC<PersonOptionsModalProps> = ({ item, personType, onClose, onInputChange, onApplyScaleFilter }) => {
  const isMotorista = personType === 'motorista';
  const crachaOriginal = isMotorista ? item.crachaMotoristaGlobus : item.crachaCobradorGlobus;
  const [tempNome, setTempNome] = useState(isMotorista ? item.nomeMotoristaEditado || '' : item.nomeCobradorEditado || '');
  const [tempCracha, setTempCracha] = useState(isMotorista ? item.crachaMotoristaEditado || '' : item.crachaCobradorEditado || '');
  const [tempObservacoes, setTempObservacoes] = useState((item as any).observacoes || '');

  const handleSave = () => {
    onInputChange(item.id, isMotorista ? 'nomeMotoristaEditado' : 'nomeCobradorEditado', tempNome);
    onInputChange(item.id, isMotorista ? 'crachaMotoristaEditado' : 'crachaCobradorEditado', tempCracha);
    onInputChange(item.id, 'observacoes' as any, tempObservacoes);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" onClick={onClose}>
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 lg:w-1/3 shadow-lg rounded-md bg-white" onClick={(e) => e.stopPropagation()}>
        <div className="mt-3 text-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Opções do {isMotorista ? 'Motorista' : 'Cobrador'}</h3>
          <div className="mt-2 px-7 py-3">
            <p className="text-sm text-gray-500 mb-4">Crachá Original: <strong>{crachaOriginal || 'Não informado'}</strong></p>
            <button
              onClick={() => {
                const servico = (item as any).cod_servico_numero || '';
                // Usar SEMPRE o crachá original (Globus) para filtrar escala
                const cracha = isMotorista
                  ? ((item as any).crachaMotoristaGlobus || (item as any).crachaMotoristaEditado || '')
                  : ((item as any).crachaCobradorGlobus || (item as any).crachaCobradorEditado || '');
                if (onApplyScaleFilter && servico && cracha) onApplyScaleFilter({ servico, cracha, tipo: isMotorista ? 'motorista' : 'cobrador' });
                onClose();
              }}
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mb-3"
            >
              <ClipboardList className="h-4 w-4 mr-2" /> Ver Escala
            </button>
            <div className="text-left mb-4">
              <label className="block text-sm font-medium text-gray-700">Nome</label>
              <input className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" value={tempNome} onChange={(e) => setTempNome(e.target.value)} />
            </div>
            <div className="text-left mb-4">
              <label className="block text-sm font-medium text-gray-700">Crachá</label>
              <input className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" value={tempCracha} onChange={(e) => setTempCracha(e.target.value)} />
            </div>
            <div className="text-left mb-4">
              <label className="block text-sm font-medium text-gray-700">Observações</label>
              <textarea className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" value={tempObservacoes} onChange={(e) => setTempObservacoes(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-red text-base font-medium rounded-md w-full shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"><Save className="h-4 w-4 mr-2 inline" /> Salvar</button>
              <button onClick={onClose} className="px-4 py-2 bg-white text-gray-700 text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors"><X className="h-4 w-4 mr-2 inline" /> Cancelar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ConfirmVehicleModalProps {
  isOpen: boolean;
  vehicleNumber: string;
  anchorItem: ControleHorarioItem | null;
  affectedCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmVehicleModal: React.FC<ConfirmVehicleModalProps> = ({ isOpen, vehicleNumber, anchorItem, affectedCount, onConfirm, onCancel }) => {
  if (!isOpen || !anchorItem) return null;
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" onClick={onCancel}>
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 lg:w-1/3 shadow-lg rounded-md bg-white" onClick={(e) => e.stopPropagation()}>
        <div className="mt-1 text-left">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">Confirmar número do veículo</h3>
          <p className="text-sm text-gray-700 mb-4">
            Aplicar o número <b>{vehicleNumber}</b> nesta viagem e propagar para as viagens seguintes do mesmo serviço (<b>{(anchorItem as any).cod_servico_numero || 'N/I'}</b>)
            com o mesmo crachá de motorista (<b>{(anchorItem as any).crachaMotoristaGlobus || (anchorItem as any).crachaMotoristaEditado || 'N/I'}</b>)?
          </p>
          <div className="text-sm text-gray-600 mb-4">
            Serão afetadas <b>{affectedCount}</b> viagem(ns) subsequentes (além desta), conforme ordenação por horário.
          </div>
          <div className="mt-4 flex justify-end space-x-2">
            <button onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              Cancelar
            </button>
            <button onClick={onConfirm} className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const DataTable: React.FC<DataTableProps> = ({
  controleHorarios,
  controleHorariosOriginais,
  onInputChange,
  loading,
  error,
  onRetry,
  statusDados,
  estatisticas,
  temAlteracoesPendentes,
  contarAlteracoesPendentes,
  onApplyScaleFilter,
  scaleFilterActive,
  scaleFilterLabel,
  onClearScaleFilter,
}) => {
  const [showDriverOptionsModal, setShowDriverOptionsModal] = useState<ControleHorarioItem | null>(null);
  const [showCobradorOptionsModal, setShowCobradorOptionsModal] = useState<ControleHorarioItem | null>(null);
  const [vehicleDrafts, setVehicleDrafts] = useState<Record<string, string>>({});
  const [pendingVehicle, setPendingVehicle] = useState<{ open: boolean; vehicle: string; anchorId: string }>({ open: false, vehicle: '', anchorId: '' });
  const visibleItems = controleHorarios;

  const anchorItem = pendingVehicle.open
    ? (visibleItems.find((it) => it.id === pendingVehicle.anchorId) || null)
    : null;

  const propagationTargets: string[] = (() => {
    if (!anchorItem) return [];
    const service = (anchorItem as any).cod_servico_numero;
    const driverBadge = (anchorItem as any).crachaMotoristaGlobus || (anchorItem as any).crachaMotoristaEditado;
    const anchorIndex = visibleItems.findIndex((it) => it.id === anchorItem.id);
    const anchorTime = new Date((anchorItem as any).hor_saida || (anchorItem as any).horaSaida || new Date(0)).getTime();
    const ids: string[] = [];
    for (let i = anchorIndex + 1; i < visibleItems.length; i++) {
      const it: any = visibleItems[i];
      if (it.cod_servico_numero !== service) continue;
      const itBadge = it.crachaMotoristaGlobus || it.crachaMotoristaEditado;
      if (!driverBadge || itBadge !== driverBadge) continue;
      const t = new Date(it.hor_saida || it.horaSaida || new Date(0)).getTime();
      if (isFinite(anchorTime) && isFinite(t) && t >= anchorTime) {
        ids.push(it.id);
      }
    }
    return ids;
  })();

  const formatTime = (timeString?: string): string => {
    if (!timeString) return 'N/A';
    return timeString.substring(0, 5);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mb-2" />
        <p className="text-gray-600 font-medium">Carregando controle de horários...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto text-red-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Erro ao carregar dados</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button onClick={onRetry} className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <RefreshCw className="h-4 w-4 mr-2" /> Tentar Novamente
        </button>
      </div>
    );
  }

  if (controleHorarios.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma viagem encontrada</h3>
        {!statusDados.existeViagensGlobus && (
          <p className="text-sm text-gray-500">Verifique se existem dados do Globus para esta data.</p>
        )}
      </div>
    );
  }

  return (
    <div className="w-full">
      {scaleFilterActive && (
        <div className="flex items-center justify-between mb-3 px-3 py-2 rounded-md border border-yellow-300 bg-yellow-50 text-yellow-800">
          <div className="text-sm">Filtro de escala ativo{scaleFilterLabel ? `: ${scaleFilterLabel}` : ''}</div>
          {onClearScaleFilter && (
            <button
              onClick={onClearScaleFilter}
              className="text-xs px-2 py-1 rounded border border-yellow-400 hover:bg-yellow-100"
              title="Remover filtro de escala"
            >
              Limpar filtro
            </button>
          )}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-800 text-gray-200">
          <thead className="bg-gray-800/60">
            <tr>
              <th className="w-10 px-3 py-3 text-left"><span className="sr-only">Expandir</span></th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Horários</th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Linha / Serviço</th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Origem</th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Destino</th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Atividade / Tipo</th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Setor</th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Motorista</th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Cobrador</th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Veículo</th>
            </tr>
          </thead>
          <tbody className="bg-transparent divide-y divide-gray-800">
            {visibleItems.map((item) => {
              const saidaISO = (item as any).hor_saida || (item as any).horaSaida;
              const saidaDate = saidaISO ? new Date(saidaISO) : null;
              const passou = !!(saidaDate && saidaDate.getTime() < Date.now());
              const temVeiculo = !!(item.numeroCarro && String(item.numeroCarro).trim() !== '');
              const trocouMotorista = !!(item.nomeMotoristaEditado || item.crachaMotoristaEditado);
              const trocouCobrador = !!(item.nomeCobradorEditado || item.crachaCobradorEditado);
              const nomeAtividade = ((item as any).nome_atividade || '').toString().toUpperCase();
              const isAtividadeAmarela = nomeAtividade === 'RECOLHIMENTO' || nomeAtividade === 'RENDIÇÃO';
              const rowClass = (passou && !temVeiculo)
                ? 'border-l-4 border-red-500 bg-red-900/10'
                : (passou && (trocouMotorista || trocouCobrador))
                  ? 'border-l-4 border-yellow-400 bg-yellow-900/10'
                  : (passou && temVeiculo && !trocouMotorista && !trocouCobrador)
                    ? 'border-l-4 border-green-500 bg-green-900/10'
                    : '';
              const draft = vehicleDrafts[item.id] ?? ((item as any).numeroCarro || '');
              return (
                <tr key={item.id} className={`transition-colors hover:bg-gray-800/40 ${rowClass}`}>
                  <td className="px-3 py-4" />
                  <td className="px-2 py-4 text-sm text-gray-400">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1 text-gray-400" />
                      <span className="font-mono">{formatTime((item as any).horaSaida)} até {formatTime((item as any).horaChegada)}</span>
                    </div>
                  </td>
                  <td className="px-2 py-4">
                    <div className="flex flex-col">
                      <div className="text-sm font-medium text-gray-400">{(item as any).codigoLinha}</div>
                      <div className="text-xs text-gray-400" title={(item as any).nomeLinha}>{(item as any).nomeLinha}</div>
                      <div className="text-base font-semibold text-blue-700 mt-1">Serviço {(item as any).cod_servico_numero || ''}</div>
                    </div>
                  </td>
                  <td className="px-2 py-4 text-sm text-gray-400">
                    <div className="flex flex-col">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                        <span className="font-medium">{(item as any).localOrigemViagem || 'N/A'}</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">{(item as any).sentido_texto || ''}</div>
                    </div>
                  </td>
                  <td className="px-2 py-4 text-sm text-gray-400">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                      <span className="font-medium">{(item as any).localDestinoLinha || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-2 py-4 text-sm text-gray-400">
                    <div className="flex flex-col space-y-1">
                      <div className="text-sm text-gray-400">{(item as any).nome_atividade || 'N/A'}</div>
                      <div className="text-xs text-gray-400">{(item as any).flg_tipo || ''}</div>
                    </div>
                  </td>
                  <td className="px-2 py-4 text-sm text-gray-400">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border bg-gray-300 text-gray-900 border-gray-200">{(item as any).setorPrincipalLinha}</span>
                  </td>
                  <td className="px-2 py-4">
                    <div className="cursor-pointer" onClick={() => setShowDriverOptionsModal(item)}>
                      <button
                        type="button"
                        className="text-sm font-bold text-blue-700 leading-tight hover:underline"
                        onClick={(e) => {
                          e.stopPropagation();
                          const servico = (item as any).cod_servico_numero || '';
                          // Usar SEMPRE o crachá original (Globus) para filtrar escala
                          const cracha = (item as any).crachaMotoristaGlobus || (item as any).crachaMotoristaEditado || '';
                          if (onApplyScaleFilter && servico && cracha) onApplyScaleFilter({ servico, cracha, tipo: 'motorista' });
                        }}
                        title="Ver escala deste motorista"
                      >
                        {(item as any).crachaMotoristaEditado || (item as any).crachaMotoristaGlobus || 'N/A'}
                      </button>
                      {((item as any).nomeMotoristaEditado && (item as any).nomeMotoristaEditado.trim() !== '') ? (
                        <div className="mt-0.5 leading-tight">
                          <div className="text-xs font-semibold text-yellow-700">Novo: {(item as any).nomeMotoristaEditado}</div>
                          <div className="text-[11px] text-gray-400">Original: {(item as any).nomeMotoristaGlobus || 'N/I'}</div>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400 leading-tight">Original: {(item as any).nomeMotoristaGlobus || 'N/I'}</div>
                      )}
                      <button
                        type="button"
                        className="mt-1 text-[11px] text-blue-600 hover:underline flex items-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          const servico = (item as any).cod_servico_numero || '';
                          // Usar SEMPRE o crachá original (Globus) para filtrar escala
                          const cracha = (item as any).crachaMotoristaGlobus || (item as any).crachaMotoristaEditado || '';
                          if (onApplyScaleFilter && servico && cracha) onApplyScaleFilter({ servico, cracha, tipo: 'motorista' });
                        }}
                        title="Ver escala com o motorista atual"
                      >
                        <ClipboardList className="h-3.5 w-3.5 mr-1" /> Ver escala
                      </button>
                    </div>
                  </td>
                  <td className="px-2 py-4">
                    <div className="cursor-pointer" onClick={() => setShowCobradorOptionsModal(item)}>
                      <button
                        type="button"
                        className="text-sm font-bold text-blue-700 leading-tight hover:underline"
                        onClick={(e) => {
                          e.stopPropagation();
                          const servico = (item as any).cod_servico_numero || '';
                          // Usar SEMPRE o crachá original (Globus) para filtrar escala
                          const cracha = (item as any).crachaCobradorGlobus || (item as any).crachaCobradorEditado || '';
                          if (onApplyScaleFilter && servico && cracha) onApplyScaleFilter({ servico, cracha, tipo: 'cobrador' });
                        }}
                        title="Ver escala deste cobrador"
                      >
                        {(item as any).crachaCobradorEditado || (item as any).crachaCobradorGlobus || 'N/A'}
                      </button>
                      {((item as any).nomeCobradorEditado && (item as any).nomeCobradorEditado.trim() !== '') ? (
                        <div className="mt-0.5 leading-tight">
                          <div className="text-xs font-semibold text-yellow-700">Novo: {(item as any).nomeCobradorEditado}</div>
                          <div className="text-[11px] text-gray-400">Original: {(item as any).nomeCobradorGlobus || 'N/I'}</div>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400 leading-tight">Original: {(item as any).nomeCobradorGlobus || 'N/I'}</div>
                      )}
                      <button
                        type="button"
                        className="mt-1 text-[11px] text-blue-600 hover:underline flex items-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          const servico = (item as any).cod_servico_numero || '';
                          // Usar SEMPRE o crachá original (Globus) para filtrar escala
                          const cracha = (item as any).crachaCobradorGlobus || (item as any).crachaCobradorEditado || '';
                          if (onApplyScaleFilter && servico && cracha) onApplyScaleFilter({ servico, cracha, tipo: 'cobrador' });
                        }}
                        title="Ver escala com o cobrador atual"
                      >
                        <ClipboardList className="h-3.5 w-3.5 mr-1" /> Ver escala
                      </button>
                    </div>
                  </td>
                  <td className="px-2 py-4 text-black">
                    <input
                      type="text"
                      value={vehicleDrafts[item.id] ?? ((item as any).numeroCarro || '')}
                      onChange={(e) => {
                        const onlyDigits = (e.target.value || '').replace(/[^0-9]/g, '');
                        setVehicleDrafts(prev => ({ ...prev, [item.id]: onlyDigits }));
                      }}
                      onBlur={(e) => {
                        const val = (e.target.value || '').trim();
                        if (!val) return;
                        if (val.length < 6) { e.target.focus(); return; }
                        if (/^\d{6,7}$/.test(val)) { setPendingVehicle({ open: true, vehicle: val, anchorId: item.id }); return; }
                        const ok = window.confirm(`Salvar número do veículo "${val}"?`);
                        if (ok) onInputChange(item.id, 'numeroCarro', val);
                      }}
                      placeholder="Nº Veículo"
                      className={`w-24 px-2 py-1 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${((item as any).hor_saida && new Date((item as any).hor_saida) < new Date() && !(item as any).numeroCarro) ? 'border-yellow-500 bg-yellow-50' : 'border-gray-400'}`}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showDriverOptionsModal && (
        <PersonOptionsModal item={showDriverOptionsModal} personType="motorista" onClose={() => setShowDriverOptionsModal(null)} onInputChange={onInputChange} onApplyScaleFilter={onApplyScaleFilter} />
      )}
      {showCobradorOptionsModal && (
        <PersonOptionsModal item={showCobradorOptionsModal} personType="cobrador" onClose={() => setShowCobradorOptionsModal(null)} onInputChange={onInputChange} onApplyScaleFilter={onApplyScaleFilter} />
      )}

      <ConfirmVehicleModal
        isOpen={pendingVehicle.open}
        vehicleNumber={pendingVehicle.vehicle}
        anchorItem={anchorItem}
        affectedCount={propagationTargets.length}
        onCancel={() => { setPendingVehicle({ open: false, vehicle: '', anchorId: '' }); }}
        onConfirm={() => {
          const newVal = pendingVehicle.vehicle;
          if (pendingVehicle.anchorId) {
            onInputChange(pendingVehicle.anchorId, 'numeroCarro', newVal);
            setVehicleDrafts(prev => ({ ...prev, [pendingVehicle.anchorId]: newVal }));
          }
          propagationTargets.forEach((targetId) => {
            onInputChange(targetId, 'numeroCarro', newVal);
            setVehicleDrafts(prev => ({ ...prev, [targetId]: newVal }));
          });
          setPendingVehicle({ open: false, vehicle: '', anchorId: '' });
        }}
      />
    </div>
  );
}

export default DataTable;
