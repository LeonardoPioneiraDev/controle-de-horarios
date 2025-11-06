import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Send, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription, AlertIcon, AlertTitle } from '../components/ui/alert';
import { authService } from '../services/api';
import logo from '../assets/logo.png';

function isHttpError(error: unknown): error is { response?: { status?: number; data?: { message?: string } } } {
  return typeof error === 'object' && error !== null && 'response' in (error as any);
}

export const ResetPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await authService.forgotPassword(email);
      setSuccess('Se o e-mail estiver cadastrado, enviaremos instruções para redefinir sua senha.');
    } catch (err: unknown) {
      if (isHttpError(err) && err.response?.status === 404) {
        setError('E-mail não cadastrado. Verifique e tente novamente.');
      } else {
        const message = isHttpError(err) ? (err.response?.data?.message || 'Erro ao solicitar recuperação. Tente novamente.') : 'Erro ao solicitar recuperação. Tente novamente.';
        setError(message);
      }
    } finally {
      setLoading(false);
    }
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
                <h1 className="text-2xl sm:text-3xl font-bold">Recuperar Senha</h1>
                <p className="mt-1 text-sm text-gray-400">Informe seu e-mail para receber as instruções</p>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert className="mb-4">
                    <AlertIcon />
                    <div>
                      <AlertTitle>Não foi possível enviar</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </div>
                  </Alert>
                )}

                {success && (
                  <div className="mb-4 flex items-start gap-3 rounded-md border border-green-500/40 bg-green-900/30 p-3 text-green-200">
                    <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 7L9 18l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <div>
                      <p className="text-sm font-semibold">Solicitação enviada</p>
                      <p className="text-sm">{success}</p>
                    </div>
                  </div>
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
                        autoComplete="email"
                        required
                        placeholder="seu.email@vpioneira.com.br"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={loading} className="w-full" size="lg">
                    {loading ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900" />
                        Enviando...
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        <Send className="h-5 w-5" /> Enviar instruções
                      </span>
                    )}
                  </Button>
                </form>

                <div className="mt-4 text-center">
                  <Link to="/login" className="inline-flex items-center gap-2 text-sm text-yellow-400 hover:text-yellow-300">
                    <ArrowLeft className="h-4 w-4" /> Voltar ao login
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <footer className="w-full py-4 text-center text-xs text-gray-400">© 2025 Viação Pioneira Ltda. Todos os direitos reservados.</footer>
    </div>
  );
};
