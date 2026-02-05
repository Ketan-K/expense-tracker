import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-utils";
import { requireAuth } from "@/lib/auth/server";

/**
 * Check if current user has admin access
 * Used by admin page to verify authorization
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    console.log(`[ADMIN CHECK] Admin access check requested by ${session?.user?.email || 'unauthenticated user'}`);
    
    const adminCheck = await isAdmin();
    
    return NextResponse.json({ 
      isAdmin: adminCheck 
    });
  } catch (error) {
    console.error(`[ADMIN CHECK] Error during admin check:`, error);
    return NextResponse.json({ 
      isAdmin: false 
    }, { status: 403 });
  }
}
