import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription, AlertIcon, AlertTitle } from '../components/ui/alert';
import logo from '../assets/logo.png';

export const Login: React.FC = () => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [redirecting, setRedirecting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !redirecting && !authLoading) {
      setRedirecting(true);
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate, redirecting, authLoading]);

  if (authLoading || redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-neutral-900 to-yellow-950 text-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4" />
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  if (user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(credentials);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Erro ao fazer login. Tente novamente.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-black via-neutral-900 to-yellow-950 text-gray-100">
      <div className="flex-1 flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="relative">
            <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-r from-yellow-400/30 via-amber-500/25 to-yellow-300/30 blur-md" />
            <Card className="relative border border-yellow-400/20 shadow-[0_0_40px_rgba(251,191,36,0.15)]">
              <CardHeader className="text-center">
                <div className="flex flex-col items-center mb-2">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-yellow-400/30 blur-xl" />
                    <img src={logo} alt="Viação Pioneira" className="relative mx-auto h-16 w-16 sm:h-20 sm:w-20 object-contain rounded-full ring-2 ring-yellow-400/40" />
                  </div>
                  <div className="mt-2 text-xs text-gray-300">Viação Pioneira Ltda</div>
                </div>
              
                <h1 className="text-2xl sm:text-3xl font-bold">Controle de Horários</h1>
                <p className="mt-1 text-sm text-gray-400">Ferramenta de gestão — faça login para continuar</p>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert className="mb-4">
                    <AlertIcon />
                    <div>
                      <AlertTitle>Não foi possível entrar</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </div>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="email">E-mail</Label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        name="email"
                        autoComplete="username"
                        required
                        placeholder="seu.email@vpioneira.com.br"
                        value={credentials.email}
                        onChange={handleChange}
                        disabled={loading}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="password">Senha</Label>
                    <div className="relative mt-1">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        autoComplete="current-password"
                        required
                        placeholder="Sua senha"
                        value={credentials.password}
                        onChange={handleChange}
                        disabled={loading}
                        className="pl-10 pr-10"
                      />
                      <button
                        type="button"
                        aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                        onClick={() => setShowPassword((v) => !v)}
                        disabled={loading}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <Link to="/reset-password" className="text-sm text-yellow-400 hover:text-yellow-300">
                      Esqueci minha senha
                    </Link>
                  </div>

                  <Button type="submit" disabled={loading} className="w-full" size="lg">
                    {loading ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900" />
                        Entrando...
                      </span>
                    ) : (
                      'Entrar'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 text-center text-xs text-gray-400">
            <p>
              Precisa de ajuda? Leia as{' '}
              <Link className="text-yellow-400 hover:text-yellow-300" to="/instrucoes">
                instruções de uso
              </Link>
              .
            </p>
          </div>
        </div>
      </div>

      <footer className="w-full py-4 text-center text-xs text-gray-400">© 2025 Viação Pioneira Ltda. Todos os direitos reservados.</footer>
    </div>
  );
};

