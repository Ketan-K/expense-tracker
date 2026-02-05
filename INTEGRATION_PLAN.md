# Hybrid Database Integration Plan

## Current Status

### ✅ Completed
- Core infrastructure (errors, result, logger, config)
- Auth service abstraction with Supabase
- Database service layer interfaces
- Supabase repositories (all 7 entities)
- MongoDB repositories (expense, category)
- Database assignment service
- Database router
- Business services (expense, category, budget)
- Admin panel with migration

### 🔄 In Progress
**MongoDB Repositories** - Need to complete:
- [ ] income.repository.ts
- [ ] contact.repository.ts  
- [ ] loan.repository.ts
- [ ] loan-payment.repository.ts
- [ ] budget.repository.ts (complete implementation)

### ❌ Not Started
**Business Services** - Need to create:
- [ ] income.service.ts
- [ ] contact.service.ts
- [ ] loan.service.ts
- [ ] loan-payment.service.ts

**API Routes** - Need to refactor (17 routes):
1. `/api/expenses/route.ts` (GET, POST)
2. `/api/expenses/[id]/route.ts` (GET, PUT, DELETE)
3. `/api/categories/route.ts` (GET, POST)
4. `/api/incomes/route.ts` (GET, POST)
5. `/api/incomes/[id]/route.ts` (GET, PUT, DELETE)
6. `/api/loans/route.ts` (GET, POST)
7. `/api/loans/[id]/route.ts` (GET, PUT, DELETE)
8. `/api/loan-payments/route.ts` (GET, POST)
9. `/api/loan-payments/[id]/route.ts` (DELETE)
10. `/api/contacts/route.ts` (GET, POST)
11. `/api/contacts/[id]/route.ts` (GET, PUT, DELETE)
12. `/api/budgets/route.ts` (GET, POST)
13. `/api/export/csv/route.ts`
14. `/api/export/excel/route.ts`
15. `/api/sync/route.ts`

**Auth Integration**:
- [ ] Update NextAuth to use Supabase Auth
- [ ] Test OAuth flow
- [ ] Verify session management

## Integration Steps

### Phase 1: Complete Repository Layer (Priority 1)
**Goal**: Finish all MongoDB repository implementations

1. Create `income.repository.ts` following expense pattern
2. Create `contact.repository.ts`
3. Create `loan.repository.ts`
4. Create `loan-payment.repository.ts`
5. Complete `budget.repository.ts`

**Dependencies**: None
**Estimated Time**: 2-3 hours

### Phase 2: Complete Business Service Layer (Priority 2)
**Goal**: Create business services for all entities

1. Create `income.service.ts` following expense pattern
2. Create `contact.service.ts`
3. Create `loan.service.ts`
4. Create `loan-payment.service.ts`

**Dependencies**: Phase 1
**Estimated Time**: 2-3 hours

### Phase 3: Refactor API Routes (Priority 3)
**Goal**: Update all routes to use services instead of direct DB access

**Group A - Core CRUD** (Start here):
1. `/api/incomes/**` (2 routes)
2. `/api/contacts/**` (2 routes)
3. `/api/loans/**` (2 routes)
4. `/api/loan-payments/**` (2 routes)
5. `/api/budgets/route.ts` (1 route)

**Group B - Complex Routes**:
6. `/api/expenses/**` (already have route.new.ts example)
7. `/api/categories/**`
8. `/api/export/**` (2 routes)
9. `/api/sync/route.ts`

**Dependencies**: Phase 2
**Estimated Time**: 4-5 hours

### Phase 4: Auth Integration (Priority 4)
**Goal**: Fully integrate Supabase Auth

1. Update `src/auth.ts` to use Supabase Auth service
2. Remove MongoDB adapter from NextAuth
3. Test Google OAuth flow
4. Test session management
5. Verify protected routes

**Dependencies**: Phase 3
**Estimated Time**: 2-3 hours

## Testing Checklist

After each phase:
- [ ] Test CRUD operations for affected entities
- [ ] Verify user assignment routing works
- [ ] Check both MongoDB and Supabase data access
- [ ] Test error handling
- [ ] Verify admin panel stats update

## Success Criteria

✅ All API routes use service layer
✅ No direct MongoDB client usage in routes
✅ All entities work with both databases
✅ Auth fully migrated to Supabase
✅ Migration script tested and verified
✅ Admin panel shows accurate stats

## Rollback Plan

If issues occur:
1. Old routes still exist - can revert imports
2. MongoDB connection intact - no data loss
3. Supabase separate - can disable if needed
4. Feature flag approach possible

## Next Action

**START HERE**: Complete MongoDB repositories in Phase 1
- Begin with `income.repository.ts` (most similar to expense)
- Then `contact.repository.ts`
- Then `loan.repository.ts` and `loan-payment.repository.ts`
- Finally complete `budget.repository.ts`
