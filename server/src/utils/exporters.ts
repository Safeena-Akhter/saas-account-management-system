// Generic, report-agnostic export helpers. Every report (existing + newly
// added) reuses this single implementation instead of hand-rolling its own
// CSV/Excel/PDF writer - each report only ever needs to describe *what its
// columns are*, not *how a spreadsheet gets built*.
//
// Kept deliberately dumb: given a title + column defs + plain row objects,
// produce a Buffer. No knowledge of Prisma, companyId, or any specific
// report lives here - that's the caller's job (report.export.ts).

import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

export type ExportColumn = {
  key: string;
  label: string;
  // Optional per-column formatter - e.g. currency, date. Falls back to
  // String(value) when omitted. Applied identically across all 3 formats
  // so a CSV/Excel/PDF export of the same report always agree on values.
  format?: (value: unknown) => string;
};

export type ExportTable = {
  title: string;
  generatedAt: Date;
  columns: ExportColumn[];
  rows: Record<string, unknown>[];
};

function cellText(column: ExportColumn, row: Record<string, unknown>): string {
  const raw = row[column.key];

  if (raw === null || raw === undefined) return "";

  return column.format ? column.format(raw) : String(raw);
}

// -----------------------------------------------------------------------------
// CSV
// -----------------------------------------------------------------------------

// Escapes a single field per RFC 4180: wrap in quotes and double any
// embedded quote whenever the field contains a comma, quote, or newline.
function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

export function toCsv(table: ExportTable): string {
  const header = table.columns.map(c => escapeCsvField(c.label)).join(",");

  const lines = table.rows.map(row => table.columns.map(c => escapeCsvField(cellText(c, row))).join(","));

  return [header, ...lines].join("\r\n");
}

// -----------------------------------------------------------------------------
// Excel (.xlsx)
// -----------------------------------------------------------------------------

export async function toExcelBuffer(table: ExportTable): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();

  workbook.creator = "Account Management System";
  workbook.created = table.generatedAt;

  // Sheet names can't exceed 31 chars or contain []:*?/\\ - report titles
  // are short and plain-text today, but guard anyway rather than letting a
  // future report title crash the export.
  const sheetName = table.title.replace(/[[\]:*?/\\]/g, "").slice(0, 31) || "Report";
  const sheet = workbook.addWorksheet(sheetName);

  sheet.columns = table.columns.map(c => ({ header: c.label, key: c.key, width: Math.max(c.label.length + 4, 14) }));
  sheet.getRow(1).font = { bold: true };

  for (const row of table.rows) {
    const values: Record<string, string> = {};

    for (const column of table.columns) {
      values[column.key] = cellText(column, row);
    }

    sheet.addRow(values);
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer();

  return Buffer.from(arrayBuffer);
}

// -----------------------------------------------------------------------------
// PDF
// -----------------------------------------------------------------------------

// Simple, dependency-light table renderer - no external HTML/CSS layer, just
// PDFKit primitives. Good enough for a tabular report export (this is not a
// pixel-perfect invoice PDF - see the existing invoice PDF flow, if any, for
// that bar); wraps to a new page and re-prints the header row when a page
// fills up, and shrinks columns evenly to fit the page width.
export function toPdfBuffer(table: ExportTable): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 36 });
    const chunks: Buffer[] = [];

    doc.on("data", chunk => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const colWidth = pageWidth / table.columns.length;
    const rowHeight = 20;

    doc.fontSize(16).text(table.title, { align: "left" });
    doc.fontSize(9).fillColor("#666666").text(`Generated ${table.generatedAt.toLocaleString()}`);
    doc.fillColor("#000000");
    doc.moveDown(1);

    function drawHeaderRow() {
      const y = doc.y;

      doc.font("Helvetica-Bold").fontSize(9);
      table.columns.forEach((column, i) => {
        doc.text(column.label, doc.page.margins.left + i * colWidth, y, { width: colWidth - 4 });
      });
      doc.font("Helvetica");
      doc.moveDown(1.2);
      doc
        .moveTo(doc.page.margins.left, doc.y)
        .lineTo(doc.page.width - doc.page.margins.right, doc.y)
        .strokeColor("#dddddd")
        .stroke();
      doc.moveDown(0.3);
    }

    drawHeaderRow();

    doc.fontSize(8.5);

    for (const row of table.rows) {
      if (doc.y + rowHeight > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        drawHeaderRow();
        doc.fontSize(8.5);
      }

      const y = doc.y;

      table.columns.forEach((column, i) => {
        doc.text(cellText(column, row), doc.page.margins.left + i * colWidth, y, { width: colWidth - 4 });
      });
      doc.moveDown(1);
    }

    if (table.rows.length === 0) {
      doc.fillColor("#666666").text("No data for the selected filters.");
    }

    doc.end();
  });
}

export type ExportFormat = "csv" | "excel" | "pdf";

export const EXPORT_CONTENT_TYPES: Record<ExportFormat, string> = {
  csv: "text/csv; charset=utf-8",
  excel: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pdf: "application/pdf"
};

export const EXPORT_EXTENSIONS: Record<ExportFormat, string> = {
  csv: "csv",
  excel: "xlsx",
  pdf: "pdf"
};

export async function renderExport(format: ExportFormat, table: ExportTable): Promise<Buffer | string> {
  switch (format) {
    case "csv":
      return toCsv(table);
    case "excel":
      return toExcelBuffer(table);
    case "pdf":
      return toPdfBuffer(table);
  }
}
