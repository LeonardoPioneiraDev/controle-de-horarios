// src/modules/controle-horarios/dto/controle-horario-response.dto.ts

export interface ControleHorarioItemDto {
  // Campos do ControleHorario (dados do Globus + editáveis)
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
  informacaoRecolhe?: string;
  observacoes?: string;

  usuarioEdicao?: string;
  usuarioEmail?: string;
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
  filtrosAplicados: any;
  estatisticas: EstatisticasControleHorariosDto;
  executionTime: string;
  dataReferencia: string;
}