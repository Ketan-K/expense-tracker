"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { db, LocalLoan } from "@/lib/db";
import { toast } from "sonner";
import { processSyncQueue } from "@/lib/syncUtils";
import { generateObjectId } from "@/lib/idGenerator";

interface AddLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export default function AddLoanModal({
  isOpen,
  onClose,
  userId,
}: AddLoanModalProps) {
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
    setIsSubmitting(true);
    try {
      const loanId = generateObjectId();
      const now = new Date();
      const principal = parseFloat(formData.principalAmount);

      const loan: LocalLoan = {
        _id: loanId,
        userId: userId,
        contactId: formData.contactId,
        contactName: formData.contactName,
        direction: formData.direction,
        principalAmount: principal,
        outstandingAmount: principal,
        interestRate: formData.interestRate ? parseFloat(formData.interestRate) : undefined,
        startDate: new Date(formData.startDate),
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
        status: "active",
        description: formData.description || undefined,
        synced: false,
        createdAt: now,
        updatedAt: now,
      };

      await db.loans.add(loan);

      await db.syncQueue.add({
        action: "CREATE",
        collection: "loans",
        data: loan,
        timestamp: Date.now(),
        retryCount: 0,
        status: "pending",
        localId: loanId,
      });

      toast.success("Loan created successfully!");

      if (navigator.onLine) {
        processSyncQueue(userId);
      }

      onClose();
    } catch (error) {
      console.error("Error creating loan:", error);
      toast.error("Failed to create loan");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const LoanForm = require("@/components/LoanForm").default;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 pb-20 sm:pb-4 animate-in fade-in duration-200">
      <div className="bg-gradient-to-br from-white via-gray-50 to-orange-50/30 dark:from-gray-800 dark:via-gray-800 dark:to-orange-900/20 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom zoom-in duration-300">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Add Loan
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6">
          <LoanForm
            onSubmit={handleSubmit}
            onCancel={onClose}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
}
