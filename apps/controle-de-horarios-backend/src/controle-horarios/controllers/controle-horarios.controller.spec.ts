import { Test, TestingModule } from '@nestjs/testing';
import { ControleHorariosController } from './controle-horarios.controller';
import { ControleHorariosService } from '../services/controle-horarios.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { UserRole } from '../../common/enums/user-role.enum';
import { HttpException, HttpStatus } from '@nestjs/common';
import { SalvarControleHorariosDto } from '../dto';

describe('ControleHorariosController', () => {
  let controller: ControleHorariosController;
  let service: ControleHorariosService;

  const mockControleHorariosService = {
    buscarControleHorarios: jest.fn(),
    salvarControleHorario: jest.fn(),
    salvarMultiplosControles: jest.fn(),
    buscarOpcoesControleHorarios: jest.fn(),
    obterEstatisticasControleHorarios: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ControleHorariosController],
      providers: [
        {
          provide: ControleHorariosService,
          useValue: mockControleHorariosService,
        },
      ],
    })
    .overrideGuard(JwtAuthGuard)
    .useValue({ canActivate: () => true })
    .overrideGuard(RolesGuard)
    .useValue({ canActivate: () => true })
    .compile();

    controller = module.get<ControleHorariosController>(ControleHorariosController);
    service = module.get<ControleHorariosService>(ControleHorariosService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('buscarControleHorarios', () => {
    it('should return controle horarios data', async () => {
      const result = { success: true, data: [], total: 0, pagina: 0, limite: 100, temMaisPaginas: false, filtrosAplicados: {}, estatisticas: {}, executionTime: '0ms', dataReferencia: '2023-01-01' };
      mockControleHorariosService.buscarControleHorarios.mockResolvedValue(result);

      const usuarioId = 'test-user-id';
      const usuarioEmail = 'test@example.com';
      expect(await controller.buscarControleHorarios('2023-01-01', {}, usuarioId, usuarioEmail)).toEqual(result);
      expect(service.buscarControleHorarios).toHaveBeenCalledWith('2023-01-01', {}, usuarioId, usuarioEmail);
    });

    it('should throw HttpException on service error', async () => {
      mockControleHorariosService.buscarControleHorarios.mockRejectedValue(new Error('Service error'));

      const usuarioId = 'test-user-id';
      const usuarioEmail = 'test@example.com';
      await expect(controller.buscarControleHorarios('2023-01-01', {}, usuarioId, usuarioEmail)).rejects.toThrow(
        new HttpException(
          {
            success: false,
            message: 'Erro ao buscar controle de horários',
            error: 'Service error',
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });

  describe('salvarControleHorario', () => {
    it('should save controle horario', async () => {
      const result = { success: true, message: 'Controle de horário criado com sucesso', data: {} };
      mockControleHorariosService.salvarControleHorario.mockResolvedValue(result);

      const dto: SalvarControleHorariosDto = { 
        viagemGlobusId: '123', 
        numeroCarro: 'A1', 
        informacaoRecolhe: 'info', 
        nomeMotoristaEditado: 'Motorista Teste',
        crachaMotoristaEditado: 'C1',
        observacoes: 'obs' 
      };
      const usuarioId = 'test-user-id';
      const usuarioEmail = 'test@example.com';
      expect(await controller.salvarControleHorario('2023-01-01', dto, usuarioId, usuarioEmail)).toEqual(result);
      expect(service.salvarControleHorario).toHaveBeenCalledWith('2023-01-01', dto, usuarioId, usuarioEmail);
    });

    it('should throw HttpException on service error', async () => {
      mockControleHorariosService.salvarControleHorario.mockRejectedValue(new Error('Service error'));

      const dto: SalvarControleHorariosDto = { 
        viagemGlobusId: '123', 
        numeroCarro: 'A1', 
        informacaoRecolhe: 'info', 
        nomeMotoristaEditado: 'Motorista Teste',
        crachaMotoristaEditado: 'C1',
        observacoes: 'obs' 
      };
      const usuarioId = 'test-user-id';
      const usuarioEmail = 'test@example.com';
      await expect(controller.salvarControleHorario('2023-01-01', dto, usuarioId, usuarioEmail)).rejects.toThrow(
        new HttpException(
          {
            success: false,
            message: 'Erro ao salvar controle de horário',
            error: 'Service error',
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });

  describe('salvarMultiplosControles', () => {
    it('should save multiple controle horarios', async () => {
      const result = { success: true, message: 'Salvamento concluído: 1 sucessos, 0 erros', salvos: 1, erros: 0 };
      mockControleHorariosService.salvarMultiplosControles.mockResolvedValue(result);

      const dto = { 
        dataReferencia: '2023-01-01', 
        controles: [
          { 
            viagemGlobusId: '123', 
            numeroCarro: 'A1',
            nomeMotoristaEditado: 'Motorista Teste',
            crachaMotoristaEditado: 'C1',
          }
        ]
      };
      const usuarioId = 'test-user-id';
      const usuarioEmail = 'test@example.com';
      expect(await controller.salvarMultiplosControles(dto, usuarioId, usuarioEmail)).toEqual(result);
      expect(service.salvarMultiplosControles).toHaveBeenCalledWith(dto, usuarioId, usuarioEmail);
    });

    it('should throw HttpException on service error', async () => {
      mockControleHorariosService.salvarMultiplosControles.mockRejectedValue(new Error('Service error'));

      const dto = { 
        dataReferencia: '2023-01-01', 
        controles: [
          { 
            viagemGlobusId: '123', 
            numeroCarro: 'A1',
            nomeMotoristaEditado: 'Motorista Teste',
            crachaMotoristaEditado: 'C1',
          }
        ]
      };
      const usuarioId = 'test-user-id';
      const usuarioEmail = 'test@example.com';
      await expect(controller.salvarMultiplosControles(dto, usuarioId, usuarioEmail)).rejects.toThrow(
        new HttpException(
          {
            success: false,
            message: 'Erro ao salvar controles de horário',
            error: 'Service error',
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });

  describe('buscarOpcoesControleHorarios', () => {
    it('should return options for controle horarios', async () => {
      const result = { setores: [], linhas: [], servicos: [], sentidos: [], motoristas: [], locaisOrigem: [], locaisDestino: [] };
      mockControleHorariosService.buscarOpcoesControleHorarios.mockResolvedValue(result);

      expect(await controller.buscarOpcoesControleHorarios('2023-01-01', 'test@example.com')).toEqual({
        success: true,
        message: 'Opções obtidas com sucesso',
        data: result,
      });
      expect(service.buscarOpcoesControleHorarios).toHaveBeenCalledWith('2023-01-01');
    });

    it('should throw HttpException on service error', async () => {
      mockControleHorariosService.buscarOpcoesControleHorarios.mockRejectedValue(new Error('Service error'));

      await expect(controller.buscarOpcoesControleHorarios('2023-01-01', 'test@example.com')).rejects.toThrow(
        new HttpException(
          {
            success: false,
            message: 'Erro ao buscar opções para filtros',
            error: 'Service error',
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });

  describe('obterEstatisticas', () => {
    it('should return statistics', async () => {
      const result = { totalViagens: 10, viagensEditadas: 5, viagensNaoEditadas: 5, percentualEditado: 50, setoresUnicos: [], linhasUnicas: [], servicosUnicos: [], ultimaAtualizacao: new Date() };
      mockControleHorariosService.obterEstatisticasControleHorarios.mockResolvedValue(result);

      expect(await controller.obterEstatisticas('2023-01-01', 'test@example.com')).toEqual({
        success: true,
        message: 'Estatísticas obtidas com sucesso',
        data: result,
      });
      expect(service.obterEstatisticasControleHorarios).toHaveBeenCalledWith('2023-01-01');
    });

    it('should throw HttpException on service error', async () => {
      mockControleHorariosService.obterEstatisticasControleHorarios.mockRejectedValue(new Error('Service error'));

      await expect(controller.obterEstatisticas('2023-01-01', 'test@example.com')).rejects.toThrow(
        new HttpException(
          {
            success: false,
            message: 'Erro ao obter estatísticas',
            error: 'Service error',
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });

  describe('verificarStatusDados', () => {
    it('should return data status', async () => {
      const serviceResult = { totalViagens: 10, viagensEditadas: 5, percentualEditado: 50, ultimaAtualizacao: new Date() };
      const expectedResult = {
        success: true,
        message: 'Status dos dados obtido com sucesso',
        data: {
          existeViagensGlobus: true,
          totalViagensGlobus: 10,
          viagensEditadas: 5,
          percentualEditado: 50,
          ultimaAtualizacao: serviceResult.ultimaAtualizacao,
        },
        dataReferencia: '2023-01-01',
      };
      mockControleHorariosService.obterEstatisticasControleHorarios.mockResolvedValue(serviceResult);

      expect(await controller.verificarStatusDados('2023-01-01', 'test@example.com')).toEqual(expectedResult);
      expect(service.obterEstatisticasControleHorarios).toHaveBeenCalledWith('2023-01-01');
    });

    it('should throw HttpException on service error', async () => {
      mockControleHorariosService.obterEstatisticasControleHorarios.mockRejectedValue(new Error('Service error'));

      await expect(controller.verificarStatusDados('2023-01-01', 'test@example.com')).rejects.toThrow(
        new HttpException(
          {
            success: false,
            message: 'Erro ao verificar status dos dados',
            error: 'Service error',
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });

});
