// src/comparacao-viagens/services/comparacao-viagens.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ComparacaoViagem, StatusComparacao } from '../entities/comparacao-viagem.entity';
import { ViagemTransdata } from '../../viagens-transdata/entities/viagem-transdata.entity';
import { ViagemGlobus } from '../../viagens-globus/entities/viagem-globus.entity';
import { FiltrosComparacaoDto, ResultadoComparacaoDto } from '../dto';

@Injectable()
export class ComparacaoViagensService {
  private readonly logger = new Logger(ComparacaoViagensService.name);

  constructor(
    @InjectRepository(ComparacaoViagem)
    private readonly comparacaoRepository: Repository<ComparacaoViagem>,
    @InjectRepository(ViagemTransdata)
    private readonly transdataRepository: Repository<ViagemTransdata>,
    @InjectRepository(ViagemGlobus)
    private readonly globusRepository: Repository<ViagemGlobus>,
  ) {}

  /**
   * Executa comparação completa entre Transdata e Globus para uma data
   */
  async executarComparacao(dataReferencia: string): Promise<ResultadoComparacaoDto> {
    const inicioProcessamento = Date.now();
    this.logger.log(`🔄 Iniciando comparação para data: ${dataReferencia}`);

    try {
      // 1. Limpar comparações existentes da data
      await this.limparComparacoesExistentes(dataReferencia);

      // 2. Buscar dados das duas fontes
      const [viagensTransdata, viagensGlobus] = await Promise.all([
        this.buscarViagensTransdata(dataReferencia),
        this.buscarViagensGlobus(dataReferencia)
      ]);

      this.logger.log(`📊 Dados encontrados - Transdata: ${viagensTransdata.length}, Globus: ${viagensGlobus.length}`);

      // 3. Criar mapas para comparação eficiente
      const mapaTransdata = this.criarMapaTransdata(viagensTransdata);
      const mapaGlobus = this.criarMapaGlobus(viagensGlobus);

      this.logger.log(`🗺️ Mapas criados - Transdata: ${mapaTransdata.size}, Globus: ${mapaGlobus.size}`);

      // 4. Executar comparações
      const comparacoes: ComparacaoViagem[] = [];

      // Comparar dados que existem em ambas as fontes
      for (const [chave, transdata] of mapaTransdata.entries()) {
        const globus = mapaGlobus.get(chave);
        
        if (globus) {
          // Existe em ambas - comparar
          const comparacao = await this.compararViagens(dataReferencia, transdata, globus);
          comparacoes.push(comparacao);
          mapaGlobus.delete(chave); // Remove para não processar novamente
        } else {
          // Existe apenas no Transdata
          const comparacao = this.criarComparacaoApenasTransdata(dataReferencia, transdata);
          comparacoes.push(comparacao);
        }
      }

      // Processar dados que existem apenas no Globus
      for (const [chave, globus] of mapaGlobus.entries()) {
        const comparacao = this.criarComparacaoApenasGlobus(dataReferencia, globus);
        comparacoes.push(comparacao);
      }

      this.logger.log(`📋 Total de comparações geradas: ${comparacoes.length}`);

      // 5. Salvar todas as comparações
      await this.salvarComparacoes(comparacoes);

      // 6. Gerar estatísticas
      const resultado = await this.gerarEstatisticas(dataReferencia, inicioProcessamento);
      
      this.logger.log(`✅ Comparação concluída: ${resultado.totalComparacoes} registros processados`);
      return resultado;

    } catch (error) {
      this.logger.error(`❌ Erro na comparação: ${error.message}`);
      throw error;
    }
  }

  /**
   * Mapeia sentido do Globus para Transdata
   */
  private mapearSentidoGlobusParaTransdata(sentidoGlobus: string): string {
    const mapeamento = {
      'I': 'IDA',
      'V': 'VOLTA',
      'C': 'CIRCULAR' // Circular não existe no Transdata, mas mantemos para análise
    };
    return mapeamento[sentidoGlobus] || sentidoGlobus;
  }

