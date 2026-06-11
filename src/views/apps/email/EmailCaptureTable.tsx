'use client'

import { useState, useMemo } from 'react'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import TablePagination from '@mui/material/TablePagination'
import MenuItem from '@mui/material/MenuItem'
import Tooltip from '@mui/material/Tooltip'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState
} from '@tanstack/react-table'
import { rankItem } from '@tanstack/match-sorter-utils'
import classnames from 'classnames'

import type { EmailCaptureWithRelations, EmailCaptureStats } from '@/actions/email-actions'
import { deleteEmailCapture, exportEmailsToCSV, unsubscribeEmail } from '@/actions/email-actions'
import tableStyles from '@core/styles/table.module.css'

type Props = {
  emailCaptureData: EmailCaptureWithRelations[]
  stats: EmailCaptureStats
}

// Column definitions
const columnHelper = (handleDelete: (id: string) => void, handleUnsubscribe: (email: string) => void) => {
  const columns: ColumnDef<EmailCaptureWithRelations>[] = [
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => (
        <div className='flex flex-col'>
          <Typography className='font-medium' color='text.primary'>
            {row.original.email}
          </Typography>
          {row.original.firstName && (
            <Typography variant='body2' color='text.secondary'>
              {row.original.firstName}
            </Typography>
          )}
        </div>
      )
    },
    {
      accessorKey: 'source',
      header: 'Source',
      cell: ({ row }) => {
        const sourceColors: Record<string, 'primary' | 'success' | 'warning' | 'info'> = {
          discount_unlock: 'success',
          newsletter: 'primary',
          party_genie: 'warning',
          waitlist: 'info'
        }

        const sourceLabels: Record<string, string> = {
          discount_unlock: 'Discount Unlock',
          newsletter: 'Newsletter',
          party_genie: 'Party Genie',
          waitlist: 'Waitlist'
        }

        return (
          <Chip
            label={sourceLabels[row.original.source] || row.original.source}
            color={sourceColors[row.original.source] || 'default'}
            size='small'
            variant='tonal'
          />
        )
      }
    },
    {
      accessorKey: 'venue',
      header: 'Venue',
      cell: ({ row }) => {
        if (!row.original.venue) return <Typography color='text.disabled'>-</Typography>

        return (
          <Typography variant='body2' className='font-medium'>
            {row.original.venue.name}
          </Typography>
        )
      }
    },
    {
      accessorKey: 'search',
      header: 'Search Details',
      cell: ({ row }) => {
        if (!row.original.search) return <Typography color='text.disabled'>-</Typography>

        return (
          <div className='flex items-center gap-2'>
            <Tooltip title='Number of Kids'>
              <Chip
                icon={<i className='tabler-users' />}
                label={row.original.search.numberOfKids}
                size='small'
                variant='outlined'
              />
            </Tooltip>
            <Tooltip title='Kids Age'>
              <Chip
                icon={<i className='tabler-cake' />}
                label={`${row.original.search.kidsAge}y`}
                size='small'
                variant='outlined'
              />
            </Tooltip>
          </div>
        )
      }
    },
    {
      accessorKey: 'reason',
      header: 'Reason',
      cell: ({ row }) => {
        if (!row.original.reason) return <Typography color='text.disabled'>-</Typography>

        const reasonLabels: Record<string, string> = {
          discount_code: 'Discount Code',
          party_genie: 'Party Genie',
          newsletter: 'Newsletter',
          similar_venues: 'Similar Venues'
        }

        return (
          <Typography variant='body2' color='text.secondary'>
            {reasonLabels[row.original.reason] || row.original.reason}
          </Typography>
        )
      }
    },
    {
      accessorKey: 'acceptsMarketing',
      header: 'Marketing',
      cell: ({ row }) => (
        <Chip
          label={row.original.acceptsMarketing ? 'Opted In' : 'Opted Out'}
          color={row.original.acceptsMarketing ? 'success' : 'default'}
          size='small'
          variant='tonal'
        />
      )
    },
    {
      accessorKey: 'discountClaimed',
      header: 'Discount',
      cell: ({ row }) => {
        if (!row.original.discountClaimed) {
          return <Typography color='text.disabled'>-</Typography>
        }

        return (
          <div className='flex flex-col gap-1'>
            <Typography variant='body2' className='font-medium'>
              {row.original.discountClaimed}
            </Typography>
            {row.original.discountUsed && <Chip label='Used' color='success' size='small' variant='tonal' />}
          </div>
        )
      }
    },
    {
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ row }) => (
        <Typography variant='body2' color='text.secondary'>
          {new Date(row.original.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })}
        </Typography>
      )
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className='flex gap-2'>
          {row.original.acceptsMarketing && (
            <Button
              size='small'
              variant='outlined'
              color='warning'
              onClick={() => handleUnsubscribe(row.original.email)}
            >
              Unsubscribe
            </Button>
          )}
          <IconButton size='small' color='error' onClick={() => handleDelete(row.original.id)}>
            <i className='tabler-trash' />
          </IconButton>
        </div>
      )
    }
  ]

  return columns
}

const fuzzyFilter = (row: any, columnId: string, value: any, addMeta: any) => {
  const itemRank = rankItem(row.getValue(columnId), value)
  addMeta({ itemRank })

  return itemRank.passed
}

