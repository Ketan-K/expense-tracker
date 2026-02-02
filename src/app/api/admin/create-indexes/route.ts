import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

/**
 * Create Database Indexes API endpoint
 * 
 * Usage:
 * POST /api/admin/create-indexes
 * Headers: { "x-admin-secret": "your-secret-from-env" }
 * 
 * Or visit in browser:
 * /api/admin/create-indexes?secret=your-secret-from-env
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

    const client = await clientPromise;
    const db = client.db();
    const results = [];

    // Expenses indexes
    try {
      await db.collection("expenses").createIndex({ userId: 1, type: 1, date: -1 });
      results.push({ collection: "expenses", index: "userId_type_date", status: "created" });
    } catch (error) {
      results.push({ 
        collection: "expenses", 
        index: "userId_type_date", 
        status: "error", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }

    try {
      await db.collection("expenses").createIndex({ userId: 1, category: 1 });
      results.push({ collection: "expenses", index: "userId_category", status: "created" });
    } catch (error) {
      results.push({ 
        collection: "expenses", 
        index: "userId_category", 
        status: "error", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }

    try {
      await db.collection("expenses").createIndex({ userId: 1, date: -1 });
      results.push({ collection: "expenses", index: "userId_date", status: "created" });
    } catch (error) {
      results.push({ 
        collection: "expenses", 
        index: "userId_date", 
        status: "error", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }

    // Incomes indexes
    try {
      await db.collection("incomes").createIndex({ userId: 1, date: -1 });
      results.push({ collection: "incomes", index: "userId_date", status: "created" });
    } catch (error) {
      results.push({ 
        collection: "incomes", 
        index: "userId_date", 
        status: "error", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }

    try {
      await db.collection("incomes").createIndex({ userId: 1, source: 1 });
      results.push({ collection: "incomes", index: "userId_source", status: "created" });
    } catch (error) {
      results.push({ 
        collection: "incomes", 
        index: "userId_source", 
        status: "error", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }

    // Loans indexes
    try {
      await db.collection("loans").createIndex({ userId: 1, direction: 1, status: 1 });
      results.push({ collection: "loans", index: "userId_direction_status", status: "created" });
    } catch (error) {
      results.push({ 
        collection: "loans", 
        index: "userId_direction_status", 
        status: "error", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }

    try {
      await db.collection("loans").createIndex({ userId: 1, contactId: 1 });
      results.push({ collection: "loans", index: "userId_contactId", status: "created" });
    } catch (error) {
      results.push({ 
        collection: "loans", 
        index: "userId_contactId", 
        status: "error", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }

    try {
      await db.collection("loans").createIndex({ userId: 1, status: 1, dueDate: 1 });
      results.push({ collection: "loans", index: "userId_status_dueDate", status: "created" });
    } catch (error) {
      results.push({ 
        collection: "loans", 
        index: "userId_status_dueDate", 
        status: "error", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }

    // Loan Payments indexes
    try {
      await db.collection("loanPayments").createIndex({ loanId: 1, date: -1 });
      results.push({ collection: "loanPayments", index: "loanId_date_desc", status: "created" });
    } catch (error) {
      results.push({ 
        collection: "loanPayments", 
        index: "loanId_date_desc", 
        status: "error", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }

    try {
      await db.collection("loanPayments").createIndex({ userId: 1, date: -1 });
      results.push({ collection: "loanPayments", index: "userId_date", status: "created" });
    } catch (error) {
      results.push({ 
        collection: "loanPayments", 
        index: "userId_date", 
        status: "error", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }

    // Contacts indexes
    try {
      await db.collection("contacts").createIndex({ userId: 1, name: 1 }, { unique: true });
      results.push({ collection: "contacts", index: "userId_name_unique", status: "created" });
    } catch (error) {
      results.push({ 
        collection: "contacts", 
        index: "userId_name_unique", 
        status: "error", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }

    // Categories indexes
    try {
      await db.collection("categories").createIndex({ userId: 1, name: 1 });
      results.push({ collection: "categories", index: "userId_name", status: "created" });
    } catch (error) {
      results.push({ 
        collection: "categories", 
        index: "userId_name", 
        status: "error", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }

    // Budgets indexes
    try {
      await db.collection("budgets").createIndex({ userId: 1, month: 1 });
      results.push({ collection: "budgets", index: "userId_month", status: "created" });
    } catch (error) {
      results.push({ 
        collection: "budgets", 
        index: "userId_month", 
        status: "error", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }

    try {
      await db.collection("budgets").createIndex({ userId: 1, categoryId: 1, month: 1 });
      results.push({ collection: "budgets", index: "userId_categoryId_month", status: "created" });
    } catch (error) {
      results.push({ 
        collection: "budgets", 
        index: "userId_categoryId_month", 
        status: "error", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }

    // Users indexes
    try {
      await db.collection("users").createIndex({ email: 1 }, { unique: true });
      results.push({ collection: "users", index: "email_unique", status: "created" });
    } catch (error) {
      results.push({ 
        collection: "users", 
        index: "email_unique", 
        status: "error", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }

    const successCount = results.filter(r => r.status === "created").length;
    const errorCount = results.filter(r => r.status === "error").length;

    return NextResponse.json({
      success: errorCount === 0,
      message: `Created ${successCount} indexes${errorCount > 0 ? ` with ${errorCount} errors` : ""}`,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Index creation error:", error);
    return NextResponse.json(
      {
        error: "Index creation failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// Allow GET for browser access
export async function GET(req: NextRequest) {
  return POST(req);
}
