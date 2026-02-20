"use client";

import { useAuth } from "@/lib/auth";
import { useRouter, useParams } from "next/navigation";
import { db, LocalLoan } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Trash2,
  AlertCircle,
  Pencil,
  Archive,
} from "lucide-react";
import { toast } from "sonner";
import ConfirmDialog from "@/components/ConfirmDialog";
import { processSyncQueue } from "@/lib/syncUtils";
import EditLoanModal from "@/components/EditLoanModal";
import { useConfirm } from "@/hooks/useConfirm";

export default function LoanDetailsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const loanId = params.id as string;
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);
  const [editingLoan, setEditingLoan] = useState<LocalLoan | null>(null);
  const { isConfirmOpen, options, handleConfirm, handleCancel, confirm } = useConfirm();

  const loan = useLiveQuery(() => db.loans.get(loanId), [loanId]);

  const payments = useLiveQuery(
    () => db.loanPayments.where("loanId").equals(loanId).reverse().sortBy("paymentDate"),
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
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Loan not found
            </h2>
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(date));
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!user?.id) return;

    try {
      const payment = await db.loanPayments.get(paymentId);
      if (!payment) {
        toast.error("Payment not found");
        return;
      }

      // Update loan outstanding amount
      const newOutstanding = (loan.outstandingAmount || 0) + payment.amount;
      if (!loan._id) return;
      await db.loans.update(loan._id, {
        outstandingAmount: newOutstanding,
        status: newOutstanding > 0 ? "active" : "paid",
        updatedAt: new Date(),
      });

      // Delete payment
      await db.loanPayments.delete(paymentId);

      // Add to sync queue
      await db.syncQueue.add({
        action: "DELETE",
        collection: "loanPayments",
        data: { _id: paymentId },
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
          status: newOutstanding > 0 ? "active" : "paid",
          updatedAt: new Date(),
        },
        timestamp: Date.now(),
        retryCount: 0,
        status: "pending",
        localId: loan._id,
      });

      toast.success("Payment deleted successfully");

      if (navigator.onLine && user?.id) {
        processSyncQueue(user.id);
      }

      setDeleteConfirmOpen(false);
      setPaymentToDelete(null);
    } catch (error) {
      console.error("Error deleting payment:", error);
      toast.error("Failed to delete payment");
    }
  };

  const handleEditLoan = () => {
    if (loan) {
      setEditingLoan(loan);
    }
  };

  const handleArchiveLoan = async () => {
    const confirmed = await confirm({
      title: "Archive Loan?",
      message:
        "This loan will be archived and hidden from your active loans. You can restore it later from the archived view.",
      confirmText: "Archive",
      variant: "warning",
    });

    if (!confirmed || !user?.id || !loan._id) return;

    try {
      // Archive loan in IndexedDB
      await db.loans.update(loan._id, {
        isArchived: true,
        archivedAt: new Date(),
        updatedAt: new Date(),
      });

      // Add to sync queue
      await db.syncQueue.add({
        action: "ARCHIVE",
        collection: "loans",
        data: { _id: loan._id },
        timestamp: Date.now(),
        retryCount: 0,
        status: "pending",
        localId: loan._id,
      });

      toast.success("Loan archived successfully");

      // Process sync queue if online
      if (navigator.onLine) {
        processSyncQueue(user.id);
      }

      // Navigate back to loans list
      router.push("/dashboard/loans");
    } catch (error) {
      console.error("Error archiving loan:", error);
      toast.error("Failed to archive loan");
    }
  };

  const totalPaid = loan.principalAmount - (loan.outstandingAmount || 0);
  const paymentProgress = (totalPaid / loan.principalAmount) * 100;

  const getStatusBadge = () => {
    if (loan.status === "paid") {
      return (
        <span className="px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          Paid
        </span>
      );
    }
    if (loan.status === "overdue") {
      return (
        <span className="px-3 py-1 text-sm font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          Overdue
        </span>
      );
    }
    return (
      <span className="px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
        Active
      </span>
    );
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-orange-900/10">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.push("/dashboard/loans")}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 flex items-center gap-2"
            >
              ← Back to Loans
            </button>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div
                    className={`p-4 rounded-2xl ${
                      loan.direction === "given"
                        ? "bg-gradient-to-br from-orange-500 to-red-600"
                        : "bg-gradient-to-br from-blue-500 to-indigo-600"
                    }`}
                  >
                    {loan.direction === "given" ? (
                      <TrendingUp className="w-8 h-8 text-white" />
                    ) : (
                      <TrendingDown className="w-8 h-8 text-white" />
                    )}
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                      {loan.contactName}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      {loan.direction === "given" ? "I Gave (Lent)" : "I Took (Borrowed)"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge()}
                  {!loan.isArchived && (
                    <div className="flex gap-2">
                      <button
                        onClick={handleEditLoan}
                        className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        title="Edit loan"
                      >
                        <Pencil className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      </button>
                      <button
                        onClick={handleArchiveLoan}
                        className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        title="Archive loan"
                      >
                        <Archive className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {loan.description && (
                <p className="text-gray-700 dark:text-gray-300 mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  {loan.description}
                </p>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Principal Amount</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(loan.principalAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Outstanding</p>
                  <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
                    {formatCurrency(loan.outstandingAmount || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Paid So Far</p>
                  <p className="text-xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(totalPaid)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Interest Rate</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {loan.interestRate ? `${loan.interestRate}%` : "0%"}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Payment Progress
                  </span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {paymentProgress.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-app-income to-app-income-end h-3 rounded-full transition-all"
                    style={{ width: `${Math.min(paymentProgress, 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Started: {formatDate(loan.startDate)}</span>
                </div>
                {loan.dueDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Due: {formatDate(loan.dueDate)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Payments Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Payment History</h2>
              {loan.status !== "paid" && (
                <button
                  onClick={() => router.push(`/dashboard/loans/${loan._id}/payments/add`)}
                  className="px-4 py-2 bg-gradient-to-r from-app-income to-app-income-end text-white rounded-xl hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Payment
                </button>
              )}
            </div>

            {!payments || payments.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No payments yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Record your first payment to track this loan
                </p>
                {loan.status !== "paid" && (
                  <button
                    onClick={() => router.push(`/dashboard/loans/${loan._id}/payments/add`)}
                    className="px-6 py-3 bg-gradient-to-r from-app-income to-app-income-end text-white rounded-xl hover:shadow-lg transition-all"
                  >
                    Add First Payment
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {payments.map(payment => (
                  <div
                    key={payment._id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                        <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(payment.amount)}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(payment.date || payment.createdAt)}
                          {payment.paymentMethod && ` • ${payment.paymentMethod}`}
                        </p>
                        {payment.notes && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {payment.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (payment._id) {
                          setPaymentToDelete(payment._id);
                          setDeleteConfirmOpen(true);
                        }
                      }}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                      title="Delete payment"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setPaymentToDelete(null);
        }}
        onConfirm={() => {
          if (paymentToDelete) {
            handleDeletePayment(paymentToDelete);
          }
        }}
        title="Delete Payment"
        message="Are you sure you want to delete this payment? This will increase the outstanding amount."
        confirmText="Delete"
      />

      <EditLoanModal
        loan={editingLoan}
        isOpen={!!editingLoan}
        onClose={() => setEditingLoan(null)}
      />

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        title={options.title}
        message={options.message}
        confirmText={options.confirmText}
        cancelText={options.cancelText}
        variant={options.variant}
      />
    </DashboardLayout>
  );
}
