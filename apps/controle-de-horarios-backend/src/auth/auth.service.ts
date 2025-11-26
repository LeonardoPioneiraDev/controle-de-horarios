import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { User } from '../users/entities/user.entity';
import { UserRole, UserStatus } from '@/common/enums';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import * as crypto from 'crypto';
import { EmailService } from '@/email/email.service';

// Exportar interface para uso em outros arquivos
export { JwtPayload };

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) { }

  async login(loginDto: LoginDto): Promise<{ access_token: string; refresh_token: string; user: Partial<User> }> {
    const { email, password } = loginDto;

    console.log(`🔐 [AUTH] Tentativa de login para: ${email}`);
    console.log(`🔐 [AUTH] Dados recebidos: email=${email}, password=${password ? 'presente' : 'ausente'}`);

    try {
      // Validar usuário
      const user = await this.usersService.validateUser(email, password);
      if (!user) {
        console.log(`❌ [AUTH] Usuário não validado para: ${email}`);
        throw new UnauthorizedException('E-mail ou senha incorretos');
      }

      console.log(`✅ [AUTH] Usuário validado: ${email} - ID: ${user.id} - Role: ${user.role} - Status: ${user.status}`);

      // Verificar se o usuário está ativo (exceto se for primeiro login)
      if (user.status !== UserStatus.ACTIVE && user.status !== UserStatus.PENDING) {
        console.log(`❌ [AUTH] Status inválido para: ${email} - Status: ${user.status}`);
        throw new UnauthorizedException('Conta inativa');
      }

      console.log(`✅ [AUTH] Login válido para: ${email} - Status: ${user.status}`);

      // Atualizar último login
      await this.usersService.updateLastLogin(user.id);

      // Gerar tokens
      const tokens = await this.generateTokens(user);

      console.log(`🎫 [AUTH] Tokens gerados para: ${email}`);

      return {
        ...tokens,
        user: this.sanitizeUser(user),
      };
    } catch (error) {
      console.log(`❌ [AUTH] Erro no login para: ${email} - ${error.message}`);
      console.log(`❌ [AUTH] Stack trace:`, error.stack);
      throw error;
    }
  }

  async register(registerDto: RegisterDto): Promise<{ message: string; user: Partial<User> }> {
    console.log(`📝 [AUTH] Tentativa de registro para: ${registerDto.email}`);

    try {
      // Converter RegisterDto para CreateUserDto
      const createUserData = {
        email: registerDto.email,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        role: registerDto.role || UserRole.OPERADOR,
      };

      // Criar usuário (sem senha - será definida depois)
      const user = await this.usersService.create(createUserData);

      // Se uma senha foi fornecida no registro, definir como senha principal
      if (registerDto.password) {
        await this.usersService.resetPassword(user.email, registerDto.password);
      }

      console.log(`✅ [AUTH] Registro bem-sucedido para: ${registerDto.email}`);

      return {
        message: 'Usuário registrado com sucesso. Verifique seu e-mail.',
        user: this.sanitizeUser(user),
      };
    } catch (error) {
      console.log(`❌ [AUTH] Erro no registro para: ${registerDto.email} - ${error.message}`);
      throw error;
    }
  }

  async logout(userId: string): Promise<{ message: string }> {
    console.log(`🚪 [AUTH] Logout para usuário ID: ${userId}`);

    // Aqui você pode implementar invalidação de tokens se necessário
    // Por exemplo, adicionar o token a uma blacklist

    return { message: 'Logout realizado com sucesso' };
  }

  async validateJwtPayload(payload: JwtPayload): Promise<User> {
    console.log(`🔍 [AUTH] Validando JWT payload para: ${payload.email} (ID: ${payload.sub})`);

    try {
      console.log(`🔍 [AUTH] Payload SUB: "${payload.sub}" (Length: ${payload.sub.length})`);
      const user = await this.usersService.findOne(payload.sub);

      if (!user) {
        console.log(`❌ [AUTH] Usuário não encontrado no JWT: ${payload.sub}`);
        throw new UnauthorizedException('Usuário não encontrado');
      }

      // Verificar se o usuário ainda está ativo
      if (user.status === UserStatus.INACTIVE || user.status === UserStatus.BLOCKED) {
        console.log(`❌ [AUTH] Usuário inativo no JWT: ${payload.email} - Status: ${user.status}`);
        throw new UnauthorizedException('Conta inativa');
      }

      console.log(`✅ [AUTH] JWT válido para: ${payload.email} - Role: ${user.role}`);

      return user;
    } catch (error) {
      console.log(`❌ [AUTH] Erro na validação do JWT: ${error.message}`);
      throw new UnauthorizedException('Token inválido');
    }
  }

  async refreshToken(refreshToken: string): Promise<{ access_token: string; refresh_token: string }> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const user = await this.usersService.findOne(payload.sub);
      if (!user) {
        throw new UnauthorizedException('Usuário não encontrado');
      }

      return this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException('Refresh token inválido');
    }
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    console.log(`🔄 [AUTH] Solicitação de reset de senha para: ${email}`);

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // Por segurança, sempre retornar sucesso mesmo se o e-mail não existir
      return { message: 'Se o e-mail existir, você receberá instruções para redefinir sua senha.' };
    }

    // Gerar token de reset
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    // Atualizar usuário com token de reset
    await this.usersService.update(user.id, {
      passwordResetToken: resetToken,
      passwordResetExpires: resetExpires,
    });

    // Enviar e-mail com link de reset
    try {
      await this.emailService.sendPasswordResetEmail(user.email, user.firstName || user.email, resetToken);
    } catch (e: any) {
      console.log(`⚠️ [AUTH] Falha ao enviar e-mail de reset: ${e?.message}`);
    }

    return { message: 'Se o e-mail existir, você receberá instruções para redefinir sua senha.' };
  }

  // ✅ MÉTODO CORRIGIDO DE RESET DE SENHA
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    console.log(`🔑 [AUTH] Tentativa de reset de senha com token: ${token.substring(0, 8)}...`);

    try {
      // ✅ CORRIGIDO: Buscar usuário pelo token
      const user = await this.usersService.findByResetToken(token);

      if (!user) {
        console.log(`❌ [AUTH] Token de reset não encontrado: ${token.substring(0, 8)}...`);
        throw new BadRequestException('Token de reset inválido ou expirado');
      }

      // Verificar se o token não expirou
      if (!user.passwordResetExpires || user.passwordResetExpires < new Date()) {
        console.log(`❌ [AUTH] Token de reset expirado para: ${user.email}`);
        throw new BadRequestException('Token de reset expirado');
      }

      // Redefinir senha
      await this.usersService.resetPassword(user.email, newPassword);

      console.log(`✅ [AUTH] Senha redefinida com sucesso para: ${user.email}`);

      return { message: 'Senha redefinida com sucesso' };
    } catch (error) {
      console.log(`❌ [AUTH] Erro no reset de senha: ${error.message}`);
      throw error;
    }
  }

  // ✅ NOVO MÉTODO PARA VALIDAR TOKEN
  async validateResetToken(token: string): Promise<{ valid: boolean; message: string }> {
    console.log(`🔍 [AUTH] Validando token de reset: ${token.substring(0, 8)}...`);

    try {
      const user = await this.usersService.findByResetToken(token);

      if (!user) {
        console.log(`❌ [AUTH] Token não encontrado: ${token.substring(0, 8)}...`);
        return { valid: false, message: 'Token inválido' };
      }

      if (!user.passwordResetExpires || user.passwordResetExpires < new Date()) {
        console.log(`❌ [AUTH] Token expirado para: ${user.email}`);
        return { valid: false, message: 'Token expirado' };
      }

      console.log(`✅ [AUTH] Token válido para: ${user.email}`);
      return { valid: true, message: 'Token válido' };
    } catch (error) {
      console.log(`❌ [AUTH] Erro na validação do token: ${error.message}`);
      return { valid: false, message: 'Erro ao validar token' };
    }
  }

  async verifyEmail(token: string): Promise<{ message: string; user: Partial<User> }> {
    console.log(`📧 [AUTH] Verificação de e-mail com token: ${token.substring(0, 8)}...`);

    // Buscar usuário pelo token
    const user = await this.usersService.findByEmailVerificationToken(token);
    if (!user) {
      throw new BadRequestException('Token de verificação inválido');
    }

    // Ativar usuário
    const activatedUser = await this.usersService.activateUser(user.id);

    console.log(`✅ [AUTH] E-mail verificado com sucesso para: ${user.email}`);

    return {
      message: 'E-mail verificado com sucesso',
      user: this.sanitizeUser(activatedUser),
    };
  }

  async getAuthStats(): Promise<any> {
    console.log(`📊 [AUTH] Calculando estatísticas de autenticação`);

    const userStats = await this.usersService.getStats();

    return {
      totalUsers: userStats.total,
      activeUsers: userStats.byStatus.active,
      pendingUsers: userStats.byStatus.pending,
      inactiveUsers: userStats.byStatus.inactive,
      usersByRole: userStats.byRole,
      timestamp: new Date().toISOString(),
    };
  }

  // ✅ AUTOLOGIN - Login automático via token único
  async autoLogin(token: string): Promise<{ access_token: string; refresh_token: string; user: Partial<User> }> {
    console.log(`🔐 [AUTOLOGIN] Tentativa de autologin com token: ${token.substring(0, 8)}...`);

    try {
      // Buscar usuário pelo token de autologin
      const user = await this.usersService.findByAutoLoginToken(token);

      if (!user) {
        console.log(`❌ [AUTOLOGIN] Token inválido ou autologin desabilitado`);
        throw new UnauthorizedException('Token de autologin inválido');
      }

      console.log(`✅ [AUTOLOGIN] Usuário encontrado: ${user.email} - Role: ${user.role}`);

      // Atualizar último login
      await this.usersService.updateLastLogin(user.id);

      // Gerar tokens JWT
      const tokens = await this.generateTokens(user);

      console.log(`🎫 [AUTOLOGIN] Tokens gerados para: ${user.email}`);

      return {
        ...tokens,
        user: this.sanitizeUser(user),
      };
    } catch (error) {
      console.log(`❌ [AUTOLOGIN] Erro no autologin: ${error.message}`);
      throw error;
    }
  }

  // ===============================================
  // 🔧 MÉTODOS PRIVADOS
  // ===============================================

  private async generateTokens(user: User): Promise<{ access_token: string; refresh_token: string }> {
    const payload: JwtPayload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_EXPIRES_IN'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN'),
      }),
    ]);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  private generateVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private sanitizeUser(user: User): Partial<User> {
    const {
      password,
      tempPassword,
      passwordResetToken,
      emailVerificationToken,
      ...sanitized
    } = user;
    return sanitized;
  }
}
