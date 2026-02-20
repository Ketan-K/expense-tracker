"use client";

import { useState } from "react";
import { db, LocalIncome } from "@/lib/db";
import { toast } from "sonner";
import { processSyncQueue } from "@/lib/syncUtils";
import { generateObjectId } from "@/lib/idGenerator";
import { t } from "@/lib/terminology";
import Modal from "./shared/Modal";
import ModalActions from "./shared/ModalActions";
import dynamic from "next/dynamic";

const IncomeForm = dynamic(() => import("@/components/IncomeForm"), { ssr: false });

interface IncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  income?: LocalIncome | null;
  mode?: "add" | "edit";
}

export default function IncomeModal({
  isOpen,
  onClose,
  userId,
  income,
  mode = "add",
}: IncomeModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = mode === "edit" || !!income;

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
      const now = new Date();

      if (isEditMode && income) {
        // Update existing income
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
      } else {
        // Create new income
        const incomeId = generateObjectId();
        const newIncome: LocalIncome = {
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

        await db.incomes.add(newIncome);

        await db.syncQueue.add({
          action: "CREATE",
          collection: "incomes",
          data: newIncome,
          timestamp: Date.now(),
          retryCount: 0,
          status: "pending",
          localId: incomeId,
        });

        toast.success("Income added successfully!");
        if (navigator.onLine) {
          processSyncQueue(userId);
        }
      }

      onClose();
    } catch (error) {
      console.error(`Error ${isEditMode ? "updating" : "adding"} income:`, error);
      toast.error(`Failed to ${isEditMode ? "update" : "add"} income`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const initialData = income
    ? {
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
      }
    : undefined;

  const title = isEditMode ? "Edit Income" : `${t.add} ${t.income}`;
  const submitLabel = isEditMode ? "Update Income" : `${t.add} ${t.income}`;

  return (
    <Modal
      isOpen={isOpen && (!isEditMode || !!income)}
      onClose={onClose}
      title={title}
      footer={
        <ModalActions
          formId="income-form"
          onCancel={onClose}
          isSubmitting={isSubmitting}
          submitLabel={submitLabel}
          cancelLabel={t.cancel}
          submitClassName="bg-gradient-to-r from-app-income to-app-income-end shadow-green-500/50 hover:shadow-green-500/60"
        />
      }
      gradientFrom="from-app-income-light"
      gradientTo="to-app-income-light-end"
      gradientDark="dark:to-app-income-dark"
      maxWidth="2xl"
    >
      <div className="p-6">
        <IncomeForm
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={onClose}
          submitLabel={submitLabel}
          isSubmitting={isSubmitting}
          showCancel={false}
        />
      </div>
    </Modal>
  );
}
