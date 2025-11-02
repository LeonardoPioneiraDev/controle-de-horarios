// src/types/controle-horarios.types.ts

export interface ControleHorarioItemDto {
  id?: string;
  viagemGlobusId: string;
  dataReferencia: string;

  setorPrincipalLinha?: string;
  codLocalTerminalSec?: number;
  codigoLinha?: string;
  nomeLinha?: string;
  codDestinoLinha?: string;
  localDestinoLinha?: string;
  flgSentido?: string;
  descTipoDia?: string;
  horaSaida?: string;
  horaChegada?: string;
  codOrigemViagem?: string;
  localOrigemViagem?: string;
  codServicoNumero?: string;
  codAtividade?: number;
  nomeAtividade?: string;
  flgTipo?: string;
  codMotorista?: string;
  nomeMotoristaGlobus?: string;
  crachaMotoristaGlobus?: string;
  chapaFuncMotoristaGlobus?: string;
  codCobrador?: string;
  nomeCobradorGlobus?: string;
  crachaCobradorGlobus?: string;
  chapaFuncCobradorGlobus?: string;
  totalHorarios?: number;

  numeroCarro?: string;
  nomeMotoristaEditado?: string;
  crachaMotoristaEditado?: string;
  nomeCobradorEditado?: string;
  crachaCobradorEditado?: string;
  observacoes?: string;

  editorId?: string;
  editorNome?: string;
  editorEmail?: string;

  createdAt?: Date;
  updatedAt?: Date;
  isAtivo?: boolean;

  jaFoiEditado: boolean;
}

export interface EstatisticasControleHorariosDto {
  totalViagens: number;
  viagensEditadas: number;
  viagensNaoEditadas: number;
  percentualEditado: number;
  setoresUnicos: string[];
  linhasUnicas: string[];
  servicosUnicos: string[];
  ultimaAtualizacao?: Date;
}

export interface ControleHorarioResponseDto {
  success: boolean;
  message: string;
  data: ControleHorarioItemDto[];
  total: number;
  pagina: number;
  limite: number;
  temMaisPaginas: boolean;
  filtrosAplicados: FiltrosControleHorarios;
  estatisticas: EstatisticasControleHorariosDto;
  executionTime: string;
  dataReferencia: string;
}

export interface FiltrosControleHorarios {
  setorPrincipal?: string;
  codigoLinha?: string[];
  codServicoNumero?: string;
  sentidoTexto?: string;
  horarioInicio?: string;
  horarioFim?: string;
  codMotorista?: string;
  nomeMotorista?: string;
  localOrigem?: string;
  localDestino?: string;
  codAtividade?: number;
  editadoPorUsuario?: boolean;
  meusEditados?: boolean;
  crachaMotorista?: string;
  nomeCobrador?: string;
  crachaCobrador?: string;
  buscaTexto?: string;
  limite?: number;
  pagina?: number;
  ordenarPor?: string;
  ordem?: 'ASC' | 'DESC';
}

export interface OpcoesControleHorariosDto {
  setores: string[];
  linhas: { codigo: string; nome: string }[];
  servicos: string[];
  sentidos: string[];
  motoristas: { cracha: string; nome: string }[];
  locaisOrigem: string[];
  locaisDestino: string[];
}

export interface SalvarControleHorariosDto {
  viagemGlobusId: string;
  numeroCarro?: string;
  nomeMotoristaEditado?: string;
  crachaMotoristaEditado?: string;
  nomeCobradorEditado?: string;
  crachaCobradorEditado?: string;
  observacoes?: string;
  isAtivo?: boolean;
  editorId?: string;
  editorNome?: string;
  editorEmail?: string;
}

export interface SalvarMultiplosControleHorariosDto {
  dataReferencia: string;
  controles: SalvarControleHorariosDto[];
}

export interface SincronizarControleHorariosDto {
  overwrite: boolean;
}

export interface StatusControleHorariosDto {
  success: boolean;
  message: string;
  data: {
    existeViagensGlobus: boolean;
    totalViagensGlobus: number;
    viagensEditadas: number;
    percentualEditado: number;
    ultimaAtualizacao?: Date;
  };
  dataReferencia: string;
}
