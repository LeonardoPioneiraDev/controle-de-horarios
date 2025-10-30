// src/features/controle-horarios/ControleHorariosPage.tsx
import React, { useState } from 'react';
import { useControleHorarios } from './hooks/useControleHorarios';
import {
  Header,
  StatusCards,
  FiltersPanel,
  DataTable,
  ObservacoesSection,
  FloatingActionButton
} from './components';

export const ControleHorariosPage: React.FC = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [showLinhaMultiSelect, setShowLinhaMultiSelect] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);

  const {
    // Estados
    dataReferencia,
    setDataReferencia,
    controleHorarios,
    controleHorariosOriginais,
    loading,
    error,
    saving,
    temAlteracoesPendentes,
    filtros,
    setFiltros,
    opcoesFiltros,
    estatisticas,
    statusDados,
    
    // Funções
    buscarControleHorarios,
    salvarTodasAlteracoes,
    descartarAlteracoes,
    handleInputChange,
    limparFiltros,
    contarFiltrosAtivos,
    contarAlteracoesPendentes,
    sincronizarControleHorarios,
  } = useControleHorarios();

  return (
    <div className="space-y-6">
      {/* Header */}
      <Header
        dataReferencia={dataReferencia}
        onDataChange={setDataReferencia}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        filtrosAtivos={contarFiltrosAtivos()}
        temAlteracoesPendentes={temAlteracoesPendentes}
        alteracoesPendentes={contarAlteracoesPendentes()}
        onDescartarAlteracoes={descartarAlteracoes}
        onSalvarAlteracoes={salvarTodasAlteracoes}
        saving={saving}
        sincronizando={sincronizando}
      />

      {/* Status Cards */}
      <div className="bg-white shadow rounded-lg p-6">
        <StatusCards
          statusDados={statusDados}
          estatisticas={estatisticas}
        />
      </div>

      {/* Filtros */}
      <FiltersPanel
        showFilters={showFilters}
        onClose={() => setShowFilters(false)}
        filtros={filtros}
        setFiltros={setFiltros}
        opcoesFiltros={opcoesFiltros}
        showLinhaMultiSelect={showLinhaMultiSelect}
        setShowLinhaMultiSelect={setShowLinhaMultiSelect}
        onLimparFiltros={limparFiltros}
        onAplicarFiltros={buscarControleHorarios}
      />

      {/* Tabela de Controle */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <DataTable
          controleHorarios={controleHorarios}
          controleHorariosOriginais={controleHorariosOriginais}
          onInputChange={handleInputChange}
          loading={loading}
          error={error}
          onRetry={buscarControleHorarios}
          statusDados={statusDados}
          estatisticas={estatisticas}
          temAlteracoesPendentes={temAlteracoesPendentes}
          contarAlteracoesPendentes={contarAlteracoesPendentes}
        />
      </div>

      {/* Observações Expandidas */}
      <ObservacoesSection
        controleHorarios={controleHorarios}
        controleHorariosOriginais={controleHorariosOriginais}
        onInputChange={handleInputChange}
      />

      {/* Botão Fixo de Salvar */}
      <FloatingActionButton
        temAlteracoesPendentes={temAlteracoesPendentes}
        alteracoesPendentes={contarAlteracoesPendentes()}
        onDescartarAlteracoes={descartarAlteracoes}
        onSalvarAlteracoes={salvarTodasAlteracoes}
        saving={saving}
      />
    </div>
  );
};