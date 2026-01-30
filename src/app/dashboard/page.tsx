"use client";

import { useSession } from "next-auth/react";
import { db } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import DashboardLayout from "@/components/DashboardLayout";
import ReportsClient from "@/components/reports/ReportsClient";
import MonthSelector from "@/components/reports/MonthSelector";
import BudgetCard from "@/components/budgets/BudgetCard";
import BudgetFormModal from "@/components/budgets/BudgetFormModal";
import EditExpenseModal from "@/components/EditExpenseModal";
import FilterBar, { FilterState } from "@/components/filters/FilterBar";
import ExportButtons from "@/components/reports/ExportButtons";
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { useState, useMemo, useCallback, useEffect } from "react";
import { Plus, Target } from "lucide-react";
import { toast } from "sonner";
import { processSyncQueue } from "@/lib/syncUtils";
import { LocalExpense } from "@/lib/db";

export default function DashboardPage() {
  const { data: session } = useSession();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<LocalExpense | null>(null);
  const [financeTip, setFinanceTip] = useState("Track your expenses, master your money");
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    categories: [],
    amountRange: null,
    paymentMethods: [],
    sortBy: "date-desc",
  });
  
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);
  const monthString = format(selectedMonth, "yyyy-MM");

  // Fetch finance tip on mount
  useEffect(() => {
    const fetchFinanceTip = async () => {
      try {
        const response = await fetch('/api/finance-tip');
        const data = await response.json();
        if (data.tip) {
          setFinanceTip(data.tip);
        }
      } catch (error) {
        console.error("Error fetching finance tip:", error);
      }
    };

    fetchFinanceTip();
  }, []);

  // Fetch expenses from IndexedDB
  const expenses = useLiveQuery(
    async () => {
      if (!session?.user?.id) return [];
      
      return await db.expenses
        .where("userId")
        .equals(session.user.id)
        .and((expense) => {
          const expenseDate = new Date(expense.date);
          return expenseDate >= monthStart && expenseDate <= monthEnd;
        })
        .toArray();
    },
    [session?.user?.id, monthStart.getTime(), monthEnd.getTime()]
  );

  const categories = useLiveQuery(
    async () => {
      if (!session?.user?.id) return [];
      const allCategories = await db.categories.where("userId").equals(session.user.id).toArray();
      
      // Deduplicate by name - keep the first occurrence
      const seen = new Map();
      const uniqueCategories = allCategories.filter((cat) => {
        if (seen.has(cat.name)) return false;
        seen.set(cat.name, true);
        return true;
      });
      
      return uniqueCategories;
    },
    [session?.user?.id]
  );

  // Fetch budgets for current month
  const budgets = useLiveQuery(
    async () => {
      if (!session?.user?.id) return [];
      return await db.budgets
        .where("userId")
        .equals(session.user.id)
        .and((budget) => budget.month === monthString)
        .toArray();
    },
    [session?.user?.id, monthString]
  );

  // Process data for charts with filters applied
  const { categoryData, dailyData, transactions, totalSpent, dailyAverage, filteredExpenses } = useMemo(() => {
    if (!expenses || !categories) {
      return {
        categoryData: [],
        dailyData: [],
        transactions: [],
        totalSpent: 0,
        dailyAverage: 0,
        filteredExpenses: [],
      };
    }

    // Apply filters
    let filtered = expenses;

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (e) => e.description?.toLowerCase().includes(searchLower)
      );
    }

    // Category filter
    if (filters.categories.length > 0) {
      filtered = filtered.filter((e) => filters.categories.includes(e.category));
    }

    // Amount range filter
    if (filters.amountRange) {
      filtered = filtered.filter(
        (e) =>
          e.amount >= filters.amountRange!.min &&
          e.amount <= filters.amountRange!.max
      );
    }

    // Payment method filter
    if (filters.paymentMethods.length > 0) {
      filtered = filtered.filter((e) =>
        filters.paymentMethods.includes(e.paymentMethod || "")
      );
    }

    const categoryMap = new Map<string, { icon: string; color: string }>(
      categories.map((cat) => [cat.name, { icon: cat.icon, color: cat.color }])
    );

    const categoryTotals = filtered.reduce((acc: Record<string, number>, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    const categoryData = Object.entries(categoryTotals).map(([name, value]) => ({
      name,
      value,
      color: categoryMap.get(name)?.color || "#6366f1",
      icon: categoryMap.get(name)?.icon || "HelpCircle",
    }));

    // Calculate daily trend
    const dailyTrend = filtered.reduce((acc: Record<string, number>, expense) => {
      const day = format(new Date(expense.date), "MMM dd");
      acc[day] = (acc[day] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    const dailyData = Object.entries(dailyTrend)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => {
        const dateA = new Date(a.date + ", " + selectedMonth.getFullYear());
        const dateB = new Date(b.date + ", " + selectedMonth.getFullYear());
        return dateA.getTime() - dateB.getTime();
      });

    // Prepare transactions list
    let transactionsList = filtered
      .map((expense) => ({
        id: expense._id?.toString() || "",
        amount: expense.amount,
        category: expense.category,
        categoryColor: categoryMap.get(expense.category)?.color || "#6366f1",
        categoryIcon: categoryMap.get(expense.category)?.icon || "HelpCircle",
        description: expense.description || "",
        date: typeof expense.date === 'string' ? expense.date : expense.date.toISOString(),
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Apply sorting
    if (filters.sortBy !== 'date-desc') {
      switch (filters.sortBy) {
        case 'date-asc':
          transactionsList.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          break;
        case 'amount-desc':
          transactionsList.sort((a, b) => b.amount - a.amount);
          break;
        case 'amount-asc':
          transactionsList.sort((a, b) => a.amount - b.amount);
          break;
        case 'category':
          transactionsList.sort((a, b) => a.category.localeCompare(b.category));
          break;
      }
    }

    // Calculate stats
    const totalSpent = filtered.reduce((sum, expense) => sum + expense.amount, 0);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd }).length;
    const dailyAverage = totalSpent / daysInMonth;

    return { 
      categoryData, 
      dailyData, 
      transactions: transactionsList, 
      totalSpent, 
      dailyAverage,
      filteredExpenses: filtered 
    };
  }, [expenses, categories, monthStart, monthEnd, selectedMonth, filters]);

  // Calculate budget data with spent amounts
  const budgetData = useMemo(() => {
    if (!budgets || !categories || !expenses) return [];

    const categoryById = new Map(
      categories.map((cat) => [cat._id, { name: cat.name, icon: cat.icon, color: cat.color }])
    );
    
    const categoryByName = new Map(
      categories.map((cat) => [cat.name, { id: cat._id, icon: cat.icon, color: cat.color }])
    );

    const categorySpending = expenses.reduce((acc: Record<string, number>, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    return budgets.map((budget) => {
      // Try to find category by ID first
      let category = categoryById.get(budget.categoryId);
      let categoryName = category?.name;
      
      if (!category) {
        // categoryId might be the category name instead of ID (backwards compatibility)
        const catByName = categoryByName.get(budget.categoryId);
        if (catByName) {
          categoryName = budget.categoryId; // It's actually a name
          category = { name: categoryName, icon: catByName.icon, color: catByName.color };
        } else {
          // Last resort: couldn't find the category at all
          console.warn(`Budget category not found: ${budget.categoryId}`, {
            availableCategories: Array.from(categoryById.keys()),
            availableCategoryNames: Array.from(categoryByName.keys())
          });
          categoryName = "Unknown";
        }
      }
      
      return {
        ...budget,
        categoryName: categoryName || "Unknown",
        spent: categorySpending[categoryName || "Unknown"] || 0,
        icon: category?.icon || "HelpCircle",
        color: category?.color || "#6366f1",
      };
    });
  }, [budgets, categories, expenses]);

  // Show budget warnings
  useMemo(() => {
    budgetData.forEach((budget) => {
      const percentage = (budget.spent / budget.amount) * 100;
      if (percentage >= 100 && budget.spent !== 0) {
        toast.error(`Budget exceeded for ${budget.categoryName}!`, {
          id: `budget-${budget.categoryName}`,
        });
      } else if (percentage >= 90 && percentage < 100) {
        toast.warning(`${budget.categoryName} budget at ${percentage.toFixed(0)}%`, {
          id: `budget-${budget.categoryName}`,
        });
      }
    });
  }, [budgetData]);

  const handleEditTransaction = useCallback(async (transaction: { id: string; amount: number; category: string; description: string; date: string }) => {
    if (!session?.user?.id) return;
    
    const expense = await db.expenses.get(transaction.id);
    if (expense) {
      setEditingExpense(expense);
    }
  }, [session?.user?.id]);

  const handleDeleteTransaction = useCallback(async (id: string) => {
    if (!session?.user?.id) return;
    
    try {
      // Delete from IndexedDB
      await db.expenses.delete(id);
      
      // Add to sync queue
      await db.syncQueue.add({
        action: "DELETE",
        collection: "expenses",
        data: { _id: id },
        timestamp: Date.now(),
        retryCount: 0,
        status: "pending",
        localId: id,
      });
      
      toast.success("Transaction deleted");
      
      // Trigger background sync
      processSyncQueue(session.user.id).catch(console.error);
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast.error("Failed to delete transaction");
    }
  }, [session?.user?.id]);

  if (!session) {
    return null;
  }

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const userName = session.user?.name?.split(' ')[0] || 'there';

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
        {/* Greeting Section */}
        <div className="mb-6 animate-in slide-in-from-top duration-500">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            {getGreeting()}, {userName}! 👋
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 italic">
            "{financeTip}"
          </p>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 sm:mb-6 gap-3 sm:gap-4 lg:gap-6 animate-in slide-in-from-top duration-700 delay-100">
          <div className="hidden sm:block flex-1">
            <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white">
              Overview
            </h2>
          </div>
          <div className="flex items-center w-full sm:w-auto">
            <MonthSelector selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />
          </div>
        </div>

        {/* Budgets Section */}
        {budgetData.length > 0 && (
          <div className="mb-6 animate-in slide-in-from-bottom duration-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Target className="w-5 h-5" />
                Monthly Budgets
              </h2>
              <button
                onClick={() => setShowBudgetModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Budget
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {budgetData.map((budget, index) => (
                <BudgetCard
                  key={budget._id}
                  categoryName={budget.categoryName}
                  categoryIcon={budget.icon}
                  categoryColor={budget.color}
                  budgetAmount={budget.amount}
                  spentAmount={budget.spent}
                />
              ))}
            </div>
          </div>
        )}

        {/* Set Budget Button - Show when no budgets */}
        {budgetData.length === 0 && (
          <div className="mb-6 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-pink-900/20 rounded-2xl p-4 border-2 border-indigo-200 dark:border-indigo-800 shadow-lg">
            <div className="flex items-start gap-3 mb-3">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Target className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                  Start Managing Your Budget
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  Set spending limits and get alerts when approaching your budget.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/60 dark:bg-gray-700/60 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                    Track
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/60 dark:bg-gray-700/60 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300">
                    <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span>
                    Alerts
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/60 dark:bg-gray-700/60 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                    Save
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowBudgetModal(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all active:scale-95 text-sm"
            >
              <Plus className="w-4 h-4" />
              Set Your First Budget
            </button>
          </div>
        )}

        {/* Filter Bar */}
        <div className="mb-6">
          <FilterBar
            filters={filters}
            onFiltersChange={setFilters}
            availableCategories={categories?.map((c) => c.name) || []}
          />
        </div>

        <ReportsClient
          categoryData={categoryData}
          dailyData={dailyData}
          transactions={transactions}
          totalSpent={totalSpent}
          dailyAverage={dailyAverage}
          selectedMonth={selectedMonth}
          onEditTransaction={handleEditTransaction}
          onDeleteTransaction={handleDeleteTransaction}
        />
      </div>

      {/* Budget Form Modal */}
      <BudgetFormModal
        isOpen={showBudgetModal}
        onClose={() => setShowBudgetModal(false)}
        categories={categories || []}
        currentMonth={selectedMonth}
        onBudgetAdded={() => {
          // Budgets will auto-refresh via useLiveQuery
        }}
      />

      {/* Edit Expense Modal */}
      <EditExpenseModal
        expense={editingExpense}
        isOpen={!!editingExpense}
        onClose={() => setEditingExpense(null)}
        categories={categories || []}
      />
    </DashboardLayout>
  );
}
