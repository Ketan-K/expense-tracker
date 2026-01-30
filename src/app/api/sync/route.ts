import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { Expense, Category, Budget } from "@/lib/types";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { validateExpense, validateCategory, validateBudget } from "@/lib/validation";
import { applyRateLimit, getIP } from "@/lib/ratelimit-middleware";
import { rateLimiters } from "@/lib/ratelimit";
import { handleOptionsRequest, addCorsHeaders } from "@/lib/cors";

export async function OPTIONS(request: Request) {
  return handleOptionsRequest(request);
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Apply rate limiting (sync has stricter limits)
    const rateLimitResult = await applyRateLimit(session.user.id, getIP(request), rateLimiters.sync);
    if (rateLimitResult) return rateLimitResult;

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

        console.log("🔄 Processing operation:", { action, collection, localId, data });

        if (collection === "expenses") {
          if (action === "CREATE") {
            // Validate expense data
            const validation = validateExpense(data);
            console.log("📋 Validation result:", validation);
            
            if (!validation.isValid) {
              console.error("❌ Validation failed for expense:", localId, validation.errors);
              results.push({
                localId,
                success: false,
                error: `Validation failed: ${validation.errors.join(", ")}`,
              });
              continue;
            }

            const expense: Expense = {
              userId: session.user.id,
              ...validation.sanitized!,
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            console.log("💾 Inserting expense to MongoDB:", expense);
            const result = await db.collection<Expense>("expenses").insertOne(expense);
            console.log("✅ Expense inserted with ID:", result.insertedId.toString());
            
            results.push({
              localId,
              remoteId: result.insertedId.toString(),
              success: true,
            });
          } else if (action === "UPDATE" && data._id) {
            // Validate expense data
            const validation = validateExpense(data);
            if (!validation.isValid) {
              results.push({
                localId,
                success: false,
                error: `Validation failed: ${validation.errors.join(", ")}`,
              });
              continue;
            }

            const updateData = {
              ...validation.sanitized!,
              updatedAt: new Date(),
            };

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
            // Validate category data
            const validation = validateCategory(data);
            if (!validation.isValid) {
              results.push({
                localId,
                success: false,
                error: `Validation failed: ${validation.errors.join(", ")}`,
              });
              continue;
            }

            const category: Category = {
              userId: session.user.id,
              ...validation.sanitized!,
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
            // Validate budget data
            const validation = validateBudget(data);
            if (!validation.isValid) {
              results.push({
                localId,
                success: false,
                error: `Validation failed: ${validation.errors.join(", ")}`,
              });
              continue;
            }

            const budget: Budget = {
              userId: session.user.id,
              ...validation.sanitized!,
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            const result = await db.collection<Budget>("budgets").findOneAndUpdate(
              { userId: session.user.id, categoryId: validation.sanitized!.categoryId, month: validation.sanitized!.month },
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

    const response = NextResponse.json({ results });
    return addCorsHeaders(response, request.headers.get("origin"));
  } catch (error) {
    console.error("Error syncing data:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
