/**
 * Database Stats API - Admin Only
 * Returns statistics for both MongoDB and Supabase databases
 */

import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-utils";
import { databaseAssignmentService } from "@/lib/services/database/assignment.service";
import { getMongoClient } from "@/lib/services/database/mongodb/client";
import { getSupabaseClient } from "@/lib/services/database/supabase/client";
import { handleOptionsRequest, addCorsHeaders } from "@/lib/cors";

export async function OPTIONS(request: Request) {
  return handleOptionsRequest(request);
}

export async function GET(request: Request) {
  try {
    // Check admin auth
    const session = await auth();
    if (!session?.user?.email || !(await isAdmin())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get user distribution
    const assignmentResult = await databaseAssignmentService.getDatabaseStats();
    
    if (assignmentResult.isFailure()) {
      return NextResponse.json(
        { error: "Failed to get database stats" },
        { status: 500 }
      );
    }

    const userDistribution = assignmentResult.value;

    // Get MongoDB stats
    const mongoStats = {
      connected: false,
      totalUsers: userDistribution.mongodb,
      collections: {} as Record<string, number>,
      error: null as string | null,
    };

    try {
      const mongoClient = await getMongoClient();
      const db = mongoClient.db();
      
      mongoStats.connected = true;
      
      // Count documents in each collection
      const collections = ["expenses", "incomes", "categories", "budgets", "contacts", "loans", "loanPayments"];
      for (const collectionName of collections) {
        try {
          const count = await db.collection(collectionName).countDocuments();
          mongoStats.collections[collectionName] = count;
        } catch (error) {
          mongoStats.collections[collectionName] = 0;
        }
      }
    } catch (error) {
      mongoStats.error = error instanceof Error ? error.message : "MongoDB connection failed";
    }

    // Get Supabase stats
    const supabaseStats = {
      connected: false,
      totalUsers: userDistribution.supabase,
      collections: {} as Record<string, number>,
      error: null as string | null,
    };

    try {
      const supabaseClient = getSupabaseClient();
      supabaseStats.connected = true;

      // Count rows in each table
      const tables = ["expenses", "incomes", "categories", "budgets", "contacts", "loans", "loan_payments"];
      for (const tableName of tables) {
        try {
          const { count, error } = await supabaseClient
            .from(tableName)
            .select("*", { count: "exact", head: true });
          
          if (!error) {
            supabaseStats.collections[tableName] = count || 0;
          } else {
            supabaseStats.collections[tableName] = 0;
          }
        } catch (error) {
          supabaseStats.collections[tableName] = 0;
        }
      }
    } catch (error) {
      supabaseStats.error = error instanceof Error ? error.message : "Supabase connection failed";
    }

    const stats = {
      userDistribution,
      totalUsers: userDistribution.mongodb + userDistribution.supabase,
      mongodb: mongoStats,
      supabase: supabaseStats,
      timestamp: new Date().toISOString(),
    };

    const response = NextResponse.json(stats);
    return addCorsHeaders(response, request.headers.get("origin"));

  } catch (error) {
    console.error("Error fetching database stats:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
