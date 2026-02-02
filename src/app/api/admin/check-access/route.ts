import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-utils";

/**
 * Check if current user has admin access
 * Used by admin page to verify authorization
 */
export async function GET() {
  try {
    const adminCheck = await isAdmin();
    
    return NextResponse.json({ 
      isAdmin: adminCheck 
    });
  } catch (error) {
    return NextResponse.json({ 
      isAdmin: false 
    }, { status: 403 });
  }
}
