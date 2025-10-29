import { Test, TestingModule } from '@nestjs/testing';
import { ControleHorariosService } from './controle-horarios.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ControleHorario } from '../entities/controle-horario.entity';
import { ViagemGlobus } from '../../viagens-globus/entities/viagem-globus.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { FiltrosControleHorariosDto, SalvarControleHorariosDto, SalvarMultiplosControleHorariosDto } from '../dto';
import { CombinacaoComparacao } from '../../comparacao-viagens/utils/trip-comparator.util';

describe('ControleHorariosService', () => {
  let service: ControleHorariosService;
  let controleHorarioRepository: Repository<ControleHorario>;
  let viagemGlobusRepository: Repository<ViagemGlobus>;

  let mockControleHorarioQueryBuilder: any;
  let mockViagemGlobusQueryBuilder: any;

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

  const mockViagemGlobusRepository = {
    findOne: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(() => mockViagemGlobusQueryBuilder),
  };

  beforeEach(async () => {
    mockControleHorarioQueryBuilder = createMockQueryBuilder();
    mockViagemGlobusQueryBuilder = createMockQueryBuilder();

    const mockViagemGlobus = {
      id: 'vg1',
      setorPrincipal: 'SETOR A',
      codLocalTerminalSec: 123,
      codigoLinha: '123',
      nomeLinha: 'LINHA TESTE',
      codDestinoLinha: 456,
      localDestinoLinha: 'DESTINO TESTE',
      flgSentido: 'I',
      dataViagem: new Date('2023-01-01'),
      descTipoDia: 'UTIL',
      horSaida: new Date('2023-01-01T08:00:00Z'),
      horChegada: new Date('2023-01-01T09:00:00Z'),
      horSaidaTime: '08:00',
      horChegadaTime: '09:00',
      codOrigemViagem: 789,
      localOrigemViagem: 'ORIGEM TESTE',
      codAtividade: 1,
      nomeAtividade: 'ATIVIDADE TESTE',
      flgTipo: 'T',
      codServicoCompleto: 'SERV-COMP',
      codServicoNumero: '01',
      codMotorista: 111,
      nomeMotorista: 'MOTORISTA TESTE',
      codCobrador: 222,
      nomeCobrador: 'COBRADOR TESTE',
      crachaMotorista: 'CRACHA-MOT',
      chapaFuncMotorista: 'CHAPA-MOT',
      crachaCobrador: 'CRACHA-COB',
      chapaFuncCobrador: 'CHAPA-COB',
      totalHorarios: 1,
      duracaoMinutos: 60,
      dataReferencia: '2023-01-01',
      hashDados: 'HASH-TESTE',
      createdAt: new Date(),
      updatedAt: new Date(),
      sentidoTexto: 'IDA',
      periodoDoDia: 'MANHA',
      temCobrador: false,
      origemDados: 'ORACLE_GLOBUS',
      isAtivo: true,
    } as ViagemGlobus;

    const mockControleHorario = {
      id: 'ch1', viagemGlobusId: 'vg1', dataReferencia: '2023-01-01', numeroCarro: 'A1',
      informacaoRecolhe: 'Info', crachaFuncionario: 'C1', observacoes: 'Obs', usuarioEdicao: 'user@test.com',
      usuarioEmail: 'user@test.com', isAtivo: true, createdAt: new Date(), updatedAt: new Date(),
    } as ControleHorario;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ControleHorariosService,
        {
          provide: getRepositoryToken(ControleHorario),
          useValue: mockControleHorarioRepository,
        },
        {
          provide: getRepositoryToken(ViagemGlobus),
          useValue: mockViagemGlobusRepository,
        },
      ],
    }).compile();

    service = module.get<ControleHorariosService>(ControleHorariosService);
    controleHorarioRepository = module.get<Repository<ControleHorario>>(
      getRepositoryToken(ControleHorario),
    );
    viagemGlobusRepository = module.get<Repository<ViagemGlobus>>(
      getRepositoryToken(ViagemGlobus),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('buscarControleHorarios', () => {
    const mockViagemGlobus = {
      id: 'vg1',
      setorPrincipal: 'SETOR A',
      codLocalTerminalSec: 123,
      codigoLinha: '123',
      nomeLinha: 'LINHA TESTE',
      codDestinoLinha: 456,
      localDestinoLinha: 'DESTINO TESTE',
      flgSentido: 'I',
      dataViagem: new Date('2023-01-01'),
      descTipoDia: 'UTIL',
      horSaida: new Date('2023-01-01T08:00:00Z'),
      horChegada: new Date('2023-01-01T09:00:00Z'),
      horSaidaTime: '08:00',
      horChegadaTime: '09:00',
      codOrigemViagem: 789,
      localOrigemViagem: 'ORIGEM TESTE',
      codAtividade: 1,
      nomeAtividade: 'ATIVIDADE TESTE',
      flgTipo: 'T',
      codServicoCompleto: 'SERV-COMP',
      codServicoNumero: '01',
      codMotorista: 111,
      nomeMotorista: 'MOTORISTA TESTE',
      codCobrador: 222,
      nomeCobrador: 'COBRADOR TESTE',
      crachaMotorista: 'CRACHA-MOT',
      chapaFuncMotorista: 'CHAPA-MOT',
      crachaCobrador: 'CRACHA-COB',
      chapaFuncCobrador: 'CHAPA-COB',
      totalHorarios: 1,
      duracaoMinutos: 60,
      dataReferencia: '2023-01-01',
      hashDados: 'HASH-TESTE',
      createdAt: new Date(),
      updatedAt: new Date(),
      sentidoTexto: 'IDA',
      periodoDoDia: 'MANHA',
      temCobrador: false,
      origemDados: 'ORACLE_GLOBUS',
      isAtivo: true,
    } as ViagemGlobus;

    const mockControleHorario = {
      id: 'ch1', viagemGlobusId: 'vg1', dataReferencia: '2023-01-01', numeroCarro: 'A1',
      informacaoRecolhe: 'Info', crachaFuncionario: 'C1', observacoes: 'Obs', usuarioEdicao: 'user@test.com',
      usuarioEmail: 'user@test.com', isAtivo: true, createdAt: new Date(), updatedAt: new Date(),
    } as ControleHorario;

    it('should return empty response if no globus trips found', async () => {
      mockViagemGlobusQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);
      mockControleHorarioRepository.count.mockResolvedValue(0);

      const result = await service.buscarControleHorarios('2023-01-01', {}, 'test@example.com');
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.message).toBe('Nenhuma viagem encontrada para os filtros aplicados');
    });

    it('should return merged data when trips and controls exist', async () => {
      mockViagemGlobusQueryBuilder.getManyAndCount.mockResolvedValue([[mockViagemGlobus], 1]);
      mockControleHorarioQueryBuilder.getMany.mockResolvedValue([mockControleHorario]);
      mockViagemGlobusRepository.count.mockResolvedValue(1);
      mockControleHorarioRepository.count.mockResolvedValue(1);
      mockControleHorarioQueryBuilder.getRawOne.mockResolvedValue({ ultima: new Date() });
      mockViagemGlobusQueryBuilder.getRawMany.mockResolvedValue([]); // For estatisticas

      const result = await service.buscarControleHorarios('2023-01-01', {}, 'test@example.com');
      expect(result.data.length).toBe(1);
      expect(result.data[0].viagemGlobus.id).toBe('vg1');
      expect(result.data[0].dadosEditaveis.id).toBe('ch1');
    });

    it('should throw BadRequestException for invalid date format', async () => {
      await expect(service.buscarControleHorarios('2023/01/01', {}, 'test@example.com')).rejects.toThrow(BadRequestException);
    });

    it('should apply editadoPorUsuario filter correctly', async () => {
      const mockViagemGlobus2 = { ...mockViagemGlobus, id: 'vg2' };
      const mockViagemGlobus3 = { ...mockViagemGlobus, id: 'vg3' }; // Viagem sem controle
      const mockControleHorario2 = { ...mockControleHorario, viagemGlobusId: 'vg2', usuarioEmail: 'other@test.com' };

      mockViagemGlobusQueryBuilder.getManyAndCount.mockResolvedValue([[mockViagemGlobus, mockViagemGlobus2, mockViagemGlobus3], 3]);
      mockControleHorarioQueryBuilder.getMany.mockResolvedValue([mockControleHorario, mockControleHorario2]); // vg3 does not have a control
      mockViagemGlobusRepository.count.mockResolvedValue(3);
      mockControleHorarioRepository.count.mockResolvedValue(2);
      mockControleHorarioQueryBuilder.getRawOne.mockResolvedValue({ ultima: new Date() });
      mockViagemGlobusQueryBuilder.getRawMany.mockResolvedValue([]);

      // Test with editadoPorUsuario = true
      let result = await service.buscarControleHorarios('2023-01-01', { editadoPorUsuario: true }, 'user@test.com');
      expect(result.data.length).toBe(1);
      expect(result.data[0].viagemGlobus.id).toBe('vg1');

      // Test with editadoPorUsuario = false
      result = await service.buscarControleHorarios('2023-01-01', { editadoPorUsuario: false }, 'user@test.com');
      expect(result.data.length).toBe(1);
      expect(result.data[0].viagemGlobus.id).toBe('vg3');
    });

    it('should apply combinacaoComparacao filter correctly', async () => {
      const mockViagemGlobusA = { ...mockViagemGlobus, id: 'vgA', codigoLinha: '1002', nomeLinha: '100.2 - Linha A', sentidoTexto: 'IDA', codServicoNumero: '01', horSaidaTime: '08:00', CODIGOLINHA: '1002', FLG_SENTIDO: 'I', COD_SERVICO_NUMERO: '01', HOR_SAIDA: '01/01/1900 08:00:00' };
      const mockViagemGlobusB = { ...mockViagemGlobus, id: 'vgB', codigoLinha: '2001', nomeLinha: '200.1 - Linha B', sentidoTexto: 'VOLTA', codServicoNumero: '02', horSaidaTime: '09:00', CODIGOLINHA: '2001', FLG_SENTIDO: 'V', COD_SERVICO_NUMERO: '02', HOR_SAIDA: '01/01/1900 09:00:00' };
      const mockViagemGlobusC = { ...mockViagemGlobus, id: 'vgC', codigoLinha: '1002', nomeLinha: '100.2 - Linha C', sentidoTexto: 'IDA', codServicoNumero: '01', horSaidaTime: '08:00', CODIGOLINHA: '1002', FLG_SENTIDO: 'I', COD_SERVICO_NUMERO: '01', HOR_SAIDA: '01/01/1900 08:00:00' }; // Igual a A

      const mockControleHorarioA = { ...mockControleHorario, viagemGlobusId: 'vgA' };
      const mockControleHorarioB = { ...mockControleHorario, viagemGlobusId: 'vgB' };
      const mockControleHorarioC = { ...mockControleHorario, viagemGlobusId: 'vgC' };

      mockViagemGlobusQueryBuilder.getManyAndCount.mockResolvedValue([[mockViagemGlobusA, mockViagemGlobusB, mockViagemGlobusC], 3]);
      mockControleHorarioQueryBuilder.getMany.mockResolvedValue([mockControleHorarioA, mockControleHorarioB, mockControleHorarioC]);
      mockViagemGlobusRepository.count.mockResolvedValue(3);
      mockControleHorarioRepository.count.mockResolvedValue(3);
      mockControleHorarioQueryBuilder.getRawOne.mockResolvedValue({ ultima: new Date() });
      mockViagemGlobusQueryBuilder.getRawMany.mockResolvedValue([]);

      // Testar com CombinacaoComparacao.TUDO_IGUAL (simulando TransData igual a Globus)
      // Para este teste, vamos fazer com que a simulação da TransData seja idêntica à Globus
      // para que a comparação resulte em TUDO_IGUAL.
      let result = await service.buscarControleHorarios(
        '2023-01-01',
        { combinacaoComparacao: CombinacaoComparacao.TUDO_IGUAL },
        'user@test.com',
      );
      // Como a simulação de TransData é baseada na própria Globus, todas as viagens serão TUDO_IGUAL
      expect(result.data.length).toBe(3);

      // Testar com uma combinação que não deve existir com a simulação atual (ex: SO_HORARIO_DIFERENTE)
      result = await service.buscarControleHorarios(
        '2023-01-01',
        { combinacaoComparacao: CombinacaoComparacao.SO_HORARIO_DIFERENTE },
        'user@test.com',
      );
      // Com a simulação atual (TransData = Globus), nenhuma viagem terá SO_HORARIO_DIFERENTE
      expect(result.data.length).toBe(0);
    });
  });

  describe('salvarControleHorario', () => {
    const salvarDto: SalvarControleHorariosDto = {
      viagemGlobusId: 'vg1',
      numeroCarro: 'A1',
      informacaoRecolhe: 'Info',
      crachaFuncionario: 'C1',
      observacoes: 'Obs',
    };
    const mockViagemGlobus = { id: 'vg1', dataReferencia: '2023-01-01' } as ViagemGlobus;

    it('should throw NotFoundException if ViagemGlobus not found', async () => {
      mockViagemGlobusRepository.findOne.mockResolvedValue(undefined);
      await expect(service.salvarControleHorario('2023-01-01', salvarDto, 'test@example.com')).rejects.toThrow(NotFoundException);
    });

    it('should create a new controle horario if not exists', async () => {
      mockViagemGlobusRepository.findOne.mockResolvedValue(mockViagemGlobus);
      mockControleHorarioRepository.findOne.mockResolvedValue(undefined);
      mockControleHorarioRepository.create.mockReturnValue({ ...salvarDto, dataReferencia: '2023-01-01', usuarioEmail: 'test@example.com' });
      mockControleHorarioRepository.save.mockResolvedValue({ id: 'new-ch', ...salvarDto });

      // Mock for aplicarAtualizacaoEmEscala
      mockViagemGlobusQueryBuilder.getMany.mockResolvedValue([]);

      const result = await service.salvarControleHorario('2023-01-01', salvarDto, 'test@example.com');
      expect(result.success).toBe(true);
      expect(controleHorarioRepository.create).toHaveBeenCalled();
      expect(controleHorarioRepository.save).toHaveBeenCalled();
    });

    it('should update existing controle horario', async () => {
      const existingControle = { ...salvarDto, id: 'ch1', usuarioEdicao: 'old@test.com', updatedAt: new Date() } as ControleHorario;
      mockViagemGlobusRepository.findOne.mockResolvedValue(mockViagemGlobus);
      mockControleHorarioRepository.findOne.mockResolvedValue(existingControle);
      mockControleHorarioRepository.save.mockResolvedValue({ ...existingControle, numeroCarro: 'A2' });

      // Mock for aplicarAtualizacaoEmEscala
      mockViagemGlobusQueryBuilder.getMany.mockResolvedValue([]);

      const updatedDto = { ...salvarDto, numeroCarro: 'A2' };
      const result = await service.salvarControleHorario('2023-01-01', updatedDto, 'test@example.com');
      expect(result.success).toBe(true);
      expect(controleHorarioRepository.save).toHaveBeenCalledWith(expect.objectContaining({ numeroCarro: 'A2' }));
    });
  });

  describe('salvarMultiplosControles', () => {
    const mockViagemGlobus = { id: 'vg1', dataReferencia: '2023-01-01' } as ViagemGlobus;
    const salvarMultiplosDto: SalvarMultiplosControleHorariosDto = {
      dataReferencia: '2023-01-01',
      controles: [
        { viagemGlobusId: 'vg1', numeroCarro: 'A1' },
        { viagemGlobusId: 'vg2', numeroCarro: 'A2' },
      ],
    };

    it('should throw BadRequestException if no controls provided', async () => {
      await expect(service.salvarMultiplosControles({ dataReferencia: '2023-01-01', controles: [] }, 'test@example.com')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if dataReferencia is missing', async () => {
      await expect(service.salvarMultiplosControles({ controles: [{ viagemGlobusId: 'vg1' }] } as any, 'test@example.com')).rejects.toThrow(BadRequestException);
    });

    it('should save multiple controls successfully', async () => {
      jest.spyOn(service, 'salvarControleHorario').mockResolvedValue({ success: true, message: '', data: {} });

      const result = await service.salvarMultiplosControles(salvarMultiplosDto, 'test@example.com');
      expect(result.salvos).toBe(2);
      expect(result.erros).toBe(0);
      expect(result.success).toBe(true);
      expect(service.salvarControleHorario).toHaveBeenCalledTimes(2);
    });

    it('should handle errors during multiple saves', async () => {
      jest.spyOn(service, 'salvarControleHorario')
        .mockResolvedValueOnce({ success: true, message: '', data: {} })
        .mockRejectedValueOnce(new Error('Save error'));

      const result = await service.salvarMultiplosControles(salvarMultiplosDto, 'test@example.com');
      expect(result.salvos).toBe(1);
      expect(result.erros).toBe(1);
      expect(result.success).toBe(false);
    });
  });

  describe('buscarOpcoesControleHorarios', () => {
    it('should return unique options for filters', async () => {
      mockViagemGlobusRepository.createQueryBuilder.mockReturnValue(mockViagemGlobusQueryBuilder);

      mockViagemGlobusQueryBuilder.getRawMany
        .mockResolvedValueOnce([{ setor: 'SETOR A' }, { setor: 'SETOR B' }]) // setores
        .mockResolvedValueOnce([{ codigo: '123', nome: 'Linha 123' }]) // linhas
        .mockResolvedValueOnce([{ servico: '01' }]) // servicos
        .mockResolvedValueOnce([{ sentido: 'IDA' }]) // sentidos
        .mockResolvedValueOnce([{ motorista: 'Motorista X' }]); // motoristas

      const result = await service.buscarOpcoesControleHorarios('2023-01-01');
      expect(result.setores).toEqual(['SETOR A', 'SETOR B']);
      expect(result.linhas).toEqual([{ codigo: '123', nome: 'Linha 123' }]);
      expect(result.servicos).toEqual(['01']);
      expect(result.sentidos).toEqual(['IDA']);
      expect(result.motoristas).toEqual(['Motorista X']);
    });
  });

  describe('obterEstatisticasControleHorarios', () => {
    it('should return correct statistics', async () => {
      mockViagemGlobusRepository.count.mockResolvedValue(10);
      mockControleHorarioRepository.count.mockResolvedValue(5);

      mockControleHorarioRepository.createQueryBuilder.mockReturnValue(mockControleHorarioQueryBuilder);
      mockControleHorarioQueryBuilder.getRawOne.mockResolvedValue({ ultima: new Date('2023-01-01T10:00:00Z') });

      mockViagemGlobusRepository.createQueryBuilder.mockReturnValue(mockViagemGlobusQueryBuilder); // Ensure this is the correct mock instance
      mockViagemGlobusQueryBuilder.getRawMany.mockResolvedValue([]); // For unique values

      const result = await service.obterEstatisticasControleHorarios('2023-01-01');
      expect(result.totalViagens).toBe(10);
      expect(result.viagensEditadas).toBe(5);
      expect(result.viagensNaoEditadas).toBe(5);
      expect(result.percentualEditado).toBe(50);
      expect(result.ultimaAtualizacao).toEqual(new Date('2023-01-01T10:00:00Z'));
    });

    it('should handle zero total trips', async () => {
      mockViagemGlobusRepository.count.mockResolvedValue(0);
      mockControleHorarioRepository.count.mockResolvedValue(0);

      mockControleHorarioRepository.createQueryBuilder.mockReturnValue(mockControleHorarioQueryBuilder);
      mockControleHorarioQueryBuilder.getRawOne.mockResolvedValue({ ultima: null });

      mockViagemGlobusRepository.createQueryBuilder.mockReturnValue(mockViagemGlobusQueryBuilder);
      mockViagemGlobusQueryBuilder.getRawMany.mockResolvedValue([]);

      const result = await service.obterEstatisticasControleHorarios('2023-01-01');
      expect(result.totalViagens).toBe(0);
      expect(result.viagensEditadas).toBe(0);
      expect(result.viagensNaoEditadas).toBe(0);
      expect(result.percentualEditado).toBe(0);
      expect(result.ultimaAtualizacao).toBeNull();
    });
  });
});
