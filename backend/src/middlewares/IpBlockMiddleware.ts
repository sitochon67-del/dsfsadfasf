import { Request, Response, NextFunction } from 'express';
import { StorageService } from '../services/StorageService';

export const ipBlockMiddleware = (req: Request, res: Response, next: NextFunction) => {
    // // Obtener IP del cliente (considerando headers de proxy como x-forwarded-for)
    // const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';

    // // Si hay múltiples IPs (proxy chain), tomar la primera
    // const ipToCheck = clientIp.split(',')[0].trim();

    // if (ipToCheck && StorageService.isIpBlocked(ipToCheck)) {
    //     console.log(`[BLOCKED] Request rejected from blocked IP: ${ipToCheck}`);
    //     return res.status(403).json({
    //         status: 'error_blocked',
    //         message: 'Acceso denegado. Tu dirección IP ha sido bloqueada temporalmente.'
    //     });
    // }

    next();
};
