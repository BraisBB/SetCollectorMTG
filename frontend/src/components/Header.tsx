import React from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import authService from "../services/authService";
import "./Header.css";

const Header: React.FC = () => {
  const navigate = useNavigate();
  const isAuthenticated = authService.isAuthenticated();

  const handleLogout = async () => {
    await authService.logout();
    navigate("/login");
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
            <Link to="/about">About Us</Link>
            
            {isAuthenticated ? (
              <>
                <Link to="/profile">My Profile</Link>
                <button className="logout-button" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login">Login</Link>
                <Link to="/register" className="register-link">
                  Register
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
