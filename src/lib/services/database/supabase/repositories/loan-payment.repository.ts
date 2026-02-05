/**
 * Supabase Loan Payment Repository Implementation
 */

import { ILoanPaymentRepository, BaseLoanPayment } from '../../interface';
import { Result, ok, fail } from '@/lib/core/result';
import { DatabaseError } from '@/lib/core/errors';
import { getSupabaseClient, handleSupabaseError } from '../client';

export class SupabaseLoanPaymentRepository implements ILoanPaymentRepository {
  private client = getSupabaseClient();
  private table = 'loan_payments';

  async findByLoanId(loanId: string, userId: string): Promise<Result<BaseLoanPayment[], DatabaseError>> {
    try {
      const { data, error } = await this.client
        .from(this.table)
        .select('*')
        .eq('loanId', loanId)
        .eq('userId', userId)
        .order('date', { ascending: false });

      if (error) {
        return fail(new DatabaseError('Failed to fetch loan payments', handleSupabaseError(error, 'findByLoanId')));
      }

      return ok(data as BaseLoanPayment[]);
    } catch (error) {
      return fail(new DatabaseError('Unexpected error fetching loan payments', error));
    }
  }

  async findById(id: string, userId: string): Promise<Result<BaseLoanPayment | null, DatabaseError>> {
    try {
      const { data, error } = await this.client
        .from(this.table)
        .select('*')
        .eq('id', id)
        .eq('userId', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return ok(null);
        return fail(new DatabaseError('Failed to fetch loan payment', handleSupabaseError(error, 'findById')));
      }

      return ok(data as BaseLoanPayment);
    } catch (error) {
      return fail(new DatabaseError('Unexpected error fetching loan payment', error));
    }
  }

  async create(payment: Omit<BaseLoanPayment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Result<BaseLoanPayment, DatabaseError>> {
    try {
      const now = new Date();
      const { data, error } = await this.client
        .from(this.table)
        .insert({
          ...payment,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        })
        .select()
        .single();

      if (error) {
        return fail(new DatabaseError('Failed to create loan payment', handleSupabaseError(error, 'create')));
      }

      return ok(data as BaseLoanPayment);
    } catch (error) {
      return fail(new DatabaseError('Unexpected error creating loan payment', error));
    }
  }

  async update(id: string, userId: string, payment: Partial<BaseLoanPayment>): Promise<Result<BaseLoanPayment, DatabaseError>> {
    try {
      const { data, error } = await this.client
        .from(this.table)
        .update({
          ...payment,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('userId', userId)
        .select()
        .single();

      if (error) {
        return fail(new DatabaseError('Failed to update loan payment', handleSupabaseError(error, 'update')));
      }

      return ok(data as BaseLoanPayment);
    } catch (error) {
      return fail(new DatabaseError('Unexpected error updating loan payment', error));
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
        return fail(new DatabaseError('Failed to delete loan payment', handleSupabaseError(error, 'delete')));
      }

      return ok(undefined);
    } catch (error) {
      return fail(new DatabaseError('Unexpected error deleting loan payment', error));
    }
  }
}
