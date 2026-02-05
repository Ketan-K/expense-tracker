/**
 * MongoDB Category Repository Implementation
 */

import { ObjectId } from "mongodb";
import { ICategoryRepository, BaseCategory } from "../../interface";
import { Result, ok, fail } from "@/lib/core/result";
import { DatabaseError } from "@/lib/core/errors";
import { getMongoClient, handleMongoError } from "../client";

export class MongoDBCategoryRepository implements ICategoryRepository {
  private async getCollection() {
    const client = await getMongoClient();
    return client.db().collection("categories");
  }

  async findByUserId(userId: string): Promise<Result<BaseCategory[], DatabaseError>> {
    try {
      const collection = await this.getCollection();
      const categories = await collection
        .find({ userId })
        .sort({ name: 1 })
        .toArray();

      const result: BaseCategory[] = categories.map(cat => ({
        id: cat._id.toString(),
        userId: cat.userId,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        isDefault: cat.isDefault,
        createdAt: cat.createdAt,
      }));

      return ok(result);
    } catch (error) {
      return fail(new DatabaseError("Failed to fetch categories", handleMongoError(error, "findByUserId")));
    }
  }

  async findById(id: string, userId: string): Promise<Result<BaseCategory | null, DatabaseError>> {
    try {
      const collection = await this.getCollection();
      const category = await collection.findOne({
        _id: new ObjectId(id),
        userId,
      });

      if (!category) {
        return ok(null);
      }

      const result: BaseCategory = {
        id: category._id.toString(),
        userId: category.userId,
        name: category.name,
        icon: category.icon,
        color: category.color,
        isDefault: category.isDefault,
        createdAt: category.createdAt,
      };

      return ok(result);
    } catch (error) {
      return fail(new DatabaseError("Failed to fetch category", handleMongoError(error, "findById")));
    }
  }

  async create(category: Omit<BaseCategory, "id" | "createdAt">): Promise<Result<BaseCategory, DatabaseError>> {
    try {
      const collection = await this.getCollection();
      const doc = {
        userId: category.userId,
        name: category.name,
        icon: category.icon,
        color: category.color,
        isDefault: category.isDefault,
        createdAt: new Date(),
      };

      const result = await collection.insertOne(doc);

      const created: BaseCategory = {
        id: result.insertedId.toString(),
        ...doc,
      };

      return ok(created);
    } catch (error) {
      return fail(new DatabaseError("Failed to create category", handleMongoError(error, "create")));
    }
  }

  async update(id: string, userId: string, category: Partial<BaseCategory>): Promise<Result<BaseCategory, DatabaseError>> {
    try {
      const collection = await this.getCollection();
      
      // Remove id from update data
      const { id: _, ...updateData } = category as any;
      
      const result = await collection.findOneAndUpdate(
        {
          _id: new ObjectId(id),
          userId,
        },
        {
          $set: updateData,
        },
        {
          returnDocument: "after",
        }
      );

      if (!result) {
        return fail(new DatabaseError("Category not found or not updated"));
      }

      const updated: BaseCategory = {
        id: result._id.toString(),
        userId: result.userId,
        name: result.name,
        icon: result.icon,
        color: result.color,
        isDefault: result.isDefault,
        createdAt: result.createdAt,
      };

      return ok(updated);
    } catch (error) {
      return fail(new DatabaseError("Failed to update category", handleMongoError(error, "update")));
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
        return fail(new DatabaseError("Category not found or not deleted"));
      }

      return ok(undefined);
    } catch (error) {
      return fail(new DatabaseError("Failed to delete category", handleMongoError(error, "delete")));
    }
  }
}
