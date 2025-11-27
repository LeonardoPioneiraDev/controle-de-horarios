// src/common/enums/user-role.enum.ts

export enum UserRole {
  ADMINISTRADOR = 'administrador',
  DIRETOR = 'diretor',
  GERENTE = 'gerente',
  ANALISTA = 'analista',
  OPERADOR = 'operador',
  ENCARREGADO = 'encarregado',
  PCQC = 'pcqc',
  DACN = 'dacn',
  INSTRUTORES = 'instrutores',
  DESPACHANTE = 'despachante',
  OPERADOR_CCO = 'operador_cco',
  ESTATISTICA = 'estatistica'
}

export const UserRoleLabels = {
  [UserRole.ADMINISTRADOR]: 'Administrador',
  [UserRole.DIRETOR]: 'Diretor',
  [UserRole.GERENTE]: 'Gerente',
  [UserRole.ANALISTA]: 'Analista',
  [UserRole.OPERADOR]: 'Operador',
  [UserRole.ENCARREGADO]: 'Encarregado',
  [UserRole.PCQC]: 'PCQC',
  [UserRole.DACN]: 'DACN',
  [UserRole.INSTRUTORES]: 'Instrutores',
  [UserRole.DESPACHANTE]: 'Despachante',
  [UserRole.OPERADOR_CCO]: 'Operador CCO',
  [UserRole.ESTATISTICA]: 'Estatística'
};

export const UserRoleHierarchy = {
  [UserRole.ADMINISTRADOR]: 5,
  [UserRole.DIRETOR]: 4,
  [UserRole.GERENTE]: 3,
  [UserRole.ANALISTA]: 2,
  [UserRole.OPERADOR]: 1,
  [UserRole.ENCARREGADO]: 1.5,
  // Novos perfis definidos inicialmente com nível de Operador (1)
  [UserRole.PCQC]: 1,
  [UserRole.DACN]: 1,
  [UserRole.INSTRUTORES]: 1,
  [UserRole.DESPACHANTE]: 1,
  [UserRole.OPERADOR_CCO]: 1,
  [UserRole.ESTATISTICA]: 1
};

/**
 * ✅ FUNÇÃO PARA VERIFICAR SE UM ROLE TEM PERMISSÃO SOBRE OUTRO
 */
export function hasRolePermission(userRole: UserRole, requiredRole: UserRole): boolean {
  return UserRoleHierarchy[userRole] >= UserRoleHierarchy[requiredRole];
}

/**
 * ✅ FUNÇÃO PARA VERIFICAR SE É UM ROLE VÁLIDO
 */
export function isValidRole(role: string): role is UserRole {
  return Object.values(UserRole).includes(role as UserRole);
}

/**
 * ✅ PERMISSÕES POR FUNCIONALIDADE
 */
export const RolePermissions = {
  // Viagens Transdata - OPERADOR pode ver tudo
  VIEW_VIAGENS: [UserRole.ADMINISTRADOR, UserRole.DIRETOR, UserRole.GERENTE, UserRole.ANALISTA, UserRole.OPERADOR],
  SYNC_VIAGENS: [UserRole.ADMINISTRADOR, UserRole.DIRETOR, UserRole.GERENTE, UserRole.ANALISTA],
  VIEW_VIAGENS_STATS: [UserRole.ADMINISTRADOR, UserRole.DIRETOR, UserRole.GERENTE],

  // Gestão de usuários
  CREATE_USERS: [UserRole.ADMINISTRADOR, UserRole.DIRETOR],
  VIEW_ALL_USERS: [UserRole.ADMINISTRADOR, UserRole.DIRETOR, UserRole.GERENTE],
  EDIT_USERS: [UserRole.ADMINISTRADOR, UserRole.DIRETOR],
  DELETE_USERS: [UserRole.ADMINISTRADOR],

  // Configurações do sistema
  MANAGE_EMAIL_CONFIG: [UserRole.ADMINISTRADOR, UserRole.DIRETOR],
  VIEW_SYSTEM_LOGS: [UserRole.ADMINISTRADOR, UserRole.DIRETOR, UserRole.GERENTE],
  MANAGE_SYSTEM_CONFIG: [UserRole.ADMINISTRADOR],

  // API Externa
  TEST_EXTERNAL_API: [UserRole.ADMINISTRADOR, UserRole.DIRETOR, UserRole.GERENTE],
  VIEW_API_STATS: [UserRole.ADMINISTRADOR, UserRole.DIRETOR, UserRole.GERENTE]
};

/**
 * ✅ FUNÇÃO PARA VERIFICAR PERMISSÃO ESPECÍFICA
 */
export function hasPermission(userRole: UserRole, permission: keyof typeof RolePermissions): boolean {
  return RolePermissions[permission].includes(userRole);
}
