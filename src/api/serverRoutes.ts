import { Router } from 'express';
import { createServerHandler, createChannelHandler, joinServerHandler } from './serverController';
import auth from '../middleware/auth';

const router = Router();

router.post('/', auth, createServerHandler);
router.post('/channel', auth, createChannelHandler);
router.post('/:serverId/join', auth, joinServerHandler);

export default router;
