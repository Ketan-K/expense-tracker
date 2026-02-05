/**
 * Token Storage for Mobile (Capacitor) Authentication
 * 
 * Since cookies don't work in Capacitor WebView, we use localStorage
 * to store JWT tokens for mobile authentication.
 */

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export interface StoredAuthData {
  token: string;
  user: {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
  };
  expiresAt: number; // Unix timestamp
}

/**
 * Store authentication token and user data
 */
export function setAuthToken(data: StoredAuthData): void {
  try {
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify({
      id: data.user.id,
      email: data.user.email,
      name: data.user.name,
      image: data.user.image,
      expiresAt: data.expiresAt,
    }));
  } catch (error) {
    console.error('Failed to store auth token:', error);
  }
}

/**
 * Get stored authentication token
 */
export function getAuthToken(): string | null {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;

    // Check if token is expired
    const userData = getUserData();
    if (userData && userData.expiresAt && Date.now() > userData.expiresAt) {
      clearAuthToken();
      return null;
    }

    return token;
  } catch (error) {
    console.error('Failed to get auth token:', error);
    return null;
  }
}

/**
 * Get stored user data
 */
export function getUserData(): (StoredAuthData['user'] & { expiresAt: number }) | null {
  try {
    const data = localStorage.getItem(USER_KEY);
    if (!data) return null;
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to get user data:', error);
    return null;
  }
}

/**
 * Clear stored authentication data
 */
export function clearAuthToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch (error) {
    console.error('Failed to clear auth token:', error);
  }
}

/**
 * Check if user is authenticated (has valid token)
 */
export function isTokenValid(): boolean {
  const token = getAuthToken();
  return token !== null;
}
