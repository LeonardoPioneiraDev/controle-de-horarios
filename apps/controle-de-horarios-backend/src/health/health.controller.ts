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
  @ApiOperation({ summary: 'Verificar saúde da aplicação' })
  @ApiResponse({ status: 200, description: 'Aplicação funcionando' })
  async getHealth() {
    console.log(`🏥 [HEALTH_CONTROLLER] Health check solicitado`);
    
    try {
      await this.dataSource.query('SELECT 1');
      
      console.log(`✅ [HEALTH_CONTROLLER] Health check bem-sucedido`);
      
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: 'connected'
      };
    } catch (error) {
      console.log(`❌ [HEALTH_CONTROLLER] Health check falhou: ${error.message}`);
      
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error.message
      };
    }
  }

  @Get('health/database')
  @ApiOperation({ summary: 'Verificar saúde do banco de dados' })
  async getDatabaseHealth() {
    console.log(`🏥 [HEALTH_CONTROLLER] Database check solicitado`);
    
    try {
      await this.dataSource.query('SELECT NOW()');
      
      console.log(`✅ [HEALTH_CONTROLLER] Database check bem-sucedido`);
      
      return {
        status: 'ok',
        database: 'connected',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.log(`❌ [HEALTH_CONTROLLER] Database check falhou: ${error.message}`);
      
      return {
        status: 'error',
        database: 'disconnected',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  @Get('status')
  @ApiOperation({ summary: 'Status detalhado da aplicação' })
  async getStatus() {
    console.log(`📊 [HEALTH_CONTROLLER] Status check solicitado`);
    
    return {
      application: 'Controle de Horários',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    };
  }
}