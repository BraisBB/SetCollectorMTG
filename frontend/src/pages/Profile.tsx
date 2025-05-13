import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import authService from '../services/authService';
import api, { User } from '../services/apiService';
import './Profile.css';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<User>({
    username: '',
    email: '',
    firstName: '',
    lastName: ''
  });
  const [isEditing, setIsEditing] = useState(true); // Inicialmente en modo edición
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Check if user is authenticated
  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }

    // Load user profile
    fetchUserProfile();
  }, [navigate]);

  const fetchUserProfile = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get username from localStorage
      const username = localStorage.getItem('username');
      
      if (!username) {
        throw new Error('Username not found');
      }

      try {
        // Intentar obtener datos del backend
        const userData = await api.getUserProfile(username);
        setProfile(userData);
      } catch (apiError) {
        console.error('Error fetching user profile from API:', apiError);
        
        // Si hay un error de API, usamos datos de ejemplo como fallback
        setProfile({
          username: username,
          email: `${username.toLowerCase()}@example.com`,
          firstName: username,
          lastName: 'User'
        });
      }
    } catch (err) {
      console.error('Error in profile setup:', err);
      setError('Failed to load user profile. Please try again.');
      
      // Si hay un error general, usamos datos mínimos como fallback
      const username = localStorage.getItem('username') || 'User';
      setProfile({
        username: username,
        email: `${username.toLowerCase()}@example.com`,
        firstName: username,
        lastName: 'User'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear field error when user types
    if (fieldErrors[name]) {
      const updatedErrors = { ...fieldErrors };
      delete updatedErrors[name];
      setFieldErrors(updatedErrors);
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Update user profile in backend
      await api.updateUserProfile(profile.username, {
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName
      });
      
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-page">
      <Header />
      <div className="profile-container">
        <div className="profile-card">
          <h2>My Profile</h2>

          {loading && !isEditing ? (
            <div className="loading">Loading profile...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : (
            <>
              {success && <div className="success-message">{success}</div>}

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="username">Username</label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={profile.username}
                    disabled={true} // Username cannot be changed
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
                    value={profile.email}
                    onChange={handleInputChange}
                    disabled={!isEditing || loading}
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
                    value={profile.firstName}
                    onChange={handleInputChange}
                    disabled={!isEditing || loading}
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
                    value={profile.lastName}
                    onChange={handleInputChange}
                    disabled={!isEditing || loading}
                    className={fieldErrors.lastName ? 'error-input' : ''}
                  />
                  {fieldErrors.lastName && <div className="field-error">{fieldErrors.lastName}</div>}
                </div>

                <div className="profile-actions">
                  {isEditing ? (
                    <>
                      <button 
                        type="submit" 
                        className="save-button"
                        disabled={loading}
                      >
                        {loading ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button 
                        type="button" 
                        className="cancel-button"
                        onClick={() => {
                          setIsEditing(false);
                          fetchUserProfile(); // Reset to original values
                          setFieldErrors({});
                        }}
                        disabled={loading}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button 
                      type="button" 
                      className="edit-button"
                      onClick={() => setIsEditing(true)}
                    >
                      Edit Profile
                    </button>
                  )}
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
