/**
 * Supabase Database Service
 * Combines all repositories into a single service
 */

import { IDatabaseService } from "../interface";
import { SupabaseExpenseRepository } from "./repositories/expense.repository";
import { SupabaseIncomeRepository } from "./repositories/income.repository";
import { SupabaseCategoryRepository } from "./repositories/category.repository";
import { SupabaseBudgetRepository } from "./repositories/budget.repository";
import { SupabaseContactRepository } from "./repositories/contact.repository";
import { SupabaseLoanRepository } from "./repositories/loan.repository";
import { SupabaseLoanPaymentRepository } from "./repositories/loan-payment.repository";

class SupabaseDatabaseService implements IDatabaseService {
  public readonly expenses = new SupabaseExpenseRepository();
  public readonly incomes = new SupabaseIncomeRepository();
  public readonly categories = new SupabaseCategoryRepository();
  public readonly budgets = new SupabaseBudgetRepository();
  public readonly contacts = new SupabaseContactRepository();
  public readonly loans = new SupabaseLoanRepository();
  public readonly loanPayments = new SupabaseLoanPaymentRepository();
}

export const supabaseDatabaseService = new SupabaseDatabaseService();
