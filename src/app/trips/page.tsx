import React from 'react';
import Header from '@/components/homepage/header';
import Footer from '@/components/homepage/footer';
import { prisma } from '@/app/utils/db';

const TripsPage = async () => {
  const trips = await prisma.trip.findMany({
    include: {
      company: { select: { name: true } },
      route: {
        include: { from: true, to: true },
      },
    },
    orderBy: { departure: 'asc' },
  });

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Svi polasci</h1>
          {trips.length === 0 ? (
            <p className="text-gray-600">Nema dostupnih polazaka.</p>
          ) : (
            trips.map((trip) => (
              <div
                key={trip.id}
                className="border rounded-lg p-6 shadow-sm mb-4 bg-white hover:shadow-md transition-shadow"
              >
                <p className="text-lg">
                  <strong className="text-xl">{trip.route.from.name}</strong>
                  <span className="mx-3 text-gray-400">→</span>
                  <strong className="text-xl">{trip.route.to.name}</strong>
                </p>
                <p className="text-gray-600 mt-2">Prevoznik: {trip.company.name}</p>
                <p className="text-gray-600">
                  Polazak: {new Date(trip.departure).toLocaleString('sr-RS')}
                </p>
                <p className="text-gray-600">
                  Dolazak: {new Date(trip.arrival).toLocaleString('sr-RS')}
                </p>
                <p className="text-gray-600">Ukupno sedišta: {trip.seatsTotal}</p>
              </div>
            ))
          )}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default TripsPage;
