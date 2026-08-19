import type { SVGAttributes } from 'react'

// AccounTrack mark: ascending bar-chart with a checkmark badge, signalling
// growth + verified financial tracking. Kept to the original 32x32 viewBox
// so it drops into the existing navbar/login layout with no spacing changes.
const Logo = (props: SVGAttributes<SVGElement>) => {
  return (
    <svg width='32' height='32' viewBox='0 0 32 32' fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
      <rect x='2' y='16' width='6' height='12' rx='2.5' fill='#7367F0' fillOpacity='0.45' />
      <rect x='11' y='10' width='6' height='18' rx='2.5' fill='#7367F0' fillOpacity='0.75' />
      <rect x='20' y='4' width='6' height='24' rx='2.5' fill='#7367F0' />
      <circle cx='23' cy='7' r='6' fill='#7367F0' stroke='white' strokeWidth='1.5' />
      <path
        d='M20.3 7L22.1 8.8L25.7 5.2'
        stroke='white'
        strokeWidth='1.4'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

export default Logo