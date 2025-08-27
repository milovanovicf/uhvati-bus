import { Edit, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CardHeader, CardTitle, CardContent } from '../ui/card';
import { Trip } from '@/generated/prisma';
const { DateTime } = require('luxon');

type TripWithRoute = {
  id: number;
  seatsTotal: number;
  departure: string;
  arrival: string;
  route: {
    from: { name: string };
    to: { name: string };
  };
};

type TripsTabProps = {
  trips: TripWithRoute[];
  loading: boolean;
  error: string | null;
  refreshTrips: () => Promise<void>; // optional for actions like delete
};

export default function TripsTab({
  trips,
  loading,
  error,
  refreshTrips,
}: TripsTabProps) {
  async function handleDeleteTrip(id: number) {
    if (!confirm('Da li ste sigurni da želite obrisati ovu vožnju?')) return;
    try {
      const res = await fetch('/api/trip', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Failed to delete trip');
      await refreshTrips(); // call parent function
    } catch (err: any) {
      alert(err.message || 'Error'); // or pass an error callback if you want to update parent state
    }
  }

  async function handleEditTrip(id: number) {}

  return (
    <>
      <CardHeader>
        <CardTitle className="text-xl">Rute</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p>Ucitavanje...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <div className="overflow-x-auto">
            {Object.entries(
              trips.reduce((acc, trip) => {
                const routeKey = `${trip.route.from.name} → ${trip.route.to.name}`;
                if (!acc[routeKey]) acc[routeKey] = [];
                acc[routeKey].push(trip);
                return acc;
              }, {} as Record<string, typeof trips>)
            ).map(([route, tripsForRoute]) => (
              <div key={route} className="mb-4">
                <h2 className="font-bold mb-2 bg-blue-400 p-3 text-white">
                  {route}
                </h2>
                <table className="w-full table-auto">
                  <thead className="text-left">
                    <tr>
                      <th className="p-2">Polazak</th>
                      <th className="p-2">Dolazak</th>
                      <th className="p-2">Broj sedista</th>
                      <th className="p-2">Kontrole</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tripsForRoute.map((t) => (
                      <tr key={t.id} className="border-t">
                        <td className="p-2">
                          {DateTime.fromISO(t.departure).toFormat(
                            'yyyy-LL-dd HH:mm'
                          )}
                        </td>
                        <td className="p-2">
                          {DateTime.fromISO(t.arrival).toFormat(
                            'yyyy-LL-dd HH:mm'
                          )}
                        </td>
                        <td className="p-2">{t.seatsTotal}</td>
                        <td className="p-2 flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditTrip(t.id)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteTrip(t.id)}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </>
  );
}
