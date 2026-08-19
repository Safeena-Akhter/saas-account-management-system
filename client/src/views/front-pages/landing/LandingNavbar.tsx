'use client'

// React Imports
import { useState } from 'react'

// Next Imports
import NextLink from 'next/link'

// MUI Imports
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Drawer from '@mui/material/Drawer'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Divider from '@mui/material/Divider'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'

// Type Imports
import type { Locale } from '@configs/i18n'

// Component Imports
import Logo from '@components/layout/shared/Logo'

// Util Imports
import { getLocalizedUrl } from '@/utils/i18n'

type NavLink = {
  label: string
  href: string
}

const navLinks: NavLink[] = [
  { label: 'Home', href: '#top' },
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Benefits', href: '#benefits' },
  { label: 'Contact', href: '#contact' }
]

const LandingNavbar = ({ lang }: { lang: Locale }) => {
  const [mobileOpen, setMobileOpen] = useState(false)

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const loginHref = getLocalizedUrl('/login', lang)
  const registerHref = getLocalizedUrl('/register', lang)

  return (
    <>
      <AppBar
        component='nav'
        position='sticky'
        elevation={0}
        color='default'
        id='top'
        className='border-be bg-backgroundPaper'
        sx={{ backdropFilter: 'blur(8px)' }}
      >
        <Toolbar className='!min-bs-[64px] gap-4 justify-between plb-2 pli-4 sm:pli-6'>
          <NextLink
            href={getLocalizedUrl('/', lang)}
            aria-label='AccounTrack home'
            className='flex items-center no-underline'
          >
            <Logo />
          </NextLink>

          {!isMobile && (
            <nav aria-label='Primary' className='flex items-center gap-1'>
              {navLinks.map(link => (
                <Button
                  key={link.href}
                  component='a'
                  href={link.href}
                  color='inherit'
                  className='text-textPrimary font-medium'
                >
                  {link.label}
                </Button>
              ))}
            </nav>
          )}

          {!isMobile ? (
            <div className='flex items-center gap-3'>
              <Button component={NextLink} href={loginHref} variant='outlined' color='primary'>
                Login
              </Button>
              <Button component={NextLink} href={registerHref} variant='contained' color='primary'>
                Get Started
              </Button>
            </div>
          ) : (
            <IconButton
              aria-label='Open navigation menu'
              onClick={() => setMobileOpen(true)}
              color='default'
            >
              <i className='ri-menu-line text-[26px]' />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      <Drawer
        anchor='right'
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
      >
        <div className='is-[280px] flex flex-col bs-full'>
          <div className='flex items-center justify-between pli-4 plb-4'>
            <Logo />
            <IconButton aria-label='Close navigation menu' onClick={() => setMobileOpen(false)}>
              <i className='ri-close-line text-[24px]' />
            </IconButton>
          </div>
          <Divider />
          <List component='nav' aria-label='Primary' className='flex-1'>
            {navLinks.map(link => (
              <ListItemButton
                key={link.href}
                component='a'
                href={link.href}
                onClick={() => setMobileOpen(false)}
              >
                <ListItemText primary={link.label} />
              </ListItemButton>
            ))}
          </List>
          <Divider />
          <div className='flex flex-col gap-3 pli-4 plb-4'>
            <Button component={NextLink} href={loginHref} variant='outlined' color='primary' fullWidth>
              Login
            </Button>
            <Button component={NextLink} href={registerHref} variant='contained' color='primary' fullWidth>
              Get Started
            </Button>
          </div>
        </div>
      </Drawer>
    </>
  )
}

export default LandingNavbar