  /**
   * Verifica compatibilidade de sentido
   */
  private verificarCompatibilidadeSentido(sentidoTransdata: string, sentidoGlobus: string): boolean {
    const sentidoGlobusMapeado = this.mapearSentidoGlobusParaTransdata(sentidoGlobus);
    
    // Circular no Globus não tem equivalente no Transdata
    if (sentidoGlobus === 'C') {
      return false;
    }
    
    // Normalizar strings para comparação (remover espaços e converter para maiúsculo)
    const sentidoTransdataNorm = sentidoTransdata?.trim().toUpperCase();
    const sentidoGlobusNorm = sentidoGlobusMapeado?.trim().toUpperCase();
    
    return sentidoTransdataNorm === sentidoGlobusNorm;
  }

  /**
   * Calcula diferença entre horários em minutos
   */
  private calcularDiferencaHorario(horario1: string, horario2: string): number {
    try {
      if (!horario1 || !horario2) return -1;
      
      // Extrair apenas HH:mm se o formato for HH:mm:ss
      const h1Clean = horario1.substring(0, 5); // Pega apenas HH:mm
      const h2Clean = horario2.substring(0, 5); // Pega apenas HH:mm
      
      const [h1, m1] = h1Clean.split(':').map(Number);
      const [h2, m2] = h2Clean.split(':').map(Number);
      
      const minutos1 = h1 * 60 + m1;
      const minutos2 = h2 * 60 + m2;
      
      return Math.abs(minutos1 - minutos2);
    } catch (error) {
      this.logger.warn(`Erro ao calcular diferença de horário: ${horario1} vs ${horario2}`);
      return -1; // Erro na conversão
    }
  }

  /**
   * Compara duas viagens (uma de cada fonte)
   */
  private async compararViagens(
    dataReferencia: string,
    transdata: ViagemTransdata,
    globus: ViagemGlobus
  ): Promise<ComparacaoViagem> {
    const comparacao = new ComparacaoViagem();
    
    // Dados básicos
    comparacao.dataReferencia = dataReferencia;
    comparacao.codigoLinha = transdata.codigoLinha || globus.codigoLinha;
    comparacao.nomeLinhaTransdata = transdata.NomeLinha;
    comparacao.nomeLinhaGlobus = globus.nomeLinha;

    // ✅ DADOS TRANSDATA - USANDO NOMES CORRETOS DA ENTIDADE
    comparacao.transdataId = transdata.id.toString();
    comparacao.transdataServico = transdata.Servico?.toString();
    comparacao.transdataSentido = transdata.SentidoText;
    comparacao.transdataHorarioPrevisto = transdata.InicioPrevisto;
    comparacao.transdataHorarioRealizado = transdata.InicioRealizado;

    // ✅ DADOS GLOBUS - USANDO NOMES CORRETOS DA ENTIDADE
    comparacao.globusId = globus.id;
    comparacao.globusServico = globus.codServicoNumero;
    comparacao.globusSentidoFlag = globus.flgSentido;
    comparacao.globusSentidoTexto = globus.sentidoTexto;
    comparacao.globusHorarioSaida = globus.horSaidaTime;
    comparacao.globusSetor = globus.setorPrincipal;

    // ✅ ANÁLISES DE COMPATIBILIDADE
    
    // 1. Compatibilidade de sentido
    comparacao.sentidoCompativel = this.verificarCompatibilidadeSentido(
      transdata.SentidoText,
      globus.flgSentido
    );

    // 2. Compatibilidade de serviço
    comparacao.servicoCompativel = transdata.Servico?.toString() === globus.codServicoNumero;

    // 3. Compatibilidade de horário (Transdata: InicioPrevisto vs Globus: horSaidaTime)
    if (transdata.InicioPrevisto && globus.horSaidaTime) {
      comparacao.diferencaHorarioMinutos = this.calcularDiferencaHorario(
        transdata.InicioPrevisto,
        globus.horSaidaTime
      );
      // Considera compatível se diferença <= 5 minutos
      comparacao.horarioCompativel = comparacao.diferencaHorarioMinutos >= 0 && comparacao.diferencaHorarioMinutos <= 5;
    } else {
      comparacao.horarioCompativel = false;
      comparacao.diferencaHorarioMinutos = -1;
    }

    // ✅ STATUS GERAL DA COMPARAÇÃO
    if (comparacao.sentidoCompativel && comparacao.servicoCompativel && comparacao.horarioCompativel) {
      comparacao.statusComparacao = StatusComparacao.COMPATIVEL;
    } else if (!comparacao.horarioCompativel && comparacao.sentidoCompativel && comparacao.servicoCompativel) {
      comparacao.statusComparacao = StatusComparacao.HORARIO_DIVERGENTE;
    } else {
      comparacao.statusComparacao = StatusComparacao.DIVERGENTE;
    }

    // ✅ OBSERVAÇÕES DETALHADAS
    const observacoes = [];
    
    if (!comparacao.sentidoCompativel) {
      observacoes.push(`Sentido divergente: ${transdata.SentidoText} vs ${globus.sentidoTexto} (${globus.flgSentido})`);
    }
    
    if (!comparacao.servicoCompativel) {
      observacoes.push(`Serviço divergente: ${transdata.Servico} vs ${globus.codServicoNumero}`);
    }
    
    if (!comparacao.horarioCompativel && comparacao.diferencaHorarioMinutos > 0) {
      observacoes.push(`Diferença horário: ${comparacao.diferencaHorarioMinutos} minutos (${transdata.InicioPrevisto} vs ${globus.horSaidaTime})`);
    }
    
    if (observacoes.length === 0) {
      observacoes.push('Viagens compatíveis em todos os aspectos');
    }
    
    comparacao.observacoes = observacoes.join('; ');

    return comparacao;
  }

