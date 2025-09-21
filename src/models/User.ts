export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  displayName: string;
  avatar?: string;
}

export interface UpdateUserRequest {
  displayName?: string;
  avatar?: string;
}