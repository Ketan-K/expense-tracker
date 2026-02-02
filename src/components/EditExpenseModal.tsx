"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { db, LocalExpense } from "@/lib/db";
import { toast } from "sonner";
import { processSyncQueue } from "@/lib/syncUtils";
import ExpenseForm from "./ExpenseForm";

interface EditExpenseModalProps {
  expense: LocalExpense | null;
  isOpen: boolean;
  onClose: () => void;
  categories: { _id?: string; name: string; icon: string; color: string }[];
}

export default function EditExpenseModal({
  expense,
  isOpen,
  onClose,
  categories,
}: EditExpenseModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: {
    date: string;
    amount: string;
    category: string;
    description: string;
    paymentMethod: string;
    type?: "expense" | "income";
  }) => {
    if (!expense) return;

    setIsSubmitting(true);
    try {
      const updatedExpense: LocalExpense = {
        ...expense,
        amount: parseFloat(formData.amount),
        category: formData.category,
        description: formData.description,
        paymentMethod: formData.paymentMethod,
        date: new Date(formData.date),
        type: formData.type || expense.type || "expense",
        updatedAt: new Date(),
      };

      // Update in IndexedDB
      await db.expenses.put(updatedExpense);

      // Add to sync queue
      await db.syncQueue.add({
        action: "UPDATE",
        collection: "expenses",
        data: updatedExpense,
        timestamp: Date.now(),
        retryCount: 0,
        status: "pending",
        localId: expense._id,
      });

      toast.success("Transaction updated");

      // Trigger background sync
      processSyncQueue(expense.userId).catch(console.error);

      onClose();
    } catch (error) {
      console.error("Error updating expense:", error);
      toast.error("Failed to update transaction");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !expense) return null;

  const initialData = expense
    ? {
        date:
          expense.date instanceof Date
            ? expense.date.toISOString().split("T")[0]
            : new Date(expense.date).toISOString().split("T")[0],
        amount: expense.amount.toString(),
        category: expense.category,
        description: expense.description || "",
        paymentMethod: expense.paymentMethod || "upi",
        type: expense.type || "expense",
      }
    : undefined;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 pb-20 sm:pb-4 animate-in fade-in duration-200">
      <div className="bg-gradient-to-br from-white via-gray-50 to-indigo-50/30 dark:from-gray-800 dark:via-gray-800 dark:to-indigo-900/20 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom zoom-in duration-300">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Edit Transaction
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6">
          <ExpenseForm
            initialData={initialData}
            categories={categories}
            onSubmit={handleSubmit}
            onCancel={onClose}
            submitLabel="Update Transaction"
            isSubmitting={isSubmitting}
            showCancel={true}
            userId={expense.userId}
          />
        </div>
      </div>
    </div>
  );
}
