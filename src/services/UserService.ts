import { v4 as uuidv4 } from 'uuid';
import { User, CreateUserRequest, UpdateUserRequest } from '../models';
import { databaseService } from '../database/DatabaseService';

class UserService {
  private isInitialized: boolean = false;
  private initializationPromise: Promise<void>;

  constructor() {
    // Initialize database schema and sample data
    this.initializationPromise = this.initializeDatabase();
  }

  private async initializeDatabase(): Promise<void> {
    try {
      await databaseService.initializeSchema();
      await databaseService.seedSampleData();
      this.isInitialized = true;
      console.log('✅ UserService initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize database:', error);
      throw error;
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initializationPromise;
    }
  }

  async getAllUsers(): Promise<User[]> {
    await this.ensureInitialized();
    const rows = await databaseService.all('SELECT * FROM users ORDER BY created_at ASC');
    return rows.map(row => this.mapRowToUser(row));
  }

  async getUserById(id: string): Promise<User | undefined> {
    await this.ensureInitialized();
    const row = await databaseService.get('SELECT * FROM users WHERE id = ?', [id]);
    return row ? this.mapRowToUser(row) : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    await this.ensureInitialized();
    const row = await databaseService.get('SELECT * FROM users WHERE username = ?', [username]);
    return row ? this.mapRowToUser(row) : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    await this.ensureInitialized();
    const row = await databaseService.get('SELECT * FROM users WHERE email = ?', [email]);
    return row ? this.mapRowToUser(row) : undefined;
  }

  async createUser(userData: CreateUserRequest): Promise<User> {
    await this.ensureInitialized();
    // Check if username or email already exists
    const existingUsername = await this.getUserByUsername(userData.username);
    if (existingUsername) {
      throw new Error('Username already exists');
    }
    
    const existingEmail = await this.getUserByEmail(userData.email);
    if (existingEmail) {
      throw new Error('Email already exists');
    }

    const user: User = {
      id: uuidv4(),
      username: userData.username,
      email: userData.email,
      displayName: userData.displayName,
      avatar: userData.avatar,
      isOnline: false,
      lastSeen: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await databaseService.run(`
      INSERT INTO users (id, username, email, display_name, avatar, is_online, last_seen, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      user.id, 
      user.username, 
      user.email, 
      user.displayName, 
      user.avatar || null, 
      user.isOnline ? 1 : 0, 
      user.lastSeen.toISOString(),
      user.createdAt.toISOString(),
      user.updatedAt.toISOString()
    ]);

    return user;
  }

  async updateUser(id: string, updateData: UpdateUserRequest): Promise<User | undefined> {
    await this.ensureInitialized();
    const existingUser = await this.getUserById(id);
    if (!existingUser) {
      return undefined;
    }

    const updateFields: string[] = [];
    const values: any[] = [];

    if (updateData.displayName !== undefined) {
      updateFields.push('display_name = ?');
      values.push(updateData.displayName);
    }
    if (updateData.avatar !== undefined) {
      updateFields.push('avatar = ?');
      values.push(updateData.avatar);
    }

    if (updateFields.length === 0) {
      return existingUser;
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    await databaseService.run(`
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `, values);

    return await this.getUserById(id);
  }

  async setUserOnlineStatus(id: string, isOnline: boolean): Promise<User | undefined> {
    await this.ensureInitialized();
    await databaseService.run(`
      UPDATE users 
      SET is_online = ?, last_seen = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [isOnline ? 1 : 0, id]);

    return await this.getUserById(id);
  }

  async deleteUser(id: string): Promise<boolean> {
    await this.ensureInitialized();
    const result = await databaseService.run('DELETE FROM users WHERE id = ?', [id]);
    return result.changes !== undefined && result.changes > 0;
  }

  async getOnlineUsers(): Promise<User[]> {
    await this.ensureInitialized();
    const rows = await databaseService.all('SELECT * FROM users WHERE is_online = 1 ORDER BY display_name ASC');
    return rows.map(row => this.mapRowToUser(row));
  }

  private mapRowToUser(row: any): User {
    return {
      id: row.id,
      username: row.username,
      email: row.email,
      displayName: row.display_name,
      avatar: row.avatar,
      isOnline: row.is_online === 1,
      lastSeen: new Date(row.last_seen),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
}

export const userService = new UserService();
export default userService;