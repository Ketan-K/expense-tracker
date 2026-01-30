"use client";

import { useSession, signOut } from "next-auth/react";
import DashboardLayout from "@/components/DashboardLayout";
import { User, Mail, LogOut, Database } from "lucide-react";
import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import { toast } from "sonner";

export default function ProfilePage() {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [dbStats, setDbStats] = useState({ expenses: 0, categories: 0 });

  useEffect(() => {
    setMounted(true);
    
    // Get IndexedDB stats
    const getStats = async () => {
      if (session?.user?.id) {
        const expenseCount = await db.expenses.count();
        const categoryCount = await db.categories.count();
        setDbStats({ expenses: expenseCount, categories: categoryCount });
      }
    };
    
    getStats();
  }, [session]);

  const handleSignOut = () => {
    signOut({ callbackUrl: "/auth/signin" });
  };

  const clearLocalData = async () => {
    if (confirm("Are you sure? This will clear all local data. Data on server will remain safe.")) {
      try {
        await db.expenses.clear();
        await db.categories.clear();
        await db.budgets.clear();
        await db.syncQueue.clear();
        toast.success("Local data cleared");
        setDbStats({ expenses: 0, categories: 0 });
      } catch (error) {
        toast.error("Failed to clear data");
      }
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-5 sm:space-y-6">
        <div>
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
            <button
              onClick={clearLocalData}
              className="w-full mt-4 py-3 sm:py-4 px-4 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl sm:rounded-2xl hover:bg-red-200 dark:hover:bg-red-900/30 transition-all font-medium text-sm sm:text-base active:scale-95 cursor-pointer"
            >
              Clear Local Data
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
    </DashboardLayout>
  );
}
