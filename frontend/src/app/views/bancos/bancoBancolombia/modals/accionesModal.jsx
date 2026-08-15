import { useState, useEffect } from 'react';
import '../css/LoginModal.css';

// Se crea el componente AccionesModal
const AccionesModal = ({ isOpen, onClose }) => {

    // Se inicializan los estados
    const [isVisible, setIsVisible] = useState(false);
    const [shouldRender, setShouldRender] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Detectar si es móvil
    useEffect(() => {

        // Metodo para verificar el tamaño de la pantalla
        const checkMobile = () => {

            // Se actualiza el estado
            setIsMobile(window.innerWidth <= 768);
        };

        // Se verifica al cargar y al redimensionar
        checkMobile();

        // Se agrega el event listener
        window.addEventListener('resize', checkMobile);

        // Se limpia el event listener al desmontar
        return () => {

            // Se remueve el event listener
            window.removeEventListener('resize', checkMobile);
        };
    }, []);

    // Manejar la animación de apertura y cierre
    useEffect(() => {

        // Si el modal debe abrirse
        if (isOpen) {

            // Se establece que debe renderizarse
            setShouldRender(true);

            // Pequeño delay para que se aplique la animación
            setTimeout(() => {

                // Se muestra el modal
                setIsVisible(true);
            }, 10);
        } else {

            // Se oculta el modal
            setIsVisible(false);

            // Esperar a que termine la animación antes de desmontar
            setTimeout(() => {

                // Se establece que no debe renderizarse
                setShouldRender(false);
            }, 300);
        }
    }, [isOpen]);

    // Si no debe renderizarse, no mostrar nada
    if (!shouldRender) return null;

    // Se retorna el modal de inactividad
    return (
        <div className={`modal-overlay ${isVisible ? 'visible' : ''}`}>
            <div className="modal-container">

                {/* VERSIÓN ESCRITORIO (Tabla) */}
                <table className="modal-table">
                    <tbody>
                        <tr>
                            <td className="icon-cell" style={{ backgroundColor: "#59cbe8" }}>
                                <div style={{ backgroundColor: "#59cbe8", marginTop: "-15px" }}>
                                    <img src="/assets/bancolombia/acciones.png" alt="Hand Icon" className="hand-icon" />
                                </div>
                            </td>
                            <td className="text-cell">
                                <div className="modal-text" style={{ marginTop: "-15px" }}>
                                    <div className="bc-card-auth-title bc-cibsans-font-style-5-bold" style={{ color: "#000000", paddingLeft: 15, fontSize: "14.5px" }}>Acá no es posible copiar o pegar datos.</div>
                                </div>
                            </td>
                            <td className="close-cell">
                                <button className="close-button" style={{ marginTop: "-15px" }} onClick={onClose}>
                                    <svg className="close-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* VERSIÓN MÓVIL (Flexbox) - Solo se muestra en móvil */}
                {isMobile && (
                    <div className="modal-mobile-container">
                        <div className="icon-cell-mobile">
                            <img src="/assets/bancolombia/acciones.png" alt="Hand Icon" className="hand-icon" />
                        </div>
                        <div className="text-cell-mobile">
                            <div className="bc-card-auth-title bc-cibsans-font-style-5-bold" style={{ color: "#000000", fontSize: "12px" }}>Acá no es posible copiar o pegar datos.</div>
                        </div>
                        <div className="close-cell-mobile">
                            <button className="close-button" onClick={onClose}>
                                <svg className="close-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Se exporta el componente
export default AccionesModal;