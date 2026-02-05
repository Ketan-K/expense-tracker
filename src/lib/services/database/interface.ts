/**
 * Database service interfaces
 * Abstracts database operations for future flexibility
 */

import { Result } from '@/lib/core/result';
import { DatabaseError } from '@/lib/core/errors';

// Base entity types (without ObjectId)
export interface BaseExpense {
  id?: string;
  userId: string;
  date: Date;
  amount: number;
  category: string;
  description?: string;
  paymentMethod?: string;
  type?: "expense" | "income";
  createdAt: Date;
  updatedAt: Date;
}

export interface BaseIncome {
  id?: string;
  userId: string;
  date: Date;
  amount: number;
  source: string;
  category?: string;
  description?: string;
  taxable?: boolean;
  recurring?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BaseContact {
  id?: string;
  userId: string;
  name: string;
  phone?: string[];
  email?: string[];
  primaryPhone?: number;
  primaryEmail?: number;
  relationship?: string;
  notes?: string;
  source?: "manual" | "imported";
  externalId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BaseLoan {
  id?: string;
  userId: string;
  contactId?: string;
  contactName: string;
  direction: "given" | "taken";
  principalAmount: number;
  outstandingAmount: number;
  interestRate?: number;
  startDate: Date;
  dueDate?: Date;
  status: "active" | "paid" | "overdue";
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BaseLoanPayment {
  id?: string;
  loanId: string;
  userId: string;
  amount: number;
  date: Date;
  paymentMethod?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BaseCategory {
  id?: string;
  userId: string;
  name: string;
  icon: string;
  color: string;
  isDefault: boolean;
  createdAt: Date;
}

export interface BaseBudget {
  id?: string;
  userId: string;
  categoryId: string;
  month: string;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Repository interfaces
export interface IExpenseRepository {
  findByUserId(userId: string, limit?: number, offset?: number): Promise<Result<BaseExpense[], DatabaseError>>;
  findById(id: string, userId: string): Promise<Result<BaseExpense | null, DatabaseError>>;
  findByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Result<BaseExpense[], DatabaseError>>;
  create(expense: Omit<BaseExpense, 'id' | 'createdAt' | 'updatedAt'>): Promise<Result<BaseExpense, DatabaseError>>;
  update(id: string, userId: string, expense: Partial<BaseExpense>): Promise<Result<BaseExpense, DatabaseError>>;
  delete(id: string, userId: string): Promise<Result<void, DatabaseError>>;
}

export interface IIncomeRepository {
  findByUserId(userId: string, limit?: number, offset?: number): Promise<Result<BaseIncome[], DatabaseError>>;
  findById(id: string, userId: string): Promise<Result<BaseIncome | null, DatabaseError>>;
  findByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Result<BaseIncome[], DatabaseError>>;
  create(income: Omit<BaseIncome, 'id' | 'createdAt' | 'updatedAt'>): Promise<Result<BaseIncome, DatabaseError>>;
  update(id: string, userId: string, income: Partial<BaseIncome>): Promise<Result<BaseIncome, DatabaseError>>;
  delete(id: string, userId: string): Promise<Result<void, DatabaseError>>;
}

export interface IContactRepository {
  findByUserId(userId: string): Promise<Result<BaseContact[], DatabaseError>>;
  findById(id: string, userId: string): Promise<Result<BaseContact | null, DatabaseError>>;
  findByName(userId: string, name: string): Promise<Result<BaseContact[], DatabaseError>>;
  create(contact: Omit<BaseContact, 'id' | 'createdAt' | 'updatedAt'>): Promise<Result<BaseContact, DatabaseError>>;
  update(id: string, userId: string, contact: Partial<BaseContact>): Promise<Result<BaseContact, DatabaseError>>;
  delete(id: string, userId: string): Promise<Result<void, DatabaseError>>;
}

export interface ILoanRepository {
  findByUserId(userId: string): Promise<Result<BaseLoan[], DatabaseError>>;
  findById(id: string, userId: string): Promise<Result<BaseLoan | null, DatabaseError>>;
  findByStatus(userId: string, status: "active" | "paid" | "overdue"): Promise<Result<BaseLoan[], DatabaseError>>;
  create(loan: Omit<BaseLoan, 'id' | 'createdAt' | 'updatedAt'>): Promise<Result<BaseLoan, DatabaseError>>;
  update(id: string, userId: string, loan: Partial<BaseLoan>): Promise<Result<BaseLoan, DatabaseError>>;
  delete(id: string, userId: string): Promise<Result<void, DatabaseError>>;
}

export interface ILoanPaymentRepository {
  findByLoanId(loanId: string, userId: string): Promise<Result<BaseLoanPayment[], DatabaseError>>;
  findById(id: string, userId: string): Promise<Result<BaseLoanPayment | null, DatabaseError>>;
  create(payment: Omit<BaseLoanPayment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Result<BaseLoanPayment, DatabaseError>>;
  update(id: string, userId: string, payment: Partial<BaseLoanPayment>): Promise<Result<BaseLoanPayment, DatabaseError>>;
  delete(id: string, userId: string): Promise<Result<void, DatabaseError>>;
}

export interface ICategoryRepository {
  findByUserId(userId: string): Promise<Result<BaseCategory[], DatabaseError>>;
  findById(id: string, userId: string): Promise<Result<BaseCategory | null, DatabaseError>>;
  create(category: Omit<BaseCategory, 'id' | 'createdAt'>): Promise<Result<BaseCategory, DatabaseError>>;
  update(id: string, userId: string, category: Partial<BaseCategory>): Promise<Result<BaseCategory, DatabaseError>>;
  delete(id: string, userId: string): Promise<Result<void, DatabaseError>>;
}

export interface IBudgetRepository {
  findByUserId(userId: string): Promise<Result<BaseBudget[], DatabaseError>>;
  findById(id: string, userId: string): Promise<Result<BaseBudget | null, DatabaseError>>;
  findByMonth(userId: string, month: string): Promise<Result<BaseBudget[], DatabaseError>>;
  create(budget: Omit<BaseBudget, 'id' | 'createdAt' | 'updatedAt'>): Promise<Result<BaseBudget, DatabaseError>>;
  update(id: string, userId: string, budget: Partial<BaseBudget>): Promise<Result<BaseBudget, DatabaseError>>;
  delete(id: string, userId: string): Promise<Result<void, DatabaseError>>;
}

// Main database service interface
export interface IDatabaseService {
  expenses: IExpenseRepository;
  incomes: IIncomeRepository;
  contacts: IContactRepository;
  loans: ILoanRepository;
  loanPayments: ILoanPaymentRepository;
  categories: ICategoryRepository;
  budgets: IBudgetRepository;
}
