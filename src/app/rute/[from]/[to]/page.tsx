import { redirect } from 'next/navigation'
import { DateTime } from 'luxon'

interface Props {
  params: Promise<{ from: string; to: string }>
}

export default async function RouteRedirectPage({ params }: Props) {
  const { from, to } = await params
  const today = DateTime.now().setZone('Europe/Belgrade').toISODate()
  redirect(`/rute/${from}/${to}/${today}`)
}
