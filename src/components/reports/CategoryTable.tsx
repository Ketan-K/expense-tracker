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
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        Category Details
      </h2>
      <div className="space-y-3">
        {sortedData.map((category) => {
          const Icon = getIconComponent(category.icon || "HelpCircle");
          return (
            <div
              key={category.name}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
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
