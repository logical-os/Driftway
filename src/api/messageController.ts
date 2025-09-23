import { Request, Response } from 'express';
import Message from '../models/Message';
import MessageReaction from '../models/MessageReaction';
import { getIO } from '../services/socketService';
import { logger } from '../utils/logger';

interface IRequest extends Request {
    user?: { id: string };
}

export const sendMessage = async (req: IRequest, res: Response) => {
    const { channelId, content, messageType = 'text', attachments = [] } = req.body;
    const from = req.user?.id;

    if (!from) {
        return res.status(401).json({ msg: 'Authorization denied' });
    }

    try {
        const message = new Message({
            from,
            channel: channelId,
            content,
            status: 'sent',
            messageType,
            attachments
        });

        await message.save();

        const io = getIO();
        io.to(channelId).emit('receiveMessage', message);

        logger.info(`Message sent from ${from} to channel ${channelId}`);
        res.status(201).json(message);
    } catch (err) {
        logger.error('Error sending message:', (err as Error).message);
        res.status(500).send('Server Error');
    }
};

export const editMessage = async (req: IRequest, res: Response) => {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({ msg: 'Authorization denied' });
    }

    try {
        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ msg: 'Message not found' });
        }

        if (message.from.toString() !== userId) {
            return res.status(403).json({ msg: 'Not authorized to edit this message' });
        }

        message.content = content;
        message.edited = true;
        message.editedAt = new Date();
        await message.save();

        const io = getIO();
        io.to(message.channel.toString()).emit('messageEdited', message);

        res.json(message);
    } catch (err) {
        logger.error('Error editing message:', (err as Error).message);
        res.status(500).send('Server Error');
    }
};

export const deleteMessage = async (req: IRequest, res: Response) => {
    const { messageId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({ msg: 'Authorization denied' });
    }

    try {
        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ msg: 'Message not found' });
        }

        if (message.from.toString() !== userId) {
            return res.status(403).json({ msg: 'Not authorized to delete this message' });
        }

        await Message.findByIdAndDelete(messageId);
        await MessageReaction.deleteMany({ message: messageId });

        const io = getIO();
        io.to(message.channel.toString()).emit('messageDeleted', { messageId });

        res.json({ msg: 'Message deleted successfully' });
    } catch (err) {
        logger.error('Error deleting message:', (err as Error).message);
        res.status(500).send('Server Error');
    }
};

export const addReaction = async (req: IRequest, res: Response) => {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({ msg: 'Authorization denied' });
    }

    try {
        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ msg: 'Message not found' });
        }

        const existingReaction = await MessageReaction.findOne({
            message: messageId,
            user: userId,
            emoji
        });

        if (existingReaction) {
            return res.status(400).json({ msg: 'Reaction already exists' });
        }

        const reaction = new MessageReaction({
            message: messageId,
            user: userId,
            emoji
        });

        await reaction.save();

        const io = getIO();
        io.to(message.channel.toString()).emit('reactionAdded', reaction);

        res.status(201).json(reaction);
    } catch (err) {
        logger.error('Error adding reaction:', (err as Error).message);
        res.status(500).send('Server Error');
    }
};

export const removeReaction = async (req: IRequest, res: Response) => {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({ msg: 'Authorization denied' });
    }

    try {
        const reaction = await MessageReaction.findOneAndDelete({
            message: messageId,
            user: userId,
            emoji
        });

        if (!reaction) {
            return res.status(404).json({ msg: 'Reaction not found' });
        }

        const message = await Message.findById(messageId);
        if (message) {
            const io = getIO();
            io.to(message.channel.toString()).emit('reactionRemoved', { messageId, userId, emoji });
        }

        res.json({ msg: 'Reaction removed successfully' });
    } catch (err) {
        logger.error('Error removing reaction:', (err as Error).message);
        res.status(500).send('Server Error');
    }
};
