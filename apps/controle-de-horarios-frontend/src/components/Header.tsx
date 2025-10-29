import { FC } from 'react';
import { Menu, X, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import logo from './logo.png'
 
interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isSidebarExpanded: boolean;
  handleLogout: () => void;
}

const Header: FC<HeaderProps> = ({ sidebarOpen, setSidebarOpen, isSidebarExpanded, handleLogout }) => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-primary-800 shadow-md py-4 px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
      {/* Left Section: Logo and Company Name */}
      <div className="flex items-center gap-2">
        {/* Placeholder for Logo */}
        <img src={logo} alt="Logo" className="h-8 w-8" /> {/* Replace with actual logo path */}
        <span className="text-secondary-100 text-lg font-semibold hidden sm:block">Viacao Pioneira Ltda</span>
      </div>

      {/* Center Section: System Name (Mobile & Desktop) */}
      <div className="absolute left-1/2 transform -translate-x-1/2">
        <h1 className="text-xl font-bold text-accent-500 md:text-2xl">Controle de Horários</h1>
      </div>

      {/* Right Section: Mobile Toggle / User Info & Logout */}
      <div className="flex items-center gap-4">
        {/* Mobile Sidebar Toggle/Close */}
        <div className="lg:hidden">
          {!sidebarOpen ? (
            <button
              type="button"
              className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-secondary-100"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-secondary-100"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sr-only">Close sidebar</span>
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Desktop User Info & Logout (Conditional) */}
        {(!sidebarOpen && !isSidebarExpanded) && (
          <div className="hidden lg:flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-500">
              <span className="text-sm font-medium text-primary-900">
                {user?.firstName?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 rounded-md bg-accent-600 px-3 py-2 text-sm text-primary-900 hover:bg-accent-500 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;