import { requireAuth, getPlatformContext, handleAuthError } from "@/lib/auth/server";
import { getConnectedClient } from "@/lib/mongodb";
import { Expense } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";
import { validateQueryParams } from "@/lib/validation";
import { applyRateLimit, getIP } from "@/lib/ratelimit-middleware";
import { rateLimiters } from "@/lib/ratelimit";
import { handleOptionsRequest, addCorsHeaders } from "@/lib/cors";

export async function OPTIONS(request: Request) {
  return handleOptionsRequest(request);
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);

    // Apply rate limiting (export has stricter limits)
    const rateLimitResult = await applyRateLimit(
      session.user.id!!,
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

    const client = await getConnectedClient();
    const db = client.db();

    const query: any = { userId: session.user.id!! };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const expenses = await db
      .collection<Expense>("expenses")
      .find(query)
      .sort({ date: -1 })
      .toArray();

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
    return handleAuthError(error, request);
  }
}
