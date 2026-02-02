import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-utils";
import { auth } from "@/auth";

/**
 * Check if current user has admin access
 * Used by admin page to verify authorization
 */
export async function GET() {
  try {
    const session = await auth();
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
