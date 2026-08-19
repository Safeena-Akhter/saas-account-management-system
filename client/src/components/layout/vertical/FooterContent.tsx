'use client'

import Link from 'next/link'

import classnames from 'classnames'

import useVerticalNav from '../../../@menu/hooks/useVerticalNav'

// Util Imports
import { verticalLayoutClasses } from '../../../@layouts/utils/layoutClasses'

const FooterContent = () => {
  // Hooks
  const { isBreakpointReached } = useVerticalNav()

  return (
    <div
      className={classnames(verticalLayoutClasses.footerContent, 'flex items-center justify-between flex-wrap gap-4')}
    >
      <p>
        <span className='text-textSecondary'>{`© ${new Date().getFullYear()} `}</span>
        <span className='font-semibold text-textPrimary'>AccountTrack</span>
        <span className='text-textSecondary'>{`. All rights reserved.`}</span>
      </p>
      {!isBreakpointReached && (
        <div className='flex items-center gap-4'>
          <Link href='/privacy-policy' className='text-primary hover:underline'>
            Privacy Policy
          </Link>
          <Link href='/terms-of-service' className='text-primary hover:underline'>
            Terms of Service
          </Link>
          <Link href='/support' className='text-primary hover:underline'>
            Support & Help
          </Link>
        </div>
      )}
    </div>
  )
}

export default FooterContent