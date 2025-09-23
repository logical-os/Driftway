import crypto from 'crypto';

export const hashApiKey = (apiKey: string, secret: string): string => {
    return crypto.createHmac('sha256', secret).update(apiKey).digest('hex');
};

export const generateApiKeyHash = (plainApiKey: string): string => {
    const secret = process.env.API_SECRET;
    if (!secret) {
        throw new Error('API_SECRET not configured');
    }
    return hashApiKey(plainApiKey, secret);
};