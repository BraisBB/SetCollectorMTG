import logo from '../assets/logo.png';
import './Header.css';

const Header = () => {
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
            <a href="/">Home</a>
            <a href="/about">About Us</a>
            <a href="/login">Login</a>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header; 