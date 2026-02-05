/**
 * Supabase Category Repository Implementation
 */

import { ICategoryRepository, BaseCategory } from "../../interface";
import { Result, ok, fail } from "@/lib/core/result";
import { DatabaseError } from "@/lib/core/errors";
import { getSupabaseClient, handleSupabaseError } from "../client";

export class SupabaseCategoryRepository implements ICategoryRepository {
  private client = getSupabaseClient();
  private table = "categories";

  async findByUserId(userId: string): Promise<Result<BaseCategory[], DatabaseError>> {
    try {
      const { data, error } = await this.client
        .from(this.table)
        .select("*")
        .eq("userId", userId)
        .order("name", { ascending: true });

      if (error) {
        return fail(new DatabaseError("Failed to fetch categories", handleSupabaseError(error, "findByUserId")));
      }

      return ok(data as BaseCategory[]);
    } catch (error) {
      return fail(new DatabaseError("Unexpected error fetching categories", error));
    }
  }

  async findById(id: string, userId: string): Promise<Result<BaseCategory | null, DatabaseError>> {
    try {
      const { data, error } = await this.client
        .from(this.table)
        .select("*")
        .eq("id", id)
        .eq("userId", userId)
        .single();

      if (error) {
        if (error.code === "PGRST116") return ok(null);
        return fail(new DatabaseError("Failed to fetch category", handleSupabaseError(error, "findById")));
      }

      return ok(data as BaseCategory);
    } catch (error) {
      return fail(new DatabaseError("Unexpected error fetching category", error));
    }
  }

  async create(category: Omit<BaseCategory, "id" | "createdAt">): Promise<Result<BaseCategory, DatabaseError>> {
    try {
      const { data, error } = await this.client
        .from(this.table)
        .insert({
          ...category,
          createdAt: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        return fail(new DatabaseError("Failed to create category", handleSupabaseError(error, "create")));
      }

      return ok(data as BaseCategory);
    } catch (error) {
      return fail(new DatabaseError("Unexpected error creating category", error));
    }
  }

  async update(id: string, userId: string, category: Partial<BaseCategory>): Promise<Result<BaseCategory, DatabaseError>> {
    try {
      const { data, error } = await this.client
        .from(this.table)
        .update(category)
        .eq("id", id)
        .eq("userId", userId)
        .select()
        .single();

      if (error) {
        return fail(new DatabaseError("Failed to update category", handleSupabaseError(error, "update")));
      }

      return ok(data as BaseCategory);
    } catch (error) {
      return fail(new DatabaseError("Unexpected error updating category", error));
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
        return fail(new DatabaseError("Failed to delete category", handleSupabaseError(error, "delete")));
      }

      return ok(undefined);
    } catch (error) {
      return fail(new DatabaseError("Unexpected error deleting category", error));
    }
  }
}
