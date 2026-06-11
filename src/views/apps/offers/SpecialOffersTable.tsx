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
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import MenuItem from '@mui/material/MenuItem'
import Avatar from '@mui/material/Avatar'
import Tooltip from '@mui/material/Tooltip'
import type { VenueWithRelations } from '@/actions/venue-actions'
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

import { updateVenueOffer, removeVenueOffer } from '@/actions/venue-actions'
import tableStyles from '@core/styles/table.module.css'

type Props = {
  venuesData: VenueWithRelations[]
}

type OfferDialogData = {
  venueId: string
  venueName: string
  specialOffer: string
  discountCode: string
}

// Column definitions
const columnHelper = (
  handleEditOffer: (venue: VenueWithRelations) => void,
  handleRemoveOffer: (id: string, name: string) => void
) => {
  const columns: ColumnDef<VenueWithRelations>[] = [
    {
      accessorKey: 'name',
      header: 'Venue',
      cell: ({ row }) => (
        <div className='flex items-center gap-3'>
          {row.original.images?.[0] && (
            <Avatar
              src={row.original.images[0].url}
              alt={row.original.name}
              variant='rounded'
              sx={{ width: 50, height: 50 }}
            />
          )}
          <div className='flex flex-col'>
            <Typography className='font-medium' color='text.primary'>
              {row.original.name}
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              {row.original.city}
            </Typography>
          </div>
        </div>
      )
    },
    {
      accessorKey: 'specialOffer',
      header: 'Oferta Especial',
      cell: ({ row }) => (
        <div className='max-w-[300px]'>
          <Typography variant='body2' className='line-clamp-2'>
            {row.original.specialOffer || '-'}
          </Typography>
        </div>
      )
    },
    {
      accessorKey: 'discountCode',
      header: 'Discount Code',
      cell: ({ row }) => {
        if (!row.original.discountCode) {
          return <Typography color='text.disabled'>-</Typography>
        }

        return (
          <Chip
            label={row.original.discountCode}
            color='success'
            size='small'
            variant='tonal'
            icon={<i className='tabler-ticket' />}
          />
        )
      }
    },
    {
      accessorKey: 'startingPrice',
      header: 'Precio Base',
      cell: ({ row }) => (
        <Typography variant='body2' className='font-medium'>
          ${row.original.startingPrice?.toFixed(2) || '0.00'}
        </Typography>
      )
    },
    {
      accessorKey: 'isFeatured',
      header: 'Featured',
      cell: ({ row }) => (
        <Chip
          label={row.original.isFeatured ? 'Sí' : 'No'}
          color={row.original.isFeatured ? 'warning' : 'default'}
          size='small'
          variant='tonal'
        />
      )
    },
    {
      accessorKey: 'updatedAt',
      header: 'Última Actualización',
      cell: ({ row }) => (
        <Typography variant='body2' color='text.secondary'>
          {new Date(row.original.updatedAt).toLocaleDateString('es-MX', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })}
        </Typography>
      )
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className='flex gap-1'>
          <Tooltip title='Edit offer'>
            <IconButton size='small' color='primary' onClick={() => handleEditOffer(row.original)}>
              <i className='tabler-edit' />
            </IconButton>
          </Tooltip>
          <Tooltip title='Delete offer'>
            <IconButton
              size='small'
              color='error'
              onClick={() => handleRemoveOffer(row.original.id, row.original.name)}
            >
              <i className='tabler-trash' />
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

const SpecialOffersTable = ({ venuesData }: Props) => {
  const [data, setData] = useState(venuesData)
  const [globalFilter, setGlobalFilter] = useState('')
  const [featuredFilter, setFeaturedFilter] = useState<string>('all')
  const [sorting, setSorting] = useState<SortingState>([{ id: 'updatedAt', desc: true }])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [offerData, setOfferData] = useState<OfferDialogData>({
    venueId: '',
    venueName: '',
    specialOffer: '',
    discountCode: ''
  })
  const [isSaving, setIsSaving] = useState(false)

  const handleEditOffer = (venue: VenueWithRelations) => {
    setOfferData({
      venueId: venue.id,
      venueName: venue.name,
      specialOffer: venue.specialOffer || '',
      discountCode: venue.discountCode || ''
    })
    setDialogOpen(true)
  }

  const handleSaveOffer = async () => {
    if (!offerData.specialOffer.trim()) {
      return
    }

    setIsSaving(true)
    try {
      await updateVenueOffer(offerData.venueId, offerData.specialOffer, offerData.discountCode || undefined)

      // Update local data
      setData(prevData =>
        prevData.map(venue =>
          venue.id === offerData.venueId
            ? {
                ...venue,
                specialOffer: offerData.specialOffer,
                discountCode: offerData.discountCode,
                updatedAt: new Date()
              }
            : venue
        )
      )

      setDialogOpen(false)
      setOfferData({ venueId: '', venueName: '', specialOffer: '', discountCode: '' })
    } catch (error) {
      console.error('Error saving offer:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleRemoveOffer = async (id: string, name: string) => {
    if (!confirm(`Delete the special offer for "${name}"?`)) {
      return
    }

    try {
      await removeVenueOffer(id)

      // Remove from local data
      setData(prevData => prevData.filter(venue => venue.id !== id))
    } catch (error) {
      console.error('Error removing offer:', error)
    }
  }

  const filteredData = useMemo(() => {
    let filtered = data

    if (featuredFilter === 'featured') {
      filtered = filtered.filter(item => item.isFeatured)
    } else if (featuredFilter === 'regular') {
      filtered = filtered.filter(item => !item.isFeatured)
    }

    return filtered
  }, [data, featuredFilter])

  const columns = useMemo(() => columnHelper(handleEditOffer, handleRemoveOffer), [])

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
    const featured = filteredData.filter(item => item.isFeatured).length
    const withCode = filteredData.filter(item => item.discountCode).length

    return { total, featured, withCode }
  }, [filteredData])

  return (
    <>
      <Card>
        <CardHeader
          title='Ofertas Especiales Activas'
          sx={{ '& .MuiCardHeader-action': { m: 0 } }}
          action={
            <Button variant='contained' startIcon={<i className='tabler-plus' />} href='/apps/ecommerce/products/list'>
              Add Offer to Venue
            </Button>
          }
        />

        {/* Stats Cards */}
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 p-6 pt-0'>
          <div className='flex flex-col gap-1 p-4 border rounded-lg'>
            <Typography variant='h4'>{stats.total}</Typography>
            <Typography variant='body2' color='text.secondary'>
              Total con Ofertas
            </Typography>
          </div>
          <div className='flex flex-col gap-1 p-4 border rounded-lg'>
            <Typography variant='h4'>{stats.featured}</Typography>
            <Typography variant='body2' color='text.secondary'>
              Featured
            </Typography>
          </div>
          <div className='flex flex-col gap-1 p-4 border rounded-lg'>
            <Typography variant='h4'>{stats.withCode}</Typography>
            <Typography variant='body2' color='text.secondary'>
              With Discount Code
            </Typography>
          </div>
        </div>

        {/* Filters */}
        <div className='flex flex-wrap gap-4 p-6 pt-0'>
          <TextField
            value={globalFilter ?? ''}
            onChange={e => setGlobalFilter(e.target.value)}
            placeholder='Buscar venue...'
            size='small'
            className='min-w-[200px]'
            InputProps={{
              startAdornment: <i className='tabler-search text-textSecondary' />
            }}
          />
          <TextField
            select
            value={featuredFilter}
            onChange={e => setFeaturedFilter(e.target.value)}
            size='small'
            className='min-w-[150px]'
            label='Tipo'
          >
            <MenuItem value='all'>Todos</MenuItem>
            <MenuItem value='featured'>Solo Featured</MenuItem>
            <MenuItem value='regular'>Solo Regulares</MenuItem>
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
                    No se encontraron venues con ofertas
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

      {/* Edit Offer Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Edit Special Offer</DialogTitle>
        <DialogContent>
          <div className='flex flex-col gap-4 pt-2'>
            <Typography variant='body2' color='text.secondary'>
              Venue: <strong>{offerData.venueName}</strong>
            </Typography>

            <TextField
              fullWidth
              label='Offer Description'
              multiline
              rows={3}
              value={offerData.specialOffer}
              onChange={e => setOfferData({ ...offerData, specialOffer: e.target.value })}
              placeholder='Ej: ¡10% de descuento en todas las fiestas! Pizza gratis incluida.'
              helperText='This description will be displayed to users on the venue page'
            />

            <TextField
              fullWidth
              label='Discount Code'
              value={offerData.discountCode}
              onChange={e => setOfferData({ ...offerData, discountCode: e.target.value.toUpperCase() })}
              placeholder='Ej: BASHWISH10'
              helperText='Code that users can use when booking (optional)'
              InputProps={{
                startAdornment: <i className='tabler-ticket text-textSecondary mr-2' />
              }}
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} color='secondary'>
            Cancelar
          </Button>
          <Button onClick={handleSaveOffer} variant='contained' disabled={isSaving || !offerData.specialOffer.trim()}>
            {isSaving ? 'Saving...' : 'Save Offer'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default SpecialOffersTable
