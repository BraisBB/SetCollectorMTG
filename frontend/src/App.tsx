import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from './pages/Home.tsx';
import Login from './pages/Login.tsx';
import Register from './pages/Register.tsx';
import Profile from './pages/Profile.tsx';
import Collection from './pages/Collection.tsx';
import DeckEditor from './pages/DeckEditor.tsx';
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

const App: React.FC = () => {
  useEffect(() => {
    // Inicializar el servicio de autenticación al cargar la aplicación
    authService.initAuth();
    
    // Configurar un intervalo para verificar y renovar el token cada 4 minutos
    // Esto asegura que renovamos el token antes de que expire (si es de 5 minutos)
    const tokenRefreshInterval = setInterval(() => {
      if (authService.isAuthenticated()) {
        console.log('Verificando si el token necesita renovación...');
        authService.refreshTokenIfNeeded()
          .then(refreshed => {
            if (refreshed) {
              console.log('Token renovado automáticamente');
            }
          })
          .catch(error => {
            console.error('Error al renovar el token:', error);
          });
      }
    }, 4 * 60 * 1000); // 4 minutos en milisegundos
    
    // Limpiar el intervalo cuando el componente se desmonte
    return () => {
      clearInterval(tokenRefreshInterval);
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
        {/* Ruta para About Us */}
        <Route path="/about" element={<Home />} />
        {/* Ruta para cualquier otra URL no definida */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
