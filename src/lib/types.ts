import { ObjectId } from "mongodb";

export interface User {
  _id?: ObjectId;
  name?: string | null;
  email?: string | null;
  emailVerified?: Date | null;
  image?: string | null;
}

export interface Account {
  _id?: ObjectId;
  userId: ObjectId;
  type: string;
  provider: string;
  providerAccountId: string;
  refresh_token?: string;
  access_token?: string;
  expires_at?: number;
  token_type?: string;
  scope?: string;
  id_token?: string;
  session_state?: string;
}

export interface Session {
  _id?: ObjectId;
  sessionToken: string;
  userId: ObjectId;
  expires: Date;
}

export interface Expense {
  _id?: ObjectId;
  userId: string;
  date: Date;
  amount: number;
  category: string;
  description?: string;
  paymentMethod?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  _id?: ObjectId;
  userId: string;
  name: string;
  icon: string;
  color: string;
  isDefault: boolean;
  createdAt: Date;
}

export interface Budget {
  _id?: ObjectId;
  userId: string;
  categoryId: string;
  month: string; // Format: YYYY-MM
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}

export const DEFAULT_CATEGORIES = [
  { name: "Grocery", icon: "ShoppingCart", color: "#10b981", isDefault: true },
  { name: "Snacks", icon: "Cookie", color: "#f59e0b", isDefault: true },
  { name: "Savings", icon: "PiggyBank", color: "#8b5cf6", isDefault: true },
  { name: "Investments", icon: "TrendingUp", color: "#3b82f6", isDefault: true },
  { name: "Transport", icon: "Car", color: "#06b6d4", isDefault: true },
  { name: "Entertainment", icon: "Film", color: "#ec4899", isDefault: true },
  { name: "Bills", icon: "Receipt", color: "#ef4444", isDefault: true },
  { name: "Health", icon: "Heart", color: "#14b8a6", isDefault: true },
  { name: "Other", icon: "MoreHorizontal", color: "#6b7280", isDefault: true },
];
