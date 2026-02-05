import { NextRequest } from "next/server";
import type { Platform, PlatformContext } from "./types";

/**
 * Detect platform from server-side request
 * Uses multiple detection methods in priority order:
 * 1. X-Platform custom header (most reliable)
 * 2. User-Agent analysis
 * 3. Origin check
 * 
 * @param request - NextRequest or Request object
 * @returns Platform context information
 */
export function getPlatformContext(request: Request | NextRequest): PlatformContext {
  const headers = request.headers;
  
  // Method 1: Custom header (most reliable)
  const platformHeader = headers.get('x-platform');
  if (platformHeader === 'capacitor') {
    const devicePlatform = headers.get('x-device-platform') as Platform | null;
    return {
      type: devicePlatform === 'ios' ? 'ios' : 'android',
      isNative: true,
      userAgent: headers.get('user-agent') || '',
      appVersion: headers.get('x-app-version') || undefined,
    };
  }
  
  // Method 2: User-Agent analysis
  const ua = headers.get('user-agent') || '';
  if (ua.includes('ExpenseTracker') || ua.includes('VibeFinance')) {
    return {
      type: ua.toLowerCase().includes('ios') ? 'ios' : 'android',
      isNative: true,
      userAgent: ua,
    };
  }
  
  // Method 3: Origin check (fallback for mobile)
  const origin = headers.get('origin');
  if (!origin || origin.startsWith('capacitor://') || origin === 'http://localhost') {
    return {
      type: 'android', // Default to Android for native
      isNative: true,
      userAgent: ua,
    };
  }
  
  // Default: Web browser
  return {
    type: 'web',
    isNative: false,
    userAgent: ua,
  };
}

/**
 * Client-side platform detection
 * Uses Capacitor API to detect platform
 * 
 * @returns Platform identifier
 */
export function getClientPlatform(): Platform {
  if (typeof window === 'undefined') return 'web';
  
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Capacitor } = require('@capacitor/core');
    if (Capacitor.isNativePlatform()) {
      const platform = Capacitor.getPlatform();
      return platform as Platform;
    }
  } catch {
    // Capacitor not available, running in web browser
  }
  
  return 'web';
}

/**
 * Check if running on Capacitor native platform (client-side only)
 * 
 * @returns true if running on native mobile app
 */
export function isCapacitor(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Capacitor } = require('@capacitor/core');
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}
