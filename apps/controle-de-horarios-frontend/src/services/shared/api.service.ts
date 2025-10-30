import axios, { AxiosInstance, AxiosResponse } from 'axios';

// ===============================================
// 🌐 BASE API SERVICE CLASS
// ===============================================

export class BaseApiService {
  protected api: AxiosInstance;
  protected readonly baseURL: string;
  protected readonly timeout: number;
  protected readonly debug: boolean;

  constructor() {
    this.baseURL = '/api';
    this.timeout = 500000;
    this.debug = true; // process.env.NODE_ENV !== 'production';

    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
    this.logConfiguration();
    // this.testConnectivity(); // Moved to specific health service
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
          console.log('🔄 API Request:', {
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
}

// ===============================================
// 🌐 FUNÇÃO AUXILIAR PARA REQUISIÇÕES AUTENTICADAS
// ===============================================

/**
 * ✅ Função auxiliar para fazer requisições autenticadas
 * Usada pelos componentes React
 */
export const makeAuthenticatedRequest = async (
  endpoint: string, 
  options: RequestInit = {}
): Promise<any> => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('Token de autenticação não encontrado');
  }

  const baseURL = '/api';
  const url = endpoint.startsWith('/') ? `${baseURL}${endpoint}` : `${baseURL}/${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  };

  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  console.log('🌐 makeAuthenticatedRequest:', {
    method: mergedOptions.method || 'GET',
    url,
    hasToken: !!token,
    tokenLength: token.length,
  });

  const response = await fetch(url, mergedOptions);
  
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      throw new Error('Token expirado. Redirecionando para login...');
    }
    
    const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
    throw new Error(errorData.message || `Erro HTTP: ${response.status}`);
  }

  return await response.json();
};