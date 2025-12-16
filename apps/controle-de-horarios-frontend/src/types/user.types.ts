// src/types/user.types.ts
export enum UserRole {
  OPERADOR = 'operador',
  ENCARREGADO = 'encarregado',
  ANALISTA = 'analista',
  GERENTE = 'gerente',
  DIRETOR = 'diretor',
  ADMINISTRADOR = 'administrador',
  // Novos perfis
  PCQC = 'pcqc',
  DACN = 'dacn',
  INSTRUTORES = 'instrutores',
  DESPACHANTE = 'despachante',
  OPERADOR_CCO = 'operador_cco',
  ESTATISTICA = 'estatistica',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  BLOCKED = 'blocked',
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  // Obs. ADICIONADOS: Campos extras que vêm do backend
  emailVerified?: boolean;
  tempPasswordExpires?: Date | null;
  passwordResetExpires?: Date | null;
  firstLogin?: boolean;
  loginAttempts?: number;
  lockedUntil?: Date | null;
}

export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  password?: string;
  role: UserRole;
}

export interface UpdateUserRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  status?: UserStatus;
}

export interface LoginRequest {
  email: string;
  password?: string;
}

// Obs. CORRIGIDO: Interface que corresponde ao que o backend retorna
export interface LoginResponse {
  access_token: string;  // Obs. snake_case como o backend retorna
  refresh_token: string; // Obs. snake_case como o backend retorna
  user: User;
}

export interface RegisterRequest {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  rolesDistribution: { role: string; count: number }[];
}

// Helpers de roles e permissões no frontend (espelham o backend)
export const UserRoleHierarchy: Record<UserRole, number> = {
  [UserRole.ADMINISTRADOR]: 6,
  [UserRole.DIRETOR]: 5,
  [UserRole.GERENTE]: 4,
  [UserRole.ANALISTA]: 3,
  [UserRole.ENCARREGADO]: 2,
  [UserRole.OPERADOR]: 1,
  // Aliases (mesmo nível)
  // [UserRole.ADMIN]: 6, // removido para evitar chave duplicada (mesmo valor string)
  [UserRole.PCQC]: 1,
  [UserRole.DACN]: 1,
  [UserRole.INSTRUTORES]: 1,
  [UserRole.DESPACHANTE]: 1,
  [UserRole.OPERADOR_CCO]: 1,
  [UserRole.ESTATISTICA]: 1,
};

export const isAtLeast = (role: UserRole | undefined, min: UserRole): boolean => {
  if (!role) return false;
  const current = UserRoleHierarchy[role];
  const required = UserRoleHierarchy[min];
  return (current ?? 0) >= (required ?? Number.MAX_SAFE_INTEGER);
};

// Permissões derivadas de negócio
export const canViewUsers = (role?: UserRole) => isAtLeast(role, UserRole.ADMINISTRADOR);
export const canViewControleHorarios = (role?: UserRole) => isAtLeast(role as UserRole, UserRole.OPERADOR);
export const canSyncControleHorarios = (role?: UserRole) => isAtLeast(role as UserRole, UserRole.ADMINISTRADOR);
export const canViewViagens = (role?: UserRole) => isAtLeast(role as UserRole, UserRole.ANALISTA);
export const canSyncViagens = (role?: UserRole) => isAtLeast(role as UserRole, UserRole.ADMINISTRADOR);
export const canEditControleHorarios = (role?: UserRole) => {
  return [UserRole.DESPACHANTE, UserRole.ADMINISTRADOR].includes(role as UserRole);
};


// BCO Alterações: apenas Estatística e Administrador
export const canViewBcoAlteracoes = (role?: UserRole) => (
  role === UserRole.ESTATISTICA || role === UserRole.ADMINISTRADOR
);
