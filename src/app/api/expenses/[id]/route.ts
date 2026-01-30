import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { Expense } from "@/lib/types";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { validateExpense, sanitizeObjectId } from "@/lib/validation";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Validate ObjectId
    if (!sanitizeObjectId(id)) {
      return NextResponse.json({ error: "Invalid expense ID" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    const expense = await db.collection<Expense>("expenses").findOne({
      _id: new ObjectId(id),
      userId: session.user.id,
    });

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    return NextResponse.json(expense);
  } catch (error) {
    console.error("Error fetching expense:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Validate ObjectId
    if (!sanitizeObjectId(id)) {
      return NextResponse.json({ error: "Invalid expense ID" }, { status: 400 });
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

    const updateData = {
      ...validation.sanitized!,
      updatedAt: new Date(),
    };

    const result = await db.collection<Expense>("expenses").findOneAndUpdate(
      { _id: new ObjectId(id), userId: session.user.id },
      { $set: updateData },
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating expense:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Validate ObjectId
    if (!sanitizeObjectId(id)) {
      return NextResponse.json({ error: "Invalid expense ID" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    const result = await db.collection<Expense>("expenses").deleteOne({
      _id: new ObjectId(id),
      userId: session.user.id,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting expense:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
