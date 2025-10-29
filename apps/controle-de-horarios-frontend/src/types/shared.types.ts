export interface ResponsePaginada<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface StatusDados {
  data: string;
  existemDados: boolean;
  totalViagens?: number;
  ultimaSincronizacao?: string;
}

export interface CodigosLinha {
  data: string;
  linhas: string[];              // Códigos extraídos do NomeLinha
  total: number;
}

export interface ServicosUnicos {
  data: string;
  servicos: number[];            // Números únicos do campo Servico
  total: number;
}

export interface SincronizacaoResult {
  message: string;
  data: string;
  sincronizadas: number;
  novas: number;
  atualizadas: number;
  timestamp: string;
}

export interface TesteConexao {
  success: boolean;
  message: string;
  responseTime?: number;
  timestamp: string;
}

export interface EstatisticasAPI {
  baseUrl: string;
  timeout: string;
  retryAttempts: string;
  ultimaRequisicao: string;
  timestamp: string;
};