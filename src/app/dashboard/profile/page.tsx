"use client";

import { useSession, signOut } from "next-auth/react";
import DashboardLayout from "@/components/DashboardLayout";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useConfirm } from "@/hooks/useConfirm";
import { User, Mail, LogOut, Database, RefreshCw, Cloud, CheckCircle, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import { toast } from "sonner";
import { useLiveQuery } from "dexie-react-hooks";
import { processSyncQueue, pullFromServer } from "@/lib/syncUtils";

export default function ProfilePage() {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [dbStats, setDbStats] = useState({ expenses: 0, categories: 0, budgets: 0 });
  const [syncing, setSyncing] = useState(false);
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const { confirm, isOpen, options, handleConfirm, handleCancel } = useConfirm();

  // Get real-time sync queue status
  const syncQueue = useLiveQuery(
    async () => {
      return await db.syncQueue.toArray();
    },
    []
  );

  // Get unsynced items count
  const unsyncedStats = useLiveQuery(
    async () => {
      if (!session?.user?.id) return { expenses: 0, budgets: 0, categories: 0 };
      
      const unsyncedExpenses = await db.expenses
        .where("userId").equals(session.user.id)
        .and(e => !e.synced)
        .count();
      
      const unsyncedBudgets = await db.budgets
        .where("userId").equals(session.user.id)
        .and(b => !b.synced)
        .count();
      
      const unsyncedCategories = await db.categories
        .where("userId").equals(session.user.id)
        .and(c => !c.synced)
        .count();
      
      return {
        expenses: unsyncedExpenses,
        budgets: unsyncedBudgets,
        categories: unsyncedCategories,
      };
    },
    [session?.user?.id]
  );

  useEffect(() => {
    setMounted(true);
    
    // Get IndexedDB stats
    const getStats = async () => {
      if (session?.user?.id) {
        const expenseCount = await db.expenses.count();
        const categoryCount = await db.categories.count();
        const budgetCount = await db.budgets.count();
        setDbStats({ expenses: expenseCount, categories: categoryCount, budgets: budgetCount });
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
        setDbStats({ expenses: 0, categories: 0, budgets: 0 });
      } catch (error) {
        toast.error("Failed to clear data");
      }
    }
  };

  const syncNow = async () => {
    if (!session?.user?.id) return;
    
    setSyncing(true);
    try {
      await processSyncQueue(session.user.id);
      setShowSyncDialog(false);
    } catch (error) {
      console.error("Sync error:", error);
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
      setDbStats({ expenses: expenseCount, categories: categoryCount, budgets: budgetCount });
      
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
      <div className="max-w-2xl mx-auto space-y-5 sm:space-y-6">
        <div className="hidden sm:block">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Profile & Settings
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            Manage your account and preferences
          </p>
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
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
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
            Local Storage
          </h3>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Expenses</span>
              <span className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                {dbStats.expenses}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Categories</span>
              <span className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                {dbStats.categories}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Budgets</span>
              <span className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                {dbStats.budgets}
              </span>
            </div>
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
            <div className="flex items-center justify-between">
              <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Connection</span>
              <span className="text-sm sm:text-base font-semibold flex items-center gap-2">
                {typeof window !== 'undefined' && navigator.onLine ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500" />
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
            <div className="flex items-center justify-between">
              <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Pending Sync</span>
              <span className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                {syncQueue?.length || 0} items
              </span>
            </div>
            {unsyncedStats && (unsyncedStats.expenses > 0 || unsyncedStats.budgets > 0 || unsyncedStats.categories > 0) && (
              <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-200 dark:border-orange-800">
                <p className="text-sm text-orange-800 dark:text-orange-300 font-medium mb-2">Unsynced Data Found</p>
                <div className="space-y-1 text-xs text-orange-700 dark:text-orange-400">
                  {unsyncedStats.expenses > 0 && <div>• {unsyncedStats.expenses} expenses</div>}
                  {unsyncedStats.budgets > 0 && <div>• {unsyncedStats.budgets} budgets</div>}
                  {unsyncedStats.categories > 0 && <div>• {unsyncedStats.categories} categories</div>}
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
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sync Queue</span>
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

              {(syncQueue?.length || 0) === 0 && (!unsyncedStats || (unsyncedStats.expenses === 0 && unsyncedStats.budgets === 0 && unsyncedStats.categories === 0)) && (
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
                disabled={syncing || ((syncQueue?.length || 0) === 0 && (!unsyncedStats || (unsyncedStats.expenses === 0 && unsyncedStats.budgets === 0 && unsyncedStats.categories === 0)))}
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
