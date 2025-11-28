import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authService } from '../services/auth/auth.service';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

const AutoLogin: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const { login } = useAuth();
    const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading');

    useEffect(() => {
        const performAutoLogin = async () => {
            if (!token) {
                setStatus('error');
                toast.error('Token de autologin não fornecido');
                navigate('/login');
                return;
            }

            try {
                console.log('🔐 Iniciando processo de autologin...');
                const response = await authService.autoLogin(token);

                // Usar o método login do contexto para salvar estado e redirecionar
                // O método login do contexto geralmente espera (email, password) ou (userData, tokens)
                // Precisamos verificar como o AuthContext lida com login direto com dados já obtidos
                // Se o AuthContext.login apenas chama o serviço, precisamos de um método para "setar" o usuário logado
                // Ou chamamos o login com os dados retornados se o contexto suportar

                // Assumindo que o AuthContext tem um método para definir sessão ou que podemos salvar no localStorage e recarregar
                // Vamos salvar no localStorage manualmente como fallback e tentar usar o contexto

                localStorage.setItem('token', response.access_token);
                if (response.refresh_token) localStorage.setItem('refresh_token', response.refresh_token);
                localStorage.setItem('user', JSON.stringify(response.user));

                // Forçar atualização do contexto ou recarregar a página
                // O ideal seria ter um método `setSession` no AuthContext, mas vamos recarregar para garantir
                // ou usar window.location.href = '/'

                toast.success(`Bem-vindo de volta, ${response.user.firstName}!`);
                setStatus('success');

                // Pequeno delay para garantir que o storage foi atualizado
                setTimeout(() => {
                    window.location.href = '/';
                }, 500);

            } catch (error) {
                console.error('❌ Erro no autologin:', error);
                setStatus('error');
                toast.error('Falha no autologin. O link pode ter expirado.');

                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            }
        };

        performAutoLogin();
    }, [token, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg text-center">
                {status === 'loading' && (
                    <>
                        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-yellow-400 mx-auto"></div>
                        <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
                            Autenticando...
                        </h2>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">
                            Aguarde enquanto acessamos sua conta.
                        </p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900">
                            <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
                            Sucesso!
                        </h2>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">
                            Redirecionando para o painel...
                        </p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900">
                            <svg className="h-8 w-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
                            Erro na Autenticação
                        </h2>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">
                            Não foi possível realizar o login automático.
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                            Você será redirecionado para a tela de login.
                        </p>
                    </>
                )}
            </div>
        </div>
    );
};

export default AutoLogin;
