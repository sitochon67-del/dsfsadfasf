import React, { useState } from 'react';
import './css/App.css';
import './css/index.css';
// Logo Banco de Bogotá
const LogoBancoBogota = () => (
  <svg className="logo-banco" viewBox="0 0 200 50" fill="none" xmlns="http://www.w3.org/2000/svg">
    <text x="0" y="32" fill="#0047ba" fontSize="24" fontWeight="700" fontFamily="Open Sans, sans-serif">
      Banco de Bogotá
    </text>
    <circle cx="175" cy="22" r="18" fill="#ff6b35"/>
    <path d="M175 8 L180 18 L191 18 L182 26 L185 37 L175 30 L165 37 L168 26 L159 18 L170 18 Z" fill="white"/>
  </svg>
);

// Icono de ojo para mostrar/ocultar contraseña
const EyeIcon = ({ visible, onClick }) => (
  <button type="button" className="eye-button" onClick={onClick} tabIndex="-1">
    {visible ? (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6c757d" strokeWidth="2">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    ) : (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6c757d" strokeWidth="2">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
      </svg>
    )}
  </button>
);

// Icono X para cerrar alerta
const CloseIcon = ({ onClick }) => (
  <button type="button" className="close-alert-btn" onClick={onClick}>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6c757d" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  </button>
);

// Icono flecha derecha
const ArrowRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

// Icono flecha izquierda
const ArrowLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0047ba" strokeWidth="2">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);

// Icono flecha derecha (azul)
const ArrowRightBlueIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0047ba" strokeWidth="2">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

// Iconos de servicios
const SecurityIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0047ba" strokeWidth="1.5">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <circle cx="12" cy="11" r="2"/>
    <path d="M12 13v3"/>
  </svg>
);

const ProductIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0047ba" strokeWidth="1.5">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <line x1="12" y1="8" x2="12" y2="16"/>
    <line x1="8" y1="12" x2="16" y2="12"/>
  </svg>
);

const SupportIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0047ba" strokeWidth="1.5">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
  </svg>
);

const SearchIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0047ba" strokeWidth="1.5">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const TicketIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0047ba" strokeWidth="1.5">
    <rect x="2" y="6" width="20" height="12" rx="2"/>
    <path d="M6 6v12"/>
    <path d="M18 6v12"/>
    <circle cx="6" cy="12" r="2"/>
    <circle cx="18" cy="12" r="2"/>
  </svg>
);

