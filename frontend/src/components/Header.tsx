import React from 'react';
import './Header.css'; // Importa los estilos CSS globales

const Header: React.FC = () => {
    return (
        <header className="header">
            <div className="logo">
                <h1>SetCollectorMTG</h1>
            </div>
            <nav className="nav">
                <ul className="navList">
                    <li className="navItem">
                        <a href="/" className="navLink">Inicio</a>
                    </li>
                    <li className="navItem">
                        <a href="/about" className="navLink">Acerca de</a>
                    </li>
                    <li className="navItem">
                        <a href="/contact" className="navLink">Contacto</a>
                    </li>
                </ul>
            </nav>
        </header>
    );
};

export default Header;