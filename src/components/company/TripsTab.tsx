'use client';

import React, { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  ChevronRight,
  Trash2,
  MapPin,
  Pencil,
} from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay, isToday } from 'date-fns';
import { srLatn, enUS } from 'date-fns/locale';
import { deleteRoute } from '@/app/actions';
import { useRouter } from 'next/navigation';
import { TripWithDetails } from './CompanyClient';
import EditRouteModal, { RouteGroup } from './EditRouteModal';
import TripReservationsModal from './TripReservationsModal';
import { useTranslation } from '@/lib/i18n/LanguageContext';

const PX_PER_HOUR = 64;

const PALETTE = [
  { bar: '#3b82f6', bg: '#eff6ff', text: '#1e40af', border: '#bfdbfe' },
  { bar: '#10b981', bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0' },
  { bar: '#8b5cf6', bg: '#f5f3ff', text: '#5b21b6', border: '#ddd6fe' },
  { bar: '#f97316', bg: '#fff7ed', text: '#9a3412', border: '#fed7aa' },
  { bar: '#ec4899', bg: '#fdf2f8', text: '#9d174d', border: '#fbcfe8' },
  { bar: '#14b8a6', bg: '#f0fdfa', text: '#134e4a', border: '#99f6e4' },
];

interface RouteInfo {
  routeId: number;
  fromCity: string;
  toCity: string;
  trips: TripWithDetails[];
  colorIdx: number;
}

interface TripsTabProps {
  trips: TripWithDetails[];
  isPending: boolean;
}

export default function TripsTab({ trips, isPending }: TripsTabProps) {
  const router = useRouter();
  const { language, t } = useTranslation();
  const dateFnsLocale = language === 'sr' ? srLatn : enUS;
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  const [editingRoute, setEditingRoute] = useState<RouteGroup | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<TripWithDetails | null>(
    null,
  );
  const [deletePending, startDeleteTransition] = useTransition();

  // Sync selectedTrip with latest data after router.refresh()
  React.useEffect(() => {
    if (!selectedTrip) return;
    const updated = trips.find((t) => t.id === selectedTrip.id);
    setSelectedTrip(updated ?? null);
  }, [trips]);

  // Build route map once per render
  const routeMap = new Map<number, RouteInfo>();
  for (const trip of trips) {
    if (!routeMap.has(trip.routeId)) {
      routeMap.set(trip.routeId, {
        routeId: trip.routeId,
        fromCity: trip.route?.from?.name ?? '?',
        toCity: trip.route?.to?.name ?? '?',
        trips: [],
        colorIdx: routeMap.size % PALETTE.length,
      });
    }
    routeMap.get(trip.routeId)!.trips.push(trip);
  }
  const routes = Array.from(routeMap.values());

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Dynamic hour range based on trips visible this week
  const weekTrips = trips.filter((t) => {
    const d = new Date(t.departure);
    return d >= weekStart && d < addDays(weekStart, 7);
  });
  const hourStart = weekTrips.length
    ? Math.max(
        0,
        Math.min(...weekTrips.map((t) => new Date(t.departure).getHours())) - 1,
      )
    : 6;
  const hourEnd = weekTrips.length
    ? Math.min(
        25,
        Math.max(...weekTrips.map((t) => new Date(t.arrival).getHours())) + 1,
      )
    : 22;
  const hours = Array.from(
    { length: hourEnd - hourStart },
    (_, i) => hourStart + i,
  );
  const totalHeight = hours.length * PX_PER_HOUR;

  function getTop(trip: TripWithDetails) {
    const d = new Date(trip.departure);
    return (d.getHours() + d.getMinutes() / 60 - hourStart) * PX_PER_HOUR;
  }

  function getHeight(trip: TripWithDetails) {
    const dep = new Date(trip.departure);
    const arr = new Date(trip.arrival);
    let depH = dep.getHours() + dep.getMinutes() / 60;
    let arrH = arr.getHours() + arr.getMinutes() / 60;
    if (arrH <= depH) arrH += 24;
    return Math.max((arrH - depH) * PX_PER_HOUR, 28);
  }

  function tripsForDay(day: Date) {
    return routes.flatMap((r) =>
      r.trips
        .filter((t) => isSameDay(new Date(t.departure), day))
        .map((t) => ({ trip: t, color: PALETTE[r.colorIdx], route: r })),
    );
  }

  type DayItem = ReturnType<typeof tripsForDay>[number];

  function layoutDayTrips(items: DayItem[]) {
    if (items.length === 0) return [];
    const sorted = [...items].sort(
      (a, b) =>
        new Date(a.trip.departure).getTime() -
        new Date(b.trip.departure).getTime(),
    );

    // Group into clusters of overlapping trips
    const clusters: DayItem[][] = [];
    let clusterEnd = 0;
    let current: DayItem[] = [];
    for (const item of sorted) {
      const dep = new Date(item.trip.departure).getTime();
      const arr = new Date(item.trip.arrival).getTime();
      if (dep >= clusterEnd && current.length > 0) {
        clusters.push(current);
        current = [];
        clusterEnd = 0;
      }
      current.push(item);
      clusterEnd = Math.max(clusterEnd, arr);
    }
    if (current.length > 0) clusters.push(current);

    // Within each cluster assign sub-columns greedily
    const result: Array<DayItem & { col: number; numCols: number }> = [];
    for (const cluster of clusters) {
      const colEnd: number[] = [];
      const cols: number[] = [];
      for (const item of cluster) {
        const dep = new Date(item.trip.departure).getTime();
        const arr = new Date(item.trip.arrival).getTime();
        let col = colEnd.findIndex((e) => e <= dep);
        if (col === -1) col = colEnd.length;
        colEnd[col] = arr;
        cols.push(col);
      }
      const numCols = colEnd.length;
      cluster.forEach((item, i) =>
        result.push({ ...item, col: cols[i], numCols }),
      );
    }
    return result;
  }

  function handleDeleteRoute(route: RouteInfo) {
    if (
      !confirm(
        t('dashboard.deleteRouteConfirm', {
          from: route.fromCity,
          to: route.toCity,
        }),
      )
    )
      return;
    startDeleteTransition(async () => {
      try {
        await deleteRoute(route.routeId);
        router.refresh();
      } catch (err) {
        alert(
          t('dashboard.deleteError', {
            message:
              err instanceof Error ? err.message : t('dashboard.unknownError'),
          }),
        );
      }
    });
  }

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        <span className="ml-2">{t('dashboard.loadingTrips')}</span>
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-2">{t('dashboard.noTrips')}</p>
        <p className="text-sm text-gray-400">{t('dashboard.noTripsHint')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Route legend */}
      <div className="space-y-1.5">
        {routes.map((route) => {
          const c = PALETTE[route.colorIdx];
          const allPast = route.trips.every(
            (t) => new Date(t.departure) < new Date(),
          );
          return (
            <div
              key={route.routeId}
              className="flex items-center justify-between rounded-lg px-3 py-2 border text-sm"
              style={{ backgroundColor: c.bg, borderColor: c.border }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full flex-none"
                  style={{ backgroundColor: c.bar }}
                />
                <MapPin
                  className="h-3.5 w-3.5 flex-none"
                  style={{ color: c.bar }}
                />
                <span className="font-medium" style={{ color: c.text }}>
                  {route.fromCity} → {route.toCity}
                </span>
                <span className="text-xs opacity-70" style={{ color: c.text }}>
                  {route.trips.length} {t('dashboard.trips')}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0 flex-none"
                  disabled={allPast}
                  onClick={() =>
                    setEditingRoute({
                      routeId: route.routeId,
                      fromCity: route.fromCity,
                      toCity: route.toCity,
                      trips: route.trips,
                      totalSeats: route.trips.reduce(
                        (s, t) => s + t.seatsTotal,
                        0,
                      ),
                      availableSeats: route.trips.reduce(
                        (s, t) => s + (t.seatsAvailable ?? t.seatsTotal),
                        0,
                      ),
                      totalReservations: route.trips.reduce(
                        (s, t) => s + t.reservations.length,
                        0,
                      ),
                    })
                  }
                  title={`Uredi rutu ${route.fromCity} → ${route.toCity}`}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-7 w-7 p-0 flex-none"
                  onClick={() => handleDeleteRoute(route)}
                  disabled={deletePending}
                  title={`Obriši rutu ${route.fromCity} → ${route.toCity}`}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setWeekStart((d) => addDays(d, -7))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[180px] text-center">
            {format(weekStart, 'd. MMM', { locale: dateFnsLocale })} –{' '}
            {format(addDays(weekStart, 6), 'd. MMM yyyy.', {
              locale: dateFnsLocale,
            })}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setWeekStart((d) => addDays(d, 7))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          onClick={() =>
            setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))
          }
        >
          {t('dashboard.today')}
        </Button>
      </div>

      {/* Timetable */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {/* Day header */}
        <div
          className="flex border-b border-gray-200 bg-gray-50"
          style={{ minWidth: 520 }}
        >
          <div className="flex-none w-12 border-r border-gray-200" />
          {weekDays.map((day) => {
            const today = isToday(day);
            const hasTrips = weekTrips.some((t) =>
              isSameDay(new Date(t.departure), day),
            );
            return (
              <div
                key={day.toISOString()}
                className={`flex-1 text-center py-2 border-r border-gray-200 last:border-r-0 ${
                  today ? 'bg-blue-50' : ''
                }`}
              >
                <div
                  className={`text-xs ${today ? 'text-blue-500' : 'text-gray-400'}`}
                >
                  {format(day, 'EEE', { locale: dateFnsLocale })}
                </div>
                <div
                  className={`text-sm font-bold ${
                    today
                      ? 'text-white bg-blue-500 rounded-full w-7 h-7 flex items-center justify-center mx-auto'
                      : hasTrips
                        ? 'text-gray-800'
                        : 'text-gray-400'
                  }`}
                >
                  {format(day, 'd')}
                </div>
              </div>
            );
          })}
        </div>

        {/* Scrollable grid */}
        <div className="overflow-y-auto" style={{ maxHeight: 520 }}>
          <div
            className="flex relative"
            style={{ minWidth: 520, height: totalHeight }}
          >
            {/* Time gutter */}
            <div className="flex-none w-12 border-r border-gray-200 relative bg-white">
              {hours.map((h) => (
                <div
                  key={h}
                  className="absolute w-full"
                  style={{ top: (h - hourStart) * PX_PER_HOUR }}
                >
                  <span className="absolute -top-2.5 right-1.5 text-[10px] text-gray-400 leading-none">
                    {String(h).padStart(2, '0')}:00
                  </span>
                  <div className="w-2 border-t border-gray-200 ml-auto" />
                </div>
              ))}
            </div>

            {/* Day columns */}
            {weekDays.map((day) => {
              const today = isToday(day);
              const dayItems = tripsForDay(day);
              return (
                <div
                  key={day.toISOString()}
                  className={`flex-1 relative border-r border-gray-200 last:border-r-0 ${
                    today ? 'bg-blue-50/20' : 'bg-white'
                  }`}
                >
                  {/* Hour grid lines */}
                  {hours.map((h) => (
                    <div
                      key={h}
                      className="absolute w-full border-t border-gray-100"
                      style={{ top: (h - hourStart) * PX_PER_HOUR }}
                    />
                  ))}

                  {/* Trip blocks */}
                  {layoutDayTrips(dayItems).map(
                    ({ trip, color, route, col, numCols }) => {
                      const top = getTop(trip);
                      const height = getHeight(trip);
                      const dep = format(new Date(trip.departure), 'HH:mm');
                      const arr = format(new Date(trip.arrival), 'HH:mm');
                      const w = 100 / numCols;
                      const l = col * w;
                      const isPast = new Date(trip.departure) < new Date();

                      return (
                        <div
                          key={trip.id}
                          className={`absolute rounded overflow-hidden select-none transition-[filter] ${
                            isPast
                              ? 'opacity-40 cursor-default'
                              : 'cursor-pointer hover:brightness-95'
                          }`}
                          onClick={
                            isPast ? undefined : () => setSelectedTrip(trip)
                          }
                          style={{
                            top: top + 1,
                            height: height - 2,
                            left: `calc(${l}% + 2px)`,
                            width: `calc(${w}% - 4px)`,
                            backgroundColor: color.bg,
                            borderLeft: `3px solid ${color.bar}`,
                            border: `1px solid ${color.border}`,
                            borderLeftWidth: 3,
                            borderLeftColor: color.bar,
                          }}
                          title={t('dashboard.tripTooltip', {
                            from: route.fromCity,
                            to: route.toCity,
                            dep,
                            arr,
                            available: String(
                              trip.seatsAvailable ?? trip.seatsTotal,
                            ),
                            total: String(trip.seatsTotal),
                          })}
                        >
                          <div className="px-1.5 pt-0.5">
                            <div
                              className="text-[11px] font-bold leading-tight truncate"
                              style={{ color: color.text }}
                            >
                              {dep}–{arr}
                            </div>
                            {isPast && (
                              <div
                                className="text-[10px] font-medium leading-tight"
                                style={{ color: color.text }}
                              >
                                {t('dashboard.completed')}
                              </div>
                            )}
                            {!isPast && height >= 46 && (
                              <div
                                className="text-[10px] leading-tight truncate"
                                style={{ color: color.bar }}
                              >
                                {route.fromCity} → {route.toCity}
                              </div>
                            )}
                            {!isPast && height >= 62 && (
                              <div
                                className="text-[10px] leading-tight"
                                style={{ color: color.text, opacity: 0.75 }}
                              >
                                {trip.seatsAvailable ?? trip.seatsTotal}/
                                {trip.seatsTotal} {t('myReservation.seats')}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {editingRoute && (
        <EditRouteModal
          isOpen={!!editingRoute}
          onClose={(saved) => {
            setEditingRoute(null);
            if (saved) router.refresh();
          }}
          route={editingRoute}
        />
      )}
      <TripReservationsModal
        trip={selectedTrip}
        onClose={() => setSelectedTrip(null)}
      />
    </div>
  );
}
