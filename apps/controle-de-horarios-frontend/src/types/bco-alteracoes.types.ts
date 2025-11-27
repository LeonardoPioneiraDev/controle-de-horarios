export type BcoStatusFiltro = 'alteradas' | 'pendentes';

export interface BcoResumo {
  dataReferencia: string; // YYYY-MM-DD
  totalDocumentos: number;
  totalAlteradas: number;
  totalPendentes: number;
  source: 'ORACLE_GLOBUS' | 'POSTGRESQL';
  novasAlteracoes?: number;
}

export interface BcoItem {
  idbco: number;
  documento: string;
  logAlteracao: string | null;
  dataBco: string; // YYYY-MM-DD
  dataDigitacao: string | null; // YYYY-MM-DD
  digitador: string | null;
  prefixoVeiculo: string | null;
}

export interface BcoListaResponse {
  items: BcoItem[];
  count: number;
  source: 'POSTGRESQL';
}

