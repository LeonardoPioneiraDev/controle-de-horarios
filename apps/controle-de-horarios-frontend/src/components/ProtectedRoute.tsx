import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole, isAtLeast } from '../types/user.types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  minRole?: UserRole;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, minRole, allowedRoles }) => {
  const { user, loading } = useAuth();

  console.log('✅ ProtectedRoute:', { hasUser: !!user, loading, minRole, allowedRoles });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    console.log('🔒 Não autenticado, redirecionando para login');
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user.role)) {
      console.log('🚫 Role não permitida (allowedRoles), redirecionando');
      return <Navigate to="/dashboard" replace />;
    }
  }

  if (minRole) {
    if (!isAtLeast(user.role, minRole)) {
      console.log('🚫 Role abaixo do mínimo (minRole), redirecionando');
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

