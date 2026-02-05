/**
 * Supabase Budget Repository Implementation
 */

import { IBudgetRepository, BaseBudget } from '../../interface';
import { Result, ok, fail } from '@/lib/core/result';
import { DatabaseError } from '@/lib/core/errors';
import { getSupabaseClient, handleSupabaseError } from '../client';

export class SupabaseBudgetRepository implements IBudgetRepository {
  private client = getSupabaseClient();
  private table = 'budgets';

  async findByUserId(userId: string): Promise<Result<BaseBudget[], DatabaseError>> {
    try {
      const { data, error } = await this.client
        .from(this.table)
        .select('*')
        .eq('userId', userId)
        .order('month', { ascending: false });

      if (error) {
        return fail(new DatabaseError('Failed to fetch budgets', handleSupabaseError(error, 'findByUserId')));
      }

      return ok(data as BaseBudget[]);
    } catch (error) {
      return fail(new DatabaseError('Unexpected error fetching budgets', error));
    }
  }

  async findById(id: string, userId: string): Promise<Result<BaseBudget | null, DatabaseError>> {
    try {
      const { data, error } = await this.client
        .from(this.table)
        .select('*')
        .eq('id', id)
        .eq('userId', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return ok(null);
        return fail(new DatabaseError('Failed to fetch budget', handleSupabaseError(error, 'findById')));
      }

      return ok(data as BaseBudget);
    } catch (error) {
      return fail(new DatabaseError('Unexpected error fetching budget', error));
    }
  }

  async findByMonth(userId: string, month: string): Promise<Result<BaseBudget[], DatabaseError>> {
    try {
      const { data, error } = await this.client
        .from(this.table)
        .select('*')
        .eq('userId', userId)
        .eq('month', month);

      if (error) {
        return fail(new DatabaseError('Failed to fetch budgets by month', handleSupabaseError(error, 'findByMonth')));
      }

      return ok(data as BaseBudget[]);
    } catch (error) {
      return fail(new DatabaseError('Unexpected error fetching budgets by month', error));
    }
  }

  async create(budget: Omit<BaseBudget, 'id' | 'createdAt' | 'updatedAt'>): Promise<Result<BaseBudget, DatabaseError>> {
    try {
      const now = new Date();
      const { data, error } = await this.client
        .from(this.table)
        .insert({
          ...budget,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        })
        .select()
        .single();

      if (error) {
        return fail(new DatabaseError('Failed to create budget', handleSupabaseError(error, 'create')));
      }

      return ok(data as BaseBudget);
    } catch (error) {
      return fail(new DatabaseError('Unexpected error creating budget', error));
    }
  }

  async update(id: string, userId: string, budget: Partial<BaseBudget>): Promise<Result<BaseBudget, DatabaseError>> {
    try {
      const { data, error } = await this.client
        .from(this.table)
        .update({
          ...budget,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('userId', userId)
        .select()
        .single();

      if (error) {
        return fail(new DatabaseError('Failed to update budget', handleSupabaseError(error, 'update')));
      }

      return ok(data as BaseBudget);
    } catch (error) {
      return fail(new DatabaseError('Unexpected error updating budget', error));
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
        return fail(new DatabaseError('Failed to delete budget', handleSupabaseError(error, 'delete')));
      }

      return ok(undefined);
    } catch (error) {
      return fail(new DatabaseError('Unexpected error deleting budget', error));
    }
  }
}
