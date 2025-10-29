export interface ViagemGlobusBaseDto {
  id: string;
  codigoLinha: string;
  nomeLinha: string;
  codDestinoLinha?: number;
  localDestinoLinha?: string;
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
  descTipoDia?: string;
  codOrigemViagem?: number;
  codAtividade?: number;
  nomeAtividade?: string;
  flgTipo?: string;
  crachaMotorista?: string;
  chapaFuncMotorista?: string;
  crachaCobrador?: string;
  chapaFuncCobrador?: string;
}

export interface DadosEditaveisDto {
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

export interface ControleHorarioItemDto {
  viagemGlobus: ViagemGlobusBaseDto;
  dadosEditaveis: DadosEditaveisDto;
}

export interface ControleHorarioResponseDto {
  success: boolean;
  message: string;
  data: ControleHorarioItemDto[];
  total: number;
  pagina: number;
  limite: number;
  temMaisPaginas: boolean;
  filtrosAplicados: any;
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

export interface OpcoesControleHorariosDto {
  setores: string[];
  linhas: { codigo: string; nome: string }[];
  servicos: string[];
  sentidos: string[];
  motoristas: string[];
}