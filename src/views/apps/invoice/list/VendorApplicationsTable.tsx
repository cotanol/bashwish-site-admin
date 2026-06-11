'use client'

// React Imports
import { useState, useMemo, useTransition } from 'react'

// Next Imports
import { useRouter } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import TablePagination from '@mui/material/TablePagination'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'

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
import type { ApplicationWithVendor } from '@/actions/vendor-actions'

// Component Imports
import TablePaginationComponent from '@components/TablePaginationComponent'

// Server Actions
import { approveVendorApplication, rejectVendorApplication } from '@/actions/vendor-actions'

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

// Status colors
const statusColors: Record<string, 'default' | 'warning' | 'success' | 'error'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error'
}

const VendorApplicationsTable = ({ applicationData }: { applicationData: ApplicationWithVendor[] }) => {
  // States
  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState(applicationData)
  const [globalFilter, setGlobalFilter] = useState('')
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedApplication, setSelectedApplication] = useState<ApplicationWithVendor | null>(null)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)

  // Hooks
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Handlers
  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, application: ApplicationWithVendor) => {
    setAnchorEl(event.currentTarget)
    setSelectedApplication(application)
  }

  const handleCloseMenu = () => {
    setAnchorEl(null)
    // DON'T clear selectedApplication here - we need it for the dialogs
    // It will be cleared when the dialog closes
  }

  const handleApprove = () => {
    if (!selectedApplication) {
      alert('Error: No application selected')
      return
    }

    startTransition(async () => {
      try {
        const result = await approveVendorApplication(selectedApplication.id)

        // Update local state
        setData(prev =>
          prev.map(app =>
            app.id === selectedApplication.id
              ? { ...app, status: 'approved' as const, vendorId: result.vendor.id }
              : app
          )
        )

        // Show success message
        const message = result.isNewUser
          ? `✅ Application approved! New vendor account created. Welcome email sent to ${selectedApplication.contactEmail}`
          : `✅ Application approved! Vendor account linked to existing user.`

        alert(message)

        router.refresh()
        setApproveDialogOpen(false)
        setSelectedApplication(null) // Clear selection after success
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to approve application'
        alert(`Error: ${errorMessage}`)
        setApproveDialogOpen(false)
        setSelectedApplication(null) // Clear selection after error
      }
    })
  }

  const handleReject = () => {
    if (!selectedApplication) {
      alert('Error: No application selected')
      return
    }

    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason')
      return
    }

    startTransition(async () => {
      try {
        await rejectVendorApplication(selectedApplication.id, rejectionReason)

        // Update local state
        setData(prev =>
          prev.map(app =>
            app.id === selectedApplication.id ? { ...app, status: 'rejected' as const, rejectionReason } : app
          )
        )

        alert('✅ Application rejected')
        router.refresh()
        setRejectDialogOpen(false)
        setRejectionReason('')
        setSelectedApplication(null) // Clear selection after success
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Failed to reject application')
        setRejectDialogOpen(false)
        setSelectedApplication(null) // Clear selection after error
      }
    })
  }

  // Columns
  const columnHelper = createColumnHelper<ApplicationWithVendor>()

  const columns = useMemo<ColumnDef<ApplicationWithVendor, any>[]>(
    () => [
      {
        accessorKey: 'contactName',
        header: 'Contact',
        cell: ({ row }) => (
          <div className='flex flex-col'>
            <Typography color='text.primary' className='font-medium'>
              {row.original.contactName}
            </Typography>
            <Typography variant='body2' className='text-textSecondary'>
              {row.original.contactEmail}
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
        accessorKey: 'website',
        header: 'Website',
        cell: ({ row }) =>
          row.original.website ? (
            <a href={row.original.website} target='_blank' rel='noopener noreferrer' className='text-primary'>
              Visit
            </a>
          ) : (
            <Typography variant='body2'>-</Typography>
          )
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Chip
            label={row.original.status.toUpperCase()}
            color={statusColors[row.original.status]}
            variant='tonal'
            size='small'
          />
        )
      },
      {
        accessorKey: 'createdAt',
        header: 'Requested',
        cell: ({ row }) => (
          <Typography variant='body2'>{new Date(row.original.createdAt).toLocaleDateString()}</Typography>
        )
      },
      {
        accessorKey: 'contactPhone',
        header: 'Phone',
        cell: ({ row }) => <Typography variant='body2'>{row.original.contactPhone || '-'}</Typography>
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className='flex items-center'>
            <IconButton onClick={e => handleOpenMenu(e, row.original)} disabled={row.original.status !== 'pending'}>
              <i className='tabler-dots-vertical text-textSecondary' />
            </IconButton>
          </div>
        ),
        enableSorting: false
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
      rowSelection,
      globalFilter
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

  return (
    <>
      <Card>
        <CardHeader title='Vendor Applications' className='pbe-4' />

        {/* Search and Stats */}
        <div className='flex justify-between gap-4 p-6 border-bs'>
          <TextField
            value={globalFilter ?? ''}
            onChange={e => setGlobalFilter(e.target.value)}
            placeholder='Search applications...'
            className='max-sm:is-full'
          />

          <div className='flex gap-4'>
            <Chip
              label={`Pending: ${data.filter(a => a.status === 'pending').length}`}
              color='warning'
              variant='tonal'
            />
            <Chip
              label={`Approved: ${data.filter(a => a.status === 'approved').length}`}
              color='success'
              variant='tonal'
            />
            <Chip
              label={`Rejected: ${data.filter(a => a.status === 'rejected').length}`}
              color='error'
              variant='tonal'
            />
          </div>
        </div>

        {/* Table */}
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
                    No applications found
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id} className={classnames({ selected: row.getIsSelected() })}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <TablePagination
          component={() => <TablePaginationComponent table={table} />}
          count={table.getFilteredRowModel().rows.length}
          rowsPerPage={table.getState().pagination.pageSize}
          page={table.getState().pagination.pageIndex}
          onPageChange={(_, page) => table.setPageIndex(page)}
        />
      </Card>

      {/* Actions Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleCloseMenu}>
        <MenuItem
          onClick={() => {
            setApproveDialogOpen(true)
            handleCloseMenu()
          }}
          className='flex items-center gap-2'
        >
          <i className='tabler-check text-lg text-success' />
          <span>Approve</span>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setRejectDialogOpen(true)
            handleCloseMenu()
          }}
          className='flex items-center gap-2'
        >
          <i className='tabler-x text-lg text-error' />
          <span>Reject</span>
        </MenuItem>
      </Menu>

      {/* Approve Dialog */}
      <Dialog
        open={approveDialogOpen}
        onClose={() => {
          setApproveDialogOpen(false)
          setSelectedApplication(null)
        }}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>Approve Application</DialogTitle>
        <DialogContent>
          <Alert
            severity='info'
            className='mb-4'
            sx={{
              '& .MuiAlert-message': {
                width: '100%'
              }
            }}
          >
            This will create a Vendor account and link all previous applications with the same email retroactively.
          </Alert>
          <Typography>
            Are you sure you want to approve <strong>{selectedApplication?.contactName}</strong>'s application?
          </Typography>
          <Typography variant='body2' className='mt-2'>
            Email: {selectedApplication?.contactEmail}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setApproveDialogOpen(false)
              setSelectedApplication(null)
            }}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleApprove} variant='contained' color='success' disabled={isPending}>
            {isPending ? 'Approving...' : 'Approve'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog
        open={rejectDialogOpen}
        onClose={() => {
          setRejectDialogOpen(false)
          setSelectedApplication(null)
          setRejectionReason('')
        }}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>Reject Application</DialogTitle>
        <DialogContent>
          <Typography className='mb-4'>
            Provide a reason for rejecting <strong>{selectedApplication?.contactName}</strong>'s application:
          </Typography>
          <TextField
            autoFocus
            fullWidth
            multiline
            rows={4}
            value={rejectionReason}
            onChange={e => setRejectionReason(e.target.value)}
            placeholder='Enter rejection reason...'
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setRejectDialogOpen(false)
              setRejectionReason('')
              setSelectedApplication(null)
            }}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleReject} variant='contained' color='error' disabled={isPending}>
            {isPending ? 'Rejecting...' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default VendorApplicationsTable
