// src/App.tsx
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { FullscreenProvider } from './contexts/FullscreenContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AppRoutes } from './routes/AppRoutes';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 2,
      staleTime: 30_000,
    },
    mutations: {
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <FullscreenProvider>
            <Router
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
              }}
            >
              <AppRoutes />
              <ToastContainer />
            </Router>
          </FullscreenProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

