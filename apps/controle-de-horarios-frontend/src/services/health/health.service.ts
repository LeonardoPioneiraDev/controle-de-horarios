import { BaseApiService } from '../shared/api.service';

export class HealthService extends BaseApiService {
  constructor() {
    super();
  }

  async checkHealth(): Promise<{ status: string; timestamp: string; database: string }> {
    console.log('ðŸ¥ Verificando saÃºde do backend...');
    const response = await this.api.get('/health');
    console.log('âœ… Health check realizado');
    return response.data;
  }

  async checkDatabaseHealth(): Promise<{ status: string; database: string; timestamp: string }> {
    console.log('ðŸ’¾ Verificando saÃºde do banco de dados...');
    const response = await this.api.get('/health/database');
    console.log('âœ… Database health check realizado');
    return response.data;
  }

  async getStatus(): Promise<{ application: string; version: string; environment: string; timestamp: string }> {
    console.log('ðŸ“Š Buscando status da aplicaÃ§Ã£o...');
    const response = await this.api.get('/status');
    console.log('âœ… Status obtido');
    return response.data;
  }

  async testConnectivity(): Promise<void> {
    console.log('ðŸ§ª Executando teste de conectividade inicial...');
    
    try {
      await this.checkHealth();
      console.log('âœ… Conectividade com backend confirmada');
    } catch (error) {
      console.error('âŒ Falha na conectividade com backend:', error);
      console.log('ðŸ’¡ PossÃ­veis soluÃ§Ãµes:');
      console.log(`   1. Verificar se o backend está rodando em ${this.baseURL}`);
      console.log('   2. Verificar configuraÃ§Ãµes de CORS no backend');
      console.log('   3. Verificar se nÃ£o hÃ¡ firewall bloqueando a conexÃ£o');
    }
  }
}

export const healthService = new HealthService();
