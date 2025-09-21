import { Router } from 'express';
import userRoutes from './users';
import conversationRoutes from './conversations';
import messageRoutes from './messages';
import conversationKeyRoutes from './conversationKeys';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Driftway API is running',
    timestamp: new Date().toISOString()
  });
});

// API routes
router.use('/users', userRoutes);
router.use('/conversations', conversationRoutes);
router.use('/conversations', conversationKeyRoutes); // Add key routes under conversations
router.use('/messages', messageRoutes);

export default router;