/**
 * Database Assignment Service
 * Manages user assignments to MongoDB or Supabase databases
 */

import { getSupabaseClient } from "./supabase/client";
import { Result, ok, fail } from "@/lib/core/result";
import { DatabaseError } from "@/lib/core/errors";
import { logger } from "@/lib/core/logger";

export type DatabaseProvider = "mongodb" | "supabase";

export interface DatabaseAssignment {
  userId: string;
  databaseProvider: DatabaseProvider;
  assignedAt: Date;
}

class DatabaseAssignmentService {
  private client = getSupabaseClient();
  private assignmentCache = new Map<string, DatabaseProvider>();

  /**
   * Get user's database assignment
   */
  async getAssignment(userId: string): Promise<Result<DatabaseProvider | null, DatabaseError>> {
    try {
      // Check cache first
      if (this.assignmentCache.has(userId)) {
        return ok(this.assignmentCache.get(userId)!);
      }

      // Query Supabase
      const { data, error } = await this.client
        .from("user_database_assignments")
        .select("database_provider")
        .eq("user_id", userId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No assignment found
          return ok(null);
        }
        logger.error("Failed to get database assignment", error, { userId });
        return fail(new DatabaseError("Failed to get database assignment"));
      }

      const provider = data.database_provider as DatabaseProvider;
      
      // Cache the result
      this.assignmentCache.set(userId, provider);

      return ok(provider);
    } catch (error) {
      logger.error("Unexpected error getting database assignment", error, { userId });
      return fail(new DatabaseError("Unexpected error getting database assignment"));
    }
  }

  /**
   * Assign user to least-used database with fallback
   */
  async assignToLeastUsed(userId: string): Promise<Result<DatabaseProvider, DatabaseError>> {
    try {
      logger.info("Assigning user to least-used database", { userId });

      // Count users in each database
      const { data: counts, error: countError } = await this.client
        .from("user_database_assignments")
        .select("database_provider", { count: "exact", head: false });

      if (countError) {
        logger.error("Failed to count database assignments", countError);
        return fail(new DatabaseError("Failed to count database assignments"));
      }

      // Calculate user counts per database
      const mongoCount = counts.filter((c: any) => c.database_provider === "mongodb").length;
      const supabaseCount = counts.filter((c: any) => c.database_provider === "supabase").length;

      logger.debug("Database user counts", { mongoCount, supabaseCount });

      // Determine least-used database with health check
      const primaryProvider: DatabaseProvider = mongoCount <= supabaseCount ? "mongodb" : "supabase";
      const fallbackProvider: DatabaseProvider = primaryProvider === "mongodb" ? "supabase" : "mongodb";

      // Try to assign to primary provider
      const primaryResult = await this.assignUserToDatabase(userId, primaryProvider);
      if (primaryResult.isSuccess()) {
        return ok(primaryProvider);
      }

      // Fallback to other database
      logger.warn("Primary database assignment failed, trying fallback", {
        userId,
        primary: primaryProvider,
        fallback: fallbackProvider,
      });

      const fallbackResult = await this.assignUserToDatabase(userId, fallbackProvider);
      if (fallbackResult.isSuccess()) {
        return ok(fallbackProvider);
      }

      // Both failed
      logger.error("Both database assignments failed", { userId });
      return fail(new DatabaseError("Unable to assign user to any database"));

    } catch (error) {
      logger.error("Unexpected error assigning to least-used database", error, { userId });
      return fail(new DatabaseError("Unexpected error during database assignment"));
    }
  }

  /**
   * Assign user to specific database
   */
  async assignUserToDatabase(
    userId: string,
    provider: DatabaseProvider
  ): Promise<Result<void, DatabaseError>> {
    try {
      const { error } = await this.client
        .from("user_database_assignments")
        .insert({
          user_id: userId,
          database_provider: provider,
        });

      if (error) {
        logger.error("Failed to insert database assignment", error, { userId, provider });
        return fail(new DatabaseError(`Failed to assign user to ${provider}`));
      }

      // Update cache
      this.assignmentCache.set(userId, provider);

      logger.info("Successfully assigned user to database", { userId, provider });
      return ok(undefined);
    } catch (error) {
      logger.error("Unexpected error assigning user to database", error, { userId, provider });
      return fail(new DatabaseError("Unexpected error during database assignment"));
    }
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats(): Promise<Result<Record<DatabaseProvider, number>, DatabaseError>> {
    try {
      const { data, error } = await this.client
        .from("user_database_assignments")
        .select("database_provider");

      if (error) {
        logger.error("Failed to get database stats", error);
        return fail(new DatabaseError("Failed to get database stats"));
      }

      const stats = {
        mongodb: data.filter((d: any) => d.database_provider === "mongodb").length,
        supabase: data.filter((d: any) => d.database_provider === "supabase").length,
      };

      return ok(stats);
    } catch (error) {
      logger.error("Unexpected error getting database stats", error);
      return fail(new DatabaseError("Unexpected error getting database stats"));
    }
  }

  /**
   * Get detailed assignment statistics for admin
   */
  async getAssignmentStats(): Promise<Result<{
    mongodb: number;
    supabase: number;
    total: number;
    unassigned: number;
  }, DatabaseError>> {
    try {
      const statsResult = await this.getDatabaseStats();
      if (statsResult.isFailure()) {
        return fail(statsResult.error);
      }

      const stats = statsResult.value;
      const total = stats.mongodb + stats.supabase;

      return ok({
        mongodb: stats.mongodb,
        supabase: stats.supabase,
        total,
        unassigned: 0, // Will be calculated when we query total users
      });
    } catch (error) {
      logger.error("Unexpected error getting assignment stats", error);
      return fail(new DatabaseError("Unexpected error getting assignment stats"));
    }
  }

  /**
   * Clear assignment cache (for testing)
   */
  clearCache(): void {
    this.assignmentCache.clear();
    logger.debug("Database assignment cache cleared");
  }
}

export const databaseAssignmentService = new DatabaseAssignmentService();
