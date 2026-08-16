'use client'

// React Imports
import { useState } from 'react'
import type { SyntheticEvent } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'
import Tab from '@mui/material/Tab'
import TabContext from '@mui/lab/TabContext'
import TabPanel from '@mui/lab/TabPanel'

// Component Imports
import CustomTabList from '@core/components/mui/TabList'
import ProfileTab from './ProfileTab'
import SecurityTab from './SecurityTab'
import PreferencesTab from './PreferencesTab'

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('profile')

  const handleChange = (_event: SyntheticEvent, value: string) => {
    setActiveTab(value)
  }

  return (
    <TabContext value={activeTab}>
      <Grid container spacing={6}>
        <Grid size={{ xs: 12 }}>
          <CustomTabList onChange={handleChange} variant='scrollable' pill='true'>
            <Tab label='Profile' icon={<i className='ri-user-3-line' />} iconPosition='start' value='profile' />
            <Tab label='Security' icon={<i className='ri-lock-2-line' />} iconPosition='start' value='security' />
            <Tab
              label='Preferences'
              icon={<i className='ri-settings-4-line' />}
              iconPosition='start'
              value='preferences'
            />
          </CustomTabList>
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TabPanel value='profile' className='p-0'>
            <ProfileTab />
          </TabPanel>
          <TabPanel value='security' className='p-0'>
            <SecurityTab />
          </TabPanel>
          <TabPanel value='preferences' className='p-0'>
            <PreferencesTab />
          </TabPanel>
        </Grid>
      </Grid>
    </TabContext>
  )
}

export default SettingsPage
