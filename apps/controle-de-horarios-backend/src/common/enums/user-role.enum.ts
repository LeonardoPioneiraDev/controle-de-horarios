export enum UserRole {
  ADMINISTRADOR = 'administrador',
  DIRETOR = 'diretor',
  GERENTE = 'gerente',
  ANALISTA = 'analista',
  OPERADOR = 'operador'
}

export const UserRoleLabels = {
  [UserRole.ADMINISTRADOR]: 'Administrador',
  [UserRole.DIRETOR]: 'Diretor',
  [UserRole.GERENTE]: 'Gerente',
  [UserRole.ANALISTA]: 'Analista',
  [UserRole.OPERADOR]: 'Operador'
};

export const UserRoleHierarchy = {
  [UserRole.ADMINISTRADOR]: 5,
  [UserRole.DIRETOR]: 4,
  [UserRole.GERENTE]: 3,
  [UserRole.ANALISTA]: 2,
  [UserRole.OPERADOR]: 1
};