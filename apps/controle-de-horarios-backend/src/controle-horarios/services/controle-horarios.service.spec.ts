import { Test, TestingModule } from '@nestjs/testing';
import { ControleHorariosService } from './controle-horarios.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ControleHorario } from '../entities/controle-horario.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { FiltrosControleHorariosDto, SalvarControleHorariosDto, SalvarMultiplosControleHorariosDto, ControleHorarioItemDto } from '../dto';
import { OracleService } from '../../database/oracle/services/oracle.service';
import { IGlobusHorario } from '../interfaces/globus-horario.interface';

describe('ControleHorariosService', () => {
  let service: ControleHorariosService;
  let controleHorarioRepository: Repository<ControleHorario>;
  let oracleService: OracleService;

  let mockControleHorarioQueryBuilder: any;

  const createMockQueryBuilder = () => ({
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    getMany: jest.fn().mockResolvedValue([]),
    getRawMany: jest.fn().mockResolvedValue([]),
    getRawOne: jest.fn().mockResolvedValue(null),
  });

  const mockControleHorarioRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(() => mockControleHorarioQueryBuilder),
  };

  const mockOracleService = {
    isEnabled: jest.fn().mockReturnValue(true),
    executeQuery: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    mockControleHorarioQueryBuilder = createMockQueryBuilder();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ControleHorariosService,
        {
          provide: getRepositoryToken(ControleHorario),
          useValue: mockControleHorarioRepository,
        },
        {
          provide: OracleService,
          useValue: mockOracleService,
        },
      ],
    }).compile();

    service = module.get<ControleHorariosService>(ControleHorariosService);
    controleHorarioRepository = module.get<Repository<ControleHorario>>(
      getRepositoryToken(ControleHorario),
    );
    oracleService = module.get<OracleService>(OracleService);

    // Reset mocks before each test
    jest.clearAllMocks();
    mockOracleService.isEnabled.mockReturnValue(true);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  const mockGlobusHorarioRaw: IGlobusHorario = {
    SETOR_PRINCIPAL_LINHA: 'GAMA',
    COD_LOCAL_TERMINAL_SEC: 7000,
    CODIGOLINHA: '123',
    NOMELINHA: 'Linha Teste',
    COD_DESTINO_LINHA: '456',
    LOCAL_DESTINO_LINHA: 'Destino Teste',
    FLG_SENTIDO: 'I',
    DATA_VIAGEM: '2023-01-01',
    DESC_TIPODIA: 'DIAS UTEIS',
    HOR_SAIDA: '08:00',
    HOR_CHEGADA: '09:00',
    COD_ORIGEM_VIAGEM: '789',
    LOCAL_ORIGEM_VIAGEM: 'Origem Teste',
    COD_SERVICO_COMPLETO: 'SERV-001',
    COD_SERVICO_NUMERO: '001',
    COD_ATIVIDADE: 2,
    NOME_ATIVIDADE: 'REGULAR',
    FLG_TIPO: 'R',
    COD_MOTORISTA: '111',
    NOME_MOTORISTA: 'Motorista Globus',
    CRACHA_MOTORISTA: 'CRACHA-MOT',
    CHAPAFUNC_MOTORISTA: 'CHAPA-MOT',
    COD_COBRADOR: '222',
    NOME_COBRADOR: 'Cobrador Globus',
    CRACHA_COBRADOR: 'CRACHA-COB',
    CHAPAFUNC_COBRADOR: 'CHAPA-COB',
    TOTAL_HORARIOS: 1,
  };

  const mockControleHorario: ControleHorario = {
    id: 'ch1',
    viagemGlobusId: 'SERV-001',
    dataReferencia: '2023-01-01',
    setorPrincipalLinha: 'GAMA',
    codLocalTerminalSec: 7000,
    codigoLinha: '123',
    nomeLinha: 'Linha Teste',
    codDestinoLinha: '456',
    localDestinoLinha: 'Destino Teste',
    flgSentido: 'I',
    descTipoDia: 'DIAS UTEIS',
    horaSaida: '08:00',
    horaChegada: '09:00',
    codOrigemViagem: '789',
    localOrigemViagem: 'Origem Teste',
    codServicoNumero: '001',
    codAtividade: 2,
    nomeAtividade: 'REGULAR',
    flgTipo: 'R',
    codMotorista: '111',
    nomeMotoristaGlobus: 'Motorista Globus',
    crachaMotoristaGlobus: 'CRACHA-MOT',
    chapaFuncMotoristaGlobus: 'CHAPA-MOT',
    codCobrador: '222',
    nomeCobradorGlobus: 'Cobrador Globus',
    crachaCobradorGlobus: 'CRACHA-COB',
    chapaFuncCobradorGlobus: 'CHAPA-COB',
    totalHorarios: 1,
    numeroCarro: 'A1',
    nomeMotoristaEditado: 'Motorista Editado',
    crachaMotoristaEditado: 'C1',
    nomeCobradorEditado: 'Cobrador Editado',
    crachaCobradorEditado: 'C2',
    observacoes: 'Obs',
    editorId: 'user-id-123',
    editorNome: 'User Test',
    editorEmail: 'user@test.com',
    createdAt: new Date(),
    updatedAt: new Date(),
    isAtivo: true,
  };

  describe('buscarControleHorarios', () => {
    const usuarioId = 'user-id-123';
    const usuarioEmail = 'test@example.com';

    it('should return empty response if no globus trips found', async () => {
      mockOracleService.executeQuery.mockResolvedValueOnce([]); // For getGlobusDataFromOracle
      mockOracleService.executeQuery.mockResolvedValueOnce([{ TOTAL: 0 }]); // For countGlobusDataFromOracle

      const result = await service.buscarControleHorarios('2023-01-01', {}, usuarioId, usuarioEmail);
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.message).toBe('Nenhuma viagem encontrada para os filtros aplicados');
    });

    it('should return merged data when trips and controls exist', async () => {
      mockOracleService.executeQuery.mockResolvedValueOnce([mockGlobusHorarioRaw]); // For getGlobusDataFromOracle
      mockOracleService.executeQuery.mockResolvedValueOnce([{ TOTAL: 1 }]); // For countGlobusDataFromOracle
      mockControleHorarioRepository.find.mockResolvedValueOnce([mockControleHorario]); // For buscarControlesExistentes
      mockControleHorarioRepository.count.mockResolvedValueOnce(1); // For estatisticas
      mockControleHorarioQueryBuilder.getRawOne.mockResolvedValueOnce({ ultima: new Date() }); // For estatisticas
      mockControleHorarioQueryBuilder.getRawMany.mockResolvedValue([]); // For estatisticas (setores, linhas, servicos)

      const result = await service.buscarControleHorarios('2023-01-01', {}, usuarioId, usuarioEmail);
      const expectedControleHorarioItemDto: ControleHorarioItemDto = {
        id: mockControleHorario.id,
        viagemGlobusId: mockGlobusHorarioRaw.COD_SERVICO_COMPLETO,
        dataReferencia: mockGlobusHorarioRaw.DATA_VIAGEM,
        setorPrincipalLinha: mockGlobusHorarioRaw.SETOR_PRINCIPAL_LINHA,
        codLocalTerminalSec: mockGlobusHorarioRaw.COD_LOCAL_TERMINAL_SEC,
        codigoLinha: mockGlobusHorarioRaw.CODIGOLINHA,
        nomeLinha: mockGlobusHorarioRaw.NOMELINHA,
        codDestinoLinha: mockGlobusHorarioRaw.COD_DESTINO_LINHA,
        localDestinoLinha: mockGlobusHorarioRaw.LOCAL_DESTINO_LINHA,
        flgSentido: mockGlobusHorarioRaw.FLG_SENTIDO,
        descTipoDia: mockGlobusHorarioRaw.DESC_TIPODIA,
        horaSaida: mockGlobusHorarioRaw.HOR_SAIDA,
        horaChegada: mockGlobusHorarioRaw.HOR_CHEGADA,
        codOrigemViagem: mockGlobusHorarioRaw.COD_ORIGEM_VIAGEM,
        localOrigemViagem: mockGlobusHorarioRaw.LOCAL_ORIGEM_VIAGEM,
        codServicoNumero: mockGlobusHorarioRaw.COD_SERVICO_NUMERO,
        codAtividade: mockGlobusHorarioRaw.COD_ATIVIDADE,
        nomeAtividade: mockGlobusHorarioRaw.NOME_ATIVIDADE,
        flgTipo: mockGlobusHorarioRaw.FLG_TIPO,
        codMotorista: mockGlobusHorarioRaw.COD_MOTORISTA,
        nomeMotoristaGlobus: mockGlobusHorarioRaw.NOME_MOTORISTA,
        crachaMotoristaGlobus: mockGlobusHorarioRaw.CRACHA_MOTORISTA,
        chapaFuncMotoristaGlobus: mockGlobusHorarioRaw.CHAPAFUNC_MOTORISTA,
        codCobrador: mockGlobusHorarioRaw.COD_COBRADOR,
        nomeCobradorGlobus: mockGlobusHorarioRaw.NOME_COBRADOR,
        crachaCobradorGlobus: mockGlobusHorarioRaw.CRACHA_COBRADOR,
        chapaFuncCobradorGlobus: mockGlobusHorarioRaw.CHAPAFUNC_COBRADOR,
        totalHorarios: mockGlobusHorarioRaw.TOTAL_HORARIOS,
        numeroCarro: mockControleHorario.numeroCarro,
        nomeMotoristaEditado: mockControleHorario.nomeMotoristaEditado,
        crachaMotoristaEditado: mockControleHorario.crachaMotoristaEditado,
        nomeCobradorEditado: mockControleHorario.nomeCobradorEditado,
        crachaCobradorEditado: mockControleHorario.crachaCobradorEditado,
        observacoes: mockControleHorario.observacoes,
        editorId: mockControleHorario.editorId,
        editorEmail: mockControleHorario.editorEmail,
        createdAt: mockControleHorario.createdAt,
        updatedAt: mockControleHorario.updatedAt,
        isAtivo: mockControleHorario.isAtivo,
        jaFoiEditado: true,
      };

      expect(result.data[0]).toEqual(expectedControleHorarioItemDto);
    });

    it('should throw BadRequestException for invalid date format', async () => {
      await expect(service.buscarControleHorarios('2023/01/01', {}, usuarioId, usuarioEmail)).rejects.toThrow(BadRequestException);
    });

    it('should apply editadoPorUsuario filter correctly', async () => {
      const mockGlobusHorarioRaw2 = { ...mockGlobusHorarioRaw, COD_SERVICO_COMPLETO: 'SERV-002' };
      const mockGlobusHorarioRaw3 = { ...mockGlobusHorarioRaw, COD_SERVICO_COMPLETO: 'SERV-003' };

      const mockControleHorario2 = { ...mockControleHorario, viagemGlobusId: 'SERV-002', usuarioEmail: 'other@test.com' };
      const mockControleHorario3 = { ...mockControleHorario, viagemGlobusId: 'SERV-003', id: undefined }; // Viagem sem controle

      mockOracleService.executeQuery.mockResolvedValueOnce([mockGlobusHorarioRaw, mockGlobusHorarioRaw2, mockGlobusHorarioRaw3]); // For getGlobusDataFromOracle
      mockOracleService.executeQuery.mockResolvedValueOnce([{ TOTAL: 3 }]); // For countGlobusDataFromOracle
      mockControleHorarioRepository.find.mockResolvedValueOnce([mockControleHorario, mockControleHorario2]); // For buscarControlesExistentes
      mockControleHorarioRepository.count.mockResolvedValue(0); // For estatisticas
      mockControleHorarioQueryBuilder.getRawOne.mockResolvedValue(null); // For estatisticas
      mockControleHorarioQueryBuilder.getRawMany.mockResolvedValue([]); // For estatisticas

      // Test with editadoPorUsuario = true
      let result = await service.buscarControleHorarios('2023-01-01', { editadoPorUsuario: true }, usuarioId, usuarioEmail);
      expect(result.data.length).toBe(1);

      const expectedControleHorarioItemDtoTrue: ControleHorarioItemDto = {
        id: mockControleHorario.id,
        viagemGlobusId: mockGlobusHorarioRaw.COD_SERVICO_COMPLETO,
        dataReferencia: mockGlobusHorarioRaw.DATA_VIAGEM,
        setorPrincipalLinha: mockGlobusHorarioRaw.SETOR_PRINCIPAL_LINHA,
        codLocalTerminalSec: mockGlobusHorarioRaw.COD_LOCAL_TERMINAL_SEC,
        codigoLinha: mockGlobusHorarioRaw.CODIGOLINHA,
        nomeLinha: mockGlobusHorarioRaw.NOMELINHA,
        codDestinoLinha: mockGlobusHorarioRaw.COD_DESTINO_LINHA,
        localDestinoLinha: mockGlobusHorarioRaw.LOCAL_DESTINO_LINHA,
        flgSentido: mockGlobusHorarioRaw.FLG_SENTIDO,
        descTipoDia: mockGlobusHorarioRaw.DESC_TIPODIA,
        horaSaida: mockGlobusHorarioRaw.HOR_SAIDA,
        horaChegada: mockGlobusHorarioRaw.HOR_CHEGADA,
        codOrigemViagem: mockGlobusHorarioRaw.COD_ORIGEM_VIAGEM,
        localOrigemViagem: mockGlobusHorarioRaw.LOCAL_ORIGEM_VIAGEM,
        codServicoNumero: mockGlobusHorarioRaw.COD_SERVICO_NUMERO,
        codAtividade: mockGlobusHorarioRaw.COD_ATIVIDADE,
        nomeAtividade: mockGlobusHorarioRaw.NOME_ATIVIDADE,
        flgTipo: mockGlobusHorarioRaw.FLG_TIPO,
        codMotorista: mockGlobusHorarioRaw.COD_MOTORISTA,
        nomeMotoristaGlobus: mockGlobusHorarioRaw.NOME_MOTORISTA,
        crachaMotoristaGlobus: mockGlobusHorarioRaw.CRACHA_MOTORISTA,
        chapaFuncMotoristaGlobus: mockGlobusHorarioRaw.CHAPAFUNC_MOTORISTA,
        codCobrador: mockGlobusHorarioRaw.COD_COBRADOR,
        nomeCobradorGlobus: mockGlobusHorarioRaw.NOME_COBRADOR,
        crachaCobradorGlobus: mockGlobusHorarioRaw.CRACHA_COBRADOR,
        chapaFuncCobradorGlobus: mockGlobusHorarioRaw.CHAPAFUNC_COBRADOR,
        totalHorarios: mockGlobusHorarioRaw.TOTAL_HORARIOS,
        numeroCarro: mockControleHorario.numeroCarro,
        nomeMotoristaEditado: mockControleHorario.nomeMotoristaEditado,
        crachaMotoristaEditado: mockControleHorario.crachaMotoristaEditado,
        nomeCobradorEditado: mockControleHorario.nomeCobradorEditado,
        crachaCobradorEditado: mockControleHorario.crachaCobradorEditado,
        observacoes: mockControleHorario.observacoes,
        editorId: mockControleHorario.editorId,
        editorEmail: mockControleHorario.editorEmail,
        createdAt: mockControleHorario.createdAt,
        updatedAt: mockControleHorario.updatedAt,
        isAtivo: mockControleHorario.isAtivo,
        jaFoiEditado: true,
      };
      expect(result.data[0]).toEqual(expectedControleHorarioItemDtoTrue);

      // Test with editadoPorUsuario = false
      result = await service.buscarControleHorarios('2023-01-01', { editadoPorUsuario: false }, usuarioId, usuarioEmail);
      expect(result.data.length).toBe(1);

      const expectedControleHorarioItemDtoFalse: ControleHorarioItemDto = {
        id: null, // No existing control
        viagemGlobusId: mockGlobusHorarioRaw3.COD_SERVICO_COMPLETO,
        dataReferencia: mockGlobusHorarioRaw3.DATA_VIAGEM,
        setorPrincipalLinha: mockGlobusHorarioRaw3.SETOR_PRINCIPAL_LINHA,
        codLocalTerminalSec: mockGlobusHorarioRaw3.COD_LOCAL_TERMINAL_SEC,
        codigoLinha: mockGlobusHorarioRaw3.CODIGOLINHA,
        nomeLinha: mockGlobusHorarioRaw3.NOMELINHA,
        codDestinoLinha: mockGlobusHorarioRaw3.COD_DESTINO_LINHA,
        localDestinoLinha: mockGlobusHorarioRaw3.LOCAL_DESTINO_LINHA,
        flgSentido: mockGlobusHorarioRaw3.FLG_SENTIDO,
        descTipoDia: mockGlobusHorarioRaw3.DESC_TIPODIA,
        horaSaida: mockGlobusHorarioRaw3.HOR_SAIDA,
        horaChegada: mockGlobusHorarioRaw3.HOR_CHEGADA,
        codOrigemViagem: mockGlobusHorarioRaw3.COD_ORIGEM_VIAGEM,
        localOrigemViagem: mockGlobusHorarioRaw3.LOCAL_ORIGEM_VIAGEM,
        codServicoNumero: mockGlobusHorarioRaw3.COD_SERVICO_NUMERO,
        codAtividade: mockGlobusHorarioRaw3.COD_ATIVIDADE,
        nomeAtividade: mockGlobusHorarioRaw3.NOME_ATIVIDADE,
        flgTipo: mockGlobusHorarioRaw3.FLG_TIPO,
        codMotorista: mockGlobusHorarioRaw3.COD_MOTORISTA,
        nomeMotoristaGlobus: mockGlobusHorarioRaw3.NOME_MOTORISTA,
        crachaMotoristaGlobus: mockGlobusHorarioRaw3.CRACHA_MOTORISTA,
        chapaFuncMotoristaGlobus: mockGlobusHorarioRaw3.CHAPAFUNC_MOTORISTA,
        codCobrador: mockGlobusHorarioRaw3.COD_COBRADOR,
        nomeCobradorGlobus: mockGlobusHorarioRaw3.NOME_COBRADOR,
        crachaCobradorGlobus: mockGlobusHorarioRaw3.CRACHA_COBRADOR,
        chapaFuncCobradorGlobus: mockGlobusHorarioRaw3.CHAPAFUNC_COBRADOR,
        totalHorarios: mockGlobusHorarioRaw3.TOTAL_HORARIOS,
        numeroCarro: null,
        nomeMotoristaEditado: null,
        crachaMotoristaEditado: null,
        nomeCobradorEditado: null,
        crachaCobradorEditado: null,
        observacoes: null,
        editorId: null,
        editorEmail: null,
        createdAt: expect.any(Date), // Default value
        updatedAt: expect.any(Date), // Default value
        isAtivo: true, // Default value
        jaFoiEditado: false,
      };
      expect(result.data[0]).toEqual(expectedControleHorarioItemDtoFalse);
    });
  });

  describe('createOrUpdateControleHorario', () => {
    const usuarioId = 'user-id-123';
    const usuarioEmail = 'test@example.com';

    const salvarDto: SalvarControleHorariosDto = {
      viagemGlobusId: 'SERV-001',
      numeroCarro: 'A1',
      nomeMotoristaEditado: 'Motorista Editado',
      crachaMotoristaEditado: 'C1',
      observacoes: 'Obs',
    };

    it('should throw NotFoundException if Globus data not found', async () => {
      mockOracleService.executeQuery.mockResolvedValueOnce([]); // For getGlobusDataFromOracleById
      await expect(service.createOrUpdateControleHorario('2023-01-01', salvarDto, usuarioId, usuarioEmail)).rejects.toThrow(NotFoundException);
    });

    it('should create a new controle horario if not exists', async () => {
      mockOracleService.executeQuery.mockResolvedValueOnce([mockGlobusHorarioRaw]); // For getGlobusDataFromOracleById
      mockControleHorarioRepository.findOne.mockResolvedValueOnce(undefined);
      mockControleHorarioRepository.create.mockReturnValue(mockControleHorario);
      mockControleHorarioRepository.save.mockResolvedValueOnce(mockControleHorario);
      mockOracleService.executeQuery.mockResolvedValueOnce([]); // For aplicarAtualizacaoEmEscala -> getGlobusDataFromOracle

      const result = await service.createOrUpdateControleHorario('2023-01-01', salvarDto, usuarioId, usuarioEmail);
      expect(result).toBe(mockControleHorario);
      expect(controleHorarioRepository.create).toHaveBeenCalled();
      expect(controleHorarioRepository.save).toHaveBeenCalled();
      expect(result.viagemGlobusId).toBe(salvarDto.viagemGlobusId);
      expect(result.editorId).toBe(usuarioId);
    });

    it('should update existing controle horario', async () => {
      const existingControle = { ...mockControleHorario, numeroCarro: 'OLD_CAR' };
      mockOracleService.executeQuery.mockResolvedValueOnce([mockGlobusHorarioRaw]); // For getGlobusDataFromOracleById
      mockControleHorarioRepository.findOne.mockResolvedValueOnce(existingControle);
      mockControleHorarioRepository.save.mockResolvedValueOnce({ ...existingControle, numeroCarro: 'A2' });
      mockOracleService.executeQuery.mockResolvedValueOnce([]); // For aplicarAtualizacaoEmEscala -> getGlobusDataFromOracle

      const updatedDto = { ...salvarDto, numeroCarro: 'A2' };
      const result = await service.createOrUpdateControleHorario('2023-01-01', updatedDto, usuarioId, usuarioEmail);
      expect(result).toBeDefined();
      expect(controleHorarioRepository.save).toHaveBeenCalledWith(expect.objectContaining({ numeroCarro: 'A2', editorId: usuarioId }));
    });
  });

  describe('salvarMultiplosControles', () => {
    const usuarioId = 'user-id-123';
    const usuarioEmail = 'test@example.com';

    const salvarMultiplosDto: SalvarMultiplosControleHorariosDto = {
      dataReferencia: '2023-01-01',
      controles: [
        { 
          viagemGlobusId: 'SERV-001', 
          numeroCarro: 'A1',
          nomeMotoristaEditado: 'Motorista 1',
        },
        { 
          viagemGlobusId: 'SERV-002', 
          numeroCarro: 'A2',
          nomeMotoristaEditado: 'Motorista 2',
        },
      ],
    };

    it('should throw BadRequestException if no controls provided', async () => {
      await expect(service.salvarMultiplosControles({ dataReferencia: '2023-01-01', controles: [] }, usuarioId, usuarioEmail)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if dataReferencia is missing', async () => {
      await expect(service.salvarMultiplosControles({ controles: [{ viagemGlobusId: 'SERV-001' }] } as any, usuarioId, usuarioEmail)).rejects.toThrow(BadRequestException);
    });

    it('should save multiple controls successfully', async () => {
      jest.spyOn(service, 'createOrUpdateControleHorario').mockResolvedValue(mockControleHorario);

      const result = await service.salvarMultiplosControles(salvarMultiplosDto, usuarioId, usuarioEmail);
      expect(result.salvos).toBe(2);
      expect(result.erros).toBe(0);
      expect(result.success).toBe(true);
      expect(service.createOrUpdateControleHorario).toHaveBeenCalledTimes(2);
    });

    it('should handle errors during multiple saves', async () => {
      jest.spyOn(service, 'createOrUpdateControleHorario')
        .mockResolvedValueOnce(mockControleHorario)
        .mockRejectedValueOnce(new Error('Save error'));

      const result = await service.salvarMultiplosControles(salvarMultiplosDto, usuarioId, usuarioEmail);
      expect(result.salvos).toBe(1);
      expect(result.erros).toBe(1);
      expect(result.success).toBe(false);
    });
  });

  describe('buscarOpcoesControleHorarios', () => {
    it('should return unique options for filters', async () => {
      mockControleHorarioRepository.createQueryBuilder.mockReturnValue(mockControleHorarioQueryBuilder);

      mockControleHorarioQueryBuilder.getRawMany
        .mockResolvedValueOnce([{ setor: 'SETOR A' }, { setor: 'SETOR B' }]) // setores
        .mockResolvedValueOnce([{ codigo: '123', nome: 'Linha 123' }]) // linhas
        .mockResolvedValueOnce([{ servico: '01' }]) // servicos
        .mockResolvedValueOnce([{ sentido: 'I' }]) // sentidos (flgSentido)
        .mockResolvedValueOnce([{ cracha: 'CRACHA-MOT', nome: 'Motorista X' }]) // motoristas
        .mockResolvedValueOnce([{ local: 'LOCAL ORIGEM A' }]); // locaisOrigem

      const result = await service.buscarOpcoesControleHorarios('2023-01-01');
      expect(result.setores).toEqual(['SETOR A', 'SETOR B']);
      expect(result.linhas).toEqual([{ codigo: '123', nome: 'Linha 123' }]);
      expect(result.servicos).toEqual(['01']);
      expect(result.sentidos).toEqual(['I']);
      expect(result.motoristas).toEqual([{ cracha: 'CRACHA-MOT', nome: 'Motorista X' }]);
      expect(result.locaisOrigem).toEqual(['LOCAL ORIGEM A']);
      expect(result.locaisDestino).toEqual([]);
    });
  });

  describe('obterEstatisticasControleHorarios', () => {
    it('should return correct statistics', async () => {
      mockOracleService.executeQuery.mockResolvedValueOnce([mockGlobusHorarioRaw, mockGlobusHorarioRaw]); // For totalViagens
      mockControleHorarioRepository.count.mockResolvedValueOnce(1); // For viagensEditadas

      mockControleHorarioRepository.createQueryBuilder.mockReturnValue(mockControleHorarioQueryBuilder);
      mockControleHorarioQueryBuilder.getRawOne.mockResolvedValueOnce({ ultima: new Date('2023-01-01T10:00:00Z') });
      mockControleHorarioQueryBuilder.getRawMany.mockResolvedValue([]); // For unique values

      const result = await service.obterEstatisticasControleHorarios('2023-01-01', 'user-id-123');
      expect(result.viagensEditadas).toBe(1);
      expect(result.viagensNaoEditadas).toBe(1);
      expect(result.percentualEditado).toBe(50);
      expect(result.ultimaAtualizacao).toEqual(new Date('2023-01-01T10:00:00Z'));
    });

    it('should handle zero total trips', async () => {
      mockOracleService.executeQuery.mockResolvedValueOnce([]); // For totalViagens
      mockControleHorarioRepository.count.mockResolvedValueOnce(0); // For viagensEditadas

      mockControleHorarioRepository.createQueryBuilder.mockReturnValue(mockControleHorarioQueryBuilder);
      mockControleHorarioQueryBuilder.getRawOne.mockResolvedValueOnce({ ultima: null });
      mockControleHorarioQueryBuilder.getRawMany.mockResolvedValue([]); // For unique values

      const result = await service.obterEstatisticasControleHorarios('2023-01-01', 'user-id-123');
      expect(result.totalViagens).toBe(0);
      expect(result.viagensEditadas).toBe(0);
      expect(result.viagensNaoEditadas).toBe(0);
      expect(result.percentualEditado).toBe(0);
      expect(result.ultimaAtualizacao).toBeNull();
    });
  });
});
