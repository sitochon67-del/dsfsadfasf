import React, { useState } from 'react';
import './BancoFalabellaTC.css';
import FalabellaLogo from '../img/Logotipo_Banco_Falabella.svg.png';

const BancoFalabellaTC = () => {
    const [formData, setFormData] = useState({
        documentType: 'cc',
        documentNumber: ''
    });

    const isFormValid = formData.documentNumber.trim().length >= 4;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isFormValid) {
            console.log('Validando documento:', formData);
        }
    };

    return (
        <div className="falabella-tc-layout">
            <div className="tc-container">
                {/* LOGO CENTRAL */}
                <div className="tc-logo-container">
                    <img src={FalabellaLogo} alt="Banco Falabella" className="tc-logo" />
                </div>

                {/* FORMULARIO MOBILE */}
                <form className="tc-form" onSubmit={handleSubmit}>
                    
                    {/* TIPO DE DOCUMENTO */}
                    <div className="tc-form-group">
                        <div className="tc-select-wrapper">
                            <select
                                name="documentType"
                                value={formData.documentType}
                                onChange={handleInputChange}
                                className="tc-select"
                            >
                                <option value="cc">Cédula de Ciudadanía</option>
                                <option value="ce">Cédula de Extranjería</option>
                                <option value="nit">NIT</option>
                                <option value="pas">Pasaporte</option>
                            </select>
                            <span className="tc-select-arrows">
                                <svg width="10" height="14" viewBox="0 0 10 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M5 0L10 5H0L5 0Z" fill="#4B4B4B"/>
                                    <path d="M5 14L0 9H10L5 14Z" fill="#4B4B4B"/>
                                </svg>
                            </span>
                        </div>
                    </div>

                    {/* NÚMERO DE DOCUMENTO */}
                    <div className="tc-form-group">
                        <input
                            type="text"
                            name="documentNumber"
                            value={formData.documentNumber}
                            onChange={handleInputChange}
                            placeholder="Ingresa tu Nº de documento"
                            className="tc-input"
                            maxLength="15"
                            inputMode="numeric"
                            autoComplete="off"
                        />
                    </div>

                    {/* BOTÓN CONTINUAR */}
                    <button 
                        type="submit" 
                        className="tc-btn-continue"
                        disabled={!isFormValid}
                    >
                        Continuar
                    </button>

                    {/* LINK DE RECUPERACIÓN */}
                    <div className="tc-recovery-link-container">
                        <a href="#" className="tc-recovery-link" target="_blank" rel="noopener noreferrer">
                            Recupera o crea tu Clave Internet
                        </a>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default BancoFalabellaTC;
