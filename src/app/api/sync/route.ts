import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { Expense, Category, Budget } from "@/lib/types";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { operations } = body;

    if (!operations || !Array.isArray(operations)) {
      return NextResponse.json(
        { error: "Invalid request format" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    const results = [];

    for (const op of operations) {
      try {
        const { action, collection, data, localId } = op;

        if (collection === "expenses") {
          if (action === "CREATE") {
            const expense: Expense = {
              userId: session.user.id,
              date: new Date(data.date),
              amount: parseFloat(data.amount),
              category: data.category,
              description: data.description || "",
              paymentMethod: data.paymentMethod || "",
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            const result = await db.collection<Expense>("expenses").insertOne(expense);
            results.push({
              localId,
              remoteId: result.insertedId.toString(),
              success: true,
            });
          } else if (action === "UPDATE" && data._id) {
            const updateData: Partial<Expense> = {
              updatedAt: new Date(),
            };

            if (data.date) updateData.date = new Date(data.date);
            if (data.amount !== undefined) updateData.amount = parseFloat(data.amount);
            if (data.category) updateData.category = data.category;
            if (data.description !== undefined) updateData.description = data.description;
            if (data.paymentMethod !== undefined) updateData.paymentMethod = data.paymentMethod;

            await db.collection<Expense>("expenses").updateOne(
              { _id: new ObjectId(data._id), userId: session.user.id },
              { $set: updateData }
            );

            results.push({
              localId,
              remoteId: data._id,
              success: true,
            });
          } else if (action === "DELETE" && data._id) {
            await db.collection<Expense>("expenses").deleteOne({
              _id: new ObjectId(data._id),
              userId: session.user.id,
            });

            results.push({
              localId,
              remoteId: data._id,
              success: true,
            });
          }
        } else if (collection === "categories") {
          if (action === "CREATE") {
            const category: Category = {
              userId: session.user.id,
              name: data.name,
              icon: data.icon,
              color: data.color,
              isDefault: false,
              createdAt: new Date(),
            };

            const result = await db.collection<Category>("categories").insertOne(category);
            results.push({
              localId,
              remoteId: result.insertedId.toString(),
              success: true,
            });
          }
        } else if (collection === "budgets") {
          if (action === "CREATE" || action === "UPDATE") {
            const budget: Budget = {
              userId: session.user.id,
              categoryId: data.categoryId,
              month: data.month,
              amount: parseFloat(data.amount),
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            const result = await db.collection<Budget>("budgets").findOneAndUpdate(
              { userId: session.user.id, categoryId: data.categoryId, month: data.month },
              { $set: budget },
              { upsert: true, returnDocument: "after" }
            );

            results.push({
              localId,
              remoteId: result?._id?.toString(),
              success: true,
            });
          }
        }
      } catch (error) {
        console.error("Error processing operation:", error);
        results.push({
          localId: op.localId,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Error syncing data:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
