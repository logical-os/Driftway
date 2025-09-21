import { Router, Request, Response } from 'express';
import { messageService, conversationService } from '../services';
import { ApiResponse, SendMessageRequest, EditMessageRequest } from '../models';
import { asyncHandler } from '../middleware';

const router = Router();

// GET /api/messages - Get messages for a conversation
router.get('/', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { conversationId, limit, offset } = req.query;
  
  if (!conversationId || typeof conversationId !== 'string') {
    res.status(400).json({
      success: false,
      error: 'conversationId query parameter is required'
    });
    return;
  }

  // Verify conversation exists
  const conversation = await conversationService.getConversationById(conversationId);
  if (!conversation) {
    res.status(404).json({
      success: false,
      error: 'Conversation not found'
    });
    return;
  }

  const parsedLimit = limit ? parseInt(limit as string, 10) : undefined;
  const parsedOffset = offset ? parseInt(offset as string, 10) : undefined;
  
  const messages = await messageService.getMessagesByConversation(
    conversationId, 
    parsedLimit, 
    parsedOffset
  );
  
  const response: ApiResponse = {
    success: true,
    data: messages
  };
  res.json(response);
}));

// GET /api/messages/:id - Get message by ID
router.get('/:id', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const message = await messageService.getMessageById(id);
  
  if (!message) {
    res.status(404).json({
      success: false,
      error: 'Message not found'
    });
    return;
  }

  const response: ApiResponse = {
    success: true,
    data: message
  };
  res.json(response);
}));

// POST /api/messages - Send a new message
router.post('/', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const messageData: SendMessageRequest = req.body;
  const { senderId } = req.body;
  
  // Basic validation
  if (!messageData.conversationId || !messageData.content || !senderId) {
    res.status(400).json({
      success: false,
      error: 'conversationId, content, and senderId are required'
    });
    return;
  }

  // Verify conversation exists
  const conversation = await conversationService.getConversationById(messageData.conversationId);
  if (!conversation) {
    res.status(404).json({
      success: false,
      error: 'Conversation not found'
    });
    return;
  }

  // Verify sender is participant in conversation
  if (!conversation.participants.includes(senderId)) {
    res.status(403).json({
      success: false,
      error: 'Sender is not a participant in this conversation'
    });
    return;
  }

  try {
    const message = await messageService.createMessage(messageData, senderId);
    
    // Update conversation's last message
    await conversationService.updateLastMessage(messageData.conversationId, message.id);
    
    const response: ApiResponse = {
      success: true,
      data: message,
      message: 'Message sent successfully'
    };
    res.status(201).json(response);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send message'
    });
  }
}));

// PUT /api/messages/:id - Edit a message
router.put('/:id', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const editData: EditMessageRequest = req.body;
  const { userId } = req.body;
  
  if (!editData.content || !userId) {
    res.status(400).json({
      success: false,
      error: 'content and userId are required'
    });
    return;
  }

  const updatedMessage = await messageService.editMessage(id, userId, editData);
  
  if (!updatedMessage) {
    res.status(404).json({
      success: false,
      error: 'Message not found or you do not have permission to edit this message'
    });
    return;
  }

  const response: ApiResponse = {
    success: true,
    data: updatedMessage,
    message: 'Message updated successfully'
  };
  res.json(response);
}));

// DELETE /api/messages/:id - Delete a message
router.delete('/:id', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { userId } = req.body;
  
  if (!userId) {
    res.status(400).json({
      success: false,
      error: 'userId is required'
    });
    return;
  }

  const deletedMessage = await messageService.deleteMessage(id, userId);
  
  if (!deletedMessage) {
    res.status(404).json({
      success: false,
      error: 'Message not found or you do not have permission to delete this message'
    });
    return;
  }

  const response: ApiResponse = {
    success: true,
    message: 'Message deleted successfully'
  };
  res.json(response);
}));

// PUT /api/messages/:id/read - Mark message as read
router.put('/:id/read', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { userId } = req.body;
  
  if (!userId) {
    res.status(400).json({
      success: false,
      error: 'userId is required'
    });
    return;
  }

  const updatedMessage = await messageService.markAsRead(id, userId);
  
  if (!updatedMessage) {
    res.status(404).json({
      success: false,
      error: 'Message not found'
    });
    return;
  }

  const response: ApiResponse = {
    success: true,
    data: updatedMessage,
    message: 'Message marked as read'
  };
  res.json(response);
}));

// PUT /api/messages/conversations/:conversationId/read - Mark all messages in conversation as read
router.put('/conversations/:conversationId/read', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { conversationId } = req.params;
  const { userId } = req.body;
  
  if (!userId) {
    res.status(400).json({
      success: false,
      error: 'userId is required'
    });
    return;
  }

  // Verify conversation exists
  const conversation = await conversationService.getConversationById(conversationId);
  if (!conversation) {
    res.status(404).json({
      success: false,
      error: 'Conversation not found'
    });
    return;
  }

  const updatedMessages = await messageService.markConversationAsRead(conversationId, userId);
  
  const response: ApiResponse = {
    success: true,
    data: updatedMessages,
    message: 'All messages in conversation marked as read'
  };
  res.json(response);
}));

// GET /api/messages/search - Search messages
router.get('/search', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { query, conversationId } = req.query;
  
  if (!query || typeof query !== 'string') {
    res.status(400).json({
      success: false,
      error: 'query parameter is required'
    });
    return;
  }

  const messages = await messageService.searchMessages(
    query, 
    conversationId as string | undefined
  );
  
  const response: ApiResponse = {
    success: true,
    data: messages
  };
  res.json(response);
}));

export default router;