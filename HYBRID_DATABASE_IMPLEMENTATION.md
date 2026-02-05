# Hybrid Multi-Database Implementation Summary

## Overview

Successfully implemented a hybrid multi-database architecture that allows the expense tracker to use both MongoDB and Supabase simultaneously, automatically distributing users between databases to exceed free tier limits.

## Architecture

```
┌─────────────────────────────────────────┐
│    Supabase Auth (All Users)           │
│    - Google OAuth                        │
│    - Email/Password                      │
│    - User Metadata                       │
└───────────────┬─────────────────────────┘
                │
┌───────────────▼─────────────────────────┐
│   Database Assignment Service           │
│   - Auto-assign to least-used DB        │
│   - Fallback logic                       │
│   - In-memory cache                      │
└───────────────┬─────────────────────────┘
                │
        ┌───────┴───────┐
        │               │
┌───────▼──────┐ ┌─────▼────────┐
│   MongoDB    │ │   Supabase   │
│   Database   │ │   Database   │
│   (User A)   │ │   (User B)   │
└──────────────┘ └──────────────┘
```

## Key Features

### 1. Single Authentication (Supabase Auth)
- All users authenticate through Supabase Auth
- Supports Google OAuth (current) + extensible to other providers
- Centralized user management
- All users get Supabase UUID as primary ID

### 2. Automatic Database Assignment
- **At Registration**: Users automatically assigned to least-used database
- **Least-Used Logic**: Counts users per database, assigns to the one with fewer users
- **Fallback**: If primary database fails, automatically uses the other
- **Immutable**: Once assigned, users stay in their database (no migration)
- **Transparent**: Users never know which database they're using

### 3. Smart Database Routing
- Each API call automatically routed to correct database based on user
- Business services call `getDatabaseServiceForUser(userId)`
- Router checks assignment and returns MongoDB or Supabase service
- Singleton database connections for optimal performance

### 4. Unified Interface
- MongoDB and Supabase repositories implement same `IRepository` interfaces
- Business logic remains identical regardless of database
- API routes unchanged - just use services
- Complete abstraction over database providers

## Implementation Details

