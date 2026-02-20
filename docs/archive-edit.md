# Archive & Edit Functionality

## Overview

**Date:** February 20, 2026  
**Status:** Production Ready

The expense tracker now includes comprehensive edit and archive functionality for all financial entities (Budgets, Loans, Income, and Expenses) with soft-delete pattern and automated cleanup.

---

## ✨ Features

### 1. **Soft-Delete Pattern**

- **Archive Instead of Delete** - Items are marked as archived instead of permanently deleted
- **30-Day Retention** - Archived items are automatically deleted after 30 days
- **Restore Capability** - Archived items can be restored before permanent deletion
- **Data Safety** - Prevents accidental data loss

### 2. **Edit Actions**

- **In-Place Editing** - Edit any budget, loan, or income entry
- **Offline Support** - Edits work offline and sync when online
- **Validation** - Form validation ensures data integrity
- **Category Management** - Update categories, amounts, dates, and descriptions

### 3. **Archive Views**

- **Toggle Between Active/Archived** - Switch views with a single button
- **Visual Indicators** - Clear differentiation between active and archived items
- **Search & Filter** - Archived items maintain all filtering capabilities
- **Bulk Management** - Easy access to all archived items

### 4. **Automated Cleanup**

- **Vercel Cron Job** - Daily execution at 2 AM UTC
- **30-Day Policy** - Items archived for 30+ days are permanently deleted
- **Performance Optimization** - Keeps database size manageable
- **Zero Maintenance** - Fully automated, no manual intervention needed

---

## 📋 Implementation Details

### Database Schema Changes

**IndexedDB v5** - Updated schema with archive fields:

```typescript
interface BaseEntity {
  isArchived?: boolean; // Archive flag
  archivedAt?: Date; // Archive timestamp
  updatedAt?: Date; // Last update time
  // ... other fields
}
```

**Compound Indexes** for efficient filtering:

- `[userId+isArchived]` on all entity stores
- Optimized queries for active/archived views

### API Routes Updated

All entity APIs now support archive operations:

#### Archive Endpoint (DELETE)

```typescript
DELETE / api / { entity } / { id };
// Sets isArchived: true, archivedAt: Date
```

#### Restore Endpoint (PATCH)

```typescript
PATCH /api/{entity}/{id}?action=restore
// Removes isArchived and archivedAt fields
```

#### List Endpoint (GET)

```typescript
GET /api/{entity}?includeArchived=true
// Returns archived items when flag is set
```

### Sync Queue Actions

Extended sync queue with new actions:

- `ARCHIVE` - Archive an entity
- `RESTORE` - Restore an archived entity
- Works offline with background sync

### Cron Job Configuration

**File:** `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-archived",
      "schedule": "0 2 * * *"
    }
  ]
}
```

**Schedule:** Daily at 2:00 AM UTC  
**Endpoint:** `/api/cron/cleanup-archived/route.ts`  
**Authentication:** Vercel Cron Secret header validation

---

## 🎯 User Interface

### Budget Management

**Location:** Dashboard (`/dashboard`)

- **Edit Button** - Pencil icon on hover
- **Archive Button** - Archive icon on hover
- **View Toggle** - "View Archived" / "View Active" button
- **Confirmation** - Warning dialog before archiving

### Loan Management

**Locations:**

- Loan List (`/dashboard/loans`)
- Loan Detail (`/dashboard/loans/{id}`)

- **Edit Button** - Opens EditLoanModal with pre-filled data
- **Archive Button** - Archives loan and associated payments
- **Archive Toggle** - Switch between active and archived loans
- **Navigation** - Redirects to list after archiving from detail page

### Income Tracking

**Location:** Income Page (`/dashboard/income`)

- **Hover Actions** - Edit and archive buttons appear on hover
- **Monthly Filtering** - Archives work with month selector
- **Quick Edit** - Modal opens with current values
- **Archive Confirmation** - Warning before archiving

### Expense Tracking

**Location:** Expenses Page (`/dashboard/expenses`)

