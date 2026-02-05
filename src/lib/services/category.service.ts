/**
 * Category Business Service
 * Orchestrates category operations with validation and business logic
 */

import { getDatabaseServiceForUser, BaseCategory } from "./database";
import { Result, ok, fail } from "@/lib/core/result";
import { DatabaseError, ValidationError, NotFoundError } from "@/lib/core/errors";
import { validateCategory } from "@/lib/validation";
import { logger } from "@/lib/core/logger";

export class CategoryService {

  async getCategories(userId: string): Promise<Result<BaseCategory[], DatabaseError>> {
    logger.debug("Fetching categories", { userId });
    const db = await getDatabaseServiceForUser(userId);
    return await db.categories.findByUserId(userId);
  }

  async getCategoryById(id: string, userId: string): Promise<Result<BaseCategory, DatabaseError | NotFoundError>> {
    logger.debug("Fetching category by ID", { id, userId });
    const db = await getDatabaseServiceForUser(userId);
    const result = await db.categories.findById(id, userId);
    
    if (result.isFailure()) return result;
    if (!result.value) return fail(new NotFoundError("Category not found", "category"));
    
    return ok(result.value);
  }

  async createCategory(
    userId: string,
    categoryData: Omit<BaseCategory, "id" | "userId" | "createdAt">
  ): Promise<Result<BaseCategory, DatabaseError | ValidationError>> {
    // Validate input
    const validation = validateCategory(categoryData);

    if (!validation.isValid) {
      logger.warn("Category validation failed", { userId, errors: validation.errors });
      return fail(new ValidationError(validation.errors.join("; ")));
    }

    logger.info("Creating category", { userId, name: categoryData.name });
    const db = await getDatabaseServiceForUser(userId);
    return await db.categories.create({
      ...validation.sanitized,
      userId,
    } as any);
  }

  async updateCategory(
    id: string,
    userId: string,
    categoryData: Partial<Omit<BaseCategory, "id" | "userId" | "createdAt">>
  ): Promise<Result<BaseCategory, DatabaseError | ValidationError | NotFoundError>> {
    // Check if category exists
    const db = await getDatabaseServiceForUser(userId);
    const existingResult = await db.categories.findById(id, userId);
    if (existingResult.isFailure()) return existingResult;
    if (!existingResult.value) return fail(new NotFoundError("Category not found", "category"));

    // Validate update data
    const merged = { ...existingResult.value, ...categoryData };
    const validation = validateCategory(merged);

    if (!validation.isValid) {
      logger.warn("Category update validation failed", { id, userId, errors: validation.errors });
      return fail(new ValidationError(validation.errors.join("; ")));
    }

    logger.info("Updating category", { id, userId });
    return await db.categories.update(id, userId, categoryData);
  }

  async deleteCategory(id: string, userId: string): Promise<Result<void, DatabaseError | NotFoundError>> {
    // Check if category exists
    const db = await getDatabaseServiceForUser(userId);
    const existingResult = await db.categories.findById(id, userId);
    if (existingResult.isFailure()) return existingResult;
    if (!existingResult.value) return fail(new NotFoundError("Category not found", "category"));

    logger.info("Deleting category", { id, userId });
    return await db.categories.delete(id, userId);
  }
}

export const categoryService = new CategoryService();
