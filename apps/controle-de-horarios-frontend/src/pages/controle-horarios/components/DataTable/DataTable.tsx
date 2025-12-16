// src/features/controle-horarios/components/DataTable/DataTable.tsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import { UserRole } from '@/types';
import { createPortal } from 'react-dom';
import { AlertCircle, Clock, RefreshCw, MapPin, Save, X, ClipboardList, Navigation, ArrowDown, Play, Square, Users, Car, Bus, Calendar, Activity, ChevronRight, Bell } from 'lucide-react';
import { toast } from 'react-toastify';
import { ControleHorarioItem, StatusControleHorariosData, StatusControleHorariosDto, EstatisticasControleHorariosDto } from '@/types/controle-horarios.types';
import { controleHorariosService } from '../../../../services/controleHorariosService';

// Helpers: separar/combinar observações por pessoa
const parseCombinedObservacoes = (text?: string): { motorista: string; cobrador: string } => {
  const src = (text || '').toString();
  const result = { motorista: '', cobrador: '' };
  if (!src.trim()) return result;
  const m = src.match(/\[MOTORISTA\]([\s\S]*?)(?=\[COBRADOR\]|$)/i);
  const c = src.match(/\[COBRADOR\]([\s\S]*?)$/i);
  if (m && m[1] !== undefined) result.motorista = m[1].trim();
  if (c && c[1] !== undefined) result.cobrador = c[1].trim();
  if (!m && !c) {
    // Backward-compat: sem marcações, assume observação única (motorista)
    result.motorista = src.trim();
  }
  return result;
};

const buildCombinedObservacoes = (motorista?: string, cobrador?: string): string => {
  const parts: string[] = [];
  const m = (motorista || '').trim();
  const c = (cobrador || '').trim();
  if (m) parts.push(`[MOTORISTA] ${m}`);
  if (c) parts.push(`[COBRADOR] ${c}`);
  return parts.join(' | ');
};

// ... other code ...

interface VehicleInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialValue: string;
  onSave: (value: string) => void;
  canEdit: boolean;
}

