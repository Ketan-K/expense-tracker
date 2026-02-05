/**
 * Loan Business Service
 * Orchestrates loan operations with validation and business logic
 */

import { getDatabaseServiceForUser, BaseLoan } from "./database";
import { Result, ok, fail } from "@/lib/core/result";
import { DatabaseError, ValidationError, NotFoundError } from "@/lib/core/errors";
import { validateLoan } from "@/lib/validation";
import { logger } from "@/lib/core/logger";

export class LoanService {
  async getLoans(userId: string): Promise<Result<BaseLoan[], DatabaseError>> {
    logger.debug("Fetching loans", { userId });
    const db = await getDatabaseServiceForUser(userId);
    return await db.loans.findByUserId(userId);
  }

  async getLoanById(id: string, userId: string): Promise<Result<BaseLoan, DatabaseError | NotFoundError>> {
    logger.debug("Fetching loan by ID", { id, userId });
    const db = await getDatabaseServiceForUser(userId);
    const result = await db.loans.findById(id, userId);
    
    if (result.isFailure()) return result;
    if (!result.value) return fail(new NotFoundError("Loan not found", "loan"));
    
    return ok(result.value);
  }

  async getLoansByStatus(
    userId: string,
    status: "active" | "paid" | "overdue"
  ): Promise<Result<BaseLoan[], DatabaseError>> {
    logger.debug("Fetching loans by status", { userId, status });
    const db = await getDatabaseServiceForUser(userId);
    return await db.loans.findByStatus(userId, status);
  }

  async createLoan(
    userId: string,
    loanData: Omit<BaseLoan, "id" | "userId" | "createdAt" | "updatedAt">
  ): Promise<Result<BaseLoan, DatabaseError | ValidationError>> {
    // Validate input
    const validation = validateLoan(loanData);
    if (!validation.isValid) {
      logger.warn("Loan validation failed", { userId, errors: validation.errors });
      return fail(new ValidationError(validation.errors.join("; ")));
    }

    logger.info("Creating loan", { userId, contactName: loanData.contactName, amount: loanData.principalAmount });
    const db = await getDatabaseServiceForUser(userId);
    return await db.loans.create({
      ...validation.sanitized,
      userId,
    });
  }

  async updateLoan(
    id: string,
    userId: string,
    loanData: Partial<Omit<BaseLoan, "id" | "userId" | "createdAt" | "updatedAt">>
  ): Promise<Result<BaseLoan, DatabaseError | ValidationError | NotFoundError>> {
    // Check if loan exists
    const db = await getDatabaseServiceForUser(userId);
    const existingResult = await db.loans.findById(id, userId);
    if (existingResult.isFailure()) return existingResult;
    if (!existingResult.value) return fail(new NotFoundError("Loan not found", "loan"));

    // Validate update data
    const merged = { ...existingResult.value, ...loanData };
    const validation = validateLoan(merged);
    if (!validation.isValid) {
      logger.warn("Loan update validation failed", { id, userId, errors: validation.errors });
      return fail(new ValidationError(validation.errors.join("; ")));
    }

    logger.info("Updating loan", { id, userId });
    return await db.loans.update(id, userId, loanData);
  }

  async deleteLoan(id: string, userId: string): Promise<Result<void, DatabaseError | NotFoundError>> {
    logger.info("Deleting loan", { id, userId });
    const db = await getDatabaseServiceForUser(userId);
    
    // Check if exists first
    const existingResult = await db.loans.findById(id, userId);
    if (existingResult.isFailure()) return existingResult;
    if (!existingResult.value) return fail(new NotFoundError("Loan not found", "loan"));

    return await db.loans.delete(id, userId);
  }
}

export const loanService = new LoanService();
