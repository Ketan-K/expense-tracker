"use client";

import { TrendingUp, Calendar, Tag } from "lucide-react";

interface StatsCardsProps {
  totalSpent: number;
  dailyAverage: number;
  categoryCount: number;
}

export default function StatsCards({ totalSpent, dailyAverage, categoryCount }: StatsCardsProps) {
  const stats = [
    {
      label: "Total Spent",
      value: `₹${totalSpent.toFixed(2)}`,
      icon: TrendingUp,
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-50 dark:bg-red-900/20",
    },
    {
      label: "Daily Average",
      value: `₹${dailyAverage.toFixed(2)}`,
      icon: Calendar,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      label: "Categories",
      value: categoryCount.toString(),
      icon: Tag,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-900/20",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700"
          >
            <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{stat.value}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
          </div>
        );
      })}
    </div>
  );
}
