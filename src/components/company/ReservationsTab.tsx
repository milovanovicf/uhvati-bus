import { CardHeader, CardTitle, CardContent } from '../ui/card';
import React from 'react';
const { DateTime } = require('luxon');

type Reservation = {
  id: number;
  fullName: string;
  email: string;
  seats: number[];
};

type TripWithRouteAndReservations = {
  id: number;
  departure: string;
  arrival: string;
  seatsTotal: number;
  routeId: number;
  route: {
    from: { name: string };
    to: { name: string };
  };
  reservations: Reservation[];
};

type ReservationsTabProps = {
  trips: TripWithRouteAndReservations[];
  loading: boolean;
  error: string | null;
  refreshReservations: () => Promise<void>; // optional for actions like delete
};
export default function ReservationsTab({
  trips,
  loading,
  error,
  refreshReservations,
}: ReservationsTabProps) {
  function handleDeleteReservation(id: number): void {
    throw new Error('Function not implemented.');
  }
  return (
    <>
      <CardHeader>
        <CardTitle className="text-xl">Rezervacije</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p>Učitavanje...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr className="text-left">
                  <th className="p-2">Ruta</th>
                  <th className="p-2">Polazak</th>
                  <th className="p-2">Dolazak</th>
                  <th className="p-2">Rezervacija / Sedišta</th>
                </tr>
              </thead>
              <tbody>
                {trips.map((trip) => {
                  const depLocal = DateTime.fromISO(trip.departure)
                    .setZone('Europe/Belgrade')
                    .toFormat('yyyy-LL-dd HH:mm');
                  const arrLocal = DateTime.fromISO(trip.arrival)
                    .setZone('Europe/Belgrade')
                    .toFormat('yyyy-LL-dd HH:mm');

                  return (
                    <React.Fragment key={trip.id}>
                      <tr className="border-t bg-blue-400 p-3 text-white font-semibold">
                        <td className="p-2">
                          {trip.route
                            ? `${trip.route.from.name} → ${trip.route.to.name}`
                            : `Route ${trip.routeId}`}
                        </td>
                        <td className="p-2">{depLocal}</td>
                        <td className="p-2">{arrLocal}</td>
                        <td className="p-2">
                          {trip.reservations.length} rezervacija
                        </td>
                      </tr>

                      {trip.reservations.map((r: Reservation, i: number) => (
                        <tr key={r.id} className="border-t">
                          <td className="p-2 pl-6" colSpan={3}>
                            <span className="font-bold">{i + 1}.</span>{' '}
                            {r.fullName} - {r.email}
                          </td>
                          <td className="p-2">
                            {Array.isArray(r.seats) ? r.seats.join(', ') : ''}
                          </td>
                        </tr>
                      ))}

                      {trip.reservations.length === 0 && (
                        <tr className="border-t">
                          <td className="p-2 pl-6 text-gray-500" colSpan={4}>
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
        )}
      </CardContent>
    </>
  );
}
