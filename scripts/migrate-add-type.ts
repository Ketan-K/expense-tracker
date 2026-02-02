/**
 * Migration Script: Add 'type' field to existing expenses
 * 
 * This script adds the 'type' field with default value 'expense'
 * to all existing expense documents in MongoDB.
 * 
 * Run this script AFTER deploying the updated code to ensure
 * the API can handle both old and new expense documents.
 * 
 * Usage:
 *   npx ts-node scripts/migrate-add-type.ts
 */

import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please add your MongoDB URI to .env.local");
}

async function migrateExpenses() {
  console.log("🚀 Starting migration: Add 'type' field to expenses...\n");

  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI environment variable is not set");
  }

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB\n");

    const db = client.db();
    const expensesCollection = db.collection("expenses");

    // Count documents without 'type' field
    const countWithoutType = await expensesCollection.countDocuments({
      type: { $exists: false },
    });

    console.log(`📊 Found ${countWithoutType} expenses without 'type' field\n`);

    if (countWithoutType === 0) {
      console.log("✨ No migration needed - all expenses already have 'type' field\n");
      return;
    }

    // Ask for confirmation
    console.log("⚠️  This will update all expenses without 'type' field to type='expense'");
    console.log("   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n");
    
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Update all expenses without 'type' field
    const result = await expensesCollection.updateMany(
      { type: { $exists: false } },
      { $set: { type: "expense" } }
    );

    console.log(`✅ Migration completed successfully!`);
    console.log(`   - Modified ${result.modifiedCount} documents\n`);

    // Verify the migration
    const remainingWithoutType = await expensesCollection.countDocuments({
      type: { $exists: false },
    });

    if (remainingWithoutType === 0) {
      console.log("✅ Verification passed: All expenses now have 'type' field\n");
    } else {
      console.warn(`⚠️  Warning: ${remainingWithoutType} documents still missing 'type' field\n`);
    }

    // Show type distribution
    const typeStats = await expensesCollection.aggregate([
      { $group: { _id: "$type", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]).toArray();

    console.log("📊 Type distribution after migration:");
    typeStats.forEach(stat => {
      console.log(`   - ${stat._id || '(missing)'}: ${stat.count} documents`);
    });
    console.log();

  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await client.close();
    console.log("🔌 Disconnected from MongoDB\n");
  }
}

// Run the migration
migrateExpenses()
  .then(() => {
    console.log("✅ Migration script completed successfully\n");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Migration script failed:", error);
    process.exit(1);
  });
