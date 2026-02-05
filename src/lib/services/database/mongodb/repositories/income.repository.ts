/**
 * MongoDB Income Repository Implementation
 */

import { ObjectId } from "mongodb";
import { IIncomeRepository, BaseIncome } from "../../interface";
import { Result, ok, fail } from "@/lib/core/result";
import { DatabaseError } from "@/lib/core/errors";
import { getMongoClient, handleMongoError } from "../client";

export class MongoDBIncomeRepository implements IIncomeRepository {
  private async getCollection() {
    const client = await getMongoClient();
    return client.db().collection("incomes");
  }

  async findByUserId(userId: string, limit?: number, offset?: number): Promise<Result<BaseIncome[], DatabaseError>> {
    try {
      const collection = await this.getCollection();
      
      let query = collection
        .find({ userId })
        .sort({ date: -1 });

      if (limit) query = query.limit(limit);
      if (offset) query = query.skip(offset);

      const incomes = await query.toArray();

      const result: BaseIncome[] = incomes.map(inc => ({
        id: inc._id.toString(),
        userId: inc.userId,
        date: inc.date,
        amount: inc.amount,
        source: inc.source,
        category: inc.category,
        description: inc.description,
        taxable: inc.taxable,
        recurring: inc.recurring,
        createdAt: inc.createdAt,
        updatedAt: inc.updatedAt,
      }));

      return ok(result);
    } catch (error) {
      return fail(new DatabaseError("Failed to fetch incomes", handleMongoError(error, "findByUserId")));
    }
  }

  async findById(id: string, userId: string): Promise<Result<BaseIncome | null, DatabaseError>> {
    try {
      const collection = await this.getCollection();
      const income = await collection.findOne({
        _id: new ObjectId(id),
        userId,
      });

      if (!income) {
        return ok(null);
      }

      const result: BaseIncome = {
        id: income._id.toString(),
        userId: income.userId,
        date: income.date,
        amount: income.amount,
        source: income.source,
        category: income.category,
        description: income.description,
        taxable: income.taxable,
        recurring: income.recurring,
        createdAt: income.createdAt,
        updatedAt: income.updatedAt,
      };

      return ok(result);
    } catch (error) {
      return fail(new DatabaseError("Failed to fetch income", handleMongoError(error, "findById")));
    }
  }

  async findByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Result<BaseIncome[], DatabaseError>> {
    try {
      const collection = await this.getCollection();
      const incomes = await collection
        .find({
          userId,
          date: {
            $gte: startDate,
            $lte: endDate,
          },
        })
        .sort({ date: -1 })
        .toArray();

      const result: BaseIncome[] = incomes.map(inc => ({
        id: inc._id.toString(),
        userId: inc.userId,
        date: inc.date,
        amount: inc.amount,
        source: inc.source,
        category: inc.category,
        description: inc.description,
        taxable: inc.taxable,
        recurring: inc.recurring,
        createdAt: inc.createdAt,
        updatedAt: inc.updatedAt,
      }));

      return ok(result);
    } catch (error) {
      return fail(new DatabaseError("Failed to fetch incomes by date range", handleMongoError(error, "findByDateRange")));
    }
  }

  async create(income: Omit<BaseIncome, "id" | "createdAt" | "updatedAt">): Promise<Result<BaseIncome, DatabaseError>> {
    try {
      const collection = await this.getCollection();
      const now = new Date();

      const document = {
        ...income,
        createdAt: now,
        updatedAt: now,
      };

      const result = await collection.insertOne(document);

      const created: BaseIncome = {
        id: result.insertedId.toString(),
        ...income,
        createdAt: now,
        updatedAt: now,
      };

      return ok(created);
    } catch (error) {
      return fail(new DatabaseError("Failed to create income", handleMongoError(error, "create")));
    }
  }

  async update(id: string, userId: string, income: Partial<BaseIncome>): Promise<Result<BaseIncome, DatabaseError>> {
    try {
      const collection = await this.getCollection();
      const now = new Date();

      const { id: _, createdAt, ...updateData } = income;

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
        return fail(new DatabaseError("Income not found or unauthorized"));
      }

      const updated: BaseIncome = {
        id: result._id.toString(),
        userId: result.userId,
        date: result.date,
        amount: result.amount,
        source: result.source,
        category: result.category,
        description: result.description,
        taxable: result.taxable,
        recurring: result.recurring,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      };

      return ok(updated);
    } catch (error) {
      return fail(new DatabaseError("Failed to update income", handleMongoError(error, "update")));
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
        return fail(new DatabaseError("Income not found or unauthorized"));
      }

      return ok(undefined);
    } catch (error) {
      return fail(new DatabaseError("Failed to delete income", handleMongoError(error, "delete")));
    }
  }
}
