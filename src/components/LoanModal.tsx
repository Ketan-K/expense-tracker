"use client";

import { useState } from "react";
import { db, LocalLoan } from "@/lib/db";
import { toast } from "sonner";
import { processSyncQueue } from "@/lib/syncUtils";
import { generateObjectId } from "@/lib/idGenerator";
import { t } from "@/lib/terminology";
import Modal from "./shared/Modal";
import ModalActions from "./shared/ModalActions";
import dynamic from "next/dynamic";

const LoanForm = dynamic(() => import("@/components/LoanForm"), { ssr: false });

interface LoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  loan?: LocalLoan | null;
  mode?: "add" | "edit";
}

export default function LoanModal({ isOpen, onClose, userId, loan, mode = "add" }: LoanModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = mode === "edit" || !!loan;

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
      const principal = parseFloat(formData.principalAmount);
      const now = new Date();

      if (isEditMode && loan) {
        // Update existing loan
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
      } else {
        // Create new loan
        const loanId = generateObjectId();
        const newLoan: LocalLoan = {
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

        await db.loans.add(newLoan);

        await db.syncQueue.add({
          action: "CREATE",
          collection: "loans",
          data: newLoan,
          timestamp: Date.now(),
          retryCount: 0,
          status: "pending",
          localId: loanId,
        });

        toast.success("Loan created successfully!");
        if (navigator.onLine) {
          processSyncQueue(userId);
        }
      }

      onClose();
    } catch (error) {
      console.error(`Error ${isEditMode ? "updating" : "creating"} loan:`, error);
      toast.error(`Failed to ${isEditMode ? "update" : "create"} loan`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const initialData = loan
    ? {
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
      }
    : undefined;

  const title = isEditMode ? "Edit Loan" : `${t.add} ${t.loans}`;
  const submitLabel = isEditMode ? "Update Loan" : `${t.add} ${t.loans}`;

  return (
    <Modal
      isOpen={isOpen && (!isEditMode || !!loan)}
      onClose={onClose}
      title={title}
      footer={
        <ModalActions
          formId="loan-form"
          onCancel={onClose}
          isSubmitting={isSubmitting}
          submitLabel={submitLabel}
          submitClassName="bg-gradient-to-r from-app-loans to-app-loans-end shadow-orange-500/50 hover:shadow-orange-500/60"
        />
      }
      gradientFrom="from-app-loans-light"
      gradientTo="to-app-loans-light-end"
      gradientDark="dark:to-app-loans-dark"
      maxWidth={isEditMode ? "2xl" : "md"}
      maxHeight="90vh"
    >
      <div className="p-6">
        <LoanForm
          initialData={initialData}
          userId={loan?.userId || userId}
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
