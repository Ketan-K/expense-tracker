"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { db, LocalBudget, LocalCategory } from "@/lib/db";
import { toast } from "sonner";
import { processSyncQueue } from "@/lib/syncUtils";
import { format } from "date-fns";

interface EditBudgetModalProps {
  budget: LocalBudget | null;
  category: LocalCategory | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditBudgetModal({
  budget,
  category,
  isOpen,
  onClose,
}: EditBudgetModalProps) {
  const [amount, setAmount] = useState(budget?.amount.toString() || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!budget || !amount) return;

    setIsSubmitting(true);
    try {
      const updatedBudget: LocalBudget = {
        ...budget,
        amount: parseFloat(amount),
        updatedAt: new Date(),
      };

      // Update in IndexedDB
      await db.budgets.put(updatedBudget);

      // Add to sync queue
      await db.syncQueue.add({
        action: "UPDATE",
        collection: "budgets",
        data: updatedBudget,
        timestamp: Date.now(),
        retryCount: 0,
        status: "pending",
        localId: budget._id,
      });

      toast.success("Budget updated successfully");

      // Trigger background sync
      processSyncQueue(budget.userId).catch(console.error);

      onClose();
    } catch (error) {
      console.error("Error updating budget:", error);
      toast.error("Failed to update budget");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !budget || !category) return null;

  // Parse month for display
  const monthDate = new Date(budget.month + "-01");
  const monthDisplay = format(monthDate, "MMMM yyyy");

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-gradient-to-br from-white via-gray-50 to-indigo-50/30 dark:from-gray-800 dark:via-gray-800 dark:to-indigo-900/20 rounded-2xl max-w-md w-full animate-in slide-in-from-bottom zoom-in duration-300">
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Budget</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Category (readonly) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category
            </label>
            <div className="px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl text-gray-700 dark:text-gray-300">
              {category.name}
            </div>
          </div>

          {/* Month (readonly) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Month
            </label>
            <div className="px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl text-gray-700 dark:text-gray-300">
              {monthDisplay}
            </div>
          </div>

          {/* Amount (editable) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Budget Amount *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                ₹
              </span>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all text-gray-900 dark:text-white"
                placeholder="0.00"
                step="0.01"
                min="0"
                required
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !amount}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-lg shadow-indigo-500/50"
            >
              {isSubmitting ? "Updating..." : "Update Budget"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
