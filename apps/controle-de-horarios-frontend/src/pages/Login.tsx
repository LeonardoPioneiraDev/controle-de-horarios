import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authService, healthService } from '../services/api';
import { Lock, Mail, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [redirecting, setRedirecting] = useState(false);

  const { login, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Evitar loop infinito - só redirecionar uma vez
  useEffect(() => {
    if (user && !redirecting && !authLoading) {
      console.log('✅ Usuário já logado, redirecionando...');
      setRedirecting(true);
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate, redirecting, authLoading]);

  // Se está carregando ou redirecionando, mostrar loading
  if (authLoading || redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  // Se já está logado, não renderizar nada (evita flash)
  if (user) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log('🔄 [LOGIN] Tentando login com:', {
      email: credentials.email,
      hasPassword: !!credentials.password
    });

    try {
      // ✅ CORRIGIDO: Chamar login do AuthContext com credentials
      await login(credentials);
      
      console.log('✅ [LOGIN] Login bem-sucedido, redirecionando...');
      
      // O useEffect vai redirecionar automaticamente
      
    } catch (err: any) {
      console.error('❌ [LOGIN] Erro no login:', err);
      
      const errorMessage = err.response?.data?.message || 
                          err.message || 
                          'Erro ao fazer login. Tente novamente.';
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
    
    // Limpar erro quando usuário começar a digitar
    if (error) {
      setError('');
    }
  };

  const fillTestCredentials = () => {
    setCredentials({
      email: 'leonardolopes@vpioneira.com.br',
      password: 'lion123'
    });
    setError('');
  };

  const testConnection = async () => {
    try {
      console.log('🧪 [LOGIN] Testando conexão...');
      await healthService.checkHealth();
      alert('✅ Backend conectado!');
    } catch (error) {
      console.error('❌ [LOGIN] Erro de conexão:', error);
      alert('❌ Backend não está respondendo!');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto h-12 w-12 bg-blue-500 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Controle de Horários</h2>
            <p className="text-sm text-gray-600 mt-2">Faça login para acessar o sistema</p>
          </div>

          {/* Test Button */}
          <button
            type="button"
            onClick={testConnection}
            className="w-full mb-4 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
            disabled={loading}
          >
            🧪 Testar Backend
          </button>

          {/* Error */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <p className="ml-3 text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="seu.email@vpioneira.com.br"
                  value={credentials.email}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  name="password"
                  required
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Sua senha"
                  value={credentials.password}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Entrando...
                </div>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          {/* Test Credentials */}
          <div className="mt-6 p-4 bg-gray-50 rounded-md">
            <p className="text-sm font-medium text-gray-700 mb-2">Credenciais de teste:</p>
            <div className="space-y-1">
              <p className="text-xs text-gray-600 font-mono">leonardolopes@vpioneira.com.br</p>
              <p className="text-xs text-gray-600 font-mono">lion123</p>
            </div>
            <button
              type="button"
              onClick={fillTestCredentials}
              className="mt-2 text-xs text-blue-600 hover:text-blue-800 hover:underline transition-colors"
              disabled={loading}
            >
              Preencher automaticamente
            </button>
          </div>

          {/* Debug Info */}
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-xs text-yellow-800">
              <strong>Debug:</strong> AuthLoading: {authLoading ? 'true' : 'false'}, 
              HasUser: {user ? 'true' : 'false'}, 
              Redirecting: {redirecting ? 'true' : 'false'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};