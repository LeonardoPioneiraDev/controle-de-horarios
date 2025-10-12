import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ControleHorario } from '../entities/controle-horario.entity';
import { ViagemGlobus } from '../../viagens-globus/entities/viagem-globus.entity';
import {
  FiltrosControleHorariosDto,
  SalvarControleHorariosDto,
  SalvarMultiplosControleHorariosDto,
  ControleHorarioResponseDto,
  ControleHorarioItemDto,
  ViagemGlobusBaseDto,
  DadosEditaveisDto,
  OpcoesControleHorariosDto,
} from '../dto';

@Injectable()
export class ControleHorariosService {
  private readonly logger = new Logger(ControleHorariosService.name);

  constructor(
    @InjectRepository(ControleHorario)
    private readonly controleHorarioRepository: Repository<ControleHorario>,
    @InjectRepository(ViagemGlobus)
    private readonly viagemGlobusRepository: Repository<ViagemGlobus>,
  ) {}

  async buscarControleHorarios(
    dataReferencia: string,
    filtros: FiltrosControleHorariosDto,
    usuarioEmail: string,
  ): Promise<ControleHorarioResponseDto> {
    const startTime = Date.now();
    
    try {
      this.logger.log(`🔍 Buscando controle de horários para ${dataReferencia}`);
      
      // Validar formato da data
      if (!this.isValidDate(dataReferencia)) {
        throw new BadRequestException('Formato de data inválido. Use YYYY-MM-DD');
      }

      // 1. Buscar viagens Globus com filtros
      const viagensGlobus = await this.buscarViagensGlobusComFiltros(dataReferencia, filtros);
      
      if (viagensGlobus.length === 0) {
        return this.criarResponseVazio(dataReferencia, filtros, startTime);
      }

      // 2. Buscar dados editáveis existentes
      const viagemIds = viagensGlobus.map(v => v.id);
      const dadosEditaveis = await this.buscarDadosEditaveis(dataReferencia, viagemIds);

      // 3. Mesclar dados
      const itensControle = this.mesclarDados(viagensGlobus, dadosEditaveis);

      // 4. Aplicar paginação
      const { itensPaginados, total, temMaisPaginas } = this.aplicarPaginacao(
        itensControle,
        filtros.pagina || 0,
        filtros.limite || 100
      );

      // 5. Calcular estatísticas
      const estatisticas = this.calcularEstatisticas(viagensGlobus, dadosEditaveis);

      const executionTime = `${Date.now() - startTime}ms`;
      
      this.logger.log(`✅ Encontradas ${total} viagens para ${dataReferencia} em ${executionTime}`);

      return {
        success: true,
        message: `Controle de horários obtido com sucesso`,
        data: itensPaginados,
        total,
        pagina: filtros.pagina || 0,
        limite: filtros.limite || 100,
        temMaisPaginas,
        filtrosAplicados: filtros,
        estatisticas,
        executionTime,
        dataReferencia,
      };

    } catch (error) {
      this.logger.error(`❌ Erro ao buscar controle de horários: ${error.message}`);
      throw error;
    }
  }

