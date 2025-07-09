// src/app/trips/[id]/page.tsx

import { notFound } from 'next/navigation';

type Trip = {
  id: number;
  departure: string;
  arrival: string;
  seatsTotal: number;
  company: { name: string };
  route: {
    from: { name: string };
    to: { name: string };
  };
};

export default async function TripDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const res = await fetch(`http://localhost:3000/api/trips/${params.id}`, {
    cache: 'no-store',
  });

  if (!res.ok) return notFound();

  const trip: Trip = await res.json();

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">
        {trip.route.from.name} → {trip.route.to.name}
      </h1>
      <p>Company: {trip.company.name}</p>
      <p>Departure: {new Date(trip.departure).toLocaleString()}</p>
      <p>Arrival: {new Date(trip.arrival).toLocaleString()}</p>
      <p>Total Seats: {trip.seatsTotal}</p>
    </div>
  );
}
