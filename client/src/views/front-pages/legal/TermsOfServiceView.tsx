// MUI Imports
import Typography from '@mui/material/Typography'

// Type Imports
import type { Locale } from '@configs/i18n'

// Component Imports
import StaticPageLayout from '@views/front-pages/shared/StaticPageLayout'

const sections = [
  {
    heading: 'Using AccounTrack',
    body: 'By creating an account, you agree to use AccounTrack in compliance with these Terms of Service and any applicable laws. You are responsible for the accuracy of the business data you enter into your company workspace.'
  },
  {
    heading: 'Accounts and Access',
    body: 'You are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account. Access within a company workspace is governed by the roles assigned to each user (Owner, Manager, Accountant or Employee).'
  },
  {
    heading: 'Your Data',
    body: 'You retain ownership of the business data you enter into AccounTrack, including your customers, suppliers, products, invoices, payments and reports. We use this data only to provide the platform to you.'
  },
  {
    heading: 'Acceptable Use',
    body: 'You agree not to misuse the platform, attempt to access data belonging to another tenant, or interfere with the normal operation of the service.'
  },
  {
    heading: 'Service Availability',
    body: 'We work to keep AccounTrack available and reliable, but the service is provided on an "as is" basis without guarantees of uninterrupted availability.'
  },
  {
    heading: 'Changes to These Terms',
    body: 'We may update these Terms of Service from time to time. Continued use of AccounTrack after changes are posted constitutes acceptance of the updated terms.'
  }
]

const TermsOfServiceView = ({ lang }: { lang: Locale }) => {
  return (
    <StaticPageLayout lang={lang} title='Terms of Service' lastUpdated='August 2026'>
      <Typography variant='body1' color='text.secondary'>
        These Terms of Service govern your use of AccounTrack, a multi-tenant Account Management System.
      </Typography>

      {sections.map(section => (
        <div key={section.heading}>
          <Typography variant='h6' className='font-semibold mbe-2'>
            {section.heading}
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            {section.body}
          </Typography>
        </div>
      ))}
    </StaticPageLayout>
  )
}

export default TermsOfServiceView
