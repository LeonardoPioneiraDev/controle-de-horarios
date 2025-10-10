import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ApiService } from '../services/api';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Key } from 'lucide-react';

export const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validatingToken, setValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  
  const token = searchParams.get('token');

  // Validações de senha
  const passwordValidation = {
    minLength: formData.newPassword.length >= 8,
    hasUppercase: /[A-Z]/.test(formData.newPassword),
    hasLowercase: /[a-z]/.test(formData.newPassword),
    hasNumbers: /\d/.test(formData.newPassword),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(formData.newPassword),
    passwordsMatch: formData.newPassword === formData.confirmPassword && formData.confirmPassword.length > 0
  };

  const isPasswordValid = Object.values(passwordValidation).every(Boolean);

  // Verificar token na inicialização
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError('Token de redefinição não encontrado na URL');
        setValidatingToken(false);
        return;
      }

      try {
        setValidatingToken(true);
        
        // Aqui você pode implementar uma validação de token no backend
        // Por enquanto, vamos assumir que qualquer token é válido
        console.log('🔍 [RESET] Validando token:', token.substring(0, 8) + '...');
        
        // Simular validação (substitua por chamada real ao backend)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setTokenValid(true);
        console.log('✅ [RESET] Token válido');
        
      } catch (error) {
        console.error('❌ [RESET] Token inválido:', error);
        setError('Token inválido ou expirado');
        setTokenValid(false);
      } finally {
        setValidatingToken(false);
      }
    };

    validateToken();
  }, [token]);

  // Redirecionar se já estiver logado
  useEffect(() => {
    if (user && !token) {
      console.log('✅ [RESET] Usuário já logado, redirecionando...');
      navigate('/dashboard');
    }
  }, [user, token, navigate]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpar erro quando usuário começar a digitar
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isPasswordValid) {
      setError('Por favor, atenda a todos os requisitos de senha');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      console.log('🔑 [RESET] Redefinindo senha...');
      
      // Implementar chamada para o backend
      const response = await ApiService.resetPassword(token!, formData.newPassword);
      
      console.log('✅ [RESET] Senha redefinida com sucesso');
      
      setSuccess(true);
      
      // Redirecionar para login após 3 segundos
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: 'Senha redefinida com sucesso! Faça login com sua nova senha.' 
          }
        });
      }, 3000);
      
    } catch (error: any) {
      console.error('❌ [RESET] Erro ao redefinir senha:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Erro ao redefinir senha. Tente novamente.';
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Loading de validação do token
  if (validatingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Validando Token</h2>
            <p className="text-gray-600">Verificando a validade do seu link de redefinição...</p>
          </div>
        </div>
      </div>
    );
  }

  // Token inválido
  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Token Inválido</h2>
            <p className="text-gray-600 mb-6">
              {error || 'O link de redefinição de senha é inválido ou expirou.'}
            </p>
            <button
              onClick={() => navigate('/login')}
              className="btn btn-primary"
            >
              Voltar ao Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Sucesso
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-500 to-blue-600">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Senha Redefinida!</h2>
            <p className="text-gray-600 mb-6">
              Sua senha foi redefinida com sucesso. Você será redirecionado para a página de login.
            </p>
            <div className="animate-pulse text-sm text-gray-500">
              Redirecionando em alguns segundos...
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Formulário de redefinição
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 py-12 px-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto h-12 w-12 bg-blue-500 rounded-full flex items-center justify-center mb-4">
            <Key className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Definir Nova Senha</h2>
          <p className="text-sm text-gray-600 mt-2">
            Crie uma senha segura para sua conta
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <p className="ml-3 text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nova Senha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nova Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Digite sua nova senha"
                value={formData.newPassword}
                onChange={(e) => handleInputChange('newPassword', e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Confirmar Senha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirmar Nova Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Confirme sua nova senha"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Requisitos de Senha */}
          {formData.newPassword && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Requisitos da senha:</h4>
              <div className="space-y-2">
                <div className={`flex items-center text-xs ${passwordValidation.minLength ? 'text-green-600' : 'text-gray-500'}`}>
                  <CheckCircle className={`h-4 w-4 mr-2 ${passwordValidation.minLength ? 'text-green-500' : 'text-gray-300'}`} />
                  Pelo menos 8 caracteres
                </div>
                <div className={`flex items-center text-xs ${passwordValidation.hasUppercase ? 'text-green-600' : 'text-gray-500'}`}>
                  <CheckCircle className={`h-4 w-4 mr-2 ${passwordValidation.hasUppercase ? 'text-green-500' : 'text-gray-300'}`} />
                  Pelo menos uma letra maiúscula
                </div>
                <div className={`flex items-center text-xs ${passwordValidation.hasLowercase ? 'text-green-600' : 'text-gray-500'}`}>
                  <CheckCircle className={`h-4 w-4 mr-2 ${passwordValidation.hasLowercase ? 'text-green-500' : 'text-gray-300'}`} />
                  Pelo menos uma letra minúscula
                </div>
                <div className={`flex items-center text-xs ${passwordValidation.hasNumbers ? 'text-green-600' : 'text-gray-500'}`}>
                  <CheckCircle className={`h-4 w-4 mr-2 ${passwordValidation.hasNumbers ? 'text-green-500' : 'text-gray-300'}`} />
                  Pelo menos um número
                </div>
                <div className={`flex items-center text-xs ${passwordValidation.hasSpecialChar ? 'text-green-600' : 'text-gray-500'}`}>
                  <CheckCircle className={`h-4 w-4 mr-2 ${passwordValidation.hasSpecialChar ? 'text-green-500' : 'text-gray-300'}`} />
                  Pelo menos um caractere especial
                </div>
              </div>
            </div>
          )}

          {/* Confirmação de Senhas */}
          {formData.confirmPassword && (
            <div className={`flex items-center text-sm ${passwordValidation.passwordsMatch ? 'text-green-600' : 'text-red-600'}`}>
              <CheckCircle className={`h-4 w-4 mr-2 ${passwordValidation.passwordsMatch ? 'text-green-500' : 'text-red-500'}`} />
              {passwordValidation.passwordsMatch ? 'As senhas coincidem' : 'As senhas não coincidem'}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !isPasswordValid}
            className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Redefinindo Senha...
              </div>
            ) : (
              'Redefinir Senha'
            )}
          </button>
        </form>

        {/* Voltar ao Login */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/login')}
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors"
            disabled={loading}
          >
            Voltar ao Login
          </button>
        </div>
      </div>
    </div>
  );
};