import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Alert, AlertDescription, AlertIcon, AlertTitle } from '../../components/ui/alert';
import { Lock, CheckCircle2, XCircle, Eye, EyeOff } from 'lucide-react';
import { authService } from '../../services/api';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';
import logo from '../../assets/logo.png';

const useQuery = () => new URLSearchParams(useLocation().search);

export const SetPassword: React.FC = () => {
  const query = useQuery();
  const token = query.get('token') || '';
  const navigate = useNavigate();
  const pathname = useLocation().pathname;
  const isFirstLogin = pathname.includes('first-login');

  const [validated, setValidated] = useState<boolean>(false);
  const [validationMsg, setValidationMsg] = useState<string>('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalDescription, setModalDescription] = useState<React.ReactNode>('');
  const [modalVariant, setModalVariant] = useState<'info' | 'danger' | 'warning'>('info');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  type PasswordChecks = {
    length: boolean;
    upper: boolean;
    lower: boolean;
    number: boolean;
    special: boolean;
    match: boolean;
  };

  const checks: PasswordChecks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
    match: password.length > 0 && password === confirm,
  };

  useEffect(() => {
    const validate = async () => {
      if (!token) {
        setError('Token ausente. Use o link enviado por e-mail.');
        return;
      }
      try {
        const res = await authService.validateResetToken(token);
        setValidated(res.valid);
        setValidationMsg(res.message);
        if (!res.valid) setError(res.message || 'Token inválido ou expirado.');
      } catch (e: any) {
        setError('Falha ao validar token.');
      }
    };
    validate();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!checks.length || !checks.upper || !checks.lower || !checks.number || !checks.special) {
      return setError('A senha não atende aos requisitos de segurança.');
    }
    if (!checks.match) return setError('As senhas não conferem.');
    try {
      setLoading(true);
      await authService.resetPassword(token, password);
      setSuccess('Senha definida com sucesso. Você já pode fazer login.');
      setModalTitle('Senha definida com sucesso');
      setModalDescription('Sua senha foi atualizada. Clique em continuar para ir ao login.');
      setModalVariant('info');
      setModalOpen(true);
    } catch (e: any) {
      const message = e?.response?.data?.message || 'Falha ao definir senha.';
      setError(message);
      setModalTitle('Não foi possível definir sua senha');
      setModalDescription(message);
      setModalVariant('danger');
      setModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-black via-neutral-900 to-yellow-950 p-4 text-gray-100">
      <div className="w-full max-w-md">
        <ConfirmDialog
          open={modalOpen}
          onOpenChange={(open) => {
            setModalOpen(open);
            if (!open) {
              navigate('/login', { replace: true });
            }
          }}
          title={modalTitle}
          description={modalDescription}
          confirmText="Continuar"
          cancelText="Fechar"
          onConfirm={() => navigate('/login', { replace: true })}
          variant={modalVariant}
        />
        <Card className="border border-yellow-400/20">
          <CardHeader>
            <div className="flex flex-col items-center mb-2">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-yellow-400/30 blur-xl" />
                <img src={logo} alt="Viação Pioneira" className="relative mx-auto h-16 w-16 sm:h-20 sm:w-20 object-contain rounded-full ring-2 ring-yellow-400/40" />
              </div>
              <div className="mt-2 text-xs text-gray-300">Viação Pioneira Ltda</div>
            </div>
            <h1 className="text-2xl font-bold">
              {isFirstLogin ? 'Definir senha (primeiro acesso)' : 'Redefinir senha'}
            </h1>
            <p className="text-sm text-gray-400">
              {isFirstLogin ? 'Crie sua senha para acessar o sistema.' : 'Informe sua nova senha.'}
            </p>
          </CardHeader>
          <CardContent>
            {!!validationMsg && (
              <div className="text-xs text-gray-400 mb-2">{validationMsg}</div>
            )}
            {error && (
              <Alert className="mb-4">
                <AlertIcon />
                <div>
                  <AlertTitle>Não foi possível continuar</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </div>
              </Alert>
            )}
            {success && (
              <div className="mb-4 flex items-start gap-3 rounded-md border border-green-500/40 bg-green-900/30 p-3 text-green-200">
                <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 7L9 18l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <div>
                  <p className="text-sm">{success}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="password">Nova senha</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={8}
                    required
                    disabled={!validated || loading}
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              <div>
                <Label htmlFor="confirm">Confirmar senha</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="confirm"
                    type={showConfirm ? 'text' : 'password'}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    minLength={8}
                    required
                    disabled={!validated || loading}
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                    aria-label={showConfirm ? 'Ocultar confirmação' : 'Mostrar confirmação'}
                  >
                    {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              <div className="rounded-md border border-yellow-400/10 bg-neutral-900/50 p-3 text-sm">
                <p className="mb-2 text-gray-300">A senha deve conter:</p>
                <ul className="space-y-1">
                  <Requirement ok={checks.length} text="Pelo menos 8 caracteres" />
                  <Requirement ok={checks.upper} text="Letra maiúscula (A-Z)" />
                  <Requirement ok={checks.lower} text="Letra minúscula (a-z)" />
                  <Requirement ok={checks.number} text="Número (0-9)" />
                  <Requirement ok={checks.special} text="Caractere especial (!@#$%...)" />
                  <Requirement ok={checks.match} text="As senhas coincidem" />
                </ul>
              </div>
              <Button type="submit" className="w-full" disabled={!validated || loading || !checks.length || !checks.upper || !checks.lower || !checks.number || !checks.special || !checks.match}>
                {loading ? 'Salvando...' : 'Salvar senha'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

function Requirement({ ok, text }: { ok: boolean; text: string }) {
  return (
    <li className="flex items-center gap-2">
      {ok ? (
        <CheckCircle2 className="h-4 w-4 text-green-400" />
      ) : (
        <XCircle className="h-4 w-4 text-gray-500" />
      )}
      <span className={ok ? 'text-green-300' : 'text-gray-400'}>{text}</span>
    </li>
  );
}

export default SetPassword;

