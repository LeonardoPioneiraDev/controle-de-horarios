// src/modules/controle-horarios/services/controle-horarios.service.ts

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
import { normalizeTransDataTrip, normalizeGlobusTrip, compareTrips } from '../../comparacao-viagens/utils/trip-comparator.util';

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

      // 1. Buscar viagens Globus com filtros aplicados e paginação
      const { viagens: viagensGlobus, total: totalViagensGlobus } = await this.buscarViagensGlobusComFiltros(dataReferencia, filtros);
      
      if (viagensGlobus.length === 0) {
        return this.criarResponseVazio(dataReferencia, filtros, startTime);
      }

      // 2. Buscar controles existentes para essas viagens
      const viagemIds = viagensGlobus.map(v => v.id);
      const controlesExistentes = await this.buscarControlesExistentes(dataReferencia, viagemIds);

      // 3. Mesclar dados
      let itensControle = this.mesclarDadosViagensControles(viagensGlobus, controlesExistentes);

      // 3.1. Aplicar filtro de viagens editadas pelo usuário, se solicitado
      if (filtros.editadoPorUsuario === true) {
        itensControle = itensControle.filter(item => 
          item.dadosEditaveis.jaFoiEditado && item.dadosEditaveis.usuarioEmail === usuarioEmail
        );
      } else if (filtros.editadoPorUsuario === false) {
        itensControle = itensControle.filter(item => !item.dadosEditaveis.jaFoiEditado);
      }

      // 3.2. Aplicar filtro por combinação de comparação, se solicitado
      if (filtros.combinacaoComparacao) {
        itensControle = itensControle.filter(item => {
          const mockTransDataTrip = {
            NomeLinha: item.viagemGlobus.nomeLinha,
            SentidoText: item.viagemGlobus.sentidoTexto,
            Servico: parseInt(item.viagemGlobus.codServicoNumero, 10),
            InicioPrevistoText: item.viagemGlobus.horSaidaTime,
          };

          const normalizedTransData = normalizeTransDataTrip(mockTransDataTrip);
          const normalizedGlobus = normalizeGlobusTrip(item.viagemGlobus);
          const combinacao = compareTrips(normalizedTransData, normalizedGlobus);
          return combinacao === filtros.combinacaoComparacao;
        });
      }

      // 4. Calcular estatísticas
      const estatisticas = await this.calcularEstatisticasOtimizado(dataReferencia);

      const limite = filtros.limite || 100;
      const pagina = filtros.pagina || 0;
      const temMaisPaginas = (pagina + 1) * limite < totalViagensGlobus;

      const executionTime = `${Date.now() - startTime}ms`;
      
      this.logger.log(`✅ Encontradas ${viagensGlobus.length} viagens (total: ${totalViagensGlobus}) para ${dataReferencia} em ${executionTime}`);

      return {
        success: true,
        message: `Controle de horários obtido com sucesso`,
        data: itensControle,
        total: totalViagensGlobus,
        pagina: pagina,
        limite: limite,
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
        // Armazenar valores originais para detecção de mudança
        const originalNumeroCarro = controleExistente.numeroCarro;
        const originalCrachaFuncionario = controleExistente.crachaFuncionario;
        const originalObservacoes = controleExistente.observacoes;

        // Atualizar existente
        controleExistente.numeroCarro = dados.numeroCarro;
        controleExistente.informacaoRecolhe = dados.informacaoRecolhe;
        controleExistente.crachaFuncionario = dados.crachaFuncionario;
        controleExistente.observacoes = dados.observacoes;
        controleExistente.usuarioEdicao = usuarioEmail;
        controleExistente.usuarioEmail = usuarioEmail;

        await this.controleHorarioRepository.save(controleExistente);
        
        this.logger.log(`✅ Controle atualizado para viagem ${dados.viagemGlobusId}`);

        // ✅ Lógica de atualização automática para viagens relacionadas
        const changedNumeroCarro = originalNumeroCarro !== dados.numeroCarro;
        const changedCrachaFuncionario = originalCrachaFuncionario !== dados.crachaFuncionario;
        const changedObservacoes = originalObservacoes !== dados.observacoes;

        if (changedNumeroCarro || changedCrachaFuncionario || changedObservacoes) {
          await this.aplicarAtualizacaoEmEscala(
            viagemGlobus,
            dataReferencia,
            { 
              numeroCarro: changedNumeroCarro ? dados.numeroCarro : undefined,
              crachaFuncionario: changedCrachaFuncionario ? dados.crachaFuncionario : undefined,
              observacoes: changedObservacoes ? dados.observacoes : undefined,
            },
            usuarioEmail
          );
        }
        
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
          numeroCarro: dados.numeroCarro,
          informacaoRecolhe: dados.informacaoRecolhe,
          crachaFuncionario: dados.crachaFuncionario,
          observacoes: dados.observacoes,
          usuarioEdicao: usuarioEmail,
          usuarioEmail: usuarioEmail,
          isAtivo: true,
        });

        const controleSalvo = await this.controleHorarioRepository.save(novoControle);

        // ✅ Lógica de atualização automática para viagens relacionadas (apenas se for um novo registro)
        await this.aplicarAtualizacaoEmEscala(
          viagemGlobus,
          dataReferencia,
          { 
            numeroCarro: dados.numeroCarro,
            crachaFuncionario: dados.crachaFuncionario,
            observacoes: dados.observacoes,
          },
          usuarioEmail
        );
        
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
      const [setores, linhas, servicos, sentidos, motoristas, locaisOrigem, locaisDestino] = await Promise.all([
        // ✅ Setores únicos - campo correto
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

        // ✅ Locais de origem únicos
        this.viagemGlobusRepository
          .createQueryBuilder('vg')
          .select('DISTINCT vg.localOrigemViagem', 'local')
          .where('vg.dataReferencia = :dataReferencia AND vg.localOrigemViagem IS NOT NULL', { dataReferencia })
          .orderBy('vg.localOrigemViagem')
          .limit(100)
          .getRawMany(),

        // ✅ Locais de destino únicos (REMOVIDO)
        Promise.resolve([]),
      ]);

      return {
        setores: setores.map(s => s.setor).filter(Boolean),
        linhas: linhas.map(l => ({ codigo: l.codigo, nome: l.nome })).filter(l => l.codigo),
        servicos: servicos.map(s => s.servico).filter(Boolean),
        sentidos: sentidos.map(s => s.sentido).filter(Boolean),
        motoristas: motoristas.map(m => m.motorista).filter(Boolean),
        locaisOrigem: locaisOrigem.map(l => l.local).filter(Boolean),
        locaisDestino: [], // ✅ REMOVIDO
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
          where: { dataReferencia, isAtivo: true }
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
  ): Promise<{ viagens: ViagemGlobus[], total: number }> {
    let query = this.viagemGlobusRepository
      .createQueryBuilder('vg')
      .select([
        'vg.id',
        'vg.setorPrincipal',
        'vg.codLocalTerminalSec',
        'vg.codigoLinha',
        'vg.nomeLinha',
        // 'vg.codDestinoLinha',
        // 'vg.localDestinoLinha',
        'vg.flgSentido',
        'vg.dataViagem',
        // 'vg.descTipoDia',
        'vg.horSaida',
        'vg.horChegada',
        'vg.horSaidaTime',
        'vg.horChegadaTime',
        'vg.codOrigemViagem',
        'vg.localOrigemViagem',
        // 'vg.codAtividade',
        // 'vg.nomeAtividade',
        // 'vg.flgTipo',
        'vg.codServicoCompleto',
        'vg.codServicoNumero',
        'vg.codMotorista',
        'vg.nomeMotorista',
        'vg.codCobrador',
        'vg.nomeCobrador',
        // 'vg.crachaMotorista',
        // 'vg.chapaFuncMotorista',
        // 'vg.crachaCobrador',
        // 'vg.chapaFuncCobrador',
        'vg.totalHorarios',
        'vg.duracaoMinutos',
        'vg.dataReferencia',
        'vg.hashDados',
        'vg.createdAt',
        'vg.updatedAt',
        'vg.sentidoTexto',
        'vg.periodoDoDia',
        'vg.temCobrador',
        'vg.origemDados',
        'vg.isAtivo',
      ])
      .where('vg.dataReferencia = :dataReferencia', { dataReferencia });
  
    // ✅ CORRIGIR FILTROS
    if (filtros.setorPrincipal) {
      query = query.andWhere('vg.setorPrincipal = :setorPrincipal', { 
        setorPrincipal: filtros.setorPrincipal 
      });
    }
  
    if (filtros.codigoLinha) {
      // ✅ Se for array, usar IN
      if (Array.isArray(filtros.codigoLinha)) {
        query = query.andWhere('vg.codigoLinha IN (:...codigoLinha)', { 
          codigoLinha: filtros.codigoLinha 
        });
      } else {
        query = query.andWhere('vg.codigoLinha = :codigoLinha', { 
          codigoLinha: filtros.codigoLinha 
        });
      }
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
  
    if (filtros.codAtividade) {
      // query = query.andWhere('vg.codAtividade = :codAtividade', { 
      //   codAtividade: filtros.codAtividade 
      // });
    }
  
    if (filtros.localDestino) {
      // query = query.andWhere('UPPER(vg.localDestinoLinha) LIKE :localDestino', { 
      //   localDestino: `%${filtros.localDestino.toUpperCase()}%` 
      // });
    }
  
    if (filtros.crachaMotorista) {
      query = query.andWhere('UPPER(vg.crachaMotorista) LIKE :crachaMotorista', { 
        crachaMotorista: `%${filtros.crachaMotorista.toUpperCase()}%` 
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
    query = query.orderBy('vg.setorPrincipal', 'ASC')  // ✅ CORRIGIDO
                 .addOrderBy('vg.codigoLinha', 'ASC')
                 .addOrderBy('vg.sentidoTexto', 'ASC')
                 .addOrderBy('vg.horSaidaTime', 'ASC');
  
    // Aplicar paginação
    if (filtros.limite) {
      query = query.limit(filtros.limite);
    }
  
    if (filtros.pagina && filtros.limite) {
      query = query.offset((filtros.pagina) * filtros.limite);
    }
  
    const [viagens, total] = await query.getManyAndCount();
    return { viagens, total };
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
        setorPrincipal: viagem.setorPrincipal, // ✅ CORRIGIDO: usar o campo correto
        localOrigemViagem: viagem.localOrigemViagem,
        duracaoMinutos: viagem.duracaoMinutos,
        periodoDoDia: viagem.periodoDoDia,
        flgSentido: viagem.flgSentido,
        // Novos campos da ViagemGlobus (removidos)
        // codDestinoLinha: viagem.codDestinoLinha,
        // localDestinoLinha: viagem.localDestinoLinha,
        // descTipoDia: viagem.descTipoDia,
        codOrigemViagem: viagem.codOrigemViagem,
        // codAtividade: viagem.codAtividade,
        // nomeAtividade: viagem.nomeAtividade,
        // flgTipo: viagem.flgTipo,
        // crachaMotorista: viagem.crachaMotorista,
        // chapaFuncMotorista: viagem.chapaFuncMotorista,
        // crachaCobrador: viagem.crachaCobrador,
        // chapaFuncCobrador: viagem.chapaFuncCobrador,
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
        .select('DISTINCT vg.setorPrincipal')  // ✅ CORRIGIDO
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
      setoresUnicos: setoresResult.map(s => s.vg_setor_principal).filter(Boolean), // ✅ CORRIGIDO
      linhasUnicas: linhasResult.map(l => l.vg_codigo_linha).filter(Boolean),
      servicosUnicos: servicosResult.map(s => s.vg_cod_servico_numero).filter(Boolean),
    };
  }

  private criarResponseVazio(
    dataReferencia: string,
    filtros: FiltrosControleHorariosDto,
    startTime: number,
  ): ControleHorarioResponseDto {
    const limite = filtros.limite || 100;
    const pagina = filtros.pagina || 0;

    return {
      success: true,
      message: 'Nenhuma viagem encontrada para os filtros aplicados',
      data: [],
      total: 0,
      pagina: pagina,
      limite: limite,
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

  private async aplicarAtualizacaoEmEscala(
    viagemBase: ViagemGlobus,
    dataReferencia: string,
    updatedFields: { numeroCarro?: string; crachaFuncionario?: string; observacoes?: string },
    usuarioEmail: string,
  ): Promise<void> {
    this.logger.log(`🔄 Aplicando atualização em escala para viagem ${viagemBase.id}`);

    // 1. Identificar a escala (mesmo serviço, linha, sentido, setor, data)
    const escalaQuery = this.viagemGlobusRepository
      .createQueryBuilder('vg')
      .where('vg.dataReferencia = :dataReferencia', { dataReferencia })
      .andWhere('vg.codServicoNumero = :codServicoNumero', { codServicoNumero: viagemBase.codServicoNumero })
      .andWhere('vg.setorPrincipal = :setorPrincipal', { setorPrincipal: viagemBase.setorPrincipal }) // ✅ CORRIGIDO
      .andWhere('vg.flgSentido = :flgSentido', { flgSentido: viagemBase.flgSentido })
      .andWhere('vg.id != :viagemBaseId', { viagemBaseId: viagemBase.id }); // Excluir a viagem original

    const viagensNaEscala = await escalaQuery.getMany();

    if (viagensNaEscala.length === 0) {
      this.logger.log(`ℹ️ Nenhuma outra viagem encontrada na escala para ${viagemBase.id}`);
      return;
    }

    this.logger.log(`📊 Encontradas ${viagensNaEscala.length} viagens na mesma escala para atualização.`);

    for (const viagemEscala of viagensNaEscala) {
      let controleExistente = await this.controleHorarioRepository.findOne({
        where: {
          viagemGlobusId: viagemEscala.id,
          dataReferencia,
        },
      });

      if (!controleExistente) {
        // Se não existe, cria um novo controle para a viagem na escala
        controleExistente = this.controleHorarioRepository.create({
          viagemGlobusId: viagemEscala.id,
          dataReferencia,
          usuarioEdicao: usuarioEmail,
          usuarioEmail: usuarioEmail,
          isAtivo: true,
        });
      }

      // Aplicar apenas os campos que foram atualizados na viagem original
      if (updatedFields.numeroCarro !== undefined) {
        controleExistente.numeroCarro = updatedFields.numeroCarro;
      }
      if (updatedFields.crachaFuncionario !== undefined) {
        controleExistente.crachaFuncionario = updatedFields.crachaFuncionario;
      }
      if (updatedFields.observacoes !== undefined) {
        controleExistente.observacoes = updatedFields.observacoes;
      }

      controleExistente.usuarioEdicao = usuarioEmail;
      controleExistente.usuarioEmail = usuarioEmail;

      await this.controleHorarioRepository.save(controleExistente);
      this.logger.log(`✅ Controle atualizado para viagem em escala: ${viagemEscala.id}`);
    }
  }
}