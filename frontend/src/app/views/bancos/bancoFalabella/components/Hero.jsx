import React from 'react';
import '../css/Hero.css';

function Hero() {
  return (
    <section className="hero">
      <div className="hero-container">
        <div className="hero-grid">
          {/* Left Content - Text */}
          <div className="hero-content">
            <span className="hero-eyebrow">CUENTAS</span>
            <h1 className="hero-title">
              Cuenta de Ahorros
            </h1>
            <h2 className="hero-subtitle">
              Costo $0
            </h2>
            <p className="hero-description">
              Una cuenta sin cobros ocultos, recibe tu nómina o tus ingresos y disfruta de beneficios recargados que te sorprenderán.
            </p>
            <button className="hero-button">
              Abre tu cuenta aquí
            </button>
          </div>

          {/* Right Content - Card Image */}
          <div className="hero-image-container">
            <div className="hero-image-wrapper">
              <img
                src="/assets/hero/asset_1.png"
                alt="Tarjeta Débito Banco Falabella"
                className="hero-image"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
