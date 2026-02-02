import { requireAdmin } from "@/lib/auth-utils";
import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";

/**
 * API route to migrate contact phone/email fields from strings to arrays
 * Admin only - requires authentication
 */
export async function POST(request: Request) {
  try {
    // Require admin access
    await requireAdmin();

    const client = await clientPromise;
    const db = client.db();
    const contacts = db.collection("contacts");

    // Find all contacts that have phone or email as strings (not arrays)
    const contactsToMigrate = await contacts
      .find({
        $or: [
          { phone: { $type: "string" } },
          { email: { $type: "string" } },
        ],
      })
      .toArray();

    let migrated = 0;
    const errors: string[] = [];

    for (const contact of contactsToMigrate) {
      try {
        const updates: any = {};

        // Convert phone string to array
        if (typeof contact.phone === "string" && contact.phone.trim()) {
          updates.phone = [contact.phone.trim()];
          updates.primaryPhone = 0; // First item is primary
        } else if (contact.phone === undefined || contact.phone === null || contact.phone === "") {
          updates.phone = []; // Empty array for no phone
          updates.primaryPhone = undefined;
        }

        // Convert email string to array
        if (typeof contact.email === "string" && contact.email.trim()) {
          updates.email = [contact.email.trim()];
          updates.primaryEmail = 0; // First item is primary
        } else if (contact.email === undefined || contact.email === null || contact.email === "") {
          updates.email = []; // Empty array for no email
          updates.primaryEmail = undefined;
        }

        if (Object.keys(updates).length > 0) {
          await contacts.updateOne(
            { _id: contact._id },
            { $set: { ...updates, updatedAt: new Date() } }
          );
          migrated++;
        }
      } catch (error) {
        console.error(`Error migrating contact ${contact._id}:`, error);
        errors.push(`Failed to migrate contact ${contact._id}`);
      }
    }

    // Verify migration
    const remainingStrings = await contacts.countDocuments({
      $or: [
        { phone: { $type: "string" } },
        { email: { $type: "string" } },
      ],
    });

    return NextResponse.json({
      success: true,
      migrated,
      total: contactsToMigrate.length,
      remaining: remainingStrings,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json(
      {
        error: "Migration failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
