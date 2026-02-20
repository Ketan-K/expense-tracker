import Dexie, { Table } from "dexie";

// Get theme-specific database name
const THEME = process.env.NEXT_PUBLIC_THEME || "default";
const DB_NAMES: Record<string, string> = {
  default: "ExpenseTrackerDB_v2",
  acme: "ExpenseTrackerDB_v2", // Acme uses same DB as default
  vibe: "VibeFinanceDB_v1", // Vibe Finance gets its own DB
};

const DATABASE_NAME = DB_NAMES[THEME] || "ExpenseTrackerDB_v2";

export interface LocalExpense {
  _id?: string;
  userId: string;
  date: Date;
  amount: number;
  category: string;
  description?: string;
  paymentMethod?: string;
  type?: "expense" | "income"; // For backward compatibility
  isArchived?: boolean;
  archivedAt?: Date;
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
  isArchived?: boolean;
  archivedAt?: Date;
  synced: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LocalContact {
  _id?: string;
  userId: string;
  name: string;
  phone?: string[]; // Array of phone numbers
  email?: string[]; // Array of email addresses
  primaryPhone?: number; // Index of primary phone in array
  primaryEmail?: number; // Index of primary email in array
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
  isArchived?: boolean;
  archivedAt?: Date;
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
  isArchived?: boolean;
  archivedAt?: Date;
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
  isArchived?: boolean;
  archivedAt?: Date;
  synced: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SyncQueueItem {
  id?: number;
  action: "CREATE" | "UPDATE" | "DELETE" | "ARCHIVE" | "RESTORE";
  collection:
    | "expenses"
    | "categories"
    | "budgets"
    | "incomes"
    | "loans"
    | "loanPayments"
    | "contacts";
  data: unknown;
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
  value: unknown;
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
    super(DATABASE_NAME);

    // Version 1: Fresh schema with _id, timestamps, and syncMetadata
    this.version(1).stores({
      expenses: "_id, userId, date, category, synced, createdAt, updatedAt",
      categories: "_id, &[userId+name], userId, name, synced, createdAt",
      budgets: "_id, userId, categoryId, month, synced, createdAt, updatedAt",
      syncQueue: "++id, status, timestamp, collection, localId, lastAttempt",
      syncMetadata: "key, updatedAt",
    });

    // Version 2: Add type field to expenses and new collections for multi-transaction support
    this.version(2)
      .stores({
        expenses: "_id, userId, date, category, type, synced, createdAt, updatedAt",
        categories: "_id, &[userId+name], userId, name, synced, createdAt",
        budgets: "_id, userId, categoryId, month, synced, createdAt, updatedAt",
        incomes: "_id, userId, date, source, synced, createdAt, updatedAt",
        loans: "_id, userId, contactId, direction, status, dueDate, synced, createdAt, updatedAt",
        loanPayments: "_id, loanId, userId, date, synced, createdAt, updatedAt",
        contacts:
          "_id, userId, &[userId+name], name, source, externalId, synced, createdAt, updatedAt",
        syncQueue: "++id, status, timestamp, collection, localId, lastAttempt",
        syncMetadata: "key, updatedAt",
      })
      .upgrade(async tx => {
        // Migrate existing expenses to have type='expense'
        const expenses = tx.table<LocalExpense>("expenses");
        await expenses.toCollection().modify(expense => {
          if (!expense.type) {
            expense.type = "expense";
          }
        });
      });

    // Version 3: Migrate contacts phone/email to arrays for mobile contact import
    this.version(3)
      .stores({
        expenses: "_id, userId, date, category, type, synced, createdAt, updatedAt",
        categories: "_id, &[userId+name], userId, name, synced, createdAt",
        budgets: "_id, userId, categoryId, month, synced, createdAt, updatedAt",
        incomes: "_id, userId, date, source, synced, createdAt, updatedAt",
        loans: "_id, userId, contactId, direction, status, dueDate, synced, createdAt, updatedAt",
        loanPayments: "_id, loanId, userId, date, synced, createdAt, updatedAt",
        contacts:
          "_id, userId, &[userId+name], name, source, externalId, synced, createdAt, updatedAt",
        syncQueue: "++id, status, timestamp, collection, localId, lastAttempt",
        syncMetadata: "key, updatedAt",
      })
      .upgrade(async tx => {
        // Migrate existing contacts to have phone/email as arrays
        const contacts = tx.table<LocalContact>("contacts");
        await contacts
          .toCollection()
          .modify(
            (contact: LocalContact & { phone?: string | string[]; email?: string | string[] }) => {
              // Convert phone string to array
              if (typeof contact.phone === "string" && contact.phone.trim()) {
                contact.phone = [contact.phone.trim()];
                contact.primaryPhone = 0;
              } else if (!contact.phone || contact.phone === "") {
                contact.phone = [];
                contact.primaryPhone = undefined;
              }

              // Convert email string to array
              if (typeof contact.email === "string" && contact.email.trim()) {
                contact.email = [contact.email.trim()];
                contact.primaryEmail = 0;
              } else if (!contact.email || contact.email === "") {
                contact.email = [];
                contact.primaryEmail = undefined;
              }
            }
          );
      });

    // Version 4: Add index for externalId to optimize contact sync
    this.version(4).stores({
      expenses: "_id, userId, date, category, type, synced, createdAt, updatedAt",
      categories: "_id, &[userId+name], userId, name, synced, createdAt",
      budgets: "_id, userId, categoryId, month, synced, createdAt, updatedAt",
      incomes: "_id, userId, date, source, synced, createdAt, updatedAt",
      loans: "_id, userId, contactId, direction, status, dueDate, synced, createdAt, updatedAt",
      loanPayments: "_id, loanId, userId, date, synced, createdAt, updatedAt",
      contacts:
        "_id, userId, &[userId+name], name, source, externalId, [userId+externalId], synced, createdAt, updatedAt",
      syncQueue: "++id, status, timestamp, collection, localId, lastAttempt",
      syncMetadata: "key, updatedAt",
    });

    // Version 5: Add archive support with isArchived indexes
    this.version(5)
      .stores({
        expenses:
          "_id, userId, date, category, type, isArchived, [userId+isArchived], synced, createdAt, updatedAt",
        categories: "_id, &[userId+name], userId, name, synced, createdAt",
        budgets:
          "_id, userId, categoryId, month, isArchived, [userId+isArchived], synced, createdAt, updatedAt",
        incomes:
          "_id, userId, date, source, isArchived, [userId+isArchived], synced, createdAt, updatedAt",
        loans:
          "_id, userId, contactId, direction, status, dueDate, isArchived, [userId+isArchived], synced, createdAt, updatedAt",
        loanPayments:
          "_id, loanId, userId, date, isArchived, [userId+isArchived], synced, createdAt, updatedAt",
        contacts:
          "_id, userId, &[userId+name], name, source, externalId, [userId+externalId], synced, createdAt, updatedAt",
        syncQueue: "++id, status, timestamp, collection, localId, lastAttempt",
        syncMetadata: "key, updatedAt",
      })
      .upgrade(async tx => {
        // Set isArchived: false for all existing records
        const expenses = tx.table<LocalExpense>("expenses");
        await expenses.toCollection().modify(expense => {
          if (expense.isArchived === undefined) {
            expense.isArchived = false;
          }
        });

        const budgets = tx.table<LocalBudget>("budgets");
        await budgets.toCollection().modify(budget => {
          if (budget.isArchived === undefined) {
            budget.isArchived = false;
          }
        });

        const incomes = tx.table<LocalIncome>("incomes");
        await incomes.toCollection().modify(income => {
          if (income.isArchived === undefined) {
            income.isArchived = false;
          }
        });

        const loans = tx.table<LocalLoan>("loans");
        await loans.toCollection().modify(loan => {
          if (loan.isArchived === undefined) {
            loan.isArchived = false;
          }
        });

        const loanPayments = tx.table<LocalLoanPayment>("loanPayments");
        await loanPayments.toCollection().modify(payment => {
          if (payment.isArchived === undefined) {
            payment.isArchived = false;
          }
        });
      });
  }
}

export const db = new ExpenseTrackerDB();
