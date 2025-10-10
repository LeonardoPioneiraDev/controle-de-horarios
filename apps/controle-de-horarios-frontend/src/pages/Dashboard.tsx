import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ApiService } from '../services/api';
import { Users, UserCheck, UserX, UserPlus, BarChart3, Clock } from 'lucide-react';

interface Stats {
  total: number;
  byStatus: {
    active: number;
    pending: number;
    inactive: number;
    blocked: number;
  };
  byRole: Record<string, number>;
}

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getUserStats();
      setStats(response);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar estatísticas');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Bem-vindo, {user?.firstName}! Aqui está um resumo do sistema.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total de Usuários</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.total || 0}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <UserCheck className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Usuários Ativos</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.byStatus.active || 0}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <UserPlus className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pendentes</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.byStatus.pending || 0}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <UserX className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Bloqueados</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.byStatus.blocked || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Distribuição por Status</h3>
          <div className="space-y-3">
            {stats && Object.entries(stats.byStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    status === 'active' ? 'bg-green-500' :
                    status === 'pending' ? 'bg-yellow-500' :
                    status === 'inactive' ? 'bg-gray-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-sm text-gray-600 capitalize">{status}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Role Distribution */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Distribuição por Função</h3>
          <div className="space-y-3">
            {stats && Object.entries(stats.byRole).map(([role, count]) => (
              <div key={role} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    role === 'administrador' ? 'bg-blue-500' :
                    role === 'diretor' ? 'bg-purple-500' :
                    role === 'gerente' ? 'bg-indigo-500' :
                    role === 'analista' ? 'bg-green-500' : 'bg-orange-500'
                  }`}></div>
                  <span className="text-sm text-gray-600 capitalize">{role}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Ações Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
            <Users className="h-8 w-8 text-primary-500 mb-2" />
            <h4 className="font-medium text-gray-900">Gerenciar Usuários</h4>
            <p className="text-sm text-gray-600">Criar, editar e visualizar usuários</p>
          </button>
          
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
            <Clock className="h-8 w-8 text-primary-500 mb-2" />
            <h4 className="font-medium text-gray-900">Controle de Ponto</h4>
            <p className="text-sm text-gray-600">Registrar entrada e saída</p>
          </button>
          
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
            <BarChart3 className="h-8 w-8 text-primary-500 mb-2" />
            <h4 className="font-medium text-gray-900">Relatórios</h4>
            <p className="text-sm text-gray-600">Visualizar relatórios e estatísticas</p>
          </button>
        </div>
      </div>
    </div>
  );
};