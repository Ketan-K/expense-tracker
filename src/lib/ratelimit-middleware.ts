import { NextResponse } from "next/server";
import { checkRateLimit, rateLimiters, getRateLimitIdentifier } from "@/lib/ratelimit";

/**
 * Apply rate limiting to an API route
 * Returns a NextResponse if rate limit is exceeded, null otherwise
 */
export async function applyRateLimit(
  userId?: string,
  ip?: string,
  limiter: { limit: number; window: number } | null = rateLimiters.api
): Promise<NextResponse | null> {
  const identifier = getRateLimitIdentifier(userId, ip);
  const result = await checkRateLimit(identifier, limiter);

  if (!result.success) {
    return NextResponse.json(
      {
        error: "Rate limit exceeded",
        message: "Too many requests. Please try again later.",
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": result.limit?.toString() || "",
          "X-RateLimit-Remaining": result.remaining?.toString() || "",
          "X-RateLimit-Reset": result.reset?.toString() || "",
        },
      }
    );
  }

  return null;
}

/**
 * Get user IP from request headers
 */
export function getIP(request: Request): string {
  // Check common headers for client IP
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  return "unknown";
}
