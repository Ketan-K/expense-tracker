import { NextResponse } from "next/server";

/**
 * Generate OAuth URL for mobile in-app browser
 * 
 * Simply redirects to NextAuth's sign-in page which will handle OAuth properly
 * This ensures the redirect URI matches exactly what's configured
 */
export async function POST() {
  try {
    // Instead of manually building the URL, use NextAuth's signin endpoint
    // which will redirect to Google with the correct redirect_uri
    const host = process.env.NEXTAUTH_URL || "";
    
    if (!host) {
      return NextResponse.json({ 
        error: "NEXTAUTH_URL not configured" 
      }, { status: 500 });
    }

    // Return NextAuth's signin URL - this will trigger Google OAuth with correct params
    const signinUrl = `${host}/api/auth/signin/google?callbackUrl=/dashboard`;
    
    console.log("Returning NextAuth signin URL:", signinUrl);

    return NextResponse.json({ url: signinUrl });
  } catch (error) {
    console.error("OAuth URL generation failed:", error);
    return NextResponse.json({ 
      error: "Failed to generate OAuth URL",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
