// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import Instructions from './pages/Instructions';
import { ResetPassword } from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import { Users } from './pages/Users';
import { UserCreate } from './pages/UserCreate';
import { UserEdit } from './pages/UserEdit';
import { Logs } from './pages/Logs';
import { Viagens } from './pages/Viagens';
import { ViagensGlobus } from './pages/ViagensGlobus';
import ComparacaoViagens from './pages/ComparacaoViagens';
import HistoricoComparacoes from './pages/HistoricoComparacoes';
import { ControleHorariosPage } from './features/controle-horarios/ControleHorariosPage'; // ✅ IMPORTAÇÃO CORRIGIDA

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
          <Route path="/instrucoes" element={<Instructions />} />
          
          {/* Protected Routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="users/new" element={<UserCreate />} />
            <Route path="users/:id/edit" element={<UserEdit />} />
            <Route path="logs" element={<Logs />} />
            <Route path="viagens" element={<Viagens />} />
            <Route path="viagens-globus" element={<ViagensGlobus />} />
            <Route path="comparacao-viagens" element={<ComparacaoViagens />} />
            <Route path="historico-comparacoes" element={<HistoricoComparacoes />} />
            <Route path="controle-horarios" element={<ControleHorariosPage />} /> {/* ✅ COMPONENTE CORRIGIDO */}
          </Route>
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

