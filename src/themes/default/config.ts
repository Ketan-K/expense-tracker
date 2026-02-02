/**
 * Default Brand Theme Configuration
 * ExpenseTracker - Track & Save
 */

export type ThemeConfig = {
  brand: {
    name: string;
    tagline: string;
    description: string;
  };
  meta: {
    title: string;
    description: string;
    keywords: string;
    ogImage: string;
    themeColor: string;
  };
  assets: {
    logo: string;
    logoText: string;
    favicon: string;
    appleTouchIcon: string;
  };
  colors: {
    primary: string;
    primaryDark: string;
    secondary: string;
    secondaryDark: string;
    expenses: string;
    expensesDark: string;
    income: string;
    incomeDark: string;
    loans: string;
    loansDark: string;
    contacts: string;
    contactsDark: string;
    budgets: string;
    budgetsDark: string;
  };
  features: {
    enableLoans: boolean;
    enableBudgets: boolean;
    enableReports: boolean;
    enableContacts: boolean;
    maxCategories: number;
  };
  integrations: {
    analyticsId: string;
    sentryDsn: string;
  };
  terminology?: {
    // Navigation
    dashboard: string;
    expenses: string;
    income: string;
    loans: string;
    contacts: string;
    profile: string;
    reports: string;
    budgets: string;

    // Actions
    add: string;
    edit: string;
    delete: string;
    save: string;
    cancel: string;
    confirm: string;
    create: string;

    // Money terms
    spent: string;
    earned: string;
    budget: string;
    surplus: string;
    deficit: string;

    // Greetings
    morningGreeting: string;
    afternoonGreeting: string;
    eveningGreeting: string;

    // Stats
    totalSpent: string;
    totalIncome: string;
    dailyAverage: string;
    netCashFlow: string;
    activeLoans: string;
    totalContacts: string;

    // Form fields
    amount: string;
    category: string;
    description: string;
    paymentMethod: string;
    date: string;

    // Loan-specific
    loanGiven: string;
    loanTaken: string;
    loanGivenDesc: string;
    loanTakenDesc: string;

    // Additional
    transaction: string;
    transactions: string;
    month: string;
  };
};

export const themeConfig: ThemeConfig = {
  brand: {
    name: "ExpenseTracker",
    tagline: "Track & Save",
    description: "Smart expense tracking for everyone",
  },

  meta: {
    title: "ExpenseTracker - Smart Expense Management",
    description: "Track expenses, manage budgets, and achieve your financial goals with ease",
    keywords: "expense tracker, budget, finance, money management",
    ogImage: "/og-image.png",
    themeColor: "#6366f1",
  },

  assets: {
    logo: "/logo.svg",
    logoText: "ExpenseTracker",
    favicon: "/favicon.ico",
    appleTouchIcon: "/apple-touch-icon.png",
  },

  colors: {
    // For programmatic use (charts, inline styles)
    primary: "#6366f1",
    primaryDark: "#4f46e5",
    secondary: "#a855f7",
    secondaryDark: "#9333ea",

    expenses: "#ef4444",
    expensesDark: "#dc2626",
    income: "#22c55e",
    incomeDark: "#16a34a",
    loans: "#f97316",
    loansDark: "#ea580c",
    contacts: "#3b82f6",
    contactsDark: "#2563eb",
    budgets: "#8b5cf6",
    budgetsDark: "#7c3aed",
  },

  features: {
    enableLoans: true,
    enableBudgets: true,
    enableReports: true,
    enableContacts: true,
    maxCategories: 50,
  },

  integrations: {
    analyticsId: process.env.NEXT_PUBLIC_GA_ID || "",
    sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "",
  },
};
