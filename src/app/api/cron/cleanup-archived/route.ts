import { getConnectedClient } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await getConnectedClient();
    const db = client.db();

    // Calculate the date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const query = {
      isArchived: true,
      archivedAt: { $lte: thirtyDaysAgo },
    };

    // Delete archived items older than 30 days
    const expensesResult = await db.collection("expenses").deleteMany(query);
    const incomesResult = await db.collection("incomes").deleteMany(query);
    const budgetsResult = await db.collection("budgets").deleteMany(query);
    const loansResult = await db.collection("loans").deleteMany(query);
    const loanPaymentsResult = await db.collection("loanPayments").deleteMany(query);

    const summary = {
      success: true,
      deletedCount: {
        expenses: expensesResult.deletedCount,
        incomes: incomesResult.deletedCount,
        budgets: budgetsResult.deletedCount,
        loans: loansResult.deletedCount,
        loanPayments: loanPaymentsResult.deletedCount,
      },
      totalDeleted:
        expensesResult.deletedCount +
        incomesResult.deletedCount +
        budgetsResult.deletedCount +
        loansResult.deletedCount +
        loanPaymentsResult.deletedCount,
      cutoffDate: thirtyDaysAgo.toISOString(),
      executedAt: new Date().toISOString(),
    };

    console.info("Archive cleanup completed:", summary);

    return NextResponse.json(summary);
  } catch (error) {
    console.error("Error cleaning up archived items:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: String(error) },
      { status: 500 }
    );
  }
}
