// Turns an already-fetched report (the same object every report.service.ts
// getter returns for the JSON response) into a generic ExportTable for
// utils/exporters.ts. Kept as its own module rather than folded into
// report.service.ts so "what does this report look like on screen/as JSON"
// and "what does this report look like as a spreadsheet" stay separable -
// the export shape is deliberately flatter (no nested summary objects) than
// the JSON one.
//
// Every builder takes the *result* of the matching report.service.ts getter
// (via `Awaited<ReturnType<typeof ...>>`) rather than re-deriving its own
// types, so this can never drift out of sync with the JSON response shape -
// if a report's return shape changes, this file fails to compile until it's
// updated too.

import dayjs from "dayjs";

import type * as reportService from "./report.service";
import type { ExportTable } from "../utils/exporters";

const money = (value: unknown) => Number(value ?? 0).toFixed(2);
const date = (value: unknown) => (value ? dayjs(value as string | Date).format("YYYY-MM-DD") : "");

export function salesExportTable(report: Awaited<ReturnType<typeof reportService.getSalesReport>>): ExportTable {
  return {
    title: "Sales Report",
    generatedAt: new Date(),
    columns: [
      { key: "invoiceNumber", label: "Invoice #" },
      { key: "customerName", label: "Customer" },
      { key: "issueDate", label: "Date", format: date },
      { key: "status", label: "Status" },
      { key: "totalAmount", label: "Amount", format: money },
      { key: "amountPaid", label: "Paid", format: money }
    ],
    rows: report.rows
  };
}

export function profitLossExportTable(
  report: Awaited<ReturnType<typeof reportService.getProfitLossReport>>
): ExportTable {
  const rows: Record<string, unknown>[] = [
    { line: "Payments Received", amount: report.revenue.paymentsReceived },
    { line: "Other Income", amount: report.revenue.otherIncome },
    { line: "Total Revenue", amount: report.revenue.total },
    ...report.expenses.byCategory.map(c => ({ line: `Expense: ${c.category}`, amount: -c.total })),
    { line: "Total Expenses", amount: -report.expenses.total },
    { line: "Net Profit", amount: report.netProfit }
  ];

  return {
    title: "Profit & Loss Report",
    generatedAt: new Date(),
    columns: [
      { key: "line", label: "Line Item" },
      { key: "amount", label: "Amount", format: money }
    ],
    rows
  };
}

export function outstandingBalanceExportTable(
  report: Awaited<ReturnType<typeof reportService.getOutstandingBalanceReport>>
): ExportTable {
  return {
    title: "Outstanding Balance Report",
    generatedAt: new Date(),
    columns: [
      { key: "customerName", label: "Customer" },
      { key: "customerEmail", label: "Email" },
      { key: "invoiceCount", label: "Open Invoices" },
      { key: "outstanding", label: "Outstanding", format: money }
    ],
    rows: report.byCustomer
  };
}

export function customerExportTable(
  report: Awaited<ReturnType<typeof reportService.getCustomerReport>>
): ExportTable {
  return {
    title: "Customer Report",
    generatedAt: new Date(),
    columns: [
      { key: "customerName", label: "Customer" },
      { key: "customerEmail", label: "Email" },
      { key: "invoiceCount", label: "Invoices" },
      { key: "totalInvoiced", label: "Invoiced", format: money },
      { key: "totalCollected", label: "Collected", format: money },
      { key: "outstanding", label: "Outstanding", format: money }
    ],
    rows: report.rows
  };
}

export function supplierExportTable(
  report: Awaited<ReturnType<typeof reportService.getSupplierReport>>
): ExportTable {
  return {
    title: "Supplier Report",
    generatedAt: new Date(),
    columns: [
      { key: "supplierName", label: "Supplier" },
      { key: "supplierEmail", label: "Email" },
      { key: "expenseCount", label: "Expenses" },
      { key: "totalExpenses", label: "Total Expenses", format: money },
      { key: "totalPaid", label: "Paid This Period", format: money },
      { key: "outstandingPayable", label: "Outstanding Payable", format: money }
    ],
    rows: report.rows
  };
}

