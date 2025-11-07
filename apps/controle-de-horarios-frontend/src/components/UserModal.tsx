import React, { useState, useEffect } from 'react';
import { User, CreateUserRequest, UpdateUserRequest, EmailConfig } from '../types';
import { UserRole, UserStatus } from '../types/user.types';
import { usersService, emailService } from '../services/api';
import { X, Mail, AlertCircle, CheckCircle, XCircle, Settings, Loader } from 'lucide-react';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: CreateUserRequest | UpdateUserRequest) => Promise<void>;
  user?: User | null;
  loading?: boolean;
}

export const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  onSave,
  user,
  loading = false
}) => {
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: UserRole.FUNCIONARIO,
    status: UserStatus.PENDING
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [emailInfo, setEmailInfo] = useState<{
    willSendEmail: boolean;
    emailEnabled: boolean;
    isLoading: boolean;
    error: string | null;
    config: EmailConfig | null;
  }>({
    willSendEmail: false,
    emailEnabled: false,
    isLoading: false,
    error: null,
    config: null
  });

  // Reset form quando modal abre/fecha ou usuário muda
  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status
      });
    } else {
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        role: UserRole.FUNCIONARIO,
        status: UserStatus.PENDING
      });
    }
    setErrors({});
  }, [user, isOpen]);

  // Verificar configurações de e-mail quando modal abre para criação
  useEffect(() => {
    const checkEmailConfig = async () => {
      if (!isOpen || user) return; // Só verifica para criação de novos usuários

      setEmailInfo(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        const config = await emailService.getEmailConfig();
        
        setEmailInfo({
          willSendEmail: config.emailEnabled && config.transporterConfigured,
          emailEnabled: config.emailEnabled,
          isLoading: false,
          error: null,
          config
        });
      } catch (error) {
        console.error('Erro ao verificar configurações de e-mail:', error);
        setEmailInfo(prev => ({
          ...prev,
          isLoading: false,
          error: 'Erro ao verificar configurações de e-mail'
        }));
      }
    };

    checkEmailConfig();
  }, [isOpen, user]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validação de e-mail
    if (!formData.email.trim()) {
      newErrors.email = 'E-mail é obrigatório';
    } else if (!formData.email.includes('@')) {
      newErrors.email = 'E-mail inválido';
    } else if (!formData.email.endsWith('@vpioneira.com.br')) {
      newErrors.email = 'E-mail deve ser do domínio @vpioneira.com.br';
    }

    // Validação de nome
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Nome é obrigatório';
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'Nome deve ter pelo menos 2 caracteres';
    }

    // Validação de sobrenome
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Sobrenome é obrigatório';
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Sobrenome deve ter pelo menos 2 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      if (user) {
        // Edição - apenas campos editáveis
        const updateData: UpdateUserRequest = {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          role: formData.role,
          status: formData.status
        };
        await onSave(updateData);
      } else {
        // Criação - sem senha
        const createData: CreateUserRequest = {
          email: formData.email.trim().toLowerCase(),
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          role: formData.role
        };
        await onSave(createData);
      }
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      // O erro será tratado pelo componente pai
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpar erro do campo quando usuário começa a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const renderEmailStatusInfo = () => {
    if (user) return null; // Só mostra para criação de novos usuários

    if (emailInfo.isLoading) {
      return (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
          <div className="flex items-center">
            <Loader className="h-5 w-5 text-gray-400 animate-spin" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-800">
                Verificando Configurações de E-mail...
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                Aguarde enquanto verificamos o status do sistema de e-mail.
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (emailInfo.error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <XCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Erro nas Configurações de E-mail
              </h3>
              <p className="mt-1 text-sm text-red-700">
                {emailInfo.error}. A senha temporária aparecerá nos logs do servidor.
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (emailInfo.willSendEmail) {
      return (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                E-mail Será Enviado
              </h3>
              <p className="mt-1 text-sm text-green-700">
                Uma senha temporária será gerada automaticamente e enviada por e-mail para o usuário.
              </p>
              {emailInfo.config && (
                <div className="mt-2 text-xs text-green-600">
                  <p>📧 Servidor: {emailInfo.config.smtpHost}:{emailInfo.config.smtpPort}</p>
                  <p>📤 Remetente: {emailInfo.config.fromAddress}</p>
                  <p>⚙️ Configuração: {emailInfo.config.workingConfigName}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (emailInfo.emailEnabled && !emailInfo.willSendEmail) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                E-mail Habilitado mas com Problemas
              </h3>
              <p className="mt-1 text-sm text-yellow-700">
                O sistema de e-mail está habilitado, mas há problemas de configuração. A senha temporária aparecerá nos logs do servidor.
              </p>
              {emailInfo.config && (
                <div className="mt-2 text-xs text-yellow-600">
                  <p>🔧 Transporter configurado: {emailInfo.config.transporterConfigured ? 'Sim' : 'Não'}</p>
                  <p>�� Servidor: {emailInfo.config.smtpHost}:{emailInfo.config.smtpPort}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // E-mail desabilitado
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex">
          <Mail className="h-5 w-5 text-blue-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              E-mail Desabilitado
            </h3>
            <p className="mt-1 text-sm text-blue-700">
              O sistema de e-mail está desabilitado. A senha temporária será exibida nos logs do servidor após a criação do usuário.
            </p>
            <div className="mt-2 text-xs text-blue-600">
              <p>💡 Para habilitar o e-mail, configure EMAIL_ENABLED=true no arquivo .env do backend</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <h2 className="text-xl font-semibold text-gray-900">
            {user ? 'Editar Usuário' : 'Novo Usuário'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* E-mail */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              E-mail *
            </label>
            <input
              type="email"
              className={`form-input ${errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              disabled={!!user || loading} // E-mail não pode ser editado
              placeholder="usuario@vpioneira.com.br"
              autoComplete="email"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.email}
              </p>
            )}
            {user && (
              <p className="mt-1 text-xs text-gray-500">
                O e-mail não pode ser alterado após a criação do usuário
              </p>
            )}
          </div>

          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome *
            </label>
            <input
              type="text"
              className={`form-input ${errors.firstName ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              disabled={loading}
              placeholder="Nome"
              autoComplete="given-name"
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.firstName}
              </p>
            )}
          </div>

          {/* Sobrenome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sobrenome *
            </label>
            <input
              type="text"
              className={`form-input ${errors.lastName ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              disabled={loading}
              placeholder="Sobrenome"
              autoComplete="family-name"
            />
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.lastName}
              </p>
            )}
          </div>

          {/* Função */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Função *
            </label>
            <select
              className="form-select"
              value={formData.role}
              onChange={(e) => handleInputChange('role', e.target.value)}
              disabled={loading}
            >
              <option value={UserRole.FUNCIONARIO}>Funcionário</option>
              <option value={UserRole.OPERADOR}>Operador</option>
              <option value={UserRole.ENCARREGADO}>Encarregado</option>
              <option value={UserRole.ANALISTA}>Analista</option>
              <option value={UserRole.GERENTE}>Gerente</option>
              <option value={UserRole.DIRETOR}>Diretor</option>
              <option value={UserRole.ADMINISTRADOR}>Administrador</option>
            </select>
          </div>

          {/* Status (apenas na edição) */}
          {user && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                className="form-select"
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                disabled={loading}
              >
                <option value={UserStatus.PENDING}>Pendente</option>
                <option value={UserStatus.ACTIVE}>Ativo</option>
                <option value={UserStatus.INACTIVE}>Inativo</option>
                <option value={UserStatus.BLOCKED}>Bloqueado</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Status atual do usuário no sistema
              </p>
            </div>
          )}

          {/* Informações sobre E-mail */}
          {renderEmailStatusInfo()}

          {/* Informações Adicionais para Criação */}
          {!user && (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
              <div className="flex">
                <Settings className="h-5 w-5 text-gray-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-800">
                    Informações Importantes
                  </h3>
                  <ul className="mt-1 text-sm text-gray-600 space-y-1">
                    <li>• O usuário será criado com status "Pendente"</li>
                    <li>• Uma senha temporária será gerada automaticamente</li>
                    <li>• O usuário precisará definir uma nova senha no primeiro acesso</li>
                    <li>• A senha temporária expira em 24 horas</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Botões */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {user ? 'Atualizando...' : 'Criando...'}
                </div>
              ) : (
                user ? 'Atualizar Usuário' : 'Criar Usuário'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
