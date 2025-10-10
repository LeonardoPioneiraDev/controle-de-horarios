import React, { useState, useEffect } from 'react';
import { ApiService } from '../services/api';
import { EmailConfig, EmailTestRequest } from '../types';
import { 
  Mail, 
  Settings, 
  CheckCircle, 
  XCircle, 
  Send, 
  RefreshCw,
  Server,
  User,
  Shield
} from 'lucide-react';

export const EmailSettings: React.FC = () => {
  const [config, setConfig] = useState<EmailConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    success: boolean;
    message: string;
    timestamp: string;
  } | null>(null);
  
  // Form para teste de e-mail
  const [testEmail, setTestEmail] = useState('');
  const [testName, setTestName] = useState('');
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    loadEmailConfig();
  }, []);

  const loadEmailConfig = async () => {
    try {
      setLoading(true);
      const emailConfig = await ApiService.getEmailConfig();
      setConfig(emailConfig);
    } catch (error) {
      console.error('Erro ao carregar configurações de e-mail:', error);
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    try {
      setTesting(true);
      const result = await ApiService.testEmailConnection();
      setConnectionStatus(result);
    } catch (error) {
      console.error('Erro ao testar conexão:', error);
      setConnectionStatus({
        success: false,
        message: 'Erro ao testar conexão',
        timestamp: new Date().toISOString()
      });
    } finally {
      setTesting(false);
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail || !testName) {
      alert('Preencha o e-mail e nome para o teste');
      return;
    }

    try {
      setSendingTest(true);
      const result = await ApiService.sendTestEmail({
        email: testEmail,
        name: testName
      });
      setTestResult(result);
    } catch (error) {
      console.error('Erro ao enviar e-mail de teste:', error);
      setTestResult({
        success: false,
        message: 'Erro ao enviar e-mail de teste'
      });
    } finally {
      setSendingTest(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="text-center py-12">
        <XCircle className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Erro ao carregar configurações</h3>
        <button
          onClick={loadEmailConfig}
          className="mt-4 btn btn-primary"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Mail className="h-8 w-8 mr-3 text-primary-500" />
            Configurações de E-mail
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Gerencie as configurações de e-mail do sistema
          </p>
        </div>
        <button
          onClick={loadEmailConfig}
          className="btn btn-secondary flex items-center"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {/* Status Geral */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Status do Sistema</h2>
          <div className={`flex items-center ${config.emailEnabled ? 'text-green-600' : 'text-yellow-600'}`}>
            {config.emailEnabled ? (
              <>
                <CheckCircle className="h-5 w-5 mr-2" />
                E-mail Habilitado
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 mr-2" />
                E-mail Desabilitado
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Server className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-sm font-medium text-gray-700">Servidor SMTP</span>
            </div>
            <p className="mt-1 text-sm text-gray-900">{config.smtpHost}:{config.smtpPort}</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center">
              <User className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-sm font-medium text-gray-700">Usuário SMTP</span>
            </div>
            <p className="mt-1 text-sm text-gray-900">{config.smtpUser}</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Shield className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-sm font-medium text-gray-700">Configuração Ativa</span>
            </div>
            <p className="mt-1 text-sm text-gray-900">{config.workingConfigName}</p>
          </div>
        </div>
      </div>

      {/* Teste de Conexão */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Teste de Conexão</h2>
          <button
            onClick={testConnection}
            className="btn btn-primary flex items-center"
            disabled={testing}
          >
            <Settings className={`h-4 w-4 mr-2 ${testing ? 'animate-spin' : ''}`} />
            {testing ? 'Testando...' : 'Testar Conexão'}
          </button>
        </div>

        {connectionStatus && (
          <div className={`p-4 rounded-lg ${connectionStatus.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center">
              {connectionStatus.success ? (
                <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
              ) : (
                <XCircle className="h-5 w-5 text-red-400 mr-2" />
              )}
              <span className={`font-medium ${connectionStatus.success ? 'text-green-800' : 'text-red-800'}`}>
                {connectionStatus.message}
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Testado em: {new Date(connectionStatus.timestamp).toLocaleString('pt-BR')}
            </p>
          </div>
        )}
      </div>

      {/* Teste de Envio */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Teste de Envio</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              E-mail de Destino
            </label>
            <input
              type="email"
              className="form-input"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="seu@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Destinatário
            </label>
            <input
              type="text"
              className="form-input"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              placeholder="Seu Nome"
            />
          </div>
        </div>

        <button
          onClick={sendTestEmail}
          className="btn btn-primary flex items-center"
          disabled={sendingTest || !testEmail || !testName}
        >
          <Send className={`h-4 w-4 mr-2 ${sendingTest ? 'animate-pulse' : ''}`} />
          {sendingTest ? 'Enviando...' : 'Enviar E-mail de Teste'}
        </button>

        {testResult && (
          <div className={`mt-4 p-4 rounded-lg ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center">
              {testResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
              ) : (
                <XCircle className="h-5 w-5 text-red-400 mr-2" />
              )}
              <span className={`font-medium ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
                {testResult.message}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Informações Detalhadas */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Configurações Detalhadas</h2>
        
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-sm font-medium text-gray-700">E-mail Habilitado:</span>
            <span className={`text-sm ${config.emailEnabled ? 'text-green-600' : 'text-red-600'}`}>
              {config.emailEnabled ? 'Sim' : 'Não'}
            </span>
          </div>
          
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-sm font-medium text-gray-700">Servidor SMTP:</span>
            <span className="text-sm text-gray-900">{config.smtpHost}</span>
          </div>
          
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-sm font-medium text-gray-700">Porta:</span>
            <span className="text-sm text-gray-900">{config.smtpPort}</span>
          </div>
          
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-sm font-medium text-gray-700">Usuário:</span>
            <span className="text-sm text-gray-900">{config.smtpUser}</span>
          </div>
          
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-sm font-medium text-gray-700">Senha Configurada:</span>
            <span className={`text-sm ${config.hasPassword ? 'text-green-600' : 'text-red-600'}`}>
              {config.hasPassword ? `Sim (${config.passwordLength} caracteres)` : 'Não'}
            </span>
          </div>
          
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-sm font-medium text-gray-700">Remetente:</span>
            <span className="text-sm text-gray-900">{config.fromName} &lt;{config.fromAddress}&gt;</span>
          </div>
          
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-sm font-medium text-gray-700">Transporter Configurado:</span>
            <span className={`text-sm ${config.transporterConfigured ? 'text-green-600' : 'text-red-600'}`}>
              {config.transporterConfigured ? 'Sim' : 'Não'}
            </span>
          </div>
          
          <div className="flex justify-between py-2">
            <span className="text-sm font-medium text-gray-700">URL do Frontend:</span>
            <span className="text-sm text-gray-900">{config.frontendUrl}</span>
          </div>
        </div>
      </div>
    </div>
  );
};