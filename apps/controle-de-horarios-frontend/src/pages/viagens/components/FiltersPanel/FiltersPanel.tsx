// src/features/viagens/components/FiltersPanel/FiltersPanel.tsx
import React from 'react';
import { FiltrosViagem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Filter } from 'lucide-react';

type FilterKey = keyof FiltrosViagem;

export interface ViagensFiltersPanelProps {
  filters: FiltrosViagem;
  services: number[];
  onFilterChange: (key: FilterKey, value: FiltrosViagem[FilterKey] | undefined) => void;
  onClearFilters: () => void;
}

export const FiltersPanel: React.FC<ViagensFiltersPanelProps> = ({
  filters,
  services,
  onFilterChange,
  onClearFilters,
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
    <Card className="border-none shadow-lg bg-white/60 dark:bg-gray-900/60 backdrop-blur-md animate-in slide-in-from-top-4 duration-300">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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

        <div className="mt-6 flex flex-wrap gap-3 justify-end">
          <Button variant="outline" onClick={onClearFilters} className="border-[#fbcc2c]/50 text-[#6b5d1a] dark:text-yellow-400 hover:bg-[#fbcc2c]/10">
            Limpar Filtros
          </Button>
        </div>
      </CardContent>
    </Card>
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
    <Label htmlFor={String(id)} className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</Label>
    <Input
      id={String(id)}
      name={String(id)}
      value={(value as string | number | undefined) ?? ''}
      onChange={(e) => onChange(id, (e.target.value || undefined) as any)}
      className="bg-white dark:bg-gray-800/50 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100"
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
    <Label htmlFor={String(id)} className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</Label>
    <select
      id={String(id)}
      name={String(id)}
      value={(value as string | number | undefined) ?? ''}
      onChange={(e) => onChange(id, (e.target.value || undefined) as any)}
      className="w-full flex h-10 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800/50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fbcc2c] dark:focus-visible:ring-yellow-400 disabled:cursor-not-allowed disabled:opacity-50 text-gray-900 dark:text-gray-100"
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
