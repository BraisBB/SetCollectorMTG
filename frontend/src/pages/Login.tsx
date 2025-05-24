import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../services/authService';
import Header from '../components/Header';
import './styles/Login.css';

interface LocationState {
  message?: string;
}

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Obtener el mensaje de la página anterior (si existe)
  const locationState = location.state as LocationState | null;
  const [successMessage, setSuccessMessage] = useState<string | null>(
    locationState?.message || null
  );

  // Verificar si el usuario ya está autenticado y redirigir al home
  useEffect(() => {
    if (authService.isAuthenticated()) {
      navigate('/');
    }
  }, [navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
    const { name, value } = e.target;
    setter(value);
    
    // Limpiar error del campo cuando el usuario modifica su valor
    if (fieldErrors[name]) {
      const updatedErrors = { ...fieldErrors };
      delete updatedErrors[name];
      setFieldErrors(updatedErrors);
    }
  };

  const validateForm = (): boolean => {
    let isValid = true;
    const newErrors: Record<string, string> = {};
    
    if (!username) {
      newErrors.username = 'Username is required';
      isValid = false;
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
      isValid = false;
    }
    
    setFieldErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccessMessage(null);
    setFieldErrors({});
    
    try {
      const success = await authService.login({ username, password });
      
      if (success) {
        // Almacenar nombre de usuario en localStorage para el componente header
        localStorage.setItem('username', username);
        navigate('/'); // Redirigir a página home en login exitoso
      } else {
        // Mensaje genérico para cualquier error de autenticación
        setError('Invalid username or password');
      }
    } catch (error: unknown) {
      console.error(error);
      
      // Mensaje genérico para cualquier error
      setError('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <Header />
      <div className="login-container">
        <div className="login-card">
          <h2>Login</h2>
          
          {successMessage && (
            <div className="success-message">{successMessage}</div>
          )}
          
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                value={username}
                onChange={(e: any) => handleInputChange(e, setUsername)}
                autoComplete="username"
                disabled={loading}
                className={fieldErrors.username ? 'error-input' : ''}
              />
              {fieldErrors.username && <div className="field-error">{fieldErrors.username}</div>}
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={password}
                onChange={(e: any) => handleInputChange(e, setPassword)}
                autoComplete="current-password"
                disabled={loading}
                className={fieldErrors.password ? 'error-input' : ''}
              />
              {fieldErrors.password && <div className="field-error">{fieldErrors.password}</div>}
            </div>
            
            <button 
              type="submit" 
              className="login-button"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          
          <div className="login-footer">
            <p>Don't have an account? <a href="/register">Register</a></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;