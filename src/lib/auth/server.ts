import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { getPlatformContext } from "./platform";
import { AuthError, AuthSession } from "./types";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || "";

// Re-export platform utilities for convenience
export { getPlatformContext };

/**
 * Verify JWT token from Authorization header (mobile auth)
 */
function verifyMobileToken(token: string): { userId: string; email: string; name?: string; image?: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      name?: string;
      image?: string;
    };
    return decoded;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

/**
 * Get current authentication session with platform context
 * Supports both cookie-based (web) and token-based (mobile) auth
 * 
 * @param request - Optional NextRequest for platform detection and token extraction
 * @returns Session with platform context or null if not authenticated
 */
export async function getSession(request?: NextRequest): Promise<AuthSession | null> {
  // Check for mobile token in Authorization header
  if (request) {
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const decoded = verifyMobileToken(token);
      
      if (decoded) {
        const platform = getPlatformContext(request);
        return {
          user: {
            id: decoded.userId,
            email: decoded.email,
            name: decoded.name,
            image: decoded.image,
          },
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
          platform,
        };
      }
    }
  }
  
  // Fall back to cookie-based session (web)
  const session = await auth();
  
  if (!session) return null;
  
  const platform = request ? getPlatformContext(request) : null;
  
  return {
    ...session,
    platform,
  };
}

/**
 * Get authenticated user or throw error
 * 
 * @param request - Optional NextRequest for platform detection
 * @throws AuthError if not authenticated
 * @returns User object
 */
export async function getUser(request?: NextRequest) {
  const session = await getSession(request);
  
  if (!session?.user) {
    throw new AuthError("Unauthorized", "AUTH_REQUIRED", 401);
  }
  
  return session.user;
}

/**
 * Require authentication for API routes
 * Throws AuthError if user is not authenticated
 * 
 * @param request - Optional NextRequest for platform detection
 * @throws AuthError if not authenticated
 * @returns Authenticated session
 * 
 * @example
 * ```ts
 * export async function GET(request: NextRequest) {
 *   const { user } = await requireAdmin(request);
 *   // User is authenticated, user.id is available
 * }
 * ```
 */
export async function requireAuth(request?: NextRequest): Promise<AuthSession> {
  const session = await getSession(request);
  
  if (!session?.user?.id) {
    throw new AuthError("Unauthorized", "AUTH_REQUIRED", 401);
  }
  
  return session;
}

/**
 * Check if user is authenticated (boolean check)
 * 
 * @returns true if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await auth();
  return !!session?.user;
}

/**
 * Check if current user has admin access
 * Admin users are defined in ADMIN_EMAILS environment variable
 * 
 * @returns true if user is admin
 */
export async function isAdmin(): Promise<boolean> {
  const session = await auth();
  
  if (!session?.user?.email) return false;
  
  const adminEmails = process.env.ADMIN_EMAILS?.split(",")
    .map(email => email.trim().toLowerCase()) || [];
  
  if (adminEmails.length === 0) return false;
  
  return adminEmails.includes(session.user.email.toLowerCase());
}

/**
 * Require admin access for API routes
 * Throws AuthError if user is not authenticated or not an admin
 * 
 * @throws AuthError if not authenticated or not admin
 * @returns Authenticated session
 * 
 * @example
 * ```ts
 * export async function GET(request: NextRequest) {
 *   const { user } = await requireAdmin();
 *   // User is authenticated and is admin
 * }
 * ```
 */
export async function requireAdmin(): Promise<AuthSession> {
  const session = await requireAuth();
  const adminCheck = await isAdmin();
  
  if (!adminCheck) {
    throw new AuthError("Forbidden: Admin access required", "FORBIDDEN", 403);
  }
  
  return session;
}

/**
 * Create an unauthorized (401) response
 * Includes platform context in response body
 * 
 * @param request - Optional NextRequest for platform detection
 * @returns NextResponse with 401 status
 */
export function unauthorizedResponse(request?: NextRequest) {
  const platform = request ? getPlatformContext(request) : null;
  
  return NextResponse.json(
    { 
      error: "Unauthorized",
      platform: platform?.type,
      code: "AUTH_REQUIRED"
    },
    { status: 401 }
  );
}

/**
 * Create a forbidden (403) response
 * 
 * @param message - Optional custom error message
 * @returns NextResponse with 403 status
 */
export function forbiddenResponse(message: string = "Forbidden") {
  return NextResponse.json(
    { error: message, code: "FORBIDDEN" },
    { status: 403 }
  );
}

/**
 * Handle auth errors and return appropriate response
 * 
 * @param error - Error object
 * @param request - Optional NextRequest for platform context
 * @returns NextResponse with appropriate status code
 */
export function handleAuthError(error: unknown, request?: NextRequest) {
  const platform = request ? getPlatformContext(request) : null;
  
  if (error instanceof AuthError) {
    return NextResponse.json(
      { 
        error: error.message, 
        code: error.code,
        platform: platform?.type
      },
      { status: error.statusCode }
    );
  }
  
  // Generic error - don't expose details
  console.error("Auth error:", error);
  return NextResponse.json(
    { error: "Internal Server Error", code: "INTERNAL_ERROR" },
    { status: 500 }
  );
}
