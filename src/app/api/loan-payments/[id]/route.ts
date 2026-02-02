import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { LoanPayment, Loan } from "@/lib/types";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { sanitizeObjectId } from "@/lib/validation";
import { applyRateLimit, getIP } from "@/lib/ratelimit-middleware";
import { rateLimiters } from "@/lib/ratelimit";
import { handleOptionsRequest, addCorsHeaders } from "@/lib/cors";

export async function OPTIONS(request: Request) {
  return handleOptionsRequest(request);
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
      return NextResponse.json({ error: "Invalid payment ID" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    // Get the payment to be deleted
    const payment = await db.collection<LoanPayment>("loanPayments").findOne({
      _id: new ObjectId(id),
      userId: session.user.id,
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Delete the payment
    await db.collection<LoanPayment>("loanPayments").deleteOne({
      _id: new ObjectId(id),
    });

    // Update loan outstanding amount (add back the payment)
    const loan = await db.collection<Loan>("loans").findOne({
      _id: new ObjectId(payment.loanId),
    });

    if (loan) {
      const newOutstanding = loan.outstandingAmount + payment.amount;
      const newStatus = newOutstanding > 0 && loan.status === "paid" ? "active" : loan.status;

      await db.collection<Loan>("loans").updateOne(
        { _id: new ObjectId(payment.loanId) },
        {
          $set: {
            outstandingAmount: newOutstanding,
            status: newStatus,
            updatedAt: new Date(),
          },
        }
      );
    }

    const response = NextResponse.json({ message: "Payment deleted successfully" });
    return addCorsHeaders(response, request.headers.get("origin"));
  } catch (error) {
    console.error("Error deleting loan payment:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
