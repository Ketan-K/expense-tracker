import Dexie, { Table } from "dexie";

export interface LocalExpense {
  _id?: string;
  userId: string;
  date: Date;
  amount: number;
  category: string;
  description?: string;
  paymentMethod?: string;
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
  collection: "expenses" | "categories" | "budgets";
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
  syncQueue!: Table<SyncQueueItem, number>;
  syncMetadata!: Table<SyncMetadata, string>;

  constructor() {
    super("ExpenseTrackerDB");
    
    // Version 3: Complete schema refresh with _id, timestamps, and syncMetadata
    this.version(3).stores({
      expenses: "_id, userId, date, category, synced, createdAt, updatedAt",
      categories: "_id, &[userId+name], userId, name, synced, createdAt",
      budgets: "_id, userId, categoryId, month, synced, createdAt, updatedAt",
      syncQueue: "++id, status, timestamp, collection, localId, lastAttempt",
      syncMetadata: "key, updatedAt",
    });
  }
}

export const db = new ExpenseTrackerDB();
