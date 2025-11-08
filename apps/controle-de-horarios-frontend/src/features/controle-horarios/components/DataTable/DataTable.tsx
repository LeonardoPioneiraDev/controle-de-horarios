// src/features/controle-horarios/components/DataTable/DataTable.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { AlertCircle, Clock, RefreshCw, MapPin, Save, X, ClipboardList, Navigation, ArrowDown, Play, Square, Users, Car, Bus, Calendar, Activity } from 'lucide-react';
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
  onSave: (data: { nome: string; cracha: string; observacoes: string; numeroCarro: string }) => void;
}

const PersonOptionsModal: React.FC<PersonOptionsModalProps> = ({ item, personType, onClose, onApplyScaleFilter, onSave }) => {
  const isMotorista = personType === 'motorista';
  const crachaOriginal = isMotorista ? item.crachaMotoristaGlobus : item.crachaCobradorGlobus;
  const [tempNome, setTempNome] = useState(isMotorista ? item.nomeMotoristaEditado || '' : item.nomeCobradorEditado || '');
  const [tempCracha, setTempCracha] = useState(isMotorista ? item.crachaMotoristaEditado || '' : item.crachaCobradorEditado || '');
  const [tempObservacoes, setTempObservacoes] = useState((item as any).observacoes || '');
  const [tempNumeroCarro, setTempNumeroCarro] = useState(item.numeroCarro || '');

  const handleSave = () => {
    onSave({ nome: tempNome, cracha: tempCracha, observacoes: tempObservacoes, numeroCarro: tempNumeroCarro });
    onClose();
  };

  const canEditPerson = tempNumeroCarro.trim() !== ''; // Enable person editing only if vehicle is entered

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="relative top-20 w-11/12 max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="relative">
          <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-r from-yellow-400/30 via-amber-500/25 to-yellow-300/30 blur-md" />
          <div className="relative rounded-xl border border-yellow-400/20 bg-neutral-900 text-gray-100 shadow-2xl">
            <div className="px-6 py-4 border-b border-yellow-400/20">
              <div className="flex items-center space-y-2">
                {/* Título com ícone */}
                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-yellow-400" />
                  <h3 className="text-lg font-semibold text-yellow-400">Opções do {isMotorista ? 'Motorista' : 'Cobrador'}</h3>
                </div>
              </div>
              <div className="flex items-center mt-2">
                <Activity className="h-4 w-4 mr-2 text-blue-400" />
                <p className="text-sm text-gray-400">Crachá Original: <span className="font-semibold text-gray-200">{crachaOriginal || 'Não informado'}</span></p>
              </div>
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

              {/* Vehicle Input */}
              <div>
                <div className="flex items-center mb-1">
                  <Bus className="h-4 w-4 mr-2 text-yellow-400" />
                  <label className="block text-sm font-medium text-gray-300">Número do Veículo</label>
                </div>
                <input
                  type="text"
                  className="block w-full px-3 py-2 border border-neutral-700 bg-neutral-800/60 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm text-gray-100"
                  value={tempNumeroCarro}
                  onChange={(e) => setTempNumeroCarro(e.target.value.replace(/[^0-9]/g, '').slice(0, 7))}
                  placeholder="Digite o número do veículo"
                />
              </div>
              
              <div>
                <div className="flex items-center mb-1">
                  <Users className="h-4 w-4 mr-2 text-green-400" />
                  <label className="block text-sm font-medium text-gray-300">Nome do Substituto</label>
                </div>
                <input
                  className="block w-full px-3 py-2 border border-neutral-700 bg-neutral-800/60 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm text-gray-100"
                  value={tempNome}
                  onChange={(e) => setTempNome(e.target.value)}
                  placeholder="Digite o nome"
                  disabled={!canEditPerson}
                />
              </div>
              
              <div>
                <div className="flex items-center mb-1">
                  <Activity className="h-4 w-4 mr-2 text-blue-400" />
                  <label className="block text-sm font-medium text-gray-300">Crachá do Substituto</label>
                </div>
                <input
                  className="block w-full px-3 py-2 border border-neutral-700 bg-neutral-800/60 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm text-gray-100"
                  value={tempCracha}
                  onChange={(e) => setTempCracha(e.target.value)}
                  placeholder="Digite o crachá"
                  disabled={!canEditPerson}
                />
              </div>
              
              <div>
                <div className="flex items-center mb-1">
                  <AlertCircle className="h-4 w-4 mr-2 text-orange-400" />
                  <label className="block text-sm font-medium text-gray-300">Observações</label>
                </div>
                <textarea
                  className="block w-full px-3 py-2 border border-neutral-700 bg-neutral-800/60 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm text-gray-100"
                  value={tempObservacoes}
                  onChange={(e) => setTempObservacoes(e.target.value)}
                  rows={2}
                  placeholder="Adicione uma observação se necessário"
                  disabled={!canEditPerson}
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-yellow-400/20 flex justify-end gap-3">
              <button onClick={onClose} className="px-4 py-2 bg-neutral-700 text-gray-200 text-sm font-medium rounded-md w-auto shadow-sm hover:bg-neutral-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-900 focus:ring-gray-500 transition-colors">
                <X className="h-4 w-4 mr-2 inline" />
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
              <div className="flex items-center">
                <Bus className="h-5 w-5 mr-2 text-yellow-400" />
                <h3 id="confirm-vehicle-title" className="text-lg font-semibold text-yellow-400">Confirmar Propagação de Veículo</h3>
              </div>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="flex items-center">
                <Bus className="h-4 w-4 mr-2 text-blue-400" />
                <p className="text-sm text-gray-300">
                  Aplicar o veículo <span className="font-semibold text-gray-100">{vehicleNumber}</span> a esta viagem e propagar para as próximas?
                </p>
              </div>
              
              <div className="border border-neutral-700 bg-neutral-800/60 rounded-md p-3">
                <div className="flex items-center mb-2">
                  <AlertCircle className="h-4 w-4 mr-2 text-orange-400" />
                  <p className="text-xs text-gray-400">A alteração será aplicada em viagens com:</p>
                </div>
                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
                    <Activity className="h-3 w-3" />
                    Serviço: <b className="text-blue-200">{service}</b>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    <Users className="h-3 w-3" />
                    Crachá: <b className="text-indigo-200">{driverBadge}</b>
                  </span>
                </div>
                <div className="flex items-center mt-3">
                  <Calendar className="h-4 w-4 mr-2 text-yellow-400" />
                  <p className="text-xs text-gray-400">
                    <span className="font-bold text-yellow-400">{affectedCount}</span> viagem(ns) subsequente(s) será(ão) afetada(s).
                  </p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-yellow-400/20 flex justify-end gap-3">
              <button
                onClick={onCancel}
                className="px-4 py-2 bg-neutral-700 text-gray-200 text-sm font-medium rounded-md w-auto shadow-sm hover:bg-neutral-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-900 focus:ring-gray-500 transition-colors"
              >
                <X className="h-4 w-4 mr-2 inline" />
                Cancelar
              </button>
              <button
                onClick={onConfirm}
                className="px-5 py-2 bg-yellow-500 text-neutral-900 text-sm font-bold rounded-md w-auto shadow-sm hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-900 focus:ring-yellow-500 transition-colors"
              >
                <Save className="h-4 w-4 mr-2 inline" />
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
  newData: { nome: string; cracha: string; numeroCarro: string };
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
              <div className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-yellow-400" />
                <h3 className="text-lg font-semibold text-yellow-400">Confirmar Propagação de {personType === 'motorista' ? 'Motorista' : 'Cobrador'}</h3>
              </div>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2 text-green-400" />
                <p className="text-sm text-gray-300">
                  Aplicar a substituição para <span className="font-semibold text-gray-100">{newData.nome} (crachá: {newData.cracha})</span> nesta viagem e propagar para as próximas?
                </p>
              </div>
              
              <div className="border border-neutral-700 bg-neutral-800/60 rounded-md p-3">
                <div className="flex items-center mb-2">
                  <AlertCircle className="h-4 w-4 mr-2 text-orange-400" />
                  <p className="text-xs text-gray-400">A alteração será aplicada em viagens com o mesmo serviço e motorista original:</p>
                </div>
                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
                    <Activity className="h-3 w-3" />
                    Serviço: <b className="text-blue-200">{service}</b>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    <Users className="h-3 w-3" />
                    Motorista Original: <b className="text-indigo-200">{originalDriverBadge}</b>
                  </span>
                </div>
                <div className="flex items-center mt-3">
                  <Calendar className="h-4 w-4 mr-2 text-yellow-400" />
                  <p className="text-xs text-gray-400">
                    <span className="font-bold text-yellow-400">{affectedCount}</span> viagem(ns) subsequente(s) será(ão) afetada(s).
                  </p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-yellow-400/20 flex justify-end gap-3">
              <button
                onClick={onCancel}
                className="px-4 py-2 bg-neutral-700 text-gray-200 text-sm font-medium rounded-md w-auto shadow-sm hover:bg-neutral-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-900 focus:ring-gray-500 transition-colors"
              >
                <X className="h-4 w-4 mr-2 inline" />
                Cancelar
              </button>
              <button
                onClick={onConfirm}
                className="px-5 py-2 bg-yellow-500 text-neutral-900 text-sm font-bold rounded-md w-auto shadow-sm hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-900 focus:ring-yellow-500 transition-colors"
              >
                <Save className="h-4 w-4 mr-2 inline" />
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
    numeroCarro: string; // Added numeroCarro
  }>({ open: false, anchorId: '', personType: 'motorista', nome: '', cracha: '', observacoes: '', numeroCarro: '' });
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobileOrTablet = windowWidth <= 1200;

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
        }, 40000);
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

  const handlePersonModalSave = useCallback((item: ControleHorarioItem, personType: 'motorista' | 'cobrador', data: { nome: string; cracha: string; observacoes: string; numeroCarro: string }) => {
    const originalItem = controleHorariosOriginais.find(orig => orig.id === item.id);
    if (!originalItem) return; // Should not happen

    let hasChanges = false;

    // Check for vehicle number change
    if (data.numeroCarro !== item.numeroCarro) {
      onInputChange(item.id, 'numeroCarro', data.numeroCarro);
      hasChanges = true;
    }

    // Check for person details change
    const currentNome = personType === 'motorista' ? item.nomeMotoristaEditado : item.nomeCobradorEditado;
    const currentCracha = personType === 'motorista' ? item.crachaMotoristaEditado : item.crachaCobradorEditado;
    const currentObservacoes = item.observacoes;

    if (data.nome !== currentNome || data.cracha !== currentCracha || data.observacoes !== currentObservacoes) {
      hasChanges = true;
    }

    if (hasChanges) {
      // If there are any changes (person or vehicle), trigger the propagation modal
      setPendingPerson({ open: true, anchorId: item.id, personType, ...data });
    }
  }, [onInputChange, controleHorariosOriginais, setPendingPerson]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="flex items-center space-y-2">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mr-3" />
          <div className="flex flex-col">
            <Clock className="h-4 w-4 text-blue-400 mb-1" />
            <p className="text-gray-600 font-medium">Carregando controle de horários...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="flex flex-col items-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-400" />
          <div className="flex items-center">
            <X className="h-5 w-5 mr-2 text-red-500" />
            <h3 className="text-lg font-medium text-gray-900">Erro ao carregar dados</h3>
          </div>
          <p className="text-red-600">{error}</p>
          <button 
            onClick={onRetry} 
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <RefreshCw className="h-4 w-4 mr-2" /> Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  if (controleHorarios.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="flex flex-col items-center space-y-4">
          <Clock className="h-12 w-12 text-gray-400" />
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 text-gray-500" />
            <h3 className="text-lg font-medium text-gray-900">Nenhuma viagem encontrada</h3>
          </div>
          {!statusDados.existeViagensGlobus && (
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-gray-400" />
              <p className="text-sm text-gray-500">Verifique se existem dados do Globus para esta data.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const descTipoDia = controleHorarios.length > 0 ? (controleHorarios[0] as any).desc_tipodia : '';

  const sortedVisibleItems = [...visibleItems].sort((a, b) => {
    const saidaA = (a as any).hor_saida || (a as any).horaSaida;
    const saidaB = (b as any).hor_saida || (b as any).horaSaida;
    const timeA = saidaA ? new Date(saidaA).getTime() : 0;
    const timeB = saidaB ? new Date(saidaB).getTime() : 0;

    if (sortOrder === 'asc') {
      return timeA - timeB;
    } else {
      return timeB - timeA;
    }
  });

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        {descTipoDia && (
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-yellow-500" />
              <span className="px-3 py-1 text-xs font-semibold text-black bg-yellow-300 rounded-full border border-yellow-300/30">
                ESCALA TIPO DIA: {descTipoDia}
              </span>
            </div>
          </div>
        )}
        
        <table className="min-w-full divide-y divide-gray-800 text-gray-200">
          <thead className="bg-gray-800/60">
            <tr>
              <th className="w-10 px-1 sm:px-3 py-3 text-left"><span className="sr-only">Expandir</span></th>
              <th
                className="px-1 sm:px-2 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                
                <div className="flex items-center ">
                {sortOrder === 'asc' ? '▲' : '▼'}
                  
                  Horários 
                </div>
              </th>
              <th className="px-1 sm:px-2 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                <div className="flex items-center">
                  <Activity className="h-4 w-4 mr-1 text-purple-400" />
                  Linha / Serviço
                </div>
              </th>
              {isMobileOrTablet ? (
                <>
                  <th className="px-1 sm:px-2 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    <div className="flex items-center">
                      <Navigation className="h-4 w-4 mr-1 text-green-400" />
                      Origem / Destino
                    </div>
                  </th>
                  <th className="px-1 sm:px-2 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    <div className="flex items-center">
                      <Activity className="h-4 w-4 mr-1 text-orange-400" />
                      Atividade / Setor
                    </div>
                  </th>
                </>
              ) : (
                <>
                  <th className="px-1 sm:px-2 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    <div className="flex items-center">
                      <Navigation className="h-4 w-4 mr-1 text-green-400" />
                      Origem
                    </div>
                  </th>
                  <th className="px-1 sm:px-2 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1 text-red-400" />
                      Destino
                    </div>
                  </th>
                  <th className="px-1 sm:px-2 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    <div className="flex items-center">
                      <Activity className="h-4 w-4 mr-1 text-orange-400" />
                      Atividade / Tipo
                    </div>
                  </th>
                  <th className="px-1 sm:px-2 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1 text-indigo-400" />
                      Setor
                    </div>
                  </th>
                </>
              )}
              <th className="px-1 sm:px-2 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1 text-blue-400" />
                  Motorista
                </div>
              </th>
              <th className="px-1 sm:px-2 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1 text-cyan-400" />
                  Cobrador
                </div>
              </th>
              {!isMobileOrTablet && (
                <th className="px-1 sm:px-2 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  <div className="flex items-center">
                    <Bus className="h-4 w-4 mr-1 text-yellow-400" />
                    Veículo
                  </div>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-transparent divide-y divide-gray-800">
            {sortedVisibleItems.map((item) => {
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
                  <td className="px-2 py-4 text-sm text-gray-200">
                    <div className="flex flex-col space-y-2">
                      {/* Horário de Saída */}
                      <div className="flex items-center">
                        <Play className="h-4 w-4 mr-2 text-green-400" />
                        <span className="font-mono font-medium text-green-300">{formatTime((item as any).horaSaida)}</span>
                      </div>
                      
                      {/* Duração/Até - Centralizado */}
                      <div className="flex items-center justify-center">
                        <Clock className="h-4 w-4 text-blue-400 mr-1" />
                        <span className="text-xs text-blue-300 font-medium">até</span>
                        <Clock className="h-4 w-4 text-blue-400 ml-1" />
                      </div>
                      
                      {/* Horário de Chegada */}
                      <div className="flex items-center">
                        <Square className="h-4 w-4 mr-2 text-red-400" />
                        <span className="font-mono font-medium text-red-300">{formatTime((item as any).horaChegada)}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-4">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center">
                        <Activity className="h-4 w-4 mr-2 text-purple-400" />
                        <div className="text-sm font-medium text-gray-200">{(item as any).codigoLinha}</div>
                      </div>
                      <div className="text-xs text-gray-100 ml-6" title={(item as any).nomeLinha}>{(item as any).nomeLinha}</div>
                      <div className="flex items-center mt-1">
                        <Activity className="h-4 w-4 mr-2 text-blue-400" />
                        <div className="text-base font-semibold text-blue-400">Serviço {(item as any).cod_servico_numero || ''}</div>
                      </div>
                    </div>
                  </td>
                  {isMobileOrTablet ? (
                    <>
                      <td className="px-2 py-4 text-sm text-gray-200">
                        <div className="flex flex-col space-y-2">
                          {/* Origem */}
                          <div className="flex items-center">
                            <Navigation className="h-4 w-4 mr-2 text-green-400" />
                            <span className="font-medium text-green-300">{(item as any).localOrigemViagem || 'N/A'}</span>
                          </div>
                          
                          {/* Sentido - Centralizado */}
                          <div className="flex items-center justify-center">
                            <ArrowDown className="h-4 w-4 text-blue-400 mr-1" />
                            <span className="text-xs text-blue-300 font-medium">{(item as any).sentido_texto || ''}</span>
                            <ArrowDown className="h-4 w-4 text-blue-400 ml-1" />
                          </div>
                          
                          {/* Destino */}
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2 text-red-400" />
                            <span className="font-medium text-red-300">{(item as any).localDestinoLinha || 'N/A'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-4 text-sm text-gray-200">
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center">
                            <Activity className="h-4 w-4 mr-2 text-orange-400" />
                            <div className="text-sm text-gray-300">{(item as any).nome_atividade || 'N/A'}</div>
                          </div>
                          <div className="flex items-center ml-6">
                            <div className="text-xs text-gray-300">{(item as any).flg_tipo || ''}</div>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2 text-indigo-400" />
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-neutral-700 text-gray-200">
                              {(item as any).setorPrincipalLinha}
                            </span>
                          </div>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-2 py-4 text-sm text-gray-200">
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center">
                            <Navigation className="h-4 w-4 mr-2 text-green-400" />
                            <span className="font-medium text-green-300">{(item as any).localOrigemViagem || 'N/A'}</span>
                          </div>
                          <div className="flex items-center ml-6">
                            <ArrowDown className="h-3 w-3 mr-1 text-blue-400" />
                            <div className="text-xs text-blue-300">{(item as any).sentido_texto || ''}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-4 text-sm text-gray-200">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-red-400" />
                          <span className="font-medium text-red-300">{(item as any).localDestinoLinha || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-2 py-4 text-sm text-gray-200">
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center">
                            <Activity className="h-4 w-4 mr-2 text-orange-400" />
                            <div className="text-sm text-gray-300">{(item as any).nome_atividade || 'N/A'}</div>
                          </div>
                          <div className="flex items-center ml-6">
                            <div className="text-xs text-gray-300">{(item as any).flg_tipo || ''}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-4 text-sm text-gray-200">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-indigo-400" />
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-neutral-700 text-gray-200">
                            {(item as any).setorPrincipalLinha}
                          </span>
                        </div>
                      </td>
                    </>
                  )}
                  <td className="px-2 py-4">
                    <div className="cursor-pointer" onClick={() => setShowDriverOptionsModal(item)}>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-blue-400" />
                        <button
                          type="button"
                          className="text-sm font-bold text-blue-400 leading-tight hover:underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            const servico = (item as any).cod_servico_numero || '';
                            const cracha = (item as any).crachaMotoristaGlobus || (item as any).crachaMotoristaEditado || '';
                            if (onApplyScaleFilter && servico && cracha) onApplyScaleFilter({ servico, cracha, tipo: 'motorista' });
                          }}
                          title="Ver escala deste motorista"
                        >
                          {(item as any).crachaMotoristaEditado || (item as any).crachaMotoristaGlobus || 'N/A'}
                        </button>
                      </div>
                      {isMobileOrTablet && item.numeroCarro ? (
                        <div className="flex items-center mt-1 ml-6">
                          <Bus className="h-3 w-3 mr-1 text-orange-400" />
                          <span className="text-xs font-semibold text-orange-400">{item.numeroCarro}</span>
                        </div>
                      ) : isMobileOrTablet && (
                        <div className="flex items-center mt-1 ml-6">
                          <Bus className="h-3 w-3 mr-1 text-gray-500" />
                          <span className="text-xs font-semibold text-gray-500">Veículo:</span>
                        </div>
                      )}
                      <div className="mt-0.5 leading-tight ml-6">
                        {((item as any).nomeMotoristaEditado && (item as any).nomeMotoristaEditado.trim() !== '') && (
                          <div className="flex items-center">
                            <Users className="h-3 w-3 mr-1 text-yellow-400" />
                            <div className="text-xs font-semibold text-yellow-500">Atual: {(item as any).nomeMotoristaEditado}</div>
                          </div>
                        )}
                        <div className="flex items-center">
                          <Activity className="h-3 w-3 mr-1 text-gray-400" />
                          <div className="text-[11px] text-green-400"> {(item as any).nomeMotoristaGlobus || 'N/I'}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="mt-1 text-[11px] text-blue-500 hover:underline flex items-center ml-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          const servico = (item as any).cod_servico_numero || '';
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
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-cyan-400" />
                        <button
                          type="button"
                          className="text-sm font-bold text-blue-400 leading-tight hover:underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            const servico = (item as any).cod_servico_numero || '';
                            const cracha = (item as any).crachaCobradorGlobus || (item as any).crachaCobradorEditado || '';
                            if (onApplyScaleFilter && servico && cracha) onApplyScaleFilter({ servico, cracha, tipo: 'cobrador' });
                          }}
                          title="Ver escala deste cobrador"
                        >
                          {(item as any).crachaCobradorEditado || (item as any).crachaCobradorGlobus || 'N/A'}
                        </button>
                      </div>
                      
                      <div className="mt-0.5 leading-tight ml-6">
                        {((item as any).nomeCobradorEditado && (item as any).nomeCobradorEditado.trim() !== '') && (
                          <div className="flex items-center">
                            <Users className="h-3 w-3 mr-1 text-yellow-400" />
                            <div className="text-xs font-semibold text-yellow-500">Atual: {(item as any).nomeCobradorEditado}</div>
                          </div>
                        )}
                        <div className="flex items-center">
                          <Activity className="h-3 w-3 mr-1 text-gray-400" />
                          <div className="text-[11px] text-gray-200">Original: {(item as any).nomeCobradorGlobus || 'N/I'}</div>
                        </div>
                      </div>
                      {!!(item.crachaCobradorGlobus || item.crachaCobradorEditado) && (
                        <button
                          type="button"
                          className="mt-1 text-[11px] text-blue-500 hover:underline flex items-center ml-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            const servico = (item as any).cod_servico_numero || '';
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
                  {!isMobileOrTablet && (
                    <td className="px-2 py-4">
                      <div className="flex items-center">
                        <Bus className="h-4 w-4 mr-2 text-yellow-400" />
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
                      </div>
                    </td>
                  )}
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
          onSave={(data) => handlePersonModalSave(showDriverOptionsModal, 'motorista', data)}
        />
      )}
      {showCobradorOptionsModal && (
        <PersonOptionsModal
          item={showCobradorOptionsModal}
          personType="cobrador"
          onClose={() => setShowCobradorOptionsModal(null)}
          onApplyScaleFilter={onApplyScaleFilter}
          onSave={(data) => handlePersonModalSave(showCobradorOptionsModal, 'cobrador', data)}
        />
      )}

      <ConfirmPersonPropagationModal
        isOpen={pendingPerson.open}
        personType={pendingPerson.personType}
        newData={{ nome: pendingPerson.nome, cracha: pendingPerson.cracha, numeroCarro: pendingPerson.numeroCarro }}
        anchorItem={anchorItem}
        affectedCount={propagationTargets.length}
        onCancel={() => setPendingPerson({ open: false, anchorId: '', personType: 'motorista', nome: '', cracha: '', observacoes: '', numeroCarro: '' })}
        onConfirm={() => {
          if (!anchorItem) return;

          const { nome, cracha, observacoes, numeroCarro, personType } = pendingPerson; // Added numeroCarro
          const allIdsToUpdate = [anchorItem.id, ...propagationTargets];

          allIdsToUpdate.forEach(id => {
            onInputChange(id, personType === 'motorista' ? 'nomeMotoristaEditado' : 'nomeCobradorEditado', nome);
            onInputChange(id, personType === 'motorista' ? 'crachaMotoristaEditado' : 'crachaCobradorEditado', cracha);
            onInputChange(id, 'observacoes' as any, observacoes);
            onInputChange(id, 'numeroCarro', numeroCarro); // Added numeroCarro update
          });

          setPendingPerson({ open: false, anchorId: '', personType: 'motorista', nome: '', cracha: '', observacoes: '', numeroCarro: '' });
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