import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    
    console.log(`🛡️ [JWT_GUARD] Verificando autenticação para: ${request.method} ${request.url}`);
    console.log(`🛡️ [JWT_GUARD] Authorization header: ${authHeader ? 'presente' : 'ausente'}`);
    
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    
    if (err || !user) {
      console.log(`❌ [JWT_GUARD] Falha na autenticação para: ${request.method} ${request.url}`);
      console.log(`❌ [JWT_GUARD] Erro: ${err?.message || 'Usuário não encontrado'}`);
      console.log(`❌ [JWT_GUARD] Info: ${info?.message || 'N/A'}`);
      throw err || new UnauthorizedException('Token inválido ou expirado');
    }

    console.log(`✅ [JWT_GUARD] Autenticação bem-sucedida para: ${user.email}`);
    return user;
  }
}