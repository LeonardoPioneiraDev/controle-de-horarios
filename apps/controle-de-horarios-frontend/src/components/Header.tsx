import { FC } from 'react';
import { Menu, X, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
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

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-yellow-400/20 bg-black/60 px-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="h-full flex items-center justify-between sm:grid sm:grid-cols-3">
        {/* Left: Logo + Empresa */}
        <div className="flex items-center justify-start gap-2">
          <img src={logo} alt="Viação Pioneira" className="h-8 w-8 rounded-full ring-1 ring-yellow-400/30" />
          <span className="hidden text-sm font-semibold text-yellow-300 sm:block sm:text-base">Viação Pioneira Ltda</span>
        </div>

        {/* Center: Nome do Sistema */}
        <div className="flex-1 text-center sm:col-span-1">
          <h1 className="truncate text-base font-bold text-yellow-300 sm:text-lg md:text-xl">Controle de Horários</h1>
        </div>

        {/* Right: Toggle + Ações */}
        <div className="flex items-center justify-end gap-3">
          {/* Toggle Mobile */}
          <div className="custom-md:hidden">
            {!sidebarOpen ? (
              <button
                type="button"
                className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-yellow-300 hover:text-yellow-200"
                onClick={() => setSidebarOpen(true)}
              >
                <span className="sr-only">Abrir menu</span>
                <Menu className="h-6 w-6" aria-hidden="true" />
              </button>
            ) : (
              <button
                type="button"
                className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-yellow-300 hover:text-yellow-200"
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
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-400">
                <span className="text-sm font-medium text-gray-900">
                  {user?.firstName?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 rounded-md bg-yellow-400 px-3 py-2 text-sm text-gray-900 transition-colors hover:bg-yellow-300"
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
        <div className="fixed inset-0 top-16 z-40 flex flex-col bg-black custom-md:hidden pointer-events-auto">
                    <nav className="flex-1 flex flex-col p-8 bg-black">
                      <ul className="flex flex-col gap-y-6">
                        {navigation.map((item) => {
                          const isActive = location.pathname === item.href;
                          return (
                            <li key={item.name}>
                              <Link
                                to={item.href}
                                className={`group flex items-center gap-x-3 rounded-md p-4 text-base leading-6 font-semibold transition-colors duration-200 ease-in-out ${
                                  isActive
                                    ? 'bg-yellow-400 text-gray-900'
                                    : 'text-yellow-300 hover:text-gray-900 hover:bg-yellow-400'
                                }`}
                                onClick={() => setSidebarOpen(false)} // Close mobile menu on navigation
                              >
                                <item.icon
                                  className={`h-5 w-5 shrink-0 ${
                                    isActive ? 'text-gray-900' : 'text-yellow-300 group-hover:text-gray-900'
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
                    <div className="border-t border-yellow-400/20 p-4 bg-black">
            <div className="flex items-center gap-x-3 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-400">
                <span className="text-gray-900 text-sm font-medium">
                  {user?.firstName?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-300">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-yellow-300 capitalize">{user?.role}</p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 rounded-md bg-yellow-400 px-3 py-2 text-sm text-gray-900 hover:bg-yellow-300 transition-colors w-full"
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