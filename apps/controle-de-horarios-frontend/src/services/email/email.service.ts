import { BaseApiService } from '../shared/api.service';
import { EmailConfig, EmailTestRequest, EmailTestResponse } from '../../types';

export class EmailService extends BaseApiService {
  constructor() {
    super();
  }

  async getEmailConfig(): Promise<EmailConfig> {
    console.log('📧 Buscando configurações de e-mail...');
    const response = await this.api.get<EmailConfig>('/email/config');
    console.log('✅ Configurações de e-mail obtidas');
    return response.data;
  }

  async testEmailConnection(): Promise<{ success: boolean; message: string; timestamp: string }> {
    console.log('🔌 Testando conexão SMTP...');
    const response = await this.api.get('/email/test-connection');
    console.log('✅ Teste de conexão realizado');
    return response.data;
  }

  async sendTestEmail(data: EmailTestRequest): Promise<EmailTestResponse> {
    console.log(`📧 Enviando e-mail de teste para: ${data.email}...`);
    const response = await this.api.post<EmailTestResponse>('/email/test-send', data);
    console.log('✅ E-mail de teste enviado');
    return response.data;
  }
}

export const emailService = new EmailService();