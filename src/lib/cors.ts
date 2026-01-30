import { NextResponse } from "next/server";

/**
 * CORS configuration for production
 */
const CORS_CONFIG = {
  // Allowed origins - update with your production domains
  allowedOrigins: [
    process.env.NEXTAUTH_URL || "http://localhost:3000",
    "https://kk-expense-tracker.vercel.app", // Example: Add your production domain
  ],
  
  // Allowed HTTP methods
  allowedMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  
  // Allowed headers
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
  
  // Exposed headers (visible to client)
  exposedHeaders: [
    "X-RateLimit-Limit",
    "X-RateLimit-Remaining",
    "X-RateLimit-Reset",
  ],
  
  // Credentials support
  credentials: true,
  
  // Preflight cache duration (in seconds)
  maxAge: 86400, // 24 hours
};

/**
 * Get CORS headers for a request
 */
export function getCorsHeaders(origin?: string | null): Record<string, string> {
  const headers: Record<string, string> = {};

  // Check if origin is allowed
  const isAllowedOrigin = origin && (
    CORS_CONFIG.allowedOrigins.includes(origin) ||
    CORS_CONFIG.allowedOrigins.includes("*") ||
    origin.includes("localhost") // Allow all localhost origins in development
  );

  if (isAllowedOrigin) {
    headers["Access-Control-Allow-Origin"] = origin;
  } else if (process.env.NODE_ENV === "development") {
    // In development, allow all origins
    headers["Access-Control-Allow-Origin"] = origin || "*";
  }

  headers["Access-Control-Allow-Methods"] = CORS_CONFIG.allowedMethods.join(", ");
  headers["Access-Control-Allow-Headers"] = CORS_CONFIG.allowedHeaders.join(", ");
  headers["Access-Control-Expose-Headers"] = CORS_CONFIG.exposedHeaders.join(", ");
  headers["Access-Control-Max-Age"] = CORS_CONFIG.maxAge.toString();

  if (CORS_CONFIG.credentials) {
    headers["Access-Control-Allow-Credentials"] = "true";
  }

  return headers;
}

/**
 * Handle OPTIONS (preflight) request
 */
export function handleOptionsRequest(request: Request): NextResponse {
  const origin = request.headers.get("origin");
  const headers = getCorsHeaders(origin);

  return new NextResponse(null, {
    status: 204,
    headers,
  });
}

/**
 * Add CORS headers to a response
 */
export function addCorsHeaders(response: NextResponse, origin?: string | null): NextResponse {
  const corsHeaders = getCorsHeaders(origin);
  
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}
