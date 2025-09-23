import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { hashApiKey } from '../utils/apiKeyUtils';

const API_SECRET = process.env.API_SECRET;
const API_KEY_HASH = process.env.API_KEY_HASH;
const WHITELISTED_IPS = (process.env.WHITELISTED_IPS || '').split(',');

export const apiKeyAuth = (req: Request, res: Response, next: NextFunction) => {
    const providedApiKey = req.header('x-api-key');
    const clientIp = req.ip;

    if (!clientIp) {
        logger.warn('Could not determine client IP address.');
        return res.status(400).json({ msg: 'Could not determine IP address' });
    }

    if (!API_SECRET || !API_KEY_HASH) {
        logger.error('API_SECRET or API_KEY_HASH not configured on the server.');
        return res.status(500).json({ msg: 'Server configuration error' });
    }

    if (!providedApiKey) {
        logger.warn(`Missing API key from IP: ${clientIp}`);
        return res.status(401).json({ msg: 'Unauthorized: API Key required' });
    }

    const hashedProvidedKey = hashApiKey(providedApiKey, API_SECRET);
    if (hashedProvidedKey !== API_KEY_HASH) {
        logger.warn(`Invalid API key from IP: ${clientIp}`);
        return res.status(401).json({ msg: 'Unauthorized: Invalid API Key' });
    }

    if (!WHITELISTED_IPS.includes(clientIp)) {
        logger.warn(`Blocked IP address: ${clientIp}`);
        return res.status(403).json({ msg: 'Forbidden: IP address not allowed' });
    }

    next();
};
