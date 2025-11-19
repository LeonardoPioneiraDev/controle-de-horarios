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
    // Resolve API base URL (tolerante a formatos incompletos)
    const envBase =
      typeof import.meta !== 'undefined' && (import.meta as ImportMeta).env
        ? (import.meta as ImportMeta).env.VITE_API_BASE_URL
        : undefined;

    const resolveApiBase = (): string => {
      const fallbackOrigin = window.location.origin;
      const raw = (envBase || '').trim();

      // Ensure we get a valid absolute URL with scheme and host
      const coerceAbsolute = (value: string): URL => {
        let s = (value || '').trim();
        if (!s) s = fallbackOrigin;
        if (!/^https?:\/\//i.test(s)) {
          if (/^\/\//.test(s)) s = 'http:' + s; else s = 'http://' + s;
        }
        // Fix cases like 'http:localhost:3336' (missing '//')
        s = s.replace(/^(https?:)(?!\/\/)/i, '$1//');
        let u: URL;
        try { u = new URL(s); } catch { u = new URL(fallbackOrigin); }
        // Ensure path ends with '/api'
        const path = (u.pathname || '').replace(/\/+$/,'');
        u.pathname = /\/api$/i.test(path) ? path : (path ? path + '/api' : '/api');
        return u;
      };

      const u = coerceAbsolute(raw);
      // Return without trailing slash to be consistent
      return u.toString().replace(/\/$/, '');
    };

    this.baseURL = resolveApiBase();
    this.timeout = 29000000;
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
      if (!this.debug) return;
      console.log('==========================================');
      console.log('CONFIGURAÇÃO DA API - FRONTEND');
      console.log('==========================================');
      console.log('Modo: Desenvolvimento');
      console.log(`Base URL: ${this.baseURL}`);
      console.log('Conexão: proxy');
      console.log(`Timeout: ${this.timeout}ms`);
      console.log(`Debug: ${this.debug}`);
      console.log('==========================================');
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
    const fallbackOrigin = window.location.origin;
    const raw = (envBase || '').trim();

    const coerceAbsolute = (value: string): URL => {
      let s = (value || '').trim();
      if (!s) s = fallbackOrigin;
      if (!/^https?:\/\//i.test(s)) {
        if (/^\/\//.test(s)) s = 'http:' + s; else s = 'http://' + s;
      }
      s = s.replace(/^(https?:)(?!\/\/)/i, '$1//');
      let u: URL;
      try { u = new URL(s); } catch { u = new URL(fallbackOrigin); }
      const path = (u.pathname || '').replace(/\/+$/,'');
      u.pathname = /\/api$/i.test(path) ? path : (path ? path + '/api' : '/api');
      return u;
    };

    const u = coerceAbsolute(raw);
    return u.toString().replace(/\/$/, '');
  };

  const rawBaseURL = resolveApiBase();
  const base = rawBaseURL.endsWith('/') ? rawBaseURL : `${rawBaseURL}/`;
  const ep = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  let url = new URL(ep, base).toString();
  // Ensure scheme is followed by // (fix edge cases)
  url = url.replace(/^(https?:)(?!\/\/)/i, '$1//');

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
