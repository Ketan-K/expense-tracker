/**
 * Authentication service factory
 * Returns the configured auth service implementation
 */

import { IAuthService } from "./interface";
import { supabaseAuthService } from "./supabase-auth.service";
import { config } from "@/lib/core/config";

let authServiceInstance: IAuthService | null = null;

export function getAuthService(): IAuthService {
  if (!authServiceInstance) {
    // Currently only Supabase is supported, but this can be extended
    switch (config.AUTH_PROVIDER) {
      case "supabase":
        authServiceInstance = supabaseAuthService;
        break;
      default:
        throw new Error(`Unsupported auth provider: ${config.AUTH_PROVIDER}`);
    }
  }

  return authServiceInstance;
}
