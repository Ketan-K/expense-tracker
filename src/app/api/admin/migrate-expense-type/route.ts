import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import clientPromise from "@/lib/mongodb";

export async function POST(req: NextRequest) {
  try {
    // Require admin access
    const session = await requireAdmin();
    console.log(`[ADMIN ACTION] Expense type migration initiated by ${session.user.email}`);

    const { dryRun } = await req.json();

    const client = await clientPromise;
    const db = client.db();
    const expenses = db.collection("expenses");

    // Count documents without 'type' field
    const countWithoutType = await expenses.countDocuments({
      type: { $exists: false },
    });

    if (countWithoutType === 0) {
      return NextResponse.json({
        success: true,
        message: "No migration needed - all expenses already have 'type' field",
        stats: {
          found: 0,
          migrated: 0,
        },
      });
    }

    if (dryRun) {
      return NextResponse.json({
        success: true,
        message: `Dry run: Would update ${countWithoutType} expenses`,
        stats: {
          found: countWithoutType,
          migrated: 0,
        },
        dryRun: true,
      });
    }

    // Update all expenses without 'type' field
    const result = await expenses.updateMany(
      { type: { $exists: false } },
      { $set: { type: "expense" } }
    );

    // Verify the migration
    const remainingWithoutType = await expenses.countDocuments({
      type: { $exists: false },
    });

    return NextResponse.json({
      success: true,
      message: `Migration completed: Updated ${result.modifiedCount} expenses`,
      stats: {
        found: countWithoutType,
        migrated: result.modifiedCount,
        remaining: remainingWithoutType,
      },
    });
  } catch (error) {
    console.error("Error migrating expenses:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to migrate expenses",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
