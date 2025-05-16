import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import authService from '../services/authService';
import api from '../services/apiService';
import { User } from '../services/types';
import './Profile.css';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<User>({
    username: '',
    email: '',
    firstName: '',
    lastName: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [originalProfile, setOriginalProfile] = useState<User | null>(null);

  // Cargar perfil de usuario
  const fetchUserProfile = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const username = localStorage.getItem('username');
      
      if (!username) {
        throw new Error('Username not found');
      }

      const userData = await api.getUserByUsername(username);
      console.log('Profile loaded:', userData);
      setProfile(userData);
      setOriginalProfile({...userData});
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Failed to load user profile. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Verificar autenticación y cargar perfil
  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }
    fetchUserProfile();
  }, [navigate, fetchUserProfile]);

  // Manejar cambios en los campos del formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));

    // Limpiar error del campo cuando el usuario escribe
    if (fieldErrors[name]) {
      const updatedErrors = { ...fieldErrors };
      delete updatedErrors[name];
      setFieldErrors(updatedErrors);
    }
  };

  // Validar formulario antes de enviar
  const validateForm = (): boolean => {
    let isValid = true;
    const newErrors: Record<string, string> = {};

    if (!profile.email) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/^\S+@\S+\.\S+$/.test(profile.email)) {
      newErrors.email = 'Invalid email format';
      isValid = false;
    }

    if (!profile.firstName) {
      newErrors.firstName = 'First name is required';
      isValid = false;
    }

    if (!profile.lastName) {
      newErrors.lastName = 'Last name is required';
      isValid = false;
    }

    setFieldErrors(newErrors);
    return isValid;
  };

  // Activar modo edición
  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Evitar cualquier comportamiento por defecto
    console.log('Entering edit mode');
    setIsEditing(true);
    setSuccess(null);
    setError(null);
  };

  // Cancelar edición
  const handleCancelClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Evitar cualquier comportamiento por defecto
    console.log('Canceling edit');
    if (originalProfile) {
      setProfile({...originalProfile});
    }
    setIsEditing(false);
    setFieldErrors({});
  };

  // Enviar formulario para guardar cambios
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Evitar el envío del formulario
    console.log('Attempting to save changes');

    if (!validateForm()) {
      return;
    }

    setSaveLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await api.updateUserProfile(profile.username, {
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName
      });
      
      console.log('Profile updated:', result);
      setSuccess('Profile updated successfully!');
      setOriginalProfile({...profile});
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <Header />
        <div className="profile-container">
          <div className="profile-card">
            <h2>My Profile</h2>
            <div className="loading">Loading profile...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !isEditing) {
    return (
      <div className="profile-page">
        <Header />
        <div className="profile-container">
          <div className="profile-card">
            <h2>My Profile</h2>
            <div className="error-message">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <Header />
      <div className="profile-container">
        <div className="profile-card">
          <h2>My Profile</h2>
          
          {success && <div className="success-message">{success}</div>}
          {error && <div className="error-message">{error}</div>}

          {/* Botón de edición fuera del formulario */}
          {!isEditing && (
            <div className="profile-actions centered">
              <button 
                type="button" 
                className="edit-button"
                onClick={handleEditClick}
              >
                Edit Profile
              </button>
            </div>
          )}

          {/* Datos del perfil */}
          <div className="profile-data">
            <div className="profile-field">
              <div className="field-label">Username:</div>
              <div className="field-value">{profile.username}</div>
            </div>
            
            <div className="profile-field">
              <div className="field-label">Email:</div>
              <div className="field-value">{profile.email || '-'}</div>
            </div>
            
            <div className="profile-field">
              <div className="field-label">First Name:</div>
              <div className="field-value">{profile.firstName || '-'}</div>
            </div>
            
            <div className="profile-field">
              <div className="field-label">Last Name:</div>
              <div className="field-value">{profile.lastName || '-'}</div>
            </div>
          </div>

          {/* Formulario de edición */}
          {isEditing && (
            <form onSubmit={handleSubmit} className="edit-form">
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={profile.username}
                  disabled={true}
                  className="disabled-input"
                />
                <small>Username cannot be changed</small>
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={profile.email || ''}
                  onChange={handleInputChange}
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
                  value={profile.firstName || ''}
                  onChange={handleInputChange}
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
                  value={profile.lastName || ''}
                  onChange={handleInputChange}
                  className={fieldErrors.lastName ? 'error-input' : ''}
                />
                {fieldErrors.lastName && <div className="field-error">{fieldErrors.lastName}</div>}
              </div>

              <div className="profile-actions">
                <button 
                  type="submit" 
                  className="save-button"
                  disabled={saveLoading}
                >
                  {saveLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={handleCancelClick}
                  disabled={saveLoading}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
