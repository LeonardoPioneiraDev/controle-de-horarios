import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Users, LogOut, Settings, Home, Bus, Server, GitCompare, Clock } from 'lucide-react';

import Header from './Header';
import Sidebar from './Sidebar';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Usuários', href: '/users', icon: Users },
  { name: 'Viagens Transdata', href: '/viagens', icon: Bus },
  { name: 'Viagens Globus', href: '/viagens-globus', icon: Server },
  { name: 'Comparação', href: '/comparacao-viagens', icon: GitCompare },
  { name: 'Controle Horários', href: '/controle-horarios', icon: Clock },
];

export const Layout: React.FC = () => {
  const { logout } = useAuth();
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

        <main className={`flex-1 overflow-y-auto p-6 bg-primary-800 ${
          isSidebarExpanded ? 'lg:ml-64' : 'lg:ml-20'
        }`}> {/* Adjust margin for sidebar */}
          <div className="mx-auto max-w-7xl rounded-lg shadow-md bg-primary-700 p-6 min-h-[calc(100vh-120px)]"> {/* Adjust padding and add card-like styling */}
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
