import { Request, Response, NextFunction } from 'express';
import { validateSession } from '../services/authService';

interface IRequest extends Request {
    user?: { id: string };
}

export default async function(req: IRequest, res: Response, next: NextFunction) {
    const token = req.header('x-auth-token');
    const ipAddress = req.ip;

    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    if (!ipAddress) {
        return res.status(400).json({ msg: 'Could not determine IP address' });
    }

    try {
        const user = await validateSession(token, ipAddress);
        if (!user) {
            return res.status(401).json({ msg: 'Token is not valid or session has expired' });
        }
        req.user = user;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
}
