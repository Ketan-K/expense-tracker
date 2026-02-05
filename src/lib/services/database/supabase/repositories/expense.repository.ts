/**
 * Supabase Expense Repository Implementation
 */

import { IExpenseRepository, BaseExpense } from '../../interface';
import { Result, ok, fail } from '@/lib/core/result';
import { DatabaseError } from '@/lib/core/errors';
import { getSupabaseClient, handleSupabaseError } from '../client';

export class SupabaseExpenseRepository implements IExpenseRepository {
  private client = getSupabaseClient();
  private table = 'expenses';

  async findByUserId(userId: string, limit?: number, offset?: number): Promise<Result<BaseExpense[], DatabaseError>> {
    try {
      let query = this.client
        .from(this.table)
        .select('*')
        .eq('userId', userId)
        .order('date', { ascending: false });

      if (limit) query = query.limit(limit);
      if (offset) query = query.range(offset, offset + (limit || 100) - 1);

      const { data, error } = await query;

      if (error) {
        return fail(new DatabaseError('Failed to fetch expenses', handleSupabaseError(error, 'findByUserId')));
      }

      return ok(data as BaseExpense[]);
    } catch (error) {
      return fail(new DatabaseError('Unexpected error fetching expenses', error));
    }
  }

  async findById(id: string, userId: string): Promise<Result<BaseExpense | null, DatabaseError>> {
    try {
      const { data, error } = await this.client
        .from(this.table)
        .select('*')
        .eq('id', id)
        .eq('userId', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return ok(null); // Not found
        return fail(new DatabaseError('Failed to fetch expense', handleSupabaseError(error, 'findById')));
      }

      return ok(data as BaseExpense);
    } catch (error) {
      return fail(new DatabaseError('Unexpected error fetching expense', error));
    }
  }

  async findByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Result<BaseExpense[], DatabaseError>> {
    try {
      const { data, error } = await this.client
        .from(this.table)
        .select('*')
        .eq('userId', userId)
        .gte('date', startDate.toISOString())
        .lte('date', endDate.toISOString())
        .order('date', { ascending: false });

      if (error) {
        return fail(new DatabaseError('Failed to fetch expenses by date range', handleSupabaseError(error, 'findByDateRange')));
      }

      return ok(data as BaseExpense[]);
    } catch (error) {
      return fail(new DatabaseError('Unexpected error fetching expenses by date range', error));
    }
  }

  async create(expense: Omit<BaseExpense, 'id' | 'createdAt' | 'updatedAt'>): Promise<Result<BaseExpense, DatabaseError>> {
    try {
      const now = new Date();
      const { data, error } = await this.client
        .from(this.table)
        .insert({
          ...expense,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        })
        .select()
        .single();

      if (error) {
        return fail(new DatabaseError('Failed to create expense', handleSupabaseError(error, 'create')));
      }

      return ok(data as BaseExpense);
    } catch (error) {
      return fail(new DatabaseError('Unexpected error creating expense', error));
    }
  }

  async update(id: string, userId: string, expense: Partial<BaseExpense>): Promise<Result<BaseExpense, DatabaseError>> {
    try {
      const { data, error } = await this.client
        .from(this.table)
        .update({
          ...expense,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('userId', userId)
        .select()
        .single();

      if (error) {
        return fail(new DatabaseError('Failed to update expense', handleSupabaseError(error, 'update')));
      }

      return ok(data as BaseExpense);
    } catch (error) {
      return fail(new DatabaseError('Unexpected error updating expense', error));
    }
  }

  async delete(id: string, userId: string): Promise<Result<void, DatabaseError>> {
    try {
      const { error } = await this.client
        .from(this.table)
        .delete()
        .eq('id', id)
        .eq('userId', userId);

      if (error) {
        return fail(new DatabaseError('Failed to delete expense', handleSupabaseError(error, 'delete')));
      }

      return ok(undefined);
    } catch (error) {
      return fail(new DatabaseError('Unexpected error deleting expense', error));
    }
  }
}