  async salvarControleHorario(
    dataReferencia: string,
    dados: SalvarControleHorariosDto,
    usuarioEmail: string,
  ): Promise<{ success: boolean; message: string; data: any }> {
    try {
      this.logger.log(`💾 Salvando controle para viagem ${dados.viagemGlobusId}`);

      // Validar se a viagem Globus existe
      const viagemGlobus = await this.viagemGlobusRepository.findOne({
        where: { 
          id: dados.viagemGlobusId,
          dataReferencia 
        }
      });

      if (!viagemGlobus) {
        throw new NotFoundException('Viagem Globus não encontrada');
      }

      // Buscar controle existente ou criar novo
      let controleExistente = await this.controleHorarioRepository.findOne({
        where: {
          viagemGlobusId: dados.viagemGlobusId,
          dataReferencia,
        }
      });

      if (controleExistente) {
        // Atualizar existente
        controleExistente.numeroCarro = dados.numeroCarro;
        controleExistente.informacaoRecolhe = dados.informacaoRecolhe;
        controleExistente.crachaFuncionario = dados.crachaFuncionario;
        controleExistente.observacoes = dados.observacoes;
        controleExistente.usuarioEdicao = usuarioEmail;
        controleExistente.usuarioEmail = usuarioEmail;

        await this.controleHorarioRepository.save(controleExistente);
        
        this.logger.log(`✅ Controle atualizado para viagem ${dados.viagemGlobusId}`);
        
        return {
          success: true,
          message: 'Controle de horário atualizado com sucesso',
          data: controleExistente,
        };
      } else {
        // Criar novo
        const novoControle = this.controleHorarioRepository.create({
          viagemGlobusId: dados.viagemGlobusId,
          dataReferencia,
          codigoLinha: viagemGlobus.codigoLinha,
          nomeLinha: viagemGlobus.nomeLinha,
          codServicoNumero: viagemGlobus.codServicoNumero,
          sentidoTexto: viagemGlobus.sentidoTexto,
          setorPrincipal: viagemGlobus.setorPrincipal,
          horarioSaida: viagemGlobus.horSaidaTime,
          horarioChegada: viagemGlobus.horChegadaTime,
          nomeMotorista: viagemGlobus.nomeMotorista,
          localOrigem: viagemGlobus.localOrigemViagem,
          numeroCarro: dados.numeroCarro,
          informacaoRecolhe: dados.informacaoRecolhe,
          crachaFuncionario: dados.crachaFuncionario,
          observacoes: dados.observacoes,
          usuarioEdicao: usuarioEmail,
          usuarioEmail: usuarioEmail,
        });

        const controleSalvo = await this.controleHorarioRepository.save(novoControle);
        
        this.logger.log(`✅ Novo controle criado para viagem ${dados.viagemGlobusId}`);
        
        return {
          success: true,
          message: 'Controle de horário criado com sucesso',
          data: controleSalvo,
        };
      }

    } catch (error) {
      this.logger.error(`❌ Erro ao salvar controle: ${error.message}`);
      throw error;
    }
  }

  async salvarMultiplosControles(
    dados: SalvarMultiplosControleHorariosDto,
    usuarioEmail: string,
  ): Promise<{ success: boolean; message: string; salvos: number; erros: number }> {
    let salvos = 0;
    let erros = 0;

    this.logger.log(`💾 Salvando ${dados.controles.length} controles para ${dados.dataReferencia}`);

    for (const controle of dados.controles) {
      try {
        await this.salvarControleHorario(dados.dataReferencia, controle, usuarioEmail);
        salvos++;
      } catch (error) {
        this.logger.error(`❌ Erro ao salvar controle ${controle.viagemGlobusId}: ${error.message}`);
        erros++;
      }
    }

    return {
      success: erros === 0,
      message: `Salvamento concluído: ${salvos} sucessos, ${erros} erros`,
      salvos,
      erros,
    };
  }

  async buscarOpcoesControleHorarios(dataReferencia: string): Promise<OpcoesControleHorariosDto> {
    try {
      this.logger.log(`🔍 Buscando opções para filtros da data ${dataReferencia}`);

      const query = this.viagemGlobusRepository
        .createQueryBuilder('vg')
        .where('vg.dataReferencia = :dataReferencia', { dataReferencia });

      // Buscar opções únicas
      const [setores, linhas, servicos, sentidos, motoristas] = await Promise.all([
        // Setores únicos
        query.clone()
          .select('DISTINCT vg.setorPrincipal', 'setor')
          .where('vg.dataReferencia = :dataReferencia AND vg.setorPrincipal IS NOT NULL', { dataReferencia })
          .orderBy('vg.setorPrincipal')
          .getRawMany(),

        // Linhas únicas
        query.clone()
          .select(['DISTINCT vg.codigoLinha AS codigo', 'vg.nomeLinha AS nome'])
          .where('vg.dataReferencia = :dataReferencia AND vg.codigoLinha IS NOT NULL', { dataReferencia })
          .orderBy('vg.codigoLinha')
          .getRawMany(),

        // Serviços únicos
        query.clone()
          .select('DISTINCT vg.codServicoNumero', 'servico')
          .where('vg.dataReferencia = :dataReferencia AND vg.codServicoNumero IS NOT NULL', { dataReferencia })
          .orderBy('vg.codServicoNumero')
          .getRawMany(),

        // Sentidos únicos
        query.clone()
          .select('DISTINCT vg.sentidoTexto', 'sentido')
          .where('vg.dataReferencia = :dataReferencia AND vg.sentidoTexto IS NOT NULL', { dataReferencia })
          .orderBy('vg.sentidoTexto')
          .getRawMany(),

        // Motoristas únicos
        query.clone()
          .select('DISTINCT vg.nomeMotorista', 'motorista')
          .where('vg.dataReferencia = :dataReferencia AND vg.nomeMotorista IS NOT NULL', { dataReferencia })
          .orderBy('vg.nomeMotorista')
          .getRawMany(),
      ]);

      return {
        setores: setores.map(s => s.setor).filter(Boolean),
        linhas: linhas.map(l => ({ codigo: l.codigo, nome: l.nome })).filter(l => l.codigo),
        servicos: servicos.map(s => s.servico).filter(Boolean),
        sentidos: sentidos.map(s => s.sentido).filter(Boolean),
        motoristas: motoristas.map(m => m.motorista).filter(Boolean),
      };

    } catch (error) {
      this.logger.error(`❌ Erro ao buscar opções: ${error.message}`);
      throw error;
    }
  }

