'use client'

import { useState, useMemo } from 'react'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import TablePagination from '@mui/material/TablePagination'
import MenuItem from '@mui/material/MenuItem'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import LinearProgress from '@mui/material/LinearProgress'
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

import type { DiscountCodeData, DiscountCodeStats } from '@/actions/discount-actions'
import tableStyles from '@core/styles/table.module.css'

type Props = {
  codesData: DiscountCodeData[]
  stats: DiscountCodeStats
}

// Column definitions
const columnHelper = () => {
  const columns: ColumnDef<DiscountCodeData>[] = [
    {
      accessorKey: 'code',
      header: 'Code',
      cell: ({ row }) => (
        <div className='flex items-center gap-2'>
          <Chip
            label={row.original.code}
            color='primary'
            size='small'
            variant='tonal'
            icon={<i className='tabler-ticket' />}
          />
          <Tooltip title='Copy code'>
            <IconButton
              size='small'
              onClick={() => {
                navigator.clipboard.writeText(row.original.code)
              }}
            >
              <i className='tabler-copy text-lg' />
            </IconButton>
          </Tooltip>
        </div>
      )
    },
    {
      accessorKey: 'venueName',
      header: 'Venue',
      cell: ({ row }) => (
        <Typography variant='body2' className='font-medium'>
          {row.original.venueName}
        </Typography>
      )
    },
    {
      accessorKey: 'specialOffer',
      header: 'Oferta Especial',
      cell: ({ row }) => {
        if (!row.original.specialOffer) {
          return <Typography color='text.disabled'>Sin oferta</Typography>
        }

        return (
          <Tooltip title={row.original.specialOffer}>
            <Typography variant='body2' color='text.secondary' className='max-w-[300px] truncate'>
              {row.original.specialOffer}
            </Typography>
          </Tooltip>
        )
      }
    },
    {
      accessorKey: 'usageCount',
      header: 'Usos',
      cell: ({ row }) => (
        <div className='flex items-center gap-2'>
          <Typography variant='body2' className='font-medium'>
            {row.original.usageCount}
          </Typography>
          {row.original.usageCount > 0 && (
            <Chip
              label={`${row.original.usageCount} ${row.original.usageCount === 1 ? 'uso' : 'usos'}`}
              color='success'
              size='small'
              variant='outlined'
            />
          )}
        </div>
      )
    },
    {
      accessorKey: 'isActive',
      header: 'Estado Venue',
      cell: ({ row }) => (
        <Chip
          label={row.original.isActive ? 'Activo' : 'Inactivo'}
          color={row.original.isActive ? 'success' : 'default'}
          size='small'
          variant='tonal'
        />
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

const DiscountCodesTable = ({ codesData, stats }: Props) => {
  const [data] = useState(codesData)
  const [globalFilter, setGlobalFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sorting, setSorting] = useState<SortingState>([{ id: 'usageCount', desc: true }])

  const filteredData = useMemo(() => {
    let filtered = data

    if (statusFilter === 'active') {
      filtered = filtered.filter(item => item.isActive)
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(item => !item.isActive)
    } else if (statusFilter === 'used') {
      filtered = filtered.filter(item => item.usageCount > 0)
    } else if (statusFilter === 'unused') {
      filtered = filtered.filter(item => item.usageCount === 0)
    }

    return filtered
  }, [data, statusFilter])

  const columns = useMemo(() => columnHelper(), [])

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
          title='Discount Codes'
          subheader={`${stats.totalUsages} total uses • ${stats.activeCodes}/${stats.totalCodes} active codes`}
        />

        {/* Stats Cards */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6 pt-0'>
          <div className='flex flex-col gap-1 p-4 border rounded-lg'>
            <Typography variant='h4'>{stats.totalCodes}</Typography>
            <Typography variant='body2' color='text.secondary'>
              Total Codes
            </Typography>
          </div>
          <div className='flex flex-col gap-1 p-4 border rounded-lg'>
            <Typography variant='h4'>{stats.activeCodes}</Typography>
            <Typography variant='body2' color='text.secondary'>
              Active Codes
            </Typography>
          </div>
          <div className='flex flex-col gap-1 p-4 border rounded-lg'>
            <Typography variant='h4'>{stats.totalUsages}</Typography>
            <Typography variant='body2' color='text.secondary'>
              Total Usos
            </Typography>
          </div>
          <div className='flex flex-col gap-1 p-4 border rounded-lg'>
            <Typography variant='h4'>
              {stats.totalCodes > 0 ? ((stats.totalUsages / stats.totalCodes) * 100).toFixed(1) : 0}%
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Tasa de Uso Promedio
            </Typography>
          </div>
        </div>

        {/* Top Codes Section */}
        {stats.topCodes.length > 0 && (
          <div className='p-6 pt-0'>
            <Card variant='outlined'>
              <div className='p-4'>
                <Typography variant='h6' className='mb-4'>
                  Top Codes by Usage
                </Typography>
                <div className='flex flex-col gap-3'>
                  {stats.topCodes.map((code, index) => (
                    <div key={code.code} className='flex items-center gap-4'>
                      <Chip
                        label={`#${index + 1}`}
                        size='small'
                        color={index < 3 ? 'primary' : 'default'}
                        variant={index < 3 ? 'filled' : 'outlined'}
                      />
                      <div className='flex-1'>
                        <div className='flex items-center justify-between mb-1'>
                          <div>
                            <Typography variant='body2' className='font-medium'>
                              {code.code}
                            </Typography>
                            <Typography variant='caption' color='text.secondary'>
                              {code.venueName}
                            </Typography>
                          </div>
                          <Typography variant='body2' color='text.secondary'>
                            {code.usageCount} usos
                          </Typography>
                        </div>
                        <LinearProgress
                          variant='determinate'
                          value={stats.totalUsages > 0 ? (code.usageCount / stats.totalUsages) * 100 : 0}
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Filters */}
        <div className='flex flex-wrap gap-4 p-6 pt-0'>
          <TextField
            value={globalFilter ?? ''}
            onChange={e => setGlobalFilter(e.target.value)}
            placeholder='Search code or venue...'
            size='small'
            className='min-w-[200px]'
            InputProps={{
              startAdornment: <i className='tabler-search text-textSecondary' />
            }}
          />
          <TextField
            select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            size='small'
            className='min-w-[150px]'
            label='Filtro'
          >
            <MenuItem value='all'>Todos</MenuItem>
            <MenuItem value='active'>Venues Activos</MenuItem>
            <MenuItem value='inactive'>Venues Inactivos</MenuItem>
            <MenuItem value='used'>Con Usos</MenuItem>
            <MenuItem value='unused'>Sin Usos</MenuItem>
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
                    <Typography variant='body2' color='text.secondary'>
                      No discount codes available
                    </Typography>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id} className={classnames({ 'opacity-50': !row.original.isActive })}>
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

export default DiscountCodesTable
