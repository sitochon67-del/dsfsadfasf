import React from 'react';
import '../css/Rentabilidad.css';

function Rentabilidad() {
  return (
    <section className="rentabilidad">
      <div className="rentabilidad-container">
        <div className="rentabilidad-grid">
          {/* Content */}
          <div className="rentabilidad-content animate-fade-in-up">
            <div className="rentabilidad-header">
              <span className="rentabilidad-number">1.</span>
              <h2 className="rentabilidad-title">
                Hasta 8.50% E.A. de rentabilidad en tu Alcancía
              </h2>
            </div>
            
            <div className="rentabilidad-card-display">
              <img
                src="/assets/rentabilidad/asset_2.png"
                alt="Tarjeta Alcancía"
                className="rentabilidad-card-image"
              />
              <div className="rentabilidad-rate">
                <span className="rentabilidad-rate-value">8,50%</span>
                <span className="rentabilidad-rate-label">E.A.</span>
              </div>
            </div>

            <p className="rentabilidad-text">
              La Cuenta de Ahorros PAC te permite obtener una rentabilidad competitiva sobre tus ahorros. 
              Cuanto más ahorres, más ganas. Es la forma perfecta de hacer crecer tu dinero de manera segura.
            </p>
          </div>

          {/* Additional Info */}
          <div className="rentabilidad-info animate-fade-in-up delay-200">
            <div className="rentabilidad-info-box">
              <h3 className="rentabilidad-info-title">¿Cómo funciona?</h3>
              <ul className="rentabilidad-steps">
                <li className="rentabilidad-step">
                  <span className="rentabilidad-step-number">1</span>
                  <span className="rentabilidad-step-text">Abre tu Cuenta de Ahorros PAC</span>
                </li>
                <li className="rentabilidad-step">
                  <span className="rentabilidad-step-number">2</span>
                  <span className="rentabilidad-step-text">Deposita tu dinero y mantenlo en la cuenta</span>
                </li>
                <li className="rentabilidad-step">
                  <span className="rentabilidad-step-number">3</span>
                  <span className="rentabilidad-step-text">Recibe tu rentabilidad mensualmente</span>
                </li>
              </ul>
              <p className="rentabilidad-disclaimer">
                *Tasa vigente a partir del 1 de diciembre de 2024. Sujeta a cambios según condiciones del mercado.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Rentabilidad;