- **TransactionsList Integration** - Archive via existing delete button
- **Archive Toggle** - View active or archived expenses
- **Month Selector** - Filter archived items by month
- **Edit Modal** - Full edit capability with category selection

---

## 🔧 Component Structure

### Edit Modals

- `EditBudgetModal.tsx` - Budget editing
- `EditLoanModal.tsx` - Loan editing (reuses LoanForm)
- `EditIncomeModal.tsx` - Income editing (reuses IncomeForm)
- `EditExpenseModal.tsx` - Expense editing (existing)

### Confirmation Dialog

**File:** `ConfirmDialog.tsx`

```typescript
interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "danger" | "warning";
  onConfirm: () => void;
  onClose: () => void;
}
```

### useConfirm Hook

**File:** `hooks/useConfirm.ts`

Simplifies confirmation dialog management:

```typescript
const { confirm, isOpen, options, handleConfirm, handleCancel } = useConfirm();

const handleDelete = async () => {
  const confirmed = await confirm({
    title: "Archive Item?",
    message: "This will be archived...",
    variant: "warning",
  });

  if (confirmed) {
    // Perform archive
  }
};
```

---

## 🚀 Usage

### Editing an Item

1. **Navigate** to the item (budget card, loan, income, or expense)
2. **Hover** over the item to reveal action buttons
3. **Click Edit** (pencil icon)
4. **Modify** fields in the modal
5. **Save** changes (syncs offline if needed)

### Archiving an Item

1. **Hover** over the item
2. **Click Archive** (archive icon)
3. **Confirm** in the warning dialog
4. Item is **hidden** from active view
5. Access via **"View Archived"** toggle

### Restoring an Archived Item

1. **Click** "View Archived" toggle
2. **Find** the archived item
3. **Click Restore** button (if implemented in UI)
4. Item **returns** to active view

> Note: Restore functionality uses the same PATCH endpoint with `?action=restore` query parameter

### Viewing Archived Items

1. **Navigate** to any list page (budgets, loans, income, expenses)
2. **Click** "View Archived" button
3. **Browse** archived items with all filters
4. **Toggle back** to "View Active" anytime

---

## 🔐 Security & Authorization

### API Protection

- **Authentication Required** - All endpoints check user session
- **Ownership Validation** - Users can only archive their own data
- **Rate Limiting** - Prevents abuse of archive/restore endpoints

### Cron Job Security

- **Vercel Secret Validation** -
  ```typescript
  headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
  ```
- **Environment Variable** - `CRON_SECRET` auto-generated by Vercel
- **No Public Access** - Endpoint only accessible via Vercel Cron

---

## 📊 Database Cleanup

### Cleanup Logic

**File:** `src/app/api/cron/cleanup-archived/route.ts`

```typescript
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

// Delete archived items older than 30 days
await db.collection("expenses").deleteMany({
  isArchived: true,
  archivedAt: { $lt: thirtyDaysAgo },
});
```

### Cleanup Schedule

- **Frequency:** Daily
- **Time:** 2:00 AM UTC
- **Entities:** Expenses, Incomes, Loans, Budgets
- **Associated Data:** Loan payments also cleaned up

### Monitoring

- **Vercel Dashboard** - View cron execution logs
- **Manual Trigger** - Test endpoint at `/api/cron/cleanup-archived`
- **Response Format:**
  ```json
  {
    "success": true,
    "deletedCounts": {
      "expenses": 5,
      "incomes": 2,
      "loans": 1,
      "budgets": 3
    },
    "timestamp": "2026-02-20T02:00:00.000Z"
  }
  ```

---

## 🧪 Testing

### Manual Testing Checklist

#### Edit Functionality

- [ ] Edit a budget - verify changes persist
- [ ] Edit a loan - verify payments remain intact
- [ ] Edit an income - verify date/amount updates
- [ ] Edit an expense - verify category updates
- [ ] Edit while offline - verify sync when online

#### Archive Functionality

- [ ] Archive a budget - verify it disappears from active view
- [ ] Archive a loan - verify payments are also archived
- [ ] Archive an income - verify stats update
- [ ] Archive an expense - verify total spent updates
- [ ] Toggle to archived view - verify item appears

