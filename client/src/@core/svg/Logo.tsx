// React Imports
import type { SVGAttributes } from 'react'

// AccounTrack mark: three ascending bars (growth / financial tracking)
// topped with a check-node, replacing the template's original abstract
// ribbon logo. Kept to the same 40x22 viewBox as before so it drops into
// the existing navbar/login layout without any spacing changes.
const Logo = (props: SVGAttributes<SVGElement>) => {
  return (
    <svg width='40' height='22' viewBox='0 0 40 22' fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
      <rect x='1' y='13' width='7' height='9' rx='2' fill='var(--mui-palette-primary-main)' fillOpacity='0.4' />
      <rect x='12' y='7' width='7' height='15' rx='2' fill='var(--mui-palette-primary-main)' fillOpacity='0.7' />
      <rect x='23' y='0' width='7' height='22' rx='2' fill='var(--mui-palette-primary-main)' />
      <circle cx='26.5' cy='4.5' r='4.5' fill='var(--mui-palette-primary-main)' />
      <path
        d='M24.5 4.5L25.8 5.8L28.5 3.1'
        stroke='var(--mui-palette-common-white)'
        strokeWidth='1.15'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

export default Logo
