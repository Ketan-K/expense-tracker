/**
 * Supabase client singleton
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { config } from "@/lib/core/config";
import { logger } from "@/lib/core/logger";

let supabaseClient: SupabaseClient | null = null;
let connectionTested = false;

async function testConnection(client: SupabaseClient): Promise<void> {
  try {
    // Test connection with a simple query to a non-existent table
    const { error } = await client.from("_test_connection").select("*").limit(0);

    // PGRST205 means "table not found" - this proves connection works!
    // Other expected messages: "relation does not exist", "Could not find the table"
    if (error) {
      const isExpectedError =
        error.code === "PGRST205" ||
        error.message.includes("relation") ||
        error.message.includes("does not exist") ||
        error.message.includes("Could not find the table");

      if (isExpectedError) {
        logger.info("Supabase connection verified successfully (table not found as expected)");
      } else {
        logger.error("Supabase connection test failed with unexpected error", error);
      }
    } else {
      logger.info("Supabase connection verified successfully");
    }
  } catch (err) {
    logger.warn("Supabase connection test encountered an error", { error: String(err) });
  }
}

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    logger.info("Initializing Supabase client");

    try {
      supabaseClient = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        db: {
          schema: "public",
        },
      });

      logger.info("Supabase client initialized successfully", {
        url: config.SUPABASE_URL,
        hasServiceKey: !!config.SUPABASE_SERVICE_ROLE_KEY,
      });

      // Test connection on first initialization (async, non-blocking)
      if (!connectionTested) {
        connectionTested = true;
        testConnection(supabaseClient).catch(() => {
          // Error already logged in testConnection
        });
      }
    } catch (error) {
      logger.error("Failed to initialize Supabase client", error, {
        url: config.SUPABASE_URL,
      });
      throw error;
    }
  }

  return supabaseClient;
}

// Helper to handle Supabase errors
export function handleSupabaseError(error: unknown, operation: string): Error {
  logger.error(`Supabase ${operation} failed`, error);

  if (error && typeof error === "object" && "message" in error) {
    return new Error(`${operation}: ${(error as { message: string }).message}`);
  }

  return new Error(`${operation} failed`);
}