  async obterEstatisticasControleHorarios(dataReferencia: string): Promise<any> {
    try {
      const [totalViagens, viagensEditadas] = await Promise.all([
        this.viagemGlobusRepository.count({
          where: { dataReferencia }
        }),
        this.controleHorarioRepository.count({
          where: { dataReferencia }
        }),
      ]);

      const percentualEditado = totalViagens > 0 ? 
        Math.round((viagensEditadas / totalViagens) * 100) : 0;

      return {
        dataReferencia,
        totalViagens,
        viagensEditadas,
        viagensNaoEditadas: totalViagens - viagensEditadas,
        percentualEditado,
        ultimaAtualizacao: new Date(),
      };

    } catch (error) {
      this.logger.error(`❌ Erro ao obter estatísticas: ${error.message}`);
      throw error;
    }
  }

  // MÉTODOS PRIVADOS

  private async buscarViagensGlobusComFiltros(
    dataReferencia: string,
    filtros: FiltrosControleHorariosDto,
  ): Promise<ViagemGlobus[]> {
    let query = this.viagemGlobusRepository
      .createQueryBuilder('vg')
      .where('vg.dataReferencia = :dataReferencia', { dataReferencia });

    // Aplicar filtros
    if (filtros.setorPrincipal) {
      query = query.andWhere('vg.setorPrincipal = :setorPrincipal', { 
        setorPrincipal: filtros.setorPrincipal 
      });
    }

    if (filtros.codigoLinha) {
      query = query.andWhere('vg.codigoLinha = :codigoLinha', { 
        codigoLinha: filtros.codigoLinha 
      });
    }

    if (filtros.codServicoNumero) {
      query = query.andWhere('vg.codServicoNumero = :codServicoNumero', { 
        codServicoNumero: filtros.codServicoNumero 
      });
    }

    if (filtros.sentidoTexto) {
      query = query.andWhere('UPPER(vg.sentidoTexto) = :sentidoTexto', { 
        sentidoTexto: filtros.sentidoTexto.toUpperCase() 
      });
    }

    if (filtros.horarioInicio) {
      query = query.andWhere('vg.horSaidaTime >= :horarioInicio', { 
        horarioInicio: filtros.horarioInicio 
      });
    }

    if (filtros.horarioFim) {
      query = query.andWhere('vg.horSaidaTime <= :horarioFim', { 
        horarioFim: filtros.horarioFim 
      });
    }

    if (filtros.nomeMotorista) {
      query = query.andWhere('UPPER(vg.nomeMotorista) LIKE :nomeMotorista', { 
        nomeMotorista: `%${filtros.nomeMotorista.toUpperCase()}%` 
      });
    }

    if (filtros.localOrigem) {
      query = query.andWhere('UPPER(vg.localOrigemViagem) LIKE :localOrigem', { 
        localOrigem: `%${filtros.localOrigem.toUpperCase()}%` 
      });
    }

    if (filtros.buscaTexto) {
      const buscaUpper = `%${filtros.buscaTexto.toUpperCase()}%`;
      query = query.andWhere(
        '(UPPER(vg.codigoLinha) LIKE :busca OR UPPER(vg.nomeLinha) LIKE :busca OR UPPER(vg.nomeMotorista) LIKE :busca OR UPPER(vg.localOrigemViagem) LIKE :busca)',
        { busca: buscaUpper }
      );
    }

    // Ordenação
    query = query.orderBy('vg.setorPrincipal', 'ASC')
                 .addOrderBy('vg.codigoLinha', 'ASC')
                 .addOrderBy('vg.sentidoTexto', 'ASC')
                 .addOrderBy('vg.horSaidaTime', 'ASC');

    return await query.getMany();
  }

