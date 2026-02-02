import { MongoClient } from "mongodb";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const uri = process.env.MONGODB_URI!;

if (!uri) {
  throw new Error("MONGODB_URI environment variable not set");
  process.exit(1);
}

async function createIndexes() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db();

    // Expenses Collection Indexes
    console.log("\n📊 Creating indexes for 'expenses' collection...");
    
    // Compound index for user queries with date range
    await db.collection("expenses").createIndex(
      { userId: 1, date: -1 },
      { name: "userId_date_desc", background: true }
    );
    console.log("✅ Created index: userId_date_desc");

    // Compound index for type and date filtering
    await db.collection("expenses").createIndex(
      { userId: 1, type: 1, date: -1 },
      { name: "userId_type_date", background: true }
    );
    console.log("✅ Created index: userId_type_date");

    // Compound index for category filtering
    await db.collection("expenses").createIndex(
      { userId: 1, category: 1, date: -1 },
      { name: "userId_category_date", background: true }
    );
    console.log("✅ Created index: userId_category_date");

    // Index for sync operations (finding by _id and userId)
    await db.collection("expenses").createIndex(
      { userId: 1, _id: 1 },
      { name: "userId_id", background: true }
    );
    console.log("✅ Created index: userId_id");

    // Categories Collection Indexes
    console.log("\n📊 Creating indexes for 'categories' collection...");
    
    // Index for user's categories
    await db.collection("categories").createIndex(
      { userId: 1, name: 1 },
      { name: "userId_name", background: true }
    );
    console.log("✅ Created index: userId_name");

    // Index for checking default categories
    await db.collection("categories").createIndex(
      { userId: 1, isDefault: 1 },
      { name: "userId_isDefault", background: true }
    );
    console.log("✅ Created index: userId_isDefault");

    // Budgets Collection Indexes
    console.log("\n📊 Creating indexes for 'budgets' collection...");
    
    // Unique compound index for budget constraints
    await db.collection("budgets").createIndex(
      { userId: 1, categoryId: 1, month: 1 },
      { name: "userId_categoryId_month_unique", unique: true, background: true }
    );
    console.log("✅ Created index: userId_categoryId_month_unique (unique)");

    // Index for querying budgets by month
    await db.collection("budgets").createIndex(
      { userId: 1, month: -1 },
      { name: "userId_month_desc", background: true }
    );
    console.log("✅ Created index: userId_month_desc");

    // Incomes Collection Indexes
    console.log("\n📊 Creating indexes for 'incomes' collection...");
    
    // Compound index for user queries with date range
    await db.collection("incomes").createIndex(
      { userId: 1, date: -1 },
      { name: "userId_date_desc", background: true }
    );
    console.log("✅ Created index: userId_date_desc");

    // Compound index for source filtering
    await db.collection("incomes").createIndex(
      { userId: 1, source: 1, date: -1 },
      { name: "userId_source_date", background: true }
    );
    console.log("✅ Created index: userId_source_date");

    // Contacts Collection Indexes
    console.log("\n📊 Creating indexes for 'contacts' collection...");
    
    // Index for user's contacts sorted by name
    await db.collection("contacts").createIndex(
      { userId: 1, name: 1 },
      { name: "userId_name", unique: true, background: true }
    );
    console.log("✅ Created index: userId_name (unique)");

    // Index for external contact ID (for mobile sync in Phase 2)
    await db.collection("contacts").createIndex(
      { userId: 1, externalId: 1, source: 1 },
      { name: "userId_externalId_source", sparse: true, background: true }
    );
    console.log("✅ Created index: userId_externalId_source");

    // Loans Collection Indexes
    console.log("\n📊 Creating indexes for 'loans' collection...");
    
    // Compound index for direction and status filtering
    await db.collection("loans").createIndex(
      { userId: 1, direction: 1, status: 1 },
      { name: "userId_direction_status", background: true }
    );
    console.log("✅ Created index: userId_direction_status");

    // Index for contact-based loan queries
    await db.collection("loans").createIndex(
      { userId: 1, contactId: 1 },
      { name: "userId_contactId", background: true }
    );
    console.log("✅ Created index: userId_contactId");

    // Index for due date queries (for reminders)
    await db.collection("loans").createIndex(
      { userId: 1, status: 1, dueDate: 1 },
      { name: "userId_status_dueDate", background: true }
    );
    console.log("✅ Created index: userId_status_dueDate");

    // Loan Payments Collection Indexes
    console.log("\n📊 Creating indexes for 'loanPayments' collection...");
    
    // Index for querying payments by loan
    await db.collection("loanPayments").createIndex(
      { loanId: 1, date: -1 },
      { name: "loanId_date_desc", background: true }
    );
    console.log("✅ Created index: loanId_date_desc");

    // Index for user's payments
    await db.collection("loanPayments").createIndex(
      { userId: 1, date: -1 },
      { name: "userId_date_desc", background: true }
    );
    console.log("✅ Created index: userId_date_desc");

    // NextAuth Collections (if using MongoDB adapter)
    console.log("\n📊 Creating indexes for NextAuth collections...");
    
    // Users collection
    await db.collection("users").createIndex(
      { email: 1 },
      { name: "email_unique", unique: true, background: true }
    );
    console.log("✅ Created index: email_unique on users");

    // Sessions collection
    await db.collection("sessions").createIndex(
      { sessionToken: 1 },
      { name: "sessionToken_unique", unique: true, background: true }
    );
    console.log("✅ Created index: sessionToken_unique on sessions");

    await db.collection("sessions").createIndex(
      { expires: 1 },
      { name: "expires_ttl", expireAfterSeconds: 0, background: true }
    );
    console.log("✅ Created TTL index: expires_ttl on sessions");

    // Accounts collection
    await db.collection("accounts").createIndex(
      { provider: 1, providerAccountId: 1 },
      { name: "provider_providerAccountId_unique", unique: true, background: true }
    );
    console.log("✅ Created index: provider_providerAccountId_unique on accounts");

    await db.collection("accounts").createIndex(
      { userId: 1 },
      { name: "userId_accounts", background: true }
    );
    console.log("✅ Created index: userId_accounts on accounts");

    // Verification Tokens collection
    await db.collection("verificationtokens").createIndex(
      { identifier: 1, token: 1 },
      { name: "identifier_token_unique", unique: true, background: true }
    );
    console.log("✅ Created index: identifier_token_unique on verificationtokens");

    await db.collection("verificationtokens").createIndex(
      { expires: 1 },
      { name: "expires_ttl_tokens", expireAfterSeconds: 0, background: true }
    );
    console.log("✅ Created TTL index: expires_ttl_tokens on verificationtokens");

    // List all indexes
    console.log("\n📋 Listing all indexes...\n");
    const collections = [
      "expenses", 
      "categories", 
      "budgets", 
      "incomes", 
      "contacts", 
      "loans", 
      "loanPayments", 
      "users", 
      "sessions", 
      "accounts", 
      "verificationtokens"
    ];
    
    for (const collectionName of collections) {
      const indexes = await db.collection(collectionName).indexes();
      console.log(`\n${collectionName} indexes:`);
      indexes.forEach((index) => {
        console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
      });
    }

    console.log("\n✅ All indexes created successfully!");
  } catch (error) {
    console.error("❌ Error creating indexes:", error);
    throw error;
  } finally {
    await client.close();
    console.log("\n👋 Connection closed");
  }
}

// Run the script
createIndexes()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