  /**
   * Cria chave única para comparação (linha + serviço + sentido + horário aproximado)
   */
  private criarChaveComparacao(
    codigoLinha: string,
    servico: string,
    sentido: string,
    horario: string
  ): string {
    if (!codigoLinha || !servico || !sentido || !horario) {
      return null;
    }
    
    // Arredonda horário para múltiplos de 5 minutos para permitir pequenas variações
    const horarioArredondado = this.arredondarHorario(horario);
    return `${codigoLinha}_${servico}_${sentido}_${horarioArredondado}`;
  }

  /**
   * Arredonda horário para múltiplos de 5 minutos
   */
  private arredondarHorario(horario: string): string {
    try {
      if (!horario) return '';
      
      // Extrair apenas HH:mm se o formato for HH:mm:ss
      const horarioLimpo = horario.substring(0, 5);
      const [h, m] = horarioLimpo.split(':').map(Number);
      
      if (isNaN(h) || isNaN(m)) return horario;
      
      const minutosArredondados = Math.round(m / 5) * 5;
      return `${h.toString().padStart(2, '0')}:${minutosArredondados.toString().padStart(2, '0')}`;
    } catch {
      return horario;
    }
  }

  /**
   * Cria mapa de viagens Transdata para comparação eficiente
   */
  private criarMapaTransdata(viagens: ViagemTransdata[]): Map<string, ViagemTransdata> {
    const mapa = new Map<string, ViagemTransdata>();
    
    for (const viagem of viagens) {
      if (viagem.codigoLinha && viagem.Servico && viagem.SentidoText && viagem.InicioPrevisto) {
        const chave = this.criarChaveComparacao(
          viagem.codigoLinha,
          viagem.Servico.toString(),
          viagem.SentidoText.trim().toUpperCase(),
          viagem.InicioPrevisto
        );
        
        if (chave) {
          mapa.set(chave, viagem);
        }
      }
    }
    
    this.logger.log(`📋 Mapa Transdata criado: ${mapa.size} entradas válidas de ${viagens.length} viagens`);
    return mapa;
  }

