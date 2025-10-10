export enum UserStatus {
  PENDING = 'pending',     // Aguardando verificação de e-mail
  ACTIVE = 'active',       // Usuário ativo
  INACTIVE = 'inactive',   // Usuário desativado
  BLOCKED = 'blocked'      // Usuário bloqueado
}

export const UserStatusLabels = {
  [UserStatus.PENDING]: 'Pendente',
  [UserStatus.ACTIVE]: 'Ativo',
  [UserStatus.INACTIVE]: 'Inativo',
  [UserStatus.BLOCKED]: 'Bloqueado'
};