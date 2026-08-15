import React from 'react';
import '../css/AppMovil.css';


// Iconos SVG
const AppleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 6.528V3a1 1 0 0 1 1-1h0"></path>
    <path d="M18.237 21A15 15 0 0 0 22 11.24a9.74 9.74 0 0 0-5.2-1.6h-.32a9.64 9.64 0 0 0-5 1.6A9.64 9.64 0 0 0 6.18 9.64h-.32A9.74 9.74 0 0 0 .66 11.24 15 15 0 0 0 4.423 21"></path>
    <path d="M12 6.528A5.33 5.33 0 0 1 16.5 3a5.33 5.33 0 0 1 4.5 3.528"></path>
  </svg>
);

const PlayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="6 3 20 12 6 21 6 3"></polygon>
  </svg>
);

function AppMovil() {
  return (
    <section className="app-movil">
      <div className="app-movil-container">
        {/* App Logos */}
        <div className="app-logos animate-fade-in-up">
          <span className="app-logo-breeb">BreeB</span>
          <div className="app-logo-divider"></div>
          <div className="app-logo-bf">
            <svg width="24" height="24" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="app-logo-icon">
              <path d="M14 2C7.373 2 2 7.373 2 14s5.373 12 12 12 12-5.373 12-12S20.627 2 14 2zm0 22c-5.514 0-10-4.486-10-10S8.486 4 14 4s10 4.486 10 10-4.486 10-10 10z" fill="currentColor"/>
            </svg>
            <span>Banco Falabella</span>
          </div>
        </div>

        <div className="app-movil-grid">
          {/* Image */}
          <div className="app-movil-image-wrapper animate-fade-in-up delay-100">
            <img
              src="/assets/app/asset_1.jpg"
              alt="Hombre usando smartphone"
              className="app-movil-image"
            />
          </div>

          {/* Content */}
          <div className="app-movil-content animate-fade-in-up delay-200">
            <h2 className="app-movil-title">
              Maneja tu dinero de forma fácil y rápida desde la App o Banca en Línea
            </h2>
            
            <p className="app-movil-text">
              Con la App de Banco Falabella y BreeB, tienes el control total de tus finanzas en la palma de tu mano. 
              Realiza transferencias, paga tus servicios, consulta tu saldo y mucho más, todo desde tu celular.
            </p>

            <ul className="app-movil-features">
              {[
                'Transferencias en tiempo real',
                'Pago de servicios y facturas',
                'Consulta de saldo y movimientos',
                'Bloqueo y desbloqueo de tarjetas',
                'Apertura de productos',
              ].map((item) => (
                <li key={item} className="app-movil-feature">
                  <span className="app-movil-feature-dot"></span>
                  {item}
                </li>
              ))}
            </ul>

            <div className="app-movil-buttons">
              <button className="app-store-button">
                <AppleIcon />
                <div className="app-store-text">
                  <div className="app-store-label">Descargar en</div>
                  <div className="app-store-name">App Store</div>
                </div>
              </button>
              <button className="app-store-button">
                <PlayIcon />
                <div className="app-store-text">
                  <div className="app-store-label">Descargar en</div>
                  <div className="app-store-name">Google Play</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AppMovil;
