"use client";

import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { db, LocalLoan } from "@/lib/db";
import { toast } from "sonner";
import { generateObjectId } from "@/lib/idGenerator";
import { processSyncQueue } from "@/lib/syncUtils";
import DashboardLayout from "@/components/DashboardLayout";
import { Handshake } from "lucide-react";
import { useState } from "react";

export default function AddLoanPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAuthenticated) {
    router.push("/auth/signin");
    return null;
  }

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
    if (!user?.id) return;

    setIsSubmitting(true);
    try {
      const loanId = generateObjectId();
      const now = new Date();
      const principal = parseFloat(formData.principalAmount);

      const loan: LocalLoan = {
        _id: loanId,
        userId: user.id,
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

      if (navigator.onLine && user.id) {
        processSyncQueue(user.id);
      }

      router.push("/dashboard/loans");
    } catch (error) {
      console.error("Error creating loan:", error);
      toast.error("Failed to create loan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const LoanForm = require("@/components/LoanForm").default;

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-orange-900/10">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 flex items-center gap-2"
            >
              ← Back
            </button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-lg">
                <Handshake className="w-7 h-7 text-white" />
              </div>
              Create Loan
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Track money you've lent or borrowed
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700">
            <LoanForm
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              userId={user?.id || ""}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
