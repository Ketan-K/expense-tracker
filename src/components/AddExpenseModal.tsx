"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { db, LocalExpense } from "@/lib/db";
import { toast } from "sonner";
import { processSyncQueue } from "@/lib/syncUtils";
import { generateObjectId } from "@/lib/idGenerator";
import ExpenseForm from "./ExpenseForm";

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: { _id?: string; name: string; icon: string; color: string }[];
  userId: string;
}

export default function AddExpenseModal({
  isOpen,
  onClose,
  categories,
  userId,
}: AddExpenseModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: {
    date: string;
    amount: string;
    category: string;
    description: string;
    paymentMethod: string;
    type?: "expense" | "income";
  }) => {
    setIsSubmitting(true);
    try {
      const newExpense: LocalExpense = {
        _id: generateObjectId(),
        userId: userId,
        amount: parseFloat(formData.amount),
        category: formData.category,
        description: formData.description,
        paymentMethod: formData.paymentMethod,
        date: new Date(formData.date),
        type: formData.type || "expense",
        createdAt: new Date(),
        updatedAt: new Date(),
        synced: false,
      };

      // Add to IndexedDB
      await db.expenses.add(newExpense);

      // Add to sync queue
      await db.syncQueue.add({
        action: "CREATE",
        collection: "expenses",
        data: newExpense,
        timestamp: Date.now(),
        retryCount: 0,
        status: "pending",
        localId: newExpense._id,
      });

      toast.success("Expense added successfully");

      // Trigger background sync
      processSyncQueue(userId).catch(console.error);

      onClose();
    } catch (error) {
      console.error("Error adding expense:", error);
      toast.error("Failed to add expense");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 pt-4 pb-24 sm:pb-4 animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-gradient-to-br from-white via-gray-50 to-red-50/30 dark:from-gray-800 dark:via-gray-800 dark:to-red-900/20 rounded-2xl max-w-md w-full max-h-[85vh] sm:max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom zoom-in duration-300 my-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Add Expense
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
            categories={categories}
            onSubmit={handleSubmit}
            onCancel={onClose}
            submitLabel="Add Expense"
            isSubmitting={isSubmitting}
            showCancel={true}
            userId={userId}
          />
        </div>
      </div>
    </div>
  );
}
