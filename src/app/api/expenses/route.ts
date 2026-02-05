import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { validateQueryParams } from "@/lib/validation";
import { applyRateLimit, getIP } from "@/lib/ratelimit-middleware";
import { rateLimiters } from "@/lib/ratelimit";
import { handleOptionsRequest, addCorsHeaders } from "@/lib/cors";
import { expenseService } from "@/lib/services";
import { NotFoundError, ValidationError, DatabaseError } from "@/lib/core/errors";

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
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const category = searchParams.get("category");

    // Validate query parameters
    const validation = validateQueryParams({ startDate, endDate, category });
    if (!validation.isValid) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: validation.errors },
        { status: 400 }
      );
    }

    // Use service layer
    let result;
    if (startDate || endDate) {
      result = await expenseService.getExpensesByDateRange(
        session.user.id,
        startDate ? new Date(startDate) : new Date(0),
        endDate ? new Date(endDate) : new Date()
      );
    } else {
      result = await expenseService.getExpenses(session.user.id);
    }

    if (result.isFailure()) {
      const error = result.error;
      if (error instanceof DatabaseError) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
    }

    // Filter by category if provided
    let expenses = result.value;
    if (category) {
      expenses = expenses.filter(e => e.category === category);
    }

    const response = NextResponse.json(expenses);
    return addCorsHeaders(response, request.headers.get("origin"));
  } catch (error) {
    console.error("Error fetching expenses:", error);
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

    // Use service layer
    const result = await expenseService.createExpense(session.user.id, body);

    if (result.isFailure()) {
      const error = result.error;
      if (error instanceof ValidationError) {
        return NextResponse.json(
          { error: "Validation failed", details: error.message },
          { status: 400 }
        );
      }
      if (error instanceof DatabaseError) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
    }

    const response = NextResponse.json(result.value);
    return addCorsHeaders(response, request.headers.get("origin"));
  } catch (error) {
    console.error("Error creating expense:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
