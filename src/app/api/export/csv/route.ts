import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { Expense } from "@/lib/types";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const client = await clientPromise;
    const db = client.db();

    const query: any = { userId: session.user.id };

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
    const rows = expenses.map((expense) => [
      new Date(expense.date).toLocaleDateString(),
      expense.category,
      expense.amount.toString(),
      expense.description || "",
      expense.paymentMethod || "",
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="expenses_${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error exporting CSV:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
