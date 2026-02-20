"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, X, ChevronDown } from "lucide-react";

export interface FilterState {
  search: string;
  categories: string[];
  amountRange: { min: number; max: number } | null;
  paymentMethods: string[];
  sortBy: "date-desc" | "date-asc" | "amount-desc" | "amount-asc" | "category";
  showArchived: boolean;
}

interface FilterBarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  availableCategories: string[];
}

const AMOUNT_RANGES = [
  { label: "All", value: null },
  { label: "₹0 - ₹500", value: { min: 0, max: 500 } },
  { label: "₹500 - ₹1,000", value: { min: 500, max: 1000 } },
  { label: "₹1,000 - ₹5,000", value: { min: 1000, max: 5000 } },
  { label: "₹5,000+", value: { min: 5000, max: Infinity } },
];

const PAYMENT_METHODS = ["cash", "card", "upi"];

const SORT_OPTIONS = [
  { label: "Date (Newest)", value: "date-desc" as const },
  { label: "Date (Oldest)", value: "date-asc" as const },
  { label: "Amount (High to Low)", value: "amount-desc" as const },
  { label: "Amount (Low to High)", value: "amount-asc" as const },
  { label: "Category (A-Z)", value: "category" as const },
];

export default function FilterBar({
  filters,
  onFiltersChange,
  availableCategories,
}: FilterBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = (key: keyof FilterState, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleCategory = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category];
    updateFilter("categories", newCategories);
  };

  const togglePaymentMethod = (method: string) => {
    const newMethods = filters.paymentMethods.includes(method)
      ? filters.paymentMethods.filter(m => m !== method)
      : [...filters.paymentMethods, method];
    updateFilter("paymentMethods", newMethods);
  };

  const clearFilters = () => {
    onFiltersChange({
      search: "",
      categories: [],
      amountRange: null,
      paymentMethods: [],
      sortBy: "date-desc",
      showArchived: false,
    });
  };

  const activeFiltersCount =
    (filters.search ? 1 : 0) +
    filters.categories.length +
    (filters.amountRange ? 1 : 0) +
    filters.paymentMethods.length +
    (filters.sortBy !== "date-desc" ? 1 : 0) +
    (filters.showArchived ? 1 : 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
      {/* Search and Toggle */}
      <div className="p-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={filters.search}
              onChange={e => updateFilter("search", e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-white"
            />
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all ${
              isExpanded
                ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 text-indigo-600 dark:text-indigo-400"
                : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
            }`}
          >
            <SlidersHorizontal className="w-5 h-5" />
            <span className="hidden sm:inline font-medium">Filters</span>
            {activeFiltersCount > 0 && (
              <span className="bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
          {/* Show Archived Toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Show Archived Items
            </label>
            <button
              onClick={() => updateFilter("showArchived", !filters.showArchived)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                filters.showArchived ? "bg-indigo-600" : "bg-gray-300 dark:bg-gray-600"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  filters.showArchived ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Categories */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Categories
            </label>
            <div className="flex flex-wrap gap-2">
              {availableCategories.map(category => (
                <button
                  key={category}
                  onClick={() => toggleCategory(category)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    filters.categories.includes(category)
                      ? "bg-indigo-500 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Amount Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Amount Range
            </label>
            <div className="flex flex-wrap gap-2">
              {AMOUNT_RANGES.map(range => (
                <button
                  key={range.label}
                  onClick={() => updateFilter("amountRange", range.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    JSON.stringify(filters.amountRange) === JSON.stringify(range.value)
                      ? "bg-indigo-500 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Methods */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Payment Method
            </label>
            <div className="flex gap-2">
              {PAYMENT_METHODS.map(method => (
                <button
                  key={method}
                  onClick={() => togglePaymentMethod(method)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${
                    filters.paymentMethods.includes(method)
                      ? "bg-indigo-500 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sort By
            </label>
            <select
              value={filters.sortBy}
              onChange={e => updateFilter("sortBy", e.target.value as FilterState["sortBy"])}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-white"
            >
              {SORT_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
              Clear All Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
