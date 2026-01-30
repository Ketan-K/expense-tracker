"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { db } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";
import { Calendar, DollarSign, FileText, CreditCard, Save, X } from "lucide-react";
import { format } from "date-fns";
import { getIconComponent, availableIcons } from "@/lib/types";

export default function AddExpensePage() {
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    amount: "",
    category: "",
    description: "",
    paymentMethod: "cash",
  });
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState({
    name: "",
    icon: "PlusCircle",
    color: "#6b7280",
  });
  const [iconSearch, setIconSearch] = useState("");

  const categories = useLiveQuery(
    async () => {
      if (!session?.user?.id) return [];
      return await db.categories.where("userId").equals(session.user.id).toArray();
    },
    [session?.user?.id]
  );

  useEffect(() => {
    // Initialize default categories if none exist
    const initCategories = async () => {
      if (session?.user?.id && categories && categories.length === 0) {
        const response = await fetch("/api/categories");
        if (response.ok) {
          const serverCategories = await response.json();
          
          // Store in IndexedDB, using put to avoid duplicates
          for (const cat of serverCategories) {
            try {
              await db.categories.put({
                id: cat._id,
                userId: session.user.id,
                name: cat.name,
                icon: cat.icon,
                color: cat.color,
                isDefault: cat.isDefault,
                synced: true,
              });
            } catch (error) {
              // Ignore duplicate key errors
              console.debug("Category already exists:", cat.name);
            }
          }
        }
      }
    };

    initCategories();
  }, [session?.user?.id, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.user?.id) {
      toast.error("Please sign in to add expenses");
      return;
    }

    if (!formData.amount || !formData.category) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      // Add to IndexedDB (offline-first)
      const expense = {
        id: `temp-${Date.now()}`,
        userId: session.user.id,
        date: new Date(formData.date),
        amount: parseFloat(formData.amount),
        category: formData.category,
        description: formData.description,
        paymentMethod: formData.paymentMethod,
        synced: false,
        lastModified: new Date(),
      };

      await db.expenses.add(expense);

      // Add to sync queue
      await db.syncQueue.add({
        action: "CREATE",
        collection: "expenses",
        data: expense,
        timestamp: Date.now(),
        retryCount: 0,
        status: "pending",
        localId: expense.id,
      });

      toast.success("Expense added successfully!");

      // Reset form
      setFormData({
        date: format(new Date(), "yyyy-MM-dd"),
        amount: "",
        category: "",
        description: "",
        paymentMethod: "cash",
      });

      // Trigger sync if online
      if (navigator.onLine) {
        triggerSync();
      }
    } catch (error) {
      console.error("Error adding expense:", error);
      toast.error("Failed to add expense");
    }
  };

  const triggerSync = async () => {
    try {
      const pendingItems = await db.syncQueue
        .where("status")
        .equals("pending")
        .toArray();

      if (pendingItems.length === 0) return;

      const operations = pendingItems.map((item) => ({
        action: item.action,
        collection: item.collection,
        data: item.data,
        localId: item.localId,
      }));

      const response = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operations }),
      });

      if (response.ok) {
        const { results } = await response.json();

        // Update synced status and remove from queue
        for (const result of results) {
          if (result.success) {
            await db.expenses
              .where("id")
              .equals(result.localId)
              .modify({ synced: true, id: result.remoteId });

            await db.syncQueue
              .where("localId")
              .equals(result.localId)
              .delete();
          }
        }

        toast.success("Synced with server");
      }
    } catch (error) {
      console.error("Sync error:", error);
    }
  };

  const quickAmounts = [100, 200, 500, 1000];

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <div className="hidden sm:block mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Add Expense
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Track your spending and stay within budget
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 shadow-lg border border-gray-200 dark:border-gray-700">
            {/* Date */}
            <div className="mb-5 sm:mb-6">
              <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-3">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2 text-indigo-600" />
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="w-full px-4 py-3 sm:py-4 text-base bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-white transition-all"
                required
              />
            </div>

            {/* Amount */}
            <div className="mb-5 sm:mb-6">
              <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-3">
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2 text-indigo-600" />
                Amount (₹)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                className="w-full px-4 py-3 sm:py-4 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-xl sm:text-2xl font-semibold dark:text-white transition-all"
                required
              />

              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-4">
                {quickAmounts.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, amount: amount.toString() })
                    }
                    className="px-4 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 hover:from-indigo-100 hover:to-purple-100 dark:hover:from-indigo-900/50 dark:hover:to-purple-900/50 text-indigo-700 dark:text-indigo-300 rounded-lg sm:rounded-xl text-sm sm:text-base font-medium transition-all hover:shadow-md active:scale-95 cursor-pointer"
                  >
                    ₹{amount}
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div className="mb-5 sm:mb-6">
              <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2 text-indigo-600" />
                Category
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {categories
                  ?.filter((category, index, self) => 
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
                      key={category.id}
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
            <div className="mb-5 sm:mb-6">
              <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-3">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2 text-indigo-600" />
                Description (Optional)
              </label>
              <textarea
                placeholder="What did you spend on?"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className="w-full px-4 py-3 text-base bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none dark:text-white transition-all"
              />
            </div>

            {/* Payment Method */}
            <div className="mb-6">
              <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-3">
                <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2 text-indigo-600" />
                Payment Method
              </label>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {["cash", "card", "upi"].map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, paymentMethod: method })
                    }
                    className={`px-4 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-medium capitalize transition-all text-sm sm:text-base active:scale-95 ${
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
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-4 sm:py-5 px-6 rounded-xl sm:rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 active:scale-98 text-base sm:text-lg"
            >
              <Save className="w-5 h-5 sm:w-6 sm:h-6" />
              Add Expense
            </button>
          </div>
        </form>

        {/* Custom Category Modal */}
        {showCustomCategory && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 max-w-2xl w-full shadow-2xl">
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
                <div className="grid grid-cols-5 gap-2">
                  {[
                    "#10b981", "#f59e0b", "#fbbf24", "#8b5cf6",
                    "#3b82f6", "#06b6d4", "#f97316", "#14b8a6",
                    "#ec4899", "#ef4444", "#22c55e", "#6b7280",
                    "#84cc16", "#f43f5e", "#a855f7", "#64748b",
                    "#0ea5e9", "#8b5cf6", "#d946ef", "#f97316",
                    "#fb923c", "#fdba74", "#fcd34d", "#fde047",
                    "#bef264", "#86efac", "#6ee7b7", "#5eead4",
                    "#7dd3fc", "#93c5fd", "#a5b4fc", "#c4b5fd",
                    "#f0abfc", "#f9a8d4", "#fda4af", "#fb7185",
                    "#dc2626", "#ea580c", "#d97706", "#ca8a04",
                    "#65a30d", "#16a34a", "#059669", "#0d9488",
                    "#0891b2", "#0284c7", "#2563eb", "#4f46e5",
                    "#7c3aed", "#a21caf", "#be185d", "#9f1239",
                    "#78716c", "#57534e", "#44403c", "#292524",
                  ]
                  .filter((color, index, self) => 
                    // Remove duplicates
                    self.indexOf(color) === index
                  )
                  .filter((color) => {
                    // Only show colors not already used by existing categories
                    return !categories?.some((cat) => cat.color.toLowerCase() === color.toLowerCase());
                  })
                  .slice(0, 10) // Show only first 10 unused colors
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
                  onClick={() => setShowCustomCategory(false)}
                  className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!customCategory.name.trim()) {
                      toast.error("Please enter a category name");
                      return;
                    }
                    if (!session?.user?.id) return;

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
                      // Add to IndexedDB
                      const newCategory = {
                        id: `temp-${Date.now()}`,
                        userId: session.user.id,
                        name: customCategory.name.trim(),
                        icon: customCategory.icon,
                        color: customCategory.color,
                        isDefault: false,
                        synced: false,
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
                        localId: newCategory.id,
                      });

                      // Set as selected category
                      setFormData({ ...formData, category: newCategory.name });

                      // Reset custom category form
                      setCustomCategory({
                        name: "",
                        icon: "PlusCircle",
                        color: "#6b7280",
                      });
                      setShowCustomCategory(false);

                      toast.success("Custom category created!");

                      // Trigger sync if online
                      if (navigator.onLine) {
                        try {
                          const response = await fetch("/api/categories", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              name: newCategory.name,
                              icon: newCategory.icon,
                              color: newCategory.color,
                              isDefault: false,
                            }),
                          });

                          if (response.ok) {
                            const savedCategory = await response.json();
                            await db.categories
                              .where("id")
                              .equals(newCategory.id)
                              .modify({ synced: true, id: savedCategory._id });
                          }
                        } catch (error) {
                          console.error("Sync error:", error);
                        }
                      }
                    } catch (error) {
                      console.error("Error creating category:", error);
                      toast.error("Failed to create category");
                    }
                  }}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
