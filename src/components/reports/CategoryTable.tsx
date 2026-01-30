"use client";

import { getIconComponent } from "@/lib/types";

interface CategoryData {
  name: string;
  value: number;
  color: string;
  icon?: string;
}

interface CategoryTableProps {
  data: CategoryData[];
}

export default function CategoryTable({ data }: CategoryTableProps) {
  const sortedData = [...data].sort((a, b) => b.value - a.value);

  return (
    <div className="bg-gradient-to-br from-white via-gray-50 to-indigo-50/20 dark:from-gray-800 dark:via-gray-800 dark:to-indigo-900/10 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 animate-in fade-in slide-in-from-bottom duration-500">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        Category Details
      </h2>
      <div className="space-y-3">
        {sortedData.map((category, index) => {
          const Icon = getIconComponent(category.icon || "HelpCircle");
          return (
            <div
              key={category.name}
              className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-700/30 rounded-lg hover:from-gray-100 hover:to-gray-200/50 dark:hover:from-gray-700 dark:hover:to-gray-600/50 transition-all duration-300 hover:shadow-md hover:scale-[1.02] animate-in slide-in-from-left duration-300"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: category.color }}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="font-medium text-gray-900 dark:text-white">
                  {category.name}
                </span>
              </div>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                ₹{category.value.toFixed(2)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
