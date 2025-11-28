import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useFullscreen } from '../contexts/FullscreenContext';
import { Users, LogOut, Bus, Server, GitCompare, Clock, TrendingUp } from 'lucide-react';

import Header from './Header';
import Sidebar from './Sidebar';
import { canViewUsers, canViewViagens, canViewControleHorarios, canViewBcoAlteracoes } from '../types/user.types';

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const { isFullscreen } = useFullscreen();
  const navigate = useNavigate();
  const location = useLocation();
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
    if (canViewBcoAlteracoes(user?.role)) items.push({ name: 'BCO Alterações', href: '/bco-alteracoes', icon: Server });
    return items;
  }, [user]);

  // Fullscreen mode: render only the content without header/sidebar
  if (isFullscreen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-neutral-900">
        <Outlet />
      </div>
    );
  }

  // Normal mode: render with header and sidebar
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-neutral-900 transition-colors duration-500">
      <Header
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isSidebarExpanded={isSidebarExpanded}
        handleLogout={handleLogout}
        navigation={navigation}
        location={location}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          isSidebarExpanded={isSidebarExpanded}
          setIsSidebarExpanded={setIsSidebarExpanded}
          navigation={navigation}
          handleLogout={handleLogout}
        />

        <main className={`flex-1 overflow-y-auto p-4 custom-md:ml-0 transition-all duration-300`}>
          <div className="mx-auto max-w-[1800px] w-full rounded-lg shadow-md bg-white/80 dark:bg-gray-900/95 backdrop-blur-lg p-4 border border-white/20 dark:border-yellow-500/20 transition-all duration-300">            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;




