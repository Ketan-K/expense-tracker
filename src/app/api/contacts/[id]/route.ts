import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { Contact } from "@/lib/types";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { validateContact, sanitizeObjectId } from "@/lib/validation";
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
      return NextResponse.json({ error: "Invalid contact ID" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    const contact = await db.collection<Contact>("contacts").findOne({
      _id: new ObjectId(id),
      userId: session.user.id,
    });

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    const response = NextResponse.json(contact);
    return addCorsHeaders(response, request.headers.get("origin"));
  } catch (error) {
    console.error("Error fetching contact:", error);
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
      return NextResponse.json({ error: "Invalid contact ID" }, { status: 400 });
    }

    const body = await request.json();

    const validation = validateContact(body);
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

    const result = await db.collection<Contact>("contacts").findOneAndUpdate(
      { _id: new ObjectId(id), userId: session.user.id },
      { $set: updateData },
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    const response = NextResponse.json(result);
    return addCorsHeaders(response, request.headers.get("origin"));
  } catch (error) {
    console.error("Error updating contact:", error);
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
      return NextResponse.json({ error: "Invalid contact ID" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    // Check if contact is used in any loans
    const loansUsingContact = await db.collection("loans").countDocuments({
      userId: session.user.id,
      contactId: id,
    });

    if (loansUsingContact > 0) {
      return NextResponse.json(
        { error: "Cannot delete contact with associated loans" },
        { status: 409 }
      );
    }

    const result = await db.collection<Contact>("contacts").findOneAndDelete({
      _id: new ObjectId(id),
      userId: session.user.id,
    });

    if (!result) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    const response = NextResponse.json({ message: "Contact deleted successfully" });
    return addCorsHeaders(response, request.headers.get("origin"));
  } catch (error) {
    console.error("Error deleting contact:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
