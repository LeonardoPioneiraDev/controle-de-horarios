// src/features/viagens/components/FiltersPanel/FiltersPanel.tsx
import React from 'react';
import { FiltrosViagem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

type FilterKey = keyof FiltrosViagem;

export interface ViagensFiltersPanelProps {
  filters: FiltrosViagem;
  services: number[];
  onFilterChange: (key: FilterKey, value: FiltrosViagem[FilterKey] | undefined) => void;
  onClearFilters: () => void;
  onApplyFilters?: () => void;
  onShowHistorico?: () => void;
}

export const FiltersPanel: React.FC<ViagensFiltersPanelProps> = ({
  filters,
  services,
  onFilterChange,
  onClearFilters,
  onApplyFilters,
  onShowHistorico,
}) => {
  const handleChange = (key: FilterKey, raw: unknown) => {
    let value: FiltrosViagem[FilterKey] | undefined;
    if (raw === '' || raw === null) {
      value = undefined as any;
    } else if (key === 'numeroServico') {
      const n = Number(raw);
      value = (Number.isFinite(n) ? (n as any) : undefined) as any;
    } else if (key === 'somenteAtrasados') {
      value = Boolean(raw) as any;
    } else {
      value = raw as any;
    }
    onFilterChange(key, value);
  };

  return (
    <div className="relative">
      <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-r from-yellow-400/30 via-amber-500/25 to-yellow-300/30 blur-md" />
      <Card className="relative border border-yellow-400/20 shadow-[0_0_40px_rgba(251,191,36,0.15)]">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <InputFilter
              id="nomeLinha"
              label="Nome da Linha"
              type="text"
              value={filters.nomeLinha}
              onChange={handleChange}
              placeholder="Buscar por nome..."
            />

            <SelectFilter
              id="numeroServico"
              label="Número do Serviço"
              value={filters.numeroServico}
              onChange={handleChange}
              options={services.map((s) => ({ value: s, label: String(s) }))}
              placeholder="Todos os serviços"
            />

            <SelectFilter
              id="sentido"
              label="Sentido"
              value={filters.sentido}
              onChange={handleChange}
              options={[
                { value: 'IDA', label: 'Ida' },
                { value: 'VOLTA', label: 'Volta' },
              ]}
              placeholder="Todos"
            />

            <SelectFilter
              id="statusCumprimento"
              label="Status"
              value={filters.statusCumprimento}
              onChange={handleChange}
              options={[
                { value: 'CUMPRIDA', label: 'Cumprida' },
                { value: 'NAO_CUMPRIDA', label: 'Não Cumprida' },
                { value: 'PARCIALMENTE_CUMPRIDA', label: 'Parcial' },
                { value: 'PENDENTE', label: 'Pendente' },
              ]}
              placeholder="Todos"
            />

             

            <InputFilter
              id="nomeMotorista"
              label="Nome do Motorista"
              type="text"
              value={filters.nomeMotorista}
              onChange={handleChange}
              placeholder="Buscar por nome..."
            />

            
             
          </div>

          <div className="mt-4 flex flex-wrap gap-2 justify-end">
            <Button variant="outline" onClick={onClearFilters}>
              Limpar Filtros
            </Button>
            <Button variant="default" onClick={onApplyFilters}>
              Aplicar
            </Button>
            <Button variant="outline" onClick={onShowHistorico}>
              Histórico
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

type InputFilterProps = {
  id: FilterKey;
  label: string;
  value: FiltrosViagem[FilterKey] | undefined;
  onChange: (key: FilterKey, value: FiltrosViagem[FilterKey] | undefined) => void;
  type?: string;
  placeholder?: string;
};

const InputFilter: React.FC<InputFilterProps> = ({ id, label, value, onChange, ...props }) => (
  <div>
    <Label htmlFor={String(id)}>{label}</Label>
    <Input
      id={String(id)}
      name={String(id)}
      value={(value as string | number | undefined) ?? ''}
      onChange={(e) => onChange(id, (e.target.value || undefined) as any)}
      {...props}
    />
  </div>
);

type SelectOption = { value: string | number; label: string };

type SelectFilterProps = {
  id: FilterKey;
  label: string;
  value: FiltrosViagem[FilterKey] | undefined;
  onChange: (key: FilterKey, value: FiltrosViagem[FilterKey] | undefined) => void;
  options: SelectOption[];
  placeholder?: string;
};

const SelectFilter: React.FC<SelectFilterProps> = ({ id, label, value, onChange, options, placeholder }) => (
  <div>
    <Label htmlFor={String(id)}>{label}</Label>
    <select
      id={String(id)}
      name={String(id)}
      value={(value as string | number | undefined) ?? ''}
      onChange={(e) => onChange(id, (e.target.value || undefined) as any)}
      className="w-full mt-1 flex h-10 rounded-md border border-yellow-400/20 bg-neutral-900 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <option value="">{placeholder || 'Todos'}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

export default FiltersPanel;

