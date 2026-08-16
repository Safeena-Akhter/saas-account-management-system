'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import IconButton from '@mui/material/IconButton'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Skeleton from '@mui/material/Skeleton'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Tooltip from '@mui/material/Tooltip'

// Third-party Imports
import { signOut } from 'next-auth/react'
import { formatDistanceToNowStrict } from 'date-fns/formatDistanceToNowStrict'

// Feature Imports
import { useLogoutAllSessions, useRevokeSession, useSessions } from '@/features/auth/useAuth'
import type { Session } from '@/features/auth/types'

// Very light user-agent -> "Browser on OS" summary. Good enough for a
// settings screen glance, not meant to be a full UA parser (a dependency
// like ua-parser-js would be overkill just for this one card).
function describeDevice(userAgent: string | null) {
  if (!userAgent) return 'Unknown device'

  const os = /Windows/.test(userAgent)
    ? 'Windows'
    : /Mac OS/.test(userAgent)
      ? 'macOS'
      : /Android/.test(userAgent)
        ? 'Android'
        : /iPhone|iPad/.test(userAgent)
          ? 'iOS'
          : /Linux/.test(userAgent)
            ? 'Linux'
            : 'Unknown OS'

  const browser = /Edg\//.test(userAgent)
    ? 'Edge'
    : /Chrome\//.test(userAgent)
      ? 'Chrome'
      : /Firefox\//.test(userAgent)
        ? 'Firefox'
        : /Safari\//.test(userAgent)
          ? 'Safari'
          : 'Unknown browser'

  return `${browser} on ${os}`
}

const SessionRow = ({ session, onRevoke, isRevoking }: { session: Session; onRevoke: () => void; isRevoking: boolean }) => (
  <ListItem
    secondaryAction={
      session.isCurrent ? (
        <Chip size='small' color='success' variant='tonal' label='This device' />
      ) : (
        <Tooltip title='Log out this device'>
          <IconButton edge='end' onClick={onRevoke} disabled={isRevoking}>
            {isRevoking ? <CircularProgress size={18} /> : <i className='ri-close-line' />}
          </IconButton>
        </Tooltip>
      )
    }
  >
    <ListItemText
      primary={describeDevice(session.userAgent)}
      secondary={
        <>
          {session.ipAddress ? `${session.ipAddress} - ` : ''}
          Last active{' '}
          {session.lastUsedAt
            ? formatDistanceToNowStrict(new Date(session.lastUsedAt), { addSuffix: true })
            : 'unknown'}
        </>
      }
    />
  </ListItem>
)

const SessionsCard = () => {
  const { data: sessions, isLoading } = useSessions()
  const revokeSession = useRevokeSession()
  const logoutAll = useLogoutAllSessions()

  const [revokingId, setRevokingId] = useState<string | null>(null)

  const handleRevoke = (id: string) => {
    setRevokingId(id)
    revokeSession.mutate(id, { onSettled: () => setRevokingId(null) })
  }

  const handleLogoutAll = () => {
    logoutAll.mutate(undefined, {
      // The current device's own refresh token was just revoked
      // server-side too, so there's nothing left to keep this client
      // session open with - sign out here the same way the regular logout
      // button does.
      onSuccess: () => void signOut({ callbackUrl: '/login' })
    })
  }

  return (
    <Card>
      <CardHeader
        title='Active Sessions'
        subheader='Devices currently signed in to your account'
        action={
          <Button
            color='error'
            variant='outlined'
            size='small'
            onClick={handleLogoutAll}
            disabled={logoutAll.isPending || !sessions || sessions.length <= 1}
            startIcon={logoutAll.isPending ? <CircularProgress size={16} color='inherit' /> : <i className='ri-logout-box-line' />}
          >
            Log out all devices
          </Button>
        }
      />
      <CardContent>
        {logoutAll.isError && (
          <Alert severity='error' className='mbe-4'>
            {logoutAll.error.response?.data?.message ?? 'Could not log out of all devices. Please try again.'}
          </Alert>
        )}
        {revokeSession.isError && (
          <Alert severity='error' className='mbe-4'>
            {revokeSession.error.response?.data?.message ?? 'Could not log out that device. Please try again.'}
          </Alert>
        )}

        {isLoading ? (
          <Skeleton variant='rectangular' height={120} />
        ) : !sessions || sessions.length === 0 ? (
          <Alert severity='info'>No active sessions found.</Alert>
        ) : (
          <List disablePadding>
            {sessions.map((session, index) => (
              <div key={session.id}>
                <SessionRow
                  session={session}
                  onRevoke={() => handleRevoke(session.id)}
                  isRevoking={revokingId === session.id && revokeSession.isPending}
                />
                {index !== sessions.length - 1 && <Divider component='li' />}
              </div>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  )
}

export default SessionsCard
