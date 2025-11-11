// src/viagens-transdata/services/transdata-api.service.ts

import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosResponse } from 'axios';

export interface TransdataApiResponse {
  SentidoText: string;
  InicioPrevistoText: string;
  InicioRealizadoText: string;
  FimPrevistoText: string;
  FimRealizadoText: string;
  PrefixoPrevisto: string;
  PrefixoRealizado: string;
  NomePI: string;
  NomePF: string;
  Servico: number;
  Trajeto: string;
  NomeMotorista: string;
  MatriculaMotorista: string;
  NomeCobrador: string;
  MatriculaCobrador: string;
  ParadasLbl: string;
  Link1Text: string;
  HistoricoLbl: string;
  Link2Text: string;
  ParcialmenteCumprida: number;
  NaoCumprida: number;
  ForadoHorarioInicio: number;
  ForadoHorarioFim: number;
  AtrasadoInicio: number;
  AtrasadoFim: number;
  AdiantadoInicio: number;
  AdiantadoFim: number;
  NaoCumpridoInicio: number;
  NaoCumpridoFim: number;
  IdLinha: number;
  NomeLinha: string;
  InicioPrevisto: string;
  InicioRealizado: string;
  StatusInicio: number;
  FimPrevisto: string;
  FimRealizado: string;
  StatusFim: number;
  Sentido: boolean;
  Viagem: number;
  PontosCumpridosPercentual: string;
  PontoFinal: string;
  ValidouPontosCumpridos: number;
  KMProgramado: string;
  KMRodado: string;
  Consolidad: number;
}

@Injectable()
export class TransdataApiService {
  private readonly logger = new Logger(TransdataApiService.name);
  private readonly httpClient: AxiosInstance;
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly retryAttempts: number;
  private readonly retryDelay: number;

  constructor(private configService: ConfigService) {
    this.baseUrl = 'https://its00078.itstransdata.com/ITS-InfoExport_CA06FCF3-D34E-4567-B069-153EA5085D80/api/Data';
    this.timeout = this.configService.get<number>('TRANSDATA_TIMEOUT', 90000);
    this.retryAttempts = this.configService.get<number>('TRANSDATA_RETRY_ATTEMPTS', 3);
    this.retryDelay = this.configService.get<number>('TRANSDATA_RETRY_DELAY', 2000);

    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Controle-Horarios-Backend/1.0'
      }
    });

    this.setupInterceptors();
  }

  /**
   * ✅ CONFIGURAR INTERCEPTADORES DE REQUEST/RESPONSE
   */
  private setupInterceptors(): void {
    // Request Interceptor
    this.httpClient.interceptors.request.use(
      (config) => {
        this.logger.debug(`[TRANSDATA] Fazendo requisição: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        this.logger.error(`[TRANSDATA] Erro na requisição: ${error.message}`);
        return Promise.reject(error);
      }
    );

    // Response Interceptor
    this.httpClient.interceptors.response.use(
      (response) => {
        this.logger.debug(`[TRANSDATA] Resposta recebida: ${response.status} - ${response.data?.length || 0} registros`);
        return response;
      },
      (error) => {
        this.logger.error(`[TRANSDATA] Erro na resposta: ${error.response?.status} - ${error.message}`);
        return Promise.reject(error);
      }
    );
  }

  /**
   * ✅ BUSCAR VIAGENS POR DATA
   */
  async buscarViagensPorData(data: string): Promise<TransdataApiResponse[]> {
    const dataFormatada = this.formatarDataParaApi(data);
    const endpoint = `/cumprimentoservico?dia=${dataFormatada}`;

    this.logger.log(`[TRANSDATA] Buscando viagens para data: ${dataFormatada}`);

    try {
      const response = await this.executarComRetry<TransdataApiResponse[]>(endpoint);
      
      this.logger.log(`[TRANSDATA] ✅ Sucesso: ${response.length} viagens encontradas para ${dataFormatada}`);
      
      return response;
    } catch (error) {
      this.logger.error(`[TRANSDATA] ❌ Erro ao buscar viagens para ${dataFormatada}:`, error.message);
      throw new HttpException(
        `Erro ao buscar dados da API Transdata: ${error.message}`,
        HttpStatus.BAD_GATEWAY
      );
    }
  }

  /**
   * ✅ TESTAR CONEXÃO COM A API
   */
  async testarConexao(): Promise<{ success: boolean; message: string; responseTime?: number }> {
    const startTime = Date.now();
    
    try {
      // Testa com data de hoje
      const hoje = new Date().toISOString().split('T')[0];
      const dataFormatada = this.formatarDataParaApi(hoje);
      
      await this.httpClient.get(`/cumprimentoservico?dia=${dataFormatada}`, {
        timeout: 20000 // Timeout menor para teste
      });
      
      const responseTime = Date.now() - startTime;
      
      this.logger.log(`[TRANSDATA] ✅ Conexão OK - Tempo: ${responseTime}ms`);
      
      return {
        success: true,
        message: 'Conexão com API Transdata OK',
        responseTime
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      this.logger.error(`[TRANSDATA] ❌ Falha na conexão - Tempo: ${responseTime}ms - Erro: ${error.message}`);
      
      return {
        success: false,
        message: `Falha na conexão: ${error.message}`,
        responseTime
      };
    }
  }

  /**
   * ✅ EXECUTAR REQUISIÇÃO COM RETRY AUTOMÁTICO
   */
  private async executarComRetry<T>(endpoint: string, tentativa: number = 1): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.httpClient.get(endpoint);
      return response.data;
    } catch (error) {
      if (tentativa < this.retryAttempts) {
        this.logger.warn(`[TRANSDATA] Tentativa ${tentativa}/${this.retryAttempts} falhou. Tentando novamente em ${this.retryDelay}ms...`);
        
        await this.delay(this.retryDelay);
        return this.executarComRetry<T>(endpoint, tentativa + 1);
      }
      
      throw error;
    }
  }

  /**
   * ✅ FORMATAR DATA PARA O PADRÃO DA API (YYYY-MM-DD) - CORRIGIDO
   */
  private formatarDataParaApi(data: string): string {
    // Se já está no formato correto YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      return data;
    }

    // Se está no formato DD/MM/YYYY (padrão brasileiro)
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(data)) {
      const [dia, mes, ano] = data.split('/');
      return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    }

    // Se está no formato DD-MM-YYYY
    if (/^\d{2}-\d{2}-\d{4}$/.test(data)) {
      const [dia, mes, ano] = data.split('-');
      return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    }

    // ✅ CORRIGIDO: Verificação de Date mais robusta
    try {
      const dateObj = new Date(data);
      if (!isNaN(dateObj.getTime())) {
        return dateObj.toISOString().split('T')[0];
      }
    } catch (error) {
      // Continua para o erro abaixo
    }

    throw new Error(`Formato de data inválido: ${data}. Use YYYY-MM-DD, DD/MM/YYYY ou DD-MM-YYYY`);
  }

  /**
   * ✅ DELAY PARA RETRY
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * ✅ VALIDAR SE DATA É VÁLIDA
   */
  validarData(data: string): boolean {
    try {
      this.formatarDataParaApi(data);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * ✅ OBTER ESTATÍSTICAS DA API
   */
  async obterEstatisticas(): Promise<{
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
    ultimaRequisicao?: string;
  }> {
    return {
      baseUrl: this.baseUrl,
      timeout: this.timeout,
      retryAttempts: this.retryAttempts,
      ultimaRequisicao: new Date().toISOString()
    };
  }
}