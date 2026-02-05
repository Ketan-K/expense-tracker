# Supabase Migration Guide

## Overview

This document provides instructions for completing the migration from MongoDB to Supabase with a service layer architecture.

## Architecture

The new architecture follows industry-standard patterns with clear separation of concerns:

```
┌─────────────────────────────────────────┐
│         API Routes (Next.js)            │
│  - Authentication                       │
│  - Rate Limiting                        │
│  - Request/Response handling            │
└───────────────┬─────────────────────────┘
                │
┌───────────────▼─────────────────────────┐
│       Business Services Layer           │
│  - Validation                           │
│  - Business Logic                       │
│  - Error Handling (Result<T, E>)        │
└───────────────┬─────────────────────────┘
                │
┌───────────────▼─────────────────────────┐
│      Database Service Layer             │
│  - Repository Pattern                   │
│  - Database Abstraction                 │
│  - User Scoping                         │
└───────────────┬─────────────────────────┘
                │
┌───────────────▼─────────────────────────┐
│         Supabase Client                 │
│  - Connection Management                │
│  - Query Execution                      │
│  - RLS Policies                         │
└─────────────────────────────────────────┘
```

## Prerequisites

1. **Supabase Project Setup**
   - Create a Supabase project at https://supabase.com
   - Get your project URL and service role key
   - Get your publishable key

2. **Environment Variables**
   Update your `.env.local` file:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   
   # Keep MongoDB temporarily for migration
   MONGODB_URI=your-mongodb-uri
   
   # Auth (existing)
   NEXTAUTH_URL=https://your-app-url.com
   NEXTAUTH_SECRET=your-secret
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ADMIN_EMAILS=admin@example.com
   
   # Logging
   LOG_LEVEL=INFO
   ```

## Migration Steps

### Step 1: Run Supabase Schema Migration

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of `supabase/migrations/001_initial_schema.sql`
4. Run the SQL migration
5. Verify all tables were created successfully

### Step 2: Install Dependencies

```powershell
npm install @supabase/supabase-js
npm install dotenv --save-dev  # for migration script
```

### Step 3: Run Data Migration

```powershell
# Compile and run the migration script
npx tsx scripts/migrate-to-supabase.ts
```

The script will:
- Connect to MongoDB
- Create Supabase auth users for all MongoDB users (by email)
- Store MongoDB ID → Supabase UUID mappings
- Migrate all data (categories, expenses, incomes, budgets, contacts, loans, payments)
- Preserve data integrity through email-based user matching

### Step 4: Refactor API Routes

Refactor each API route following this pattern:

#### Before (MongoDB):
```typescript
const client = await getConnectedClient();
const db = client.db();
const expenses = await db.collection<Expense>("expenses")
  .find({ userId: session.user.id })
  .toArray();
```

#### After (Service Layer):
```typescript
import { expenseService } from "@/lib/services";
import { handleServiceResult } from "@/lib/middleware/error-handler";

