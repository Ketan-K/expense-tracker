"use client";

import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import DashboardLayout from "@/components/DashboardLayout";
import { TrendingUp, Plus, Calendar, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import MonthSelector from "@/components/reports/MonthSelector";
import AddIncomeModal from "@/components/AddIncomeModal";
import { motion } from "framer-motion";

export default function IncomePage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);

  const monthStart = useMemo(() => startOfMonth(selectedMonth), [selectedMonth]);
  const monthEnd = useMemo(() => endOfMonth(selectedMonth), [selectedMonth]);

  const incomes = useLiveQuery(
    async () => {
      if (!user?.id) return [];
      return await db.incomes
        .where("userId")
        .equals(user.id)
        .and((income) => {
          const incomeDate = new Date(income.date);
          return incomeDate >= monthStart && incomeDate <= monthEnd;
        })
        .reverse()
        .sortBy("date");
    },
    [user?.id, monthStart, monthEnd]
  );

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAuthenticated) {
    router.push("/auth/signin");
    return null;
  }

  const totalIncome = incomes?.reduce((sum, income) => sum + income.amount, 0) || 0;
  const taxableIncome = incomes?.filter(i => i.taxable).reduce((sum, i) => sum + i.amount, 0) || 0;
  const recurringIncome = incomes?.filter(i => i.recurring).reduce((sum, i) => sum + i.amount, 0) || 0;

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-green-900/10">
        <div className="max-w-6xl mx-auto px-4 py-8 pb-24">
          {/* Header */}
          <motion.div 
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <div className="p-2 sm:p-3 bg-gradient-to-br from-app-income to-app-income-end rounded-xl">
                  <TrendingUp className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                Income
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-2">
                Track your earnings and income sources
              </p>
            </div>
            <motion.button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-app-income to-app-income-end text-white rounded-xl font-semibold shadow-lg shadow-green-500/50 hover:shadow-xl hover:shadow-green-500/60 transition-all flex items-center justify-center gap-2 w-full sm:w-auto"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus className="w-5 h-5" />
              Add Income
            </motion.button>
          </motion.div>

          {/* Month Selector */}
          <div className="mb-8">
            <MonthSelector selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
            <motion.div 
              className="bg-gradient-to-br from-app-income to-app-income-end rounded-2xl shadow-lg p-6 text-white"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium opacity-90">Total Income</h3>
                <Wallet className="w-5 h-5 opacity-90" />
              </div>
              <p className="text-3xl font-bold mb-1">
                ₹{totalIncome.toLocaleString("en-IN")}
              </p>
              <p className="text-xs opacity-75">This month</p>
            </motion.div>

            <motion.div 
              className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl shadow-lg p-6 text-white"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium opacity-90">Taxable Income</h3>
                <TrendingUp className="w-5 h-5 opacity-90" />
              </div>
              <p className="text-3xl font-bold mb-1">
                ₹{taxableIncome.toLocaleString("en-IN")}
              </p>
              <p className="text-xs opacity-75">Subject to tax</p>
            </motion.div>

            <motion.div 
              className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg p-6 text-white"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium opacity-90">Recurring Income</h3>
                <Calendar className="w-5 h-5 opacity-90" />
              </div>
              <p className="text-3xl font-bold mb-1">
                ₹{recurringIncome.toLocaleString("en-IN")}
              </p>
              <p className="text-xs opacity-75">Monthly recurring</p>
            </motion.div>
          </div>

          {/* Income List */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                This Month's Income
              </h2>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {incomes && incomes.length > 0 ? (
                incomes.map((income) => (
                  <div
                    key={income._id}
                    className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {income.source}
                          </h3>
                          {income.recurring && (
                            <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-medium rounded-full">
                              Recurring
                            </span>
                          )}
                          {income.taxable && (
                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full">
                              Taxable
                            </span>
                          )}
                        </div>
                        {income.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {income.description}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {format(new Date(income.date), "MMM dd, yyyy")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          +₹{income.amount.toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center">
                  <TrendingUp className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    No income recorded this month
                  </p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    Add Your First Income
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <AddIncomeModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        userId={user?.id || ""}
      />
    </DashboardLayout>
  );
}
