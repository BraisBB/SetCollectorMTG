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
        {/* Ruta para About Us */}
        <Route path="/about" element={<Home />} />
        {/* Ruta para cualquier otra URL no definida */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
