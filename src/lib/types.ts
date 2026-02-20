import { ObjectId } from "mongodb";
import {
  Apple,
  Fuel,
  Route,
  PlusCircle,
  HelpCircle,
  ShoppingCart,
  Cookie,
  PiggyBank,
  TrendingUp,
  Car,
  Film,
  Receipt,
  Heart,
  Home,
  Briefcase,
  Coffee,
  Book,
  Gift,
  Plane,
  Train,
  Bus,
  Bike,
  Utensils,
  Pizza,
  Wine,
  Smartphone,
  Laptop,
  Gamepad2,
  Dumbbell,
  Shirt,
  Baby,
  Dog,
  Cat,
  Wrench,
  Music,
  Camera,
  Sparkles,
  Zap,
  Wallet,
  CreditCard,
  Banknote,
  ShoppingBag,
  Package,
  Paintbrush,
  Scissors,
  Hammer,
  Lightbulb,
  Leaf,
  TreePine,
  Flower2,
  Droplet,
  Flame,
  Snowflake,
  Sun,
  Moon,
  Star,
  type LucideIcon,
} from "lucide-react";

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
  type?: "expense" | "income"; // For backward compatibility and future migration
  isArchived?: boolean;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Income {
  _id?: ObjectId;
  userId: string;
  date: Date;
  amount: number;
  source: string; // "Salary", "Freelance", "Business", etc.
  category?: string; // Optional income categorization
  description?: string;
  taxable?: boolean;
  recurring?: boolean; // Monthly salary vs one-time bonus
  isArchived?: boolean;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Contact {
  _id?: ObjectId;
  userId: string;
  name: string;
  phone?: string[]; // Array of phone numbers
  email?: string[]; // Array of email addresses
  primaryPhone?: number; // Index of primary phone in array
  primaryEmail?: number; // Index of primary email in array
  relationship?: string; // "friend", "family", "business", "other"
  notes?: string;
  source?: "manual" | "imported"; // For mobile contact integration
  externalId?: string; // For linking to mobile contacts
  createdAt: Date;
  updatedAt: Date;
}

export interface Loan {
  _id?: ObjectId;
  userId: string;
  contactId?: string; // Reference to Contact
  contactName: string; // Fallback if no contact selected
  direction: "given" | "taken"; // Money I gave vs money I took
  principalAmount: number;
  outstandingAmount: number;
  interestRate?: number; // Optional for display/reference only
  startDate: Date;
  dueDate?: Date;
  status: "active" | "paid" | "overdue";
  description?: string;
  isArchived?: boolean;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoanPayment {
  _id?: ObjectId;
  loanId: string; // Reference to Loan
  userId: string;
  amount: number;
  date: Date;
  paymentMethod?: string;
  notes?: string;
  isArchived?: boolean;
  archivedAt?: Date;
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
  isArchived?: boolean;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Import centralized color palette
import { COLORS } from "./colors";

export const DEFAULT_CATEGORIES = [
  { name: "Grocery", icon: "ShoppingCart", color: COLORS.categories[0], isDefault: true },
  { name: "Snacks", icon: "Cookie", color: COLORS.categories[1], isDefault: true },
  { name: "Fruits", icon: "Apple", color: COLORS.categories[2], isDefault: true },
  { name: "Savings", icon: "PiggyBank", color: COLORS.categories[3], isDefault: true },
  { name: "Investments", icon: "TrendingUp", color: COLORS.categories[4], isDefault: true },
  { name: "Transport", icon: "Car", color: COLORS.categories[5], isDefault: true },
  { name: "Car Petrol", icon: "Fuel", color: COLORS.categories[6], isDefault: true },
  { name: "Car Toll", icon: "Route", color: COLORS.categories[7], isDefault: true },
  { name: "Entertainment", icon: "Film", color: COLORS.categories[8], isDefault: true },
  { name: "Bills", icon: "Receipt", color: COLORS.categories[9], isDefault: true },
  { name: "Health", icon: "Heart", color: COLORS.categories[10], isDefault: true },
  { name: "Other", icon: "PlusCircle", color: COLORS.categories[11], isDefault: true },
];

export const DEFAULT_INCOME_SOURCES = [
  "Salary",
  "Freelance",
  "Business",
  "Investment Returns",
  "Rental Income",
  "Gift",
  "Other Income",
];

// Icon mapping utility
export const iconMap: Record<string, LucideIcon> = {
  Apple,
  Fuel,
  Route,
  PlusCircle,
  ShoppingCart,
  Cookie,
  PiggyBank,
  TrendingUp,
  Car,
  Film,
  Receipt,
  Heart,
  Home,
  Briefcase,
  Coffee,
  Book,
  Gift,
  Plane,
  Train,
  Bus,
  Bike,
  Utensils,
  Pizza,
  Wine,
  Smartphone,
  Laptop,
  Gamepad2,
  Dumbbell,
  Shirt,
  Baby,
  Dog,
  Cat,
  Wrench,
  Music,
  Camera,
  Sparkles,
  Zap,
  Wallet,
  CreditCard,
  Banknote,
  ShoppingBag,
  Package,
  Paintbrush,
  Scissors,
  Hammer,
  Lightbulb,
  Leaf,
  TreePine,
  Flower2,
  Droplet,
  Flame,
  Snowflake,
  Sun,
  Moon,
  Star,
  HelpCircle,
};

// Available icons for user selection when creating custom categories
export const availableIcons = [
  { name: "ShoppingCart", component: ShoppingCart },
  { name: "Cookie", component: Cookie },
  { name: "Apple", component: Apple },
  { name: "Pizza", component: Pizza },
  { name: "Coffee", component: Coffee },
  { name: "Wine", component: Wine },
  { name: "Utensils", component: Utensils },
  { name: "ShoppingBag", component: ShoppingBag },
  { name: "Package", component: Package },
  { name: "Home", component: Home },
  { name: "Car", component: Car },
  { name: "Fuel", component: Fuel },
  { name: "Route", component: Route },
  { name: "Bike", component: Bike },
  { name: "Bus", component: Bus },
  { name: "Train", component: Train },
  { name: "Plane", component: Plane },
  { name: "Wallet", component: Wallet },
  { name: "CreditCard", component: CreditCard },
  { name: "Banknote", component: Banknote },
  { name: "PiggyBank", component: PiggyBank },
  { name: "TrendingUp", component: TrendingUp },
  { name: "Receipt", component: Receipt },
  { name: "Film", component: Film },
  { name: "Music", component: Music },
  { name: "Gamepad2", component: Gamepad2 },
  { name: "Camera", component: Camera },
  { name: "Heart", component: Heart },
  { name: "Dumbbell", component: Dumbbell },
  { name: "Briefcase", component: Briefcase },
  { name: "Book", component: Book },
  { name: "Laptop", component: Laptop },
  { name: "Smartphone", component: Smartphone },
  { name: "Gift", component: Gift },
  { name: "Shirt", component: Shirt },
  { name: "Baby", component: Baby },
  { name: "Dog", component: Dog },
  { name: "Cat", component: Cat },
  { name: "Wrench", component: Wrench },
  { name: "Hammer", component: Hammer },
  { name: "Scissors", component: Scissors },
  { name: "Paintbrush", component: Paintbrush },
  { name: "Lightbulb", component: Lightbulb },
  { name: "Sparkles", component: Sparkles },
  { name: "Zap", component: Zap },
  { name: "Leaf", component: Leaf },
  { name: "TreePine", component: TreePine },
  { name: "Flower2", component: Flower2 },
  { name: "Droplet", component: Droplet },
  { name: "Flame", component: Flame },
  { name: "Snowflake", component: Snowflake },
  { name: "Sun", component: Sun },
  { name: "Moon", component: Moon },
  { name: "Star", component: Star },
  { name: "PlusCircle", component: PlusCircle },
];

// Helper function to get icon component from icon name string
export function getIconComponent(iconName: string): LucideIcon {
  return iconMap[iconName] || HelpCircle;
}
