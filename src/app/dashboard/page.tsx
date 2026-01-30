"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { db } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";

export default function DashboardPage() {
  const { data: session } = useSession();
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [categoryBreakdown, setCategoryBreakdown] = useState<Record<string, number>>({});

  const expenses = useLiveQuery(
    async () => {
      if (!session?.user?.id) return [];
      
      const startDate = startOfMonth(new Date());
      const endDate = endOfMonth(new Date());
      
      return await db.expenses
        .where("userId")
        .equals(session.user.id)
        .and((expense) => {
          const expenseDate = new Date(expense.date);
          return expenseDate >= startDate && expenseDate <= endDate;
        })
        .reverse()
        .sortBy("date");
    },
    [session?.user?.id]
  );

  const categories = useLiveQuery(
    async () => {
      if (!session?.user?.id) return [];
      return await db.categories.where("userId").equals(session.user.id).toArray();
    },
    [session?.user?.id]
  );

  useEffect(() => {
    if (expenses) {
      const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
      setMonthlyTotal(total);

      const breakdown = expenses.reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
      }, {} as Record<string, number>);
      setCategoryBreakdown(breakdown);
    }
  }, [expenses]);

  const recentExpenses = expenses?.slice(0, 5) || [];
  const topCategories = Object.entries(categoryBreakdown)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  return (
    <DashboardLayout>
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            {format(new Date(), "MMMM yyyy")}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Total Spent */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:scale-105">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
                  Total Spent
                </p>
                <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mt-1 sm:mt-2">
                  ₹{monthlyTotal.toFixed(2)}
                </p>
              </div>
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-lg">
                <Wallet className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
            </div>
          </div>

          {/* Transactions */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:scale-105">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
                  Transactions
                </p>
                <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mt-1 sm:mt-2">
                  {expenses?.length || 0}
                </p>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-lg">
                <TrendingUp className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:scale-105 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
                  Categories
                </p>
                <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mt-1 sm:mt-2">
                  {Object.keys(categoryBreakdown).length}
                </p>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-lg">
                <Calendar className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Top Categories */}
        {topCategories.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 shadow-lg border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">
              Top Spending Categories
            </h2>
            <div className="space-y-5 sm:space-y-6">
              {topCategories.map(([category, amount]) => {
                const percentage = (amount / monthlyTotal) * 100;
                const categoryInfo = categories?.find((c) => c.name === category);
                
                return (
                  <div key={category}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: categoryInfo?.color || "#6b7280" }}
                        />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {category}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          ₹{amount.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {percentage.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: categoryInfo?.color || "#6b7280",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Transactions */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
              Recent Transactions
            </h2>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-xs sm:text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium cursor-pointer"
            >
              View all
            </button>
          </div>
          
          {recentExpenses.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <Wallet className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">
                No expenses yet. Start tracking!
              </p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {recentExpenses.map((expense) => {
                const categoryInfo = categories?.find(
                  (c) => c.name === expense.category
                );

                return (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-all duration-200 hover:shadow-md active:scale-98 cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg"
                        style={{
                          backgroundColor: `${categoryInfo?.color || "#6b7280"}20`,
                        }}
                      >
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: categoryInfo?.color || "#6b7280" }}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base truncate">
                          {expense.category}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                          {format(new Date(expense.date), "MMM dd, yyyy")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right ml-2 flex-shrink-0">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
                        ₹{expense.amount.toFixed(2)}
                      </p>
                      {expense.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[100px] sm:max-w-[150px] truncate">
                          {expense.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
