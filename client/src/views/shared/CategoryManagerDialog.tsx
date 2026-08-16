'use client'

// A generic "manage categories" dialog reused by both Expense Categories
// and Income Categories (see views/expenses/ExpensesTable.tsx and
// views/income/IncomesTable.tsx) - the two are structurally identical CRUD
// lists (name, description, isActive, a usage count), so rather than
// building two nearly-identical full table pages, this renders the CRUD
// inline as a dialog launched from each module's own table toolbar. Full
// pagination/search isn't offered here deliberately - category lists are
// small (dozens, not thousands), so a plain scrollable list is enough.

import { useState } from 'react'

import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Chip from '@mui/material/Chip'
import Switch from '@mui/material/Switch'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'

export type ManagedCategory = {
  id: string
  name: string
  description: string | null
  isActive: boolean
  usageCount?: number
}

type Props = {
  open: boolean
  onClose: () => void
  title: string
  usageLabel: string // e.g. "expenses" / "incomes" - used in the delete-blocked message
  categories: ManagedCategory[]
  isLoading?: boolean
  canWrite: boolean
  onCreate: (input: { name: string; description?: string | null }) => Promise<unknown>
  onUpdate: (id: string, input: { name?: string; description?: string | null }) => Promise<unknown>
  onToggleActive: (id: string, isActive: boolean) => Promise<unknown>
  onDelete: (id: string) => Promise<unknown>
}

const CategoryManagerDialog = ({
  open,
  onClose,
  title,
  usageLabel,
  categories,
  isLoading,
  canWrite,
  onCreate,
  onUpdate,
  onToggleActive,
  onDelete
}: Props) => {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const resetForm = () => {
    setName('')
    setDescription('')
    setEditingId(null)
  }

  const startEdit = (category: ManagedCategory) => {
    setEditingId(category.id)
    setName(category.name)
    setDescription(category.description ?? '')
  }

  const handleSave = async () => {
    if (!name.trim()) return

    setError(null)
    setSaving(true)

    try {
      if (editingId) {
        await onUpdate(editingId, { name, description: description || null })
      } else {
        await onCreate({ name, description: description || null })
      }

      resetForm()
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not save category.')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (category: ManagedCategory) => {
    setError(null)
    setBusyId(category.id)

    try {
      await onToggleActive(category.id, !category.isActive)
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not update category.')
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async (category: ManagedCategory) => {
    setError(null)
    setBusyId(category.id)

    try {
      await onDelete(category.id)
    } catch (err: any) {
      setError(err?.response?.data?.message ?? `Could not delete category.`)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={() => {
        resetForm()
        onClose()
      }}
      fullWidth
      maxWidth='sm'
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity='error' className='mbe-4' onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {canWrite && (
          <div className='flex flex-col gap-3 mbe-4'>
            <div className='flex gap-3 items-start'>
              <TextField
                size='small'
                label='Name'
                value={name}
                onChange={e => setName(e.target.value)}
                fullWidth
              />
              <TextField
                size='small'
                label='Description (optional)'
                value={description}
                onChange={e => setDescription(e.target.value)}
                fullWidth
              />
            </div>
            <div className='flex gap-2 justify-end'>
              {editingId && (
                <Button size='small' onClick={resetForm}>
                  Cancel
                </Button>
              )}
              <Button size='small' variant='contained' onClick={handleSave} disabled={saving || !name.trim()}>
                {saving ? <CircularProgress size={18} color='inherit' /> : editingId ? 'Update' : 'Add Category'}
              </Button>
            </div>
            <Divider />
          </div>
        )}

        {isLoading ? (
          <div className='flex justify-center p-6'>
            <CircularProgress size={24} />
          </div>
        ) : categories.length === 0 ? (
          <Typography color='text.secondary' className='p-4 text-center'>
            No categories yet.
          </Typography>
        ) : (
          <List dense disablePadding>
            {categories.map(category => (
              <ListItem
                key={category.id}
                secondaryAction={
                  canWrite && (
                    <div className='flex items-center gap-1'>
                      {busyId === category.id ? (
                        <CircularProgress size={18} />
                      ) : (
                        <>
                          <Switch
                            size='small'
                            checked={category.isActive}
                            onChange={() => handleToggle(category)}
                            title={category.isActive ? 'Deactivate' : 'Activate'}
                          />
                          <IconButton size='small' onClick={() => startEdit(category)}>
                            <i className='ri-pencil-line text-[18px]' />
                          </IconButton>
                          <IconButton
                            size='small'
                            onClick={() => handleDelete(category)}
                            disabled={Boolean(category.usageCount) && category.usageCount! > 0}
                            title={
                              category.usageCount
                                ? `Cannot delete - ${category.usageCount} ${usageLabel} use this category`
                                : 'Delete'
                            }
                          >
                            <i className='ri-delete-bin-6-line text-[18px]' />
                          </IconButton>
                        </>
                      )}
                    </div>
                  )
                }
              >
                <ListItemText
                  primary={
                    <div className='flex items-center gap-2'>
                      <Typography>{category.name}</Typography>
                      {!category.isActive && <Chip size='small' label='Inactive' variant='tonal' color='default' />}
                    </div>
                  }
                  secondary={category.description ?? undefined}
                />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}

export default CategoryManagerDialog
