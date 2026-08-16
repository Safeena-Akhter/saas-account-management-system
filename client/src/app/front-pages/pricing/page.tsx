// Component Imports
import PricingWrapper from '@/views/front-pages/pricing'

// Data Imports
// eslint-disable-next-line import/no-unresolved
import { getPricingData } from '@/app/server/actions'

const PricingPage = async () => {
  // Vars
  const data = await getPricingData()

  return <PricingWrapper data={data} />
}

export default PricingPage
