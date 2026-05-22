'use client';

import { CardContent, CardHeader, CardTitle } from '../ui/card';
import { Edit, Trash } from 'lucide-react';
import { Button } from '../ui/button';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteRoute } from '@/app/actions';
import EditRouteModal from './EditRouteModal';
import { TripWithDetails, RouteWithCities } from './CompanyClient';
import { RouteGroup } from './EditRouteModal';

type RoutesTabProps = {
  routes: RouteWithCities[];
  trips: TripWithDetails[];
  isPending: boolean;
  error?: string | null;
  refreshRoutes?: () => Promise<void>;
};

export default function RoutesTab({
  routes,
  trips,
  isPending,
}: RoutesTabProps) {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<RouteGroup | null>(null);
  const [deletePending, startDeleteTransition] = useTransition();
  const router = useRouter();

  function buildRouteGroup(route: RouteWithCities): RouteGroup {
    const routeTrips = trips.filter((t) => t.routeId === route.id);
    return {
      routeId: route.id,
      fromCity: route.from.name,
      toCity: route.to.name,
      trips: routeTrips,
      totalSeats: routeTrips.reduce((sum, t) => sum + t.seatsTotal, 0),
      availableSeats: routeTrips.reduce(
        (sum, t) => sum + (t.seatsAvailable ?? 0),
        0,
      ),
      totalReservations: routeTrips.reduce(
        (sum, t) => sum + (t.reservations?.length ?? 0),
        0,
      ),
    };
  }

  function handleEditRoute(route: RouteWithCities) {
    setSelectedRoute(buildRouteGroup(route));
    setEditModalOpen(true);
  }

  function handleDeleteRoute(id: number) {
    const confirmed = confirm(
      'Da li ste sigurni da želite da obrišete ovu rutu? Sva putovanja i rezervacije će biti trajno obrisane.',
    );
    if (!confirmed) return;

    startDeleteTransition(async () => {
      try {
        await deleteRoute(id);
        router.refresh();
      } catch (error) {
        alert(
          'Greška pri brisanju rute: ' +
            (error instanceof Error ? error.message : 'Nepoznata greška'),
        );
      }
    });
  }

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">Učitavanje ruta...</span>
      </div>
    );
  }

  return (
    <>
      <CardHeader>
        <CardTitle className="text-xl">Putanje</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="text-left">
                <th className="p-2">ID</th>
                <th className="p-2">Ruta</th>
                <th className="p-2">Distance (km)</th>
                <th className="p-2">Duration (min)</th>
                <th className="p-2">Kontrole</th>
              </tr>
            </thead>
            <tbody>
              {routes.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-2">{r.id}</td>
                  <td className="p-2">
                    {r.from.name} → {r.to.name}
                  </td>
                  <td className="p-2">{r.distance ?? '-'}</td>
                  <td className="p-2">{r.duration ?? '-'}</td>
                  <td className="p-2 flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditRoute(r)}
                      disabled={deletePending}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteRoute(r.id)}
                      disabled={deletePending}
                    >
                      {deletePending ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Trash className="h-4 w-4" />
                      )}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>

      {selectedRoute && (
        <EditRouteModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedRoute(null);
          }}
          route={selectedRoute}
        />
      )}
    </>
  );
}
