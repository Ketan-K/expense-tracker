import { auth } from "@/auth";

/**
 * Check if the current user is an admin
 * Admins are defined in ADMIN_EMAILS environment variable (comma-separated)
 */
export async function isAdmin(): Promise<boolean> {
  const session = await auth();
  
  if (!session?.user?.email) {
    return false;
  }

  const adminEmails = process.env.ADMIN_EMAILS?.split(",").map(email => email.trim().toLowerCase()) || [];
  
  // If no admin emails configured, no one is admin (secure by default)
  if (adminEmails.length === 0) {
    return false;
  }

  return adminEmails.includes(session.user.email.toLowerCase());
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
    throw new Error("Forbidden: Admin access required");
  }
  
  return session;
}
