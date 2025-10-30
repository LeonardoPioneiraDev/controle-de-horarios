// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginRequest } from '../types';
import { authService } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
}

// ✅ CORRIGIDO: Exportar o AuthContext
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
            
            setToken(storedToken);
            
            const response = await authService.getProfile();
            
            console.log('✅ AuthProvider: Token válido, usuário autenticado:', {
              userId: response.user.id,
              userEmail: response.user.email,
              userRole: response.user.role
            });
            
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            
          } catch (error) {
            console.log('❌ AuthProvider: Token inválido, limpando storage...', error);
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

  // ✅ CORRIGIDO: Função de login usando os campos corretos
  const login = async (credentials: LoginRequest) => {
    console.log('🔑 AuthProvider.login: Iniciando processo de login...', {
      email: credentials.email,
      hasPassword: !!credentials.password
    });
    
    try {
      setLoading(true);
      
      const response = await authService.login(credentials);
      
      console.log('📦 AuthProvider.login: Resposta do login recebida:', {
        hasAccessToken: !!response.access_token,  // ✅ CORRIGIDO: usar access_token
        hasRefreshToken: !!response.refresh_token,
        hasUser: !!response.user,
        userEmail: response.user?.email,
        tokenLength: response.access_token?.length || 0
      });

      // ✅ CORRIGIDO: Usar access_token do backend
      if (!response.access_token || !response.user) {
        console.error('❌ AuthProvider.login: Resposta inválida:', {
          hasAccessToken: !!response.access_token,
          hasUser: !!response.user,
          response: response
        });
        throw new Error('Token de acesso ou dados do usuário não encontrados na resposta do servidor');
      }

      // ✅ Salvar dados usando access_token
      setToken(response.access_token);
      setUser(response.user);
      localStorage.setItem('token', response.access_token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      // ✅ OPCIONAL: Salvar refresh_token também
      if (response.refresh_token) {
        localStorage.setItem('refresh_token', response.refresh_token);
      }
      
      console.log('✅ AuthProvider.login: Login realizado com sucesso!', {
        userId: response.user.id,
        userEmail: response.user.email,
        userRole: response.user.role,
        userName: `${response.user.firstName} ${response.user.lastName}`,
        tokenLength: response.access_token.length,
        tokenPrefix: response.access_token.substring(0, 20) + '...'
      });
      
    } catch (error) {
      console.error('❌ AuthProvider.login: Erro no login:', error);
      // Limpar dados em caso de erro
      setToken(null);
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('refresh_token');
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
        await authService.logout();
        console.log('✅ AuthProvider.logout: Logout no backend bem-sucedido');
      } catch (error) {
        console.log('⚠️ AuthProvider.logout: Erro no logout do backend (ignorado):', error);
      }
      
      // Sempre limpar dados locais
      setToken(null);
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('refresh_token');
      
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
    userName: user ? `${user.firstName} ${user.lastName}` : 'N/A',
    userRole: user?.role || 'N/A',
    tokenLength: token?.length || 0,
    isAuthenticated: !!user && !!token
  });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};