"use client";

import { useSession, signOut } from "next-auth/react";
import DashboardLayout from "@/components/DashboardLayout";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useConfirm } from "@/hooks/useConfirm";
import {
  User,
  Mail,
  LogOut,
  Database,
  RefreshCw,
  Cloud,
  CheckCircle,
  XCircle,
  TrendingUp,
  Wallet,
  CreditCard,
} from "lucide-react";
import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useLiveQuery } from "dexie-react-hooks";
import { processSyncQueue, pullFromServer } from "@/lib/syncUtils";
import { t } from "@/lib/terminology";

export default function ProfilePage() {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [dbStats, setDbStats] = useState({
    expenses: 0,
    categories: 0,
    budgets: 0,
    incomes: 0,
    loans: 0,
    contacts: 0,
  });
  const [syncing, setSyncing] = useState(false);
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [showQueueDetails, setShowQueueDetails] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const { confirm, isOpen, options, handleConfirm, handleCancel } = useConfirm();

  // Get real-time sync queue status
  const syncQueue = useLiveQuery(async () => {
    return await db.syncQueue.toArray();
  }, []);

  // Get unsynced items count
  const unsyncedStats = useLiveQuery(async () => {
    if (!session?.user?.id) return { expenses: 0, budgets: 0, categories: 0 };

    const unsyncedExpenses = await db.expenses
      .where("userId")
      .equals(session.user.id)
      .and(e => !e.synced)
      .count();

    const unsyncedBudgets = await db.budgets
      .where("userId")
      .equals(session.user.id)
      .and(b => !b.synced)
      .count();

    const unsyncedCategories = await db.categories
      .where("userId")
      .equals(session.user.id)
      .and(c => !c.synced)
      .count();

    return {
      expenses: unsyncedExpenses,
      budgets: unsyncedBudgets,
      categories: unsyncedCategories,
    };
  }, [session?.user?.id]);

  useEffect(() => {
    setMounted(true);

    // Get IndexedDB stats
    const getStats = async () => {
      if (session?.user?.id) {
        const expenseCount = await db.expenses.count();
        const categoryCount = await db.categories.count();
        const budgetCount = await db.budgets.count();
        const incomeCount = await db.incomes.count();
        const loanCount = await db.loans.count();
        const contactCount = await db.contacts.count();

        // Get last sync time from metadata
        const metadata = await db.syncMetadata.where("key").equals("lastSync").first();
        if (metadata?.value) {
          setLastSyncTime(new Date(metadata.value));
        }

        setDbStats({
          expenses: expenseCount,
          categories: categoryCount,
          budgets: budgetCount,
          incomes: incomeCount,
          loans: loanCount,
          contacts: contactCount,
        });
      }
    };

    getStats();
  }, [session]);

  const handleSignOut = () => {
    signOut({ callbackUrl: "/auth/signin" });
  };

  const clearLocalData = async () => {
    const confirmed = await confirm({
      title: "Clear Local Data",
      message: "Are you sure? This will clear all local data. Data on server will remain safe.",
      confirmText: "Clear Data",
      cancelText: "Cancel",
      variant: "danger",
    });

    if (confirmed) {
      try {
        await db.expenses.clear();
        await db.categories.clear();
        await db.budgets.clear();
        await db.syncQueue.clear();
        await db.syncMetadata.clear();
        toast.success("Local data cleared");
        setDbStats({ expenses: 0, categories: 0, budgets: 0, incomes: 0, loans: 0, contacts: 0 });
      } catch (_error) {
        toast.error("Failed to clear data");
      }
    }
  };

  const syncNow = async () => {
    if (!session?.user?.id) return;

    setSyncing(true);
    try {
      await processSyncQueue(session.user.id);

      // Save last sync time
      const now = new Date();
      await db.syncMetadata.put({ key: "lastSync", value: now.toISOString(), updatedAt: now });
      setLastSyncTime(now);

      toast.success("Sync completed successfully");
      setShowSyncDialog(false);
    } catch (error) {
      console.error("Sync error:", error);
      toast.error("Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const handlePullFromServer = async () => {
    if (!session?.user?.id) return;

    try {
      await pullFromServer(session.user.id);

      // Refresh stats
      const expenseCount = await db.expenses.count();
      const categoryCount = await db.categories.count();
      const budgetCount = await db.budgets.count();
      const incomeCount = await db.incomes.count();
      const loanCount = await db.loans.count();
      const contactCount = await db.contacts.count();
      setDbStats({
        expenses: expenseCount,
        categories: categoryCount,
        budgets: budgetCount,
        incomes: incomeCount,
        loans: loanCount,
        contacts: contactCount,
      });
    } catch (error) {
      console.error("Pull error:", error);
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <DashboardLayout>
      <ConfirmDialog
        isOpen={isOpen}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        title={options.title}
        message={options.message}
        confirmText={options.confirmText}
        cancelText={options.cancelText}
        variant={options.variant}
      />
      <div className="max-w-4xl mx-auto space-y-5 sm:space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gradient-app">
            {t.profile} & Settings
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-2">
            Manage your account and preferences
          </p>
        </motion.div>

        {/* Summary Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
          <motion.div
            className="bg-gradient-to-br from-app-expenses to-app-expenses-end rounded-2xl shadow-lg p-6 text-white"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">{t.totalSpent}</h3>
              <TrendingUp className="w-5 h-5 opacity-90" />
            </div>
            <p className="text-3xl font-bold mb-1">{dbStats.expenses}</p>
            <p className="text-xs opacity-75">Tracked transactions</p>
          </motion.div>

          <motion.div
            className="bg-gradient-to-br from-app-income to-app-income-end rounded-2xl shadow-lg p-6 text-white"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">{t.totalIncome}</h3>
              <Wallet className="w-5 h-5 opacity-90" />
            </div>
            <p className="text-3xl font-bold mb-1">{dbStats.incomes}</p>
            <p className="text-xs opacity-75">Income records</p>
          </motion.div>

          <motion.div
            className="bg-gradient-to-br from-app-loans to-app-loans-end rounded-2xl shadow-lg p-6 text-white"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">{t.activeLoans}</h3>
              <CreditCard className="w-5 h-5 opacity-90" />
            </div>
            <p className="text-3xl font-bold mb-1">{dbStats.loans}</p>
            <p className="text-xs opacity-75">{dbStats.contacts} contacts</p>
          </motion.div>
        </div>

        {/* User Info */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all">
          <div className="flex items-center gap-4 mb-6">
            {session?.user?.image ? (
              <img
                src={session.user.image}
                alt={session?.user?.name || "User"}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full ring-4 ring-indigo-100 dark:ring-indigo-900/30"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-app-gradient-from to-app-gradient-to rounded-full flex items-center justify-center shadow-lg">
                <User className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white truncate">
                {session?.user?.name || "User"}
              </h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 flex items-center gap-2 truncate">
                <Mail className="w-4 h-4 flex-shrink-0" />
                {session?.user?.email}
              </p>
            </div>
          </div>
        </div>

        {/* Storage Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4 sm:mb-5 flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-600" />
            Local Storage Details
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-4">
            <motion.div
              className="bg-gradient-to-br from-red-500 to-pink-600 p-3 sm:p-4 rounded-xl text-white"
              whileHover={{ scale: 1.03 }}
            >
              <div className="text-xs sm:text-sm opacity-90 mb-1">Expenses</div>
              <div className="text-xl sm:text-2xl font-bold">{dbStats.expenses}</div>
            </motion.div>
            <motion.div
              className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 sm:p-4 rounded-xl text-white"
              whileHover={{ scale: 1.03 }}
            >
              <div className="text-xs sm:text-sm opacity-90 mb-1">Incomes</div>
              <div className="text-xl sm:text-2xl font-bold">{dbStats.incomes}</div>
            </motion.div>
            <motion.div
              className="bg-gradient-to-br from-orange-500 to-red-600 p-3 sm:p-4 rounded-xl text-white"
              whileHover={{ scale: 1.03 }}
            >
              <div className="text-xs sm:text-sm opacity-90 mb-1">Loans</div>
              <div className="text-xl sm:text-2xl font-bold">{dbStats.loans}</div>
            </motion.div>
            <motion.div
              className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 sm:p-4 rounded-xl text-white"
              whileHover={{ scale: 1.03 }}
            >
              <div className="text-xs sm:text-sm opacity-90 mb-1">Contacts</div>
              <div className="text-xl sm:text-2xl font-bold">{dbStats.contacts}</div>
            </motion.div>
            <motion.div
              className="bg-gradient-to-br from-cyan-500 to-blue-600 p-3 sm:p-4 rounded-xl text-white"
              whileHover={{ scale: 1.03 }}
            >
              <div className="text-xs sm:text-sm opacity-90 mb-1">Categories</div>
              <div className="text-xl sm:text-2xl font-bold">{dbStats.categories}</div>
            </motion.div>
            <motion.div
              className="bg-gradient-to-br from-violet-500 to-purple-600 p-3 sm:p-4 rounded-xl text-white"
              whileHover={{ scale: 1.03 }}
            >
              <div className="text-xs sm:text-sm opacity-90 mb-1">Budgets</div>
              <div className="text-xl sm:text-2xl font-bold">{dbStats.budgets}</div>
            </motion.div>
          </div>
          <div className="space-y-2">
            <button
              onClick={clearLocalData}
              className="w-full mt-4 py-3 sm:py-4 px-4 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl sm:rounded-2xl hover:bg-red-200 dark:hover:bg-red-900/30 transition-all font-medium text-sm sm:text-base active:scale-95 cursor-pointer"
            >
              Clear Local Data
            </button>
            <button
              onClick={handlePullFromServer}
              className="w-full mt-2 py-3 sm:py-4 px-4 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl sm:rounded-2xl hover:bg-green-200 dark:hover:bg-green-900/30 transition-all font-medium text-sm sm:text-base active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <Cloud className="w-5 h-5" />
              Pull from Server
            </button>
          </div>
        </div>

        {/* Sync Status */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4 sm:mb-5 flex items-center gap-2">
            <Cloud className="w-5 h-5 text-indigo-600" />
            Sync Status
          </h3>
          <div className="space-y-3 sm:space-y-4">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-700/30 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Connection Status
                </span>
                <span className="text-sm font-semibold flex items-center gap-2">
                  {typeof window !== "undefined" && navigator.onLine ? (
                    <>
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                      </span>
                      <span className="text-green-600 dark:text-green-400">Online</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-red-500" />
                      <span className="text-red-600 dark:text-red-400">Offline</span>
                    </>
                  )}
                </span>
              </div>

              {lastSyncTime && (
                <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-600">
                  <span>Last sync:</span>
                  <span className="font-medium">
                    {lastSyncTime.toLocaleString("en-IN", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              )}
            </div>

            <div
              onClick={() => (syncQueue?.length || 0) > 0 && setShowQueueDetails(true)}
              className="bg-gradient-to-r from-app-budgets-light to-app-budgets-light-end p-4 rounded-xl border border-indigo-200 dark:border-indigo-800 cursor-pointer hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Sync Queue
                </span>
                <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                  {syncQueue?.length || 0}
                </span>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {(syncQueue?.length || 0) === 0 ? "All changes synced" : "Click to view details"}
              </div>
            </div>
            {unsyncedStats &&
              (unsyncedStats.expenses > 0 ||
                unsyncedStats.budgets > 0 ||
                unsyncedStats.categories > 0) && (
                <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-200 dark:border-orange-800">
                  <p className="text-sm text-orange-800 dark:text-orange-300 font-medium mb-2">
                    Unsynced Data Found
                  </p>
                  <div className="space-y-1 text-xs text-orange-700 dark:text-orange-400">
                    {unsyncedStats.expenses > 0 && <div>• {unsyncedStats.expenses} expenses</div>}
                    {unsyncedStats.budgets > 0 && <div>• {unsyncedStats.budgets} budgets</div>}
                    {unsyncedStats.categories > 0 && (
                      <div>• {unsyncedStats.categories} categories</div>
                    )}
                  </div>
                </div>
              )}
            <button
              onClick={() => setShowSyncDialog(true)}
              className="w-full mt-4 py-3 sm:py-4 px-4 bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl sm:rounded-2xl hover:bg-indigo-200 dark:hover:bg-indigo-900/30 transition-all font-medium text-sm sm:text-base active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Sync Now
            </button>
          </div>
        </div>

        {/* Sign Out */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 shadow-lg border border-gray-200 dark:border-gray-700">
          <button
            onClick={handleSignOut}
            className="w-full py-3 sm:py-4 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-xl sm:rounded-2xl transition-all flex items-center justify-center gap-2 text-sm sm:text-base active:scale-95 cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>

        <p className="text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          Expense Tracker v1.0.0 • Built with Next.js
        </p>
      </div>

      {/* Sync Queue Details Dialog */}
      {showQueueDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Database className="w-6 h-6 text-indigo-600" />
                Sync Queue Details
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {syncQueue?.length || 0} pending operations
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {syncQueue && syncQueue.length > 0 ? (
                <div className="space-y-3">
                  {syncQueue.map((item, index) => (
                    <div
                      key={item.id}
                      className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                            #{index + 1}
                          </span>
                          <span
                            className={`text-xs px-2 py-1 rounded-full font-medium ${
                              item.action === "CREATE"
                                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                : item.action === "UPDATE"
                                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                                  : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                            }`}
                          >
                            {item.action}
                          </span>
                          <span className="text-xs px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 font-medium">
                            {item.collection}
                          </span>
                        </div>
                      </div>

                      <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                        {item.collection === "expenses" && item.data && (
                          <>
                            <div className="font-medium">
                              {item.data.category || "Uncategorized"}
                            </div>
                            <div className="text-gray-600 dark:text-gray-400">
                              ₹{item.data.amount?.toLocaleString("en-IN")}
                            </div>
                            {item.data.description && (
                              <div className="text-xs text-gray-500 dark:text-gray-500">
                                {item.data.description}
                              </div>
                            )}
                          </>
                        )}
                        {item.collection === "incomes" && item.data && (
                          <>
                            <div className="font-medium">{item.data.source || "Income"}</div>
                            <div className="text-gray-600 dark:text-gray-400">
                              ₹{item.data.amount?.toLocaleString("en-IN")}
                            </div>
                          </>
                        )}
                        {item.collection === "categories" && item.data && (
                          <div className="font-medium">{item.data.name}</div>
                        )}
                        {item.collection === "budgets" && item.data && (
                          <>
                            <div className="font-medium">{item.data.category}</div>
                            <div className="text-gray-600 dark:text-gray-400">
                              Limit: ₹{item.data.limit?.toLocaleString("en-IN")}
                            </div>
                          </>
                        )}
                        {item.collection === "contacts" && item.data && (
                          <>
                            <div className="font-medium">{item.data.name}</div>
                            {item.data.primaryPhone !== undefined &&
                              item.data.phones?.[item.data.primaryPhone] && (
                                <div className="text-xs text-gray-500 dark:text-gray-500">
                                  {item.data.phones[item.data.primaryPhone]}
                                </div>
                              )}
                          </>
                        )}
                        {item.collection === "loans" && item.data && (
                          <>
                            <div className="font-medium">{item.data.description || "Loan"}</div>
                            <div className="text-gray-600 dark:text-gray-400">
                              ₹{item.data.amount?.toLocaleString("en-IN")}
                            </div>
                          </>
                        )}
                      </div>

                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-2 flex items-center gap-2">
                        <span>
                          Created:{" "}
                          {new Date(item.timestamp).toLocaleString("en-IN", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 font-medium">All changes synced</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                    No pending operations
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
              {syncQueue && syncQueue.length > 0 && (
                <button
                  onClick={async () => {
                    setShowQueueDetails(false);
                    setShowSyncDialog(true);
                  }}
                  className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all font-medium flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-5 h-5" />
                  Sync Now
                </button>
              )}
              <button
                onClick={() => setShowQueueDetails(false)}
                className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-xl transition-all font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sync Dialog */}
      {showSyncDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Cloud className="w-6 h-6 text-indigo-600" />
              Sync to Server
            </h3>

            <div className="space-y-4 mb-6">
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Sync Queue
                  </span>
                  <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                    {syncQueue?.length || 0} items
                  </span>
                </div>
                {unsyncedStats && (
                  <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                    {unsyncedStats.expenses > 0 && (
                      <div className="flex justify-between">
                        <span>Expenses:</span>
                        <span className="font-medium">{unsyncedStats.expenses}</span>
                      </div>
                    )}
                    {unsyncedStats.budgets > 0 && (
                      <div className="flex justify-between">
                        <span>Budgets:</span>
                        <span className="font-medium">{unsyncedStats.budgets}</span>
                      </div>
                    )}
                    {unsyncedStats.categories > 0 && (
                      <div className="flex justify-between">
                        <span>Categories:</span>
                        <span className="font-medium">{unsyncedStats.categories}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {(syncQueue?.length || 0) === 0 &&
                (!unsyncedStats ||
                  (unsyncedStats.expenses === 0 &&
                    unsyncedStats.budgets === 0 &&
                    unsyncedStats.categories === 0)) && (
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 text-green-800 dark:text-green-300">
                      <CheckCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">Everything is synced!</span>
                    </div>
                  </div>
                )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSyncDialog(false)}
                disabled={syncing}
                className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={syncNow}
                disabled={
                  syncing ||
                  ((syncQueue?.length || 0) === 0 &&
                    (!unsyncedStats ||
                      (unsyncedStats.expenses === 0 &&
                        unsyncedStats.budgets === 0 &&
                        unsyncedStats.categories === 0)))
                }
                className="flex-1 py-3 px-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {syncing ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5" />
                    Sync Now
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
