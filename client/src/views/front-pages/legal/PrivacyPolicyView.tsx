// MUI Imports
import Typography from '@mui/material/Typography'

// Type Imports
import type { Locale } from '@configs/i18n'

// Component Imports
import StaticPageLayout from '@views/front-pages/shared/StaticPageLayout'

const sections = [
  {
    heading: 'Information We Collect',
    body: 'When you create an account and use AccounTrack, we collect the information you provide directly, such as your name, email address and the company and business data you enter into the platform (customers, suppliers, products, invoices, payments and related records).'
  },
  {
    heading: 'How We Use Your Information',
    body: 'We use your information to operate your account, provide the features of the platform, authenticate your sessions, and communicate with you about your account. Business data you enter is used solely to power the features you use within your own company workspace.'
  },
  {
    heading: 'Data Isolation Between Companies',
    body: 'AccounTrack is a multi-tenant platform. Data belonging to one company account is kept separate from other company accounts and is not shared between tenants.'
  },
  {
    heading: 'Data Security',
    body: 'We use industry-standard practices such as JSON Web Token (JWT) based authentication and role-based access control to help protect your account and data from unauthorized access.'
  },
  {
    heading: 'Your Choices',
    body: 'You can review and update the information associated with your account from within the application. If you would like to discuss your data, you can reach out to us using the contact details on our website.'
  },
  {
    heading: 'Changes to This Policy',
    body: 'We may update this Privacy Policy from time to time. Continued use of AccounTrack after changes are posted constitutes acceptance of the updated policy.'
  }
]

const PrivacyPolicyView = ({ lang }: { lang: Locale }) => {
  return (
    <StaticPageLayout lang={lang} title='Privacy Policy' lastUpdated='August 2026'>
      <Typography variant='body1' color='text.secondary'>
        This Privacy Policy explains how AccounTrack collects, uses and protects information when you use our
        multi-tenant Account Management System.
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

export default PrivacyPolicyView
