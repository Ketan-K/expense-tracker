/**
 * Programmatic Color System
 * For dynamic color generation (charts, categories, etc.)
 * UI colors should use Tailwind theme classes instead
 */

// Category Color Palette (for expense categories in charts)
export const COLORS = {
  categories: [
    '#10b981', // emerald-500
    '#f59e0b', // amber-500
    '#fbbf24', // amber-400
    '#8b5cf6', // violet-500
    '#3b82f6', // blue-500
    '#06b6d4', // cyan-500
    '#f97316', // orange-500
    '#14b8a6', // teal-500
    '#ec4899', // pink-500
    '#ef4444', // red-500
    '#22c55e', // green-500
    '#6b7280', // gray-500
    '#84cc16', // lime-500
    '#f43f5e', // rose-500
    '#a855f7', // purple-500
    '#64748b', // slate-500
    '#0ea5e9', // sky-500
    '#d946ef', // fuchsia-500
    '#fb923c', // orange-400
    '#4ade80', // green-400
    '#facc15', // yellow-400
    '#c084fc', // purple-400
    '#38bdf8', // sky-400
    '#fb7185', // rose-400
  ],
} as const;

/**
 * Get category color from index (for charts)
 */
export function getCategoryColor(index: number): string {
  return COLORS.categories[index % COLORS.categories.length];
}

