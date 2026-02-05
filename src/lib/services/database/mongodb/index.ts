/**
 * MongoDB Database Service
 * Combines all MongoDB repositories into a single service
 */

import { IDatabaseService } from '../interface';
import { MongoDBExpenseRepository } from './repositories/expense.repository';
import { MongoDBCategoryRepository } from './repositories/category.repository';
import { MongoDBIncomeRepository } from './repositories/income.repository';
import { MongoDBBudgetRepository } from './repositories/budget.repository';
import { MongoDBContactRepository } from './repositories/contact.repository';
import { MongoDBLoanRepository } from './repositories/loan.repository';
import { MongoDBLoanPaymentRepository } from './repositories/loan-payment.repository';

class MongoDBDatabaseService implements IDatabaseService {
  public readonly expenses = new MongoDBExpenseRepository();
  public readonly categories = new MongoDBCategoryRepository();
  public readonly incomes = new MongoDBIncomeRepository();
  public readonly budgets = new MongoDBBudgetRepository();
  public readonly contacts = new MongoDBContactRepository();
  public readonly loans = new MongoDBLoanRepository();
  public readonly loanPayments = new MongoDBLoanPaymentRepository();
}

export const mongoDBDatabaseService = new MongoDBDatabaseService();
