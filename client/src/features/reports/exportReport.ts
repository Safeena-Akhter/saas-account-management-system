import apiClient from '@/lib/api/client'
import type { ReportExportFormat } from './types'

const EXTENSIONS: Record<ReportExportFormat, string> = { csv: 'csv', excel: 'xlsx', pdf: 'pdf' }

// Requests the same report endpoint the on-screen table already uses, just
// with `format` set - the backend (report.controller.ts) branches on that
// and streams back a file instead of JSON. Triggers a browser download via
// a throwaway <a>, same technique as every "export" button needs since
// axios itself can't trigger a native Save dialog.
export async function downloadReportExport(
  path: string,
  params: Record<string, unknown>,
  format: ReportExportFormat,
  filenameBase: string
) {
  const { data } = await apiClient.get<Blob>(path, {
    params: { ...params, format },
    responseType: 'blob'
  })

  const url = window.URL.createObjectURL(data)
  const link = document.createElement('a')

  link.href = url
  link.download = `${filenameBase}-${new Date().toISOString().slice(0, 10)}.${EXTENSIONS[format]}`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}
