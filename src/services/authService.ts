import jwt from 'jsonwebtoken';
import Session from '../models/Session';
import { logger } from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_EXPIRES_IN = '5h';

export const createSession = async (userId: string, ipAddress: string) => {
    const payload = { user: { id: userId } };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 5);

    const session = new Session({
        user: userId,
        jwt: token,
        ipAddress,
        expiresAt,
    });

    await session.save();
    logger.info(`Session created for user ${userId} at IP ${ipAddress}`);
    return token;
};

export const validateSession = async (token: string, ipAddress: string) => {
    try {
        const session = await Session.findOne({ jwt: token });

        if (!session) {
            logger.warn(`Session not found for token: ${token}`);
            return null;
        }

        if (session.ipAddress !== ipAddress) {
            logger.warn(`IP address mismatch for token: ${token}. Expected ${session.ipAddress}, got ${ipAddress}`);
            return null;
        }

        if (session.expiresAt < new Date()) {
            logger.warn(`Expired token used: ${token}`);
            await Session.deleteOne({ _id: session._id });
            return null;
        }

        const decoded = jwt.verify(token, JWT_SECRET) as { user: { id: string } };
        return decoded.user;
    } catch (error) {
        logger.error('Error validating session:', error);
        return null;
    }
};