  /**
   * Cria mapa de viagens Globus para comparação eficiente
   */
  private criarMapaGlobus(viagens: ViagemGlobus[]): Map<string, ViagemGlobus> {
    const mapa = new Map<string, ViagemGlobus>();
    
    for (const viagem of viagens) {
      if (viagem.codigoLinha && viagem.codServicoNumero && viagem.flgSentido && viagem.horSaidaTime) {
        const sentidoMapeado = this.mapearSentidoGlobusParaTransdata(viagem.flgSentido);
        const chave = this.criarChaveComparacao(
          viagem.codigoLinha,
          viagem.codServicoNumero,
          sentidoMapeado.trim().toUpperCase(),
          viagem.horSaidaTime
        );
        
        if (chave) {
          mapa.set(chave, viagem);
        }
      }
    }
    
    this.logger.log(`📋 Mapa Globus criado: ${mapa.size} entradas válidas de ${viagens.length} viagens`);
    return mapa;
  }

  /**
   * Busca viagens do Transdata para uma data - ✅ USANDO NOMES CORRETOS
   */
  private async buscarViagensTransdata(dataReferencia: string): Promise<ViagemTransdata[]> {
    return await this.transdataRepository.find({
      where: { 
        dataReferencia,
        isAtivo: true // Apenas viagens ativas
      },
      select: [
        'id', 'codigoLinha', 'NomeLinha', 'Servico', 'SentidoText',
        'InicioPrevisto', 'InicioRealizado', 'dataReferencia', 'statusCumprimento'
      ]
    });
  }

  /**
   * Busca viagens do Globus para uma data - ✅ USANDO NOMES CORRETOS
   */
  private async buscarViagensGlobus(dataReferencia: string): Promise<ViagemGlobus[]> {
    return await this.globusRepository.find({
      where: { dataReferencia },
      select: [
        'id', 'codigoLinha', 'nomeLinha', 'codServicoNumero', 'flgSentido',
        'sentidoTexto', 'horSaidaTime', 'setorPrincipal', 'dataReferencia',
        'nomeMotorista', 'localOrigemViagem'
      ]
    });
  }

  /**
   * Cria comparação para viagem que existe apenas no Transdata
   */
  private criarComparacaoApenasTransdata(
    dataReferencia: string,
    transdata: ViagemTransdata
  ): ComparacaoViagem {
    const comparacao = new ComparacaoViagem();
    
    comparacao.dataReferencia = dataReferencia;
    comparacao.codigoLinha = transdata.codigoLinha;
    comparacao.nomeLinhaTransdata = transdata.NomeLinha;
    comparacao.transdataId = transdata.id.toString();
    comparacao.transdataServico = transdata.Servico?.toString();
    comparacao.transdataSentido = transdata.SentidoText;
    comparacao.transdataHorarioPrevisto = transdata.InicioPrevisto;
    comparacao.transdataHorarioRealizado = transdata.InicioRealizado;
    
    comparacao.statusComparacao = StatusComparacao.APENAS_TRANSDATA;
    comparacao.observacoes = `Viagem encontrada apenas no Transdata - Status: ${transdata.statusCumprimento}`;
    
    return comparacao;
  }

  /**
   * Cria comparação para viagem que existe apenas no Globus
   */
  private criarComparacaoApenasGlobus(
    dataReferencia: string,
    globus: ViagemGlobus
  ): ComparacaoViagem {
    const comparacao = new ComparacaoViagem();
    
    comparacao.dataReferencia = dataReferencia;
    comparacao.codigoLinha = globus.codigoLinha;
    comparacao.nomeLinhaGlobus = globus.nomeLinha;
    comparacao.globusId = globus.id;
    comparacao.globusServico = globus.codServicoNumero;
    comparacao.globusSentidoFlag = globus.flgSentido;
    comparacao.globusSentidoTexto = globus.sentidoTexto;
    comparacao.globusHorarioSaida = globus.horSaidaTime;
    comparacao.globusSetor = globus.setorPrincipal;
    
    comparacao.statusComparacao = StatusComparacao.APENAS_GLOBUS;
    comparacao.observacoes = `Viagem encontrada apenas no Globus - Setor: ${globus.setorPrincipal}`;
    
    return comparacao;
  }

