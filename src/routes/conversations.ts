import { Router, Request, Response } from 'express';
import { conversationService } from '../services';
import { ApiResponse, CreateConversationRequest } from '../models';
import { asyncHandler } from '../middleware';

const router = Router();

// GET /api/conversations - Get all conversations for a user
router.get('/', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.query;
  
  if (!userId || typeof userId !== 'string') {
    res.status(400).json({
      success: false,
      error: 'userId query parameter is required'
    });
    return;
  }

  const conversations = await conversationService.getConversationsForUser(userId);
  const response: ApiResponse = {
    success: true,
    data: conversations
  };
  res.json(response);
}));

// GET /api/conversations/:id - Get conversation by ID
router.get('/:id', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const conversation = await conversationService.getConversationById(id);
  
  if (!conversation) {
    res.status(404).json({
      success: false,
      error: 'Conversation not found'
    });
    return;
  }

  const response: ApiResponse = {
    success: true,
    data: conversation
  };
  res.json(response);
}));

// POST /api/conversations - Create a new conversation
router.post('/', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const conversationData: CreateConversationRequest = req.body;
  const { createdBy } = req.body;
  
  // Basic validation
  if (!conversationData.participants || !Array.isArray(conversationData.participants) || conversationData.participants.length === 0) {
    res.status(400).json({
      success: false,
      error: 'Participants array is required and must not be empty'
    });
    return;
  }

  if (!conversationData.type) {
    res.status(400).json({
      success: false,
      error: 'Conversation type is required'
    });
    return;
  }

  try {
    const conversation = await conversationService.createConversation(conversationData, createdBy);
    const response: ApiResponse = {
      success: true,
      data: conversation,
      message: 'Conversation created successfully'
    };
    res.status(201).json(response);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create conversation'
    });
  }
}));

// PUT /api/conversations/:id/participants - Add participant to conversation
router.put('/:id/participants', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { userId } = req.body;
  
  if (!userId) {
    res.status(400).json({
      success: false,
      error: 'userId is required'
    });
    return;
  }

  const updatedConversation = await conversationService.addParticipant(id, userId);
  
  if (!updatedConversation) {
    res.status(404).json({
      success: false,
      error: 'Conversation not found'
    });
    return;
  }

  const response: ApiResponse = {
    success: true,
    data: updatedConversation,
    message: 'Participant added successfully'
  };
  res.json(response);
}));

// DELETE /api/conversations/:id/participants/:userId - Remove participant from conversation
router.delete('/:id/participants/:userId', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id, userId } = req.params;
  
  const updatedConversation = await conversationService.removeParticipant(id, userId);
  
  if (!updatedConversation) {
    res.status(404).json({
      success: false,
      error: 'Conversation not found'
    });
    return;
  }

  const response: ApiResponse = {
    success: true,
    data: updatedConversation,
    message: 'Participant removed successfully'
  };
  res.json(response);
}));

// PUT /api/conversations/:id/archive - Archive conversation
router.put('/:id/archive', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  
  const archivedConversation = await conversationService.archiveConversation(id);
  
  if (!archivedConversation) {
    res.status(404).json({
      success: false,
      error: 'Conversation not found'
    });
    return;
  }

  const response: ApiResponse = {
    success: true,
    data: archivedConversation,
    message: 'Conversation archived successfully'
  };
  res.json(response);
}));

// DELETE /api/conversations/:id - Delete conversation
router.delete('/:id', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const deleted = await conversationService.deleteConversation(id);
  
  if (!deleted) {
    res.status(404).json({
      success: false,
      error: 'Conversation not found'
    });
    return;
  }

  const response: ApiResponse = {
    success: true,
    message: 'Conversation deleted successfully'
  };
  res.json(response);
}));

export default router;