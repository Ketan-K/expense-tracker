import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { validateQueryParams } from "@/lib/validation";
import { applyRateLimit, getIP } from "@/lib/ratelimit-middleware";
import { rateLimiters } from "@/lib/ratelimit";
import { handleOptionsRequest, addCorsHeaders } from "@/lib/cors";
import { expenseService } from "@/lib/services";
import { DatabaseError } from "@/lib/core/errors";

export async function OPTIONS(request: Request) {
  return handleOptionsRequest(request);
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Apply rate limiting (export has stricter limits)
    const rateLimitResult = await applyRateLimit(
      session.user.id,
      getIP(request),
      rateLimiters.export
    );
    if (rateLimitResult) return rateLimitResult;

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Validate query parameters
    const validation = validateQueryParams({ startDate, endDate, category: null });
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

    const expenses = result.value;

    // Convert to CSV
    const headers = ["Date", "Category", "Amount", "Description", "Payment Method"];
    const rows = expenses.map(expense => [
      new Date(expense.date).toLocaleDateString(),
      expense.category,
      expense.amount.toString(),
      expense.description || "",
      expense.paymentMethod || "",
    ]);

    const csv = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(",")),
    ].join("\n");

    const response = new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="expenses_${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
    return addCorsHeaders(response, request.headers.get("origin"));
  } catch (error) {
    console.error("Error exporting CSV:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
