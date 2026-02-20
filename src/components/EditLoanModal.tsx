"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { db, LocalLoan } from "@/lib/db";
import { toast } from "sonner";
import { processSyncQueue } from "@/lib/syncUtils";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";

const LoanForm = dynamic(() => import("@/components/LoanForm"), { ssr: false });

interface EditLoanModalProps {
  loan: LocalLoan | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditLoanModal({ loan, isOpen, onClose }: EditLoanModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: {
    contactId?: string;
    contactName: string;
    direction: "given" | "taken";
    principalAmount: string;
    interestRate?: string;
    startDate: string;
    dueDate?: string;
    description: string;
  }) => {
    if (!loan) return;

    setIsSubmitting(true);
    try {
      const principal = parseFloat(formData.principalAmount);
      const now = new Date();

      const updatedLoan: LocalLoan = {
        ...loan,
        contactId: formData.contactId,
        contactName: formData.contactName,
        direction: formData.direction,
        principalAmount: principal,
        // Update outstanding amount proportionally if principal changed
        outstandingAmount:
          loan.principalAmount !== principal
            ? (loan.outstandingAmount / loan.principalAmount) * principal
            : loan.outstandingAmount,
        interestRate: formData.interestRate ? parseFloat(formData.interestRate) : undefined,
        startDate: new Date(formData.startDate),
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
        description: formData.description || undefined,
        updatedAt: now,
      };

      await db.loans.put(updatedLoan);

      await db.syncQueue.add({
        action: "UPDATE",
        collection: "loans",
        data: updatedLoan,
        timestamp: Date.now(),
        retryCount: 0,
        status: "pending",
        localId: loan._id,
      });

      toast.success("Loan updated successfully!");

      if (navigator.onLine) {
        processSyncQueue(loan.userId);
      }

      onClose();
    } catch (error) {
      console.error("Error updating loan:", error);
      toast.error("Failed to update loan");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !loan) return null;

  const initialData = {
    contactId: loan.contactId,
    contactName: loan.contactName,
    direction: loan.direction,
    principalAmount: loan.principalAmount.toString(),
    interestRate: loan.interestRate?.toString() || "",
    startDate:
      loan.startDate instanceof Date
        ? loan.startDate.toISOString().split("T")[0]
        : new Date(loan.startDate).toISOString().split("T")[0],
    dueDate: loan.dueDate
      ? loan.dueDate instanceof Date
        ? loan.dueDate.toISOString().split("T")[0]
        : new Date(loan.dueDate).toISOString().split("T")[0]
      : "",
    description: loan.description || "",
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
            className="bg-gradient-to-br from-white via-gray-50 to-orange-50/30 dark:from-gray-800 dark:via-gray-800 dark:to-orange-900/20 rounded-2xl max-w-2xl w-full max-h-[85vh] sm:max-h-[90vh] overflow-y-auto my-auto shadow-2xl"
          >
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Loan</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="p-6">
              <LoanForm
                initialData={initialData}
                userId={loan.userId}
                onSubmit={handleSubmit}
                onCancel={onClose}
                submitLabel="Update Loan"
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