  private async buscarDadosEditaveis(
    dataReferencia: string,
    viagemIds: string[],
  ): Promise<ControleHorario[]> {
    if (viagemIds.length === 0) return [];

    return await this.controleHorarioRepository.find({
      where: {
        dataReferencia,
        viagemGlobusId: viagemIds.length === 1 ? viagemIds[0] : undefined,
      },
    });
  }

  private mesclarDados(
    viagensGlobus: ViagemGlobus[],
    dadosEditaveis: ControleHorario[],
  ): ControleHorarioItemDto[] {
    const mapaEditaveis = new Map<string, ControleHorario>();
    dadosEditaveis.forEach(item => {
      mapaEditaveis.set(item.viagemGlobusId, item);
    });

    return viagensGlobus.map(viagem => {
      const editavel = mapaEditaveis.get(viagem.id);

      const viagemGlobusDto: ViagemGlobusBaseDto = {
        id: viagem.id,
        codigoLinha: viagem.codigoLinha,
        nomeLinha: viagem.nomeLinha,
        codServicoNumero: viagem.codServicoNumero,
        sentidoTexto: viagem.sentidoTexto,
        horSaidaTime: viagem.horSaidaTime,
        horChegadaTime: viagem.horChegadaTime,
        nomeMotorista: viagem.nomeMotorista,
        setorPrincipal: viagem.setorPrincipal,
        localOrigemViagem: viagem.localOrigemViagem,
        duracaoMinutos: viagem.duracaoMinutos,
        periodoDoDia: viagem.periodoDoDia,
        flgSentido: viagem.flgSentido,
      };

      const dadosEditaveisDto: DadosEditaveisDto = {
        id: editavel?.id,
        numeroCarro: editavel?.numeroCarro,
        informacaoRecolhe: editavel?.informacaoRecolhe,
        crachaFuncionario: editavel?.crachaFuncionario,
        observacoes: editavel?.observacoes,
        usuarioEdicao: editavel?.usuarioEdicao,
        usuarioEmail: editavel?.usuarioEmail,
        updatedAt: editavel?.updatedAt,
        jaFoiEditado: !!editavel,
      };

      return {
        viagemGlobus: viagemGlobusDto,
        dadosEditaveis: dadosEditaveisDto,
      };
    });
  }

  private aplicarPaginacao(
    itens: ControleHorarioItemDto[],
    pagina: number,
    limite: number,
  ): { itensPaginados: ControleHorarioItemDto[]; total: number; temMaisPaginas: boolean } {
    const total = itens.length;
    const inicio = pagina * limite;
    const fim = inicio + limite;
    const itensPaginados = itens.slice(inicio, fim);
    const temMaisPaginas = fim < total;

    return { itensPaginados, total, temMaisPaginas };
  }

  private calcularEstatisticas(viagensGlobus: ViagemGlobus[], dadosEditaveis: ControleHorario[]) {
    const totalViagens = viagensGlobus.length;
    const viagensEditadas = dadosEditaveis.length;
    const viagensNaoEditadas = totalViagens - viagensEditadas;
    const percentualEditado = totalViagens > 0 ? 
      Math.round((viagensEditadas / totalViagens) * 100) : 0;

    const setoresUnicos = [...new Set(viagensGlobus.map(v => v.setorPrincipal).filter(Boolean))];
    const linhasUnicas = [...new Set(viagensGlobus.map(v => v.codigoLinha).filter(Boolean))];
    const servicosUnicos = [...new Set(viagensGlobus.map(v => v.codServicoNumero).filter(Boolean))];

    return {
      totalViagens,
      viagensEditadas,
      viagensNaoEditadas,
      percentualEditado,
      setoresUnicos,
      linhasUnicas,
      servicosUnicos,
    };
  }

  private criarResponseVazio(
    dataReferencia: string,
    filtros: FiltrosControleHorariosDto,
    startTime: number,
  ): ControleHorarioResponseDto {
    return {
      success: true,
      message: 'Nenhuma viagem encontrada para os filtros aplicados',
      data: [],
      total: 0,
      pagina: filtros.pagina || 0,
      limite: filtros.limite || 100,
      temMaisPaginas: false,
      filtrosAplicados: filtros,
      estatisticas: {
        totalViagens: 0,
        viagensEditadas: 0,
        viagensNaoEditadas: 0,
        percentualEditado: 0,
        setoresUnicos: [],
        linhasUnicas: [],
        servicosUnicos: [],
      },
      executionTime: `${Date.now() - startTime}ms`,
      dataReferencia,
    };
  }

  private isValidDate(dateString: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }
}