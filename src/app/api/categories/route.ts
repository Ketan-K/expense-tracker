import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { Category, DEFAULT_CATEGORIES } from "@/lib/types";
import { NextResponse } from "next/server";
import { validateCategory, sanitizeString } from "@/lib/validation";
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

    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(session.user.id, getIP(request), rateLimiters.api);
    if (rateLimitResult) return rateLimitResult;

    const client = await clientPromise;
    const db = client.db();

    const categories = await db
      .collection<Category>("categories")
      .find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .toArray();

    // Initialize default categories for new users
    if (categories.length === 0) {
      const defaultCategories = DEFAULT_CATEGORIES.map((cat) => ({
        ...cat,
        userId: session.user.id,
        createdAt: new Date(),
      }));

      await db.collection<Category>("categories").insertMany(defaultCategories);

      const response = NextResponse.json(defaultCategories);
      return addCorsHeaders(response, request.headers.get("origin"));
    }

    const response = NextResponse.json(categories);
    return addCorsHeaders(response, request.headers.get("origin"));
  } catch (error) {
    console.error("Error fetching categories:", error);
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

    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(session.user.id, getIP(request), rateLimiters.api);
    if (rateLimitResult) return rateLimitResult;

    const body = await request.json();

    // Validate and sanitize input
    const validation = validateCategory(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // Check if category with this name already exists for this user
    const existingCategory = await db.collection<Category>("categories").findOne({
      userId: session.user.id,
      name: { $regex: new RegExp(`^${sanitizeString(validation.sanitized!.name)}$`, 'i') } // Case-insensitive match
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: "A category with this name already exists" },
        { status: 409 }
      );
    }

    const category: Category = {
      userId: session.user.id,
      ...validation.sanitized!,
      isDefault: false,
      createdAt: new Date(),
    };

    const result = await db.collection<Category>("categories").insertOne(category);

    const response = NextResponse.json({
      ...category,
      _id: result.insertedId,
    });
    return addCorsHeaders(response, request.headers.get("origin"));
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
