/**
 * Loan Payment Business Service
 * Orchestrates loan payment operations with validation and business logic
 */

import { getDatabaseServiceForUser, BaseLoanPayment } from './database';
import { Result, ok, fail } from '@/lib/core/result';
import { DatabaseError, ValidationError, NotFoundError } from '@/lib/core/errors';
import { validateLoanPayment } from '@/lib/validation';
import { logger } from '@/lib/core/logger';
import { loanService } from './loan.service';

export class LoanPaymentService {
  async getPaymentsByLoanId(loanId: string, userId: string): Promise<Result<BaseLoanPayment[], DatabaseError>> {
    logger.debug('Fetching loan payments', { loanId, userId });
    const db = await getDatabaseServiceForUser(userId);
    return await db.loanPayments.findByLoanId(loanId, userId);
  }

  async getPaymentById(id: string, userId: string): Promise<Result<BaseLoanPayment, DatabaseError | NotFoundError>> {
    logger.debug('Fetching loan payment by ID', { id, userId });
    const db = await getDatabaseServiceForUser(userId);
    const result = await db.loanPayments.findById(id, userId);
    
    if (result.isFailure()) return result;
    if (!result.value) return fail(new NotFoundError('Loan payment not found', 'loan-payment'));
    
    return ok(result.value);
  }

  async createPayment(
    userId: string,
    paymentData: Omit<BaseLoanPayment, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<Result<BaseLoanPayment, DatabaseError | ValidationError | NotFoundError>> {
    // Validate input
    const validation = validateLoanPayment(paymentData);
    if (!validation.isValid) {
      logger.warn('Loan payment validation failed', { userId, errors: validation.errors });
      return fail(new ValidationError(validation.errors.join('; ')));
    }

    // Verify loan exists and belongs to user
    const loanResult = await loanService.getLoanById(paymentData.loanId, userId);
    if (loanResult.isFailure()) {
      return fail(loanResult.error);
    }

    const loan = loanResult.value;

    // Check if payment amount doesn't exceed outstanding amount
    if (paymentData.amount > loan.outstandingAmount) {
      return fail(new ValidationError('Payment amount cannot exceed outstanding loan amount'));
    }

    logger.info('Creating loan payment', { userId, loanId: paymentData.loanId, amount: paymentData.amount });
    const db = await getDatabaseServiceForUser(userId);
    const createResult = await db.loanPayments.create({
      ...validation.sanitized,
      userId,
    });

    if (createResult.isFailure()) {
      return createResult;
    }

    // Update loan outstanding amount
    const newOutstanding = loan.outstandingAmount - paymentData.amount;
    const newStatus = newOutstanding === 0 ? 'paid' : loan.status;

    await loanService.updateLoan(paymentData.loanId, userId, {
      outstandingAmount: newOutstanding,
      status: newStatus,
    });

    return createResult;
  }

  async updatePayment(
    id: string,
    userId: string,
    paymentData: Partial<Omit<BaseLoanPayment, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<Result<BaseLoanPayment, DatabaseError | ValidationError | NotFoundError>> {
    // Check if payment exists
    const db = await getDatabaseServiceForUser(userId);
    const existingResult = await db.loanPayments.findById(id, userId);
    if (existingResult.isFailure()) return existingResult;
    if (!existingResult.value) return fail(new NotFoundError('Loan payment not found', 'loan-payment'));

    // Validate update data
    if (paymentData.amount !== undefined && paymentData.amount <= 0) {
      return fail(new ValidationError('Payment amount must be greater than 0'));
    }

    logger.info('Updating loan payment', { id, userId });
    return await db.loanPayments.update(id, userId, paymentData);
  }

  async deletePayment(id: string, userId: string): Promise<Result<void, DatabaseError | NotFoundError>> {
    logger.info('Deleting loan payment', { id, userId });
    const db = await getDatabaseServiceForUser(userId);
    
    // Get payment to update loan
    const paymentResult = await db.loanPayments.findById(id, userId);
    if (paymentResult.isFailure()) return paymentResult;
    if (!paymentResult.value) return fail(new NotFoundError('Loan payment not found', 'loan-payment'));

    const payment = paymentResult.value;

    // Delete payment
    const deleteResult = await db.loanPayments.delete(id, userId);
    if (deleteResult.isFailure()) return deleteResult;

    // Update loan outstanding amount (add back the payment)
    const loanResult = await loanService.getLoanById(payment.loanId, userId);
    if (loanResult.isSuccess()) {
      const loan = loanResult.value;
      const newOutstanding = loan.outstandingAmount + payment.amount;
      
      await loanService.updateLoan(payment.loanId, userId, {
        outstandingAmount: newOutstanding,
        status: newOutstanding > 0 ? 'active' : 'paid',
      });
    }

    return ok(undefined);
  }
}

export const loanPaymentService = new LoanPaymentService();
