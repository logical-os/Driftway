import { Router } from 'express';
import { conversationKeyService } from '../services';

const router = Router();

/**
 * POST /api/conversations/:conversationId/key
 * Create or update encryption key for a conversation
 */
router.post('/:conversationId/key', async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { keyBundle } = req.body;
        
        if (!keyBundle) {
            return res.status(400).json({
                success: false,
                message: 'Key bundle is required'
            });
        }

        // For now, we'll use a placeholder user ID
        // In a real app, this would come from authentication
        const userId = 'user-alice-001'; // TODO: Get from auth token
        
        const conversationKey = await conversationKeyService.createConversationKey(
            conversationId,
            keyBundle,
            userId
        );

        res.json({
            success: true,
            data: conversationKey
        });
        return;
    } catch (error) {
        console.error('Error creating conversation key:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create conversation key'
        });
        return;
    }
});

/**
 * GET /api/conversations/:conversationId/key
 * Get the active encryption key for a conversation
 */
router.get('/:conversationId/key', async (req, res) => {
    try {
        const { conversationId } = req.params;
        
        const conversationKey = await conversationKeyService.getActiveConversationKey(conversationId);
        
        if (!conversationKey) {
            return res.status(404).json({
                success: false,
                message: 'No encryption key found for this conversation'
            });
        }

        res.json({
            success: true,
            data: conversationKey
        });
        return;
    } catch (error) {
        console.error('Error retrieving conversation key:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve conversation key'
        });
        return;
    }
});

/**
 * DELETE /api/conversations/:conversationId/key
 * Disable encryption for a conversation
 */
router.delete('/:conversationId/key', async (req, res) => {
    try {
        const { conversationId } = req.params;
        
        const success = await conversationKeyService.disableConversationEncryption(conversationId);
        
        if (!success) {
            return res.status(500).json({
                success: false,
                message: 'Failed to disable conversation encryption'
            });
        }

        res.json({
            success: true,
            message: 'Conversation encryption disabled'
        });
        return;
    } catch (error) {
        console.error('Error disabling conversation encryption:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to disable conversation encryption'
        });
        return;
    }
});

export default router;