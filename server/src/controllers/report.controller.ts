import type { NextFunction, Request, Response } from "express";

import * as reportService from "../services/report.service";
import * as reportExport from "../services/report.export";
import { sendReportExport } from "./reportExport.helper";
import type {
  CustomerReportQuery,
  ExpenseReportQuery,
  IncomeReportQuery,
  InvoiceReportQuery,
  MonthlySummaryReportQuery,
  OutstandingBalanceReportQuery,
  PaymentReportQuery,
  ProductReportQuery,
  ProfitLossReportQuery,
  SalesReportQuery,
  SupplierReportQuery,
  TaxReportQuery
} from "../validators/report.validator";

export async function sales(req: Request, res: Response, next: NextFunction) {
  try {
    const query = (req.validatedQuery ?? {}) as SalesReportQuery;
    const report = await reportService.getSalesReport(req.user!.companyId!, query);

    if (query.format) {
      return sendReportExport(res, query.format, reportExport.salesExportTable(report), "sales-report");
    }

    res.status(200).json({ report });
  } catch (err) {
    next(err);
  }
}

export async function profitAndLoss(req: Request, res: Response, next: NextFunction) {
  try {
    const query = (req.validatedQuery ?? {}) as ProfitLossReportQuery;
    const report = await reportService.getProfitLossReport(req.user!.companyId!, query);

    if (query.format) {
      return sendReportExport(res, query.format, reportExport.profitLossExportTable(report), "profit-loss-report");
    }

    res.status(200).json({ report });
  } catch (err) {
    next(err);
  }
}

export async function outstandingBalance(req: Request, res: Response, next: NextFunction) {
  try {
    const query = (req.validatedQuery ?? {}) as OutstandingBalanceReportQuery;
    const report = await reportService.getOutstandingBalanceReport(req.user!.companyId!, query);

    if (query.format) {
      return sendReportExport(
        res,
        query.format,
        reportExport.outstandingBalanceExportTable(report),
        "outstanding-balance-report"
      );
    }

    res.status(200).json({ report });
  } catch (err) {
    next(err);
  }
}

export async function customers(req: Request, res: Response, next: NextFunction) {
  try {
    const query = (req.validatedQuery ?? {}) as CustomerReportQuery;
    const report = await reportService.getCustomerReport(req.user!.companyId!, query);

    if (query.format) {
      return sendReportExport(res, query.format, reportExport.customerExportTable(report), "customer-report");
    }

    res.status(200).json({ report });
  } catch (err) {
    next(err);
  }
}

export async function suppliers(req: Request, res: Response, next: NextFunction) {
  try {
    const query = (req.validatedQuery ?? {}) as SupplierReportQuery;
    const report = await reportService.getSupplierReport(req.user!.companyId!, query);

    if (query.format) {
      return sendReportExport(res, query.format, reportExport.supplierExportTable(report), "supplier-report");
    }

    res.status(200).json({ report });
  } catch (err) {
    next(err);
  }
}

export async function products(req: Request, res: Response, next: NextFunction) {
  try {
    const query = (req.validatedQuery ?? {}) as ProductReportQuery;
    const report = await reportService.getProductReport(req.user!.companyId!, query);

    if (query.format) {
      return sendReportExport(res, query.format, reportExport.productExportTable(report), "product-report");
    }

    res.status(200).json({ report });
  } catch (err) {
    next(err);
  }
}

export async function invoices(req: Request, res: Response, next: NextFunction) {
  try {
    const query = (req.validatedQuery ?? {}) as InvoiceReportQuery;
    const report = await reportService.getInvoiceReport(req.user!.companyId!, query);

    if (query.format) {
      return sendReportExport(res, query.format, reportExport.invoiceExportTable(report), "invoice-report");
    }

    res.status(200).json({ report });
  } catch (err) {
    next(err);
  }
}

export async function expenses(req: Request, res: Response, next: NextFunction) {
  try {
    const query = (req.validatedQuery ?? {}) as ExpenseReportQuery;
    const report = await reportService.getExpenseReport(req.user!.companyId!, query);

    if (query.format) {
      return sendReportExport(res, query.format, reportExport.expenseExportTable(report), "expense-report");
    }

    res.status(200).json({ report });
  } catch (err) {
    next(err);
  }
}

export async function incomes(req: Request, res: Response, next: NextFunction) {
  try {
    const query = (req.validatedQuery ?? {}) as IncomeReportQuery;
    const report = await reportService.getIncomeReport(req.user!.companyId!, query);

    if (query.format) {
      return sendReportExport(res, query.format, reportExport.incomeExportTable(report), "income-report");
    }

    res.status(200).json({ report });
  } catch (err) {
    next(err);
  }
}

export async function payments(req: Request, res: Response, next: NextFunction) {
  try {
    const query = (req.validatedQuery ?? {}) as PaymentReportQuery;
    const report = await reportService.getPaymentReport(req.user!.companyId!, query);

    if (query.format) {
      return sendReportExport(res, query.format, reportExport.paymentExportTable(report), "payment-report");
    }

    res.status(200).json({ report });
  } catch (err) {
    next(err);
  }
}

export async function tax(req: Request, res: Response, next: NextFunction) {
  try {
    const query = (req.validatedQuery ?? {}) as TaxReportQuery;
    const report = await reportService.getTaxReport(req.user!.companyId!, query);

    if (query.format) {
      return sendReportExport(res, query.format, reportExport.taxExportTable(report), "tax-report");
    }

    res.status(200).json({ report });
  } catch (err) {
    next(err);
  }
}

export async function monthlySummary(req: Request, res: Response, next: NextFunction) {
  try {
    const query = (req.validatedQuery ?? {}) as MonthlySummaryReportQuery;
    const report = await reportService.getMonthlySummaryReport(req.user!.companyId!, query);

    if (query.format) {
      return sendReportExport(
        res,
        query.format,
        reportExport.monthlySummaryExportTable(report),
        "monthly-summary-report"
      );
    }

    res.status(200).json({ report });
  } catch (err) {
    next(err);
  }
}
