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
  details?: string;
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
    
    if (fieldErrors[name]) {
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
        
        console.log('Backend response:', responseData);
        
        if (responseStatus === 500 && 
            responseData.details && 
            responseData.details.toLowerCase().includes('username already exists')) {
          setError('');
          setFieldErrors(prev => ({
            ...prev,
            username: 'This username is already taken. Please choose a different one.'
          }));
          const usernameInput = document.getElementById('username');
          if (usernameInput) {
            usernameInput.focus();
            usernameInput.classList.add('error-input');
          }
          return;
        }
        
        if (responseStatus === 400) {
          if (responseData.errors) {
            const processedErrors: Record<string, string> = {};
            
            Object.entries(responseData.errors).forEach(([field, message]) => {
              let translatedMessage = message;
              
              if (field === 'password') {
                if (message.includes('uppercase')) {
                  translatedMessage = 'Password must contain at least one uppercase letter';
                } else if (message.includes('lowercase')) {
                  translatedMessage = 'Password must contain at least one lowercase letter';
                } else if (message.includes('number')) {
                  translatedMessage = 'Password must contain at least one number';
                } else if (message.includes('special')) {
                  translatedMessage = 'Password must contain at least one special character (!@?./#$%)';
                } else if (message.includes('spaces')) {
                  translatedMessage = 'Password cannot contain spaces';
                } else if (message.includes('length')) {
                  translatedMessage = 'Password must be between 8 and 16 characters';
                }
              }
              
              processedErrors[field] = translatedMessage;
            });
            
            setFieldErrors(processedErrors);
            setError('Please correct the highlighted fields');
          } else if (responseData.message) {
            setError(responseData.message);
          }
        } else if (responseStatus === 409) {
          const message = responseData.message || 'Username or email already exists';
          setError('');
          
          if (typeof message === 'string') {
            if (message.toLowerCase().includes('username')) {
              setFieldErrors(prev => ({
                ...prev,
                username: 'This username is already taken. Please choose a different one.'
              }));
              const usernameInput = document.getElementById('username');
              if (usernameInput) {
                usernameInput.focus();
                usernameInput.classList.add('error-input');
              }
            } else if (message.toLowerCase().includes('email')) {
              setFieldErrors(prev => ({
                ...prev,
                email: 'This email is already registered. Please use a different email address.'
              }));
            }
          }
        } else {
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