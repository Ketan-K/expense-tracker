/**
 * MongoDB Budget Repository Implementation
 */

import { ObjectId } from "mongodb";
import { IBudgetRepository, BaseBudget } from "../../interface";
import { Result, ok, fail } from "@/lib/core/result";
import { DatabaseError } from "@/lib/core/errors";
import { getMongoClient, handleMongoError } from "../client";

export class MongoDBBudgetRepository implements IBudgetRepository {
  private async getCollection() {
    const client = await getMongoClient();
    return client.db().collection("budgets");
  }

  async findByUserId(userId: string): Promise<Result<BaseBudget[], DatabaseError>> {
    try {
      const collection = await this.getCollection();
      const budgets = await collection
        .find({ userId })
        .sort({ month: -1 })
        .toArray();

      const result: BaseBudget[] = budgets.map(budget => ({
        id: budget._id.toString(),
        userId: budget.userId,
        categoryId: budget.categoryId,
        month: budget.month,
        amount: budget.amount,
        createdAt: budget.createdAt,
        updatedAt: budget.updatedAt,
      }));

      return ok(result);
    } catch (error) {
      return fail(new DatabaseError("Failed to fetch budgets", handleMongoError(error, "findByUserId")));
    }
  }

  async findById(id: string, userId: string): Promise<Result<BaseBudget | null, DatabaseError>> {
    try {
      const collection = await this.getCollection();
      const budget = await collection.findOne({
        _id: new ObjectId(id),
        userId,
      });

      if (!budget) {
        return ok(null);
      }

      const result: BaseBudget = {
        id: budget._id.toString(),
        userId: budget.userId,
        categoryId: budget.categoryId,
        month: budget.month,
        amount: budget.amount,
        createdAt: budget.createdAt,
        updatedAt: budget.updatedAt,
      };

      return ok(result);
    } catch (error) {
      return fail(new DatabaseError("Failed to fetch budget", handleMongoError(error, "findById")));
    }
  }

  async findByMonth(userId: string, month: string): Promise<Result<BaseBudget[], DatabaseError>> {
    try {
      const collection = await this.getCollection();
      const budgets = await collection
        .find({ userId, month })
        .toArray();

      const result: BaseBudget[] = budgets.map(budget => ({
        id: budget._id.toString(),
        userId: budget.userId,
        categoryId: budget.categoryId,
        month: budget.month,
        amount: budget.amount,
        createdAt: budget.createdAt,
        updatedAt: budget.updatedAt,
      }));

      return ok(result);
    } catch (error) {
      return fail(new DatabaseError("Failed to fetch budgets by month", handleMongoError(error, "findByMonth")));
    }
  }

  async create(budget: Omit<BaseBudget, "id" | "createdAt" | "updatedAt">): Promise<Result<BaseBudget, DatabaseError>> {
    try {
      const collection = await this.getCollection();
      const now = new Date();

      const document = {
        ...budget,
        createdAt: now,
        updatedAt: now,
      };

      const result = await collection.insertOne(document);

      const created: BaseBudget = {
        id: result.insertedId.toString(),
        ...budget,
        createdAt: now,
        updatedAt: now,
      };

      return ok(created);
    } catch (error) {
      return fail(new DatabaseError("Failed to create budget", handleMongoError(error, "create")));
    }
  }

  async update(id: string, userId: string, budget: Partial<BaseBudget>): Promise<Result<BaseBudget, DatabaseError>> {
    try {
      const collection = await this.getCollection();
      const now = new Date();

      const { id: _, createdAt, ...updateData } = budget;

      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(id), userId },
        { 
          $set: { 
            ...updateData,
            updatedAt: now 
          } 
        },
        { returnDocument: "after" }
      );

      if (!result) {
        return fail(new DatabaseError("Budget not found or unauthorized"));
      }

      const updated: BaseBudget = {
        id: result._id.toString(),
        userId: result.userId,
        categoryId: result.categoryId,
        month: result.month,
        amount: result.amount,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      };

      return ok(updated);
    } catch (error) {
      return fail(new DatabaseError("Failed to update budget", handleMongoError(error, "update")));
    }
  }

  async delete(id: string, userId: string): Promise<Result<void, DatabaseError>> {
    try {
      const collection = await this.getCollection();
      const result = await collection.deleteOne({
        _id: new ObjectId(id),
        userId,
      });

      if (result.deletedCount === 0) {
        return fail(new DatabaseError("Budget not found or unauthorized"));
      }

      return ok(undefined);
    } catch (error) {
      return fail(new DatabaseError("Failed to delete budget", handleMongoError(error, "delete")));
    }
  }
}
