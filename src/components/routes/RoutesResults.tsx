'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Users, Calendar } from 'lucide-react';
import { DateTime } from 'luxon';
import ReservationModal from './ReservationModal';

interface Trip {
  id: number;
  departure: string;
  arrival: string;
  seatsTotal: number;
  availableSeats: number;
  availableSeatNumbers: number[];
  takenSeats: number[];
  company: {
    id: number;
    name: string;
    email: string;
  };
  route: {
    from: { name: string };
    to: { name: string };
  };
}

interface RoutesResultsProps {
  fromId: string;
  toId: string;
  date: string;
  time?: string;
}

export default function RoutesResults({
  fromId,
  toId,
  date,
  time,
}: RoutesResultsProps) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cities, setCities] = useState<{ id: number; name: string }[]>([]);
  const [reservationModalOpen, setReservationModalOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch cities and trips in parallel
        const [citiesResponse, tripsResponse] = await Promise.all([
          fetch('/api/cities'),
          fetch(
            `/api/trips?${new URLSearchParams({
              fromId,
              toId,
              date,
              ...(time && { time }),
            })}`
          ),
        ]);

        if (!citiesResponse.ok || !tripsResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        const [citiesData, tripsData] = await Promise.all([
          citiesResponse.json(),
          tripsResponse.json(),
        ]);

        setCities(citiesData);
        setTrips(tripsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [fromId, toId, date, time]);

  const formatTime = (dateString: string) => {
    return DateTime.fromISO(dateString).toFormat('HH:mm');
  };

  const formatDate = (dateString: string) => {
    return DateTime.fromISO(dateString)
      .setLocale('sr-Latn')
      .toFormat('d. LLL yyyy');
  };

  const getCityName = (cityId: number) => {
    const city = cities.find((c) => c.id === cityId);
    return city ? city.name : `Grad ${cityId}`;
  };

  const getFromCityName = () => getCityName(parseInt(fromId));
  const getToCityName = () => getCityName(parseInt(toId));

  const formatDuration = (departure: string, arrival: string) => {
    const dep = DateTime.fromISO(departure);
    const arr = DateTime.fromISO(arrival);
    const duration = arr.diff(dep, 'minutes').minutes;

    const hours = Math.floor(duration / 60);
    const minutes = Math.floor(duration % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const handleBookTrip = (trip: Trip) => {
    setSelectedTrip(trip);
    setReservationModalOpen(true);
  };

  const handleCloseModal = () => {
    setReservationModalOpen(false);
    setSelectedTrip(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Učitavanje...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-lg mb-4">Greška: {error}</div>
        <Button onClick={() => window.location.reload()}>Pokušaj ponovo</Button>
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">Kriterijumi pretrage</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2 text-gray-500" />
              <span>
                {getFromCityName()} → {getToCityName()}
              </span>
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-gray-500" />
              <span>{formatDate(date)}</span>
            </div>
            {time && (
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-gray-500" />
                <span>{time} (i kasnije)</span>
              </div>
            )}
          </div>
          {time && (
            <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
              ℹ️ Prikazani su samo polasci nakon odabranog vremena ({time})
            </div>
          )}
        </div>

        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-4">
            {time
              ? `Nema dostupnih polazaka nakon ${time} za odabrane kriterijume.`
              : 'Nema dostupnih polazaka za odabrane kriterijume.'}
          </div>
          <div className="space-y-2">
            <Button onClick={() => (window.location.href = '/')}>
              Vrati se na početnu
            </Button>
            {time && (
              <div className="text-sm text-gray-600">
                Pokušajte sa ranijim vremenom ili drugim datumom
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold mb-4">Kriterijumi pretrage</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-2 text-gray-500" />
            <span>
              {getFromCityName()} → {getToCityName()}
            </span>
          </div>
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-gray-500" />
            <span>{formatDate(date)}</span>
          </div>
          {time && (
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2 text-gray-500" />
              <span>{time} (i kasnije)</span>
            </div>
          )}
        </div>
        {time && (
          <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
            ℹ️ Prikazani su samo polasci nakon odabranog vremena ({time})
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          Dostupni polasci ({trips.length})
        </h2>

        {trips.map((trip) => (
          <Card key={trip.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{trip.company.name}</CardTitle>
                  <div className="flex items-center text-sm text-gray-600 mt-1">
                    <MapPin className="h-4 w-4 mr-1" />
                    {trip.route.from.name} → {trip.route.to.name}
                  </div>
                </div>
                <Badge
                  variant={trip.availableSeats > 0 ? 'default' : 'destructive'}
                  className="ml-2"
                >
                  {trip.availableSeats > 0
                    ? `${trip.availableSeats} slobodno`
                    : 'Popunjeno'}
                </Badge>
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-gray-500" />
                  <div>
                    <div className="font-medium">Polazak</div>
                    <div className="text-sm text-gray-600">
                      {formatTime(trip.departure)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-gray-500" />
                  <div>
                    <div className="font-medium">Dolazak</div>
                    <div className="text-sm text-gray-600">
                      {formatTime(trip.arrival)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2 text-gray-500" />
                  <div>
                    <div className="font-medium">Trajanje</div>
                    <div className="text-sm text-gray-600">
                      {formatDuration(trip.departure, trip.arrival)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Ukupno sedišta: {trip.seatsTotal} | Slobodno:{' '}
                  {trip.availableSeats} | Zauzeto: {trip.takenSeats.length}
                </div>

                <Button
                  onClick={() => handleBookTrip(trip)}
                  disabled={trip.availableSeats === 0}
                  className="ml-4"
                >
                  {trip.availableSeats > 0 ? 'Rezerviši' : 'Nema mesta'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Reservation Modal */}
      <ReservationModal
        isOpen={reservationModalOpen}
        onClose={handleCloseModal}
        trip={selectedTrip}
        fromId={fromId}
        toId={toId}
        date={date}
      />
    </div>
  );
}
