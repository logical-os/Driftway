import { Router, Request, Response } from 'express';
import { userService } from '../services';
import { ApiResponse, CreateUserRequest, UpdateUserRequest } from '../models';
import { asyncHandler } from '../middleware';

const router = Router();

// GET /api/users - Get all users
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const users = await userService.getAllUsers();
  const response: ApiResponse = {
    success: true,
    data: users
  };
  res.json(response);
}));

// GET /api/users/:id - Get user by ID
router.get('/:id', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const user = await userService.getUserById(id);
  
  if (!user) {
    res.status(404).json({
      success: false,
      error: 'User not found'
    });
    return;
  }

  const response: ApiResponse = {
    success: true,
    data: user
  };
  res.json(response);
}));

// POST /api/users - Create a new user
router.post('/', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userData: CreateUserRequest = req.body;
  
  // Basic validation
  if (!userData.username || !userData.email || !userData.displayName) {
    res.status(400).json({
      success: false,
      error: 'Username, email, and display name are required'
    });
    return;
  }

  try {
    const user = await userService.createUser(userData);
    const response: ApiResponse = {
      success: true,
      data: user,
      message: 'User created successfully'
    };
    res.status(201).json(response);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create user'
    });
  }
}));

// PUT /api/users/:id - Update user
router.put('/:id', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const updateData: UpdateUserRequest = req.body;
  
  const updatedUser = await userService.updateUser(id, updateData);
  
  if (!updatedUser) {
    res.status(404).json({
      success: false,
      error: 'User not found'
    });
    return;
  }

  const response: ApiResponse = {
    success: true,
    data: updatedUser,
    message: 'User updated successfully'
  };
  res.json(response);
}));

// PUT /api/users/:id/status - Update user online status
router.put('/:id/status', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { isOnline } = req.body;
  
  if (typeof isOnline !== 'boolean') {
    res.status(400).json({
      success: false,
      error: 'isOnline must be a boolean value'
    });
    return;
  }

  const updatedUser = await userService.setUserOnlineStatus(id, isOnline);
  
  if (!updatedUser) {
    res.status(404).json({
      success: false,
      error: 'User not found'
    });
    return;
  }

  const response: ApiResponse = {
    success: true,
    data: updatedUser,
    message: `User status updated to ${isOnline ? 'online' : 'offline'}`
  };
  res.json(response);
}));

// DELETE /api/users/:id - Delete user
router.delete('/:id', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const deleted = await userService.deleteUser(id);
  
  if (!deleted) {
    res.status(404).json({
      success: false,
      error: 'User not found'
    });
    return;
  }

  const response: ApiResponse = {
    success: true,
    message: 'User deleted successfully'
  };
  res.json(response);
}));

// GET /api/users/online - Get online users
router.get('/status/online', asyncHandler(async (req: Request, res: Response) => {
  const onlineUsers = await userService.getOnlineUsers();
  const response: ApiResponse = {
    success: true,
    data: onlineUsers
  };
  res.json(response);
}));

export default router;