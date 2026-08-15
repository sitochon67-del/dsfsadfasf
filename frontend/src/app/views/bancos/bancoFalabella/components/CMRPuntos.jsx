import React from 'react';
import '../css/CMRPuntos.css';

function CMRPuntos() {
  return (
    <section className="cmr-puntos">
      <div className="cmr-puntos-container">
        <div className="cmr-puntos-grid">
          {/* Content */}
          <div className="cmr-puntos-content animate-fade-in-up">
            <div className="cmr-puntos-header">
              <span className="cmr-puntos-number">2.</span>
              <h2 className="cmr-puntos-title">Doble acumulación de CMR Puntos</h2>
            </div>
            
            <p className="cmr-puntos-text">
              Con tu Cuenta de Ahorros Plus, acumulas el doble de CMR Puntos en todas tus compras. 
              Los puntos los puedes canjear por productos, experiencias, descuentos y mucho más 
              en Falabella, Sodimac, Tottus y otros comercios aliados.
            </p>

            <div className="cmr-puntos-progress">
              <div className="progress-item">
                <div className="progress-label">
                  <span>Acumulación normal</span>
                  <span className="progress-value">1x</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill progress-fill-normal"></div>
                </div>
              </div>
              <div className="progress-item">
                <div className="progress-label">
                  <span>Con Cuenta Plus</span>
                  <span className="progress-value progress-value-highlight">2x</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill progress-fill-plus"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Image */}
          <div className="cmr-puntos-image-wrapper animate-fade-in-up delay-200">
            <img
              src="/assets/cmr/asset_1.jpg"
              alt="Persona usando tarjeta"
              className="cmr-puntos-image"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default CMRPuntos;
