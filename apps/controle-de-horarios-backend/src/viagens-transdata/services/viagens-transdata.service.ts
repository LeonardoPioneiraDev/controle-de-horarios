// src/viagens-transdata/services/viagens-transdata.service.ts

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like, In } from 'typeorm';
import { ViagemTransdata } from '../entities/viagem-transdata.entity';
import { TransdataApiService, TransdataApiResponse } from './transdata-api.service';
import { FiltrosViagemTransdataDto } from '../dto/filtros-viagem-transdata.dto';
import { ResponsePaginadaDto } from '../dto/response-viagem-transdata.dto';
import * as crypto from 'crypto';

@Injectable()
export class ViagensTransdataService {
  private readonly logger = new Logger(ViagensTransdataService.name);

  constructor(
    @InjectRepository(ViagemTransdata)
    private viagensRepository: Repository<ViagemTransdata>,
    private transdataApiService: TransdataApiService,
  ) {}

  /**
   * ✅ BUSCAR TODAS AS VIAGENS DE UMA DATA (SEM FILTROS)
   */
  async buscarViagensPorData(data: string): Promise<ViagemTransdata[]> {
    this.logger.log(`[VIAGENS] Buscando viagens para data: ${data}`);

    // 1. Verificar se existem dados locais
    const viagensLocais = await this.buscarViagensLocais(data);
    
    if (viagensLocais.length > 0) {
      this.logger.log(`[VIAGENS] ✅ Encontradas ${viagensLocais.length} viagens locais para ${data}`);
      return viagensLocais;
    }

    // 2. Se não há dados locais, sincronizar automaticamente
    this.logger.log(`[VIAGENS] Dados não encontrados localmente. Sincronizando com API Transdata...`);
    await this.sincronizarViagensPorData(data);

    // 3. Retornar dados sincronizados
    const viagensSincronizadas = await this.buscarViagensLocais(data);
    this.logger.log(`[VIAGENS] ✅ Sincronização concluída: ${viagensSincronizadas.length} viagens`);
    
    return viagensSincronizadas;
  }

