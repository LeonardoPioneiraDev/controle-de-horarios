import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { Mail, Send, ArrowLeft, Sun, Moon, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Alert, AlertDescription, AlertIcon, AlertTitle } from '../../components/ui/alert';
import { authService } from '../../services/api';
import logo from '../../assets/logo.png';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';

function isHttpError(error: unknown): error is { response?: { status?: number; data?: { message?: string } } } {
  return typeof error === 'object' && error !== null && 'response' in (error as any);
}

export const ResetPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalDescription, setModalDescription] = useState<React.ReactNode>('');
  const [modalVariant, setModalVariant] = useState<'info' | 'danger' | 'warning'>('info');

  const { theme, toggleTheme } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await authService.forgotPassword(email);
      const msg = 'Se o e-mail estiver cadastrado, enviaremos instruções para redefinir sua senha.';
      setSuccess(msg);
      setModalTitle('Solicitação enviada');
      setModalDescription(msg);
      setModalVariant('info');
      setModalOpen(true);
    } catch (err: unknown) {
      if (isHttpError(err) && err.response?.status === 404) {
        const msg = 'E-mail não cadastrado. Verifique e tente novamente.';
        setError(msg);
        setModalTitle('Não foi possível enviar');
        setModalDescription(msg);
        setModalVariant('danger');
        setModalOpen(true);
      } else {
        const message = isHttpError(err) ? (err.response?.data?.message || 'Erro ao solicitar recuperação. Tente novamente.') : 'Erro ao solicitar recuperação. Tente novamente.';
        setError(message);
        setModalTitle('Não foi possível enviar');
        setModalDescription(message);
        setModalVariant('danger');
        setModalOpen(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#fffdf5] via-[#fef0d4] to-[#feeccc] text-gray-900 dark:from-gray-950 dark:via-gray-900 dark:to-neutral-900 dark:text-gray-100 transition-colors duration-500">
      <div className="flex-1 flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="relative group">
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-[#fbcc2c]/45 via-[#e6cd4a]/40 to-[#ecd43c]/45 dark:from-yellow-500/20 dark:via-amber-500/15 dark:to-yellow-400/20 opacity-60 dark:opacity-40 blur-2xl group-hover:opacity-80 dark:group-hover:opacity-50 transition-opacity duration-500" />
            
            <Card className="relative border-2 border-white/20 dark:border-yellow-500/20 shadow-2xl shadow-yellow-600/10 dark:shadow-[0_8px_24px_-8px_rgba(251,191,36,0.15)] bg-white/80 dark:bg-gray-900/95 backdrop-blur-lg transition-all duration-500 rounded-3xl overflow-hidden">
              <CardHeader className="text-center pt-8 pb-6">
                <ConfirmDialog
                  open={modalOpen}
                  onOpenChange={setModalOpen}
                  title={modalTitle}
                  description={modalDescription}
                  confirmText={modalVariant === 'info' ? 'Ir para o login' : 'Fechar'}
                  onConfirm={() => {
                    setModalOpen(false);
                    if (modalVariant === 'info') {
                      window.location.assign('/login');
                    }
                  }}
                  variant={modalVariant}
                />
                <div className="flex flex-col items-center mb-4">
                  <div className="relative mb-4">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#fbcc2c]/45 to-[#ecd43c]/35 dark:bg-yellow-400/30 blur-3xl animate-pulse" />
                    <img src={logo} alt="Viação Pioneira" className="relative mx-auto h-16 w-16 sm:h-20 sm:w-20 object-contain rounded-full ring-2 ring-white/50 ring-offset-2 ring-offset-white/80 dark:ring-yellow-400/40 dark:ring-offset-gray-900/50 shadow-lg" />
                  </div>
                  <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold">Viação Pioneira Ltda</div>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#6b5d1a] via-[#7d6b1e] to-[#6b5d1a] dark:from-gray-100 dark:via-white dark:to-gray-100 bg-clip-text text-transparent">Recuperar Senha</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Informe seu e-mail para receber as instruções</p>
              </CardHeader>

               <button
                onClick={toggleTheme}
                className="absolute top-5 right-5 p-3 rounded-full bg-gray-100/50 hover:bg-gray-100/80 dark:bg-yellow-500/15 dark:hover:bg-yellow-500/25 border border-gray-200/50 dark:border-yellow-400/20 shadow-sm hover:shadow-md dark:shadow-sm dark:hover:shadow-md transition-all duration-500 group hover:scale-110"
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
                {error && !success && (
                  <Alert className="mb-6 border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20">
                    <AlertIcon />
                    <div>
                      <AlertTitle className="text-red-800 dark:text-red-300">Não foi possível enviar</AlertTitle>
                      <AlertDescription className="text-red-700 dark:text-red-400">{error}</AlertDescription>
                    </div>
                  </Alert>
                )}

                {success && (
                   <Alert className="mb-6 border-green-200 dark:border-green-800/50 bg-green-50 dark:bg-green-900/20">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <div>
                      <AlertTitle className="text-green-800 dark:text-green-300">Solicitação enviada</AlertTitle>
                      <AlertDescription className="text-green-700 dark:text-green-400">{success}</AlertDescription>
                    </div>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-700 dark:text-gray-300 font-medium">E-mail</Label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#fbcc2c] dark:group-focus-within:text-yellow-400 transition-colors duration-300" />
                      <Input
                        id="email"
                        type="email"
                        name="email"
                        autoComplete="email"
                        required
                        placeholder="seu.email@vpioneira.com.br"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading || !!success}
                        className="pl-11 h-12 border-gray-200 dark:border-gray-600 bg-gray-50/90 dark:bg-gray-800/50 focus:bg-white dark:focus:bg-gray-800 focus:border-[#fbcc2c] dark:focus:border-yellow-400 focus:ring-2 focus:ring-[#fbcc2c]/20 dark:focus:ring-yellow-400/20 transition-all duration-300"
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={loading || !!success} className="w-full h-12 bg-gradient-to-r from-[#fbcc2c] to-[#ecd43c] hover:from-[#e6cd4a] hover:to-[#d4cc54] dark:from-yellow-600 dark:to-amber-600 dark:hover:from-yellow-500 dark:hover:to-amber-500 text-gray-800 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]" size="lg">
                    {loading ? (
                      <span className="inline-flex items-center gap-3">
                        <span className="animate-spin rounded-full h-5 w-5 border-3 border-white/30 border-t-white" />
                        <span>Enviando...</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        <Send className="h-5 w-5" /> Enviar instruções
                      </span>
                    )}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <Link to="/login" className="inline-flex items-center gap-2 text-sm font-medium text-[#a89642] hover:text-[#c7cd69] dark:text-yellow-400 dark:hover:text-yellow-300 transition-colors">
                    <ArrowLeft className="h-4 w-4" /> Voltar ao login
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <footer className="w-full py-4 text-center text-xs text-gray-500 dark:text-gray-400">© 2025 Viação Pioneira Ltda. Todos os direitos reservados.</footer>
    </div>
  );
};

