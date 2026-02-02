import { auth } from "@/auth";

/**
 * Check if the current user is an admin
 * Admins are defined in ADMIN_EMAILS environment variable (comma-separated)
 */
export async function isAdmin(): Promise<boolean> {
  const session = await auth();
  
  if (!session?.user?.email) {
    console.log("[ADMIN ACCESS] Attempt without authentication - DENIED");
    return false;
  }

  const adminEmails = process.env.ADMIN_EMAILS?.split(",").map(email => email.trim().toLowerCase()) || [];
  
  // If no admin emails configured, no one is admin (secure by default)
  if (adminEmails.length === 0) {
    console.warn("[ADMIN ACCESS] No admin emails configured - DENIED access to:", session.user.email);
    return false;
  }

  const isAllowed = adminEmails.includes(session.user.email.toLowerCase());
  
  if (isAllowed) {
    console.log(`[ADMIN ACCESS] ✓ GRANTED to ${session.user.email} at ${new Date().toISOString()}`);
  } else {
    console.warn(`[ADMIN ACCESS] ✗ DENIED to ${session.user.email} at ${new Date().toISOString()} - Not in admin list`);
  }
  
  return isAllowed;
}

/**
 * Get the current session or throw unauthorized error
 */
export async function requireAuth() {
  const session = await auth();
  
  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }
  
  return session;
}

/**
 * Require admin access or throw unauthorized error
 */
export async function requireAdmin() {
  const session = await requireAuth();
  const adminCheck = await isAdmin();
  
  if (!adminCheck) {
    console.error(`[ADMIN ACCESS] ⚠️ Forbidden access blocked for ${session.user.email} at ${new Date().toISOString()}`);
    throw new Error("Forbidden: Admin access required");
  }
  
  return session;
}
