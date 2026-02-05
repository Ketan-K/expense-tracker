import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { applyRateLimit, getIP } from "@/lib/ratelimit-middleware";
import { rateLimiters } from "@/lib/ratelimit";
import { handleOptionsRequest, addCorsHeaders } from "@/lib/cors";
import { expenseService } from "@/lib/services/expense.service";
import { categoryService } from "@/lib/services/category.service";
import { budgetService } from "@/lib/services/budget.service";
import { incomeService } from "@/lib/services/income.service";
import { loanService } from "@/lib/services/loan.service";
import { loanPaymentService } from "@/lib/services/loan-payment.service";
import { contactService } from "@/lib/services/contact.service";
import { NotFoundError, ValidationError, DatabaseError } from "@/lib/core/errors";

export async function OPTIONS(request: Request) {
  return handleOptionsRequest(request);
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Apply rate limiting (sync has stricter limits)
    const rateLimitResult = await applyRateLimit(
      session.user.id,
      getIP(request),
      rateLimiters.sync
    );
    if (rateLimitResult) return rateLimitResult;

    const body = await request.json();
    const { operations } = body;

    if (!operations || !Array.isArray(operations)) {
      return NextResponse.json({ error: "Invalid request format" }, { status: 400 });
    }

    const results = [];

    for (const op of operations) {
      try {
        const { action, collection, data, localId } = op;

        console.log("🔄 Processing operation:", { action, collection, localId, data });

        if (collection === "expenses") {
          if (action === "CREATE") {
            console.log("💾 Creating expense via service");
            const result = await expenseService.createExpense(session.user.id, data);

            if (result.isFailure()) {
              const error = result.error;
              console.error("❌ Failed to create expense:", localId, error.message);
              results.push({
                localId,
                success: false,
                error: error.message,
              });
              continue;
            }

            console.log("✅ Expense created with ID:", result.value.id);
            results.push({
              localId,
              remoteId: result.value.id,
              success: true,
            });
          } else if (action === "UPDATE" && data._id) {
            const result = await expenseService.updateExpense(data._id, session.user.id, data);

            if (result.isFailure()) {
              results.push({
                localId,
                success: false,
                error: result.error.message,
              });
              continue;
            }

            results.push({
              localId,
              remoteId: data._id,
              success: true,
            });
          } else if (action === "DELETE" && data._id) {
            const result = await expenseService.deleteExpense(data._id, session.user.id);

            if (result.isFailure()) {
              results.push({
                localId,
                success: false,
                error: result.error.message,
              });
              continue;
            }

            results.push({
              localId,
              remoteId: data._id,
              success: true,
            });
          }
        } else if (collection === "categories") {
          if (action === "CREATE") {
            const result = await categoryService.createCategory(session.user.id, data);

            if (result.isFailure()) {
              results.push({
                localId,
                success: false,
                error: result.error.message,
              });
              continue;
            }

            results.push({
              localId,
              remoteId: result.value.id,
              success: true,
            });
          }
        } else if (collection === "budgets") {
          if (action === "CREATE" || action === "UPDATE") {
            const result = await budgetService.createBudget(session.user.id, data);

            if (result.isFailure()) {
              results.push({
                localId,
                success: false,
                error: result.error.message,
              });
              continue;
            }

            results.push({
              localId,
              remoteId: result.value.id,
              success: true,
            });
          }
        } else if (collection === "incomes") {
          if (action === "CREATE") {
            console.log("💾 Creating income via service");
            const result = await incomeService.createIncome(session.user.id, data);

            if (result.isFailure()) {
              console.error("❌ Failed to create income:", localId, result.error.message);
              results.push({
                localId,
                success: false,
                error: result.error.message,
              });
              continue;
            }

            console.log("✅ Income created with ID:", result.value.id);
            results.push({
              localId,
              remoteId: result.value.id,
              success: true,
            });
          } else if (action === "UPDATE" && data._id) {
            const result = await incomeService.updateIncome(data._id, session.user.id, data);

            if (result.isFailure()) {
              results.push({
                localId,
                success: false,
                error: result.error.message,
              });
              continue;
            }

            results.push({
              localId,
              remoteId: data._id,
              success: true,
            });
          } else if (action === "DELETE" && data._id) {
            const result = await incomeService.deleteIncome(data._id, session.user.id);

            if (result.isFailure()) {
              results.push({
                localId,
                success: false,
                error: result.error.message,
              });
              continue;
            }

            results.push({
              localId,
              remoteId: data._id,
              success: true,
            });
          }
        } else if (collection === "loans") {
          if (action === "CREATE") {
            console.log("💾 Creating loan via service");
            const result = await loanService.createLoan(session.user.id, data);

            if (result.isFailure()) {
              console.error("❌ Failed to create loan:", localId, result.error.message);
              results.push({
                localId,
                success: false,
                error: result.error.message,
              });
              continue;
            }

            console.log("✅ Loan created with ID:", result.value.id);
            results.push({
              localId,
              remoteId: result.value.id,
              success: true,
            });
          } else if (action === "UPDATE" && data._id) {
            const result = await loanService.updateLoan(data._id, session.user.id, data);

            if (result.isFailure()) {
              results.push({
                localId,
                success: false,
                error: result.error.message,
              });
              continue;
            }

            results.push({
              localId,
              remoteId: data._id,
              success: true,
            });
          } else if (action === "DELETE" && data._id) {
            const result = await loanService.deleteLoan(data._id, session.user.id);

            if (result.isFailure()) {
              results.push({
                localId,
                success: false,
                error: result.error.message,
              });
              continue;
            }

            results.push({
              localId,
              remoteId: data._id,
              success: true,
            });
          }
        } else if (collection === "loanPayments") {
          if (action === "CREATE") {
            console.log("💾 Creating loan payment via service");
            const result = await loanPaymentService.createPayment(session.user.id, data);

            if (result.isFailure()) {
              console.error("❌ Failed to create loan payment:", localId, result.error.message);
              results.push({
                localId,
                success: false,
                error: result.error.message,
              });
              continue;
            }

            console.log("✅ Loan payment created with ID:", result.value.id);
            results.push({
              localId,
              remoteId: result.value.id,
              success: true,
            });
          } else if (action === "DELETE" && data._id) {
            const result = await loanPaymentService.deletePayment(data._id, session.user.id);

            if (result.isFailure()) {
              results.push({
                localId,
                success: false,
                error: result.error.message,
              });
              continue;
            }

            results.push({
              localId,
              remoteId: data._id,
              success: true,
            });
          }
        } else if (collection === "contacts") {
          if (action === "CREATE") {
            console.log("💾 Creating contact via service");
            const result = await contactService.createContact(session.user.id, data);

            if (result.isFailure()) {
              console.error("❌ Failed to create contact:", localId, result.error.message);
              results.push({
                localId,
                success: false,
                error: result.error.message,
              });
              continue;
            }

            console.log("✅ Contact created with ID:", result.value.id);
            results.push({
              localId,
              remoteId: result.value.id,
              success: true,
            });
          } else if (action === "UPDATE" && data._id) {
            const result = await contactService.updateContact(data._id, session.user.id, data);

            if (result.isFailure()) {
              results.push({
                localId,
                success: false,
                error: result.error.message,
              });
              continue;
            }

            results.push({
              localId,
              remoteId: data._id,
              success: true,
            });
          } else if (action === "DELETE" && data._id) {
            const result = await contactService.deleteContact(data._id, session.user.id);

            if (result.isFailure()) {
              results.push({
                localId,
                success: false,
                error: result.error.message,
              });
              continue;
            }

            results.push({
              localId,
              remoteId: data._id,
              success: true,
            });
          }
        }
      } catch (error) {
        console.error("Error processing operation:", error);
        results.push({
          localId: op.localId,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const response = NextResponse.json({ results });
    return addCorsHeaders(response, request.headers.get("origin"));
  } catch (error) {
    console.error("Error syncing data:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
