import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Layout } from '../components/Layout';
import { Login } from '../pages/auth/Login';
import Instructions from '../pages/auth/Instructions';
import { ResetPassword } from '../pages/auth/ResetPassword';
import SetPassword from '../pages/auth/SetPassword';
import Dashboard from '../pages/dashboard/Dashboard';
import { Users } from '../pages/users/Users';
import { UserCreate } from '../pages/users/UserCreate';
import { UserEdit } from '../pages/users/UserEdit';
import { Logs } from '../pages/logs/Logs';
import { Viagens } from '../pages/viagens/Viagens';
import { ViagensGlobus } from '../pages/viagens/ViagensGlobus';
import ComparacaoViagens from '../pages/viagens/ComparacaoViagens';
import HistoricoComparacoes from '../pages/viagens/HistoricoComparacoes';
import { ControleHorariosPage } from '../pages/controle-horarios/ControleHorariosPage';
import { UserRole } from '../types/user.types';

export const AppRoutes: React.FC = () => {
    return (
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

                {/* Logs */}
                <Route path="logs" element={<Logs />} />
            </Route>

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
};
