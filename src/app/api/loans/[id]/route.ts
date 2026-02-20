import { requireAuth, getPlatformContext } from "@/lib/auth/server";
import { getConnectedClient } from "@/lib/mongodb";
import { Loan } from "@/lib/types";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";
import { validateLoan, sanitizeObjectId } from "@/lib/validation";
import { applyRateLimit, getIP } from "@/lib/ratelimit-middleware";
import { rateLimiters } from "@/lib/ratelimit";
import { handleOptionsRequest, addCorsHeaders } from "@/lib/cors";

export async function OPTIONS(request: Request) {
  return handleOptionsRequest(request);
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth(request);
    const platform = getPlatformContext(request);

    const rateLimitResult = await applyRateLimit(
      session.user.id!,
      getIP(request),
      rateLimiters.api
    );
    if (rateLimitResult) return rateLimitResult;

    const { id } = await params;

    if (!sanitizeObjectId(id)) {
      return NextResponse.json({ error: "Invalid loan ID" }, { status: 400 });
    }

    const client = await getConnectedClient();
    const db = client.db();

    const loan = await db.collection<Loan>("loans").findOne({
      _id: new ObjectId(id),
      userId: session.user.id,
    });

    if (!loan) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 });
    }

    const response = NextResponse.json(loan);
    return addCorsHeaders(response, request.headers.get("origin"));
  } catch (error) {
    console.error("Error fetching loan:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth(request);
    const platform = getPlatformContext(request);

    const rateLimitResult = await applyRateLimit(
      session.user.id!,
      getIP(request),
      rateLimiters.api
    );
    if (rateLimitResult) return rateLimitResult;

    const { id } = await params;

    if (!sanitizeObjectId(id)) {
      return NextResponse.json({ error: "Invalid loan ID" }, { status: 400 });
    }

    const body = await request.json();

    const validation = validateLoan(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 400 }
      );
    }

    const client = await getConnectedClient();
    const db = client.db();

    const updateData = {
      ...validation.sanitized!,
      updatedAt: new Date(),
    };

    const result = await db
      .collection<Loan>("loans")
      .findOneAndUpdate(
        { _id: new ObjectId(id), userId: session.user.id },
        { $set: updateData },
        { returnDocument: "after" }
      );

    if (!result) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 });
    }

    const response = NextResponse.json(result);
    return addCorsHeaders(response, request.headers.get("origin"));
  } catch (error) {
    console.error("Error updating loan:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(request);
    const platform = getPlatformContext(request);

    const rateLimitResult = await applyRateLimit(
      session.user.id!,
      getIP(request),
      rateLimiters.api
    );
    if (rateLimitResult) return rateLimitResult;

    const { id } = await params;

    if (!sanitizeObjectId(id)) {
      return NextResponse.json({ error: "Invalid loan ID" }, { status: 400 });
    }

    const client = await getConnectedClient();
    const db = client.db();

    // Check if there are any payments for this loan
    const paymentsCount = await db.collection("loanPayments").countDocuments({
      loanId: id,
      userId: session.user.id,
    });

    // Archive the loan (instead of hard delete)
    const result = await db.collection<Loan>("loans").findOneAndUpdate(
      { _id: new ObjectId(id), userId: session.user.id },
      {
        $set: {
          isArchived: true,
          archivedAt: new Date(),
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 });
    }

    // Archive all associated loan payments
    if (paymentsCount > 0) {
      await db.collection("loanPayments").updateMany(
        { loanId: id, userId: session.user.id },
        {
          $set: {
            isArchived: true,
            archivedAt: new Date(),
            updatedAt: new Date(),
          },
        }
      );
    }

    const response = NextResponse.json({
      success: true,
      loan: result,
      paymentsArchived: paymentsCount,
    });
    return addCorsHeaders(response, request.headers.get("origin"));
  } catch (error) {
    console.error("Error archiving loan:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth(request);
    const platform = getPlatformContext(request);

    const rateLimitResult = await applyRateLimit(
      session.user.id!,
      getIP(request),
      rateLimiters.api
    );
    if (rateLimitResult) return rateLimitResult;

    const { id } = await params;

    if (!sanitizeObjectId(id)) {
      return NextResponse.json({ error: "Invalid loan ID" }, { status: 400 });
    }

    // Check if this is a restore action
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action !== "restore") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const client = await getConnectedClient();
    const db = client.db();

    // Restore the archived loan
    const result = await db.collection<Loan>("loans").findOneAndUpdate(
      { _id: new ObjectId(id), userId: session.user.id },
      {
        $set: {
          isArchived: false,
          updatedAt: new Date(),
        },
        $unset: { archivedAt: "" },
      },
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 });
    }

    // Restore all associated loan payments
    await db.collection("loanPayments").updateMany(
      { loanId: id, userId: session.user.id },
      {
        $set: {
          isArchived: false,
          updatedAt: new Date(),
        },
        $unset: { archivedAt: "" },
      }
    );

    const response = NextResponse.json({ success: true, loan: result });
    return addCorsHeaders(response, request.headers.get("origin"));
  } catch (error) {
    console.error("Error restoring loan:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
