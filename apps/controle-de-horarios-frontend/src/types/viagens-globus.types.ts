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
  data_viagem?: string;
  setores?: string[];
  codigo_linha?: string[]; // Changed to string[]
  nome_linha?: string;
  sentido_texto?: string;
  setor_principal_linha?: string;
  local_origem_viagem?: string;
  cod_servico_numero?: string;
  nome_motorista?: string;
  nome_cobrador?: string;
  horarioInicio?: string;
  horarioFim?: string;
  limite?: number;
  pagina?: number;
  incluir_estatisticas?: boolean;
  salvar_local?: boolean;
  periodo_do_dia?: string;
}