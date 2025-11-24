// src/routes/ProtectedRoutes.tsx
import React from 'react';
import { Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Layout } from '../components/Layout';
import Dashboard from '../pages/dashboard/Dashboard';
import { Users } from '../pages/users/Users';
import { UserCreate } from '../pages/users/UserCreate';
import { UserEdit } from '../pages/users/UserEdit';
import { Viagens } from '../pages/viagens/Viagens';
import { ViagensGlobus } from '../pages/viagens/ViagensGlobus';
import ComparacaoViagens from '../pages/viagens/ComparacaoViagens';
import HistoricoComparacoes from '../pages/viagens/HistoricoComparacoes';
import { ControleHorariosPage } from '../pages/controle-horarios/ControleHorariosPage';
import { Logs } from '../pages/logs/Logs';
import { UserRole } from '../types/user.types';

export const ProtectedRoutesWrapper = () => (
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
);
