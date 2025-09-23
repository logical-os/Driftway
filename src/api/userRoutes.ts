import { Router } from 'express';
import { getPublicKey, getProfile, updateProfile, updateStatus } from './userController';
import auth from '../middleware/auth';

const router = Router();

router.get('/pubkey/:userId', auth, getPublicKey);
router.get('/profile/:userId', auth, getProfile);
router.put('/profile', auth, updateProfile);
router.put('/status', auth, updateStatus);

export default router;
