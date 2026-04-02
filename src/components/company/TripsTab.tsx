// components/dashboard/TripsTab.tsx
'use client';

import React, { useTransition, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trip } from '@/generated/prisma';
import { format } from 'date-fns';
import { srLatn } from 'date-fns/locale';
import { Trash2, Edit, Clock, Users, MapPin } from 'lucide-react';
import { deleteTrip } from '@/app/actions';
import EditRouteModal from './EditRouteModal';

interface TripsTabProps {
  trips: Trip[];
  isPending: boolean;
}

interface RouteGroup {
  routeId: number;
  fromCity: string;
  toCity: string;
  trips: Trip[];
  totalSeats: number;
  availableSeats: number;
  totalReservations: number;
}

export default function TripsTab({ trips, isPending }: TripsTabProps) {
  const [deletePending, startDeleteTransition] = useTransition();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<RouteGroup | null>(null);

  // Group trips by route
  const groupedRoutes: RouteGroup[] = trips.reduce(
    (groups: RouteGroup[], trip) => {
      const routeId = trip.routeId;
      const existingGroup = groups.find((g) => g.routeId === routeId);

      if (existingGroup) {
        existingGroup.trips.push(trip);
        existingGroup.totalSeats += trip.seatsTotal;
        existingGroup.availableSeats += trip.seatsAvailable || 0;
        existingGroup.totalReservations += trip.reservations?.length || 0;
      } else {
        groups.push({
          routeId,
          fromCity: trip.route?.from?.name || 'Unknown',
          toCity: trip.route?.to?.name || 'Unknown',
          trips: [trip],
          totalSeats: trip.seatsTotal,
          availableSeats: trip.seatsAvailable || 0,
          totalReservations: trip.reservations?.length || 0,
        });
      }

      return groups;
    },
    []
  );

  // Sort trips within each group by departure time
  groupedRoutes.forEach((group) => {
    group.trips.sort(
      (a, b) =>
        new Date(a.departure).getTime() - new Date(b.departure).getTime()
    );
  });

  const handleDeleteTrip = (tripId: number) => {
    if (!confirm('Da li ste sigurni da želite da obrišete ovo putovanje?')) {
      return;
    }

    startDeleteTransition(async () => {
      try {
        await deleteTrip(tripId);
      } catch (error) {
        alert(
          'Greška pri brisanju putovanja: ' +
            (error instanceof Error ? error.message : 'Unknown error')
        );
      }
    });
  };

  const handleEditRoute = (route: RouteGroup) => {
    setSelectedRoute(route);
    setEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditModalOpen(false);
    setSelectedRoute(null);
  };

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">Učitavanje putovanja...</span>
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">Nemate kreirana putovanja</p>
        <p className="text-sm text-gray-400">
          Kliknite na "Novo Putovanje" da kreirate prvo putovanje
        </p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">
        Rute ({groupedRoutes.length}) - Ukupno putovanja ({trips.length})
      </h3>

      <div className="space-y-6">
        {groupedRoutes.map((route) => (
          <Card
            key={route.routeId}
            className="hover:shadow-md transition-shadow"
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-gray-500" />
                    {route.fromCity} → {route.toCity}
                  </CardTitle>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {route.trips.length} polazaka
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {route.availableSeats} / {route.totalSeats} slobodno
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">
                        {route.totalReservations}
                      </span>{' '}
                      rezervacija
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditRoute(route)}
                  disabled={deletePending}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Uredi rutu
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-gray-700 mb-2">
                  Polasci ({route.trips.length}):
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {route.trips.map((trip) => (
                    <div
                      key={trip.id}
                      className="border rounded-lg p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-sm font-medium">
                          {format(new Date(trip.departure), 'HH:mm')} -{' '}
                          {format(new Date(trip.arrival), 'HH:mm')}
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            new Date(trip.departure) > new Date()
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {new Date(trip.departure) > new Date()
                            ? 'Predstoji'
                            : 'Završeno'}
                        </span>
                      </div>

                      <div className="text-xs text-gray-600 space-y-1">
                        <div>
                          Sedišta: {trip.seatsAvailable || 0} /{' '}
                          {trip.seatsTotal}
                        </div>
                        <div>Rezervacije: {trip.reservations?.length || 0}</div>
                        <div>
                          Datum:{' '}
                          {format(new Date(trip.departure), 'd. MMM', {
                            locale: srLatn,
                          })}
                        </div>
                      </div>

                      <div className="flex justify-end mt-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteTrip(trip.id)}
                          disabled={deletePending}
                          className="h-6 px-2"
                        >
                          {deletePending ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Route Modal */}
      {selectedRoute && (
        <EditRouteModal
          isOpen={editModalOpen}
          onClose={handleCloseModal}
          route={selectedRoute}
        />
      )}
    </div>
  );
}
