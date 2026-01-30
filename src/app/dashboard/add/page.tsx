"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { db } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";
import { Calendar, DollarSign, FileText, CreditCard, Save } from "lucide-react";
import { format } from "date-fns";

export default function AddExpensePage() {
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    amount: "",
    category: "",
    description: "",
    paymentMethod: "cash",
  });

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
          
          // Store in IndexedDB
          for (const cat of serverCategories) {
            await db.categories.add({
              id: cat._id,
              userId: session.user.id,
              name: cat.name,
              icon: cat.icon,
              color: cat.color,
              isDefault: cat.isDefault,
              synced: true,
            });
          }
        }
      }
    };

    initCategories();
  }, [session?.user?.id, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.user?.id) {
      toast.error("Please sign in to add expenses");
      return;
    }

    if (!formData.amount || !formData.category) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      // Add to IndexedDB (offline-first)
      const expense = {
        id: `temp-${Date.now()}`,
        userId: session.user.id,
        date: new Date(formData.date),
        amount: parseFloat(formData.amount),
        category: formData.category,
        description: formData.description,
        paymentMethod: formData.paymentMethod,
        synced: false,
        lastModified: new Date(),
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
        localId: expense.id,
      });

      toast.success("Expense added successfully!");

      // Reset form
      setFormData({
        date: format(new Date(), "yyyy-MM-dd"),
        amount: "",
        category: "",
        description: "",
        paymentMethod: "cash",
      });

      // Trigger sync if online
      if (navigator.onLine) {
        triggerSync();
      }
    } catch (error) {
      console.error("Error adding expense:", error);
      toast.error("Failed to add expense");
    }
  };

  const triggerSync = async () => {
    try {
      const pendingItems = await db.syncQueue
        .where("status")
        .equals("pending")
        .toArray();

      if (pendingItems.length === 0) return;

      const operations = pendingItems.map((item) => ({
        action: item.action,
        collection: item.collection,
        data: item.data,
        localId: item.localId,
      }));

      const response = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operations }),
      });

      if (response.ok) {
        const { results } = await response.json();

        // Update synced status and remove from queue
        for (const result of results) {
          if (result.success) {
            await db.expenses
              .where("id")
              .equals(result.localId)
              .modify({ synced: true, id: result.remoteId });

            await db.syncQueue
              .where("localId")
              .equals(result.localId)
              .delete();
          }
        }

        toast.success("Synced with server");
      }
    } catch (error) {
      console.error("Sync error:", error);
    }
  };

  const quickAmounts = [100, 200, 500, 1000];

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4 sm:mb-6">
          Add Expense
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6 sm:mb-8">
          Track your spending and stay within budget
        </p>

        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 shadow-lg border border-gray-200 dark:border-gray-700">
            {/* Date */}
            <div className="mb-5 sm:mb-6">
              <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-3">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2 text-indigo-600" />
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="w-full px-4 py-3 sm:py-4 text-base bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-white transition-all"
                required
              />
            </div>

            {/* Amount */}
            <div className="mb-5 sm:mb-6">
              <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-3">
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2 text-indigo-600" />
                Amount (₹)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                className="w-full px-4 py-3 sm:py-4 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-xl sm:text-2xl font-semibold dark:text-white transition-all"
                required
              />

              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-4">
                {quickAmounts.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, amount: amount.toString() })
                    }
                    className="px-4 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 hover:from-indigo-100 hover:to-purple-100 dark:hover:from-indigo-900/50 dark:hover:to-purple-900/50 text-indigo-700 dark:text-indigo-300 rounded-lg sm:rounded-xl text-sm sm:text-base font-medium transition-all hover:shadow-md active:scale-95 cursor-pointer"
                  >
                    ₹{amount}
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div className="mb-5 sm:mb-6">
              <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-3">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2 text-indigo-600" />
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-full px-4 py-3 sm:py-4 text-base bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-white transition-all"
                required
              >
                <option value="">Select a category</option>
                {categories?.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className="mb-5 sm:mb-6">
              <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-3">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2 text-indigo-600" />
                Description (Optional)
              </label>
              <textarea
                placeholder="What did you spend on?"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className="w-full px-4 py-3 text-base bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none dark:text-white transition-all"
              />
            </div>

            {/* Payment Method */}
            <div className="mb-6">
              <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-3">
                <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2 text-indigo-600" />
                Payment Method
              </label>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {["cash", "card", "upi"].map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, paymentMethod: method })
                    }
                    className={`px-4 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-medium capitalize transition-all text-sm sm:text-base active:scale-95 ${
                      formData.paymentMethod === method
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/50"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:shadow-md"
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-4 sm:py-5 px-6 rounded-xl sm:rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 active:scale-98 text-base sm:text-lg"
            >
              <Save className="w-5 h-5 sm:w-6 sm:h-6" />
              Add Expense
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
