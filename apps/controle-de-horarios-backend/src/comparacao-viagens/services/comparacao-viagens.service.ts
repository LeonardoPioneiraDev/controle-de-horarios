import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ComparacaoViagem, StatusComparacao, CombinacaoComparacao } from '../entities/comparacao-viagem.entity'; // ✅ Importar CombinacaoComparacao da entidade
import { ViagemTransdata } from '../../viagens-transdata/entities/viagem-transdata.entity';
import { ViagemGlobus } from '../../viagens-globus/entities/viagem-globus.entity';
import { HistoricoComparacaoViagens } from '../entities/historico-comparacao.entity';
import { FiltrosComparacaoDto, ResultadoComparacaoDto } from '../dto';
import { normalizeTransDataTrip, normalizeGlobusTrip, compareTrips, NormalizedTransDataTrip, NormalizedGlobusTrip } from '../utils/trip-comparator.util'; // ✅ Remover CombinacaoComparacao daqui

const COMBINACAO_PRIORITY: Record<CombinacaoComparacao, number> = {
  [CombinacaoComparacao.TUDO_IGUAL]: 0,
  [CombinacaoComparacao.SO_HORARIO_DIFERENTE]: 1,
  [CombinacaoComparacao.SO_SERVICO_DIFERENTE]: 2,
  [CombinacaoComparacao.SERVICO_E_HORARIO_DIFERENTES]: 3,
  [CombinacaoComparacao.SO_SENTIDO_DIFERENTE]: 4,
  [CombinacaoComparacao.SENTIDO_E_HORARIO_DIFERENTES]: 5,
  [CombinacaoComparacao.SENTIDO_E_SERVICO_DIFERENTES]: 6,
  [CombinacaoComparacao.SO_LINHA_IGUAL]: 7,
  [CombinacaoComparacao.SO_LINHA_DIFERENTE]: 8,
  [CombinacaoComparacao.LINHA_E_HORARIO_DIFERENTES]: 9,
  [CombinacaoComparacao.LINHA_E_SERVICO_DIFERENTES]: 10,
  [CombinacaoComparacao.SO_SENTIDO_IGUAL]: 11,
  [CombinacaoComparacao.LINHA_E_SENTIDO_DIFERENTES]: 12,
  [CombinacaoComparacao.SO_SERVICO_IGUAL]: 13,
  [CombinacaoComparacao.SO_HORARIO_IGUAL]: 14,
  [CombinacaoComparacao.TUDO_DIFERENTE]: 15,
};

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
    @InjectRepository(HistoricoComparacaoViagens)
    private readonly historicoRepository: Repository<HistoricoComparacaoViagens>,
  ) {}

  async executarComparacao(dataReferencia: string): Promise<ResultadoComparacaoDto> {
    const inicioProcessamento = Date.now();
    this.logger.log(`🔄 Iniciando comparação detalhada para data: ${dataReferencia}`);

    await this.limparComparacoesExistentes(dataReferencia);

    const [viagensTransdata, viagensGlobus] = await Promise.all([
      this.buscarViagensTransdata(dataReferencia),
      this.buscarViagensGlobus(dataReferencia)
    ]);

    this.logger.log(`📊 Dados encontrados - Transdata: ${viagensTransdata.length}, Globus: ${viagensGlobus.length}`);

    if (viagensGlobus.length === 0 || viagensTransdata.length === 0) {
        this.logger.warn(`Dados insuficientes para comparação. Abortando.`);
        return {
            totalComparacoes: 0, compativeis: 0, divergentes: 0, apenasTransdata: viagensTransdata.length,
            apenasGlobus: viagensGlobus.length, horarioDivergente: 0, percentualCompatibilidade: 0,
            linhasAnalisadas: 0, tempoProcessamento: '0s'
        };
    }

    const todasComparacoes: ComparacaoViagem[] = [];
    let estatisticas = {
        compativeis: 0, divergentes: 0, horarioDivergente: 0,
        apenasTransdata: 0, apenasGlobus: 0, matches: 0
    };

    const globusMatchedIds = new Set<string>();
    const transdataProcessedIds = new Set<string>();

    const normalizedGlobusTrips = viagensGlobus.map(trip => ({
        original: trip,
        normalized: normalizeGlobusTrip(trip)
    }));

    // --- FASE 1: BUSCAR MATCHES EXATOS ---
    this.logger.log(`🔍 [FASE 1] Buscando matches exatos (TUDO_IGUAL)...`);
    for (const viagemTd of viagensTransdata) {
        if (transdataProcessedIds.has(viagemTd.id.toString())) continue;

        const normTd = normalizeTransDataTrip(viagemTd);
        let foundExactMatch = false;

        for (const globusWrapper of normalizedGlobusTrips) {
            const viagemGb = globusWrapper.original;
            const normGb = globusWrapper.normalized;

            if (globusMatchedIds.has(viagemGb.id)) continue;

            const combinacao = compareTrips(normTd, normGb);

            if (combinacao === CombinacaoComparacao.TUDO_IGUAL) {
                const comparacao = this.criarComparacaoDetalhada(
                    dataReferencia, viagemTd, viagemGb, StatusComparacao.COMPATIVEL, 'Tudo igual', combinacao
                );
                todasComparacoes.push(comparacao);
                globusMatchedIds.add(viagemGb.id);
                transdataProcessedIds.add(viagemTd.id.toString());
                estatisticas.compativeis++;
                estatisticas.matches++;
                foundExactMatch = true;
                break; // Move to the next Transdata trip
            }
        }
    }
    this.logger.log(`✅ [FASE 1] Matches exatos encontrados: ${estatisticas.compativeis}`);

    // --- FASE 2: COLETAR POTENCIAIS MATCHES DIVERGENTES ---
    this.logger.log(`🔍 [FASE 2] Coletando potenciais matches divergentes...`);
    const potentialDivergentMatches: {
        tdTrip: ViagemTransdata;
        gbTrip: ViagemGlobus;
        combinacao: CombinacaoComparacao;
        normTd: NormalizedTransDataTrip;
        normGb: NormalizedGlobusTrip;
    }[] = [];

    for (const viagemTd of viagensTransdata) {
        if (transdataProcessedIds.has(viagemTd.id.toString())) continue;

        const normTd = normalizeTransDataTrip(viagemTd);

        for (const globusWrapper of normalizedGlobusTrips) {
            const viagemGb = globusWrapper.original;
            const normGb = globusWrapper.normalized;

            if (globusMatchedIds.has(viagemGb.id)) continue;

            const combinacao = compareTrips(normTd, normGb);

            if (combinacao !== CombinacaoComparacao.TUDO_DIFERENTE) {
                potentialDivergentMatches.push({
                    tdTrip: viagemTd,
                    gbTrip: viagemGb,
                    combinacao: combinacao,
                    normTd: normTd,
                    normGb: normGb,
                });
            }
        }
    }
    this.logger.log(`✅ [FASE 2] Potenciais matches divergentes coletados: ${potentialDivergentMatches.length}`);

    // --- FASE 2.1: PROCESSAR MATCHES DIVERGENTES PRIORIZANDO OS MELHORES ---
    this.logger.log(`🔍 [FASE 2.1] Processando matches divergentes priorizados...`);
    // Sort by combination (lower enum value is a 'better' match)
    potentialDivergentMatches.sort((a, b) => COMBINACAO_PRIORITY[a.combinacao] - COMBINACAO_PRIORITY[b.combinacao]);

    for (const potentialMatch of potentialDivergentMatches) {
        const { tdTrip, gbTrip, combinacao, normTd, normGb } = potentialMatch;

        // Only process if both trips are still unmatched
        if (!transdataProcessedIds.has(tdTrip.id.toString()) && !globusMatchedIds.has(gbTrip.id)) {
            const status = this.determinarStatusComparacao(combinacao);
            const observacao = this.gerarObservacao(combinacao, normTd, normGb);

            const comparacao = this.criarComparacaoDetalhada(
                dataReferencia, tdTrip, gbTrip, status, observacao, combinacao
            );
            todasComparacoes.push(comparacao);
            globusMatchedIds.add(gbTrip.id);
            transdataProcessedIds.add(tdTrip.id.toString());
            estatisticas.matches++;
            if (status === StatusComparacao.HORARIO_DIVERGENTE) estatisticas.horarioDivergente++;
            else estatisticas.divergentes++;
        }
    }
    this.logger.log(`✅ [FASE 2.1] Matches divergentes processados: ${estatisticas.divergentes + estatisticas.horarioDivergente}`);

    // --- FASE 3: REGISTRAR VIAGENS NÃO COMBINADAS ---
    this.logger.log(`🔍 [FASE 3] Registrando viagens não combinadas...`);
    for (const viagemTd of viagensTransdata) {
        if (!transdataProcessedIds.has(viagemTd.id.toString())) {
            estatisticas.apenasTransdata++;
            todasComparacoes.push(this.criarComparacaoApenasTransdata(dataReferencia, viagemTd));
        }
    }

    for (const globusWrapper of normalizedGlobusTrips) {
        const viagemGb = globusWrapper.original;
        if (!globusMatchedIds.has(viagemGb.id)) {
            estatisticas.apenasGlobus++;
            todasComparacoes.push(this.criarComparacaoApenasGlobus(dataReferencia, viagemGb));
        }
    }
    this.logger.log(`✅ [FASE 3] Viagens apenas Transdata: ${estatisticas.apenasTransdata}, apenas Globus: ${estatisticas.apenasGlobus}`);

    await this.salvarComparacoes(todasComparacoes);
    this.logger.log(`💾 ${todasComparacoes.length} comparações salvas.`);

    const tempoProcessamento = ((Date.now() - inicioProcessamento) / 1000).toFixed(2);
    return {
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
  }

  private determinarStatusComparacao(combinacao: CombinacaoComparacao): StatusComparacao {
      switch (combinacao) {
          case CombinacaoComparacao.TUDO_IGUAL:
              return StatusComparacao.COMPATIVEL;
          case CombinacaoComparacao.SO_HORARIO_DIFERENTE:
          case CombinacaoComparacao.SERVICO_E_HORARIO_DIFERENTES: // If service and horario differ, but line/sentido are same
          case CombinacaoComparacao.SENTIDO_E_HORARIO_DIFERENTES: // If sentido and horario differ, but line/service are same
          case CombinacaoComparacao.SO_LINHA_IGUAL:
              return StatusComparacao.HORARIO_DIVERGENTE;
          default:
              return StatusComparacao.DIVERGENTE;
      }
  }

  private gerarObservacao(combinacao: CombinacaoComparacao, td: NormalizedTransDataTrip, gb: NormalizedGlobusTrip): string {
      const tpl = (t: string, g: string) => `(T: ${t} vs G: ${g})`;
      switch (combinacao) {
          case CombinacaoComparacao.TUDO_IGUAL: return 'Tudo igual';
          case CombinacaoComparacao.SO_HORARIO_DIFERENTE: return `Apenas horário diferente ${tpl(td.horario, gb.horario)}`;
          case CombinacaoComparacao.SO_SERVICO_DIFERENTE: return `Apenas serviço diferente ${tpl(td.servico, gb.servico)}`;
          case CombinacaoComparacao.SERVICO_E_HORARIO_DIFERENTES: return `Serviço ${tpl(td.servico, gb.servico)} e Horário ${tpl(td.horario, gb.horario)} diferentes`;
          case CombinacaoComparacao.SO_SENTIDO_DIFERENTE: return `Apenas sentido diferente ${tpl(td.sentido, gb.sentido)}`;
          case CombinacaoComparacao.SENTIDO_E_HORARIO_DIFERENTES: return `Sentido ${tpl(td.sentido, gb.sentido)} e Horário ${tpl(td.horario, gb.horario)} diferentes`;
          case CombinacaoComparacao.SENTIDO_E_SERVICO_DIFERENTES: return `Sentido ${tpl(td.sentido, gb.sentido)} e Serviço ${tpl(td.servico, gb.servico)} diferentes`;
          case CombinacaoComparacao.SO_LINHA_IGUAL: return `Apenas linha igual, outros campos divergem (Sentido: ${tpl(td.sentido, gb.sentido)}, Serviço: ${tpl(td.servico, gb.servico)}, Horário: ${tpl(td.horario, gb.horario)})`;
          case CombinacaoComparacao.SO_LINHA_DIFERENTE: return `Apenas linha diferente ${tpl(td.linha, gb.linha)}`;
          case CombinacaoComparacao.LINHA_E_HORARIO_DIFERENTES: return `Linha ${tpl(td.linha, gb.linha)} e Horário ${tpl(td.horario, gb.horario)} diferentes`;
          case CombinacaoComparacao.LINHA_E_SERVICO_DIFERENTES: return `Linha ${tpl(td.linha, gb.linha)} e Serviço ${tpl(td.servico, gb.servico)} diferentes`;
          case CombinacaoComparacao.SO_SENTIDO_IGUAL: return `Apenas sentido igual, outros campos divergem (Linha: ${tpl(td.linha, gb.linha)}, Serviço: ${tpl(td.servico, gb.servico)}, Horário: ${tpl(td.horario, gb.horario)})`;
          case CombinacaoComparacao.LINHA_E_SENTIDO_DIFERENTES: return `Linha ${tpl(td.linha, gb.linha)} e Sentido ${tpl(td.sentido, gb.sentido)} diferentes`;
          case CombinacaoComparacao.SO_SERVICO_IGUAL: return `Apenas serviço igual, outros campos divergem (Linha: ${tpl(td.linha, gb.linha)}, Sentido: ${tpl(td.sentido, gb.sentido)}, Horário: ${tpl(td.horario, gb.horario)})`;
          case CombinacaoComparacao.SO_HORARIO_IGUAL: return `Apenas horário igual, outros campos divergem (Linha: ${tpl(td.linha, gb.linha)}, Sentido: ${tpl(td.sentido, gb.sentido)}, Serviço: ${tpl(td.servico, gb.servico)})`;
          case CombinacaoComparacao.TUDO_DIFERENTE: return `Todos os campos (linha, sentido, serviço, horário) são diferentes`;
          default: return `Divergência complexa (Combinação: ${combinacao})`; // Fallback, though all should be covered
      }
  }

  private criarComparacaoDetalhada(
    dataReferencia: string,
    transdata: ViagemTransdata,
    globus: ViagemGlobus,
    status: StatusComparacao,
    observacao: string,
    combinacao: CombinacaoComparacao 
  ): ComparacaoViagem {
    const comparacao = new ComparacaoViagem();
    const normTd = normalizeTransDataTrip(transdata);
    const normGb = normalizeGlobusTrip(globus);

    comparacao.dataReferencia = dataReferencia;
    comparacao.codigoLinha = normTd.linha;
    comparacao.nomeLinhaTransdata = transdata.NomeLinha;
    comparacao.nomeLinhaGlobus = globus.nomeLinha;

    comparacao.transdataId = transdata.id.toString();
    comparacao.transdataServico = normTd.servico;
    comparacao.transdataSentido = transdata.SentidoText;
    comparacao.transdataHorarioPrevisto = normTd.horario;

    comparacao.globusId = globus.id;
    comparacao.globusServico = normGb.servico;
    comparacao.globusSentidoFlag = globus.flgSentido;
    comparacao.globusSentidoTexto = globus.sentidoTexto;
    comparacao.globusHorarioSaida = normGb.horario;
    comparacao.globusSetor = globus.setorPrincipal;

    comparacao.statusComparacao = status;
    comparacao.observacoes = observacao;
    comparacao.tipoCombinacao = combinacao; 

    comparacao.sentidoCompativel = normTd.sentido === normGb.sentido;
    comparacao.servicoCompativel = normTd.servico === normGb.servico;
    const diffHorario = Math.abs( (new Date(`1970-01-01T${normTd.horario}:00`).getTime()) - (new Date(`1970-01-01T${normGb.horario}:00`).getTime()) ) / (1000 * 60);
    comparacao.diferencaHorarioMinutos = isNaN(diffHorario) ? -1 : diffHorario;
    comparacao.horarioCompativel = diffHorario <= 2;

    return comparacao;
  }

  private criarComparacaoApenasTransdata(dataReferencia: string, transdata: ViagemTransdata): ComparacaoViagem {
    const comparacao = new ComparacaoViagem();
    const normTd = normalizeTransDataTrip(transdata);
    
    comparacao.dataReferencia = dataReferencia;
    comparacao.codigoLinha = normTd.linha;
    comparacao.nomeLinhaTransdata = transdata.NomeLinha;
    comparacao.transdataId = transdata.id.toString();
    comparacao.transdataServico = normTd.servico;
    comparacao.transdataSentido = transdata.SentidoText;
    comparacao.transdataHorarioPrevisto = normTd.horario;
    
    comparacao.statusComparacao = StatusComparacao.APENAS_TRANSDATA;
    comparacao.observacoes = `Viagem encontrada apenas no Transdata - Status: ${transdata.statusCumprimento}`;
    
    return comparacao;
  }

  private criarComparacaoApenasGlobus(dataReferencia: string, globus: ViagemGlobus): ComparacaoViagem {
    const comparacao = new ComparacaoViagem();
    const normGb = normalizeGlobusTrip(globus);
    
    comparacao.dataReferencia = dataReferencia;
    comparacao.codigoLinha = normGb.linha;
    comparacao.nomeLinhaGlobus = globus.nomeLinha;
    comparacao.globusId = globus.id;
    comparacao.globusServico = normGb.servico;
    comparacao.globusSentidoFlag = globus.flgSentido;
    comparacao.globusSentidoTexto = globus.sentidoTexto;
    comparacao.globusHorarioSaida = normGb.horario;
    comparacao.globusSetor = globus.setorPrincipal;
    
    comparacao.statusComparacao = StatusComparacao.APENAS_GLOBUS;
    comparacao.observacoes = `Viagem encontrada apenas no Globus - Setor: ${globus.setorPrincipal}`;
    
    return comparacao;
  }

  private async buscarViagensTransdata(dataReferencia: string): Promise<ViagemTransdata[]> {
    return await this.transdataRepository.find({
      where: { 
        dataReferencia,
        isAtivo: true
      },
      select: [
        'id', 'codigoLinha', 'NomeLinha', 'Servico', 'SentidoText',
        'InicioPrevisto', 'InicioRealizadoText', 'statusCumprimento'
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

    // Aplicar filtros booleanos quando definidos (true/false explicitamente)
    if (typeof filtros.sentidoCompativel === 'boolean') {
      queryBuilder.andWhere('comp.sentidoCompativel = :sentido', { sentido: filtros.sentidoCompativel });
    }
    if (typeof filtros.horarioCompativel === 'boolean') {
      queryBuilder.andWhere('comp.horarioCompativel = :horario', { horario: filtros.horarioCompativel });
    }
    if (typeof filtros.servicoCompativel === 'boolean') {
      queryBuilder.andWhere('comp.servicoCompativel = :servico', { servico: filtros.servicoCompativel });
    }

    const total = await queryBuilder.getCount();
    const limit = filtros.limit || 50;
    const page = filtros.page || 1;
    
    queryBuilder
      .orderBy('comp.statusComparacao', 'ASC')
      .addOrderBy('comp.codigoLinha', 'ASC')
      .addOrderBy('comp.transdataHorarioPrevisto', 'ASC')
      .limit(limit)
      .offset((page - 1) * limit);

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

  // =====================
  // Histórico de comparação
  // =====================

  async contarPorCombinacao(dataReferencia: string): Promise<Record<string, number>> {
    const rows = await this.comparacaoRepository
      .createQueryBuilder('comp')
      .select('comp.tipoCombinacao', 'tipo')
      .addSelect('COUNT(*)', 'qtd')
      .where('comp.dataReferencia = :dataReferencia', { dataReferencia })
      .groupBy('comp.tipoCombinacao')
      .getRawMany();

    const map: Record<string, number> = {};
    for (const r of rows) {
      const key = String(r.tipo || 'DESCONHECIDO');
      map[key] = parseInt(r.qtd, 10) || 0;
    }
    return map;
  }

  async contarTotaisOrigem(dataReferencia: string): Promise<{ totalTransdata: number; totalGlobus: number }> {
    const [totalTransdata, totalGlobus] = await Promise.all([
      this.transdataRepository.count({ where: { dataReferencia, isAtivo: true } as any }),
      this.globusRepository.count({ where: { dataReferencia } as any }),
    ]);
    return { totalTransdata, totalGlobus };
  }

  async salvarHistoricoComparacao(params: {
    dataReferencia: string;
    resultado: import('../dto/resultado-comparacao.dto').ResultadoComparacaoDto;
    durationMs: number;
    executedByUserId?: string;
    executedByEmail?: string;
    countsPorCombinacao?: Record<string, number>;
    totalTransdata?: number;
    totalGlobus?: number;
  }): Promise<string> {
    const h = new HistoricoComparacaoViagens();
    h.dataReferencia = params.dataReferencia;
    h.totalComparacoes = params.resultado.totalComparacoes || 0;
    h.compativeis = params.resultado.compativeis || 0;
    h.divergentes = params.resultado.divergentes || 0;
    h.apenasTransdata = params.resultado.apenasTransdata || 0;
    h.apenasGlobus = params.resultado.apenasGlobus || 0;
    h.horarioDivergente = params.resultado.horarioDivergente || 0;
    h.percentualCompatibilidade = String(params.resultado.percentualCompatibilidade ?? 0);
    h.linhasAnalisadas = params.resultado.linhasAnalisadas || 0;
    h.tempoProcessamento = params.resultado.tempoProcessamento || `${Math.round(params.durationMs)}ms`;
    h.durationMs = Math.max(0, Math.round(params.durationMs || 0));
    h.executedByUserId = params.executedByUserId || null;
    h.executedByEmail = params.executedByEmail || null;
    h.countsPorCombinacao = params.countsPorCombinacao || null;
    h.totalTransdata = typeof params.totalTransdata === 'number' ? params.totalTransdata : null;
    h.totalGlobus = typeof params.totalGlobus === 'number' ? params.totalGlobus : null;

    const saved = await this.historicoRepository.save(h);
    return saved.id;
  }

  async listarHistorico(query: {
    data?: string;
    dataInicial?: string;
    dataFinal?: string;
    page?: number;
    limit?: number;
    executedByEmail?: string;
  }): Promise<{ items: HistoricoComparacaoViagens[]; total: number }> {
    const qb = this.historicoRepository.createQueryBuilder('h');

    if (query.data) {
      qb.andWhere('h.dataReferencia = :data', { data: query.data });
    }
    if (query.dataInicial) {
      qb.andWhere('h.createdAt >= :di', { di: new Date(`${query.dataInicial}T00:00:00`) });
    }
    if (query.dataFinal) {
      qb.andWhere('h.createdAt <= :df', { df: new Date(`${query.dataFinal}T23:59:59`) });
    }
    if (query.executedByEmail) {
      qb.andWhere('h.executedByEmail ILIKE :email', { email: `%${query.executedByEmail}%` });
    }

    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));

    const total = await qb.getCount();
    const items = await qb
      .orderBy('h.createdAt', 'DESC')
      .limit(limit)
      .offset((page - 1) * limit)
      .getMany();

    return { items, total };
  }

  async obterHistoricoPorId(id: string): Promise<HistoricoComparacaoViagens | null> {
    return this.historicoRepository.findOne({ where: { id } });
  }

  async obterUltimoHistoricoPorData(dataReferencia: string): Promise<HistoricoComparacaoViagens | null> {
    return this.historicoRepository
      .createQueryBuilder('h')
      .where('h.dataReferencia = :dataReferencia', { dataReferencia })
      .orderBy('h.createdAt', 'DESC')
      .limit(1)
      .getOne();
  }
}
