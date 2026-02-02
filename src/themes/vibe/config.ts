/**
 * Vibe Finance Theme Configuration
 * Money Moves Only 💸
 */

import type { ThemeConfig } from "../default/config";

export const themeConfig: ThemeConfig = {
  brand: {
    name: "Vibe Finance",
    tagline: "Money Moves Only 💸",
    description: "Gen Z financial wellness app - Track, save, and stack that cash",
  },

  meta: {
    title: "Vibe Finance - Money Moves Only",
    description:
      "Stack your cash and track your financial vibe. Modern expense tracking built for the next generation.",
    keywords:
      "vibe finance, expense tracker, money management, gen z finance, budget app, financial wellness",
    ogImage: "/og-image-vibe.png",
    themeColor: "#8B5CF6",
  },

  assets: {
    logo: "/logo-vibe.svg",
    logoText: "Vibe Finance",
    favicon: "/favicon-vibe.ico",
    appleTouchIcon: "/apple-touch-icon-vibe.png",
    icon192: "/icon-192x192-vibe.png",
    icon512: "/icon-512x512-vibe.png",
  },

  colors: {
    // Purple to Pink gradient theme
    primary: "#8B5CF6",
    primaryDark: "#7C3AED",
    secondary: "#EC4899",
    secondaryDark: "#DB2777",

    expenses: "#F97316",
    expensesDark: "#EA580C",
    income: "#10B981",
    incomeDark: "#059669",
    loans: "#06B6D4",
    loansDark: "#0891B2",
    contacts: "#8B5CF6",
    contactsDark: "#7C3AED",
    budgets: "#EC4899",
    budgetsDark: "#DB2777",
  },

  features: {
    enableLoans: true,
    enableBudgets: true,
    enableReports: true,
    enableContacts: true,
    maxCategories: 100, // Gen Z users need more categories
  },

  integrations: {
    analyticsId: process.env.NEXT_PUBLIC_GA_ID_VIBE || "",
    sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN_VIBE || "",
  },

  terminology: {
    // Navigation
    dashboard: "Feed",
    expenses: "Spent",
    income: "Gains",
    loans: "IOUs",
    contacts: "Squad",
    profile: "Settings",
    reports: "Reports",
    budgets: "Caps",

    // Actions
    add: "Drop",
    edit: "Update",
    delete: "Remove",
    save: "Lock In",
    cancel: "Nah",
    confirm: "Let's Go",
    create: "Create",

    // Money terms
    spent: "Burned 🔥",
    earned: "Secured 💰",
    budget: "Spending Cap",
    surplus: "You're Up 📈",
    deficit: "You're Down 📉",

    // Greetings
    morningGreeting: "Morning Vibes ☀️",
    afternoonGreeting: "Afternoon Check 🌤️",
    eveningGreeting: "Evening Recap 🌙",

    // Stats
    totalSpent: "Total Burned",
    totalIncome: "Total Secured",
    dailyAverage: "Daily Burn Rate",
    netCashFlow: "Cash Flow Status",
    activeLoans: "Active IOUs",
    totalContacts: "Squad Size",

    // Form fields
    amount: "How Much",
    category: "What For",
    description: "Notes",
    paymentMethod: "Paid With",
    date: "When",

    // Loan-specific
    loanGiven: "I Lent",
    loanTaken: "I Borrowed",
    loanGivenDesc: "They owe me",
    loanTakenDesc: "I owe them",

    // Additional
    transaction: "Move",
    transactions: "Moves",
    month: "Month",
  },
};
