import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usersService } from '../../services/api';
import { User, CreateUserRequest, UpdateUserRequest, UserRole, UserStatus } from '../../types';
import { UserModal } from '../../components/UserModal';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';
import { useAuth } from '../../contexts/AuthContext';
import {
  Users as UsersIcon,
  Plus,
  Search,
  Edit,
  Trash2,
  MoreVertical,
  RefreshCw,
  Shield,
  AlertTriangle,
  Filter
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

export const Users: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');

  // Role options sorted alphabetically by label
  const roleLabel = (r: string) => ({
    administrador: 'Administrador',
    analista: 'Analista',
    dacn: 'DACN',
    despachante: 'Despachante',
    diretor: 'Diretor',
    encarregado: 'Encarregado',
    gerente: 'Gerente',
    instrutores: 'Instrutores',
    operador: 'Operador',
    operador_cco: 'Operador CCO',
    pcqc: 'PCQC',
  } as Record<string, string>)[r] || r;
  const roleOptions = (Object.values(UserRole) as string[])
    .map((r) => String(r))
    .sort((a, b) => roleLabel(a).localeCompare(roleLabel(b)));

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Dropdown states
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Verificar se é administrador
  const roleStr = String(currentUser?.role ?? '').toLowerCase();
  const isAdmin = roleStr === 'admin' || roleStr === 'administrador';

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, statusFilter, roleFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await usersService.getUsers();
      setUsers(response);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter);
    }

    // Filter by role
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Ordenar alfabeticamente pela Função (papel) e, em caso de empate, pelo Nome
    const sorted = [...filtered].sort((a, b) => {
      const roleA = roleLabel(String(a.role));
      const roleB = roleLabel(String(b.role));
      const cmpRole = roleA.localeCompare(roleB, 'pt-BR', { sensitivity: 'base' });
      if (cmpRole !== 0) return cmpRole;
      const nameA = `${a.firstName} ${a.lastName}`.trim();
      const nameB = `${b.firstName} ${b.lastName}`.trim();
      return nameA.localeCompare(nameB, 'pt-BR', { sensitivity: 'base' });
    });

    setFilteredUsers(sorted);
  };

  const handleCreateUser = () => {
    if (!isAdmin) {
      alert('Apenas administradores podem criar usuários');
      return;
    }
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    if (!isAdmin) {
      alert('Apenas administradores podem editar usuários');
      return;
    }
    setSelectedUser(user);
    setIsModalOpen(true);
    setOpenDropdown(null);
  };

  const handleDeleteUser = (user: User) => {
    if (!isAdmin) {
      alert('Apenas administradores podem excluir usuários');
      return;
    }
    setUserToDelete(user);
    setOpenDeleteConfirm(true);
    setOpenDropdown(null);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      await usersService.deleteUser(userToDelete.id);
      await loadUsers();
      setActionSuccess('Usuário excluído com sucesso.');
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Erro ao excluir usuário');
    } finally {
      setOpenDeleteConfirm(false);
      setUserToDelete(null);
    }
  };

  const handleSaveUser = async (userData: CreateUserRequest | UpdateUserRequest) => {
    try {
      setModalLoading(true);
      // Backend espera roles em minúsculas pt-BR
      const normalizeRole = (r?: string) => (r ? r.toLowerCase() : r);
      const payload: any = { ...userData };
      if ((payload as any).role) payload.role = normalizeRole((payload as any).role);

      const wasUpdate = Boolean(selectedUser);
      if (wasUpdate) {
        if (!selectedUser) {
          throw new Error('Usuário não selecionado para atualização');
        }
        await usersService.updateUser(selectedUser.id, payload as UpdateUserRequest);
      } else {
        await usersService.createUser(payload as CreateUserRequest);
      }

      setIsModalOpen(false);
      await loadUsers();
      setActionSuccess(wasUpdate ? 'Usuário atualizado com sucesso.' : 'Usuário criado com sucesso.');
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Erro ao salvar usuário');
    } finally {
      setModalLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
      blocked: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    };

    const statusLabels = {
      active: 'Ativo',
      pending: 'Pendente',
      inactive: 'Inativo',
      blocked: 'Bloqueado'
    };

    return (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClasses[status as keyof typeof statusClasses]}`}>
        {statusLabels[status as keyof typeof statusLabels]}
      </span>
    );
  };

  const getRoleBadge = (role: string) => {
    const roleLabels = {
      administrador: 'Administrador',
      diretor: 'Diretor',
      gerente: 'Gerente',
      analista: 'Analista',
      operador: 'Operador',
      encarregado: 'Encarregado',
      pcqc: 'PCQC',
      dacn: 'DACN',
      instrutores: 'Instrutores',
      despachante: 'Despachante',
      operador_cco: 'Operador CCO'
    } as Record<string, string>;

    return (
      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-[#fbcc2c]/20 text-[#6b5d1a] dark:bg-yellow-500/20 dark:text-yellow-300 border border-[#fbcc2c]/30 dark:border-yellow-500/30">
        {roleLabels[role as keyof typeof roleLabels] || role}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#fbcc2c] dark:border-yellow-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#6b5d1a] via-[#7d6b1e] to-[#6b5d1a] dark:from-gray-100 dark:via-white dark:to-gray-100 bg-clip-text text-transparent">
            Usuários
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 font-medium">
            Gerencie os usuários do sistema
          </p>
        </div>
        <Button
          onClick={handleCreateUser}
          className={`w-full sm:w-auto gap-2 ${isAdmin
              ? 'bg-gradient-to-r from-[#fbcc2c] to-[#ecd43c] hover:from-[#e6cd4a] hover:to-[#d4cc54] dark:from-yellow-600 dark:to-amber-600 text-gray-900'
              : 'bg-gray-200 dark:bg-gray-800 text-gray-500 cursor-not-allowed'
            }`}
          disabled={!isAdmin}
          title={!isAdmin ? 'Apenas administradores podem criar usuários' : ''}
        >
          <Plus className="h-4 w-4" />
          Novo Usuário
          {!isAdmin && <Shield className="h-4 w-4 ml-2" />}
        </Button>
      </div>

      {/* Feedback de ações */}
      {actionSuccess && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-lg p-4">
          <p className="text-green-800 dark:text-green-300 font-medium">{actionSuccess}</p>
        </div>
      )}

      {actionError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-300 font-medium">{actionError}</p>
        </div>
      )}

      {/* Aviso de Permissão */}
      {!isAdmin && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 rounded-lg p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <div className="ml-3">
              <h3 className="text-sm font-bold text-yellow-800 dark:text-yellow-300">
                Acesso Limitado
              </h3>
              <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-400/80">
                Você pode visualizar os usuários, mas apenas administradores podem criar, editar ou excluir usuários.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-300 font-medium">{error}</p>
        </div>
      )}

      {/* Filters */}
      <Card className="border-none shadow-lg bg-white/60 dark:bg-gray-900/60 backdrop-blur-md">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  className="pl-10 bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
                  placeholder="Buscar por nome ou e-mail..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="w-full lg:w-48">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  className="w-full h-10 pl-10 pr-3 rounded-md border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-sm focus:ring-2 focus:ring-[#fbcc2c] dark:focus:ring-yellow-400 focus:border-transparent outline-none transition-all text-gray-900 dark:text-gray-100"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Todos os Status</option>
                  <option value="active">Ativo</option>
                  <option value="pending">Pendente</option>
                  <option value="inactive">Inativo</option>
                  <option value="blocked">Bloqueado</option>
                </select>
              </div>
            </div>

            {/* Role Filter */}
            <div className="w-full lg:w-48">
              <div className="relative">
                <UsersIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  className="w-full h-10 pl-10 pr-3 rounded-md border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-sm focus:ring-2 focus:ring-[#fbcc2c] dark:focus:ring-yellow-400 focus:border-transparent outline-none transition-all text-gray-900 dark:text-gray-100"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="all">Todas as Funções</option>
                  {roleOptions.map((r) => (
                    <option key={r} value={r}>{roleLabel(r)}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Refresh Button */}
            <Button
              onClick={loadUsers}
              variant="outline"
              className="border-[#fbcc2c]/50 dark:border-yellow-500/30 hover:bg-[#fbcc2c]/10 dark:hover:bg-yellow-500/10 text-[#6b5d1a] dark:text-yellow-400"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="overflow-hidden border-none shadow-xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50/50 dark:bg-gray-800/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Função
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Último Login
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Criado em
                </th>
                {isAdmin && (
                  <th className="relative px-6 py-4">
                    <span className="sr-only">Ações</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-transparent">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-[#fbcc2c]/5 dark:hover:bg-yellow-500/5 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#fbcc2c] to-[#ecd43c] dark:from-yellow-600 dark:to-amber-600 flex items-center justify-center text-sm font-bold text-gray-900 shadow-md">
                        {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getRoleBadge(user.role)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(user.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {user.lastLogin ? formatDate(user.lastLogin.toISOString()) : 'Nunca'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(user.createdAt.toISOString())}
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="relative">
                        <button
                          onClick={() => setOpenDropdown(openDropdown === user.id ? null : user.id)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500 dark:text-gray-400"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>

                        {openDropdown === user.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl z-10 border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="py-1">
                              <Link
                                to={`/users/${user.id}/edit`}
                                className="flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left transition-colors"
                                onClick={() => setOpenDropdown(null)}
                              >
                                <Edit className="h-4 w-4 mr-2 text-blue-500" />
                                Editar
                              </Link>
                              <button
                                onClick={() => handleDeleteUser(user)}
                                className="flex items-center px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 w-full text-left transition-colors"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <UsersIcon className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Nenhum usuário encontrado</h3>
              <p className="mt-1 text-gray-500 dark:text-gray-400">
                {searchTerm || statusFilter !== 'all' || roleFilter !== 'all'
                  ? 'Tente ajustar os filtros de busca.'
                  : isAdmin ? 'Comece criando um novo usuário.' : 'Nenhum usuário cadastrado no sistema.'}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* User Modal */}
      {isAdmin && (
        <UserModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveUser}
          user={selectedUser}
          loading={modalLoading}
        />
      )}

      <ConfirmDialog
        open={openDeleteConfirm}
        onOpenChange={setOpenDeleteConfirm}
        variant="danger"
        title="Confirmar exclusão de usuário?"
        description={
          <span>
            Você tem certeza que deseja excluir o usuário <strong>{userToDelete?.firstName} {userToDelete?.lastName}</strong>?
            Esta ação não pode ser desfeita.
          </span>
        }
        confirmText="Sim, excluir"
        cancelText="Cancelar"
        onConfirm={confirmDeleteUser}
      />
    </div>
  );
};
