import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

      // 1. Buscar viagens Globus com filtros aplicados
      const viagensGlobus = await this.buscarViagensGlobusComFiltros(dataReferencia, filtros);
      
      if (viagensGlobus.length === 0) {
        return this.criarResponseVazio(dataReferencia, filtros, startTime);
      }

      // 2. Buscar controles existentes para essas viagens
      const viagemIds = viagensGlobus.map(v => v.id);
      const controlesExistentes = await this.buscarControlesExistentes(dataReferencia, viagemIds);

      // 3. Mesclar dados
      const itensControle = this.mesclarDadosViagensControles(viagensGlobus, controlesExistentes);

      // 4. Aplicar paginação
      const { itensPaginados, total, temMaisPaginas } = this.aplicarPaginacao(
        itensControle,
        filtros.pagina || 0,
        filtros.limite || 100
      );

      // 5. Calcular estatísticas
      const estatisticas = await this.calcularEstatisticasOtimizado(dataReferencia);

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
  
    // ✅ Validar dados recebidos
    if (!dados.controles || dados.controles.length === 0) {
      throw new BadRequestException('Nenhum controle fornecido para salvamento');
    }
  
    if (!dados.dataReferencia) {
      throw new BadRequestException('Data de referência é obrigatória');
    }
  
    // ✅ Processar controles em lote
    for (const controle of dados.controles) {
      try {
        // Validar se o controle tem dados válidos
        if (!controle.viagemGlobusId) {
          this.logger.warn(`⚠️ Controle sem viagemGlobusId, pulando...`);
          erros++;
          continue;
        }
  
        await this.salvarControleHorario(dados.dataReferencia, controle, usuarioEmail);
        salvos++;
        
        this.logger.log(`✅ Controle ${salvos}/${dados.controles.length} salvo: ${controle.viagemGlobusId}`);
      } catch (error) {
        this.logger.error(`❌ Erro ao salvar controle ${controle.viagemGlobusId}: ${error.message}`);
        erros++;
      }
    }
  
    const message = `Salvamento concluído: ${salvos} sucessos, ${erros} erros`;
    this.logger.log(`📊 ${message}`);
  
    return {
      success: erros === 0,
      message,
      salvos,
      erros,
    };
  }
  async buscarOpcoesControleHorarios(dataReferencia: string): Promise<OpcoesControleHorariosDto> {
    try {
      this.logger.log(`🔍 Buscando opções para filtros da data ${dataReferencia}`);

      // Buscar opções únicas das viagens Globus
      const [setores, linhas, servicos, sentidos, motoristas] = await Promise.all([
        // Setores únicos
        this.viagemGlobusRepository
          .createQueryBuilder('vg')
          .select('DISTINCT vg.setorPrincipal', 'setor')
          .where('vg.dataReferencia = :dataReferencia AND vg.setorPrincipal IS NOT NULL', { dataReferencia })
          .orderBy('vg.setorPrincipal')
          .getRawMany(),

        // Linhas únicas
        this.viagemGlobusRepository
          .createQueryBuilder('vg')
          .select(['DISTINCT vg.codigoLinha AS codigo', 'vg.nomeLinha AS nome'])
          .where('vg.dataReferencia = :dataReferencia AND vg.codigoLinha IS NOT NULL', { dataReferencia })
          .orderBy('vg.codigoLinha')
          .getRawMany(),

        // Serviços únicos
        this.viagemGlobusRepository
          .createQueryBuilder('vg')
          .select('DISTINCT vg.codServicoNumero', 'servico')
          .where('vg.dataReferencia = :dataReferencia AND vg.codServicoNumero IS NOT NULL', { dataReferencia })
          .orderBy('vg.codServicoNumero')
          .getRawMany(),

        // Sentidos únicos
        this.viagemGlobusRepository
          .createQueryBuilder('vg')
          .select('DISTINCT vg.sentidoTexto', 'sentido')
          .where('vg.dataReferencia = :dataReferencia AND vg.sentidoTexto IS NOT NULL', { dataReferencia })
          .orderBy('vg.sentidoTexto')
          .getRawMany(),

        // Motoristas únicos (limitado a 100)
        this.viagemGlobusRepository
          .createQueryBuilder('vg')
          .select('DISTINCT vg.nomeMotorista', 'motorista')
          .where('vg.dataReferencia = :dataReferencia AND vg.nomeMotorista IS NOT NULL', { dataReferencia })
          .orderBy('vg.nomeMotorista')
          .limit(100)
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

      // Buscar última atualização
      const ultimaAtualizacao = await this.controleHorarioRepository
        .createQueryBuilder('ch')
        .select('MAX(ch.updatedAt)', 'ultima')
        .where('ch.dataReferencia = :dataReferencia', { dataReferencia })
        .getRawOne();

      return {
        dataReferencia,
        totalViagens,
        viagensEditadas,
        viagensNaoEditadas: totalViagens - viagensEditadas,
        percentualEditado,
        ultimaAtualizacao: ultimaAtualizacao?.ultima || null,
      };

    } catch (error) {
      this.logger.error(`❌ Erro ao obter estatísticas: ${error.message}`);
      throw error;
    }
  }

  // ===============================================
  // MÉTODOS PRIVADOS
  // ===============================================

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

    // Aplicar limite se especificado
    if (filtros.limite) {
      query = query.limit(filtros.limite);
    }

    return await query.getMany();
  }

  private async buscarControlesExistentes(
    dataReferencia: string,
    viagemIds: string[],
  ): Promise<ControleHorario[]> {
    if (viagemIds.length === 0) return [];

    return await this.controleHorarioRepository
      .createQueryBuilder('ch')
      .where('ch.dataReferencia = :dataReferencia', { dataReferencia })
      .andWhere('ch.viagemGlobusId IN (:...viagemIds)', { viagemIds })
      .getMany();
  }

  private mesclarDadosViagensControles(
    viagensGlobus: ViagemGlobus[],
    controlesExistentes: ControleHorario[],
  ): ControleHorarioItemDto[] {
    // Criar mapa de controles por viagemGlobusId para busca rápida
    const mapaControles = new Map<string, ControleHorario>();
    controlesExistentes.forEach(controle => {
      mapaControles.set(controle.viagemGlobusId, controle);
    });

    return viagensGlobus.map(viagem => {
      const controle = mapaControles.get(viagem.id);

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
        id: controle?.id,
        numeroCarro: controle?.numeroCarro,
        informacaoRecolhe: controle?.informacaoRecolhe,
        crachaFuncionario: controle?.crachaFuncionario,
        observacoes: controle?.observacoes,
        usuarioEdicao: controle?.usuarioEdicao,
        usuarioEmail: controle?.usuarioEmail,
        updatedAt: controle?.updatedAt,
        jaFoiEditado: !!controle,
      };

      return {
        viagemGlobus: viagemGlobusDto,
        dadosEditaveis: dadosEditaveisDto,
      };
    });
  }

  private async calcularEstatisticasOtimizado(dataReferencia: string) {
    const [totalViagens, viagensEditadas, setoresResult, linhasResult, servicosResult] = await Promise.all([
      this.viagemGlobusRepository.count({
        where: { dataReferencia }
      }),
      this.controleHorarioRepository.count({
        where: { dataReferencia }
      }),
      this.viagemGlobusRepository
        .createQueryBuilder('vg')
        .select('DISTINCT vg.setorPrincipal')
        .where('vg.dataReferencia = :dataReferencia', { dataReferencia })
        .getRawMany(),
      this.viagemGlobusRepository
        .createQueryBuilder('vg')
        .select('DISTINCT vg.codigoLinha')
        .where('vg.dataReferencia = :dataReferencia', { dataReferencia })
        .getRawMany(),
      this.viagemGlobusRepository
        .createQueryBuilder('vg')
        .select('DISTINCT vg.codServicoNumero')
        .where('vg.dataReferencia = :dataReferencia', { dataReferencia })
        .getRawMany(),
    ]);

    const viagensNaoEditadas = totalViagens - viagensEditadas;
    const percentualEditado = totalViagens > 0 ? 
      Math.round((viagensEditadas / totalViagens) * 100) : 0;

    return {
      totalViagens,
      viagensEditadas,
      viagensNaoEditadas,
      percentualEditado,
      setoresUnicos: setoresResult.map(s => s.vg_setor_principal).filter(Boolean),
      linhasUnicas: linhasResult.map(l => l.vg_codigo_linha).filter(Boolean),
      servicosUnicos: servicosResult.map(s => s.vg_cod_servico_numero).filter(Boolean),
    };
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