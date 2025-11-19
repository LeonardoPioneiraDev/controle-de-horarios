import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { first } from 'rxjs';

// Utilitário para normalização de URL do frontend e construção de links
function normalizeFrontendBaseUrl(raw: string | undefined): string {
  let base = (raw || '').trim();
  //if (!base) return 'http://localhost:3005';  //Desenvolvimento
  //if (!base) return 'http://10.10.100.176:3000';  //Dcoker
  if (!base) return 'https://horarios.vpioneira.com.br';  //Produção
  if (!/^https?:\/\//i.test(base)) base = `http://${base.replace(/^\/+/, '')}`;
  return base.replace(/\/+$/, '');
}

function buildFrontendUrl(base: string, pathname: string, query: Record<string, string>): string {
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  try {
    const url = new URL(path, base);
    Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, v));
    return url.toString();
  } catch {
    const qs = new URLSearchParams(query).toString();
    return `${base}${path}${qs ? `?${qs}` : ''}`;
  }
}

interface SMTPConfig {
  name: string;
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  tls?: any;
  ignoreTLS?: boolean;
  requireTLS?: boolean;
  connectionTimeout?: number;
  greetingTimeout?: number;
  socketTimeout?: number;
}

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;
  private isConfigured = false;
  private workingConfig: SMTPConfig | null = null;

  constructor(private configService: ConfigService) {
    this.logger.log('📧 [EMAIL] EmailService constructor chamado');
  }

  async onModuleInit() {
    this.logger.log('🚀 [EMAIL] EmailService onModuleInit chamado');
    await this.tryInitializeTransporter();
  }

  private getPossibleSmtpConfigs(): SMTPConfig[] {
    const defaultHost = this.configService.get<string>('SMTP_HOST', 'mail.vpioneira.com.br');
    const defaultPort = parseInt(this.configService.get<string>('SMTP_PORT', '587'), 10);
    const defaultUser = this.configService.get<string>('SMTP_USER', 'suporte@vpioneira.com.br');
    const defaultPass = this.configService.get<string>('SMTP_PASS', '564139');

    const timeout = parseInt(this.configService.get<string>('EMAIL_TIMEOUT', '60000'), 10);

    return [
      {
        name: 'Padrão - Porta 587 (STARTTLS)',
        host: defaultHost,
        port: 587,
        secure: false,
        auth: { user: defaultUser, pass: defaultPass },
        requireTLS: true,
        tls: { rejectUnauthorized: false },
        connectionTimeout: timeout,
        greetingTimeout: timeout,
        socketTimeout: timeout,
      },
      {
        name: 'SSL/TLS - Porta 465',
        host: defaultHost,
        port: 465,
        secure: true,
        auth: { user: defaultUser, pass: defaultPass },
        tls: { rejectUnauthorized: false },
        connectionTimeout: timeout,
        greetingTimeout: timeout,
        socketTimeout: timeout,
      },
      {
        name: 'Porta 587 - Ignorar TLS',
        host: defaultHost,
        port: 587,
        secure: false,
        auth: { user: defaultUser, pass: defaultPass },
        ignoreTLS: true,
        connectionTimeout: timeout,
        greetingTimeout: timeout,
        socketTimeout: timeout,
      },
    ];
  }

  private async tryInitializeTransporter(): Promise<void> {
    const emailEnabled = this.configService.get<boolean>('EMAIL_ENABLED', false);
    if (!emailEnabled) {
      this.logger.warn('📧 E-mail desabilitado nas configurações.');
      this.isConfigured = false;
      return;
    }

    const configsToTry = this.getPossibleSmtpConfigs();
    this.isConfigured = false;
    this.transporter = null;
    this.workingConfig = null;

    for (const config of configsToTry) {
      const logConfig = { ...config, auth: { ...config.auth, pass: '[HIDDEN]' } };
      this.logger.log(`📧 [EMAIL] Tentando configuração: ${logConfig.name}`);
      
      try {
        const testTransporter = nodemailer.createTransport(config);
        await testTransporter.verify();

        this.transporter = testTransporter;
        this.isConfigured = true;
        this.workingConfig = config;
        this.logger.log(`✅ [EMAIL] Transporter configurado com sucesso: ${config.name}`);
        return;
      } catch (error: any) {
        this.logger.warn(`❌ [EMAIL] Falha com "${config.name}": ${error.message}`);
      }
    }

    this.logger.error('💥 [EMAIL] Todas as configurações SMTP falharam. Modo simulação ativado.');
    this.isConfigured = false;
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    const emailEnabled = this.configService.get<boolean>('EMAIL_ENABLED', false);
    if (!emailEnabled) {
      this.logger.warn(`📧 [EMAIL] E-mail desabilitado - Simulando envio para: ${options.to}`);
      this.logger.warn(`📧 [EMAIL] Assunto: ${options.subject}`);
      return false;
    }

    if (!this.isConfigured || !this.transporter) {
      this.logger.warn(`📧 [EMAIL] Transporter não configurado. Tentando re-inicializar...`);
      await this.tryInitializeTransporter();
      if (!this.isConfigured || !this.transporter) {
        this.logger.error(`❌ [EMAIL] Falha na re-inicialização. Simulando envio para: ${options.to}`);
        return false;
      }
    }

    const maxRetries = this.configService.get<number>('EMAIL_RETRY_ATTEMPTS', 3);
    const retryDelay = this.configService.get<number>('EMAIL_RETRY_DELAY', 2000);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const mailOptions = {
          from: {
            name: this.configService.get<string>('EMAIL_FROM_NAME', 'Controle de Horários'),
            address: this.configService.get<string>('EMAIL_FROM_ADDRESS', 'suporte@vpioneira.com.br'),
          },
          to: options.to,
          subject: options.subject,
          text: options.text,
          html: options.html,
        };

        this.logger.log(`📧 [EMAIL] Tentativa ${attempt}/${maxRetries} - Enviando para: ${options.to}`);
        const result = await this.transporter.sendMail(mailOptions);
        
        this.logger.log(`✅ [EMAIL] E-mail enviado com sucesso para ${options.to}. MessageId: ${result.messageId}`);
        return true;
        
      } catch (error: any) {
        this.logger.error(`❌ [EMAIL] Tentativa ${attempt}/${maxRetries} falhou para ${options.to}: ${error.message}`);
        
        if (attempt < maxRetries) {
          this.logger.log(`⏳ Aguardando ${retryDelay / 1000}s antes da próxima tentativa...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }

    this.logger.error(`❌ [EMAIL] Falha definitiva ao enviar e-mail para ${options.to} após ${maxRetries} tentativas.`);
    return false;
  }

  async sendWelcomeEmail(
    email: string,
    firstName: string,
    temporaryPassword: string,
    resetToken: string
  ): Promise<boolean> {
    const base = normalizeFrontendBaseUrl(this.configService.get<string>('FRONTEND_URL'));
    const resetUrl = buildFrontendUrl(base, '/first-login', { token: resetToken });
    
    const htmlContent = this.generateWelcomeEmailTemplate(firstName, temporaryPassword, resetUrl);
    const textContent = this.generateWelcomeTextContent(firstName, temporaryPassword, resetUrl);

    this.logger.log(`📧 [WELCOME] Enviando e-mail de boas-vindas para: ${email}`);

    return this.sendEmail({
      to: email,
      subject: this.configService.get<string>('EMAIL_WELCOME_SUBJECT', 'Bem-vindo ao Controle de Horários'),
      html: htmlContent,
      text: textContent,
    });
  }

  async testConnection(): Promise<boolean> {
    if (this.isConfigured && this.transporter) {
      try {
        await this.transporter.verify();
        this.logger.log('✅ [EMAIL] Conexão testada com sucesso');
        return true;
      } catch (error: any) {
        this.logger.error('❌ [EMAIL] Transporter falhou no teste:', error.message);
        await this.tryInitializeTransporter();
        return this.isConfigured;
      }
    } else {
      this.logger.warn('📧 [EMAIL] Transporter não configurado. Tentando inicializar...');
      await this.tryInitializeTransporter();
      return this.isConfigured;
    }
  }

  async getEmailConfig(): Promise<any> {
    return {
      emailEnabled: this.configService.get<boolean>('EMAIL_ENABLED'),
      smtpHost: this.configService.get<string>('SMTP_HOST'),
      smtpPort: this.configService.get<number>('SMTP_PORT'),
      smtpUser: this.configService.get<string>('SMTP_USER'),
      hasPassword: !!this.configService.get<string>('SMTP_PASS'),
      passwordLength: this.configService.get<string>('SMTP_PASS')?.length || 0,
      fromAddress: this.configService.get<string>('EMAIL_FROM_ADDRESS'),
      fromName: this.configService.get<string>('EMAIL_FROM_NAME'),
      frontendUrl: this.configService.get<string>('FRONTEND_URL'),
      transporterConfigured: this.isConfigured,
      workingConfigName: this.workingConfig?.name || 'N/A',
    };
  }

  private generateWelcomeEmailTemplate(
    firstName: string,
    temporaryPassword: string,
    resetUrl: string
  ): string {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bem-vindo ao Controle de Horários</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); border-top: 5px solid #3b82f6; }
        .header { background: #1e293b; color: white; padding: 20px; text-align: center; }
        .header h1 { font-size: 24px; margin: 0; }
        .content { padding: 40px 30px; }
        .content h2 { color: #1e293b; margin-bottom: 15px; }
        .content p { margin-bottom: 15px; }
        .credentials-box { background-color: #f1f5f9; border-left: 4px solid #3b82f6; padding: 20px; margin: 25px 0; }
        .credential-label { font-size: 14px; color: #64748b; }
        .credential-value { font-family: 'Courier New', monospace; font-size: 18px; font-weight: 600; color: #1e3a8a; }
        .cta-button { display: inline-block; background-color: #3b82f6; color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 10px 0; }
        .footer { background-color: #f1f5f9; color: #64748b; padding: 25px; text-align: center; font-size: 12px; }
        .warning-box { background: #fffbeb; border: 1px solid #fde68a; padding: 15px; border-radius: 5px; margin: 20px 0; color: #92400e; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Controle de Horários</h1>
        </div>
        <div class="content">
            <h2>Olá, ${firstName}! ✨</h2>
            <p>Sua conta no <strong>Sistema de Controle de Horários</strong> da Viação Pioneira foi criada com sucesso!</p>
            
            <div class="credentials-box">
                <p class="credential-label">Sua senha temporária é:</p>
                <p class="credential-value">${temporaryPassword}</p>
            </div>
            
            <p>Para sua segurança, você deve definir uma nova senha no seu primeiro acesso. Clique no botão abaixo para começar:</p>

            <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" class="cta-button">🚀 Definir Nova Senha</a>
            </div>
            
            <div class="warning-box">
                <p style="margin: 0;">
                    <strong>Atenção:</strong> O link para definir a nova senha e a senha temporária expiram em 24 horas.
                </p>
            </div>
        </div>
        <div class="footer">
            <p><strong>Controle de Horários</strong> - Viação Pioneira Ltda</p>
            <p>Este é um e-mail automático, por favor, não responda.</p>
        </div>
    </div>
</body>
</html>
  `;
  }

  private generateWelcomeTextContent(
    firstName: string,
    temporaryPassword: string,
    resetUrl: string
  ): string {
    return `
Bem-vindo ao Controle de Horários - Viação Pioneira

Olá, ${firstName}!

Sua senha temporária: ${temporaryPassword}

Link para definir nova senha: ${resetUrl}

IMPORTANTE: Esta senha temporária expira em 24 horas.

Controle de Horários - Viação Pioneira Ltda
Suporte: suporte@vpioneira.com.br
    `;
  }

  async sendPasswordResetEmail(
    email: string,
    firstName: string,
    resetToken: string
  ): Promise<boolean> {
    const base = normalizeFrontendBaseUrl(this.configService.get<string>('FRONTEND_URL'));
    const confirmUrl = buildFrontendUrl(base, '/reset-password/confirm', { token: resetToken });
    const subject = this.configService.get<string>('EMAIL_RESET_SUBJECT', 'Redefinição de senha');
    const html = this.generatePasswordResetEmailTemplate(firstName, confirmUrl);
    const text = `Olá, ${firstName}!\n\nPara redefinir sua senha, acesse: ${confirmUrl}\n\nSe você não fez esta solicitação, ignore este e-mail.`;

    this.logger.log(`📩 [RESET] Enviando e-mail de reset para: ${email}`);
    return this.sendEmail({ to: email, subject, html, text });
  }

  private generatePasswordResetEmailTemplate(firstName: string, confirmUrl: string): string {
    return `
  <!DOCTYPE html>
  <html lang="pt-BR">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Redefinição de Senha</title>
      <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); border-top: 5px solid #FBBF24; }
          .header { background: #1e293b; color: white; padding: 20px; text-align: center; }
          .header h1 { font-size: 24px; margin: 0; }
          .content { padding: 40px 30px; }
          .content h2 { color: #1e293b; margin-bottom: 15px; }
          .content p { margin-bottom: 15px; }
          .cta-button { display: inline-block; background-color: #FBBF24; color: #1e293b; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 10px 0; }
          .link-fallback { font-size: 12px; color: #64748b; word-break: break-all; }
          .footer { background-color: #f1f5f9; color: #64748b; padding: 25px; text-align: center; font-size: 12px; }
          .warning-text { font-size: 14px; color: #64748b; }
      </style>
  </head>
  <body>
      <div class="container">
          <div class="header">
              <h1>Controle de Horários</h1>
          </div>
          <div class="content">
              <h2>Olá, ${firstName}!</h2>
              <p>Recebemos uma solicitação para redefinir a senha da sua conta. Se foi você, clique no botão abaixo para continuar.</p>
              <div style="text-align: center; margin: 30px 0;">
                  <a href="${confirmUrl}" class="cta-button">Redefinir Senha</a>
              </div>
              <p class="warning-text">Se você não solicitou a redefinição de senha, por favor, ignore este e-mail. Sua conta continua segura.</p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
              <p class="link-fallback">Se o botão não funcionar, copie e cole o seguinte link no seu navegador:<br>${confirmUrl}</p>
          </div>
          <div class="footer">
              <p><strong>Controle de Horários</strong> - Viação Pioneira Ltda</p>
              <p>Este é um e-mail automático, por favor, não responda.</p>
          </div>
      </div>
  </body>
  </html>
    `;
  }
}
