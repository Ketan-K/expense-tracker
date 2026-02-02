import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import clientPromise from "@/lib/mongodb";

/**
 * Get system statistics for admin dashboard
 * Returns user counts, data statistics, and system info
 */
export async function GET() {
  try {
    const session = await requireAdmin();
    console.log(`[ADMIN ACTION] System stats requested by ${session.user.email}`);

    const client = await clientPromise;
    const db = client.db();

    // Get user statistics
    const usersCollection = db.collection("users");
    const accountsCollection = db.collection("accounts");
    
    const totalUsers = await usersCollection.countDocuments();
    const usersWithAccounts = await accountsCollection.distinct("userId");
    const activeUsers = usersWithAccounts.length;

    // Get data statistics
    const expensesCollection = db.collection("expenses");
    const incomesCollection = db.collection("incomes");
    const loansCollection = db.collection("loans");
    const contactsCollection = db.collection("contacts");
    const categoriesCollection = db.collection("categories");
    const budgetsCollection = db.collection("budgets");

    const [
      totalExpenses,
      totalIncomes,
      totalLoans,
      totalContacts,
      totalCategories,
      totalBudgets,
      activeUsersWithData
    ] = await Promise.all([
      expensesCollection.countDocuments(),
      incomesCollection.countDocuments(),
      loansCollection.countDocuments(),
      contactsCollection.countDocuments(),
      categoriesCollection.countDocuments(),
      budgetsCollection.countDocuments(),
      expensesCollection.distinct("userId")
    ]);

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [recentExpenses, recentIncomes, recentLoans] = await Promise.all([
      expensesCollection.countDocuments({ 
        createdAt: { $gte: sevenDaysAgo } 
      }),
      incomesCollection.countDocuments({ 
        createdAt: { $gte: sevenDaysAgo } 
      }),
      loansCollection.countDocuments({ 
        createdAt: { $gte: sevenDaysAgo } 
      })
    ]);

    // Get total amounts
    const expensesPipeline = await expensesCollection
      .aggregate([
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ])
      .toArray();

    const incomesPipeline = await incomesCollection
      .aggregate([
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ])
      .toArray();

    const loansPipeline = await loansCollection
      .aggregate([
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ])
      .toArray();

    return NextResponse.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          active: activeUsers,
          withData: activeUsersWithData.length,
        },
        data: {
          expenses: {
            count: totalExpenses,
            recent: recentExpenses,
            totalAmount: expensesPipeline[0]?.total || 0,
          },
          incomes: {
            count: totalIncomes,
            recent: recentIncomes,
            totalAmount: incomesPipeline[0]?.total || 0,
          },
          loans: {
            count: totalLoans,
            recent: recentLoans,
            totalAmount: loansPipeline[0]?.total || 0,
          },
          contacts: totalContacts,
          categories: totalCategories,
          budgets: totalBudgets,
        },
        timestamp: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error("[ADMIN STATS] Error fetching statistics:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to fetch statistics",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
