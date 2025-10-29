export interface ViagemGlobusBase {
  id: string;
  codigoLinha: string;
  nomeLinha: string;
  codServicoNumero: string;
  sentidoTexto: string;
  horSaidaTime: string;
  horChegadaTime: string;
  nomeMotorista: string;
  setorPrincipal: string;
  localOrigemViagem: string;
  duracaoMinutos: number;
  periodoDoDia: string;
  flgSentido: string;
}

export interface DadosEditaveis {
  id?: string;
  numeroCarro?: string;
  informacaoRecolhe?: string;
  crachaFuncionario?: string;
  observacoes?: string;
  usuarioEdicao?: string;
  usuarioEmail?: string;
  updatedAt?: Date;
  jaFoiEditado: boolean;
}

export interface ControleHorarioItem {
  viagemGlobus: ViagemGlobusBase;
  dadosEditaveis: DadosEditaveis;
}

export interface FiltrosControleHorarios {
  setorPrincipal?: string;
  codigoLinha?: string[];
  codServicoNumero?: string;
  sentidoTexto?: string;
  horarioInicio?: string;
  horarioFim?: string;
  nomeMotorista?: string;
  localOrigem?: string;
  codAtividade?: string;
  localDestino?: string;
  crachaMotorista?: string;
  buscaTexto?: string;
  limite?: number;
  pagina?: number;
  editadoPorUsuario?: boolean;
}

export interface ControleHorarioResponse {
  success: boolean;
  message: string;
  data: ControleHorarioItem[];
  total: number;
  pagina: number;
  limite: number;
  temMaisPaginas: boolean;
  filtrosAplicados: FiltrosControleHorarios;
  estatisticas: {
    totalViagens: number;
    viagensEditadas: number;
    viagensNaoEditadas: number;
    percentualEditado: number;
    setoresUnicos: string[];
    linhasUnicas: string[];
    servicosUnicos: string[];
  };
  executionTime: string;
  dataReferencia: string;
}

export interface OpcoesControleHorarios {
  setores: string[];
  linhas: { codigo: string; nome: string }[];
  servicos: string[];
  sentidos: string[];
  motoristas: string[];
  locaisOrigem: string[];
  locaisDestino: string[];
}

export interface SalvarControleHorario {
  viagemGlobusId: string;
  numeroCarro?: string;
  informacaoRecolhe?: string;
  crachaFuncionario?: string;
  observacoes?: string;
}

export interface SalvarMultiplosControles {
  dataReferencia: string;
  controles: SalvarControleHorario[];
}

export interface EstatisticasControleHorarios {
  dataReferencia: string;
  totalViagens: number;
  viagensEditadas: number;
  viagensNaoEditadas: number;
  percentualEditado: number;
  ultimaAtualizacao: Date;
};