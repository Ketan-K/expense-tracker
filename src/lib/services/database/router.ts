/**
 * Database Router
 * Routes database operations to the correct provider based on user assignment
 */

import { IDatabaseService } from './interface';
import { supabaseDatabaseService } from './supabase';
import { mongoDBDatabaseService } from './mongodb';
import { databaseAssignmentService, DatabaseProvider } from './assignment.service';
import { logger } from '@/lib/core/logger';
import { NotFoundError } from '@/lib/core/errors';

// Singleton instances
const databaseServices: Record<DatabaseProvider, IDatabaseService> = {
  mongodb: mongoDBDatabaseService,
  supabase: supabaseDatabaseService,
};

/**
 * Get database service for a specific user
 * Routes to MongoDB or Supabase based on user's assignment
 */
export async function getDatabaseServiceForUser(userId: string): Promise<IDatabaseService> {
  // Get user's database assignment
  const assignmentResult = await databaseAssignmentService.getAssignment(userId);

  if (assignmentResult.isFailure()) {
    logger.error('Failed to get database assignment', assignmentResult.error, { userId });
    throw assignmentResult.error;
  }

  const provider = assignmentResult.value;

  if (!provider) {
    logger.error('User has no database assignment', { userId });
    throw new NotFoundError('User has no database assignment. This should not happen.', 'assignment');
  }

  logger.debug('Routing user to database', { userId, provider });
  return databaseServices[provider];
}

/**
 * Get database service for a specific provider (for admin/testing)
 */
export function getDatabaseService(provider: DatabaseProvider): IDatabaseService {
  return databaseServices[provider];
}
