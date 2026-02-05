/**
 * Authentication service interface
 * Abstracts authentication provider for future flexibility
 */

import { Result } from '@/lib/core/result';
import { AuthError } from '@/lib/core/errors';

export interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
}

export interface Session {
  user: User;
  expires: string;
}

export interface IAuthService {
  /**
   * Get current authenticated user
   */
  getUser(sessionToken?: string): Promise<Result<User | null, AuthError>>;

  /**
   * Validate session
   */
  validateSession(sessionToken: string): Promise<Result<Session | null, AuthError>>;

  /**
   * Create a new user (for migration)
   */
  createUser(email: string, name?: string, image?: string): Promise<Result<User, AuthError>>;

  /**
   * Get user by email
   */
  getUserByEmail(email: string): Promise<Result<User | null, AuthError>>;

  /**
   * Check if user is admin
   */
  isAdmin(email: string): boolean;
}
