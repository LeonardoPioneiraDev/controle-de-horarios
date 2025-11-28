import axios, { AxiosInstance, AxiosResponse } from 'axios';

export class BaseApiService {
  protected api: AxiosInstance;
  protected readonly baseURL: string;
  protected readonly timeout: number;
  protected readonly debug: boolean;

  constructor() {
    const envBase = typeof import.meta !== 'undefined' && (import.meta as ImportMeta).env
      ? (import.meta as ImportMeta).env.VITE_API_BASE_URL
      : undefined;

    const resolveApiBase = (): string => {
      const fallbackOrigin = window.location.origin;
      const raw = (envBase || '').trim();
      let s = raw || fallbackOrigin;
      if (!/^https?:\/\//i.test(s)) {
        if (/^\/\//.test(s)) s = 'http:' + s; else s = 'http://' + s;
      }
      s = s.replace(/^(https?:)(?!\/\/)/i, '$1//');
      let u: URL;
      try { u = new URL(s); } catch { u = new URL(fallbackOrigin); }
      const path = (u.pathname || '').replace(/\/+$/,'');
      u.pathname = /\/api$/i.test(path) ? path : (path ? path + '/api' : '/api');
      return u.toString().replace(/\/$/, '');
    };

    this.baseURL = resolveApiBase();
    this.timeout = 120000;
    this.debug = true;

    try {
      console.log('[API] Base URL resolvida:', this.baseURL);
    } catch {}

    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: { 'Content-Type': 'application/json' },
    });

    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          (config.headers as any).Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.api.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error) => {
        const originalRequest: any = error?.config || {};
        const status = error?.response?.status;

        // Tenta refresh uma vez em 401
        if (status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          const refreshToken = localStorage.getItem('refresh_token');
          if (refreshToken) {
            try {
              const res = await this.api.post<{ access_token: string; refresh_token: string }>(
                '/auth/refresh',
                { refreshToken }
              );
              const { access_token, refresh_token } = res.data || {};
              if (access_token) {
                localStorage.setItem('token', access_token);
                if (refresh_token) localStorage.setItem('refresh_token', refresh_token);
                (originalRequest.headers = originalRequest.headers || {})['Authorization'] = `Bearer ${access_token}`;
                // Atualiza header padrão para futuras requisições
                this.api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
                return this.api.request(originalRequest);
              }
            } catch (e) {
              // Falhou o refresh → cai para limpeza e redirect
            }
          }

          // Sem refresh válido → limpar e redirecionar
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('refresh_token');
          if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/reset-password')) {
            window.location.href = '/login';
          }
        }

        return Promise.reject(error);
      }
    );
  }

  public get apiInstance(): AxiosInstance {
    return this.api;
  }
}

export const makeAuthenticatedRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<any> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Token de autenticação não encontrado');
  }

  const envBase = typeof import.meta !== 'undefined' && (import.meta as ImportMeta).env
    ? (import.meta as ImportMeta).env.VITE_API_BASE_URL
    : undefined;

  const resolveApiBase = (): string => {
    const fallbackOrigin = window.location.origin;
    const raw = (envBase || '').trim();
    let s = raw || fallbackOrigin;
    if (!/^https?:\/\//i.test(s)) {
      if (/^\/\//.test(s)) s = 'http:' + s; else s = 'http://' + s;
    }
    s = s.replace(/^(https?:)(?!\/\/)/i, '$1//');
    let u: URL;
    try { u = new URL(s); } catch { u = new URL(fallbackOrigin); }
    const path = (u.pathname || '').replace(/\/+$/,'');
    u.pathname = /\/api$/i.test(path) ? path : (path ? path + '/api' : '/api');
    const out = u.toString().replace(/\/$/, '');
    return out;
  };

  const base = resolveApiBase();
  const baseWithSlash = base.endsWith('/') ? base : base + '/';
  const ep = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  let url = new URL(ep, baseWithSlash).toString();
  url = url.replace(/^(https?:)(?!\/\/)/i, '$1//');

  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  };

  const merged: RequestInit = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...(options.headers || {}),
    },
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  const response = await fetch(url, { ...merged, signal: controller.signal });
  clearTimeout(timeoutId);

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/reset-password')) {
        window.location.href = '/login';
      }
      throw new Error('Token expirado. Redirecionando para login...');
    }
    let errorData: any;
    try { errorData = await response.json(); } catch { errorData = { message: 'Erro desconhecido' }; }
    throw new Error(errorData.message || `Erro HTTP: ${response.status}`);
  }

  return await response.json();
};
