import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Za prevoznike | UhvatiBus',
  description: 'Digitalizujte prodaju karata i upravljanje linijama. Pridružite se UhvatiBus platformi i povežite se sa putnicima širom Srbije.',
}

export default function ZaFirmeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
