/**
 * MongoDB client singleton
 * Reuses existing connection logic from lib/mongodb.ts
 */

import { MongoClient } from 'mongodb';
import { config } from '@/lib/core/config';
import { logger } from '@/lib/core/logger';

let mongoClient: MongoClient | null = null;
let isConnecting = false;
let connectionPromise: Promise<MongoClient> | null = null;

async function connectWithRetry(uri: string, retries = 3): Promise<MongoClient> {
  for (let i = 0; i < retries; i++) {
    try {
      const client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
        minPoolSize: 5,
      });

      await client.connect();
      logger.info('MongoDB connected successfully');
      return client;
    } catch (error) {
      const delay = Math.pow(2, i) * 1000; // Exponential backoff: 1s, 2s, 4s
      logger.warn(`MongoDB connection attempt ${i + 1} failed, retrying in ${delay}ms`, { error });
      
      if (i === retries - 1) {
        logger.error('MongoDB connection failed after all retries', error);
        throw error;
      }
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('MongoDB connection failed');
}

export async function getMongoClient(): Promise<MongoClient> {
  if (mongoClient) {
    return mongoClient;
  }

  // Prevent multiple simultaneous connection attempts
  if (isConnecting && connectionPromise) {
    return connectionPromise;
  }

  isConnecting = true;
  
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    connectionPromise = connectWithRetry(mongoUri);
    mongoClient = await connectionPromise;
    
    return mongoClient;
  } finally {
    isConnecting = false;
    connectionPromise = null;
  }
}

export function getMongoDatabase() {
  if (!mongoClient) {
    throw new Error('MongoDB client not connected. Call getMongoClient() first.');
  }
  return mongoClient.db();
}

// Helper to handle MongoDB errors
export function handleMongoError(error: unknown, operation: string): Error {
  logger.error(`MongoDB ${operation} failed`, error);
  
  if (error && typeof error === 'object' && 'message' in error) {
    return new Error(`${operation}: ${(error as { message: string }).message}`);
  }
  
  return new Error(`${operation} failed`);
}
