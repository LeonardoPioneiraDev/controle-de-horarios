// src/auth/guards/roles.guard.ts

import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole, hasRolePermission } from '../../common/enums/user-role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // âœ… Obter roles requeridos
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // âœ… LOG PARA DEBUG
    this.logger.log(`[ROLES_GUARD] Required roles: ${JSON.stringify(requiredRoles)}`);

    // âœ… Se nÃ£o hÃ¡ roles definidos, permitir acesso
    if (!requiredRoles || requiredRoles.length === 0) {
      this.logger.log(`[ROLES_GUARD] No roles required - allowing access`);
      return true;
    }

    // âœ… Obter usuÃ¡rio da requisiÃ§Ã£o
    const { user } = context.switchToHttp().getRequest();
    
    // âœ… LOG PARA DEBUG
    this.logger.log(`[ROLES_GUARD] User from request: ${JSON.stringify({
      id: user?.id,
      email: user?.email,
      role: user?.role
    })}`);
    
    if (!user) {
      this.logger.warn(`[ROLES_GUARD] No user found in request`);
      return false;
    }

    // âœ… LOG PARA DEBUG
    this.logger.log(`[ROLES_GUARD] User role:  | normalized=`);

    // âœ… CORRIGIDO: Usar hierarquia de roles
    const hasPermission = requiredRoles.some((requiredRole) => {
      const permission = hasRolePermission(((user?.role)||'').toString().toLowerCase() as UserRole, requiredRole);
      
      // âœ… LOG DETALHADO
      this.logger.log(`[ROLES_GUARD] Checking:  >= ${requiredRole} = ${permission}`);
      
      return permission;
    });
    
    // âœ… LOG FINAL
    this.logger.log(`[ROLES_GUARD] Final permission result: ${hasPermission}`);

    return hasPermission;
  }
}