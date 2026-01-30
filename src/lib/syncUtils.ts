import { isSameDay } from "date-fns";
import { LocalExpense, SyncQueueItem, db } from "./db";
import { toast } from "sonner";

/**
 * Check if two expenses are duplicates based on:
 * - Same category
 * - Same amount (within 0.01 tolerance for float comparison)
 * - Same description (normalized)
 * - Same day (ignoring time)
 */
export function isDuplicateExpense(
  exp1: LocalExpense | any,
  exp2: LocalExpense | any
): boolean {
  const sameCategory = exp1.category === exp2.category;
  const sameAmount = Math.abs(exp1.amount - exp2.amount) < 0.01;
  const sameDesc =
    (exp1.description || "").trim().toLowerCase() ===
    (exp2.description || "").trim().toLowerCase();
  const sameDay = isSameDay(new Date(exp1.date), new Date(exp2.date));

  return sameCategory && sameAmount && sameDesc && sameDay;
}

/**
 * Calculate exponential backoff delay for retry attempts
 * Formula: min(1000 * 2^retryCount, 30000)
 * Results: 1s, 2s, 4s, 8s, 16s, 30s (max)
 */
export function getRetryDelay(retryCount: number): number {
  return Math.min(1000 * Math.pow(2, retryCount), 30000);
}

/**
 * Maximum number of retry attempts before marking as failed
 */
export const MAX_RETRIES = 5;

/**
 * Process the sync queue with retry logic and exponential backoff
 */
