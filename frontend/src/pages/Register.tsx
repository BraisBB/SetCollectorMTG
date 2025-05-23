import React, { useState, useEffect } from 'react';
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

interface PasswordRequirements {
  length: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
  special: boolean;
  noSpaces: boolean;
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
  const [passwordRequirements, setPasswordRequirements] = useState<PasswordRequirements>({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
    noSpaces: false
  });
  const [realtimeValidation, setRealtimeValidation] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  // Función para validar requisitos de contraseña en tiempo real
  const validatePasswordRequirements = (password: string): PasswordRequirements => {
    return {
      length: password.length >= 8 && password.length <= 16,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@?./#$%]/.test(password),
      noSpaces: !password.includes(' ')
    };
  };

  // Función para validar nombres en tiempo real
  const validateNameField = (value: string, fieldName: string): string | null => {
    if (value.length > 0 && !value.charAt(0).match(/[A-Z]/)) {
      return `${fieldName} must start with a capital letter`;
    }
    return null;
  };

  // Efecto para validar contraseña en tiempo real
  useEffect(() => {
    const requirements = validatePasswordRequirements(formData.password);
    setPasswordRequirements(requirements);
  }, [formData.password]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Validación en tiempo real para nombres
    if (name === 'firstName' || name === 'lastName') {
      const fieldDisplayName = name === 'firstName' ? 'First name' : 'Last name';
      const validationError = validateNameField(value, fieldDisplayName);
      
      setRealtimeValidation(prev => ({
        ...prev,
        [name]: validationError || ''
      }));
    }
    
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
    } else {
      const requirements = validatePasswordRequirements(formData.password);
      if (!Object.values(requirements).every(req => req)) {
        newErrors.password = 'Password does not meet all requirements';
        isValid = false;
      }
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
    
    // Validar nombres
    if (formData.firstName) {
      const firstNameError = validateNameField(formData.firstName, 'First name');
      if (firstNameError) {
        newErrors.firstName = firstNameError;
        isValid = false;
      }
    }
    
    if (formData.lastName) {
      const lastNameError = validateNameField(formData.lastName, 'Last name');
      if (lastNameError) {
        newErrors.lastName = lastNameError;
        isValid = false;
      }
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
                className={fieldErrors.firstName || realtimeValidation.firstName ? 'error-input' : ''}
              />
              {fieldErrors.firstName && <div className="field-error">{fieldErrors.firstName}</div>}
              {!fieldErrors.firstName && realtimeValidation.firstName && 
                <div className="field-error">{realtimeValidation.firstName}</div>}
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
                className={fieldErrors.lastName || realtimeValidation.lastName ? 'error-input' : ''}
              />
              {fieldErrors.lastName && <div className="field-error">{fieldErrors.lastName}</div>}
              {!fieldErrors.lastName && realtimeValidation.lastName && 
                <div className="field-error">{realtimeValidation.lastName}</div>}
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
                <div className="password-requirements">
                  <div className="requirements-title">Password Requirements:</div>
                  <ul>
                    <li className={passwordRequirements.length ? 'met' : ''}>
                      Between 8 and 16 characters
                    </li>
                    <li className={passwordRequirements.uppercase ? 'met' : ''}>
                      At least one uppercase letter
                    </li>
                    <li className={passwordRequirements.lowercase ? 'met' : ''}>
                      At least one lowercase letter
                    </li>
                    <li className={passwordRequirements.number ? 'met' : ''}>
                      At least one number
                    </li>
                    <li className={passwordRequirements.special ? 'met' : ''}>
                      At least one special character (!@?./#$%)
                    </li>
                    <li className={passwordRequirements.noSpaces ? 'met' : ''}>
                      No spaces allowed
                    </li>
                  </ul>
                </div>
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