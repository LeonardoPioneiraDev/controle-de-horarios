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
   * ✅ Normalizar código da linha (remover zeros à esquerda)
   */
  private normalizarCodigoLinha(codigo: string): string {
    if (!codigo) return '';
    const apenasNumeros = codigo.match(/^\d+/);
    if (!apenasNumeros) return '';
    let normalizado = apenasNumeros[0].replace(/^0+/, '');
    return !normalizado ? '0' : normalizado;
  }

  /**
   * ✅ Normalizar serviço (remover zeros à esquerda)
   */
  private normalizarServico(servico: string | number): string {
    if (servico === null || servico === undefined) return '';
    let servicoStr = servico.toString().trim().replace(/^0+/, '');
    return !servicoStr ? '0' : servicoStr;
  }

  /**
   * ✅ Limpar horário (remover segundos)
   */
  private limparHorario(horario: string): string {
    if (!horario) return '';
    
    try {
      let horarioLimpo = horario.trim();
      
      if (horarioLimpo.length === 8 && horarioLimpo.split(':').length === 3) {
        horarioLimpo = horarioLimpo.substring(0, 5);
      }
      
      const regexHorario = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      return regexHorario.test(horarioLimpo) ? horarioLimpo : '';
    } catch (error) {
      return '';
    }
  }

  /**
   * ✅ Mapear sentido do Globus para Transdata
   */
  private mapearSentidoGlobusParaTransdata(sentidoGlobus: string): string {
    if (!sentidoGlobus) return '';
    
    const sentidoNormalizado = sentidoGlobus.trim().toUpperCase();
    
    const mapeamento = {
      'I': 'IDA',
      'V': 'VOLTA', 
      'C': 'IDA',
      'CIRCULAR': 'IDA'
    };
    
    return mapeamento[sentidoNormalizado] || sentidoNormalizado;
  }

  /**
   * ✅ Calcular diferença entre horários
   */
  private calcularDiferencaHorario(horario1: string, horario2: string): number {
    try {
      if (!horario1 || !horario2) return -1;
      
      const h1Clean = this.limparHorario(horario1);
      const h2Clean = this.limparHorario(horario2);
      
      if (!h1Clean || !h2Clean) return -1;
      
      const [h1, m1] = h1Clean.split(':').map(Number);
      const [h2, m2] = h2Clean.split(':').map(Number);
      
      const minutos1 = h1 * 60 + m1;
      const minutos2 = h2 * 60 + m2;
      
      return Math.abs(minutos1 - minutos2);
    } catch (error) {
      return -1;
    }
  }

  /**
   * 🆕 NOVA FUNÇÃO: Calcular score de compatibilidade entre duas viagens
   */
  private calcularScoreCompatibilidade(
    transdata: ViagemTransdata,
    globus: ViagemGlobus
  ): { score: number; detalhes: any } {
    let score = 0;
    const detalhes = {
      linhaMesma: false,
      servicoMesmo: false,
      sentidoMesmo: false,
      diferencaHorario: -1,
      horarioCompativel: false
    };

    // 1. Verificar linha (peso: 40 pontos)
    const linhaTd = this.normalizarCodigoLinha(transdata.codigoLinha);
    const linhaGb = this.normalizarCodigoLinha(globus.codigoLinha);
    if (linhaTd === linhaGb) {
      score += 40;
      detalhes.linhaMesma = true;
    }

    // 2. Verificar sentido (peso: 30 pontos)
    const sentidoTd = transdata.SentidoText.trim().toUpperCase();
    const sentidoGb = this.mapearSentidoGlobusParaTransdata(globus.flgSentido);
    if (sentidoTd === sentidoGb) {
      score += 30;
      detalhes.sentidoMesmo = true;
    }

    // 3. Verificar serviço (peso: 20 pontos)
    const servicoTd = this.normalizarServico(transdata.Servico);
    const servicoGb = this.normalizarServico(globus.codServicoNumero);
    if (servicoTd === servicoGb) {
      score += 20;
      detalhes.servicoMesmo = true;
    }

    // 4. Verificar horário (peso: 10 pontos + bônus por proximidade)
    const diffMin = this.calcularDiferencaHorario(transdata.InicioPrevistoText, globus.horSaidaTime);
    detalhes.diferencaHorario = diffMin;
    
    if (diffMin >= 0) {
      if (diffMin <= 2) {
        score += 10; // Horário perfeito
        detalhes.horarioCompativel = true;
      } else if (diffMin <= 10) {
        score += 8; // Horário muito próximo
      } else if (diffMin <= 30) {
        score += 5; // Horário próximo
      } else if (diffMin <= 60) {
        score += 2; // Horário distante mas aceitável
      }
    }

    return { score, detalhes };
  }

  /**
   * 🆕 NOVA ABORDAGEM: Execução da comparação com busca de melhor match
   */
  async executarComparacao(dataReferencia: string): Promise<ResultadoComparacaoDto> {
    const inicioProcessamento = Date.now();
    this.logger.log(`🔄 Iniciando comparação para data: ${dataReferencia}`);

    try {
      await this.limparComparacoesExistentes(dataReferencia);

      const [viagensTransdata, viagensGlobus] = await Promise.all([
        this.buscarViagensTransdata(dataReferencia),
        this.buscarViagensGlobus(dataReferencia)
      ]);

      this.logger.log(`📊 Dados encontrados - Transdata: ${viagensTransdata.length}, Globus: ${viagensGlobus.length}`);

      if (viagensGlobus.length === 0) {
        throw new Error(`Nenhum dado do Globus encontrado para ${dataReferencia}.`);
      }

      const todasComparacoes: ComparacaoViagem[] = [];
      let estatisticas = {
        totalTransdata: viagensTransdata.length,
        totalGlobus: viagensGlobus.length,
        matches: 0,
        compativeis: 0,
        divergentes: 0,
        horarioDivergente: 0,
        apenasTransdata: 0,
        apenasGlobus: 0
      };

      // 🆕 NOVA LÓGICA: Buscar melhor match para cada viagem Transdata
      const globusUsados = new Set<string>();
      
      for (const viagemTd of viagensTransdata) {
        let melhorMatch: {
          globus: ViagemGlobus;
          score: number;
          detalhes: any;
        } | null = null;

        // Buscar o melhor match no Globus
        for (const viagemGb of viagensGlobus) {
          if (globusUsados.has(viagemGb.id)) continue;

          const { score, detalhes } = this.calcularScoreCompatibilidade(viagemTd, viagemGb);
          
          // Só considerar se tem pelo menos linha e sentido compatíveis (score >= 70)
          if (score >= 70) {
            if (!melhorMatch || score > melhorMatch.score) {
              melhorMatch = { globus: viagemGb, score, detalhes };
            }
          }
        }

        if (melhorMatch) {
          // Encontrou um match - criar comparação
          globusUsados.add(melhorMatch.globus.id);
          
          const status = this.determinarStatusComparacao(melhorMatch.detalhes);
          const comparacao = this.compararViagensDetalhado(
            dataReferencia, 
            viagemTd, 
            melhorMatch.globus, 
            melhorMatch.detalhes.diferencaHorario, 
            status
          );
          
          todasComparacoes.push(comparacao);
          estatisticas.matches++;
          
          switch (status) {
            case StatusComparacao.COMPATIVEL:
              estatisticas.compativeis++;
              break;
            case StatusComparacao.HORARIO_DIVERGENTE:
              estatisticas.horarioDivergente++;
              break;
            case StatusComparacao.DIVERGENTE:
              estatisticas.divergentes++;
              break;
          }

          this.logger.debug(`✅ Match encontrado: Linha ${viagemTd.codigoLinha}, Score: ${melhorMatch.score}, Status: ${status}`);
        } else {
          // Não encontrou match - apenas Transdata
          const comparacao = this.criarComparacaoApenasTransdata(dataReferencia, viagemTd);
          todasComparacoes.push(comparacao);
          estatisticas.apenasTransdata++;
          
          this.logger.debug(`📋 APENAS TRANSDATA: Linha ${viagemTd.codigoLinha}, Serviço ${viagemTd.Servico}, Horário ${viagemTd.InicioPrevistoText}`);
        }
      }

      // Adicionar viagens Globus que não foram usadas
      for (const viagemGb of viagensGlobus) {
        if (!globusUsados.has(viagemGb.id)) {
          const comparacao = this.criarComparacaoApenasGlobus(dataReferencia, viagemGb);
          todasComparacoes.push(comparacao);
          estatisticas.apenasGlobus++;
          
          this.logger.debug(`📋 APENAS GLOBUS: Linha ${viagemGb.codigoLinha}, Serviço ${viagemGb.codServicoNumero}, Horário ${viagemGb.horSaidaTime}`);
        }
      }
      
      this.logger.log(`📊 Estatísticas: ${estatisticas.matches} matches, ${estatisticas.compativeis} compatíveis, ${estatisticas.divergentes} divergentes, ${estatisticas.horarioDivergente} horário div.`);
      this.logger.log(`📊 Apenas: ${estatisticas.apenasTransdata} só Transdata, ${estatisticas.apenasGlobus} só Globus`);
      this.logger.log(`📊 TOTAL DE COMPARAÇÕES: ${todasComparacoes.length}`);

      await this.salvarComparacoes(todasComparacoes);
      this.logger.log(`💾 ${todasComparacoes.length} comparações salvas (TODAS as comparações)`);

      const tempoProcessamento = ((Date.now() - inicioProcessamento) / 1000).toFixed(2);
      const resultado: ResultadoComparacaoDto = {
        totalComparacoes: todasComparacoes.length,
        compativeis: estatisticas.compativeis,
        divergentes: estatisticas.divergentes,
        apenasTransdata: estatisticas.apenasTransdata,
        apenasGlobus: estatisticas.apenasGlobus,
        horarioDivergente: estatisticas.horarioDivergente,
        percentualCompatibilidade: estatisticas.matches > 0 ? Math.round((estatisticas.compativeis / estatisticas.matches) * 100) : 0,
        linhasAnalisadas: new Set(todasComparacoes.map(c => c.codigoLinha)).size,
        tempoProcessamento: `${tempoProcessamento}s`
      };

      this.logger.log(`✅ Comparação concluída: ${resultado.totalComparacoes} comparações processadas`);
      return resultado;

    } catch (error) {
      this.logger.error(`❌ Erro na comparação: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🆕 NOVA FUNÇÃO: Determinar status baseado nos detalhes da compatibilidade
   */
  private determinarStatusComparacao(detalhes: any): StatusComparacao {
    // Se linha, sentido e serviço são compatíveis
    if (detalhes.linhaMesma && detalhes.sentidoMesmo && detalhes.servicoMesmo) {
      if (detalhes.horarioCompativel) {
        return StatusComparacao.COMPATIVEL;
      } else {
        return StatusComparacao.HORARIO_DIVERGENTE;
      }
    }
    
    // Se linha e sentido são compatíveis, mas serviço diverge
    if (detalhes.linhaMesma && detalhes.sentidoMesmo && !detalhes.servicoMesmo) {
      return StatusComparacao.DIVERGENTE;
    }
    
    // Outros casos de divergência
    return StatusComparacao.DIVERGENTE;
  }

  /**
   * 🆕 MÉTODO MELHORADO: Observações mais detalhadas
   */
  private compararViagensDetalhado(
    dataReferencia: string,
    transdata: ViagemTransdata,
    globus: ViagemGlobus,
    diferencaHorarioMinutos: number,
    statusDeterminado: StatusComparacao
  ): ComparacaoViagem {
    const comparacao = new ComparacaoViagem();
    
    comparacao.dataReferencia = dataReferencia;
    comparacao.codigoLinha = this.normalizarCodigoLinha(transdata.codigoLinha);
    comparacao.nomeLinhaTransdata = transdata.NomeLinha;
    comparacao.nomeLinhaGlobus = globus.nomeLinha;

    comparacao.transdataId = transdata.id.toString();
    comparacao.transdataServico = this.normalizarServico(transdata.Servico);
    comparacao.transdataSentido = transdata.SentidoText;
    comparacao.transdataHorarioPrevisto = this.limparHorario(transdata.InicioPrevistoText);
    comparacao.transdataHorarioRealizado = this.limparHorario(transdata.InicioRealizadoText);

    comparacao.globusId = globus.id;
    comparacao.globusServico = this.normalizarServico(globus.codServicoNumero);
    comparacao.globusSentidoFlag = globus.flgSentido;
    comparacao.globusSentidoTexto = globus.sentidoTexto;
    comparacao.globusHorarioSaida = this.limparHorario(globus.horSaidaTime);
    comparacao.globusSetor = globus.setorPrincipal;

    // Análises de compatibilidade
    const sentidoTransdataNorm = transdata.SentidoText.trim().toUpperCase();
    const sentidoGlobusMapeado = this.mapearSentidoGlobusParaTransdata(globus.flgSentido);
    
    comparacao.sentidoCompativel = sentidoTransdataNorm === sentidoGlobusMapeado;
    comparacao.servicoCompativel = comparacao.transdataServico === comparacao.globusServico;
    
    comparacao.diferencaHorarioMinutos = diferencaHorarioMinutos;
    comparacao.horarioCompativel = diferencaHorarioMinutos >= 0 && diferencaHorarioMinutos <= 2;

    comparacao.statusComparacao = statusDeterminado;

    // 🎯 Observações MELHORADAS
    const observacoes = [];
    
    if (statusDeterminado === StatusComparacao.HORARIO_DIVERGENTE) {
      observacoes.push(`⏰ HORÁRIO DIVERGENTE: ${diferencaHorarioMinutos}min diferença (T:${comparacao.transdataHorarioPrevisto} vs G:${comparacao.globusHorarioSaida})`);
    } else if (statusDeterminado === StatusComparacao.DIVERGENTE) {
      if (!comparacao.servicoCompativel) {
        observacoes.push(`🔧 SERVIÇO DIVERGENTE: T:${comparacao.transdataServico} vs G:${comparacao.globusServico}`);
      }
      if (!comparacao.horarioCompativel && diferencaHorarioMinutos > 2) {
        observacoes.push(`⏰ HORÁRIO: ${diferencaHorarioMinutos}min diferença`);
      }
    }

    if (!comparacao.sentidoCompativel) {
      observacoes.push(`🔄 Sentido: T:${sentidoTransdataNorm} vs G:${sentidoGlobusMapeado}(${globus.flgSentido})`);
    }
    
    if (globus.flgSentido === 'C') {
      observacoes.push(`🔄 CIRCULAR→IDA`);
    }
    
    comparacao.observacoes = observacoes.length > 0 ? observacoes.join(' | ') : '✅ Compatível';

    return comparacao;
  }

  // ✅ Métodos auxiliares permanecem iguais
  private criarComparacaoApenasTransdata(dataReferencia: string, transdata: ViagemTransdata): ComparacaoViagem {
    const comparacao = new ComparacaoViagem();
    
    comparacao.dataReferencia = dataReferencia;
    comparacao.codigoLinha = this.normalizarCodigoLinha(transdata.codigoLinha);
    comparacao.nomeLinhaTransdata = transdata.NomeLinha;
    comparacao.transdataId = transdata.id.toString();
    comparacao.transdataServico = this.normalizarServico(transdata.Servico);
    comparacao.transdataSentido = transdata.SentidoText;
    comparacao.transdataHorarioPrevisto = this.limparHorario(transdata.InicioPrevistoText);
    comparacao.transdataHorarioRealizado = this.limparHorario(transdata.InicioRealizadoText);
    
    comparacao.statusComparacao = StatusComparacao.APENAS_TRANSDATA;
    comparacao.observacoes = `Viagem encontrada apenas no Transdata - Status: ${transdata.statusCumprimento}`;
    
    return comparacao;
  }

  private criarComparacaoApenasGlobus(dataReferencia: string, globus: ViagemGlobus): ComparacaoViagem {
    const comparacao = new ComparacaoViagem();
    
    comparacao.dataReferencia = dataReferencia;
    comparacao.codigoLinha = this.normalizarCodigoLinha(globus.codigoLinha);
    comparacao.nomeLinhaGlobus = globus.nomeLinha;
    comparacao.globusId = globus.id;
    comparacao.globusServico = this.normalizarServico(globus.codServicoNumero);
    comparacao.globusSentidoFlag = globus.flgSentido;
    comparacao.globusSentidoTexto = globus.sentidoTexto;
    comparacao.globusHorarioSaida = this.limparHorario(globus.horSaidaTime);
    comparacao.globusSetor = globus.setorPrincipal;
    
    comparacao.statusComparacao = StatusComparacao.APENAS_GLOBUS;
    comparacao.observacoes = `Viagem encontrada apenas no Globus - Setor: ${globus.setorPrincipal}`;
    
    return comparacao;
  }

  // ✅ Resto dos métodos permanecem iguais
  private async buscarViagensTransdata(dataReferencia: string): Promise<ViagemTransdata[]> {
    return await this.transdataRepository.find({
      where: { 
        dataReferencia,
        isAtivo: true
      },
      select: [
        'id', 'codigoLinha', 'NomeLinha', 'Servico', 'SentidoText',
        'InicioPrevistoText', 'InicioRealizadoText', 'statusCumprimento'
      ]
    });
  }

  private async buscarViagensGlobus(dataReferencia: string): Promise<ViagemGlobus[]> {
    return await this.globusRepository.find({
      where: { dataReferencia },
      select: [
        'id', 'codigoLinha', 'nomeLinha', 'codServicoNumero', 'flgSentido',
        'sentidoTexto', 'horSaidaTime', 'setorPrincipal'
      ]
    });
  }

  private async salvarComparacoes(comparacoes: ComparacaoViagem[]): Promise<void> {
    if (comparacoes.length === 0) return;

    const batchSize = 100;
    for (let i = 0; i < comparacoes.length; i += batchSize) {
      const batch = comparacoes.slice(i, i + batchSize);
      await this.comparacaoRepository.save(batch);
    }
  }

  private async limparComparacoesExistentes(dataReferencia: string): Promise<void> {
    const deletados = await this.comparacaoRepository.delete({ dataReferencia });
    this.logger.log(`🧹 ${deletados.affected || 0} comparações removidas`);
  }

  async buscarComparacoes(
    dataReferencia: string,
    filtros: FiltrosComparacaoDto
  ): Promise<{ comparacoes: ComparacaoViagem[]; total: number }> {
    const queryBuilder = this.comparacaoRepository
      .createQueryBuilder('comp')
      .where('comp.dataReferencia = :dataReferencia', { dataReferencia });

    if (filtros.codigoLinha) {
      const codigoNormalizado = this.normalizarCodigoLinha(filtros.codigoLinha);
      queryBuilder.andWhere('comp.codigoLinha = :codigoLinha', { 
        codigoLinha: codigoNormalizado 
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

    const total = await queryBuilder.getCount();
    const limite = parseInt(filtros.limite) || 100;
    
    queryBuilder
      .orderBy('comp.statusComparacao', 'ASC')
      .addOrderBy('comp.codigoLinha', 'ASC')
      .addOrderBy('comp.transdataHorarioPrevisto', 'ASC')
      .limit(limite);

    const comparacoes = await queryBuilder.getMany();
    return { comparacoes, total };
  }

  async obterEstatisticas(dataReferencia: string): Promise<ResultadoComparacaoDto | null> {
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

    if (!stats || parseInt(stats.total) === 0) {
      return null;
    }

    const total = parseInt(stats.total);
    const compativeis = parseInt(stats.compativeis) || 0;

    return {
      totalComparacoes: total,
      compativeis,
      divergentes: parseInt(stats.divergentes) || 0,
      apenasTransdata: parseInt(stats.apenasTransdata) || 0,
      apenasGlobus: parseInt(stats.apenasGlobus) || 0,
      horarioDivergente: parseInt(stats.horarioDivergente) || 0,
      percentualCompatibilidade: total > 0 ? Math.round((compativeis / total) * 100) : 0,
      linhasAnalisadas: parseInt(stats.linhasAnalisadas) || 0,
      tempoProcessamento: '0s'
    };
  }

  async obterCodigosLinha(dataReferencia: string): Promise<string[]> {
    const result = await this.comparacaoRepository
      .createQueryBuilder('comp')
      .select('DISTINCT comp.codigoLinha', 'codigoLinha')
      .where('comp.dataReferencia = :dataReferencia', { dataReferencia })
      .orderBy('comp.codigoLinha', 'ASC')
      .getRawMany();

    return result.map(item => item.codigoLinha).filter(Boolean);
  }

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