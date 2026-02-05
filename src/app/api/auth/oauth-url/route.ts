import { NextRequest, NextResponse } from "next/server";

/**
 * Generate OAuth URL for mobile in-app browser
 * 
 * This builds the Google OAuth URL manually for Capacitor apps
 * since NextAuth's signIn() expects cookies which don't work in WebView
 */
export async function POST(request: NextRequest) {
  try {
    const { provider } = await request.json();

    if (provider !== "google") {
      return NextResponse.json({ error: "Only Google provider supported" }, { status: 400 });
    }

    const clientId = process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID;
    const baseUrl = process.env.NEXTAUTH_URL || request.headers.get("origin") || "";
    
    if (!clientId) {
      return NextResponse.json({ error: "OAuth client not configured" }, { status: 500 });
    }

    // Build Google OAuth URL manually
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: `${baseUrl}/api/auth/callback/google`,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "consent",
      // State for CSRF protection - NextAuth will validate this
      state: crypto.randomUUID(),
    });

    const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    return NextResponse.json({ url: oauthUrl });
  } catch (error) {
    console.error("OAuth URL generation failed:", error);
    return NextResponse.json({ error: "Failed to generate OAuth URL" }, { status: 500 });
  }
}