const result = await expenseService.getExpenses(session.user.id);
const response = handleServiceResult(result);
```

**Routes to refactor:**
- [ ] `/api/expenses/route.ts`
- [ ] `/api/expenses/[id]/route.ts`
- [ ] `/api/incomes/route.ts`
- [ ] `/api/incomes/[id]/route.ts`
- [ ] `/api/categories/route.ts`
- [ ] `/api/categories/[id]/route.ts`
- [ ] `/api/budgets/route.ts`
- [ ] `/api/budgets/[id]/route.ts`
- [ ] `/api/contacts/route.ts`
- [ ] `/api/contacts/[id]/route.ts`
- [ ] `/api/loans/route.ts`
- [ ] `/api/loans/[id]/route.ts`
- [ ] `/api/loan-payments/route.ts`
- [ ] `/api/loan-payments/[id]/route.ts`
- [ ] `/api/sync/route.ts`
- [ ] `/api/export/*/route.ts`
- [ ] `/api/finance-tip/route.ts`

See `src/app/api/expenses/route.new.ts` for a complete example.

### Step 5: Update Authentication

Update `src/auth.ts` to use Supabase for session management while keeping NextAuth for OAuth:

```typescript
import { getAuthService } from "@/lib/services/auth";

// Use getAuthService() instead of direct MongoDB adapter
```

### Step 6: Update Types

1. Update `src/lib/types.ts`:
   - Change `ObjectId` to `string` for all IDs
   - Remove MongoDB imports
   - Use the new `BaseExpense`, `BaseIncome`, etc. types from `@/lib/services/database`

2. Update Dexie types in `src/lib/db.ts`:
   - Keep local types as-is
   - They already use string IDs

### Step 7: Update Sync Service (Optional)

If you want to abstract the sync logic:

1. Create `src/lib/services/sync/interface.ts`
2. Implement `src/lib/services/sync/supabase-sync.service.ts`
3. Update `src/lib/syncUtils.ts` to use the new service

### Step 8: Remove MongoDB Code

Once everything is working:

1. Delete MongoDB files:
   ```
   src/lib/mongodb.ts
   ```

2. Remove MongoDB dependencies:
   ```powershell
   npm uninstall mongodb
   ```

3. Remove MongoDB environment variable:
   - Remove `MONGODB_URI` from `.env.local`

4. Clean up imports:
   - Search for `mongodb` imports across the codebase
   - Remove `getConnectedClient` imports
   - Remove `ObjectId` imports

## Key Files

### Core Infrastructure
- `src/lib/core/errors.ts` - Custom error classes
- `src/lib/core/result.ts` - Result type for error handling
- `src/lib/core/logger.ts` - Structured logging
- `src/lib/core/config.ts` - Configuration management

### Services
- `src/lib/services/auth/` - Authentication service
- `src/lib/services/database/` - Database service layer
- `src/lib/services/*.service.ts` - Business services
- `src/lib/middleware/error-handler.ts` - Error handling middleware

### Database
- `src/lib/services/database/interface.ts` - Repository interfaces
- `src/lib/services/database/supabase/` - Supabase implementation
- `supabase/migrations/001_initial_schema.sql` - Database schema

### Migration
- `scripts/migrate-to-supabase.ts` - Data migration script

## Benefits of New Architecture

1. **Maintainability**: Clear separation between API, business logic, and data access
2. **Flexibility**: Easy to switch database providers in the future
3. **Testability**: Services can be mocked for testing
4. **Type Safety**: Full TypeScript support with proper error handling
5. **Error Handling**: Explicit error handling with Result type instead of try-catch everywhere
6. **Security**: RLS policies at database level + application-level user scoping
7. **Logging**: Centralized structured logging
8. **Validation**: Consistent validation layer

## Troubleshooting

### Migration Issues

**Users without emails:**
- The migration script skips users without emails
- These users won't be migrated to Supabase
- Review MongoDB users collection before migration

**Duplicate emails:**
- Supabase enforces unique emails
- The script will fail if duplicate emails exist
- Clean up duplicates in MongoDB first

**Large datasets:**
- The migration uses batching for expenses/incomes
- Adjust `BATCH_SIZE` if needed
- Monitor Supabase rate limits

### Runtime Issues

**"Missing required environment variable":**
- Check all env vars are set in `.env.local`
- Restart dev server after changing env vars

**RLS Policy errors:**
- Ensure user is authenticated
- Check `auth.uid()` matches `user_id` in policies
- Use service role key for admin operations

**Type errors with ObjectId:**
- Update type imports to use `BaseExpense` etc.
- Change all `ObjectId` to `string`
- Update validation functions

## Testing the Migration

1. **Before migration:**
   ```powershell
   # Export MongoDB data as backup
   mongodump --uri="$env:MONGODB_URI" --out=./backup
   ```

2. **After migration:**
   - Test user login
   - Verify data appears correctly
   - Test CRUD operations
   - Check data integrity
   - Test offline sync
   - Verify budget calculations

3. **Rollback plan:**
   - Keep MongoDB running for 2-4 weeks
   - Keep backup of MongoDB export
   - Can restore from backup if needed

## Next Steps

1. Complete all service implementations (income, contact, loan services)
2. Refactor all API routes to use services
3. Update auth.ts to use Supabase Auth
4. Test thoroughly in development
5. Run migration in production during maintenance window
6. Monitor for issues
7. Remove MongoDB after verification period

## Support

For issues or questions:
1. Check Supabase logs in dashboard
2. Check application logs (structured JSON)
3. Review this guide
4. Check Supabase documentation: https://supabase.com/docs
