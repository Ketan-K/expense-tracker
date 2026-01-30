"use client";

import { format } from "date-fns";
import { getIconComponent } from "@/lib/types";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

interface Transaction {
  id: string;
  amount: number;
  category: string;
  categoryColor: string;
  categoryIcon?: string;
  description: string;
  date: string;
}

interface TransactionsListProps {
  transactions: Transaction[];
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transactionId: string) => void;
}

export default function TransactionsList({ transactions, onEdit, onDelete }: TransactionsListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (transactions.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          All Transactions
        </h2>
        <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
          No transactions to display
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        All Transactions ({transactions.length})
      </h2>
      <div className="space-y-2 max-h-[500px] overflow-y-auto scrollbar-thin pr-2">
        {transactions.map((transaction, index) => {
          const Icon = getIconComponent(transaction.categoryIcon || "HelpCircle");
          return (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-700/30 rounded-lg hover:from-gray-100 hover:to-gray-200/50 dark:hover:from-gray-700 dark:hover:to-gray-600/50 transition-all duration-300 group hover:shadow-md hover:scale-[1.02] animate-in slide-in-from-right duration-300"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: transaction.categoryColor }}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">
                    {transaction.description || "No description"}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {transaction.category} • {format(new Date(transaction.date), "MMM dd, yyyy")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  ₹{transaction.amount.toFixed(2)}
                </span>
                {(onEdit || onDelete) && (
                  <div className="flex items-center gap-1">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(transaction)}
                        className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => {
                          if (window.confirm("Are you sure you want to delete this transaction?")) {
                            setDeletingId(transaction.id);
                            onDelete(transaction.id);
                          }
                        }}
                        disabled={deletingId === transaction.id}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
