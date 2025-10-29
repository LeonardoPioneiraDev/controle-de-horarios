import { useState, useEffect } from 'react';
import { usersService } from '../services/api';
import { User, CreateUserRequest, UpdateUserRequest, UserRole, UserStatus } from '../types';
import { UserModal } from '../components/UserModal';
import { useAuth } from '../contexts/AuthContext';
import { 
  Users as UsersIcon, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  MoreVertical,
  RefreshCw,
  Shield,
  AlertTriangle
} from 'lucide-react';

export const Users: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  
  // Dropdown states
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Verificar se é administrador
  const isAdmin = currentUser?.role === UserRole.ADMINISTRADOR;

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

    setFilteredUsers(filtered);
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

  const handleDeleteUser = async (user: User) => {
    if (!isAdmin) {
      alert('Apenas administradores podem excluir usuários');
      return;
    }

    if (!window.confirm(`Tem certeza que deseja excluir o usuário ${user.firstName} ${user.lastName}?`)) {
      return;
    }

    try {
      await usersService.deleteUser(user.id);
      await loadUsers();
      setOpenDropdown(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao excluir usuário');
    }
  };

  const handleSaveUser = async (userData: CreateUserRequest | UpdateUserRequest) => {
    try {
      setModalLoading(true);
      
      if (selectedUser) {
        await usersService.updateUser(selectedUser.id, userData as UpdateUserRequest);
      } else {
        await usersService.createUser(userData as CreateUserRequest);
      }
      
      setIsModalOpen(false);
      await loadUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao salvar usuário');
    } finally {
      setModalLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      active: 'status-badge status-active',
      pending: 'status-badge status-pending',
      inactive: 'status-badge status-inactive',
      blocked: 'status-badge status-blocked'
    };
    
    const statusLabels = {
      active: 'Ativo',
      pending: 'Pendente',
      inactive: 'Inativo',
      blocked: 'Bloqueado'
    };
    
    return (
      <span className={statusClasses[status as keyof typeof statusClasses]}>
        {statusLabels[status as keyof typeof statusLabels]}
      </span>
    );
  };

  const getRoleBadge = (role: string) => {
    const roleClasses = {
      administrador: 'role-badge role-administrador',
      diretor: 'role-badge role-diretor',
      gerente: 'role-badge role-gerente',
      analista: 'role-badge role-analista',
      operador: 'role-badge role-operador',
      funcionario: 'role-badge role-funcionario'
    };
    
    const roleLabels = {
      administrador: 'Administrador',
      diretor: 'Diretor',
      gerente: 'Gerente',
      analista: 'Analista',
      operador: 'Operador',
      funcionario: 'Funcionário'
    };
    
    return (
      <span className={roleClasses[role as keyof typeof roleClasses]}>
        {roleLabels[role as keyof typeof roleLabels]}
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
          <p className="mt-1 text-sm text-gray-600">
            Gerencie os usuários do sistema
          </p>
        </div>
        <button
          onClick={handleCreateUser}
          className={`btn ${isAdmin ? 'btn-primary' : 'btn-secondary'} flex items-center`}
          disabled={!isAdmin}
          title={!isAdmin ? 'Apenas administradores podem criar usuários' : ''}
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Usuário
          {!isAdmin && <Shield className="h-4 w-4 ml-2" />}
        </button>
      </div>

      {/* Aviso de Permissão */}
      {!isAdmin && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Acesso Limitado
              </h3>
              <p className="mt-1 text-sm text-yellow-700">
                Você pode visualizar os usuários, mas apenas administradores podem criar, editar ou excluir usuários.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="form-input pl-10"
                placeholder="Buscar usuários..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="w-full sm:w-48">
            <select
              className="form-select"
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

          {/* Role Filter */}
          <div className="w-full sm:w-48">
            <select
              className="form-select"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">Todas as Funções</option>
              <option value="administrador">Administrador</option>
              <option value="diretor">Diretor</option>
              <option value="gerente">Gerente</option>
              <option value="analista">Analista</option>
              <option value="operador">Operador</option>
              <option value="funcionario">Funcionário</option>
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={loadUsers}
            className="btn btn-secondary flex items-center"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Função
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Último Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Criado em
                </th>
                {isAdmin && (
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Ações</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                        {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.lastLogin ? formatDate(user.lastLogin.toISOString()) : 'Nunca'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(user.createdAt.toISOString())}
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="relative">
                        <button
                          onClick={() => setOpenDropdown(openDropdown === user.id ? null : user.id)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <MoreVertical className="h-4 w-4 text-gray-500" />
                        </button>
                        
                        {openDropdown === user.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                            <div className="py-1">
                              <button
                                onClick={() => handleEditUser(user)}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user)}
                                className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left"
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
              <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum usuário encontrado</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter !== 'all' || roleFilter !== 'all'
                  ? 'Tente ajustar os filtros de busca.'
                  : isAdmin ? 'Comece criando um novo usuário.' : 'Nenhum usuário cadastrado no sistema.'}
              </p>
            </div>
          )}
        </div>
      </div>

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
    </div>
  );
};