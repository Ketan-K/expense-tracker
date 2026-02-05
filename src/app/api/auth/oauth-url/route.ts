import { NextRequest, NextResponse } from "next/server";

/**
 * Generate OAuth URL for mobile in-app browser
 * 
 * Manually builds Google OAuth URL since state validation is disabled
 * for mobile compatibility (cookies don't work in Capacitor WebView)
 */
export async function POST(request: NextRequest) {
  try {
    const { provider } = await request.json();

    if (provider !== "google") {
      return NextResponse.json({ error: "Only Google provider supported" }, { status: 400 });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    
    // Match NextAuth's behavior: use request host with trustHost: true
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
    const protocol = request.headers.get("x-forwarded-proto") || "https";
    const baseUrl = host ? `${protocol}://${host}` : process.env.NEXTAUTH_URL || "";
    
    console.log("OAuth URL generation:", {
      host,
      protocol,
      baseUrl,
      origin: request.headers.get("origin"),
      referer: request.headers.get("referer"),
    });
    
    if (!clientId) {
      console.error("GOOGLE_CLIENT_ID not configured");
      return NextResponse.json({ error: "OAuth client not configured" }, { status: 500 });
    }

    if (!baseUrl) {
      console.error("Unable to determine base URL");
      return NextResponse.json({ error: "Base URL not configured" }, { status: 500 });
    }

    const redirectUri = `${baseUrl}/api/auth/callback/google`;

    // Build Google OAuth URL manually (no state needed since checks: [] in auth.ts)
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "consent",
    });

    const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    console.log("Generated OAuth URL with redirect_uri:", redirectUri);

    return NextResponse.json({ url: oauthUrl });
  } catch (error) {
    console.error("OAuth URL generation failed:", error);
    return NextResponse.json({ 
      error: "Failed to generate OAuth URL",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
