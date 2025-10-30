export interface ViagemGlobus {
  id: string;
  setorPrincipal: string;
  codLocalTerminalSec: number;
  codigoLinha: string;
  nomeLinha: string;
  flgSentido: string;
  dataViagem: string;
  horSaida: string;
  horChegada: string;
  horSaidaTime: string;
  horChegadaTime: string;
  codLocalidade: number;
  localOrigemViagem: string;
  codServicoCompleto: string;
  codServicoNumero: string;
  codMotorista: number;
  nomeMotorista: string;
  codCobrador: number;
  nomeCobrador: string;
  totalHorarios: number;
  duracaoMinutos: number;
  dataReferencia: string;
  sentidoTexto: string;
  periodoDoDia: string;
  temCobrador: boolean;
  origemDados: string;
  createdAt: string;
  updatedAt: string;
}

export interface StatusDadosGlobus {
  existeNoBanco: boolean;
  totalRegistros: number;
  ultimaAtualizacao: string | null;
  setoresDisponiveis: string[];
  linhasDisponiveis: number;
}

export interface SincronizacaoGlobus {
  sincronizadas: number;
  novas: number;
  atualizadas: number;
  erros: number;
}

export type SentidoGlobus = 'I' | 'V' | 'C';

export interface FiltrosViagemGlobus {
  dataViagem?: string; // Adicionado
  setores?: number[]; // Adicionado
  codigoLinha?: string;
  nomeLinha?: string; // Adicionado
  sentido?: SentidoGlobus; // Atualizado para enum
  setorPrincipal?: string;
  localOrigemViagem?: string; // Adicionado
  codServicoNumero?: string; // Adicionado
  nomeMotorista?: string;
  nomeCobrador?: string; // Adicionado
  limite?: number;
  page?: number;
  incluirEstatisticas?: boolean; // Adicionado
  salvarLocal?: boolean; // Adicionado
}