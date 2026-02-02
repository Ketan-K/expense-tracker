"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import DashboardLayout from "@/components/DashboardLayout";
import { Receipt, Plus, Wallet, TrendingDown, Calendar, Tag } from "lucide-react";
import { useMemo, useState } from "react";
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import EditExpenseModal from "@/components/EditExpenseModal";
import AddExpenseModal from "@/components/AddExpenseModal";
import MonthSelector from "@/components/reports/MonthSelector";
import { toast } from "sonner";

export default function ExpensesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const monthStart = useMemo(() => startOfMonth(selectedMonth), [selectedMonth]);
  const monthEnd = useMemo(() => endOfMonth(selectedMonth), [selectedMonth]);

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
        .reverse()
        .sortBy("date");
    },
    [session?.user?.id, monthStart, monthEnd]
  );

  const categories = useLiveQuery(
    async () => {
      if (!session?.user?.id) return [];
      return await db.categories.where("userId").equals(session.user.id).toArray();
    },
    [session?.user?.id]
  );

  if (status === "loading") {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (status === "unauthenticated") {
    router.push("/auth/signin");
    return null;
  }

  const totalExpenses = expenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0;
  const expenseCount = expenses?.length || 0;

  // Group by category
  const categoryTotals = expenses?.reduce((acc, expense) => {
    const catName = expense.category || "Uncategorized";
    acc[catName] = (acc[catName] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>) || {};

  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];

  const getCategoryIcon = (categoryName: string) => {
    const category = categories?.find((c) => c.name === categoryName);
    return category?.icon || "🏷️";
  };

  const getCategoryColor = (categoryName: string) => {
    const category = categories?.find((c) => c.name === categoryName);
    return category?.color || "#6B7280";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;

    try {
      await db.expenses.delete(id);
      toast.success("Expense deleted successfully");
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast.error("Failed to delete expense");
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-red-900/10">
        <div className="max-w-6xl mx-auto px-4 py-8 pb-24">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <div className="p-2 sm:p-3 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl shadow-lg">
                  <Receipt className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                Expenses
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-2">
                Track your spending and manage budgets
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl font-semibold shadow-lg shadow-red-500/50 hover:shadow-xl hover:shadow-red-500/60 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <Plus className="w-5 h-5" />
              Add Expense
            </button>
          </div>

          {/* Month Selector */}
          <div className="mb-8">
            <MonthSelector selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 dark:text-gray-400 text-sm font-medium">Total Spent</span>
                <TrendingDown className="w-5 h-5 text-red-500" />
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(totalExpenses)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                This month
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 dark:text-gray-400 text-sm font-medium">Transactions</span>
                <Receipt className="w-5 h-5 text-indigo-500" />
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {expenseCount}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                This month
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 dark:text-gray-400 text-sm font-medium">Top Category</span>
                <Tag className="w-5 h-5 text-purple-500" />
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-white truncate">
                {topCategory ? `${getCategoryIcon(topCategory[0])} ${topCategory[0]}` : "N/A"}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {topCategory ? formatCurrency(topCategory[1]) : "No expenses yet"}
              </p>
            </div>
          </div>

          {/* Expenses List */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-500" />
                {format(new Date(), "MMMM yyyy")}
              </h2>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {!expenses || expenses.length === 0 ? (
                <div className="p-12 text-center">
                  <Receipt className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">No expenses yet</p>
                  <p className="text-gray-400 dark:text-gray-500 text-sm">
                    Start tracking your spending by adding your first expense
                  </p>
                </div>
              ) : (
                expenses.map((expense) => (
                  <div
                    key={expense._id}
                    className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 shadow-sm"
                          style={{ backgroundColor: `${getCategoryColor(expense.category)}20` }}
                        >
                          {getCategoryIcon(expense.category)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                              {expense.description}
                            </h3>
                            <p className="text-xl font-bold text-red-600 dark:text-red-400 flex-shrink-0">
                              -{formatCurrency(expense.amount)}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <Tag className="w-4 h-4" />
                              {expense.category}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {format(new Date(expense.date), "MMM dd, yyyy")}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditingExpense(expense)}
                          className="px-3 py-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => expense._id && handleDelete(expense._id)}
                          className="px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <AddExpenseModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        categories={categories || []}
        userId={session?.user?.id || ""}
      />

      {editingExpense && (
        <EditExpenseModal
          expense={editingExpense}
          isOpen={!!editingExpense}
          onClose={() => setEditingExpense(null)}
          categories={categories || []}
        />
      )}
    </DashboardLayout>
  );
}
