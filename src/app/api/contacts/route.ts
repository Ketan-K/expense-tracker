import { requireAuth, getPlatformContext, handleAuthError } from "@/lib/auth/server";
import { getConnectedClient } from "@/lib/mongodb";
import type { Contact } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";
import { validateContact, sanitizeString } from "@/lib/validation";
import { applyRateLimit, getIP } from "@/lib/ratelimit-middleware";
import { rateLimiters } from "@/lib/ratelimit";
import { handleOptionsRequest, addCorsHeaders } from "@/lib/cors";

export async function OPTIONS(request: Request) {
  return handleOptionsRequest(request);
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const platform = getPlatformContext(request);

    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(session.user.id!, getIP(request), rateLimiters.api);
    if (rateLimitResult) return rateLimitResult;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    const client = await getConnectedClient();
    const db = client.db();

    const query: any = { userId: session.user.id };

    // Optional search by name
    if (search) {
      query.name = { $regex: sanitizeString(search), $options: "i" };
    }

    const contacts = await db
      .collection<Contact>("contacts")
      .find(query)
      .sort({ name: 1 })
      .toArray();

    const response = NextResponse.json(contacts);
    return addCorsHeaders(response, request.headers.get("origin"));
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return handleAuthError(error, request);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const platform = getPlatformContext(request);

    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(session.user.id!, getIP(request), rateLimiters.api);
    if (rateLimitResult) return rateLimitResult;

    const body = await request.json();

    // Validate and sanitize input
    const validation = validateContact(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 400 }
      );
    }

    const client = await getConnectedClient();
    const db = client.db();

    // Check for duplicate contact name for this user
    const existing = await db.collection<Contact>("contacts").findOne({
      userId: session.user.id,
      name: validation.sanitized!.name,
    });

    if (existing) {
      return NextResponse.json({ error: "Contact with this name already exists" }, { status: 409 });
    }

    const contact: Contact = {
      userId: session.user.id,
      ...validation.sanitized!,
      source: "manual", // Default source
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection<Contact>("contacts").insertOne(contact);

    const response = NextResponse.json({
      ...contact,
      _id: contact._id || result.insertedId,
    });
    return addCorsHeaders(response, request.headers.get("origin"));
  } catch (error) {
    console.error("Error creating contact:", error);
    return handleAuthError(error, request);
  }
}
