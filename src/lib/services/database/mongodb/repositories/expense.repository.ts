/**
 * MongoDB Expense Repository Implementation
 */

import { ObjectId } from "mongodb";
import { IExpenseRepository, BaseExpense } from "../../interface";
import { Result, ok, fail } from "@/lib/core/result";
import { DatabaseError } from "@/lib/core/errors";
import { getMongoClient, handleMongoError } from "../client";

export class MongoDBExpenseRepository implements IExpenseRepository {
  private async getCollection() {
    const client = await getMongoClient();
    return client.db().collection("expenses");
  }

  async findByUserId(userId: string, limit?: number, offset?: number): Promise<Result<BaseExpense[], DatabaseError>> {
    try {
      const collection = await this.getCollection();
      
      let query = collection
        .find({ userId })
        .sort({ date: -1 });

      if (limit) query = query.limit(limit);
      if (offset) query = query.skip(offset);

      const expenses = await query.toArray();

      // Convert MongoDB documents to BaseExpense
      const result: BaseExpense[] = expenses.map(exp => ({
        id: exp._id.toString(),
        userId: exp.userId,
        date: exp.date,
        amount: exp.amount,
        category: exp.category,
        description: exp.description,
        paymentMethod: exp.paymentMethod,
        type: exp.type,
        createdAt: exp.createdAt,
        updatedAt: exp.updatedAt,
      }));

      return ok(result);
    } catch (error) {
      return fail(new DatabaseError("Failed to fetch expenses", handleMongoError(error, "findByUserId")));
    }
  }

  async findById(id: string, userId: string): Promise<Result<BaseExpense | null, DatabaseError>> {
    try {
      const collection = await this.getCollection();
      const expense = await collection.findOne({
        _id: new ObjectId(id),
        userId,
      });

      if (!expense) {
        return ok(null);
      }

      const result: BaseExpense = {
        id: expense._id.toString(),
        userId: expense.userId,
        date: expense.date,
        amount: expense.amount,
        category: expense.category,
        description: expense.description,
        paymentMethod: expense.paymentMethod,
        type: expense.type,
        createdAt: expense.createdAt,
        updatedAt: expense.updatedAt,
      };

      return ok(result);
    } catch (error) {
      return fail(new DatabaseError("Failed to fetch expense", handleMongoError(error, "findById")));
    }
  }

  async findByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Result<BaseExpense[], DatabaseError>> {
    try {
      const collection = await this.getCollection();
      const expenses = await collection
        .find({
          userId,
          date: {
            $gte: startDate,
            $lte: endDate,
          },
        })
        .sort({ date: -1 })
        .toArray();

      const result: BaseExpense[] = expenses.map(exp => ({
        id: exp._id.toString(),
        userId: exp.userId,
        date: exp.date,
        amount: exp.amount,
        category: exp.category,
        description: exp.description,
        paymentMethod: exp.paymentMethod,
        type: exp.type,
        createdAt: exp.createdAt,
        updatedAt: exp.updatedAt,
      }));

      return ok(result);
    } catch (error) {
      return fail(new DatabaseError("Failed to fetch expenses by date range", handleMongoError(error, "findByDateRange")));
    }
  }

  async create(expense: Omit<BaseExpense, "id" | "createdAt" | "updatedAt">): Promise<Result<BaseExpense, DatabaseError>> {
    try {
      const collection = await this.getCollection();
      const now = new Date();
      
      const doc = {
        userId: expense.userId,
        date: expense.date,
        amount: expense.amount,
        category: expense.category,
        description: expense.description,
        paymentMethod: expense.paymentMethod,
        type: expense.type,
        createdAt: now,
        updatedAt: now,
      };

      const result = await collection.insertOne(doc);

      const created: BaseExpense = {
        id: result.insertedId.toString(),
        ...doc,
      };

      return ok(created);
    } catch (error) {
      return fail(new DatabaseError("Failed to create expense", handleMongoError(error, "create")));
    }
  }

  async update(id: string, userId: string, expense: Partial<BaseExpense>): Promise<Result<BaseExpense, DatabaseError>> {
    try {
      const collection = await this.getCollection();
      
      // Remove id from update data
      const { id: _, ...updateData } = expense as any;
      
      const result = await collection.findOneAndUpdate(
        {
          _id: new ObjectId(id),
          userId,
        },
        {
          $set: {
            ...updateData,
            updatedAt: new Date(),
          },
        },
        {
          returnDocument: "after",
        }
      );

      if (!result) {
        return fail(new DatabaseError("Expense not found or not updated"));
      }

      const updated: BaseExpense = {
        id: result._id.toString(),
        userId: result.userId,
        date: result.date,
        amount: result.amount,
        category: result.category,
        description: result.description,
        paymentMethod: result.paymentMethod,
        type: result.type,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      };

      return ok(updated);
    } catch (error) {
      return fail(new DatabaseError("Failed to update expense", handleMongoError(error, "update")));
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
        return fail(new DatabaseError("Expense not found or not deleted"));
      }

      return ok(undefined);
    } catch (error) {
      return fail(new DatabaseError("Failed to delete expense", handleMongoError(error, "delete")));
    }
  }
}