### Database Assignment Table (Supabase)
```sql
CREATE TABLE user_database_assignments (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  database_provider TEXT CHECK IN ('mongodb', 'supabase'),
  assigned_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Assignment Service
**Location**: `src/lib/services/database/assignment.service.ts`

**Key Methods**:
- `getAssignment(userId)` - Retrieve user's database assignment (with cache)
- `assignToLeastUsed(userId)` - Assign new user to least-used DB with fallback
- `getDatabaseStats()` - Get user count per database
- `clearCache()` - Clear assignment cache (testing)

**Caching**: In-memory Map cache for assignments to avoid repeated Supabase queries

### MongoDB Repositories
**Location**: `src/lib/services/database/mongodb/repositories/`

**Implemented**:
- ✅ ExpenseRepository
- ✅ CategoryRepository
- ⏳ IncomeRepository (TODO)
- ⏳ BudgetRepository (TODO)
- ⏳ ContactRepository (TODO)
- ⏳ LoanRepository (TODO)
- ⏳ LoanPaymentRepository (TODO)

**Features**:
- Converts MongoDB ObjectId to string for API consistency
- Full CRUD operations
- User-scoped queries
- Error handling with Result<T, E>
- Maintains existing MongoDB connection logic with retry

### Database Router
**Location**: `src/lib/services/database/router.ts`

**Exports**:
```typescript
getDatabaseServiceForUser(userId: string): Promise<IDatabaseService>
getDatabaseService(provider: DatabaseProvider): IDatabaseService  // for admin
```

**Flow**:
1. Get user's assignment from assignment service
2. If no assignment → throw NotFoundError (should never happen)
3. Return MongoDB or Supabase service based on assignment
4. Cache database service instances (one MongoDB, one Supabase)

### Business Services (Updated)
**Modified**: `expense.service.ts`, `category.service.ts`, `budget.service.ts`

**Changes**:
- Removed: `private db = getDatabaseService()`
- Added: `const db = await getDatabaseServiceForUser(userId)` in each method
- All validation and business logic unchanged
- Error handling preserved

### Auth Integration
**Modified**: `src/lib/services/auth/supabase-auth.service.ts`

**createUser()** now:
1. Creates Supabase Auth user
2. Calls `assignmentService.assignToLeastUsed(userId)`
3. If assignment fails → deletes auth user and returns error
4. Logs database assignment for monitoring

**Critical**: Registration fails if both databases are unavailable

### Migration Script
**Location**: `scripts/migrate-existing-users-to-hybrid.ts`

**Process**:
1. Connects to MongoDB
2. Gets all users with emails
3. For each user:
   - Creates Supabase Auth user with same email
   - Assigns to 'mongodb' database (data stays in place)
   - Creates assignment record in Supabase
   - Rolls back if assignment fails
4. Reports success/failure counts
5. Verifies final distribution

**Safety**: Deletes auth user if assignment fails to maintain consistency

### Admin Dashboard API
**Location**: `src/app/api/admin/database-stats/route.ts`

**Returns**:
```json
{
  "userDistribution": {
    "mongodb": 125,
    "supabase": 83
  },
  "totalUsers": 208,
  "mongodb": {
    "connected": true,
    "totalUsers": 125,
    "collections": {
      "expenses": 4520,
      "categories": 450,
      ...
    },
    "error": null
  },
  "supabase": {
    "connected": true,
    "totalUsers": 83,
    "collections": {
      "expenses": 2890,
      "categories": 280,
      ...
    },
    "error": null
  },
  "timestamp": "2026-02-05T..."
}
```

**Features**:
- Real-time user distribution
- Document/row counts per collection/table
- Connection health status
- Error reporting per database
- Admin-only access (checks isAdmin)

## File Structure

```
src/lib/services/
├── database/
│   ├── assignment.service.ts       # ✅ Database assignment logic
│   ├── router.ts                   # ✅ User-based routing
│   ├── index.ts                    # ✅ Updated exports
│   ├── interface.ts                # ✅ Repository interfaces
│   ├── mongodb/
│   │   ├── client.ts               # ✅ MongoDB connection
│   │   ├── repositories/
│   │   │   ├── expense.repository.ts   # ✅ Implemented
│   │   │   └── category.repository.ts  # ✅ Implemented
│   │   └── index.ts                # ✅ MongoDB service
│   └── supabase/
│       ├── client.ts               # ✅ Supabase connection
│       ├── repositories/           # ✅ All 7 implemented
│       └── index.ts                # ✅ Supabase service
├── auth/
│   └── supabase-auth.service.ts    # ✅ Updated with assignment
├── expense.service.ts              # ✅ Updated for routing
├── category.service.ts             # ✅ Updated for routing
└── budget.service.ts               # ✅ Updated for routing

supabase/migrations/
└── 002_user_database_assignments.sql  # ✅ Assignment table schema

scripts/
└── migrate-existing-users-to-hybrid.ts  # ✅ Migration script

