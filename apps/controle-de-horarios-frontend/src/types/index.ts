// src/types/index.ts

// Enum para roles (compatível com backend)
export enum UserRole {
  ADMINISTRADOR = 'administrador',
  DIRETOR = 'diretor', 
  GERENTE = 'gerente',
  ANALISTA = 'analista',
  OPERADOR = 'operador',
  FUNCIONARIO = 'funcionario'
}

// Enum para status
export enum UserStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  INACTIVE = 'inactive',
  BLOCKED = 'blocked'
}

// Interface do usuário
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  firstLogin: boolean;
  lastLogin: string | null;
  loginAttempts: number;
  lockedUntil: string | null;
  createdAt: string;
  updatedAt: string;
  // Campos específicos do sistema
  tempPassword?: string;
  tempPasswordExpires?: string;
  passwordResetToken?: string;
  passwordResetExpires?: string;
}

// Request para criar usuário (SEM SENHA)
export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

// Request para atualizar usuário
export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  status?: UserStatus;
  emailVerified?: boolean;
}

// Interface de login
export interface LoginRequest {
  email: string;
  password: string;
}

// Response de login
export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

// Interface de registro
export interface RegisterRequest {
  email: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
  password?: string;
}

// Interface de autenticação
export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
}

// Estatísticas de usuários
export interface UserStats {
  total: number;
  byStatus: {
    active: number;
    pending: number;
    inactive: number;
  };
  byRole: Record<string, number>;
}

// Interface de configuração de e-mail
export interface EmailConfig {
  emailEnabled: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  hasPassword: boolean;
  passwordLength: number;
  fromAddress: string;
  fromName: string;
  frontendUrl: string;
  transporterConfigured: boolean;
  workingConfigName: string;
}

// Interface de teste de e-mail
export interface EmailTestRequest {
  email: string;
  name: string;
}

export interface EmailTestResponse {
  success: boolean;
  message: string;
  timestamp: string;
}

// ✅ NOVAS INTERFACES PARA COMPARAÇÃO DE VIAGENS

// Enum para status de comparação
export enum StatusComparacao {
  COMPATIVEL = 'compativel',
  DIVERGENTE = 'divergente',
  APENAS_TRANSDATA = 'apenas_transdata',
  APENAS_GLOBUS = 'apenas_globus',
  HORARIO_DIVERGENTE = 'horario_divergente'
}

// Interface para resultado da comparação
export interface ResultadoComparacao {
  totalComparacoes: number;
  compativeis: number;
  divergentes: number;
  apenasTransdata: number;
  apenasGlobus: number;
  horarioDivergente: number;
  percentualCompatibilidade: number;
  linhasAnalisadas: number;
  tempoProcessamento: string;
}

// Interface para comparação de viagem individual
export interface ComparacaoViagem {
  id: string;
  dataReferencia: string;
  codigoLinha: string;
  nomeLinhaTransdata?: string;
  nomeLinhaGlobus?: string;
  
  // Dados Transdata
  transdataId?: string;
  transdataServico?: string;
  transdataSentido?: string;
  transdataHorarioPrevisto?: string;
  transdataHorarioRealizado?: string;
  
  // Dados Globus
  globusId?: string;
  globusServico?: string;
  globusSentidoFlag?: string;
  globusSentidoTexto?: string;
  globusHorarioSaida?: string;
  globusSetor?: string;
  
  // Análise da comparação
  statusComparacao: StatusComparacao;
  sentidoCompativel: boolean;
  horarioCompativel: boolean;
  servicoCompativel: boolean;
  diferencaHorarioMinutos?: number;
  observacoes?: string;
  
  // Auditoria
  createdAt: string;
  updatedAt: string;
}

// Interface para filtros de comparação
export interface FiltrosComparacao {
  statusComparacao?: StatusComparacao;
  codigoLinha?: string;
  globusSetor?: string;
  sentidoCompativel?: boolean;
  horarioCompativel?: boolean;
  servicoCompativel?: boolean;
  limite: number;
}

