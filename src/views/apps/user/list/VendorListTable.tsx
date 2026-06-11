'use client'

// React Imports
import { useState, useMemo, useTransition } from 'react'

// Next Imports
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import TablePagination from '@mui/material/TablePagination'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
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
import type { VendorWithRelations } from '@/actions/vendor-actions'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'
import TablePaginationComponent from '@components/TablePaginationComponent'

// Server Actions
import { toggleVendorVerification, deleteVendor } from '@/actions/vendor-actions'

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

// Fuzzy Filter
const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)
  addMeta({ itemRank })
  return itemRank.passed
}

const VendorListTable = ({ vendorData }: { vendorData: VendorWithRelations[] }) => {
  // States
  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState(vendorData)
  const [globalFilter, setGlobalFilter] = useState('')
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedVendor, setSelectedVendor] = useState<VendorWithRelations | null>(null)

  // Hooks
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Columns
  const columnHelper = createColumnHelper<VendorWithRelations>()

  const columns = useMemo<ColumnDef<VendorWithRelations, any>[]>(
    () => [
      {
        id: 'avatar',
        header: '',
        cell: ({ row }) => {
          const contactName = row.original.contactName || 'V'

          return (
            <CustomAvatar skin='light' size={38}>
              {contactName
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </CustomAvatar>
          )
        },
        enableSorting: false
      },
      {
        accessorKey: 'contactName',
        header: 'Vendor',
        cell: ({ row }) => (
          <div className='flex flex-col'>
            <Typography color='text.primary' className='font-medium'>
              {row.original.contactName || 'No name'}
            </Typography>
            <Typography variant='body2' className='text-textSecondary'>
              {row.original.user?.email || 'No email'}
            </Typography>
          </div>
        )
      },
      {
        accessorKey: 'businessName',
        header: 'Business',
        cell: ({ row }) => <Typography variant='body2'>{row.original.businessName || '-'}</Typography>
      },
      {
        accessorKey: 'venues',
        header: 'Venues',
        cell: ({ row }) => {
          const venues = row.original.venues

          if (!venues || venues.length === 0) {
            return (
              <Typography variant='body2' className='text-textSecondary italic'>
                No venues
              </Typography>
            )
          }

          return (
            <div className='flex flex-col gap-1'>
              {venues.map(venue => (
                <div key={venue.id} className='flex items-center gap-2'>
                  <Link href={`/apps/ecommerce/products/edit/${venue.id}`} className='hover:underline'>
                    <Typography color='primary' className='font-medium text-sm'>
                      {venue.name}
                    </Typography>
                  </Link>
                  {venue.status !== 'published' && (
                    <Chip label={venue.status} size='small' color='warning' variant='tonal' />
                  )}
                </div>
              ))}
            </div>
          )
        }
      },
      {
        accessorKey: 'deletedAt',
        header: 'Active',
        cell: ({ row }) => (
          <Switch
            checked={row.original.deletedAt === null}
            onChange={() => handleToggleActive(row.original.id)}
          />
        )
      },
      {
        accessorKey: 'isVerified',
        header: 'Verified',
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <Switch
              checked={row.original.isVerified}
              onChange={() => handleToggleVerified(row.original.id)}
              disabled={isPending}
            />
            {row.original.isVerified && (
              <Tooltip title='Verified vendor'>
                <i className='tabler-circle-check text-success text-xl' />
              </Tooltip>
            )}
          </div>
        )
      },
      {
        accessorKey: 'phone',
        header: 'Phone',
        cell: ({ row }) => <Typography variant='body2'>{row.original.phone || '-'}</Typography>
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className='flex items-center'>
            <IconButton
              onClick={e => {
                setAnchorEl(e.currentTarget)
                setSelectedVendor(row.original)
              }}
            >
              <i className='tabler-dots-vertical text-textSecondary' />
            </IconButton>
          </div>
        ),
        enableSorting: false
      }
    ],
    [isPending]
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
  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedVendor(null)
  }

  const handleToggleActive = (id: string) => {
    // Optimistic update
    setData(prevData =>
      prevData.map(vendor =>
        vendor.id === id ? { ...vendor, deletedAt: vendor.deletedAt === null ? new Date() : null } : vendor
      )
    )

    // Execute server action in background
    deleteVendor(id)
      .then(() => {
        router.refresh()
      })
      .catch(error => {
        console.error('Failed to toggle active status:', error)
        // Revert on error
        setData(prevData =>
          prevData.map(vendor =>
            vendor.id === id ? { ...vendor, deletedAt: vendor.deletedAt === null ? new Date() : null } : vendor
          )
        )
        alert('Failed to update vendor active status')
      })
  }

  const handleToggleVerified = (id: string) => {
    startTransition(async () => {
      try {
        await toggleVendorVerification(id)
        setData(prevData =>
          prevData.map(vendor =>
            vendor.id === id
              ? { ...vendor, isVerified: !vendor.isVerified, verifiedAt: !vendor.isVerified ? new Date() : null }
              : vendor
          )
        )
        router.refresh()
      } catch (error) {
        console.error('Failed to toggle verification:', error)
      }
    })
  }

  const handleViewVenue = () => {
    if (selectedVendor && selectedVendor.venues && selectedVendor.venues.length > 0) {
      // Navigate to the first venue if multiple exist
      router.push(`/apps/ecommerce/products/edit/${selectedVendor.venues[0].id}`)
    }
    handleMenuClose()
  }



  return (
    <>
      <Card>
        <CardHeader
          title='Vendors Management'
          subheader={`${data.length} vendors • ${data.filter(v => v.deletedAt === null).length} active • ${data.filter(v => v.isVerified).length} verified`}
          action={
            <div className='flex gap-4 items-center'>
              <TextField
                value={globalFilter ?? ''}
                onChange={e => setGlobalFilter(e.target.value)}
                placeholder='Search vendors...'
                size='small'
              />
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
                    No vendors found
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

      {/* Actions Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem
          onClick={handleViewVenue}
          disabled={!selectedVendor || !selectedVendor.venues || selectedVendor.venues.length === 0}
        >
          <i className='tabler-eye text-textSecondary' />
          <span className='ml-2'>View Venue</span>
        </MenuItem>
      </Menu>
    </>
  )
}

export default VendorListTable
