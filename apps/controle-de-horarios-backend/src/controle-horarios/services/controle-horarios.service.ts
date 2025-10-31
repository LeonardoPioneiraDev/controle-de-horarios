import { Injectable, Logger, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { ControleHorario } from '../entities/controle-horario.entity';
import { OracleService } from '../../database/oracle/services/oracle.service'; // Importar OracleService
import {
  FiltrosControleHorariosDto,
  SalvarControleHorariosDto,
  SalvarMultiplosControleHorariosDto,
  ControleHorarioResponseDto,
  ControleHorarioItemDto,
  // ViagemGlobusBaseDto, // Não é mais necessário, os dados estão diretamente na entidade ControleHorario

  OpcoesControleHorariosDto,
} from '../dto';
import { IGlobusHorario } from '../interfaces/globus-horario.interface';
import { format } from 'date-fns';

@Injectable()
export class ControleHorariosService {
  private readonly logger = new Logger(ControleHorariosService.name);

  constructor(
    @InjectRepository(ControleHorario)
    private readonly controleHorarioRepository: Repository<ControleHorario>,
    private readonly oracleService: OracleService, // Injetar OracleService
  ) {}

  async buscarControleHorarios(
    dataReferencia: string,
    filtros: FiltrosControleHorariosDto = {
      pagina: 0,
      limite: 100,
      ordenarPor: "horaSaida",
      ordem: "ASC"
    },
    usuarioId: string,
  ): Promise<ControleHorarioResponseDto> {
    const startTime = Date.now();
    this.logger.log(`[LOCAL] Buscando controle de horários para ${dataReferencia} com filtros: ${JSON.stringify(filtros)}`);

    if (!this.isValidDate(dataReferencia)) {
      throw new BadRequestException('Formato de data inválido. Use YYYY-MM-DD');
    }

    const qb = this.controleHorarioRepository.createQueryBuilder('ch');
    qb.where('ch.dataReferencia = :dataReferencia', { dataReferencia });

    // Aplicar filtros dinâmicos
    if (filtros.setorPrincipal) {
      qb.andWhere('ch.setorPrincipalLinha = :setorPrincipal', { setorPrincipal: filtros.setorPrincipal });
    }
    if (filtros.codigoLinha && filtros.codigoLinha.length > 0) {
      qb.andWhere('ch.codigoLinha IN (:...codigoLinha)', { codigoLinha: filtros.codigoLinha });
    }
    if (filtros.codServicoNumero) {
      qb.andWhere('ch.codServicoNumero = :codServicoNumero', { codServicoNumero: filtros.codServicoNumero });
    }
    if (filtros.sentidoTexto) {
      qb.andWhere('ch.flgSentido = :sentidoTexto', { sentidoTexto: filtros.sentidoTexto });
    }
    if (filtros.horarioInicio) {
      qb.andWhere('ch.horaSaida >= :horarioInicio', { horarioInicio: filtros.horarioInicio });
    }
    if (filtros.horarioFim) {
      qb.andWhere('ch.horaSaida <= :horarioFim', { horarioFim: filtros.horarioFim });
    }
    if (filtros.nomeMotorista) {
      qb.andWhere('(UPPER(ch.nomeMotoristaGlobus) LIKE UPPER(:nomeMotorista) OR UPPER(ch.nomeMotoristaEditado) LIKE UPPER(:nomeMotorista))', { nomeMotorista: `%${filtros.nomeMotorista}%` });
    }
    if (filtros.crachaMotorista) {
      qb.andWhere('(ch.crachaMotoristaGlobus = :crachaMotorista OR ch.crachaMotoristaEditado = :crachaMotorista)', { crachaMotorista: filtros.crachaMotorista });
    }
    if (filtros.nomeCobrador) {
      qb.andWhere('(UPPER(ch.nomeCobradorGlobus) LIKE UPPER(:nomeCobrador) OR UPPER(ch.nomeCobradorEditado) LIKE UPPER(:nomeCobrador))', { nomeCobrador: `%${filtros.nomeCobrador}%` });
    }
    if (filtros.crachaCobrador) {
      qb.andWhere('(ch.crachaCobradorGlobus = :crachaCobrador OR ch.crachaCobradorEditado = :crachaCobrador)', { crachaCobrador: filtros.crachaCobrador });
    }
    if (filtros.localOrigem) {
        qb.andWhere('UPPER(ch.localOrigemViagem) LIKE UPPER(:localOrigem)', { localOrigem: `%${filtros.localOrigem}%` });
    }
    if (filtros.localDestino) {
        qb.andWhere('UPPER(ch.localDestinoLinha) LIKE UPPER(:localDestino)', { localDestino: `%${filtros.localDestino}%` });
    }
    if (filtros.buscaTexto) {
        const buscaUpper = `%${filtros.buscaTexto.toUpperCase()}%`;
        qb.andWhere(
          '(UPPER(ch.codigoLinha) LIKE :busca OR UPPER(ch.nomeLinha) LIKE :busca OR UPPER(ch.nomeMotoristaGlobus) LIKE :busca OR UPPER(ch.nomeMotoristaEditado) LIKE :busca OR UPPER(ch.numeroCarro) LIKE :busca)',
          { busca: buscaUpper }
        );
    }
    
    // Filtros de status de edição
    if (filtros.editadoPorUsuario === true) {
      qb.andWhere('(ch.observacoes IS NOT NULL OR ch.editorId IS NOT NULL)');
    } else if (filtros.editadoPorUsuario === false) {
      qb.andWhere('ch.observacoes IS NULL AND ch.editorId IS NULL');
    }
    if (filtros.meusEditados === true) {
      qb.andWhere('ch.editorId = :usuarioId', { usuarioId });
    }

    const pagina = filtros.pagina || 0;
    const limite = filtros.limite || 100;
    const offset = pagina * limite;

    const totalViagens = await qb.getCount();

    qb.orderBy(`ch.${filtros.ordenarPor || 'horaSaida'}`, filtros.ordem || 'ASC');
    qb.offset(offset).limit(limite);

    const itensControle = await qb.getMany();
    
    const estatisticas = await this.obterEstatisticasControleHorarios(dataReferencia, usuarioId);

    const temMaisPaginas = (pagina + 1) * limite < totalViagens;
    const executionTime = `${Date.now() - startTime}ms`;

    this.logger.log(`[LOCAL] Encontrados ${itensControle.length} horários (total: ${totalViagens}) para ${dataReferencia} em ${executionTime}`);

    return {
      success: true,
      message: 'Controle de horários obtido com sucesso (local)',
      data: itensControle.map(this.mapControleHorarioToDto),
      total: totalViagens,
      pagina: pagina,
      limite: limite,
      temMaisPaginas,
      filtrosAplicados: filtros,
      estatisticas,
      executionTime,
      dataReferencia,
    };
  }



  async salvarMultiplosControles(
    dados: SalvarMultiplosControleHorariosDto,
    usuarioId: string,
    usuarioEmail: string,
    usuarioNome: string,
  ): Promise<{ success: boolean; message: string; salvos: number; erros: number }> {
    let salvos = 0;
    let erros = 0;
  
    this.logger.log(`💾 Salvando ${dados.controles.length} controles para ${dados.dataReferencia}`);
  
    if (!dados.controles || dados.controles.length === 0) {
      throw new BadRequestException('Nenhum controle fornecido para salvamento');
    }
  
    if (!dados.dataReferencia) {
      throw new BadRequestException('Data de referência é obrigatória');
    }
  
    for (const controle of dados.controles) {
      try {
        if (!controle.viagemGlobusId) {
          this.logger.warn(`⚠️ Controle sem viagemGlobusId, pulando...`);
          erros++;
          continue;
        }
  
        await this.createOrUpdateControleHorario(dados.dataReferencia, controle, usuarioId, usuarioEmail, usuarioNome);
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

      // Buscar opções únicas do repositório ControleHorario (que já contém os dados do Globus)
      const [setores, linhas, servicos, sentidos, motoristas, locOrigem] = await Promise.all([
        this.controleHorarioRepository
          .createQueryBuilder('ch')
          .select('DISTINCT ch.setorPrincipalLinha', 'setor')
          .where('ch.dataReferencia = :dataReferencia AND ch.setorPrincipalLinha IS NOT NULL', { dataReferencia })
          .orderBy('setor')
          .getRawMany(),

        this.controleHorarioRepository
          .createQueryBuilder('ch')
          .select(['DISTINCT ch.codigoLinha AS codigo', 'ch.nomeLinha AS nome'])
          .where('ch.dataReferencia = :dataReferencia AND ch.codigoLinha IS NOT NULL', { dataReferencia })
          .orderBy('codigo')
          .getRawMany(),

        this.controleHorarioRepository
          .createQueryBuilder('ch')
          .select('DISTINCT ch.codServicoNumero', 'servico')
          .where('ch.dataReferencia = :dataReferencia AND ch.codServicoNumero IS NOT NULL', { dataReferencia })
          .orderBy('servico')
          .getRawMany(),

        this.controleHorarioRepository
          .createQueryBuilder('ch')
          .select('DISTINCT ch.flgSentido', 'sentido') // Usar flgSentido para Sentido
          .where('ch.dataReferencia = :dataReferencia AND ch.flgSentido IS NOT NULL', { dataReferencia })
          .orderBy('sentido')
          .getRawMany(),

        this.controleHorarioRepository
          .createQueryBuilder('ch')
          .select('ch.crachaMotoristaGlobus', 'cracha') // Filtrar por crachá do Globus
          .addSelect('ch.nomeMotoristaGlobus', 'nome') // Adicionar nome para exibição
          .distinct(true)
          .where('ch.dataReferencia = :dataReferencia AND ch.crachaMotoristaGlobus IS NOT NULL', { dataReferencia })
          .orderBy('cracha')
          .limit(100)
          .getRawMany(),
        
        this.controleHorarioRepository
          .createQueryBuilder('ch')
          .select('DISTINCT ch.localOrigemViagem', 'local')
          .where('ch.dataReferencia = :dataReferencia AND ch.localOrigemViagem IS NOT NULL', { dataReferencia })
          .orderBy('local')
          .limit(100)
          .getRawMany(),
      ]);

      return {
        setores: setores.map(s => s.setor).filter(Boolean),
        linhas: linhas.map(l => ({ codigo: l.codigo, nome: l.nome })).filter(l => l.codigo),
        servicos: servicos.map(s => s.servico).filter(Boolean),
        sentidos: sentidos.map(s => s.sentido).filter(Boolean),
        motoristas: motoristas.map(m => ({ cracha: m.cracha, nome: m.nome })).filter(m => m.cracha),
        locaisOrigem: locOrigem.map(l => l.local).filter(Boolean),
        locaisDestino: [], // Não temos localDestinoViagem_Globus na entidade, apenas LOCAL_DESTINO_LINHA, que já está na linha
      };

    } catch (error) {
      this.logger.error(`❌ Erro ao buscar opções: ${error.message}`);
      throw error;
    }
  }

  async obterEstatisticasControleHorarios(dataReferencia: string, usuarioId: string): Promise<any> {
    try {
      // Contar viagens existentes no controle de horários que foram salvas (editadas)
      const viagensEditadas = await this.controleHorarioRepository.count({
          where: [
            {
              dataReferencia,
              isAtivo: true,
              observacoes: Not(IsNull()),
            },
            {
              dataReferencia,
              isAtivo: true,
              editorId: Not(IsNull()),
            },
          ],
      });

      // Contar viagens editadas pelo usuário atual
      const minhasViagensEditadas = await this.controleHorarioRepository.count({
        where: {
          dataReferencia,
          isAtivo: true,
          editorId: usuarioId, // Filter by current user's ID
        },
      });

      // Contar o total de viagens para a data no banco local
      const totalViagens = await this.controleHorarioRepository.count({
        where: { dataReferencia },
      });

      const [setoresResult, linhasResult, servicosResult] = await Promise.all([
        this.controleHorarioRepository
          .createQueryBuilder('ch')
          .select('DISTINCT ch.setorPrincipalLinha', 'setor')
          .where('ch.dataReferencia = :dataReferencia AND ch.setorPrincipalLinha IS NOT NULL', { dataReferencia })
          .getRawMany(),
        this.controleHorarioRepository
          .createQueryBuilder('ch')
          .select('DISTINCT ch.codigoLinha', 'codigo')
          .where('ch.dataReferencia = :dataReferencia AND ch.codigoLinha IS NOT NULL', { dataReferencia })
          .getRawMany(),
        this.controleHorarioRepository
          .createQueryBuilder('ch')
          .select('DISTINCT ch.codServicoNumero', 'servico')
          .where('ch.dataReferencia = :dataReferencia AND ch.codServicoNumero IS NOT NULL', { dataReferencia })
          .getRawMany(),
      ]);

      const viagensNaoEditadas = totalViagens - viagensEditadas;
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
        viagensNaoEditadas,
        percentualEditado,
        setoresUnicos: setoresResult.map(s => s.setor).filter(Boolean),
        linhasUnicas: linhasResult.map(l => l.codigo).filter(Boolean),
        servicosUnicos: servicosResult.map(s => s.servico).filter(Boolean),
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

  /**
   * Executa a consulta SQL fornecida pelo usuário no Oracle para buscar dados de horários do Globus.
   * @param dataPesquisa A data no formato YYYY-MM-DD.
   * @returns Array de objetos IGlobusHorario.
   */
  private async getGlobusDataFromOracle(dataPesquisa: string, filtros?: FiltrosControleHorariosDto): Promise<IGlobusHorario[]> {
    if (!this.oracleService.isEnabled()) {
      this.logger.warn('⚠️ Oracle Service não está habilitado ou disponível. Retornando dados vazios do Globus.');
      return [];
    }

    const dataFormatada = format(new Date(dataPesquisa), 'yyyy-MM-dd');

    let sql = `
WITH LINHAS_FILTRADAS AS (
    SELECT 
        CODINTLINHA,
        COD_LOCAL_TERMINAL_SEC,
        CODIGOLINHA,
        NOMELINHA,
        DESTINOLINHA
    FROM BGM_CADLINHAS
    WHERE
        CODIGOEMPRESA = 4
        AND COD_LOCAL_TERMINAL_SEC IN (6000, 7000, 8000, 9000)
        AND UPPER(NOMELINHA) NOT LIKE '%DESPACHANTES%'
        AND UPPER(NOMELINHA) NOT LIKE '%LINHA ESPECIAL%'
        AND UPPER(NOMELINHA) NOT LIKE '%DUPLAS RESERVAS%'
)
SELECT 
    -- Informaões da Linha e Setor Principal    
    CASE        
        WHEN L.COD_LOCAL_TERMINAL_SEC = 7000 THEN 'GAMA'
        WHEN L.COD_LOCAL_TERMINAL_SEC = 6000 THEN 'SANTA MARIA'
        WHEN L.COD_LOCAL_TERMINAL_SEC = 8000 THEN 'PARANOÁ'
        WHEN L.COD_LOCAL_TERMINAL_SEC = 9000 THEN 'SÃO SEBASTIÃO'
    END AS SETOR_PRINCIPAL_LINHA,
    L.COD_LOCAL_TERMINAL_SEC,
    L.CODIGOLINHA,
    L.NOMELINHA,
    L.DESTINOLINHA AS COD_DESTINO_LINHA,
    NLD.DESC_LOCALIDADE AS LOCAL_DESTINO_LINHA,

    -- Informações da Viagem/Horário
    H.FLG_SENTIDO,
    TO_CHAR(D.DAT_ESCALA, 'DD-MON-YYYY') AS DATA_VIAGEM,
    CASE TO_CHAR(D.DAT_ESCALA, 'DY', 'NLS_DATE_LANGUAGE=PORTUGUESE')
        WHEN 'DOM' THEN 'DOMINGO'
        WHEN 'SÁB' THEN 'SABADO'
        ELSE 'DIAS UTEIS'
    END AS DESC_TIPODIA,
    TO_CHAR(H.HOR_SAIDA, 'HH24:MI') AS HOR_SAIDA,
    TO_CHAR(H.HOR_CHEGADA, 'HH24:MI') AS HOR_CHEGADA,

    -- Local de Origem da Viagem (AGORA É A ORIGEM DA VIAGEM/HORÁRIO)
    H.COD_LOCALIDADE AS COD_ORIGEM_VIAGEM,
    LCO.DESC_LOCALIDADE AS LOCAL_ORIGEM_VIAGEM,

    -- Informações do Serviço (Viagem)
    S.COD_SERVDIARIA AS COD_SERVICO_COMPLETO,
    REGEXP_SUBSTR(S.COD_SERVDIARIA, '[[:digit:]]+') AS COD_SERVICO_NUMERO,

    -- Informações da Atividade (NOVO CAMPO)
    H.COD_ATIVIDADE,
    CASE H.COD_ATIVIDADE 
        WHEN 2 THEN 'REGULAR'
        WHEN 3 THEN 'ESPECIAL'
        WHEN 4 THEN 'RENDIÇÃO'
        WHEN 5 THEN 'RECOLHIMENTO'
        WHEN 10 THEN 'RESERVA'
        ELSE 'OUTROS'
    END AS NOME_ATIVIDADE,

    -- FLG_TIPO (inferida)
    CASE H.COD_ATIVIDADE
        WHEN 2 THEN 'R'
        ELSE 'S' 
    END AS FLG_TIPO,

    -- Informações da Tripulação (ADICIONADOS CRACHÁ E CHAPA/DM-TU)
    S.COD_MOTORISTA,
    FM.NOMECOMPLETOFUNC AS NOME_MOTORISTA,
    FM.CODFUNC AS CRACHA_MOTORISTA,
    FM.CHAPAFUNC AS CHAPAFUNC_MOTORISTA,
    S.COD_COBRADOR,
    FC.NOMECOMPLETOFUNC AS NOME_COBRADOR,
    FC.CODFUNC AS CRACHA_COBRADOR,
    FC.CHAPAFUNC AS CHAPAFUNC_COBRADOR,

    -- Informação Analítica
    COUNT(H.HOR_SAIDA) OVER (
        PARTITION BY L.COD_LOCAL_TERMINAL_SEC, L.CODIGOLINHA
    ) AS TOTAL_HORARIOS
FROM
    T_ESC_ESCALADIARIA D
    JOIN T_ESC_SERVICODIARIA S ON D.DAT_ESCALA = S.DAT_ESCALA AND D.COD_INTESCALA = S.COD_INTEScala
    JOIN T_ESC_HORARIODIARIA H ON D.DAT_ESCALA = H.DAT_ESCALA AND D.COD_INTESCALA = H.COD_INTESCALA
        AND S.COD_SERVDIARIA = H.COD_INTSERVDIARIA
        AND H.COD_INTTURNO = S.COD_INTTURNO
    JOIN LINHAS_FILTRADAS L ON DECODE(H.CODINTLINHA, NULL, D.COD_INTLINHA, H.CODINTLINHA) = L.CODINTLINHA

    LEFT JOIN T_ESC_LOCALIDADE LCO ON H.COD_LOCALIDADE = LCO.COD_LOCALIDADE
    LEFT JOIN T_ESC_LOCALIDADE NLD ON L.DESTINOLINHA = NLD.COD_LOCALIDADE

    LEFT JOIN FLP_FUNCIONARIOS FM ON S.COD_MOTORISTA = FM.CODINTFUNC
    LEFT JOIN FLP_FUNCIONARIOS FC ON S.COD_COBRADOR = FC.CODINTFUNC
WHERE
    H.COD_ATIVIDADE IN (2, 3, 4, 5, 10)
    AND D.DAT_ESCALA >= TO_DATE(:dataPesquisa, 'YYYY-MM-DD') AND D.DAT_ESCALA < TO_DATE(:dataPesquisa, 'YYYY-MM-DD') + 1
`;

    const binds: any = { dataPesquisa: dataFormatada };

    // Adicionar filtros dinamicamente
    if (filtros) {
        if (filtros.setorPrincipal) {
            sql += ` AND SETOR_PRINCIPAL_LINHA = :setorPrincipal`;
            binds.setorPrincipal = filtros.setorPrincipal;
        }
        if (filtros.codigoLinha) {
            if (Array.isArray(filtros.codigoLinha)) {
                sql += ` AND CODIGOLINHA IN (:...codigoLinha)`;
                binds.codigoLinha = filtros.codigoLinha;
            } else {
                sql += ` AND CODIGOLINHA = :codigoLinha`;
                binds.codigoLinha = filtros.codigoLinha;
            }
        }
        if (filtros.codServicoCompleto) {
            sql += ` AND S.COD_SERVDIARIA = :codServicoCompleto`;
            binds.codServicoCompleto = filtros.codServicoCompleto;
        } else if (filtros.codServicoNumero) {
            sql += ` AND REGEXP_SUBSTR(S.COD_SERVDIARIA, '[[:digit:]]+') = :codServicoNumero`;
            binds.codServicoNumero = filtros.codServicoNumero;
        }
        if (filtros.sentidoTexto) {
            sql += ` AND UPPER(H.FLG_SENTIDO) = :sentidoTexto`;
            binds.sentidoTexto = filtros.sentidoTexto.toUpperCase();
        }
        if (filtros.horarioInicio) {
            sql += ` AND H.HOR_SAIDA >= :horarioInicio`;
            binds.horarioInicio = filtros.horarioInicio;
        }
        if (filtros.horarioFim) {
            sql += ` AND H.HOR_SAIDA <= :horarioFim`;
            binds.horarioFim = filtros.horarioFim;
        }
        if (filtros.nomeMotorista) {
            sql += ` AND UPPER(FM.NOMECOMPLETOFUNC) LIKE :nomeMotorista`;
            binds.nomeMotorista = `%${filtros.nomeMotorista.toUpperCase()}%`;
        }
        if (filtros.localOrigem) {
            sql += ` AND UPPER(LCO.DESC_LOCALIDADE) LIKE :localOrigem`;
            binds.localOrigem = `%${filtros.localOrigem.toUpperCase()}%`;
        }
        if (filtros.crachaMotorista) {
            sql += ` AND FM.CODFUNC = :crachaMotorista`;
            binds.crachaMotorista = filtros.crachaMotorista;
        }
        if (filtros.nomeCobrador) {
            sql += ` AND UPPER(FC.NOMECOMPLETOFUNC) LIKE :nomeCobrador`;
            binds.nomeCobrador = `%${filtros.nomeCobrador.toUpperCase()}%`;
        }
        if (filtros.crachaCobrador) {
            sql += ` AND FC.CODFUNC = :crachaCobrador`;
            binds.crachaCobrador = filtros.crachaCobrador;
        }
        if (filtros.buscaTexto) {
            const buscaUpper = `%${filtros.buscaTexto.toUpperCase()}%`;
            sql += ` AND (UPPER(L.CODIGOLINHA) LIKE :busca OR UPPER(L.NOMELINHA) LIKE :busca OR UPPER(FM.NOMECOMPLETOFUNC) LIKE :busca OR UPPER(LCO.DESC_LOCALIDADE) LIKE :busca)`;
            binds.busca = buscaUpper;
        }
    }

    // Ordenação
    sql += `
ORDER BY
    SETOR_PRINCIPAL_LINHA,
    CODIGOLINHA,
    FLG_SENTIDO,
    HOR_SAIDA`;
    
    // Paginação
    if (filtros && filtros.limite) {
        let offset = 0;
        if (filtros.pagina && filtros.pagina > 0) {
            offset = filtros.pagina * filtros.limite;
        }
        sql += ` OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`;
        binds.offset = offset;
        binds.limit = filtros.limite;
    }

    try {
      const result = await this.oracleService.executeQuery<IGlobusHorario>(sql, binds);
      return result;
    } catch (error) {
      this.logger.error(`❌ Erro ao buscar dados do Globus: ${error.message}`);
      throw new InternalServerErrorException('Erro ao buscar dados do Globus.');
    }
  }

  // Método para buscar um único item do Globus pelo COD_SERVICO_COMPLETO
  private async getGlobusDataFromOracleById(dataPesquisa: string, codServicoCompleto: string): Promise<IGlobusHorario> {
    if (!this.oracleService.isEnabled()) {
      this.logger.warn('⚠️ Oracle Service não está habilitado ou disponível. Retornando dados vazios do Globus.');
      return null;
    }

    const dataFormatada = format(new Date(dataPesquisa), 'yyyy-MM-dd');
    let sql = `
SELECT 
    -- Informaões da Linha e Setor Principal    
    CASE        
        WHEN L.COD_LOCAL_TERMINAL_SEC = 7000 THEN 'GAMA'
        WHEN L.COD_LOCAL_TERMINAL_SEC = 6000 THEN 'SANTA MARIA'
        WHEN L.COD_LOCAL_TERMINAL_SEC = 8000 THEN 'PARANOÁ'
        WHEN L.COD_LOCAL_TERMINAL_SEC = 9000 THEN 'SÃO SEBASTIÃO'
    END AS SETOR_PRINCIPAL_LINHA,
    L.COD_LOCAL_TERMINAL_SEC,
    L.CODIGOLINHA,
    L.NOMELINHA,
    L.DESTINOLINHA AS COD_DESTINO_LINHA,
    NLD.DESC_LOCALIDADE AS LOCAL_DESTINO_LINHA,

    -- Informações da Viagem/Horário
    H.FLG_SENTIDO,
    TO_CHAR(D.DAT_ESCALA, 'DD-MON-YYYY') AS DATA_VIAGEM,
    CASE TO_CHAR(D.DAT_ESCALA, 'DY', 'NLS_DATE_LANGUAGE=PORTUGUESE')
        WHEN 'DOM' THEN 'DOMINGO'
        WHEN 'SÁB' THEN 'SABADO'
        ELSE 'DIAS UTEIS'
    END AS DESC_TIPODIA,
    TO_CHAR(H.HOR_SAIDA, 'HH24:MI') AS HOR_SAIDA,
    TO_CHAR(H.HOR_CHEGADA, 'HH24:MI') AS HOR_CHEGADA,

    -- Local de Origem da Viagem (AGORA É A ORIGEM DA VIAGEM/HORÁRIO)
    H.COD_LOCALIDADE AS COD_ORIGEM_VIAGEM,
    LCO.DESC_LOCALIDADE AS LOCAL_ORIGEM_VIAGEM,

    -- Informações do Serviço (Viagem)
    S.COD_SERVDIARIA AS COD_SERVICO_COMPLETO,
    REGEXP_SUBSTR(S.COD_SERVDIARIA, '[[:digit:]]+') AS COD_SERVICO_NUMERO,

    -- Informações da Atividade (NOVO CAMPO)
    H.COD_ATIVIDADE,
    CASE H.COD_ATIVIDADE 
        WHEN 2 THEN 'REGULAR'
        WHEN 3 THEN 'ESPECIAL'
        WHEN 4 THEN 'RENDIÇÃO'
        WHEN 5 THEN 'RECOLHIMENTO'
        WHEN 10 THEN 'RESERVA'
        ELSE 'OUTROS'
    END AS NOME_ATIVIDADE,

    -- FLG_TIPO (inferida)
    CASE H.COD_ATIVIDADE
        WHEN 2 THEN 'R'
        ELSE 'S' 
    END AS FLG_TIPO,

    -- Informações da Tripulação (ADICIONADOS CRACHÁ E CHAPA/DM-TU)
    S.COD_MOTORISTA,
    FM.NOMECOMPLETOFUNC AS NOME_MOTORISTA,
    FM.CODFUNC AS CRACHA_MOTORISTA,
    FM.CHAPAFUNC AS CHAPAFUNC_MOTORISTA,
    S.COD_COBRADOR,
    FC.NOMECOMPLETOFUNC AS NOME_COBRADOR,
    FC.CODFUNC AS CRACHA_COBRADOR,
    FC.CHAPAFUNC AS CHAPAFUNC_COBRADOR,

    -- Informação Analítica
    COUNT(H.HOR_SAIDA) OVER (
        PARTITION BY L.COD_LOCAL_TERMINAL_SEC, L.CODIGOLINHA
    ) AS TOTAL_HORARIOS
FROM
    T_ESC_ESCALADIARIA D
    JOIN T_ESC_SERVICODIARIA S ON D.DAT_ESCALA = S.DAT_ESCALA AND D.COD_INTESCALA = S.COD_INTESCALA
    JOIN T_ESC_HORARIODIARIA H ON D.DAT_ESCALA = H.DAT_ESCALA AND D.COD_INTESCALA = H.COD_INTESCALA
        AND S.COD_SERVDIARIA = H.COD_INTSERVDIARIA
        AND H.COD_INTTURNO = S.COD_INTTURNO
    JOIN BGM_CADLINHAS L ON DECODE(H.CODINTLINHA, NULL, D.COD_INTLINHA, H.CODINTLINHA) = L.CODINTLINHA

    LEFT JOIN T_ESC_LOCALIDADE LCO ON H.COD_LOCALIDADE = LCO.COD_LOCALIDADE
    LEFT JOIN T_ESC_LOCALIDADE NLD ON L.DESTINOLINHA = NLD.COD_LOCALIDADE

    LEFT JOIN FLP_FUNCIONARIOS FM ON S.COD_MOTORISTA = FM.CODINTFUNC
    LEFT JOIN FLP_FUNCIONARIOS FC ON S.COD_COBRADOR = FC.CODINTFUNC
WHERE
    H.COD_ATIVIDADE IN (2, 3, 4, 5, 10)
    AND L.CODIGOEMPRESA = 4
    AND UPPER(L.NOMELINHA) NOT LIKE '%DESPACHANTES%'
    AND UPPER(L.NOMELINHA) NOT LIKE '%LINHA ESPECIAL%'
    AND UPPER(L.NOMELINHA) NOT LIKE '%DUPLAS RESERVAS%'
    AND L.COD_LOCAL_TERMINAL_SEC IN (6000, 7000, 8000, 9000)
    AND D.DAT_ESCALA >= TO_DATE(:dataPesquisa, 'YYYY-MM-DD') AND D.DAT_ESCALA < TO_DATE(:dataPesquisa, 'YYYY-MM-DD') + 1
    AND S.COD_SERVDIARIA = :codServicoCompleto
`;
    const binds: any = { dataPesquisa: dataFormatada, codServicoCompleto };

    try {
      const result = await this.oracleService.executeQuery<IGlobusHorario>(sql, binds);
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      this.logger.error(`❌ Erro ao buscar dados do Globus por ID: ${error.message}`);
      throw new InternalServerErrorException('Erro ao buscar dados do Globus por ID.');
    }
  }

  // Método para contar o total de itens do Globus sem paginação/limite
  private async countGlobusDataFromOracle(dataPesquisa: string, filtros?: FiltrosControleHorariosDto): Promise<number> {
    if (!this.oracleService.isEnabled()) {
        return 0;
    }
    const dataFormatada = format(new Date(dataPesquisa), 'yyyy-MM-dd');

    let sql = `
WITH LINHAS_FILTRADAS AS (
    SELECT 
        CODINTLINHA,
        COD_LOCAL_TERMINAL_SEC,
        CODIGOLINHA,
        NOMELINHA,
        DESTINOLINHA
    FROM BGM_CADLINHAS
    WHERE
        CODIGOEMPRESA = 4
        AND COD_LOCAL_TERMINAL_SEC IN (6000, 7000, 8000, 9000)
        AND UPPER(NOMELINHA) NOT LIKE '%DESPACHANTES%'
        AND UPPER(NOMELINHA) NOT LIKE '%LINHA ESPECIAL%'
        AND UPPER(NOMELINHA) NOT LIKE '%DUPLAS RESERVAS%'
)
SELECT COUNT(S.COD_SERVDIARIA) as TOTAL
FROM
    T_ESC_ESCALADIARIA D
    JOIN T_ESC_SERVICODIARIA S ON D.DAT_ESCALA = S.DAT_ESCALA AND D.COD_INTESCALA = S.COD_INTESCALA
    JOIN T_ESC_HORARIODIARIA H ON D.DAT_ESCALA = H.DAT_ESCALA AND D.COD_INTESCALA = H.COD_INTESCALA
        AND S.COD_SERVDIARIA = H.COD_INTSERVDIARIA
        AND H.COD_INTTURNO = S.COD_INTTURNO
    JOIN LINHAS_FILTRADAS L ON DECODE(H.CODINTLINHA, NULL, D.COD_INTLINHA, H.CODINTLINHA) = L.CODINTLINHA

    LEFT JOIN T_ESC_LOCALIDADE LCO ON H.COD_LOCALIDADE = LCO.COD_LOCALIDADE
    LEFT JOIN FLP_FUNCIONARIOS FM ON S.COD_MOTORISTA = FM.CODINTFUNC
WHERE
    H.COD_ATIVIDADE IN (2, 3, 4, 5, 10)
    AND D.DAT_ESCALA >= TO_DATE(:dataPesquisa, 'YYYY-MM-DD') AND D.DAT_ESCALA < TO_DATE(:dataPesquisa, 'YYYY-MM-DD') + 1
`;
    const binds: any = { dataPesquisa: dataFormatada };

    if (filtros) {
        if (filtros.setorPrincipal) {
            sql += ` AND (CASE WHEN L.COD_LOCAL_TERMINAL_SEC = 7000 THEN 'GAMA' WHEN L.COD_LOCAL_TERMINAL_SEC = 6000 THEN 'SANTA MARIA' WHEN L.COD_LOCAL_TERMINAL_SEC = 8000 THEN 'PARANOÁ' WHEN L.COD_LOCAL_TERMINAL_SEC = 9000 THEN 'SÃO SEBASTIÃO' END) = :setorPrincipal`;
            binds.setorPrincipal = filtros.setorPrincipal;
        }
        if (filtros.codigoLinha) {
            if (Array.isArray(filtros.codigoLinha)) {
                sql += ` AND L.CODIGOLINHA IN (:...codigoLinha)`;
                binds.codigoLinha = filtros.codigoLinha;
            } else {
                sql += ` AND L.CODIGOLINHA = :codigoLinha`;
                binds.codigoLinha = filtros.codigoLinha;
            }
        }
        if (filtros.codServicoNumero) {
            sql += ` AND REGEXP_SUBSTR(S.COD_SERVDIARIA, '[[:digit:]]+') = :codServicoNumero`;
            binds.codServicoNumero = filtros.codServicoNumero;
        }
        if (filtros.sentidoTexto) {
            sql += ` AND UPPER(H.FLG_SENTIDO) = :sentidoTexto`;
            binds.sentidoTexto = filtros.sentidoTexto.toUpperCase();
        }
        if (filtros.horarioInicio) {
            sql += ` AND H.HOR_SAIDA >= :horarioInicio`;
            binds.horarioInicio = filtros.horarioInicio;
        }
        if (filtros.horarioFim) {
            sql += ` AND H.HOR_SAIDA <= :horarioFim`;
            binds.horarioFim = filtros.horarioFim;
        }
        if (filtros.nomeMotorista) {
            sql += ` AND UPPER(FM.NOMECOMPLETOFUNC) LIKE :nomeMotorista`;
            binds.nomeMotorista = `%${filtros.nomeMotorista.toUpperCase()}%`;
        }
        if (filtros.localOrigem) {
            sql += ` AND UPPER(LCO.DESC_LOCALIDADE) LIKE :localOrigem`;
            binds.localOrigem = `%${filtros.localOrigem.toUpperCase()}%`;
        }
        if (filtros.crachaMotorista) {
            sql += ` AND FM.CODFUNC = :crachaMotorista`;
            binds.crachaMotorista = filtros.crachaMotorista;
        }
        if (filtros.buscaTexto) {
            const buscaUpper = `%${filtros.buscaTexto.toUpperCase()}%`;
            sql += ` AND (UPPER(L.CODIGOLINHA) LIKE :busca OR UPPER(L.NOMELINHA) LIKE :busca OR UPPER(FM.NOMECOMPLETOFUNC) LIKE :busca OR UPPER(LCO.DESC_LOCALIDADE) LIKE :busca)`;
            binds.busca = buscaUpper;
        }
    }
    
    try {
      const result = await this.oracleService.executeQuery<{ TOTAL: number }>(sql, binds);
      return result.length > 0 ? result[0].TOTAL : 0;
    } catch (error) {
      this.logger.error(`❌ Erro ao contar dados do Globus: ${error.message}`);
      throw new InternalServerErrorException('Erro ao contar dados do Globus.');
    }
}

  private async buscarControlesExistentes(
    dataReferencia: string,
    viagemGlobusIds: string[],
  ): Promise<ControleHorario[]> {
    if (viagemGlobusIds.length === 0) return [];

    return await this.controleHorarioRepository
      .createQueryBuilder('ch')
      .where('ch.dataReferencia = :dataReferencia', { dataReferencia })
      .andWhere('ch.viagemGlobusId IN (:...viagemGlobusIds)', { viagemGlobusIds })
      .getMany();
  }

  // Novo método de mesclagem para dados do Globus e controles existentes
  private mesclarDadosGlobusComControles(
    viagensGlobusRaw: IGlobusHorario[],
    controlesExistentes: ControleHorario[],
  ): ControleHorarioItemDto[] {
    const mapaControles = new Map<string, ControleHorario>();
    controlesExistentes.forEach(controle => {
      mapaControles.set(controle.viagemGlobusId, controle);
    });

    return viagensGlobusRaw.map(globusData => {
      const controle = mapaControles.get(globusData.COD_SERVICO_COMPLETO);

      const item: ControleHorarioItemDto = {
        id: controle?.id || null, // Assuming 'id' comes from 'controle' if it exists
        viagemGlobusId: globusData.COD_SERVICO_COMPLETO,
        dataReferencia: globusData.DATA_VIAGEM,

        // Campos do Globus (directly from globusData)
        setorPrincipalLinha: globusData.SETOR_PRINCIPAL_LINHA,
        codLocalTerminalSec: globusData.COD_LOCAL_TERMINAL_SEC,
        codigoLinha: globusData.CODIGOLINHA,
        nomeLinha: globusData.NOMELINHA,
        codDestinoLinha: globusData.COD_DESTINO_LINHA,
        localDestinoLinha: globusData.LOCAL_DESTINO_LINHA,
        flgSentido: globusData.FLG_SENTIDO,
        descTipoDia: globusData.DESC_TIPODIA,
        horaSaida: globusData.HOR_SAIDA,
        horaChegada: globusData.HOR_CHEGADA,
        codOrigemViagem: globusData.COD_ORIGEM_VIAGEM,
        localOrigemViagem: globusData.LOCAL_ORIGEM_VIAGEM,
        codServicoNumero: globusData.COD_SERVICO_NUMERO,
        codAtividade: globusData.COD_ATIVIDADE,
        nomeAtividade: globusData.NOME_ATIVIDADE,
        flgTipo: globusData.FLG_TIPO,
        codMotorista: globusData.COD_MOTORISTA,
        nomeMotoristaGlobus: globusData.NOME_MOTORISTA,
        crachaMotoristaGlobus: globusData.CRACHA_MOTORISTA,
        chapaFuncMotoristaGlobus: globusData.CHAPAFUNC_MOTORISTA,
        codCobrador: globusData.COD_COBRADOR,
        nomeCobradorGlobus: globusData.NOME_COBRADOR,
        crachaCobradorGlobus: globusData.CRACHA_COBRADOR,
        chapaFuncCobradorGlobus: globusData.CHAPAFUNC_COBRADOR,
        totalHorarios: globusData.TOTAL_HORARIOS,

        // Campos Editáveis (from controle if exists, otherwise null/default)
        numeroCarro: controle?.numeroCarro || null,
        nomeMotoristaEditado: controle?.nomeMotoristaEditado || null,
        crachaMotoristaEditado: controle?.crachaMotoristaEditado || null,
        nomeCobradorEditado: controle?.nomeCobradorEditado || null,
        crachaCobradorEditado: controle?.crachaCobradorEditado || null,
        observacoes: controle?.observacoes || null,

        // Auditoria e Status (from controle if exists, otherwise null/default)
        editorId: controle?.editorId || null,
        editorNome: controle?.editorNome || null,
        editorEmail: controle?.editorEmail || null,
        createdAt: controle?.createdAt || new Date(), // Provide a default if not found
        updatedAt: controle?.updatedAt || new Date(), // Provide a default if not found
        isAtivo: controle?.isAtivo ?? true, // Provide a default if not found
        jaFoiEditado: !!controle, // If 'controle' exists, it means it was edited
      };


      return item;
    });
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

  private mapControleHorarioToDto(controle: ControleHorario): ControleHorarioItemDto {
    return {
      id: controle.id,
      viagemGlobusId: controle.viagemGlobusId,
      dataReferencia: controle.dataReferencia,
      setorPrincipalLinha: controle.setorPrincipalLinha,
      codLocalTerminalSec: controle.codLocalTerminalSec,
      codigoLinha: controle.codigoLinha,
      nomeLinha: controle.nomeLinha,
      codDestinoLinha: controle.codDestinoLinha,
      localDestinoLinha: controle.localDestinoLinha,
      flgSentido: controle.flgSentido,
      descTipoDia: controle.descTipoDia,
      horaSaida: controle.horaSaida,
      horaChegada: controle.horaChegada,
      codOrigemViagem: controle.codOrigemViagem,
      localOrigemViagem: controle.localOrigemViagem,
      codServicoNumero: controle.codServicoNumero,
      codAtividade: controle.codAtividade,
      nomeAtividade: controle.nomeAtividade,
      flgTipo: controle.flgTipo,
      codMotorista: controle.codMotorista,
      nomeMotoristaGlobus: controle.nomeMotoristaGlobus,
      crachaMotoristaGlobus: controle.crachaMotoristaGlobus,
      chapaFuncMotoristaGlobus: controle.chapaFuncMotoristaGlobus,
      codCobrador: controle.codCobrador,
      nomeCobradorGlobus: controle.nomeCobradorGlobus,
      crachaCobradorGlobus: controle.crachaCobradorGlobus,
      chapaFuncCobradorGlobus: controle.chapaFuncCobradorGlobus,
      totalHorarios: controle.totalHorarios,
      numeroCarro: controle.numeroCarro,
      nomeMotoristaEditado: controle.nomeMotoristaEditado,
      crachaMotoristaEditado: controle.crachaMotoristaEditado,
      nomeCobradorEditado: controle.nomeCobradorEditado,
      crachaCobradorEditado: controle.crachaCobradorEditado,
      observacoes: controle.observacoes,
      editorId: controle.editorId,
      editorNome: controle.editorNome,
      editorEmail: controle.editorEmail,
      createdAt: controle.createdAt,
      updatedAt: controle.updatedAt,
      isAtivo: controle.isAtivo,
      jaFoiEditado: !!(controle.editorId || controle.observacoes),
    };
  }

  async sincronizarViagensGlobus(
    dataReferencia: string,
    overwrite: boolean,
    usuarioId: string,
    usuarioEmail: string,
    usuarioNome: string,
  ): Promise<{ success: boolean; message: string; totalSincronizados: number; totalExcluidos: number }> {
    this.logger.log(`🔄 Iniciando sincronização para ${dataReferencia} com overwrite: ${overwrite}`);

    if (!this.isValidDate(dataReferencia)) {
      throw new BadRequestException('Formato de data inválido. Use YYYY-MM-DD');
    }

    let totalExcluidos = 0;
    let totalSincronizados = 0;

    // 1. Verificar se já existem dados para a data
    const controlesExistentes = await this.controleHorarioRepository.find({
      where: { dataReferencia },
    });

    if (controlesExistentes.length > 0 && overwrite) {
      // Se overwrite for true, excluir dados existentes
      await this.controleHorarioRepository.remove(controlesExistentes);
      totalExcluidos = controlesExistentes.length;
      this.logger.log(`🗑️ ${totalExcluidos} controles excluídos para ${dataReferencia}.`);
    }

    // 3. Buscar dados do Globus
    const viagensGlobusRaw = await this.getGlobusDataFromOracle(dataReferencia);

    if (viagensGlobusRaw.length === 0) {
      this.logger.warn(`⚠️ Nenhuma viagem encontrada no Globus para ${dataReferencia}.`);
      return {
        success: true,
        message: 'Nenhuma viagem encontrada no Globus para a data informada.',
        totalSincronizados: 0,
        totalExcluidos,
      };
    }

    // 4. Processar dados do Globus: criar ou atualizar
    for (const globusData of viagensGlobusRaw) {
      try {
        await this._upsertGlobusData(globusData, dataReferencia);
        totalSincronizados++;
      } catch (error) {
        this.logger.error(`❌ Erro ao salvar/atualizar controle da viagem Globus ${globusData.COD_SERVICO_COMPLETO}: ${error.message}`);
        // Continuar processando as outras viagens mesmo que uma falhe
      }
    }

    this.logger.log(`✅ Sincronização concluída para ${dataReferencia}. Total sincronizados: ${totalSincronizados}, Total excluídos: ${totalExcluidos}.`);

    return {
      success: true,
      message: 'Sincronização de viagens Globus concluída com sucesso.',
      totalSincronizados,
      totalExcluidos,
    };
  }

  private async _upsertGlobusData(
    globusData: IGlobusHorario,
    dataReferencia: string,
  ): Promise<ControleHorario> {
    let controle = await this.controleHorarioRepository.findOne({
      where: {
        dataReferencia,
        viagemGlobusId: globusData.COD_SERVICO_COMPLETO,
      },
    });

    if (!controle) {
      // Se não existe, cria um novo controle
      controle = this.controleHorarioRepository.create({
        viagemGlobusId: globusData.COD_SERVICO_COMPLETO,
        dataReferencia: dataReferencia,
        isAtivo: true,
        // Campos editáveis devem ser nulos na criação via sincronização
        numeroCarro: null,
        nomeMotoristaEditado: null,
        crachaMotoristaEditado: null,
        nomeCobradorEditado: null,
        crachaCobradorEditado: null,
        observacoes: null,
        editorId: null,
        editorNome: null,
        editorEmail: null,
      });
    }

    // Atualiza APENAS os campos derivados do Globus
    controle.setorPrincipalLinha = globusData.SETOR_PRINCIPAL_LINHA;
    controle.codLocalTerminalSec = globusData.COD_LOCAL_TERMINAL_SEC;
    controle.codigoLinha = globusData.CODIGOLINHA;
    controle.nomeLinha = globusData.NOMELINHA;
    controle.codDestinoLinha = globusData.COD_DESTINO_LINHA;
    controle.localDestinoLinha = globusData.LOCAL_DESTINO_LINHA;
    controle.flgSentido = globusData.FLG_SENTIDO;
    controle.descTipoDia = globusData.DESC_TIPODIA;
    controle.horaSaida = globusData.HOR_SAIDA;
    controle.horaChegada = globusData.HOR_CHEGADA;
    controle.codOrigemViagem = globusData.COD_ORIGEM_VIAGEM;
    controle.localOrigemViagem = globusData.LOCAL_ORIGEM_VIAGEM;
    controle.codServicoNumero = globusData.COD_SERVICO_NUMERO;
    controle.codAtividade = globusData.COD_ATIVIDADE;
    controle.nomeAtividade = globusData.NOME_ATIVIDADE;
    controle.flgTipo = globusData.FLG_TIPO;
    controle.codMotorista = globusData.COD_MOTORISTA;
    controle.nomeMotoristaGlobus = globusData.NOME_MOTORISTA;
    controle.crachaMotoristaGlobus = globusData.CRACHA_MOTORISTA;
    controle.chapaFuncMotoristaGlobus = globusData.CHAPAFUNC_MOTORISTA;
    controle.codCobrador = globusData.COD_COBRADOR;
    controle.nomeCobradorGlobus = globusData.NOME_COBRADOR;
    controle.crachaCobradorGlobus = globusData.CRACHA_COBRADOR;
    controle.chapaFuncCobradorGlobus = globusData.CHAPAFUNC_COBRADOR;
    controle.totalHorarios = globusData.TOTAL_HORARIOS;

    // Não atualiza campos editáveis ou de auditoria aqui, pois é uma sincronização de dados base
    return await this.controleHorarioRepository.save(controle);
  }

  async createOrUpdateControleHorario(
    dataReferencia: string,
    dadosControle: SalvarControleHorariosDto,
    usuarioId: string,
    usuarioEmail: string,
    usuarioNome: string,
  ): Promise<ControleHorario> {
    let controle = await this.controleHorarioRepository.findOne({
      where: {
        dataReferencia,
        viagemGlobusId: dadosControle.viagemGlobusId,
      },
    });

    if (!controle) {
      throw new NotFoundException(`Controle de horário para viagem ${dadosControle.viagemGlobusId} na data ${dataReferencia} não encontrado. Sincronize os dados primeiro.`);
    }

    const oldValues = {
      numeroCarro: controle?.numeroCarro,
      nomeMotoristaEditado: controle?.nomeMotoristaEditado,
      crachaMotoristaEditado: controle?.crachaMotoristaEditado,
      nomeCobradorEditado: controle?.nomeCobradorEditado,
      crachaCobradorEditado: controle?.crachaCobradorEditado,
      observacoes: controle?.observacoes,
    };

    let hasChanges = false;
    // Atualizar existente
    // Verificar se houve mudanças nos campos editáveis
    if (
      oldValues.numeroCarro !== dadosControle.numeroCarro ||
      oldValues.nomeMotoristaEditado !== dadosControle.nomeMotoristaEditado ||
      oldValues.crachaMotoristaEditado !== dadosControle.crachaMotoristaEditado ||
      oldValues.nomeCobradorEditado !== dadosControle.nomeCobradorEditado ||
      oldValues.crachaCobradorEditado !== dadosControle.crachaCobradorEditado ||
      oldValues.observacoes !== dadosControle.observacoes
    ) {
      hasChanges = true;
    }
    Object.assign(controle, dadosControle);

    if (hasChanges) {
      controle.editorId = usuarioId;
      controle.editorNome = usuarioNome;
      controle.editorEmail = usuarioEmail;
    }

    this.logger.log(`DEBUG: Salvando controle com editorId: "${controle.editorId}" (Length: ${controle.editorId?.length}), editorNome: "${controle.editorNome}", editorEmail: "${controle.editorEmail}"`);
    const controleSalvo = await this.controleHorarioRepository.save(controle);

    // Lógica de Propagação
    const changedFields: { [key: string]: any } = {};
    if (oldValues.numeroCarro !== dadosControle.numeroCarro) changedFields.numeroCarro = dadosControle.numeroCarro;
    if (oldValues.nomeMotoristaEditado !== dadosControle.nomeMotoristaEditado) changedFields.nomeMotoristaEditado = dadosControle.nomeMotoristaEditado;
    if (oldValues.crachaMotoristaEditado !== dadosControle.crachaMotoristaEditado) changedFields.crachaMotoristaEditado = dadosControle.crachaMotoristaEditado;
    if (oldValues.nomeCobradorEditado !== dadosControle.nomeCobradorEditado) changedFields.nomeCobradorEditado = dadosControle.nomeCobradorEditado;
    if (oldValues.crachaCobradorEditado !== dadosControle.crachaCobradorEditado) changedFields.crachaCobradorEditado = dadosControle.crachaCobradorEditado;
    if (oldValues.observacoes !== dadosControle.observacoes) changedFields.observacoes = dadosControle.observacoes;

    if (Object.keys(changedFields).length > 0) {
      await this.aplicarAtualizacaoEmEscala(
        controleSalvo,
        controleSalvo.dataReferencia,
        changedFields,
        usuarioId,
        usuarioEmail,
        usuarioNome
      );
    }

    return controleSalvo;
  }

  private async aplicarAtualizacaoEmEscala(
    controleBase: ControleHorario, // Agora recebe o ControleHorario salvo como base
    dataReferencia: string,
    updatedFields: {
      numeroCarro?: string;
      nomeMotoristaEditado?: string;
      crachaMotoristaEditado?: string;
      nomeCobradorEditado?: string;
      crachaCobradorEditado?: string;
      observacoes?: string
    },
    usuarioId: string,
    usuarioEmail: string,
    usuarioNome: string,
  ): Promise<void> {
    this.logger.log(`🔄 Aplicando atualização em escala para viagem ${controleBase.viagemGlobusId}`);

    // Usar os campos do controleBase (já salvo no PostgreSQL) para identificar a escala
    // Não precisamos mais consultar o Globus aqui.
    const {
      setorPrincipalLinha,
      codigoLinha,
      flgSentido,
      codMotorista,
      viagemGlobusId,
    } = controleBase;

    // 1. Buscar outras viagens na mesma escala no banco de dados PostgreSQL
    const qb = this.controleHorarioRepository.createQueryBuilder('ch');
    qb.where('ch.dataReferencia = :dataReferencia', { dataReferencia });
    qb.andWhere('ch.viagemGlobusId != :viagemGlobusId', { viagemGlobusId }); // Excluir a viagem original

    if (setorPrincipalLinha) {
      qb.andWhere('ch.setorPrincipalLinha = :setorPrincipalLinha', { setorPrincipalLinha });
    }
    if (codigoLinha) {
      qb.andWhere('ch.codigoLinha = :codigoLinha', { codigoLinha });
    }
    if (flgSentido) {
      qb.andWhere('ch.flgSentido = :flgSentido', { flgSentido });
    }
    if (codMotorista) {
      qb.andWhere('ch.codMotorista = :codMotorista', { codMotorista });
    }
    // Adicionar outros campos de escala se necessário para uma correspondência mais precisa

    const viagensNaEscala = await qb.getMany();

    if (viagensNaEscala.length === 0) {
      this.logger.log(`ℹ️ Nenhuma outra viagem encontrada na escala para ${controleBase.viagemGlobusId} no PostgreSQL.`);
      return;
    }

    this.logger.log(`📊 Encontradas ${viagensNaEscala.length} viagens na mesma escala para atualização no PostgreSQL.`);

    // Aplicar as atualizações aos controles encontrados
    for (const controleEscala of viagensNaEscala) {
      // Aplicar apenas os campos que foram atualizados na viagem original
      if (updatedFields.numeroCarro !== undefined) { controleEscala.numeroCarro = updatedFields.numeroCarro; }
      if (updatedFields.nomeMotoristaEditado !== undefined) { controleEscala.nomeMotoristaEditado = updatedFields.nomeMotoristaEditado; }
      if (updatedFields.crachaMotoristaEditado !== undefined) { controleEscala.crachaMotoristaEditado = updatedFields.crachaMotoristaEditado; }
      if (updatedFields.nomeCobradorEditado !== undefined) { controleEscala.nomeCobradorEditado = updatedFields.nomeCobradorEditado; }
      if (updatedFields.crachaCobradorEditado !== undefined) { controleEscala.crachaCobradorEditado = updatedFields.crachaCobradorEditado; }
      if (updatedFields.observacoes !== undefined) { controleEscala.observacoes = updatedFields.observacoes; }

      controleEscala.editorId = usuarioId;
      controleEscala.editorNome = usuarioNome;
      controleEscala.editorEmail = usuarioEmail;

      await this.controleHorarioRepository.save(controleEscala);
      this.logger.log(`✅ Controle atualizado para viagem em escala (PostgreSQL): ${controleEscala.viagemGlobusId}`);
    }
  }
}