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

// ===============================================
// 🚌 INTERFACES VIAGENS TRANSDATA - CORRIGIDAS
// ===============================================

export interface ViagemTransdata {
  id: number;
  hashDados: string;
  dataReferencia: string;
  isAtivo: boolean;
  createdAt: string;
  updatedAt: string;
  ultimaSincronizacao: string;
  
  // ✅ CAMPOS PRINCIPAIS BASEADOS NA TABELA REAL
  NomeLinha: string;              // Nome completo da linha (ex: "180.0 - São Sebastião / Rod. P. Piloto")
  Servico: number;                // Número do serviço
  SentidoText: string;            // Sentido da viagem (IDA/VOLTA)
  InicioPrevistoText: string;     // Horário previsto de início
  InicioRealizadoText: string;    // Horário realizado de início
  FimPrevistoText: string;        // Horário previsto de fim
  FimRealizadoText: string;       // Horário realizado de fim
  PontoFinal: string;             // Tipo de ponto final (Manual/Automático)
  statusCumprimento: string;      // Status (CUMPRIDA/NAO_CUMPRIDA/etc)
  
  // ✅ CAMPOS ADICIONAIS DISPONÍVEIS
  PrefixoPrevisto?: string;       // Prefixo do veículo previsto
  PrefixoRealizado?: string;      // Prefixo do veículo realizado
  NomePI?: string;                // Nome do ponto inicial
  NomePF?: string;                // Nome do ponto final
  Trajeto?: string;               // Descrição do trajeto
  NomeMotorista?: string;         // Nome do motorista
  MatriculaMotorista?: string;    // Matrícula do motorista
  NomeCobrador?: string;          // Nome do cobrador
  MatriculaCobrador?: string;     // Matrícula do cobrador
  ParadasLbl?: string;            // Label das paradas
  Link1Text?: string;             // Link 1
  HistoricoLbl?: string;          // Label do histórico
  Link2Text?: string;             // Link 2
  
  // ✅ CAMPOS DE STATUS DETALHADOS
  ParcialmenteCumprida?: number;  // Flag parcialmente cumprida
  NaoCumprida?: number;           // Flag não cumprida
  ForadoHorarioInicio?: number;   // Flag fora do horário início
  ForadoHorarioFim?: number;      // Flag fora do horário fim
  AtrasadoInicio?: number;        // Flag atrasado início
  AtrasadoFim?: number;           // Flag atrasado fim
  AdiantadoInicio?: number;       // Flag adiantado início
  AdiantadoFim?: number;          // Flag adiantado fim
  NaoCumpridoInicio?: number;     // Flag não cumprido início
  NaoCumpridoFim?: number;        // Flag não cumprido fim
  
  // ✅ CAMPOS TÉCNICOS
  IdLinha?: number;               // ID da linha
  InicioPrevisto?: string;        // Horário previsto (formato técnico)
  InicioRealizado?: string;       // Horário realizado (formato técnico)
  StatusInicio?: number;          // Status numérico do início
  FimPrevisto?: string;           // Fim previsto (formato técnico)
  FimRealizado?: string;          // Fim realizado (formato técnico)
  StatusFim?: number;             // Status numérico do fim
  Sentido?: boolean;              // Sentido booleano
  Viagem?: number;                // Número da viagem
  PontosCumpridosPercentual?: string; // Percentual de pontos cumpridos
  ValidouPontosCumpridos?: number;    // Flag validação pontos
  KMProgramado?: string;          // KM programado
  KMRodado?: string;              // KM rodado
  Consolidad?: number;            // Flag consolidado
  
  // ✅ CAMPOS LEGADOS (compatibilidade)
  codigoLinha?: string;           // Campo legado
  sentidoTexto?: string;          // Campo legado
  numeroServico?: number;         // Campo legado
  horaProgramada?: string;        // Campo legado
  horaRealizada?: string;         // Campo legado
  atraso?: number;                // Campo legado
}

export interface FiltrosViagem {
  sentido?: 'IDA' | 'VOLTA';
  codigoLinha?: string;           // Código extraído do NomeLinha
  numeroServico?: number;         // Mesmo que Servico
  statusCumprimento?: string;
  pontoFinal?: string;            // Filtro por tipo de ponto final
  nomeLinha?: string;             // Busca no NomeLinha
  horarioInicio?: string;         // Filtro por horário início
  horarioFim?: string;            // Filtro por horário fim
  page?: number;
  limit?: number;
}

