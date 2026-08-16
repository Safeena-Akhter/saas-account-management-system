'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Button from '@mui/material/Button'
import ButtonGroup from '@mui/material/ButtonGroup'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import CircularProgress from '@mui/material/CircularProgress'

// Feature Imports
import { downloadReportExport } from '@/features/reports/exportReport'
import type { ReportExportFormat } from '@/features/reports/types'

type Props = {
  /** Report API path, e.g. '/reports/sales' - same one the view's useXReport hook already calls. */
  path: string
  /** The exact params currently applied on screen, so the export matches what's visible. */
  params: Record<string, unknown>
  /** Used to name the downloaded file, e.g. 'sales-report'. */
  filenameBase: string
}

const FORMAT_LABELS: Record<ReportExportFormat, string> = { pdf: 'PDF', excel: 'Excel', csv: 'CSV' }

// Renders as a small button group: [PDF/Excel/CSV ▾] [Print]. Every report
// view mounts one of these instead of re-implementing export buttons -
// keeps the "how does exporting work" logic in exportReport.ts, not
// duplicated 12 times.
const ReportExportBar = ({ path, params, filenameBase }: Props) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const [downloading, setDownloading] = useState<ReportExportFormat | null>(null)

  const handleExport = async (format: ReportExportFormat) => {
    setAnchorEl(null)
    setDownloading(format)

    try {
      await downloadReportExport(path, params, format, filenameBase)
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div className='flex gap-2'>
      <ButtonGroup variant='outlined' size='small'>
        <Button
          onClick={e => setAnchorEl(e.currentTarget)}
          startIcon={downloading ? <CircularProgress size={14} /> : <i className='ri-download-2-line' />}
          disabled={downloading !== null}
        >
          Export
        </Button>
      </ButtonGroup>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        {(Object.keys(FORMAT_LABELS) as ReportExportFormat[]).map(format => (
          <MenuItem key={format} onClick={() => handleExport(format)}>
            {FORMAT_LABELS[format]}
          </MenuItem>
        ))}
      </Menu>
      <Button variant='outlined' size='small' startIcon={<i className='ri-printer-line' />} onClick={() => window.print()}>
        Print
      </Button>
    </div>
  )
}

export default ReportExportBar
