import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginRequest } from '../types';
import { ApiService } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔄 AuthProvider: Iniciando verificação de autenticação...');
    
    const initAuth = async () => {
      try {
        // ✅ CORRIGIDO: Usar 'token' em vez de 'access_token'
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        console.log('🔍 AuthProvider: Verificando storage local...', {
          hasStoredToken: !!storedToken,
          hasStoredUser: !!storedUser,
          storedTokenLength: storedToken?.length || 0,
          storedUserData: storedUser ? 'presente' : 'ausente'
        });

        if (storedToken && storedUser) {
          try {
            console.log('🔑 AuthProvider: Token encontrado, validando com backend...');
            
            // Definir token temporariamente para o ApiService poder usar
            setToken(storedToken);
            
            // Verificar se o token ainda é válido
            const response = await ApiService.getProfile();
            
            console.log('✅ AuthProvider: Token válido, usuário autenticado:', {
              userId: response.user.id,
              userEmail: response.user.email,
              userRole: response.user.role
            });
            
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            
          } catch (error) {
            console.log('❌ AuthProvider: Token inválido, limpando storage...', error);
            // Token inválido, limpar storage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setToken(null);
            setUser(null);
          }
        } else {
          console.log('ℹ️ AuthProvider: Nenhum token encontrado no storage');
        }
      } catch (error) {
        console.error('❌ AuthProvider: Erro ao inicializar autenticação:', error);
      } finally {
        setLoading(false);
        console.log('✅ AuthProvider: Verificação de autenticação concluída');
      }
    };

    initAuth();
  }, []);

  // ✅ CORRIGIDO: Função de login que chama ApiService
  const login = async (credentials: LoginRequest) => {
    console.log('🔑 AuthProvider.login: Iniciando processo de login...', {
      email: credentials.email,
      hasPassword: !!credentials.password
    });
    
    try {
      setLoading(true);
      
      // Chamar ApiService para fazer login
      const response = await ApiService.login(credentials);
      
      console.log('📦 AuthProvider.login: Resposta do login recebida:', {
        hasAccessToken: !!response.access_token,
        hasUser: !!response.user,
        userEmail: response.user?.email
      });

      if (!response.access_token || !response.user) {
        throw new Error('Resposta de login inválida');
      }

      // ✅ CORRIGIDO: Salvar como 'token' (não 'access_token')
      setToken(response.access_token);
      setUser(response.user);
      localStorage.setItem('token', response.access_token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      console.log('✅ AuthProvider.login: Login realizado com sucesso!', {
        userId: response.user.id,
        userEmail: response.user.email,
        userRole: response.user.role
      });
      
    } catch (error) {
      console.error('❌ AuthProvider.login: Erro no login:', error);
      // Limpar dados em caso de erro
      setToken(null);
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    console.log('🚪 AuthProvider.logout: Iniciando processo de logout...');
    
    try {
      setLoading(true);
      
      try {
        await ApiService.logout();
        console.log('✅ AuthProvider.logout: Logout no backend bem-sucedido');
      } catch (error) {
        console.log('⚠️ AuthProvider.logout: Erro no logout do backend (ignorado):', error);
      }
      
      // Sempre limpar dados locais
      setToken(null);
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      console.log('✅ AuthProvider.logout: Dados locais limpos');
      
    } catch (error) {
      console.error('❌ AuthProvider.logout: Erro no logout:', error);
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    loading,
    isAuthenticated: !!user && !!token
  };

  // Debug log
  console.log('🔄 AuthProvider: Estado atual:', {
    hasUser: !!user,
    hasToken: !!token,
    loading,
    userEmail: user?.email || 'N/A',
    tokenLength: token?.length || 0,
    isAuthenticated: !!user && !!token
  });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};