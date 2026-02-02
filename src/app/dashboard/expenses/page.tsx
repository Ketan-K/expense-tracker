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
import TransactionsList from "@/components/reports/TransactionsList";
import { toast } from "sonner";
import { processSyncQueue } from "@/lib/syncUtils";

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
    try {
      const expense = await db.expenses.get(id);
      if (!expense) return;

      await db.expenses.delete(id);

      await db.syncQueue.add({
        action: "DELETE",
        collection: "expenses",
        data: { _id: id },
        timestamp: Date.now(),
        retryCount: 0,
        status: "pending",
        remoteId: id,
      });

      toast.success("Expense deleted");

      if (navigator.onLine && session?.user?.id) {
        processSyncQueue(session.user.id);
      }
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast.error("Failed to delete expense");
    }
  };

  const handleEdit = (transaction: { id: string; amount: number; category: string; description: string; date: string }) => {
    const expense = expenses?.find(e => e._id === transaction.id);
    if (expense) {
      setEditingExpense(expense);
    }
  };

  // Transform expenses to transaction format for TransactionsList
  const transactions = expenses?.map(expense => ({
    id: expense._id!,
    amount: expense.amount,
    category: expense.category,
    categoryColor: getCategoryColor(expense.category),
    categoryIcon: getCategoryIcon(expense.category),
    description: expense.description || "",
    date: expense.date.toString(),
  })) || [];

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
          <TransactionsList 
            transactions={transactions}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
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
