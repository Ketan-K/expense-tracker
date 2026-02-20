"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { db, LocalIncome } from "@/lib/db";
import { toast } from "sonner";
import { processSyncQueue } from "@/lib/syncUtils";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";

const IncomeForm = dynamic(() => import("@/components/IncomeForm"), { ssr: false });

interface EditIncomeModalProps {
  income: LocalIncome | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditIncomeModal({ income, isOpen, onClose }: EditIncomeModalProps) {
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
    if (!income) return;

    setIsSubmitting(true);
    try {
      const now = new Date();

      const updatedIncome: LocalIncome = {
        ...income,
        date: new Date(formData.date),
        amount: parseFloat(formData.amount),
        source: formData.source,
        category: formData.category || undefined,
        description: formData.description || undefined,
        taxable: formData.taxable,
        recurring: formData.recurring,
        updatedAt: now,
      };

      await db.incomes.put(updatedIncome);

      await db.syncQueue.add({
        action: "UPDATE",
        collection: "incomes",
        data: updatedIncome,
        timestamp: Date.now(),
        retryCount: 0,
        status: "pending",
        localId: income._id,
      });

      toast.success("Income updated successfully!");

      if (navigator.onLine) {
        processSyncQueue(income.userId);
      }

      onClose();
    } catch (error) {
      console.error("Error updating income:", error);
      toast.error("Failed to update income");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !income) return null;

  const initialData = {
    date:
      income.date instanceof Date
        ? income.date.toISOString().split("T")[0]
        : new Date(income.date).toISOString().split("T")[0],
    amount: income.amount.toString(),
    source: income.source,
    category: income.category || "",
    description: income.description || "",
    taxable: income.taxable || false,
    recurring: income.recurring || false,
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 pt-4 pb-24 sm:pb-4 overflow-y-auto"
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="bg-gradient-to-br from-white via-gray-50 to-green-50/30 dark:from-gray-800 dark:via-gray-800 dark:to-green-900/20 rounded-2xl max-w-2xl w-full max-h-[85vh] sm:max-h-[90vh] overflow-y-auto my-auto shadow-2xl"
          >
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Income</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="p-6">
              <IncomeForm
                initialData={initialData}
                userId={income.userId}
                onSubmit={handleSubmit}
                onCancel={onClose}
                submitLabel="Update Income"
                isSubmitting={isSubmitting}
                showCancel={true}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
