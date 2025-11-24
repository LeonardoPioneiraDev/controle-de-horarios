// src/routes/PublicRoutes.tsx
import React from 'react';
import { Route } from 'react-router-dom';
import { Login } from '../pages/auth/Login';
import { ResetPassword } from '../pages/auth/ResetPassword';
import SetPassword from '../pages/auth/SetPassword';
import Instructions from '../pages/auth/Instructions';

export const PublicRoutes = () => (
    <>
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/reset-password/confirm" element={<SetPassword />} />
        <Route path="/first-login" element={<SetPassword />} />
        <Route path="/instrucoes" element={<Instructions />} />
    </>
);
