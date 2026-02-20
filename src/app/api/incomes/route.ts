import { requireAuth, getPlatformContext, handleAuthError } from "@/lib/auth/server";
import { getConnectedClient } from "@/lib/mongodb";
import type { Income } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";
import { validateIncome, validateQueryParams, sanitizeString } from "@/lib/validation";
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
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const source = searchParams.get("source");
    const includeArchived = searchParams.get("includeArchived") === "true";

    const validation = validateQueryParams({ startDate, endDate, category: source });
    if (!validation.isValid) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: validation.errors },
        { status: 400 }
      );
    }

    const client = await getConnectedClient();
    const db = client.db();

    const query: {
      userId: string;
      $or?: Array<{ isArchived: { $exists: boolean } } | { isArchived: boolean }>;
      date?: { $gte?: Date; $lte?: Date };
      source?: string;
    } = { userId: session.user.id! };

    // Filter archived items unless explicitly requested
    if (!includeArchived) {
      query.$or = [{ isArchived: { $exists: false } }, { isArchived: false }];
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    if (source) {
      query.source = sanitizeString(source);
    }

    const incomes = await db.collection<Income>("incomes").find(query).sort({ date: -1 }).toArray();

    const response = NextResponse.json(incomes);
    return addCorsHeaders(response, request.headers.get("origin"));
  } catch (error) {
    console.error("Error fetching incomes:", error);
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

    const validation = validateIncome(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 400 }
      );
    }

    const client = await getConnectedClient();
    const db = client.db();

    const income: Income = {
      userId: session.user.id,
      ...validation.sanitized!,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection<Income>("incomes").insertOne(income);

    const response = NextResponse.json({
      ...income,
      _id: income._id || result.insertedId,
    });
    return addCorsHeaders(response, request.headers.get("origin"));
  } catch (error) {
    console.error("Error creating income:", error);
    return handleAuthError(error, request);
  }
}
