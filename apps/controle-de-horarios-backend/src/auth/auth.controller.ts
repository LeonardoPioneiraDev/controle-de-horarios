import { Controller, Post, Body, Get, UseGuards, Request, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) { }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Fazer login' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login realizado com sucesso' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  async login(@Body() loginDto: LoginDto, @Request() req) {
    const { email } = loginDto;
    const clientIP = req.ip || req.connection.remoteAddress;

    console.log(`🔐 [LOGIN_CONTROLLER] Requisição recebida para: ${email} - IP: ${clientIP}`);
    console.log(`🔐 [LOGIN_CONTROLLER] Headers:`, req.headers);
    console.log(`🔐 [LOGIN_CONTROLLER] Body:`, loginDto);

    try {
      const result = await this.authService.login(loginDto);

      console.log(`✅ [LOGIN_CONTROLLER] Login bem-sucedido para: ${email}`);

      return result;
    } catch (error) {
      console.log(`❌ [LOGIN_CONTROLLER] Erro no login para: ${email} - ${error.message}`);
      console.log(`❌ [LOGIN_CONTROLLER] Stack:`, error.stack);
      throw error;
    }
  }

  @Post('register')
  @ApiOperation({ summary: 'Registrar novo usuário' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso' })
  async register(@Body() registerDto: RegisterDto, @Request() req) {
    const clientIP = req.ip || req.connection.remoteAddress;

    console.log(`📝 [REGISTER_CONTROLLER] Requisição recebida para: ${registerDto.email} - IP: ${clientIP}`);

    try {
      const result = await this.authService.register(registerDto);

      console.log(`✅ [REGISTER_CONTROLLER] Registro bem-sucedido para: ${registerDto.email}`);

      return result;
    } catch (error) {
      console.log(`❌ [REGISTER_CONTROLLER] Erro no registro para: ${registerDto.email} - ${error.message}`);
      throw error;
    }
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Fazer logout' })
  async logout(@Request() req) {
    const user = req.user;

    console.log(`🚪 [LOGOUT_CONTROLLER] Logout para usuário: ${user.email}`);

    return await this.authService.logout(user.sub);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter perfil do usuário logado' })
  async getProfile(@Request() req) {
    const user = req.user;

    console.log(`👤 [PROFILE_CONTROLLER] Solicitação de perfil para: ${user.email}`);

    const userProfile = await this.usersService.findOne(user.sub);
    return { user: userProfile };
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Estatísticas de autenticação' })
  async getAuthStats(@Request() req) {
    const user = req.user;

    console.log(`📊 [STATS_CONTROLLER] Solicitação de estatísticas por: ${user.email}`);

    return await this.authService.getAuthStats();
  }

  // ✅ NOVOS ENDPOINTS PARA RESET DE SENHA
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Solicitar reset de senha' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email' }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'E-mail de reset enviado' })
  async forgotPassword(@Body() body: { email: string }, @Request() req) {
    const clientIP = req.ip || req.connection.remoteAddress;

    console.log(`🔄 [FORGOT_PASSWORD_CONTROLLER] Solicitação para: ${body.email} - IP: ${clientIP}`);

    try {
      const result = await this.authService.forgotPassword(body.email);

      console.log(`✅ [FORGOT_PASSWORD_CONTROLLER] Solicitação processada para: ${body.email}`);

      return result;
    } catch (error) {
      console.log(`❌ [FORGOT_PASSWORD_CONTROLLER] Erro para: ${body.email} - ${error.message}`);
      throw error;
    }
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Redefinir senha com token' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        token: { type: 'string' },
        newPassword: { type: 'string', minLength: 8 }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Senha redefinida com sucesso' })
  @ApiResponse({ status: 400, description: 'Token inválido ou expirado' })
  async resetPassword(@Body() body: { token: string; newPassword: string }, @Request() req) {
    const clientIP = req.ip || req.connection.remoteAddress;

    console.log(`🔑 [RESET_PASSWORD_CONTROLLER] Redefinição com token: ${body.token.substring(0, 8)}... - IP: ${clientIP}`);

    try {
      const result = await this.authService.resetPassword(body.token, body.newPassword);

      console.log(`✅ [RESET_PASSWORD_CONTROLLER] Senha redefinida com sucesso`);

      return result;
    } catch (error) {
      console.log(`❌ [RESET_PASSWORD_CONTROLLER] Erro na redefinição: ${error.message}`);
      throw error;
    }
  }

  @Post('validate-reset-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validar token de reset' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        token: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Token validado' })
  async validateResetToken(@Body() body: { token: string }, @Request() req) {
    const clientIP = req.ip || req.connection.remoteAddress;

    console.log(`🔍 [VALIDATE_TOKEN_CONTROLLER] Validação de token: ${body.token.substring(0, 8)}... - IP: ${clientIP}`);

    try {
      const result = await this.authService.validateResetToken(body.token);

      console.log(`✅ [VALIDATE_TOKEN_CONTROLLER] Token validado: ${result.valid}`);

      return result;
    } catch (error) {
      console.log(`❌ [VALIDATE_TOKEN_CONTROLLER] Erro na validação: ${error.message}`);
      throw error;
    }
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verificar e-mail com token' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        token: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'E-mail verificado com sucesso' })
  async verifyEmail(@Body() body: { token: string }, @Request() req) {
    const clientIP = req.ip || req.connection.remoteAddress;

    console.log(`📧 [VERIFY_EMAIL_CONTROLLER] Verificação de e-mail: ${body.token.substring(0, 8)}... - IP: ${clientIP}`);

    try {
      const result = await this.authService.verifyEmail(body.token);

      console.log(`✅ [VERIFY_EMAIL_CONTROLLER] E-mail verificado com sucesso`);

      return result;
    } catch (error) {
      console.log(`❌ [VERIFY_EMAIL_CONTROLLER] Erro na verificação: ${error.message}`);
      throw error;
    }
  }

  @Get('autologin/:token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Autologin via token único (sem senha)' })
  @ApiResponse({ status: 200, description: 'Login automático realizado com sucesso' })
  @ApiResponse({ status: 401, description: 'Token inválido ou expirado' })
  async autoLogin(@Param('token') token: string, @Request() req) {
    const clientIP = req.ip || req.connection.remoteAddress;

    console.log(`🔐 [AUTOLOGIN_CONTROLLER] Requisição de autologin - Token: ${token.substring(0, 8)}... - IP: ${clientIP}`);

    try {
      const result = await this.authService.autoLogin(token);

      console.log(`✅ [AUTOLOGIN_CONTROLLER] Autologin bem-sucedido para: ${result.user.email}`);

      return result;
    } catch (error) {
      console.log(`❌ [AUTOLOGIN_CONTROLLER] Erro no autologin: ${error.message}`);
      throw error;
    }
  }
}