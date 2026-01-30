import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { Budget } from "@/lib/types";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");

    const client = await clientPromise;
    const db = client.db();

    const query: any = { userId: session.user.id };
    if (month) {
      query.month = month;
    }

    const budgets = await db
      .collection<Budget>("budgets")
      .find(query)
      .sort({ month: -1 })
      .toArray();

    return NextResponse.json(budgets);
  } catch (error) {
    console.error("Error fetching budgets:", error);
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
    const { categoryId, month, amount } = body;

    if (!categoryId || !month || !amount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // Check if budget already exists for this category and month
    const existing = await db.collection<Budget>("budgets").findOne({
      userId: session.user.id,
      categoryId,
      month,
    });

    if (existing) {
      // Update existing budget
      const result = await db.collection<Budget>("budgets").findOneAndUpdate(
        { userId: session.user.id, categoryId, month },
        { $set: { amount: parseFloat(amount), updatedAt: new Date() } },
        { returnDocument: "after" }
      );

      return NextResponse.json(result);
    }

    const budget: Budget = {
      userId: session.user.id,
      categoryId,
      month,
      amount: parseFloat(amount),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection<Budget>("budgets").insertOne(budget);

    return NextResponse.json({
      ...budget,
      _id: result.insertedId,
    });
  } catch (error) {
    console.error("Error creating budget:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
