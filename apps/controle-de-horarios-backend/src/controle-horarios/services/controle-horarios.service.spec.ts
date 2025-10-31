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

    it('should return empty response if no local trips found', async () => {
      mockControleHorarioQueryBuilder.getCount.mockResolvedValueOnce(0);
      mockControleHorarioQueryBuilder.getMany.mockResolvedValueOnce([]);

      const result = await service.buscarControleHorarios('2023-01-01', {}, usuarioId);
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should return data from local repository', async () => {
      mockControleHorarioQueryBuilder.getCount.mockResolvedValueOnce(1);
      mockControleHorarioQueryBuilder.getMany.mockResolvedValueOnce([mockControleHorario]);
      // Mock for statistics
      mockControleHorarioRepository.count.mockResolvedValue(1);
      mockControleHorarioQueryBuilder.getRawOne.mockResolvedValueOnce({ ultima: new Date() });
      mockControleHorarioQueryBuilder.getRawMany.mockResolvedValue([]);

      const result = await service.buscarControleHorarios('2023-01-01', {}, usuarioId);
      expect(result.data.length).toBe(1);
      expect(result.total).toBe(1);
      expect(result.data[0].id).toBe(mockControleHorario.id);
    });

    it('should throw BadRequestException for invalid date format', async () => {
      await expect(service.buscarControleHorarios('2023/01/01', {}, usuarioId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('createOrUpdateControleHorario', () => {
    const usuarioId = 'user-id-123';
    const usuarioEmail = 'test@example.com';
    const usuarioNome = 'Test User';

    const salvarDto: SalvarControleHorariosDto = {
      viagemGlobusId: 'SERV-001',
      numeroCarro: 'A1',
      nomeMotoristaEditado: 'Motorista Editado',
      crachaMotoristaEditado: 'C1',
      observacoes: 'Obs',
    };

    it('should create a new controle horario if not exists', async () => {
      mockControleHorarioRepository.findOne.mockResolvedValueOnce(undefined);
      mockControleHorarioRepository.create.mockReturnValue(mockControleHorario);
      mockControleHorarioRepository.save.mockResolvedValueOnce(mockControleHorario);
      mockOracleService.executeQuery.mockResolvedValueOnce([mockGlobusHorarioRaw]); // For getGlobusDataFromOracleById

      const result = await service.createOrUpdateControleHorario('2023-01-01', salvarDto, usuarioId, usuarioEmail, usuarioNome);
      expect(result).toBe(mockControleHorario);
      expect(controleHorarioRepository.create).toHaveBeenCalled();
      expect(controleHorarioRepository.save).toHaveBeenCalled();
      expect(result.viagemGlobusId).toBe(salvarDto.viagemGlobusId);
      expect(result.editorId).toBe(usuarioId);
      expect(result.editorNome).toBe(usuarioNome);
    });

    it('should update existing controle horario and trigger propagation', async () => {
      const existingControle = { ...mockControleHorario, numeroCarro: 'OLD_CAR' };
      mockControleHorarioRepository.findOne.mockResolvedValueOnce(existingControle);
      mockControleHorarioRepository.save.mockResolvedValueOnce({ ...existingControle, numeroCarro: 'A2' });
      // Mock for aplicarAtualizacaoEmEscala
      mockOracleService.executeQuery.mockResolvedValueOnce([mockGlobusHorarioRaw]); // for getGlobusDataFromOracleById in propagation
      mockOracleService.executeQuery.mockResolvedValueOnce([]); // for getGlobusDataFromOracle in propagation

      const updatedDto = { ...salvarDto, numeroCarro: 'A2' };
      const result = await service.createOrUpdateControleHorario('2023-01-01', updatedDto, usuarioId, usuarioEmail, usuarioNome);
      expect(result).toBeDefined();
      expect(controleHorarioRepository.save).toHaveBeenCalledWith(expect.objectContaining({ numeroCarro: 'A2', editorId: usuarioId, editorNome: usuarioNome }));
    });
  });

  describe('salvarMultiplosControles', () => {
    const usuarioId = 'user-id-123';
    const usuarioEmail = 'test@example.com';
    const usuarioNome = 'Test User';

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
      await expect(service.salvarMultiplosControles({ dataReferencia: '2023-01-01', controles: [] }, usuarioId, usuarioEmail, usuarioNome)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if dataReferencia is missing', async () => {
      await expect(service.salvarMultiplosControles({ controles: [{ viagemGlobusId: 'SERV-001' }] } as any, usuarioId, usuarioEmail, usuarioNome)).rejects.toThrow(BadRequestException);
    });

    it('should save multiple controls successfully', async () => {
      jest.spyOn(service, 'createOrUpdateControleHorario').mockResolvedValue(mockControleHorario);

      const result = await service.salvarMultiplosControles(salvarMultiplosDto, usuarioId, usuarioEmail, usuarioNome);
      expect(result.salvos).toBe(2);
      expect(result.erros).toBe(0);
      expect(result.success).toBe(true);
      expect(service.createOrUpdateControleHorario).toHaveBeenCalledTimes(2);
    });

    it('should handle errors during multiple saves', async () => {
      jest.spyOn(service, 'createOrUpdateControleHorario')
        .mockResolvedValueOnce(mockControleHorario)
        .mockRejectedValueOnce(new Error('Save error'));

      const result = await service.salvarMultiplosControles(salvarMultiplosDto, usuarioId, usuarioEmail, usuarioNome);
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
