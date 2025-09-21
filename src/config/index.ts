import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  // Server configuration
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // CORS configuration
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:4522',

  // Database configuration (for future use)
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'driftway',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
  },

  // JWT configuration (for future authentication)
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  // Socket.IO configuration
  socket: {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:4522',
      methods: ['GET', 'POST'],
    },
  },
};

export default config;