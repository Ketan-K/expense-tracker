import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { sanitizeObjectId } from "@/lib/validation";
import { applyRateLimit, getIP } from "@/lib/ratelimit-middleware";
import { rateLimiters } from "@/lib/ratelimit";
import { handleOptionsRequest, addCorsHeaders } from "@/lib/cors";
import { expenseService } from "@/lib/services";
import { NotFoundError, ValidationError, DatabaseError } from "@/lib/core/errors";

export async function OPTIONS(request: Request) {
  return handleOptionsRequest(request);
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(session.user.id, getIP(request), rateLimiters.api);
    if (rateLimitResult) return rateLimitResult;

    const { id } = await params;

    // Validate ObjectId
    if (!sanitizeObjectId(id)) {
      return NextResponse.json({ error: "Invalid expense ID" }, { status: 400 });
    }

    // Use service layer
    const result = await expenseService.getExpenseById(id, session.user.id);

    if (result.isFailure()) {
      const error = result.error;
      if (error instanceof NotFoundError) {
        return NextResponse.json({ error: "Expense not found" }, { status: 404 });
      }
      if (error instanceof DatabaseError) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ error: "Failed to fetch expense" }, { status: 500 });
    }

    const response = NextResponse.json(result.value);
    return addCorsHeaders(response, request.headers.get("origin"));
  } catch (error) {
    console.error("Error fetching expense:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(session.user.id, getIP(request), rateLimiters.api);
    if (rateLimitResult) return rateLimitResult;

    const { id } = await params;

    // Validate ObjectId
    if (!sanitizeObjectId(id)) {
      return NextResponse.json({ error: "Invalid expense ID" }, { status: 400 });
    }

    const body = await request.json();

    // Use service layer
    const result = await expenseService.updateExpense(id, session.user.id, body);

    if (result.isFailure()) {
      const error = result.error;
      if (error instanceof NotFoundError) {
        return NextResponse.json({ error: "Expense not found" }, { status: 404 });
      }
      if (error instanceof ValidationError) {
        return NextResponse.json(
          { error: "Validation failed", details: error.message },
          { status: 400 }
        );
      }
      if (error instanceof DatabaseError) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ error: "Failed to update expense" }, { status: 500 });
    }

    const response = NextResponse.json(result.value);
    return addCorsHeaders(response, request.headers.get("origin"));
  } catch (error) {
    console.error("Error updating expense:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(session.user.id, getIP(request), rateLimiters.api);
    if (rateLimitResult) return rateLimitResult;

    const { id } = await params;

    // Validate ObjectId
    if (!sanitizeObjectId(id)) {
      return NextResponse.json({ error: "Invalid expense ID" }, { status: 400 });
    }

    // Use service layer
    const result = await expenseService.deleteExpense(id, session.user.id);

    if (result.isFailure()) {
      const error = result.error;
      if (error instanceof NotFoundError) {
        return NextResponse.json({ error: "Expense not found" }, { status: 404 });
      }
      if (error instanceof DatabaseError) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 });
    }

    const response = NextResponse.json({ success: true });
    return addCorsHeaders(response, request.headers.get("origin"));
  } catch (error) {
    console.error("Error deleting expense:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
