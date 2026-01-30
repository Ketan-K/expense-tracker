import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { Budget } from "@/lib/types";
import { NextResponse } from "next/server";
import { validateBudget, sanitizeString } from "@/lib/validation";
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

    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(session.user.id, getIP(request), rateLimiters.api);
    if (rateLimitResult) return rateLimitResult;

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");

    // Validate month format if provided
    if (month && !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      return NextResponse.json(
        { error: "Invalid month format (must be YYYY-MM)" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    const query: any = { userId: session.user.id };
    if (month) {
      query.month = sanitizeString(month);
    }

    const budgets = await db
      .collection<Budget>("budgets")
      .find(query)
      .sort({ month: -1 })
      .toArray();

    const response = NextResponse.json(budgets);
    return addCorsHeaders(response, request.headers.get("origin"));
  } catch (error) {
    console.error("Error fetching budgets:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(session.user.id, getIP(request), rateLimiters.api);
    if (rateLimitResult) return rateLimitResult;

    const body = await request.json();

    // Validate and sanitize input
    const validation = validateBudget(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    const { categoryId, month, amount } = validation.sanitized!;

    // Check if budget already exists for this category and month
    const existing = await db.collection<Budget>("budgets").findOne({
      userId: session.user.id,
      categoryId,
      month,
    });

    if (existing) {
      // Update existing budget
      const result = await db.collection<Budget>("budgets").findOneAndUpdate(
        { userId: session.user.id, categoryId, month },
        { $set: { amount, updatedAt: new Date() } },
        { returnDocument: "after" }
      );

      const response = NextResponse.json(result);
      return addCorsHeaders(response, request.headers.get("origin"));
    }

    const budget: Budget = {
      userId: session.user.id,
      categoryId,
      month,
      amount,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection<Budget>("budgets").insertOne(budget);

    const response = NextResponse.json({
      ...budget,
      _id: result.insertedId,
    });
    return addCorsHeaders(response, request.headers.get("origin"));
  } catch (error) {
    console.error("Error creating budget:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
