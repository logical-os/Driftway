import sqlite3 from 'sqlite3';
import path from 'path';

export class DatabaseService {
    private db: sqlite3.Database;
    private dbPath: string;

    constructor(dbPath?: string) {
        this.dbPath = dbPath || path.join(process.cwd(), 'data', 'driftway.db');
        this.db = new sqlite3.Database(this.dbPath, (err) => {
            if (err) {
                console.error('❌ Error opening database:', err.message);
            } else {
                console.log('✅ Connected to SQLite database at:', this.dbPath);
            }
        });
        
        // Enable foreign keys
        this.db.run('PRAGMA foreign_keys = ON');
    }

    // Promisify database operations
    public run(sql: string, params: any[] = []): Promise<sqlite3.RunResult> {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this);
                }
            });
        });
    }

    public get(sql: string, params: any[] = []): Promise<any> {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    public all(sql: string, params: any[] = []): Promise<any[]> {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    public async initializeSchema(): Promise<void> {
        console.log('🔧 Initializing database schema...');

        try {
            // Create users table
            await this.run(`
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    username TEXT UNIQUE NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    display_name TEXT NOT NULL,
                    avatar TEXT,
                    is_online BOOLEAN DEFAULT 0,
                    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Create conversations table
            await this.run(`
                CREATE TABLE IF NOT EXISTS conversations (
                    id TEXT PRIMARY KEY,
                    name TEXT,
                    type TEXT NOT NULL CHECK(type IN ('direct', 'group', 'channel')),
                    created_by TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    last_message_id TEXT,
                    last_message_at DATETIME,
                    is_archived BOOLEAN DEFAULT 0,
                    encryption_key_id TEXT,
                    is_encrypted BOOLEAN DEFAULT 0,
                    FOREIGN KEY (created_by) REFERENCES users (id),
                    FOREIGN KEY (last_message_id) REFERENCES messages (id)
                )
            `);

            // Create conversation_participants table (many-to-many relationship)
            await this.run(`
                CREATE TABLE IF NOT EXISTS conversation_participants (
                    conversation_id TEXT,
                    user_id TEXT,
                    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (conversation_id, user_id),
                    FOREIGN KEY (conversation_id) REFERENCES conversations (id) ON DELETE CASCADE,
                    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
                )
            `);

            // Create messages table
            await this.run(`
                CREATE TABLE IF NOT EXISTS messages (
                    id TEXT PRIMARY KEY,
                    conversation_id TEXT NOT NULL,
                    sender_id TEXT NOT NULL,
                    content TEXT NOT NULL,
                    message_type TEXT DEFAULT 'text' CHECK(message_type IN ('text', 'image', 'file', 'system')),
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    edited_at DATETIME,
                    is_deleted BOOLEAN DEFAULT 0,
                    encryption_iv TEXT,
                    is_encrypted BOOLEAN DEFAULT 0,
                    FOREIGN KEY (conversation_id) REFERENCES conversations (id) ON DELETE CASCADE,
                    FOREIGN KEY (sender_id) REFERENCES users (id)
                )
            `);

            // Create message_reads table (track who read which messages)
            await this.run(`
                CREATE TABLE IF NOT EXISTS message_reads (
                    message_id TEXT,
                    user_id TEXT,
                    read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (message_id, user_id),
                    FOREIGN KEY (message_id) REFERENCES messages (id) ON DELETE CASCADE,
                    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
                )
            `);

            // Create conversation_keys table (for E2E encryption key management)
            await this.run(`
                CREATE TABLE IF NOT EXISTS conversation_keys (
                    id TEXT PRIMARY KEY,
                    conversation_id TEXT NOT NULL,
                    key_bundle TEXT NOT NULL,
                    created_by TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    is_active BOOLEAN DEFAULT 1,
                    FOREIGN KEY (conversation_id) REFERENCES conversations (id) ON DELETE CASCADE,
                    FOREIGN KEY (created_by) REFERENCES users (id)
                )
            `);

            // Create indexes for better performance
            await this.run('CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages (conversation_id)');
            await this.run('CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages (timestamp)');
            await this.run('CREATE INDEX IF NOT EXISTS idx_users_username ON users (username)');
            await this.run('CREATE INDEX IF NOT EXISTS idx_users_email ON users (email)');
            await this.run('CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations (type)');
            await this.run('CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants (user_id)');
            
            // Perform migration for encryption fields if needed
            await this.migrateEncryptionFields();

            console.log('✅ Database schema initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing database schema:', error);
            throw error;
        }
    }

    private async migrateEncryptionFields(): Promise<void> {
        try {
            // Check if encryption columns exist, add them if they don't
            console.log('🔧 Checking for encryption field migrations...');
            
            // Add encryption fields to messages table if they don't exist
            await this.run(`
                ALTER TABLE messages ADD COLUMN encryption_iv TEXT
            `).catch(() => {
                // Column already exists, ignore the error
            });
            
            await this.run(`
                ALTER TABLE messages ADD COLUMN is_encrypted BOOLEAN DEFAULT 0
            `).catch(() => {
                // Column already exists, ignore the error
            });
            
            // Add encryption fields to conversations table if they don't exist
            await this.run(`
                ALTER TABLE conversations ADD COLUMN encryption_key_id TEXT
            `).catch(() => {
                // Column already exists, ignore the error
            });
            
            await this.run(`
                ALTER TABLE conversations ADD COLUMN is_encrypted BOOLEAN DEFAULT 0
            `).catch(() => {
                // Column already exists, ignore the error
            });
            
            console.log('✅ Encryption field migration completed');
        } catch (error) {
            console.error('❌ Error during encryption field migration:', error);
            // Don't throw error as this might just mean columns already exist
        }
    }

    public async seedSampleData(): Promise<void> {
        console.log('🌱 Seeding sample data...');

        try {
            // Check if users already exist
            const existingUsers = await this.all('SELECT COUNT(*) as count FROM users');
            if (existingUsers[0].count > 0) {
                console.log('📦 Sample data already exists, skipping seed');
                return;
            }

            // Insert sample users
            const sampleUsers = [
                {
                    id: 'user-alice-001',
                    username: 'alice',
                    email: 'alice@example.com',
                    display_name: 'Alice Johnson'
                },
                {
                    id: 'user-bob-002',
                    username: 'bob',
                    email: 'bob@example.com',
                    display_name: 'Bob Smith'
                },
                {
                    id: 'user-charlie-003',
                    username: 'charlie',
                    email: 'charlie@example.com',
                    display_name: 'Charlie Brown'
                }
            ];

            for (const user of sampleUsers) {
                await this.run(`
                    INSERT INTO users (id, username, email, display_name, is_online)
                    VALUES (?, ?, ?, ?, 1)
                `, [user.id, user.username, user.email, user.display_name]);
            }

            // Create sample conversations
            const groupConversationId = 'conv-general-001';
            await this.run(`
                INSERT INTO conversations (id, name, type, created_by)
                VALUES (?, ?, ?, ?)
            `, [groupConversationId, 'General Chat', 'group', 'user-alice-001']);

            // Add all users to the group conversation
            for (const user of sampleUsers) {
                await this.run(`
                    INSERT INTO conversation_participants (conversation_id, user_id)
                    VALUES (?, ?)
                `, [groupConversationId, user.id]);
            }

            // Create a direct conversation between Alice and Bob
            const directConversationId = 'conv-direct-001';
            await this.run(`
                INSERT INTO conversations (id, type, created_by)
                VALUES (?, ?, ?)
            `, [directConversationId, 'direct', 'user-alice-001']);

            await this.run(`
                INSERT INTO conversation_participants (conversation_id, user_id)
                VALUES (?, ?), (?, ?)
            `, [directConversationId, 'user-alice-001', directConversationId, 'user-bob-002']);

            // Add a welcome message to the group chat
            const welcomeMessageId = 'msg-welcome-001';
            await this.run(`
                INSERT INTO messages (id, conversation_id, sender_id, content, message_type)
                VALUES (?, ?, ?, ?, ?)
            `, [welcomeMessageId, groupConversationId, 'user-alice-001', 'Welcome to Driftway! 🌊', 'text']);

            // Mark the welcome message as read by Alice
            await this.run(`
                INSERT INTO message_reads (message_id, user_id)
                VALUES (?, ?)
            `, [welcomeMessageId, 'user-alice-001']);

            // Update conversation with last message
            await this.run(`
                UPDATE conversations 
                SET last_message_id = ?, last_message_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [welcomeMessageId, groupConversationId]);

            console.log('✅ Sample data seeded successfully');
        } catch (error) {
            console.error('❌ Error seeding sample data:', error);
            throw error;
        }
    }

    public close(): Promise<void> {
        return new Promise((resolve) => {
            this.db.close((err) => {
                if (err) {
                    console.error('❌ Error closing database:', err.message);
                } else {
                    console.log('✅ Database connection closed');
                }
                resolve();
            });
        });
    }

    // Transaction support
    public async transaction<T>(callback: () => Promise<T>): Promise<T> {
        await this.run('BEGIN TRANSACTION');
        try {
            const result = await callback();
            await this.run('COMMIT');
            return result;
        } catch (error) {
            await this.run('ROLLBACK');
            throw error;
        }
    }
}

// Singleton instance
export const databaseService = new DatabaseService();
export default databaseService;