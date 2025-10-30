// src/types/user.types.ts
export enum UserRole {
  OPERADOR = 'OPERADOR',
  ADMIN = 'ADMIN',
  ANALISTA = 'ANALISTA',
  GERENTE = 'GERENTE',
  DIRETOR = 'DIRETOR',
  FUNCIONARIO = 'FUNCIONARIO',
  ADMINISTRADOR = 'ADMINISTRADOR',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
  BLOCKED = 'BLOCKED',
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
  // ✅ ADICIONADOS: Campos extras que vêm do backend
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
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  status?: UserStatus;
}

export interface LoginRequest {
  email: string;
  password?: string;
}

// ✅ CORRIGIDO: Interface que corresponde ao que o backend retorna
export interface LoginResponse {
  access_token: string;  // ✅ snake_case como o backend retorna
  refresh_token: string; // ✅ snake_case como o backend retorna
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