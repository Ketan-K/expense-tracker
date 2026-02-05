import { auth } from "@/auth";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { validateQueryParams } from "@/lib/validation";
import { applyRateLimit, getIP } from "@/lib/ratelimit-middleware";
import { rateLimiters } from "@/lib/ratelimit";
import { handleOptionsRequest, addCorsHeaders } from "@/lib/cors";
import { expenseService, categoryService } from "@/lib/services";
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

    // Use service layer for expenses
    let expensesResult;
    if (startDate || endDate) {
      expensesResult = await expenseService.getExpensesByDateRange(
        session.user.id,
        startDate ? new Date(startDate) : new Date(0),
        endDate ? new Date(endDate) : new Date()
      );
    } else {
      expensesResult = await expenseService.getExpenses(session.user.id);
    }

    if (expensesResult.isFailure()) {
      const error = expensesResult.error;
      if (error instanceof DatabaseError) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
    }

    // Use service layer for categories
    const categoriesResult = await categoryService.getCategories(session.user.id);

    if (categoriesResult.isFailure()) {
      const error = categoriesResult.error;
      if (error instanceof DatabaseError) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
    }

    const expenses = expensesResult.value;
    const categories = categoriesResult.value;

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Expenses sheet
    const expensesData = expenses.map(expense => ({
      Date: new Date(expense.date).toLocaleDateString(),
      Category: expense.category,
      Amount: expense.amount,
      Description: expense.description || "",
      "Payment Method": expense.paymentMethod || "",
    }));

    const expensesSheet = XLSX.utils.json_to_sheet(expensesData);
    XLSX.utils.book_append_sheet(workbook, expensesSheet, "Expenses");

    // Categories sheet
    const categoriesData = categories.map(cat => ({
      Name: cat.name,
      Icon: cat.icon,
      Color: cat.color,
      "Is Default": cat.isDefault ? "Yes" : "No",
    }));

    const categoriesSheet = XLSX.utils.json_to_sheet(categoriesData);
    XLSX.utils.book_append_sheet(workbook, categoriesSheet, "Categories");

    // Summary sheet
    const categoryTotals = expenses.reduce(
      (acc, expense) => {
        if (!acc[expense.category]) {
          acc[expense.category] = 0;
        }
        acc[expense.category] += expense.amount;
        return acc;
      },
      {} as Record<string, number>
    );

    const summaryData = Object.entries(categoryTotals).map(([category, total]) => ({
      Category: category,
      Total: total,
      Percentage: ((total / expenses.reduce((sum, e) => sum + e.amount, 0)) * 100).toFixed(2) + "%",
    }));

    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

    // Generate Excel file
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    const response = new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="expenses_${new Date().toISOString().split("T")[0]}.xlsx"`,
      },
    });
    return addCorsHeaders(response, request.headers.get("origin"));
  } catch (error) {
    console.error("Error exporting Excel:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
