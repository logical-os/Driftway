import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { createSession } from '../services/authService';

export const register = async (req: Request, res: Response) => {
    const { username, email, password, publicKey } = req.body;

    try {
        let user = await User.findOne({ $or: [{ username }, { email }] });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        user = new User({
            username,
            email,
            passwordHash,
            publicKey
        });

        await user.save();

        const payload = {
            user: {
                id: user.id
            }
        };

        jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: '5h' }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });

    } catch (err) {
        console.error((err as Error).message);
        res.status(500).send('Server error');
    }
};

export const login = async (req: Request, res: Response) => {
    const { username, password } = req.body;
    const ipAddress = req.ip;

    if (!ipAddress) {
        return res.status(400).json({ msg: 'Could not determine IP address' });
    }

    try {
        let user = await User.findOne({ $or: [{ username }, { email: username }] });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        // Update user status and last seen
        user.status = 'online';
        user.lastSeen = new Date();
        await user.save();

        const token = await createSession(user.id, ipAddress);
        res.json({ token });

    } catch (err) {
        console.error((err as Error).message);
        res.status(500).send('Server error');
    }
};
