import axios, { AxiosInstance, AxiosResponse, AxiosRequestConfig } from 'axios';

// ===============================================
// ðŸŒ BASE API SERVICE CLASS
// ===============================================

export class BaseApiService {
  protected api: AxiosInstance;
  protected readonly baseURL: string;
  protected readonly timeout: number;
  protected readonly debug: boolean;

  constructor() {
    // Resolve API origin via Vite env (VITE_API_BASE_URL) ou window.location
    const envBase =
      typeof import.meta !== 'undefined' && (import.meta as ImportMeta).env
        ? (import.meta as ImportMeta).env.VITE_API_BASE_URL
        : undefined;

    const resolveBaseOrigin = (): string => {
      const fallback = window.location.origin;
      const raw = (envBase || '').trim() || fallback;
      const normalized = raw.replace(/^(https?:)(?!\/\/)/i, '$1//');
      const withSlash = normalized.endsWith('/') ? normalized : `${normalized}/`;
      try {
        const u = new URL(withSlash);
        return u.toString();
      } catch {
        return new URL(fallback.endsWith('/') ? fallback : `${fallback}/`).toString();
      }
    };

    const baseOrigin = resolveBaseOrigin();
    this.baseURL = new URL('api/', baseOrigin).toString().replace(/\/$/, '');
    this.timeout = 12000000;
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

        console.log('ðŸŒ ==========================================');

        console.log('ðŸŒ CONFIGURAÃ‡ÃƒO DA API - FRONTEND');

        console.log('ðŸŒ ==========================================');

        console.log('ðŸ”§ Modo: Desenvolvimento');

        console.log(`ðŸ”— Base URL: ${this.baseURL}`);

        console.log('ðŸ“¡ Modo de conexÃ£o: proxy');

        console.log(`â±ï¸ Timeout: ${this.timeout}ms`);

        console.log(`ðŸ› Debug: ${this.debug}`);

        console.log('ðŸŒ ==========================================');

      }

    }

  

    public get apiInstance(): AxiosInstance {

      return this.api;

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

        // Build absolute URL safely using WHATWG URL and merge params to avoid malformed paths
        const safeBase = this.baseURL.endsWith('/') ? this.baseURL : `${this.baseURL}/`;
        const rawUrl = String(config.url || '');
        const path = rawUrl.startsWith('/') ? rawUrl.substring(1) : rawUrl; // strip leading '/'
        const urlObj = new URL(path, safeBase);

        if (config.params && typeof config.params === 'object') {
          Object.entries(config.params as Record<string, unknown>).forEach(([key, value]) => {
            if (value === undefined || value === null) return;
            urlObj.searchParams.append(key, String(value));
          });
          // evitar re-apensar params
          (config as AxiosRequestConfig).params = undefined;
        }

        // forÃ§a uso da URL absoluta
        (config as AxiosRequestConfig).baseURL = undefined;
        config.url = urlObj.toString();

        if (this.debug) {
          console.log('ðŸ”„ API Request:', {
            method: config.method?.toUpperCase(),
            url: config.url,
            baseURL: safeBase,
            fullURL: config.url,
            hasToken,
            tokenLength: token?.length || 0,
            authHeader: config.headers.Authorization ? 'presente' : 'ausente'
          });
        }

          return config;
        },
        (error) => {
          console.error('âŒ Request Error:', error);
          return Promise.reject(error);
        }
      );

      // Response interceptor
      this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        if (this.debug) {
          console.log('ðŸ“¥ API Response:', {
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
          console.log('ðŸ”’ Token invÃ¡lido, limpando storage...');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          
          // SÃ³ redirecionar se nÃ£o estiver jÃ¡ na pÃ¡gina de login
          if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/reset-password')) {
            window.location.href = '/login';
          }
        }

        console.error('âŒ Response Error:', {
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
// ðŸŒ FUNÃ‡ÃƒO AUXILIAR PARA REQUISIÃ‡Ã•ES AUTENTICADAS
// ===============================================

/**
 * âœ… FunÃ§Ã£o auxiliar para fazer requisiÃ§Ãµes autenticadas
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

  const envBase =
    typeof import.meta !== 'undefined' && (import.meta as ImportMeta).env
      ? (import.meta as ImportMeta).env.VITE_API_BASE_URL
      : undefined;

  const resolveApiBase = (): string => {
    const raw = (envBase || '').trim();
    const origin = raw ? raw.replace(/^https?:(?!\/)/, (m) => `${m}//`) : window.location.origin;
    const withSlash = origin.endsWith('/') ? origin : `${origin}/`;
    return new URL('api/', withSlash).toString().replace(/\/$/, '');
  };

  const rawBaseURL = resolveApiBase();
  const base = rawBaseURL.endsWith('/') ? rawBaseURL : `${rawBaseURL}/`;
  const ep = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const url = new URL(ep, base).toString();

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

  console.log('makeAuthenticatedRequest:', {
    method: mergedOptions.method || 'GET',
    url,
    hasToken: !!token,
    tokenLength: token.length,
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos de timeout

  const response = await fetch(url, {
    ...mergedOptions,
    signal: controller.signal,
  });

  clearTimeout(timeoutId);

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
