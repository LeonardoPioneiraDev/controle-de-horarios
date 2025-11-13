// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import Instructions from './pages/Instructions';
import { ResetPassword } from './pages/ResetPassword';
import SetPassword from './pages/SetPassword';
import Dashboard from './pages/Dashboard';
import { Users } from './pages/Users';
import { UserCreate } from './pages/UserCreate';
import { UserEdit } from './pages/UserEdit';
import { Logs } from './pages/Logs';
import { Viagens } from './pages/Viagens';
import { ViagensGlobus } from './pages/ViagensGlobus';
import ComparacaoViagens from './pages/ComparacaoViagens';
import HistoricoComparacoes from './pages/HistoricoComparacoes';
import { ControleHorariosPage } from './features/controle-horarios/ControleHorariosPage';
import { UserRole } from './types/user.types';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <AuthProvider>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/reset-password/confirm" element={<SetPassword />} />
          <Route path="/first-login" element={<SetPassword />} />
          <Route path="/instrucoes" element={<Instructions />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />

            {/* Users - apenas administrador */}
            <Route
              path="users"
              element={
                <ProtectedRoute allowedRoles={[UserRole.ADMINISTRADOR]}>
                  <Users />
                </ProtectedRoute>
              }
            />
            <Route
              path="users/new"
              element={
                <ProtectedRoute allowedRoles={[UserRole.ADMINISTRADOR]}>
                  <UserCreate />
                </ProtectedRoute>
              }
            />
            <Route
              path="users/:id/edit"
              element={
                <ProtectedRoute allowedRoles={[UserRole.ADMINISTRADOR]}>
                  <UserEdit />
                </ProtectedRoute>
              }
            />

            {/* Viagens e Comparações - analista ou superior */}
            <Route
              path="viagens"
              element={
                <ProtectedRoute minRole={UserRole.ANALISTA}>
                  <Viagens />
                </ProtectedRoute>
              }
            />
            <Route
              path="viagens-globus"
              element={
                <ProtectedRoute minRole={UserRole.ANALISTA}>
                  <ViagensGlobus />
                </ProtectedRoute>
              }
            />
            <Route
              path="comparacao-viagens"
              element={
                <ProtectedRoute minRole={UserRole.ANALISTA}>
                  <ComparacaoViagens />
                </ProtectedRoute>
              }
            />
            <Route
              path="historico-comparacoes"
              element={
                <ProtectedRoute minRole={UserRole.ANALISTA}>
                  <HistoricoComparacoes />
                </ProtectedRoute>
              }
            />

            {/* Controle de Horários - operador ou superior */}
            <Route
              path="controle-horarios"
              element={
                <ProtectedRoute minRole={UserRole.OPERADOR}>
                  <ControleHorariosPage />
                </ProtectedRoute>
              }
            />

            {/* Logs - manter como estava (se precisar, ajustamos depois) */}
            <Route path="logs" element={<Logs />} />
          </Route>

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        <ToastContainer />
      </Router>
    </AuthProvider>
  );
}

export default App;

