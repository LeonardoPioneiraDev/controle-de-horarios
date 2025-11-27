import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usersService } from '../../services/api';
import { UpdateUserRequest, User } from '../../types/user.types';
import { UserRole, UserStatus } from '../../types/user.types';
import { AlertCircle, Save, ArrowLeft, Mail, User as UserIcon, Briefcase, Activity } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';

export const UserEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [form, setForm] = useState<UpdateUserRequest>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        if (!id) {
          setError('ID inválido');
          return;
        }
        const u = await usersService.getUserById(id);
        setUser(u);
        setForm({
          firstName: u.firstName,
          lastName: u.lastName,
          role: u.role,
          status: u.status,
        });
      } catch (e) {
        setError('Falha ao carregar usuário.');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [id]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.firstName?.trim()) e.firstName = 'Nome é obrigatório';
    if (!form.lastName?.trim()) e.lastName = 'Sobrenome é obrigatório';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!id) return;
    if (!validate()) return;
    try {
      setSaving(true);
      setError(null);
      const payload: UpdateUserRequest = {
        firstName: form.firstName?.trim(),
        lastName: form.lastName?.trim(),
        role: form.role,
        status: form.status,
      };
      await usersService.updateUser(id, payload);
      navigate('/users');
    } catch (e) {
      setError('Falha ao salvar usuário.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#fbcc2c] dark:border-yellow-400"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-4 p-8 text-center">
        <p className="text-gray-600 dark:text-gray-400">Usuário não encontrado.</p>
        <Button variant="outline" onClick={() => navigate('/users')}>Voltar</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#6b5d1a] via-[#7d6b1e] to-[#6b5d1a] dark:from-gray-100 dark:via-white dark:to-gray-100 bg-clip-text text-transparent">
            Editar Usuário
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 font-medium">
            Atualize as informações do usuário
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
              <Label className="text-gray-700 dark:text-gray-300 font-medium">E-mail</Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  className="pl-10 bg-gray-100/50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700 cursor-not-allowed opacity-70"
                  value={user.email}
                  disabled
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">E-mail não pode ser alterado</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-gray-700 dark:text-gray-300 font-medium">Nome</Label>
              <div className="relative group">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#fbcc2c] dark:group-focus-within:text-yellow-400 transition-colors" />
                <Input
                  id="firstName"
                  className={`pl-10 bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 ${errors.firstName ? 'border-red-300 dark:border-red-700' : ''}`}
                  value={form.firstName || ''}
                  onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
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
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#fbcc2c] dark:group-focus-within:text-yellow-400 transition-colors" />
                <Input
                  id="lastName"
                  className={`pl-10 bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 ${errors.lastName ? 'border-red-300 dark:border-red-700' : ''}`}
                  value={form.lastName || ''}
                  onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
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
                  value={form.role || user.role}
                  onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as unknown as UserRole }))}
                >
                  {roleOptions.map((r) => (
                    <option key={r} value={r}>{roleLabel(r)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="text-gray-700 dark:text-gray-300 font-medium">Status</Label>
              <div className="relative group">
                <Activity className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#fbcc2c] dark:group-focus-within:text-yellow-400 transition-colors" />
                <select
                  id="status"
                  className="w-full h-10 pl-10 pr-3 rounded-md border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-sm focus:ring-2 focus:ring-[#fbcc2c] dark:focus:ring-yellow-400 focus:border-transparent outline-none transition-all text-gray-900 dark:text-gray-100"
                  value={form.status || user.status}
                  onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as unknown as UserStatus }))}
                >
                  {Object.values(UserStatus).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="md:col-span-2 flex justify-end pt-4">
              <Button
                type="submit"
                className="w-full sm:w-auto bg-gradient-to-r from-[#fbcc2c] to-[#ecd43c] hover:from-[#e6cd4a] hover:to-[#d4cc54] dark:from-yellow-600 dark:to-amber-600 text-gray-900 font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                disabled={saving}
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-gray-900 border-t-transparent" />
                    Salvando...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Save className="h-4 w-4" /> Salvar Alterações
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

export default UserEdit;
