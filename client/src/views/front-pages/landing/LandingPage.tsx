// Type Imports
import type { Locale } from '@configs/i18n'

// Component Imports
import LandingNavbar from './LandingNavbar'
import HeroSection from './HeroSection'
import ValueSection from './ValueSection'
import FeaturesSection from './FeaturesSection'
import HowItWorksSection from './HowItWorksSection'
import PricingSection from './PricingSection'
import BenefitsSection from './BenefitsSection'
import SecuritySection from './SecuritySection'
import CtaSection from './CtaSection'
import LandingFooter from './LandingFooter'

const LandingPage = ({ lang }: { lang: Locale }) => {
  return (
    <div className='flex flex-col is-full bs-full'>
      <LandingNavbar lang={lang} />
      <main className='flex-1'>
        <HeroSection lang={lang} />
        <ValueSection />
        <FeaturesSection />
        <HowItWorksSection />
        <PricingSection lang={lang} />
        <BenefitsSection />
        <SecuritySection />
        <CtaSection lang={lang} />
      </main>
      <LandingFooter lang={lang} />
    </div>
  )
}

export default LandingPage
