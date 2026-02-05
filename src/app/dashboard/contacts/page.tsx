"use client";

import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { db, LocalContact, LocalLoan } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Users, Plus, Search, Phone, Mail, Heart, TrendingUp, TrendingDown } from "lucide-react";
import AddContactModal from "@/components/AddContactModal";
import { motion } from "framer-motion";

export default function ContactsPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const contacts = useLiveQuery(
    () => db.contacts.where("userId").equals(user?.id || "").toArray(),
    [user?.id]
  );

  const loans = useLiveQuery(
    () => db.loans.where("userId").equals(user?.id || "").toArray(),
    [user?.id]
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

  const filteredContacts = (contacts || []).filter((contact) =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getContactLoans = (contactId: string) => {
    return (loans || []).filter((loan) => loan.contactId === contactId);
  };

  const getContactOutstanding = (contactId: string) => {
    const contactLoans = getContactLoans(contactId);
    const given = contactLoans
      .filter((l) => l.direction === "given" && l.status === "active")
      .reduce((sum, l) => sum + (l.outstandingAmount || 0), 0);
    const taken = contactLoans
      .filter((l) => l.direction === "taken" && l.status === "active")
      .reduce((sum, l) => sum + (l.outstandingAmount || 0), 0);
    return { given, taken, net: given - taken };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-900/10">
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
                <div className="p-3 bg-gradient-to-br from-app-contacts to-app-contacts-end rounded-xl">
                  <Users className="w-7 h-7 text-white" />
                </div>
                Contacts
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Manage your loan contacts
              </p>
            </div>
            <motion.button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-app-contacts to-app-contacts-end text-white rounded-xl hover:shadow-lg transition-all flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus className="w-5 h-5" />
              New Contact
            </motion.button>
          </motion.div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
            <motion.div 
              className="bg-gradient-to-br from-app-contacts to-app-contacts-end rounded-2xl shadow-lg p-6 text-white"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium opacity-90">Total Contacts</h3>
                <Users className="w-5 h-5 opacity-90" />
              </div>
              <p className="text-3xl font-bold mb-1">
                {contacts?.length || 0}
              </p>
              <p className="text-xs opacity-75">Active contacts</p>
            </motion.div>

            <motion.div 
              className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg p-6 text-white"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium opacity-90">With Active Loans</h3>
                <Heart className="w-5 h-5 opacity-90" />
              </div>
              <p className="text-3xl font-bold mb-1">
                {contacts?.filter(c => {
                  const contactLoans = getContactLoans(c._id || "");
                  return contactLoans.some(l => l.status === "active");
                }).length || 0}
              </p>
              <p className="text-xs opacity-75">Currently lending/borrowing</p>
            </motion.div>

            <motion.div 
              className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium opacity-90">Total Transactions</h3>
                <TrendingUp className="w-5 h-5 opacity-90" />
              </div>
              <p className="text-3xl font-bold mb-1">
                {loans?.length || 0}
              </p>
              <p className="text-xs opacity-75">All time loans</p>
            </motion.div>
          </div>

          {/* Search Bar */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
              />
            </div>
          </div>

          {/* Contacts List */}
          {filteredContacts.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center border border-gray-100 dark:border-gray-700">
              <Users className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {searchQuery ? "No contacts found" : "No contacts yet"}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {searchQuery
                  ? "Try a different search term"
                  : "Add your first contact to start tracking loans"}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-app-gradient-from to-app-gradient-to text-white rounded-xl hover:shadow-lg transition-all"
                >
                  Add Your First Contact
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredContacts.map((contact) => {
                if (!contact._id) return null;
                const outstanding = getContactOutstanding(contact._id);
                const contactLoansData = getContactLoans(contact._id);
                const activeLoans = contactLoansData.filter((l) => l.status === "active").length;

                return (
                  <div
                    key={contact._id}
                    onClick={() => router.push(`/dashboard/contacts/${contact._id}`)}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-app-contacts-light to-app-contacts-light-end rounded-xl">
                          <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            {contact.name}
                          </h3>
                          {contact.relationship && (
                            <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 mt-1">
                              <Heart className="w-3 h-3" />
                              {contact.relationship}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      {contact.phone && contact.phone.length > 0 && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Phone className="w-4 h-4" />
                          <span>
                            {Array.isArray(contact.phone)
                              ? contact.phone[contact.primaryPhone ?? 0] || contact.phone[0]
                              : contact.phone}
                          </span>
                          {Array.isArray(contact.phone) && contact.phone.length > 1 && (
                            <span className="text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded">
                              +{contact.phone.length - 1} more
                            </span>
                          )}
                        </div>
                      )}
                      {contact.email && contact.email.length > 0 && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Mail className="w-4 h-4" />
                          <span className="truncate">
                            {Array.isArray(contact.email)
                              ? contact.email[contact.primaryEmail ?? 0] || contact.email[0]
                              : contact.email}
                          </span>
                          {Array.isArray(contact.email) && contact.email.length > 1 && (
                            <span className="text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded">
                              +{contact.email.length - 1} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {contactLoansData.length > 0 && (
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Active Loans</span>
                          <span className="font-semibold text-gray-900 dark:text-white">{activeLoans}</span>
                        </div>

                        {outstanding.given > 0 && (
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                              <TrendingUp className="w-4 h-4" />
                              <span>I Gave</span>
                            </div>
                            <span className="font-semibold text-orange-600 dark:text-orange-400">
                              {formatCurrency(outstanding.given)}
                            </span>
                          </div>
                        )}

                        {outstanding.taken > 0 && (
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                              <TrendingDown className="w-4 h-4" />
                              <span>I Took</span>
                            </div>
                            <span className="font-semibold text-blue-600 dark:text-blue-400">
                              {formatCurrency(outstanding.taken)}
                            </span>
                          </div>
                        )}

                        {outstanding.net !== 0 && (
                          <div className={`flex items-center justify-between text-sm pt-2 border-t border-gray-200 dark:border-gray-700 ${
                            outstanding.net > 0
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}>
                            <span className="font-medium">Net Position</span>
                            <span className="font-bold">
                              {formatCurrency(Math.abs(outstanding.net))}
                              {outstanding.net > 0 ? " to receive" : " to pay"}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {contactLoansData.length === 0 && (
                      <div className="text-center py-2 text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-4">
                        No loans yet
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <AddContactModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        userId={user?.id || ""}
      />
    </DashboardLayout>
  );
}
