import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { Income } from "@/lib/types";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { validateIncome, sanitizeObjectId } from "@/lib/validation";
import { applyRateLimit, getIP } from "@/lib/ratelimit-middleware";
import { rateLimiters } from "@/lib/ratelimit";
import { handleOptionsRequest, addCorsHeaders } from "@/lib/cors";

export async function OPTIONS(request: Request) {
  return handleOptionsRequest(request);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResult = await applyRateLimit(session.user.id, getIP(request), rateLimiters.api);
    if (rateLimitResult) return rateLimitResult;

    const { id } = await params;

    if (!sanitizeObjectId(id)) {
      return NextResponse.json({ error: "Invalid income ID" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    const income = await db.collection<Income>("incomes").findOne({
      _id: new ObjectId(id),
      userId: session.user.id,
    });

    if (!income) {
      return NextResponse.json({ error: "Income not found" }, { status: 404 });
    }

    const response = NextResponse.json(income);
    return addCorsHeaders(response, request.headers.get("origin"));
  } catch (error) {
    console.error("Error fetching income:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResult = await applyRateLimit(session.user.id, getIP(request), rateLimiters.api);
    if (rateLimitResult) return rateLimitResult;

    const { id } = await params;

    if (!sanitizeObjectId(id)) {
      return NextResponse.json({ error: "Invalid income ID" }, { status: 400 });
    }

    const body = await request.json();

    const validation = validateIncome(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    const updateData = {
      ...validation.sanitized!,
      updatedAt: new Date(),
    };

    const result = await db.collection<Income>("incomes").findOneAndUpdate(
      { _id: new ObjectId(id), userId: session.user.id },
      { $set: updateData },
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json({ error: "Income not found" }, { status: 404 });
    }

    const response = NextResponse.json(result);
    return addCorsHeaders(response, request.headers.get("origin"));
  } catch (error) {
    console.error("Error updating income:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResult = await applyRateLimit(session.user.id, getIP(request), rateLimiters.api);
    if (rateLimitResult) return rateLimitResult;

    const { id } = await params;

    if (!sanitizeObjectId(id)) {
      return NextResponse.json({ error: "Invalid income ID" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    const result = await db.collection<Income>("incomes").findOneAndDelete({
      _id: new ObjectId(id),
      userId: session.user.id,
    });

    if (!result) {
      return NextResponse.json({ error: "Income not found" }, { status: 404 });
    }

    const response = NextResponse.json({ message: "Income deleted successfully" });
    return addCorsHeaders(response, request.headers.get("origin"));
  } catch (error) {
    console.error("Error deleting income:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