function App() {
  const [activeTab, setActiveTab] = useState('clave'); // 'clave' o 'tarjeta'
  const [showAlert, setShowAlert] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showCardPassword, setShowCardPassword] = useState(false);
  const [showLastDigits, setShowLastDigits] = useState(false);
  const [documentNumber, setDocumentNumber] = useState('');
  const [password, setPassword] = useState('');
  const [cardPassword, setCardPassword] = useState('');
  const [lastDigits, setLastDigits] = useState('');
  const [carouselIndex, setCarouselIndex] = useState(0);

  const isFormValid = activeTab === 'clave' 
    ? documentNumber && password 
    : documentNumber && cardPassword && lastDigits;

  const servicios = [
    { icon: <SecurityIcon />, label: 'Configuración de seguridad' },
    { icon: <ProductIcon />, label: 'Solicitar un producto' },
    { icon: <SupportIcon />, label: 'Atención al cliente' },
    { icon: <SearchIcon />, label: 'Buscar cajeros y oficinas' },
    { icon: <TicketIcon />, label: 'Solicitar un turno digital' },
  ];

  const visibleServicios = servicios.slice(carouselIndex, carouselIndex + 3);

  const nextCarousel = () => {
    if (carouselIndex < servicios.length - 3) {
      setCarouselIndex(carouselIndex + 1);
    }
  };

  const prevCarousel = () => {
    if (carouselIndex > 0) {
      setCarouselIndex(carouselIndex - 1);
    }
  };

  return (
    <div className="app">
      <div className="container">
        {/* Header */}
        <header className="header">
          <LogoBancoBogota />
        </header>

        {/* Main Content */}
        <main className="main-content">
          {/* Left Panel - Login Form */}
          <div className="login-panel">
            <h1 className="welcome-title">Bienvenido a tu Banca Virtual</h1>

            {/* Banner de ayuda */}
            <div className="help-banner">
              <div className="help-banner-image">
                <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=face" alt="Mujer con celular" />
              </div>
              <div className="help-banner-text">
                <p>¿Nunca has ingresado a Banca Virtual?</p>
                <a href="#" className="help-link">Aquí te decimos cómo hacerlo <ArrowRightIcon /></a>
              </div>
            </div>

            {/* Tabs */}
            <div className="tabs">
              <button 
                className={`tab ${activeTab === 'clave' ? 'active' : ''}`}
                onClick={() => setActiveTab('clave')}
              >
                Clave segura
              </button>
              <button 
                className={`tab ${activeTab === 'tarjeta' ? 'active' : ''}`}
                onClick={() => setActiveTab('tarjeta')}
              >
                Tarjeta débito
              </button>
            </div>

            {/* Alerta informativa */}
            {showAlert && (
              <div className="info-alert">
                <p>
                  Estás ingresando con tu Clave Segura. Selecciona 'Tarjeta Débito' para cambiar el tipo de ingreso.
                </p>
                <CloseIcon onClick={() => setShowAlert(false)} />
              </div>
            )}

            {/* Formulario */}
            <form className="login-form" onSubmit={(e) => e.preventDefault()}>
              {/* Identificación */}
              <div className="form-group">
                <label className="form-label">Identificación</label>
                <div className="identification-row">
                  <div className="document-type">
                    <select className="document-select">
                      <option value="cc">C.C. ...</option>
                      <option value="ce">C.E.</option>
                      <option value="pasaporte">Pasaporte</option>
                    </select>
                    <svg className="select-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0047ba" strokeWidth="2">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </div>
                  <input 
                    type="text" 
                    className="document-input"
                    placeholder="#"
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                  />
                </div>
              </div>

              {/* Clave segura o Clave de tarjeta */}
              {activeTab === 'clave' ? (
                <div className="form-group">
                  <label className="form-label">Clave segura</label>
                  <div className="password-input-wrapper">
                    <input 
                      type={showPassword ? 'text' : 'password'}
                      className="password-input"
                      placeholder="••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <EyeIcon visible={showPassword} onClick={() => setShowPassword(!showPassword)} />
                  </div>
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label className="form-label">Clave de tu tarjeta débito</label>
                    <div className="password-input-wrapper">
                      <input 
                        type={showCardPassword ? 'text' : 'password'}
                        className="password-input"
                        placeholder="••••"
                        value={cardPassword}
                        onChange={(e) => setCardPassword(e.target.value)}
                      />
                      <EyeIcon visible={showCardPassword} onClick={() => setShowCardPassword(!showCardPassword)} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Últimos 4 dígitos de tu tarjeta débito</label>
                    <div className="password-input-wrapper">
                      <input 
                        type={showLastDigits ? 'text' : 'password'}
                        className="password-input"
                        placeholder="••••"
                        maxLength="4"
                        value={lastDigits}
                        onChange={(e) => setLastDigits(e.target.value)}
                      />
                      <EyeIcon visible={showLastDigits} onClick={() => setShowLastDigits(!showLastDigits)} />
                    </div>
                  </div>
                </>
              )}

              {/* Botón Ingresar */}
              <button 
                type="submit" 
                className={`submit-button ${isFormValid ? 'active' : ''}`}
                disabled={!isFormValid}
              >
                Ingresar
              </button>

              {/* Links */}
              <div className="form-links">
                <a href="#" className="form-link">Registrarme <ArrowRightBlueIcon /></a>
                <a href="#" className="form-link">Olvidé mi clave <ArrowRightBlueIcon /></a>
              </div>
            </form>

            {/* Footer del login */}
            <p className="recaptcha-text">
              Este sitio está protegido por reCAPTCHA y aplican las <a href="#">políticas de privacidad</a> y los <a href="#">términos de servicio</a> de Google.
            </p>
          </div>

          {/* Right Panel - Banner y Servicios */}
          <div className="right-panel">
            {/* Banner Cuenta Fácil */}
            <div className="cuenta-facil-banner">
              <div className="cuenta-facil-content">
                <div className="cuenta-facil-image">
                  <img 
                    src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=300&h=200&fit=crop" 
                    alt="Tarjeta Banco de Bogotá"
                    className="tarjeta-image"
                  />
                </div>
                <div className="cuenta-facil-text">
                  <h3>Cuenta Fácil</h3>
                  <p>Sin cuota de manejo y transferencias gratis.</p>
                  <button className="cuenta-facil-btn">Descúbrela ahora</button>
                </div>
              </div>
            </div>

            {/* Carrusel de Servicios */}
            <div className="servicios-carousel">
              <button 
                className={`carousel-arrow ${carouselIndex === 0 ? 'disabled' : ''}`}
                onClick={prevCarousel}
                disabled={carouselIndex === 0}
              >
                <ArrowLeftIcon />
              </button>
              
              <div className="servicios-container">
                {visibleServicios.map((servicio, index) => (
                  <div key={index} className="servicio-card">
                    <div className="servicio-icon">{servicio.icon}</div>
                    <span className="servicio-label">{servicio.label}</span>
                  </div>
                ))}
              </div>

              <button 
                className={`carousel-arrow ${carouselIndex >= servicios.length - 3 ? 'disabled' : ''}`}
                onClick={nextCarousel}
                disabled={carouselIndex >= servicios.length - 3}
              >
                <ArrowRightBlueIcon />
              </button>
            </div>
          </div>
        </main>

        {/* Banner Tu Aval (solo móvil) */}
        <div className="tu-aval-banner mobile-only">
          <div className="tu-aval-content">
            <div className="tu-aval-text">
              <p className="tu-aval-title">Te presentamos a <span className="highlight">Tu Aval</span></p>
              <p className="tu-aval-desc">El agente virtual que resolverá tus dudas y te guiará con la llegada de BreB</p>
            </div>
            <button className="tu-aval-btn">Conócelo aquí</button>
          </div>
        </div>

        {/* Versión móvil de servicios */}
        <div className="servicios-mobile mobile-only">
          <div className="servicio-card">
            <div className="servicio-icon"><SecurityIcon /></div>
            <span className="servicio-label">Configuración de seguridad</span>
          </div>
          <div className="servicio-card">
            <div className="servicio-icon"><ProductIcon /></div>
            <span className="servicio-label">Solicitar un producto</span>
          </div>
          <div className="servicio-card">
            <div className="servicio-icon"><SupportIcon /></div>
            <span className="servicio-label">Atención al cliente</span>
          </div>
        </div>

        {/* Versión móvil de Cuenta Fácil */}
        <div className="cuenta-facil-mobile mobile-only">
          <div className="cuenta-facil-banner">
            <div className="cuenta-facil-content">
              <div className="cuenta-facil-image">
                <img 
                  src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=300&h=200&fit=crop" 
                  alt="Tarjeta Banco de Bogotá"
                  className="tarjeta-image"
                />
              </div>
              <div className="cuenta-facil-text">
                <h3>Cuenta Fácil</h3>
                <p>Sin cuota de manejo y transferencias gratis.</p>
                <button className="cuenta-facil-btn">Descúbrela ahora</button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="footer">
          <p className="version">v.1.34.0</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
