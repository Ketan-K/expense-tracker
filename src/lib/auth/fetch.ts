/**
 * Fetch Utilities for Mobile Authentication
 * 
 * Automatically adds Authorization header with JWT token
 * for mobile API requests
 */

import { getAuthToken } from "./token-storage";
import { isCapacitor } from "./platform";

/**
 * Enhanced fetch that automatically includes auth token for mobile
 * 
 * @example
 * ```ts
 * const response = await authFetch('/api/expenses');
 * const data = await response.json();
 * ```
 */
export async function authFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const isMobile = typeof window !== 'undefined' && isCapacitor();
  
  if (isMobile) {
    const token = getAuthToken();
    
    if (token) {
      const headers = new Headers(init?.headers);
      headers.set('Authorization', `Bearer ${token}`);
      headers.set('X-Platform', 'capacitor');
      
      return fetch(input, {
        ...init,
        headers,
      });
    }
  }
  
  // Web or no token: standard fetch
  return fetch(input, init);
}

/**
 * Get auth headers for manual fetch configuration
 */
export function getAuthHeaders(): HeadersInit {
  const isMobile = typeof window !== 'undefined' && isCapacitor();
  
  if (isMobile) {
    const token = getAuthToken();
    
    if (token) {
      return {
        'Authorization': `Bearer ${token}`,
        'X-Platform': 'capacitor',
      };
    }
  }
  
  return {};
}
