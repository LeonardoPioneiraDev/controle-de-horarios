import { FC, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Users, LogOut, Settings, Home, Bus, Server, GitCompare, Clock, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import logo from './logo.png'

interface NavigationItem {
  name: string;
  href: string;
  icon: FC<any>;
}

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isSidebarExpanded: boolean;
  setIsSidebarExpanded: (expanded: boolean) => void;
  navigation: NavigationItem[];
  handleLogout: () => void;
}

const Sidebar: FC<SidebarProps> = ({ sidebarOpen, setSidebarOpen, isSidebarExpanded, setIsSidebarExpanded, navigation, handleLogout }) => {
  const location = useLocation();
  const { user } = useAuth();

  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const clickHandler = ({ target }: MouseEvent) => {
      if (!sidebarRef.current) return;
      if (!sidebarOpen || sidebarRef.current.contains(target as Node)) return;
      setSidebarOpen(false);
    };
    document.addEventListener('click', clickHandler);
    return () => document.removeEventListener('click', clickHandler);
  });

  useEffect(() => {
    const keyHandler = ({ keyCode }: KeyboardEvent) => {
      if (!sidebarOpen || keyCode !== 27) return;
      setSidebarOpen(false);
    };
    document.addEventListener('keydown', keyHandler);
    return () => document.removeEventListener('keydown', keyHandler);
  });

  return (
    <>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      <div
        ref={sidebarRef}
        className={`fixed top-16 bottom-0 left-0 z-50 bg-black/70 backdrop-blur shadow-2xl transform transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64'
        } ${isSidebarExpanded ? 'lg:w-64' : 'lg:w-20'} lg:translate-x-0 lg:static lg:inset-y-0`}
      >
        <div className="flex h-full flex-col">
          {/* Logo and Toggle Button */}
          <div className={`flex h-16 shrink-0 items-center border-b border-yellow-400/20 ${isSidebarExpanded ? 'px-6' : 'justify-center'}`}>
            {isSidebarExpanded ? (
              <h1 className="text-sm font-bold text-yellow-300">Controle de Horários</h1>
            ) : (
              <img src={logo} alt="Logo" className="h-8 w-8" /> // Compact logo for collapsed state
            )}
            {/* Toggle button for desktop sidebar */}
            <button
              type="button"
              className={`-m-2.5 p-2.5 text-yellow-300 ${isSidebarExpanded ? 'ml-auto' : 'mx-auto'}`}
              onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
            >
              <span className="sr-only">Toggle sidebar</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                {isSidebarExpanded ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 4.5l7.5 7.5-7.5 7.5m6-15l7.5 7.5-7.5 7.5" />
                )}
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col px-6 py-4">
            <ul className="flex flex-1 flex-col gap-y-2">
              
              {([...navigation, { name: 'Histórico Comparações', href: '/historico-comparacoes', icon: TrendingUp }]).map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={`group flex items-center gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors duration-200 ease-in-out ${
                        isActive
                          ? 'bg-yellow-400 text-gray-900'
                          : 'text-yellow-300 hover:text-gray-900 hover:bg-yellow-400'
                      }`}
                      onClick={() => setSidebarOpen(false)} // Close sidebar on navigation
                    >
                      <item.icon
                        className={`h-5 w-5 shrink-0 ${
                          isActive ? 'text-gray-900' : 'text-yellow-300 group-hover:text-gray-900'
                        }`}
                      />
                      {isSidebarExpanded && item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* ✅ SEÇÃO DE INFORMAÇÕES DO SISTEMA */}
            {false && (
              <div className="mt-auto pt-4 border-t border-yellow-400/20">
                <div className="text-xs text-yellow-300 space-y-1">
                  <div className="flex justify-between">
                    <span>Ambiente:</span>
                    <span className="font-medium text-yellow-300">Development</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Backend:</span>
                    <span className="font-medium text-yellow-300">:3335</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Frontend:</span>
                    <span className="font-medium text-yellow-300">:3000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Versão:</span>
                    <span className="font-medium text-yellow-300">v2.1</span>
                  </div>
                </div>
              </div>
            )}
          </nav>

          {/* User menu */}
          <div className="border-t border-yellow-400/20 p-4">
            <div className="flex items-center gap-x-3 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-400">
                <span className="text-gray-900 text-sm font-medium">
                  {user?.firstName?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              {isSidebarExpanded && (
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-300">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-yellow-300 capitalize">{user?.role}</p>
                </div>
              )}
            </div>
            
            {isSidebarExpanded && (
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 rounded-md bg-yellow-400 px-3 py-2 text-sm text-gray-900 hover:bg-yellow-300 transition-colors w-full"
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;









