"use client";

import { useState, useEffect } from "react";
import { Calendar, DollarSign, FileText, CreditCard, X } from "lucide-react";
import { format } from "date-fns";
import { getIconComponent, availableIcons } from "@/lib/types";
import { LocalExpense, db } from "@/lib/db";
import { toast } from "sonner";
import { generateObjectId } from "@/lib/idGenerator";
import { processSyncQueue } from "@/lib/syncUtils";

interface ExpenseFormProps {
  initialData?: {
    date?: string;
    amount?: string;
    category?: string;
    description?: string;
    paymentMethod?: string;
  };
  categories: { _id?: string; name: string; icon: string; color: string }[];
  onSubmit: (data: {
    date: string;
    amount: string;
    category: string;
    description: string;
    paymentMethod: string;
  }) => void | Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  isSubmitting?: boolean;
  showCancel?: boolean;
  userId?: string;
}

export default function ExpenseForm({
  initialData,
  categories,
  onSubmit,
  onCancel,
  submitLabel = "Add Expense",
  isSubmitting = false,
  showCancel = false,
  userId,
}: ExpenseFormProps) {
  const [formData, setFormData] = useState({
    date: initialData?.date || format(new Date(), "yyyy-MM-dd"),
    amount: initialData?.amount || "",
    category: initialData?.category || "",
    description: initialData?.description || "",
    paymentMethod: initialData?.paymentMethod || "upi",
  });

  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState({
    name: "",
    icon: "PlusCircle",
    color: "#6b7280",
  });
  const [iconSearch, setIconSearch] = useState("");

  useEffect(() => {
    if (initialData) {
      setFormData({
        date: initialData.date || format(new Date(), "yyyy-MM-dd"),
        amount: initialData.amount || "",
        category: initialData.category || "",
        description: initialData.description || "",
        paymentMethod: initialData.paymentMethod || "upi",
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const handleCreateCustomCategory = async () => {
    if (!customCategory.name.trim()) {
      toast.error("Please enter a category name");
      return;
    }
    if (!userId) {
      toast.error("User not authenticated");
      return;
    }

    // Check if category with this name already exists
    const existingCategory = categories?.find(
      (cat) => cat.name.toLowerCase() === customCategory.name.trim().toLowerCase()
    );

    if (existingCategory) {
      toast.error("A category with this name already exists");
      setFormData({ ...formData, category: existingCategory.name });
      setShowCustomCategory(false);
      return;
    }

    try {
      const categoryId = generateObjectId();
      const now = new Date();

      // Add to IndexedDB
      const newCategory = {
        _id: categoryId,
        userId: userId,
        name: customCategory.name.trim(),
        icon: customCategory.icon,
        color: customCategory.color,
        isDefault: false,
        synced: false,
        createdAt: now,
      };

      await db.categories.add(newCategory);

      // Add to sync queue to save to server
      await db.syncQueue.add({
        action: "CREATE",
        collection: "categories",
        data: newCategory,
        timestamp: Date.now(),
        retryCount: 0,
        status: "pending",
        localId: categoryId,
      });

      // Set as selected category
      setFormData({ ...formData, category: newCategory.name });

      // Reset custom category form
      setCustomCategory({
        name: "",
        icon: "PlusCircle",
        color: "#6b7280",
      });
      setIconSearch("");
      setShowCustomCategory(false);

      toast.success("Custom category created!");

      // Trigger sync if online
      if (navigator.onLine && userId) {
        processSyncQueue(userId);
      }
    } catch (error) {
      console.error("Error creating category:", error);
      toast.error("Failed to create category");
    }
  };

  const quickAmounts = [100, 200, 500, 1000];

  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in duration-300">
      {/* Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <Calendar className="w-4 h-4 inline mr-2 text-indigo-600" />
          Date
        </label>
        <input
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-white transition-all"
          required
        />
      </div>

      {/* Amount */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <DollarSign className="w-4 h-4 inline mr-2 text-indigo-600" />
          Amount (₹)
        </label>
        <input
          type="text"
          placeholder="0.00 or 100+50"
          value={formData.amount}
          onChange={(e) => {
            const value = e.target.value;
            if (value === "" || /^[\d+.]+$/.test(value)) {
              setFormData({ ...formData, amount: value });
            }
          }}
          onBlur={(e) => {
            const value = e.target.value;
            if (value.includes("+")) {
              try {
                const numbers = value
                  .split("+")
                  .map((n) => parseFloat(n.trim()))
                  .filter((n) => !isNaN(n));
                if (numbers.length > 0) {
                  const sum = numbers.reduce((acc, curr) => acc + curr, 0);
                  setFormData({ ...formData, amount: sum.toString() });
                }
              } catch (error) {
                // Keep original value
              }
            }
          }}
          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-xl font-semibold dark:text-white transition-all"
          required
        />

        {/* Quick Amount Buttons */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
          {quickAmounts.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => {
                const currentAmount = formData.amount.trim();
                if (currentAmount === "" || currentAmount === "0") {
                  setFormData({ ...formData, amount: amount.toString() });
                } else {
                  const current = parseFloat(currentAmount);
                  if (!isNaN(current)) {
                    setFormData({
                      ...formData,
                      amount: (current + amount).toString(),
                    });
                  } else {
                    setFormData({
                      ...formData,
                      amount: currentAmount + "+" + amount,
                    });
                  }
                }
              }}
              className="px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 hover:from-indigo-100 hover:to-purple-100 dark:hover:from-indigo-900/50 dark:hover:to-purple-900/50 text-indigo-700 dark:text-indigo-300 rounded-lg text-sm font-medium transition-all hover:shadow-md active:scale-95 whitespace-nowrap flex-shrink-0"
            >
              +₹{amount}
            </button>
          ))}
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <FileText className="w-4 h-4 inline mr-2 text-indigo-600" />
          Category
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {categories
            ?.filter(
              (category, index, self) =>
                index === self.findIndex((c) => c.name === category.name)
            )
            .sort((a, b) => {
              if (a.name === "Other") return 1;
              if (b.name === "Other") return -1;
              return 0;
            })
            .map((category) => {
              const IconComponent = getIconComponent(category.icon);
              const isSelected = formData.category === category.name;
              const isOther = category.name === "Other";
              return (
                <button
                  key={category._id}
                  type="button"
                  onClick={() => {
                    if (isOther) {
                      setShowCustomCategory(true);
                    } else {
                      setFormData({ ...formData, category: category.name });
                    }
                  }}
                  className={`px-2 py-2.5 rounded-lg font-medium transition-all text-xs active:scale-95 flex flex-col items-center gap-1.5 ${
                    isSelected
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/50"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:shadow-md"
                  }`}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: isSelected
                        ? "rgba(255, 255, 255, 0.2)"
                        : `${category.color}20`,
                    }}
                  >
                    <IconComponent
                      className="w-4 h-4"
                      style={{
                        color: isSelected ? "white" : category.color,
                      }}
                    />
                  </div>
                  <span className="truncate">{category.name}</span>
                </button>
              );
            })}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <FileText className="w-4 h-4 inline mr-2 text-indigo-600" />
          Description (Optional)
        </label>
        <textarea
          placeholder="What did you spend on?"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          rows={3}
          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none dark:text-white transition-all"
        />
      </div>

      {/* Payment Method */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <CreditCard className="w-4 h-4 inline mr-2 text-indigo-600" />
          Payment Method
        </label>
        <div className="grid grid-cols-3 gap-2">
          {["cash", "card", "upi"].map((method) => (
            <button
              key={method}
              type="button"
              onClick={() =>
                setFormData({ ...formData, paymentMethod: method })
              }
              className={`px-4 py-3 rounded-xl font-medium capitalize transition-all text-sm active:scale-95 ${
                formData.paymentMethod === method
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/50"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:shadow-md"
              }`}
            >
              {method}
            </button>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      {showCancel ? (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Saving..." : submitLabel}
          </button>
        </div>
      ) : (
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Saving..." : submitLabel}
        </button>
      )}
    </form>

    {/* Custom Category Modal */}
    {showCustomCategory && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
        <div className="bg-gradient-to-br from-white via-gray-50 to-purple-50/30 dark:from-gray-800 dark:via-gray-800 dark:to-purple-900/20 rounded-3xl p-5 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Create Custom Category
            </h2>
            <button
              onClick={() => {
                setShowCustomCategory(false);
                setIconSearch("");
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Category Name Input */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category Name
            </label>
            <input
              type="text"
              value={customCategory.name}
              onChange={(e) =>
                setCustomCategory({ ...customCategory, name: e.target.value })
              }
              placeholder="e.g., Gaming, Education, Gifts"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-white transition-all"
            />
          </div>

          {/* Icon Picker */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Select Icon
            </label>
            
            {/* Icon Search */}
            <input
              type="text"
              value={iconSearch}
              onChange={(e) => setIconSearch(e.target.value)}
              placeholder="Search icons... (e.g., car, food, heart)"
              className="w-full px-4 py-2 mb-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-white transition-all text-sm"
            />
            
            <div className="grid grid-cols-6 gap-2 max-h-32 overflow-y-auto scrollbar-thin p-2 pr-1 border border-gray-200 dark:border-gray-700 rounded-xl">
              {availableIcons
                .filter((icon) =>
                  icon.name.toLowerCase().includes(iconSearch.toLowerCase())
                )
                .map((icon) => {
                const isSelected = customCategory.icon === icon.name;
                const IconComp = icon.component;
                return (
                  <button
                    key={icon.name}
                    type="button"
                    onClick={() =>
                      setCustomCategory({ ...customCategory, icon: icon.name })
                    }
                    title={icon.name}
                    className={`p-2.5 rounded-lg transition-all ${
                      isSelected
                        ? "bg-indigo-600 text-white shadow-lg"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    <IconComp className="w-6 h-6 mx-auto" />
                  </button>
                );
              })}
            </div>
            {iconSearch && availableIcons.filter((icon) =>
              icon.name.toLowerCase().includes(iconSearch.toLowerCase())
            ).length === 0 && (
              <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-3">
                No icons found matching "{iconSearch}"
              </p>
            )}
          </div>

          {/* Color Picker */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Select Color
            </label>
            <div className="grid grid-cols-6 gap-2 place-items-center">
              {[
                "#10b981", "#f59e0b", "#fbbf24", "#8b5cf6",
                "#3b82f6", "#06b6d4", "#f97316", "#14b8a6",
                "#ec4899", "#ef4444", "#22c55e", "#6b7280",
                "#84cc16", "#f43f5e", "#a855f7", "#64748b",
                "#0ea5e9", "#8b5cf6", "#d946ef", "#f97316",
              ]
              .filter((color, index, self) => 
                self.indexOf(color) === index
              )
              .slice(0, 12)
              .map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() =>
                    setCustomCategory({ ...customCategory, color })
                  }
                  className={`w-10 h-10 rounded-lg transition-all ${
                    customCategory.color === color
                      ? "ring-4 ring-offset-2 ring-indigo-500 dark:ring-offset-gray-800 scale-110"
                      : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setShowCustomCategory(false);
                setIconSearch("");
              }}
              className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateCustomCategory}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
            >
              Create
            </button>
          </div>
        </div>
      </div>
    )}
  </>
  );
}
