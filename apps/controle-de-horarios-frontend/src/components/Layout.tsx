import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Users, LogOut, Settings, Home, Bus, Server, GitCompare, Clock } from 'lucide-react'; // ✅ ADICIONADO Clock

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Usuários', href: '/users', icon: Users },
  { name: 'Viagens Transdata', href: '/viagens', icon: Bus },
  { name: 'Viagens Globus', href: '/viagens-globus', icon: Server },
  { name: 'Comparação', href: '/comparacao-viagens', icon: GitCompare },
  { name: 'Controle Horários', href: '/controle-horarios', icon: Clock }, // ✅ NOVA OPÇÃO
];

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 shrink-0 items-center px-6 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">Controle de Horários</h1>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col px-6 py-4">
            <ul className="flex flex-1 flex-col gap-y-2">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={`group flex gap-x-3 rounded-md p-3 text-sm leading-6 font-semibold transition-colors ${
                        isActive
                          ? 'bg-primary-50 text-primary-600'
                          : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                      }`}
                    >
                      <item.icon
                        className={`h-5 w-5 shrink-0 ${
                          isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-primary-600'
                        }`}
                      />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* ✅ SEÇÃO DE INFORMAÇÕES DO SISTEMA */}
            <div className="mt-auto pt-4 border-t border-gray-200">
              <div className="text-xs text-gray-500 space-y-1">
                <div className="flex justify-between">
                  <span>Ambiente:</span>
                  <span className="font-medium text-green-600">Development</span>
                </div>
                <div className="flex justify-between">
                  <span>Backend:</span>
                  <span className="font-medium">:3335</span>
                </div>
                <div className="flex justify-between">
                  <span>Frontend:</span>
                  <span className="font-medium">:3000</span>
                </div>
                <div className="flex justify-between">
                  <span>Versão:</span>
                  <span className="font-medium text-blue-600">v2.1</span>
                </div>
              </div>
            </div>
          </nav>

          {/* User menu */}
          <div className="border-t border-gray-200 p-6">
            <div className="flex items-center gap-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100">
                <span className="text-sm font-medium text-primary-600">
                  {user?.firstName?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
            </div>
            
            <div className="mt-4 flex gap-2">
              <button className="flex-1 flex items-center justify-center gap-2 rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-700 hover:bg-gray-200 transition-colors">
                <Settings className="h-4 w-4" />
                Config
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 flex items-center justify-center gap-2 rounded-md bg-red-100 px-3 py-2 text-sm text-red-700 hover:bg-red-200 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-64">
        <main className="py-8">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};