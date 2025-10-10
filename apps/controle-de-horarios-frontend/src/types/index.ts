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