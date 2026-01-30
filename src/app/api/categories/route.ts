import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { Category, DEFAULT_CATEGORIES } from "@/lib/types";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

      return NextResponse.json(defaultCategories);
    }

    return NextResponse.json(categories);
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

    const body = await request.json();
    const { name, icon, color } = body;

    if (!name || !icon || !color) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // Check if category with this name already exists for this user
    const existingCategory = await db.collection<Category>("categories").findOne({
      userId: session.user.id,
      name: { $regex: new RegExp(`^${name}$`, 'i') } // Case-insensitive match
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: "A category with this name already exists" },
        { status: 409 }
      );
    }

    const category: Category = {
      userId: session.user.id,
      name,
      icon,
      color,
      isDefault: false,
      createdAt: new Date(),
    };

    const result = await db.collection<Category>("categories").insertOne(category);

    return NextResponse.json({
      ...category,
      _id: result.insertedId,
    });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
