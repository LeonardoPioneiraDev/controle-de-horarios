import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {}

  async sendWelcomeEmail(
    email: string,
    firstName: string,
    tempPassword: string,
    resetToken: string
  ): Promise<boolean> {
    const emailEnabled = this.configService.get('EMAIL_ENABLED') === 'true';
    
    if (!emailEnabled) {
      console.log(`📧 [EMAIL] E-mail desabilitado - Simulando envio para: ${email}`);
      console.log(`📧 [EMAIL] Dados que seriam enviados:`);
      console.log(`   👤 Nome: ${firstName}`);
      console.log(`   🔑 Senha Temporária: ${tempPassword}`);
      console.log(`   🔗 Token de Reset: ${resetToken}`);
      console.log(`   🌐 Link: ${this.configService.get('FRONTEND_URL')}/reset-password?token=${resetToken}`);
      return true;
    }

    try {
      // Aqui você pode implementar o envio real de e-mail quando necessário
      console.log(`📧 [EMAIL] Enviando e-mail de boas-vindas para: ${email}`);
      console.log(`   👤 Nome: ${firstName}`);
      console.log(`   🔑 Senha Temporária: ${tempPassword}`);
      console.log(`   🔗 Link: ${this.configService.get('FRONTEND_URL')}/reset-password?token=${resetToken}`);
      
      // Simular sucesso
      return true;
    } catch (error) {
      console.error(`❌ [EMAIL] Erro ao enviar e-mail para: ${email}`, error);
      return false;
    }
  }

  async sendPasswordResetEmail(
    email: string,
    firstName: string,
    resetToken: string
  ): Promise<boolean> {
    const emailEnabled = this.configService.get('EMAIL_ENABLED') === 'true';
    
    if (!emailEnabled) {
      console.log(`📧 [EMAIL] E-mail desabilitado - Simulando reset para: ${email}`);
      console.log(`   🔗 Link: ${this.configService.get('FRONTEND_URL')}/reset-password?token=${resetToken}`);
      return true;
    }

    try {
      console.log(`📧 [EMAIL] Enviando e-mail de reset para: ${email}`);
      console.log(`   🔗 Link: ${this.configService.get('FRONTEND_URL')}/reset-password?token=${resetToken}`);
      
      return true;
    } catch (error) {
      console.error(`❌ [EMAIL] Erro ao enviar e-mail de reset para: ${email}`, error);
      return false;
    }
  }
}