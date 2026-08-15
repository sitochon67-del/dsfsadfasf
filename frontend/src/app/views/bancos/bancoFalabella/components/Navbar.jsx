import React, { useState, useEffect } from 'react';
import '../css/Navbar.css';

// Iconos SVG inline
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <path d="m21 21-4.3-4.3"></path>
  </svg>
);

const ChevronDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6"></path>
  </svg>
);

const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" x2="21" y1="6" y2="6"></line>
    <line x1="3" x2="21" y1="12" y2="12"></line>
    <line x1="3" x2="21" y1="18" y2="18"></line>
  </svg>
);

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18"></path>
    <path d="m6 6 12 12"></path>
  </svg>
);

// Logo oficial de Banco Falabella
const BancoFalabellaLogo = () => (
  <svg width="45" height="45" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Hoja verde */}
    <ellipse cx="20" cy="28" rx="14" ry="16" fill="#7AB317" transform="rotate(-15 20 28)"/>
    {/* Hoja amarilla */}
    <ellipse cx="26" cy="16" rx="10" ry="12" fill="#C4D600" transform="rotate(-30 26 16)"/>
  </svg>
);

// Logo con texto para desktop
const BancoFalabellaLogoFull = () => (
  <div className="logo-full">
    <svg width="40" height="40" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="20" cy="28" rx="14" ry="16" fill="#7AB317" transform="rotate(-15 20 28)"/>
      <ellipse cx="26" cy="16" rx="10" ry="12" fill="#C4D600" transform="rotate(-30 26 16)"/>
    </svg>
    <div className="logo-text">
      <span>Banco</span>
      <span>Falabella</span>
    </div>
  </div>
);

const navLinks = [
  'CUENTAS',
  'TARJETAS CMR',
  'INVERSIÓN',
  'CRÉDITOS',
  'BENEFICIOS',
  'CMR PUNTOS',
  'BRE-B',
  'CANALES',
  'EDUCACIÓN FINANCIERA',
  'EMPRESA',
  'SEGUROS',
];

const documentTypes = ['Cédula Ciudadanía', 'Cédula Extranjería', 'Pasaporte'];

function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [documentType, setDocumentType] = useState('Cédula Ciudadanía');
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`navbar ${isScrolled ? 'navbar-scrolled' : ''}`}>
      {/* Top Bar */}
      <div className="navbar-top">
        <div className="navbar-top-container">
          {/* Left: Menu + Logo (Mobile) / Logo (Desktop) */}
          <div className="navbar-left">
            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
              className="mobile-menu-btn"
            >
              <MenuIcon />
            </button>
            
            {/* Logo */}
            <div className="navbar-logo">
              <div className="logo-mobile">
                <BancoFalabellaLogo />
              </div>
              <div className="logo-desktop">
                <BancoFalabellaLogoFull />
              </div>
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="navbar-actions">
            {/* Search Icon (Mobile) / Search Box (Desktop) */}
            <button className="search-icon-btn">
              <SearchIcon />
            </button>
            
            {/* Desktop Search Box */}
            <div className="search-box-desktop">
              <span>Buscar</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7AB317" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.3-4.3"></path>
              </svg>
            </div>

            {/* Hazte Cliente (Desktop only) */}
            <button className="btn-hazte-cliente">Hazte Cliente</button>

            {/* Banca en línea */}
            <button 
              className="btn-banca-linea"
              onClick={() => setIsLoginOpen(!isLoginOpen)}
            >
              Banca en línea
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Login Form (Full width) */}
      {isLoginOpen && (
        <div className="mobile-login-overlay">
          <div className="mobile-login-form">
            <button 
              className="mobile-login-close"
              onClick={() => setIsLoginOpen(false)}
            >
              CERRAR <XIcon />
            </button>
            
            {/* Document Type Dropdown */}
            <div className="mobile-login-field">
              <div 
                className="mobile-login-select"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <span>{documentType}</span>
                <ChevronDownIcon />
              </div>
              {showDropdown && (
                <div className="mobile-login-dropdown">
                  {documentTypes.map((type) => (
                    <div 
                      key={type}
                      className="mobile-login-option"
                      onClick={() => {
                        setDocumentType(type);
                        setShowDropdown(false);
                      }}
                    >
                      {type}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Document Number */}
            <div className="mobile-login-field">
              <input 
                type="text" 
                placeholder="Cédula de Ciudadanía"
                className="mobile-login-input"
              />
            </div>

            {/* Password */}
            <div className="mobile-login-field">
              <input 
                type="password" 
                placeholder="Clave Internet"
                className="mobile-login-input"
              />
            </div>

            {/* Submit Button */}
            <button className="mobile-login-submit">
              INGRESAR
            </button>

            {/* Recover Link */}
            <a href="#" className="mobile-login-recover">
              Crea o recupera tu Clave Internet
            </a>
          </div>
        </div>
      )}

      {/* Desktop Login Dropdown */}
      {isLoginOpen && (
        <div className="desktop-login-dropdown">
          <div className="desktop-login-container">
            <button 
              className="desktop-login-close"
              onClick={() => setIsLoginOpen(false)}
            >
              <XIcon /> Cerrar
            </button>
            <div className="desktop-login-form">
              <div className="desktop-login-field">
                <div 
                  className="desktop-login-select"
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  <span>{documentType}</span>
                  <ChevronDownIcon />
                </div>
                {showDropdown && (
                  <div className="desktop-login-options">
                    {documentTypes.map((type) => (
                      <div 
                        key={type}
                        className="desktop-login-option"
                        onClick={() => {
                          setDocumentType(type);
                          setShowDropdown(false);
                        }}
                      >
                        {type}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <input 
                type="text" 
                placeholder="Cédula de Ciudadanía"
                className="desktop-login-input"
              />
              <input 
                type="password" 
                placeholder="Clave Internet"
                className="desktop-login-input"
              />
              <button className="desktop-login-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </button>
            </div>
            <a href="#" className="desktop-login-recover">
              Crea o recupera tu Clave Internet
            </a>
          </div>
        </div>
      )}

      {/* Desktop Navigation Menu */}
      <nav className="navbar-nav">
        <div className="navbar-nav-container">
          {navLinks.map((link, index) => (
            <React.Fragment key={link}>
              <a href="#" className="nav-link">{link}</a>
              {index < navLinks.length - 1 && <span className="nav-separator">|</span>}
            </React.Fragment>
          ))}
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="mobile-menu">
          <div className="mobile-menu-content">
            {navLinks.map((link) => (
              <a key={link} href="#" className="mobile-nav-link">{link}</a>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
