import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Lock, Mail, Eye, EyeOff, Sun, Moon } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Alert, AlertDescription, AlertIcon, AlertTitle } from '../../components/ui/alert';
import logo from '../../assets/logo.png';

export const Login: React.FC = () => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [redirecting, setRedirecting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login, user, loading: authLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !redirecting && !authLoading) {
      setRedirecting(true);
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate, redirecting, authLoading]);

  if (authLoading || redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fffdf5] via-[#fef0d4] to-[#feeccc] text-gray-900 dark:bg-gray-950 dark:text-gray-100 transition-colors duration-500">
        <div className="text-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-[#fbcc2c]/40 dark:bg-yellow-400/20 blur-xl animate-pulse" />
            <div className="relative animate-spin rounded-full h-14 w-14 border-4 border-transparent border-t-[#e6cd4a] dark:border-t-yellow-400 mx-auto mb-4" />
          </div>
          <p className="text-[#6b5d1a] dark:text-gray-100 font-medium text-lg">Carregando...</p>
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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#fffdf5] via-[#fef0d4] to-[#feeccc] dark:from-gray-950 dark:via-gray-900 dark:to-neutral-900 text-gray-900 dark:text-gray-100 transition-colors duration-500">
      <div className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="relative group">
            {/* Animated glow effect - usando paleta da empresa */}
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-[#fbcc2c]/45 via-[#e6cd4a]/40 to-[#ecd43c]/45 dark:from-yellow-500/20 dark:via-amber-500/15 dark:to-yellow-400/20 opacity-60 dark:opacity-40 blur-2xl group-hover:opacity-80 dark:group-hover:opacity-50 transition-opacity duration-500" />

            <Card className="relative border-2 border-white/20 dark:border-yellow-500/20 shadow-2xl shadow-yellow-600/10 dark:shadow-[0_8px_24px_-8px_rgba(251,191,36,0.15)] bg-white/80 dark:bg-gray-900/95 backdrop-blur-lg transition-all duration-500 rounded-3xl overflow-hidden">
              <CardHeader className="text-center pt-8 pb-6">
                <div className="flex flex-col items-center mb-4">
                  <div className="relative mb-4">
                    {/* Multi-layer glow effect - paleta da empresa */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#fbcc2c]/45 to-[#ecd43c]/35 dark:bg-yellow-400/30 blur-3xl animate-pulse" />
                    <div className="absolute inset-0 rounded-full bg-[#e6cd4a]/28 dark:bg-amber-400/15 blur-xl" />
                    <div className="relative p-1.5 rounded-full bg-gradient-to-br from-[#fbcc2c]/22 via-[#d4cc54]/18 to-[#ecd43c]/22 dark:from-yellow-400/10 dark:to-amber-400/10 shadow-inner">
                      <img
                        src={logo}
                        alt="Viação Pioneira"
                        className="relative mx-auto h-20 w-20 sm:h-24 sm:w-24 object-contain rounded-full ring-2 ring-white/50 ring-offset-2 ring-offset-white/80 dark:ring-yellow-400/40 dark:ring-offset-gray-900/50 shadow-lg"
                      />
                    </div>
                  </div>
                  <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold transition-colors duration-500">
                    Viação Pioneira Ltda
                  </div>
                </div>

                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-[#6b5d1a] via-[#7d6b1e] to-[#6b5d1a] dark:from-gray-100 dark:via-white dark:to-gray-100 bg-clip-text text-transparent mb-2">
                  Controle de Horários
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-500 font-medium">
                  Ferramenta de gestão — faça login para continuar
                </p>
              </CardHeader>

              {/* Theme Toggle Button - paleta da empresa */}
              <button
                onClick={toggleTheme}
                className="absolute top-5 right-5 p-3 rounded-full bg-gray-100/50 hover:bg-gray-100/80 dark:from-yellow-500/15 dark:to-amber-500/10 dark:hover:from-yellow-500/25 dark:hover:to-amber-500/15 border border-gray-200/50 dark:border-yellow-400/20 shadow-sm hover:shadow-md dark:shadow-sm dark:hover:shadow-md transition-all duration-500 group hover:scale-110"
                aria-label={`Alternar para tema ${theme === 'dark' ? 'claro' : 'escuro'}`}
                title={`Clique para alternar para tema ${theme === 'dark' ? 'claro' : 'escuro'}`}
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5 text-[#c7cd69] dark:text-yellow-300 group-hover:rotate-180 transition-transform duration-500" />
                ) : (
                  <Moon className="h-5 w-5 text-[#c7cd69] dark:text-yellow-300 group-hover:-rotate-[30deg] transition-transform duration-500" />
                )}
              </button>

              <CardContent className="px-8 pb-8">
                {error && (
                  <Alert className="mb-6 border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20">
                    <AlertIcon />
                    <div>
                      <AlertTitle className="text-red-800 dark:text-red-300">Não foi possível entrar</AlertTitle>
                      <AlertDescription className="text-red-700 dark:text-red-400">{error}</AlertDescription>
                    </div>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-700 dark:text-gray-300 font-medium">E-mail</Label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#fbcc2c] dark:group-focus-within:text-yellow-400 transition-colors duration-300" />
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
                        className="pl-11 h-12 border-gray-200 dark:border-gray-600 bg-gray-50/90 dark:bg-gray-800/50 focus:bg-white dark:focus:bg-gray-800 focus:border-[#fbcc2c] dark:focus:border-yellow-400 focus:ring-2 focus:ring-[#fbcc2c]/20 dark:focus:ring-yellow-400/20 transition-all duration-300"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-700 dark:text-gray-300 font-medium">Senha</Label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#fbcc2c] dark:group-focus-within:text-yellow-400 transition-colors duration-300" />
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
                        className="pl-11 pr-11 h-12 border-gray-200 dark:border-gray-600 bg-gray-50/90 dark:bg-gray-800/50 focus:bg-white dark:focus:bg-gray-800 focus:border-[#fbcc2c] dark:focus:border-yellow-400 focus:ring-2 focus:ring-[#fbcc2c]/20 dark:focus:ring-yellow-400/20 transition-all duration-300"
                      />
                      <button
                        type="button"
                        aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#fbcc2c] dark:text-gray-400 dark:hover:text-yellow-400 transition-all duration-300 hover:scale-110"
                        onClick={() => setShowPassword((v) => !v)}
                        disabled={loading}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <Link
                      to="/reset-password"
                      className="text-sm font-medium text-[#a89642] hover:text-[#c7cd69] dark:text-yellow-400 dark:hover:text-yellow-300 transition-colors duration-300 hover:underline underline-offset-2"
                    >
                      Esqueci minha senha
                    </Link>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-gradient-to-r from-[#fbcc2c] to-[#ecd43c] hover:from-[#e6cd4a] hover:to-[#d4cc54] dark:from-yellow-600 dark:to-amber-600 dark:hover:from-yellow-500 dark:hover:to-amber-500 text-gray-800 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                    size="lg"
                  >
                    {loading ? (
                      <span className="inline-flex items-center gap-3">
                        <span className="animate-spin rounded-full h-5 w-5 border-3 border-white/30 border-t-white" />
                        <span>Entrando...</span>
                      </span>
                    ) : (
                      'Entrar'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400 transition-colors duration-500">
            <p>
              Precisa de ajuda? Leia as{' '}
              <Link
                className="font-semibold text-[#a89642] hover:text-[#c7cd69] dark:text-yellow-400 dark:hover:text-yellow-300 transition-colors duration-300 hover:underline underline-offset-2"
                to="/instrucoes"
              >
                instruções de uso
              </Link>
              .
            </p>
          </div>
        </div>
      </div>

      <footer className="w-full py-6 text-center text-sm text-gray-500 dark:text-gray-500 transition-colors duration-500 font-medium">
        © 2025 Viação Pioneira Ltda. Todos os direitos reservados.
      </footer>
    </div>
  );
};
