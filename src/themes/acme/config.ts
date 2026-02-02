/**
 * Acme Corp Brand Theme Configuration
 * Acme Finance - Financial Excellence
 */

import type { ThemeConfig } from '../default/config';

export const themeConfig: ThemeConfig = {
  brand: {
    name: 'Acme Finance',
    tagline: 'Financial Excellence',
    description: 'Enterprise expense management solution',
  },
  
  meta: {
    title: 'Acme Finance - Enterprise Expense Management',
    description: 'Professional expense tracking and budget management for businesses',
    keywords: 'enterprise finance, expense management, acme, business budget',
    ogImage: '/themes/acme/og-image.png',
    themeColor: '#0ea5e9',
  },
  
  assets: {
    logo: '/themes/acme/logo.svg',
    logoText: 'Acme Finance',
    favicon: '/themes/acme/favicon.ico',
    appleTouchIcon: '/themes/acme/apple-touch-icon.png',
  },
  
  colors: {
    // Acme brand colors (Sky Blue / Cyan)
    primary: '#0ea5e9',
    primaryDark: '#0284c7',
    secondary: '#06b6d4',
    secondaryDark: '#0891b2',
    
    // Feature colors (same as default)
    expenses: '#ef4444',
    expensesDark: '#dc2626',
    income: '#22c55e',
    incomeDark: '#16a34a',
    loans: '#f97316',
    loansDark: '#ea580c',
    contacts: '#3b82f6',
    contactsDark: '#2563eb',
    budgets: '#8b5cf6',
    budgetsDark: '#7c3aed',
  },
  
  features: {
    enableLoans: true,
    enableBudgets: true,
    enableReports: true,
    enableContacts: true,
    maxCategories: 100, // Enterprise tier - more categories
  },
  
  integrations: {
    analyticsId: process.env.NEXT_PUBLIC_GA_ID_ACME || '',
    sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN_ACME || '',
  },
};
