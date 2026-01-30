"use client";

import { useState, useEffect } from "react";
import ReportsViewTabs from "./ReportsViewTabs";
import StatsCards from "./StatsCards";
import CategoryPieChart from "./CategoryPieChart";
import DailyTrendChart from "./DailyTrendChart";
import CategoryBarChart from "./CategoryBarChart";
import CategoryTable from "./CategoryTable";
import TransactionsList from "./TransactionsList";
import ExportButtons from "./ExportButtons";

interface CategoryData {
  name: string;
  value: number;
  color: string;
  icon?: string;
}

interface DailyData {
  date: string;
  amount: number;
}

interface Transaction {
  id: string;
  amount: number;
  category: string;
  categoryColor: string;
  categoryIcon?: string;
  description: string;
  date: string;
}

interface ReportsClientProps {
  categoryData: CategoryData[];
  dailyData: DailyData[];
  transactions: Transaction[];
  totalSpent: number;
  dailyAverage: number;
  selectedMonth: Date;
  initialView?: "overview" | "trends" | "transactions";
}

export default function ReportsClient({
  categoryData,
  dailyData,
  transactions,
  totalSpent,
  dailyAverage,
  selectedMonth,
  initialView = "overview",
}: ReportsClientProps) {
  const [activeView, setActiveView] = useState<"overview" | "trends" | "transactions">(initialView);
  useEffect(() => {
    const savedView = sessionStorage.getItem('dashboardActiveView') as "overview" | "trends" | "transactions" | null;
    if (savedView) {
      setActiveView(savedView);
      sessionStorage.removeItem('dashboardActiveView');
    }
  }, []);
  return (
    <div className="space-y-6">
      {/* View Tabs */}
      <ReportsViewTabs activeView={activeView} onViewChange={setActiveView} />

      {/* Stats Cards */}
      <StatsCards
        totalSpent={totalSpent}
        dailyAverage={dailyAverage}
        categoryCount={categoryData.length}
      />

      {/* Overview View */}
      {activeView === "overview" && (
        <div className="space-y-6">
          <CategoryPieChart data={categoryData} />
          <CategoryTable data={categoryData} />
        </div>
      )}

      {/* Trends View */}
      {activeView === "trends" && (
        <div className="space-y-6">
          <DailyTrendChart data={dailyData} />
          <CategoryBarChart data={categoryData} />
        </div>
      )}

      {/* All Transactions View */}
      {activeView === "transactions" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <ExportButtons selectedMonth={selectedMonth} />
          </div>
          <TransactionsList transactions={transactions} />
        </div>
      )}
    </div>
  );
}
