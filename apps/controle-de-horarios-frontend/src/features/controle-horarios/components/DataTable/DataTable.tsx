// src/features/controle-horarios/components/DataTable/DataTable.tsx
import React, { useEffect, useState } from 'react';
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
  scaleFilterActive?: boolean;
  scaleFilterLabel?: string;
  onClearScaleFilter?: () => void;
  canSave?: boolean;
}

interface PersonOptionsModalProps {
  item: ControleHorarioItem;
  personType: 'motorista' | 'cobrador';
  onClose: () => void;
  onApplyScaleFilter?: (params: { servico: string; cracha: string; tipo: 'motorista' | 'cobrador' }) => void;
  onSave: (data: { nome: string; cracha: string; observacoes: string }) => void;
}

const PersonOptionsModal: React.FC<PersonOptionsModalProps> = ({ item, personType, onClose, onApplyScaleFilter, onSave }) => {
  const isMotorista = personType === 'motorista';
  const crachaOriginal = isMotorista ? item.crachaMotoristaGlobus : item.crachaCobradorGlobus;
  const [tempNome, setTempNome] = useState(isMotorista ? item.nomeMotoristaEditado || '' : item.nomeCobradorEditado || '');
  const [tempCracha, setTempCracha] = useState(isMotorista ? item.crachaMotoristaEditado || '' : item.crachaCobradorEditado || '');
  const [tempObservacoes, setTempObservacoes] = useState((item as any).observacoes || '');

  const handleSave = () => {
    onSave({ nome: tempNome, cracha: tempCracha, observacoes: tempObservacoes });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="relative top-20 w-11/12 max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="relative">
          <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-r from-yellow-400/30 via-amber-500/25 to-yellow-300/30 blur-md" />
          <div className="relative rounded-xl border border-yellow-400/20 bg-neutral-900 text-gray-100 shadow-2xl">
            <div className="px-6 py-4 border-b border-yellow-400/20">
              <h3 className="text-lg font-semibold text-yellow-400">Opções do {isMotorista ? 'Motorista' : 'Cobrador'}</h3>
              <p className="text-sm text-gray-400 mt-1">Crachá Original: <span className="font-semibold text-gray-200">{crachaOriginal || 'Não informado'}</span></p>
            </div>
            <div className="px-6 py-5 space-y-4">
              <button
                onClick={() => {
                  const servico = (item as any).cod_servico_numero || '';
                  const cracha = isMotorista
                    ? ((item as any).crachaMotoristaGlobus || (item as any).crachaMotoristaEditado || '')
                    : ((item as any).crachaCobradorGlobus || (item as any).crachaCobradorEditado || '');
                  if (onApplyScaleFilter && servico && cracha) onApplyScaleFilter({ servico, cracha, tipo: isMotorista ? 'motorista' : 'cobrador' });
                  onClose();
                }}
                className="w-full flex items-center justify-center px-4 py-2 border border-yellow-400/30 rounded-md shadow-sm text-sm font-medium text-yellow-300 bg-yellow-400/10 hover:bg-yellow-400/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-900 focus:ring-yellow-500 transition-colors"
              >
                <ClipboardList className="h-4 w-4 mr-2" /> Ver Escala Completa
              </button>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Nome do Substituto</label>
                <input
                  className="block w-full px-3 py-2 border border-neutral-700 bg-neutral-800/60 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm text-gray-100"
                  value={tempNome}
                  onChange={(e) => setTempNome(e.target.value)}
                  placeholder="Digite o nome"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Crachá do Substituto</label>
                <input
                  className="block w-full px-3 py-2 border border-neutral-700 bg-neutral-800/60 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm text-gray-100"
                  value={tempCracha}
                  onChange={(e) => setTempCracha(e.target.value)}
                  placeholder="Digite o crachá"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Observações</label>
                <textarea
                  className="block w-full px-3 py-2 border border-neutral-700 bg-neutral-800/60 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm text-gray-100"
                  value={tempObservacoes}
                  onChange={(e) => setTempObservacoes(e.target.value)}
                  rows={2}
                  placeholder="Adicione uma observação se necessário"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-yellow-400/20 flex justify-end gap-3">
              <button onClick={onClose} className="px-4 py-2 bg-neutral-700 text-gray-200 text-sm font-medium rounded-md w-auto shadow-sm hover:bg-neutral-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-900 focus:ring-gray-500 transition-colors">
                Cancelar
              </button>
              <button onClick={handleSave} className="px-5 py-2 bg-yellow-500 text-neutral-900 text-sm font-bold rounded-md w-auto shadow-sm hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-900 focus:ring-yellow-500 transition-colors">
                <Save className="h-4 w-4 mr-2 inline" />
                Salvar e Propagar
              </button>
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
  const service = (anchorItem as any).cod_servico_numero || 'N/I';
  const driverBadge = (anchorItem as any).crachaMotoristaGlobus || (anchorItem as any).crachaMotoristaEditado || 'N/I';
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-sm"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-vehicle-title"
    >
      <div className="relative top-20 w-11/12 max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="relative">
          <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-r from-yellow-400/30 via-amber-500/25 to-yellow-300/30 blur-md" />
          <div className="relative rounded-xl border border-yellow-400/20 bg-neutral-900 text-gray-100 shadow-2xl">
            <div className="px-6 py-4 border-b border-yellow-400/20">
              <h3 id="confirm-vehicle-title" className="text-lg font-semibold text-yellow-400">Confirmar Propagação de Veículo</h3>
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-gray-300">
                Aplicar o veículo <span className="font-semibold text-gray-100">{vehicleNumber}</span> a esta viagem e propagar para as próximas?
              </p>
              <div className="border border-neutral-700 bg-neutral-800/60 rounded-md p-3">
                <p className="text-xs text-gray-400 mb-2">A alteração será aplicada em viagens com:</p>
                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">Serviço: <b className="text-blue-200">{service}</b></span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">Crachá: <b className="text-indigo-200">{driverBadge}</b></span>
                </div>
                <p className="text-xs text-gray-400 mt-3">
                  <span className="font-bold text-yellow-400">{affectedCount}</span> viagem(ns) subsequente(s) será(ão) afetada(s).
                </p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-yellow-400/20 flex justify-end gap-3">
              <button
                onClick={onCancel}
                className="px-4 py-2 bg-neutral-700 text-gray-200 text-sm font-medium rounded-md w-auto shadow-sm hover:bg-neutral-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-900 focus:ring-gray-500 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={onConfirm}
                className="px-5 py-2 bg-yellow-500 text-neutral-900 text-sm font-bold rounded-md w-auto shadow-sm hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-900 focus:ring-yellow-500 transition-colors"
              >
                Confirmar e Propagar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ConfirmPersonPropagationModal: React.FC<{
  isOpen: boolean;
  personType: 'motorista' | 'cobrador';
  newData: { nome: string; cracha: string };
  anchorItem: ControleHorarioItem | null;
  affectedCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ isOpen, personType, newData, anchorItem, affectedCount, onConfirm, onCancel }) => {
  if (!isOpen || !anchorItem) return null;

  const service = (anchorItem as any).cod_servico_numero || 'N/I';
  const originalDriverBadge = (anchorItem as any).crachaMotoristaGlobus || 'N/A';

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-sm"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
    >
      <div className="relative top-20 w-11/12 max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="relative">
          <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-r from-yellow-400/30 via-amber-500/25 to-yellow-300/30 blur-md" />
          <div className="relative rounded-xl border border-yellow-400/20 bg-neutral-900 text-gray-100 shadow-2xl">
            <div className="px-6 py-4 border-b border-yellow-400/20">
              <h3 className="text-lg font-semibold text-yellow-400">Confirmar Propagação de {personType === 'motorista' ? 'Motorista' : 'Cobrador'}</h3>
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-gray-300">
                Aplicar a substituição para <span className="font-semibold text-gray-100">{newData.nome} (crachá: {newData.cracha})</span> nesta viagem e propagar para as próximas?
              </p>
              <div className="border border-neutral-700 bg-neutral-800/60 rounded-md p-3">
                <p className="text-xs text-gray-400 mb-2">A alteração será aplicada em viagens com o mesmo serviço e motorista original:</p>
                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">Serviço: <b className="text-blue-200">{service}</b></span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">Motorista Original: <b className="text-indigo-200">{originalDriverBadge}</b></span>
                </div>
                <p className="text-xs text-gray-400 mt-3">
                  <span className="font-bold text-yellow-400">{affectedCount}</span> viagem(ns) subsequente(s) será(ão) afetada(s).
                </p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-yellow-400/20 flex justify-end gap-3">
              <button
                onClick={onCancel}
                className="px-4 py-2 bg-neutral-700 text-gray-200 text-sm font-medium rounded-md w-auto shadow-sm hover:bg-neutral-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-900 focus:ring-gray-500 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={onConfirm}
                className="px-5 py-2 bg-yellow-500 text-neutral-900 text-sm font-bold rounded-md w-auto shadow-sm hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-900 focus:ring-yellow-500 transition-colors"
              >
                Confirmar e Propagar
              </button>
            </div>
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
  const [hiddenRows, setHiddenRows] = useState(new Set<string>());
  const [pendingPerson, setPendingPerson] = useState<{
    open: boolean;
    anchorId: string;
    personType: 'motorista' | 'cobrador';
    nome: string;
    cracha: string;
    observacoes: string;
  }>({ open: false, anchorId: '', personType: 'motorista', nome: '', cracha: '', observacoes: '' });
  const visibleItems = controleHorarios;

  useEffect(() => {
    const timers = new Map<string, ReturnType<typeof setTimeout>>();

    controleHorarios.forEach((item) => {
      const saidaISO = (item as any).hor_saida || (item as any).horaSaida;
      const saidaDate = saidaISO ? new Date(saidaISO) : null;
      const passou = !!(saidaDate && saidaDate.getTime() < Date.now());
      const temVeiculo = !!(item.numeroCarro && String(item.numeroCarro).trim() !== '');
      const trocouMotorista = !!(item.nomeMotoristaEditado || item.crachaMotoristaEditado);
      const trocouCobrador = !!(item.nomeCobradorEditado || item.crachaCobradorEditado);

      const isGreenRow = passou && temVeiculo && !trocouMotorista && !trocouCobrador;

      if (isGreenRow && !hiddenRows.has(item.id)) {
        const timerId = setTimeout(() => {
          setHiddenRows(prev => new Set(prev).add(item.id));
        }, 40000); // 40 seconds
        timers.set(item.id, timerId);
      }
    });

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [controleHorarios, hiddenRows]);


  const anchorItem = pendingVehicle.open
    ? (visibleItems.find((it) => it.id === pendingVehicle.anchorId) || null)
    : pendingPerson.open
    ? (visibleItems.find((it) => it.id === pendingPerson.anchorId) || null)
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
        <div className="flex items-center justify-between mb-3 px-3 py-2 rounded-md border border-yellow-400/30 bg-yellow-900/20 text-yellow-300">
          <div className="text-sm">Filtro de escala ativo{scaleFilterLabel ? `: ${scaleFilterLabel}` : ''}</div>
          {onClearScaleFilter && (
            <button
              onClick={onClearScaleFilter}
              className="text-xs px-2 py-1 rounded border border-yellow-400/30 text-yellow-300 hover:bg-yellow-400/10"
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
               if (hiddenRows.has(item.id)) {
                return null;
              }
              const saidaISO = (item as any).hor_saida || (item as any).horaSaida;
              const saidaDate = saidaISO ? new Date(saidaISO) : null;
              const passou = !!(saidaDate && saidaDate.getTime() < Date.now());
              const temVeiculo = !!(item.numeroCarro && String(item.numeroCarro).trim() !== '');
              const trocouMotorista = !!(item.nomeMotoristaEditado || item.crachaMotoristaEditado);
              const trocouCobrador = !!(item.nomeCobradorEditado || item.crachaCobradorEditado);
              const nomeAtividade = ((item as any).nome_atividade || '').toString().toUpperCase();
              const isAtividadeAmarela = nomeAtividade === 'RECOLHIMENTO' || nomeAtividade === 'RENDIÇÃO';
              const rowClass = (passou && !temVeiculo)
                ? 'border-l-4 border-red-500 bg-red-900/30'
                : (passou && (trocouMotorista || trocouCobrador))
                  ? 'border-l-4 border-yellow-400 bg-yellow-900/25'
                  : (passou && temVeiculo && !trocouMotorista && !trocouCobrador)
                    ? 'border-l-4 border-green-500 bg-green-900/20'
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
                      <div className="text-base font-semibold text-blue-400 mt-1">Serviço {(item as any).cod_servico_numero || ''}</div>
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
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-neutral-700 text-gray-300">{(item as any).setorPrincipalLinha}</span>
                  </td>
                  <td className="px-2 py-4">
                    <div className="cursor-pointer" onClick={() => setShowDriverOptionsModal(item)}>
                      <button
                        type="button"
                        className="text-sm font-bold text-blue-400 leading-tight hover:underline"
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
                      <div className="mt-0.5 leading-tight">
                        {((item as any).nomeMotoristaEditado && (item as any).nomeMotoristaEditado.trim() !== '') && (
                          <div className="text-xs font-semibold text-yellow-500">Atual: {(item as any).nomeMotoristaEditado}</div>
                        )}
                        <div className="text-[11px] text-gray-400">Original: {(item as any).nomeMotoristaGlobus || 'N/I'}</div>
                      </div>
                      <button
                        type="button"
                        className="mt-1 text-[11px] text-blue-500 hover:underline flex items-center"
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
                        className="text-sm font-bold text-blue-400 leading-tight hover:underline"
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
                      <div className="mt-0.5 leading-tight">
                        {((item as any).nomeCobradorEditado && (item as any).nomeCobradorEditado.trim() !== '') && (
                          <div className="text-xs font-semibold text-yellow-500">Atual: {(item as any).nomeCobradorEditado}</div>
                        )}
                        <div className="text-[11px] text-gray-400">Original: {(item as any).nomeCobradorGlobus || 'N/I'}</div>
                      </div>
                      {!!(item.crachaCobradorGlobus || item.crachaCobradorEditado) && ( // Conditional render for "Ver escala"
                        <button
                          type="button"
                          className="mt-1 text-[11px] text-blue-500 hover:underline flex items-center"
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
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-4">
                    <input
                      type="text"
                      value={vehicleDrafts[item.id] ?? ((item as any).numeroCarro || '')}
                      onChange={(e) => {
                        const onlyDigits = (e.target.value || '').replace(/[^0-9]/g, '').slice(0, 7);
                        setVehicleDrafts(prev => ({ ...prev, [item.id]: onlyDigits }));
                      }}
                      onBlur={(e) => {
                        const val = (e.target.value || '').trim();
                        if (!val) return;
                        if (val.length < 6) { e.target.focus(); return; }
                        if (/^\d{6,7}$/.test(val)) { setPendingVehicle({ open: true, vehicle: val, anchorId: item.id }); return; }
                      }}
                      placeholder="Nº Veículo"
                      className={`w-24 px-2 py-1 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-colors text-gray-100 ${((item as any).hor_saida && new Date((item as any).hor_saida) < new Date() && !(item as any).numeroCarro) ? 'border-yellow-500 bg-yellow-900/20' : 'border-neutral-700 bg-neutral-800/60'}`}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showDriverOptionsModal && (
        <PersonOptionsModal
          item={showDriverOptionsModal}
          personType="motorista"
          onClose={() => setShowDriverOptionsModal(null)}
          onApplyScaleFilter={onApplyScaleFilter}
          onSave={(data) => {
            setPendingPerson({ open: true, anchorId: showDriverOptionsModal.id, personType: 'motorista', ...data });
          }}
        />
      )}
      {showCobradorOptionsModal && (
        <PersonOptionsModal
          item={showCobradorOptionsModal}
          personType="cobrador"
          onClose={() => setShowCobradorOptionsModal(null)}
          onApplyScaleFilter={onApplyScaleFilter}
          onSave={(data) => {
            setPendingPerson({ open: true, anchorId: showCobradorOptionsModal.id, personType: 'cobrador', ...data });
          }}
        />
      )}

      <ConfirmPersonPropagationModal
        isOpen={pendingPerson.open}
        personType={pendingPerson.personType}
        newData={{ nome: pendingPerson.nome, cracha: pendingPerson.cracha }}
        anchorItem={anchorItem}
        affectedCount={propagationTargets.length}
        onCancel={() => setPendingPerson({ open: false, anchorId: '', personType: 'motorista', nome: '', cracha: '', observacoes: '' })}
        onConfirm={() => {
          if (!anchorItem) return;

          const { nome, cracha, observacoes, personType } = pendingPerson;
          const allIdsToUpdate = [anchorItem.id, ...propagationTargets];

          allIdsToUpdate.forEach(id => {
            onInputChange(id, personType === 'motorista' ? 'nomeMotoristaEditado' : 'nomeCobradorEditado', nome);
            onInputChange(id, personType === 'motorista' ? 'crachaMotoristaEditado' : 'crachaCobradorEditado', cracha);
            onInputChange(id, 'observacoes' as any, observacoes);
          });

          setPendingPerson({ open: false, anchorId: '', personType: 'motorista', nome: '', cracha: '', observacoes: '' });
        }}
      />

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