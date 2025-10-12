export interface ViagemGlobusBaseDto {
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