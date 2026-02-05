import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || "";
const TOKEN_EXPIRY = 30 * 24 * 60 * 60; // 30 days in seconds

/**
 * Mobile Token Exchange Endpoint
 * 
 * After OAuth callback, mobile app calls this endpoint to exchange
 * the session for a JWT token that can be stored locally.
 * 
 * POST /api/auth/mobile-token
 * Returns: { token, user, expiresAt }
 */
export async function POST(_request: NextRequest) {
  try {
    // Get current session from cookies (set by OAuth callback)
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Generate JWT token with user data
    const payload = {
      userId: session.user.id,
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
      iat: Math.floor(Date.now() / 1000),
    };

    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: TOKEN_EXPIRY,
    });

    const expiresAt = Date.now() + (TOKEN_EXPIRY * 1000);

    return NextResponse.json({
      token,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
      },
      expiresAt,
    });
  } catch (error) {
    console.error("Mobile token exchange error:", error);
    return NextResponse.json(
      { error: "Failed to generate token" },
      { status: 500 }
    );
  }
}
