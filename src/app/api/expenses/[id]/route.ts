import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { Expense } from "@/lib/types";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

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
    const body = await request.json();
    const { date, amount, category, description, paymentMethod } = body;

    const client = await clientPromise;
    const db = client.db();

    const updateData: Partial<Expense> = {
      updatedAt: new Date(),
    };

    if (date) updateData.date = new Date(date);
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (category) updateData.category = category;
    if (description !== undefined) updateData.description = description;
    if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod;

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