const EmailCaptureTable = ({ emailCaptureData, stats: serverStats }: Props) => {
  const [data, setData] = useState(emailCaptureData)
  const [globalFilter, setGlobalFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }])
  const [isExporting, setIsExporting] = useState(false)

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this email capture? This action cannot be undone.')) {
      return
    }

    try {
      await deleteEmailCapture(id)
      setData(prevData => prevData.filter(item => item.id !== id))
    } catch (error) {
      console.error('Error deleting email capture:', error)
    }
  }

  const handleUnsubscribe = async (email: string) => {
    try {
      await unsubscribeEmail(email)
      setData(prevData => prevData.map(item => (item.email === email ? { ...item, acceptsMarketing: false } : item)))
    } catch (error) {
      console.error('Error unsubscribing email:', error)
    }
  }

  const handleExportCSV = async () => {
    setIsExporting(true)
    try {
      const filters = sourceFilter !== 'all' ? { source: sourceFilter } : undefined
      const csv = await exportEmailsToCSV(filters)

      // Create download link
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `email-captures-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting CSV:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const filteredData = useMemo(() => {
    if (sourceFilter === 'all') return data
    return data.filter(item => item.source === sourceFilter)
  }, [data, sourceFilter])

  const columns = useMemo(() => columnHelper(handleDelete, handleUnsubscribe), [])

  const table = useReactTable({
    data: filteredData,
    columns,
    filterFns: {
      fuzzy: fuzzyFilter
    },
    state: {
      globalFilter,
      sorting
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: fuzzyFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10
      }
    }
  })

  return (
    <>
      <Card>
        <CardHeader
          title='Email Captures'
          subheader={`${serverStats.recentCaptures} new captures in the last 7 days`}
          sx={{ '& .MuiCardHeader-action': { m: 0 } }}
          action={
            <Button
              variant='contained'
              startIcon={<i className='tabler-download' />}
              onClick={handleExportCSV}
              disabled={isExporting}
            >
              {isExporting ? 'Exporting...' : 'Export CSV'}
            </Button>
          }
        />

        {/* Stats Cards */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6 pt-0'>
          <div className='flex flex-col gap-1 p-4 border rounded-lg'>
            <Typography variant='h4'>{serverStats.total}</Typography>
            <Typography variant='body2' color='text.secondary'>
              Total Captures
            </Typography>
          </div>
          <div className='flex flex-col gap-1 p-4 border rounded-lg'>
            <Typography variant='h4'>{serverStats.acceptsMarketing}</Typography>
            <Typography variant='body2' color='text.secondary'>
              Marketing Opt-Ins
            </Typography>
          </div>
          <div className='flex flex-col gap-1 p-4 border rounded-lg'>
            <Typography variant='h4'>{serverStats.discountUsed}</Typography>
            <Typography variant='body2' color='text.secondary'>
              Discounts Used
            </Typography>
          </div>
          <div className='flex flex-col gap-1 p-4 border rounded-lg'>
            <Typography variant='h4'>{Object.keys(serverStats.bySource).length}</Typography>
            <Typography variant='body2' color='text.secondary'>
              Active Sources
            </Typography>
          </div>
        </div>

        {/* Filters */}
        <div className='flex flex-wrap gap-4 p-6 pt-0'>
          <TextField
            value={globalFilter ?? ''}
            onChange={e => setGlobalFilter(e.target.value)}
            placeholder='Search by email or name...'
            size='small'
            className='min-w-[200px]'
            InputProps={{
              startAdornment: <i className='tabler-search text-textSecondary' />
            }}
          />
          <TextField
            select
            value={sourceFilter}
            onChange={e => setSourceFilter(e.target.value)}
            size='small'
            className='min-w-[150px]'
            label='Source'
          >
            <MenuItem value='all'>All Sources</MenuItem>
            <MenuItem value='discount_unlock'>Discount Unlock</MenuItem>
            <MenuItem value='newsletter'>Newsletter</MenuItem>
            <MenuItem value='party_genie'>Party Genie</MenuItem>
            <MenuItem value='waitlist'>Waitlist</MenuItem>
          </TextField>
        </div>

        <div className='overflow-x-auto'>
          <table className={tableStyles.table}>
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id}>
                      {header.isPlaceholder ? null : (
                        <div
                          className={classnames({
                            'flex items-center': header.column.getIsSorted(),
                            'cursor-pointer select-none': header.column.getCanSort()
                          })}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {{
                            asc: <i className='tabler-chevron-up text-xl' />,
                            desc: <i className='tabler-chevron-down text-xl' />
                          }[header.column.getIsSorted() as 'asc' | 'desc'] ?? null}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={table.getVisibleFlatColumns().length} className='text-center'>
                    No email captures found
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <TablePagination
          component='div'
          count={filteredData.length}
          page={table.getState().pagination.pageIndex}
          onPageChange={(_, page) => table.setPageIndex(page)}
          rowsPerPage={table.getState().pagination.pageSize}
          onRowsPerPageChange={e => table.setPageSize(Number(e.target.value))}
          rowsPerPageOptions={[10, 25, 50]}
        />
      </Card>
    </>
  )
}

export default EmailCaptureTable
