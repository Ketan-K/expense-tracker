import { requireAuth, getPlatformContext, handleAuthError } from "@/lib/auth/server";
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

    const rateLimitResult = await applyRateLimit(session.user.id!, getIP(request), rateLimiters.api);
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

    const rateLimitResult = await applyRateLimit(session.user.id!, getIP(request), rateLimiters.api);
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

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth(request);
    const platform = getPlatformContext(request);

    const rateLimitResult = await applyRateLimit(session.user.id!, getIP(request), rateLimiters.api);
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

    if (paymentsCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete loan with existing payments. Delete payments first." },
        { status: 409 }
      );
    }

    const result = await db.collection<Loan>("loans").findOneAndDelete({
      _id: new ObjectId(id),
      userId: session.user.id,
    });

    if (!result) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 });
    }

    const response = NextResponse.json({ message: "Loan deleted successfully" });
    return addCorsHeaders(response, request.headers.get("origin"));
  } catch (error) {
    console.error("Error deleting loan:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
