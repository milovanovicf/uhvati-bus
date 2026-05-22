'use client';

import { handleReservationDelete } from '@/app/actions';
import { Button } from '../ui/button';
import { CardHeader, CardTitle, CardContent } from '../ui/card';
import React, { useTransition } from 'react';
import { useRouter } from 'next/navigation';
const { DateTime } = require('luxon');
import { Trash2 } from 'lucide-react';
import { TripReservation, TripWithDetails } from './CompanyClient';

type ReservationsTabProps = {
  trips: TripWithDetails[];
  isPending: boolean;
};

export default function ReservationsTab({
  trips,
  isPending,
}: ReservationsTabProps) {
  const [deletePending, startDeleteTransition] = useTransition();

  const router = useRouter();

  async function handleDeleteReservation(id: number) {
    const isConfirmed = confirm(
      'Da li ste sigurni da želite da obrišete ovu rezervaciju?',
    );

    if (!isConfirmed) {
      return;
    }

    const successfullyDeleted = await handleReservationDelete(id);

    if (successfullyDeleted.success) {
      router.refresh();
    } else {
      alert(`Greška: ${successfullyDeleted.error}`);
    }
  }

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">Učitavanje rezervacija...</span>
      </div>
    );
  }

  return (
    <>
      <CardHeader>
        <CardTitle className="text-xl">Rezervacije</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="text-left">
                <th className="p-2">Ruta</th>
                <th className="p-2">Polazak</th>
                <th className="p-2">Dolazak</th>
                <th className="p-2">Rezervacija / Sedišta</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {trips.map((trip) => {
                const departure = DateTime.fromJSDate(trip.departure);
                const arival = DateTime.fromJSDate(trip.arrival);

                const formattedDeparture = departure
                  .setLocale('sr-Latn')
                  .toFormat('d. LLL yyyy');
                const formattedArrival = arival
                  .setLocale('sr-Latn')
                  .toFormat('d. LLL yyyy');
                return (
                  <React.Fragment key={trip.id}>
                    <tr className="border-t bg-blue-400 p-3 text-white font-semibold">
                      <td className="p-2">
                        {trip.route
                          ? `${trip.route.from.name} → ${trip.route.to.name}`
                          : `Route ${trip.routeId}`}
                      </td>
                      <td className="p-2">{formattedDeparture}</td>
                      <td className="p-2">{formattedArrival}</td>
                      <td className="p-2">
                        {trip.reservations.length} rezervacija
                      </td>
                      <td className="p-2"></td>
                    </tr>

                    {trip.reservations.map((r: TripReservation, i: number) => {
                      return (
                        <tr key={r.id} className="border-t">
                          <td className="p-2 pl-6" colSpan={3}>
                            <span className="font-bold">{i + 1}.</span>{' '}
                            {r.fullName} - {r.email}
                          </td>
                          <td className="p-2">
                            {Array.isArray(r.seats)
                              ? (r.seats as number[]).join(', ')
                              : ''}
                          </td>
                          <td className="p-2">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteReservation(r.id)}
                              disabled={deletePending}
                            >
                              {deletePending ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}

                    {trip.reservations.length === 0 && (
                      <tr className="border-t">
                        <td className="p-2 pl-6 text-gray-500" colSpan={5}>
                          Nema rezervacija
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </>
  );
}