  /**
   * Salva comparações em lotes para melhor performance
   */
  private async salvarComparacoes(comparacoes: ComparacaoViagem[]): Promise<void> {
    if (comparacoes.length === 0) {
      this.logger.warn('Nenhuma comparação para salvar');
      return;
    }

    const batchSize = 100;
    let salvos = 0;
    
    for (let i = 0; i < comparacoes.length; i += batchSize) {
      const batch = comparacoes.slice(i, i + batchSize);
      
      try {
        await this.comparacaoRepository.save(batch);
        salvos += batch.length;
        
        if (salvos % 1000 === 0 || salvos === comparacoes.length) {
          this.logger.log(`📊 Salvos ${salvos}/${comparacoes.length} comparações...`);
        }
      } catch (error) {
        this.logger.error(`Erro ao salvar lote ${i}-${i + batch.length}: ${error.message}`);
        throw error;
      }
    }
    
    this.logger.log(`✅ Total de ${salvos} comparações salvas com sucesso`);
  }

  /**
   * Limpa comparações existentes para uma data
   */
  private async limparComparacoesExistentes(dataReferencia: string): Promise<void> {
    const deletados = await this.comparacaoRepository.delete({ dataReferencia });
    this.logger.log(`🧹 ${deletados.affected || 0} comparações existentes removidas para ${dataReferencia}`);
  }

  /**
   * Gera estatísticas da comparação
   */
  private async gerarEstatisticas(
    dataReferencia: string,
    inicioProcessamento: number
  ): Promise<ResultadoComparacaoDto> {
    const stats = await this.comparacaoRepository
      .createQueryBuilder('comp')
      .select([
        'COUNT(*) as total',
        'SUM(CASE WHEN comp.statusComparacao = :compativel THEN 1 ELSE 0 END) as compativeis',
        'SUM(CASE WHEN comp.statusComparacao = :divergente THEN 1 ELSE 0 END) as divergentes',
        'SUM(CASE WHEN comp.statusComparacao = :apenasTransdata THEN 1 ELSE 0 END) as apenasTransdata',
        'SUM(CASE WHEN comp.statusComparacao = :apenasGlobus THEN 1 ELSE 0 END) as apenasGlobus',
        'SUM(CASE WHEN comp.statusComparacao = :horarioDivergente THEN 1 ELSE 0 END) as horarioDivergente',
        'COUNT(DISTINCT comp.codigoLinha) as linhasAnalisadas'
      ])
      .where('comp.dataReferencia = :dataReferencia', { dataReferencia })
      .setParameters({
        compativel: StatusComparacao.COMPATIVEL,
        divergente: StatusComparacao.DIVERGENTE,
        apenasTransdata: StatusComparacao.APENAS_TRANSDATA,
        apenasGlobus: StatusComparacao.APENAS_GLOBUS,
        horarioDivergente: StatusComparacao.HORARIO_DIVERGENTE
      })
      .getRawOne();

    const total = parseInt(stats.total) || 0;
    const compativeis = parseInt(stats.compativeis) || 0;
    const tempoProcessamento = ((Date.now() - inicioProcessamento) / 1000).toFixed(2);

    return {
      totalComparacoes: total,
      compativeis,
      divergentes: parseInt(stats.divergentes) || 0,
      apenasTransdata: parseInt(stats.apenasTransdata) || 0,
      apenasGlobus: parseInt(stats.apenasGlobus) || 0,
      horarioDivergente: parseInt(stats.horarioDivergente) || 0,
      percentualCompatibilidade: total > 0 ? Math.round((compativeis / total) * 100) : 0,
      linhasAnalisadas: parseInt(stats.linhasAnalisadas) || 0,
      tempoProcessamento: `${tempoProcessamento}s`
    };
  }

