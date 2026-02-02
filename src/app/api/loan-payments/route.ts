import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { LoanPayment, Loan } from "@/lib/types";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { validateLoanPayment, sanitizeString } from "@/lib/validation";
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
    const loanId = searchParams.get("loanId");

    const client = await clientPromise;
    const db = client.db();

    const query: any = { userId: session.user.id };

    if (loanId) {
      query.loanId = sanitizeString(loanId);
    }

    const payments = await db
      .collection<LoanPayment>("loanPayments")
      .find(query)
      .sort({ date: -1 })
      .toArray();

    const response = NextResponse.json(payments);
    return addCorsHeaders(response, request.headers.get("origin"));
  } catch (error) {
    console.error("Error fetching loan payments:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
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

    const validation = validateLoanPayment(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // Verify the loan exists and belongs to the user
    const loan = await db.collection<Loan>("loans").findOne({
      _id: new ObjectId(validation.sanitized!.loanId),
      userId: session.user.id,
    });

    if (!loan) {
      return NextResponse.json(
        { error: "Loan not found" },
        { status: 404 }
      );
    }

    // Verify payment amount doesn't exceed outstanding amount
    if (validation.sanitized!.amount > loan.outstandingAmount) {
      return NextResponse.json(
        { error: "Payment amount exceeds outstanding loan amount" },
        { status: 400 }
      );
    }

    const payment: LoanPayment = {
      userId: session.user.id,
      ...validation.sanitized!,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Create payment
    const result = await db.collection<LoanPayment>("loanPayments").insertOne(payment);

    // Update loan outstanding amount and status
    const newOutstanding = loan.outstandingAmount - validation.sanitized!.amount;
    const newStatus = newOutstanding === 0 ? "paid" : loan.status;

    await db.collection<Loan>("loans").updateOne(
      { _id: new ObjectId(validation.sanitized!.loanId) },
      {
        $set: {
          outstandingAmount: newOutstanding,
          status: newStatus,
          updatedAt: new Date(),
        },
      }
    );

    const response = NextResponse.json({
      ...payment,
      _id: result.insertedId,
    });
    return addCorsHeaders(response, request.headers.get("origin"));
  } catch (error) {
    console.error("Error creating loan payment:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
