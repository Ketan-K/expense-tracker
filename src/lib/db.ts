import Dexie, { Table } from "dexie";

export interface LocalExpense {
  _id?: string;
  userId: string;
  date: Date;
  amount: number;
  category: string;
  description?: string;
  paymentMethod?: string;
  type?: "expense" | "income"; // For backward compatibility
  synced: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LocalIncome {
  _id?: string;
  userId: string;
  date: Date;
  amount: number;
  source: string;
  category?: string;
  description?: string;
  taxable?: boolean;
  recurring?: boolean;
  synced: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LocalContact {
  _id?: string;
  userId: string;
  name: string;
  phone?: string;
  email?: string;
  relationship?: string;
  notes?: string;
  source?: "manual" | "imported";
  externalId?: string;
  synced: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LocalLoan {
  _id?: string;
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
  synced: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LocalLoanPayment {
  _id?: string;
  loanId: string;
  userId: string;
  amount: number;
  date: Date;
  paymentMethod?: string;
  notes?: string;
  synced: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LocalCategory {
  _id?: string;
  userId: string;
  name: string;
  icon: string;
  color: string;
  isDefault: boolean;
  synced: boolean;
  createdAt: Date;
}

export interface LocalBudget {
  _id?: string;
  userId: string;
  categoryId: string;
  month: string;
  amount: number;
  synced: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SyncQueueItem {
  id?: number;
  action: "CREATE" | "UPDATE" | "DELETE";
  collection: "expenses" | "categories" | "budgets" | "incomes" | "loans" | "loanPayments" | "contacts";
  data: any;
  timestamp: number;
  retryCount: number;
  status: "pending" | "syncing" | "failed" | "success";
  localId?: string;
  remoteId?: string;
  lastAttempt?: number;
  error?: string;
}

export interface SyncMetadata {
  key: string;
  value: any;
  updatedAt: Date;
}

export class ExpenseTrackerDB extends Dexie {
  expenses!: Table<LocalExpense, string>;
  categories!: Table<LocalCategory, string>;
  budgets!: Table<LocalBudget, string>;
  incomes!: Table<LocalIncome, string>;
  loans!: Table<LocalLoan, string>;
  loanPayments!: Table<LocalLoanPayment, string>;
  contacts!: Table<LocalContact, string>;
  syncQueue!: Table<SyncQueueItem, number>;
  syncMetadata!: Table<SyncMetadata, string>;

  constructor() {
    super("ExpenseTrackerDB_v2");
    
    // Version 1: Fresh schema with _id, timestamps, and syncMetadata
    this.version(1).stores({
      expenses: "_id, userId, date, category, synced, createdAt, updatedAt",
      categories: "_id, &[userId+name], userId, name, synced, createdAt",
      budgets: "_id, userId, categoryId, month, synced, createdAt, updatedAt",
      syncQueue: "++id, status, timestamp, collection, localId, lastAttempt",
      syncMetadata: "key, updatedAt",
    });

    // Version 2: Add type field to expenses and new collections for multi-transaction support
    this.version(2).stores({
      expenses: "_id, userId, date, category, type, synced, createdAt, updatedAt",
      categories: "_id, &[userId+name], userId, name, synced, createdAt",
      budgets: "_id, userId, categoryId, month, synced, createdAt, updatedAt",
      incomes: "_id, userId, date, source, synced, createdAt, updatedAt",
      loans: "_id, userId, contactId, direction, status, dueDate, synced, createdAt, updatedAt",
      loanPayments: "_id, loanId, userId, date, synced, createdAt, updatedAt",
      contacts: "_id, userId, &[userId+name], name, source, externalId, synced, createdAt, updatedAt",
      syncQueue: "++id, status, timestamp, collection, localId, lastAttempt",
      syncMetadata: "key, updatedAt",
    }).upgrade(async (tx) => {
      // Migrate existing expenses to have type='expense'
      const expenses = tx.table<LocalExpense>("expenses");
      await expenses.toCollection().modify((expense) => {
        if (!expense.type) {
          expense.type = "expense";
        }
      });
    });
  }
}

export const db = new ExpenseTrackerDB();
