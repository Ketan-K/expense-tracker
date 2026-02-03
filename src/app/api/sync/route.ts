import { auth } from "@/auth";
import { getConnectedClient } from "@/lib/mongodb";
import type { Expense, Category, Budget, Income, Loan, LoanPayment, Contact } from "@/lib/types";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import {
  validateExpense,
  validateCategory,
  validateBudget,
  validateIncome,
  validateLoan,
  validateLoanPayment,
  validateContact,
} from "@/lib/validation";
import { applyRateLimit, getIP } from "@/lib/ratelimit-middleware";
import { rateLimiters } from "@/lib/ratelimit";
import { handleOptionsRequest, addCorsHeaders } from "@/lib/cors";

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

    const client = await getConnectedClient();
    const db = client.db();

    const results = [];

    for (const op of operations) {
      try {
        const { action, collection, data, localId } = op;

        console.log("🔄 Processing operation:", { action, collection, localId, data });

        if (collection === "expenses") {
          if (action === "CREATE") {
            // Validate expense data
            const validation = validateExpense(data);
            console.log("📋 Validation result:", validation);

            if (!validation.isValid) {
              console.error("❌ Validation failed for expense:", localId, validation.errors);
              results.push({
                localId,
                success: false,
                error: `Validation failed: ${validation.errors.join(", ")}`,
              });
              continue;
            }

            const expense: Expense = {
              userId: session.user.id,
              ...validation.sanitized!,
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            console.log("💾 Inserting expense to MongoDB:", expense);
            const result = await db.collection<Expense>("expenses").insertOne(expense);
            const finalId = expense._id || result.insertedId;
            console.log("✅ Expense inserted with ID:", finalId.toString());

            results.push({
              localId,
              remoteId: finalId.toString(),
              success: true,
            });
          } else if (action === "UPDATE" && data._id) {
            // Validate expense data
            const validation = validateExpense(data);
            if (!validation.isValid) {
              results.push({
                localId,
                success: false,
                error: `Validation failed: ${validation.errors.join(", ")}`,
              });
              continue;
            }

            const updateData = {
              ...validation.sanitized!,
              updatedAt: new Date(),
            };

            await db
              .collection<Expense>("expenses")
              .updateOne(
                { _id: new ObjectId(data._id), userId: session.user.id },
                { $set: updateData }
              );

            results.push({
              localId,
              remoteId: data._id,
              success: true,
            });
          } else if (action === "DELETE" && data._id) {
            await db.collection<Expense>("expenses").deleteOne({
              _id: new ObjectId(data._id),
              userId: session.user.id,
            });

            results.push({
              localId,
              remoteId: data._id,
              success: true,
            });
          }
        } else if (collection === "categories") {
          if (action === "CREATE") {
            // Validate category data
            const validation = validateCategory(data);
            if (!validation.isValid) {
              results.push({
                localId,
                success: false,
                error: `Validation failed: ${validation.errors.join(", ")}`,
              });
              continue;
            }

            const category: Category = {
              userId: session.user.id,
              ...validation.sanitized!,
              isDefault: false,
              createdAt: new Date(),
            };

            const result = await db.collection<Category>("categories").insertOne(category);
            const finalId = category._id || result.insertedId;
            results.push({
              localId,
              remoteId: finalId.toString(),
              success: true,
            });
          }
        } else if (collection === "budgets") {
          if (action === "CREATE" || action === "UPDATE") {
            // Validate budget data
            const validation = validateBudget(data);
            if (!validation.isValid) {
              results.push({
                localId,
                success: false,
                error: `Validation failed: ${validation.errors.join(", ")}`,
              });
              continue;
            }

            const budget: Budget = {
              userId: session.user.id,
              ...validation.sanitized!,
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            const result = await db.collection<Budget>("budgets").findOneAndUpdate(
              {
                userId: session.user.id,
                categoryId: validation.sanitized!.categoryId,
                month: validation.sanitized!.month,
              },
              { $set: budget },
              { upsert: true, returnDocument: "after" }
            );

            results.push({
              localId,
              remoteId: result?._id?.toString(),
              success: true,
            });
          }
        } else if (collection === "incomes") {
          if (action === "CREATE") {
            // Validate income data
            const validation = validateIncome(data);
            if (!validation.isValid) {
              console.error("❌ Validation failed for income:", localId, validation.errors);
              results.push({
                localId,
                success: false,
                error: `Validation failed: ${validation.errors.join(", ")}`,
              });
              continue;
            }

            const income: Income = {
              userId: session.user.id,
              ...validation.sanitized!,
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            console.log("💾 Inserting income to MongoDB:", income);
            const result = await db.collection<Income>("incomes").insertOne(income);
            const finalId = income._id || result.insertedId;
            console.log("✅ Income inserted with ID:", finalId.toString());

            results.push({
              localId,
              remoteId: finalId.toString(),
              success: true,
            });
          } else if (action === "UPDATE" && data._id) {
            // Validate income data
            const validation = validateIncome(data);
            if (!validation.isValid) {
              results.push({
                localId,
                success: false,
                error: `Validation failed: ${validation.errors.join(", ")}`,
              });
              continue;
            }

            const updateData = {
              ...validation.sanitized!,
              updatedAt: new Date(),
            };

            await db
              .collection<Income>("incomes")
              .updateOne(
                { _id: new ObjectId(data._id), userId: session.user.id },
                { $set: updateData }
              );

            results.push({
              localId,
              remoteId: data._id,
              success: true,
            });
          } else if (action === "DELETE" && data._id) {
            await db.collection<Income>("incomes").deleteOne({
              _id: new ObjectId(data._id),
              userId: session.user.id,
            });

            results.push({
              localId,
              remoteId: data._id,
              success: true,
            });
          }
        } else if (collection === "loans") {
          if (action === "CREATE") {
            // Validate loan data
            const validation = validateLoan(data);
            if (!validation.isValid) {
              console.error("❌ Validation failed for loan:", localId, validation.errors);
              results.push({
                localId,
                success: false,
                error: `Validation failed: ${validation.errors.join(", ")}`,
              });
              continue;
            }

            const loan: Loan = {
              userId: session.user.id,
              ...validation.sanitized!,
              outstandingAmount: validation.sanitized!.principalAmount, // Initially outstanding = principal
              status: "active",
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            console.log("💾 Inserting loan to MongoDB:", loan);
            const result = await db.collection<Loan>("loans").insertOne(loan);
            const finalId = loan._id || result.insertedId;
            console.log("✅ Loan inserted with ID:", finalId.toString());

            results.push({
              localId,
              remoteId: finalId.toString(),
              success: true,
            });
          } else if (action === "UPDATE" && data._id) {
            // Validate loan data
            const validation = validateLoan(data);
            if (!validation.isValid) {
              results.push({
                localId,
                success: false,
                error: `Validation failed: ${validation.errors.join(", ")}`,
              });
              continue;
            }

            const updateData = {
              ...validation.sanitized!,
              outstandingAmount: data.outstandingAmount, // Preserve outstanding amount from data
              status: data.status || "active",
              updatedAt: new Date(),
            };

            await db
              .collection<Loan>("loans")
              .updateOne(
                { _id: new ObjectId(data._id), userId: session.user.id },
                { $set: updateData }
              );

            results.push({
              localId,
              remoteId: data._id,
              success: true,
            });
          } else if (action === "DELETE" && data._id) {
            await db.collection<Loan>("loans").deleteOne({
              _id: new ObjectId(data._id),
              userId: session.user.id,
            });

            results.push({
              localId,
              remoteId: data._id,
              success: true,
            });
          }
        } else if (collection === "loanPayments") {
          if (action === "CREATE") {
            // Validate loan payment data
            const validation = validateLoanPayment(data);
            if (!validation.isValid) {
              console.error("❌ Validation failed for loan payment:", localId, validation.errors);
              results.push({
                localId,
                success: false,
                error: `Validation failed: ${validation.errors.join(", ")}`,
              });
              continue;
            }

            const loanPayment: LoanPayment = {
              userId: session.user.id,
              ...validation.sanitized!,
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            console.log("💾 Inserting loan payment to MongoDB:", loanPayment);
            const result = await db.collection<LoanPayment>("loanPayments").insertOne(loanPayment);
            console.log("✅ Loan payment inserted with ID:", result.insertedId.toString());

            // Update parent loan's outstanding amount
            if (loanPayment.loanId) {
              await db.collection<Loan>("loans").updateOne(
                { _id: new ObjectId(loanPayment.loanId), userId: session.user.id },
                {
                  $inc: { outstandingAmount: -loanPayment.amount },
                  $set: { updatedAt: new Date() },
                }
              );
              console.log("✅ Updated parent loan outstanding amount");
            }

            const finalId = loanPayment._id || result.insertedId;
            results.push({
              localId,
              remoteId: finalId.toString(),
              success: true,
            });
          } else if (action === "DELETE" && data._id) {
            // Get payment amount before deleting
            const payment = await db.collection<LoanPayment>("loanPayments").findOne({
              _id: new ObjectId(data._id),
              userId: session.user.id,
            });

            if (payment) {
              await db.collection<LoanPayment>("loanPayments").deleteOne({
                _id: new ObjectId(data._id),
                userId: session.user.id,
              });

              // Reverse the payment amount in parent loan
              if (payment.loanId) {
                await db.collection<Loan>("loans").updateOne(
                  { _id: new ObjectId(payment.loanId), userId: session.user.id },
                  {
                    $inc: { outstandingAmount: payment.amount },
                    $set: { updatedAt: new Date() },
                  }
                );
                console.log("✅ Reversed parent loan outstanding amount");
              }

              results.push({
                localId,
                remoteId: data._id,
                success: true,
              });
            } else {
              results.push({
                localId,
                success: false,
                error: "Loan payment not found",
              });
            }
          }
        } else if (collection === "contacts") {
          if (action === "CREATE") {
            // Validate contact data
            const validation = validateContact(data);
            if (!validation.isValid) {
              console.error("❌ Validation failed for contact:", localId, validation.errors);
              results.push({
                localId,
                success: false,
                error: `Validation failed: ${validation.errors.join(", ")}`,
              });
              continue;
            }

            const contact: Contact = {
              userId: session.user.id,
              ...validation.sanitized!,
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            console.log("💾 Inserting contact to MongoDB:", contact);
            const result = await db.collection<Contact>("contacts").insertOne(contact);
            const finalId = contact._id || result.insertedId;
            console.log("✅ Contact inserted with ID:", finalId.toString());

            results.push({
              localId,
              remoteId: finalId.toString(),
              success: true,
            });
          } else if (action === "UPDATE" && data._id) {
            // Validate contact data
            const validation = validateContact(data);
            if (!validation.isValid) {
              results.push({
                localId,
                success: false,
                error: `Validation failed: ${validation.errors.join(", ")}`,
              });
              continue;
            }

            const updateData = {
              ...validation.sanitized!,
              updatedAt: new Date(),
            };

            await db
              .collection<Contact>("contacts")
              .updateOne(
                { _id: new ObjectId(data._id), userId: session.user.id },
                { $set: updateData }
              );

            results.push({
              localId,
              remoteId: data._id,
              success: true,
            });
          } else if (action === "DELETE" && data._id) {
            // Check if contact is referenced by any loans
            const loansWithContact = await db.collection<Loan>("loans").countDocuments({
              userId: session.user.id,
              contactId: data._id,
            });

            if (loansWithContact > 0) {
              results.push({
                localId,
                success: false,
                error: `Cannot delete contact: ${loansWithContact} loans reference this contact`,
              });
              continue;
            }

            await db.collection<Contact>("contacts").deleteOne({
              _id: new ObjectId(data._id),
              userId: session.user.id,
            });

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
