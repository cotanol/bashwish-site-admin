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
import type { SearchWithRelations } from '@/actions/search-actions'
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

import tableStyles from '@core/styles/table.module.css'

type Props = {
  searchData: SearchWithRelations[]
}

// Column definitions
const columnHelper = () => {
  const columns: ColumnDef<SearchWithRelations>[] = [
    {
      accessorKey: 'createdAt',
      header: 'Fecha',
      cell: ({ row }) => (
        <div className='flex flex-col'>
          <Typography variant='body2' className='font-medium'>
            {new Date(row.original.createdAt).toLocaleDateString('es-MX', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </Typography>
          <Typography variant='caption' color='text.secondary'>
            {new Date(row.original.createdAt).toLocaleTimeString('es-MX', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Typography>
        </div>
      )
    },
    {
      accessorKey: 'userEmail',
      header: 'Usuario',
      cell: ({ row }) => (
        <Typography variant='body2' color='text.secondary'>
          {row.original.userEmail || 'Anónimo'}
        </Typography>
      )
    },
    {
      id: 'searchDetails',
      header: 'Search Details',
      cell: ({ row }) => (
        <div className='flex flex-wrap gap-2'>
          <Chip
            label={`${row.original.kidsAge} years`}
            size='small'
            variant='tonal'
            color='primary'
            icon={<i className='tabler-cake' />}
          />
          <Chip
            label={row.original.gender === 'male' ? 'Niño' : row.original.gender === 'female' ? 'Niña' : 'Mixto'}
            size='small'
            variant='tonal'
            color={row.original.gender === 'male' ? 'info' : row.original.gender === 'female' ? 'secondary' : 'default'}
          />
          <Chip
            label={`${row.original.numberOfKids} kids`}
            size='small'
            variant='tonal'
            icon={<i className='tabler-users' />}
          />
        </div>
      )
    },
    {
      accessorKey: 'postalCode',
      header: 'ZIP Code',
      cell: ({ row }) => <Chip label={row.original.postalCode} size='small' variant='outlined' />
    },
    {
      accessorKey: 'resultsCount',
      header: 'Resultados',
      cell: ({ row }) => (
        <Typography variant='body2' className='font-medium'>
          {row.original.resultsCount || row.original.venuesShown.length}
        </Typography>
      )
    },
    {
      id: 'clicks',
      header: 'Clicks',
      cell: ({ row }) => {
        const clickCount = row.original.clicks.length
        const hasConverted = row.original.clicks.some((c: { converted: boolean }) => c.converted)

        return (
          <div className='flex items-center gap-2'>
            <Typography variant='body2' className='font-medium'>
              {clickCount}
            </Typography>
            {hasConverted && (
              <Tooltip title='Conversión exitosa'>
                <Chip label='✓' size='small' color='success' sx={{ minWidth: 'auto', height: 20 }} />
              </Tooltip>
            )}
          </div>
        )
      }
    },
    {
      id: 'eventDate',
      header: 'Fecha Evento',
      cell: ({ row }) => {
        if (!row.original.eventDate) {
          return <Typography color='text.disabled'>-</Typography>
        }

        return (
          <Typography variant='body2' color='text.secondary'>
            {new Date(row.original.eventDate).toLocaleDateString('es-MX', {
              month: 'short',
              day: 'numeric'
            })}
          </Typography>
        )
      }
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className='flex gap-1'>
          <Tooltip title='Ver detalles'>
            <IconButton size='small' color='primary'>
              <i className='tabler-eye' />
            </IconButton>
          </Tooltip>
          <Tooltip title='Ver venues mostrados'>
            <IconButton size='small' color='info'>
              <i className='tabler-list' />
            </IconButton>
          </Tooltip>
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

const SearchesTable = ({ searchData }: Props) => {
  const [data] = useState(searchData)
  const [globalFilter, setGlobalFilter] = useState('')
  const [genderFilter, setGenderFilter] = useState<string>('all')
  const [hasClicksFilter, setHasClicksFilter] = useState<string>('all')
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }])

  const filteredData = useMemo(() => {
    let filtered = data

    if (genderFilter !== 'all') {
      filtered = filtered.filter(item => item.gender === genderFilter)
    }

    if (hasClicksFilter === 'with-clicks') {
      filtered = filtered.filter(item => item.clicks.length > 0)
    } else if (hasClicksFilter === 'no-clicks') {
      filtered = filtered.filter(item => item.clicks.length === 0)
    } else if (hasClicksFilter === 'converted') {
      filtered = filtered.filter(item => item.clicks.some((c: { converted: boolean }) => c.converted))
    }

    return filtered
  }, [data, genderFilter, hasClicksFilter])

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

  const stats = useMemo(() => {
    const total = filteredData.length
    const withClicks = filteredData.filter(item => item.clicks.length > 0).length
    const converted = filteredData.filter(item => item.clicks.some((c: { converted: boolean }) => c.converted)).length
    const avgResults =
      filteredData.length > 0
        ? filteredData.reduce((sum, item) => sum + (item.resultsCount || item.venuesShown.length), 0) /
          filteredData.length
        : 0

    return { total, withClicks, converted, avgResults: avgResults.toFixed(1) }
  }, [filteredData])

  return (
    <Card>
      <CardHeader title='Search History' />

      {/* Stats */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6 pt-0'>
        <div className='flex flex-col gap-1 p-4 border rounded-lg'>
          <Typography variant='h4'>{stats.total}</Typography>
          <Typography variant='body2' color='text.secondary'>
            Total Searches
          </Typography>
        </div>
        <div className='flex flex-col gap-1 p-4 border rounded-lg'>
          <Typography variant='h4'>{stats.withClicks}</Typography>
          <Typography variant='body2' color='text.secondary'>
            Con Clicks
          </Typography>
        </div>
        <div className='flex flex-col gap-1 p-4 border rounded-lg'>
          <Typography variant='h4'>{stats.converted}</Typography>
          <Typography variant='body2' color='text.secondary'>
            Conversiones
          </Typography>
        </div>
        <div className='flex flex-col gap-1 p-4 border rounded-lg'>
          <Typography variant='h4'>{stats.avgResults}</Typography>
          <Typography variant='body2' color='text.secondary'>
            Promedio Resultados
          </Typography>
        </div>
      </div>

      {/* Filters */}
      <div className='flex flex-wrap gap-4 p-6 pt-0'>
        <TextField
          value={globalFilter ?? ''}
          onChange={e => setGlobalFilter(e.target.value)}
          placeholder='Search by email or zip code...'
          size='small'
          className='min-w-[200px]'
          InputProps={{
            startAdornment: <i className='tabler-search text-textSecondary' />
          }}
        />
        <TextField
          select
          value={genderFilter}
          onChange={e => setGenderFilter(e.target.value)}
          size='small'
          className='min-w-[150px]'
          label='Género'
        >
          <MenuItem value='all'>Todos</MenuItem>
          <MenuItem value='male'>Niño</MenuItem>
          <MenuItem value='female'>Niña</MenuItem>
          <MenuItem value='both'>Mixto</MenuItem>
        </TextField>
        <TextField
          select
          value={hasClicksFilter}
          onChange={e => setHasClicksFilter(e.target.value)}
          size='small'
          className='min-w-[150px]'
          label='Clicks'
        >
          <MenuItem value='all'>Todos</MenuItem>
          <MenuItem value='with-clicks'>Con Clicks</MenuItem>
          <MenuItem value='no-clicks'>Sin Clicks</MenuItem>
          <MenuItem value='converted'>Convertidos</MenuItem>
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
                  No searches found
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
  )
}

export default SearchesTable
