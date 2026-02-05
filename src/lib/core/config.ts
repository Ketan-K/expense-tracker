/**
 * Centralized configuration management
 * Single source of truth for all environment variables
 */

class Config {
  // Database
  readonly DATABASE_PROVIDER: 'supabase' = 'supabase';
  readonly SUPABASE_URL: string;
  readonly SUPABASE_PUBLISHABLE_KEY: string;
  readonly SUPABASE_SERVICE_ROLE_KEY: string;

  // Authentication
  readonly AUTH_PROVIDER: 'supabase' = 'supabase';
  readonly NEXTAUTH_URL?: string;
  readonly NEXTAUTH_SECRET?: string;
  readonly GOOGLE_CLIENT_ID?: string;
  readonly GOOGLE_CLIENT_SECRET?: string;

  // Admin
  readonly ADMIN_EMAILS: string[];

  // App
  readonly NODE_ENV: string;
  readonly NEXT_PUBLIC_THEME: string;
  readonly LOG_LEVEL: string;

  constructor() {
    // Database
    this.SUPABASE_URL = this.getRequired('NEXT_PUBLIC_SUPABASE_URL');
    this.SUPABASE_PUBLISHABLE_KEY = this.getRequired('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
    this.SUPABASE_SERVICE_ROLE_KEY = this.getRequired('SUPABASE_SERVICE_ROLE_KEY');

    // Authentication
    this.NEXTAUTH_URL = process.env.NEXTAUTH_URL;
    this.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;
    this.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    this.GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

    // Admin
    const adminEmails = process.env.ADMIN_EMAILS || '';
    this.ADMIN_EMAILS = adminEmails.split(',').map(email => email.trim()).filter(Boolean);

    // App
    this.NODE_ENV = process.env.NODE_ENV || 'development';
    this.NEXT_PUBLIC_THEME = process.env.NEXT_PUBLIC_THEME || 'default';
    this.LOG_LEVEL = process.env.LOG_LEVEL || 'INFO';
  }

  private getRequired(key: string): string {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
  }

  get isDevelopment(): boolean {
    return this.NODE_ENV === 'development';
  }

  get isProduction(): boolean {
    return this.NODE_ENV === 'production';
  }

  isAdmin(email: string | null | undefined): boolean {
    if (!email) return false;
    return this.ADMIN_EMAILS.includes(email);
  }
}

export const config = new Config();
