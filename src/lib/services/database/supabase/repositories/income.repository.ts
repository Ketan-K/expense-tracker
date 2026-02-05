/**
 * Supabase Income Repository Implementation
 */

import { IIncomeRepository, BaseIncome } from "../../interface";
import { Result, ok, fail } from "@/lib/core/result";
import { DatabaseError } from "@/lib/core/errors";
import { getSupabaseClient, handleSupabaseError } from "../client";

export class SupabaseIncomeRepository implements IIncomeRepository {
  private client = getSupabaseClient();
  private table = "incomes";

  async findByUserId(userId: string, limit?: number, offset?: number): Promise<Result<BaseIncome[], DatabaseError>> {
    try {
      let query = this.client
        .from(this.table)
        .select("*")
        .eq("userId", userId)
        .order("date", { ascending: false });

      if (limit) query = query.limit(limit);
      if (offset) query = query.range(offset, offset + (limit || 100) - 1);

      const { data, error } = await query;

      if (error) {
        return fail(new DatabaseError("Failed to fetch incomes", handleSupabaseError(error, "findByUserId")));
      }

      return ok(data as BaseIncome[]);
    } catch (error) {
      return fail(new DatabaseError("Unexpected error fetching incomes", error));
    }
  }

  async findById(id: string, userId: string): Promise<Result<BaseIncome | null, DatabaseError>> {
    try {
      const { data, error } = await this.client
        .from(this.table)
        .select("*")
        .eq("id", id)
        .eq("userId", userId)
        .single();

      if (error) {
        if (error.code === "PGRST116") return ok(null);
        return fail(new DatabaseError("Failed to fetch income", handleSupabaseError(error, "findById")));
      }

      return ok(data as BaseIncome);
    } catch (error) {
      return fail(new DatabaseError("Unexpected error fetching income", error));
    }
  }

  async findByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Result<BaseIncome[], DatabaseError>> {
    try {
      const { data, error } = await this.client
        .from(this.table)
        .select("*")
        .eq("userId", userId)
        .gte("date", startDate.toISOString())
        .lte("date", endDate.toISOString())
        .order("date", { ascending: false });

      if (error) {
        return fail(new DatabaseError("Failed to fetch incomes by date range", handleSupabaseError(error, "findByDateRange")));
      }

      return ok(data as BaseIncome[]);
    } catch (error) {
      return fail(new DatabaseError("Unexpected error fetching incomes by date range", error));
    }
  }

  async create(income: Omit<BaseIncome, "id" | "createdAt" | "updatedAt">): Promise<Result<BaseIncome, DatabaseError>> {
    try {
      const now = new Date();
      const { data, error } = await this.client
        .from(this.table)
        .insert({
          ...income,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        })
        .select()
        .single();

      if (error) {
        return fail(new DatabaseError("Failed to create income", handleSupabaseError(error, "create")));
      }

      return ok(data as BaseIncome);
    } catch (error) {
      return fail(new DatabaseError("Unexpected error creating income", error));
    }
  }

  async update(id: string, userId: string, income: Partial<BaseIncome>): Promise<Result<BaseIncome, DatabaseError>> {
    try {
      const { data, error } = await this.client
        .from(this.table)
        .update({
          ...income,
          updatedAt: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("userId", userId)
        .select()
        .single();

      if (error) {
        return fail(new DatabaseError("Failed to update income", handleSupabaseError(error, "update")));
      }

      return ok(data as BaseIncome);
    } catch (error) {
      return fail(new DatabaseError("Unexpected error updating income", error));
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
        return fail(new DatabaseError("Failed to delete income", handleSupabaseError(error, "delete")));
      }

      return ok(undefined);
    } catch (error) {
      return fail(new DatabaseError("Unexpected error deleting income", error));
    }
  }
}