#### View Toggle

- [ ] Click "View Archived" - verify archived items show
- [ ] Click "View Active" - verify only active items show
- [ ] Filter archived items by month
- [ ] Search within archived items

#### Offline Support

- [ ] Go offline
- [ ] Archive an item
- [ ] Edit an item
- [ ] Return online
- [ ] Verify sync queue processes
- [ ] Check MongoDB for updates

#### Cron Job

- [ ] Manually trigger `/api/cron/cleanup-archived`
- [ ] Verify response shows deleted counts
- [ ] Check Vercel dashboard for scheduled runs
- [ ] Verify 30-day threshold is respected

### Automated Tests

```typescript
// Example test for archive endpoint
describe("Archive API", () => {
  it("should archive an expense", async () => {
    const response = await fetch("/api/expenses/123", {
      method: "DELETE",
    });
    expect(response.status).toBe(200);

    const expense = await db.expenses.get("123");
    expect(expense.isArchived).toBe(true);
    expect(expense.archivedAt).toBeDefined();
  });
});
```

---

## 🚨 Troubleshooting

### Archive Button Not Appearing

**Issue:** Action buttons don't show on hover  
**Solution:**

- Check that item is not already archived
- Verify CSS classes include `group` on parent and `group-hover:opacity-100`
- Ensure item has `_id` property

### Archived Items Not Showing

**Issue:** "View Archived" shows no items  
**Solution:**

- Verify IndexedDB has `isArchived: true` items
- Check browser console for query errors
- Ensure index on `[userId+isArchived]` exists

### Edit Modal Not Opening

**Issue:** Modal doesn't appear when clicking edit  
**Solution:**

- Check state management: `const [editingItem, setEditingItem] = useState(null)`
- Verify modal component is rendered: `isOpen={!!editingItem}`
- Check browser console for component errors

### Sync Queue Not Processing

**Issue:** Offline changes don't sync  
**Solution:**

- Check `navigator.onLine` status
- Verify `processSyncQueue(userId)` is called when online
- Check browser console for sync errors
- Inspect IndexedDB `syncQueue` table for pending items

### Cron Job Not Running

**Issue:** Archived items not being deleted  
**Solution:**

- Check Vercel dashboard for cron logs
- Verify `vercel.json` is deployed
- Ensure `CRON_SECRET` environment variable exists
- Manually test endpoint: `curl https://your-app.vercel.app/api/cron/cleanup-archived -H "Authorization: Bearer <CRON_SECRET>"`

### 30-Day Calculation Issue

**Issue:** Items deleted too early/late  
**Solution:**

- Check server timezone (should use UTC)
- Verify `archivedAt` timestamp is correct
- Test calculation: `new Date(archivedAt) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)`

---

## 🔄 Migration Guide

### Upgrading from Previous Versions

If you have an existing deployment without archive functionality:

#### 1. **Database Migration**

Run this script in MongoDB shell or use the admin panel:

```javascript
// Add isArchived: false to all existing documents
db.expenses.updateMany({ isArchived: { $exists: false } }, { $set: { isArchived: false } });

db.incomes.updateMany({ isArchived: { $exists: false } }, { $set: { isArchived: false } });

db.loans.updateMany({ isArchived: { $exists: false } }, { $set: { isArchived: false } });

db.budgets.updateMany({ isArchived: { $exists: false } }, { $set: { isArchived: false } });
```

#### 2. **IndexedDB Update**

The app automatically migrates IndexedDB to v5 on first load. Migration includes:

- Adding `isArchived: false` to existing records
- Creating compound indexes for efficient filtering
- No data loss

#### 3. **Vercel Configuration**

Add `vercel.json` to repository root and redeploy:

```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-archived",
      "schedule": "0 2 * * *"
    }
  ]
}
```

#### 4. **Environment Variables**

No new environment variables needed. `CRON_SECRET` is auto-generated by Vercel.

#### 5. **Test Deployment**

After deploying:

