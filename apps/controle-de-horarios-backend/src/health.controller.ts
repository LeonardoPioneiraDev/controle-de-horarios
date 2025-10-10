import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@ApiTags('Health')
@Controller()
export class HealthController {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check básico' })
  @ApiResponse({ status: 200, description: 'Sistema funcionando' })
  async health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'controle-de-horarios-backend',
      version: '1.0.0',
    };
  }

  @Get('health/database')
  @ApiOperation({ summary: 'Health check do banco de dados' })
  @ApiResponse({ status: 200, description: 'Banco funcionando' })
  async healthDatabase() {
    try {
      // Testar conexão com o banco
      await this.dataSource.query('SELECT 1');
      
      return {
        status: 'ok',
        database: 'connected',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'error',
        database: 'disconnected',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('status')
  @ApiOperation({ summary: 'Status detalhado do sistema' })
  @ApiResponse({ status: 200, description: 'Status completo' })
  async status() {
    try {
      // Testar banco
      await this.dataSource.query('SELECT 1');
      
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'controle-de-horarios-backend',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        database: {
          status: 'connected',
          type: 'postgresql',
        },
        features: {
          auth: process.env.AUTH_ENABLED === 'true',
          email: process.env.EMAIL_ENABLED === 'true',
          swagger: process.env.SWAGGER_ENABLED === 'true',
        },
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        service: 'controle-de-horarios-backend',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        database: {
          status: 'disconnected',
          error: error.message,
        },
      };
    }
  }
}