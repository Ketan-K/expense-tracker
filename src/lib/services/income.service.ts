/**
 * Income Business Service
 * Orchestrates income operations with validation and business logic
 */

import { getDatabaseServiceForUser, BaseIncome } from "./database";
import { Result, ok, fail } from "@/lib/core/result";
import { DatabaseError, ValidationError, NotFoundError } from "@/lib/core/errors";
import { validateIncome } from "@/lib/validation";
import { logger } from "@/lib/core/logger";

export class IncomeService {
  async getIncomes(userId: string, limit?: number, offset?: number): Promise<Result<BaseIncome[], DatabaseError>> {
    logger.debug("Fetching incomes", { userId, limit, offset });
    const db = await getDatabaseServiceForUser(userId);
    return await db.incomes.findByUserId(userId, limit, offset);
  }

  async getIncomeById(id: string, userId: string): Promise<Result<BaseIncome, DatabaseError | NotFoundError>> {
    logger.debug("Fetching income by ID", { id, userId });
    const db = await getDatabaseServiceForUser(userId);
    const result = await db.incomes.findById(id, userId);
    
    if (result.isFailure()) return result;
    if (!result.value) return fail(new NotFoundError("Income not found", "income"));
    
    return ok(result.value);
  }

  async getIncomesByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Result<BaseIncome[], DatabaseError>> {
    logger.debug("Fetching incomes by date range", { userId, startDate, endDate });
    const db = await getDatabaseServiceForUser(userId);
    return await db.incomes.findByDateRange(userId, startDate, endDate);
  }

  async createIncome(
    userId: string,
    incomeData: Omit<BaseIncome, "id" | "userId" | "createdAt" | "updatedAt">
  ): Promise<Result<BaseIncome, DatabaseError | ValidationError>> {
    // Validate input
    const validation = validateIncome(incomeData);
    if (!validation.isValid) {
      logger.warn("Income validation failed", { userId, errors: validation.errors });
      return fail(new ValidationError(validation.errors.join("; ")));
    }

    logger.info("Creating income", { userId, amount: incomeData.amount });
    const db = await getDatabaseServiceForUser(userId);
    return await db.incomes.create({
      ...validation.sanitized,
      userId,
    });
  }

  async updateIncome(
    id: string,
    userId: string,
    incomeData: Partial<Omit<BaseIncome, "id" | "userId" | "createdAt" | "updatedAt">>
  ): Promise<Result<BaseIncome, DatabaseError | ValidationError | NotFoundError>> {
    // Check if income exists
    const db = await getDatabaseServiceForUser(userId);
    const existingResult = await db.incomes.findById(id, userId);
    if (existingResult.isFailure()) return existingResult;
    if (!existingResult.value) return fail(new NotFoundError("Income not found", "income"));

    // Validate update data
    const merged = { ...existingResult.value, ...incomeData };
    const validation = validateIncome(merged);
    if (!validation.isValid) {
      logger.warn("Income update validation failed", { id, userId, errors: validation.errors });
      return fail(new ValidationError(validation.errors.join("; ")));
    }

    logger.info("Updating income", { id, userId });
    return await db.incomes.update(id, userId, incomeData);
  }

  async deleteIncome(id: string, userId: string): Promise<Result<void, DatabaseError | NotFoundError>> {
    logger.info("Deleting income", { id, userId });
    const db = await getDatabaseServiceForUser(userId);
    
    // Check if exists first
    const existingResult = await db.incomes.findById(id, userId);
    if (existingResult.isFailure()) return existingResult;
    if (!existingResult.value) return fail(new NotFoundError("Income not found", "income"));

    return await db.incomes.delete(id, userId);
  }
}

export const incomeService = new IncomeService();
