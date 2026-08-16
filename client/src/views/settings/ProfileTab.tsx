'use client'

// React Imports
import { useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'

// Third-party Imports
import { useSession } from 'next-auth/react'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'

// Feature Imports
import { useUpdateProfile, useUploadAvatar } from '@/features/auth/useAuth'

// Matches server/src/middlewares/upload.middleware.ts's avatar limits.
const MAX_AVATAR_SIZE_BYTES = 3 * 1024 * 1024 // 3MB

const ProfileTab = () => {
  const { data: session, update } = useSession()

  const updateProfile = useUpdateProfile()
  const uploadAvatar = useUploadAvatar()

  const fileInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState(session?.user.name ?? '')
  const [phone, setPhone] = useState(session?.user.phone ?? '')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [avatarError, setAvatarError] = useState<string | null>(null)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setSuccessMessage(null)

    updateProfile.mutate(
      { name, phone },
      {
        onSuccess: user => {
          setSuccessMessage('Profile updated.')

          // Refresh the NextAuth session immediately (see libs/auth.ts's
          // jwt callback trigger === 'update' branch) so the navbar/avatar
          // dropdown reflect the new name right away, without waiting for
          // the access token to naturally expire.
          void update(user)
        }
      }
    )
  }

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    if (!file) return

    setAvatarError(null)
    setSuccessMessage(null)

    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      setAvatarError('Avatar must be smaller than 3MB.')

      return
    }

    uploadAvatar.mutate(file, {
      onSuccess: user => {
        setSuccessMessage('Avatar updated.')
        void update(user)
      },
      onError: err => setAvatarError(err.response?.data?.message ?? 'Could not upload avatar, please try again.')
    })
  }

  return (
    <Card>
      <CardHeader title='Profile' subheader='Your personal details' />
      <CardContent className='mbe-5'>
        <div className='flex max-sm:flex-col items-center gap-6'>
          {session?.user.avatarUrl ? (
            <img
              height={100}
              width={100}
              className='rounded-full object-cover'
              src={session.user.avatarUrl}
              alt={session.user.name}
            />
          ) : (
            <CustomAvatar variant='rounded' skin='light' color='primary' size={100}>
              <i className='ri-user-3-line text-5xl' />
            </CustomAvatar>
          )}
          <div className='flex grow flex-col gap-4'>
            <div className='flex flex-col sm:flex-row gap-4'>
              <Button component='label' variant='contained' htmlFor='avatar-upload' disabled={uploadAvatar.isPending}>
                {uploadAvatar.isPending ? <CircularProgress size={20} color='inherit' className='mie-2' /> : null}
                Upload Photo
                <input
                  hidden
                  type='file'
                  accept='image/png, image/jpeg, image/webp'
                  onChange={handleAvatarChange}
                  id='avatar-upload'
                  ref={fileInputRef}
                />
              </Button>
            </div>
            <Typography color='text.disabled'>Allowed PNG, JPEG or WEBP. Max size of 3MB.</Typography>
            {avatarError && <Alert severity='error'>{avatarError}</Alert>}
          </div>
        </div>
      </CardContent>
      <CardContent>
        {updateProfile.isError && (
          <Alert severity='error' className='mbe-4'>
            {updateProfile.error.response?.data?.message ?? 'Something went wrong. Please try again.'}
          </Alert>
        )}
        {successMessage && (
          <Alert severity='success' className='mbe-4' onClose={() => setSuccessMessage(null)}>
            {successMessage}
          </Alert>
        )}
        <form onSubmit={handleSubmit}>
          <Grid container spacing={5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label='Full name'
                value={name}
                onChange={e => {
                  setName(e.target.value)
                  setSuccessMessage(null)
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label='Email'
                type='email'
                value={session?.user.email ?? ''}
                disabled
                helperText="Email changes aren't supported yet"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label='Phone'
                value={phone}
                onChange={e => {
                  setPhone(e.target.value)
                  setSuccessMessage(null)
                }}
              />
            </Grid>
            <Grid size={12}>
              <Button type='submit' variant='contained' disabled={updateProfile.isPending}>
                {updateProfile.isPending ? <CircularProgress size={22} color='inherit' /> : 'Save changes'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  )
}

export default ProfileTab
