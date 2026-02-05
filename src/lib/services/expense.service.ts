/**
 * Expense Business Service
 * Orchestrates expense operations with validation and business logic
 */

import { getDatabaseServiceForUser, BaseExpense } from './database';
import { Result, ok, fail } from '@/lib/core/result';
import { DatabaseError, ValidationError, NotFoundError } from '@/lib/core/errors';
import { validateExpense } from '@/lib/validation';
import { logger } from '@/lib/core/logger';

export class ExpenseService {
  async getExpenses(userId: string, limit?: number, offset?: number): Promise<Result<BaseExpense[], DatabaseError>> {
    logger.debug('Fetching expenses', { userId, limit, offset });
    const db = await getDatabaseServiceForUser(userId);
    return await db.expenses.findByUserId(userId, limit, offset);
  }

  async getExpenseById(id: string, userId: string): Promise<Result<BaseExpense, DatabaseError | NotFoundError>> {
    logger.debug('Fetching expense by ID', { id, userId });
    const db = await getDatabaseServiceForUser(userId);
    const result = await db.expenses.findById(id, userId);
    
    if (result.isFailure()) return result;
    if (!result.value) return fail(new NotFoundError('Expense not found', 'expense'));
    
    return ok(result.value);
  }

  async getExpensesByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Result<BaseExpense[], DatabaseError>> {
    logger.debug('Fetching expenses by date range', { userId, startDate, endDate });
    const db = await getDatabaseServiceForUser(userId);
    return await db.expenses.findByDateRange(userId, startDate, endDate);
  }

  async createExpense(
    userId: string,
    expenseData: Omit<BaseExpense, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<Result<BaseExpense, DatabaseError | ValidationError>> {
    // Validate input
    const validation = validateExpense(expenseData);

    if (!validation.isValid) {
      logger.warn('Expense validation failed', { userId, errors: validation.errors });
      return fail(new ValidationError(validation.errors.join('; ')));
    }

    logger.info('Creating expense', { userId, amount: expenseData.amount });
    const db = await getDatabaseServiceForUser(userId);
    return await db.expenses.create({
      ...validation.sanitized,
      userId,
    } as any);
  }

  async updateExpense(
    id: string,
    userId: string,
    expenseData: Partial<Omit<BaseExpense, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<Result<BaseExpense, DatabaseError | ValidationError | NotFoundError>> {
    // Check if expense exists
    const db = await getDatabaseServiceForUser(userId);
    const existingResult = await db.expenses.findById(id, userId);
    if (existingResult.isFailure()) return existingResult;
    if (!existingResult.value) return fail(new NotFoundError('Expense not found', 'expense'));

    // Validate update data
    const merged = { ...existingResult.value, ...expenseData };
    const validation = validateExpense(merged);

    if (!validation.isValid) {
      logger.warn('Expense update validation failed', { id, userId, errors: validation.errors });
      return fail(new ValidationError(validation.errors.join('; ')));
    }

    logger.info('Updating expense', { id, userId });
    return await db.expenses.update(id, userId, expenseData);
  }

  async deleteExpense(id: string, userId: string): Promise<Result<void, DatabaseError | NotFoundError>> {
    // Check if expense exists
    const db = await getDatabaseServiceForUser(userId);
    const existingResult = await db.expenses.findById(id, userId);
    if (existingResult.isFailure()) return existingResult;
    if (!existingResult.value) return fail(new NotFoundError('Expense not found', 'expense'));

    logger.info('Deleting expense', { id, userId });
    return await db.expenses.delete(id, userId);
  }
}

export const expenseService = new ExpenseService();