  /**
   * Busca comparações com filtros
   */
  async buscarComparacoes(
    dataReferencia: string,
    filtros: FiltrosComparacaoDto
  ): Promise<{ comparacoes: ComparacaoViagem[]; total: number }> {
    const queryBuilder = this.comparacaoRepository
      .createQueryBuilder('comp')
      .where('comp.dataReferencia = :dataReferencia', { dataReferencia });

    // Aplicar filtros
    if (filtros.codigoLinha) {
      queryBuilder.andWhere('comp.codigoLinha = :codigoLinha', { 
        codigoLinha: filtros.codigoLinha 
      });
    }

    if (filtros.statusComparacao) {
      queryBuilder.andWhere('comp.statusComparacao = :status', { 
        status: filtros.statusComparacao 
      });
    }

    if (filtros.globusSetor) {
      queryBuilder.andWhere('comp.globusSetor = :setor', { 
        setor: filtros.globusSetor 
      });
    }

    if (filtros.sentidoCompativel !== undefined) {
      queryBuilder.andWhere('comp.sentidoCompativel = :sentidoCompativel', { 
        sentidoCompativel: filtros.sentidoCompativel 
      });
    }

    if (filtros.horarioCompativel !== undefined) {
      queryBuilder.andWhere('comp.horarioCompativel = :horarioCompativel', { 
        horarioCompativel: filtros.horarioCompativel 
      });
    }

    if (filtros.servicoCompativel !== undefined) {
      queryBuilder.andWhere('comp.servicoCompativel = :servicoCompativel', { 
        servicoCompativel: filtros.servicoCompativel 
      });
    }

    // Contagem total
    const total = await queryBuilder.getCount();

    // Aplicar limite e ordenação
    const limite = parseInt(filtros.limite) || 100;
    queryBuilder
      .orderBy('comp.statusComparacao', 'ASC')
      .addOrderBy('comp.codigoLinha', 'ASC')
      .addOrderBy('comp.transdataHorarioPrevisto', 'ASC')
      .limit(limite);

    const comparacoes = await queryBuilder.getMany();

    return { comparacoes, total };
  }

  /**
   * Obtém estatísticas de uma data específica
   */
  async obterEstatisticas(dataReferencia: string): Promise<ResultadoComparacaoDto | null> {
    const existeComparacao = await this.comparacaoRepository.findOne({
      where: { dataReferencia }
    });

    if (!existeComparacao) {
      return null;
    }

    return await this.gerarEstatisticas(dataReferencia, Date.now());
  }

  /**
   * Obtém códigos de linha únicos para uma data
   */
  async obterCodigosLinha(dataReferencia: string): Promise<string[]> {
    const result = await this.comparacaoRepository
      .createQueryBuilder('comp')
      .select('DISTINCT comp.codigoLinha', 'codigoLinha')
      .where('comp.dataReferencia = :dataReferencia', { dataReferencia })
      .orderBy('comp.codigoLinha', 'ASC')
      .getRawMany();

    return result.map(item => item.codigoLinha).filter(Boolean);
  }

  /**
   * Obtém setores únicos para uma data
   */
  async obterSetores(dataReferencia: string): Promise<string[]> {
    const result = await this.comparacaoRepository
      .createQueryBuilder('comp')
      .select('DISTINCT comp.globusSetor', 'setor')
      .where('comp.dataReferencia = :dataReferencia', { dataReferencia })
      .andWhere('comp.globusSetor IS NOT NULL')
      .orderBy('comp.globusSetor', 'ASC')
      .getRawMany();

    return result.map(item => item.setor).filter(Boolean);
  }
}