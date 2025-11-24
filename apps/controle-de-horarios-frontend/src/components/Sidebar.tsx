import { FC, useEffect, useMemo, useRef } from 'react';
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
  isSidebarExpanded: boolean;
  setIsSidebarExpanded: (expanded: boolean) => void;
  navigation: NavigationItem[];
  handleLogout: () => void;
}

const Sidebar: FC<SidebarProps> = ({ isSidebarExpanded, setIsSidebarExpanded, navigation, handleLogout }) => {
  const location = useLocation();
  const { user } = useAuth();

  const sidebarRef = useRef<HTMLDivElement>(null);
  const envBase = (import.meta as any).env?.VITE_API_BASE_URL?.trim();
  const backendInfo = useMemo(() => {
    const fix = (raw: string) => raw.replace(/^https?:(?!\/)/, (m) => `${m}//`);
    const origin = envBase && envBase.length > 0 ? fix(envBase) : window.location.origin;
    let url: URL;
    try { url = new URL(origin, window.location.origin); } catch { url = new URL(window.location.origin); }
    const isHttps = url.protocol === 'https:';
    const port = url.port || (isHttps ? '443' : '80');
    return { origin: url.origin, port };
  }, [envBase]);



  return (
    <>
      <div
        ref={sidebarRef}
        className={`hidden custom-md:flex flex-col shrink-0 border-r border-gray-200 dark:border-yellow-400/20 bg-white/80 dark:bg-black/60 backdrop-blur-md transition-colors duration-300 ${isSidebarExpanded ? 'custom-md:w-72' : 'custom-md:w-20'}`}
      >
        <div className="flex h-full flex-col">
          {/* Logo and Toggle Button */}
          <div className={`hidden h-16 shrink-0 items-center border-b border-gray-200 dark:border-yellow-400/20 custom-md:flex ${isSidebarExpanded ? 'px-6' : 'justify-center'}`}>
            {isSidebarExpanded ? (
              <h1 className="text-sm font-bold text-gray-900 dark:text-yellow-300">Controle de Horários</h1>
            ) : (
              <img src={logo} alt="Logo" className="h-8 w-8" /> // Compact logo for collapsed state
            )}
            {/* Toggle button for desktop sidebar */}
            <button
              type="button"
              className={`-m-2.5 p-2.5 text-gray-500 dark:text-yellow-300 hover:text-brand-600 dark:hover:text-yellow-200 ${isSidebarExpanded ? 'ml-auto' : 'mx-auto'}`}
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
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={`group flex items-center gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors duration-200 ease-in-out ${isActive
                        ? 'bg-brand-50 text-brand-700 dark:bg-yellow-400 dark:text-gray-900'
                        : 'text-gray-600 hover:text-brand-600 hover:bg-gray-50 dark:text-yellow-300 dark:hover:text-gray-900 dark:hover:bg-yellow-400'
                        }`}
                      onClick={() => { }} // No longer closes mobile sidebar, as this is desktop only
                    >
                      <item.icon
                        className={`h-5 w-5 shrink-0 ${isActive
                          ? 'text-brand-600 dark:text-gray-900'
                          : 'text-gray-400 dark:text-yellow-300 group-hover:text-brand-600 dark:group-hover:text-gray-900'
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
                    <span className="font-medium text-yellow-300"> :{backendInfo.port}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Frontend:</span>
                    <span className="font-medium text-yellow-300">:3000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Versão:</span>
                    <span className="font-medium text-yellow-300">v1.0.0</span>
                  </div>
                </div>
              </div>
            )}
          </nav>

          {/* User menu */}
          <div className="border-t border-gray-200 dark:border-yellow-400/20 p-4">
            <div className="flex items-center gap-x-3 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 dark:bg-yellow-400">
                <span className="text-brand-700 dark:text-gray-900 text-sm font-medium">
                  {user?.firstName?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              {isSidebarExpanded && (
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-yellow-300">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-700 dark:text-yellow-300 capitalize">{user?.role}</p>
                </div>
              )}
            </div>

            {isSidebarExpanded && (
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 rounded-md bg-white border border-gray-200 dark:border-transparent dark:bg-yellow-400 px-3 py-2 text-sm text-gray-700 dark:text-gray-900 hover:bg-gray-50 dark:hover:bg-yellow-300 transition-colors w-full"
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















