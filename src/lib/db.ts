import Dexie, { Table } from "dexie";

export interface LocalExpense {
  id?: string;
  userId: string;
  date: Date;
  amount: number;
  category: string;
  description?: string;
  paymentMethod?: string;
  synced: boolean;
  lastModified: Date;
}

export interface LocalCategory {
  id?: string;
  userId: string;
  name: string;
  icon: string;
  color: string;
  isDefault: boolean;
  synced: boolean;
}

export interface LocalBudget {
  id?: string;
  userId: string;
  categoryId: string;
  month: string;
  amount: number;
  synced: boolean;
}

export interface SyncQueueItem {
  id?: number;
  action: "CREATE" | "UPDATE" | "DELETE";
  collection: "expenses" | "categories" | "budgets";
  data: any;
  timestamp: number;
  retryCount: number;
  status: "pending" | "syncing" | "failed";
  localId?: string;
  remoteId?: string;
}

export class ExpenseTrackerDB extends Dexie {
  expenses!: Table<LocalExpense, string>;
  categories!: Table<LocalCategory, string>;
  budgets!: Table<LocalBudget, string>;
  syncQueue!: Table<SyncQueueItem, number>;

  constructor() {
    super("ExpenseTrackerDB");
    
    this.version(1).stores({
      expenses: "id, userId, date, category, synced, lastModified",
      categories: "id, userId, name, synced",
      budgets: "id, userId, categoryId, month, synced",
      syncQueue: "++id, status, timestamp, collection",
    });
  }
}

export const db = new ExpenseTrackerDB();
