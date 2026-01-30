"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { db } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import DashboardLayout from "@/components/DashboardLayout";
import { Download, Calendar, PieChart as PieChartIcon } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { toast } from "sonner";

export default function ReportsPage() {
  const { data: session } = useSession();
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    end: format(endOfMonth(new Date()), "yyyy-MM-dd"),
  });

  const expenses = useLiveQuery(
    async () => {
      if (!session?.user?.id) return [];
      
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      
      return await db.expenses
        .where("userId")
        .equals(session.user.id)
        .and((expense) => {
          const expenseDate = new Date(expense.date);
          return expenseDate >= startDate && expenseDate <= endDate;
        })
        .toArray();
    },
    [session?.user?.id, dateRange]
  );

  const categories = useLiveQuery(
    async () => {
      if (!session?.user?.id) return [];
      return await db.categories.where("userId").equals(session.user.id).toArray();
    },
    [session?.user?.id]
  );

  const categoryData = expenses
    ? Object.entries(
        expenses.reduce((acc, expense) => {
          acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
          return acc;
        }, {} as Record<string, number>)
      ).map(([name, value]) => {
        const category = categories?.find((c) => c.name === name);
        return {
          name,
          value,
          color: category?.color || "#6b7280",
        };
      })
    : [];

  const totalSpent = expenses?.reduce((sum, e) => sum + e.amount, 0) || 0;

  const handleExportCSV = async () => {
    try {
      const response = await fetch(
        `/api/export/csv?startDate=${dateRange.start}&endDate=${dateRange.end}`
      );
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `expenses_${dateRange.start}_${dateRange.end}.csv`;
        a.click();
        toast.success("CSV exported successfully!");
      }
    } catch (error) {
      toast.error("Failed to export CSV");
    }
  };

  const handleExportExcel = async () => {
    try {
      const response = await fetch(
        `/api/export/excel?startDate=${dateRange.start}&endDate=${dateRange.end}`
      );
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `expenses_${dateRange.start}_${dateRange.end}.xlsx`;
        a.click();
        toast.success("Excel exported successfully!");
      }
    } catch (error) {
      toast.error("Failed to export Excel");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-5 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Reports & Analytics
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              Analyze your spending patterns
            </p>
          </div>

          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={handleExportCSV}
              className="flex-1 sm:flex-none px-4 sm:px-5 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl active:scale-95 text-sm sm:text-base font-medium cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">CSV</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="flex-1 sm:flex-none px-4 sm:px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl active:scale-95 text-sm sm:text-base font-medium cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Excel</span>
            </button>
          </div>
        </div>

        {/* Date Range Selector */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <span className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300">
                Date Range:
              </span>
            </div>
            <div className="flex items-center gap-3 flex-1">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) =>
                  setDateRange({ ...dateRange, start: e.target.value })
                }
                className="flex-1 px-3 sm:px-4 py-3 text-sm sm:text-base bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-white transition-all"
              />
              <span className="text-gray-500 text-sm">to</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) =>
                  setDateRange({ ...dateRange, end: e.target.value })
                }
                className="flex-1 px-3 sm:px-4 py-3 text-sm sm:text-base bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-white transition-all"
              />
            </div>
          </div>
        </div>

        {/* Total Spent */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 text-white shadow-lg hover:shadow-xl transition-all">
          <div className="flex items-center gap-3 mb-2">
            <PieChartIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            <p className="text-white/80 text-base sm:text-lg">Total Spent</p>
          </div>
          <p className="text-3xl sm:text-4xl lg:text-5xl font-bold">₹{totalSpent.toFixed(2)}</p>
          <p className="text-white/70 mt-2 text-sm sm:text-base">
            {expenses?.length || 0} transactions
          </p>
        </div>

        {/* Pie Chart */}
        {categoryData.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 shadow-lg border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">
              Category Distribution
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${((percent || 0) * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Category Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Category Breakdown
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Category
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Amount
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Percentage
                  </th>
                </tr>
              </thead>
              <tbody>
                {categoryData
                  .sort((a, b) => b.value - a.value)
                  .map((category) => {
                    const percentage = (category.value / totalSpent) * 100;
                    
                    return (
                      <tr
                        key={category.name}
                        className="border-b border-gray-100 dark:border-gray-700 last:border-0"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            <span className="font-medium text-gray-900 dark:text-white">
                              {category.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-gray-900 dark:text-white">
                          ₹{category.value.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400">
                          {percentage.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
