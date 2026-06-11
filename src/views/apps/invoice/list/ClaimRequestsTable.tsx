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
import type { ClaimRequestWithVenue } from '@/actions/vendor-actions'

// Component Imports
import TablePaginationComponent from '@components/TablePaginationComponent'

// Server Actions
import { approveClaimRequest, rejectClaimRequest } from '@/actions/vendor-actions'

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

const ClaimRequestsTable = ({ requestData }: { requestData: ClaimRequestWithVenue[] }) => {
  // States
  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState(requestData)
  const [globalFilter, setGlobalFilter] = useState('')
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedRequest, setSelectedRequest] = useState<ClaimRequestWithVenue | null>(null)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  // Hooks
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Columns
  const columnHelper = createColumnHelper<ClaimRequestWithVenue>()

  const columns = useMemo<ColumnDef<ClaimRequestWithVenue, any>[]>(
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
        accessorKey: 'venue.name',
        header: 'Venue Requested',
        cell: ({ row }) => (
          <Typography variant='body2' className='font-medium'>
            {row.original.venue?.name || 'Unknown Venue'}
          </Typography>
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
            {row.original.status === 'pending' && (
              <IconButton
                onClick={e => {
                  setAnchorEl(e.currentTarget)
                  setSelectedRequest(row.original)
                }}
              >
                <i className='tabler-dots-vertical text-textSecondary' />
              </IconButton>
            )}
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
  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedRequest(null)
  }

  const handleApprove = () => {
    if (selectedRequest && confirm(`Approve claim request from "${selectedRequest.contactName}"?`)) {
      startTransition(async () => {
        try {
          await approveClaimRequest(selectedRequest.id)
          setData(prevData =>
            prevData.map(req =>
              req.id === selectedRequest.id ? { ...req, status: 'approved', reviewedAt: new Date() } : req
            )
          )
          router.refresh()
        } catch (error: any) {
          alert(error.message || 'Failed to approve request')
        }
      })
    }
    handleMenuClose()
  }

  const handleReject = () => {
    setRejectDialogOpen(true)
    handleMenuClose()
  }

  const handleRejectConfirm = () => {
    if (selectedRequest) {
      startTransition(async () => {
        try {
          await rejectClaimRequest(selectedRequest.id, rejectionReason)
          setData(prevData =>
            prevData.map(req =>
              req.id === selectedRequest.id
                ? { ...req, status: 'rejected', reviewedAt: new Date(), rejectionReason }
                : req
            )
          )
          setRejectDialogOpen(false)
          setRejectionReason('')
          setSelectedRequest(null)
          router.refresh()
        } catch (error: any) {
          alert(error.message || 'Failed to reject request')
        }
      })
    }
  }

  const pendingCount = data.filter(r => r.status === 'pending').length

  return (
    <>
      <Card>
        <CardHeader
          title='Vendor Claim Requests'
          subheader={`${pendingCount} pending • ${data.length} total`}
          action={
            <TextField
              value={globalFilter ?? ''}
              onChange={e => setGlobalFilter(e.target.value)}
              placeholder='Search requests...'
              size='small'
            />
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
                    No claim requests found
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
        <MenuItem onClick={handleApprove} className='text-success'>
          <i className='tabler-check text-success' />
          <span className='ml-2'>Approve</span>
        </MenuItem>
        <MenuItem onClick={handleReject} className='text-error'>
          <i className='tabler-x text-error' />
          <span className='ml-2'>Reject</span>
        </MenuItem>
      </Menu>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Reject Claim Request</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label='Rejection Reason'
            value={rejectionReason}
            onChange={e => setRejectionReason(e.target.value)}
            placeholder='Explain why this claim is being rejected...'
            className='mt-4'
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button variant='contained' color='error' onClick={handleRejectConfirm} disabled={isPending}>
            {isPending ? 'Rejecting...' : 'Reject Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default ClaimRequestsTable
