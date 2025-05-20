import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import authService from "../services/authService";
import "./Header.css";

const Header: React.FC = () => {
  const navigate = useNavigate();
  const isAuthenticated = authService.isAuthenticated();
  const isAdmin = authService.isAdmin();
  const [username, setUsername] = useState<string>("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    // Get username from localStorage or other source when authenticated
    if (isAuthenticated) {
      // Try to get the username from localStorage
      const storedUsername = localStorage.getItem('username');
      if (storedUsername) {
        setUsername(storedUsername);
      }
    }
  }, [isAuthenticated]);

  const handleLogout = async () => {
    await authService.logout();
    setDropdownOpen(false);
    navigate("/login");
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  return (
    <header>
      <div className="container">
        <div className="header-left">
          <div className="logo-container">
            <img src={logo} alt="SetCollectorMTG Logo" />
            <h1 className="site-title">SetCollectorMTG</h1>
          </div>
        </div>
        <nav>
          <div className="nav-links">
            <Link to="/">Home</Link>
            {isAuthenticated && !isAdmin && (
              <Link to="/collection" className="collection-link">My Collection</Link>
            )}
            {isAuthenticated && isAdmin && (
              <Link to="/admin" className="collection-link">Admin Panel</Link>
            )}
            {isAuthenticated ? (
              <div className="user-menu">
                <button className="username-button" onClick={toggleDropdown}>
                  {username || "User"}
                </button>
                {dropdownOpen && (
                  <div className="dropdown-menu">
                    <Link to="/profile" onClick={() => setDropdownOpen(false)}>My Profile</Link>
                    {!isAdmin && (
                      <Link to="/collection" onClick={() => setDropdownOpen(false)}>My Collection</Link>
                    )}
                    {isAdmin && (
                      <Link to="/admin" onClick={() => setDropdownOpen(false)} style={{color: '#ff8f00', fontWeight: 500}}>Admin Panel</Link>
                    )}
                    <button className="dropdown-item" onClick={handleLogout}>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login">Login</Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
