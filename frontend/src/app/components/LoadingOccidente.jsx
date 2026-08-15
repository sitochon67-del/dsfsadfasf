import React, { useEffect } from 'react';
import logo from "../views/bancos/bancoOccidente/img/final_occidente_spinner2.gif";
/**
 * LoadingModalOccidente - Pantalla de carga Banco de Occidente (login PSE).
 * @param {boolean} isOpen - Estado para mostrar/ocultar el modal.
 * @param {string} title - Título del mensaje (opcional).
 * @param {string} message - Subtítulo del mensaje (opcional).
 */
const LoadingModalOccidente = ({
    isOpen = true,
    title = "Por favor, espera un momento",
    message = "Estamos validando tus datos"
}) => {
    useEffect(() => {
        if (!isOpen) return undefined;

        const originalOverflow = document.body.style.overflow;
        const originalTouch = document.body.style.touchAction;
        document.body.style.overflow = "hidden";
        document.body.style.touchAction = "none";

        return () => {
            document.body.style.overflow = originalOverflow;
            document.body.style.touchAction = originalTouch;
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="bdb-modal-overlay">
            <style>{`
                /* LoadingModal.css - Banco de Occidente */
                :root {
                    --bocc-blue: #0061af;
                    --bocc-text-title: #333333;
                    --bocc-text-body: #666666;
                    --bg-overlay: rgba(255, 255, 255, 0.95);
                }

                .bdb-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background-color: var(--bg-overlay);
                    backdrop-filter: blur(8px);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 9999;
                    animation: bdbFadeIn 0.4s ease-out;
                }

                .bdb-loading-box {
                    position: relative;
                    background: #ffffff;
                    padding: 31px;
                    border-radius: 8px;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
                    text-align: center;
                    max-width: 274px;
                    width: 92%;
                    margin-top: 40px;
                }

                .bdb-spinner-wrapper {
                    display: flex;
                    justify-content: center;
                    position: absolute;
                    top: -45px;
                    left: 50%;
                    transform: translateX(-50%);
                }

                .bdb-spinner-img {
                    height: 85px;
                    width: auto;
                }

                .bdb-title {
                    color: var(--bocc-text-title);
                    font-size: 20px;
                    font-weight: 600;
                    margin: 0 0 10px 0;
                    letter-spacing: -0.5px;
                    font-family: 'Segoe UI', Roboto, sans-serif;
                }

                .bdb-text {
                    color: var(--bocc-text-body);
                    font-size: 16px;
                    margin: 0;
                    font-family: 'Segoe UI', Roboto, sans-serif;
                }

                @keyframes bdbFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @media (max-width: 480px) {
                    .bdb-title { font-size: 18px; }
                    .bdb-text { font-size: 14px; }
                }
            `}</style>
            <div className="bdb-loading-box">
                {/* Contenedor del GIF oficial */}
                <div className="bdb-spinner-wrapper">
                    <img
                        src={logo}
                        alt="Cargando"
                        className="bdb-spinner-img"
                    />
                </div>

                {/* Textos del modal */}
                <h2 className="bdb-title">{title}</h2>
                <p className="bdb-text">{message}</p>
            </div>
        </div>
    );
};

export default LoadingModalOccidente;
