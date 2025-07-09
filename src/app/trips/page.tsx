import React from 'react';

type City = {
  name: string;
};

type Trip = {
  id: number;
  departure: string;
  arrival: string;
  seatsTotal: number;
  company: { name: string };
  route: {
    from: City;
    to: City;
  };
};

const TripsPage = async () => {
  const res = await fetch('http://localhost:3000/api/trips', {
    cache: 'no-store', // disables caching to get fresh data
  });

  const trips: Trip[] = await res.json();

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-6">Available Trips</h1>
      {trips.length === 0 ? (
        <p>No trips available.</p>
      ) : (
        trips.map((trip) => (
          <div
            key={trip.id}
            className="border rounded p-4 shadow-sm mb-4 bg-white"
          >
            <p>
              <strong>{trip.route.from.name}</strong> →{' '}
              <strong>{trip.route.to.name}</strong>
            </p>
            <p>Company: {trip.company.name}</p>
            <p>
              Departure: {new Date(trip.departure).toLocaleString()}
              <br />
              Arrival: {new Date(trip.arrival).toLocaleString()}
            </p>
            <p>Total Seats: {trip.seatsTotal}</p>
          </div>
        ))
      )}
    </main>
  );
};

export default TripsPage;
