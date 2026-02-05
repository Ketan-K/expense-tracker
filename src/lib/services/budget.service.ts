/**
 * Budget Business Service
 * Orchestrates budget operations with validation and business logic
 */

import { getDatabaseServiceForUser, BaseBudget } from './database';
import { Result, ok, fail } from '@/lib/core/result';
import { DatabaseError, ValidationError, NotFoundError } from '@/lib/core/errors';
import { validateBudget } from '@/lib/validation';
import { logger } from '@/lib/core/logger';

export class BudgetService {

  async getBudgets(userId: string): Promise<Result<BaseBudget[], DatabaseError>> {
    logger.debug('Fetching budgets', { userId });
    const db = await getDatabaseServiceForUser(userId);
    return await db.budgets.findByUserId(userId);
  }

  async getBudgetById(id: string, userId: string): Promise<Result<BaseBudget, DatabaseError | NotFoundError>> {
    logger.debug('Fetching budget by ID', { id, userId });
    const db = await getDatabaseServiceForUser(userId);
    const result = await db.budgets.findById(id, userId);
    
    if (result.isFailure()) return result;
    if (!result.value) return fail(new NotFoundError('Budget not found', 'budget'));
    
    return ok(result.value);
  }

  async getBudgetsByMonth(userId: string, month: string): Promise<Result<BaseBudget[], DatabaseError>> {
    logger.debug('Fetching budgets by month', { userId, month });
    const db = await getDatabaseServiceForUser(userId);
    return await db.budgets.findByMonth(userId, month);
  }

  async createBudget(
    userId: string,
    budgetData: Omit<BaseBudget, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<Result<BaseBudget, DatabaseError | ValidationError>> {
    // Validate input
    const validation = validateBudget(budgetData);

    if (!validation.isValid) {
      logger.warn('Budget validation failed', { userId, errors: validation.errors });
      return fail(new ValidationError(validation.errors.join('; ')));
    }

    logger.info('Creating budget', { userId, month: budgetData.month });
    const db = await getDatabaseServiceForUser(userId);
    return await db.budgets.create({
      ...validation.sanitized,
      userId,
    } as any);
  }

  async updateBudget(
    id: string,
    userId: string,
    budgetData: Partial<Omit<BaseBudget, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<Result<BaseBudget, DatabaseError | ValidationError | NotFoundError>> {
    // Check if budget exists
    const db = await getDatabaseServiceForUser(userId);
    const existingResult = await db.budgets.findById(id, userId);
    if (existingResult.isFailure()) return existingResult;
    if (!existingResult.value) return fail(new NotFoundError('Budget not found', 'budget'));

    // Validate update data
    const merged = { ...existingResult.value, ...budgetData };
    const validation = validateBudget(merged);

    if (!validation.isValid) {
      logger.warn('Budget update validation failed', { id, userId, errors: validation.errors });
      return fail(new ValidationError(validation.errors.join('; ')));
    }

    logger.info('Updating budget', { id, userId });
    return await db.budgets.update(id, userId, budgetData);
  }

  async deleteBudget(id: string, userId: string): Promise<Result<void, DatabaseError | NotFoundError>> {
    // Check if budget exists
    const db = await getDatabaseServiceForUser(userId);
    const existingResult = await db.budgets.findById(id, userId);
    if (existingResult.isFailure()) return existingResult;
    if (!existingResult.value) return fail(new NotFoundError('Budget not found', 'budget'));

    logger.info('Deleting budget', { id, userId });
    return await db.budgets.delete(id, userId);
  }
}

export const budgetService = new BudgetService();
