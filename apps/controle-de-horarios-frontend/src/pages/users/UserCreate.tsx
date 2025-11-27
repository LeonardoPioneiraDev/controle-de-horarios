import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersService } from '../../services/api';
import { CreateUserRequest } from '../../types/user.types';
import { UserRole, UserStatus } from '../../types/user.types';
import { AlertCircle, Save, ArrowLeft, Mail, User, Briefcase, Activity } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';

export const UserCreate: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<CreateUserRequest & { status?: UserStatus }>({
    email: '',
    firstName: '',
    lastName: '',
    role: UserRole.OPERADOR,
    password: undefined,
    status: UserStatus.PENDING,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roleLabel = (r: UserRole) => {
    const labels: Record<UserRole, string> = {
      [UserRole.ADMINISTRADOR]: 'Administrador',
      [UserRole.DIRETOR]: 'Diretor',
      [UserRole.GERENTE]: 'Gerente',
      [UserRole.ANALISTA]: 'Analista',
      [UserRole.ENCARREGADO]: 'Encarregado',
      [UserRole.OPERADOR]: 'Operador',
      [UserRole.PCQC]: 'PCQC',
      [UserRole.DACN]: 'DACN',
      [UserRole.INSTRUTORES]: 'Instrutores',
      [UserRole.DESPACHANTE]: 'Despachante',
      [UserRole.OPERADOR_CCO]: 'Operador CCO',
      [UserRole.ESTATISTICA]: 'Estatística',
    };
    return labels[r] ?? String(r);
  };
  const roleOptions = (Object.values(UserRole) as UserRole[]).sort((a, b) => roleLabel(a).localeCompare(roleLabel(b)));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.email.trim()) e.email = 'E-mail é obrigatório';
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) e.email = 'E-mail inválido';
    if (!form.firstName.trim()) e.firstName = 'Nome é obrigatório';
    if (!form.lastName.trim()) e.lastName = 'Sobrenome é obrigatório';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    try {
      setLoading(true);
      setError(null);
      const payload: CreateUserRequest = {
        email: form.email.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        role: form.role,
        password: form.password,
      };
      await usersService.createUser(payload);
      navigate('/users');
    } catch (e) {
      setError('Falha ao criar usuário.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#6b5d1a] via-[#7d6b1e] to-[#6b5d1a] dark:from-gray-100 dark:via-white dark:to-gray-100 bg-clip-text text-transparent">
            Novo Usuário
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 font-medium">
            Crie um novo usuário do sistema
          </p>
        </div>
        <Button
          onClick={() => navigate('/users')}
          variant="outline"
          className="w-full sm:w-auto border-[#fbcc2c]/50 dark:border-yellow-500/30 hover:bg-[#fbcc2c]/10 dark:hover:bg-yellow-500/10 text-[#6b5d1a] dark:text-yellow-400"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-300 font-medium flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </p>
        </div>
      )}

      <Card className="border-none shadow-xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-md">
        <CardContent className="p-6 sm:p-8">
          <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={handleSubmit}>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="email" className="text-gray-700 dark:text-gray-300 font-medium">E-mail</Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#fbcc2c] dark:group-focus-within:text-yellow-400 transition-colors" />
                <Input
                  id="email"
                  type="email"
                  className={`pl-10 bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 ${errors.email ? 'border-red-300 dark:border-red-700' : ''}`}
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="usuario@example.com"
                  autoComplete="email"
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-500 dark:text-red-400 flex items-center mt-1">
                  <AlertCircle className="h-4 w-4 mr-1" />{errors.email}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-gray-700 dark:text-gray-300 font-medium">Nome</Label>
              <div className="relative group">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#fbcc2c] dark:group-focus-within:text-yellow-400 transition-colors" />
                <Input
                  id="firstName"
                  className={`pl-10 bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 ${errors.firstName ? 'border-red-300 dark:border-red-700' : ''}`}
                  value={form.firstName}
                  onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
                  placeholder="Nome"
                  autoComplete="given-name"
                />
              </div>
              {errors.firstName && (
                <p className="text-sm text-red-500 dark:text-red-400 flex items-center mt-1">
                  <AlertCircle className="h-4 w-4 mr-1" />{errors.firstName}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-gray-700 dark:text-gray-300 font-medium">Sobrenome</Label>
              <div className="relative group">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#fbcc2c] dark:group-focus-within:text-yellow-400 transition-colors" />
                <Input
                  id="lastName"
                  className={`pl-10 bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 ${errors.lastName ? 'border-red-300 dark:border-red-700' : ''}`}
                  value={form.lastName}
                  onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
                  placeholder="Sobrenome"
                  autoComplete="family-name"
                />
              </div>
              {errors.lastName && (
                <p className="text-sm text-red-500 dark:text-red-400 flex items-center mt-1">
                  <AlertCircle className="h-4 w-4 mr-1" />{errors.lastName}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="text-gray-700 dark:text-gray-300 font-medium">Função</Label>
              <div className="relative group">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#fbcc2c] dark:group-focus-within:text-yellow-400 transition-colors" />
                <select
                  id="role"
                  className="w-full h-10 pl-10 pr-3 rounded-md border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-sm focus:ring-2 focus:ring-[#fbcc2c] dark:focus:ring-yellow-400 focus:border-transparent outline-none transition-all text-gray-900 dark:text-gray-100"
                  value={form.role}
                  onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as unknown as UserRole }))}
                >
                  {roleOptions.map((r) => (
                    <option key={r} value={r}>{roleLabel(r)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="md:col-span-2 flex justify-end pt-4">
              <Button
                type="submit"
                className="w-full sm:w-auto bg-gradient-to-r from-[#fbcc2c] to-[#ecd43c] hover:from-[#e6cd4a] hover:to-[#d4cc54] dark:from-yellow-600 dark:to-amber-600 text-gray-900 font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-gray-900 border-t-transparent" />
                    Salvando...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Save className="h-4 w-4" /> Salvar Usuário
                  </span>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserCreate;
