'use client'

import { useState, useMemo } from 'react'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import TablePagination from '@mui/material/TablePagination'
import classnames from 'classnames'
import { rankItem } from '@tanstack/match-sorter-utils'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel
} from '@tanstack/react-table'
import type { ColumnDef, FilterFn } from '@tanstack/react-table'
import type { RankingInfo } from '@tanstack/match-sorter-utils'

// Component Imports
import TablePaginationComponent from '@components/TablePaginationComponent'

// Actions
import type { ClickWithRelations } from '@/actions/click-actions'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

declare module '@tanstack/table-core' {
  interface FilterFns {
    fuzzy: FilterFn<unknown>
  }
  interface FilterMeta {
    itemRank: RankingInfo
  }
}

type Props = {
  venueId: string
  initialData: ClickWithRelations[]
}

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)
  addMeta({ itemRank })
  return itemRank.passed
}

// Click type colors
const clickTypeColors: Record<string, 'primary' | 'info' | 'success'> = {
  website: 'primary',
  phone: 'success',
  email: 'info'
}

const VendorLeadsTable = ({ venueId, initialData }: Props) => {
  const [data, setData] = useState<ClickWithRelations[]>(initialData)
  const [globalFilter, setGlobalFilter] = useState('')

  // Columns
  const columnHelper = createColumnHelper<ClickWithRelations>()

  const columns = useMemo<ColumnDef<ClickWithRelations, any>[]>(
    () => [
      {
        accessorKey: 'timestamp',
        header: 'Date & Time',
        cell: ({ row }) => (
          <Typography color='text.primary'>
            {new Date(row.original.timestamp).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Typography>
        )
      },
      {
        accessorKey: 'clickType',
        header: 'Type',
        cell: ({ row }) => (
          <Chip
            label={(row.original.clickType || 'website').toUpperCase()}
            variant='tonal'
            color={clickTypeColors[row.original.clickType || 'website'] || 'default'}
            size='small'
          />
        )
      },
      {
        accessorKey: 'search.userEmail',
        header: 'User Email',
        cell: ({ row }) => <Typography color='text.primary'>{row.original.search?.userEmail || '-'}</Typography>
      },
      {
        accessorKey: 'converted',
        header: 'Status',
        cell: ({ row }) => (
          <Chip
            label={row.original.converted ? 'Converted' : 'Pending'}
            variant='tonal'
            color={row.original.converted ? 'success' : 'warning'}
            size='small'
          />
        )
      },
      {
        accessorKey: 'search',
        header: 'Search Details',
        cell: ({ row }) => {
          const search = row.original.search
          if (!search) return <Typography color='text.secondary'>-</Typography>

          return (
            <div className='flex flex-col gap-1'>
              <Typography variant='body2'>
                {search.numberOfKids} kids • Age {search.kidsAge}
              </Typography>
              {search.eventDate && (
                <Typography variant='caption' color='text.secondary'>
                  {new Date(search.eventDate).toLocaleDateString()}
                </Typography>
              )}
            </div>
          )
        }
      }
    ],
    []
  )

  const table = useReactTable({
    data,
    columns,
    filterFns: {
      fuzzy: fuzzyFilter
    },
    state: {
      globalFilter
    },
    initialState: {
      pagination: {
        pageSize: 10
      }
    },
    globalFilterFn: fuzzyFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  })

  return (
    <Card>
      <CardHeader
        title='My Leads'
        subheader={`${data.length} total clicks • ${data.filter(c => c.converted).length} converted`}
      />
      <CardContent>
        {data.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-12'>
            <i className='tabler-click text-6xl text-textSecondary mb-4' />
            <Typography variant='h6' className='mb-2'>
              No Leads Yet
            </Typography>
            <Typography variant='body2' color='text.secondary' className='text-center max-w-md'>
              When users click on your venue's website, phone, or email, they'll appear here.
            </Typography>
          </div>
        ) : (
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
                {table.getRowModel().rows.map(row => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <TablePagination
          component={() => <TablePaginationComponent table={table} />}
          count={table.getFilteredRowModel().rows.length}
          rowsPerPage={table.getState().pagination.pageSize}
          page={table.getState().pagination.pageIndex}
          onPageChange={(_, page) => table.setPageIndex(page)}
        />
      </CardContent>
    </Card>
  )
}

export default VendorLeadsTable
