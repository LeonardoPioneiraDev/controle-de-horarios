import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersService } from '../services/api';
import { CreateUserRequest } from '../types/user.types';
import { UserRole, UserStatus } from '../types/user.types';
import { AlertCircle, Save, ArrowLeft } from 'lucide-react';

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
      console.error('[UserCreate] error', e);
      setError('Falha ao criar usuário.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-primary-100">Novo Usuário</h1>
          <p className="mt-1 text-sm text-primary-300">Crie um novo usuário do sistema</p>
        </div>
        <button className="btn btn-secondary inline-flex items-center w-full sm:w-auto" onClick={() => navigate('/users')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="card">
        <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSubmit}>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-primary-200 mb-1">E-mail</label>
            <input
              type="email"
              className={`form-input ${errors.email ? 'border-red-300' : ''}`}
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="usuario@example.com"
              autoComplete="email"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-400 flex items-center"><AlertCircle className="h-4 w-4 mr-1" />{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-200 mb-1">Nome</label>
            <input
              className={`form-input ${errors.firstName ? 'border-red-300' : ''}`}
              value={form.firstName}
              onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
              placeholder="Nome"
              autoComplete="given-name"
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-400 flex items-center"><AlertCircle className="h-4 w-4 mr-1" />{errors.firstName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-200 mb-1">Sobrenome</label>
            <input
              className={`form-input ${errors.lastName ? 'border-red-300' : ''}`}
              value={form.lastName}
              onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
              placeholder="Sobrenome"
              autoComplete="family-name"
            />
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-400 flex items-center"><AlertCircle className="h-4 w-4 mr-1" />{errors.lastName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-200 mb-1">Função</label>
            <select
              className="form-select"
              value={form.role}
              onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as unknown as UserRole }))}
            >
              {roleOptions.map((r) => (
                <option key={r} value={r}>{roleLabel(r)}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 flex justify-end">
            <button type="submit" className="btn btn-primary inline-flex items-center" disabled={loading} aria-busy={loading}>
              <Save className="h-4 w-4 mr-2" /> Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserCreate;
