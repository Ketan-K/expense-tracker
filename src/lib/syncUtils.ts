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

  const itemsToProcess = items.filter(item => {
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
        } else if (item.collection === "incomes") {
          await db.incomes
            .where("_id")
            .equals(item.localId!)
            .modify({ synced: true });
        } else if (item.collection === "loans") {
          await db.loans
            .where("_id")
            .equals(item.localId!)
            .modify({ synced: true });
        } else if (item.collection === "loanPayments") {
          await db.loanPayments
            .where("_id")
            .equals(item.localId!)
            .modify({ synced: true });
        } else if (item.collection === "contacts") {
          await db.contacts
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

  // Only show error toasts, success is indicated by status dot
  if (stats.failed > 0) {
    toast.error(`Failed to sync ${stats.failed} items`, { id: "sync" });
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
      // Fresh start: Clear all existing data
      await db.expenses.clear();
      await db.categories.clear();
      await db.budgets.clear();
      await db.incomes.clear();
      await db.loans.clear();
      await db.loanPayments.clear();
      await db.contacts.clear();
      await db.syncQueue.clear();

      // Pull all data from server
      const [categoriesRes, budgetsRes, expensesRes, incomesRes, loansRes, loanPaymentsRes, contactsRes] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/budgets"),
        fetch("/api/expenses"),
        fetch("/api/incomes"),
        fetch("/api/loans"),
        fetch("/api/loan-payments"),
        fetch("/api/contacts"),
      ]);

      if (!categoriesRes.ok || !budgetsRes.ok || !expensesRes.ok || !incomesRes.ok || !loansRes.ok || !loanPaymentsRes.ok || !contactsRes.ok) {
        throw new Error("Failed to fetch data from server");
      }

      const [serverCategories, serverBudgets, serverExpenses, serverIncomes, serverLoans, serverLoanPayments, serverContacts] =
        await Promise.all([
          categoriesRes.json(),
          budgetsRes.json(),
          expensesRes.json(),
          incomesRes.json(),
          loansRes.json(),
          loanPaymentsRes.json(),
          contactsRes.json(),
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

      // Add all incomes
      for (const income of serverIncomes) {
        await db.incomes.add({
          _id: income._id,
          userId: income.userId,
          date: new Date(income.date),
          amount: income.amount,
          source: income.source,
          category: income.category,
          description: income.description,
          taxable: income.taxable,
          recurring: income.recurring,
          synced: true,
          createdAt: new Date(income.createdAt),
          updatedAt: new Date(income.updatedAt),
        });
      }

      // Add all contacts first (loans reference contacts)
      for (const contact of serverContacts) {
        await db.contacts.add({
          _id: contact._id,
          userId: contact.userId,
          name: contact.name,
          phone: contact.phone || [],
          email: contact.email || [],
          primaryPhone: contact.primaryPhone,
          primaryEmail: contact.primaryEmail,
          relationship: contact.relationship,
          notes: contact.notes,
          source: contact.source || "manual",
          externalId: contact.externalId,
          synced: true,
          createdAt: new Date(contact.createdAt),
          updatedAt: new Date(contact.updatedAt),
        });
      }

      // Add all loans
      for (const loan of serverLoans) {
        await db.loans.add({
          _id: loan._id,
          userId: loan.userId,
          contactId: loan.contactId,
          contactName: loan.contactName,
          direction: loan.direction,
          principalAmount: loan.principalAmount,
          outstandingAmount: loan.outstandingAmount,
          interestRate: loan.interestRate,
          startDate: new Date(loan.startDate),
          dueDate: loan.dueDate ? new Date(loan.dueDate) : undefined,
          status: loan.status,
          description: loan.description,
          synced: true,
          createdAt: new Date(loan.createdAt),
          updatedAt: new Date(loan.updatedAt),
        });
      }

      // Add all loan payments
      for (const payment of serverLoanPayments) {
        await db.loanPayments.add({
          _id: payment._id,
          loanId: payment.loanId,
          userId: payment.userId,
          amount: payment.amount,
          date: new Date(payment.date),
          paymentMethod: payment.paymentMethod,
          notes: payment.notes,
          synced: true,
          createdAt: new Date(payment.createdAt),
          updatedAt: new Date(payment.updatedAt),
        });
      }

      // Mark migration as complete
      await setSyncMetadata("migrationComplete", true);
      await setSyncMetadata("lastPullTimestamp", Date.now());

      toast.success(
        `Loaded ${serverExpenses.length} expenses, ${serverIncomes.length} incomes, ${serverLoans.length} loans, ${serverContacts.length} contacts`,
        { id: "pull" }
      );
    } else {
      // Incremental pull: fetch server data and merge
      const [expensesRes, incomesRes, loansRes, loanPaymentsRes, contactsRes] = await Promise.all([
        fetch("/api/expenses"),
        fetch("/api/incomes"),
        fetch("/api/loans"),
        fetch("/api/loan-payments"),
        fetch("/api/contacts"),
      ]);

      if (!expensesRes.ok || !incomesRes.ok || !loansRes.ok || !loanPaymentsRes.ok || !contactsRes.ok) {
        throw new Error("Failed to fetch data from server");
      }

      const [serverExpenses, serverIncomes, serverLoans, serverLoanPayments, serverContacts] = await Promise.all([
        expensesRes.json(),
        incomesRes.json(),
        loansRes.json(),
        loanPaymentsRes.json(),
        contactsRes.json(),
      ]);

      // Get local unsynced expenses
      const allLocalExpenses = await db.expenses.where("userId").equals(userId).toArray();
      const localUnsynced = allLocalExpenses.filter(exp => !exp.synced);

      let added = 0;
      let updated = 0;

      // Sync expenses
      for (const serverExp of serverExpenses) {
        // Check if this server expense is a duplicate of any local unsynced expense
        const isDuplicate = localUnsynced.some(localExp =>
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
          // Update existing synced expense if server version is newer (server wins)
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
            updated++;
          }
        }
      }

      // Sync incomes
      for (const serverIncome of serverIncomes) {
        const existing = await db.incomes.get(serverIncome._id);
        if (!existing) {
          // Add new income from server
          await db.incomes.add({
            _id: serverIncome._id,
            userId: serverIncome.userId,
            date: new Date(serverIncome.date),
            amount: serverIncome.amount,
            source: serverIncome.source,
            category: serverIncome.category,
            description: serverIncome.description,
            taxable: serverIncome.taxable,
            recurring: serverIncome.recurring,
            synced: true,
            createdAt: new Date(serverIncome.createdAt),
            updatedAt: new Date(serverIncome.updatedAt),
          });
          added++;
        } else if (existing.synced) {
          // Server wins conflict resolution
          const serverUpdated = new Date(serverIncome.updatedAt).getTime();
          const localUpdated = new Date(existing.updatedAt).getTime();

          if (serverUpdated > localUpdated) {
            await db.incomes.update(serverIncome._id, {
              date: new Date(serverIncome.date),
              amount: serverIncome.amount,
              source: serverIncome.source,
              category: serverIncome.category,
              description: serverIncome.description,
              taxable: serverIncome.taxable,
              recurring: serverIncome.recurring,
              updatedAt: new Date(serverIncome.updatedAt),
            });
            updated++;
          }
        }
      }

      // Sync contacts (before loans since loans reference contacts)
      for (const serverContact of serverContacts) {
        const existing = await db.contacts.get(serverContact._id);
        if (!existing) {
          // Add new contact from server
          await db.contacts.add({
            _id: serverContact._id,
            userId: serverContact.userId,
            name: serverContact.name,
            phone: serverContact.phone || [],
            email: serverContact.email || [],
            primaryPhone: serverContact.primaryPhone,
            primaryEmail: serverContact.primaryEmail,
            relationship: serverContact.relationship,
            notes: serverContact.notes,
            source: serverContact.source || "manual",
            externalId: serverContact.externalId,
            synced: true,
            createdAt: new Date(serverContact.createdAt),
            updatedAt: new Date(serverContact.updatedAt),
          });
          added++;
        } else if (existing.synced) {
          // Server wins conflict resolution
          const serverUpdated = new Date(serverContact.updatedAt).getTime();
          const localUpdated = new Date(existing.updatedAt).getTime();

          if (serverUpdated > localUpdated) {
            await db.contacts.update(serverContact._id, {
              name: serverContact.name,
              phone: serverContact.phone || [],
              email: serverContact.email || [],
              primaryPhone: serverContact.primaryPhone,
              primaryEmail: serverContact.primaryEmail,
              relationship: serverContact.relationship,
              notes: serverContact.notes,
              source: serverContact.source || "manual",
              externalId: serverContact.externalId,
              updatedAt: new Date(serverContact.updatedAt),
            });
            updated++;
          }
        }
      }

      // Sync loans
      for (const serverLoan of serverLoans) {
        const existing = await db.loans.get(serverLoan._id);
        if (!existing) {
          // Add new loan from server
          await db.loans.add({
            _id: serverLoan._id,
            userId: serverLoan.userId,
            contactId: serverLoan.contactId,
            contactName: serverLoan.contactName,
            direction: serverLoan.direction,
            principalAmount: serverLoan.principalAmount,
            outstandingAmount: serverLoan.outstandingAmount,
            interestRate: serverLoan.interestRate,
            startDate: new Date(serverLoan.startDate),
            dueDate: serverLoan.dueDate ? new Date(serverLoan.dueDate) : undefined,
            status: serverLoan.status,
            description: serverLoan.description,
            synced: true,
            createdAt: new Date(serverLoan.createdAt),
            updatedAt: new Date(serverLoan.updatedAt),
          });
          added++;
        } else if (existing.synced) {
          // Server wins conflict resolution
          const serverUpdated = new Date(serverLoan.updatedAt).getTime();
          const localUpdated = new Date(existing.updatedAt).getTime();

          if (serverUpdated > localUpdated) {
            await db.loans.update(serverLoan._id, {
              contactId: serverLoan.contactId,
              contactName: serverLoan.contactName,
              direction: serverLoan.direction,
              principalAmount: serverLoan.principalAmount,
              outstandingAmount: serverLoan.outstandingAmount,
              interestRate: serverLoan.interestRate,
              startDate: new Date(serverLoan.startDate),
              dueDate: serverLoan.dueDate ? new Date(serverLoan.dueDate) : undefined,
              status: serverLoan.status,
              description: serverLoan.description,
              updatedAt: new Date(serverLoan.updatedAt),
            });
            updated++;
          }
        }
      }

      // Sync loan payments
      for (const serverPayment of serverLoanPayments) {
        const existing = await db.loanPayments.get(serverPayment._id);
        if (!existing) {
          // Add new loan payment from server
          await db.loanPayments.add({
            _id: serverPayment._id,
            loanId: serverPayment.loanId,
            userId: serverPayment.userId,
            amount: serverPayment.amount,
            date: new Date(serverPayment.date),
            paymentMethod: serverPayment.paymentMethod,
            notes: serverPayment.notes,
            synced: true,
            createdAt: new Date(serverPayment.createdAt),
            updatedAt: new Date(serverPayment.updatedAt),
          });
          added++;
        } else if (existing.synced) {
          // Server wins conflict resolution
          const serverUpdated = new Date(serverPayment.updatedAt).getTime();
          const localUpdated = new Date(existing.updatedAt).getTime();

          if (serverUpdated > localUpdated) {
            await db.loanPayments.update(serverPayment._id, {
              loanId: serverPayment.loanId,
              amount: serverPayment.amount,
              date: new Date(serverPayment.date),
              paymentMethod: serverPayment.paymentMethod,
              notes: serverPayment.notes,
              updatedAt: new Date(serverPayment.updatedAt),
            });
            updated++;
          }
        }
      }

      await setSyncMetadata("lastPullTimestamp", Date.now());
    }
  } catch (error) {
    console.error("Pull error:", error);
    toast.error("Failed to sync with server", { id: "pull" });
    throw error;
  }
}

/**
 * Perform complete bidirectional sync: push local changes then pull server changes
 */
export async function performSync(userId: string): Promise<void> {
  try {
    // First, push any pending local changes
    await processSyncQueue(userId);
    
    // Then, pull latest data from server
    await pullFromServer(userId);
  } catch (error) {
    console.error("Sync error:", error);
    throw error;
  }
}
