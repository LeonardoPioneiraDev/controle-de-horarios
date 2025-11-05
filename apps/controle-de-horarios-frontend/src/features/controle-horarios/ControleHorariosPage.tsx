import React, { useState } from 'react';
import { useControleHorarios } from './hooks/useControleHorarios';
import { FiltersPanel } from './components/FiltersPanel/FiltersPanel';
import { DataTable } from './components/DataTable/DataTable';
import { FloatingActionButton } from './components/FloatingActionButton/FloatingActionButton';

export const ControleHorariosPage: React.FC = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [isTableFullScreen, setIsTableFullScreen] = useState(false);
  const [showLinhaMultiSelect, setShowLinhaMultiSelect] = useState(false);

  const {
    dataReferencia,
    setDataReferencia,
    controleHorarios,
    controleHorariosOriginais,
    loading,
    error,
    filtros,
    setFiltros,
    opcoesFiltros,
    statusDados,
    handleInputChange,
    estatisticas,
    temAlteracoesPendentes,
    contarAlteracoesPendentes,
    salvarTodasAlteracoes,
    descartarAlteracoes,
    sincronizarControleHorarios,
    limparFiltros,
    aplicarFiltros,
    aplicarFiltroRapido,
    tipoLocal, setTipoLocal,
    statusEdicaoLocal, setStatusEdicaoLocal,
  } = useControleHorarios();

  return (
    <div className={`space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen`}>
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Controle de Horários</h1>
          <p className="mt-1 text-md text-gray-500">Gerencie e edite os horários das viagens importadas do Globus.</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`px-4 py-2 rounded-lg border flex items-center transition-all duration-300 ${
              showFilters ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Filtros
          </button>
          <button
            onClick={() => sincronizarControleHorarios()}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center transition-colors"
          >
            Sincronizar
          </button>
          <button
            onClick={() => setIsTableFullScreen((v) => !v)}
            className={`px-4 py-2 rounded-lg border flex items-center transition-all duration-300 ${
              isTableFullScreen ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {isTableFullScreen ? 'Sair da Tela Cheia' : 'Tela Cheia'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative" role="alert">
          {error}
        </div>
      )}

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center space-x-4">
            <label htmlFor="date-picker" className="text-sm font-medium text-gray-700">Data de Referência:</label>
            <input
              id="date-picker"
              type="date"
              value={dataReferencia}
              onChange={(e) => setDataReferencia(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {showFilters && (
        <FiltersPanel
          showFilters={showFilters}
          onClose={() => setShowFilters(false)}
          filtros={filtros}
          setFiltros={setFiltros}
          opcoesFiltros={opcoesFiltros}
          showLinhaMultiSelect={showLinhaMultiSelect}
          setShowLinhaMultiSelect={setShowLinhaMultiSelect}
          onLimparFiltros={limparFiltros}
          onAplicarFiltros={aplicarFiltros}
          onAplicarFiltroRapido={() => { /* deprecated */ }}
          // Novos filtros locais
          tipoLocal={tipoLocal}
          setTipoLocal={setTipoLocal}
          statusEdicaoLocal={statusEdicaoLocal}
          setStatusEdicaoLocal={setStatusEdicaoLocal}
        />
      )}

      {controleHorarios.length > 0 ? (
        <div className={`bg-white rounded-lg ${isTableFullScreen ? 'fixed inset-0 z-50 bg-white p-4 overflow-auto' : 'overflow-x-auto'}`}>
          <DataTable
            controleHorarios={controleHorarios}
            controleHorariosOriginais={controleHorariosOriginais}
            onInputChange={handleInputChange}
            loading={loading}
            error={error}
            onRetry={aplicarFiltros}
            statusDados={statusDados.data}
            estatisticas={estatisticas}
            temAlteracoesPendentes={temAlteracoesPendentes}
            contarAlteracoesPendentes={contarAlteracoesPendentes}
            onApplyScaleFilter={({ servico, cracha }) => {
              setFiltros((prev: any) => ({
                ...prev,
                cod_servico_numero: servico,
                cracha_funcionario: cracha,
                cracha_motorista: undefined,
                cracha_cobrador: undefined,
              }));
              setTimeout(() => aplicarFiltros(), 0);
            }}
            scaleFilterActive={Boolean((filtros as any).cod_servico_numero && (filtros as any).cracha_funcionario)}
            scaleFilterLabel={(filtros as any).cod_servico_numero && (filtros as any).cracha_funcionario ? `Serviço ${(filtros as any).cod_servico_numero} • Crachá ${(filtros as any).cracha_funcionario}` : undefined}
            onClearScaleFilter={() => {
              setFiltros((prev: any) => ({
                ...prev,
                cod_servico_numero: undefined,
                cracha_funcionario: undefined,
              }));
              setTimeout(() => aplicarFiltros(), 0);
            }}
          />
          <FloatingActionButton
            temAlteracoesPendentes={temAlteracoesPendentes}
            alteracoesPendentes={contarAlteracoesPendentes()}
            onDescartarAlteracoes={descartarAlteracoes}
            onSalvarAlteracoes={salvarTodasAlteracoes}
            saving={loading}
          />
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600">Nenhuma viagem encontrada</p>
        </div>
      )}

      {/* Paginação simples */}
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={() => {
            setFiltros((prev: any) => ({ ...prev, pagina: Math.max(1, (prev.pagina || 1) - 1) }));
            setTimeout(() => aplicarFiltros(), 0);
          }}
          className="px-3 py-1 border rounded disabled:opacity-50"
          disabled={!filtros.pagina || filtros.pagina <= 1}
        >
          Anterior
        </button>
        <div className="text-sm text-gray-600">Página {filtros.pagina || 1}</div>
        <button
          onClick={() => {
            setFiltros((prev: any) => ({ ...prev, pagina: (prev.pagina || 1) + 1 }));
            setTimeout(() => aplicarFiltros(), 0);
          }}
          className="px-3 py-1 border rounded"
        >
          Próxima
        </button>
      </div>
    </div>
  );
};

// named export already declared above
