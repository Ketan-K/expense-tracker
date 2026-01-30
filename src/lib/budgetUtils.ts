export interface Budget {
  id?: number;
  userId: string;
  categoryId: string;
  categoryName: string;
  amount: number;
  month: string; // YYYY-MM format
  spent?: number;
  synced: boolean;
  remoteId?: string;
}

export function calculateBudgetStatus(spent: number, budget: number): {
  percentage: number;
  status: 'safe' | 'warning' | 'danger' | 'exceeded';
  color: string;
  bgColor: string;
} {
  const percentage = (spent / budget) * 100;
  
  if (percentage >= 100) {
    return {
      percentage,
      status: 'exceeded',
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-500'
    };
  } else if (percentage >= 90) {
    return {
      percentage,
      status: 'danger',
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-500'
    };
  } else if (percentage >= 70) {
    return {
      percentage,
      status: 'warning',
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-500'
    };
  } else {
    return {
      percentage,
      status: 'safe',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-500'
    };
  }
}