const VehicleInputModal: React.FC<VehicleInputModalProps> = ({ isOpen, onClose, initialValue, onSave, canEdit }) => {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue, isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-11/12 max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="relative">
          <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-r from-yellow-400/30 via-amber-500/25 to-yellow-300/30 blur-md" />
          <div className="relative rounded-xl border border-gray-200 dark:border-yellow-400/20 bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 shadow-2xl">
            <div className="px-6 py-4 border-b bg-gray-50 text-gray-900 border-gray-200 dark:bg-transparent dark:text-gray-100 dark:border-yellow-400/20">
              <div className="flex items-center">
                <Bus className="h-5 w-5 mr-2 text-green-800 dark:text-yellow-400" />
                <h3 className="text-lg font-semibold text-green-800 dark:text-yellow-400">Informar Veículo</h3>
              </div>
            </div>
            <div className="px-6 py-5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Número do Veículo</label>
              <input
                className="block w-full px-3 py-2 border border-gray-600 dark:border-neutral-700 bg-white dark:bg-neutral-800/60 rounded-md shadow-sm focus:outline-none focus:ring-green-700 dark:focus:ring-yellow-500 focus:border-yellow-600 sm:text-sm text-gray-900 dark:text-gray-100"
                value={value}
                disabled={!canEdit}
                onChange={(e) => setValue(e.target.value.replace(/[^0-9]/g, '').slice(0, 7))}
                placeholder="Digite o nº do veículo"
                autoFocus
              />
            </div>
            <div className="px-6 py-4 border-t border-gray-200 dark:border-yellow-400/20 flex justify-end gap-3">
              <button onClick={onClose} className="px-4 py-2 bg-white text-gray-700 border border-gray-300 dark:bg-neutral-800 dark:text-gray-300 dark:border-neutral-600 text-sm font-medium rounded-md hover:bg-gray-50 dark:hover:bg-neutral-700">Cancelar</button>
              <button onClick={() => onSave(value)} className="px-5 py-2 bg-green-700 dark:bg-yellow-500 text-white dark:text-gray-900 text-sm font-bold rounded-md hover:bg-green-800 dark:hover:bg-yellow-600">Salvar</button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

interface PersonOptionsModalProps {
  item: ControleHorarioItem;
  personType: 'motorista' | 'cobrador';
  onClose: () => void;
  onApplyScaleFilter: (filter: { servico: string; cracha: string; tipo: 'motorista' | 'cobrador' }) => void;
  onSave: (data: { nome: string; cracha: string; observacoes: string; numeroCarro: string }) => void;
}

const PersonOptionsModal: React.FC<PersonOptionsModalProps> = ({
  item,
  personType,
  onClose,
  onApplyScaleFilter,
  onSave,
}) => {
  const { user } = useAuth();
  const canEditPrefix = useMemo(() => {
    const role = user?.role as UserRole | undefined;
    return role === UserRole.DESPACHANTE || role === UserRole.ADMINISTRADOR;
  }, [user]);
  const isMotorista = personType === 'motorista';
  const nomeOriginal = isMotorista ? item.nomeMotoristaGlobus : item.nomeCobradorGlobus;
  const crachaOriginal = isMotorista ? item.crachaMotoristaGlobus : item.crachaCobradorGlobus;
  const numeroCarroOriginal = item.numeroCarro || '';
  const observacoesOriginal = item.observacoes || '';
  const obsSections = useMemo(() => parseCombinedObservacoes(observacoesOriginal), [observacoesOriginal]);

  const [tempNome, setTempNome] = useState(isMotorista ? item.nomeMotoristaEditado || '' : item.nomeCobradorEditado || '');
  const [tempCracha, setTempCracha] = useState(isMotorista ? item.crachaMotoristaEditado || '' : item.crachaCobradorEditado || '');
  const [tempObservacoes, setTempObservacoes] = useState(
    (personType === 'motorista' ? obsSections.motorista : obsSections.cobrador) || ''
  );

  const prefix = useMemo(() => `[${new Date().toLocaleString('pt-BR')}] `, []);

  useEffect(() => {
    let currentRawContent = tempObservacoes;
    let existingTimestamp = '';
    let existingCrachaSignature = '';

    // 1. Try to extract existing timestamp
    const timestampRegex = /^\[\d{1,2}\/\d{1,2}\/\d{4}, \d{1,2}:\d{1,2}:\d{1,2}\]\s*/;
    const matchTimestamp = currentRawContent.match(timestampRegex);
    if (matchTimestamp) {
      existingTimestamp = matchTimestamp[0];
      currentRawContent = currentRawContent.substring(existingTimestamp.length);
    }

    // 2. Remove ALL existing Crachá Original signatures
    // Use a global regex to remove all occurrences of "Crachá Original: [digits]."
    // This regex is more specific to the exact pattern and handles surrounding spaces.
    const crachaSignaturePattern = /(Crachá Original: \d+)\.?\s*/g;
    currentRawContent = currentRawContent.replace(crachaSignaturePattern, '');


    // Trim any leading/trailing spaces from the actual user content


    // 3. Determine if a substitution is being made
    const isSubstitutionBeingMade = tempNome.trim() !== '' || tempCracha.trim() !== '';
    const isOriginalCrachaAvailable = !!crachaOriginal && String(crachaOriginal).trim() !== '';
    const newCrachaSignature = `Crachá Original: ${crachaOriginal}`;

    // 4. Build the final observacoes string
    let finalObservacoes = ''; // Start empty

    if (isSubstitutionBeingMade && isOriginalCrachaAvailable) {
      finalObservacoes += prefix; // Add prefix ONLY if substitution is active
      finalObservacoes += newCrachaSignature;
      if (currentRawContent !== '') {
        finalObservacoes += ". " + currentRawContent;
      }
    } else {
      // No substitution, keep only the original clean content (without prefix or signature)
      finalObservacoes = currentRawContent; // This is the user's original text
    }

    // Only update if the value is actually different to prevent unnecessary re-renders
    if (finalObservacoes !== tempObservacoes) {
      setTempObservacoes(finalObservacoes);
    }

  }, [tempNome, tempCracha, crachaOriginal, prefix]);

  const handleSave = () => {
    const isSubstitutionMade = tempNome.trim() !== '' || tempCracha.trim() !== '';
    const isObservacoesEmpty = tempObservacoes.trim() === '' || tempObservacoes.trim() === prefix.trim();

    if (isSubstitutionMade && isObservacoesEmpty) {
      toast.error('É obrigatório adicionar uma observação ao realizar uma substituição.');
      return; // Prevent saving
    }

    const combined = personType === 'motorista'
      ? buildCombinedObservacoes(tempObservacoes, obsSections.cobrador)
      : buildCombinedObservacoes(obsSections.motorista, tempObservacoes);
    onSave({ nome: tempNome, cracha: tempCracha, observacoes: combined, numeroCarro: item.numeroCarro || '' });
    onClose();
  };



  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-11/12 max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="relative">
          <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-r from-yellow-400/30 via-amber-500/25 to-yellow-300/30 blur-md" />
          <div className="relative rounded-xl border border-gray-200 dark:border-yellow-400/20 bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 shadow-2xl">
            <div className="px-6 py-4 border-b bg-gray-50 text-gray-900 border-gray-200 dark:bg-transparent dark:text-gray-100 dark:border-yellow-400/20">
              <div className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-green-800 dark:text-yellow-400" />
                <h3 className="text-lg font-semibold text-green-800 dark:text-yellow-400">Opções do {isMotorista ? 'Motorista' : 'Cobrador'}</h3>
              </div>
              <div className="mt-2 space-y-1 text-sm">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2 text-gray-900 font-semibold dark:text-gray-400" />
                  <p className="text-gray-900 font-semibold dark:text-gray-400">Original: <span className="font-semibold text-gray-900 dark:text-gray-200">{nomeOriginal || 'Não informado'}</span></p>
                </div>
                <div className="flex items-center">
                  <Activity className="h-4 w-4 mr-2 text-blue-800 dark:text-blue-400" />
                  <p className="text-gray-900 font-semibold dark:text-gray-400">Crachá: <span className="font-semibold text-gray-900 dark:text-gray-200">{crachaOriginal || 'Não informado'}</span></p>
                </div>
              </div>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <div className="flex items-center mb-1">
                  <Activity className="h-4 w-4 mr-2 text-green-800 dark:text-yellow-400" />
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Crachá do Substituto</label>
                </div>
                <input
                  className="block w-full px-3 py-2 border border-gray-600 dark:border-neutral-700 bg-white dark:bg-neutral-800/60 rounded-md shadow-sm focus:outline-none focus:ring-green-700 dark:focus:ring-yellow-500 focus:border-yellow-600 sm:text-sm text-gray-900 dark:text-gray-100"
                  value={tempCracha}
                  onChange={(e) => setTempCracha(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Digite o crachá"
                />
              </div>

              <div>
                <div className="flex items-center mb-1">
                  <AlertCircle className="h-4 w-4 mr-2 text-green-800 dark:text-yellow-400" />
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Observações</label>
                </div>
                <textarea
                  className="block w-full px-3 py-2 border border-gray-600 dark:border-neutral-700 bg-white dark:bg-neutral-800/60 rounded-md shadow-sm focus:outline-none focus:ring-green-700 dark:focus:ring-yellow-500 focus:border-yellow-600 sm:text-sm text-gray-900 dark:text-gray-100"
                  value={tempObservacoes}
                  onChange={(e) => setTempObservacoes(e.target.value)}
                  rows={2}
                  placeholder="Adicione uma observação se necessário"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t   border-gray-200 dark:border-yellow-400/20 flex justify-end gap-3">
              <button onClick={onClose} className="px-4 py-2 bg-white text-gray-700 border border-gray-300 dark:bg-neutral-800 dark:text-gray-300 dark:border-neutral-600 text-sm font-medium rounded-md w-auto shadow-sm hover:bg-gray-50 dark:hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-neutral-900 focus:ring-gray-500 transition-all duration-200">
                <X className="h-4 w-4 mr-2 inline" />
                Cancelar
              </button>
              <button onClick={handleSave} className="px-5 py-2 bg-gradient-to-r from-green-700 to-green-600 dark:from-yellow-500 dark:to-yellow-400 text-white dark:text-gray-900 text-sm font-bold rounded-md w-auto shadow-md hover:from-green-800 hover:to-green-700 dark:hover:from-yellow-600 dark:hover:to-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-neutral-900 focus:ring-green-700 dark:focus:ring-yellow-500 transition-all duration-200 transform hover:scale-[1.02]">
                <Save className="h-4 w-4 mr-2 inline" />
                Salvar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
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

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-vehicle-title"
    >
      <div className="relative w-11/12 max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="relative">
          <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-r from-yellow-400/30 via-amber-500/25 to-yellow-300/30 blur-md" />
          <div className="relative rounded-xl border border-gray-200 dark:border-yellow-400/20 bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 shadow-2xl">
            <div className="px-6 py-4 border-b bg-gray-50 text-gray-900 border-gray-200 dark:bg-transparent dark:text-gray-100 dark:border-yellow-400/20">
              <div className="flex items-center">
                <Bus className="h-5 w-5 mr-2 text-green-800 dark:text-yellow-400" />
                <h3 id="confirm-vehicle-title" className="text-lg font-semibold text-green-800 dark:text-yellow-400">Confirmar Propagação de Veículo</h3>
              </div>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="flex items-center">
                <Bus className="h-4 w-4 mr-2 text-blue-800 dark:text-blue-400" />
                <p className="text-sm text-gray-300">
                  Aplicar o veículo <span className="font-semibold text-gray-900 dark:text-gray-100">{vehicleNumber}</span> a esta viagem e propagar para as próximas?
                </p>
              </div>

              <div className="border border-gray-600 dark:border-neutral-700 bg-white dark:bg-neutral-800/60 rounded-md p-3">
                <div className="flex items-center mb-2">
                  <AlertCircle className="h-4 w-4 mr-2 text-orange-800 dark:text-orange-400" />
                  <p className="text-xs text-gray-900 font-semibold dark:text-gray-400">A alteração será aplicada em viagens com:</p>
                </div>
                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-transparent text-blue-800 border border-blue-600 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-600/20 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-600/20">
                    <Activity className="h-3 w-3" />
                    Serviço: <b className="text-blue-900 dark:text-blue-200">{service}</b>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-transparent text-indigo-800 border border-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-600/20 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-600/20">
                    <Users className="h-3 w-3" />
                    Crachá: <b className="text-indigo-900 dark:text-indigo-200">{driverBadge}</b>
                  </span>
                </div>
                <div className="flex items-center mt-3">
                  <Calendar className="h-4 w-4 mr-2 text-green-800 dark:text-yellow-400" />
                  <p className="text-xs text-gray-900 font-semibold dark:text-gray-400">
                    <span className="font-bold text-green-800 dark:text-yellow-400">{affectedCount}</span> viagem(ns) subsequente(s) será(ão) afetada(s).
                  </p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t bg-gray-50 border-gray-200 dark:border-yellow-400/20 flex justify-end gap-3">
              <button
                onClick={onCancel}
                className="px-4 py-2 bg-gray-100 text-gray-900 dark:bg-neutral-700 dark:text-gray-200 text-sm font-medium rounded-md w-auto shadow-sm hover:bg-gray-200 dark:hover:bg-neutral-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-neutral-900 focus:ring-gray-500 transition-colors"
              >
                <X className="h-4 w-4 mr-2 inline" />
                Cancelar
              </button>
              <button
                onClick={onConfirm}
                className="px-5 py-2 bg-green-700 dark:bg-yellow-500 text-neutral-900 text-sm font-bold rounded-md w-auto shadow-sm hover:bg-green-800 dark:hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-neutral-900 focus:ring-green-700 dark:focus:ring-yellow-500 transition-colors"
              >
                <Save className="h-4 w-4 mr-2 inline" />
                Confirmar e Propagar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
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

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-11/12 max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="relative">
          <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-r from-yellow-400/30 via-amber-500/25 to-yellow-300/30 blur-md" />
          <div className="relative rounded-xl border border-gray-200 dark:border-yellow-400/20 bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 shadow-2xl">
            <div className="px-6 py-4 border-b bg-gray-50 text-gray-900 border-gray-200 dark:bg-transparent dark:text-gray-100 dark:border-yellow-400/20">
              <div className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-green-800 dark:text-yellow-400" />
                <h3 className="text-lg font-semibold text-green-800 dark:text-yellow-400">Confirmar Propagação de {personType === 'motorista' ? 'Motorista' : 'Cobrador'}</h3>
              </div>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2 text-green-800 dark:text-green-400" />
                <p className="text-sm text-gray-300">
                  Aplicar a substituição para <span className="font-semibold text-gray-900 dark:text-gray-100">{newData.nome} (crachá: {newData.cracha})</span> nesta viagem e propagar para as próximas?
                </p>
              </div>

              <div className="border border-gray-600 dark:border-neutral-700 bg-white dark:bg-neutral-800/60 rounded-md p-3">
                <div className="flex items-center mb-2">
                  <AlertCircle className="h-4 w-4 mr-2 text-orange-800 dark:text-orange-400" />
                  <p className="text-xs text-gray-900 font-semibold dark:text-gray-400">A alteração será aplicada em viagens com o mesmo serviço e motorista original:</p>
                </div>
                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-transparent text-blue-800 border border-blue-600 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-600/20 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-600/20">
                    <Activity className="h-3 w-3" />
                    Serviço: <b className="text-blue-900 dark:text-blue-200">{service}</b>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-transparent text-indigo-800 border border-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-600/20 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-600/20">
                    <Users className="h-3 w-3" />
                    Motorista Original: <b className="text-indigo-900 dark:text-indigo-200">{originalDriverBadge}</b>
                  </span>
                </div>
                <div className="flex items-center mt-3">
                  <Calendar className="h-4 w-4 mr-2 text-green-800 dark:text-yellow-400" />
                  <p className="text-xs text-gray-900 font-semibold dark:text-gray-400">
                    <span className="font-bold text-green-800 dark:text-yellow-400">{affectedCount}</span> viagem(ns) subsequente(s) será(ão) afetada(s).
                  </p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t bg-gray-50 border-gray-200 dark:border-yellow-400/20 flex justify-end gap-3">
              <button
                onClick={onCancel}
                className="px-4 py-2 bg-gray-100 text-gray-900 dark:bg-neutral-700 dark:text-gray-200 text-sm font-medium rounded-md w-auto shadow-sm hover:bg-gray-200 dark:hover:bg-neutral-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-neutral-900 focus:ring-gray-500 transition-colors"
              >
                <X className="h-4 w-4 mr-2 inline" />
                Cancelar
              </button>
              <button
                onClick={onConfirm}
                className="px-5 py-2 bg-green-700 dark:bg-yellow-500 text-neutral-900 text-sm font-bold rounded-md w-auto shadow-sm hover:bg-green-800 dark:hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-neutral-900 focus:ring-green-700 dark:focus:ring-yellow-500 transition-colors"
              >
                <Save className="h-4 w-4 mr-2 inline" />
                Confirmar e Propagar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

interface HorariosModalProps {
  item: ControleHorarioItem;
  onClose: () => void;
  onSave: (data: {
    hor_saida_ajustada?: string;
    hor_chegada_ajustada?: string;
    atraso_motivo?: string;
    atraso_observacao?: string;
  }) => void;
}

const toHHMM = (value?: string | Date | null): string => {
  if (!value) return '';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false });
};

const HorariosModal: React.FC<HorariosModalProps> = ({ item, onClose, onSave }) => {
  const [saidaAjustada, setSaidaAjustada] = useState(toHHMM((item as any).hor_saida_ajustada));
  const [chegadaAjustada, setChegadaAjustada] = useState(toHHMM((item as any).hor_chegada_ajustada));
  const [motivoAtraso, setMotivoAtraso] = useState((item as any).atraso_motivo || '');
  const [observacaoAtraso, setObservacaoAtraso] = useState((item as any).atraso_observacao || '');

  const handleSave = () => {
    if (!item.numeroCarro || item.numeroCarro.trim() === '') {
      toast.error('É necessário informar o número do veículo antes de confirmar a viagem.');
      return;
    }
    onSave({
      hor_saida_ajustada: saidaAjustada,
      hor_chegada_ajustada: chegadaAjustada,
      atraso_motivo: motivoAtraso,
      atraso_observacao: observacaoAtraso,
    });
    onClose();
  };

  const formatTimeForDisplay = (timeString?: string): string => {
    if (!timeString) return 'N/A';
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return 'Inválido';
    }
  };


  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-11/12 max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="relative">
          <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-r from-cyan-400/30 via-blue-500/25 to-cyan-300/30 blur-md" />
          <div className="relative rounded-xl border border-cyan-600/30 dark:border-cyan-400/20 bg-neutral-900 text-gray-900 dark:text-gray-100 shadow-2xl">
            <div className="px-6 py-4 border-b border-cyan-600/30 dark:border-cyan-400/20">
              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-cyan-800 dark:text-cyan-400" />
                <h3 className="text-lg font-semibold text-cyan-800 dark:text-cyan-400">Ajustar Horários e Confirmar Viagem</h3>
              </div>
              <div className="mt-2 space-y-1 text-sm">
                <p className="text-gray-900 font-semibold dark:text-gray-400">Linha: <span className="font-semibold text-gray-900 dark:text-gray-200">{(item as any).codigoLinha} - {(item as any).nomeLinha}</span></p>
                <p className="text-gray-900 font-semibold dark:text-gray-400">Serviço: <span className="font-semibold text-gray-900 dark:text-gray-200">{(item as any).cod_servico_numero}</span></p>
              </div>
            </div>
            <div className="px-6 py-5 space-y-4">
              {/* Horários Previstos */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300">Saída Prevista</label>
                  <p className="font-mono text-lg text-green-300">{formatTimeForDisplay((item as any).hor_saida)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300">Chegada Prevista</label>
                  <p className="font-mono text-lg text-red-300">{formatTimeForDisplay((item as any).hor_chegada)}</p>
                </div>
              </div>

              {/* Horários Ajustados */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="saida-ajustada" className="block text-sm font-medium text-gray-300">Saída Ajustada</label>
                  <input
                    id="saida-ajustada"
                    type="time"
                    value={saidaAjustada}
                    onChange={(e) => setSaidaAjustada(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-600 dark:border-neutral-700 bg-white dark:bg-neutral-800/60 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label htmlFor="chegada-ajustada" className="block text-sm font-medium text-gray-300">Chegada Ajustada</label>
                  <input
                    id="chegada-ajustada"
                    type="time"
                    value={chegadaAjustada}
                    onChange={(e) => setChegadaAjustada(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-600 dark:border-neutral-700 bg-white dark:bg-neutral-800/60 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>

              {/* Motivo do Atraso */}
              <div>
                <label htmlFor="motivo-atraso" className="block text-sm font-medium text-gray-300">Motivo do Atraso (Opcional)</label>
                <select
                  id="motivo-atraso"
                  value={motivoAtraso}
                  onChange={(e) => setMotivoAtraso(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-600 dark:border-neutral-700 bg-white dark:bg-neutral-800/60 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm text-gray-900 dark:text-gray-100"
                >
                  <option value="">Selecione um motivo</option>
                  <option value="ENGARRAFAMENTO">Engarrafamento</option>
                  <option value="ACIDENTE">Acidente</option>
                  <option value="QUEBRA_OU_DEFEITO">Quebra ou Defeito</option>
                  <option value="DIVERSOS">Diversos</option>
                </select>
              </div>

              {/* Observação */}
              <div>
                <label htmlFor="observacao-atraso" className="block text-sm font-medium text-gray-300">Observação (Opcional)</label>
                <textarea
                  id="observacao-atraso"
                  value={observacaoAtraso}
                  onChange={(e) => setObservacaoAtraso(e.target.value)}
                  rows={2}
                  className="block w-full px-3 py-2 border border-gray-600 dark:border-neutral-700 bg-white dark:bg-neutral-800/60 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm text-gray-900 dark:text-gray-100"
                  placeholder="Detalhes sobre o atraso, se houver."
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-cyan-600/30 dark:border-cyan-400/20 flex justify-end gap-3">
              <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-900 dark:bg-neutral-700 dark:text-gray-200 text-sm font-medium rounded-md w-auto shadow-sm hover:bg-gray-200 dark:hover:bg-neutral-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-neutral-900 focus:ring-gray-500 transition-colors">
                <X className="h-4 w-4 mr-2 inline" />
                Cancelar
              </button>
              <button onClick={handleSave} className="px-5 py-2 bg-cyan-500 text-neutral-900 text-sm font-bold rounded-md w-auto shadow-sm hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-neutral-900 focus:ring-cyan-500 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
                disabled={!item.numeroCarro || item.numeroCarro.trim() === ''}
                title={!item.numeroCarro || item.numeroCarro.trim() === '' ? 'Informe o número do veículo primeiro' : 'Confirmar viagem'}
              >
                <Save className="h-4 w-4 mr-2 inline" />
                Confirmar Viagem
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

interface DataTableProps {
  controleHorarios: ControleHorarioItem[];
  controleHorariosOriginais: ControleHorarioItem[];
  onInputChange: (id: string, field: keyof ControleHorarioItem, value: any) => void;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  statusDados: StatusControleHorariosData;
  estatisticas: EstatisticasControleHorariosDto;
  temAlteracoesPendentes: boolean;
  contarAlteracoesPendentes: () => number;
  onApplyScaleFilter: (filter: { servico: string; cracha: string; tipo: 'motorista' | 'cobrador' }) => void;
  scaleFilterActive: boolean;
  scaleFilterLabel: string | null;
  onClearScaleFilter: () => void;
  canSave: boolean;
  // Notifica o container quando o modal de horários abre/fecha
  onHorariosModalOpenChange?: (open: boolean) => void;
  // Quando ativo, não ocultar viagens confirmadas após 30s (visão: Editados por mim)
  editedByMeActive?: boolean;
  // Notificações: badge + abrir painel
  notificationsUnreadCount?: number;
  onOpenNotifications?: () => void;
  onCommitChanges?: (id: string, updates: Partial<ControleHorarioItem>) => void;
}



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
  onHorariosModalOpenChange,
  editedByMeActive = false,
  notificationsUnreadCount = 0,
  onOpenNotifications,
  onCommitChanges,
}) => {
  const [showDriverOptionsModal, setShowDriverOptionsModal] = useState<ControleHorarioItem | null>(null);
  const [showCobradorOptionsModal, setShowCobradorOptionsModal] = useState<ControleHorarioItem | null>(null);
  const [vehicleInputModalItem, setVehicleInputModalItem] = useState<ControleHorarioItem | null>(null);
  const [horariosModalItem, setHorariosModalItem] = useState<ControleHorarioItem | null>(null);

  // Informe o container para ocultar mensagens globais enquanto o modal de horários está aberto
  useEffect(() => {
    if (typeof onHorariosModalOpenChange === 'function') {
      onHorariosModalOpenChange(Boolean(horariosModalItem));
    }
  }, [horariosModalItem, onHorariosModalOpenChange]);
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

  const handleOpenPersonOptions = (item: ControleHorarioItem, type: 'motorista' | 'cobrador') => {
    if (type === 'motorista') setShowDriverOptionsModal(item);
    else setShowCobradorOptionsModal(item);
  };

  const visibleItems = controleHorarios;

  // Quando a visão "Editados por mim" está ativa, garantir que nenhuma linha fique escondida
  useEffect(() => {
    if (editedByMeActive) {
      setHiddenRows(new Set());
    }
  }, [editedByMeActive]);

  useEffect(() => {
    const timers = new Map<string, ReturnType<typeof setTimeout>>();

    controleHorarios.forEach((item) => {
      // New logic: Hide 30 seconds after 'de_acordo' is true
      if (!editedByMeActive && (item as any).de_acordo && !hiddenRows.has(item.id)) {
        const timerId = setTimeout(() => {
          setHiddenRows(prev => new Set(prev).add(item.id));
        }, 25000); // 30 seconds
        timers.set(item.id, timerId);
      }
    });

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [controleHorarios, hiddenRows, editedByMeActive]);

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

  const handleHorariosModalSave = useCallback(async (
    item: ControleHorarioItem,
    data: {
      hor_saida_ajustada?: string;
      hor_chegada_ajustada?: string;
      atraso_motivo?: string;
      atraso_observacao?: string;
    }
  ) => {
    // The validation is already in the modal, but we double-check here.
    if (!item.numeroCarro || item.numeroCarro.trim() === '') {
      toast.error('Veículo não informado.');
      return;
    }

    // Helper to convert HH:mm string to ISO string for a given date
    const toISOString = (time: string, date: Date, compareBase?: Date): string | undefined => {
      if (!/^\d{2}:\d{2}$/.test(time)) return undefined;
      const [hours, minutes] = time.split(':').map(Number);
      const newDate = new Date(date);
      newDate.setHours(hours, minutes, 0, 0);
      if (compareBase && newDate.getTime() < compareBase.getTime()) {
        newDate.setDate(newDate.getDate() + 1);
      }
      return newDate.toISOString();
    };

    const baseDate = new Date((item as any).hor_saida || Date.now());

    let saidaISO: string | undefined;
    let chegadaISO: string | undefined;
    if (data.hor_saida_ajustada) {
      saidaISO = toISOString(data.hor_saida_ajustada, baseDate);
      onInputChange(item.id, 'hor_saida_ajustada' as keyof ControleHorarioItem, saidaISO);
    }
    if (data.hor_chegada_ajustada) {
      const saidaBase = saidaISO ? new Date(saidaISO) : baseDate;
      chegadaISO = toISOString(data.hor_chegada_ajustada, baseDate, saidaBase);
      onInputChange(item.id, 'hor_chegada_ajustada' as keyof ControleHorarioItem, chegadaISO);
    }
    onInputChange(item.id, 'atraso_motivo' as keyof ControleHorarioItem, data.atraso_motivo as any);
    onInputChange(item.id, 'atraso_observacao' as keyof ControleHorarioItem, data.atraso_observacao as any);
    onInputChange(item.id, 'de_acordo' as keyof ControleHorarioItem, true); // Confirm the trip

    // Persistência imediata (optimistic): salva este item no backend
    try {
      const allowedMotivos = ['ENGARRAFAMENTO', 'ACIDENTE', 'QUEBRA_OU_DEFEITO', 'DIVERSOS'];
      const updates: any = { id: item.id, de_acordo: true };
      if (saidaISO) updates.hor_saida_ajustada = saidaISO;
      if (chegadaISO) updates.hor_chegada_ajustada = chegadaISO;
      const motivo = (data.atraso_motivo || '').toString().trim().toUpperCase();
      if (motivo && allowedMotivos.includes(motivo)) {
        updates.atraso_motivo = motivo;
      }
      const obs = (data.atraso_observacao || '').toString().trim();
      if (obs) {
        updates.atraso_observacao = obs;
      }
      // Ajustes e confirmação não usam propagação; atualizar somente este registro
      const { id, ...ajustes } = updates;
      await controleHorariosService.atualizarControleHorario(id, ajustes);

      // Commit local changes to clear "pending" state
      if (onCommitChanges) {
        onCommitChanges(item.id, {
          de_acordo: true,
          hor_saida_ajustada: updates.hor_saida_ajustada,
          hor_chegada_ajustada: updates.hor_chegada_ajustada,
          atraso_motivo: updates.atraso_motivo,
          atraso_observacao: updates.atraso_observacao,
        });
      }

      toast.success('Informações confirmadas e salvas.');
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao salvar alterações');
    }
  }, [onInputChange, onCommitChanges]);

  const formatTime = (timeString?: string): string => {
    if (!timeString) return 'N/A';
    return timeString.substring(0, 5);
  };

  // Normaliza a chegada atravessando meia-noite para exibição (usa campos ISO quando disponíveis)
  const formatHoraChegada = (item: any): string => {
    try {
      const saidaISO: string | undefined = item.hor_saida_ajustada || item.hor_saida;
      const chegadaISO: string | undefined = item.hor_chegada_ajustada || item.hor_chegada;
      // Se não houver ISO, recorre ao campo HH:mm atual
      if (!saidaISO || !chegadaISO) return formatTime(item.horaChegada);
      const dSaida = new Date(saidaISO);
      const dChegada = new Date(chegadaISO);
      if (isNaN(dSaida.getTime()) || isNaN(dChegada.getTime())) return formatTime(item.horaChegada);
      // Se a chegada for "antes" da saída, considera +1 dia (virada)
      if (dChegada.getTime() < dSaida.getTime()) {
        dChegada.setDate(dChegada.getDate() + 1);
      }
      return dChegada.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
      return formatTime(item.horaChegada);
    }
  };

  // Editor de horários: estado para abrir/fechar por linha
  const [openHorarioEditorId, setOpenHorarioEditorId] = useState<string | null>(null);

  const toHHMM = (value?: string | Date | null): string => {
    if (!value) return '';
    const d = typeof value === 'string' ? new Date(value) : value;
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false });
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

  const sortedVisibleItems = useMemo(() => {
    const MIDNIGHT_CUTOFF_MINUTES = 4 * 60; // 04:00

    const toMinutesLocal = (val?: unknown): number | null => {
      if (!val) return null;
      // Date instance or ISO string
      if (val instanceof Date || typeof val === 'string') {
        const dt = new Date(val as any);
        if (isNaN(dt.getTime())) return null;
        return dt.getHours() * 60 + dt.getMinutes();
      }
      // HH:mm string (fallback)
      if (typeof val === 'string') {
        const s = val.trim();
        if (/^\d{2}:\d{2}/.test(s)) {
          const [h, m] = s.slice(0, 5).split(':').map((n) => Number(n));
          if (Number.isFinite(h) && Number.isFinite(m)) return h * 60 + m;
        }
      }
      return null;
    };

    const pureMinutes = (item: any): number => {
      // Partida efetiva: ajustada > original > HH:mm (sem deslocamento, ordem cronológica real)
      const m = toMinutesLocal(item.hor_saida_ajustada) ?? toMinutesLocal(item.hor_saida) ?? toMinutesLocal(item.horaSaida);
      if (m == null) return Number.MAX_SAFE_INTEGER;
      return m;
    };

    const operationalKey = (item: any): number => {
      const m = pureMinutes(item);
      return m < MIDNIGHT_CUTOFF_MINUTES ? m + 24 * 60 : m;
    };

    const groupKey = (item: any): string => {
      const service = String(item.cod_servico_numero || item.codServicoNumero || '').trim();
      const driver = String(item.crachaMotoristaEditado || item.crachaMotoristaGlobus || item.cracha_motorista || '').trim();
      const line = String(item.codigoLinha || item.codigo_linha || '').trim();
      return `${service}|${driver}|${line}`;
    };

    // Pré-computa informações por grupo (serviço+motorista+linha)
    const groups = new Map<string, { anchorOpKey: number }>();
    for (const it of visibleItems as any[]) {
      const gk = groupKey(it);
      if (!groups.has(gk)) {
        groups.set(gk, { anchorOpKey: operationalKey(it) });
      } else {
        const cur = groups.get(gk)!;
        const opk = operationalKey(it);
        if (opk < cur.anchorOpKey) cur.anchorOpKey = opk;
      }
    }

    const items = [...visibleItems].sort((a, b) => {
      const ga = groupKey(a as any);
      const gb = groupKey(b as any);
      const anchorA = groups.get(ga)?.anchorOpKey ?? operationalKey(a as any);
      const anchorB = groups.get(gb)?.anchorOpKey ?? operationalKey(b as any);
      if (anchorA !== anchorB) return sortOrder === 'asc' ? anchorA - anchorB : anchorB - anchorA;
      // Dentro do mesmo bloco, ordenar cronologicamente (00:00 → 23:59)
      const pa = pureMinutes(a as any);
      const pb = pureMinutes(b as any);
      if (pa !== pb) return sortOrder === 'asc' ? pa - pb : pb - pa;
      // Desempate estável
      const sa = `${ga}|${(a as any).hor_saida || ''}`;
      const sb = `${gb}|${(b as any).hor_saida || ''}`;
      return sa.localeCompare(sb);
    });

    return items;
  }, [visibleItems, sortOrder]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="flex items-center space-y-2">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mr-3" />
          <div className="flex flex-col">
            <Clock className="h-4 w-4 text-blue-800 dark:text-blue-400 mb-1" />
            <p className="text-gray-900 font-semibold font-medium">Carregando controle de horários...</p>
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
          <Clock className="h-12 w-12 text-gray-900 font-semibold dark:text-gray-400" />
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 text-gray-900 font-semibold" />
            <h3 className="text-lg font-medium text-gray-900">Nenhuma viagem encontrada</h3>
          </div>
          {!statusDados.existeNoBanco && (
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-gray-900 font-semibold dark:text-gray-400" />
              <p className="text-sm text-gray-900 font-semibold">Verifique se existem dados do Globus para esta data.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const descTipoDia = controleHorarios.length > 0 ? (controleHorarios[0] as any).desc_tipodia : '';

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        {descTipoDia && (
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-yellow-500" />
              <span className="px-3 py-1 text-xs font-semibold text-black bg-yellow-400 rounded-full border border-yellow-300/30">
                ESCALA TIPO DIA: {descTipoDia}
              </span>
              {/* Badge de notificações ao lado da etiqueta */}

            </div>
          </div>
        )}

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3 pb-20">
          {sortedVisibleItems.map((item) => {
            if (hiddenRows.has(item.id)) return null;

            const saidaISO = (item as any).hor_saida || (item as any).horaSaida;
            const saidaDate = saidaISO ? new Date(saidaISO) : null;
            const passou = !!(saidaDate && saidaDate.getTime() < Date.now());
            const temVeiculo = !!(item.numeroCarro && String(item.numeroCarro).trim() !== '');
            const trocouMotorista = !!(item.nomeMotoristaEditado || item.crachaMotoristaEditado);
            const trocouCobrador = !!(item.nomeCobradorEditado || item.crachaCobradorEditado);
            const isConfirmed = (item as any).de_acordo === true;

            // Card styling based on status
            let cardStyle = "bg-white dark:bg-gray-800 border-l-4 border-gray-600 dark:border-gray-700";
            if (isConfirmed) {
              cardStyle = "bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500";
            } else if (passou && !temVeiculo) {
              cardStyle = "bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500";
            } else if (passou && (trocouMotorista || trocouCobrador)) {
              cardStyle = "bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400";
            }

            return (
              <div key={item.id} className={`rounded-lg shadow-sm p-3 ${cardStyle} mb-3`}>
                {/* Header: Linha and Serviço */}
                <div className="flex justify-between items-start mb-2 border-b border-gray-100 dark:border-gray-700 pb-2">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{(item as any).codigoLinha}</span>
                      <span className="text-xs text-gray-900 font-semibold dark:text-gray-900 font-semibold dark:text-gray-400 max-w-[150px] truncate">{(item as any).nomeLinha}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-900 font-semibold dark:text-gray-300">
                        Serviço {(item as any).cod_servico_numero}
                      </span>
                      <span className="text-xs text-gray-900 font-semibold">{(item as any).sentido_texto}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    {(item as any).periodo_do_dia && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold mb-1 ${(item as any).periodo_do_dia === 'MADRUGADA' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300' :
                        (item as any).periodo_do_dia === 'MANHÃ' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-black dark:text-yellow-300' :
                          (item as any).periodo_do_dia === 'TARDE' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' :
                            'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                        }`}>
                        {(item as any).periodo_do_dia}
                      </span>
                    )}
                  </div>
                </div>

                {/* Time and Route */}
                <div className="grid grid-cols-2 gap-2 mb-3" onClick={() => setHorariosModalItem(item)}>
                  <div className="flex flex-col p-2 rounded bg-gray-50 dark:bg-gray-700/30">
                    <span className="text-xs text-gray-900 font-semibold dark:text-gray-900 font-semibold dark:text-gray-400 mb-1">Saída</span>
                    <div className="flex items-center gap-1">
                      <Play className="h-3 w-3 text-green-500" />
                      <span className="font-mono font-bold text-green-900 dark:text-gray-100">{formatTime((item as any).horaSaida)}</span>
                    </div>
                    <span className="text-[10px] text-green-900 font-semibold dark:text-gray-400 truncate mt-1">{(item as any).localOrigemViagem}</span>
                  </div>
                  <div className="flex flex-col p-2 rounded bg-gray-50 dark:bg-gray-700/30">
                    <span className="text-xs text-gray-900 font-semibold dark:text-gray-900 font-semibold dark:text-gray-400 mb-1">Chegada</span>
                    <div className="flex items-center gap-1">
                      <Square className="h-3 w-3 text-red-500" />
                      <span className="font-mono font-bold text-green-900 dark:text-gray-100">{formatHoraChegada(item)}</span>
                    </div>
                    <span className="text-[10px] text-green-900 font-semibold dark:text-gray-400 truncate mt-1">{(item as any).localDestinoLinha}</span>
                  </div>
                </div>

                {/* Vehicle Input */}
                <div className="mb-3">
                  <label className="text-xs font-bold text-gray-900 font-semibold dark:text-gray-900 font-semibold dark:text-gray-400 mb-1 block">Veículo</label>
                  <div className="flex items-center gap-2">
                    <Bus className="h-4 w-4 text-yellow-500" />
                    <input
                      type="text"
                      value={vehicleDrafts[item.id] ?? ((item as any).numeroCarro || '')}
                      onChange={(e) => {
                        try {
                          const role = JSON.parse(localStorage.getItem('user') || 'null')?.role;
                          if (role !== 'despachante' && role !== 'administrador') return;
                        } catch (_) { return; }
                        const onlyDigits = (e.target.value || '').replace(/[^0-9]/g, '').slice(0, 7);
                        setVehicleDrafts(prev => ({ ...prev, [item.id]: onlyDigits }));
                      }}
                      onBlur={(e) => {
                        try {
                          const role = JSON.parse(localStorage.getItem('user') || 'null')?.role;
                          if (role !== 'despachante' && role !== 'administrador') return;
                        } catch (_) { return; }
                        const val = (e.target.value || '').trim();
                        if (!val) return;
                        if (val.length < 6) { e.target.focus(); return; }
                        if (/^\d{6,7}$/.test(val)) { setPendingVehicle({ open: true, vehicle: val, anchorId: item.id }); return; }
                      }}
                      placeholder="Nº Veículo"
                      className={`flex-1 px-3 py-2 border rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-700 dark:focus:ring-yellow-500 transition-colors text-gray-900 dark:text-gray-100 ${((item as any).hor_saida && new Date((item as any).hor_saida) < new Date() && !(item as any).numeroCarro) ? 'border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20' : 'border-gray-600 dark:border-gray-600 bg-white dark:bg-gray-700'}`}
                    />
                  </div>
                </div>

                {/* Crew (Motorista/Cobrador) */}
                <div className="grid grid-cols-1 gap-2">
                  {/* Motorista */}
                  <div className="flex items-center justify-between p-2 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50" onClick={() => handleOpenPersonOptions(item, 'motorista')}>
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Users className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-xs text-gray-900 font-semibold dark:text-gray-900 font-semibold dark:text-gray-400">Motorista</span>
                        <span className={`text-sm font-medium text-gray-900 dark:text-gray-200 truncate ${!!(item as any).nomeMotoristaEditado ? 'line-through text-gray-500 dark:text-gray-500' : ''}`}>
                          {(item as any).nomeMotoristaGlobus || 'Não informado'}
                        </span>
                        {!!(item as any).nomeMotoristaEditado && (
                          <span className="text-xs font-bold text-yellow-600 dark:text-yellow-400 mt-0.5">
                            Substituto: {(item as any).nomeMotoristaEditado} ({(item as any).crachaMotoristaEditado})
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-900 font-semibold dark:text-gray-400" />
                  </div>

                  {/* Cobrador */}
                  <div className="flex items-center justify-between p-2 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50" onClick={() => handleOpenPersonOptions(item, 'cobrador')}>
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Users className="h-4 w-4 text-cyan-500 flex-shrink-0" />
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-xs text-gray-900 font-semibold dark:text-gray-900 font-semibold dark:text-gray-400">Cobrador</span>
                        <span className={`text-sm font-medium text-gray-900 dark:text-gray-200 truncate ${!!(item as any).nomeCobradorEditado ? 'line-through text-gray-500 dark:text-gray-500' : ''}`}>
                          {(item as any).nomeCobradorGlobus || 'Não informado'}
                        </span>
                        {!!(item as any).nomeCobradorEditado && (
                          <span className="text-xs font-bold text-yellow-600 dark:text-yellow-400 mt-0.5">
                            Substituto: {(item as any).nomeCobradorEditado} ({(item as any).crachaCobradorEditado})
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-900 font-semibold dark:text-gray-400" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block">
          <table className="min-w-full divide-y divide-gray-800 text-gray-200">
            <thead className="bg-gray-100 dark:bg-gray-800/60">
              <tr>
                <th className="w-10 px-1 sm:px-3 py-3 text-left"><span className="sr-only">Expandir</span></th>
                <th
                  className="px-1 sm:px-2 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  <div className="flex items-center ">
                    {sortOrder === 'asc' ? '▲' : '▼'}
                    Horários
                  </div>
                </th>
                <th className="px-1 sm:px-2 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  <div className="flex items-center">
                    <Activity className="h-4 w-4 mr-1 text-purple-400" />
                    Linha / Serviço
                  </div>
                </th>

                <th className="px-1 sm:px-2 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider hidden xl:table-cell">
                  <div className="flex items-center">
                    <Bus className="h-4 w-4 mr-1 text-green-800 dark:text-yellow-400" />
                    Veículo
                  </div>
                </th>

                <th className="px-1 sm:px-2 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1 text-blue-800 dark:text-blue-400" />
                    Motorista
                  </div>
                </th>
                <th className="px-1 sm:px-2 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1 text-cyan-800 dark:text-cyan-400" />
                    Cobrador
                  </div>
                </th>

                <th className="px-1 sm:px-2 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider xl:hidden">
                  <div className="flex items-center">
                    <Navigation className="h-4 w-4 mr-1 text-green-800 dark:text-green-400" />
                    Origem / Destino
                  </div>
                </th>
                <th className="px-1 sm:px-2 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider xl:hidden">
                  <div className="flex items-center">
                    <Activity className="h-4 w-4 mr-1 text-orange-800 dark:text-orange-400" />
                    Atividade / Setor
                  </div>
                </th>

                <th className="px-1 sm:px-2 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider hidden xl:table-cell">
                  <div className="flex items-center">
                    <Navigation className="h-4 w-4 mr-1 text-green-800 dark:text-green-400" />
                    Origem
                  </div>
                </th>
                <th className="px-1 sm:px-2 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider hidden xl:table-cell">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1 text-red-400" />
                    Destino
                  </div>
                </th>
                <th className="px-1 sm:px-2 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider hidden xl:table-cell">
                  <div className="flex items-center">
                    <Activity className="h-4 w-4 mr-1 text-orange-800 dark:text-orange-400" />
                    Ativ. / Tipo / Setor
                  </div>
                </th>
              </tr>
            </thead>

            <tbody className="bg-transparent divide-y divide-gray-200 dark:divide-gray-800">
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
                const isConfirmed = (item as any).de_acordo === true;
                const rowClass = isConfirmed
                  ? 'border-l-4 border-green-500 bg-green-900/20' // Confirmed is always green
                  : (passou && !temVeiculo)
                    ? 'border-l-4 border-red-500 bg-red-900/30'
                    : (passou && (trocouMotorista || trocouCobrador))
                      ? 'border-l-4 border-yellow-400 bg-yellow-900/25'
                      : '';
                const draft = vehicleDrafts[item.id] ?? ((item as any).numeroCarro || '');
                return (
                  <tr key={item.id} className={`transition-colors hover:bg-gray-100 dark:hover:bg-gray-800/40 ${rowClass}`}>
                    <td className="px-0 py-0" />
                    <td className="px-2 py-4 text-sm text-gray-900 dark:text-gray-200 cursor-pointer" onClick={() => setHorariosModalItem(item)}>
                      <div className="flex flex-col space-y-2">
                        {/* Horário de Saída */}
                        <div className="flex items-center">
                          <Play className="h-4 w-4 mr-2 text-green-800 dark:text-green-400" />
                          <span className="font-mono font-semibold text-green-800 dark:text-green-300">{formatTime((item as any).horaSaida)}</span>
                        </div>

                        {/* Período do Dia - Badge */}
                        {(item as any).periodo_do_dia && (
                          <div className="flex items-center justify-center">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${(item as any).periodo_do_dia === 'MADRUGADA' ? 'bg-indigo-900/40 text-indigo-300 border border-indigo-600/30' :
                              (item as any).periodo_do_dia === 'MANHÃ' ? 'bg-yellow-900/40 text-black dark:text-yellow-300 border border-yellow-600/30' :
                                (item as any).periodo_do_dia === 'TARDE' ? 'bg-orange-900/40 text-orange-300 border border-orange-500/30' :
                                  'bg-blue-900/40 text-blue-300 border border-blue-600/30'
                              }`}>
                              {(item as any).periodo_do_dia}
                            </span>
                          </div>
                        )}

                        {/* Duração/Até - Centralizado */}
                        <div className="flex items-center justify-center">
                          <span className="text-xs text-green-900 font-bold dark:text-blue-300">até</span>
                        </div>

                        {/* Horário de Chegada (normaliza virada de dia) */}
                        <div className="flex items-center">
                          <Square className="h-4 w-4 mr-2 text-red-400" />
                          <span className="font-mono font-semibold text-red-800 dark:text-red-300">{formatHoraChegada(item)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-4">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center">
                          <Activity className="h-4 w-4 mr-2 text-purple-400" />
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-200">{(item as any).codigoLinha}</div>
                        </div>
                        <div className="text-xs text-gray-900 font-semibold dark:text-gray-100 ml-2" title={(item as any).nomeLinha}>{(item as any).nomeLinha}</div>
                        <div className="flex items-center mt-1">
                          <Activity className="h-4 w-4 mr-2 text-blue-800 dark:text-blue-400" />
                          <div className="text-base font-semibold text-blue-800 dark:text-blue-400">Serviço {(item as any).cod_servico_numero || ''}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-2 py-4 hidden xl:table-cell">
                      <div className="flex items-center">
                        <Bus className="h-4 w-4 mr-2 text-green-800 dark:text-yellow-400" />
                        <input
                          type="text"
                          value={vehicleDrafts[item.id] ?? ((item as any).numeroCarro || '')}
                          onChange={(e) => {
                            try {
                              const role = JSON.parse(localStorage.getItem('user') || 'null')?.role;
                              if (role !== 'despachante' && role !== 'administrador') return;
                            } catch (_) { return; }
                            const onlyDigits = (e.target.value || '').replace(/[^0-9]/g, '').slice(0, 7);
                            setVehicleDrafts(prev => ({ ...prev, [item.id]: onlyDigits }));
                          }}
                          onBlur={(e) => {
                            try {
                              const role = JSON.parse(localStorage.getItem('user') || 'null')?.role;
                              if (role !== 'despachante' && role !== 'administrador') return;
                            } catch (_) { return; }
                            const val = (e.target.value || '').trim();
                            if (!val) return;
                            if (val.length < 6) { e.target.focus(); return; }
                            if (/^\d{6,7}$/.test(val)) { setPendingVehicle({ open: true, vehicle: val, anchorId: item.id }); return; }
                          }}
                          placeholder="Nº Veículo"
                          className={`w-24 px-2 py-1 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-700 dark:focus:ring-yellow-500 focus:border-transparent transition-colors text-gray-900 dark:text-gray-100 ${((item as any).hor_saida && new Date((item as any).hor_saida) < new Date() && !(item as any).numeroCarro) ? 'border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20' : 'border-gray-600  dark:border-neutral-700 bg-white  dark:bg-neutral-800/60'}`}
                        />
                      </div>
                    </td>

                    <td className="px-2 py-4">
                      <div className="cursor-pointer" onClick={() => handleOpenPersonOptions(item, 'motorista')}>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2 text-blue-800 dark:text-blue-400" />
                          <button
                            type="button"
                            className={`text-sm font-bold text-blue-800 dark:text-blue-400 leading-tight hover:underline ${(((item as any).nomeMotoristaEditado && (item as any).nomeMotoristaEditado.trim() !== '') || ((item as any).crachaMotoristaEditado && String((item as any).crachaMotoristaEditado).trim() !== '')) ? 'line-through opacity-60' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              const servico = (item as any).cod_servico_numero || '';
                              const cracha = (item as any).crachaMotoristaGlobus || '';
                              if (onApplyScaleFilter && servico && cracha) onApplyScaleFilter({ servico, cracha, tipo: 'motorista' });
                            }}
                            title="Ver escala do motorista original"
                          >
                            {(item as any).crachaMotoristaGlobus || 'N/A'}
                          </button>
                        </div>
                        <div className="flex items-center mt-1 ml-6 xl:hidden cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 rounded px-1 -ml-1 transition-colors" onClick={(e) => { e.stopPropagation(); setVehicleInputModalItem(item); }}>
                          {item.numeroCarro ? (
                            <>
                              <Bus className="h-3 w-3 mr-1 text-orange-800 dark:text-orange-400" />
                              <span className="text-xs font-semibold text-orange-800 dark:text-orange-400">{item.numeroCarro}</span>
                            </>
                          ) : (
                            <>
                              <Bus className="h-3 w-3 mr-1 text-gray-900 font-semibold" />
                              <span className="text-xs font-semibold text-gray-900 font-semibold">Veículo: <span className="text-blue-600 dark:text-blue-400 font-normal ml-1">Informar</span></span>
                            </>
                          )}
                        </div>
                        <div className="mt-0.5 leading-tight ml-6">
                          <div className="flex items-center">
                            <Activity className="h-3 w-3 mr-1 text-gray-900 font-semibold dark:text-gray-400" />
                            <div className={`text-[11px] text-green-800 dark:text-green-400 ${(((item as any).nomeMotoristaEditado && (item as any).nomeMotoristaEditado.trim() !== '') || ((item as any).crachaMotoristaEditado && String((item as any).crachaMotoristaEditado).trim() !== '')) ? 'line-through opacity-60' : ''}`}>Original: {(item as any).nomeMotoristaGlobus || 'N/I'}</div>
                          </div>
                          {(
                            ((item as any).nomeMotoristaEditado && (item as any).nomeMotoristaEditado.trim() !== '') ||
                            ((item as any).crachaMotoristaEditado && String((item as any).crachaMotoristaEditado).trim() !== '')
                          ) && (
                              <div className="flex items-center mt-0.5">
                                <Users className="h-3 w-3 mr-1 text-yellow-600 dark:text-yellow-400" />
                                <div className="text-xs font-bold text-yellow-600 dark:text-yellow-400">
                                  Substituto: {(item as any).nomeMotoristaEditado && (item as any).nomeMotoristaEditado.trim() !== '' ? (item as any).nomeMotoristaEditado : '—'}
                                  {((item as any).crachaMotoristaEditado && String((item as any).crachaMotoristaEditado).trim() !== '') ? ` (${(item as any).crachaMotoristaEditado})` : ''}
                                </div>
                              </div>
                            )}
                        </div>
                        <button
                          type="button"
                          className="mt-1 text-[11px] text-blue-500 hover:underline flex items-center ml-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            const servico = (item as any).cod_servico_numero || '';
                            const cracha = (item as any).crachaMotoristaGlobus || '';
                            if (onApplyScaleFilter && servico && cracha) onApplyScaleFilter({ servico, cracha, tipo: 'motorista' });
                          }}
                          title="Ver escala com o motorista original"
                        >
                          <ClipboardList className="h-3.5 w-3.5 mr-1" /> Ver escala
                        </button>
                      </div>
                    </td>
                    <td className="px-2 py-4">
                      <div className="cursor-pointer" onClick={() => handleOpenPersonOptions(item, 'cobrador')}>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2 text-cyan-800 dark:text-cyan-400" />
                          <button
                            type="button"
                            className={`text-sm font-bold text-blue-800 dark:text-blue-400 leading-tight hover:underline ${(((item as any).nomeCobradorEditado && (item as any).nomeCobradorEditado.trim() !== '') || ((item as any).crachaCobradorEditado && String((item as any).crachaCobradorEditado).trim() !== '')) ? 'line-through opacity-60' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              const servico = (item as any).cod_servico_numero || '';
                              const cracha = (item as any).crachaCobradorGlobus || '';
                              if (onApplyScaleFilter && servico && cracha) onApplyScaleFilter({ servico, cracha, tipo: 'cobrador' });
                            }}
                            title="Ver escala do cobrador original"
                          >
                            {(item as any).crachaCobradorGlobus || 'N/A'}
                          </button>
                        </div>

                        <div className="mt-0.5 leading-tight ml-6">
                          <div className="flex items-center">
                            <Activity className="h-3 w-3 mr-1 text-gray-900 font-semibold dark:text-gray-400" />
                            <div className={`text-[11px] text-gray-900 font-semibold dark:text-gray-200 ${(((item as any).nomeCobradorEditado && (item as any).nomeCobradorEditado.trim() !== '') || ((item as any).crachaCobradorEditado && String((item as any).crachaCobradorEditado).trim() !== '')) ? 'line-through opacity-60' : ''}`}>Original: {(item as any).nomeCobradorGlobus || 'N/I'}</div>
                          </div>
                          {(
                            ((item as any).nomeCobradorEditado && (item as any).nomeCobradorEditado.trim() !== '') ||
                            ((item as any).crachaCobradorEditado && String((item as any).crachaCobradorEditado).trim() !== '')
                          ) && (
                              <div className="flex items-center mt-0.5">
                                <Users className="h-3 w-3 mr-1 text-yellow-600 dark:text-yellow-400" />
                                <div className="text-xs font-bold text-yellow-600 dark:text-yellow-400">
                                  Substituto: {(item as any).nomeCobradorEditado && (item as any).nomeCobradorEditado.trim() !== '' ? (item as any).nomeCobradorEditado : '—'}
                                  {((item as any).crachaCobradorEditado && String((item as any).crachaCobradorEditado).trim() !== '') ? ` (${(item as any).crachaCobradorEditado})` : ''}
                                </div>
                              </div>
                            )}
                        </div>
                        {!!(item.crachaCobradorGlobus) && (
                          <button
                            type="button"
                            className="mt-1 text-[11px] text-blue-500 hover:underline flex items-center ml-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              const servico = (item as any).cod_servico_numero || '';
                              const cracha = (item as any).crachaCobradorGlobus || '';
                              if (onApplyScaleFilter && servico && cracha) onApplyScaleFilter({ servico, cracha, tipo: 'cobrador' });
                            }}
                            title="Ver escala com o cobrador original"
                          >
                            <ClipboardList className="h-3.5 w-3.5 mr-1" /> Ver escala
                          </button>
                        )}
                      </div>
                    </td>

                    <td className="px-2 py-4 text-sm text-gray-900 dark:text-gray-200 xl:hidden">
                      <div className="flex flex-col space-y-2">
                        {/* Origem */}
                        <div className="flex items-center">
                          <Navigation className="h-4 w-4 mr-2 text-green-800 dark:text-green-400" />
                          <span className="font-semibold text-green-800 dark:text-green-300">{(item as any).localOrigemViagem || 'N/A'}</span>
                        </div>

                        {/* Sentido - Centralizado */}
                        <div className="flex items-center justify-center">
                          <span className="text-xs text-green-900 font-bold dark:text-blue-300">{(item as any).sentido_texto || ''}</span>
                        </div>

                        {/* Destino */}
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-red-400" />
                          <span className="font-semibold text-red-800 dark:text-red-300">{(item as any).localDestinoLinha || 'N/A'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-4 text-sm text-gray-900 dark:text-gray-200 xl:hidden">
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center">
                          <Activity className="h-4 w-4 mr-2 text-orange-800 dark:text-orange-400" />
                          <div className="text-sm text-gray-700 dark:text-gray-300">{(item as any).nome_atividade || 'N/A'}</div>
                        </div>
                        <div className="flex items-center ml-6">
                          <div className="text-xs text-gray-900 font-semibold dark:text-gray-300">{(item as any).flg_tipo || ''}</div>
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-indigo-400" />
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-200 dark:bg-neutral-700 text-gray-900 dark:text-gray-200">
                            {(item as any).setorPrincipalLinha}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-2 py-4 text-sm text-gray-900 dark:text-gray-200 hidden xl:table-cell">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center">
                          <Navigation className="h-4 w-4 mr-2 text-green-800 dark:text-green-400" />
                          <span className="font-semibold text-green-800 dark:text-green-300">{(item as any).localOrigemViagem || 'N/A'}</span>
                        </div>
                        <div className="flex items-center ml-6">
                          <ArrowDown className="h-3 w-3 mr-1 text-blue-800 dark:text-blue-400" />
                          <div className="text-xs text-green-900 font-bold dark:text-blue-300">{(item as any).sentido_texto || ''}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-4 text-sm text-gray-900 dark:text-gray-200 hidden xl:table-cell">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-red-400" />
                        <span className="font-semibold text-red-800 dark:text-red-300">{(item as any).localDestinoLinha || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-2 py-4 text-sm text-gray-900 dark:text-gray-200 hidden xl:table-cell">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center">
                          <Activity className="h-4 w-4 mr-2 text-orange-800 dark:text-orange-400" />
                          <div className="text-sm text-gray-700 dark:text-gray-300">{(item as any).nome_atividade || 'N/A'}</div>
                        </div>
                        <div className="flex items-center ml-6">
                          <div className="text-xs text-gray-900 font-semibold dark:text-gray-300">{(item as any).flg_tipo || ''}</div>
                        </div>
                        <div className="flex items-center mt-1">
                          <MapPin className="h-4 w-4 mr-2 text-indigo-400" />
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-200 dark:bg-neutral-700 text-gray-900 dark:text-gray-200">
                            {(item as any).setorPrincipalLinha}
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Input de Veículo (Tablet/Mobile) */}
      <VehicleInputModal
        isOpen={!!vehicleInputModalItem}
        onClose={() => setVehicleInputModalItem(null)}
        initialValue={vehicleInputModalItem?.numeroCarro || ''}
        canEdit={true}
        onSave={(val) => {
          if (vehicleInputModalItem) {
            setPendingVehicle({ open: true, vehicle: val, anchorId: vehicleInputModalItem.id });
            setVehicleInputModalItem(null);
          }
        }}
      />

      {showDriverOptionsModal && (
        <PersonOptionsModal
          item={{
            ...showDriverOptionsModal,
            numeroCarro: vehicleDrafts[showDriverOptionsModal.id] ?? showDriverOptionsModal.numeroCarro
          }}
          personType="motorista"
          onClose={() => setShowDriverOptionsModal(null)}
          onApplyScaleFilter={onApplyScaleFilter}
          onSave={(data) => handlePersonModalSave(showDriverOptionsModal, 'motorista', data)}
        />
      )}
      {showCobradorOptionsModal && (
        <PersonOptionsModal
          item={{
            ...showCobradorOptionsModal,
            numeroCarro: vehicleDrafts[showCobradorOptionsModal.id] ?? showCobradorOptionsModal.numeroCarro
          }}
          personType="cobrador"
          onClose={() => setShowCobradorOptionsModal(null)}
          onApplyScaleFilter={onApplyScaleFilter}
          onSave={(data) => handlePersonModalSave(showCobradorOptionsModal, 'cobrador', data)}
        />
      )}

      {horariosModalItem && (
        <HorariosModal
          item={horariosModalItem}
          onClose={() => setHorariosModalItem(null)}
          onSave={(data) => handleHorariosModalSave(horariosModalItem, data)}
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
            onInputChange(id, 'observacoes', observacoes);
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


















