/**
 * Database Router
 * Routes database operations to the correct provider based on user assignment
 */

import { IDatabaseService } from "./interface";
import { supabaseDatabaseService } from "./supabase";
import { mongoDBDatabaseService } from "./mongodb";
import { databaseAssignmentService, DatabaseProvider } from "./assignment.service";
import { logger } from "@/lib/core/logger";
import { NotFoundError } from "@/lib/core/errors";

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
    // If the table doesn't exist yet or any other error, default to MongoDB
    logger.warn("Failed to get database assignment, defaulting to MongoDB", { 
      userId, 
      error: assignmentResult.error.message 
    });
    return databaseServices["mongodb"];
  }

  let provider = assignmentResult.value;

  // Fallback to MongoDB for users without assignment (existing users)
  if (!provider) {
    logger.warn("User has no database assignment, defaulting to MongoDB", { userId });
    provider = "mongodb";
  }

  logger.debug("Routing user to database", { userId, provider });
  return databaseServices[provider];
}

/**
 * Get database service for a specific provider (for admin/testing)
 */
export function getDatabaseService(provider: DatabaseProvider): IDatabaseService {
  return databaseServices[provider];
}
