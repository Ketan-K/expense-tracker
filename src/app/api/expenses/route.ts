import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { Expense } from "@/lib/types";
import { NextResponse } from "next/server";
import { validateExpense, validateQueryParams, sanitizeString } from "@/lib/validation";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    const client = await clientPromise;
    const db = client.db();

    const query: any = { userId: session.user.id };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    if (category) {
      query.category = sanitizeString(category);
    }

    const expenses = await db
      .collection<Expense>("expenses")
      .find(query)
      .sort({ date: -1 })
      .toArray();

    return NextResponse.json(expenses);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate and sanitize input
    const validation = validateExpense(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    const expense: Expense = {
      userId: session.user.id,
      ...validation.sanitized!,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection<Expense>("expenses").insertOne(expense);

    return NextResponse.json({
      ...expense,
      _id: result.insertedId,
    });
  } catch (error) {
    console.error("Error creating expense:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
