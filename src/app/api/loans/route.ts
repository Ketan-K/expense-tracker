import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { applyRateLimit, getIP } from "@/lib/ratelimit-middleware";
import { rateLimiters } from "@/lib/ratelimit";
import { handleOptionsRequest, addCorsHeaders } from "@/lib/cors";
import { loanService } from "@/lib/services/loan.service";
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

    const rateLimitResult = await applyRateLimit(session.user.id, getIP(request), rateLimiters.api);
    if (rateLimitResult) return rateLimitResult;

    const { searchParams } = new URL(request.url);
    const direction = searchParams.get("direction") as "given" | "taken" | undefined;
    const status = searchParams.get("status") as "active" | "paid" | "overdue" | undefined;
    const contactId = searchParams.get("contactId") || undefined;

    const result = await loanService.getLoans(session.user.id);

    if (result.isFailure()) {
      const error = result.error;
      if (error instanceof DatabaseError) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ error: "Failed to get loans" }, { status: 500 });
    }

    // Filter client-side
    let filteredLoans = result.value;
    if (direction) {
      filteredLoans = filteredLoans.filter(loan => loan.direction === direction);
    }
    if (status) {
      filteredLoans = filteredLoans.filter(loan => loan.status === status);
    }
    if (contactId) {
      filteredLoans = filteredLoans.filter(loan => loan.contactId === contactId);
    }

    const response = NextResponse.json(filteredLoans);
    return addCorsHeaders(response, request.headers.get("origin"));
  } catch (error) {
    console.error("Error fetching loans:", error);
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

    const result = await loanService.createLoan(session.user.id, body);

    if (result.isFailure()) {
      const error = result.error;
      if (error instanceof ValidationError) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      if (error instanceof DatabaseError) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ error: "Failed to create loan" }, { status: 500 });
    }

    const response = NextResponse.json(result.value);
    return addCorsHeaders(response, request.headers.get("origin"));
  } catch (error) {
    console.error("Error creating loan:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
