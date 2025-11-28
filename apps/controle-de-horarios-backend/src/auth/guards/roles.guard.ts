// src/auth/guards/roles.guard.ts

import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole, hasRolePermission, isValidRole } from '../../common/enums/user-role.enum';

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
    // Normalize user role from token/request
    const normalizeRole = (value: unknown): UserRole | null => {
      const raw = (value ?? '').toString().trim().toLowerCase();
      if (!raw) return null;
      const alias: Record<string, UserRole> = {
        admin: UserRole.ADMINISTRADOR,
        administrador: UserRole.ADMINISTRADOR,
        estatistica: UserRole.ESTATISTICA,
        analista: UserRole.ANALISTA,
        gerente: UserRole.GERENTE,
        diretor: UserRole.DIRETOR,
        operador: UserRole.OPERADOR,
        encarregado: UserRole.ENCARREGADO,
        pcqc: UserRole.PCQC,
        dacn: UserRole.DACN,
        instrutores: UserRole.INSTRUTORES,
        despachante: UserRole.DESPACHANTE,
        'operador_cco': UserRole.OPERADOR_CCO,
        operadorcco: UserRole.OPERADOR_CCO,
      };
      if (alias[raw]) return alias[raw];
      return isValidRole(raw) ? (raw as UserRole) : null;
    };

    const normalizedRole = normalizeRole(user?.role) || normalizeRole((user as any)?.perfil);
    this.logger.log(`[ROLES_GUARD] User role raw: ${user?.role} | normalized=${normalizedRole}`);
    // CORRIGIDO: Usar hierarquia de roles
    const hasPermission = !!normalizedRole && requiredRoles.some((requiredRole) => {
      const permission = hasRolePermission(normalizedRole as UserRole, requiredRole);
      
      // âœ… LOG DETALHADO
      this.logger.log(`[ROLES_GUARD] Checking:  >= ${requiredRole} = ${permission}`);
      
      return permission;
    });
    
    // âœ… LOG FINAL
    this.logger.log(`[ROLES_GUARD] Final permission result: ${hasPermission}`);

    return hasPermission;
  }
}



