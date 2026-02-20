"use client";

import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { db, LocalLoan } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Handshake,
  Plus,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Calendar,
  DollarSign,
  Pencil,
  Archive,
  MoreVertical,
} from "lucide-react";
import { toast } from "sonner";
import LoanModal from "@/components/LoanModal";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useConfirm } from "@/hooks/useConfirm";
import { motion } from "framer-motion";
import { processSyncQueue } from "@/lib/syncUtils";

type StatusFilter = "all" | "active" | "paid" | "overdue";
type DirectionFilter = "all" | "given" | "taken";

export default function LoansPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [directionFilter, setDirectionFilter] = useState<DirectionFilter>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLoan, setEditingLoan] = useState<LocalLoan | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const { confirm, isOpen: isConfirmOpen, options, handleConfirm, handleCancel } = useConfirm();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    if (openMenuId) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [openMenuId]);

  const loans = useLiveQuery(
    () =>
      db.loans
        .where("userId")
        .equals(user?.id || "")
        .and(loan => (showArchived ? loan.isArchived === true : loan.isArchived !== true))
        .toArray(),
    [user?.id, showArchived]
  );

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

  const filteredLoans = (loans || []).filter(loan => {
    if (statusFilter !== "all" && loan.status !== statusFilter) return false;
    if (directionFilter !== "all" && loan.direction !== directionFilter) return false;
    return true;
  });

  const handleEditLoan = (e: React.MouseEvent, loan: LocalLoan) => {
    e.stopPropagation();
    setEditingLoan(loan);
  };

  const handleArchiveLoan = async (e: React.MouseEvent, loan: LocalLoan) => {
    e.stopPropagation();
    if (!user?.id) return;

    const confirmed = await confirm({
      title: "Archive Loan?",
      message: `Archive the loan ${loan.direction === "given" ? "to" : "from"} ${loan.contactName}? This will also archive all associated payments. It will be permanently deleted after 30 days.`,
      confirmText: "Archive",
      cancelText: "Cancel",
      variant: "warning",
    });

    if (!confirmed) return;

    try {
      // Archive in IndexedDB
      await db.loans.put({
        ...loan,
        isArchived: true,
        archivedAt: new Date(),
        updatedAt: new Date(),
      });

      // Archive all payments for this loan
      const payments = await db.loanPayments
        .where("loanId")
        .equals(loan._id || "")
        .toArray();
      for (const payment of payments) {
        await db.loanPayments.put({
          ...payment,
          isArchived: true,
          archivedAt: new Date(),
          updatedAt: new Date(),
        });
      }

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

      toast.success(
        `Loan archived successfully${payments.length > 0 ? ` (${payments.length} payments also archived)` : ""}`
      );

      // Trigger background sync
      if (navigator.onLine) {
        processSyncQueue(user.id).catch(console.error);
      }
    } catch (error) {
      console.error("Error archiving loan:", error);
      toast.error("Failed to archive loan");
    }
  };

  const givenLoans = filteredLoans.filter(l => l.direction === "given");
  const takenLoans = filteredLoans.filter(l => l.direction === "taken");

  const totalGiven = givenLoans.reduce((sum, l) => sum + (l.outstandingAmount || 0), 0);
  const totalTaken = takenLoans.reduce((sum, l) => sum + (l.outstandingAmount || 0), 0);
  const netPosition = totalGiven - totalTaken;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return "No due date";
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(date));
  };

  const getStatusBadge = (loan: LocalLoan) => {
    if (loan.status === "paid") {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          Paid
        </span>
      );
    }
    if (loan.status === "overdue") {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Overdue
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
        Active
      </span>
    );
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-orange-900/10">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <motion.div
            className="mb-8 flex items-center justify-between"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-app-loans to-app-loans-end rounded-xl">
                  <Handshake className="w-7 h-7 text-white" />
                </div>
                Loans & Udhari{" "}
                {showArchived && (
                  <span className="text-lg font-normal text-gray-500">(Archived)</span>
                )}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Track money you&apos;ve lent or borrowed
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowArchived(!showArchived)}
                className="px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
              >
                {showArchived ? "View Active" : "View Archived"}
              </button>
              <motion.button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-app-loans to-app-loans-end text-white rounded-xl hover:shadow-lg transition-all flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Plus className="w-5 h-5" />
                New Loan
              </motion.button>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
            <motion.div
              className="bg-gradient-to-br from-app-loans to-app-loans-end rounded-2xl shadow-lg p-6 text-white"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium opacity-90">I Gave (Lent)</h3>
                <TrendingUp className="w-5 h-5 opacity-90" />
              </div>
              <p className="text-3xl font-bold mb-1">{formatCurrency(totalGiven)}</p>
              <p className="text-xs opacity-75">{givenLoans.length} active loans</p>
            </motion.div>

            <motion.div
              className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg p-6 text-white"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium opacity-90">I Took (Borrowed)</h3>
                <TrendingDown className="w-5 h-5 opacity-90" />
              </div>
              <p className="text-3xl font-bold mb-1">{formatCurrency(totalTaken)}</p>
              <p className="text-xs opacity-75">{takenLoans.length} active loans</p>
            </motion.div>

            <motion.div
              className={`bg-gradient-to-br ${netPosition >= 0 ? "from-app-income to-app-income-end" : "from-app-expenses to-app-expenses-end"} rounded-2xl shadow-lg p-6 text-white`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium opacity-90">Net Position</h3>
                <DollarSign className="w-5 h-5 opacity-90" />
              </div>
              <p className="text-3xl font-bold mb-1">{formatCurrency(Math.abs(netPosition))}</p>
              <p className="text-xs opacity-75">
                {netPosition >= 0 ? "More lent than borrowed" : "More borrowed than lent"}
              </p>
            </motion.div>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Direction
                </label>
                <div className="flex gap-2">
                  {(["all", "given", "taken"] as DirectionFilter[]).map(dir => (
                    <button
                      key={dir}
                      onClick={() => setDirectionFilter(dir)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        directionFilter === dir
                          ? "bg-orange-500 text-white shadow-md"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      {dir === "all" ? "All" : dir === "given" ? "I Gave" : "I Took"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <div className="flex gap-2">
                  {(["all", "active", "paid", "overdue"] as StatusFilter[]).map(stat => (
                    <button
                      key={stat}
                      onClick={() => setStatusFilter(stat)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        statusFilter === stat
                          ? "bg-indigo-500 text-white shadow-md"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      {stat.charAt(0).toUpperCase() + stat.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Loans List */}
          {filteredLoans.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center border border-gray-100 dark:border-gray-700">
              <Handshake className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No loans found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {statusFilter === "all" && directionFilter === "all"
                  ? "Create your first loan to start tracking"
                  : "Try adjusting your filters"}
              </p>
              {statusFilter === "all" && directionFilter === "all" && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-app-loans to-app-loans-end text-white rounded-xl hover:shadow-lg transition-all"
                >
                  Create Your First Loan
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLoans.map(loan => (
                <div
                  key={loan._id}
                  onClick={() => router.push(`/dashboard/loans/${loan._id}`)}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 pr-16 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all cursor-pointer relative"
                >
                  {/* Action menu */}
                  {!showArchived && (
                    <div className="absolute top-1/2 -translate-y-1/2 right-4 z-20">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === loan._id ? null : loan._id || null);
                        }}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="More actions"
                      >
                        <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      </button>
                      {openMenuId === loan._id && (
                        <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
                          <button
                            onClick={e => {
                              handleEditLoan(e, loan);
                              setOpenMenuId(null);
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300"
                          >
                            <Pencil className="w-4 h-4" />
                            Edit Loan
                          </button>
                          <button
                            onClick={e => {
                              handleArchiveLoan(e, loan);
                              setOpenMenuId(null);
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-sm text-orange-600 dark:text-orange-400"
                          >
                            <Archive className="w-4 h-4" />
                            Archive
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className={`p-2 rounded-lg ${
                            loan.direction === "given"
                              ? "bg-orange-100 dark:bg-orange-900/30"
                              : "bg-blue-100 dark:bg-blue-900/30"
                          }`}
                        >
                          {loan.direction === "given" ? (
                            <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                          ) : (
                            <TrendingDown className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {loan.contactName}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {loan.direction === "given" ? "I Gave" : "I Took"}
                          </p>
                        </div>
                      </div>

                      {loan.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {loan.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Due: {formatDate(loan.dueDate)}</span>
                        </div>
                        {loan.interestRate && (
                          <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 rounded-full text-xs font-medium">
                            {loan.interestRate}% interest
                          </span>
                        )}
                        {getStatusBadge(loan)}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 ml-4 min-w-[140px]">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                        {formatCurrency(loan.outstandingAmount || 0)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        of {formatCurrency(loan.principalAmount)} outstanding
                      </p>
                      {loan.outstandingAmount !== loan.principalAmount && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                          {formatCurrency(loan.principalAmount - (loan.outstandingAmount || 0))}{" "}
                          paid
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <LoanModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        userId={user?.id || ""}
        mode="add"
      />

      <LoanModal
        loan={editingLoan}
        isOpen={!!editingLoan}
        onClose={() => setEditingLoan(null)}
        userId={user?.id || ""}
        mode="edit"
      />

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onConfirm={handleConfirm}
        onClose={handleCancel}
        title={options.title}
        message={options.message}
        confirmText={options.confirmText}
        cancelText={options.cancelText}
        variant={options.variant}
      />
    </DashboardLayout>
  );
}
