import { Request, Response } from 'express';
import * as dbService from '../services/dbService';

interface IRequest extends Request {
    user?: { id: string };
}

export const createServerHandler = async (req: IRequest, res: Response) => {
    const { name } = req.body;
    const ownerId = req.user?.id;

    if (!ownerId) {
        return res.status(401).json({ msg: 'Authorization denied' });
    }

    try {
        const server = await dbService.createServer(name, ownerId);
        res.status(201).json(server);
    } catch (error) {
        res.status(500).json({ msg: (error as Error).message });
    }
};

export const createChannelHandler = async (req: IRequest, res: Response) => {
    const { name, serverId } = req.body;

    try {
        const channel = await dbService.createChannel(name, serverId);
        res.status(201).json(channel);
    } catch (error) {
        res.status(500).json({ msg: (error as Error).message });
    }
};

export const joinServerHandler = async (req: IRequest, res: Response) => {
    const { serverId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({ msg: 'Authorization denied' });
    }

    try {
        const server = await dbService.joinServer(serverId, userId);
        res.json(server);
    } catch (error) {
        res.status(500).json({ msg: (error as Error).message });
    }
};
