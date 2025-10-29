import { BaseApiService } from '../shared/api.service';

export class HealthService extends BaseApiService {
  constructor() {
    super();
  }

  async checkHealth(): Promise<{ status: string; timestamp: string; database: string }> {
    console.log('🏥 Verificando saúde do backend...');
    const response = await this.api.get('/health');
    console.log('✅ Health check realizado');
    return response.data;
  }

  async checkDatabaseHealth(): Promise<{ status: string; database: string; timestamp: string }> {
    console.log('💾 Verificando saúde do banco de dados...');
    const response = await this.api.get('/health/database');
    console.log('✅ Database health check realizado');
    return response.data;
  }

  async getStatus(): Promise<{ application: string; version: string; environment: string; timestamp: string }> {
    console.log('📊 Buscando status da aplicação...');
    const response = await this.api.get('/status');
    console.log('✅ Status obtido');
    return response.data;
  }

  async testConnectivity(): Promise<void> {
    console.log('🧪 Executando teste de conectividade inicial...');
    
    try {
      await this.checkHealth();
      console.log('✅ Conectividade com backend confirmada');
    } catch (error) {
      console.error('❌ Falha na conectividade com backend:', error);
      console.log('💡 Possíveis soluções:');
      console.log('   1. Verificar se o backend está rodando em http://localhost:3335');
      console.log('   2. Verificar configurações de CORS no backend');
      console.log('   3. Verificar se não há firewall bloqueando a conexão');
    }
  }
}

export const healthService = new HealthService();