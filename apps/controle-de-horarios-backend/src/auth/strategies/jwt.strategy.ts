import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService, JwtPayload } from '../auth.service';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    console.log(`🔍 [JWT_STRATEGY] Validando token para: ${payload.email} (ID: ${payload.sub})`);
    
    try {
      const user = await this.authService.validateJwtPayload(payload);
      
      console.log(`✅ [JWT_STRATEGY] Token válido para: ${payload.email} - Role: ${user.role}`);
      
      return user;
    } catch (error) {
      console.log(`❌ [JWT_STRATEGY] Token inválido para: ${payload.email} - Erro: ${error.message}`);
      throw new UnauthorizedException('Token inválido');
    }
  }
}