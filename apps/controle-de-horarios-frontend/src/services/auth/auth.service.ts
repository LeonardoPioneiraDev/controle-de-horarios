import { BaseApiService } from '../shared/api.service';
import { LoginRequest, LoginResponse, RegisterRequest, User, EmailTestRequest, EmailTestResponse } from '../../types';

export class AuthService extends BaseApiService {
  constructor() {
    super();
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    console.log('🔑 Iniciando login...');
    const response = await this.api.post<LoginResponse>('/auth/login', credentials);
    console.log('✅ Login realizado com sucesso');
    return response.data;
  }

  async register(userData: RegisterRequest): Promise<{ message: string; user: User }> {
    console.log('📝 Registrando usuário...');
    const response = await this.api.post('/auth/register', userData);
    console.log('✅ Registro realizado com sucesso');
    return response.data;
  }

  async logout(): Promise<{ message: string }> {
    console.log('🚪 Realizando logout...');
    const response = await this.api.post('/auth/logout');
    console.log('✅ Logout realizado com sucesso');
    return response.data;
  }

  async getProfile(): Promise<{ user: User }> {
    console.log('👤 Buscando perfil do usuário...');
    const response = await this.api.get('/auth/me');
    console.log('✅ Perfil obtido com sucesso');
    return response.data;
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    console.log(`🔑 Redefinindo senha com token: ${token.substring(0, 8)}...`);
    const response = await this.api.post('/auth/reset-password', {
      token,
      newPassword
    });
    console.log('✅ Senha redefinida com sucesso');
    return response.data;
  }

  async validateResetToken(token: string): Promise<{ valid: boolean; message: string }> {
    console.log(` Validando token de reset: ${token.substring(0, 8)}...`);
    const response = await this.api.post('/auth/validate-reset-token', { token });
    console.log('✅ Token validado');
    return response.data;
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    console.log(`🔄 Solicitando reset de senha para: ${email}`);
    const response = await this.api.post('/auth/forgot-password', { email });
    console.log('✅ Solicitação de reset enviada');
    return response.data;
  }
}

export const authService = new AuthService();