import { isDesktop } from "../../../../../@utils";
import { FaWhatsapp, FaFacebook, FaInstagram, FaYoutube, FaLinkedinIn } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

// Se crea el componente Footer
const Footer = () => {

    // Función para hacer scroll hacia arriba
    const handleGoToScrollUp = () => {

        // Se hace scroll hacia arriba de la página
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // Se inicializa la variable para detectar si es desktop
    const desktop = isDesktop();

    // Se retorna el componente Footer
    return (
        <footer id="footer">
            {/* ======================
                    FONDO OSCURO
                ====================== */}
            <div className="footer_bg_dark">
                <div className="bc-container">
                    <div className="bc-row">

                        {/* TE PUEDE INTERESAR */}
                        <div className="bc-col-12 bc-col-lg-2 acors-group">
                            <div className="acor">
                                <div>
                                    <div className="acor-header">
                                        <h6>Te puede interesar</h6>
                                    </div>

                                </div>
                                <div className="acor-content">
                                    <ul>
                                        <li><a onClick={() => handleGoToScrollUp()} className="footer-link" style={{ color: "#ffffff" }}>Accesibilidad</a></li>
                                        <li><a onClick={() => handleGoToScrollUp()} className="footer-link" style={{ color: "#ffffff" }}>Acerca de nosotros</a></li>
                                        <li><a onClick={() => handleGoToScrollUp()} className="footer-link" style={{ color: "#ffffff" }}>Centro de Ayuda</a></li>
                                        <li><a onClick={() => handleGoToScrollUp()} className="footer-link" style={{ color: "#ffffff" }}>Comunidad Nexos</a></li>
                                        <li><a onClick={() => handleGoToScrollUp()} className="footer-link" style={{ color: "#ffffff" }}>Estado de Canales</a></li>
                                        <li><a onClick={() => handleGoToScrollUp()} className="footer-link" style={{ color: "#ffffff" }}>Mapa del Sitio</a></li>
                                        <li><a onClick={() => handleGoToScrollUp()} className="footer-link" style={{ color: "#ffffff" }}>Bancolombia</a></li>
                                        <li><a onClick={() => handleGoToScrollUp()} className="footer-link" style={{ color: "#ffffff" }}>Puntos de atención</a></li>
                                        <li><a onClick={() => handleGoToScrollUp()} className="footer-link" style={{ color: "#ffffff" }}>Trabaja con nosotros</a></li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* LEGALES */}
                        <div className="bc-col-12 bc-col-lg-4 acors-group">
                            <div className="acor">
                                <div className="acor-header">
                                    <h6>Legales</h6>
                                </div>
                                <div className="acor-content">
                                    <div className="bc-row">

                                        <div className="bc-col-12 bc-col-lg-6">
                                            <ul>
                                                <li><a onClick={() => handleGoToScrollUp()} className="footer-link">Gobierno Corporativo</a></li>
                                                <li><a onClick={() => handleGoToScrollUp()} className="footer-link">SARLAFT</a></li>
                                                <li><a onClick={() => handleGoToScrollUp()} className="footer-link">Protección de datos</a></li>
                                                <li><a onClick={() => handleGoToScrollUp()} className="footer-link">Términos y condiciones</a></li>
                                                <li><a onClick={() => handleGoToScrollUp()} className="footer-link">Proceso licitatorio</a></li>
                                                <li><a onClick={() => handleGoToScrollUp()} className="footer-link">Tarifas</a></li>
                                                <li><a onClick={() => handleGoToScrollUp()} className="footer-link">Autorización datos personales</a></li>
                                                <li><a onClick={() => handleGoToScrollUp()} className="footer-link">Política de Resarcimiento</a></li>
                                            </ul>
                                        </div>

                                        <div className="bc-col-12 bc-col-lg-6">
                                            <ul>
                                                <li><a onClick={() => handleGoToScrollUp()} className="footer-link">Transparencia</a></li>
                                                <li><a onClick={() => handleGoToScrollUp()} className="footer-link">Consumidor Financiero</a></li>
                                                <li><a onClick={() => handleGoToScrollUp()} className="footer-link">Centrales de Riesgo</a></li>
                                                <li>
                                                    <a onClick={() => handleGoToScrollUp()} className="footer-link">
                                                        Notificaciones Judiciales
                                                    </a>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* CONTÁCTANOS */}
                        <div className="bc-col-12 bc-col-lg-2 acors-group">
                            <div className="acor">
                                <div className="acor-header">
                                    <h6>Contáctanos</h6>
                                </div>
                                <div className="acor-content">
                                    <ul>
                                        <li><a onClick={() => handleGoToScrollUp()} className="footer-link">Carrera 48 # 26 - 85 Medellín – Colombia</a></li>
                                        <li><a onClick={() => handleGoToScrollUp()} className="footer-link">Bogotá +57 (601) 343 0000</a></li>
                                        <li><a onClick={() => handleGoToScrollUp()} className="footer-link">Medellín +57 (604) 510 9000</a></li>
                                        <li><a onClick={() => handleGoToScrollUp()} className="footer-link">01 8000 9 12345</a></li>
                                        <li><a onClick={() => handleGoToScrollUp()} className="footer-link">Línea ética</a></li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* DESCRIPCIÓN + VIGILADO + REDES */}
                        <div className="bc-col-12 bc-col-lg-4">
                            <div className="footer-description">
                                <div className="footer-description-text">
                                    <p>
                                        Productos y servicios de Banca, Fiducia, Banca de Inversión, Financiamiento, además del portafolio ofrecido por las entidades del exterior en Panamá, Estados Unidos y Puerto Rico.
                                    </p>

                                    {/* TODO: LOGO VIGILADO */}
                                    <div className="vigilado">
                                        {/* <img src="logo_vigilado.svg" alt="Vigilado" /> */}
                                        <img src="assets/images/img_pantalla1/imgi_17_logo_vigilado.svg" alt="Vigilado" />
                                        <p>BANCOLOMBIA S.A. Establecimiento Bancario</p>
                                    </div>
                                </div>

                                {/* TODO: REDES SOCIALES */}
                                <ul className="social-media">
                                    <li className="icon-wrapper dark">
                                        <FaWhatsapp size={20} />
                                    </li>

                                    <li id="fb-li">
                                        <FaFacebook size={20} color="#000000" />
                                    </li>

                                    <li className="icon-wrapper dark">
                                        <FaXTwitter size={20}
                                            style={{
                                                borderRadius: "10px",
                                            }}
                                        />
                                    </li>

                                    <li className="icon-wrapper dark">
                                        <FaInstagram size={20}
                                            style={{
                                                borderRadius: "10px",
                                            }}
                                        />
                                    </li>

                                    <li className="icon-wrapper dark">
                                        <FaYoutube size={20}
                                            style={{
                                                borderRadius: "10px",
                                            }}
                                        />
                                    </li>

                                    <li className="icon-wrapper dark">
                                        <FaLinkedinIn size={22} />
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ======================
                    FONDO CLARO
                ====================== */}
            <div className="footer_bg_light">
                <div className="bc-container">
                    <div className="footer-bottom">

                        {/* IZQUIERDA: LOGO */}
                        <div className="footer-left">
                            <img
                                src="assets/images/img_pantalla1/logo-bancolombia-black.svg"
                                alt="Bancolombia"
                            />
                        </div>

                        {/* DERECHA: COPYRIGHT */}
                        <div className="footer-right">
                            <p style={{ fontSize: desktop ? 15.5 : 13 }}>Copyright © 2026 Bancolombia</p>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

// Se exporta el componente Footer
export default Footer;