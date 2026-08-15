import React from 'react';
import '../css/Footer.css';

// Iconos SVG inline
const FacebookIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
  </svg>
);

const TwitterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
  </svg>
);

const InstagramIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
  </svg>
);

const YoutubeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"></path>
    <path d="m10 15 5-3-5-3z"></path>
  </svg>
);

const LinkedinIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
    <rect width="4" height="12" x="2" y="9"></rect>
    <circle cx="4" cy="4" r="2"></circle>
  </svg>
);

const footerLinks = {
  'NUESTRO BANCO': ['Quiénes somos', 'Trabaja con nosotros', 'Sala de prensa', 'Proveedores', 'Fundación'],
  'SERVICIO AL CLIENTE': ['Contáctanos', 'Preguntas frecuentes', 'Tasas y tarifas', 'Formularios', 'Reclamos'],
  'PRODUCTOS': ['Cuentas', 'Tarjetas de crédito', 'Créditos', 'Inversiones', 'Seguros'],
  'CANALES': ['Oficinas', 'Cajeros', 'Banca en Línea', 'App móvil', 'BreeB'],
};

const socialLinks = [
  { Icon: FacebookIcon, href: '#', label: 'Facebook' },
  { Icon: TwitterIcon, href: '#', label: 'Twitter' },
  { Icon: InstagramIcon, href: '#', label: 'Instagram' },
  { Icon: YoutubeIcon, href: '#', label: 'YouTube' },
  { Icon: LinkedinIcon, href: '#', label: 'LinkedIn' },
];

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-grid">
          {/* Logo */}
          <div className="footer-logo-section">
            <div className="footer-logo">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="logo-icon">
                <path d="M14 2C7.373 2 2 7.373 2 14s5.373 12 12 12 12-5.373 12-12S20.627 2 14 2zm0 22c-5.514 0-10-4.486-10-10S8.486 4 14 4s10 4.486 10 10-4.486 10-10 10z" fill="currentColor"/>
              </svg>
              <span className="footer-logo-text">Banco Falabella</span>
            </div>
            <p className="footer-description">Tu banco de confianza para todas tus necesidades financieras.</p>
            <div className="social-links">
              {socialLinks.map(({ Icon, href, label }) => (
                <a key={label} href={href} aria-label={label} className="social-link"><Icon /></a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title} className="footer-links-section">
              <h3 className="footer-links-title">{title}</h3>
              <ul className="footer-links-list">
                {links.map((link) => (
                  <li key={link}><a href="#" className="footer-link">{link}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="footer-bottom">
          <p className="footer-copyright">© 2024 Banco Falabella. Todos los derechos reservados.</p>
          <div className="footer-legal">
            <a href="#" className="footer-legal-link">Términos y condiciones</a>
            <a href="#" className="footer-legal-link">Política de privacidad</a>
            <a href="#" className="footer-legal-link">Mapa del sitio</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
