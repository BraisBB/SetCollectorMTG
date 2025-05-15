import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import './Register.css';

interface RegisterData {
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface ErrorResponse {
  message: string;
  errors?: Record<string, string>;
}

const Register: React.FC = () => {
  const [formData, setFormData] = useState<RegisterData>({
    username: '',
    password: '',
    email: '',
    firstName: '',
    lastName: ''
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Limpiar error del campo cuando el usuario modifica su valor
    if (fieldErrors[name]) {
      const updatedErrors = { ...fieldErrors };
      delete updatedErrors[name];
      setFieldErrors(updatedErrors);
    }
  };

  const validateForm = (): boolean => {
    // Sólo verificamos que las contraseñas coincidan ya que el resto de validaciones
    // se harán en el backend
    if (formData.password !== confirmPassword) {
      setFieldErrors({
        ...fieldErrors,
        confirmPassword: 'Passwords do not match'
      });
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError('');
    setFieldErrors({});
    
    try {
      // La URL correcta según el controlador en el backend
      const response = await axios.post('http://localhost:8080/users', formData);
      
      if (response.status === 201) {
        // Registro exitoso, redirigir a la página de inicio de sesión
        navigate('/login', { state: { message: 'Registration successful! Please log in.' } });
      }
    } catch (error: unknown) {
      console.error('Error during registration:', error);
      
      if (axios.isAxiosError(error) && error.response) {
        // Ya verificamos que error.response existe, podemos usar non-null assertion
        const responseData = error.response!.data as ErrorResponse;
        const responseStatus = error.response!.status;
        
        console.log('Backend response:', responseData);
        
        // Errores de validación (400 Bad Request)
        if (responseStatus === 400) {
          if (responseData.errors) {
            // Errores de validación específicos por campo
            setFieldErrors(responseData.errors);
            setError('Please correct the highlighted fields');
          } else if (responseData.message) {
            // Mensaje general de error
            setError(responseData.message);
            
            // Si el mensaje contiene información sobre un campo específico, intentamos extraerla
            const usernameRegex = /username\s+(\w+)\s+is\s+already\s+taken/i;
            const emailRegex = /email\s+(\w+@[\w.]+)\s+is\s+already\s+registered/i;
            
            const usernameMatch = typeof responseData.message === 'string' 
              ? responseData.message.match(usernameRegex) 
              : null;
              
            const emailMatch = typeof responseData.message === 'string'
              ? responseData.message.match(emailRegex)
              : null;
            
            if (usernameMatch) {
              setFieldErrors({
                ...fieldErrors,
                username: `Username "${usernameMatch[1]}" is already taken`
              });
            } else if (emailMatch) {
              setFieldErrors({
                ...fieldErrors,
                email: `Email "${emailMatch[1]}" is already registered`
              });
            }
          }
        } 
        // Conflicto (409)
        else if (responseStatus === 409) {
          const message = responseData.message || 'Username or email already exists';
          setError(message);
          
          // Intentar determinar cuál campo es el que está en conflicto
          if (typeof message === 'string') {
            if (message.toLowerCase().includes('username')) {
              setFieldErrors({
                ...fieldErrors,
                username: 'Username already exists'
              });
            } else if (message.toLowerCase().includes('email')) {
              setFieldErrors({
                ...fieldErrors,
                email: 'Email already exists'
              });
            }
          }
        }
        // Otros códigos de error
        else {
          setError(responseData.message || 'Registration failed. Please try again.');
        }
      } else {
        setError('An error occurred. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <Header />
      <div className="register-container">
        <div className="register-card">
          <h2>Create Account</h2>
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                disabled={loading}
                className={fieldErrors.username ? 'error-input' : ''}
              />
              {fieldErrors.username && <div className="field-error">{fieldErrors.username}</div>}
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  disabled={loading}
                  className={fieldErrors.firstName ? 'error-input' : ''}
                />
                {fieldErrors.firstName && <div className="field-error">{fieldErrors.firstName}</div>}
              </div>
              
              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  disabled={loading}
                  className={fieldErrors.lastName ? 'error-input' : ''}
                />
                {fieldErrors.lastName && <div className="field-error">{fieldErrors.lastName}</div>}
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={loading}
                className={fieldErrors.email ? 'error-input' : ''}
              />
              {fieldErrors.email && <div className="field-error">{fieldErrors.email}</div>}
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                disabled={loading}
                className={fieldErrors.password ? 'error-input' : ''}
              />
              {fieldErrors.password && <div className="field-error">{fieldErrors.password}</div>}
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (fieldErrors.confirmPassword) {
                    const updatedErrors = { ...fieldErrors };
                    delete updatedErrors.confirmPassword;
                    setFieldErrors(updatedErrors);
                  }
                }}
                disabled={loading}
                className={fieldErrors.confirmPassword ? 'error-input' : ''}
              />
              {fieldErrors.confirmPassword && <div className="field-error">{fieldErrors.confirmPassword}</div>}
            </div>
            
            <button 
              type="submit" 
              className="register-button"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Register'}
            </button>
          </form>
          
          <div className="register-footer">
            <p>Already have an account? <a href="/login">Login</a></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register; 