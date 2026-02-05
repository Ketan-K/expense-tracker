import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { applyRateLimit, getIP } from "@/lib/ratelimit-middleware";
import { rateLimiters } from "@/lib/ratelimit";
import { handleOptionsRequest, addCorsHeaders } from "@/lib/cors";
import { loanPaymentService } from "@/lib/services/loan-payment.service";
import { NotFoundError, DatabaseError } from "@/lib/core/errors";

export async function OPTIONS(request: Request) {
  return handleOptionsRequest(request);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResult = await applyRateLimit(session.user.id, getIP(request), rateLimiters.api);
    if (rateLimitResult) return rateLimitResult;

    const { id } = await params;

    const result = await loanPaymentService.deletePayment(id, session.user.id);

    if (result.isFailure()) {
      const error = result.error;
      if (error instanceof NotFoundError) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error instanceof DatabaseError) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ error: "Failed to delete payment" }, { status: 500 });
    }

    const response = NextResponse.json({ message: "Payment deleted successfully" });
    return addCorsHeaders(response, request.headers.get("origin"));
  } catch (error) {
    console.error("Error deleting loan payment:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
