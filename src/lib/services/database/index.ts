/**
 * Database service exports
 * Provides both static and user-based database routing
 */

// Re-export types for convenience
export * from "./interface";

// Export router functions
export { getDatabaseServiceForUser, getDatabaseService } from "./router";

// Export assignment service
export { databaseAssignmentService, type DatabaseProvider, type DatabaseAssignment } from "./assignment.service";
