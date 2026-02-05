import { Session, User } from "next-auth";

/**
 * Platform types supported by the application
 */
export type Platform = 'web' | 'android' | 'ios';

/**
 * Platform context information extracted from request headers
 */
export interface PlatformContext {
  /** Platform type */
  type: Platform;
  /** Whether this is a native mobile app */
  isNative: boolean;
  /** User agent string */
  userAgent: string;
  /** App version (from X-App-Version header) */
  appVersion?: string;
}

/**
 * Extended session with platform context
 */
export interface AuthSession extends Session {
  platform?: PlatformContext | null;
}

/**
 * Extended user type with required id field
 */
export interface AuthUser extends User {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
}

/**
 * Return type for useAuth hook
 */
export interface AuthHookReturn {
  /** Current user object or null if not authenticated */
  user: AuthUser | null;
  /** Current session object or null if not authenticated */
  session: Session | null;
  /** Whether authentication state is being loaded */
  isLoading: boolean;
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** Whether running on mobile (Capacitor) platform */
  isMobile: boolean;
  /** Current platform identifier */
  platform: Platform;
  /** Function to update session data */
  update: () => Promise<Session | null>;
  /** Platform-aware sign out function */
  signOut: (options?: { callbackUrl?: string }) => Promise<void>;
}

/**
 * Custom auth error class for structured error handling
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 401
  ) {
    super(message);
    this.name = 'AuthError';
  }
}
