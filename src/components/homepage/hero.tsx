'use client';

import { Route } from '@/generated/prisma';
import BookingForm from './booking-form';

type HeroProps = {
  routes: Route[];
};

export default function Hero({ routes }: HeroProps) {
  return (
    <div
      className="relative flex items-center justify-end min-h-screen bg-cover bg-center px-5 py-15 sm:px-15 md:px-25 md:py-10 lg:px-40 lg:mb-20"
      style={{ backgroundImage: "url('/hero-background.jpeg')" }}
    >
      <div className="absolute inset-0 bg-black/60 md:hidden"></div>

      <div className="relative z-10 flex gap-4 flex-col">
        <h1 className="text-4xl xl:text-6xl 2xl:text-8xl text-white">
          Rezerviši svoje <br />
          mesto
        </h1>
        <h3 className="text-xl text-gray-400">
          Brzo i jednostavno putuj između gradova
        </h3>
        <BookingForm routes={routes} />
      </div>
    </div>
  );
}