1. Sign in and verify edit buttons appear
2. Archive a test item
3. Toggle archived view
4. Edit an item
5. Check Vercel logs for cron execution

---

## 📚 API Reference

### Archive an Entity

```http
DELETE /api/{entity}/{id}
```

**Parameters:**

- `entity`: budgets | expenses | incomes | loans
- `id`: Entity ID

**Response:**

```json
{
  "success": true,
  "message": "Budget archived successfully"
}
```

### Restore an Entity

```http
PATCH /api/{entity}/{id}?action=restore
```

**Parameters:**

- `entity`: budgets | expenses | incomes | loans
- `id`: Entity ID
- `action=restore`: Query parameter

**Response:**

```json
{
  "success": true,
  "message": "Budget restored successfully"
}
```

### List Entities (with archived)

```http
GET /api/{entity}?includeArchived=true
```

**Parameters:**

- `entity`: budgets | expenses | incomes | loans
- `includeArchived`: boolean (optional)

**Response:**

```json
{
  "success": true,
  "data": [...]
}
```

### Cleanup Archived Items (Cron)

```http
GET /api/cron/cleanup-archived
```

**Headers:**

```http
Authorization: Bearer {CRON_SECRET}
```

**Response:**

```json
{
  "success": true,
  "deletedCounts": {
    "expenses": 10,
    "incomes": 5,
    "loans": 2,
    "budgets": 3
  },
  "timestamp": "2026-02-20T02:00:00.000Z"
}
```

---

## 🎨 UI Components Reference

### Action Buttons Pattern

```tsx
<div className="relative group">
  {/* Content */}

  {!showArchived && (
    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <button onClick={handleEdit}>
        <Pencil className="w-4 h-4" />
      </button>
      <button onClick={handleArchive}>
        <Archive className="w-4 h-4" />
      </button>
    </div>
  )}
</div>
```

### Archive Toggle Button

```tsx
<button
  onClick={() => setShowArchived(!showArchived)}
  className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
>
  {showArchived ? "View Active" : "View Archived"}
</button>
```

### Confirmation Dialog Usage

```tsx
const { confirm, ...dialogProps } = useConfirm();

const handleArchive = async () => {
  const confirmed = await confirm({
    title: "Archive Item?",
    message: "This will hide the item from active view.",
    confirmText: "Archive",
    variant: "warning",
  });

  if (confirmed) {
    // Perform archive
  }
};

return <ConfirmDialog {...dialogProps} />;
```

---

## 📝 Best Practices

### When to Archive vs Delete

- **Archive:** User-created financial data (expenses, income, loans, budgets)
- **Delete:** System data like categories, metadata, or truly unwanted test data

### Archive Workflow

1. User archives item → Immediate UI update
2. Item moves to archived view
3. Sync queue processes if online
4. After 30 days → Automated cleanup

### Performance Considerations

- Use compound indexes for efficient filtering
- Limit archived view to same time filters as active view
- Leverage IndexedDB for instant client-side filtering

### User Experience

- Always confirm before archiving
- Show clear visual distinction between active/archived
- Provide easy toggle between views
- Display archive timestamp on archived items

---

## 🔮 Future Enhancements

### Potential Features

- [ ] Restore button in UI (currently API-only)
- [ ] Bulk archive operations
- [ ] Custom retention periods per entity type
- [ ] Archive history/audit log
- [ ] Export archived data before permanent deletion
- [ ] Archive statistics dashboard
- [ ] Scheduled archive reminders

### Community Contributions

Want to add a feature? Open a PR with:

1. Feature description
2. UI mockups (if applicable)
3. API changes
4. Tests
5. Documentation updates

---

## 📞 Support

### Issues

Report bugs or request features at [GitHub Issues](https://github.com/your-repo/issues)

### Questions

Check existing docs:

- [Quick Start Guide](vibe-quickstart.md)
- [Deployment Guide](vibe-deployment.md)
- [Admin Setup](admin.md)

---

**Last Updated:** February 20, 2026  
**Version:** 1.0.0  
**Maintainers:** Core Team