export async function processSyncQueue(userId: string): Promise<{
  success: number;
  failed: number;
  skipped: number;
}> {
  const now = Date.now();
  const stats = { success: 0, failed: 0, skipped: 0 };

  // Get all pending or failed items that are ready for retry
  const items = await db.syncQueue
    .where("status")
    .anyOf("pending", "failed")
    .toArray();

  const itemsToProcess = items.filter((item) => {
    // If it's pending, process immediately
    if (item.status === "pending") return true;

    // If it's failed, check if enough time has passed for retry
    if (item.status === "failed" && item.lastAttempt) {
      const delay = getRetryDelay(item.retryCount);
      return now - item.lastAttempt >= delay;
    }

    return false;
  });

  if (itemsToProcess.length === 0) {
    return stats;
  }

  for (const item of itemsToProcess) {
    // Skip if already exceeded max retries
    if (item.retryCount >= MAX_RETRIES) {
      stats.skipped++;
      continue;
    }

    try {
      // Update status to syncing
      await db.syncQueue.update(item.id!, {
        status: "syncing",
        lastAttempt: now,
      });

      // Prepare the API endpoint
      let endpoint = "";
      let method = "POST";

      if (item.action === "CREATE") {
        endpoint = `/api/${item.collection}`;
        method = "POST";
      } else if (item.action === "UPDATE") {
        endpoint = `/api/${item.collection}/${item.remoteId || item.localId}`;
        method = "PUT";
      } else if (item.action === "DELETE") {
        endpoint = `/api/${item.collection}/${item.remoteId || item.localId}`;
        method = "DELETE";
      }

      // Send request to server
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: method !== "DELETE" ? JSON.stringify(item.data) : undefined,
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const result = await response.json();

      // Handle successful sync
      if (item.action === "CREATE" && result._id) {
        // Update local record with remote ID if needed
        if (item.collection === "expenses") {
          await db.expenses
            .where("_id")
            .equals(item.localId!)
            .modify({ synced: true });
        } else if (item.collection === "categories") {
          await db.categories
            .where("_id")
            .equals(item.localId!)
            .modify({ synced: true });
        } else if (item.collection === "budgets") {
          await db.budgets
            .where("_id")
            .equals(item.localId!)
            .modify({ synced: true });
        }
      }

      // Remove from queue
      await db.syncQueue.delete(item.id!);
      stats.success++;
    } catch (error) {
      console.error("Sync error for item:", item, error);

      // Increment retry count
      const newRetryCount = item.retryCount + 1;

      if (newRetryCount >= MAX_RETRIES) {
        // Max retries exceeded, mark as permanently failed
        await db.syncQueue.update(item.id!, {
          status: "failed",
          retryCount: newRetryCount,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        stats.failed++;
      } else {
        // Will retry later
        await db.syncQueue.update(item.id!, {
          status: "failed",
          retryCount: newRetryCount,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  }

  // Update toast based on results - only show errors, success is silent
  if (stats.failed > 0) {
    toast.error(`Failed to sync ${stats.failed} items`, { id: "sync" });
  } else {
    toast.dismiss("sync");
  }

  return stats;
}

/**
 * Get sync metadata value
 */
export async function getSyncMetadata(key: string): Promise<any> {
  const record = await db.syncMetadata.get(key);
  return record?.value;
}

/**
 * Set sync metadata value
 */
export async function setSyncMetadata(key: string, value: any): Promise<void> {
  await db.syncMetadata.put({
    key,
    value,
    updatedAt: new Date(),
  });
}

/**
 * Pull data from MongoDB server and merge with local data
 */
export async function pullFromServer(userId: string): Promise<void> {
  try {
    // Check if migration is complete
    const migrationComplete = await getSyncMetadata("migrationComplete");

    if (!migrationComplete) {
      toast.info("Performing first-time sync...", { id: "pull" });

      // Fresh start: Clear all existing data
      await db.expenses.clear();
      await db.categories.clear();
      await db.budgets.clear();
      await db.syncQueue.clear();

      // Pull all data from server
      const [categoriesRes, budgetsRes, expensesRes] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/budgets"),
        fetch("/api/expenses"),
      ]);

      if (!categoriesRes.ok || !budgetsRes.ok || !expensesRes.ok) {
        throw new Error("Failed to fetch data from server");
      }

      const [serverCategories, serverBudgets, serverExpenses] =
        await Promise.all([
          categoriesRes.json(),
          budgetsRes.json(),
          expensesRes.json(),
        ]);

      // Add all categories
      for (const cat of serverCategories) {
        await db.categories.add({
          _id: cat._id,
          userId: cat.userId,
          name: cat.name,
          icon: cat.icon,
          color: cat.color,
          isDefault: cat.isDefault || false,
          synced: true,
          createdAt: new Date(cat.createdAt),
        });
      }

      // Add all budgets
      for (const budget of serverBudgets) {
        await db.budgets.add({
          _id: budget._id,
          userId: budget.userId,
          categoryId: budget.categoryId,
          month: budget.month,
          amount: budget.amount,
          synced: true,
          createdAt: new Date(budget.createdAt),
          updatedAt: new Date(budget.updatedAt),
        });
      }

      // Add all expenses
      for (const exp of serverExpenses) {
        await db.expenses.add({
          _id: exp._id,
          userId: exp.userId,
          date: new Date(exp.date),
          amount: exp.amount,
          category: exp.category,
          description: exp.description,
          paymentMethod: exp.paymentMethod,
          synced: true,
          createdAt: new Date(exp.createdAt),
          updatedAt: new Date(exp.updatedAt),
        });
      }

      // Mark migration as complete
      await setSyncMetadata("migrationComplete", true);
      await setSyncMetadata("lastPullTimestamp", Date.now());

      toast.success(
        `Loaded ${serverExpenses.length} expenses, ${serverCategories.length} categories`,
        { id: "pull" }
      );
    } else {
      // Incremental pull: fetch server data and merge
      toast.info("Syncing with server...", { id: "pull" });

      const [expensesRes] = await Promise.all([fetch("/api/expenses")]);

      if (!expensesRes.ok) {
        throw new Error("Failed to fetch data from server");
      }

      const serverExpenses = await expensesRes.json();

      // Get local unsynced expenses
      const allLocalExpenses = await db.expenses.where("userId").equals(userId).toArray();
      const localUnsynced = allLocalExpenses.filter(exp => !exp.synced);

      let added = 0;
      for (const serverExp of serverExpenses) {
        // Check if this server expense is a duplicate of any local unsynced expense
        const isDuplicate = localUnsynced.some((localExp) =>
          isDuplicateExpense(serverExp, localExp)
        );

        if (isDuplicate) {
          // Skip adding from server, keep local version
          continue;
        }

        // Check if already exists locally
        const existing = await db.expenses.get(serverExp._id);
        if (!existing) {
          // Add new expense from server
          await db.expenses.add({
            _id: serverExp._id,
            userId: serverExp.userId,
            date: new Date(serverExp.date),
            amount: serverExp.amount,
            category: serverExp.category,
            description: serverExp.description,
            paymentMethod: serverExp.paymentMethod,
            synced: true,
            createdAt: new Date(serverExp.createdAt),
            updatedAt: new Date(serverExp.updatedAt),
          });
          added++;
        } else if (existing.synced) {
          // Update existing synced expense if server version is newer
          const serverUpdated = new Date(serverExp.updatedAt).getTime();
          const localUpdated = new Date(existing.updatedAt).getTime();

          if (serverUpdated > localUpdated) {
            await db.expenses.update(serverExp._id, {
              date: new Date(serverExp.date),
              amount: serverExp.amount,
              category: serverExp.category,
              description: serverExp.description,
              paymentMethod: serverExp.paymentMethod,
              updatedAt: new Date(serverExp.updatedAt),
            });
          }
        }
      }

      await setSyncMetadata("lastPullTimestamp", Date.now());

      if (added > 0) {
        toast.success(`Added ${added} new expenses from server`, { id: "pull" });
      } else {
        toast.success("Already up to date", { id: "pull" });
      }
    }
  } catch (error) {
    console.error("Pull error:", error);
    toast.error("Failed to sync with server", { id: "pull" });
    throw error;
  }
}
