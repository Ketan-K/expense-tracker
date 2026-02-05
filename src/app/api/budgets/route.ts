import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { applyRateLimit, getIP } from "@/lib/ratelimit-middleware";
import { rateLimiters } from "@/lib/ratelimit";
import { handleOptionsRequest, addCorsHeaders } from "@/lib/cors";
import { budgetService } from "@/lib/services/budget.service";
import { ValidationError, DatabaseError } from "@/lib/core/errors";

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
    const month = searchParams.get("month") || undefined;

    // Validate month format if provided
    if (month && !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      return NextResponse.json(
        { error: "Invalid month format (must be YYYY-MM)" },
        { status: 400 }
      );
    }

    const result = await budgetService.getBudgets(session.user.id);

    if (result.isFailure()) {
      const error = result.error;
      if (error instanceof DatabaseError) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ error: "Failed to fetch budgets" }, { status: 500 });
    }

    // Filter by month if provided
    let budgets = result.value;
    if (month) {
      budgets = budgets.filter(b => b.month === month);
    }

    const response = NextResponse.json(budgets);
    return addCorsHeaders(response, request.headers.get("origin"));
  } catch (error) {
    console.error("Error fetching budgets:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
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

    const result = await budgetService.createBudget(session.user.id, body);

    if (result.isFailure()) {
      const error = result.error;
      if (error instanceof ValidationError) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      if (error instanceof DatabaseError) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ error: "Failed to set budget" }, { status: 500 });
    }

    const response = NextResponse.json(result.value);
    return addCorsHeaders(response, request.headers.get("origin"));
  } catch (error) {
    console.error("Error setting budget:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