// ✅ INTERFACES PARA VIAGENS TRANSDATA

export interface ViagemTransdata {
  id: number;
  hashDados: string;
  dataReferencia: string;
  isAtivo: boolean;
  codigoLinha: string;
  statusCumprimento: string;
  SentidoText: string;
  InicioPrevistoText: string;
  InicioRealizadoText: string;
  FimPrevistoText: string;
  FimRealizadoText: string;
  PrefixoPrevisto: string;
  PrefixoRealizado: string;
  NomePI: string;
  NomePF: string;
  Servico: number;
  Trajeto: string;
  NomeMotorista: string;
  MatriculaMotorista: string;
  NomeCobrador: string;
  MatriculaCobrador: string;
  ParadasLbl: string;
  Link1Text: string;
  HistoricoLbl: string;
  Link2Text: string;
  ParcialmenteCumprida: number;
  NaoCumprida: number;
  ForadoHorarioInicio: number;
  ForadoHorarioFim: number;
  AtrasadoInicio: number;
  AtrasadoFim: number;
  AdiantadoInicio: number;
  AdiantadoFim: number;
  NaoCumpridoInicio: number;
  NaoCumpridoFim: number;
  IdLinha: number;
  NomeLinha: string;
  InicioPrevisto: string;
  InicioRealizado: string;
  StatusInicio: number;
  FimPrevisto: string;
  FimRealizado: string;
  StatusFim: number;
  Sentido: boolean;
  Viagem: number;
  PontosCumpridosPercentual: string;
  PontoFinal: string;
  ValidouPontosCumpridos: number;
  KMProgramado: string;
  KMRodado: string;
  Consolidad: number;
  createdAt: string;
  updatedAt: string;
  ultimaSincronizacao: string;
}

// ✅ INTERFACES PARA VIAGENS GLOBUS

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
  hashDados: string;
  sentidoTexto: string;
  periodoDoDia: string;
  temCobrador: boolean;
  origemDados: string;
  createdAt: string;
  updatedAt: string;
}

// ✅ INTERFACES PARA FILTROS

export interface FiltrosViagem {
  sentido?: string;
  codigoLinha?: string;
  numeroServico?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface FiltrosViagemGlobus {
  setorPrincipal?: 'GAMA' | 'SANTA MARIA' | 'PARANOÁ' | 'SÃO SEBASTIÃO';
  codigoLinha?: string;
  sentidoTexto?: 'IDA' | 'VOLTA' | 'CIRCULAR';
  nomeMotorista?: string;
  limite: 50 | 100 | 200 | 500;
}

// ✅ INTERFACES PARA ESTATÍSTICAS

export interface EstatisticasTransdata {
  totalViagens: number;
  viagensCumpridas: number;
  viagensNaoCumpridas: number;
  viagensParcialmenteCumpridas: number;
  percentualCumprimento: number;
  linhasUnicas: number;
  servicosUnicos: number;
  ultimaSincronizacao: string;
}

export interface EstatisticasGlobus {
  totalViagens: number;
  setoresDisponiveis: string[];
  linhasDisponiveis: number;
  servicosUnicos: number;
  motoristasUnicos: number;
  ultimaSincronizacao: string;
}

// ✅ INTERFACES PARA RESPOSTAS DA API

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ✅ INTERFACES PARA HEALTH CHECK

export interface HealthCheck {
  status: 'HEALTHY' | 'UNHEALTHY';
  message: string;
  timestamp: string;
  services?: {
    postgresql?: {
      status: 'HEALTHY' | 'UNHEALTHY';
      message: string;
    };
    oracle?: {
      status: 'HEALTHY' | 'UNHEALTHY';
      message: string;
    };
    transdata?: {
      status: 'HEALTHY' | 'UNHEALTHY';
      message: string;
    };
  };
}