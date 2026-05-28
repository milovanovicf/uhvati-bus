import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'O nama | UhvatiBus',
  description: 'Saznajte više o UhvatiBus platformi — misiji, timu i vrednostima koje stoje iza najbrže rezervacije autobuskih karata u Srbiji.',
}

export default function ONameLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
