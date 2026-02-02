"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { db, LocalLoan } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Handshake, Plus, TrendingUp, TrendingDown, AlertCircle, Calendar, DollarSign } from "lucide-react";
import { toast } from "sonner";
import AddLoanModal from "@/components/AddLoanModal";

type StatusFilter = "all" | "active" | "paid" | "overdue";
type DirectionFilter = "all" | "given" | "taken";

export default function LoansPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [directionFilter, setDirectionFilter] = useState<DirectionFilter>("all");
  const [showAddModal, setShowAddModal] = useState(false);

  const loans = useLiveQuery(
    () => db.loans.where("userId").equals(session?.user?.id || "").toArray(),
    [session?.user?.id]
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

  const filteredLoans = (loans || []).filter((loan) => {
    if (statusFilter !== "all" && loan.status !== statusFilter) return false;
    if (directionFilter !== "all" && loan.direction !== directionFilter) return false;
    return true;
  });

  const givenLoans = filteredLoans.filter((l) => l.direction === "given");
  const takenLoans = filteredLoans.filter((l) => l.direction === "taken");

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
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-lg">
                  <Handshake className="w-7 h-7 text-white" />
                </div>
                Loans & Udhari
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Track money you've lent or borrowed
              </p>
            </div>
            <button
              onClick={() => router.push("/dashboard/loans/add")}
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              New Loan
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">I Gave (Lent)</h3>
                <TrendingUp className="w-5 h-5 text-orange-500" />
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalGiven)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{givenLoans.length} active loans</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">I Took (Borrowed)</h3>
                <TrendingDown className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalTaken)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{takenLoans.length} active loans</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Net Position</h3>
                <DollarSign className="w-5 h-5 text-indigo-500" />
              </div>
              <p className={`text-3xl font-bold ${netPosition >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatCurrency(Math.abs(netPosition))}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {netPosition >= 0 ? "More lent than borrowed" : "More borrowed than lent"}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Direction</label>
                <div className="flex gap-2">
                  {(["all", "given", "taken"] as DirectionFilter[]).map((dir) => (
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                <div className="flex gap-2">
                  {(["all", "active", "paid", "overdue"] as StatusFilter[]).map((stat) => (
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
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No loans found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {statusFilter === "all" && directionFilter === "all"
                  ? "Create your first loan to start tracking"
                  : "Try adjusting your filters"}
              </p>
              {statusFilter === "all" && directionFilter === "all" && (
                <button
                  onClick={() => router.push("/dashboard/loans/add")}
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl hover:shadow-lg transition-all"
                >
                  Create Your First Loan
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLoans.map((loan) => (
                <div
                  key={loan._id}
                  onClick={() => router.push(`/dashboard/loans/${loan._id}`)}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${
                          loan.direction === "given"
                            ? "bg-orange-100 dark:bg-orange-900/30"
                            : "bg-blue-100 dark:bg-blue-900/30"
                        }`}>
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
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{loan.description}</p>
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

                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                        {formatCurrency(loan.outstandingAmount || 0)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        of {formatCurrency(loan.principalAmount)} outstanding
                      </p>
                      {loan.outstandingAmount !== loan.principalAmount && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                          {formatCurrency(loan.principalAmount - (loan.outstandingAmount || 0))} paid
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

      <AddLoanModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        userId={session?.user?.id || ""}
      />
    </DashboardLayout>
  );
}