// ===============================================
// 🕐 INTERFACES CONTROLE DE HORÁRIOS - NOVAS
// ===============================================

export interface ViagemGlobusBase {
  id: string;
  codigoLinha: string;
  nomeLinha: string;
  codServicoNumero: string;
  sentidoTexto: string;
  horSaidaTime: string;
  horChegadaTime: string;
  nomeMotorista: string;
  setorPrincipal: string;
  localOrigemViagem: string;
  duracaoMinutos: number;
  periodoDoDia: string;
  flgSentido: string;
}

export interface DadosEditaveis {
  id?: string;
  numeroCarro?: string;
  informacaoRecolhe?: string;
  crachaFuncionario?: string;
  observacoes?: string;
  usuarioEdicao?: string;
  usuarioEmail?: string;
  updatedAt?: Date;
  jaFoiEditado: boolean;
}

export interface ControleHorarioItem {
  viagemGlobus: ViagemGlobusBase;
  dadosEditaveis: DadosEditaveis;
}

export interface FiltrosControleHorarios {
  setorPrincipal?: string;
  codigoLinha?: string;
  codServicoNumero?: string;
  sentidoTexto?: string;
  horarioInicio?: string;
  horarioFim?: string;
  nomeMotorista?: string;
  localOrigem?: string;
  buscaTexto?: string;
  limite?: number;
  pagina?: number;
}

export interface ControleHorarioResponse {
  success: boolean;
  message: string;
  data: ControleHorarioItem[];
  total: number;
  pagina: number;
  limite: number;
  temMaisPaginas: boolean;
  filtrosAplicados: FiltrosControleHorarios;
  estatisticas: {
    totalViagens: number;
    viagensEditadas: number;
    viagensNaoEditadas: number;
    percentualEditado: number;
    setoresUnicos: string[];
    linhasUnicas: string[];
    servicosUnicos: string[];
  };
  executionTime: string;
  dataReferencia: string;
}

export interface OpcoesControleHorarios {
  setores: string[];
  linhas: { codigo: string; nome: string }[];
  servicos: string[];
  sentidos: string[];
  motoristas: string[];
}

export interface SalvarControleHorario {
  viagemGlobusId: string;
  numeroCarro?: string;
  informacaoRecolhe?: string;
  crachaFuncionario?: string;
  observacoes?: string;
}

export interface SalvarMultiplosControles {
  dataReferencia: string;
  controles: SalvarControleHorario[];
}

export interface EstatisticasControleHorarios {
  dataReferencia: string;
  totalViagens: number;
  viagensEditadas: number;
  viagensNaoEditadas: number;
  percentualEditado: number;
  ultimaAtualizacao: Date;
}

// ===============================================
// 🌐 INTERFACES GENÉRICAS
// ===============================================

export interface ResponsePaginada<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface StatusDados {
  data: string;
  existemDados: boolean;
  totalViagens?: number;
  ultimaSincronizacao?: string;
}

export interface CodigosLinha {
  data: string;
  linhas: string[];              // Códigos extraídos do NomeLinha
  total: number;
}

export interface ServicosUnicos {
  data: string;
  servicos: number[];            // Números únicos do campo Servico
  total: number;
}

export interface SincronizacaoResult {
  message: string;
  data: string;
  sincronizadas: number;
  novas: number;
  atualizadas: number;
  timestamp: string;
}

export interface TesteConexao {
  success: boolean;
  message: string;
  responseTime?: number;
  timestamp: string;
}

export interface EstatisticasAPI {
  baseUrl: string;
  timeout: string;
  retryAttempts: string;
  ultimaRequisicao: string;
  timestamp: string;
}

