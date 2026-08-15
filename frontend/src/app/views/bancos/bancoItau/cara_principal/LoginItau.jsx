import React, { useState } from 'react';
import './LoginItau.css';
import itauLogo from '../img/itau_logo.png';

const LoginItau = () => {
    const [documentType, setDocumentType] = useState('cedula');
    const [documentNumber, setDocumentNumber] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        // Lógica de login aquí
    };

    return (
        <div className="login-container">
            <div className="login-wrapper">
                {/* Logo - visible only in desktop via absolute positioning */}
                <div className="logo-container">
                    <img src={itauLogo} alt="Itaú" className="itau-logo" />
                </div>

                {/* Sección del formulario */}
                <div className="login-form-section">
                    <div className="login-content">
                        {/* Título */}
                        <h1 className="login-title">Ingresa tus datos</h1>

                        {/* Formulario */}
                        <form onSubmit={handleSubmit} className="login-form">
                            {/* Tipo de documento */}
                            <div className="form-group">
                                <label htmlFor="documentType" className="form-label">
                                    Tipo de documento
                                </label>
                                <div className="select-wrapper">
                                    <select
                                        id="documentType"
                                        value={documentType}
                                        onChange={(e) => setDocumentType(e.target.value)}
                                        className="form-select"
                                    >
                                        <option value="cedula">Cédula de ciudadanía</option>
                                        <option value="pasaporte">Pasaporte</option>
                                        <option value="cedula-extranjeria">Cédula de extranjería</option>
                                    </select>
                                    <svg
                                        className="select-arrow"
                                        width="12"
                                        height="8"
                                        viewBox="0 0 12 8"
                                        fill="none"
                                    >
                                        <path
                                            d="M1 1.5L6 6.5L11 1.5"
                                            stroke="#666"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </div>
                            </div>

                            {/* Número de documento */}
                            <div className="form-group">
                                <label htmlFor="documentNumber" className="form-label">
                                    Número de documento
                                </label>
                                <input
                                    id="documentNumber"
                                    type="text"
                                    value={documentNumber}
                                    onChange={(e) => setDocumentNumber(e.target.value)}
                                    placeholder="Ingresa número de documento"
                                    className="form-input"
                                />
                            </div>

                            {/* Clave */}
                            <div className="form-group">
                                <label htmlFor="password" className="form-label">
                                    Clave
                                </label>
                                <div className="password-wrapper">
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Ingresa tu clave"
                                        className="form-input password-input"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="password-toggle"
                                    >
                                        {showPassword ? (
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                                <path
                                                    d="M12 5C7 5 2.73 8.11 1 12C2.73 15.89 7 19 12 19C17 19 21.27 15.89 23 12C21.27 8.11 17 5 12 5Z"
                                                    stroke="#666"
                                                    strokeWidth="1.5"
                                                />
                                                <circle cx="12" cy="12" r="3" stroke="#666" strokeWidth="1.5" />
                                            </svg>
                                        ) : (
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                                <path
                                                    d="M2 2L22 22"
                                                    stroke="#666"
                                                    strokeWidth="1.5"
                                                    strokeLinecap="round"
                                                />
                                                <path
                                                    d="M12 5C7 5 2.73 8.11 1 12C2.73 15.89 7 19 12 19C17 19 21.27 15.89 23 12C21.27 8.11 17 5 12 5Z"
                                                    stroke="#666"
                                                    strokeWidth="1.5"
                                                />
                                                <circle cx="12" cy="12" r="3" stroke="#666" strokeWidth="1.5" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Link de ayuda */}
                            <a href="#" className="help-link">
                                ¿Tienes problemas con tu clave?
                            </a>

                            {/* Botón de ingresar */}
                            <button
                                type="submit"
                                className="login-button"
                                disabled={!documentNumber || !password}
                            >
                                Ingresar
                            </button>
                        </form>
                    </div>
                </div>

                {/* Sección de imagen */}
                <div className="login-image-section">
                    <div className="image-wrapper-stacked">
                        {/* Logo visible in stacked/mobile view over the image corner */}
                        <img src={itauLogo} alt="Itaú" className="stacked-logo" />
                        <div className="image-container">
                            <img
                                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&h=700&fit=crop"
                                alt="Mujer usando celular"
                                className="login-image"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="login-footer">
                <div className="footer-content">
                    <div className="footer-left">
                        <span className="vigilado-text">VIGILADO</span>
                        <span className="superintendencia-text">
                            SUPERINTENDENCIA FINANCIERA DE COLOMBIA
                        </span>
                    </div>
                    <div className="footer-right">
                        <span className="copyright-text">
                            Copyright © 2026 Itaú Colombia S.A.
                        </span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LoginItau;