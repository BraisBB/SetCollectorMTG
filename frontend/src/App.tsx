import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from './pages/Home.tsx';
import Login from './pages/Login.tsx';
import Register from './pages/Register.tsx';
import Profile from './pages/Profile.tsx';
import Collection from './pages/Collection.tsx';
import DeckEditor from './pages/DeckEditor.tsx';
import Admin from './pages/Admin.tsx';
import authService from "./services/authService.ts";

// Componente para rutas protegidas
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = authService.isAuthenticated();
  
  if (!isAuthenticated) {
    // Redirigir a login si no está autenticado
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Componente para rutas de administración
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = authService.isAuthenticated();
  const isAdmin = authService.isAdmin();
  
  if (!isAuthenticated) {
    // Redirigir a login si no está autenticado
    return <Navigate to="/login" replace />;
  }
  
  if (!isAdmin) {
    // Redirigir a home si está autenticado pero no es admin
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const App: React.FC = () => {
  useEffect(() => {
    // Inicializar el servicio de autenticación al cargar la aplicación
    authService.initAuth();
    
    // Configurar un intervalo para verificar y renovar el token cada 2 minutos
    // Un intervalo más frecuente asegura que nunca te quedes sin token válido
    const tokenRefreshInterval = setInterval(() => {
      if (authService.isAuthenticated()) {
        console.log('Verificando si el token necesita renovación... (estado: ' + 
          (authService.isTokenExpiringSoon() ? 'expira pronto' : 'vigente') + ')');
          
        // Obtener timestamp actual y de expiración para depuración
        const expiresAt = localStorage.getItem('expires_at');
        if (expiresAt) {
          const timeRemaining = parseInt(expiresAt) - Date.now();
          console.log(`Tiempo restante de token: ${Math.floor(timeRemaining / 1000)} segundos`);
        }
        
        authService.refreshTokenIfNeeded()
          .then(refreshed => {
            if (refreshed) {
              console.log('Token renovado automáticamente');
            }
          })
          .catch(error => {
            console.error('Error al renovar el token:', error);
          });
      } else {
        console.log('Sesión no autenticada, no se intenta renovar token.');
      }
    }, 2 * 60 * 1000); // 2 minutos en milisegundos
    
    // Renovar token cuando el usuario regresa a la pestaña después de tenerla inactiva
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && authService.isAuthenticated()) {
        console.log('Usuario regresó a la pestaña, verificando token...');
        authService.refreshTokenIfNeeded()
          .then(refreshed => {
            if (refreshed) {
              console.log('Token renovado al regresar a la pestaña');
            }
          })
          .catch(error => {
            console.error('Error al renovar el token al regresar:', error);
          });
      }
    };
    
    // Agregar event listener para detectar cuando el usuario regresa a la pestaña
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Limpiar recursos cuando el componente se desmonte
    return () => {
      clearInterval(tokenRefreshInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/collection" element={
          <ProtectedRoute>
            <Collection />
          </ProtectedRoute>
        } />
        <Route path="/deck/:deckId" element={
          <ProtectedRoute>
            <DeckEditor />
          </ProtectedRoute>
        } />
        <Route path="/deck/:deckId/edit" element={
          <ProtectedRoute>
            <DeckEditor />
          </ProtectedRoute>
        } />
        {/* Ruta del panel de administración */}
        <Route path="/admin" element={
          <AdminRoute>
            <Admin />
          </AdminRoute>
        } />
        {/* Ruta para About Us */}
        <Route path="/about" element={<Home />} />
        {/* Ruta para cualquier otra URL no definida */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
