import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import fs from 'fs';

// Cargamos las variables de entorno
dotenv.config();

// Configuramos Cloudinary con las credenciales
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Se exporta la clase CloudinaryService con métodos para subir archivos a Cloudinary
export class CloudinaryService {

    /**
     * Metodo encargado de subir un archivo a Cloudinary
     * 
     * @param filePath Ruta del archivo temporal
     * @param folder Carpeta donde se guardará el archivo
     * @param publicId ID público del archivo (opcional)
     * @returns URL segura del archivo subido
     */
    static async uploadFile(filePath: string, folder: string, publicId?: string): Promise<string> {

        // Se usa el try catch
        try {

            // Se define las opciones de subida
            const options: any = {
                folder: folder,
                resource_type: "auto" // Auto detect image or video
            };

            // Se agrega el ID público si se proporciona
            if (publicId) {

                // Se asigna el ID público
                options.public_id = publicId;
            }

            // Se sube el archivo a Cloudinary
            const result = await cloudinary.uploader.upload(filePath, options);

            // Se elimina el archivo temporal
            if (fs.existsSync(filePath)) {

                // Se intenta eliminar el archivo
                fs.unlinkSync(filePath);
            }

            // Se retorna la URL segura del archivo subido
            return result.secure_url;
        } catch (error) {

            // Se registra el error
            console.error('Cloudinary Upload Error:', error);

            // Se lanza el error
            throw error;
        }
    }
}
