import { requireAuth, getPlatformContext, handleAuthError } from "@/lib/auth/server";
import { getConnectedClient } from "@/lib/mongodb";
import { Budget } from "@/lib/types";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";
import { validateBudget, sanitizeObjectId } from "@/lib/validation";
import { applyRateLimit, getIP } from "@/lib/ratelimit-middleware";
import { rateLimiters } from "@/lib/ratelimit";
import { handleOptionsRequest, addCorsHeaders } from "@/lib/cors";

export async function OPTIONS(request: Request) {
  return handleOptionsRequest(request);
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth(request);
    const platform = getPlatformContext(request);

    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(
      session.user.id!,
      getIP(request),
      rateLimiters.api
    );
    if (rateLimitResult) return rateLimitResult;

    const { id } = await params;

    // Validate ObjectId
    if (!sanitizeObjectId(id)) {
      return NextResponse.json({ error: "Invalid budget ID" }, { status: 400 });
    }

    const client = await getConnectedClient();
    const db = client.db();

    const budget = await db.collection<Budget>("budgets").findOne({
      _id: new ObjectId(id),
      userId: session.user.id,
    });

    if (!budget) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    const response = NextResponse.json(budget);
    return addCorsHeaders(response, request.headers.get("origin"));
  } catch (error) {
    console.error("Error fetching budget:", error);
    return handleAuthError(error, request);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth(request);
    const platform = getPlatformContext(request);

    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(session.user.id, getIP(request), rateLimiters.api);
    if (rateLimitResult) return rateLimitResult;

    const { id } = await params;

    // Validate ObjectId
    if (!sanitizeObjectId(id)) {
      return NextResponse.json({ error: "Invalid budget ID" }, { status: 400 });
    }

    const body = await request.json();

    // Validate and sanitize input
    const validation = validateBudget(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 400 }
      );
    }

    const client = await getConnectedClient();
    const db = client.db();

    const updateData = {
      ...validation.sanitized!,
      updatedAt: new Date(),
    };

    const result = await db
      .collection<Budget>("budgets")
      .findOneAndUpdate(
        { _id: new ObjectId(id), userId: session.user.id },
        { $set: updateData },
        { returnDocument: "after" }
      );

    if (!result) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    const response = NextResponse.json(result);
    return addCorsHeaders(response, request.headers.get("origin"));
  } catch (error) {
    console.error("Error updating budget:", error);
    return handleAuthError(error, request);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(request);
    const platform = getPlatformContext(request);

    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(
      session.user.id!,
      getIP(request),
      rateLimiters.api
    );
    if (rateLimitResult) return rateLimitResult;

    const { id } = await params;

    // Validate ObjectId
    if (!sanitizeObjectId(id)) {
      return NextResponse.json({ error: "Invalid budget ID" }, { status: 400 });
    }

    const client = await getConnectedClient();
    const db = client.db();

    // Archive instead of hard delete
    const result = await db.collection<Budget>("budgets").findOneAndUpdate(
      { _id: new ObjectId(id), userId: session.user.id },
      {
        $set: {
          isArchived: true,
          archivedAt: new Date(),
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    const response = NextResponse.json({ success: true, budget: result });
    return addCorsHeaders(response, request.headers.get("origin"));
  } catch (error) {
    console.error("Error archiving budget:", error);
    return handleAuthError(error, request);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth(request);
    const platform = getPlatformContext(request);

    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(
      session.user.id!,
      getIP(request),
      rateLimiters.api
    );
    if (rateLimitResult) return rateLimitResult;

    const { id } = await params;

    // Validate ObjectId
    if (!sanitizeObjectId(id)) {
      return NextResponse.json({ error: "Invalid budget ID" }, { status: 400 });
    }

    // Check if this is a restore action
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action !== "restore") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const client = await getConnectedClient();
    const db = client.db();

    // Restore archived budget
    const result = await db.collection<Budget>("budgets").findOneAndUpdate(
      { _id: new ObjectId(id), userId: session.user.id },
      {
        $set: {
          isArchived: false,
          updatedAt: new Date(),
        },
        $unset: { archivedAt: "" },
      },
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    const response = NextResponse.json({ success: true, budget: result });
    return addCorsHeaders(response, request.headers.get("origin"));
  } catch (error) {
    console.error("Error restoring budget:", error);
    return handleAuthError(error, request);
  }
}
