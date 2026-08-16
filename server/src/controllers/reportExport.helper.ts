import type { Response } from "express";

import { EXPORT_CONTENT_TYPES, EXPORT_EXTENSIONS, renderExport, type ExportFormat, type ExportTable } from "../utils/exporters";

// Renders `table` as the requested format and streams it back as a file
// download. Every report controller calls this the same way:
//
//   if (query.format) return sendReportExport(res, query.format, buildTable());
//   res.json({ report });
//
// so the "is this a JSON request or a file download" branch, and the actual
// header-setting, only exists once instead of once per report.
export async function sendReportExport(res: Response, format: ExportFormat, table: ExportTable, filenameBase: string) {
  const body = await renderExport(format, table);
  const filename = `${filenameBase}-${new Date().toISOString().slice(0, 10)}.${EXPORT_EXTENSIONS[format]}`;

  res.setHeader("Content-Type", EXPORT_CONTENT_TYPES[format]);
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.status(200).send(body);
}
