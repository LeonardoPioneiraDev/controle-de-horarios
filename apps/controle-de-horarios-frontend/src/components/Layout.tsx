import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Users, LogOut, Bus, Server, GitCompare, Clock, TrendingUp } from 'lucide-react';

import Header from './Header';
import Sidebar from './Sidebar';
import { canViewUsers, canViewViagens, canViewControleHorarios } from '../types/user.types';

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = React.useState(true);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  };

  const navigation = React.useMemo(() => {
    const items: { name: string; href: string; icon: any }[] = [];
    if (canViewUsers(user?.role)) items.push({ name: 'Usuários', href: '/users', icon: Users });
    if (canViewViagens(user?.role)) {
      items.push({ name: 'Viagens Transdata', href: '/viagens', icon: Bus });
      items.push({ name: 'Viagens Globus', href: '/viagens-globus', icon: Server });
      items.push({ name: 'Comparação', href: '/comparacao-viagens', icon: GitCompare });
      items.push({ name: 'Histórico Comparações', href: '/historico-comparacoes', icon: TrendingUp as any });
    }
    if (canViewControleHorarios(user?.role)) items.push({ name: 'Controle Horários', href: '/controle-horarios', icon: Clock });
    return items;
  }, [user]);

  return (
    <div className="min-h-screen bg-primary-900 flex flex-col">
      <Header
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isSidebarExpanded={isSidebarExpanded}
        handleLogout={handleLogout}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          isSidebarExpanded={isSidebarExpanded}
          setIsSidebarExpanded={setIsSidebarExpanded}
          navigation={navigation}
          handleLogout={handleLogout}
        />

        <main className={`flex-1 overflow-y-auto p-4 bg-primary-800`}>
          <div className="mx-auto max-w-[1600px] w-full rounded-lg shadow-md bg-primary-700 p-4 min-h-[calc(100vh-120px)]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
