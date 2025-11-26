import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ComparacaoViagem, StatusComparacao, CombinacaoComparacao } from '../entities/comparacao-viagem.entity'; // ? Importar CombinacaoComparacao da entidade
import { ViagemTransdata } from '../../viagens-transdata/entities/viagem-transdata.entity';
import { ViagemGlobus } from '../../viagens-globus/entities/viagem-globus.entity';
import { HistoricoComparacaoViagens } from '../entities/historico-comparacao.entity';
import { FiltrosComparacaoDto, ResultadoComparacaoDto } from '../dto';
import { hungarian, buildCostMatrix } from '../utils/optimal-matching.util';
import { normalizeTransDataTrip, normalizeGlobusTrip, compareTrips, NormalizedTransDataTrip, NormalizedGlobusTrip } from '../utils/trip-comparator.util'; // ? Remover CombinacaoComparacao daqui

const COMBINACAO_PRIORITY: Record<CombinacaoComparacao, number> = {
  // --- GRUPO A: Mesma Linha e Mesmo Serviço (Melhores Matches) ---
  [CombinacaoComparacao.TUDO_IGUAL]: 0,
  [CombinacaoComparacao.SO_HORARIO_DIFERENTE]: 1,
  [CombinacaoComparacao.SO_SENTIDO_DIFERENTE]: 2,
  [CombinacaoComparacao.SENTIDO_E_HORARIO_DIFERENTES]: 3,

  // --- GRUPO B: Linha Diferente mas Mesmo Serviço (Cross-over) ---
  // O usuário prefere assumir que a linha está errada no cadastro se o serviço/horário baterem
  [CombinacaoComparacao.SO_LINHA_DIFERENTE]: 4,
  [CombinacaoComparacao.LINHA_E_HORARIO_DIFERENTES]: 5,
  [CombinacaoComparacao.LINHA_E_SENTIDO_DIFERENTES]: 6,
  [CombinacaoComparacao.SO_SERVICO_IGUAL]: 7, // Apenas serviço igual (Linha, Sentido, Horário diferentes) - ainda melhor que nada?

  // --- GRUPO C: Mesma Linha mas Serviço Diferente (Fallback) ---
  [CombinacaoComparacao.SO_SERVICO_DIFERENTE]: 8,
  [CombinacaoComparacao.SERVICO_E_HORARIO_DIFERENTES]: 9,
  [CombinacaoComparacao.SENTIDO_E_SERVICO_DIFERENTES]: 10,
  [CombinacaoComparacao.SO_LINHA_IGUAL]: 11,
  [CombinacaoComparacao.LINHA_E_SERVICO_DIFERENTES]: 12, // Adicionado para corrigir erro de build

  // --- GRUPO D: Resto (Provavelmente não deve dar match, mas está aqui por completude) ---
  [CombinacaoComparacao.SO_SENTIDO_IGUAL]: 13,
  [CombinacaoComparacao.SO_HORARIO_IGUAL]: 14,
  [CombinacaoComparacao.TUDO_DIFERENTE]: 15,
};

// Configurações de comparação via env (com valores padrão seguros)
const TIME_EQUAL_MIN = Number.isFinite(parseInt(process.env.COMPARE_TIME_EQUAL_MIN || '', 10))
  ? parseInt(process.env.COMPARE_TIME_EQUAL_MIN!, 10)
  : 2;
const PASS1_WINDOW_MIN = Number.isFinite(parseInt(process.env.COMPARE_PASS1_WINDOW_MIN || '', 10))
  ? parseInt(process.env.COMPARE_PASS1_WINDOW_MIN!, 10)
  : 120; // serviço+sentido
const PASS2_WINDOW_MIN = Number.isFinite(parseInt(process.env.COMPARE_PASS2_WINDOW_MIN || '', 10))
  ? parseInt(process.env.COMPARE_PASS2_WINDOW_MIN!, 10)
  : 180; // linha+sentido
