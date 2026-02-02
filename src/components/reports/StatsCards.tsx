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
    <div className="grid grid-cols-3 gap-2 sm:gap-4 animate-in fade-in duration-500">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        const gradients = [
          "from-app-gradient-from to-app-gradient-to",
          "from-app-expenses to-app-expenses-end",
          "from-app-loans to-app-loans-end"
        ];
        return (
          <div
            key={stat.label}
            className={`bg-gradient-to-br ${gradients[index]} rounded-xl p-3 sm:p-4 shadow-lg text-white hover:shadow-2xl transition-all duration-300 hover:scale-105 animate-in slide-in-from-bottom duration-500`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center mb-2 sm:mb-3">
              <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <p className="text-base sm:text-xl lg:text-2xl font-bold mb-1 truncate" title={stat.value}>
              {stat.value}
            </p>
            <p className="text-xs sm:text-sm opacity-90 truncate">{stat.label}</p>
          </div>
        );
      })}
    </div>
  );
}
