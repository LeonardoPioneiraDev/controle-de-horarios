import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
import { UsersService } from '../../users/users.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {
    super({
      usernameField: 'email',
      passwordField: 'password',
    });
  }

  async validate(email: string, password: string): Promise<any> {
    console.log(`[LOCAL_STRATEGY] Validando credenciais para: ${email}`);
    try {
      const user = await this.usersService.validateUser(email, password);
      if (!user) {
        console.log(`[LOCAL_STRATEGY] Credenciais inválidas para: ${email}`);
        throw new UnauthorizedException('Credenciais inválidas');
      }
      console.log(`[LOCAL_STRATEGY] Credenciais válidas para: ${email}`);
      return user;
    } catch (error: any) {
      console.log(`[LOCAL_STRATEGY] Erro na validação para: ${email} - ${error.message}`);
      throw new UnauthorizedException('Credenciais inválidas');
    }
  }
}

