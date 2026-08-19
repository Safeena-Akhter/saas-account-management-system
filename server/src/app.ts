import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import fs from "fs";
import path from "path";

import { env, isProduction } from "./config/env";
import authRoutes from "./routes/auth.routes";
import companyRoutes from "./routes/company.routes";
import userRoutes from "./routes/user.routes";
import categoryRoutes from "./routes/category.routes";
import productRoutes from "./routes/product.routes";
import customerRoutes from "./routes/customer.routes";
import supplierRoutes from "./routes/supplier.routes";
import invitationRoutes from "./routes/invitation.routes";
import invoiceRoutes from "./routes/invoice.routes";
import paymentRoutes from "./routes/payment.routes";
import expenseRoutes from "./routes/expense.routes";
import expenseCategoryRoutes from "./routes/expenseCategory.routes";
import incomeRoutes from "./routes/income.routes";
import incomeCategoryRoutes from "./routes/incomeCategory.routes";
import planRoutes from "./routes/plan.routes";
import subscriptionRoutes from "./routes/subscription.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import reportRoutes from "./routes/report.routes";
import notificationRoutes from "./routes/notification.routes";
import platformCompanyRoutes from "./routes/platformCompany.routes";
import platformUserRoutes from "./routes/platformUser.routes";
import platformRevenueRoutes from "./routes/platformRevenue.routes";
import platformSettingsRoutes from "./routes/platformSettings.routes";

const app = express();

// CORS is restricted to the configured frontend origin(s) rather than left
// wide open, since this API will carry auth cookies/JWTs across tenants.
app.use(
  cors({
    origin: env.CORS_ORIGIN.split(",").map(origin => origin.trim()),
    credentials: true
  })
);
app.use(helmet());
app.use(morgan(isProduction ? "combined" : "dev"));
app.use(express.json());
app.use(cookieParser());

app.get("/", (_req: Request, res: Response) => {
  res.json({ status: "ok", service: "AMS Backend", env: env.NODE_ENV });
});

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Route mounting happens here as each module is built:
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/companies", companyRoutes); // Phase 3
app.use("/api/v1/users", userRoutes); // Phase 3
app.use("/api/v1/categories", categoryRoutes); // Phase 4
app.use("/api/v1/products", productRoutes); // Phase 4
app.use("/api/v1/customers", customerRoutes); // Phase 5
app.use("/api/v1/suppliers", supplierRoutes); // Phase 5
app.use("/api/v1/invitations", invitationRoutes);
app.use("/api/v1/invoices", invoiceRoutes); // Phase 9
app.use("/api/v1/expenses", expenseRoutes); // Phase 10
app.use("/api/v1/expense-categories", expenseCategoryRoutes);
app.use("/api/v1/incomes", incomeRoutes);
app.use("/api/v1/income-categories", incomeCategoryRoutes);
app.use("/api/v1/payments", paymentRoutes); // Phase 12
app.use("/api/v1/plans", planRoutes); // Phase 16
app.use("/api/v1/subscriptions", subscriptionRoutes); // Phase 16
app.use("/api/v1/dashboard", dashboardRoutes); // Phase 8
app.use("/api/v1/reports", reportRoutes); // Phase 13
app.use("/api/v1/notifications", notificationRoutes);
// Phase 3 (Super Admin panel) - platform-level company management,
// distinct from /api/v1/companies above (which is tenant-scoped, /me
// only). SUPER_ADMIN-only, enforced inside platformCompany.routes.ts.
app.use("/api/v1/platform/companies", platformCompanyRoutes);
// Platform-level user management - view/activate/deactivate any user in
// any company. SUPER_ADMIN-only, enforced inside platformUser.routes.ts.
// Distinct from /api/v1/users above (tenant-scoped, Business Owner/Manager
// managing their own company's users only).
app.use("/api/v1/platform/users", platformUserRoutes);
// Platform-wide revenue analytics (MRR, breakdown by plan/billing cycle,
// top companies by revenue). SUPER_ADMIN-only, enforced inside
// platformRevenue.routes.ts. Read-only - no write endpoints, revenue is
// derived entirely from CompanySubscription + Plan pricing.
app.use("/api/v1/platform/revenue", platformRevenueRoutes);
// Platform-wide operational settings (name, support contact, maintenance
// mode) - a singleton row, distinct from a user's own account Settings.
// SUPER_ADMIN-only, enforced inside platformSettings.routes.ts.
app.use("/api/v1/platform/settings", platformSettingsRoutes);
// ...

// 404 handler - must come after all routes are mounted
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Every 500 (and any other error) is appended here, in addition to the
// console - a plain text file you can open like any other file, for cases
// where finding/reading the terminal that's running this process isn't
// convenient. Each entry has a timestamp, the request that triggered it,
// and the full stack trace. Safe to delete any time - it's just a log,
// recreated on next error.
const ERROR_LOG_PATH = path.join(__dirname, "..", "error.log");

function logErrorToFile(err: any, req: Request) {
  const entry = [
    `\n[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`,
    err.stack ?? String(err),
    "-".repeat(80)
  ].join("\n");

  try {
    fs.appendFileSync(ERROR_LOG_PATH, entry);
  } catch {
    // If the log file itself can't be written (e.g. read-only filesystem),
    // fall through silently - console.error below still ran, and a broken
    // log write should never be the thing that crashes error handling.
  }
}

// Centralized error handler - must be registered last, with 4 args, so
// Express recognizes it as an error-handling middleware.
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  // eslint-disable-next-line no-console
  console.error(err);
  logErrorToFile(err, req);

  const statusCode = err.statusCode ?? 500;
  const message = isProduction && statusCode === 500 ? "Internal server error" : err.message ?? "Internal server error";

  res.status(statusCode).json({ message, ...(isProduction ? {} : { stack: err.stack }) });
});

export default app;
