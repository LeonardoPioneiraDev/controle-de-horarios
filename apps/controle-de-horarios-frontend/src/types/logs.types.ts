// src/types/logs.types.ts
export enum LogAction {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  USER_CREATE = 'USER_CREATE',
  USER_UPDATE = 'USER_UPDATE',
  USER_DELETE = 'USER_DELETE',
  PERMISSION_CHANGE = 'PERMISSION_CHANGE',
  OTHER = 'OTHER',
}

export interface SystemLog {
  id: string;
  userId?: string | null;
  userEmail?: string | null;
  action: LogAction;
  resource?: string | null;
  details?: string | null;
  ip?: string | null;
  success: boolean;
  createdAt: Date;
}

export interface LogsFilter {
  q?: string; // user email/name search or free text
  action?: LogAction | 'ALL';
  success?: 'ALL' | 'SUCCESS' | 'FAIL';
  from?: string; // ISO date string
  to?: string;   // ISO date string
  userId?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedLogs {
  data: SystemLog[];
  page: number;
  pageSize: number;
  total: number;
}

