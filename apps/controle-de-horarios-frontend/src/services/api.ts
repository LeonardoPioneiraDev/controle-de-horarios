import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  User, 
  CreateUserRequest, 
  UpdateUserRequest, 
  LoginRequest, 
  LoginResponse, 
  RegisterRequest,
  UserStats,
  EmailConfig,
  EmailTestRequest,
  EmailTestResponse
} from '../types';

class ApiServiceClass {
  private api: AxiosInstance;
  private readonly baseURL: string;
  private readonly timeout: number;
  private readonly debug: boolean;

  constructor() {
    this.baseURL = '/api';
    this.timeout = 10000;
    this.debug = true;

    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
    this.logConfiguration();
    this.testConnectivity();
  }

  private logConfiguration(): void {
    if (this.debug) {
      console.log('🌐 ==========================================');
      console.log('🌐 CONFIGURAÇÃO DA API - FRONTEND');
      console.log('🌐 ==========================================');
      console.log('🔧 Modo: Desenvolvimento');
      console.log(`🔗 Base URL: ${this.baseURL}`);
      console.log('📡 Modo de conexão: proxy');
      console.log(`⏱️ Timeout: ${this.timeout}ms`);
      console.log(`🐛 Debug: ${this.debug}`);
      console.log('🌐 ==========================================');
    }
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        const hasToken = !!token;
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        if (this.debug) {
          console.log('📤 API Request:', {
            method: config.method?.toUpperCase(),
            url: config.url,
            baseURL: config.baseURL,
            fullURL: `${config.baseURL}${config.url}`,
            hasToken,
            tokenLength: token?.length || 0,
            authHeader: config.headers.Authorization ? 'presente' : 'ausente'
          });
        }

        return config;
      },
      (error) => {
        console.error('❌ Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        if (this.debug) {
          console.log('📥 API Response:', {
            status: response.status,
            statusText: response.statusText,
            url: response.config.url,
            hasData: !!response.data
          });
        }
        return response;
      },
      (error) => {
        if (error.response?.status === 401) {
          console.log('🔒 Token inválido, limpando storage...');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          
          // Só redirecionar se não estiver já na página de login
          if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/reset-password')) {
            window.location.href = '/login';
          }
        }

        console.error('❌ Response Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          message: error.response?.data?.message || error.message,
          url: error.config?.url
        });

        return Promise.reject(error);
      }
    );
  }

  // ===============================================
  // 🔐 AUTENTICAÇÃO
  // ===============================================

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

  // ✅ NOVOS MÉTODOS DE RESET DE SENHA
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
    console.log(`🔍 Validando token de reset: ${token.substring(0, 8)}...`);
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

  // ===============================================
  // 👥 USUÁRIOS
  // ===============================================

  async getUsers(): Promise<User[]> {
    console.log('👥 Buscando lista de usuários...');
    const response = await this.api.get<User[]>('/users');
    console.log('✅ Lista de usuários obtida');
    return response.data;
  }

  async createUser(userData: CreateUserRequest): Promise<User> {
    console.log('➕ Criando novo usuário...');
    const response = await this.api.post<User>('/users', userData);
    console.log('✅ Usuário criado com sucesso');
    return response.data;
  }

  async updateUser(id: string, userData: UpdateUserRequest): Promise<User> {
    console.log(`✏️ Atualizando usuário ${id}...`);
    const response = await this.api.patch<User>(`/users/${id}`, userData);
    console.log('✅ Usuário atualizado com sucesso');
    return response.data;
  }

  async deleteUser(id: string): Promise<{ message: string }> {
    console.log(`🗑️ Deletando usuário ${id}...`);
    const response = await this.api.delete(`/users/${id}`);
    console.log('✅ Usuário deletado com sucesso');
    return response.data;
  }

  async getUserById(id: string): Promise<User> {
    console.log(`👤 Buscando usuário ${id}...`);
    const response = await this.api.get<User>(`/users/${id}`);
    console.log('✅ Usuário encontrado');
    return response.data;
  }

  async searchUsers(query: string): Promise<User[]> {
    console.log(`🔍 Buscando usuários: "${query}"...`);
    const response = await this.api.get<User[]>(`/users/search?q=${encodeURIComponent(query)}`);
    console.log('✅ Busca realizada');
    return response.data;
  }

  async getUserStats(): Promise<UserStats> {
    console.log('📊 Buscando estatísticas de usuários...');
    const response = await this.api.get<UserStats>('/users/stats');
    console.log('✅ Estatísticas obtidas');
    return response.data;
  }

  // ===============================================
  // 📧 E-MAIL
  // ===============================================

  async getEmailConfig(): Promise<EmailConfig> {
    console.log('📧 Buscando configurações de e-mail...');
    const response = await this.api.get<EmailConfig>('/email/config');
    console.log('✅ Configurações de e-mail obtidas');
    return response.data;
  }

  async testEmailConnection(): Promise<{ success: boolean; message: string; timestamp: string }> {
    console.log('🔌 Testando conexão SMTP...');
    const response = await this.api.get('/email/test-connection');
    console.log('✅ Teste de conexão realizado');
    return response.data;
  }

  async sendTestEmail(data: EmailTestRequest): Promise<EmailTestResponse> {
    console.log(`📧 Enviando e-mail de teste para: ${data.email}...`);
    const response = await this.api.post<EmailTestResponse>('/email/test-send', data);
    console.log('✅ E-mail de teste enviado');
    return response.data;
  }

  // ===============================================
  // 🏥 HEALTH CHECK
  // ===============================================

  async checkHealth(): Promise<{ status: string; timestamp: string; database: string }> {
    console.log('🏥 Verificando saúde do backend...');
    const response = await this.api.get('/health');
    console.log('✅ Health check realizado');
    return response.data;
  }

  async checkDatabaseHealth(): Promise<{ status: string; database: string; timestamp: string }> {
    console.log('💾 Verificando saúde do banco de dados...');
    const response = await this.api.get('/health/database');
    console.log('✅ Database health check realizado');
    return response.data;
  }

  async getStatus(): Promise<{ application: string; version: string; environment: string; timestamp: string }> {
    console.log('📊 Buscando status da aplicação...');
    const response = await this.api.get('/status');
    console.log('✅ Status obtido');
    return response.data;
  }

  // ===============================================
  // 🧪 MÉTODOS DE TESTE
  // ===============================================

  private async testConnectivity(): Promise<void> {
    console.log('🧪 Executando teste de conectividade inicial...');
    
    try {
      await this.checkHealth();
      console.log('✅ Conectividade com backend confirmada');
    } catch (error) {
      console.error('❌ Falha na conectividade com backend:', error);
      console.log('💡 Possíveis soluções:');
      console.log('   1. Verificar se o backend está rodando em http://localhost:3335');
      console.log('   2. Verificar configurações de CORS no backend');
      console.log('   3. Verificar se não há firewall bloqueando a conexão');
    }
  }
}

export const ApiService = new ApiServiceClass();