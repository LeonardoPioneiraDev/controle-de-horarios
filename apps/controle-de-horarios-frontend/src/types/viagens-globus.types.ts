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
  data_viagem?: string; // Adicionado
  setores?: string[]; // Adicionado
  codigo_linha?: string[];
  nome_linha?: string; // Adicionado
  sentido?: SentidoGlobus; // Atualizado para enum
  setor_principal_linha?: string;
  local_origem_viagem?: string; // Adicionado
  cod_servico_numero?: string; // Adicionado
  nome_motorista?: string;
  nome_cobrador?: string; // Adicionado
  limite?: number;
  pagina?: number;
  incluir_estatisticas?: boolean; // Adicionado
  salvar_local?: boolean; // Adicionado
}