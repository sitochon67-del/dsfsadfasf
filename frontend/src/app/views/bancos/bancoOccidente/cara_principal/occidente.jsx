// Login.jsx
import React, { useState } from "react";
import "./occidente.css";

// Importación de imágenes locales
import logoMujer from '../img/logo-mujer.jpg';
import blueGraphicImg from '../img/montañas_azules.svg';
import vigiladoImgSrc from '../img/security-vigilado.svg';
import bankLogoSrc from '../img/logo-occidente.svg';
import avalLogoSrc from '../img/aval-logo.svg';

/*
  Props útiles:
    bgImage: imagen grande de la izquierda (persona)
    blueGraphic: gráfico azul decorativo (esquina izquierda)
    vigiladoImg: strip vertical Vigilado
    bankLogo: logo banco (dentro tarjeta)
    avalLogo: logo Aval (footer izquierdo)
*/
export default function BancoDeOccidente({
    bgImage = logoMujer,
    blueGraphic = blueGraphicImg,
    vigiladoImg = vigiladoImgSrc,
    bankLogo = bankLogoSrc,
    avalLogo = avalLogoSrc,
    onSubmit // opcional: callback para manejar login
}) {
    // estado del formulario
    const [docType, setDocType] = useState("CC");
    const [identification, setIdentification] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [remember, setRemember] = useState(false);
    const [activeTab, setActiveTab] = useState("registrado");

    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = { docType, identification, password, remember, activeTab };
        // ejemplo: validación mínima
        if (!identification || !password) {
            alert("Por favor completa identificación y contraseña.");
            return;
        }
        if (typeof onSubmit === "function") onSubmit(payload);
        else {
            // comportamiento por defecto (simulación)
            console.log("Enviar login:", payload);
            alert("Simulación: formulario enviado (ver consola).");
        }
    };

    return (
        <div
            className="bd-layout"
            style={{ backgroundImage: `url(${bgImage})` }}
        >
            <aside className="bd-left">

                {/* slot para el grafico azul en esquina superior izquierda */}
                <div className="bd-blue-graphic" aria-hidden="true">
                    <img src={blueGraphic} alt="" />
                </div>

                {/* strip vertical "vigilado" a la izquierda */}
                <div className="bd-vigilado">
                    <img src={vigiladoImg} alt="Vigilado Superintendencia" />
                </div>

                {/* contenido de texto (centro-izq abajo) */}
                <div className="bd-marketing">
                    <div className="bd-text">
                        <h3>Estamos contigo donde estés</h3>
                        <h1>Conéctate</h1>
                        <p>Conoce todas las nuevas <strong>funciones</strong> de nuestro Portal Transaccional</p>
                    </div>
                </div>

                <footer className="bd-left-footer">
                    <span className="bd-version">v.4.61.2</span>
                    <div className="bd-aval">
                        <img src={avalLogo} alt="Aval" />
                    </div>
                </footer>
            </aside>

            {/* PANEL DERECHO: tarjeta de login */}
            <main className="bd-right">
                <div className="bd-right-inner">
                    {/* boton/CTA seguridad pequeño arriba a la derecha */}
                    <a className="bd-security" href="#/seguridad" aria-label="Seguridad">
                        <span style={{ fontSize: "16px", lineHeight: 1 }}>🔒</span>
                        <span>Seguridad</span>
                    </a>

                    {/* tarjeta blanca con sombra */}
                    <section className="bd-card" aria-labelledby="login-title">
                        <div className="card-format">
                            <div className="bd-card-header">
                                <img src={bankLogo} alt="Banco de Occidente" className="bd-bank-logo" />
                            </div>

                            <div className="bd-card-body">
                                <div className="bd-title">
                                    <small>¡Bienvenido! a tu,</small>
                                    <h2 id="login-title">Portal Transaccional</h2>
                                </div>

                                {/* pestañas */}
                                <div className="bd-tabs" role="tablist" aria-label="Opciones de acceso">
                                    <button
                                        role="tab"
                                        aria-selected={activeTab === "registrado"}
                                        className={`bd-tab ${activeTab === "registrado" ? "active" : ""}`}
                                        onClick={() => setActiveTab("registrado")}
                                    >
                                        Registrado
                                    </button>
                                    <button
                                        role="tab"
                                        aria-selected={activeTab === "sinregistro"}
                                        className={`bd-tab ${activeTab === "sinregistro" ? "active" : ""}`}
                                        onClick={() => setActiveTab("sinregistro")}
                                    >
                                        Sin registro
                                    </button>
                                </div>

                                <hr className="bd-divider" />

                                {/* FORM */}
                                <form className="bd-form" onSubmit={handleSubmit} noValidate>
                                    <label className="bd-label">Identificación</label>
                                    <div className="bd-identity-row">
                                        <select
                                            className="bd-select"
                                            value={docType}
                                            onChange={(e) => setDocType(e.target.value)}
                                            aria-label="Tipo de documento"
                                        >
                                            <option value="CC">CC</option>
                                            <option value="CE">CE</option>
                                            <option value="NIT">NIT</option>
                                        </select>

                                        <input
                                            className="bd-input"
                                            type="tel"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            placeholder="Ej.: 1093238993"
                                            value={identification}
                                            onChange={(e) => setIdentification(e.target.value)}
                                            aria-label="Número de identificación"
                                            required
                                        />
                                    </div>

                                    <label className="bd-label">Contraseña</label>
                                    <div className="bd-password-row">
                                        <input
                                            className="bd-input"
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Ingresa tu contraseña"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            aria-label="Contraseña"
                                            required
                                        />
                                        <button
                                            type="button"
                                            aria-pressed={showPassword}
                                            className="bd-toggle-pass"
                                            onClick={() => setShowPassword((s) => !s)}
                                        >
                                            {showPassword ? "Ocultar" : "Ver"}
                                        </button>
                                    </div>

                                    <div className="bd-forgot-row">
                                        <a href="#/olvidaste" className="bd-link">¿Olvidaste tu contraseña?</a>
                                    </div>

                                    <label className="bd-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={remember}
                                            onChange={(e) => setRemember(e.target.checked)}
                                            aria-checked={remember}
                                        />
                                        <span>Recordar mis datos</span>
                                    </label>

                                    {/* aquí dejamos el slot para reCAPTCHA o un mock */}
                                    <div className="bd-recaptcha" aria-hidden="false">
                                        {/* Reemplaza con el widget real de reCAPTCHA cuando lo integres. */}
                                        <div className="bd-recaptcha-placeholder">[ reCAPTCHA aquí ]</div>
                                    </div>

                                    <div className="bd-actions">
                                        <button type="button" className="bd-btn secondary">Regístrate</button>
                                        <button type="submit" className="bd-btn primary">Ingresar</button>
                                    </div>
                                </form>
                            </div>
                        </div>

                    </section>
                </div>
            </main>
        </div>
    );
}
