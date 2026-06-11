'use client'

// React Imports
import { useState, useMemo, useTransition } from 'react'

// Next Imports
import { useRouter } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import TablePagination from '@mui/material/TablePagination'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import Grid from '@mui/material/Grid2'
import Switch from '@mui/material/Switch'

// Third-party Imports
import classnames from 'classnames'
import { rankItem } from '@tanstack/match-sorter-utils'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFacetedMinMaxValues,
  getPaginationRowModel,
  getSortedRowModel
} from '@tanstack/react-table'
import type { ColumnDef, FilterFn } from '@tanstack/react-table'
import type { RankingInfo } from '@tanstack/match-sorter-utils'

// Type Imports
import type { ThemeWithPackages } from '@/actions/theme-actions'

// Component Imports
import TablePaginationComponent from '@components/TablePaginationComponent'

// Server Actions
import { deleteTheme, createTheme, updateTheme, toggleThemeActive } from '@/actions/theme-actions'

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

type ThemeDialogMode = 'add' | 'edit' | null

// Fuzzy Filter
const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)
  addMeta({ itemRank })
  return itemRank.passed
}

// Column Definitions
const columnHelper = createColumnHelper<ThemeWithPackages>()

const ThemeListTable = ({ themeData }: { themeData: ThemeWithPackages[] }) => {
  // States
  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState(themeData)
  const [globalFilter, setGlobalFilter] = useState('')
  const [selectedTheme, setSelectedTheme] = useState<ThemeWithPackages | null>(null)
  const [dialogMode, setDialogMode] = useState<ThemeDialogMode>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  // Dialog form state
  const [formData, setFormData] = useState({
    name: '',
    slug: ''
  })
  const [formError, setFormError] = useState('')

  // Hooks
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Columns
  const columns = useMemo<ColumnDef<ThemeWithPackages, any>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Theme Name',
        cell: ({ row }) => (
          <div className='flex flex-col'>
            <Typography color='text.primary' className='font-medium'>
              {row.original.name}
            </Typography>
            <Typography variant='body2' className='text-textSecondary'>
              {row.original.slug}
            </Typography>
          </div>
        )
      },
      {
        accessorKey: '_count.packages',
        header: 'Packages',
        cell: ({ row }) => (
          <Chip
            label={`${row.original._count?.packages || 0} packages`}
            color={row.original._count?.packages ? 'success' : 'default'}
            variant='tonal'
            size='small'
          />
        )
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Switch
            checked={row.original.isActive ?? true}
            onChange={() => handleToggleStatus(row.original.id, row.original.isActive ?? true)}
            color='primary'
          />
        ),
        enableSorting: false
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className='flex items-center'>
            <IconButton
              onClick={() => {
                setFormData({
                  name: row.original.name,
                  slug: row.original.slug
                })
                setSelectedTheme(row.original)
                setDialogMode('edit')
                setDialogOpen(true)
              }}
            >
              <i className='tabler-edit text-textSecondary' />
            </IconButton>
          </div>
        ),
        enableSorting: false
      }
    ],
    []
  )

  // Table
  const table = useReactTable({
    data,
    columns,
    filterFns: {
      fuzzy: fuzzyFilter
    },
    state: {
      rowSelection,
      globalFilter
    },
    initialState: {
      pagination: {
        pageSize: 10
      }
    },
    enableRowSelection: true,
    globalFilterFn: fuzzyFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues()
  })

  // Handlers
  const handleToggleStatus = (id: string, currentStatus: boolean) => {
    // Optimistic update
    setData(prevData =>
      prevData.map(theme => (theme.id === id ? { ...theme, isActive: !currentStatus } : theme))
    )

    // Background sync
    startTransition(async () => {
      try {
        await toggleThemeActive(id)
        router.refresh()
      } catch (error: any) {
        // Revert on error
        setData(prevData =>
          prevData.map(theme => (theme.id === id ? { ...theme, isActive: currentStatus } : theme))
        )
        alert(error.message || 'Failed to update theme status')
      }
    })
  }

  const handleAddNew = () => {
    setFormData({
      name: '',
      slug: ''
    })
    setDialogMode('add')
    setDialogOpen(true)
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setDialogMode(null)
    setFormError('')
  }

  const handleSave = async () => {
    setFormError('')

    // Validation
    if (!formData.name.trim()) {
      setFormError('Name is required')
      return
    }
    if (!formData.slug.trim()) {
      setFormError('Slug is required')
      return
    }

    startTransition(async () => {
      try {
        if (dialogMode === 'edit' && selectedTheme) {
          await updateTheme(selectedTheme.id, formData)
          setData(prevData =>
            prevData.map(theme => (theme.id === selectedTheme.id ? { ...theme, ...formData } : theme))
          )
        } else {
          const newTheme = await createTheme(formData)
          setData(prevData => [...prevData, { ...newTheme, packages: [], _count: { packages: 0 } }])
        }
        handleDialogClose()
        router.refresh()
      } catch (error: any) {
        setFormError(error.message || 'Failed to save theme')
      }
    })
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  return (
    <>
      <Card>
        <CardHeader
          title='Themes & Categories'
          action={
            <div className='flex gap-4 items-center'>
              <TextField
                value={globalFilter ?? ''}
                onChange={e => setGlobalFilter(e.target.value)}
                placeholder='Search themes...'
                size='small'
              />
              <Button variant='contained' startIcon={<i className='tabler-plus' />} onClick={handleAddNew}>
                Add Theme
              </Button>
            </div>
          }
        />
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
            {table.getFilteredRowModel().rows.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={table.getVisibleFlatColumns().length} className='text-center'>
                    No themes found
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody>
                {table.getRowModel().rows.map(row => (
                  <tr key={row.id} className={classnames({ selected: row.getIsSelected() })}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>
        <TablePagination
          component={() => <TablePaginationComponent table={table} />}
          count={table.getFilteredRowModel().rows.length}
          rowsPerPage={table.getState().pagination.pageSize}
          page={table.getState().pagination.pageIndex}
          onPageChange={(_, page) => table.setPageIndex(page)}
        />
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth='sm' fullWidth>
        <DialogTitle>{dialogMode === 'edit' ? 'Edit Theme' : 'Add New Theme'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={4} className='mt-2'>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label='Theme Name'
                value={formData.name}
                onChange={e => {
                  const name = e.target.value
                  setFormData(prev => ({ ...prev, name, slug: generateSlug(name) }))
                }}
                error={!!formError && !formData.name}
                placeholder='e.g., Unicorns & Rainbows'
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label='Slug'
                value={formData.slug}
                onChange={e => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                helperText='URL-friendly identifier (auto-generated from name)'
                error={!!formError && !formData.slug}
              />
            </Grid>
            {formError && (
              <Grid size={{ xs: 12 }}>
                <Typography color='error' variant='body2'>
                  {formError}
                </Typography>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} disabled={isPending}>
            Cancel
          </Button>
          <Button variant='contained' onClick={handleSave} disabled={isPending}>
            {isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default ThemeListTable
