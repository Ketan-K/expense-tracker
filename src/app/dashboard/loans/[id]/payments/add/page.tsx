"use client";

import { useAuth } from "@/lib/auth";
import { useRouter, useParams } from "next/navigation";
import { db, LocalLoanPayment } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import { toast } from "sonner";
import { generateObjectId } from "@/lib/idGenerator";
import { processSyncQueue } from "@/lib/syncUtils";
import DashboardLayout from "@/components/DashboardLayout";
import { DollarSign, AlertCircle } from "lucide-react";
import { useState } from "react";

export default function AddLoanPaymentPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useParams();
  const loanId = params.id as string;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loan = useLiveQuery(
    () => db.loans.get(loanId),
    [loanId]
  );

  if (status === "loading") {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (status === "unauthenticated") {
    router.push("/auth/signin");
    return null;
  }

  if (!loan) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Loan not found</h2>
            <button
              onClick={() => router.push("/dashboard/loans")}
              className="text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Back to loans
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const handleSubmit = async (formData: {
    amount: string;
    date: string;
    paymentMethod?: string;
    notes?: string;
  }) => {
    if (!user?.id) return;

    setIsSubmitting(true);
    try {
      const paymentId = generateObjectId();
      const now = new Date();
      const amount = parseFloat(formData.amount);
      const newOutstanding = (loan.outstandingAmount || 0) - amount;

      if (!loan._id) return;

      const payment: LocalLoanPayment = {
        _id: paymentId,
        userId: user!.id,
        loanId: loan._id,
        amount,
        date: new Date(formData.date),
        paymentMethod: formData.paymentMethod || undefined,
        notes: formData.notes || undefined,
        synced: false,
        createdAt: now,
        updatedAt: now,
      };

      await db.loanPayments.add(payment);

      // Update loan
      await db.loans.update(loan._id, {
        outstandingAmount: newOutstanding,
        status: newOutstanding <= 0 ? "paid" : "active",
        updatedAt: now,
      });

      // Add to sync queue
      await db.syncQueue.add({
        action: "CREATE",
        collection: "loanPayments",
        data: payment,
        timestamp: Date.now(),
        retryCount: 0,
        status: "pending",
        localId: paymentId,
      });

      await db.syncQueue.add({
        action: "UPDATE",
        collection: "loans",
        data: {
          _id: loan._id,
          outstandingAmount: newOutstanding,
          status: newOutstanding <= 0 ? "paid" : "active",
          updatedAt: now,
        },
        timestamp: Date.now(),
        retryCount: 0,
        status: "pending",
        localId: loan._id,
      });

      toast.success("Payment recorded successfully!");

      if (navigator.onLine && user?.id) {
        processSyncQueue(user.id);
      }

      router.push(`/dashboard/loans/${loan._id}`);
    } catch (error) {
      console.error("Error recording payment:", error);
      toast.error("Failed to record payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const LoanPaymentForm = require("@/components/LoanPaymentForm").default;

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-green-900/10">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="mb-8">
            <button
              onClick={() => router.push(`/dashboard/loans/${loan._id}`)}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 flex items-center gap-2"
            >
              ← Back to Loan
            </button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg">
                <DollarSign className="w-7 h-7 text-white" />
              </div>
              Record Payment
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Payment for {loan.contactName}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700">
            <LoanPaymentForm
              loanId={loan._id}
              outstandingAmount={loan.outstandingAmount || 0}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
