/**
 * Supabase Contact Repository Implementation
 */

import { IContactRepository, BaseContact } from "../../interface";
import { Result, ok, fail } from "@/lib/core/result";
import { DatabaseError } from "@/lib/core/errors";
import { getSupabaseClient, handleSupabaseError } from "../client";

export class SupabaseContactRepository implements IContactRepository {
  private client = getSupabaseClient();
  private table = "contacts";

  async findByUserId(userId: string): Promise<Result<BaseContact[], DatabaseError>> {
    try {
      const { data, error } = await this.client
        .from(this.table)
        .select("*")
        .eq("userId", userId)
        .order("name", { ascending: true });

      if (error) {
        return fail(new DatabaseError("Failed to fetch contacts", handleSupabaseError(error, "findByUserId")));
      }

      return ok(data as BaseContact[]);
    } catch (error) {
      return fail(new DatabaseError("Unexpected error fetching contacts", error));
    }
  }

  async findById(id: string, userId: string): Promise<Result<BaseContact | null, DatabaseError>> {
    try {
      const { data, error } = await this.client
        .from(this.table)
        .select("*")
        .eq("id", id)
        .eq("userId", userId)
        .single();

      if (error) {
        if (error.code === "PGRST116") return ok(null);
        return fail(new DatabaseError("Failed to fetch contact", handleSupabaseError(error, "findById")));
      }

      return ok(data as BaseContact);
    } catch (error) {
      return fail(new DatabaseError("Unexpected error fetching contact", error));
    }
  }

  async findByName(userId: string, name: string): Promise<Result<BaseContact[], DatabaseError>> {
    try {
      const { data, error } = await this.client
        .from(this.table)
        .select("*")
        .eq("userId", userId)
        .ilike("name", `%${name}%`);

      if (error) {
        return fail(new DatabaseError("Failed to search contacts", handleSupabaseError(error, "findByName")));
      }

      return ok(data as BaseContact[]);
    } catch (error) {
      return fail(new DatabaseError("Unexpected error searching contacts", error));
    }
  }

  async create(contact: Omit<BaseContact, "id" | "createdAt" | "updatedAt">): Promise<Result<BaseContact, DatabaseError>> {
    try {
      const now = new Date();
      const { data, error } = await this.client
        .from(this.table)
        .insert({
          ...contact,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        })
        .select()
        .single();

      if (error) {
        return fail(new DatabaseError("Failed to create contact", handleSupabaseError(error, "create")));
      }

      return ok(data as BaseContact);
    } catch (error) {
      return fail(new DatabaseError("Unexpected error creating contact", error));
    }
  }

  async update(id: string, userId: string, contact: Partial<BaseContact>): Promise<Result<BaseContact, DatabaseError>> {
    try {
      const { data, error } = await this.client
        .from(this.table)
        .update({
          ...contact,
          updatedAt: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("userId", userId)
        .select()
        .single();

      if (error) {
        return fail(new DatabaseError("Failed to update contact", handleSupabaseError(error, "update")));
      }

      return ok(data as BaseContact);
    } catch (error) {
      return fail(new DatabaseError("Unexpected error updating contact", error));
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
        return fail(new DatabaseError("Failed to delete contact", handleSupabaseError(error, "delete")));
      }

      return ok(undefined);
    } catch (error) {
      return fail(new DatabaseError("Unexpected error deleting contact", error));
    }
  }
}
