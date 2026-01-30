"use client";

import { BarChart3, TrendingUp, List } from "lucide-react";

interface ReportsViewTabsProps {
  activeView: "overview" | "trends" | "transactions";
  onViewChange: (view: "overview" | "trends" | "transactions") => void;
}

export default function ReportsViewTabs({ activeView, onViewChange }: ReportsViewTabsProps) {
  const views = [
    { id: "overview" as const, label: "Overview", icon: BarChart3 },
    { id: "trends" as const, label: "Trends", icon: TrendingUp },
    { id: "transactions" as const, label: "All Transactions", icon: List },
  ];

  return (
    <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
      {views.map((view) => {
        const Icon = view.icon;
        return (
          <button
            key={view.id}
            onClick={() => onViewChange(view.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
              activeView === view.id
                ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{view.label}</span>
          </button>
        );
      })}
    </div>
  );
}
