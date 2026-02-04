import { signIn } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

// API route to get OAuth URL for mobile apps
export async function POST(request: NextRequest) {
  try {
    const { provider } = await request.json();

    if (!provider) {
      return NextResponse.json({ error: "Provider required" }, { status: 400 });
    }

    // Trigger NextAuth signIn server action to get redirect URL
    // This sets up cookies and returns the OAuth URL
    const result = await signIn(provider, {
      redirect: false,
      redirectTo: "/dashboard",
    });

    // Extract the redirect URL from the result
    // In NextAuth v5, this should contain the OAuth provider URL
    return NextResponse.json({ url: result?.url || null });
  } catch (error) {
    console.error("OAuth URL generation failed:", error);
    return NextResponse.json({ error: "Failed to generate OAuth URL" }, { status: 500 });
  }
}
