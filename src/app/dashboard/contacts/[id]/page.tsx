"use client";

import { useAuth } from "@/lib/auth";
import { useRouter, useParams } from "next/navigation";
import { db } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import LoanModal from "@/components/LoanModal";
import {
  Users,
  Phone,
  Mail,
  Heart,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Plus,
} from "lucide-react";
import { motion } from "framer-motion";

export default function ContactDetailsPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useParams();
  const contactId = params.id as string;
  const [showAddLoanModal, setShowAddLoanModal] = useState(false);

  const contact = useLiveQuery(() => db.contacts.get(contactId), [contactId]);

  const loans = useLiveQuery(
    () => db.loans.where("contactId").equals(contactId).reverse().sortBy("createdAt"),
    [contactId]
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

  if (!contact) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Contact not found
            </h2>
            <button
              onClick={() => router.push("/dashboard/contacts")}
              className="text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Back to contacts
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const activeLoans = (loans || []).filter(l => l.status === "active");
  const givenLoans = activeLoans.filter(l => l.direction === "given");
  const takenLoans = activeLoans.filter(l => l.direction === "taken");

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

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(date));
  };

  const getStatusBadge = (status: string) => {
    if (status === "paid") {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          Paid
        </span>
      );
    }
    if (status === "overdue") {
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-900/10">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.push("/dashboard/contacts")}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 flex items-center gap-2"
            >
              ← Back to Contacts
            </button>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                      {contact.name}
                    </h1>
                    {contact.relationship && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mt-2">
                        <Heart className="w-4 h-4" />
                        {contact.relationship}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                {contact.phone && (
                  <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <a
                      href={`tel:${contact.phone}`}
                      className="hover:text-indigo-600 dark:hover:text-indigo-400"
                    >
                      {contact.phone}
                    </a>
                  </div>
                )}
                {contact.email && (
                  <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <a
                      href={`mailto:${contact.email}`}
                      className="hover:text-indigo-600 dark:hover:text-indigo-400"
                    >
                      {contact.email}
                    </a>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <motion.div
                  className="bg-gradient-to-br from-app-loans to-app-loans-end rounded-xl p-4 sm:p-5 text-white"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium opacity-90">I Gave</span>
                    <TrendingUp className="w-5 h-5 opacity-90" />
                  </div>
                  <p className="text-2xl font-bold mb-1">{formatCurrency(totalGiven)}</p>
                  <p className="text-xs opacity-75">
                    {givenLoans.length} active {givenLoans.length === 1 ? "loan" : "loans"}
                  </p>
                </motion.div>

                <motion.div
                  className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-4 sm:p-5 text-white"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium opacity-90">I Took</span>
                    <TrendingDown className="w-5 h-5 opacity-90" />
                  </div>
                  <p className="text-2xl font-bold mb-1">{formatCurrency(totalTaken)}</p>
                  <p className="text-xs opacity-75">
                    {takenLoans.length} active {takenLoans.length === 1 ? "loan" : "loans"}
                  </p>
                </motion.div>

                <motion.div
                  className={`bg-gradient-to-br ${
                    netPosition >= 0
                      ? "from-app-income to-app-income-end"
                      : "from-app-expenses to-app-expenses-end"
                  } rounded-xl p-4 sm:p-5 text-white`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium opacity-90">Net Position</span>
                  </div>
                  <p className="text-2xl font-bold mb-1">{formatCurrency(Math.abs(netPosition))}</p>
                  <p className="text-xs opacity-75">{netPosition >= 0 ? "to receive" : "to pay"}</p>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Loans Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Loan History</h2>
              <button
                onClick={() => setShowAddLoanModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-app-loans to-app-loans-end text-white rounded-xl hover:shadow-lg transition-all flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                New Loan
              </button>
            </div>

            {!loans || loans.length === 0 ? (
              <div className="text-center py-12">
                <TrendingUp className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No loans yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Create your first loan with {contact.name}
                </p>
                <button
                  onClick={() => setShowAddLoanModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-app-loans to-app-loans-end text-white rounded-xl hover:shadow-lg transition-all"
                >
                  Create First Loan
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {loans.map(loan => (
                  <div
                    key={loan._id}
                    onClick={() => router.push(`/dashboard/loans/${loan._id}`)}
                    className="p-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
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
                              {loan.direction === "given" ? "I Gave" : "I Took"}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {formatDate(loan.startDate)}
                            </p>
                          </div>
                        </div>

                        {loan.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {loan.description}
                          </p>
                        )}

                        <div className="flex items-center gap-2">
                          {getStatusBadge(loan.status)}
                          {loan.interestRate && (
                            <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 rounded-full text-xs font-medium">
                              {loan.interestRate}% interest
                            </span>
                          )}
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
      </div>

      {user?.id && (
        <LoanModal
          isOpen={showAddLoanModal}
          onClose={() => setShowAddLoanModal(false)}
          userId={user.id}
          mode="add"
        />
      )}
    </DashboardLayout>
  );
}
