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
  code?: string;
  details?: string;
  timestamp?: string;
  path?: string;
  status?: number;
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
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
    spaces: true
  });
  const navigate = useNavigate();

  const validatePassword = (password: string) => {
    setPasswordRequirements({
      length: password.length >= 8 && password.length <= 16,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@?./#$%]/.test(password),
      spaces: !password.includes(' ')
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    if (name === 'password') {
      validatePassword(value);
    }
    
    // Validación en tiempo real para firstName
    if (name === 'firstName' && value && value.length > 0) {
      if (!/^[A-Z]/.test(value)) {
        setFieldErrors(prev => ({
          ...prev,
          firstName: 'First name must start with a capital letter'
        }));
      } else {
        // Limpiar el error si se corrige
        if (fieldErrors.firstName) {
          const updatedErrors = { ...fieldErrors };
          delete updatedErrors.firstName;
          setFieldErrors(updatedErrors);
        }
      }
    }
    
    // Validación en tiempo real para lastName
    if (name === 'lastName' && value && value.length > 0) {
      if (!/^[A-Z]/.test(value)) {
        setFieldErrors(prev => ({
          ...prev,
          lastName: 'Last name must start with a capital letter'
        }));
      } else {
        // Limpiar el error si se corrige
        if (fieldErrors.lastName) {
          const updatedErrors = { ...fieldErrors };
          delete updatedErrors.lastName;
          setFieldErrors(updatedErrors);
        }
      }
    }
    
    // Limpiar el error si se modifica un campo con error
    if (fieldErrors[name] && name !== 'firstName' && name !== 'lastName') {
      const updatedErrors = { ...fieldErrors };
      delete updatedErrors[name];
      setFieldErrors(updatedErrors);
    }
  };

  const validateForm = (): boolean => {
    if (formData.password !== confirmPassword) {
      setFieldErrors({
        ...fieldErrors,
        confirmPassword: 'Passwords do not match'
      });
      return false;
    }
    
    return true;
  };

  const handleFieldError = (field: string, message: string) => {
    console.log(`Estableciendo error para campo ${field}:`, message);
    setFieldErrors(prev => {
      const newErrors = {
        ...prev,
        [field]: message
      };
      console.log("Nuevos errores:", newErrors);
      return newErrors;
    });
    
    const inputField = document.getElementById(field);
    if (inputField) {
      inputField.focus();
      inputField.classList.add('error-input');
    } else {
      console.warn(`No se encontró el elemento con ID ${field}`);
    }
  };

  const handleValidationErrors = (errors: Record<string, string>) => {
    // Limpiar errores previos
    setError('');
    setFieldErrors({});
    
    // Procesar cada error
    Object.entries(errors).forEach(([field, message]) => {
      handleFieldError(field, message);
    });
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
      const response = await axios.post('http://localhost:8080/users', formData);
      
      if (response.status === 201) {
        navigate('/login', { state: { message: 'Registration successful! Please log in.' } });
      }
    } catch (error: unknown) {
      console.error('Error during registration:', error);
      
      if (axios.isAxiosError(error) && error.response) {
        const responseData = error.response.data as ErrorResponse;
        const responseStatus = error.response.status;
        
        console.log('Backend response status:', responseStatus);
        console.log('Backend response data:', responseData);
        
        // Limpiar errores previos
        setError('');
        
        // Crear un objeto para almacenar todos los errores de campo
        const newFieldErrors: Record<string, string> = {};
        
        // CASO 1: Errores de validación estándar (400 Bad Request)
        if (responseStatus === 400) {
          // Si la respuesta contiene un mapa de errores por campo
          if (responseData.errors && typeof responseData.errors === 'object') {
            Object.entries(responseData.errors).forEach(([field, message]) => {
              // Normalizar nombres de campo (camelCase para frontend)
              let normalizedField = field;
              if (field.toLowerCase() === 'firstname') normalizedField = 'firstName';
              if (field.toLowerCase() === 'lastname') normalizedField = 'lastName';
              
              // Guardar el mensaje de error para este campo
              newFieldErrors[normalizedField] = message as string;
            });
          }
        }
        
        // CASO 2: Error de usuario duplicado (500 o 409)
        if ((responseStatus === 500 && responseData.details?.includes('Username already exists')) ||
            (responseStatus === 409 && responseData.message?.includes('Username already exists'))) {
          newFieldErrors.username = 'This username is already taken. Please choose a different one.';
        }
        
        // CASO 3: Error de email duplicado
        if ((responseStatus === 500 && responseData.details?.includes('Email already in use')) ||
            (responseStatus === 409 && responseData.message?.includes('Email already in use'))) {
          newFieldErrors.email = 'This email is already registered. Please use a different email address.';
        }
        
        // CASO 4: Buscar errores específicos en el mensaje o detalles (para firstName y lastName)
        const fullResponseText = JSON.stringify(responseData).toLowerCase();
        
        // Buscar errores relacionados con firstName
        if (fullResponseText.includes('first name') && fullResponseText.includes('capital letter')) {
          newFieldErrors.firstName = 'First name must start with a capital letter';
        }
        
        // Buscar errores relacionados con lastName
        if (fullResponseText.includes('last name') && fullResponseText.includes('capital letter')) {
          newFieldErrors.lastName = 'Last name must start with a capital letter';
        }
        
        // Actualizar el estado con todos los errores encontrados
        if (Object.keys(newFieldErrors).length > 0) {
          console.log('Setting field errors:', newFieldErrors);
          setFieldErrors(newFieldErrors);
          
          // Enfocar el primer campo con error
          const firstErrorField = Object.keys(newFieldErrors)[0];
          const inputField = document.getElementById(firstErrorField);
          if (inputField) {
            setTimeout(() => {
              inputField.focus();
              inputField.classList.add('error-input');
            }, 100);
          }
        } else {
          // Si no se identificó ningún error específico pero hay un mensaje general
          setError(responseData.message || 'Registration failed. Please check your information and try again.');
        }
      } else {
        // Error no relacionado con Axios (probablemente de red)
        setError('Connection error. Please check your internet connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Log errors cada vez que cambian
  React.useEffect(() => {
    console.log('Estado actual de fieldErrors:', fieldErrors);
  }, [fieldErrors]);

  return (
    <div className="register-page">
      <Header />
      <div className="register-container">
        <div className="register-card">
          <h2>Create Account</h2>
          
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
                aria-invalid={!!fieldErrors.username}
                aria-describedby={fieldErrors.username ? 'username-error' : undefined}
              />
              {fieldErrors.username && (
                <div className="field-error" id="username-error" role="alert">
                  <i className="fas fa-exclamation-circle"></i> {fieldErrors.username}
                </div>
              )}
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
                  aria-invalid={!!fieldErrors.firstName}
                  aria-describedby={fieldErrors.firstName ? 'firstName-error' : undefined}
                />
                {fieldErrors.firstName && (
                  <div 
                    className="field-error" 
                    id="firstName-error" 
                    role="alert"
                    data-testid="firstName-error"
                  >
                    <i className="fas fa-exclamation-circle"></i> {fieldErrors.firstName}
                  </div>
                )}
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
                  aria-invalid={!!fieldErrors.lastName}
                  aria-describedby={fieldErrors.lastName ? 'lastName-error' : undefined}
                />
                {fieldErrors.lastName && (
                  <div 
                    className="field-error" 
                    id="lastName-error" 
                    role="alert"
                    data-testid="lastName-error"
                  >
                    <i className="fas fa-exclamation-circle"></i> {fieldErrors.lastName}
                  </div>
                )}
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
              
              <div className="password-requirements">
                <p className="requirements-title">Password requirements:</p>
                <ul>
                  <li className={passwordRequirements.length ? 'met' : 'unmet'}>
                    8-16 characters
                  </li>
                  <li className={passwordRequirements.uppercase ? 'met' : 'unmet'}>
                    At least one uppercase letter
                  </li>
                  <li className={passwordRequirements.lowercase ? 'met' : 'unmet'}>
                    At least one lowercase letter
                  </li>
                  <li className={passwordRequirements.number ? 'met' : 'unmet'}>
                    At least one number
                  </li>
                  <li className={passwordRequirements.special ? 'met' : 'unmet'}>
                    At least one special character (!@?./#$%)
                  </li>
                  <li className={passwordRequirements.spaces ? 'met' : 'unmet'}>
                    No spaces allowed
                  </li>
                </ul>
              </div>
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