src/app/api/admin/
└── database-stats/route.ts         # ✅ Admin stats API
```

## Environment Variables

```env
# MongoDB
MONGODB_URI=mongodb+srv://...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Auth (existing)
NEXTAUTH_URL=...
NEXTAUTH_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
ADMIN_EMAILS=admin@example.com
```

## Migration Steps

### 1. Run Supabase Migrations
```sql
-- Execute in Supabase SQL Editor
-- Run 001_initial_schema.sql (from previous implementation)
-- Run 002_user_database_assignments.sql (new)
```

### 2. Migrate Existing Users
```powershell
npx tsx scripts/migrate-existing-users-to-hybrid.ts
```

**What happens**:
- All existing MongoDB users → Supabase Auth
- All assigned to 'mongodb' database
- Data stays in MongoDB (no data migration)
- New users will auto-balance

### 3. Update Auth Configuration
- Ensure `src/auth.ts` uses Supabase Auth
- Remove MongoDB adapter dependency
- Configure Google OAuth with Supabase

### 4. Complete Remaining MongoDB Repositories
Implement missing repositories:
- `income.repository.ts`
- `budget.repository.ts`
- `contact.repository.ts`
- `loan.repository.ts`
- `loan-payment.repository.ts`

Follow the pattern in `expense.repository.ts`

### 5. Test
- Test new user registration → check auto-assignment
- Test existing users → verify they use MongoDB
- Test CRUD operations for both user types
- Verify database stats API

## Benefits

### 1. Exceed Free Tier Limits
- MongoDB Free: 512 MB storage
- Supabase Free: 500 MB storage
- **Combined**: ~1 GB total storage
- MongoDB Free: 100 connections
- Supabase Free: Direct connections
- **Users distributed** across both

### 2. Zero Downtime Migration
- Existing users keep using MongoDB
- No data migration required
- New users automatically balanced
- Gradual transition over time

### 3. High Availability
- Fallback if one database fails during registration
- Assignment at registration only (no runtime failures)
- Can temporarily disable one database if needed

### 4. Performance
- In-memory cache for assignments (fast lookup)
- Singleton database connections (connection pooling)
- No extra queries during normal operations
- Minimal overhead

### 5. Future Flexibility
- Easy to add more databases (PostgreSQL, MySQL, etc.)
- Can implement custom assignment rules
- Can add database-specific optimizations
- Provider-agnostic business logic

## Monitoring & Management

### Admin Dashboard
**Endpoint**: `/api/admin/database-stats`

**Metrics**:
- User distribution (MongoDB vs Supabase)
- Total users
- Document/row counts per entity
- Connection health
- Error status

**UI** (TODO):
- Visual charts of distribution
- Real-time metrics
- Manual assignment override (future)
- Database health indicators

### Logging
All database assignments logged with:
- User ID
- Email
- Assigned database
- Timestamp
- Success/failure

**View logs**: Check console output or configure `LOG_LEVEL=DEBUG`

## Limitations & Considerations

### 1. Assignment Immutability
- **Users cannot be moved** between databases after assignment
- Prevents data consistency issues
- Simplifies architecture
- Trade-off: Can't rebalance existing users

### 2. Both Databases Required
- Both MongoDB and Supabase must be available
- Cannot run in single-database mode
- Both connections maintained at runtime
- Increases complexity

### 3. Feature Parity
- MongoDB and Supabase repositories must implement same interfaces
- Some database-specific features may not be available
- Lowest common denominator for features

### 4. Admin Overhead
- Need to monitor two databases
- Two backup strategies required
- Two sets of credentials to manage

## TODO / Future Enhancements

### High Priority
- [ ] Complete remaining MongoDB repositories (income, budget, contact, loan, loan-payment)
- [ ] Create admin UI for database stats dashboard
- [ ] Add database health monitoring
- [ ] Write tests for assignment service and router

### Medium Priority
- [ ] Implement sync service abstraction for offline-first
- [ ] Add metrics/analytics for database usage
- [ ] Create backup/restore documentation
- [ ] Add database migration tools (user data transfer)

### Low Priority
- [ ] Support for additional databases (PostgreSQL, etc.)
- [ ] Manual assignment override in admin panel
- [ ] Assignment history tracking
- [ ] Load balancing based on performance metrics

## Troubleshooting

### "User has no database assignment"
- User was created before assignment system was implemented
- Run migration script to assign existing users
- Check `user_database_assignments` table

### "Failed to assign user to database"
- Both databases may be unavailable
- Check MongoDB connection (MONGODB_URI)
- Check Supabase connection (SUPABASE_SERVICE_ROLE_KEY)
- Check assignment table RLS policies

### Assignment not working for new users
- Verify `supabase-auth.service.ts` was updated
- Check that migration 002 was run in Supabase
- Ensure assignment service is imported correctly

### Data not appearing for user
- Check which database user is assigned to
- Query correct database directly
- Verify user ID matches across auth and database

## Success Criteria

- ✅ Single auth system (Supabase)
- ✅ Auto-assignment to least-used database
- ✅ Transparent routing based on user
- ✅ Fallback during registration
- ✅ MongoDB repositories implemented (expense, category)
- ✅ Business services updated for routing
- ✅ Migration script for existing users
- ✅ Admin stats API
- ⏳ Complete all MongoDB repositories
- ⏳ Admin UI dashboard
- ⏳ Production deployment

---

**Status**: Core implementation complete. Ready for repository completion and testing.
**Next Step**: Implement remaining MongoDB repositories following the expense/category pattern.
