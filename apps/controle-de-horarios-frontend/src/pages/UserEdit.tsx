import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usersService } from '../services/api';
import { UpdateUserRequest, User } from '../types/user.types';
import { UserRole, UserStatus } from '../types/user.types';
import { AlertCircle, Save, ArrowLeft } from 'lucide-react';

export const UserEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [form, setForm] = useState<UpdateUserRequest>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        console.error('[UserEdit] load error', e);
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
      console.error('[UserEdit] save error', e);
      setError('Falha ao salvar usuário.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-4">
        <p className="text-primary-100">Usuário não encontrado.</p>
        <button className="btn btn-secondary" onClick={() => navigate('/users')}>Voltar</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-100">Editar Usuário</h1>
          <p className="mt-1 text-sm text-primary-300">Atualize as informações do usuário</p>
        </div>
        <button className="btn btn-secondary inline-flex items-center" onClick={() => navigate('/users')}>
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
            <input className="form-input" value={user.email} disabled />
            <p className="mt-1 text-xs text-primary-300">E-mail não pode ser alterado</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-200 mb-1">Nome</label>
            <input
              className={`form-input ${errors.firstName ? 'border-red-300' : ''}`}
              value={form.firstName || ''}
              onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
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
              value={form.lastName || ''}
              onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
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
              value={form.role || user.role}
              onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as unknown as UserRole }))}
            >
              {Object.values(UserRole).map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-200 mb-1">Status</label>
            <select
              className="form-select"
              value={form.status || user.status}
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as unknown as UserStatus }))}
            >
              {Object.values(UserStatus).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 flex justify-end">
            <button type="submit" className="btn btn-primary inline-flex items-center" disabled={saving} aria-busy={saving}>
              <Save className="h-4 w-4 mr-2" /> Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserEdit;

