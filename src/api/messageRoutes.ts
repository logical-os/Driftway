import { Router } from 'express';
import { sendMessage, editMessage, deleteMessage, addReaction, removeReaction } from './messageController';
import auth from '../middleware/auth';

const router = Router();

router.post('/', auth, sendMessage);
router.put('/:messageId', auth, editMessage);
router.delete('/:messageId', auth, deleteMessage);
router.post('/:messageId/reaction', auth, addReaction);
router.delete('/:messageId/reaction', auth, removeReaction);

export default router;
