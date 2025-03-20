import React from 'react';
import './Footer.css'; // Importa los estilos CSS globales

const Footer: React.FC = () => {
    return (
        <footer className="footer">
            <div className="footerContent">
                <div className="footerSection">
                    <h3>Enlaces útiles</h3>
                    <ul className="footerLinks">
                        <li><a href="/">Inicio</a></li>
                        <li><a href="/about">Acerca de</a></li>
                        <li><a href="/contact">Contacto</a></li>
                    </ul>
                </div>
                <div className="footerSection">
                    <h3>Redes sociales</h3>
                    <ul className="footerLinks">
                        <li><a href="https://twitter.com" target="_blank" rel="noopener noreferrer">Twitter</a></li>
                        <li><a href="https://facebook.com" target="_blank" rel="noopener noreferrer">Facebook</a></li>
                        <li><a href="https://instagram.com" target="_blank" rel="noopener noreferrer">Instagram</a></li>
                    </ul>
                </div>
                <div className="footerSection">
                    <h3>Legal</h3>
                    <ul className="footerLinks">
                        <li><a href="/privacy">Política de privacidad</a></li>
                        <li><a href="/terms">Términos y condiciones</a></li>
                    </ul>
                </div>
            </div>
            <div className="footerBottom">
                <p>&copy; {new Date().getFullYear()} SetCollectorMTG. Todos los derechos reservados.</p>
            </div>
        </footer>
    );
};

export default Footer;