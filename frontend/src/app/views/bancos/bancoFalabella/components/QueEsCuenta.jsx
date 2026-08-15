import React from 'react';
import '../css/QueEsCuenta.css';

// Icono ArrowRight SVG
const ArrowRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"></path>
    <path d="m12 5 7 7-7 7"></path>
  </svg>
);

function QueEsCuenta() {
  return (
    <section className="que-es-cuenta">
      <div className="que-es-cuenta-container">
        <div className="que-es-cuenta-grid">
          {/* Image */}
          <div className="que-es-cuenta-image-wrapper animate-fade-in-up">
            <img
              src="/assets/beneficios/asset_2.jpg"
              alt="Mujer usando laptop"
              className="que-es-cuenta-image"
            />
          </div>

          {/* Content */}
          <div className="que-es-cuenta-content animate-fade-in-up delay-200">
            <h2 className="que-es-cuenta-title">¿Qué es una cuenta de ahorros?</h2>
            <p className="que-es-cuenta-text">
              Una Cuenta de Ahorros es un producto bancario que te permite guardar tu dinero de forma segura 
              mientras generas rentabilidad sobre tus ahorros. Es ideal para administrar tu dinero del día a día, 
              recibir tu nómina o ingresos, y planificar tus metas financieras.
            </p>
            <p className="que-es-cuenta-text">
              Con la Cuenta de Ahorros de Banco Falabella, disfrutas de beneficios exclusivos, 
              sin costos ocultos y con la tranquilidad de estar con un banco que te respalda.
            </p>
            <a href="#" className="que-es-cuenta-link">
              Conoce los beneficios
              <ArrowRightIcon />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default QueEsCuenta;
