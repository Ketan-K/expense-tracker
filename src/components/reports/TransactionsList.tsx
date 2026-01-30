"use client";

import { format } from "date-fns";
import { getIconComponent } from "@/lib/types";

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
}

export default function TransactionsList({ transactions }: TransactionsListProps) {
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
        {transactions.map((transaction) => {
          const Icon = getIconComponent(transaction.categoryIcon || "HelpCircle");
          return (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: transaction.categoryColor }}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">
                    {transaction.description}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {transaction.category} • {format(new Date(transaction.date), "MMM dd, yyyy")}
                  </p>
                </div>
              </div>
              <span className="text-lg font-semibold text-gray-900 dark:text-white ml-4">
                ₹{transaction.amount.toFixed(2)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
