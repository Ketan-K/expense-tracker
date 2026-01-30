/**
 * In-memory rate limiter
 * Note: This is suitable for single-server deployments. 
 * For multi-server/serverless, consider using Redis-based solution like Upstash.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Rate limiter configuration
 */
export const rateLimiters = {
  /**
   * API endpoints: 60 requests per minute per user
   * Suitable for: GET, POST, PUT, DELETE operations
   */
  api: {
    limit: 60,
    window: 60 * 1000, // 1 minute in milliseconds
  },

  /**
   * Auth endpoints: 10 requests per minute per IP
   * Suitable for: Sign in, sign out, session checks
   */
  auth: {
    limit: 10,
    window: 60 * 1000,
  },

  /**
   * Export endpoints: 5 requests per minute per user
   * Suitable for: CSV, Excel exports (resource-intensive)
   */
  export: {
    limit: 5,
    window: 60 * 1000,
  },

  /**
   * Sync endpoint: 10 requests per minute per user
   * Suitable for: Batch sync operations
   */
  sync: {
    limit: 10,
    window: 60 * 1000,
  },
};

/**
 * Check rate limit and return result
 */
export async function checkRateLimit(
  identifier: string,
  limiter: { limit: number; window: number } | null
): Promise<{
  success: boolean;
  limit?: number;
  remaining?: number;
  reset?: number;
}> {
  // If no limiter config, allow all requests
  if (!limiter) {
    return { success: true };
  }

  const key = identifier;
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  // If no entry or expired, create new
  if (!entry || entry.resetTime < now) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + limiter.window,
    });

    return {
      success: true,
      limit: limiter.limit,
      remaining: limiter.limit - 1,
      reset: now + limiter.window,
    };
  }

  // Check if limit exceeded
  if (entry.count >= limiter.limit) {
    return {
      success: false,
      limit: limiter.limit,
      remaining: 0,
      reset: entry.resetTime,
    };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);

  return {
    success: true,
    limit: limiter.limit,
    remaining: limiter.limit - entry.count,
    reset: entry.resetTime,
  };
}

/**
 * Get identifier for rate limiting
 * Uses user ID if available, otherwise falls back to IP
 */
export function getRateLimitIdentifier(
  userId?: string,
  ip?: string
): string {
  return userId || ip || "anonymous";
}
