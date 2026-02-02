import clientPromise from "./mongodb";

interface IndexDefinition {
  collection: string;
  indexSpec: any;
  options: any;
}

const INDEX_DEFINITIONS: IndexDefinition[] = [
  // Expenses Collection
  {
    collection: "expenses",
    indexSpec: { userId: 1, date: -1 },
    options: { name: "userId_date_desc", background: true }
  },
  {
    collection: "expenses",
    indexSpec: { userId: 1, type: 1, date: -1 },
    options: { name: "userId_type_date", background: true }
  },
  {
    collection: "expenses",
    indexSpec: { userId: 1, category: 1, date: -1 },
    options: { name: "userId_category_date", background: true }
  },
  {
    collection: "expenses",
    indexSpec: { userId: 1, _id: 1 },
    options: { name: "userId_id", background: true }
  },

  // Categories Collection
  {
    collection: "categories",
    indexSpec: { userId: 1, name: 1 },
    options: { name: "userId_name", background: true }
  },
  {
    collection: "categories",
    indexSpec: { userId: 1, isDefault: 1 },
    options: { name: "userId_isDefault", background: true }
  },

  // Budgets Collection
  {
    collection: "budgets",
    indexSpec: { userId: 1, categoryId: 1, month: 1 },
    options: { name: "userId_categoryId_month_unique", unique: true, background: true }
  },
  {
    collection: "budgets",
    indexSpec: { userId: 1, month: -1 },
    options: { name: "userId_month_desc", background: true }
  },

  // Incomes Collection
  {
    collection: "incomes",
    indexSpec: { userId: 1, date: -1 },
    options: { name: "userId_date_desc", background: true }
  },
  {
    collection: "incomes",
    indexSpec: { userId: 1, source: 1, date: -1 },
    options: { name: "userId_source_date", background: true }
  },

  // Contacts Collection
  {
    collection: "contacts",
    indexSpec: { userId: 1, name: 1 },
    options: { name: "userId_name", unique: true, background: true }
  },
  {
    collection: "contacts",
    indexSpec: { userId: 1, externalId: 1, source: 1 },
    options: { name: "userId_externalId_source", sparse: true, background: true }
  },

  // Loans Collection
  {
    collection: "loans",
    indexSpec: { userId: 1, direction: 1, status: 1 },
    options: { name: "userId_direction_status", background: true }
  },
  {
    collection: "loans",
    indexSpec: { userId: 1, contactId: 1 },
    options: { name: "userId_contactId", background: true }
  },
  {
    collection: "loans",
    indexSpec: { userId: 1, status: 1, dueDate: 1 },
    options: { name: "userId_status_dueDate", background: true }
  },

  // Loan Payments Collection
  {
    collection: "loanPayments",
    indexSpec: { loanId: 1, date: -1 },
    options: { name: "loanId_date_desc", background: true }
  },
  {
    collection: "loanPayments",
    indexSpec: { userId: 1, date: -1 },
    options: { name: "userId_date_desc", background: true }
  },

  // NextAuth Collections
  {
    collection: "users",
    indexSpec: { email: 1 },
    options: { name: "email_unique", unique: true, background: true }
  },
  {
    collection: "sessions",
    indexSpec: { sessionToken: 1 },
    options: { name: "sessionToken_unique", unique: true, background: true }
  },
  {
    collection: "sessions",
    indexSpec: { expires: 1 },
    options: { name: "expires_ttl", expireAfterSeconds: 0, background: true }
  },
  {
    collection: "accounts",
    indexSpec: { provider: 1, providerAccountId: 1 },
    options: { name: "provider_providerAccountId_unique", unique: true, background: true }
  },
  {
    collection: "accounts",
    indexSpec: { userId: 1 },
    options: { name: "userId_accounts", background: true }
  },
  {
    collection: "verificationtokens",
    indexSpec: { identifier: 1, token: 1 },
    options: { name: "identifier_token_unique", unique: true, background: true }
  },
  {
    collection: "verificationtokens",
    indexSpec: { expires: 1 },
    options: { name: "expires_ttl_tokens", expireAfterSeconds: 0, background: true }
  }
];

export async function ensureIndexes(): Promise<{
  success: boolean;
  created: number;
  existing: number;
  errors: string[];
}> {
  const result = {
    success: true,
    created: 0,
    existing: 0,
    errors: [] as string[]
  };

  try {
    const client = await clientPromise;
    const db = client.db();

    // Get list of existing collections
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    for (const { collection, indexSpec, options } of INDEX_DEFINITIONS) {
      try {
        // Skip if collection doesn't exist yet
        if (!collectionNames.includes(collection)) {
          // Silently skip - collection will be created when first document is inserted
          continue;
        }

        // Get existing indexes for this collection
        const existingIndexes = await db.collection(collection).indexes();
        const indexExists = existingIndexes.some(idx => idx.name === options.name);

        if (indexExists) {
          result.existing++;
          continue;
        }

        // Create the index
        await db.collection(collection).createIndex(indexSpec, options);
        result.created++;
      } catch (error: any) {
        // Ignore duplicate key errors (index already exists with different options)
        if (error.code === 85 || error.code === 86) {
          result.existing++;
        } else {
          result.success = false;
          result.errors.push(`${collection}.${options.name}: ${error.message}`);
        }
      }
    }
  } catch (error: any) {
    result.success = false;
    result.errors.push(`Database connection error: ${error.message}`);
  }

  return result;
}
