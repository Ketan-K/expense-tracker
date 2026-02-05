/**
 * Supabase Loan Repository Implementation
 */

import { ILoanRepository, BaseLoan } from "../../interface";
import { Result, ok, fail } from "@/lib/core/result";
import { DatabaseError } from "@/lib/core/errors";
import { getSupabaseClient, handleSupabaseError } from "../client";

export class SupabaseLoanRepository implements ILoanRepository {
  private client = getSupabaseClient();
  private table = "loans";

  async findByUserId(userId: string): Promise<Result<BaseLoan[], DatabaseError>> {
    try {
      const { data, error } = await this.client
        .from(this.table)
        .select("*")
        .eq("userId", userId)
        .order("startDate", { ascending: false });

      if (error) {
        return fail(new DatabaseError("Failed to fetch loans", handleSupabaseError(error, "findByUserId")));
      }

      return ok(data as BaseLoan[]);
    } catch (error) {
      return fail(new DatabaseError("Unexpected error fetching loans", error));
    }
  }

  async findById(id: string, userId: string): Promise<Result<BaseLoan | null, DatabaseError>> {
    try {
      const { data, error } = await this.client
        .from(this.table)
        .select("*")
        .eq("id", id)
        .eq("userId", userId)
        .single();

      if (error) {
        if (error.code === "PGRST116") return ok(null);
        return fail(new DatabaseError("Failed to fetch loan", handleSupabaseError(error, "findById")));
      }

      return ok(data as BaseLoan);
    } catch (error) {
      return fail(new DatabaseError("Unexpected error fetching loan", error));
    }
  }

  async findByStatus(userId: string, status: "active" | "paid" | "overdue"): Promise<Result<BaseLoan[], DatabaseError>> {
    try {
      const { data, error } = await this.client
        .from(this.table)
        .select("*")
        .eq("userId", userId)
        .eq("status", status)
        .order("startDate", { ascending: false });

      if (error) {
        return fail(new DatabaseError("Failed to fetch loans by status", handleSupabaseError(error, "findByStatus")));
      }

      return ok(data as BaseLoan[]);
    } catch (error) {
      return fail(new DatabaseError("Unexpected error fetching loans by status", error));
    }
  }

  async create(loan: Omit<BaseLoan, "id" | "createdAt" | "updatedAt">): Promise<Result<BaseLoan, DatabaseError>> {
    try {
      const now = new Date();
      const { data, error } = await this.client
        .from(this.table)
        .insert({
          ...loan,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        })
        .select()
        .single();

      if (error) {
        return fail(new DatabaseError("Failed to create loan", handleSupabaseError(error, "create")));
      }

      return ok(data as BaseLoan);
    } catch (error) {
      return fail(new DatabaseError("Unexpected error creating loan", error));
    }
  }

  async update(id: string, userId: string, loan: Partial<BaseLoan>): Promise<Result<BaseLoan, DatabaseError>> {
    try {
      const { data, error } = await this.client
        .from(this.table)
        .update({
          ...loan,
          updatedAt: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("userId", userId)
        .select()
        .single();

      if (error) {
        return fail(new DatabaseError("Failed to update loan", handleSupabaseError(error, "update")));
      }

      return ok(data as BaseLoan);
    } catch (error) {
      return fail(new DatabaseError("Unexpected error updating loan", error));
    }
  }

  async delete(id: string, userId: string): Promise<Result<void, DatabaseError>> {
    try {
      const { error } = await this.client
        .from(this.table)
        .delete()
        .eq("id", id)
        .eq("userId", userId);

      if (error) {
        return fail(new DatabaseError("Failed to delete loan", handleSupabaseError(error, "delete")));
      }

      return ok(undefined);
    } catch (error) {
      return fail(new DatabaseError("Unexpected error deleting loan", error));
    }
  }
}
