import { ReactComponent as Bee1 } from "../images/vector-bee1.svg";
import { createPortal } from "react-dom";
import React, { useEffect, useRef } from "react";
import { isDesktop, isMobile } from "../../../../../@utils";

// Se crea el componente SeleccionModal
const SeleccionModal = ({ isOpen, onClose }) => {

    // Referencia al contenedor de la abeja para animaciones
    const beeWrapperRef = useRef(null);

    // Efecto para evitar el scroll y el espacio en blanco al final en mobile
    useEffect(() => {
        if (isOpen === 1) {
            // Se bloquea el scroll del body
            const originalOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';

            return () => {
                // Se restaura el scroll al cerrar el modal
                document.body.style.overflow = originalOverflow;
            };
        }
    }, [isOpen]);

    // Efecto para manejar la animación de entrada de la abeja cuando el modal se abre
    useEffect(() => {

        // Si el modal no está abierto, no hacer nada
        if (isOpen !== 1) return;

        // Obtener el elemento del DOM
        const el = beeWrapperRef.current;

        // Si no existe el elemento, salir
        if (!el) return;

        // Limpia clases
        el.classList.remove("bee-intro", "bounced");

        // 🔑 frame 1: el DOM existe, SIN animación
        requestAnimationFrame(() => {

            // 🔑 frame 2: ahora sí activamos la animación
            requestAnimationFrame(() => {
                el.classList.add("bee-intro");
            });
        });
    }, [isOpen]);

    // Se retorna el JSX del modal
    return createPortal(
        <main
            className="christmas-app"
            id="container-prehome"
            role="main"
            aria-label="conavi siempre contigo"
        >
            <section className="intro-screen" id="introScreen">
                <div className="intro-container">
                    <div className="lights-container">
                        <div className="bee-portal">
                            <div className="bee-wrapper" ref={beeWrapperRef}>
                                {/* <Bee1 id="beeIntro" className="bee-intro" aria-hidden="true" /> */}
                                {isDesktop() ?
                                    <img id="beeIntro" className="bee-intro" src="/assets/images_seleccion/imagen_1.png" /> : null}
                            </div>
                        </div>
                        <div className="trazo" aria-hidden="true">
                            {isDesktop() ?
                                <img
                                    src="assets/images_seleccion/bancolombia_seleccion.svg"
                                    alt="trazo fondo"
                                    role="presentation"
                                    loading="lazy"
                                /> : null}
                        </div>

                        <div className={`${!isDesktop() ? "" : "layout"}`}>
                            <div className="start" />
                            <article className="middle" style={{ marginLeft: isDesktop() ? "70px" : "10px", marginTop: "15px" }}>
                                <div className="container-text">
                                    <h2 className="text-focus-in mb-4" style={{ fontFamily: "CIB Sans Bold Light, sans-serif", fontSize: isMobile() ? "28px" : "58px", paddingBottom: isMobile() ? "0px" : "10px" }}>
                                        {/* La historia de este año viene con abejita de regalo. */}
                                        <img src="/assets/images_seleccion/titulo1.svg" alt="Seleccion" style={{ height: isMobile() ? "95px" : "180px" }} />
                                    </h2>
                                    <p className="cib-fonts-setup-light bc-my-3 text-focus-in mb-4"
                                        style={{
                                            fontFamily: "CIBFont Sans",
                                            fontSize: isMobile() ? "20px" : "24px",
                                            marginBottom: isDesktop() ? "15px" : "5px",
                                            lineHeight: isDesktop() ? "30px" : "25px",
                                        }}>
                                        La activación de tu Seguro de Vida y Salud te lleva a vivir una experiencia inolvidable en Miami
                                    </p>
                                    <p
                                        //onClick={() => (window.location.href = "/ingresa-tus-datos")}
                                        className="cib-fonts-setup-light bc-my-3 text-focus-in mb-4"
                                        style={{
                                            // textDecoration: "underline",
                                            cursor: "pointer",
                                            fontSize: isMobile() ? "18px" : "22px",
                                            fontFamily: "CIBFont Sans",
                                            marginTop: isDesktop() ? "30px" : "10px",
                                            marginBottom: isDesktop() ? "35px" : "10px"
                                        }}
                                    >
                                        Actívalo, paga con tus tarjetas débito o crédito Bancolombia y participa por grandes premios.
                                    </p>
                                </div>
                                <div
                                    // className="mt-4"
                                    style={{
                                        textAlign: isDesktop() ? "left" : "center",
                                        marginTop: isDesktop() ? "30px" : "27.5px",
                                    }}>
                                    <a
                                        className="btn-primary button-additional"
                                        role="button"
                                        aria-label="Conoce más"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            onClose();
                                        }}
                                    >
                                        Conoce más
                                    </a>
                                </div>
                            </article>
                            <button
                                className={isDesktop() ? 'button-close' : 'button-close'}
                                type="button"
                                aria-label="Cerrar"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onClose();
                                }}
                                style={{
                                    marginLeft: isDesktop() ? "0px" : "0px",
                                    top: isDesktop() ? "15px" : "5px",
                                    right: isDesktop() ? "30px" : "0px",
                                }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none"><path fill="#fff" fillRule="evenodd" d="m4 19.707.707.707 7.5-7.5 7.5 7.5.707-.707-7.5-7.5 7.5-7.5L19.707 4l-7.5 7.5-7.5-7.5L4 4.707l7.5 7.5-7.5 7.5Z" clipRule="evenodd"></path></svg>
                            </button>
                        </div>

                        <div className="bokeh-pre-header">
                            <div
                                className="light"
                                data-original-top="21"
                                data-original-left="46"
                                data-original-blur="4"
                                style={{
                                    width: '26px',
                                    height: '26px',
                                    top: '21%',
                                    left: '46%',
                                    background: 'rgba(254, 199, 63, 0.59)',
                                    filter: 'blur(4px)',
                                    animation: '34s linear 0.01s infinite normal none running light2'
                                }}
                            />

                            <div
                                className="light"
                                data-original-top="14"
                                data-original-left="86"
                                data-original-blur="3"
                                style={{
                                    width: '25px',
                                    height: '25px',
                                    top: '14%',
                                    left: '86%',
                                    background: 'rgba(254, 199, 63, 0.59)',
                                    filter: 'blur(3px)',
                                    animation: '27s linear 0.45s infinite normal none running light2'
                                }}
                            />

                            <div
                                className="light"
                                data-original-top="62"
                                data-original-left="29"
                                data-original-blur="3"
                                style={{
                                    width: '52px',
                                    height: '52px',
                                    top: '62%',
                                    left: '29%',
                                    background: 'rgba(254, 199, 63, 0.59)',
                                    filter: 'blur(3px)',
                                    animation: '13s linear 1.56s infinite normal none running light2'
                                }}
                            />

                            <div
                                className="light"
                                data-original-top="16"
                                data-original-left="80"
                                data-original-blur="3"
                                style={{
                                    width: '35px',
                                    height: '35px',
                                    top: '16%',
                                    left: '80%',
                                    background: 'rgba(254, 215, 81, 0.604)',
                                    filter: 'blur(3px)',
                                    animation: '5s linear 0.12s infinite normal none running light2'
                                }}
                            />

                            <div
                                className="light"
                                data-original-top="75"
                                data-original-left="25"
                                data-original-blur="3"
                                style={{
                                    width: '45px',
                                    height: '45px',
                                    top: '75%',
                                    left: '25%',
                                    background: 'rgba(254, 199, 63, 0.59)',
                                    filter: 'blur(3px)',
                                    animation: '26s linear 1.83s infinite normal none running light2'
                                }}
                            />
                        </div>
                    </div>
                </div>
            </section >
        </main >, document.body
    );
};

// Se exporta el componente SeleccionModal
export default SeleccionModal;
