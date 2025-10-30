import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ComparacaoViagem, StatusComparacao } from '../entities/comparacao-viagem.entity';
import { ViagemTransdata } from '../../viagens-transdata/entities/viagem-transdata.entity';
import { ViagemGlobus } from '../../viagens-globus/entities/viagem-globus.entity';
import { FiltrosComparacaoDto, ResultadoComparacaoDto } from '../dto';
import { normalizeTransDataTrip, normalizeGlobusTrip, compareTrips, CombinacaoComparacao, NormalizedTransDataTrip, NormalizedGlobusTrip } from '../utils/trip-comparator.util';

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
    const globusUsados = new Set<string>();
    const estatisticas = {
        compativeis: 0, divergentes: 0, horarioDivergente: 0,
        apenasTransdata: 0, apenasGlobus: 0, matches: 0
    };

    for (const viagemTd of viagensTransdata) {
        const normTd = normalizeTransDataTrip(viagemTd);
        let melhorMatch: { globus: ViagemGlobus; combinacao: CombinacaoComparacao } | null = null;

        for (const viagemGb of viagensGlobus) {
            if (globusUsados.has(viagemGb.id)) continue;

            const normGb = normalizeGlobusTrip(viagemGb);
            const combinacao = compareTrips(normTd, normGb);

            if (melhorMatch === null || combinacao < melhorMatch.combinacao) {
                melhorMatch = { globus: viagemGb, combinacao };
            }
        }

        if (melhorMatch && melhorMatch.combinacao <= CombinacaoComparacao.SO_LINHA_IGUAL) {
            globusUsados.add(melhorMatch.globus.id);
            const normGb = normalizeGlobusTrip(melhorMatch.globus);

            const status = this.determinarStatusComparacao(melhorMatch.combinacao);
            const observacao = this.gerarObservacao(melhorMatch.combinacao, normTd, normGb);

            const comparacao = this.criarComparacaoDetalhada(
                dataReferencia, viagemTd, melhorMatch.globus, status, observacao, melhorMatch.combinacao
            );
            todasComparacoes.push(comparacao);

            estatisticas.matches++;
            if (status === StatusComparacao.COMPATIVEL) estatisticas.compativeis++;
            else if (status === StatusComparacao.HORARIO_DIVERGENTE) estatisticas.horarioDivergente++;
            else estatisticas.divergentes++;

        } else {
            estatisticas.apenasTransdata++;
            todasComparacoes.push(this.criarComparacaoApenasTransdata(dataReferencia, viagemTd));
        }
    }

    for (const viagemGb of viagensGlobus) {
        if (!globusUsados.has(viagemGb.id)) {
            estatisticas.apenasGlobus++;
            todasComparacoes.push(this.criarComparacaoApenasGlobus(dataReferencia, viagemGb));
        }
    }

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
              return StatusComparacao.HORARIO_DIVERGENTE;
          default:
              return StatusComparacao.DIVERGENTE;
      }
  }

  private gerarObservacao(combinacao: CombinacaoComparacao, td: NormalizedTransDataTrip, gb: NormalizedGlobusTrip): string {
      const tpl = (t: string, g: string) => `(T: ${t} vs G: ${g})`;
      switch (combinacao) {
          case CombinacaoComparacao.TUDO_IGUAL: return 'Tudo igual';
          case CombinacaoComparacao.SO_HORARIO_DIFERENTE: return `Só horário diferente ${tpl(td.horario, gb.horario)}`;
          case CombinacaoComparacao.SO_SERVICO_DIFERENTE: return `Só serviço diferente ${tpl(td.servico, gb.servico)}`;
          case CombinacaoComparacao.SERVICO_E_HORARIO_DIFERENTES: return `Serviço ${tpl(td.servico, gb.servico)} e Horário ${tpl(td.horario, gb.horario)} diferentes`;
          case CombinacaoComparacao.SO_SENTIDO_DIFERENTE: return `Só sentido diferente ${tpl(td.sentido, gb.sentido)}`;
          case CombinacaoComparacao.SENTIDO_E_HORARIO_DIFERENTES: return `Sentido ${tpl(td.sentido, gb.sentido)} e Horário ${tpl(td.horario, gb.horario)} diferentes`;
          case CombinacaoComparacao.SENTIDO_E_SERVICO_DIFERENTES: return `Sentido ${tpl(td.sentido, gb.sentido)} e Serviço ${tpl(td.servico, gb.servico)} diferentes`;
          case CombinacaoComparacao.SO_LINHA_IGUAL: return `Só linha igual, outros campos divergem`;
          default: return `Divergência complexa (Combinação #${combinacao})`;
      }
  }

  private criarComparacaoDetalhada(
    dataReferencia: string,
    transdata: ViagemTransdata,
    globus: ViagemGlobus,
    status: StatusComparacao,
    observacao: string,
    combinacao: CombinacaoComparacao // ✅ Adicionar combinacao aqui
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
    comparacao.tipoCombinacao = combinacao; // ✅ Usar combinacao aqui

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
}
