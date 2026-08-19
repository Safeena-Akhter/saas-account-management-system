'use client'

// React & Next.js Imports
import { useRouter } from 'next/navigation'

// UI & Theme Imports
import classnames from 'classnames'

export default function SupportPage() {
  const router = useRouter()

  return (
    <div className='max-w-5xl mx-auto space-y-6 pb-8'>
      {/* Navigation Header */}
      <div className='flex items-center justify-between'>
        <button
          onClick={() => router.back()}
          className='flex items-center gap-2 text-sm font-medium text-textSecondary hover:text-primary transition-colors bg-transparent border-none p-0 cursor-pointer'
        >
          <i className='ri-arrow-left-line text-lg' />
          <span>Back to previous page</span>
        </button>
      </div>

      {/* Main Title Banner */}
      <div className='p-6 rounded-xl bg-card border border-border shadow-sm space-y-2'>
        <div className='flex items-center gap-3'>
          <div className='p-2 rounded-lg bg-primary/10 text-primary'>
            <i className='ri-customer-service-2-line text-2xl' />
          </div>
          <div>
            <h1 className='text-2xl font-bold text-textPrimary'>AccountTrack Support Center</h1>
            <p className='text-sm text-textSecondary'>
              Get assistance with multi-tenant company settings, invoice management, role permissions, and billing.
            </p>
          </div>
        </div>
      </div>

      {/* Primary Action Cards */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        {/* Card 1: Technical Support */}
        <div className='p-5 rounded-xl bg-card border border-border shadow-sm flex flex-col justify-between space-y-4 hover:border-primary/50 transition-all'>
          <div className='space-y-2'>
            <div className='w-10 h-10 rounded-lg bg-info/10 text-info flex items-center justify-center'>
              <i className='ri-mail-send-line text-xl' />
            </div>
            <h2 className='text-base font-semibold text-textPrimary'>Email Assistance</h2>
            <p className='text-xs text-textSecondary leading-relaxed'>
              Have an issue with database sync, customer history, or team access? Reach out to our technical team.
            </p>
          </div>
          <a
            href='mailto:support@accounttrack.com'
            className='inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline'
          >
            Contact Support <i className='ri-arrow-right-s-line' />
          </a>
        </div>

        {/* Card 2: Documentation & Guides */}
        <div className='p-5 rounded-xl bg-card border border-border shadow-sm flex flex-col justify-between space-y-4 hover:border-primary/50 transition-all'>
          <div className='space-y-2'>
            <div className='w-10 h-10 rounded-lg bg-success/10 text-success flex items-center justify-center'>
              <i className='ri-book-open-line text-xl' />
            </div>
            <h2 className='text-base font-semibold text-textPrimary'>System Documentation</h2>
            <p className='text-xs text-textSecondary leading-relaxed'>
              Explore quick start guides on setting up Tax settings, Products, Stock updates, and Cloudinary receipts.
            </p>
          </div>
          <a
            href='#faqs'
            className='inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline'
          >
            Browse FAQs <i className='ri-arrow-down-s-line' />
          </a>
        </div>

        {/* Card 3: Subscription & Upgrades */}
        <div className='p-5 rounded-xl bg-card border border-border shadow-sm flex flex-col justify-between space-y-4 hover:border-primary/50 transition-all'>
          <div className='space-y-2'>
            <div className='w-10 h-10 rounded-lg bg-warning/10 text-warning flex items-center justify-center'>
              <i className='ri-vip-crown-line text-xl' />
            </div>
            <h2 className='text-base font-semibold text-textPrimary'>Subscription & Billing</h2>
            <p className='text-xs text-textSecondary leading-relaxed'>
              Need to upgrade your tier or increase your invoice and user limits? Check your active company plan.
            </p>
          </div>
          <button
            onClick={() => router.push('/en/subscription')}
            className='inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline bg-transparent border-none p-0 cursor-pointer text-left'
          >
            Manage Subscription <i className='ri-arrow-right-s-line' />
          </button>
        </div>
      </div>

      {/* System Knowledge Base / FAQs */}
      <div id='faqs' className='p-6 rounded-xl bg-card border border-border shadow-sm space-y-6'>
        <div className='flex items-center justify-between border-b border-border pb-4'>
          <h2 className='text-lg font-semibold text-textPrimary'>Frequently Asked Questions</h2>
          <span className='text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium'>
            System SRS V1.0
          </span>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {/* FAQ Item 1 */}
          <div className='p-4 rounded-lg bg-background border border-border space-y-1.5'>
            <h3 className='text-sm font-semibold text-textPrimary flex items-center gap-2'>
              <i className='ri-shield-user-line text-primary' />
              How do Role Permissions (RBAC) work?
            </h3>
            <p className='text-xs text-textSecondary leading-relaxed'>
              Business Owners have full operational control. Managers can edit invoices and products, while Accountants focus on expenses and reports. Read-only access applies to standard Employees.
            </p>
          </div>

          {/* FAQ Item 2 */}
          <div className='p-4 rounded-lg bg-background border border-border space-y-1.5'>
            <h3 className='text-sm font-semibold text-textPrimary flex items-center gap-2'>
              <i className='ri-file-pdf-line text-primary' />
              How do I export PDF Invoices or Reports?
            </h3>
            <p className='text-xs text-textSecondary leading-relaxed'>
              Navigate to the Invoices or Reports module, select your desired entry or date filter, and click the Print/Export button to generate downloadable PDF or Excel documents.
            </p>
          </div>

          {/* FAQ Item 3 */}
          <div className='p-4 rounded-lg bg-background border border-border space-y-1.5'>
            <h3 className='text-sm font-semibold text-textPrimary flex items-center gap-2'>
              <i className='ri-building-line text-primary' />
              Is my company data isolated from other businesses?
            </h3>
            <p className='text-xs text-textSecondary leading-relaxed'>
              Yes. AccountTrack enforces strict multi-tenant isolation using unique tenant identifiers (`companyId`) across all database queries and server API endpoints.
            </p>
          </div>

          {/* FAQ Item 4 */}
          <div className='p-4 rounded-lg bg-background border border-border space-y-1.5'>
            <h3 className='text-sm font-semibold text-textPrimary flex items-center gap-2'>
              <i className='ri-[#000] ri-price-tag-3-line text-primary' />
              What happens if I reach my plan limit?
            </h3>
            <p className='text-xs text-textSecondary leading-relaxed'>
              If you hit your maximum user, product, or invoice threshold, the system will prompt you to upgrade your plan under the Subscription Settings tab.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}