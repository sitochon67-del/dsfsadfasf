import React, { useState } from 'react';
import './RegistroPassword.css';
import passwordIcon from '../../images/password.svg';
import securityIcon from '../../images/security.svg';
import logoAval from "../../images/imgi_13_aval.png";
import logoPopular from "../../images/imgi_12_Isotipo.png";


const RegistroPassword = () => {
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [consentAccepted, setConsentAccepted] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        // Lógica de envío
    };

    return (
        <div className="auth-container">
            {/* Header */}
            <header className="auth-header">
                <div className="header-content">
                    <div className="header-spacer" />
                    <h1 className="header-title">Registro</h1>
                    <div className="header-close">
                        <span>Cerrar</span>
                        <button className="close-btn" aria-label="Cerrar">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="12" r="12" fill="#D4F3D0" />
                                <path d="M8 8L16 16M16 8L8 16" stroke="#21A10F" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="auth-main">
                <div className="card-container">
                    <div className="password-card">
                        {/* Security Icon */}
                        <div className="security-icon">
                            <img src={passwordIcon} alt="Password Icon" />
                        </div>

                        <h2 className="card-title">Escribe tu contraseña</h2>

                        <form onSubmit={handleSubmit} className="password-form">
                            <div className="input-group">
                                <div className="label-row">
                                    <label htmlFor="password">Contraseña única</label>
                                    <a href="#" className="forgot-link">¿La olvidaste?</a>
                                </div>

                                <div className="password-input-wrapper">
                                    <input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        maxLength="4"
                                        placeholder="••••"
                                        className="password-input"
                                        inputMode="numeric"
                                    />
                                    <button
                                        type="button"
                                        className="toggle-password"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                    >
                                        {showPassword ? (
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                <circle cx="12" cy="12" r="3" />
                                            </svg>
                                        ) : (
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                                <line x1="1" y1="1" x2="23" y2="23" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="consent-section">
                                <p className="consent-text">
                                    Para continuar, acepta el tratamiento de datos personales
                                </p>

                                <div className="checkbox-group">
                                    <input
                                        type="checkbox"
                                        id="consent"
                                        checked={consentAccepted}
                                        onChange={(e) => setConsentAccepted(e.target.checked)}
                                        className="consent-checkbox"
                                    />
                                    <label htmlFor="consent" className="consent-label">
                                        He leído la <a href="#" className="terms-link">Autorización de Tratamiento de Datos Personales</a> y autorizo al Banco Popular S.A. para tratar mis datos conforme a las finalidades allí establecidas.
                                    </label>
                                </div>

                                {!consentAccepted && (
                                    <div className="notification-box">
                                        <div className="notification-bar" />
                                        <div className="notification-icon">⚠️</div>
                                        <div className="notification-content">
                                            <p>Acepta el tratamiento de datos personales para continuar. Solo tendrás que hacerlo por única vez.</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                className="submit-btn"
                                disabled={!consentAccepted || password.length !== 4}
                            >
                                Continuar
                            </button>
                        </form>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="auth-footer">
                <div className="footer-content">
                    <div className="footer-logos">
                        <img src={logoPopular} alt="Banco Popular" className="logo-bank" />
                        <div className="divider" />
                        <img src={logoAval} alt="Grupo Aval" className="logo-group" />
                    </div>

                    <div className="footer-links">
                        <a href="#">Seguridad</a>
                        <a href="#">Accesibilidad</a>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p className="footer-date">lunes, 30 de marzo de 2026 | 05:53 p. m.</p>
                    <p className="footer-copyright">© Banco Popular. Todos los derechos reservados. | v4.1.89</p>
                </div>
            </footer>
        </div>
    );
};

export default RegistroPassword;