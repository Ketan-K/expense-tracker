"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

interface CategoryPieChartProps {
  data: CategoryData[];
}

export default function CategoryPieChart({ data }: CategoryPieChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Category Breakdown</h2>
        <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
          No expenses to display
        </div>
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const sortedData = [...data].sort((a, b) => b.value - a.value);

  return (
    <div className="bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/20 dark:from-gray-800 dark:via-indigo-900/10 dark:to-purple-900/5 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 animate-in fade-in slide-in-from-bottom duration-500">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Category Breakdown</h2>
      
      {/* Pie Chart without labels */}
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number | undefined) => value ? `₹${value.toFixed(2)}` : '₹0.00'}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              color: '#111827',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
            labelStyle={{
              color: '#111827',
              fontWeight: 600
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Category List Below Chart */}
      <div className="mt-4 space-y-2">
        {sortedData.map((category, index) => {
          const percentage = ((category.value / total) * 100).toFixed(1);
          return (
            <div 
              key={index}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center gap-2 flex-1">
                <div 
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: category.color }}
                />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {category.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {percentage}%
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  ₹{category.value.toFixed(0)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
