"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { db, LocalIncome } from "@/lib/db";
import { toast } from "sonner";
import { processSyncQueue } from "@/lib/syncUtils";
import { generateObjectId } from "@/lib/idGenerator";

interface AddIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export default function AddIncomeModal({
  isOpen,
  onClose,
  userId,
}: AddIncomeModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: {
    date: string;
    amount: string;
    source: string;
    category?: string;
    description: string;
    taxable: boolean;
    recurring: boolean;
  }) => {
    setIsSubmitting(true);
    try {
      const incomeId = generateObjectId();
      const now = new Date();

      const income: LocalIncome = {
        _id: incomeId,
        userId: userId,
        date: new Date(formData.date),
        amount: parseFloat(formData.amount),
        source: formData.source,
        category: formData.category || undefined,
        description: formData.description || undefined,
        taxable: formData.taxable,
        recurring: formData.recurring,
        synced: false,
        createdAt: now,
        updatedAt: now,
      };

      await db.incomes.add(income);

      await db.syncQueue.add({
        action: "CREATE",
        collection: "incomes",
        data: income,
        timestamp: Date.now(),
        retryCount: 0,
        status: "pending",
        localId: incomeId,
      });

      toast.success("Income added successfully!");

      if (navigator.onLine) {
        processSyncQueue(userId);
      }

      onClose();
    } catch (error) {
      console.error("Error adding income:", error);
      toast.error("Failed to add income");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const IncomeForm = require("@/components/IncomeForm").default;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 pt-4 pb-24 sm:pb-4 animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-gradient-to-br from-white via-gray-50 to-green-50/30 dark:from-gray-800 dark:via-gray-800 dark:to-green-900/20 rounded-2xl max-w-md w-full max-h-[85vh] sm:max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom zoom-in duration-300 my-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Add Income
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6">
          <IncomeForm
            onSubmit={handleSubmit}
            onCancel={onClose}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
}
