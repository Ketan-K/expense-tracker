"use client";

import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db, LocalIncome } from "@/lib/db";
import DashboardLayout from "@/components/DashboardLayout";
import { TrendingUp, Plus, Calendar, Wallet, Pencil, Archive } from "lucide-react";
import { useMemo, useState } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import MonthSelector from "@/components/reports/MonthSelector";
import AddIncomeModal from "@/components/AddIncomeModal";
import EditIncomeModal from "@/components/EditIncomeModal";
import ConfirmDialog from "@/components/ConfirmDialog";
import { motion } from "framer-motion";
import { useConfirm } from "@/hooks/useConfirm";
import { processSyncQueue } from "@/lib/syncUtils";
import { toast } from "sonner";

export default function IncomePage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingIncome, setEditingIncome] = useState<LocalIncome | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const { isOpen, options, handleConfirm, handleCancel, confirm } = useConfirm();

  const monthStart = useMemo(() => startOfMonth(selectedMonth), [selectedMonth]);
  const monthEnd = useMemo(() => endOfMonth(selectedMonth), [selectedMonth]);

  const incomes = useLiveQuery(async () => {
    if (!user?.id) return [];
    return await db.incomes
      .where("userId")
      .equals(user.id)
      .and(income => {
        const incomeDate = new Date(income.date);
        const isInMonth = incomeDate >= monthStart && incomeDate <= monthEnd;
        const matchesArchiveFilter = showArchived ? income.isArchived === true : !income.isArchived;
        return isInMonth && matchesArchiveFilter;
      })
      .reverse()
      .sortBy("date");
  }, [user?.id, monthStart, monthEnd, showArchived]);

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
  const recurringIncome =
    incomes?.filter(i => i.recurring).reduce((sum, i) => sum + i.amount, 0) || 0;

  const handleEditIncome = (e: React.MouseEvent, income: LocalIncome) => {
    e.stopPropagation();
    setEditingIncome(income);
  };

  const handleArchiveIncome = async (e: React.MouseEvent, income: LocalIncome) => {
    e.stopPropagation();

    const confirmed = await confirm({
      title: "Archive Income?",
      message:
        "This income will be archived and hidden from your active income list. You can restore it later from the archived view.",
      confirmText: "Archive",
      variant: "warning",
    });

    if (!confirmed || !user?.id || !income._id) return;

    try {
      // Archive income in IndexedDB
      await db.incomes.update(income._id, {
        isArchived: true,
        archivedAt: new Date(),
        updatedAt: new Date(),
      });

      // Add to sync queue
      await db.syncQueue.add({
        action: "ARCHIVE",
        collection: "incomes",
        data: { _id: income._id },
        timestamp: Date.now(),
        retryCount: 0,
        status: "pending",
        localId: income._id,
      });

      toast.success("Income archived successfully");

      // Process sync queue if online
      if (navigator.onLine) {
        processSyncQueue(user.id);
      }
    } catch (error) {
      console.error("Error archiving income:", error);
      toast.error("Failed to archive income");
    }
  };

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
                Income{" "}
                {showArchived && (
                  <span className="text-lg font-normal text-gray-500">(Archived)</span>
                )}
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-2">
                Track your earnings and income sources
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowArchived(!showArchived)}
                className="px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
              >
                {showArchived ? "View Active" : "View Archived"}
              </button>
              <motion.button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-app-income to-app-income-end text-white rounded-xl font-semibold shadow-lg shadow-green-500/50 hover:shadow-xl hover:shadow-green-500/60 transition-all flex items-center justify-center gap-2 w-full sm:w-auto"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Plus className="w-5 h-5" />
                Add Income
              </motion.button>
            </div>
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
              <p className="text-3xl font-bold mb-1">₹{totalIncome.toLocaleString("en-IN")}</p>
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
              <p className="text-3xl font-bold mb-1">₹{taxableIncome.toLocaleString("en-IN")}</p>
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
              <p className="text-3xl font-bold mb-1">₹{recurringIncome.toLocaleString("en-IN")}</p>
              <p className="text-xs opacity-75">Monthly recurring</p>
            </motion.div>
          </div>

          {/* Income List */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                This Month&apos;s Income
              </h2>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {incomes && incomes.length > 0 ? (
                incomes.map(income => (
                  <div
                    key={income._id}
                    className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors relative group"
                  >
                    {/* Action buttons */}
                    {!showArchived && (
                      <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <button
                          onClick={e => handleEditIncome(e, income)}
                          className="p-2 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 shadow-md transition-colors"
                          title="Edit income"
                        >
                          <Pencil className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        <button
                          onClick={e => handleArchiveIncome(e, income)}
                          className="p-2 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 shadow-md transition-colors"
                          title="Archive income"
                        >
                          <Archive className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                      </div>
                    )}

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

      <EditIncomeModal
        income={editingIncome}
        isOpen={!!editingIncome}
        onClose={() => setEditingIncome(null)}
      />

      <ConfirmDialog
        isOpen={isOpen}
        onConfirm={handleConfirm}
        onClose={handleCancel}
        title={options.title}
        message={options.message}
        confirmText={options.confirmText}
        cancelText={options.cancelText}
        variant={options.variant}
      />
    </DashboardLayout>
  );
}
