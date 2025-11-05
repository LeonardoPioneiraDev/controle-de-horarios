export interface ResultadoComparacao {
  totalComparacoes: number;
  compativeis: number;
  divergentes: number;
  apenasTransdata: number;
  apenasGlobus: number;
  horarioDivergente: number;
  percentualCompatibilidade: number;
  linhasAnalisadas: number;
  tempoProcessamento: string;
}

export interface ComparacaoViagem {
  id: string;
  dataReferencia: string;
  codigoLinha: string;
  nomeLinhaTransdata?: string;
  nomeLinhaGlobus?: string;
  transdataId?: string;
  transdataServico?: string;
  transdataSentido?: string;
  transdataHorarioPrevisto?: string;
  transdataHorarioRealizado?: string;
  globusId?: string;
  globusServico?: string;
  globusSentidoFlag?: string;
  globusSentidoTexto?: string;
  globusHorarioSaida?: string;
  globusSetor?: string;
  statusComparacao: 'compativel' | 'divergente' | 'apenas_transdata' | 'apenas_globus' | 'horario_divergente';
  sentidoCompativel: boolean;
  horarioCompativel: boolean;
  servicoCompativel: boolean;
  diferencaHorarioMinutos?: number;
  observacoes?: string;
}

export interface FiltrosComparacao {
  statusComparacao?: string;
  codigoLinha?: string;
  globusSetor?: string;
  sentidoCompativel?: boolean;
  horarioCompativel?: boolean;
  servicoCompativel?: boolean;
  limit?: number;
  page?: number;
}

export interface HistoricoComparacaoResumo {
  id: string;
  dataReferencia: string;
  totalComparacoes: number;
  compativeis: number;
  divergentes: number;
  apenasTransdata: number;
  apenasGlobus: number;
  horarioDivergente: number;
  percentualCompatibilidade: string; // numeric do PG chega como string
  linhasAnalisadas: number;
  tempoProcessamento: string;
  durationMs: number;
  executedByEmail?: string | null;
  createdAt?: string;
}