// ===============================================
// 🌐 API SERVICE CLASS
// ===============================================

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
    console.log(`�� Validando token de reset: ${token.substring(0, 8)}...`);
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
    console.log(`��️ Deletando usuário ${id}...`);
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
    console.log(`�� Buscando usuários: "${query}"...`);
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
  // 🚌 VIAGENS TRANSDATA - MÉTODOS ATUALIZADOS
  // ===============================================

  /**
   * ✅ Buscar todas as viagens de uma data específica
   */
  async getViagensByDate(data: string): Promise<ViagemTransdata[]> {
    console.log(`🚌 Buscando viagens para data: ${data}...`);
    const response = await this.api.get<ViagemTransdata[]>(`/viagens-transdata/${data}`);
    console.log(`✅ ${response.data.length} viagens encontradas para ${data}`);
    return response.data;
  }

  /**
   * ✅ Buscar viagens com filtros aplicados (corrigido para usar campos reais)
   */
  async getViagensWithFilters(data: string, filtros: FiltrosViagem = {}): Promise<ResponsePaginada<ViagemTransdata>> {
    console.log(`🔍 Buscando viagens filtradas para ${data}...`, filtros);
    
    const params = new URLSearchParams();
    
    // ✅ Mapear filtros para os campos corretos da API
    if (filtros.sentido) params.append('sentido', filtros.sentido);
    if (filtros.codigoLinha) params.append('codigoLinha', filtros.codigoLinha);
    if (filtros.numeroServico) params.append('servico', filtros.numeroServico.toString()); // ✅ Corrigido: 'servico' não 'numeroServico'
    if (filtros.statusCumprimento) params.append('statusCumprimento', filtros.statusCumprimento);
    if (filtros.pontoFinal) params.append('pontoFinal', filtros.pontoFinal);
    if (filtros.nomeLinha) params.append('nomeLinha', filtros.nomeLinha);
    if (filtros.horarioInicio) params.append('horarioInicio', filtros.horarioInicio);
    if (filtros.horarioFim) params.append('horarioFim', filtros.horarioFim);
    if (filtros.page) params.append('page', filtros.page.toString());
    if (filtros.limit) params.append('limit', filtros.limit.toString());

    const queryString = params.toString();
    const url = `/viagens-transdata/${data}/filtrados${queryString ? `?${queryString}` : ''}`;
    
    const response = await this.api.get<ResponsePaginada<ViagemTransdata>>(url);
    console.log(`✅ ${response.data.data.length}/${response.data.total} viagens filtradas encontradas`);
    return response.data;
  }

  /**
   * ✅ Verificar status dos dados para uma data
   */
  async getStatusDados(data: string): Promise<StatusDados> {
    console.log(`📊 Verificando status dos dados para: ${data}...`);
    const response = await this.api.get<StatusDados>(`/viagens-transdata/${data}/status`);
    console.log(`✅ Status verificado: ${response.data.existemDados ? 'Dados existem' : 'Sem dados'}`);
    return response.data;
  }

  /**
   * ✅ Obter códigos de linha únicos para uma data (extraídos do NomeLinha)
   */
  async getCodigosLinha(data: string): Promise<CodigosLinha> {
    console.log(`📋 Buscando códigos de linha para: ${data}...`);
    const response = await this.api.get<CodigosLinha>(`/viagens-transdata/${data}/linhas`);
    console.log(`✅ ${response.data.total} códigos de linha encontrados`);
    return response.data;
  }

  /**
   * ✅ Obter serviços únicos para uma data (campo Servico)
   */
  async getServicosUnicos(data: string): Promise<ServicosUnicos> {
    console.log(`🚌 Buscando serviços únicos para: ${data}...`);
    const response = await this.api.get<ServicosUnicos>(`/viagens-transdata/${data}/servicos`);
    console.log(`✅ ${response.data.total} serviços únicos encontrados`);
    return response.data;
  }

  /**
   * ✅ Sincronizar viagens manualmente
   */
  async sincronizarViagens(data: string): Promise<SincronizacaoResult> {
    console.log(`🔄 Iniciando sincronização manual para: ${data}...`);
    const response = await this.api.post<SincronizacaoResult>(`/viagens-transdata/sincronizar/${data}`);
    console.log(`✅ Sincronização concluída: ${response.data.sincronizadas} viagens`);
    return response.data;
  }

  /**
   * ✅ Testar conexão com API Transdata
   */
  async testarConexaoTransdata(): Promise<TesteConexao> {
    console.log(`🔧 Testando conexão com API Transdata...`);
    const response = await this.api.get<TesteConexao>('/viagens-transdata/api/teste-conexao');
    console.log(`✅ Teste de conexão: ${response.data.success ? 'Sucesso' : 'Falha'}`);
    return response.data;
  }

  /**
   * ✅ Obter estatísticas da API Transdata
   */
  async getEstatisticasTransdata(): Promise<EstatisticasAPI> {
    console.log(`📊 Buscando estatísticas da API Transdata...`);
    const response = await this.api.get<EstatisticasAPI>('/viagens-transdata/api/estatisticas');
    console.log(`✅ Estatísticas obtidas`);
    return response.data;
  }

  // ===============================================
  // 🕐 CONTROLE DE HORÁRIOS - MÉTODOS NOVOS
  // ===============================================

  /**
   * ✅ Buscar controle de horários com filtros
   */
  async getControleHorarios(data: string, filtros: FiltrosControleHorarios = {}): Promise<ControleHorarioResponse> {
    console.log(`🕐 Buscando controle de horários para ${data}...`, filtros);
    
    const params = new URLSearchParams();
    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const queryString = params.toString();
    const url = `/controle-horarios/${data}${queryString ? `?${queryString}` : ''}`;
    
    const response = await this.api.get<ControleHorarioResponse>(url);
    console.log(`✅ ${response.data.data.length}/${response.data.total} controles encontrados`);
    return response.data;
  }

  /**
   * ✅ Salvar controle de horário individual
   */
  async salvarControleHorario(data: string, controle: SalvarControleHorario): Promise<{ success: boolean; message: string; data: any }> {
    console.log(`💾 Salvando controle para viagem ${controle.viagemGlobusId}...`);
    const response = await this.api.post(`/controle-horarios/${data}/salvar`, controle);
    console.log('✅ Controle salvo com sucesso');
    return response.data;
  }

  /**
   * ✅ Salvar múltiplos controles
   */
  async salvarMultiplosControles(dados: SalvarMultiplosControles): Promise<{ success: boolean; message: string; salvos: number; erros: number }> {
    console.log(`💾 Salvando ${dados.controles.length} controles para ${dados.dataReferencia}...`);
    const response = await this.api.post('/controle-horarios/salvar-multiplos', dados);
    console.log(`✅ Salvamento concluído: ${response.data.salvos} sucessos, ${response.data.erros} erros`);
    return response.data;
  }

  /**
   * ✅ Buscar opções para filtros
   */
  async getOpcoesControleHorarios(data: string): Promise<{ success: boolean; message: string; data: OpcoesControleHorarios }> {
    console.log(`🔍 Buscando opções de filtros para ${data}...`);
    const response = await this.api.get(`/controle-horarios/${data}/opcoes`);
    console.log('✅ Opções obtidas com sucesso');
    return response.data;
  }

  /**
   * ✅ Obter estatísticas do controle de horários
   */
  async getEstatisticasControleHorarios(data: string): Promise<{ success: boolean; message: string; data: EstatisticasControleHorarios }> {
    console.log(`📊 Buscando estatísticas de controle para ${data}...`);
    const response = await this.api.get(`/controle-horarios/${data}/estatisticas`);
    console.log('✅ Estatísticas obtidas');
    return response.data;
  }

  /**
   * ✅ Verificar status dos dados de controle
   */
  async getStatusControleHorarios(data: string): Promise<{ success: boolean; message: string; data: any; dataReferencia: string }> {
    console.log(`📊 Verificando status do controle para ${data}...`);
    const response = await this.api.get(`/controle-horarios/${data}/status`);
    console.log('✅ Status verificado');
    return response.data;
  }

  /**
   * ✅ Health check do módulo controle de horários
   */
  async checkHealthControleHorarios(): Promise<{ success: boolean; message: string; status: string; timestamp: string }> {
    console.log('🏥 Verificando saúde do módulo Controle de Horários...');
    const response = await this.api.get('/controle-horarios/health');
    console.log('✅ Health check do controle realizado');
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
    console.log(`�� Enviando e-mail de teste para: ${data.email}...`);
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

export const ApiService = new ApiServiceClass();