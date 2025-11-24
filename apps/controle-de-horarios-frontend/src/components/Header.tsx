import { FC } from 'react';
import { Menu, X, LogOut, Sun, Moon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import logo from './logo.png';
import { Link, Location } from 'react-router-dom';

interface NavigationItem {
  name: string;
  href: string;
  icon: FC<any>;
}

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isSidebarExpanded: boolean;
  handleLogout: () => void;
  navigation: NavigationItem[];
  location: Location;
}

const Header: FC<HeaderProps> = ({ sidebarOpen, setSidebarOpen, isSidebarExpanded, handleLogout, navigation, location }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-gray-200 dark:border-yellow-400/20 bg-white/80 dark:bg-black/60 px-4 backdrop-blur-md sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="h-full flex items-center justify-between sm:grid sm:grid-cols-3">
        {/* Left: Logo + Empresa */}
        <div className="flex items-center justify-start gap-2">
          <img src={logo} alt="Viação Pioneira" className="h-8 w-8 rounded-full ring-1 ring-gray-200 dark:ring-yellow-400/30 bg-white" />
          <span className="hidden text-sm font-semibold text-gray-700 dark:text-yellow-300 sm:block sm:text-base">Viação Pioneira Ltda</span>
        </div>

        {/* Center: Nome do Sistema */}
        <div className="flex-1 text-center sm:col-span-1">
          <h1 className="truncate text-base font-bold text-gray-900 dark:text-yellow-300 sm:text-lg md:text-xl">Controle de Horários</h1>
        </div>

        {/* Right: Toggle + Ações */}
        <div className="flex items-center justify-end gap-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-yellow-400/10 transition-colors"
            aria-label="Alternar tema"
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5 text-brand-500" />
            ) : (
              <Moon className="h-5 w-5 text-gray-600" />
            )}
          </button>

          {/* Toggle Mobile */}
          <div className="custom-md:hidden">
            {!sidebarOpen ? (
              <button
                type="button"
                className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700 dark:text-yellow-300 hover:text-brand-600 dark:hover:text-yellow-200"
                onClick={() => setSidebarOpen(true)}
              >
                <span className="sr-only">Abrir menu</span>
                <Menu className="h-6 w-6" aria-hidden="true" />
              </button>
            ) : (
              <button
                type="button"
                className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700 dark:text-yellow-300 hover:text-brand-600 dark:hover:text-yellow-200"
                onClick={() => setSidebarOpen(false)}
              >
                <span className="sr-only">Fechar menu</span>
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Ações quando sidebar colapsada */}
          {(!sidebarOpen && !isSidebarExpanded) && (
            <div className="hidden custom-md:flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 dark:bg-yellow-400">
                <span className="text-sm font-medium text-brand-700 dark:text-gray-900">
                  {user?.firstName?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 rounded-md bg-white border border-gray-200 dark:border-transparent dark:bg-yellow-400 px-3 py-2 text-sm text-gray-700 dark:text-gray-900 transition-colors hover:bg-gray-50 dark:hover:bg-yellow-300"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 top-16 z-40 flex flex-col bg-white dark:bg-black custom-md:hidden pointer-events-auto transition-colors duration-300">
          <nav className="flex-1 flex flex-col p-8 bg-white dark:bg-black transition-colors duration-300">
            <ul className="flex flex-col gap-y-6">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={`group flex items-center gap-x-3 rounded-md p-4 text-base leading-6 font-semibold transition-colors duration-200 ease-in-out ${isActive
                        ? 'bg-brand-50 text-brand-700 dark:bg-yellow-400 dark:text-gray-900'
                        : 'text-gray-600 hover:text-brand-600 hover:bg-gray-50 dark:text-yellow-300 dark:hover:text-gray-900 dark:hover:bg-yellow-400'
                        }`}
                      onClick={() => setSidebarOpen(false)} // Close mobile menu on navigation
                    >
                      <item.icon
                        className={`h-5 w-5 shrink-0 ${isActive
                          ? 'text-brand-600 dark:text-gray-900'
                          : 'text-gray-400 dark:text-yellow-300 group-hover:text-brand-600 dark:group-hover:text-gray-900'
                          }`}
                      />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          {/* User menu from Sidebar moved here for mobile */}
          <div className="border-t border-gray-100 dark:border-yellow-400/20 p-4 bg-gray-50 dark:bg-black transition-colors duration-300">
            <div className="flex items-center gap-x-3 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 dark:bg-yellow-400">
                <span className="text-brand-700 dark:text-gray-900 text-sm font-medium">
                  {user?.firstName?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-yellow-300">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-700 dark:text-yellow-300 capitalize">{user?.role}</p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 rounded-md bg-white border border-gray-200 dark:border-transparent dark:bg-yellow-400 px-3 py-2 text-sm text-gray-700 dark:text-gray-900 hover:bg-gray-50 dark:hover:bg-yellow-300 transition-colors w-full"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;