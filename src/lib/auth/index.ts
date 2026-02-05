/**
 * Unified Authentication Service
 * 
 * This module provides a centralized authentication abstraction layer
 * that works seamlessly across web and mobile (Capacitor) platforms.
 * 
 * - **Web**: Cookie-based authentication via NextAuth
 * - **Mobile**: JWT token-based authentication stored in localStorage
 * 
 * ## Server-side Usage
 * 
 * ```ts
 * import { requireAuth, getPlatformContext } from "@/lib/auth/server";
 * 
 * export async function GET(request: NextRequest) {
 *   const { user } = await requireAdmin(request);
 *   const platform = getPlatformContext(request);
 *   
 *   // user.id is available
 *   // platform.type is 'web', 'android', or 'ios'
 * }
 * ```
 * 
 * ## Client-side Usage
 * 
 * ```tsx
 * import { useAuth, authFetch } from "@/lib/auth";
 * 
 * function MyComponent() {
 *   const { user, isLoading, isAuthenticated, signOut } = useAuth();
 *   
 *   if (isLoading) return <div>Loading...</div>;
 *   if (!isAuthenticated) return <div>Please sign in</div>;
 *   
 *   // Mobile automatically includes Authorization header
 *   const response = await authFetch('/api/expenses');
 *   
 *   return <button onClick={signOut}>Sign out</button>;
 * }
 * ```
 */

// Client-side exports (safe for client components)
export {
  useAuth,
  useRequireAuth,
} from "./client";

// Mobile auth utilities
export {
  authFetch,
  getAuthHeaders,
} from "./fetch";

export {
  getAuthToken,
  getUserData,
  clearAuthToken,
  isTokenValid,
  setAuthToken,
} from "./token-storage";

// Platform detection utilities (isomorphic - safe for both)
export {
  getPlatformContext,
  getClientPlatform,
  isCapacitor,
} from "./platform";

// Type exports
export type {
  Platform,
  PlatformContext,
  AuthSession,
  AuthUser,
  AuthHookReturn,
} from "./types";

export { AuthError } from "./types";

// NOTE: Server-side exports should be imported directly from "./server"
// to avoid bundling server code into client bundles:
// import { requireAuth } from "@/lib/auth/server";
