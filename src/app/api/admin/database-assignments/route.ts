import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { databaseAssignmentService } from "@/lib/services/database/assignment.service";
import { handleOptionsRequest, addCorsHeaders } from "@/lib/cors";

export async function OPTIONS(request: Request) {
  return handleOptionsRequest(request);
}

export async function GET(request: Request) {
  try {
    await requireAdmin();

    // Get all assignments stats
    const stats = await databaseAssignmentService.getAssignmentStats();

    if (stats.isFailure()) {
      return NextResponse.json(
        { error: stats.error.message },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      success: true,
      stats: stats.value,
    });
    return addCorsHeaders(response, request.headers.get("origin"));
  } catch (error) {
    console.error("Error getting assignment stats:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unauthorized" },
      { status: error instanceof Error && error.message.includes("Unauthorized") ? 401 : 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { action, userId, provider } = body;

    if (action === "assign") {
      // Assign user to database
      if (!userId || !provider) {
        return NextResponse.json(
          { error: "userId and provider are required" },
          { status: 400 }
        );
      }

      const result = await databaseAssignmentService.assignUserToDatabase(userId, provider);

      if (result.isFailure()) {
        return NextResponse.json(
          { error: result.error.message },
          { status: 500 }
        );
      }

      const response = NextResponse.json({
        success: true,
        message: `User ${userId} assigned to ${provider}`,
      });
      return addCorsHeaders(response, request.headers.get("origin"));
    }

    if (action === "migrate-user") {
      // Migrate single user from MongoDB to Supabase
      if (!userId) {
        return NextResponse.json(
          { error: "userId is required" },
          { status: 400 }
        );
      }

      // TODO: Implement user data migration logic
      const response = NextResponse.json({
        success: false,
        error: "User migration not yet implemented",
      });
      return addCorsHeaders(response, request.headers.get("origin"));
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error in database assignment:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unauthorized" },
      { status: error instanceof Error && error.message.includes("Unauthorized") ? 401 : 500 }
    );
  }
}
