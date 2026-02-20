import { requireAuth, getPlatformContext, handleAuthError } from "@/lib/auth/server";
import { getConnectedClient } from "@/lib/mongodb";
import type { Loan } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";
import { validateLoan, sanitizeString } from "@/lib/validation";
import { applyRateLimit, getIP } from "@/lib/ratelimit-middleware";
import { rateLimiters } from "@/lib/ratelimit";
import { handleOptionsRequest, addCorsHeaders } from "@/lib/cors";

export async function OPTIONS(request: Request) {
  return handleOptionsRequest(request);
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const _platform = getPlatformContext(request);

    const rateLimitResult = await applyRateLimit(
      session.user.id!,
      getIP(request),
      rateLimiters.api
    );
    if (rateLimitResult) return rateLimitResult;

    const { searchParams } = new URL(request.url);
    const direction = searchParams.get("direction");
    const status = searchParams.get("status");
    const contactId = searchParams.get("contactId");
    const includeArchived = searchParams.get("includeArchived") === "true";

    const client = await getConnectedClient();
    const db = client.db();

    const query: Record<string, unknown> = { userId: session.user.id };

    // Filter archived items unless explicitly requested
    if (!includeArchived) {
      query.$or = [{ isArchived: { $exists: false } }, { isArchived: false }];
    }

    if (direction && (direction === "given" || direction === "taken")) {
      query.direction = direction;
    }

    if (status && ["active", "paid", "overdue"].includes(status)) {
      query.status = status;
    }

    if (contactId) {
      query.contactId = sanitizeString(contactId);
    }

    const loans = await db.collection<Loan>("loans").find(query).sort({ startDate: -1 }).toArray();

    const response = NextResponse.json(loans);
    return addCorsHeaders(response, request.headers.get("origin"));
  } catch (error) {
    console.error("Error fetching loans:", error);
    return handleAuthError(error, request);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const _platform = getPlatformContext(request);

    const rateLimitResult = await applyRateLimit(
      session.user.id!,
      getIP(request),
      rateLimiters.api
    );
    if (rateLimitResult) return rateLimitResult;

    const body = await request.json();

    const validation = validateLoan(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 400 }
      );
    }

    const client = await getConnectedClient();
    const db = client.db();

    const loan: Loan = {
      userId: session.user.id,
      ...validation.sanitized!,
      outstandingAmount: validation.sanitized!.principalAmount, // Initially equals principal
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection<Loan>("loans").insertOne(loan);

    const response = NextResponse.json({
      ...loan,
      _id: loan._id || result.insertedId,
    });
    return addCorsHeaders(response, request.headers.get("origin"));
  } catch (error) {
    console.error("Error creating loan:", error);
    return handleAuthError(error, request);
  }
}
