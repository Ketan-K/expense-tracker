import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { ensureIndexes } from "@/lib/ensureIndexes";

export async function POST() {
  try {
    // Require admin access
    const session = await requireAdmin();
    console.log(`[ADMIN ACTION] Ensure indexes initiated by ${session.user.email}`);
    
    const result = await ensureIndexes();

    return NextResponse.json({
      success: result.success,
      message: result.success 
        ? `Indexes ensured: ${result.created} created, ${result.existing} already existed`
        : "Some indexes failed to create",
      created: result.created,
      existing: result.existing,
      errors: result.errors
    });
  } catch (error) {
    console.error("Error ensuring indexes:", error);
    return NextResponse.json(
      { error: "Failed to ensure indexes" },
      { status: 500 }
    );
  }
}
