"use client";

import { useSession as useNextAuthSession, signOut as nextAuthSignOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getClientPlatform, isCapacitor } from "./platform";
import type { AuthHookReturn, AuthUser, Platform } from "./types";
import { getAuthToken, getUserData, clearAuthToken, isTokenValid } from "./token-storage";
import { useState, useEffect } from "react";

/**
 * Unified authentication hook
 * Drop-in replacement for useSession() with enhanced functionality
 * Automatically handles mobile vs web platform differences
 * 
 * - Web: Uses NextAuth cookie-based sessions
 * - Mobile: Uses JWT tokens stored in localStorage
 * 
 * @returns Authentication state and helpers
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, isLoading, isAuthenticated, signOut } = useAuth();
 *   
 *   if (isLoading) return <div>Loading...</div>;
 *   if (!isAuthenticated) return <div>Please sign in</div>;
 *   
 *   return <div>Welcome {user.name}</div>;
 * }
 * ```
 */
export function useAuth(): AuthHookReturn {
  const { data: session, status, update } = useNextAuthSession();
  const router = useRouter();
  const isMobile = typeof window !== 'undefined' && isCapacitor();
  const platform: Platform = typeof window !== 'undefined' ? getClientPlatform() : 'web';
  
  // Mobile: Use token-based auth
  const [mobileUser, setMobileUser] = useState<AuthUser | null>(null);
  const [mobileLoading, setMobileLoading] = useState(true);

  useEffect(() => {
    if (!isMobile) {
      setMobileLoading(false);
      return;
    }

    // Check for stored token on mobile
    const userData = getUserData();
    if (userData) {
      setMobileUser({
        id: userData.id,
        email: userData.email,
        name: userData.name,
        image: userData.image,
      });
    }
    setMobileLoading(false);
  }, [isMobile]);

  // Determine auth state based on platform
  const isLoading = isMobile ? mobileLoading : status === "loading";
  const isAuthenticated = isMobile ? isTokenValid() : status === "authenticated";
  const user = isMobile ? mobileUser : (session?.user as AuthUser ?? null);
  
  /**
   * Platform-aware sign out function
   * Handles mobile-specific cleanup (tokens, in-app browser)
   * 
   * @param options - Optional sign out configuration
   * @param options.callbackUrl - URL to redirect to after sign out
   */
  const signOut = async (options?: { callbackUrl?: string }) => {
    const callbackUrl = options?.callbackUrl || "/auth/signin";
    
    try {
      if (isMobile) {
        // Mobile: Clear token storage
        clearAuthToken();
        setMobileUser(null);
        
        // Close any open in-app browsers
        try {
          const { Browser } = await import('@capacitor/browser');
          await Browser.close();
        } catch (e) {
          // Browser might not be open or not available
        }
        
        // Hard redirect to sign-in (clears all state)
        window.location.href = callbackUrl;
      } else {
        // Web: Standard NextAuth sign out with redirect
        await nextAuthSignOut({ callbackUrl });
      }
    } catch (error) {
      console.error("Sign out failed:", error);
      toast.error("Failed to sign out. Please try again.");
    }
  };
  
  return {
    user,
    session: session ?? null,
    isLoading,
    isAuthenticated,
    isMobile,
    platform,
    update,
    signOut,
  };
}

/**
 * Require authentication in a client component
 * Automatically redirects to sign-in page if not authenticated
 * 
 * @returns Loading and authentication state
 * 
 * @example
 * ```tsx
 * function ProtectedPage() {
 *   const { isLoading } = useRequireAuth();
 *   
 *   if (isLoading) return <div>Loading...</div>;
 *   
 *   // User is authenticated at this point
 *   return <div>Protected content</div>;
 * }
 * ```
 */
export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  if (!isLoading && !isAuthenticated) {
    router.push("/auth/signin");
  }
  
  return { isLoading, isAuthenticated };
}
