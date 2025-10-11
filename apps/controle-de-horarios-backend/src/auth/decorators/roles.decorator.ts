// src/auth/decorators/roles.decorator.ts

import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../common/enums/user-role.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => {
  console.log(`[ROLES_DECORATOR] Setting roles: ${JSON.stringify(roles)}`); // ✅ LOG TEMPORÁRIO
  return SetMetadata(ROLES_KEY, roles);
};