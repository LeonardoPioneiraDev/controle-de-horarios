export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  from: string;
  enabled: boolean;
  
  // Adicionados com base nos erros
  emailEnabled: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  workingConfigName: string;
  hasPassword: boolean;
  passwordLength: number;
  fromName: string;
  fromAddress: string;
  transporterConfigured: boolean;
  frontendUrl: string;
}

export interface EmailTestRequest {
  email: string;
  subject: string;
  text: string;
  name?: string; // Adicionado com base nos erros
}

export interface EmailTestResponse {
  success: boolean;
  message: string;
  accepted: string[];
  rejected: string[];
};