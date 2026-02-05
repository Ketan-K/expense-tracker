/**
 * Supabase client singleton
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '@/lib/core/config';
import { logger } from '@/lib/core/logger';

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    logger.info('Initializing Supabase client');
    
    supabaseClient = createClient(
      config.SUPABASE_URL,
      config.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        db: {
          schema: 'public',
        },
      }
    );
  }

  return supabaseClient;
}

// Helper to handle Supabase errors
export function handleSupabaseError(error: unknown, operation: string): Error {
  logger.error(`Supabase ${operation} failed`, error);
  
  if (error && typeof error === 'object' && 'message' in error) {
    return new Error(`${operation}: ${(error as { message: string }).message}`);
  }
  
  return new Error(`${operation} failed`);
}
