import { FC } from 'react';
import { Menu, X, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import logo from './logo.png';

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isSidebarExpanded: boolean;
  handleLogout: () => void;
}

const Header: FC<HeaderProps> = ({ sidebarOpen, setSidebarOpen, isSidebarExpanded, handleLogout }) => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 backdrop-blur bg-black/60 border-b border-yellow-400/20 px-4 sm:px-6 lg:px-8 h-16">
      <div className="h-full flex items-center justify-between">
        {/* Left: Logo + Empresa */}
        <div className="flex items-center gap-2">
          <img src={logo} alt="Viação Pioneira" className="h-8 w-8 rounded-full ring-1 ring-yellow-400/30" />
          <span className="text-yellow-300 text-sm sm:text-base font-semibold hidden sm:block">Viação Pioneira Ltda</span>
        </div>

        {/* Center: Nome do Sistema */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <h1 className="text-base sm:text-lg md:text-xl font-bold text-yellow-300">Controle de Horários</h1>
        </div>

        {/* Right: Toggle + Ações */}
        <div className="flex items-center gap-3">
          {/* Toggle Mobile */}
          <div className="lg:hidden">
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
            <div className="hidden lg:flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-400">
                <span className="text-gray-900 text-sm font-medium">
                  {user?.firstName?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 rounded-md bg-yellow-400 px-3 py-2 text-sm text-gray-900 hover:bg-yellow-300 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