export function productExportTable(report: Awaited<ReturnType<typeof reportService.getProductReport>>): ExportTable {
  return {
    title: "Product Report",
    generatedAt: new Date(),
    columns: [
      { key: "productName", label: "Product" },
      { key: "sku", label: "SKU" },
      { key: "categoryName", label: "Category" },
      { key: "unitsSold", label: "Units Sold" },
      { key: "revenue", label: "Revenue", format: money },
      { key: "stockQuantity", label: "Stock" },
      { key: "price", label: "Price", format: money }
    ],
    rows: report.rows
  };
}

export function invoiceExportTable(report: Awaited<ReturnType<typeof reportService.getInvoiceReport>>): ExportTable {
  return {
    title: "Invoice Report",
    generatedAt: new Date(),
    columns: [
      { key: "invoiceNumber", label: "Invoice #" },
      { key: "customerName", label: "Customer" },
      { key: "issueDate", label: "Issue Date", format: date },
      { key: "dueDate", label: "Due Date", format: date },
      { key: "status", label: "Status" },
      { key: "totalAmount", label: "Total", format: money },
      { key: "amountPaid", label: "Paid", format: money },
      { key: "balance", label: "Balance", format: money }
    ],
    rows: report.rows
  };
}

export function expenseExportTable(report: Awaited<ReturnType<typeof reportService.getExpenseReport>>): ExportTable {
  return {
    title: "Expense Report",
    generatedAt: new Date(),
    columns: [
      { key: "title", label: "Title" },
      { key: "category", label: "Category" },
      { key: "supplierName", label: "Supplier" },
      { key: "expenseDate", label: "Date", format: date },
      { key: "paymentMethod", label: "Method" },
      { key: "amount", label: "Amount", format: money }
    ],
    rows: report.rows
  };
}

export function incomeExportTable(report: Awaited<ReturnType<typeof reportService.getIncomeReport>>): ExportTable {
  return {
    title: "Income Report",
    generatedAt: new Date(),
    columns: [
      { key: "title", label: "Title" },
      { key: "category", label: "Category" },
      { key: "customerName", label: "Customer" },
      { key: "incomeDate", label: "Date", format: date },
      { key: "method", label: "Method" },
      { key: "amount", label: "Amount", format: money }
    ],
    rows: report.rows
  };
}

export function paymentExportTable(report: Awaited<ReturnType<typeof reportService.getPaymentReport>>): ExportTable {
  return {
    title: "Payment Report",
    generatedAt: new Date(),
    columns: [
      { key: "paymentDate", label: "Date", format: date },
      { key: "type", label: "Type" },
      { key: "customerName", label: "Customer" },
      { key: "supplierName", label: "Supplier" },
      { key: "method", label: "Method" },
      { key: "status", label: "Status" },
      { key: "reference", label: "Reference" },
      { key: "amount", label: "Amount", format: money }
    ],
    rows: report.rows
  };
}

export function taxExportTable(report: Awaited<ReturnType<typeof reportService.getTaxReport>>): ExportTable {
  return {
    title: "Tax Report",
    generatedAt: new Date(),
    columns: [
      { key: "invoiceNumber", label: "Invoice #" },
      { key: "customerName", label: "Customer" },
      { key: "issueDate", label: "Date", format: date },
      { key: "subtotal", label: "Subtotal", format: money },
      { key: "taxAmount", label: "Tax", format: money },
      { key: "totalAmount", label: "Total", format: money }
    ],
    rows: report.rows
  };
}

export function monthlySummaryExportTable(
  report: Awaited<ReturnType<typeof reportService.getMonthlySummaryReport>>
): ExportTable {
  return {
    title: "Monthly Summary Report",
    generatedAt: new Date(),
    columns: [
      { key: "label", label: "Month" },
      { key: "revenue", label: "Revenue", format: money },
      { key: "expenses", label: "Expenses", format: money },
      { key: "profit", label: "Profit", format: money },
      { key: "sales", label: "Invoiced Sales", format: money },
      { key: "invoiceCount", label: "Invoices" }
    ],
    rows: report.months
  };
}
