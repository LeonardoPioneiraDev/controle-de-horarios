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
  codOrigemViagem?: number;
  localOrigemViagem: string;
  codDestinoLinha?: number;
  localDestinoLinha?: string;
  codServicoCompleto: string;
  codServicoNumero: string;
  codMotorista?: number;
  crachaMotoristaGlobus?: number;
  nomeMotorista: string;
  codCobrador?: number;
  crachaCobradorGlobus?: number;
  nomeCobrador: string;
  totalHorarios: number;
  duracaoMinutos: number;
  dataReferencia: string;
  descTipoDia?: string;
  sentidoTexto: string;
  periodoDoDia: string;
  temCobrador: boolean;
  origemDados: string;
  prefixoVeiculo?: string;
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
  dataViagem?: string;
  setores?: number[];
  setorPrincipal?: string;
  codigoLinha?: string;
  nomeLinha?: string;
  sentido?: 'I' | 'V' | 'C';
  localOrigemViagem?: string;
  codServicoNumero?: string;
  nomeMotorista?: string;
  nomeCobrador?: string;
  codDestinoLinha?: number;
  localDestinoLinha?: string;
  descTipoDia?: string;
  codAtividade?: number;
  nomeAtividade?: string;
  flgTipo?: string; // 'R' | 'S'
  codMotoristaGlobus?: number;
  chapaFuncMotorista?: string;
  codCobradorGlobus?: number;
  chapaFuncCobrador?: string;
  prefixoVeiculo?: string;
  apenasComCobrador?: boolean;
  horarioInicio?: string;
  horarioFim?: string;
  buscaTexto?: string;
  limite?: number;
  page?: number;
  incluirEstatisticas?: boolean;
  salvarLocal?: boolean;
  ordenarPor?: string;
  ordem?: 'ASC' | 'DESC';
}
