'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DateTime } from 'luxon';
import { Bus, Users, TicketCheck, TrendingUp, ArrowRight } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/LanguageContext';

type Stats = {
  thisMonth: {
    trips: number;
    reservations: number;
    seatsSold: number;
    occupancy: number;
  };
  upcomingTrips: {
    id: number;
    from: string;
    to: string;
    departure: Date;
    seatsTotal: number;
    seatsSold: number;
  }[];
  routeStats: {
    from: string;
    to: string;
    totalTrips: number;
    totalPassengers: number;
    avgOccupancy: number;
  }[];
  recentReservations: {
    id: number;
    bookingRef: string | null;
    fullName: string;
    seats: number;
    from: string;
    to: string;
    departure: Date;
    createdAt: Date;
  }[];
};

function OccupancyBar({ pct }: { pct: number }) {
  const color =
    pct >= 80 ? 'bg-green-500' : pct >= 40 ? 'bg-yellow-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500 w-8 text-right">{pct}%</span>
    </div>
  );
}

export default function StatsTab({ stats }: { stats: Stats }) {
  const { language, t } = useTranslation();
  const { thisMonth, upcomingTrips, routeStats, recentReservations } = stats;

  const locale = language === 'sr' ? 'sr-Latn' : 'en';
  const fmt = (date: Date) =>
    DateTime.fromJSDate(new Date(date))
      .setZone('Europe/Belgrade')
      .setLocale(locale)
      .toFormat('d. LLL, HH:mm');

  const summaryCards = [
    { label: t('stats.cardTrips'),        value: thisMonth.trips,           icon: Bus,        color: 'text-blue-600',   bg: 'bg-blue-50' },
    { label: t('stats.cardReservations'), value: thisMonth.reservations,    icon: TicketCheck, color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: t('stats.cardSeatsSold'),    value: thisMonth.seatsSold,       icon: Users,      color: 'text-emerald-600',bg: 'bg-emerald-50' },
    { label: t('stats.cardOccupancy'),    value: `${thisMonth.occupancy}%`, icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {summaryCards.map((c) => (
          <div key={c.label} className="rounded-xl border bg-white p-4 flex items-start gap-3">
            <div className={`rounded-lg p-2 shrink-0 ${c.bg}`}>
              <c.icon className={`h-5 w-5 ${c.color}`} />
            </div>
            <div>
              <div className="text-2xl font-bold leading-tight">{c.value}</div>
              <div className="text-xs text-gray-500 mt-0.5 leading-snug">{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Upcoming trips */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t('stats.upcomingTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {upcomingTrips.length === 0 ? (
              <p className="text-sm text-gray-400 px-6 pb-4">{t('stats.upcomingEmpty')}</p>
            ) : (
              <div className="divide-y">
                {upcomingTrips.map((trip) => {
                  const pct = trip.seatsTotal > 0
                    ? Math.round((trip.seatsSold / trip.seatsTotal) * 100)
                    : 0;
                  return (
                    <div key={trip.id} className="px-6 py-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium flex items-center gap-1.5">
                          {trip.from}
                          <ArrowRight className="h-3 w-3 text-gray-400" />
                          {trip.to}
                        </span>
                        <span className="text-xs text-gray-500">{fmt(trip.departure)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <OccupancyBar pct={pct} />
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {trip.seatsSold}/{trip.seatsTotal}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Route performance */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t('stats.routesTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {routeStats.length === 0 ? (
              <p className="text-sm text-gray-400 px-6 pb-4">{t('stats.routesEmpty')}</p>
            ) : (
              <div className="divide-y">
                {routeStats.map((r) => (
                  <div key={`${r.from}-${r.to}`} className="px-6 py-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium flex items-center gap-1.5">
                        {r.from}
                        <ArrowRight className="h-3 w-3 text-gray-400" />
                        {r.to}
                      </span>
                      <span className="text-xs text-gray-500">
                        {t('stats.routeTrips', { count: r.totalTrips })}
                        {' · '}
                        {t('stats.routePassengers', { count: r.totalPassengers })}
                      </span>
                    </div>
                    <OccupancyBar pct={r.avgOccupancy} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent reservations */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('stats.recentTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recentReservations.length === 0 ? (
            <p className="text-sm text-gray-400 px-6 pb-4">{t('stats.recentEmpty')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-xs text-gray-500">
                    <th className="text-left px-6 py-2 font-medium">{t('stats.colPassenger')}</th>
                    <th className="text-left px-4 py-2 font-medium">{t('stats.colLine')}</th>
                    <th className="text-left px-4 py-2 font-medium">{t('stats.colDeparture')}</th>
                    <th className="text-left px-4 py-2 font-medium">{t('stats.colSeats')}</th>
                    <th className="text-left px-4 py-2 font-medium">{t('stats.colBookedAt')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {recentReservations.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-6 py-2.5">
                        <div className="font-medium">{r.fullName}</div>
                        {r.bookingRef && (
                          <div className="text-xs text-gray-400">{r.bookingRef}</div>
                        )}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <span className="flex items-center gap-1">
                          {r.from}
                          <ArrowRight className="h-3 w-3 text-gray-400" />
                          {r.to}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">
                        {fmt(r.departure)}
                      </td>
                      <td className="px-4 py-2.5">{r.seats}</td>
                      <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap text-xs">
                        {fmt(r.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
