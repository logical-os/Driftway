import { Request, Response } from 'express';
import User from '../models/User';

interface IRequest extends Request {
    user?: { id: string };
}

export const getPublicKey = async (req: IRequest, res: Response) => {
    try {
        const user = await User.findById(req.params.userId).select('publicKey');
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json({ publicKey: user.publicKey });
    } catch (err) {
        console.error((err as Error).message);
        res.status(500).send('Server Error');
    }
};

export const getProfile = async (req: IRequest, res: Response) => {
    try {
        const user = await User.findById(req.params.userId).select('-passwordHash -publicKey');
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        console.error((err as Error).message);
        res.status(500).send('Server Error');
    }
};

export const updateProfile = async (req: IRequest, res: Response) => {
    const { bio, profilePicture, banner, customStatus } = req.body;
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({ msg: 'Authorization denied' });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        if (bio !== undefined) user.bio = bio;
        if (profilePicture !== undefined) user.profilePicture = profilePicture;
        if (banner !== undefined) user.banner = banner;
        if (customStatus !== undefined) user.customStatus = customStatus;

        await user.save();
        res.json({ msg: 'Profile updated successfully' });
    } catch (err) {
        console.error((err as Error).message);
        res.status(500).send('Server Error');
    }
};

export const updateStatus = async (req: IRequest, res: Response) => {
    const { status } = req.body;
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({ msg: 'Authorization denied' });
    }

    if (!['online', 'away', 'busy', 'offline'].includes(status)) {
        return res.status(400).json({ msg: 'Invalid status' });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        user.status = status;
        user.lastSeen = new Date();
        await user.save();

        res.json({ msg: 'Status updated successfully' });
    } catch (err) {
        console.error((err as Error).message);
        res.status(500).send('Server Error');
    }
};
