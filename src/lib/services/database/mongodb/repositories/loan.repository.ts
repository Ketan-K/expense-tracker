/**
 * MongoDB Loan Repository Implementation
 */

import { ObjectId } from "mongodb";
import { ILoanRepository, BaseLoan } from "../../interface";
import { Result, ok, fail } from "@/lib/core/result";
import { DatabaseError } from "@/lib/core/errors";
import { getMongoClient, handleMongoError } from "../client";

export class MongoDBLoanRepository implements ILoanRepository {
  private async getCollection() {
    const client = await getMongoClient();
    return client.db().collection("loans");
  }

  async findByUserId(userId: string): Promise<Result<BaseLoan[], DatabaseError>> {
    try {
      const collection = await this.getCollection();
      const loans = await collection
        .find({ userId })
        .sort({ createdAt: -1 })
        .toArray();

      const result: BaseLoan[] = loans.map(loan => ({
        id: loan._id.toString(),
        userId: loan.userId,
        contactId: loan.contactId,
        contactName: loan.contactName,
        direction: loan.direction,
        principalAmount: loan.principalAmount,
        outstandingAmount: loan.outstandingAmount,
        interestRate: loan.interestRate,
        startDate: loan.startDate,
        dueDate: loan.dueDate,
        status: loan.status,
        description: loan.description,
        createdAt: loan.createdAt,
        updatedAt: loan.updatedAt,
      }));

      return ok(result);
    } catch (error) {
      return fail(new DatabaseError("Failed to fetch loans", handleMongoError(error, "findByUserId")));
    }
  }

  async findById(id: string, userId: string): Promise<Result<BaseLoan | null, DatabaseError>> {
    try {
      const collection = await this.getCollection();
      const loan = await collection.findOne({
        _id: new ObjectId(id),
        userId,
      });

      if (!loan) {
        return ok(null);
      }

      const result: BaseLoan = {
        id: loan._id.toString(),
        userId: loan.userId,
        contactId: loan.contactId,
        contactName: loan.contactName,
        direction: loan.direction,
        principalAmount: loan.principalAmount,
        outstandingAmount: loan.outstandingAmount,
        interestRate: loan.interestRate,
        startDate: loan.startDate,
        dueDate: loan.dueDate,
        status: loan.status,
        description: loan.description,
        createdAt: loan.createdAt,
        updatedAt: loan.updatedAt,
      };

      return ok(result);
    } catch (error) {
      return fail(new DatabaseError("Failed to fetch loan", handleMongoError(error, "findById")));
    }
  }

  async findByStatus(userId: string, status: "active" | "paid" | "overdue"): Promise<Result<BaseLoan[], DatabaseError>> {
    try {
      const collection = await this.getCollection();
      const loans = await collection
        .find({ userId, status })
        .sort({ createdAt: -1 })
        .toArray();

      const result: BaseLoan[] = loans.map(loan => ({
        id: loan._id.toString(),
        userId: loan.userId,
        contactId: loan.contactId,
        contactName: loan.contactName,
        direction: loan.direction,
        principalAmount: loan.principalAmount,
        outstandingAmount: loan.outstandingAmount,
        interestRate: loan.interestRate,
        startDate: loan.startDate,
        dueDate: loan.dueDate,
        status: loan.status,
        description: loan.description,
        createdAt: loan.createdAt,
        updatedAt: loan.updatedAt,
      }));

      return ok(result);
    } catch (error) {
      return fail(new DatabaseError("Failed to fetch loans by status", handleMongoError(error, "findByStatus")));
    }
  }

  async create(loan: Omit<BaseLoan, "id" | "createdAt" | "updatedAt">): Promise<Result<BaseLoan, DatabaseError>> {
    try {
      const collection = await this.getCollection();
      const now = new Date();

      const document = {
        ...loan,
        createdAt: now,
        updatedAt: now,
      };

      const result = await collection.insertOne(document);

      const created: BaseLoan = {
        id: result.insertedId.toString(),
        ...loan,
        createdAt: now,
        updatedAt: now,
      };

      return ok(created);
    } catch (error) {
      return fail(new DatabaseError("Failed to create loan", handleMongoError(error, "create")));
    }
  }

  async update(id: string, userId: string, loan: Partial<BaseLoan>): Promise<Result<BaseLoan, DatabaseError>> {
    try {
      const collection = await this.getCollection();
      const now = new Date();

      const { id: _, createdAt, ...updateData } = loan;

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
        return fail(new DatabaseError("Loan not found or unauthorized"));
      }

      const updated: BaseLoan = {
        id: result._id.toString(),
        userId: result.userId,
        contactId: result.contactId,
        contactName: result.contactName,
        direction: result.direction,
        principalAmount: result.principalAmount,
        outstandingAmount: result.outstandingAmount,
        interestRate: result.interestRate,
        startDate: result.startDate,
        dueDate: result.dueDate,
        status: result.status,
        description: result.description,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      };

      return ok(updated);
    } catch (error) {
      return fail(new DatabaseError("Failed to update loan", handleMongoError(error, "update")));
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
        return fail(new DatabaseError("Loan not found or unauthorized"));
      }

      return ok(undefined);
    } catch (error) {
      return fail(new DatabaseError("Failed to delete loan", handleMongoError(error, "delete")));
    }
  }
}
