/**
 * MongoDB Loan Payment Repository Implementation
 */

import { ObjectId } from "mongodb";
import { ILoanPaymentRepository, BaseLoanPayment } from "../../interface";
import { Result, ok, fail } from "@/lib/core/result";
import { DatabaseError } from "@/lib/core/errors";
import { getMongoClient, handleMongoError } from "../client";

export class MongoDBLoanPaymentRepository implements ILoanPaymentRepository {
  private async getCollection() {
    const client = await getMongoClient();
    return client.db().collection("loanPayments");
  }

  async findByLoanId(loanId: string, userId: string): Promise<Result<BaseLoanPayment[], DatabaseError>> {
    try {
      const collection = await this.getCollection();
      const payments = await collection
        .find({ loanId, userId })
        .sort({ date: -1 })
        .toArray();

      const result: BaseLoanPayment[] = payments.map(payment => ({
        id: payment._id.toString(),
        loanId: payment.loanId,
        userId: payment.userId,
        amount: payment.amount,
        date: payment.date,
        paymentMethod: payment.paymentMethod,
        notes: payment.notes,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
      }));

      return ok(result);
    } catch (error) {
      return fail(new DatabaseError("Failed to fetch loan payments", handleMongoError(error, "findByLoanId")));
    }
  }

  async findById(id: string, userId: string): Promise<Result<BaseLoanPayment | null, DatabaseError>> {
    try {
      const collection = await this.getCollection();
      const payment = await collection.findOne({
        _id: new ObjectId(id),
        userId,
      });

      if (!payment) {
        return ok(null);
      }

      const result: BaseLoanPayment = {
        id: payment._id.toString(),
        loanId: payment.loanId,
        userId: payment.userId,
        amount: payment.amount,
        date: payment.date,
        paymentMethod: payment.paymentMethod,
        notes: payment.notes,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
      };

      return ok(result);
    } catch (error) {
      return fail(new DatabaseError("Failed to fetch loan payment", handleMongoError(error, "findById")));
    }
  }

  async create(payment: Omit<BaseLoanPayment, "id" | "createdAt" | "updatedAt">): Promise<Result<BaseLoanPayment, DatabaseError>> {
    try {
      const collection = await this.getCollection();
      const now = new Date();

      const document = {
        ...payment,
        createdAt: now,
        updatedAt: now,
      };

      const result = await collection.insertOne(document);

      const created: BaseLoanPayment = {
        id: result.insertedId.toString(),
        ...payment,
        createdAt: now,
        updatedAt: now,
      };

      return ok(created);
    } catch (error) {
      return fail(new DatabaseError("Failed to create loan payment", handleMongoError(error, "create")));
    }
  }

  async update(id: string, userId: string, payment: Partial<BaseLoanPayment>): Promise<Result<BaseLoanPayment, DatabaseError>> {
    try {
      const collection = await this.getCollection();
      const now = new Date();

      const { id: _, createdAt, ...updateData } = payment;

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
        return fail(new DatabaseError("Loan payment not found or unauthorized"));
      }

      const updated: BaseLoanPayment = {
        id: result._id.toString(),
        loanId: result.loanId,
        userId: result.userId,
        amount: result.amount,
        date: result.date,
        paymentMethod: result.paymentMethod,
        notes: result.notes,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      };

      return ok(updated);
    } catch (error) {
      return fail(new DatabaseError("Failed to update loan payment", handleMongoError(error, "update")));
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
        return fail(new DatabaseError("Loan payment not found or unauthorized"));
      }

      return ok(undefined);
    } catch (error) {
      return fail(new DatabaseError("Failed to delete loan payment", handleMongoError(error, "delete")));
    }
  }
}
