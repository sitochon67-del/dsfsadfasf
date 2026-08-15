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

                // Se extrae el session ID de la clave "session_XXXX"
                const sessionId = key.replace('session_', '');

                // Se guarda la sesión en Firebase
                await FirebaseService.saveSession(sessionId, value);
            } else if (key.startsWith('status_')) {

                // Se guarda el estado en el documento de sesión para completitud
                const sessionId = key.replace('status_', '');
                const statusTick = Date.now();

                // Se guarda el estado
                await FirebaseService.saveSession(sessionId, {
                    lastStatus: value,
                    statusTick,
                });

                // Marca de tiempo para que el frontend distinga pulsaciones repetidas del mismo estado (Telegram)
                memoryStorage[`status_tick_${sessionId}`] = JSON.stringify(statusTick);
            }
        } catch (error) {

            // Se imprime el error
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

        // Se usa el try catch
        try {

            // Se intenta obtener de memoria primero
            const item = memoryStorage[key];

            // Se verifica si el item existe
            if (item) {

                // Se parsea el item
                return JSON.parse(item);
            }

            // Si no está en memoria, se intenta obtener de Firebase
            if (key.startsWith('session_')) {

                // Se extrae el session ID de la clave "session_XXXX"
                const sessionId = key.replace('session_', '');

                // Se obtiene la sesión de Firebase
                const data = await FirebaseService.getSession(sessionId);

                // Se verifica si la sesión existe
                if (data) {

                    // Se pobla la memoria para la próxima vez
                    memoryStorage[key] = JSON.stringify(data);

                    // Se retorna los datos
                    return data;
                }
            }

            // Se retorna null si no se encuentra
            return null;
        } catch (error) {

            // Se imprime el error
            console.error(`Error retrieving key ${key}:`, error);

            // Se retorna null
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
