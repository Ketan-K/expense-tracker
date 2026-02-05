import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { applyRateLimit, getIP } from "@/lib/ratelimit-middleware";
import { rateLimiters } from "@/lib/ratelimit";
import { handleOptionsRequest, addCorsHeaders } from "@/lib/cors";
import { incomeService } from "@/lib/services/income.service";
import { ValidationError } from "@/lib/core/errors";

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

    let result;
    if (startDate && endDate) {
      result = await incomeService.getIncomesByDateRange(
        session.user.id,
        new Date(startDate),
        new Date(endDate)
      );
    } else {
      result = await incomeService.getIncomes(session.user.id);
    }

    if (result.isFailure()) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    const response = NextResponse.json(result.value);
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

    const result = await incomeService.createIncome(session.user.id, body);

    if (result.isFailure()) {
      if (result.error instanceof ValidationError) {
        return NextResponse.json({ error: result.error.message }, { status: 400 });
      }
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    const response = NextResponse.json(result.value);
    return addCorsHeaders(response, request.headers.get("origin"));
  } catch (error) {
    console.error("Error creating income:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
