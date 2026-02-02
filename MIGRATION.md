# Production Migration Guide

## Setup (One-time)

1. **Add Admin Secret to Vercel**
   - Go to your Vercel project → Settings → Environment Variables
   - Add: `ADMIN_SECRET` = `your-random-secure-string` (e.g., `mig-prod-2026-xyz123`)
   - Redeploy your app

## Running Migrations in Production

### Option 1: Admin Panel (Easiest)

1. Visit: `https://your-app.vercel.app/admin`
2. Enter your `ADMIN_SECRET`
3. Click "Dry Run" to preview changes
4. Click "Run Migration" to execute
5. Click "Create Indexes" to optimize database

### Option 2: cURL Commands

**Check migration status (dry run):**
```bash
curl "https://your-app.vercel.app/api/admin/migrate?secret=YOUR_SECRET&dry-run=true"
```

**Run migration:**
```bash
curl "https://your-app.vercel.app/api/admin/migrate?secret=YOUR_SECRET"
```

**Create indexes:**
```bash
curl "https://your-app.vercel.app/api/admin/create-indexes?secret=YOUR_SECRET"
```

### Option 3: Browser Direct Access

Simply visit these URLs in your browser:
- Dry run: `https://your-app.vercel.app/api/admin/migrate?secret=YOUR_SECRET&dry-run=true`
- Migrate: `https://your-app.vercel.app/api/admin/migrate?secret=YOUR_SECRET`
- Indexes: `https://your-app.vercel.app/api/admin/create-indexes?secret=YOUR_SECRET`

## What Each Migration Does

### `/api/admin/migrate`
- Finds all expenses without `type` field
- Adds `type: "expense"` to them
- Updates `updatedAt` timestamp
- Shows stats: how many updated, type distribution
- **Safe to run multiple times** (idempotent)

### `/api/admin/create-indexes`
- Creates optimized indexes on all collections
- Collections: expenses, incomes, loans, loanPayments, contacts, budgets, categories, users
- Improves query performance 10-100x
- **Safe to run multiple times** (MongoDB handles duplicates)

## Expected Output

### Migration Success:
```json
{
  "success": true,
  "message": "Migration completed successfully!",
  "stats": {
    "expensesUpdated": 1523,
    "expensesWithoutTypeRemaining": 0,
    "totalExpenses": 1523,
    "typeDistribution": [
      { "type": "expense", "count": 1523 }
    ]
  }
}
```

### Already Migrated:
```json
{
  "success": true,
  "message": "Migration already complete - no expenses need updating",
  "stats": {
    "expensesUpdated": 0,
    "totalExpenses": 1523
  }
}
```

## Security

- Endpoints protected by `ADMIN_SECRET` from environment variables
- Returns 401 if secret doesn't match
- Secret passed via header `x-admin-secret` or query param `?secret=`
- **Keep your secret secure!** Don't commit it to git

## Troubleshooting

**Error: "ADMIN_SECRET not configured"**
- Add the environment variable to Vercel
- Redeploy your app

**Error: "Unauthorized"**
- Check you're using the correct secret
- Ensure no extra spaces or encoding issues

**Migration shows 0 updates**
- Migration already complete (safe, idempotent)
- Or no expenses exist in database yet

## Rollback

**If migration fails halfway:**
- Re-run the migration endpoint (it's idempotent)
- Only updates documents without `type` field
- Already migrated documents are skipped

**To remove type field (not recommended):**
```javascript
// Only if absolutely necessary - run in MongoDB shell
db.expenses.updateMany(
  { type: "expense" },
  { $unset: { type: "" } }
)
```

## Production Checklist

- [ ] Add `ADMIN_SECRET` to Vercel environment variables
- [ ] Deploy updated code
- [ ] Visit `/admin` page
- [ ] Run dry-run migration to preview
- [ ] Run actual migration
- [ ] Create database indexes
- [ ] Verify: All expenses have `type` field
- [ ] Test: Create new income/loan/contact
- [ ] Monitor: Check app logs for errors
