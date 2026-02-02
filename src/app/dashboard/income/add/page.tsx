"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db, LocalIncome } from "@/lib/db";
import { toast } from "sonner";
import { generateObjectId } from "@/lib/idGenerator";
import { processSyncQueue } from "@/lib/syncUtils";
import DashboardLayout from "@/components/DashboardLayout";
import { TrendingUp, Plus } from "lucide-react";
import { useState } from "react";

export default function AddIncomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSubmit = async (formData: {
    date: string;
    amount: string;
    source: string;
    category?: string;
    description: string;
    taxable: boolean;
    recurring: boolean;
  }) => {
    if (!session?.user?.id) return;

    setIsSubmitting(true);
    try {
      const incomeId = generateObjectId();
      const now = new Date();

      const income: LocalIncome = {
        _id: incomeId,
        userId: session.user.id,
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

      if (navigator.onLine && session.user.id) {
        processSyncQueue(session.user.id);
      }

      router.push("/dashboard/income");
    } catch (error) {
      console.error("Error adding income:", error);
      toast.error("Failed to add income");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dynamic import to avoid SSR issues
  const IncomeForm = require("@/components/IncomeForm").default;

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-green-900/10">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 flex items-center gap-2"
            >
              ← Back
            </button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              Add Income
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Record your earnings and income sources
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700">
            <IncomeForm
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
