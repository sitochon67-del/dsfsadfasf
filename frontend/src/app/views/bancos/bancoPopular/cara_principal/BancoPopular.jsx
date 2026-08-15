import React, { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import './BancoPopular.css';

// Swiper CSS
import 'swiper/css';
import 'swiper/css/pagination';

// Image imports
import logoPopular from '../images/imgi_2_popularhorizontal_new.png';
import imgVector from '../images/imgi_5_Vector.png';
import imgVector1 from '../images/imgi_4_Vector-1.png';
import imgWoman4 from '../images/imgi_8_Woman-4.png';
import iconSolicitar from '../images/imgi_9_icon-solicitar.png';
import iconContacto from '../images/imgi_10_icon-contacto.png';
import logoIsotipo from '../images/imgi_12_Isotipo.png';
import logoAVAL from '../images/imgi_13_aval.png'

// Nuevas imágenes para el slider
import imgWoman5 from '../images/imgi_3_Woman-5.png';
import imgWoman6 from '../images/imgi_7_Woman-6.png';
import imgClubplateado from '../images/imgi_6_Clubplateado.png';

// Componente del icono de candado (SVG)
const SecurityLockIcon = () => (
    <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="test-security-icon-svg"
    >
        <path
            d="M12 2C9.243 2 7 4.243 7 7V9H6C4.897 9 4 9.897 4 11V20C4 21.103 4.897 22 6 22H18C19.103 22 20 21.103 20 20V11C20 9.897 19.103 9 18 9H17V7C17 4.243 14.757 2 12 2ZM12 4C13.654 4 15 5.346 15 7V9H9V7C9 5.346 10.346 4 12 4ZM6 11H18V20H6V11ZM12 13C10.897 13 10 13.897 10 15C10 16.103 10.897 17 12 17C13.103 17 14 16.103 14 15C14 13.897 13.103 13 12 13Z"
            fill="#FF6B35"
        />
        <circle cx="12" cy="15" r="1.5" fill="#FF6B35" />
    </svg>
);

// Componente de la flecha del select (SVG)
const SelectArrowIcon = () => (
    <svg
        width="12"
        height="8"
        viewBox="0 0 12 8"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="test-select-arrow-svg"
    >
        <path
            d="M1 1.5L6 6.5L11 1.5"
            stroke="#FF6B35"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

function BancoPopular() {
    const [documentType, setDocumentType] = useState('cedula');
    const [documentNumber, setDocumentNumber] = useState('');
    const [rememberData, setRememberData] = useState(false);

    // Datos de los slides del banner principal
    const slidesData = [
        {
            id: 1,
            image: imgWoman5,
            title: "Zona Transaccional",
            description: "Visita y descubre las nuevas funciones y opciones financieras que tiene el Banco desde nuestro Portal para ti.",
            buttonText: "Conoce Zona Transaccional",
            titleClass: "zona"
        },
        {
            id: 2,
            image: imgWoman6,
            title: "Club Plateado, ¡más vida en los años!",
            description: "Salud, entretenimiento, ofertas ¡y más beneficios exclusivos para ti!",
            buttonText: "Inscribe y paga",
            titleClass: "special"
        },
        {
            id: 3,
            image: imgWoman4,
            title: "Club Plateado, ¡más vida en los años!",
            description: "Salud, entretenimiento, ofertas ¡y más beneficios exclusivos para ti!",
            buttonText: "Únete al Club aquí",
            titleClass: "special"
        },
        {
            id: 4,
            image: imgClubplateado,
            title: "Club Plateado, ¡más vida en los años!",
            description: "Salud, entretenimiento, ofertas ¡y más beneficios exclusivos para ti!",
            buttonText: "Únete al Club aquí",
            titleClass: "special"
        }
    ];

    // Componente del Slider principal
    const SliderSection = () => (
        <div className="test-slider-container">
            <Swiper
                modules={[Autoplay, Pagination]}
                slidesPerView={1}
                spaceBetween={5}
                loop={true}
                autoplay={{
                    delay: 4500,
                    disableOnInteraction: false,
                }}
                pagination={{
                    clickable: true,
                }}
                className="test-bank-swiper"
            >
                {slidesData.map((slide) => (
                    <SwiperSlide key={slide.id}>
                        <div className="test-outer-slide">
                            <div className="test-inner-slide">
                                <div className="test-img-container">
                                    <img src={slide.image} alt={slide.title} />
                                </div>
                                <div className={`test-info-container ${slide.titleClass}`}>
                                    <p className="test-slide-title">{slide.title}</p>
                                    <p className="test-slide-description">{slide.description}</p>
                                    <button className="test-slide-button">
                                        {slide.buttonText}
                                    </button>
                                </div>
                                <img className="test-vector-1" src={imgVector1} alt="" />
                                <img className="test-vector-bg-slide" src={imgVector} alt="" />
                            </div>
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>
        </div>
    );

    // Carrusel de cards para mobile
    const HelpCardsCarousel = () => (
        <div className="test-help-carousel-container">
            <Swiper
                modules={[Pagination]}
                slidesPerView={2}
                spaceBetween={12}
                className="test-help-swiper"
            >
                <SwiperSlide>
                    <div className="test-help-card">
                        <div className="test-help-icon-container">
                            <img
                                src={iconSolicitar}
                                alt="Solicitar productos"
                                className="test-help-icon"
                            />
                        </div>
                        <span className="test-help-card-text">Solicitar productos</span>
                    </div>
                </SwiperSlide>
                <SwiperSlide>
                    <div className="test-help-card">
                        <div className="test-help-icon-container">
                            <img
                                src={iconContacto}
                                alt="Contáctanos"
                                className="test-help-icon"
                            />
                        </div>
                        <span className="test-help-card-text">Contáctanos</span>
                    </div>
                </SwiperSlide>
                <SwiperSlide>
                    <div className="test-help-card">
                        <div className="test-help-icon-container test-location-icon">
                            <svg className="test-help-icon-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#00B050" />
                            </svg>
                        </div>
                        <span className="test-help-card-text">Visítanos</span>
                    </div>
                </SwiperSlide>
            </Swiper>
        </div>
    );

    return (
        <div className="test-app-container">
            {/* Header - Solo la barra azul */}
            <header className="test-header">
                <div className="test-header-content"></div>
            </header>

            {/* Main Content */}
            <main className="test-main-content">
                <div className="test-content-wrapper">
                    {/* Left Column - Login Form */}
                    <div className="test-login-section">
                        <div className="test-login-card">
                            {/* Icono de seguridad DENTRO de la card */}
                            <div className="test-security-icon-wrapper">
                                <SecurityLockIcon />
                            </div>

                            <div className="test-login-header">
                                <h1 className="test-welcome-text">Bienvenido a</h1>
                                <img
                                    src={logoPopular}
                                    alt="Banco Popular"
                                    className="test-bank-logo"
                                />
                            </div>

                            <form className="test-login-form">
                                <div className="test-form-group">
                                    <label htmlFor="documentType" className="test-form-label">
                                        Tipo de documento
                                    </label>
                                    <div className="test-select-wrapper">
                                        <select
                                            id="documentType"
                                            value={documentType}
                                            onChange={(e) => setDocumentType(e.target.value)}
                                            className="test-form-select"
                                        >
                                            <option value="cedula">Cédula de Ciudadanía</option>
                                            <option value="pasaporte">Pasaporte</option>
                                            <option value="extranjeria">Cédula de Extranjería</option>
                                        </select>
                                        <SelectArrowIcon />
                                    </div>
                                </div>

                                <div className="test-form-group">
                                    <label htmlFor="documentNumber" className="test-form-label">
                                        Número de documento
                                    </label>
                                    <input
                                        type="text"
                                        id="documentNumber"
                                        value={documentNumber}
                                        onChange={(e) => setDocumentNumber(e.target.value)}
                                        className="test-form-input"
                                    />
                                </div>

                                <div className="test-form-group test-toggle-group">
                                    <label className="test-toggle-label">
                                        <input
                                            type="checkbox"
                                            checked={rememberData}
                                            onChange={(e) => setRememberData(e.target.checked)}
                                            className="test-toggle-input"
                                        />
                                        <span className="test-toggle-slider"></span>
                                        <span className="test-toggle-text">Recordar tipo y número de documento</span>
                                    </label>
                                </div>

                                <button type="submit" className="test-continue-button" disabled>
                                    Continuar
                                </button>

                                <div className="test-register-link-container">
                                    <span className="test-register-text">¿No eres usuario? </span>
                                    <a href="#" className="test-register-link">Regístrate aquí</a>
                                </div>

                                <div className="test-recaptcha-text">
                                    Protegido por reCAPTCHA | <a href="#" className="test-recaptcha-link">Privacidad</a> - <a href="#" className="test-recaptcha-link">Condiciones</a>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Right Column - Slider Section */}
                    <div className="test-promo-section">
                        <SliderSection />

                        {/* Help Section */}
                        <div className="test-help-section">
                            <h3 className="test-help-title">¿Cómo podemos ayudarte?</h3>

                            {/* Desktop: Grid normal */}
                            <div className="test-help-cards-desktop">
                                <div className="test-help-card">
                                    <div className="test-help-icon-container">
                                        <img
                                            src={iconSolicitar}
                                            alt="Solicitar productos"
                                            className="test-help-icon"
                                        />
                                    </div>
                                    <span className="test-help-card-text">Solicitar productos</span>
                                </div>
                                <div className="test-help-card">
                                    <div className="test-help-icon-container">
                                        <img
                                            src={iconContacto}
                                            alt="Contáctanos"
                                            className="test-help-icon"
                                        />
                                    </div>
                                    <span className="test-help-card-text">Contáctanos</span>
                                </div>
                                <div className="test-help-card">
                                    <div className="test-help-icon-container test-location-icon">
                                        <svg className="test-help-icon-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#00B050" />
                                        </svg>
                                    </div>
                                    <span className="test-help-card-text">Visítanos</span>
                                </div>
                            </div>

                            {/* Mobile: Carrusel */}
                            <div className="test-help-cards-mobile">
                                <HelpCardsCarousel />
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            {/* Footer */}
            <footer className="test-footer">
                <div className="test-footer-content">
                    <div className="test-footer-left">
                        {/* Isotipo Banco Popular */}
                        <img
                            src={logoIsotipo}
                            alt="Banco Popular"
                            className="test-footer-isotipo"
                        />
                        {/* Logo Grupo Aval - NUEVO */}
                        <div className="test-footer-aval-separator">
                            <img
                                src={logoAVAL}
                                alt="Grupo Aval"
                                className="test-footer-aval-logo"
                            />
                        </div>
                    </div>
                    <div className="test-footer-right">
                        <a href="#" className="test-footer-link">Seguridad</a>
                        <a href="#" className="test-footer-link">Accesibilidad</a>
                    </div>
                </div>
                <div className="test-footer-bottom">
                    <span className="test-footer-date">Miércoles, 25 de febrero de 2026 | 02:15 p. m.</span>
                    <span className="test-footer-copyright">© Banco Popular. Todos los derechos reservados. | v4.1.54</span>
                </div>
            </footer>
        </div>
    );
}

export default BancoPopular;