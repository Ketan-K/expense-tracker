import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

/**
 * Migration API endpoint - adds type field to existing expenses
 * 
 * Usage:
 * POST /api/admin/migrate
 * Headers: { "x-admin-secret": "your-secret-from-env" }
 * 
 * Or visit in browser:
 * /api/admin/migrate?secret=your-secret-from-env
 */
export async function POST(req: NextRequest) {
  try {
    // Check admin secret
    const secret = req.headers.get("x-admin-secret") || req.nextUrl.searchParams.get("secret");
    const adminSecret = process.env.ADMIN_SECRET;

    if (!adminSecret) {
      return NextResponse.json(
        { error: "ADMIN_SECRET not configured in environment variables" },
        { status: 500 }
      );
    }

    if (secret !== adminSecret) {
      return NextResponse.json(
        { error: "Unauthorized - invalid admin secret" },
        { status: 401 }
      );
    }

    const { db } = await connectToDatabase();
    const expensesCollection = db.collection("expenses");

    // Count expenses without type field
    const countBefore = await expensesCollection.countDocuments({
      type: { $exists: false },
    });

    if (countBefore === 0) {
      return NextResponse.json({
        success: true,
        message: "Migration already complete - no expenses need updating",
        stats: {
          expensesUpdated: 0,
          totalExpenses: await expensesCollection.countDocuments({}),
        },
      });
    }

    // Update all expenses without type field
    const result = await expensesCollection.updateMany(
      { type: { $exists: false } },
      { 
        $set: { 
          type: "expense",
          updatedAt: new Date()
        } 
      }
    );

    // Verify the migration
    const countAfter = await expensesCollection.countDocuments({
      type: { $exists: false },
    });

    // Get type distribution
    const typeDistribution = await expensesCollection
      .aggregate([
        { $group: { _id: "$type", count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ])
      .toArray();

    const totalExpenses = await expensesCollection.countDocuments({});

    return NextResponse.json({
      success: true,
      message: `Migration completed successfully!`,
      stats: {
        expensesUpdated: result.modifiedCount,
        expensesWithoutTypeRemaining: countAfter,
        totalExpenses,
        typeDistribution: typeDistribution.map((item) => ({
          type: item._id || "null",
          count: item.count,
        })),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json(
      {
        error: "Migration failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// Allow GET for browser testing (less secure, but convenient)
export async function GET(req: NextRequest) {
  const dryRun = req.nextUrl.searchParams.get("dry-run") === "true";
  
  try {
    // Check admin secret
    const secret = req.nextUrl.searchParams.get("secret");
    const adminSecret = process.env.ADMIN_SECRET;

    if (!adminSecret) {
      return NextResponse.json(
        { error: "ADMIN_SECRET not configured in environment variables" },
        { status: 500 }
      );
    }

    if (secret !== adminSecret) {
      return NextResponse.json(
        { error: "Unauthorized - invalid admin secret" },
        { status: 401 }
      );
    }

    const { db } = await connectToDatabase();
    const expensesCollection = db.collection("expenses");

    // Count expenses without type field
    const countWithoutType = await expensesCollection.countDocuments({
      type: { $exists: false },
    });

    const totalExpenses = await expensesCollection.countDocuments({});

    // Get type distribution
    const typeDistribution = await expensesCollection
      .aggregate([
        { $group: { _id: "$type", count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ])
      .toArray();

    if (dryRun) {
      return NextResponse.json({
        dryRun: true,
        message: "Dry run - no changes made",
        stats: {
          expensesNeedingUpdate: countWithoutType,
          totalExpenses,
          typeDistribution: typeDistribution.map((item) => ({
            type: item._id || "null",
            count: item.count,
          })),
        },
        instructions: "Remove ?dry-run=true to run the actual migration",
      });
    }

    if (countWithoutType === 0) {
      return NextResponse.json({
        success: true,
        message: "Migration already complete - no expenses need updating",
        stats: {
          totalExpenses,
          typeDistribution: typeDistribution.map((item) => ({
            type: item._id || "null",
            count: item.count,
          })),
        },
      });
    }

    // Run the migration
    const result = await expensesCollection.updateMany(
      { type: { $exists: false } },
      { 
        $set: { 
          type: "expense",
          updatedAt: new Date()
        } 
      }
    );

    // Verify
    const countAfter = await expensesCollection.countDocuments({
      type: { $exists: false },
    });

    const newTypeDistribution = await expensesCollection
      .aggregate([
        { $group: { _id: "$type", count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ])
      .toArray();

    return NextResponse.json({
      success: true,
      message: `Migration completed successfully!`,
      stats: {
        expensesUpdated: result.modifiedCount,
        expensesWithoutTypeRemaining: countAfter,
        totalExpenses,
        typeDistribution: newTypeDistribution.map((item) => ({
          type: item._id || "null",
          count: item.count,
        })),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json(
      {
        error: "Migration failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
