import { auth } from "@/auth";
import { getConnectedClient } from "@/lib/mongodb";
import type { Loan } from "@/lib/types";
import { NextResponse } from "next/server";
import { validateLoan, sanitizeString } from "@/lib/validation";
import { applyRateLimit, getIP } from "@/lib/ratelimit-middleware";
import { rateLimiters } from "@/lib/ratelimit";
import { handleOptionsRequest, addCorsHeaders } from "@/lib/cors";

export async function OPTIONS(request: Request) {
  return handleOptionsRequest(request);
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResult = await applyRateLimit(session.user.id, getIP(request), rateLimiters.api);
    if (rateLimitResult) return rateLimitResult;

    const { searchParams } = new URL(request.url);
    const direction = searchParams.get("direction");
    const status = searchParams.get("status");
    const contactId = searchParams.get("contactId");

    const client = await getConnectedClient();
    const db = client.db();

    const query: any = { userId: session.user.id };

    if (direction && (direction === "given" || direction === "taken")) {
      query.direction = direction;
    }

    if (status && ["active", "paid", "overdue"].includes(status)) {
      query.status = status;
    }

    if (contactId) {
      query.contactId = sanitizeString(contactId);
    }

    const loans = await db.collection<Loan>("loans").find(query).sort({ startDate: -1 }).toArray();

    const response = NextResponse.json(loans);
    return addCorsHeaders(response, request.headers.get("origin"));
  } catch (error) {
    console.error("Error fetching loans:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResult = await applyRateLimit(session.user.id, getIP(request), rateLimiters.api);
    if (rateLimitResult) return rateLimitResult;

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

    const loan: Loan = {
      userId: session.user.id,
      ...validation.sanitized!,
      outstandingAmount: validation.sanitized!.principalAmount, // Initially equals principal
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection<Loan>("loans").insertOne(loan);

    const response = NextResponse.json({
      ...loan,
      _id: loan._id || result.insertedId,
    });
    return addCorsHeaders(response, request.headers.get("origin"));
  } catch (error) {
    console.error("Error creating loan:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
