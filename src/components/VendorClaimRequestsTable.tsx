'use client'

import { useState, useMemo } from 'react'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import TablePagination from '@mui/material/TablePagination'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import MenuItem from '@mui/material/MenuItem'
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
import { approveClaimRequest, rejectClaimRequest, type ClaimRequestWithVenue } from '@/actions/vendor-actions'
import tableStyles from '@core/styles/table.module.css'
import type { ThemeColor } from '@core/types'

type VendorClaimRequestWithRelations = ClaimRequestWithVenue

type Props = {
  claimRequestsData: VendorClaimRequestWithRelations[]
}

// Status mapping
const statusColorMap: Record<string, ThemeColor> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error'
}

// Column Definitions
const columnHelper = createColumnHelper<VendorClaimRequestWithRelations>()

// Global filter
const fuzzyFilter: FilterFn<VendorClaimRequestWithRelations> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)
  addMeta({ itemRank })
  return itemRank.passed
}

const VendorClaimRequestsTable = ({ claimRequestsData }: Props) => {
  const [claimRequests, setClaimRequests] = useState(claimRequestsData)
  const [globalFilter, setGlobalFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [openDialog, setOpenDialog] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<VendorClaimRequestWithRelations | null>(null)
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [approvalResult, setApprovalResult] = useState<{
    email: string
    password: string
    isNewUser: boolean
  } | null>(null)

  // Filter data by status
  const filteredData = useMemo(() => {
    if (statusFilter === 'all') return claimRequests
    return claimRequests.filter(req => req.status === statusFilter)
  }, [claimRequests, statusFilter])

  // Stats
  const stats = useMemo(() => {
    const total = claimRequests.length
    const pending = claimRequests.filter(r => r.status === 'pending').length
    const approved = claimRequests.filter(r => r.status === 'approved').length
    const rejected = claimRequests.filter(r => r.status === 'rejected').length

    return { total, pending, approved, rejected }
  }, [claimRequests])

  const handleOpenDialog = (request: VendorClaimRequestWithRelations, action: 'approve' | 'reject') => {
    setSelectedRequest(request)
    setActionType(action)
    setRejectionReason('')
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setSelectedRequest(null)
    setActionType(null)
    setRejectionReason('')
  }

  const handleSubmitAction = async () => {
    if (!selectedRequest || !actionType) return

    setSubmitting(true)

    try {
      if (actionType === 'approve') {
        const result = await approveClaimRequest(selectedRequest.id)
        setClaimRequests(prev =>
          prev.map(req => (req.id === selectedRequest.id ? { ...req, status: 'approved' } : req))
        )

        // Show credentials if new user was created
        if (result.isNewUser && result.temporaryPassword) {
          setApprovalResult({
            email: selectedRequest.contactEmail,
            password: result.temporaryPassword,
            isNewUser: result.isNewUser
          })
        }
      } else if (actionType === 'reject') {
        await rejectClaimRequest(selectedRequest.id, rejectionReason)
        setClaimRequests(prev =>
          prev.map(req => (req.id === selectedRequest.id ? { ...req, status: 'rejected', rejectionReason } : req))
        )
      }

      handleCloseDialog()
    } catch (error) {
      console.error('Error processing claim request:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const columns = useMemo<ColumnDef<VendorClaimRequestWithRelations, any>[]>(
    () => [
      columnHelper.accessor('contactName', {
        header: 'Contact',
        cell: ({ row }) => (
          <div className='flex flex-col'>
            <Typography className='font-medium' color='text.primary'>
              {row.original.contactName}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              {row.original.contactEmail}
            </Typography>
            {row.original.contactPhone && (
              <Typography variant='body2' color='text.secondary'>
                {row.original.contactPhone}
              </Typography>
            )}
          </div>
        )
      }),
      columnHelper.accessor('businessName', {
        header: 'Business',
        cell: ({ row }) => (
          <Typography className='font-medium' color='text.primary'>
            {row.original.businessName || '-'}
          </Typography>
        )
      }),
      {
        id: 'venue',
        header: 'Venue',
        cell: ({ row }) => {
          const isNewVenue = !row.original.venueId
          const venueName = isNewVenue ? row.original.venueName : row.original.venue?.name
          const venueCity = isNewVenue ? row.original.venueCity : row.original.venue?.city

          return (
            <div className='flex flex-col gap-1'>
              <div className='flex items-center gap-2'>
                <Typography className='font-medium' color='text.primary'>
                  {venueName || 'Unknown Venue'}
                </Typography>
                {isNewVenue && <Chip label='NEW' size='small' color='success' variant='tonal' />}
              </div>
              {venueCity && (
                <Typography variant='body2' color='text.secondary'>
                  {venueCity}
                  {isNewVenue && row.original.venueState && `, ${row.original.venueState}`}
                </Typography>
              )}
            </div>
          )
        }
      },
      columnHelper.accessor('message', {
        header: 'Message',
        cell: ({ row }) => (
          <Typography variant='body2' color='text.secondary' className='max-w-xs truncate'>
            {row.original.message || '-'}
          </Typography>
        )
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: ({ row }) => (
          <Chip
            label={row.original.status.toUpperCase()}
            color={statusColorMap[row.original.status]}
            size='small'
            variant='tonal'
          />
        )
      }),
      columnHelper.accessor('createdAt', {
        header: 'Requested',
        cell: ({ row }) => (
          <Typography variant='body2' color='text.secondary'>
            {new Date(row.original.createdAt).toLocaleDateString()}
          </Typography>
        )
      }),
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          if (row.original.status !== 'pending') {
            return (
              <Typography variant='body2' color='text.disabled'>
                {row.original.status === 'approved' ? 'Approved' : 'Rejected'}
              </Typography>
            )
          }

          return (
            <div className='flex gap-2'>
              <Button
                variant='contained'
                color='success'
                size='small'
                onClick={() => handleOpenDialog(row.original, 'approve')}
              >
                Approve
              </Button>
              <Button
                variant='outlined'
                color='error'
                size='small'
                onClick={() => handleOpenDialog(row.original, 'reject')}
              >
                Reject
              </Button>
            </div>
          )
        },
        enableSorting: false
      }
    ],
    []
  )

  const table = useReactTable({
    data: filteredData,
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
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: fuzzyFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  })

  return (
    <>
      <Card>
        <CardContent className='flex justify-between gap-4 flex-wrap flex-col sm:flex-row items-start sm:items-center'>
          <div className='flex gap-4 flex-col sm:flex-row is-full sm:is-auto items-start sm:items-center'>
            <Typography variant='h5'>Vendor Claim Requests</Typography>
          </div>
        </CardContent>

        {/* Stats Cards */}
        <CardContent className='flex gap-4 flex-wrap'>
          <div className='flex flex-col gap-1 flex-1 min-w-[200px]'>
            <Typography variant='h4'>{stats.total}</Typography>
            <Typography variant='body2' color='text.secondary'>
              Total Requests
            </Typography>
          </div>
          <div className='flex flex-col gap-1 flex-1 min-w-[200px]'>
            <Typography variant='h4' color='warning.main'>
              {stats.pending}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Pending Review
            </Typography>
          </div>
          <div className='flex flex-col gap-1 flex-1 min-w-[200px]'>
            <Typography variant='h4' color='success.main'>
              {stats.approved}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Approved
            </Typography>
          </div>
          <div className='flex flex-col gap-1 flex-1 min-w-[200px]'>
            <Typography variant='h4' color='error.main'>
              {stats.rejected}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Rejected
            </Typography>
          </div>
        </CardContent>

        {/* Filters */}
        <CardContent className='flex gap-4 flex-wrap'>
          <TextField
            value={globalFilter ?? ''}
            onChange={e => setGlobalFilter(e.target.value)}
            placeholder='Search by name, email...'
            className='is-full sm:is-auto min-is-[250px]'
            size='small'
          />
          <TextField
            select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className='is-full sm:is-auto min-is-[150px]'
            size='small'
          >
            <MenuItem value='all'>All Status</MenuItem>
            <MenuItem value='pending'>Pending</MenuItem>
            <MenuItem value='approved'>Approved</MenuItem>
            <MenuItem value='rejected'>Rejected</MenuItem>
          </TextField>
        </CardContent>

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
                          className={header.column.getCanSort() ? 'cursor-pointer select-none' : ''}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
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
                    No claim requests found
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

        {/* Pagination */}
        <TablePagination
          component={() => <TablePaginationComponent table={table} />}
          count={table.getFilteredRowModel().rows.length}
          rowsPerPage={table.getState().pagination.pageSize}
          page={table.getState().pagination.pageIndex}
          onPageChange={(_, page) => table.setPageIndex(page)}
        />
      </Card>

      {/* Approve/Reject Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth='sm' fullWidth>
        <DialogTitle>{actionType === 'approve' ? 'Approve Claim Request' : 'Reject Claim Request'}</DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <div className='flex flex-col gap-4 pt-2'>
              <div>
                <Typography variant='body2' color='text.secondary'>
                  Contact
                </Typography>
                <Typography variant='body1' className='font-medium'>
                  {selectedRequest.contactName}
                </Typography>
                <Typography variant='body2'>{selectedRequest.contactEmail}</Typography>
              </div>

              <div>
                <Typography variant='body2' color='text.secondary'>
                  Venue
                </Typography>
                <Typography variant='body1' className='font-medium'>
                  {selectedRequest.venueId
                    ? selectedRequest.venue?.name || 'Unknown'
                    : selectedRequest.venueName || 'Unknown'}
                  {!selectedRequest.venueId && (
                    <Chip label='NEW' size='small' color='success' variant='tonal' sx={{ ml: 1 }} />
                  )}
                </Typography>
                {!selectedRequest.venueId && (
                  <Typography variant='body2' color='text.secondary'>
                    {selectedRequest.venueAddress}
                    <br />
                    {selectedRequest.venueCity}, {selectedRequest.venueState} {selectedRequest.venuePostalCode}
                  </Typography>
                )}
              </div>

              {selectedRequest.message && (
                <div>
                  <Typography variant='body2' color='text.secondary'>
                    Message
                  </Typography>
                  <Typography variant='body2'>{selectedRequest.message}</Typography>
                </div>
              )}

              {actionType === 'reject' && (
                <TextField
                  label='Rejection Reason'
                  multiline
                  rows={3}
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  placeholder='Explain why this request is being rejected...'
                  fullWidth
                  required
                />
              )}
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant='contained'
            color={actionType === 'approve' ? 'success' : 'error'}
            onClick={handleSubmitAction}
            disabled={submitting || (actionType === 'reject' && !rejectionReason.trim())}
          >
            {submitting ? 'Processing...' : actionType === 'approve' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Credentials Display Dialog */}
      <Dialog open={!!approvalResult} onClose={() => setApprovalResult(null)} maxWidth='sm' fullWidth>
        <DialogTitle className='bg-green-50'>✅ Vendor Account Created Successfully!</DialogTitle>
        <DialogContent className='pt-6'>
          <div className='space-y-4'>
            <Typography variant='body1' className='font-semibold text-green-600'>
              📧 Welcome email sent successfully!
            </Typography>

            <Typography variant='body2' color='text.secondary' className='mt-2'>
              The vendor has received an email with their login credentials at:
            </Typography>

            <Typography variant='body1' className='font-mono font-semibold mt-1'>
              {approvalResult?.email}
            </Typography>

            <div className='bg-blue-50 dark:bg-blue-900/20 p-3 rounded mt-4'>
              <Typography variant='body2' className='text-blue-700 dark:text-blue-300'>
                🔑 The vendor should use the credentials from their email to log in and change their password.
              </Typography>
            </div>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApprovalResult(null)} variant='contained' color='primary'>
            Got it
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

// Pagination Component
const TablePaginationComponent = ({ table }: { table: any }) => {
  return (
    <div className='flex items-center justify-between p-4'>
      <div className='flex items-center gap-2'>
        <Button
          variant='outlined'
          size='small'
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button variant='outlined' size='small' onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          Next
        </Button>
      </div>
      <Typography variant='body2'>
        Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
      </Typography>
    </div>
  )
}

export default VendorClaimRequestsTable
