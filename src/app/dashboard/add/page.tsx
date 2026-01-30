"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { db } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import DashboardLayout from "@/components/DashboardLayout";
import ExpenseForm from "@/components/ExpenseForm";
import { toast } from "sonner";
import { generateObjectId } from "@/lib/idGenerator";
import { processSyncQueue } from "@/lib/syncUtils";

export default function AddExpensePage() {
  const { data: session } = useSession();

  const categories = useLiveQuery(
    async () => {
      if (!session?.user?.id) return [];
      return await db.categories.where("userId").equals(session.user.id).toArray();
    },
    [session?.user?.id]
  );

  useEffect(() => {
    // Initialize default categories if none exist
    const initCategories = async () => {
      if (session?.user?.id && categories && categories.length === 0) {
        const response = await fetch("/api/categories");
        if (response.ok) {
          const serverCategories = await response.json();
          
          // Store in IndexedDB, using put to avoid duplicates
          for (const cat of serverCategories) {
            try {
              await db.categories.put({
                _id: cat._id,
                userId: session.user.id,
                name: cat.name,
                icon: cat.icon,
                color: cat.color,
                isDefault: cat.isDefault,
                synced: true,
                createdAt: new Date(cat.createdAt),
              });
            } catch (error) {
              // Ignore duplicate key errors
              console.debug("Category already exists:", cat.name);
            }
          }
        }
      }
    };

    initCategories();
  }, [session?.user?.id, categories]);

  const handleSubmit = async (formData: {
    date: string;
    amount: string;
    category: string;
    description: string;
    paymentMethod: string;
  }) => {
    if (!session?.user?.id) {
      toast.error("Please sign in to add expenses");
      return;
    }

    if (!formData.amount || !formData.category) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const now = new Date();
      const expenseId = generateObjectId();

      // Add to IndexedDB (offline-first)
      const expense = {
        _id: expenseId,
        userId: session.user.id,
        date: new Date(formData.date),
        amount: parseFloat(formData.amount),
        category: formData.category,
        description: formData.description,
        paymentMethod: formData.paymentMethod,
        synced: false,
        createdAt: now,
        updatedAt: now,
      };

      await db.expenses.add(expense);

      // Add to sync queue
      await db.syncQueue.add({
        action: "CREATE",
        collection: "expenses",
        data: expense,
        timestamp: Date.now(),
        retryCount: 0,
        status: "pending",
        localId: expenseId,
      });

      toast.success("Expense added successfully!");

      // Trigger sync if online
      if (navigator.onLine) {
        processSyncQueue(session.user.id);
      }
    } catch (error) {
      console.error("Error adding expense:", error);
      toast.error("Failed to add expense");
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom duration-500">
        <div className="hidden sm:block mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Add Expense
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Track your spending and stay within budget
          </p>
        </div>

        <div className="bg-gradient-to-br from-white via-gray-50 to-indigo-50/30 dark:from-gray-800 dark:via-gray-800 dark:to-indigo-900/20 rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 shadow-lg border border-gray-200 dark:border-gray-700 animate-in zoom-in duration-500">
          <ExpenseForm
            categories={categories || []}
            onSubmit={handleSubmit}
            submitLabel="Add Expense"
            userId={session?.user?.id}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
