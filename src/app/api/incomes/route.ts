import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import type { Income } from "@/lib/types";
import { NextResponse } from "next/server";
import { validateIncome, validateQueryParams, sanitizeString } from "@/lib/validation";
import { applyRateLimit, getIP } from "@/lib/ratelimit-middleware";
import { rateLimiters } from "@/lib/ratelimit";
import { handleOptionsRequest, addCorsHeaders } from "@/lib/cors";

export async function OPTIONS(request: Request) {
  return handleOptionsRequest(request);
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResult = await applyRateLimit(session.user.id, getIP(request), rateLimiters.api);
    if (rateLimitResult) return rateLimitResult;

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const source = searchParams.get("source");

    const validation = validateQueryParams({ startDate, endDate, category: source });
    if (!validation.isValid) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: validation.errors },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    const query: any = { userId: session.user.id };

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
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResult = await applyRateLimit(session.user.id, getIP(request), rateLimiters.api);
    if (rateLimitResult) return rateLimitResult;

    const body = await request.json();

    const validation = validateIncome(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 400 }
      );
    }

    const client = await clientPromise;
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
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