  /**
   * ✅ BUSCAR VIAGENS COM FILTROS APLICADOS
   */
  async buscarViagensComFiltros(
    data: string, 
    filtros: FiltrosViagemTransdataDto
  ): Promise<ResponsePaginadaDto<ViagemTransdata>> {
    this.logger.log(`[VIAGENS] Buscando viagens filtradas para data: ${data}`);

    // 1. Garantir que os dados existem localmente
    await this.buscarViagensPorData(data);

    // 2. Construir query com filtros
    const queryBuilder = this.viagensRepository
      .createQueryBuilder('viagem')
      .where('viagem.dataReferencia = :data', { data })
      .andWhere('viagem.isAtivo = :ativo', { ativo: true });

    // 3. Aplicar filtros
    this.aplicarFiltros(queryBuilder, filtros);

    // 4. Aplicar ordenação
    queryBuilder.orderBy('viagem.InicioPrevistoText', 'ASC');

    // 5. Aplicar paginação
    const page = filtros.page || 1;
    const limit = filtros.limit || 50;
    const skip = (page - 1) * limit;

    queryBuilder.skip(skip).take(limit);

    // 6. Executar query
    const [viagens, total] = await queryBuilder.getManyAndCount();

    this.logger.log(`[VIAGENS] ✅ Filtros aplicados: ${viagens.length}/${total} viagens encontradas`);

    return {
      data: viagens,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * ✅ SINCRONIZAÇÃO INTELIGENTE - VERSÃO OTIMIZADA
   */
  async sincronizarViagensPorData(data: string): Promise<{ 
    sincronizadas: number; 
    novas: number; 
    atualizadas: number;
    ignoradas: number;
    desativadas: number; // ✅ CORRIGIDO: Propriedade adicionada
    tempoProcessamento: number;
    isPrimeiraSincronizacao: boolean;
  }> {
    const inicioProcessamento = Date.now();
    this.logger.log(`[VIAGENS] 🔄 Iniciando sincronização inteligente para data: ${data}`);

    try {
      // 1. Verificar se já existem dados para esta data
      const existemDados = await this.verificarDadosExistem(data);
      const isPrimeiraSincronizacao = !existemDados;

      this.logger.log(`[VIAGENS] 📊 Tipo de sincronização: ${isPrimeiraSincronizacao ? 'PRIMEIRA (salvar tudo)' : 'INCREMENTAL (apenas mudanças)'}`);

      // 2. Buscar dados da API
      const dadosApi = await this.transdataApiService.buscarViagensPorData(data);
      
      if (!dadosApi || dadosApi.length === 0) {
        this.logger.warn(`[VIAGENS] ⚠️ Nenhum dado encontrado na API para ${data}`);
        return { 
          sincronizadas: 0, 
          novas: 0, 
          atualizadas: 0, 
          ignoradas: 0,
          desativadas: 0, // ✅ CORRIGIDO: Propriedade adicionada
          tempoProcessamento: Date.now() - inicioProcessamento,
          isPrimeiraSincronizacao
        };
      }

      this.logger.log(`[VIAGENS] 📊 API retornou ${dadosApi.length} viagens para processamento`);

      let resultado;

      if (isPrimeiraSincronizacao) {
        // ✅ PRIMEIRA SINCRONIZAÇÃO: SALVAR TUDO
        resultado = await this.executarPrimeiraSincronizacao(dadosApi, data);
      } else {
        // ✅ SINCRONIZAÇÃO INCREMENTAL: APENAS MUDANÇAS
        resultado = await this.executarSincronizacaoIncremental(dadosApi, data);
      }

      const tempoProcessamento = Date.now() - inicioProcessamento;

      this.logger.log(`[VIAGENS] ✅ Sincronização concluída em ${tempoProcessamento}ms:`);
      this.logger.log(`[VIAGENS]    📊 Total API: ${dadosApi.length}`);
      this.logger.log(`[VIAGENS]    ➕ Novas: ${resultado.novas}`);
      this.logger.log(`[VIAGENS]    🔄 Atualizadas: ${resultado.atualizadas}`);
      this.logger.log(`[VIAGENS]    ⏭️ Ignoradas: ${resultado.ignoradas}`);
      this.logger.log(`[VIAGENS]    🗑️ Desativadas: ${resultado.desativadas}`);

      return {
        sincronizadas: dadosApi.length,
        novas: resultado.novas,
        atualizadas: resultado.atualizadas,
        ignoradas: resultado.ignoradas,
        desativadas: resultado.desativadas,
        tempoProcessamento,
        isPrimeiraSincronizacao
      };

    } catch (error) {
      this.logger.error(`[VIAGENS] ❌ Erro na sincronização para ${data}:`, error.message);
      throw error;
    }
  }

  /**
   * ✅ PRIMEIRA SINCRONIZAÇÃO: SALVAR TODOS OS DADOS
   */
  private async executarPrimeiraSincronizacao(
    dadosApi: TransdataApiResponse[], 
    dataReferencia: string
  ): Promise<{ novas: number; atualizadas: number; ignoradas: number; desativadas: number }> {
    
    this.logger.log(`[VIAGENS] 🆕 Executando primeira sincronização - salvando ${dadosApi.length} viagens`);

    // Converter todos os dados da API para entidades
    const viagensParaSalvar = dadosApi.map(dadoApi => 
      this.mapearApiParaEntity(dadoApi, dataReferencia)
    );

    // Salvar em lotes para melhor performance
    const tamanhoLote = 500;
    let totalSalvas = 0;

    for (let i = 0; i < viagensParaSalvar.length; i += tamanhoLote) {
      const lote = viagensParaSalvar.slice(i, i + tamanhoLote);
      await this.viagensRepository.save(lote);
      totalSalvas += lote.length;

      this.logger.log(`[VIAGENS] 📈 Primeira sincronização - progresso: ${totalSalvas}/${viagensParaSalvar.length}`);
    }

    return {
      novas: totalSalvas,
      atualizadas: 0,
      ignoradas: 0,
      desativadas: 0 // ✅ CORRIGIDO: Propriedade adicionada
    };
  }

  /**
   * ✅ SINCRONIZAÇÃO INCREMENTAL: APENAS MUDANÇAS
   */
  private async executarSincronizacaoIncremental(
    dadosApi: TransdataApiResponse[], 
    dataReferencia: string
  ): Promise<{ novas: number; atualizadas: number; ignoradas: number; desativadas: number }> {
    
    this.logger.log(`[VIAGENS] 🔄 Executando sincronização incremental - verificando ${dadosApi.length} viagens`);

    // 1. Buscar todas as viagens existentes para esta data
    const viagensExistentes = await this.buscarViagensExistentesPorData(dataReferencia);
    const mapViagensExistentes = this.criarMapaViagensExistentes(viagensExistentes);

    this.logger.log(`[VIAGENS] 💾 Encontradas ${viagensExistentes.length} viagens existentes no banco`);

    // 2. Processar em lotes
    const tamanhoLote = 100;
    let novas = 0;
    let atualizadas = 0;
    let ignoradas = 0;
    const allProcessedIds: number[] = [];

    for (let i = 0; i < dadosApi.length; i += tamanhoLote) {
      const lote = dadosApi.slice(i, i + tamanhoLote);
      const resultadoLote = await this.processarLoteIncremental(lote, dataReferencia, mapViagensExistentes);
      
      novas += resultadoLote.novas;
      atualizadas += resultadoLote.atualizadas;
      ignoradas += resultadoLote.ignoradas;
      allProcessedIds.push(...resultadoLote.processedIds);

      const progresso = Math.min(i + tamanhoLote, dadosApi.length);
      this.logger.log(`[VIAGENS] 📈 Sincronização incremental - progresso: ${progresso}/${dadosApi.length}`);
    }

    // ✅ DESATIVAR VIAGENS REMOVIDAS DA API
    const viagensParaDesativar = await this.viagensRepository.find({
      where: {
        dataReferencia: dataReferencia,
        isAtivo: true,
        id: In(viagensExistentes.map(v => v.id).filter(id => !allProcessedIds.includes(id)))
      }
    });

    if (viagensParaDesativar.length > 0) {
      this.logger.log(`[VIAGENS] 🗑️ Desativando ${viagensParaDesativar.length} viagens que não estão mais na API Transdata.`);
      await this.viagensRepository.update(
        viagensParaDesativar.map(v => v.id),
        { isAtivo: false, updatedAt: new Date() }
      );
    }

    return { novas, atualizadas, ignoradas, desativadas: viagensParaDesativar.length };
  }

  /**
   * ✅ BUSCAR VIAGENS EXISTENTES POR DATA (OTIMIZADO)
   */
  private async buscarViagensExistentesPorData(data: string): Promise<ViagemTransdata[]> {
    return this.viagensRepository.find({
      where: {
        dataReferencia: data,
        isAtivo: true
      },
      select: [
        'id', 'IdLinha', 'Servico', 'Viagem', 'hashDados', 
        'InicioRealizadoText', 'FimRealizadoText', 'statusCumprimento',
        'PrefixoRealizado', 'NomeMotorista', 'NomeCobrador'
      ]
    });
  }

  /**
   * ✅ CRIAR MAPA DE VIAGENS EXISTENTES PARA BUSCA RÁPIDA
   */
  private criarMapaViagensExistentes(viagens: ViagemTransdata[]): Map<string, ViagemTransdata> {
    const mapa = new Map<string, ViagemTransdata>();
    
    viagens.forEach(viagem => {
      const chave = this.gerarChaveUnica(viagem.IdLinha, viagem.Servico, viagem.Viagem);
      mapa.set(chave, viagem);
    });

    return mapa;
  }

  /**
   * ✅ PROCESSAR LOTE INCREMENTAL
   */
  private async processarLoteIncremental(
    lote: TransdataApiResponse[], 
    dataReferencia: string,
    mapViagensExistentes: Map<string, ViagemTransdata>
  ): Promise<{ novas: number; atualizadas: number; ignoradas: number; processedIds: number[] }> {
    
    const viagensParaSalvar: ViagemTransdata[] = [];
    const processedIds: number[] = [];
    let novas = 0;
    let atualizadas = 0;
    let ignoradas = 0;

    for (const dadoApi of lote) {
      const chaveUnica = this.gerarChaveUnica(dadoApi.IdLinha, dadoApi.Servico, dadoApi.Viagem);
      const viagemExistente = mapViagensExistentes.get(chaveUnica);
      
      if (!viagemExistente) {
        // ✅ NOVA VIAGEM (não existia antes)
        const viagemEntity = this.mapearApiParaEntity(dadoApi, dataReferencia);
        viagensParaSalvar.push(viagemEntity);
        novas++;
      } else {
        // ✅ VERIFICAR SE PRECISA ATUALIZAR
        const viagemAtualizada = this.verificarEAtualizarSeNecessario(viagemExistente, dadoApi, dataReferencia);
        
        if (viagemAtualizada) {
          viagensParaSalvar.push(viagemAtualizada);
          atualizadas++;
        } else {
          ignoradas++;
        }
        processedIds.push(viagemExistente.id); // Add existing ID to processed list
      }
    }

    // Salvar apenas as viagens que precisam ser inseridas ou atualizadas
    if (viagensParaSalvar.length > 0) {
      const savedViagens = await this.viagensRepository.save(viagensParaSalvar);
      savedViagens.forEach(v => processedIds.push(v.id)); // Add new IDs to processed list
    }

    return { novas, atualizadas, ignoradas, processedIds };
  }

  /**
   * ✅ VERIFICAR E ATUALIZAR SE NECESSÁRIO
   */
  private verificarEAtualizarSeNecessario(
    viagemExistente: ViagemTransdata, 
    dadoApi: TransdataApiResponse,
    dataReferencia: string
  ): ViagemTransdata | null {
    
    // Campos que podem mudar e precisam ser verificados
    const camposParaVerificar = [
      'InicioRealizadoText',
      'FimRealizadoText', 
      'statusCumprimento',
      'PrefixoRealizado',
      'NomeMotorista',
      'NomeCobrador',
      'PontosCumpridosPercentual',
      'KMRodado'
    ];

    let houveAlteracao = false;

    // Verificar cada campo importante
    for (const campo of camposParaVerificar) {
      const valorExistente = viagemExistente[campo];
      const valorNovo = dadoApi[campo];

      // Comparar valores (considerando null, undefined e string vazia como equivalentes)
      if (this.valoresForamAlterados(valorExistente, valorNovo)) {
        houveAlteracao = true;
        break;
      }
    }

    if (!houveAlteracao) {
      return null; // Não precisa atualizar
    }

    // ✅ Houve alteração - criar entidade atualizada mantendo o ID
    const viagemAtualizada = this.mapearApiParaEntity(dadoApi, dataReferencia);
    viagemAtualizada.id = viagemExistente.id; // Manter o ID existente
    viagemAtualizada.createdAt = viagemExistente.createdAt; // Manter data de criação
    viagemAtualizada.ultimaSincronizacao = new Date(); // Atualizar timestamp

    return viagemAtualizada;
  }

  /**
   * ✅ VERIFICAR SE VALORES FORAM ALTERADOS
   */
  private valoresForamAlterados(valorExistente: any, valorNovo: any): boolean {
    // Normalizar valores vazios
    const normalizar = (valor: any): string => {
      if (valor === null || valor === undefined || valor === '') {
        return '';
      }
      return String(valor).trim();
    };

    return normalizar(valorExistente) !== normalizar(valorNovo);
  }

  /**
   * ✅ GERAR CHAVE ÚNICA PARA VIAGEM
   */
  private gerarChaveUnica(idLinha: number, servico: number, viagem: number): string {
    return `${idLinha}-${servico}-${viagem}`;
  }

  /**
   * ✅ MAPEAR DADOS DA API PARA ENTITY
   */
  private mapearApiParaEntity(
    dadoApi: TransdataApiResponse, 
    dataReferencia: string
  ): ViagemTransdata {
    const viagem = new ViagemTransdata();
    
    // Campos de controle
    viagem.dataReferencia = dataReferencia;
    viagem.ultimaSincronizacao = new Date();
    viagem.isAtivo = true;
    
    // Gerar hash dos dados para comparação futura
    viagem.hashDados = this.gerarHashDados(dadoApi);
    
    // Mapear todos os campos da API
    Object.assign(viagem, dadoApi);
    
    return viagem;
  }

  /**
   * ✅ GERAR HASH DOS DADOS PARA COMPARAÇÃO
   */
  private gerarHashDados(dadoApi: TransdataApiResponse): string {
    const dadosParaHash = {
      IdLinha: dadoApi.IdLinha,
      Servico: dadoApi.Servico,
      Viagem: dadoApi.Viagem,
      InicioRealizadoText: dadoApi.InicioRealizadoText,
      FimRealizadoText: dadoApi.FimRealizadoText,
      statusCumprimento: (dadoApi as any).statusCumprimento || 'PENDENTE',
      PrefixoRealizado: dadoApi.PrefixoRealizado,
      NomeMotorista: dadoApi.NomeMotorista,
      NomeCobrador: dadoApi.NomeCobrador
    };

    return crypto
      .createHash('md5')
      .update(JSON.stringify(dadosParaHash))
      .digest('hex');
  }

  /**
   * ✅ APLICAR FILTROS NA QUERY
   */
  private aplicarFiltros(queryBuilder: any, filtros: FiltrosViagemTransdataDto): void {
    if (filtros.codigoLinha) {
      queryBuilder.andWhere('viagem.codigoLinha = :codigoLinha', { 
        codigoLinha: filtros.codigoLinha 
      });
    }

    if (filtros.servico) {
      queryBuilder.andWhere('viagem.Servico = :servico', { 
        servico: filtros.servico 
      });
    }

    if (filtros.sentido) {
      queryBuilder.andWhere('viagem.SentidoText = :sentido', { 
        sentido: filtros.sentido 
      });
    }

    if (filtros.pontoFinal) {
      queryBuilder.andWhere('viagem.PontoFinal = :pontoFinal', { 
        pontoFinal: filtros.pontoFinal 
      });
    }

    if (filtros.statusCumprimento) {
      queryBuilder.andWhere('viagem.statusCumprimento = :status', { 
        status: filtros.statusCumprimento 
      });
    }

    if (filtros.nomeLinha) {
      queryBuilder.andWhere('viagem.NomeLinha ILIKE :nomeLinha', { 
        nomeLinha: `%${filtros.nomeLinha}%` 
      });
    }

    if (filtros.prefixoRealizado) {
      queryBuilder.andWhere('viagem.PrefixoRealizado ILIKE :prefixoRealizado', {
        prefixoRealizado: `%${filtros.prefixoRealizado}%`
      });
    }

    if (filtros.nomeMotorista) {
      queryBuilder.andWhere('viagem.NomeMotorista ILIKE :nomeMotorista', {
        nomeMotorista: `%${filtros.nomeMotorista}%`
      });
    }

    if (filtros.somenteAtrasados) {
      queryBuilder.andWhere('viagem.AtrasadoInicio = :atrasado', { atrasado: 1 });
    }

    if (filtros.horarioInicio) {
      queryBuilder.andWhere('viagem.InicioPrevistoText >= :horarioInicio', { 
        horarioInicio: filtros.horarioInicio 
      });
    }

    if (filtros.horarioFim) {
      queryBuilder.andWhere('viagem.InicioPrevistoText <= :horarioFim', { 
        horarioFim: filtros.horarioFim 
      });
    }
  }

  /**
   * ✅ BUSCAR VIAGENS LOCAIS POR DATA
   */
  private async buscarViagensLocais(data: string): Promise<ViagemTransdata[]> {
    return this.viagensRepository.find({
      where: {
        dataReferencia: data,
        isAtivo: true
      },
      order: {
        InicioPrevistoText: 'ASC'
      }
    });
  }

  /**
   * ✅ OBTER CÓDIGOS DE LINHA ÚNICOS POR DATA
   */
  async obterCodigosLinha(data: string): Promise<string[]> {
    const result = await this.viagensRepository
      .createQueryBuilder('viagem')
      .select('DISTINCT viagem.codigoLinha', 'codigoLinha')
      .where('viagem.dataReferencia = :data', { data })
      .andWhere('viagem.isAtivo = :ativo', { ativo: true })
      .andWhere('viagem.codigoLinha IS NOT NULL')
      .andWhere('viagem.codigoLinha != :empty', { empty: '' }) // ✅ CORRIGIDO: SQL syntax
      .orderBy('codigoLinha', 'ASC')
      .getRawMany();

    return result.map(r => r.codigoLinha);
  }

  /**
   * ✅ OBTER SERVIÇOS ÚNICOS POR DATA
   */
  async obterServicos(data: string): Promise<number[]> {
    const result = await this.viagensRepository
      .createQueryBuilder('viagem')
      .select('DISTINCT viagem.Servico', 'servico')
      .where('viagem.dataReferencia = :data', { data })
      .andWhere('viagem.isAtivo = :ativo', { ativo: true })
      .andWhere('viagem.Servico IS NOT NULL')
      .orderBy('viagem.Servico', 'ASC')
      .getRawMany();

    return result.map(r => r.servico);
  }

  /**
   * ✅ VERIFICAR SE EXISTEM DADOS PARA UMA DATA
   */
  async verificarDadosExistem(data: string): Promise<boolean> {
    const count = await this.viagensRepository.count({
      where: {
        dataReferencia: data,
        isAtivo: true
      }
    });

    return count > 0;
  }
}