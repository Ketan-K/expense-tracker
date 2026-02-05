/**
 * Supabase authentication service implementation
 */

import { createClient } from '@supabase/supabase-js';
import { IAuthService, User, Session } from './interface';
import { Result, ok, fail } from '@/lib/core/result';
import { AuthError } from '@/lib/core/errors';
import { config } from '@/lib/core/config';
import { logger } from '@/lib/core/logger';
import { databaseAssignmentService } from '../database/assignment.service';

class SupabaseAuthService implements IAuthService {
  private client;

  constructor() {
    this.client = createClient(
      config.SUPABASE_URL,
      config.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }

  async getUser(sessionToken?: string): Promise<Result<User | null, AuthError>> {
    try {
      if (!sessionToken) {
        return ok(null);
      }

      const { data, error } = await this.client.auth.getUser(sessionToken);

      if (error) {
        logger.error('Failed to get user', error);
        return fail(new AuthError('Failed to get user'));
      }

      if (!data.user) {
        return ok(null);
      }

      const user: User = {
        id: data.user.id,
        email: data.user.email!,
        name: data.user.user_metadata?.name,
        image: data.user.user_metadata?.avatar_url,
      };

      return ok(user);
    } catch (error) {
      logger.error('Unexpected error getting user', error);
      return fail(new AuthError('Unexpected error getting user'));
    }
  }

  async validateSession(sessionToken: string): Promise<Result<Session | null, AuthError>> {
    try {
      const { data, error } = await this.client.auth.getUser(sessionToken);

      if (error || !data.user) {
        return ok(null);
      }

      const session: Session = {
        user: {
          id: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata?.name,
          image: data.user.user_metadata?.avatar_url,
        },
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      };

      return ok(session);
    } catch (error) {
      logger.error('Unexpected error validating session', error);
      return fail(new AuthError('Unexpected error validating session'));
    }
  }

  async createUser(email: string, name?: string, image?: string): Promise<Result<User, AuthError>> {
    try {
      // Create user with Supabase Auth Admin API
      const { data, error } = await this.client.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          name,
          avatar_url: image,
        },
      });

      if (error) {
        logger.error('Failed to create user', error, { email });
        return fail(new AuthError(`Failed to create user: ${error.message}`));
      }

      const user: User = {
        id: data.user.id,
        email: data.user.email!,
        name,
        image,
      };

      // Automatically assign user to least-used database
      logger.info('Assigning new user to database', { userId: user.id, email });
      const assignmentResult = await databaseAssignmentService.assignToLeastUsed(user.id);

      if (assignmentResult.isFailure()) {
        logger.error('Failed to assign user to database', assignmentResult.error, { userId: user.id });
        // This is critical - delete the user if assignment fails
        await this.client.auth.admin.deleteUser(user.id);
        return fail(new AuthError('Failed to assign user to database. Registration cancelled.'));
      }

      logger.info('User created and assigned to database', {
        userId: user.id,
        email,
        database: assignmentResult.value,
      });

      return ok(user);
    } catch (error) {
      logger.error('Unexpected error creating user', error, { email });
      return fail(new AuthError('Unexpected error creating user'));
    }
  }

  async getUserByEmail(email: string): Promise<Result<User | null, AuthError>> {
    try {
      const { data, error } = await this.client.auth.admin.listUsers();

      if (error) {
        logger.error('Failed to list users', error);
        return fail(new AuthError('Failed to get user by email'));
      }

      const foundUser = data.users.find((u: any) => u.email === email);

      if (!foundUser) {
        return ok(null);
      }

      const user: User = {
        id: foundUser.id,
        email: foundUser.email!,
        name: foundUser.user_metadata?.name,
        image: foundUser.user_metadata?.avatar_url,
      };

      return ok(user);
    } catch (error) {
      logger.error('Unexpected error getting user by email', error, { email });
      return fail(new AuthError('Unexpected error getting user by email'));
    }
  }

  isAdmin(email: string): boolean {
    return config.isAdmin(email);
  }
}

export const supabaseAuthService = new SupabaseAuthService();
