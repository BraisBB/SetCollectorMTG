import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import Header from '../components/Header';
import './Register.css';

interface RegisterData {
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Limpiar errores cuando el usuario modifica el campo
    if (fieldErrors[name]) {
      const updatedErrors = { ...fieldErrors };
      delete updatedErrors[name];
      setFieldErrors(updatedErrors);
    }
  };

  const validateForm = (): boolean => {
    let isValid = true;
    const newErrors: Record<string, string> = {};
    
    if (!formData.username) {
      newErrors.username = 'Username is required';
      isValid = false;
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
      isValid = false;
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
      isValid = false;
    }
    
    if (formData.password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
    setFieldErrors({});
    
    try {
      const success = await authService.register({
        username: formData.username,
        password: formData.password,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName
      });
      
      if (success) {
        navigate('/', { state: { message: 'Registration successful! Welcome!' } });
      } else {
        setError('Registration failed. Please try again.');
      }
    } catch (error: any) {
      console.error('Error during registration:', error);
      
      // Manejo mejorado de errores de validación del backend
      if (error.response && error.response.data) {
        const errorData = error.response.data;
        
        // Si hay errores de validación específicos del backend, asignarlos a campos específicos
        if (errorData.errors && typeof errorData.errors === 'object') {
          const backendErrors: Record<string, string> = {};
          
          // Mapear los errores del backend a nuestros campos
          Object.entries(errorData.errors).forEach(([field, message]) => {
            backendErrors[field] = message as string;
          });
          
          setFieldErrors(backendErrors);
          setError('Please fix the validation errors below.');
        } else if (errorData.message) {
          setError(`Registration failed: ${errorData.message}`);
        } else {
          setError('Registration failed. Please try again.');
        }
      } else if (error.message) {
        // Si httpClient ya formateó el mensaje con las validaciones
        setError(error.message);
      } else {
        setError('Registration failed. Please try again.');
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
          <h2>Register</h2>
          
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username">Username *</label>
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
            
            <div className="form-group">
              <label htmlFor="email">Email *</label>
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
            
            <div className="form-group">
              <label htmlFor="password">Password *</label>
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
              <label htmlFor="confirmPassword">Confirm Password *</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              {loading ? 'Registering...' : 'Register'}
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