const PASS3_WINDOW_MIN = Number.isFinite(parseInt(process.env.COMPARE_PASS3_WINDOW_MIN || '', 10))
  ? parseInt(process.env.COMPARE_PASS3_WINDOW_MIN!, 10)
  : 240; // linha

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
  ) { }

  async executarComparacao(dataReferencia: string): Promise<ResultadoComparacaoDto> {
    const inicioProcessamento = Date.now();
    this.logger.log(`?? Iniciando comparação detalhada para data: ${dataReferencia}`);

    await this.limparComparacoesExistentes(dataReferencia);

    const [viagensTransdata, viagensGlobus] = await Promise.all([
      this.buscarViagensTransdata(dataReferencia),
      this.buscarViagensGlobus(dataReferencia)
    ]);

    this.logger.log(`?? Dados encontrados - Transdata: ${viagensTransdata.length}, Globus: ${viagensGlobus.length}`);

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
    this.logger.log(`?? [FASE 1] Buscando matches exatos (TUDO_IGUAL)...`);
    for (const viagemTd of viagensTransdata) {
      if (transdataProcessedIds.has(viagemTd.id.toString())) continue;

      const normTd = normalizeTransDataTrip(viagemTd);
      let foundExactMatch = false;

      for (const globusWrapper of normalizedGlobusTrips) {
        const viagemGb = globusWrapper.original;
        const normGb = globusWrapper.normalized;

        if (globusMatchedIds.has(viagemGb.id)) continue;

        const combinacao = compareTrips(normTd, normGb);
        if (!(normTd.servico === normGb.servico && normTd.sentido === normGb.sentido)) { continue; }

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
    this.logger.log(`? [FASE 1] Matches exatos encontrados: ${estatisticas.compativeis}`);

    const columnsToCompare = ['linha', 'servico', 'sentido', 'horario'];
    const tdLeftovers = viagensTransdata
      .filter(t => !transdataProcessedIds.has(t.id.toString()))
      .map(t => ({ original: t, norm: normalizeTransDataTrip(t) }));
    const gbLeftovers = normalizedGlobusTrips
      .filter(gw => !globusMatchedIds.has(gw.original.id))
      .map(gw => ({ original: gw.original, norm: gw.normalized }));
    this.logger.log(`[FASE 2] Segunda comparacao entre sobras: ${tdLeftovers.length} Transdata / ${gbLeftovers.length} Globus usando colunas ${columnsToCompare.join(', ')}`);
    const extraMatches = this.compareLeftovers(dataReferencia, tdLeftovers, gbLeftovers, transdataProcessedIds, globusMatchedIds);
    for (const match of extraMatches) {
      todasComparacoes.push(match);
      estatisticas.matches++;
      if (match.statusComparacao === StatusComparacao.COMPATIVEL) estatisticas.compativeis++;
      else if (match.statusComparacao === StatusComparacao.HORARIO_DIVERGENTE) estatisticas.horarioDivergente++;
      else estatisticas.divergentes++;
    }
    if (extraMatches.length > 0) {
      this.logger.log(`[FASE 2] Matches encontrados nessa segunda comparacao: ${extraMatches.length}`);
    }
    // Greedy desativado ap?s Hungarian; manter estrutura vazia
    const potentialMatches: any[] = [];
    //       tdTrip: ViagemTransdata;
    //       gbTrip: ViagemGlobus;
    //       combinacao: CombinacaoComparacao;
    //       normTd: NormalizedTransDataTrip;
    //       normGb: NormalizedGlobusTrip;
    //       diffMinutos: number;
    //       score: number; // Score calculado para ordenação
    //     }[] = [];

    //     for (const viagemTd of viagensTransdata) {
    //       if (transdataProcessedIds.has(viagemTd.id.toString())) continue;
    // 
    //       const normTd = normalizeTransDataTrip(viagemTd);
    // 
    //       for (const globusWrapper of normalizedGlobusTrips) {
    //         const viagemGb = globusWrapper.original;
    //         const normGb = globusWrapper.normalized;
    // 
    //         if (globusMatchedIds.has(viagemGb.id)) continue;
    // 
    // 1. Calcula a combinação (ex: TUDO_IGUAL, SO_LINHA_DIFERENTE, etc)
    //         const combinacao = compareTrips(normTd, normGb);
    // 
    // 2. Se for TUDO_DIFERENTE, ignora para não poluir a memória (salvo se quisermos ser muito agressivos)
    //         if (combinacao === CombinacaoComparacao.TUDO_DIFERENTE) continue;
    // 
    // 3. Calcula diferença de tempo
    //         const diffMinutos = Math.abs(
    //           (new Date(`1970-01-01T${normTd.horario}:00`).getTime()) -
    //           (new Date(`1970-01-01T${normGb.horario}:00`).getTime())
    //         ) / (1000 * 60);
    // 
    // 4. Calcula Score (Menor é melhor)
    // Base: Prioridade da Combinação * 1000
    // Ajuste: Diferença de minutos
    //         const baseScore = (COMBINACAO_PRIORITY[combinacao] || 99) * 1000;
    //         const timeScore = isNaN(diffMinutos) ? 999 : diffMinutos;
    //         const finalScore = baseScore + timeScore;
    // 
    //         potentialMatches.push({
    //           tdTrip: viagemTd,
    //           gbTrip: viagemGb,
    //           combinacao: combinacao,
    //           normTd: normTd,
    //           normGb: normGb,
    //           diffMinutos: isNaN(diffMinutos) ? 9999 : diffMinutos,
    //           score: finalScore
    //         });
    //       }
    //     }
    //     this.logger.log(`? [FASE 2] Combinações possíveis encontradas: ${potentialMatches.length}`);
    // 
    // --- FASE 3: PROCESSAR MATCHES DO MELHOR PARA O PIOR ---
    // Greedy removido; casamento ?timo j? realizado acima
    // 
    // Ordena pelo Score (Menor score = Melhor match)
    // Isso garante que um match "Perfeito" (Score ~0) seja processado antes de um "Mais ou menos" (Score ~4000)
    // (removido) potentialMatches.sort((a, b) => a.score - b.score);
    // 
    //     let matchesRealizados = 0;
    // 
    // (removido) for (const match of potentialMatches) {
    //       const { tdTrip, gbTrip, combinacao, normTd, normGb } = match;
    // 
    // Verifica se as viagens AINDA estão disponíveis (não foram casadas com um par melhor anteriormente)
    //       if (!transdataProcessedIds.has(tdTrip.id.toString()) && !globusMatchedIds.has(gbTrip.id)) {
    // 
    //         const status = this.determinarStatusComparacao(combinacao);
    //         const observacao = this.gerarObservacao(combinacao, normTd, normGb);
    // 
    //         const comparacao = this.criarComparacaoDetalhada(
    //           dataReferencia, tdTrip, gbTrip, status, observacao, combinacao
    //         );
    // 
    //         todasComparacoes.push(comparacao);
    // 
    // Marca como processado para ninguém mais usar essas viagens
    //         globusMatchedIds.add(gbTrip.id);
    //         transdataProcessedIds.add(tdTrip.id.toString());
    // 
    //         matchesRealizados++;
    //         estatisticas.matches++;
    //         if (status === StatusComparacao.HORARIO_DIVERGENTE) estatisticas.horarioDivergente++;
    //         else estatisticas.divergentes++;
    //       }
    //     }
    //     this.logger.log(`? [FASE 3] Matches realizados após análise exaustiva: ${matchesRealizados}`);
    // 
    // --- FASE 4: TENTAR PARES ENTRE "APENAS" (RELAXANDO REGRAS) ---
    // Recalcula sobras após a segunda comparação
    const tdRemaining = viagensTransdata
      .filter(t => !transdataProcessedIds.has(t.id.toString()))
      .map(t => ({ original: t, norm: normalizeTransDataTrip(t) }));
    const gbRemaining = normalizedGlobusTrips
      .filter(gw => !globusMatchedIds.has(gw.original.id))
      .map(gw => ({ original: gw.original, norm: gw.normalized }));

    this.logger.log(`?? [FASE 4] Comparando apenas Transdata (${tdRemaining.length}) x apenas Globus (${gbRemaining.length})`);

    const fase4Matches: ComparacaoViagem[] = [];

    // Passo 4.1: linha+serviço (ignora sentido), janela PASS1_WINDOW_MIN
    fase4Matches.push(
      ...this.compareLeftoversRelaxed(
        dataReferencia,
        tdRemaining,
        gbRemaining,
        transdataProcessedIds,
        globusMatchedIds,
        (n) => `${this.normalizeLineForKey(n.linha)}|${n.servico}`,
        PASS1_WINDOW_MIN,
      )
    );

    // Passo 4.2: linha+sentido (ignora serviço), janela PASS2_WINDOW_MIN
    // Recalcula arrays de sobras com os sets atualizados
    const tdRemaining2 = viagensTransdata
      .filter(t => !transdataProcessedIds.has(t.id.toString()))
      .map(t => ({ original: t, norm: normalizeTransDataTrip(t) }));
    const gbRemaining2 = normalizedGlobusTrips
      .filter(gw => !globusMatchedIds.has(gw.original.id))
      .map(gw => ({ original: gw.original, norm: gw.normalized }));

    fase4Matches.push(
      ...this.compareLeftoversRelaxed(
        dataReferencia,
        tdRemaining2,
        gbRemaining2,
        transdataProcessedIds,
        globusMatchedIds,
        (n) => `${this.normalizeLineForKey(n.linha)}|${n.sentido}`,
        PASS2_WINDOW_MIN,
      )
    );

    // Passo 4.3: apenas linha, janela PASS3_WINDOW_MIN
    const tdRemaining3 = viagensTransdata
      .filter(t => !transdataProcessedIds.has(t.id.toString()))
      .map(t => ({ original: t, norm: normalizeTransDataTrip(t) }));
    const gbRemaining3 = normalizedGlobusTrips
      .filter(gw => !globusMatchedIds.has(gw.original.id))
      .map(gw => ({ original: gw.original, norm: gw.normalized }));

    fase4Matches.push(
      ...this.compareLeftoversRelaxed(
        dataReferencia,
        tdRemaining3,
        gbRemaining3,
        transdataProcessedIds,
        globusMatchedIds,
        (n) => `${this.normalizeLineForKey(n.linha)}`,
        PASS3_WINDOW_MIN,
      )
    );

    for (const match of fase4Matches) {
      todasComparacoes.push(match);
      estatisticas.matches++;
      if (match.statusComparacao === StatusComparacao.COMPATIVEL) estatisticas.compativeis++;
      else if (match.statusComparacao === StatusComparacao.HORARIO_DIVERGENTE) estatisticas.horarioDivergente++;
      else estatisticas.divergentes++;
    }

    this.logger.log(`? [FASE 4] Matches adicionais entre 'apenas' encontrados: ${fase4Matches.length}`);

    // --- FASE 5: REGISTRAR O QUE SOBROU (SEM PAR) ---
    this.logger.log(`?? [FASE 5] Registrando viagens sem par (Divergentes Reais)...`);
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
    this.logger.log(`? [FASE 5] Viagens apenas Transdata: ${estatisticas.apenasTransdata}, apenas Globus: ${estatisticas.apenasGlobus}`);

    await this.salvarComparacoes(todasComparacoes);
    this.logger.log(`?? ${todasComparacoes.length} comparações salvas.`);

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
    // Preencher horário realizado quando disponível
    const realizado: any = (transdata as any).InicioRealizadoText ?? (transdata as any).InicioRealizado ?? null;
    if (realizado instanceof Date && !isNaN(realizado.getTime())) {
      comparacao.transdataHorarioRealizado = realizado.toTimeString().substring(0, 5);
    } else if (typeof realizado === 'string') {
      if (realizado.includes(' ')) {
        comparacao.transdataHorarioRealizado = realizado.split(' ')[1]?.substring(0, 5) || null;
      } else {
        comparacao.transdataHorarioRealizado = realizado.substring(0, 5) || null;
      }
    }

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
    const diffHorario = Math.abs((new Date(`1970-01-01T${normTd.horario}:00`).getTime()) - (new Date(`1970-01-01T${normGb.horario}:00`).getTime())) / (1000 * 60);
    comparacao.diferencaHorarioMinutos = isNaN(diffHorario) ? -1 : diffHorario;
    comparacao.horarioCompativel = diffHorario <= 2;

    return comparacao;
  }

  private compareLeftovers(
    dataReferencia: string,
    transLeft: Array<{ original: ViagemTransdata; norm: NormalizedTransDataTrip }>,
    globusLeft: Array<{ original: ViagemGlobus; norm: NormalizedGlobusTrip }>,
    transdataProcessedIds: Set<string>,
    globusMatchedIds: Set<string>,
  ): ComparacaoViagem[] {
    if (transLeft.length === 0 || globusLeft.length === 0) return [];
    const matches: ComparacaoViagem[] = [];
    const buckets = new Map<string, Array<{ original: ViagemGlobus; norm: NormalizedGlobusTrip }>>();
    for (const gb of globusLeft) {
      const key = `${gb.norm.linha}|${gb.norm.servico}|${gb.norm.sentido}`;
      const arr = buckets.get(key) || [];
      arr.push(gb);
      buckets.set(key, arr);
    }
    for (const td of transLeft) {
      if (transdataProcessedIds.has(td.original.id.toString())) continue;
      const key = `${td.norm.linha}|${td.norm.servico}|${td.norm.sentido}`;
      const candidates = buckets.get(key) || [];
      let chosen: typeof candidates[number] | null = null;
      let bestDiff = Number.POSITIVE_INFINITY;
      for (const candidate of candidates) {
        if (globusMatchedIds.has(candidate.original.id)) continue;
        const diff = this.computeMinuteDiff(td.norm.horario, candidate.norm.horario);
        if (Number.isNaN(diff)) continue;
        if (diff < bestDiff) {
          bestDiff = diff;
          chosen = candidate;
        }
      }
      if (!chosen) continue;

      // Na fase relaxada, compara ignorando zeros à esquerda nas linhas
      const tdAdj = { ...td.norm, linha: this.normalizeLineForKey(td.norm.linha) } as NormalizedTransDataTrip;
      const gbAdj = { ...chosen.norm, linha: this.normalizeLineForKey(chosen.norm.linha) } as NormalizedGlobusTrip;
      const comb = compareTrips(tdAdj, gbAdj);
      const status = this.determinarStatusComparacao(comb);
      const obs = this.gerarObservacao(comb, td.norm, chosen.norm);
      const comparacao = this.criarComparacaoDetalhada(dataReferencia, td.original, chosen.original, status, obs, comb);
      matches.push(comparacao);
      transdataProcessedIds.add(td.original.id.toString());
      globusMatchedIds.add(chosen.original.id);
    }
    return matches;
  }

  private computeMinuteDiff(a: string, b: string): number {
    if (!a || !b) return Number.NaN;
    const t1 = new Date(`1970-01-01T${a}:00`);
    const t2 = new Date(`1970-01-01T${b}:00`);
    if (Number.isNaN(t1.getTime()) || Number.isNaN(t2.getTime())) return Number.NaN;
    return Math.abs(t1.getTime() - t2.getTime()) / (1000 * 60);
  }

  private compareLeftoversRelaxed(
    dataReferencia: string,
    transLeft: Array<{ original: ViagemTransdata; norm: NormalizedTransDataTrip }>,
    globusLeft: Array<{ original: ViagemGlobus; norm: NormalizedGlobusTrip }>,
    transdataProcessedIds: Set<string>,
    globusMatchedIds: Set<string>,
    groupKeyFn: (n: NormalizedGlobusTrip | NormalizedTransDataTrip) => string,
    maxTimeWindowMin: number,
  ): ComparacaoViagem[] {
    if (transLeft.length === 0 || globusLeft.length === 0) return [];
    const matches: ComparacaoViagem[] = [];

    // Bucketize Globus by the chosen grouping key
    const buckets = new Map<string, Array<{ original: ViagemGlobus; norm: NormalizedGlobusTrip }>>();
    for (const gb of globusLeft) {
      const key = groupKeyFn(gb.norm);
      const arr = buckets.get(key) || [];
      arr.push(gb);
      buckets.set(key, arr);
    }

    for (const td of transLeft) {
      if (transdataProcessedIds.has(td.original.id.toString())) continue;
      const key = groupKeyFn(td.norm);
      const candidates = buckets.get(key) || [];

      let chosen: typeof candidates[number] | null = null;
      let bestDiff = Number.POSITIVE_INFINITY;

      for (const candidate of candidates) {
        if (globusMatchedIds.has(candidate.original.id)) continue;
        const diff = this.computeMinuteDiff(td.norm.horario, candidate.norm.horario);
        if (Number.isNaN(diff)) continue;
        if (diff <= maxTimeWindowMin && diff < bestDiff) {
          bestDiff = diff;
          chosen = candidate;
        }
      }

      if (!chosen) continue;

      const comb = compareTrips(td.norm, chosen.norm);
      const status = this.determinarStatusComparacao(comb);
      const obs = this.gerarObservacao(comb, td.norm, chosen.norm);
      const comparacao = this.criarComparacaoDetalhada(dataReferencia, td.original, chosen.original, status, obs, comb);
      matches.push(comparacao);
      transdataProcessedIds.add(td.original.id.toString());
      globusMatchedIds.add(chosen.original.id);
    }

    return matches;
  }

  private normalizeLineForKey(value: string): string {
    const digits = String(value || '').replace(/[^0-9]/g, '');
    const noLead = digits.replace(/^0+/, '');
    return noLead.length > 0 ? noLead : '0';
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
    this.logger.log(`?? ${deletados.affected || 0} comparações removidas`);
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
    // Deleta o histórico existente para a mesma data de referência para evitar duplicatas
    await this.historicoRepository.delete({ dataReferencia: params.dataReferencia });

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
      qb.andWhere('h.dataReferencia >= :di', { di: query.dataInicial });
    }
    if (query.dataFinal) {
      qb.andWhere('h.dataReferencia <= :df', { df: query.dataFinal });
    }
    if (query.executedByEmail) {
      qb.andWhere('h.executedByEmail ILIKE :email', { email: `%${query.executedByEmail}%` });
    }

    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));

    const total = await qb.getCount();
    const items = await qb
      .orderBy('h.dataReferencia', 'DESC')
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
