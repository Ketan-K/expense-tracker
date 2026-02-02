/**
 * Terminology Utility
 * Provides theme-aware terminology for UI labels
 */

import { theme } from "@/lib/theme";

// Default terminology (matches current app labels)
const defaultTerminology = {
  // Navigation
  dashboard: "Dashboard",
  expenses: "Expenses",
  income: "Income",
  loans: "Loans",
  contacts: "Contacts",
  profile: "Profile",
  reports: "Reports",
  budgets: "Budgets",

  // Actions
  add: "Add",
  edit: "Edit",
  delete: "Delete",
  save: "Save",
  cancel: "Cancel",
  confirm: "Confirm",
  create: "Create",

  // Money terms
  spent: "Spent",
  earned: "Earned",
  budget: "Budget",
  surplus: "Surplus",
  deficit: "Deficit",

  // Greetings
  morningGreeting: "Good Morning",
  afternoonGreeting: "Good Afternoon",
  eveningGreeting: "Good Evening",

  // Stats
  totalSpent: "Total Spent",
  totalIncome: "Total Income",
  dailyAverage: "Daily Average",
  netCashFlow: "Net Cash Flow",
  activeLoans: "Active Loans",
  totalContacts: "Total Contacts",

  // Form fields
  amount: "Amount",
  category: "Category",
  description: "Description",
  paymentMethod: "Payment Method",
  date: "Date",

  // Loan-specific
  loanGiven: "I Gave",
  loanTaken: "I Took",
  loanGivenDesc: "Money lent to someone",
  loanTakenDesc: "Money borrowed from someone",

  // Additional
  transaction: "Transaction",
  transactions: "Transactions",
  month: "Month",
};

/**
 * Get theme-aware terminology
 * Falls back to default terminology if theme doesn't provide custom terms
 */
export const t = theme.terminology || defaultTerminology;

/**
 * Get a specific term by key
 */
export function getTerm(key: keyof typeof defaultTerminology): string {
  return t[key] || defaultTerminology[key];
}

/**
 * Type-safe terminology object
 */
export type Terminology = typeof defaultTerminology;
