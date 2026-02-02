"use client";

import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { toast } from "sonner";
import { useState } from "react";

interface ExportButtonsProps {
  selectedMonth: Date;
}

export default function ExportButtons({ selectedMonth }: ExportButtonsProps) {
  const [exporting, setExporting] = useState<"csv" | "excel" | null>(null);

  const handleExport = async (format: "csv" | "excel") => {
    setExporting(format);
    try {
      const monthStart = startOfMonth(selectedMonth);
      const monthEnd = endOfMonth(selectedMonth);

      const url = `/api/export/${format}?startDate=${monthStart.toISOString()}&endDate=${monthEnd.toISOString()}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `expenses-${format === "excel" ? selectedMonth.getFullYear() + "-" + (selectedMonth.getMonth() + 1).toString().padStart(2, "0") : format === "csv" ? selectedMonth.getFullYear() + "-" + (selectedMonth.getMonth() + 1).toString().padStart(2, "0") : "export"}.${format === "excel" ? "xlsx" : "csv"}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error("Failed to export");
      console.error(error);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 shadow-sm">
      <Download className="w-4 h-4 text-gray-500 dark:text-gray-400" />
      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Export:</span>
      <button
        onClick={() => handleExport("csv")}
        disabled={exporting !== null}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-gradient-to-r from-app-budgets-light to-app-budgets-light-end text-indigo-700 dark:text-indigo-300 rounded-lg hover:from-indigo-100 hover:to-purple-100 dark:hover:from-indigo-900/30 dark:hover:to-purple-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
      >
        <FileText className="w-3.5 h-3.5" />
        {exporting === "csv" ? "..." : "CSV"}
      </button>
      <button
        onClick={() => handleExport("excel")}
        disabled={exporting !== null}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-gradient-to-r from-app-income-light to-app-income-light-end text-green-700 dark:text-green-300 rounded-lg hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-900/30 dark:hover:to-emerald-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
      >
        <FileSpreadsheet className="w-3.5 h-3.5" />
        {exporting === "excel" ? "..." : "Excel"}
      </button>
    </div>
  );
}
