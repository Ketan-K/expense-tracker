"use client";

import { useState } from "react";
import { db, LocalExpense } from "@/lib/db";
import { toast } from "sonner";
import { processSyncQueue } from "@/lib/syncUtils";
import { generateObjectId } from "@/lib/idGenerator";
import ExpenseForm from "./ExpenseForm";
import Modal from "./shared/Modal";
import ModalActions from "./shared/ModalActions";
import { t } from "@/lib/terminology";

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: { _id?: string; name: string; icon: string; color: string }[];
  userId: string;
  expense?: LocalExpense | null;
  mode?: "add" | "edit";
}

export default function ExpenseModal({
  isOpen,
  onClose,
  categories,
  userId,
  expense,
  mode = "add",
}: ExpenseModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = mode === "edit" || !!expense;

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
      if (isEditMode && expense) {
        // Update existing expense
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

        await db.expenses.put(updatedExpense);

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
        processSyncQueue(expense.userId).catch(console.error);
      } else {
        // Create new expense
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

        await db.expenses.add(newExpense);

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
        processSyncQueue(userId).catch(console.error);
      }

      onClose();
    } catch (error) {
      console.error(`Error ${isEditMode ? "updating" : "adding"} expense:`, error);
      toast.error(
        `Failed to ${isEditMode ? "update" : "add"} ${isEditMode ? "transaction" : "expense"}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const title = isEditMode ? "Edit Transaction" : `${t.add} ${t.expenses}`;
  const submitLabel = isEditMode ? "Update Transaction" : `${t.add} ${t.expenses}`;

  return (
    <Modal
      isOpen={isOpen && (!isEditMode || !!expense)}
      onClose={onClose}
      title={title}
      footer={
        <ModalActions
          formId="expense-form"
          onCancel={onClose}
          isSubmitting={isSubmitting}
          submitLabel={submitLabel}
          loadingText="Saving..."
        />
      }
      gradientFrom="from-app-expenses-light"
      gradientTo="to-app-expenses-light-end"
      gradientDark="dark:to-app-expenses-dark"
    >
      <div className="p-6">
        <ExpenseForm
          initialData={initialData}
          categories={categories}
          onSubmit={handleSubmit}
          onCancel={onClose}
          submitLabel={submitLabel}
          isSubmitting={isSubmitting}
          showCancel={false}
          userId={expense?.userId || userId}
        />
      </div>
    </Modal>
  );
}
